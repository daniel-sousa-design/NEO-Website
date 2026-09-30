import { useEffect, useRef } from 'react'
import { A } from '../data/pages'

// ─── Image globe ──────────────────────────────────────────────────────────────
// A sphere of photo tiles in CSS 3D. Tiles sit on the sphere's surface (an
// even Fibonacci spread), each cropped to its own size and ratio from the
// nine engineering photos, reused as needed. The globe turns slowly on its
// own, a little further with scroll, and tilts toward the pointer. Tiles
// fade + dim with depth so the back of the globe reads as distance. When the
// section first comes into view, the tiles swell out from the centre.
// The stage then pins while you scroll and the globe grows from its resting
// size until it fills the screen — the tiles themselves grow far less, so the
// sphere opens up around you rather than just zooming.

const IMG = (n: number) => `${A}/engineering/eng-${n}.jpg`
const PHOTOS = 9
const TILES = 30
const RADIUS = 420          // px at desktop; scaled down on narrow screens
const SPIN = 5              // deg/s of idle rotation
const SCROLL_SPIN = 140     // extra degrees across the section's scroll
const TILT = 12             // deg of pointer tilt
const FOLLOW = 3            // pointer easing (1/s)
const GROW_MS = 1800        // swell-out on first view
const SCRUB_VH = 150        // pinned scroll over which the globe grows to fill the screen
const TILE_GROW = 1.5       // tiles end this much bigger (the globe grows much more)

// Tile sizes echo the design's mix of wide, square and tall rectangles.
const SIZES = [
  [270, 170], [170, 160], [150, 180], [210, 130], [120, 170], [190, 190],
  [80, 190], [240, 150], [140, 130], [60, 140], [220, 175], [130, 190],
]

type Tile = { lat: number; lon: number; w: number; h: number; src: string; pos: string }

const TILE_LIST: Tile[] = Array.from({ length: TILES }, (_, i) => {
  // Fibonacci sphere: even coverage without clumping at the poles.
  const y = 1 - (i + .5) / TILES * 2
  const lon = (i * 137.508) % 360
  const [w, h] = SIZES[(i * 7) % SIZES.length]
  const positions = ['50% 50%', '30% 40%', '70% 50%', '50% 30%', '40% 70%']
  return {
    lat: Math.asin(y) * 180 / Math.PI * .82,   // flatten the poles a touch
    lon, w, h,
    src: IMG((i % PHOTOS) + 1),
    pos: positions[i % positions.length],
  }
})

export function ImageGlobe() {
  const sectionRef = useRef<HTMLElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      const b = section.getBoundingClientRect()
      target.x = (e.clientX - b.left) / b.width - .5
      target.y = e.clientY / window.innerHeight - .5
    }
    const onLeave = () => { target.x = target.y = 0 }
    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)

    let raf = 0, last = performance.now(), spin = 0, grownAt = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(.05, Math.max(0, (t - last) / 1000))
      last = t
      const b = section.getBoundingClientRect(), vh = window.innerHeight
      if (b.bottom < -100 || b.top > vh + 100) return
      if (!grownAt && b.top < vh * .7) grownAt = t

      const k = 1 - Math.exp(-FOLLOW * dt)
      cur.x += (target.x - cur.x) * k
      cur.y += (target.y - cur.y) * k
      spin += SPIN * dt
      const scrollP = Math.max(0, Math.min(1, (vh - b.top) / (vh + b.height)))
      // Pinned progress: 0 when the stage pins, 1 at the end of the scrub.
      const pin = Math.max(0, Math.min(1, -b.top / (b.height - vh)))
      const fill = pin * pin * (3 - 2 * pin)
      const rotY = spin + scrollP * SCROLL_SPIN + cur.x * TILT * 2
      const rotX = -8 - cur.y * TILT * 2
      const g = grownAt ? Math.min(1, (t - grownAt) / GROW_MS) : 0
      const grow = 1 - (1 - g) ** 4
      const R0 = RADIUS * Math.min(1, window.innerWidth / 1100)
      const R = R0 * grow
      // Zoom the whole globe (x/y only, so depth and perspective stay put)
      // until it spans the screen; counter-scale the tiles so they grow less.
      const zoom = 1 + (Math.max(window.innerWidth, vh) * .62 / R0 - 1) * fill
      const tileScale = (1 + (TILE_GROW - 1) * fill) / zoom

      if (sphereRef.current) sphereRef.current.style.transform = `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`
      const ry = rotY * Math.PI / 180, rx = rotX * Math.PI / 180
      TILE_LIST.forEach((tile, i) => {
        const el = tileRefs.current[i]
        if (!el) return
        el.style.transform = `rotateY(${tile.lon}deg) rotateX(${tile.lat}deg) translateZ(${R}px) scale(${tileScale})`
        // Depth of the tile centre after rotation (−1 back … 1 front).
        const la = tile.lat * Math.PI / 180, lo = tile.lon * Math.PI / 180
        const x0 = Math.cos(la) * Math.sin(lo), y0 = -Math.sin(la), z0 = Math.cos(la) * Math.cos(lo)
        const z1 = -x0 * Math.sin(ry) + z0 * Math.cos(ry)
        const z = y0 * Math.sin(rx) + z1 * Math.cos(rx)
        const front = (z + 1) / 2
        el.style.opacity = String(grow * (.12 + .88 * front ** 1.6))
        el.style.filter = `brightness(${.35 + .65 * front})`
      })
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section ref={sectionRef} aria-label="Engineering in pictures" style={{ position: 'relative', height: `${100 + SCRUB_VH}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', perspective: 1600, overflow: 'hidden' }}>
      <div ref={sphereRef} style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {TILE_LIST.map((tile, i) => (
          <div key={i} ref={el => { tileRefs.current[i] = el }} style={{
            position: 'absolute', left: -tile.w / 2, top: -tile.h / 2, width: tile.w, height: tile.h,
            overflow: 'hidden', background: '#111', opacity: 0, willChange: 'transform, opacity',
          }}>
            <img src={tile.src} alt="" loading="lazy" draggable={false} style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: tile.pos, display: 'block',
            }} />
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
