import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { useInView } from '../hooks/useInView'
import { useSweep } from '../hooks/useSweep'
import { RevealText } from './RevealText'

// ─── News feed ────────────────────────────────────────────────────────────────
// Intro line, the featured article (photo left, details right), then Date /
// Tags filters over a two-column grid of article cards split by a thin rule.
//
//   Date      opens a calendar: pick a start and an end day
//   Tags      opens a box of the tag pills; picked tags show in the toggle
//   cards     hovering one widens it by a grid column, sweeps it to brand
//             blue, and desaturates the others
//   more      the next row peeks out under a fade to #222; "Load more" adds the
//             next two articles (and peeks the pair after, if any)
//
// Buttons fill with the same sweep on hover: "Read more" to blue (to white on
// a selected card), "Load more" to blue.

const BLUE = '#55a6ff', GOLD = '#d9ad14', AMBER = '#f0a92e'
const BLUE_RGB = '85,166,255'
const MONO_GREY = { fontFamily: FONT.mono, fontSize: 13, color: '#a7a7a7', letterSpacing: '.02em' } as const
const SHOWN = 4            // cards visible before "Load more"
const STEP = 2             // cards each "Load more" adds
const LOAD_MS = 1100       // the list opening up after "Load more"
const STEP_COL = '((100% + 10px) / 10)'   // one grid column (10 cols, 10px gutters), within the grid's width

