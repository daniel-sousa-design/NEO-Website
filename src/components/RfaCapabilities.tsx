import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FONT } from '../lib/fonts'
import { RevealText } from './RevealText'
import { DotGrid } from './DotGrid'

// ─── RFA One ──────────────────────────────────────────────────────────────────
// One pinned, full-screen stage, driven by scroll:
//
//   rfa     locks with "RFA One" 40px off the bottom; only then does the intro
//           paragraph (top right) rise in line by line. Scrolling on, the
//           paragraph goes and "RFA One" slides down off the screen word by
//           word, right to left (scrubbed — translation only, no fading).
//   01…04   each capability group loads by itself once reached (not scrubbed):
//           number + title top left, word by word; rows bottom right, one after
//           another, each rule drawing right → left with its title following.
//           Scroll steps through the items; the selected one opens and fills
//           solid brand blue, swept in right → left. Clicking a row jumps the
//           scroll to it. Past its last item, the group clears and the next loads.

// The rows' column: 33% of the width less one grid column (a 10-col grid with
// 20px margins and 10px gutters) off its left edge — ≈ 340px at 1440.
const DOT = 20, DOT_GAP = 10        // group-guide circles (left edge, centred)
const PANEL = 'w-full md:w-[calc(33%-(100%-30px)/10)]'
const FOLLOW = 7                    // scrub easing for the RFA exit (1/s)

// Timeline, in vh of scroll.
const RFA_HOLD = 40, RFA_OUT = 70
const G_STEP = 60                   // per item
const GROUPS_AT = RFA_HOLD + RFA_OUT * .85

// Group load-in timings (s).
const LOAD_DELAY = .35       // lets the previous group clear first
const ROW_STAGGER = .12
const RULE_S = 1.1
const TEXT_LAG = .25
const SWEEP_MS = 650
const MOVE = '.6s cubic-bezier(.16,1,.3,1)'
const PAD_Y = 18             // min space above / below a row's text
const ROW_MAX = 115          // tallest a closed row grows to fill spare height
const BLUE = '85,166,255'
const DOTS_OUT_MS = 450      // grid clears this fast when a new group loads…
const DOTS_IN_S = 1.6        // …then drifts back in over this long

type Item = { title: string; text?: string }
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'Structures\nDelivered', items: [
    { title: 'Payload Fairing', text: 'The aerodynamic composite shell protecting payloads during ascent, engineered for high stiffness, low mass, and resistance to dynamic pressure and acoustic loads.' },
    { title: 'Stage-Separation Structures', text: 'Composite flanges and rings enabling reliable separation under precise load paths and tight tolerances.' },
    { title: 'Redshift Orbital Transfer Vehicle (Third Stage) Main Structure', text: 'The full composite structure of the orbital transfer vehicle responsible for final orbital insertion.' },
  ] },
  { title: 'Engineering', items: [
    { title: 'Structural Analysis (static & dynamic)', text: 'Finite-element analysis for static loads, buckling, and strength verification; dynamic analysis of vibration, acoustics, and shock; load-case definition for ascent, staging, and orbital operations.' },
    { title: 'Composite Structural Design', text: 'Laminate design and optimisation for stiffness, mass, and manufacturability; ply-book development and structural substantiation.' },
    { title: 'Subsystem Integration Engineering', text: 'Mechanical interfaces, separation systems, avionics mounting, and thermal-protection integration; tolerance management and assembly sequencing.' },
  ] },
  { title: 'Manufacturing', items: [
    { title: 'Autoclave Composite Manufacturing', text: 'High-performance carbon-fiber structures cured under pressure and temperature, for primary structures requiring maximum strength and minimal mass.' },
    { title: 'Out-of-Autoclave (OoA) Composite Manufacturing', text: 'Cost-efficient production using aerospace-grade OoA prepregs, suited to serial manufacturing of launcher components.' },
    { title: 'Manufacturing Strategy & Industrialization', text: 'Production flows, tooling concepts, and repeatable processes, with quality-assurance systems aligned to aerospace standards.' },
    { title: 'Jigs & Tooling Design and Fabrication', text: 'Custom assembly jigs, curing tools, and metrology-ready tooling for high dimensional accuracy and repeatability.' },
    { title: 'Subsystem Integration & Assembly', text: 'Mechanical assembly with metallic interfaces, fasteners, and separation systems; integration of harnesses, brackets, and secondary structures.' },
  ] },
  { title: 'Testing', items: [
    { title: 'Large-Structure Mechanical Testing', text: 'Static load tests, proof tests, stiffness characterisation, and full-scale qualification and acceptance testing.' },
    { title: 'Environmental Testing Support', text: 'Vibration, thermal cycling, and acoustic testing, in collaboration with partner facilities.' },
    { title: 'Dimensional & NDI Inspection', text: 'Laser-tracker metrology for large assemblies, and ultrasonic non-destructive inspection of composite laminates.' },
  ] },
]


