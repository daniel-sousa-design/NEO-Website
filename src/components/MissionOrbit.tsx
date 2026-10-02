import { useEffect, useRef, useState, type CSSProperties } from 'react'
import missionDesign from '../assets/mission-icons/orbi-mission-design.svg?raw'
import licensing from '../assets/mission-icons/orbi-licensing.svg?raw'
import launch from '../assets/mission-icons/orbi-launch.svg?raw'
import commissioning from '../assets/mission-icons/orbi-commissioning.svg?raw'
import ongoingOperation from '../assets/mission-icons/orbi-ongoing-operation.svg?raw'
import { NeoMark3D } from './NeoMark3D'
import { DotGrid } from './DotGrid'

// ─── Mission orbit ────────────────────────────────────────────────────────────
// A looping animation for the Missions page's "Complete Mission" card: the
// NEO mark on a blue tile in the middle, and the five services of a complete
// mission — mission design, licensing, launch, commissioning, ongoing
// operation — as dotted icons on grey tiles, orbiting it on a tilted ring
// (like the Engineering page's photo orbit): nearer icons are larger and pass
// in front of the NEO tile, farther ones smaller and behind it. Icons always
// face forward. Each loop: the NEO tile alone, then pressed like a button →
// the icons sweep onto the ring (and a dotted grid flies in)
// one by one → they circle slowly → they leave fast, one by one, carrying on
// the same way → the NEO tile alone again. The NEO mark turns in 3D, white to
// reflective silver and back, as the icons sweep in and as they leave. Only
// runs while on screen.
//
// Sizes are in units of the card's width (cqw), so it fits any card.

// The icons are inlined (not <img>) so their dots can be scaled: each dot grows
// from nothing just after its tile arrives, and shrinks away before it leaves.
const ICONS = [
  { file: 'orbi-mission-design', label: 'Mission design', svg: missionDesign },
  { file: 'orbi-licensing', label: 'Licensing', svg: licensing },
  { file: 'orbi-launch', label: 'Launch', svg: launch },
  { file: 'orbi-commissioning', label: 'Commissioning', svg: commissioning },
  { file: 'orbi-ongoing-operation', label: 'Ongoing operation', svg: ongoingOperation },
]

const CX = 54, CY = 49          // ring centre, % of the card (width, height)
const RX = 37, RY = 31          // ring radii, % of the card's width
const TILT = 28                 // deg — tips the near side down-left
const NEAR = 18.5, FAR = 12       // icon size at the front / back, % of the card's width
const CORE = 26                 // NEO tile size, % of the card's width
const GRID_COLS = 6, DOT_ROW = 47   // dotted grid: columns, and roughly the row spacing (px)
const GRID_MARGIN = .075        // margin from the outer dots to the card's edges, as a share of the card's width
const DRIFT = 10                // deg/s round the ring
const IN_ARC = 70, OUT_ARC = 60 // deg travelled sweeping on / off

// One loop, in ms.
const REST = 1300                       // NEO tile alone — ending in a press
const PRESS_MS = 820                    // the tile is pressed like a button (and held down a moment)…
const RELEASE = .66                     // …and lets go at this point of it
const LAUNCH = .32                      // the orbit and the mark's turn start here — while the tile is still held down
const IN_MS = 1000, IN_STAGGER = 160    // per icon, and between icons
const HOLD = 5200                       // circling
const OUT_MS = 520, OUT_STAGGER = 110   // leaving: faster, tighter
// The icons' dots.
const DOT_MAX = 1.25                    // full dot size, relative to the SVGs' own
const DOT_AFTER = .3                    // dots start growing this long after the tile starts arriving (× its arrival time)…
const DOT_IN_MS = 700                   // …and take this long — starting slowly (ease-in)
const DOT_OUT_MS = 450                  // shrinking away, just before the tile leaves
const LOOP = REST + IN_STAGGER * (ICONS.length - 1) + IN_MS + HOLD + OUT_STAGGER * (ICONS.length - 1) + OUT_MS

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t * t