type Article = { date: string; tag: string; color: string; title: string }
const FEATURED: Article & { img: string; alt: string } = {
  date: '2025-04-02', tag: 'Aeronautics', color: AMBER, title: 'CTI Aeroespacial is present in the LAAD2025',
  img: `${A}/insights/laad2025.jpg`, alt: 'Delegates, one in air-force uniform, talking at the LAAD 2025 defence and security fair',
}
// The first six are from the design; the rest are stand-ins until real articles exist.
const ARTICLES: Article[] = [
  { date: '2025-04-01', tag: 'CEiiA', color: BLUE, title: 'New Times, New Challenges | Competitiveness' },
  { date: '2025-03-04', tag: 'Space', color: GOLD, title: 'MH-1 First Year in Space' },
  { date: '2025-03-15', tag: 'Mobility', color: BLUE, title: 'Urban Air Mobility | The Future of Transport' },
  { date: '2025-02-22', tag: 'Innovation', color: GOLD, title: 'Sustainable Engineering for Tomorrow' },
  { date: '2025-04-30', tag: 'Energy', color: BLUE, title: 'Renewable Horizons | Powering the Future' },
  { date: '2025-03-10', tag: 'Technology', color: GOLD, title: 'AI Integration in Smart Grids' },
  { date: '2025-02-12', tag: 'Earth Observation', color: BLUE, title: 'Atlantic Constellation | First Data Products' },
  { date: '2025-01-28', tag: 'Partnerships', color: GOLD, title: 'New Space Portugal Partners Meet in Lisbon' },
  { date: '2025-01-15', tag: 'Radar', color: BLUE, title: 'Seeing Through Clouds | Radar for Forest Watch' },
  { date: '2024-12-10', tag: 'Launch', color: GOLD, title: 'RFA One Fairing Clears Qualification Testing' },
]
const TAGS = [...new Map(ARTICLES.map(a => [a.tag, a.color])).entries()]

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (s: string) => new Date(`${s}T12:00:00`)
const fmtDate = (s: string) => parse(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const fmtShort = (s: string) => parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

type Range = { start: string | null; end: string | null }

export function NewsFeed() {
  const [range, setRange] = useState<Range>({ start: null, end: null })
  const [tags, setTags] = useState<string[]>([])
  const [limit, setLimit] = useState(SHOWN)
  const [hovered, setHovered] = useState<number | null>(null)
  const [fresh, setFresh] = useState(0)          // cards from this index on arrived with the last "Load more"
  const wide = useWide()
  const boxRef = useRef<HTMLDivElement>(null)
  const grow = useRef<{ from: number; y: number } | null>(null)

  const list = ARTICLES.filter(a => {
    if (range.start && a.date < range.start) return false
    if (range.start && a.date > (range.end ?? range.start)) return false
    return !tags.length || tags.includes(a.tag)
  })
  const more = list.length > limit
  const visible = list.slice(0, more ? limit + STEP : limit)
  const rows: Article[][] = []
  for (let i = 0; i < visible.length; i += 2) rows.push(visible.slice(i, i + 2))
  const resetPaging = () => { setLimit(SHOWN); setFresh(0); setHovered(null) }

  // "Load more": the list opens up smoothly to its new height, and the page
  // scrolls along with it so the new cards rise into view.
  const loadMore = () => {
    const box = boxRef.current
    if (!box) return
    grow.current = { from: box.offsetHeight, y: window.scrollY }
    setFresh(limit + STEP)
    setLimit(l => l + STEP)
  }
  useLayoutEffect(() => {
    const box = boxRef.current, g = grow.current
    if (!box || !g) return
    grow.current = null
    box.style.height = ''
    const to = box.scrollHeight
    box.style.height = `${g.from}px`
    box.style.overflow = 'hidden'
    let raf = 0
    const start = performance.now()
    const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / LOAD_MS), e = ease(k), d = (to - g.from) * e
      box.style.height = `${g.from + d}px`
      window.scrollTo({ top: g.y + d * .85, behavior: 'instant' })
      if (k < 1) raf = requestAnimationFrame(frame)
      else { box.style.height = ''; box.style.overflow = '' }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); box.style.height = ''; box.style.overflow = '' }
  }, [limit])

  return (
    <section aria-label="Insights" style={{ padding: '0 20px' }}>
      <RevealText by="line" text="Program milestones, partnership updates, and perspectives on what Earth Observation makes possible: a running record of what NEO is building, and why." style={{
        fontFamily: FONT.mono, fontSize: 12, lineHeight: 1.3, color: '#fff', maxWidth: 330, margin: '0 0 70px 7px',
      }} />

      <Featured />

      {/* Filters + legend */}
      <div className="flex flex-wrap items-start justify-between gap-4" style={{ margin: '220px 0 70px', position: 'relative', zIndex: 1 }}>
        <div className="flex flex-wrap gap-4">
          <DateFilter value={range} onChange={r => { setRange(r); resetPaging() }} />
          <TagFilter value={tags}
            onToggle={t => { setTags(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t]); resetPaging() }}
            onClear={() => { setTags([]); resetPaging() }} />
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, height: 50, fontFamily: FONT.mono, fontSize: 13, color: '#fff', paddingRight: 12 }}>
          <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: BLUE }} />Latest News
        </span>
      </div>

      {/* Cards — rows of two, split by a rule; the next row peeks out under a fade to #222 */}
      <div style={{ position: 'relative' }} onMouseLeave={() => setHovered(null)}>
        <div ref={boxRef} style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {rows.map((row, r) => (
            <div key={row.map(a => a.title).join()} className="flex flex-col md:flex-row md:-mx-5">
              {row.map((a, c) => {
                const i = r * 2 + c
                const peek = more && i >= limit
                const me = hovered === i, other = hovered !== null && !me
                // Hovered card widens by one column; its neighbour gives it up.
                const sib = hovered !== null && Math.floor(hovered / 2) === r && !me
                const basis = !wide ? '100%' : me ? `calc(50% + ${STEP_COL})` : sib ? `calc(50% - ${STEP_COL})` : '50%'
                return (
                  <Card key={a.title} a={a} right={c === 1} delay={c * .12 + (fresh && i >= fresh - STEP ? .35 : 0)} basis={basis}
                    active={me} dim={other} inert={peek}
                    onEnter={() => !peek && setHovered(i)} />
                )
              })}
            </div>
          ))}
          {list.length === 0 && <p style={{ ...MONO_GREY, margin: '40px 0' }}>No articles match these filters.</p>}
        </div>
        {more && (
          <div style={{
            position: 'absolute', left: -20, right: -20, bottom: 0, height: 560, pointerEvents: 'none', borderRadius: '0 0 6px 6px',
            // Clear at the top, solid #222 from about halfway (hiding the peeking cards' buttons) to the bottom.
            background: 'linear-gradient(to bottom, rgba(34,34,34,0) 0%, rgba(34,34,34,.85) 35%, #222 52%, #222 100%)',
            display: 'flex', justifyContent: 'center', paddingTop: 360,
          }}>
            <SweepButton onClick={loadMore}
              style={{ height: 92, padding: '0 64px', fontSize: 15, borderRadius: 8, pointerEvents: 'auto', background: 'rgba(255,255,255,.12)' }}
              color="#fff" colorOn="#fff">
              Load more
            </SweepButton>
          </div>
        )}
      </div>
    </section>
  )
}

