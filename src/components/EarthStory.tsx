import { useEffect, useRef, useState } from 'react'
import { A, BLUE, SEL } from '../data/pages'
import { isLand } from '../data/earthMask'
import { FONT } from '../lib/fonts'
import { RevealText } from './RevealText'

// ─── Earth story ──────────────────────────────────────────────────────────────
// One pinned stage, scrubbed by scroll, in five phases (lengths in vh of
// scroll, see PHASES):
//
//   A · form     "THIS IS WHAT NEO EXISTS TO CHANGE" sits at the top; dots fly
//                in from both margins down to the bottom centre and settle
//                into a big dithered Earth, cropped by a fade at the bottom.
//   B · orbit    the Earth shrinks as it travels to the middle of the screen
//                while the line of text wraps into a ring and orbits it.
//   C · leave    the dots and letters scatter off to the top corners (at full
//                opacity); in tandem a card rises from below while scaling
//   D · expand   from 80% to full screen — one motion across C + D.
//   E · stories  locked on the card: four subsections (seas → horizon). The
//                backdrop is one 12s clip made of four 3s shots, one per
//                slide, scrubbed by scroll so each shot starts exactly as its
//                slide loads. Each slide reveals its copy. One full-width bar fills across all four
//                with a gradient, blue at the left fading to 0% at its edge
//                (solid blue by the end);
//                its number + title swap out and in on each slide.
//   exit         as the stage unpins, the card moves up and scales back to 80%.
//
// The globe, stars and orbiting text are drawn on one canvas every frame; the
// card is DOM, its scroll-driven styles written straight from the same loop.

const PHASES = { form: 130, orbit: 130, leave: 80, expand: 50, stories: 4 * 90 }  // vh
const PINNED_VH = Object.values(PHASES).reduce((a, b) => a + b, 0)

const LINE = 'THIS IS WHAT NEO EXISTS TO CHANGE'
const LINE_Y = .23          // line of text, fraction of stage height
const LINE_FS = 12          // px
const LINE_TRACK = .95      // letter spacing, em

const GLOBE_CELLS = 170     // dither cells across the globe's diameter (at full definition)
const BLOW_RADIUS = 90      // px — the pointer blows dots away within this radius…
const BLOW_FORCE = 4200     // px/s² at the pointer
const SPRING = 38           // …and they spring back home (1/s²)
const DAMP = 5              // velocity damping (1/s)
const VIEW_LAT = 24         // camera latitude, degrees (tilts the north toward us)
const SPIN = 3              // degrees per second
const LON0 = 10             // longitude facing the camera at t = 0

const CARD_SCALE = .8, CARD_RADIUS = 12
const BAR_H = 56           // progress bar height, px
const BAR_FS = 34          // bar number + title size, px
const SHOT_S = 3            // seconds of video per slide (earth-slides.mp4: 4 × 3s)
const STORY_SMOOTH = 3.5    // story scrub easing (1/s): lower = more glide after scrolling stops

const STORIES = [
  { label: 'The Seas', body: 'One in five fish caught worldwide is taken illegally, costing the global economy between $23.5 and $36.4 billion every year — much of it moving under vessels that switch off their transponders and vanish from the systems built to track them.' },
  { label: 'The Ground', body: 'Natural disasters caused an estimated $260 billion in global economic losses in 2025, with less than half of that covered by insurance — fires, floods, and storms outrunning the assessments meant to respond to them. The same gap runs through the ports, mines, and industrial corridors economies depend on daily: most are watched only occasionally, if at all.' },
  { label: 'The Underground', body: 'Over 95% of the world’s data and $10 trillion in daily financial transactions travel across undersea cables, an infrastructure that still suffered at least 44 publicly reported damage incidents in 2024 and 2025 alone.\n\nThe same blind spots reach borders and remote terrain, where incursions often go unnoticed simply because no one was watching that stretch of ground or water at the right moment.' },
  { label: 'The Horizon', body: 'Facilities expand, fleets move, and capacity grows — often long before any public announcement. Commercial satellite imagery has tracked over 21 million square feet of new missile-production capacity built in just five years, work that would otherwise have gone unannounced until it was finished.' },
]

