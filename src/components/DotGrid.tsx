import { useEffect, useRef, useState, type RefObject } from 'react'

// ─── Dotted grid ──────────────────────────────────────────────────────────────
// Shared by Earth ("None of this is unseeable") and Access to Space. Fills its
// positioned parent (absolute, inset 0). By default each row is scrubbed by
// its own position on screen; pass `progressRef` (0…1) to drive the whole grid
// from elsewhere instead — e.g. inside a pinned stage, where nothing moves.

const DOT_COLS = 14        // dots across the grid
const DOT_ROW = 47         // px between dot rows
const DOT_TRAVEL = 180     // px — extra distance a dot starts beyond the side margin (± random)
const DOT_LINE = .9        // a row starts arriving when it crosses this fraction of the viewport…
const DOT_SPAN = 320       // …and has landed after this many more px of scroll
const DOT_JITTER = 140     // px — per-dot spread of that timing, so rows don't move in lockstep

/** Faint dots, margin to margin. Scroll-scrubbed (both directions): as each
 *  row crosses the lower part of the viewport, its dots drift in from the
 *  nearer side (left half from the left, right half from the right) and
 *  settle; scrolling back up sends them out again. */
// `strength` (default 1) makes the arrival bolder: dots start further out,
// scatter more vertically, and fly in larger and brighter, shrinking as they land.
export function DotGrid({ cols = DOT_COLS, progressRef, strength = 1 }: { cols?: number; progressRef?: RefObject<number>; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [size, setSize] = useState({ w: 0, rows: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, rows: Math.floor(el.offsetHeight / DOT_ROW) + 1 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Per-dot start offset + timing jitter (seeded, so it's the same every visit).
  const dots: { r: number; fx: number; dx: number; dy: number; jitter: number }[] = []
  let seed = 3
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  for (let r = 0; r < size.rows; r++) for (let c = 0; c < cols; c++) {
    const fx = (c + .5) / cols
    const x = fx * size.w
    dots.push({
      r, fx,
      dx: fx < .5 ? -(x + 20 + rand() * DOT_TRAVEL * strength) : (size.w - x) + 20 + rand() * DOT_TRAVEL * strength,
      dy: (rand() - .5) * 60 * strength * strength,
      // Outer columns a touch ahead of the centre, plus a little randomness.
      jitter: Math.abs(fx - .5) * 2 * -DOT_JITTER * .6 + rand() * DOT_JITTER * .4,
    })
  }

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = ref.current
      if (!el) return
      const b = el.getBoundingClientRect(), vh = window.innerHeight
      if (b.bottom < -200 || b.top > vh + 200) return
      const line = vh * DOT_LINE
      dots.forEach((d, i) => {
        const node = dotRefs.current[i]
        if (!node) return
        const y = b.top + d.r * DOT_ROW + d.jitter
        const q = progressRef
          ? Math.max(0, Math.min(1, progressRef.current * 1.6 - d.r / Math.max(1, size.rows) * .6 + d.jitter / DOT_JITTER * .15))
          : Math.max(0, Math.min(1, (line - y) / DOT_SPAN))
        const k = 1 - (1 - q) ** 3
        const grow = 1 + (strength - 1) * 1.6 * (1 - k)   // larger in flight
        node.style.opacity = String(Math.min(1, q * (1 + (strength - 1) * 2 * (1 - k))))
        node.style.transform = `translate(${d.dx * (1 - k)}px, ${d.dy * (1 - k)}px) scale(${grow})`
        if (strength > 1) node.style.background = `rgba(255,255,255,${.22 + Math.min(.6, (strength - 1) * .7) * (1 - k)})`   // brighter in flight
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  })

  return (
    <div ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {dots.map((d, i) => (
        <span key={i} ref={el => { dotRefs.current[i] = el }} style={{
          position: 'absolute', left: `${d.fx * 100}%`, top: d.r * DOT_ROW, opacity: 0,
          width: 2, height: 2, margin: '-1px 0 0 -1px', borderRadius: '50%', background: 'rgba(255,255,255,.22)',
        }} />
      ))}
    </div>
  )
}