function Featured() {
  const [ref, inView] = useInView<HTMLDivElement>('0px 0px -15% 0px')
  const f = FEATURED
  return (
    <article className="flex flex-col md:flex-row gap-8" style={{ alignItems: 'stretch' }}>
      <div ref={ref} className="md:w-[59.3%]" style={{ aspectRatio: '852 / 472', overflow: 'hidden', background: '#111', marginLeft: 3, flexShrink: 0 }}>
        <img src={f.img} alt={f.alt} loading="lazy" style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: inView ? 1 : 0, transform: inView ? 'scale(1)' : 'scale(1.1)',
          transition: 'opacity 1.2s cubic-bezier(.16,1,.3,1), transform 2s cubic-bezier(.16,1,.3,1)',
        }} />
      </div>
      <div className="flex flex-col flex-1" style={{ paddingLeft: 'clamp(0px, 0.7vw, 10px)', minHeight: 260 }}>
        <div className="flex justify-between items-start gap-4">
          <time dateTime={f.date} style={MONO_GREY}>{fmtDate(f.date)}</time>
          <Tag {...f} />
        </div>
        <RevealText as="h3" text={f.title} delay={.2} style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(24px, 2.25vw, 32px)', lineHeight: 1.18, color: '#fff', margin: 'auto 0', paddingTop: 30, maxWidth: 460 }} />
        <ReadMore />
      </div>
    </article>
  )
}

function Card({ a, right, delay, basis, active, dim, inert, onEnter }: {
  a: Article; right: boolean; delay: number; basis: string; active: boolean; dim: boolean; inert: boolean; onEnter: () => void
}) {
  const [ref, inView] = useInView<HTMLElement>('0px 0px -10% 0px')
  const fill = useSweep<HTMLSpanElement>(active)
  return (
    <article ref={ref} onMouseEnter={onEnter} style={{
      position: 'relative', flex: `0 0 ${basis}`, minWidth: 0, minHeight: 470, display: 'flex', flexDirection: 'column', paddingTop: 30, paddingBottom: 30,
      filter: dim ? 'grayscale(1) brightness(.7)' : 'none',
      transition: 'flex-basis .6s cubic-bezier(.16,1,.3,1), filter .5s ease',
    }}>
      {/* hover fill — sweeps to brand blue */}
      <span ref={fill} aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none' }} />
      {/* the rule between the two columns draws downwards */}
      {right && <span aria-hidden className="hidden md:block" style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,.22)',
        transformOrigin: '50% 0', transform: `scaleY(${inView ? 1 : 0})`, transition: 'transform 1.2s cubic-bezier(.33,1,.68,1)',
      }} />}
      <div className="flex justify-between items-start gap-4 px-0 md:px-5" style={{ position: 'relative', opacity: inView ? 1 : 0, transition: `opacity .8s ${delay}s ease` }}>
        <time dateTime={a.date} style={{ ...MONO_GREY, color: active ? '#fff' : MONO_GREY.color, transition: 'color .4s ease' }}>{fmtDate(a.date)}</time>
        <Tag {...a} inverted={active && a.color === BLUE} />
      </div>
      {/* title — centred between the date row and the button */}
      <div className="px-0 md:px-5 py-10" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <RevealText as="h3" text={a.title} delay={delay + .1} style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(26px, 2.4vw, 34px)', lineHeight: 1.15, color: '#fff', margin: 0, maxWidth: 640 }} />
      </div>
      <div className="px-0 md:px-5" style={{ position: 'relative', opacity: inView ? 1 : 0, transition: `opacity .8s ${delay + .35}s ease`, pointerEvents: inert ? 'none' : 'auto' }}>
        <ReadMore onBlue={active} />
      </div>
    </article>
  )
}

