import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { FONT } from '../lib/fonts'
import { RevealText } from './RevealText'
import { SweepButton } from './SweepButton'

// ─── ORBI segments ────────────────────────────────────────────────────────────
// The panels that follow System B's composition on the Systems page's sideways
// track: one card per ORBI segment, in the dashboard's language — a top box
// (number + name) over a bottom box (what it does, then its modules as
// buttons; pressing one fills it the lighter "selected" grey and smoothly
// opens that module's summary in the box, in small mono above the buttons;
// pressing again closes it; all start closed). Then a closing line. Each card
// plays itself in — boxes growing, then its text rising word by word and line
// by line — once it nears the middle of the screen, and back out once it
// slides into the left 5%. Cards sit 40px apart, 400px after the
// dashboard (`lead` tops up the gap the composition leaves), and the closing
// line 200px after them.

type Module = { name: string; label: string; text: string }
type Segment = { title: string; intro: string; modules: Module[] }

const SEGMENTS: Segment[] = [
  {
    title: 'Customer Segment',
    intro: 'A software that backs the commercial lifecycle of satellite products and services: customer engagement, service catalogues, quotation, contracting, order fulfilment, delivery, and customer relationship workflows.',
    modules: [
      { name: 'Ordering', label: 'Order', text: 'Management of customer requests, tasking submissions, order tracking, and fulfilment workflows.' },
      { name: 'Pricing', label: 'Price', text: 'Defines, calculates, and manages pricing models for satellite products and services, including quotation generation, commercial rules, tariffs, discounts, and billing integration.' },
      { name: 'Contracting', label: 'Contract', text: 'Software for commercial agreements, customer contracts, licensing, service-level agreements, approvals, renewals and compliance throughout the customer engagement lifecycle.' },
      { name: 'Catalogue', label: 'Catalogue', text: "Provides publishing and searching satellite missions' data, sensors, imagery derived products, services, data sets, and commercial offerings." },
    ],
  },
  {
    title: 'Fleet Operations Segment',
    intro: 'A software suite for planning, monitoring, controlling, and operating spacecraft and satellite constellations, including: mission planning, scheduling, flight dynamics, spacecraft monitoring and control, operational procedures, resource management, and mission execution.',
    modules: [
      { name: 'Control', label: 'Control', text: 'Spacecraft monitoring and control, telemetry, telecommand, subsystem monitoring health management, alarms, procedures, and mission operations.' },
      { name: 'Plan', label: 'Plan', text: 'Mission planning, scheduling, resource optimisation, acquisition planning, ground station scheduling, activity management, conflict resolution, and operational timeline generation.' },
      { name: 'Flight', label: 'Flight', text: 'Flight dynamics and orbital operations: orbit determination, propagation, manoeuvre planning, conjunction assessment, station keeping, attitude analysis, mission geometry, and orbit maintenance.' },
    ],
  },
  {
    title: 'Payload Data Segment',
    intro: 'A software suite for orchestrating, processing, calibrating, validating, managing, storing, cataloguing, and distributing satellite payload data and derived products through automated workflows and secure information services.',
    modules: [
      { name: 'Orchestrator', label: 'Orchestrate', text: 'Orchestrates payload operations and data workflows, including: automated execution of processing chains, resource allocation, workflow scheduling, service orchestration, and operational automation.' },
      { name: 'Processing', label: 'Process', text: 'Processes satellite payload data, including: image generation, radiometric and geometric corrections, orthorectification, calibration, product generation, quality assessment, and value-added data production.' },
      { name: 'DataHub', label: 'DataHub', text: 'Stores, catalogues, indexes, manages, distributes and provides secure access to satellite data products, metadata, archives, and related information services.' },
      { name: 'CalVal', label: 'CalVal', text: 'Calibrates and validates satellite payloads and derived products, including: instrument performance assessment, calibration campaign management, validation workflows, quality monitoring, and performance reporting.' },
    ],
  },
  {
    title: 'Common Segment',
    intro: 'Cross-cutting services shared across the ground segment.',
    modules: [
      { name: 'Identity & Access Management', label: 'Identity & Access Management', text: 'Software for authentication, authorisation, identity management, user administration, role-based access control, single sign-on, audit logging, security policy enforcement, and credential management.' },
      { name: 'Operations Monitor', label: 'Operations Monitor', text: 'Software for monitoring operational activities, system performance, infrastructure health, mission status, service availability, alerts, dashboards, analytics, logging, and operational reporting across the ground segment.' },
    ],
  },
  {
    title: 'Additional Tools',
    intro: '',
    modules: [
      { name: 'Mission Analysis', label: 'Mission Analysis', text: 'Software for mission design and analysis, including: orbit design, coverage analysis, visibility assessment, constellation analysis, access opportunities, mission performance evaluation, and trade-off studies.' },
      { name: 'Mission Simulator', label: 'Mission Simulator', text: 'For simulating spacecraft, payloads, ground systems, operational scenarios, environmental conditions, and mission workflows for development, testing, validation, operator training, and mission rehearsal.' },
    ],
  },
]