export function MissionOrbit({ style }: { style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  // The NEO mark turns (white → white metal → white) as the icons sweep in, and again as they leave.
  const [turn, setTurn] = useState(0)
  // The NEO tile is pressed, like a button, just before each sweep-in. Played
  // with the Web Animations API, so the tile (and the 3D mark in it) isn't
  // remounted — remounting restarted the mark's turn mid-press.
  const tileRef = useRef<HTMLDivElement>(null)
  // Dotted grid placement: the outer dots sit GRID_MARGIN from all four edges —
  // rows spaced to fit exactly (close to DOT_ROW apart), columns inset to match.
  const [grid, setGrid] = useState<{ x: number; y: number; h: number; gap: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const W = el.clientWidth, H = el.clientHeight
      const m = GRID_MARGIN * W, span = H - 2 * m
      const gap = span / Math.max(1, Math.round(span / DOT_ROW))
      // outer dot = x + (W − 2x) / (2·cols)  →  solve for the inset x that puts it at m
      const x = (m * 2 * GRID_COLS - W) / (2 * GRID_COLS - 2)
      setGrid({ x, y: m, h: span + 1, gap })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Dotted grid: 0 hidden … 1 in place — flies in with the orbit, out with it.
  const dots = useRef(0)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    let raf = 0, onScreen = false, t0 = 0, spin = 0, last = 0, prevT = 0
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      if (onScreen) { t0 = performance.now(); last = t0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick) }
    })
    io.observe(root)

    const tick = (now: number) => {
      if (!onScreen) return
      raf = requestAnimationFrame(tick)
      spin += DRIFT * Math.min(.05, (now - last) / 1000)
      last = now
      const t = (now - t0) % LOOP
      const tilt = TILT * Math.PI / 180
      const outStart = REST + IN_STAGGER * (ICONS.length - 1) + IN_MS + HOLD
      // crossing into the sweep-in or the sweep-out: turn the mark
      const crossed = (at: number) => prevT < at && t >= at
      if (crossed(REST) || crossed(outStart)) setTurn(n => n + 1)
      if (crossed(REST - PRESS_MS * LAUNCH)) tileRef.current?.animate([
        { transform: 'scale(1)', filter: 'brightness(1)', easing: 'cubic-bezier(.45,0,.25,1)' },
        { transform: 'scale(.86)', filter: 'brightness(.88)', offset: .18 },
        { transform: 'scale(.86)', filter: 'brightness(.88)', offset: RELEASE, easing: 'cubic-bezier(.3,0,.2,1)' },   // held down, then up…
        { transform: 'scale(1.03)', filter: 'brightness(1.08)', offset: .82, easing: 'cubic-bezier(.25,0,.1,1)' },   // …settling with a long, soft ease
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ], { duration: PRESS_MS + 160 })   // each step carries its own easing
      prevT = t
      const inEnd = REST + IN_STAGGER * (ICONS.length - 1) + IN_MS, outEnd = LOOP
      dots.current = t < REST ? 0 : t < inEnd ? (t - REST) / (inEnd - REST) : t < outStart ? 1 : 1 - (t - outStart) / (outEnd - outStart)
      iconRefs.current.forEach((el, i) => {
        if (!el) return
        // v: −1 waiting → 0 on the ring → +1 gone
        const kIn = clamp01((t - REST - i * IN_STAGGER) / IN_MS)
        const kOut = clamp01((t - outStart - i * OUT_STAGGER) / OUT_MS)
        const v = kOut > 0 ? easeIn(kOut) : easeOut(kIn) - 1
        const along = v < 0 ? v * IN_ARC : v * OUT_ARC
        const th = (i / ICONS.length * 360 + spin + along) * Math.PI / 180
        const ox = Math.cos(th) * RX, oy = Math.sin(th) * RY
        const x = CX + ox * Math.cos(tilt) - oy * Math.sin(tilt)
        const y = ox * Math.sin(tilt) + oy * Math.cos(tilt)   // % of width; converted below
        const depth = (Math.sin(th) + 1) / 2                  // 0 back … 1 front
        const size = FAR + (NEAR - FAR) * depth
        const shown = v < 0 ? 1 + v : 1 - v                    // grows in, shrinks out
        el.style.width = el.style.height = `${size}cqw`
        el.style.left = `${x}%`
        el.style.top = `calc(${CY}% + ${y}cqw)`
        el.style.transform = `translate(-50%, -50%) scale(${shown})`
        // dots: grow from nothing once the tile is mostly in, slowly enough to see;
        // on the way out they shrink away first, finishing as the tile starts to go
        const dIn = clamp01((t - REST - i * IN_STAGGER - IN_MS * DOT_AFTER) / DOT_IN_MS)
        const dOut = clamp01((t - outStart - i * OUT_STAGGER + DOT_OUT_MS) / DOT_OUT_MS)
        el.style.setProperty('--dot', String(DOT_MAX * dIn ** 2 * (1 - easeIn(dOut))))
        el.style.zIndex = depth > .5 ? '3' : '1'
        el.style.filter = `brightness(${.7 + .3 * depth})`
      })
    }
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div ref={ref} role="img" aria-label={`NEO at the centre of a complete mission: ${ICONS.map(i => i.label.toLowerCase()).join(', ')}`}
      style={{ containerType: 'inline-size', position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      {/* Dotted grid — flies in and out with the orbit; its outer dots sit the same distance from all four edges */}
      {grid && (
        <div style={{ position: 'absolute', left: grid.x, right: grid.x, top: grid.y, height: grid.h }}>
          <DotGrid cols={GRID_COLS} progressRef={dots} strength={1.4} rowGap={grid.gap} />
        </div>
      )}
      {/* NEO — pressed like a button (down, held, back up), then the orbit appears */}
      <div style={{ position: 'absolute', left: `${CX}%`, top: `${CY}%`, width: `${CORE}cqw`, aspectRatio: '1', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
        <div ref={tileRef} style={{
          position: 'absolute', inset: 0, background: '#659bfa', borderRadius: `${CORE * .1}cqw`, display: 'grid', placeItems: 'center', perspective: `${CORE * 2.4}cqw`,
        }}>
          <NeoMark3D turn={turn} width={`${CORE * .8}cqw`} finish="silver" />
        </div>
      </div>
      {/* The five services */}
      {ICONS.map((ic, i) => (
        <div key={ic.file} ref={el => { iconRefs.current[i] = el }} style={{
          position: 'absolute', background: '#222222', borderRadius: '14%', transform: 'translate(-50%, -50%) scale(0)', willChange: 'transform, left, top',
        }}>
          <span aria-hidden className="mo-icon" dangerouslySetInnerHTML={{ __html: ic.svg }} />
        </div>
      ))}
      <style>{`
        .mo-icon, .mo-icon svg { display: block; width: 100%; height: 100% }
        .mo-icon circle { transform-box: fill-box; transform-origin: center; transform: scale(var(--dot, 0)) }
      `}</style>
    </div>
  )
}