function Tag({ tag, color, inverted }: { tag: string; color: string; inverted?: boolean }) {
  return <span style={{
    display: 'inline-block', padding: '8px 20px', borderRadius: 4, fontFamily: FONT.mono, fontSize: 13, lineHeight: 1.15, whiteSpace: 'nowrap',
    background: inverted ? '#fff' : color, color: inverted ? color : '#fff', transition: 'background .4s ease, color .4s ease',
  }}>{tag}</span>
}

// No article pages yet, so "Read more" is shown but goes nowhere.
// On a selected (blue) card it sweeps to white instead.
function ReadMore({ onBlue = false }: { onBlue?: boolean }) {
  return (
    <SweepButton aria-disabled forced={onBlue} rgb={onBlue ? '255,255,255' : BLUE_RGB}
      style={{ height: 42, padding: '0 20px', fontSize: 13, background: '#333' }} color="#fff" colorOn={onBlue ? BLUE : '#fff'}>
      Read more
    </SweepButton>
  )
}

/** A mono pill whose background sweeps to a solid colour on hover / focus. */
function SweepButton({ children, onClick, rgb = BLUE_RGB, color, colorOn, forced = false, style, ...rest }: {
  children: ReactNode; onClick?: () => void; rgb?: string; color: string; colorOn: string; forced?: boolean; style?: CSSProperties; 'aria-disabled'?: boolean
}) {
  const [hover, setOn] = useState(false)
  const on = hover || forced
  const fill = useSweep<HTMLSpanElement>(on, { rgb, ms: 480 })
  return (
    <button type="button" onClick={onClick} {...rest}
      onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      style={{
        position: 'relative', overflow: 'hidden', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', border: 0, borderRadius: 4,
        fontFamily: FONT.mono, cursor: onClick ? 'pointer' : 'default', color: on ? colorOn : color, transition: 'color .35s ease', ...style,
      }}>
      <span ref={fill} aria-hidden style={{ position: 'absolute', inset: 0 }} />
      <span style={{ position: 'relative' }}>{children}</span>
    </button>
  )
}

// ─── Filters ──────────────────────────────────────────────────────────────────

function Popover({ label, summary, open, setOpen, children }: {
  label: string; summary: ReactNode; open: boolean; setOpen: (v: boolean) => void; children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, setOpen])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 16, minHeight: 50, padding: '6px 20px', borderRadius: 6, border: 0,
          background: open ? '#444' : '#333', fontFamily: FONT.mono, fontSize: 13, color: '#fff', cursor: 'pointer', transition: 'background .3s ease',
        }}>
        <span style={{ color: 'rgba(255,255,255,.3)' }}>{label}</span>
        {summary}
        <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s ease' }}><path d="M0 0h9L4.5 7z" fill="#fff" /></svg>
      </button>
      <div role="dialog" aria-label={label} hidden={!open} className="neo-hint-in" style={{
        position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 20, padding: 18, borderRadius: 8,
        background: 'rgba(28,28,28,.96)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontFamily: FONT.mono, color: '#fff',
      }}>
        {children}
      </div>
    </div>
  )
}

