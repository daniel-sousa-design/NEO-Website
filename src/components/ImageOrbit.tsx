import { useEffect, useRef } from 'react'
import { A } from '../data/pages'

// ─── Image orbit ──────────────────────────────────────────────────────────────
// Photos strung along one wide, tilted elliptical trajectory that spans the
// full width (a normal section — not pinned). Every photo faces the viewer and
// never rotates; it only travels along the path. The near side of the
// ellipse is its upper arc (towards the hero): photos there are ~2.25× the
// size of those on the far side, and brighter. Once in, they keep circling slowly.
//
//   in    scrolled into view → the photos sweep onto the path one after
//         another (quick, staggered), each gliding to its place
//   drift while on screen they circle slowly on their own, and scrolling
//         moves them a little further along
//   out   scrolled on past → they carry on in the same direction and vanish,
//         fast, one by one; scrolling back up brings them back
//
// (The earlier sphere version is kept in ImageGlobe.tsx.)

const IMG = (n: number) => `${A}/engineering/eng-${n}.jpg`
const COUNT = 10           // one slot per photo — no repeats
const TILT = -12           // deg — tilt of the orbit
const RX = .56             // horizontal radius, fraction of the width (wider than the screen)
const RY = .28             // vertical radius, fraction of the section height
const CY = .42             // orbit centre, fraction of the section height (nudged up toward the hero)
const NEAR = 2.36, FAR = 1.05  // size at the front / back of the orbit
const IN_ARC = 80          // deg travelled while sweeping in
const OUT_ARC = 70         // deg travelled while leaving
const IN_MS = 1100, IN_STAGGER = 90     // entry: per-photo duration, delay between photos
const OUT_MS = 520, OUT_STAGGER = 55    // exit: faster, tighter
const DRIFT = 55           // deg of drift across the section's scroll
const IDLE_SPIN = 2.5      // deg/s of continuous circling once the photos are in
const FOLLOW = 4           // drift easing (1/s)

// Base sizes (px at desktop) — a mix of wide, square and tall crops.
const SIZES = [[260, 170], [180, 180], [150, 200], [240, 150], [170, 220], [220, 160]]
// Photo per slot around the orbit — each of the ten photos exactly once.
const ORDER = [1, 2, 3, 4, 5, 10, 6, 7, 8, 9]
const TILES = Array.from({ length: COUNT }, (_, i) => ({
  angle: i / COUNT * 360,
  w: SIZES[i % SIZES.length][0], h: SIZES[i % SIZES.length][1],
  src: IMG(ORDER[i]),
}))

// Even visual spacing: sample the orbit, accumulate arc length divided by the
// photo scale there (big near-side photos need more room), and invert it so a
// fraction 0…1 of the way round maps to an angle.
const SAMPLES = 720
const sizeAt = (th: number) => FAR + (NEAR - FAR) * (1 - Math.sin(th)) / 2
function buildSpacing(W: number, H: number) {
  const cum = new Float32Array(SAMPLES + 1)
  for (let i = 1; i <= SAMPLES; i++) {
    const th = i / SAMPLES * Math.PI * 2, d = Math.PI * 2 / SAMPLES
    const ds = Math.hypot(Math.sin(th) * RX * W, Math.cos(th) * RY * H) * d
    cum[i] = cum[i - 1] + ds / sizeAt(th)
  }
  for (let i = 0; i <= SAMPLES; i++) cum[i] /= cum[SAMPLES]
  return cum
}
function angleAt(cum: Float32Array, f: number) {
  f = ((f % 1) + 1) % 1
  let lo = 0, hi = SAMPLES
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < f) lo = mid; else hi = mid }
  const span = cum[hi] - cum[lo] || 1
  return (lo + (f - cum[lo]) / span) / SAMPLES * Math.PI * 2
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t * t

export function ImageOrbit() {
  const sectionRef = useRef<HTMLElement>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Each photo's state along its timeline: −1 not yet in, 0 placed, +1 gone.
    const state = TILES.map(() => ({ from: -1, value: -1 }))
    let target = -1, changedAt = 0
    let scrollDrift = 0, spin = 0, raf = 0, last = performance.now()
    let spacing: Float32Array = new Float32Array(0), spacingW = 0, spacingH = 0

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(.05, Math.max(0, (t - last) / 1000))
      last = t
      const b = section.getBoundingClientRect(), vh = window.innerHeight, W = section.clientWidth, H = b.height

      // Which way are we headed? In once it's well on screen, out once it's mostly scrolled past.
      const next = b.top > vh * .72 ? -1 : b.bottom < vh * .42 ? 1 : 0
      if (next !== target) {
        state.forEach(s => { s.from = s.value })
        target = next
        changedAt = t
      }
      if (b.bottom < -200 || b.top > vh + 200) return

      // Slow drift along the path with scroll.
      const p = Math.max(0, Math.min(1, (vh - b.top) / (vh + H)))
      scrollDrift += (p * DRIFT - scrollDrift) * (1 - Math.exp(-FOLLOW * dt))
      if (target === 0) spin += IDLE_SPIN * dt
      const drift = scrollDrift + spin

      // Arriving (→ placed) glides in and eases out; leaving (→ either end) is
      // quick and accelerates away.
      const arriving = target === 0
      const dur = arriving ? IN_MS : OUT_MS, stagger = arriving ? IN_STAGGER : OUT_STAGGER
      const cx = W / 2, cy = H * CY, tilt = TILT * Math.PI / 180
      if (W !== spacingW || H !== spacingH) { spacing = buildSpacing(W, H); spacingW = W; spacingH = H }

      TILES.forEach((tile, i) => {
        const s = state[i]
        const k = Math.max(0, Math.min(1, (t - changedAt - i * stagger) / dur))
        const e = arriving ? easeOut(k) : easeIn(k)
        s.value = s.from + (target - s.from) * e

        const v = s.value
        const along = v < 0 ? v * IN_ARC : v * OUT_ARC
        // Slots are even in *visual* distance (arc length ÷ photo size), so
        // neighbours sit the same gap apart wherever they are on the orbit.
        const th = angleAt(spacing, (tile.angle + drift + along) / 360)
        // x is mirrored so travel runs the other way round (near arc left → right).
        const ox = -Math.cos(th) * RX * W, oy = Math.sin(th) * RY * H
        const x = cx + ox * Math.cos(tilt) - oy * Math.sin(tilt)
        const y = cy + ox * Math.sin(tilt) + oy * Math.cos(tilt)
        const depth = (1 - Math.sin(th)) / 2          // 0 far (lower arc) … 1 near (upper arc)
        const size = sizeAt(th) * Math.min(1, W / 1300)
        const opacity = v < 0 ? 1 + v : Math.max(0, 1 - v * 2.2)

        const el = tileRefs.current[i]
        if (!el) return
        el.style.transform = `translate(${x - tile.w / 2}px, ${y - tile.h / 2}px) scale(${size})`
        el.style.opacity = String(opacity)
        el.style.filter = `brightness(${.45 + .55 * depth})`
        el.style.zIndex = String(Math.round(depth * 100))
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={sectionRef} aria-label="Engineering in pictures" style={{ position: 'relative', height: 'max(760px, 100vh)', overflow: 'hidden' }}>
      {TILES.map((tile, i) => (
        <div key={i} ref={el => { tileRefs.current[i] = el }} style={{
          position: 'absolute', left: 0, top: 0, width: tile.w, height: tile.h, overflow: 'hidden',
          background: '#111', opacity: 0, willChange: 'transform, opacity',
        }}>
          <img src={tile.src} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </section>
  )
}