const CLOSING = 'Each module is available standalone, or as a full multi-constellation suite and can be customised to specific operational needs.'

const PANEL_W = 'clamp(380px, 40vw, 600px)'
const GAP = 200        // before the closing line and after it
const CARD_GAP = 40    // between cards
const COL = '((100vw - 30px) / 10)'   // one grid column + gutter (10 columns, 20px margins, 10px gutters)
const MONO = { fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, lineHeight: 1.35, margin: 0 } as const
// Cards are drawn in units of their own width (cqw), from the 1340px-wide reference.
const c = (n: number) => `${(n / 1340) * 100}cqw`
// Focus: the card nearest the middle of the screen is full size and "selected"
// (lighter grey, like the dashboard's active module); away from it cards shrink
// to nothing and darken.
const TOP = [42, 80], INK = [111, 232]   // grey levels: top box dark → light, its text dim → bright
// Which box grows first on the way in (the other follows; leaving reverses it).
const BOTTOM_FIRST = false
// Triggers, as fractions of the screen width (card centre): in once inside
// OUT_LEFT…IN_RIGHT; out once left of OUT_LEFT or right of OUT_RIGHT.
const OUT_LEFT = .05, IN_RIGHT = .65, OUT_RIGHT = .8
const IN_S = 1.6, OUT_S = 1   // play-in / play-out durations (s)
const CARD_OUT = 'orbi-card-out'
const TEXT_STAGGER = .35    // overlap between consecutive words / lines, as a share of each one's rise
const mix = (r: number[], t: number) => { const v = Math.round(r[0] + (r[1] - r[0]) * t); return `rgb(${v},${v},${v})` }

