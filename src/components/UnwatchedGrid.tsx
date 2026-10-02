import { useEffect, useRef } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { useInView } from '../hooks/useInView'
import { RevealText } from './RevealText'
import { DotGrid } from './DotGrid'

// ─── "None of this is unseeable" ──────────────────────────────────────────────
// A heading (word-by-word reveal once well in view; drifts with the pointer
// at a shallow depth) over a faint dotted grid, margin to margin, whose dots
// drift in from the nearer side margin and settle into place, scrubbed by
// scroll row by row, top to bottom — and back out when scrolling up (a quiet
// echo of the Earth's particles). Six editorial photos
// arrive one by one as you scroll down through it, and drift with the pointer
// anywhere over the section — each at its own depth, for parallax.

const PARALLAX = 36        // px of travel at depth 1, pointer at the section edge
const FOLLOW = 5           // pointer easing (1/s)
const HEADING_DEPTH = .25  // parallax depth of the heading

// Positions from the design, as % of the grid box (1456 × 1540 at desktop; ends at the last rectangle).
const BOX_W = 1456, BOX_H = 1540
const IMG = `${A}/unwatched`
const RECTS = [
  { x: 1007, y: 1,    w: 289, h: 375, depth: .55, src: `${IMG}/port-crane.jpg`,     alt: 'A container crane on an empty, rain-wet quay at dusk' },
  { x: 54,   y: 171,  w: 288, h: 375, depth: 1,   src: `${IMG}/vessel.mp4`,         alt: 'A lone fishing vessel on open water, seen from above' },
  { x: 549,  y: 329,  w: 249, h: 325, depth: .35, src: `${IMG}/coast-road.jpg`,     alt: 'A road winding along misty sea cliffs' },
  { x: 831,  y: 490,  w: 367, h: 478, depth: .8,  src: `${IMG}/flooded-road.jpg`,   alt: 'A road and a house surrounded by floodwater, from above' },
  { x: 163,  y: 756,  w: 396, h: 516, depth: .6,  src: `${IMG}/undersea-cable.jpg`, alt: 'An undersea cable running across the seabed' },
  { x: 659,  y: 1070, w: 743, h: 470, depth: 1.2, src: `${IMG}/facility.mp4`,       alt: 'Timelapse: an industrial facility rising in the desert, seen from orbit' },
]

export function UnwatchedGrid() {
  const sectionRef = useRef<HTMLElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const headingRef = useRef<HTMLDivElement>(null)
  const [headRef, headIn] = useInView<HTMLDivElement>('0px 0px -30% 0px')

  // Pointer parallax: eased every frame, written straight to the DOM.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      const b = section.getBoundingClientRect()
      target.x = (e.clientX - b.left) / b.width - .5
      target.y = e.clientY / window.innerHeight - .5   // the section is taller than the screen
    }
    const onLeave = () => { target.x = target.y = 0 }
    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    let raf = 0, last = performance.now()
    const tick = (t: number) => {
      const k = 1 - Math.exp(-FOLLOW * Math.min(.05, Math.max(0, (t - last) / 1000)))
      last = t
      cur.x += (target.x - cur.x) * k
      cur.y += (target.y - cur.y) * k
      if (headingRef.current) headingRef.current.style.transform = `translate3d(${-cur.x * PARALLAX * 2 * HEADING_DEPTH}px, ${-cur.y * PARALLAX * 2 * HEADING_DEPTH}px, 0)`
      layerRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(${-cur.x * PARALLAX * 2 * RECTS[i].depth}px, ${-cur.y * PARALLAX * 2 * RECTS[i].depth}px, 0)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section ref={sectionRef} style={{ padding: '300px 20px' }}>
      <div ref={el => { headingRef.current = el; headRef.current = el }} style={{ marginBottom: 165, willChange: 'transform' }}>
        <RevealText as="h2" text={'None of this is unseeable.\nIt is unwatched.'} ready={headIn} style={{
          fontFamily: FONT.sans, fontWeight: 400, fontSize: 28, lineHeight: 1.2, color: '#fff', textAlign: 'center', margin: 0,
        }} />
      </div>

      <div style={{ position: 'relative', aspectRatio: `${BOX_W} / ${BOX_H}` }}>
        {/* Dotted grid — dots drift in from the sides, scrubbed top → bottom */}
        <DotGrid />

        {RECTS.map((r, i) => (
          <div key={i} ref={el => { layerRefs.current[i] = el }} style={{
            position: 'absolute', left: `${r.x / BOX_W * 100}%`, top: `${r.y / BOX_H * 100}%`,
            width: `${r.w / BOX_W * 100}%`, height: `${r.h / BOX_H * 100}%`, willChange: 'transform',
          }}>
            <Photo src={r.src} alt={r.alt} />
          </div>
        ))}
      </div>
    </section>
  )
}

/** One photo: rises and fades in when scrolled into view, settling from a
 *  slight zoom — and plays it back out when scrolled back up past it. */
function Photo({ src, alt }: { src: string; alt: string }) {
  const [ref, inView] = useInView<HTMLDivElement>('0px 0px -18% 0px', false)
  const ease = 'cubic-bezier(.16,1,.3,1)'
  // A video (.mp4) loops silently, playing only while revealed.
  const isVideo = src.endsWith('.mp4')
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView])
  const media = { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: inView ? 'scale(1)' : 'scale(1.12)', transition: `transform 2s ${ease}` } as const
  return (
    <div ref={ref} style={{
      width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: '#141414',
      opacity: inView ? 1 : 0, transform: inView ? 'translateY(0) scale(1)' : 'translateY(60px) scale(.96)',
      transition: `opacity 1s ${ease}, transform 1.4s ${ease}`,
    }}>
      {isVideo
        ? <video ref={videoRef} src={src} poster={src.replace(/\.mp4$/, '-poster.jpg')} muted loop playsInline preload="metadata" aria-label={alt} style={media} />
        : <img src={src} alt={alt} loading="lazy" style={media} />}
    </div>
  )
}