function DateFilter({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const [open, setOpen] = useState(false)
  const latest = ARTICLES.reduce((m, a) => a.date > m ? a.date : m, '')
  const [view, setView] = useState(() => { const d = parse(value.start ?? latest); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [draft, setDraft] = useState<Range>(value)
  const [hover, setHover] = useState<string | null>(null)
  useEffect(() => { if (open) setDraft(value) }, [open, value])

  const days = useMemo(() => {
    const y = view.getFullYear(), m = view.getMonth()
    const lead = (new Date(y, m, 1).getDay() + 6) % 7           // weeks start on Monday
    const count = new Date(y, m + 1, 0).getDate()
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => iso(new Date(y, m, i + 1)))]
  }, [view])
  const withNews = useMemo(() => new Set(ARTICLES.map(a => a.date)), [])

  const pick = (d: string) => {
    if (!draft.start || draft.end) { setDraft({ start: d, end: null }); return }
    const [s, e] = d < draft.start ? [d, draft.start] : [draft.start, d]
    setDraft({ start: s, end: e })
    onChange({ start: s, end: e })
    setOpen(false)
  }
  const lo = draft.start, hi = draft.end ?? (draft.start && hover ? hover : null)
  const [a, b] = lo && hi ? (lo < hi ? [lo, hi] : [hi, lo]) : [lo, lo]

  const summary = value.start
    ? <span>{fmtShort(value.start)}{value.end && value.end !== value.start ? ` – ${fmtShort(value.end)}` : ''}, {parse(value.end ?? value.start).getFullYear()}</span>
    : <span>All</span>
  const month = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const nav = (d: number) => setView(v => new Date(v.getFullYear(), v.getMonth() + d, 1))
  const navBtn: CSSProperties = { width: 32, height: 32, borderRadius: 4, border: 0, background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontFamily: FONT.mono }

  return (
    <Popover label="Date" summary={summary} open={open} setOpen={setOpen}>
      <div style={{ width: 7 * 38 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <button type="button" aria-label="Previous month" onClick={() => nav(-1)} style={navBtn}>‹</button>
          <span style={{ fontSize: 13 }}>{month}</span>
          <button type="button" aria-label="Next month" onClick={() => nav(1)} style={navBtn}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 38px)', rowGap: 4, fontSize: 12 }} onMouseLeave={() => setHover(null)}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} aria-hidden style={{ height: 26, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.35)' }}>{d}</span>)}
          {days.map((d, i) => {
            if (!d) return <span key={`x${i}`} />
            const end = d === a || d === b, inside = !!(a && b && d > a && d < b)
            return (
              <button key={d} type="button" onClick={() => pick(d)} onMouseEnter={() => setHover(d)}
                aria-label={fmtDate(d)} aria-pressed={end || inside}
                style={{
                  position: 'relative', height: 34, border: 0, cursor: 'pointer', fontFamily: FONT.mono, fontSize: 12,
                  borderRadius: end ? 4 : 0, color: '#fff',
                  background: end ? BLUE : inside ? `rgba(${BLUE_RGB},.28)` : 'transparent',
                }}>
                {parse(d).getDate()}
                {withNews.has(d) && <span aria-hidden style={{ position: 'absolute', left: '50%', bottom: 4, width: 3, height: 3, marginLeft: -1.5, borderRadius: '50%', background: end ? '#fff' : BLUE }} />}
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
          <span>{draft.start && !draft.end ? 'Pick an end date' : 'Pick a start date'}</span>
          <button type="button" onClick={() => { onChange({ start: null, end: null }); setDraft({ start: null, end: null }); setOpen(false) }}
            style={{ border: 0, background: 'none', color: BLUE, cursor: 'pointer', fontFamily: FONT.mono, fontSize: 12, padding: 0 }}>Clear</button>
        </div>
      </div>
    </Popover>
  )
}

function TagFilter({ value, onToggle, onClear }: { value: string[]; onToggle: (t: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false)
  const colorOf = (t: string) => TAGS.find(([n]) => n === t)?.[1] ?? BLUE
  const summary = value.length
    ? <span className="flex flex-wrap gap-2">{value.map(t => <span key={t} style={{ padding: '6px 12px', borderRadius: 4, background: colorOf(t), fontSize: 12 }}>{t}</span>)}</span>
    : <span>All</span>

  return (
    <Popover label="Tags" summary={summary} open={open} setOpen={setOpen}>
      <div className="flex flex-wrap gap-2" style={{ width: 'min(420px, 80vw)' }}>
        {TAGS.map(([t, c]) => {
          const on = value.includes(t)
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => onToggle(t)} style={{
              padding: '8px 18px', borderRadius: 4, border: 0, cursor: 'pointer', fontFamily: FONT.mono, fontSize: 13, color: '#fff',
              background: c, opacity: on || !value.length ? 1 : .35, filter: on || !value.length ? 'none' : 'grayscale(.6)',
              outline: on ? '1px solid #fff' : 'none', outlineOffset: 2, transition: 'opacity .3s ease, filter .3s ease',
            }}>{t}</button>
          )
        })}
      </div>
      <div className="flex justify-end" style={{ marginTop: 14 }}>
        <button type="button" onClick={onClear} style={{ border: 0, background: 'none', color: BLUE, cursor: 'pointer', fontFamily: FONT.mono, fontSize: 12, padding: 0 }}>Clear</button>
      </div>
    </Popover>
  )
}

/** Desktop layout (the two-column grid) or not. */
function useWide() {
  const q = '(min-width: 768px)'
  const [wide, setWide] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q), on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}