// Where each group starts on the timeline.
const STARTS = GROUPS.reduce<number[]>((acc, g, i) => [...acc, i ? acc[i - 1] + GROUPS[i - 1].items.length * G_STEP : GROUPS_AT], [])
const TOTAL = STARTS[STARTS.length - 1] + GROUPS[GROUPS.length - 1].items.length * G_STEP + 20

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
const easeIn = (t: number) => t * t * t
// Gentle ease in, longer ease out (same sweep as the Engineering table).
const smooth = (t: number) => 1 - (1 - t * t * (3 - 2 * t)) ** 2

type Pos = { pinned: boolean; leaving: boolean; group: number; item: number }

export function RfaCapabilities() {
  const wrapRef = useRef<HTMLElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const dotsIn = useRef(0)
  const [pos, setPos] = useState<Pos>({ pinned: false, leaving: false, group: -1, item: 0 })
  const [vh, setVh] = useState(900)

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let raf = 0, last = performance.now(), cur = 0, prev = '', dotsGroup = -1, dotsOutUntil = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const wrap = wrapRef.current
      if (!wrap) return
      const dt = Math.min(.05, Math.max(0, (t - last) / 1000))
      last = t
      const h = window.innerHeight, b = wrap.getBoundingClientRect()
      const s = -b.top / h * 100                     // vh scrolled into the pinned stretch
      cur += (Math.max(0, Math.min(TOTAL, s)) - cur) * (1 - Math.exp(-FOLLOW * dt))

      // Discrete state (what's loaded / selected) — only re-render on change.
      let group = -1
      STARTS.forEach((st, i) => { if (s >= st) group = i })
      const item = group < 0 ? 0 : Math.max(0, Math.min(GROUPS[group].items.length - 1, Math.floor((s - STARTS[group]) / G_STEP)))
      const next: Pos = { pinned: s >= -.5, leaving: s > RFA_HOLD, group, item }
      const key = JSON.stringify(next)
      if (key !== prev) { prev = key; setPos(next) }

      // Dots drift in (on time) once the first group loads.
      // Dots: every time a group loads, the grid clears quickly (drifting back
      // out to the sides) and then drifts in again.
      if (group !== dotsGroup) { if (dotsGroup >= 0 || dotsIn.current > 0) dotsOutUntil = t + DOTS_OUT_MS; dotsGroup = group }
      const dotsRate = t < dotsOutUntil || group < 0 ? -1000 / DOTS_OUT_MS : 1 / DOTS_IN_S
      dotsIn.current = Math.max(0, Math.min(1, dotsIn.current + dotsRate * dt))

      // "RFA One" slides down off the screen, word by word (scrubbed).
      const o = clamp01((cur - RFA_HOLD) / RFA_OUT)
      wordRefs.current.forEach((w, i) => {
        // Right → left: "One" goes first, then "RFA".
        const order = wordRefs.current.length - 1 - i
        if (w) w.style.transform = `translateY(calc(${easeIn(clamp01(o * 1.5 - order * .5))} * (100% + 60px)))`
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Click → scroll to the middle of that item's stretch.
  const goTo = (gi: number, i: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const s = STARTS[gi] + (i + .5) * G_STEP
    window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY + s / 100 * window.innerHeight, behavior: 'instant' })
  }

  return (
    <section ref={wrapRef} aria-label="RFA One" style={{ position: 'relative', height: `${100 + TOTAL}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Dotted grid — drifts in from the sides each time a group loads */}
        <DotGrid cols={15} progressRef={dotsIn} strength={1.8} />

        {/* Intro paragraph — rises in line by line once the stage locks */}
        <div className="px-5 flex md:justify-end" style={{ position: 'absolute', left: 0, right: 0, top: 110 }}>
          <RevealText by="line" ready={pos.pinned && !pos.leaving} ownView={false} className="w-full md:w-[33%]"
            text="NEO, in partnership with CEiiA, designed, engineered, manufactured, and tested several of the most critical composite assemblies for RFA ONE, the orbital launcher developed by Rocket Factory Augsburg (RFA), recognized as Portugal's largest space-structures initiative to date."
            style={{ fontFamily: FONT.sans, fontSize: 'clamp(16px, 1.65vw, 24px)', lineHeight: 1.3, color: 'rgba(255,255,255,.86)', margin: 0, paddingLeft: 20 }} />
        </div>

        {/* RFA One — 40px off the bottom */}
        <h2 aria-label="RFA One" style={{
          position: 'absolute', left: 20, right: 20, bottom: 40, margin: 0, whiteSpace: 'nowrap',
          fontFamily: FONT.sans, fontWeight: 400, fontSize: '21.6vw', lineHeight: .74, letterSpacing: '-.03em', color: '#f4f4f4',
        }}>
          {['RFA', 'One'].map((w, i) => (
            <span key={w} ref={el => { wordRefs.current[i] = el }} aria-hidden style={{ display: 'inline-block', marginRight: i ? 0 : '.22em', willChange: 'transform' }}>
              <RevealText as="span" text={w} delay={i * .08} />
            </span>
          ))}
        </h2>

        {GROUPS.map((g, gi) => (
          <Group key={g.title} n={gi + 1} {...g} loaded={pos.group === gi} active={pos.group === gi ? pos.item : 0}
            vh={vh} onPick={i => goTo(gi, i)} />
        ))}

        {/* Guide — one circle per group, left edge, vertically centred; the current one white */}
        <nav aria-label="Capability groups" style={{
          position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: DOT_GAP,
          opacity: pos.group >= 0 ? 1 : 0, pointerEvents: pos.group >= 0 ? 'auto' : 'none', transition: 'opacity .6s ease',
        }}>
          {GROUPS.map((g, gi) => (
            <button key={g.title} type="button" aria-label={`${String(gi + 1).padStart(2, '0')} ${g.title.replace('\n', ' ')}`}
              aria-current={pos.group === gi ? 'step' : undefined} onClick={() => goTo(gi, 0)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                width: DOT, height: DOT, padding: 0, border: 0, borderRadius: '50%', cursor: 'pointer',
                background: pos.group === gi ? '#fff' : 'rgba(255,255,255,.3)', transition: 'background .4s ease',
              }} />
          ))}
        </nav>
      </div>
    </section>
  )
}

function Group({ n, title, items, loaded, active, vh, onPick }: {
  n: number; title: string; items: Item[]; loaded: boolean; active: number; vh: number; onPick: (i: number) => void
}) {
  // Row sizes share out the height between the nav and the bottom margin, so
  // the longest list still fits — but never less than a row's own text needs
  // (titles run to two or three lines in this column).
  const avail = vh - 104 - 40
  const openMin = Math.min(380, avail * .5)
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([])
  const textRefs = useRef<(HTMLSpanElement | null)[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<{ title: number[]; text: number[] }>({ title: [], text: [] })
  // Text scale for this group's rows: 1, or a little less when its list would
  // otherwise run past the nav (Manufacturing's five long titles).
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => setScale(1), [vh])
  useLayoutEffect(() => {
    const el = panelRef.current
    if (!el) return
    const measure = () => setFit({
      title: items.map((_, i) => titleRefs.current[i]?.offsetHeight ?? 0),
      text: items.map((_, i) => textRefs.current[i]?.offsetHeight ?? 0),
    })
    measure()
    document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items, vh, scale])
  // What each row's text needs, closed and open.
  const needClosed = (i: number) => (fit.title[i] ?? 0) + 2 * PAD_Y
  const needOpen = (i: number) => (fit.title[i] ?? 0) + (fit.text[i] ?? 0) + 2 * PAD_Y + 36
  // Heights with row `a` open: each row gets what its text needs, then any
  // height left over goes to the open card (up to openMin) and the closed
  // rows (up to ROW_MAX each).
  const heightsFor = (a: number) => {
    const base = items.map((_, i) => i === a ? needOpen(i) : needClosed(i))
    let spare = Math.max(0, avail - base.reduce((x, y) => x + y, 0))
    const openExtra = Math.min(spare, Math.max(0, openMin - base[a]))
    spare -= openExtra
    return base.map((h, i) => i === a ? h + openExtra : h + Math.min(spare / (items.length - 1), Math.max(0, ROW_MAX - h)))
  }
  const heights = heightsFor(loaded ? active : -1)
  useLayoutEffect(() => {
    if (!fit.title.length) return
    const need = Math.max(...items.map((_, a) => items.reduce((sum, _, i) => sum + (i === a ? needOpen(i) : needClosed(i)), 0)))
    // Nudge towards the largest size that fits (a few re-measures settle it).
    if (need > avail + 1 && scale > .6) setScale(sc => Math.max(.6, sc * (avail / need) ** .5))
    else if (need * 1.1 < avail && scale < 1) setScale(sc => Math.min(1, sc * 1.03))
  }, [fit]) // eslint-disable-line react-hooks/exhaustive-deps
  const sweptRef = useRef(false)
  // True while the group is playing its load-in (so the open row's text waits for its title).
  const firstLoad = useRef(true)
  useEffect(() => { if (!loaded) firstLoad.current = true }, [loaded])
  useEffect(() => { if (loaded && active >= 0) { const id = setTimeout(() => { firstLoad.current = false }, 50); return () => clearTimeout(id) } }, [loaded, active])

  // Sweep the selected row's fill right → left: the leading edge fades blue →
  // nothing and firms up to solid as it lands. On loading, the selected row's
  // fill draws in with its row, like the other rows' rules (the first row's
  // comes first); later picks sweep at once.
  useLayoutEffect(() => {
    if (!loaded) { sweptRef.current = false; return }
    const el = fillRefs.current[active]
    if (!el) return
    const paint = (k: number) => {
      const e = smooth(clamp01(k / .8)), tail = smooth(clamp01((k - .25) / .75))
      el.style.background = `linear-gradient(to left, rgb(${BLUE}) 0%, rgba(${BLUE},${tail}) ${e * 100}%)`
    }
    paint(0)
    const first = !sweptRef.current
    const wait = first ? (LOAD_DELAY + active * ROW_STAGGER) * 1000 : 0
    const dur = first ? RULE_S * 1000 : SWEEP_MS
    sweptRef.current = true
    let raf = 0
    const start = performance.now() + wait
    const frame = (t: number) => {
      const k = clamp01((t - start) / dur)
      paint(k)
      if (k < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [active, loaded, items.length])

  const head = { fontFamily: FONT.medium, fontWeight: 500, fontSize: 'clamp(40px, 4.2vw, 60px)', lineHeight: 1, letterSpacing: '-.5px', color: '#fff', margin: 0 } as const

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: loaded ? 'auto' : 'none' }}>
      {/* Number + title — top left, just below the nav */}
      <div className="flex" style={{ position: 'absolute', left: 20, top: 110, gap: 'clamp(24px, 4.5vw, 64px)' }}>
        <RevealText as="span" text={String(n).padStart(2, '0')} ready={loaded} ownView={false} delay={loaded ? LOAD_DELAY : 0} style={head} />
        <RevealText as="h3" text={title} ready={loaded} ownView={false} delay={loaded ? LOAD_DELAY + .08 : 0} style={head} />
      </div>

      {/* Rows — bottom right */}
      <div ref={panelRef} className={PANEL} style={{ position: 'absolute', right: 20, bottom: 40 }}>
        {items.map((it, i) => {
          const on = loaded && i === active
          const delay = loaded ? LOAD_DELAY + i * ROW_STAGGER : 0
          return (
            <button key={it.title} type="button" aria-expanded={on} tabIndex={loaded ? 0 : -1} onClick={() => onPick(i)}
              className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
              style={{
                position: 'relative', display: 'block', width: '100%', height: heights[i], padding: 0, border: 0,
                background: 'none', cursor: on ? 'default' : 'pointer', textAlign: 'left', transition: `height ${MOVE}`,
                color: on ? '#fff' : 'rgba(255,255,255,.3)',
              }}>
              {/* Fill — solid brand blue once swept in */}
              <span ref={el => { fillRefs.current[i] = el }} aria-hidden style={{
                position: 'absolute', inset: 0, borderRadius: 6, opacity: on ? 1 : 0, transition: on ? 'none' : 'opacity .35s ease',
              }} />
              {/* Rule draws right → left */}
              <span aria-hidden style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'rgba(255,255,255,.3)',
                transformOrigin: '100% 50%', transform: `scaleX(${loaded ? 1 : 0})`,
                transition: loaded ? `transform ${RULE_S}s ${delay}s cubic-bezier(.33,1,.68,1)` : 'transform .4s ease-in',
              }} />
              <span ref={el => { titleRefs.current[i] = el }} style={{
                position: 'absolute', left: 20, right: 20, top: on ? PAD_Y + 6 : '50%', transform: on ? 'none' : 'translateY(-50%)',
                transition: `top ${MOVE}, transform ${MOVE}, color .4s ease`,
              }}>
                <RevealText as="span" text={it.title} ready={loaded} ownView={false} delay={loaded ? delay + TEXT_LAG : 0} style={{
                  fontFamily: FONT.medium, fontWeight: 500, fontSize: `calc(min(33px, 3.9vh) * ${scale})`, lineHeight: 1.05, display: 'block',
                }} />
              </span>
              <span ref={el => { textRefs.current[i] = el }} style={{
                position: 'absolute', left: 20, width: 'calc((100% - 40px) * .9)', bottom: PAD_Y + 4,
                fontFamily: FONT.sans, fontSize: `calc(min(19.5px, 2.3vh) * ${scale})`, lineHeight: 1.25, color: it.text ? '#fff' : 'rgba(255,255,255,.7)',
                // Lines reveal one by one when the row opens (after its title on
                // load); closing, the whole block just fades quickly.
                opacity: on ? 1 : 0, transition: on ? 'none' : 'opacity .2s ease',
              }}>
                <RevealText by="line" text={it.text ?? 'Details to follow'} ready={on} ownView={false}
                  delay={on ? (firstLoad.current ? delay + TEXT_LAG + .35 : .3) : 0} style={{ margin: 0 }} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
