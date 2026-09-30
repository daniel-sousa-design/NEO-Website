import { useEffect, useId, useRef, useState } from 'react'

// ─── Glass backdrop ───────────────────────────────────────────────────────────
// A web take on Figma's Glass effect, driven by the same parameters as its
// panel. Drop it in as the first child of a positioned element; it fills it.
//
//   frost       → backdrop blur
//   refraction  → how far the backdrop bends near the edges
//   depth       → how wide that bending band is (px from each edge)
//   dispersion  → colour fringing: red and blue bend by different amounts
//   light       → a lit rim; angle (CSS degrees, 90 = from the right) + intensity
//   splay       → how far the light wraps around the rim (100 = all the way)
//
// Refraction + dispersion need an SVG filter as backdrop-filter, which only
// Chromium supports; elsewhere the glass falls back to frost + lit rim.

export type GlassParams = {
  lightAngle: number; lightIntensity: number
  refraction: number; depth: number; dispersion: number; frost: number; splay: number
}

const SVG_BACKDROP = typeof navigator !== 'undefined' && /Chrome\//.test(navigator.userAgent)

/** Displacement map: neutral grey, pushed inward within `band` px of each edge. */
function displacementMap(w: number, h: number, band: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  const img = ctx.createImageData(w, h)
  const pull = (d: number) => d >= band ? 0 : (1 - d / band) ** 2
  for (let y = 0; y < h; y++) {
    const fy = pull(y) - pull(h - 1 - y)             // + near top (sample downward), − near bottom
    for (let x = 0; x < w; x++) {
      const fx = pull(x) - pull(w - 1 - x)
      const i = (y * w + x) * 4
      img.data[i]     = Math.round(128 + 127 * Math.max(-1, Math.min(1, fx)))
      img.data[i + 1] = Math.round(128 + 127 * Math.max(-1, Math.min(1, fy)))
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

export function GlassBackdrop({ params, active = true, tint = 'rgba(0,0,0,.2)' }: {
  params: GlassParams; active?: boolean; tint?: string
}) {
  const { lightAngle, lightIntensity, refraction, depth, dispersion, frost, splay } = params
  const ref = useRef<HTMLDivElement>(null)
  const id = `glass-${useId().replace(/:/g, '')}`
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [map, setMap] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el || !SVG_BACKDROP) return
    const ro = new ResizeObserver(() => setSize({ w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    if (size.w && size.h) setMap(displacementMap(size.w, size.h, Math.max(1, depth)))
  }, [size.w, size.h, depth])

  const blur = frost * .2                    // frost 20 → 4px
  const scale = refraction * .5              // refraction 63 → ~32px at the very edge
  const spread = dispersion / 100 * .3       // dispersion 53 → red ±16% vs blue
  const useSvg = SVG_BACKDROP && !!map

  const light = lightIntensity / 100
  const far = light * (splay / 100) * .5     // how much light reaches the far side of the rim
  const rimGradient = `linear-gradient(${lightAngle}deg, rgba(255,255,255,${far}) 0%, rgba(255,255,255,${light}) 100%)`
  const backdrop = !active ? 'none' : useSvg ? `url(#${id})` : `blur(${blur}px)`

  const channel = (k: number, row: string, name: string) => (
    <>
      <feDisplacementMap in="blur" in2="map" scale={scale * k} xChannelSelector="R" yChannelSelector="G" result={`${name}d`} />
      <feColorMatrix in={`${name}d`} type="matrix" values={`${row} 0 0 0 1 0`} result={name} />
    </>
  )

  return (
    <div ref={ref} aria-hidden style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: active ? tint : 'transparent',
      backdropFilter: backdrop, WebkitBackdropFilter: active ? `blur(${blur}px)` : 'none',
      transition: 'background .35s ease',
    }}>
      {useSvg && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id={id} x="0" y="0" width={size.w} height={size.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feImage href={map} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="map" />
            {channel(1 + spread, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0', 'r')}
            {channel(1,          '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0', 'g')}
            {channel(1 - spread, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0', 'b')}
            <feBlend in="r" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b" mode="screen" />
          </filter>
        </svg>
      )}
      {/* Lit rim: a 1px gradient border, brightest on the side facing the light */}
      <div style={{
        position: 'absolute', inset: 0, padding: 1, background: rimGradient,
        mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        opacity: active ? 1 : 0, transition: 'opacity .35s ease',
      }} />
    </div>
  )
}
