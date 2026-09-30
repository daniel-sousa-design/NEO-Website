import { useEffect, useRef } from 'react'

// ─── Sweep fill ───────────────────────────────────────────────────────────────
// The site's "gradient to full colour" motion, for hover states: while `on`,
// the element's background sweeps in from one side — a leading edge fading to
// nothing that firms up to solid as it lands — and sweeps back out when `on`
// turns false. Attach the returned ref to an absolutely positioned layer.

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
// Gentle ease in, longer ease out (the same curve as the table fills).
const smooth = (t: number) => 1 - (1 - t * t * (3 - 2 * t)) ** 2

export function useSweep<T extends HTMLElement>(on: boolean, { rgb = '85,166,255', ms = 520, dir = 'right' as 'right' | 'left' } = {}) {
  const ref = useRef<T>(null)
  const k = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const paint = (v: number) => {
      const e = smooth(clamp01(v / .8)), tail = smooth(clamp01((v - .25) / .75))
      el.style.background = v <= 0 ? 'transparent' : `linear-gradient(to ${dir}, rgb(${rgb}) 0%, rgba(${rgb},${tail}) ${e * 100}%)`
    }
    const from = k.current, to = on ? 1 : 0
    if (from === to) { paint(to); return }
    const dur = ms * Math.abs(to - from) * (on ? 1 : .6)   // leaving is quicker
    let raf = 0
    const start = performance.now()
    const frame = (t: number) => {
      const p = clamp01((t - start) / dur)
      k.current = from + (to - from) * p
      paint(k.current)
      if (p < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [on, rgb, ms, dir])

  return ref
}
