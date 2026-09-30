import { useEffect, useRef } from 'react'
import { A } from '../data/pages'
import { useInView } from '../hooks/useInView'

// ─── Photo strip ──────────────────────────────────────────────────────────────
// A row of portrait photos that travels right → left as the page scrolls past
// (scroll-linked, eased), along a curve: each photo rides highest at the
// centre of the page and drops away towards either side. Each photo rises in
// and settles from a slight zoom as it comes into view.

const SHIFT = .22     // fraction of the width the row travels across the section's scroll
const FOLLOW = 6      // easing (1/s)
const ARC = .13       // drop at the page edges, fraction of the width

// Horizontal slots from the design (px of a 1440-wide row); photos are 3:4.
const PHOTOS = [
  { x: 70,   src: `${A}/access/aerial.jpg`,    alt: 'Farmland and a river delta seen from orbit' },
  { x: 423,  src: `${A}/access/engineer.jpg`,  alt: 'An engineer with a head torch working inside a launcher structure' },
  { x: 780,  src: `${A}/access/satellite.jpg`, alt: 'A spacecraft above the clouds' },
  { x: 1123, src: `${A}/access/station.jpg`,   alt: 'A space station against black space' },
]
const ROW_W = 1440, PHOTO_W = 300, PHOTO_H = 400
const ROW_H = PHOTO_H + ARC * ROW_W          // room for the lowest point of the curve

export function PhotoStrip() {
  const sectionRef = useRef<HTMLElement>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let raf = 0, last = performance.now(), cur = -1
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const s = sectionRef.current
      if (!s) return
      const dt = Math.min(.05, Math.max(0, (t - last) / 1000))
      last = t
      const b = s.getBoundingClientRect(), vh = window.innerHeight, W = s.clientWidth
      if (b.bottom < -200 || b.top > vh + 200) return
      const p = Math.max(0, Math.min(1, (vh - b.top) / (vh + b.height)))   // 0 entering … 1 gone
      const target = (.5 - p) * SHIFT * 2
      cur = cur < -.5 ? target : cur + (target - cur) * (1 - Math.exp(-FOLLOW * dt))
      PHOTOS.forEach((ph, i) => {
        const el = slotRefs.current[i]
        if (!el) return
        const x = cur * W
        const centre = (ph.x + PHOTO_W / 2) / ROW_W * W + x        // photo centre on screen
        const d = Math.min(1.2, Math.abs(centre - W / 2) / (W / 2)) // 0 at the page centre
        el.style.transform = `translate3d(${x}px, ${d * d * ARC * W}px, 0)`
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={sectionRef} aria-label="From the programme" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative', aspectRatio: `${ROW_W} / ${ROW_H}` }}>
        {PHOTOS.map((ph, i) => (
          <div key={ph.src} ref={el => { slotRefs.current[i] = el }} style={{
            position: 'absolute', left: `${ph.x / ROW_W * 100}%`, top: 0,
            width: `${PHOTO_W / ROW_W * 100}%`, aspectRatio: '3 / 4', willChange: 'transform',
          }}>
            <Photo src={ph.src} alt={ph.alt} />
          </div>
        ))}
      </div>
    </section>
  )
}

function Photo({ src, alt }: { src: string; alt: string }) {
  const [ref, inView] = useInView<HTMLDivElement>('0px 0px -10% 0px', false)
  return (
    <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#111',
      opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(40px)',
      transition: 'opacity 1s cubic-bezier(.16,1,.3,1), transform 1.2s cubic-bezier(.16,1,.3,1)',
    }}>
      <img src={src} alt={alt} loading="lazy" draggable={false} style={{
        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        transform: inView ? 'scale(1)' : 'scale(1.12)', transition: 'transform 2s cubic-bezier(.16,1,.3,1)',
      }} />
    </div>
  )
}