const BITCOUNT = { fontFamily: FONT.bitcount, fontWeight: 400, textTransform: 'uppercase', letterSpacing: 0, lineHeight: 1.1, fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0' } as const

// ─── helpers ──────────────────────────────────────────────────────────────────

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t * t
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4
// 8×8 ordered-dither thresholds. Low thresholds are spread evenly over the
// grid, so dots arriving in threshold order sharpen the Earth progressively.
const BAYER = (() => {
  let m = [[0]]
  for (let n = 1; n < 8; n *= 2) m = [
    ...m.map(row => [...row.map(v => 4 * v), ...row.map(v => 4 * v + 2)]),
    ...m.map(row => [...row.map(v => 4 * v + 3), ...row.map(v => 4 * v + 1)]),
  ]
  return m.flat().map(v => (v + .5) / 64)
})()

// Seeded random so the dots fly in the same way every visit.
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
}

type Cell = {
  u: number; v: number            // position on the unit disc (v down)
  lat: number; dlon: number       // sphere point under the cell, lon relative to the facing longitude
  shade: number; bayer: number
  sx: number; sy: number          // fly-in start, fraction of the stage
  delay: number
  ex: number; ey: number; exitDelay: number  // scatter-out target (fraction of the stage) + stagger
}

function buildCells(): Cell[] {
  const cells: Cell[] = []
  const r = rng(7)
  const phi = VIEW_LAT * Math.PI / 180
  const L = [-.45, .6, .66], ll = Math.hypot(...L)
  for (let j = 0; j < GLOBE_CELLS; j++) {
    for (let i = 0; i < GLOBE_CELLS; i++) {
      const u = (i + .5) / GLOBE_CELLS * 2 - 1
      const v = (j + .5) / GLOBE_CELLS * 2 - 1
      const rho = Math.hypot(u, v)
      if (rho >= 1) continue
      // Inverse orthographic projection (y up on the sphere).
      const x = u, y = -v, z = Math.sqrt(1 - rho * rho)
      const lat = Math.asin(z * Math.sin(phi) + y * Math.cos(phi))
      const dlon = Math.atan2(x, z * Math.cos(phi) - y * Math.sin(phi))
      const shade = Math.max(0, (x * L[0] + y * L[1] + z * L[2]) / ll)
      const left = u < 0
      cells.push({
        u, v, lat: lat * 180 / Math.PI, dlon: dlon * 180 / Math.PI,
        shade, bayer: BAYER[(j & 7) * 8 + (i & 7)],
        sx: left ? -.04 - r() * .08 : 1.04 + r() * .08,
        sy: r() * .85,
        delay: 0,
        ex: left ? -.08 - r() * .25 : 1.08 + r() * .25, ey: -.1 - r() * .4, exitDelay: r() * .4,
      })
      // Coarse dots first, finer ones later: arrival follows the threshold.
      cells[cells.length - 1].delay = cells[cells.length - 1].bayer * .6 + r() * .08
    }
  }
  return cells
}

// ─── component ────────────────────────────────────────────────────────────────