export function OrbiSegments({ lead = GAP }: { lead?: number }) {
  const cards = useRef<(HTMLElement | null)[]>([])

  // Each card plays itself in (on time, not scrubbed) once its centre comes
  // within the middle of the screen, and plays itself out once it slides into
  // the left 5% — or back off to the right. Its top box lightens with nearness
  // to the centre (that part follows the scroll).
  useEffect(() => {
    let raf = 0, last = performance.now()
    const g = new Map<HTMLElement, { p: number; on: boolean }>()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(.05, Math.max(0, (now - last) / 1000))
      last = now
      const W = window.innerWidth, mid = W / 2, reach = W * .55
      cards.current.forEach(el => {
        if (!el) return
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2
        const st = g.get(el) ?? { p: 0, on: false }
        // trigger in near the centre; out past the left 5% (or far off right)
        if (!st.on && cx > W * OUT_LEFT && cx < W * IN_RIGHT) st.on = true
        else if (st.on && (cx < W * OUT_LEFT || cx > W * OUT_RIGHT)) st.on = false
        const before = st.p
        st.p = Math.max(0, Math.min(1, st.p + (st.on ? dt / IN_S : -dt / OUT_S)))
        if (before > 0 && st.p === 0) el.dispatchEvent(new Event(CARD_OUT))   // fully out: the card resets
        g.set(el, st)
        const t = Math.max(0, 1 - Math.abs(cx - mid) / reach)
        const k = t * t * (3 - 2 * t)
        // In: the boxes grow from nothing, out from their top-left corners —
        // top box first, then the bottom one — and the text follows. Out plays
        // it in reverse: text, bottom box, top box.
        const gp = st.p
        const seg = (a: number, b: number) => Math.max(0, Math.min(1, (gp - a) / (b - a)))
        const grow = (p: number) => 1 - (1 - p) ** 3
        const [top, bottom] = [el.children[0], el.children[1]] as HTMLElement[]
        const first = grow(seg(0, .55)), second = grow(seg(.2, .75)), text = seg(.45, 1)
        const [topP, bottomP] = BOTTOM_FIRST ? [second, first] : [first, second]
        el.style.visibility = gp > 0 ? 'visible' : 'hidden'
        if (top) { top.style.transform = `scale(${topP})`; top.style.background = mix(TOP, k); top.style.color = mix(INK, k) }
        if (bottom) bottom.style.transform = `scale(${bottomP})`
        // Text in sequence (data-seq): number and title word by word, the
        // description line by line — each rising out of its own mask — then
        // the buttons fading up.
        const steps = +(el.dataset.steps || 1)
        const total = 1 + steps * TEXT_STAGGER
        el.querySelectorAll<HTMLElement>('[data-seq]').forEach(t => {
          const p = Math.max(0, Math.min(1, text * total - +t.dataset.seq! * TEXT_STAGGER))
          const e = 1 - (1 - p) ** 3
          if (t.dataset.fade !== undefined) { t.style.opacity = String(e); t.style.transform = `translateY(${(1 - e) * 14}px)` }
          else t.style.transform = `translateY(${(1 - e) * 115}%)`
        })
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    // The row of cards is centred vertically on the screen; the cards share a
    // top line within it. The closing line sits mid-screen, 200px after the
    // last card; the extra column of end padding stops the track one column
    // further along, so the line rests one column further left on screen.
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: `0 calc(${GAP}px + ${COL}) 0 ${Math.max(0, lead)}px` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: CARD_GAP, marginRight: GAP }}>
        {SEGMENTS.map((sg, i) => <Card key={sg.title} n={i + 1} sg={sg} cardRef={el => { cards.current[i] = el }} />)}
      </div>
      <RevealText text={CLOSING} style={{
        flex: 'none', width: `calc(clamp(320px, 30vw, 460px) + ${COL})`, fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(24px, 2.2vw, 32px)', lineHeight: 1.2, letterSpacing: '-.5px', color: '#fff', margin: 0,
      }} />
    </div>
  )
}

/** One segment: a top box (number + name) over a bottom box (what it does,
 *  its modules as buttons, and the opened module's summary in small mono). */
function Card({ n, sg, cardRef }: { n: number; sg: Segment; cardRef: (el: HTMLElement | null) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  // Keep the last summary while the box closes, so it collapses with its text in it.
  const [shown, setShown] = useState<number | null>(null)
  useEffect(() => { if (open !== null) setShown(open) }, [open])
  // Once the card has played itself out, any opened summary closes.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const reset = () => { setOpen(null); setShown(null) }
    el.addEventListener(CARD_OUT, reset)
    return () => el.removeEventListener(CARD_OUT, reset)
  }, [])
  const m = shown === null ? null : sg.modules[shown]
  const BOX: CSSProperties = { borderRadius: c(30), transform: 'scale(0)', transformOrigin: '0 0', willChange: 'transform' }
  // Sequence: number (0), title words (1…), description lines (after), buttons (last).
  // Description words get their line's step once laid out, and again on resize.
  const sectionRef = useRef<HTMLElement | null>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const sec = sectionRef.current
    if (!sec) return
    const base = 1 + sg.title.split(' ').length
    const measure = () => {
      let line = -1, lastTop = -Infinity
      introRef.current?.querySelectorAll<HTMLElement>('[data-w]').forEach(w => {
        if (w.offsetTop > lastTop + 2) { line++; lastTop = w.offsetTop }
        w.dataset.seq = String(base + line)
      })
      const end = base + line + 1
      if (buttonsRef.current) buttonsRef.current.dataset.seq = String(end)
      sec.dataset.steps = String(end)
    }
    measure()
    document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    if (introRef.current) ro.observe(introRef.current)
    return () => ro.disconnect()
  }, [sg])
  const big = { fontFamily: FONT.sans, fontWeight: 400, fontSize: c(92), lineHeight: 1, letterSpacing: '-.01em', margin: 0, color: 'inherit' } as const
  return (
    <section ref={el => { sectionRef.current = el; cardRef(el) }} aria-label={sg.title} style={{ flex: 'none', width: PANEL_W, containerType: 'inline-size', visibility: 'hidden' }}>
      {/* top — number and name; colour driven by focus */}
      <div style={{ ...BOX, position: 'relative', aspectRatio: '1340 / 557', background: mix(TOP, 0), color: mix(INK, 0) }}>
        <span style={{ ...big, position: 'absolute', left: c(50), top: c(48) }}><Masked words={[String(n).padStart(2, '0')]} seq={0} /></span>
        <h3 aria-label={sg.title} style={{ ...big, position: 'absolute', left: c(50), right: c(50), bottom: c(44) }}><Masked words={sg.title.split(' ')} seq={1} /></h3>
      </div>
      {/* bottom — description, the opened module's summary, then the module buttons; sized to its contents */}
      <div style={{ ...BOX, marginTop: c(24), background: '#222', padding: `${c(44)} ${c(48)} ${c(40)}`, display: 'flex', flexDirection: 'column' }}>
        {sg.intro && <p ref={introRef} aria-label={sg.intro} style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: c(40), lineHeight: 1.25, color: '#d6d6d6', margin: 0, maxWidth: c(1080) }}><Masked words={sg.intro.split(' ')} /></p>}
        {/* summary — opens and closes smoothly (0fr ↔ 1fr row) */}
        <div style={{ display: 'grid', gridTemplateRows: open !== null ? '1fr' : '0fr', transition: 'grid-template-rows .55s cubic-bezier(.16,1,.3,1)' }}>
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            {m && (
              <div key={m.name} style={{ paddingTop: sg.intro ? c(40) : 0, maxWidth: c(1080) }}>
                <RevealText by="line" text={m.text} ownView={false} ready={open !== null} style={{ ...MONO, color: '#a7a7a7' }} />
              </div>
            )}
          </div>
        </div>
        <div ref={buttonsRef} data-fade role="group" aria-label={`${sg.title} modules`} className="flex flex-wrap" style={{ opacity: 0, gap: c(24), marginTop: sg.intro || open !== null ? c(60) : 0, transition: 'margin-top .55s cubic-bezier(.16,1,.3,1)' }}>
          {sg.modules.map((md, i) => (
            // dark grey pills; hover and selected sweep to the lighter "selected" grey
            <SweepButton key={md.name} pressed={open === i} forced={open === i} onClick={() => setOpen(o => o === i ? null : i)} rgb="80,80,80"
              style={{ height: 34, padding: '0 14px', fontSize: 13, background: '#333' }} color="#8a8a8a" colorOn="#e8e8e8">
              {md.label}
            </SweepButton>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Words that each rise into view out of their own mask, left to right.
 *  With `seq`, word i is step seq + i; without, the step is set later
 *  (per line — see Card). Driven by the focus loop above. */
function Masked({ words, seq }: { words: string[]; seq?: number }) {
  return (
    <span aria-hidden>
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && ' '}
          <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '.18em', marginBottom: '-.18em' }}>
            <span data-w data-seq={seq === undefined ? undefined : seq + i} style={{ display: 'inline-block', transform: 'translateY(115%)', willChange: 'transform' }}>{w}</span>
          </span>
        </span>
      ))}
    </span>
  )
}
