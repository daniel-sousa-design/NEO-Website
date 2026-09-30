import { useState, useEffect } from 'react'

// ─── Ring cursor (10 circles) ───────────────────────────────────────────────────
// Two states, matching the design references:
//   • outline  — hollow ring that fills white one dot at a time (loading a page)
//   • filled   — solid, slightly crunched ring that orbits continuously (looping)

export function RingCursor({ variant, fill = 0 }: { variant: 'outline' | 'filled'; fill?: number }) {
  const N = 10
  const [phase, setPhase] = useState(0)
  // Filled ring: the individual circles travel around the circular path.
  useEffect(() => {
    if (variant !== 'filled') return
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => { setPhase((now - start) / 1000 * 1.7); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [variant])

  const R = variant === 'outline' ? 15 : 10   // filled ring is crunched tighter
  const d = variant === 'outline' ? 5.5 : 3.5
  const filledCount = Math.round(fill * N)
  return (
    <div style={{ width: 40, height: 40, position: 'relative' }}>
      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2 + phase
        const x = 20 + Math.cos(a) * R
        const y = 20 + Math.sin(a) * R
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
