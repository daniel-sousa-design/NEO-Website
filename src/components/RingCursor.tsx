import { useState, useEffect } from 'react'

// ─── Ring cursor (10 circles) ───────────────────────────────────────────────────
// Two states, matching the design references:
//   • outline  — hollow ring that fills white one dot at a time (loading a page)
//   • filled   — solid dots orbiting continuously along a tilted oval (looping)

export function RingCursor({ variant, fill = 0 }: { variant: 'outline' | 'filled'; fill?: number }) {
  const N = 10
  const [phase, setPhase] = useState(0)
  // Filled ring: the individual circles travel around the oval path.
  useEffect(() => {
    if (variant !== 'filled') return
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => { setPhase((now - start) / 1000 * 1.7); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [variant])

  // Outline: circle. Filled: oval, wider than tall, tilted slightly anticlockwise.
  const RX = variant === 'outline' ? 15 : 14
  const RY = variant === 'outline' ? 15 : 8
  const TILT = variant === 'outline' ? 0 : -15 * Math.PI / 180
  const d = variant === 'outline' ? 5.5 : 3.5
  const filledCount = Math.round(fill * N)
  return (
    <div style={{ width: 40, height: 40, position: 'relative' }}>
      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2 + phase
        const ex = Math.cos(a) * RX, ey = Math.sin(a) * RY
        const x = 20 + ex * Math.cos(TILT) - ey * Math.sin(TILT)
        const y = 20 + ex * Math.sin(TILT) + ey * Math.cos(TILT)
        const on = variant === 'filled' || i < filledCount
        return (
          <span key={i} style={{
            position: 'absolute', left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: '50%',
            border: variant === 'outline' ? '0.5px solid #7A7A7A' : 'none',
            background: on ? '#fff' : 'transparent',
            transition: variant === 'outline' ? 'background .18s ease' : undefined,
          }} />
        )
      })}
    </div>
  )
}
