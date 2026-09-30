import { useLayoutEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { FONT } from '../lib/fonts'
import { RevealText } from './RevealText'

// ─── Six disciplines ──────────────────────────────────────────────────────────
// Heading, then a six-row table on the left. Table and details each stop
// one grid column short of where they used to end.
//
// On scroll-in the rows arrive one after another: each rule draws left →
// right and its number + title reveal word by word. The selected row fills
// left → right with a brand-blue → transparent gradient that ends solid; picking
// another row fades the old fill and sweeps the new one the same way. The
// chosen row's details sit on the right, right-aligned and vertically centred
// on the table, and swap in as one block.

const ROW_H = 150
const ROW_STAGGER = .15      // s between rows arriving, top first
const RULE_S = 1.2           // s for a row's rule to draw left → right
const TEXT_LAG = .25         // s after its rule starts that a row's text follows
const SWEEP_MS = 650         // selected-row fill, left → right (edge + firming up)
const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
// Gentle ease in, longer ease out: a smoothstep bent so it settles more slowly.
const smooth = (t: number) => 1 - (1 - t * t * (3 - 2 * t)) ** 2
const BLUE = '85,166,255'

// Details per discipline: a numbered list (`items`) or a paragraph (`text`).
// Integration & Testing has neither yet.
const DISCIPLINES: { title: string; items?: string[]; text?: string }[] = [
  { title: 'Mission Design', items: ['Mission Analysis', 'Orbit Design', 'Coverage', 'Constellation Analysis', 'Mission Performance'] },
  { title: 'Satellite Engineering', items: ['System Engineering', 'Payload Integration', 'Mechanical', 'Electrical', 'Thermal', 'AIT'] },
  { title: 'Integration & Testing' },
  { title: 'Licensing & Regulatory', text: "NEO manages satellite licensing on the client's behalf with the relevant authorities. In Portugal, those are ANACOM and the AAN, and supports registration is made with the UN Office for Outer Space Affairs (UNOOSA)." },
  { title: 'Launch Services', text: "NEO contracts the launch and manages the satellite's integration into the launch vehicle." },
  { title: 'LEOP & Commissioning', text: "Initial operations support and commissioning of the satellite following launch, carried through as part of NEO's end-to-end mission delivery." },
]

export function DisciplinesTable() {
  const [active, setActive] = useState(0)
  // The whole table plays in one go, on time (not scroll), once its top is
  // well up the screen — rows below the fold don't wait to be scrolled to.
  const [tableRef, inView] = useInView<HTMLDivElement>('0px 0px -35% 0px')
  const fillRefs = useRef<(HTMLDivElement | null)[]>([])

  // Sweep the selected row's fill: the leading edge fades blue → nothing and
  // the tail firms up to solid as the sweep completes.
  useLayoutEffect(() => {
    const el = fillRefs.current[active]
    if (!el) return
    const paint = (k: number) => {
      // The edge crosses in the first 80%; the transparent end starts firming up
      // early and finishes a beat after, so the gradient melts into solid.
      const e = smooth(clamp01(k / .8)), tail = smooth(clamp01((k - .25) / .75))
      el.style.background = `linear-gradient(to right, rgb(${BLUE}) 0%, rgba(${BLUE},${tail}) ${e * 100}%)`
    }
    paint(0)
    if (!inView) return
    // First reveal: wait for the first row to arrive; later picks sweep at once.
    const wait = fillRefs.current.some((f, i) => i !== active && f?.dataset.swept) ? 0 : 350
    let raf = 0
    const start = performance.now() + wait
    const frame = (t: number) => {
      const k = Math.max(0, Math.min(1, (t - start) / SWEEP_MS))
      paint(k)
      if (k < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    el.dataset.swept = '1'
    return () => cancelAnimationFrame(raf)
  }, [active, inView])

  const d = DISCIPLINES[active]
  const rowText = { fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(22px, 2.5vw, 36px)', lineHeight: 1 } as const

  return (
    <section style={{ padding: '0 20px 300px' }}>
      <RevealText as="h2" text="Six disciplines carry a mission from concept to operation:" style={{
        fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 1.12, letterSpacing: '-1px',
        color: '#fff', maxWidth: 940, margin: '0 0 180px',
      }} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-y-16">
        {/* Table */}
        <div ref={tableRef} role="tablist" aria-label="Disciplines" className="w-full md:w-[calc(52%-(100%+10px)/10)]" style={{ position: 'relative' }}>
          {DISCIPLINES.map((row, i) => {
            const on = i === active
            const delay = i * ROW_STAGGER
            return (
              <button key={row.title} type="button" role="tab" aria-selected={on} onClick={() => setActive(i)}
                className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
                style={{
                  position: 'relative', display: 'flex', width: '100%', height: ROW_H, alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 16px', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left',
                  color: on ? '#fff' : 'rgba(255,255,255,.32)', transition: 'color .4s ease',
                }}>
                <div ref={el => { fillRefs.current[i] = el }} aria-hidden style={{
                  position: 'absolute', inset: 0, borderRadius: 6, opacity: on ? 1 : 0, transition: on ? 'none' : 'opacity .35s ease',
                }} />
                {/* Row rule draws left → right */}
                <span aria-hidden style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'rgba(255,255,255,.22)',
                  transformOrigin: '0 50%', transform: `scaleX(${inView ? 1 : 0})`,
                  transition: `transform ${RULE_S}s ${delay}s cubic-bezier(.33,1,.68,1)`,
                }} />
                <RevealText as="span" text={String(i + 1).padStart(2, '0')} ready={inView} ownView={false} delay={delay + TEXT_LAG} style={{ ...rowText, position: 'relative' }} />
                <RevealText as="span" text={row.title} ready={inView} ownView={false} delay={delay + TEXT_LAG + .07} style={{ ...rowText, position: 'relative' }} />
              </button>
            )
          })}
        </div>

        {/* Details for the chosen row — right-aligned, centred on the table; arrives and swaps as one block */}
        <div role="tabpanel" aria-label={d.title} className="w-full md:w-[33%] md:mr-[calc((100%+10px)/10)]" style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(14px)',
          transition: 'opacity 1s .45s cubic-bezier(.16,1,.3,1), transform 1.2s .45s cubic-bezier(.16,1,.3,1)',
        }}>
          {d.text ? (
            <p key={active} className="neo-hint-in" style={{ margin: 0, fontFamily: FONT.sans, fontSize: 21, lineHeight: 1.35, color: '#fff' }}>{d.text}</p>
          ) : (
            <ol key={active} className="neo-hint-in" style={{ margin: 0, padding: 0, listStyle: 'none', borderTop: '1px solid rgba(255,255,255,.28)' }}>
              {(d.items ?? ['Details to follow']).map((item, i) => (
                <li key={item} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 34,
                  borderBottom: '1px solid rgba(255,255,255,.28)',
                  fontFamily: FONT.sans, fontSize: 21, color: d.items ? '#fff' : 'rgba(255,255,255,.4)',
                }}>
                  <span>{d.items ? `${i + 1}.` : ''}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
