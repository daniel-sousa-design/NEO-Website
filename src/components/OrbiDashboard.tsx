import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { FONT } from '../lib/fonts'
import { NeoMark3D } from './NeoMark3D'

// ─── ORBI dashboard ───────────────────────────────────────────────────────────
// The ORBI ground-segment dashboard (from the NEO_ORBI_Dash mockup), drawn in
// code so it can sit anywhere at any width — every size is in container units
// (cqw), so it scales as one piece. Drop it into any box:
//
//   <OrbiDashboard style={{ width: '100%' }} />
//
// It runs "live" on example data: a UTC clock (analogue) with Lisbon time and
// the date, and a Live Preview panel whose countdowns and counters tick. The
// four module buttons — Plan, Command, Monitor, Process — take turns every 3 s
// (or on click, which restarts the 3 s), and the Live Preview shows the chosen
// module. Each switch sends a wave through the ORBI wordmark: letter by letter,
// left to right, its weight dips to the lightest and returns.
//
// Only runs while on screen.

// The mockup's drawing size — every position below is in its pixels. (The
// mockup is 2000 × 1140; widened to 2016 × 1138 so the frame's padding is
// 33px on all four sides.)
const W = 2016, H = 1138
const u = (n: number) => `${(n / W) * 100}cqw`
const box = (x: number, y: number, w: number, h: number): CSSProperties =>
  ({ position: 'absolute', left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` })

const BLUE = '#55a6ff'
const STEP_MS = 3000
const WAVE_MS = 900, WAVE_STAGGER = 90   // wordmark wave: per letter, delay between letters
const BITCOUNT = { fontFamily: FONT.bitcount, textTransform: 'uppercase', fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0' } as const
const MONO = { fontFamily: FONT.mono, fontSize: u(13), letterSpacing: '.08em', textTransform: 'uppercase', lineHeight: 1.3 } as const

type Mode = 'plan' | 'command' | 'monitor' | 'process'
const MODES: { id: Mode; name: string }[] = [
  { id: 'plan', name: 'Plan' }, { id: 'command', name: 'Command' }, { id: 'monitor', name: 'Monitor' }, { id: 'process', name: 'Process' },
]

// ── Example data (from the ORBI dashboard prototype) ──
const SATS = ['NEO-01', 'NEO-02', 'NEO-03'], STATIONS = ['Santa Maria (PT)', 'Sintra (PT)', 'Porto Santo (PT)']
const p2 = (n: number) => String(n).padStart(2, '0')
const hms = (s: number) => `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`
const countdown = (now: number) => 900 - (Math.floor(now / 1000) % 900)        // next pass every 15 min
const battery = (now: number, base: number, k: number) => `${(base + .3 * Math.sin(now / 4000 + k)).toFixed(1)}%`

type View = { label: string; big: string; cols: [string, string][] }
function view(mode: Mode, now: number, t0: number): View {
  const ingested = 186 + Math.floor((now - t0) / 8000)
  switch (mode) {
    case 'plan': {
      const i = Math.floor(now / 900000)
      return { label: 'Next pass', big: `T-${hms(countdown(now))}`, cols: [['Satellite', SATS[i % 3]], ['Station', STATIONS[(i + 1) % 3]], ['Duration', `00:${p2(7 + (i % 4))}:00`]] }
    }
    case 'command':
      return { label: 'Queued commands', big: '04', cols: [['Verified', '3'], ['Approval', '1'], ['Next uplink', `T-${hms(countdown(now))}`]] }
    case 'monitor':
      return { label: 'Satellites linked', big: '3 / 3', cols: [['NEO-01', battery(now, 87.2, 0)], ['NEO-02', battery(now, 91, 1)], ['NEO-03', battery(now, 74.1, 2)]] }
    case 'process':
      return { label: 'Frames ingested today', big: String(ingested), cols: [['Calibrated', String(ingested - 25)], ['Georeferenced', String(ingested - 44)], ['Delivered', String(ingested - 124)]] }
  }
}

export function OrbiDashboard({ style, className }: { style?: CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(false)
  const [mode, setMode] = useState(0)
  const [cycle, setCycle] = useState(0)          // bumped on a click, to restart the 3 s
  const [now, setNow] = useState(() => Date.now())
  const [zone, setZone] = useState(ZONES[0])     // the Timer's time zone
  const t0 = useRef(Date.now())

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  // Clock + counters, once a second.
  useEffect(() => {
    if (!onScreen) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [onScreen])
  // Modules take turns every 3 s.
  useEffect(() => {
    if (!onScreen) return
    const id = setInterval(() => setMode(m => (m + 1) % MODES.length), STEP_MS)
    return () => clearInterval(id)
  }, [onScreen, cycle])
  const pick = (i: number) => { setMode((i + MODES.length) % MODES.length); setCycle(c => c + 1) }

  const m = MODES[mode], v = view(m.id, now, t0.current)
  const d = new Date(now)
  const zoneTime = new Intl.DateTimeFormat('en-GB', { timeZone: zone.tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', timeZone: zone.tz }).replace(',', '').toUpperCase()

  return (
    <div ref={ref} role="group" aria-label="ORBI ground-segment dashboard, with example data" className={className}
      style={{ containerType: 'inline-size', position: 'relative', aspectRatio: `${W} / ${H}`, background: '#222', borderRadius: u(24), overflow: 'hidden', color: '#fff', ...style }}>

      {/* ORBI — brand tile; the wordmark waves on every module switch */}
      <div style={{ ...box(33, 32, 617, 622), background: BLUE, borderRadius: u(18) }}>
        <span style={{ ...MONO, position: 'absolute', left: u(29), top: u(28), fontSize: u(17), color: '#000', whiteSpace: 'pre' }}>{'NEO\nSpace engineering\nfor Earth'}</span>
        <Pill style={{ position: 'absolute', right: u(22), top: u(30) }}>Ground Segment</Pill>
        {/* centred in the tile */}
        <OrbiWord wave={mode} style={{ position: 'absolute', left: '50%', bottom: u(18), transform: 'translateX(-50%)', fontSize: u(226), lineHeight: .8 }} />
      </div>

      {/* Live preview — shows the current module */}
      <div style={{ ...box(671, 32, 682, 622), background: '#000', borderRadius: u(18) }}>
        <span style={{ ...MONO, position: 'absolute', left: u(23), top: u(22), color: '#9a9a9a' }}>Live preview</span>
        <Pill key={m.id} className="neo-hint-in" style={{ position: 'absolute', right: u(25), top: u(30) }}>{m.name}</Pill>
        <div key={m.id + '-pv'} className="neo-hint-in" style={{ position: 'absolute', inset: 0 }}>
          <span style={{ ...MONO, position: 'absolute', left: u(26), top: u(115), color: '#fff' }}>{v.label}</span>
          <span style={{ position: 'absolute', left: u(24), top: u(220), fontFamily: FONT.sans, fontSize: u(78), lineHeight: 1, letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>{v.big}</span>
          <span aria-hidden style={{ position: 'absolute', left: u(23), right: u(25), top: u(309), height: 1, background: '#444' }} />
          {v.cols.map(([k, val], i) => (
            <span key={k} style={{ position: 'absolute', left: u([26, 252, 469][i]), top: u(351), width: u(i === 2 ? 200 : 210) }}>
              <span style={{ ...MONO, display: 'block', color: '#fff' }}>{k}</span>
              <span style={{ display: 'block', marginTop: u(76), fontFamily: FONT.sans, fontSize: u(38), lineHeight: 1.15, whiteSpace: val.startsWith('T-') ? 'nowrap' : 'normal' }}>{val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* NEO mark — solid, turning a full 360° on every module switch */}
      <div style={{ ...box(1374, 32, 301, 300), background: '#000', borderRadius: u(18), display: 'grid', placeItems: 'center', perspective: u(700) }}>
        <NeoMark3D turn={mode} width={u(301 * .62)} finish="dark" />
      </div>

      {/* Timer — analogue UTC clock, Lisbon time, date */}
      <div style={{ ...box(1695, 32, 288, 300), background: '#000', borderRadius: u(18) }}>
        <Clock date={d} zone={zone} />
        {/* "Timer" and the zone picker share one row, centred on each other */}
        <div style={{ position: 'absolute', left: u(22), right: u(11), top: u(17), display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <span style={{ ...MONO, color: '#9a9a9a' }}>Timer</span>
          <ZonePicker zone={zone} onPick={setZone} />
        </div>
        {/* place + time and date — all in the chosen zone */}
        <span style={{ ...MONO, position: 'absolute', left: u(22), bottom: u(16), fontSize: u(12), color: '#fff' }}>{zone.place} {zoneTime}</span>
        <span style={{ ...MONO, position: 'absolute', right: u(22), bottom: u(16), fontSize: u(12), color: '#fff' }}>{date}</span>
      </div>

      {/* Enter ORBI */}
      <div style={{ ...box(1374, 355, 609, 299), background: BLUE, borderRadius: u(18) }}>
        <span style={{ ...MONO, position: 'absolute', left: u(29), top: u(27), color: '#fff' }}>Full suite</span>
        <span style={{ position: 'absolute', left: u(30), bottom: u(30), display: 'flex', alignItems: 'baseline', gap: u(20), fontSize: u(62), lineHeight: 1 }}>
          <span style={{ fontFamily: FONT.sans }}>Enter</span>
          <OrbiWord />
        </span>
        <DotChevron dir={1} style={{ position: 'absolute', right: u(22), bottom: u(38), width: u(28) }} />
      </div>

      {/* Modules */}
      {MODES.map((md, i) => {
        const on = i === mode
        return (
          <button key={md.id} type="button" aria-pressed={on} onClick={() => pick(i)}
            className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            style={{
              ...box(33 + i * 451, 675, 429, 430), border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', borderRadius: u(18),
              background: on ? '#505050' : '#2a2a2a', color: on ? '#e8e8e8' : '#6f6f6f', transition: 'background .45s ease, color .45s ease',
            }}>
            <span style={{ position: 'absolute', left: u(22), top: u(40), fontFamily: FONT.sans, fontSize: u(62), lineHeight: 1 }}>{p2(i + 1)}</span>
            <span style={{ position: 'absolute', left: u(22), bottom: u(18), fontFamily: FONT.sans, fontSize: u(66), lineHeight: 1, letterSpacing: '-.01em' }}>{md.name}</span>
          </button>
        )
      })}

      {/* Previous / next */}
      <div style={{ ...box(1835, 680, 148, 95), background: '#2a2a2a', borderRadius: u(14), display: 'flex' }}>
        {[-1, 1].map(dir => (
          <button key={dir} type="button" aria-label={dir < 0 ? 'Previous module' : 'Next module'} onClick={() => pick(mode + dir)}
            className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            style={{ flex: 1, border: 0, background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', borderLeft: dir > 0 ? '1px solid #555' : 0, padding: 0 }}>
            <DotChevron dir={dir} style={{ width: u(28) }} color="#9a9a9a" />
          </button>
        ))}
      </div>

      {/* Busy ring + signal burst */}
      <DotRing style={{ ...box(1835, 792, 148, 148), background: '#000', borderRadius: u(14), display: 'grid', placeItems: 'center' }} />
      <div style={{ ...box(1835, 957, 148, 148), background: '#000', borderRadius: u(14), display: 'grid', placeItems: 'center' }}><DotBurst /></div>

      <style>{`
        @keyframes orbi-wave { 0% { font-weight: 500 } 40% { font-weight: 100 } 100% { font-weight: 500 } }
        @keyframes orbi-turn-once { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        @keyframes orbi-pulse { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { [style*="orbi-"] { animation: none !important } }
      `}</style>
    </div>
  )
}

/** The ORBI wordmark in Bitcount, B–I tightened. With `wave`, every change of
 *  its value sends a weight wave through the letters, left to right. */
function OrbiWord({ wave, style }: { wave?: number; style?: CSSProperties }) {
  return (
    <span aria-label="ORBI" style={{ ...BITCOUNT, display: 'inline-block', whiteSpace: 'nowrap', fontWeight: 500, ...style }}>
      {'ORBI'.split('').map((ch, i) => (
        <span key={`${wave ?? 0}-${i}`} aria-hidden style={{
          display: 'inline-block', marginLeft: ch === 'I' ? '-.1em' : undefined,
          animation: wave === undefined ? undefined : `orbi-wave ${WAVE_MS}ms ${i * WAVE_STAGGER}ms cubic-bezier(.45,0,.25,1) both`,
        }}>{ch}</span>
      ))}
    </span>
  )
}

// ── Timer time zones ──
type Zone = { label: string; name: string; short: string; place: string; tz: string }
const ZONES: Zone[] = [
  { label: 'UTC', name: 'Coordinated Universal Time', short: 'Universal', place: 'UTC', tz: 'UTC' },
  { label: 'LIS', name: 'Lisbon', short: 'Lisbon', place: 'Lisbon', tz: 'Europe/Lisbon' },
  { label: 'LON', name: 'London', short: 'London', place: 'London', tz: 'Europe/London' },
  { label: 'CET', name: 'Paris and Berlin', short: 'Paris', place: 'Paris', tz: 'Europe/Paris' },
  { label: 'NYC', name: 'New York', short: 'New York', place: 'New York', tz: 'America/New_York' },
  { label: 'SAO', name: 'São Paulo', short: 'São Paulo', place: 'São Paulo', tz: 'America/Sao_Paulo' },
  { label: 'TYO', name: 'Tokyo', short: 'Tokyo', place: 'Tokyo', tz: 'Asia/Tokyo' },
]
/** How far `tz`'s wall clock is ahead of UTC at `date`, in ms. */
function zoneOffset(date: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    .formatToParts(date).map(x => [x.type, x.value]))
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(date.getTime() / 1000) * 1000
}

/** The Timer's zone pill: label + caret, opening a list of time zones. */
function ZonePicker({ zone, onPick }: { zone: Zone; onPick: (z: Zone) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key) }
  }, [open])
  const text = { ...MONO, fontSize: u(12), letterSpacing: '.04em', color: '#fff' } as const
  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`Time zone: ${zone.name}`} onClick={() => setOpen(o => !o)}
        className="focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        style={{ ...text, display: 'inline-flex', alignItems: 'center', gap: u(8), padding: `${u(4)} ${u(10)}`, border: 0, borderRadius: u(6), background: open ? '#3a3a3a' : '#222', cursor: 'pointer' }}>
        {zone.label}
        <svg viewBox="0 0 10 6" aria-hidden style={{ width: u(9), display: 'block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }}>
          <path d="M1 1l4 4 4-4" fill="none" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Time zone" className="neo-hint-in" style={{
          position: 'absolute', right: 0, top: `calc(100% + ${u(6)})`, margin: 0, padding: u(5), listStyle: 'none',
          background: '#222', borderRadius: u(8), boxShadow: '0 8px 24px rgba(0,0,0,.5)', minWidth: u(150),
        }}>
          {ZONES.map(z => {
            const on = z.tz === zone.tz
            return (
              <li key={z.tz} role="option" aria-selected={on}>
                <button type="button" aria-label={z.name} onClick={() => { onPick(z); setOpen(false) }}
                  className="hover:!bg-[#3a3a3a]"
                  style={{ ...text, width: '100%', display: 'flex', justifyContent: 'space-between', gap: u(10), padding: `${u(4)} ${u(7)}`, border: 0, borderRadius: u(4), background: 'transparent', cursor: 'pointer', color: on ? '#55a6ff' : '#fff', textAlign: 'left' }}>
                  <span>{z.label}</span><span style={{ color: on ? '#55a6ff' : '#8a8a8a', textTransform: 'none', letterSpacing: 0, whiteSpace: 'nowrap' }}>{z.short}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Pill({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <span className={className} style={{ ...MONO, letterSpacing: '.02em', textTransform: 'none', padding: `${u(13)} ${u(14)}`, borderRadius: u(6), background: '#222', color: '#fff', whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  )
}

// Every dotted element (clock, chevrons, refresh ring) uses the burst tile's dot
// size: ≈ 7.65 mockup px across. Radii below are that, in each drawing's own units.
const DOT_R = 4.43   // clock (viewBox 200, drawn at 60% of a 288px tile)

/** Analogue clock: dots for the hours, bars at the quarters, hour + minute hands, outlined seconds needle. */
function Clock({ date, zone }: { date: Date; zone: Zone }) {
  // Angles keep counting up (rather than wrapping at 360°) so the hands never sweep backwards.
  const t = Math.floor((date.getTime() + zoneOffset(date, zone.tz)) / 1000) % 864000
  const secDeg = t * 6, minDeg = t / 10, hourDeg = t / 120
  const label = new Intl.DateTimeFormat('en-GB', { timeZone: zone.tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
  return (
    <svg viewBox="-100 -100 200 200" aria-label={`${zone.label} ${label}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '60%', transform: 'translate(-50%, -52%)' }}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180, quarter = i % 3 === 0
        return quarter
          ? <rect key={i} x={-DOT_R} y={-82} width={DOT_R * 2} height={18} rx={DOT_R} fill="#fff" transform={`rotate(${i * 30})`} />
          : <circle key={i} cx={Math.cos(a) * 74} cy={Math.sin(a) * 74} r={DOT_R} fill="#fff" />
      })}
      <line x1={0} y1={0} x2={0} y2={-62} stroke="#fff" strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${minDeg})`} style={{ transition: 'transform .6s cubic-bezier(.34,1.4,.5,1)' }} />
      <line x1={0} y1={0} x2={0} y2={-38} stroke="#fff" strokeWidth={5} strokeLinecap="round" transform={`rotate(${hourDeg})`} />
      {/* seconds — a thin outlined needle */}
      <g transform={`rotate(${secDeg})`} style={{ transition: 'transform .35s cubic-bezier(.34,1.6,.5,1)' }}>
        <rect x={-1.6} y={-70} width={3.2} height={84} rx={1.6} fill="none" stroke="#fff" strokeWidth={1} />
        <circle r={4} fill="#000" stroke="#fff" strokeWidth={1} />
      </g>
    </svg>
  )
}

/** Chevron drawn in dots, pointing right (dir 1) or left (−1). */
function DotChevron({ dir, style, color = '#fff' }: { dir: number; style?: CSSProperties; color?: string }) {
  const pts = [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]]
  return (
    <svg viewBox="-1 -1 4 6" aria-hidden style={{ display: 'block', transform: dir < 0 ? 'scaleX(-1)' : undefined, ...style }}>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={.55} fill={color} />)}
    </svg>
  )
}

/** A dotted "refresh" ring ending in an upward arrowhead (dot positions traced
 *  from the reference drawing). Still until hovered; each hover gives it one
 *  full clockwise turn, coming back to rest where it started. */
const RING_DOTS = [
  [378, 190], [462, 170], [549, 177], [629, 211], [695, 268], [740, 344], [760, 429], [753, 516], [720, 598],
  [664, 664], [590, 710], [505, 731], [419, 724], [338, 690], [272, 633], [227, 558], [206, 473],   // ring, clockwise from the top
  [210, 351], [160, 398], [257, 398], [113, 446], [305, 446],                                       // arrowhead, pointing up
]
function DotRing({ style }: { style?: CSSProperties }) {
  const [turns, setTurns] = useState(0)
  return (
    <div style={style} onMouseEnter={() => setTurns(t => t + 1)}>
      <svg key={turns} viewBox="77 90 720 720" aria-hidden style={{ width: '62%', transformOrigin: '56% 50%', animation: turns ? 'orbi-turn-once 1.1s cubic-bezier(.65,0,.35,1) both' : undefined }}>
        {RING_DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={30} fill="#f2f2f2" />)}
      </svg>
    </div>
  )
}

/** Rings of dots radiating out, pulsing ring by ring. */
function DotBurst() {
  const rings = [[0, 1], [12, 6], [24, 12], [36, 16]]
  return (
    <svg viewBox="-50 -50 100 100" aria-hidden style={{ width: '76%' }}>
      {rings.map(([r, n], k) => (
        <g key={k} style={{ animation: `orbi-pulse 2.4s ${k * .25}s ease-in-out infinite` }}>
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 + k * .3
            return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={3.4} fill="#fff" />
          })}
        </g>
      ))}
    </svg>
  )
}