export function EarthStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current, section = sectionRef.current
    if (!canvas || !section) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cells = buildCells()
    const ox = new Float32Array(cells.length), oy = new Float32Array(cells.length)
    const vx = new Float32Array(cells.length), vy = new Float32Array(cells.length)
    const pointer = { x: -1e4, y: -1e4 }
    const stage = stageRef.current
    const onMove = (ev: MouseEvent) => { const b = canvas.getBoundingClientRect(); pointer.x = ev.clientX - b.left; pointer.y = ev.clientY - b.top }
    const onLeave = () => { pointer.x = pointer.y = -1e4 }
    stage?.addEventListener('mousemove', onMove)
    stage?.addEventListener('mouseleave', onLeave)
    let lastT = performance.now()
    const r = rng(11)
    const stars = Array.from({ length: 80 }, () => ({ x: r(), y: r() * .75, s: r() < .15 ? 2 : 1, a: .35 + r() * .6 }))

    let W = 0, H = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = canvas.clientWidth; H = canvas.clientHeight
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Per-character advance for the line, measured once the font is in.
    let advances: number[] = []
    const measure = () => {
      ctx.font = `${LINE_FS}px ${FONT.mono}`
      advances = [...LINE].map(ch => ctx.measureText(ch).width + LINE_FS * LINE_TRACK)
    }
    measure()
    document.fonts?.ready.then(measure)
    const wordOf = [...LINE].map((_, i) => LINE.slice(0, i).split(' ').length - 1)

    let revealAt = 0            // when the line's word-by-word reveal started
    let lastActive = -1, lastExpanded = false
    let eSmooth = 0             // eased story progress, so the scrub glides to a stop
    let raf = 0
    const t0 = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(.05, Math.max(0, (now - lastT) / 1000))
      lastT = now
      const rect = section.getBoundingClientRect()
      if (rect.bottom < -50 || rect.top > H + 50) return
      const vh = H / 100
      const pinned = Math.max(0, -rect.top) / vh     // vh scrolled while pinned

      // Phase progress, each 0..1
      let at = 0
      const phase = (len: number) => { const p = clamp01((pinned - at) / len); at += len; return p }
      const a = phase(PHASES.form), b = phase(PHASES.orbit), c = phase(PHASES.leave)
      phase(PHASES.expand)
      const eRaw = phase(PHASES.stories)
      eSmooth += (eRaw - eSmooth) * (1 - Math.exp(-STORY_SMOOTH * dt))
      if (Math.abs(eRaw - eSmooth) < 1e-4) eSmooth = eRaw
      const e = eSmooth

      // Line reveal starts once the stage is well into view.
      if (!revealAt && rect.top < H * .55) revealAt = now

      // ── Card (DOM) ──
      const card = cardRef.current
      // Entry: rise + scale 80% → 100% together; exit (after the pin) scales back.
      const enter = clamp01((pinned - PHASES.form - PHASES.orbit) / (PHASES.leave + PHASES.expand))
      const leaveCard = clamp01((pinned - PINNED_VH) / 100)
      if (card) {
        const ei = easeInOut(enter), eo = easeInOut(leaveCard)
        const scale = lerp(CARD_SCALE, 1, ei) * lerp(1, CARD_SCALE, eo)
        card.style.transform = `translateY(${(1 - ei) * 100}%) scale(${scale})`
        card.style.borderRadius = `${CARD_RADIUS * Math.max(1 - ei, eo) / scale}px`
        card.style.visibility = enter > 0 ? 'visible' : 'hidden'
      }
      const nextExpanded = enter >= 1
      const nextActive = Math.min(STORIES.length - 1, Math.floor(e * STORIES.length))
      // Scrub the backdrop video: slide i plays shot i (i·3s → i·3s + 3s).
      const video = videoRef.current
      if (video && video.readyState >= 1 && !video.seeking) {
        const t = Math.min(video.duration - .05, e * STORIES.length * SHOT_S)
        if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t
      }

      // The bar fills across all four slides: one gradient, blue at the left
      // fading to 0% at the leading edge. Over the last slide the faded end
      // fills in, so the bar ends solid blue.
      if (fillRef.current) {
        const tail = easeInOut(clamp01((e - .75) / .25))
        fillRef.current.style.background = e <= 0 ? 'transparent'
          : `linear-gradient(to right, ${BLUE} 0%, rgba(${SEL},${tail}) ${e * 100}%)`
      }
      if (nextExpanded !== lastExpanded) { lastExpanded = nextExpanded; setExpanded(nextExpanded) }
      if (nextActive !== lastActive) { lastActive = nextActive; setActive(nextActive) }

      // ── Canvas ──
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (c >= 1) return
      const lift = -easeIn(c) * H * .5     // stars drift up as everything scatters

      // Globe geometry: big + cropped (A) → small + centred (B)
      const shrink = easeInOut(b)
      const R0 = Math.min(W * .36, H * .85), R1 = Math.min(W * .17, H * .24)
      const R = lerp(R0, R1, shrink)
      const cx = W / 2
      const cy = lerp(H * .42 + R0, H * .5, shrink)
      const form = a

      // Stars
      for (const s of stars) {
        const k = clamp01(form * 2 - s.y)
        if (k <= 0) continue
        ctx.fillStyle = `rgba(255,255,255,${s.a * k})`
        ctx.fillRect(s.x * W, s.y * H + lift * .6, s.s, s.s)
      }

      // Text: a centred line (A) that wraps into a tilted orbit ring (B)
      const total = advances.reduce((x, y) => x + y, 0) - LINE_FS * LINE_TRACK
      let x0 = cx - total / 2
      const ringRx = R1 * 1.75, ringRy = R1 * .34, tilt = -12 * Math.PI / 180
      const spin = b * Math.PI * 1.6 + (now - t0) / 1000 * .05 * shrink
      const ringChars = LINE.length + 7          // leave a gap in the ring
      const glyphs: { ch: string; x: number; y: number; alpha: number; front: boolean }[] = []
      ctx.font = `${LINE_FS}px ${FONT.mono}`
      ctx.textBaseline = 'middle'
      for (let i = 0; i < LINE.length; i++) {
        const ch = LINE[i]
        const lx = x0 + advances[i] / 2 - LINE_FS * LINE_TRACK / 2
        x0 += advances[i]
        if (ch === ' ') continue
        // word-by-word reveal, same feel as RevealText
        const rt = revealAt ? (now - revealAt) / 1000 - wordOf[i] * .07 : -1
        const rv = rt <= 0 ? 0 : easeOutQuart(clamp01(rt / 1.1))
        const ly = H * LINE_Y + (1 - rv) * 14
        const th = Math.PI - (i / ringChars) * Math.PI * 2 + spin
        const ox = Math.cos(th) * ringRx, oy = Math.sin(th) * ringRy
        const rx = cx + ox * Math.cos(tilt) - oy * Math.sin(tilt)
        const ry = H * .5 + ox * Math.sin(tilt) + oy * Math.cos(tilt)
        const m = easeInOut(clamp01((b - .1) / .6))
        const front = Math.sin(th) > 0
        // Scatter: each letter flies off to the nearer top corner.
        const gx = lerp(lx, rx, m), gy = lerp(ly, ry, m)
        const gk = easeIn(clamp01((c - (i / LINE.length) * .3) / .6))
        glyphs.push({
          ch,
          x: lerp(gx, gx < cx ? -80 : W + 80, gk), y: lerp(gy, -40 - (i % 5) * 40, gk),
          alpha: rv * lerp(1, front ? 1 : .35, m),
          front: m < .5 || front,
        })
      }
      const drawGlyphs = (front: boolean) => {
        for (const g of glyphs) if (g.front === front && g.alpha > 0) {
          ctx.fillStyle = `rgba(255,255,255,${g.alpha})`
          ctx.fillText(g.ch, g.x - ctx.measureText(g.ch).width / 2, g.y)
        }
      }
      drawGlyphs(false)

      // Globe: black disc (occludes the back of the ring), then the dots
      if (form > 0) {
        ctx.globalAlpha = clamp01((form - .5) * 2) * (1 - c)
        ctx.fillStyle = '#000'
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
        const lon0 = LON0 + (now - t0) / 1000 * SPIN
        const pitch = 2 * R / GLOBE_CELLS
        // Few big dots at first; more, smaller ones as the definition builds.
        const rad = Math.max(.6, pitch * lerp(.8, .36, easeOut(clamp01(form * 1.15))))
        // Pointer blows dots away once the Earth has moved to the centre.
        const blow = c > 0 ? 0 : clamp01((shrink - .6) / .4)
        // Batch dots into one path per colour × opacity step.
        const STEPS = 5
        const paths = Array.from({ length: 2 * STEPS }, () => new Path2D())
        for (let n = 0; n < cells.length; n++) {
          const cl = cells[n]
          // Spring physics (always settles back home, even after blow is off)
          if (blow > 0 || ox[n] !== 0 || oy[n] !== 0) {
            const hx = cx + cl.u * R + ox[n], hy = cy + cl.v * R + oy[n]
            const dx = hx - pointer.x, dy = hy - pointer.y, d2 = dx * dx + dy * dy
            if (blow > 0 && d2 < BLOW_RADIUS * BLOW_RADIUS) {
              const dd = Math.sqrt(d2) || 1
              const f = BLOW_FORCE * blow * (1 - dd / BLOW_RADIUS) ** 2
              vx[n] += dx / dd * f * dt; vy[n] += dy / dd * f * dt
            }
            vx[n] += -SPRING * ox[n] * dt; vy[n] += -SPRING * oy[n] * dt
            const damp = Math.exp(-DAMP * dt)
            vx[n] *= damp; vy[n] *= damp
            ox[n] += vx[n] * dt; oy[n] += vy[n] * dt
            if (Math.abs(ox[n]) + Math.abs(oy[n]) < .05 && Math.abs(vx[n]) + Math.abs(vy[n]) < .5) { ox[n] = oy[n] = vx[n] = vy[n] = 0 }
          }
          const land = isLand(cl.lat, cl.dlon + lon0)
          const value = land ? .3 + .7 * cl.shade : .09 * cl.shade
          if (value <= cl.bayer) continue
          const q = clamp01((form - cl.delay) / .3)
          if (q <= 0) continue
          const k = easeOut(q)
          const tx = cx + cl.u * R + ox[n], ty = cy + cl.v * R + oy[n]
          const sx = cl.sx * W, sy = cl.sy * H
          // Curve: travel sideways first, then down into place.
          const mx = lerp(sx, tx, .5), my = sy
          let px = (1 - k) ** 2 * sx + 2 * (1 - k) * k * mx + k * k * tx
          let py = (1 - k) ** 2 * sy + 2 * (1 - k) * k * my + k * k * ty
          // Scatter: up first, then out to the top corner on this dot's side.
          const xk = easeIn(clamp01((c - cl.exitDelay) / .55))
          if (xk > 0) {
            const ex = cl.ex * W, ey = cl.ey * H
            const cxk = lerp(px, ex, .2), cyk = lerp(py, ey, .75)
            px = (1 - xk) ** 2 * px + 2 * (1 - xk) * xk * cxk + xk * xk * ex
            py = (1 - xk) ** 2 * py + 2 * (1 - xk) * xk * cyk + xk * xk * ey
          }
          const step = Math.min(STEPS - 1, Math.floor(clamp01(q * 3) * STEPS - 1e-6))
          const path = paths[(land ? 0 : STEPS) + step]
          path.moveTo(px + rad, py)
          path.arc(px, py, rad, 0, Math.PI * 2)
        }
        for (let i = 0; i < paths.length; i++) {
          const land = i < STEPS, a = ((i % STEPS) + 1) / STEPS
          ctx.fillStyle = land ? `rgba(225,225,225,${a})` : `rgba(140,140,140,${a})`
          ctx.fill(paths[i])
        }
      }

      // Crop the big globe into the page with a fade; lifts as it shrinks.
      const crop = 1 - shrink
      if (crop > 0) {
        const g = ctx.createLinearGradient(0, H * .68, 0, H)
        g.addColorStop(0, 'rgba(0,0,0,0)')
        g.addColorStop(1, `rgba(0,0,0,${crop})`)
        ctx.fillStyle = g
        ctx.fillRect(0, H * .68, W, H * .32)
      }

      drawGlyphs(true)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize)
      stage?.removeEventListener('mousemove', onMove); stage?.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section ref={sectionRef} style={{ position: 'relative', height: `${100 + PINNED_VH}vh` }}>
      <div ref={stageRef} style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <canvas ref={canvasRef} aria-label={LINE} role="img" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        {/* The card: rises at 80%, scales to full screen, then holds the four stories */}
        <div ref={cardRef} style={{ position: 'absolute', inset: 0, visibility: 'hidden', overflow: 'hidden', willChange: 'transform', background: '#111' }}>
          {/* Backdrop: scroll-scrubbed video, one 3s shot per slide */}
          <video ref={videoRef} src={`${A}/video/earth-slides.mp4`} muted playsInline preload="auto" aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {/* Shade for legibility: black at the bottom → 0% at the top */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0) 100%)' }} />

          {/* Progress bar: one continuous bar; number + title swap per slide */}
          <div style={{
            position: 'absolute', left: 20, right: 20, top: '47%', height: BAR_H, borderRadius: 6, overflow: 'hidden',
            opacity: expanded ? 1 : 0, transition: 'opacity .6s ease',
          }}>
            <div ref={fillRef} style={{ position: 'absolute', inset: 0 }} />
            {expanded && (
              // Bitcount's caps sit ~0.05em above the line box's centre; nudge
              // them down so the ink is centred in the bar.
              <div style={{ ...BITCOUNT, position: 'relative', paddingLeft: 22, fontSize: BAR_FS, lineHeight: `${BAR_H}px`, color: '#fff', transform: 'translateY(.05em)' }}>
                <SwapText text={String(active + 1).padStart(2, '0')} />
                {/* Title lines up with the copy below (a quarter of the way across) */}
                <span style={{ position: 'absolute', left: '25%', top: 0 }}>
                  <SwapText text={STORIES[active].label} />
                </span>
              </div>
            )}
          </div>

          {/* Copy — revealed per subsection, aligned with the second segment */}
          <RevealText key={`b${active}`} text={STORIES[active].body} by="line" delay={.1} ready={expanded} style={{
            position: 'absolute', left: 'calc(20px + (100% - 40px) / 4)', top: `calc(47% + ${BAR_H + 60}px)`, margin: 0,
            maxWidth: 'min(600px, calc(75% - 28px))',
            fontFamily: FONT.sans, fontSize: 21, lineHeight: 1.3, color: '#fff',
          }} />
        </div>
      </div>
    </section>
  )
}

// ─── Swap text ────────────────────────────────────────────────────────────────
// Word-staggered swap: on a new `text`, the old words rise and fade out, then
// the new ones rise and fade in (same keyframes as the orbit cursor hint).

function SwapText({ text }: { text: string }) {
  const [items, setItems] = useState([{ text, id: 0, out: false }])
  const idRef = useRef(0)
  useEffect(() => {
    setItems(prev => {
      if (prev[prev.length - 1]?.text === text) return prev
      return [...prev.filter(i => !i.out).map(i => ({ ...i, out: true })), { text, id: ++idRef.current, out: false }]
    })
    const t = setTimeout(() => setItems(prev => prev.filter(i => !i.out)), 1200)
    return () => clearTimeout(t)
  }, [text])
  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
      {items.map(it => (
        <span key={it.id} aria-hidden={it.out} style={it.out ? { position: 'absolute', left: 0, top: 0 } : undefined}>
          {it.text.split(' ').map((w, wi) => (
            <span key={wi}>
              {wi > 0 && ' '}
              <span className={it.out ? 'neo-hint-out' : 'neo-hint-in'} style={{ display: 'inline-block', animationDelay: `${(it.out ? 0 : .35) + wi * .07}s` }}>{w}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}
