import { useEffect, useRef, useState, type ReactNode } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { RevealText } from './RevealText'

// ─── Partnerships ─────────────────────────────────────────────────────────────
// "PARTNERSHIPS" label, then the partners as tall entries in a column that runs
// from ~38% of the width to the right edge, strung on a thin vertical rule.
// Whichever entry is nearest the middle of the screen is the current one: it
// fills with a brand-blue → black card, its name and text turn white, and its
// photo (if it has one) appears in the left-hand column. The rest stay grey,
// indented 100px.

const GREY = 'rgba(255,255,255,.3)'
const BITCOUNT = { fontFamily: FONT.bitcount, fontWeight: 400, textTransform: 'uppercase', letterSpacing: 0, lineHeight: 1.1, fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0' } as const

type Partner = { name: string; flags: Flag[]; links: { label: string; href: string }[]; text: string; photo?: { src: string; alt: string } }
const PARTNERS: Partner[] = [
  {
    name: 'RFA One, GEOSAT & CEiiA', flags: ['de', 'pt'],
    links: [{ label: 'Visit RFA One', href: 'https://www.rfa.space' }, { label: 'Visit GEOSAT', href: 'https://geosat.space' }],
    text: "NEO's founding shareholders, and joint leads of New Space Portugal, the national program building end-to-end Portuguese capability to design, construct, and integrate Very High Resolution satellites.",
  },
  {
    name: 'OHB Sweden', flags: ['se'],
    links: [{ label: 'Visit', href: 'https://www.ohb-sweden.se' }],
    text: "NEO's satellite development partner. Together, NEO and OHB Sweden are building two VHR satellites for the Atlantic Constellation.",
    photo: { src: `${A}/ecosystem/ohb-satellite.jpg`, alt: 'A satellite wrapped in gold thermal foil in a clean room' },
  },
  {
    name: 'Rocket Factory Augsburg (RFA)', flags: ['de'],
    links: [{ label: 'Visit', href: 'https://www.rfa.space' }],
    text: "NEO's launch partner, through the Access to Space partnership with CEiiA.",
  },
]

export function Partnerships() {
  const [current, setCurrent] = useState(0)
  const entryRefs = useRef<(HTMLDivElement | null)[]>([])

  // Current = the entry whose centre is nearest the middle of the screen.
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const mid = window.innerHeight / 2
      let best = 0, bestD = Infinity
      entryRefs.current.forEach((el, i) => {
        if (!el) return
        const b = el.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid)
        if (d < bestD) { bestD = d; best = i }
      })
      // Scrolling on through the last 30% of the last entry (its 70% mark
      // past the middle of the screen), none is current.
      const lastEl = entryRefs.current[PARTNERS.length - 1]
      if (lastEl) { const lb = lastEl.getBoundingClientRect(); if (lb.top + lb.height * .7 < mid) best = -1 }
      setCurrent(best)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section aria-label="Partnerships" style={{ paddingTop: 200 }}>
      <RevealText as="h2" text="Partnerships" style={{ ...BITCOUNT, fontSize: 26, color: '#fff', margin: '0 0 30px', padding: '0 30px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {PARTNERS.map((p, i) => {
          const on = i === current
          return (
            <div key={p.name} ref={el => { entryRefs.current[i] = el }} style={{ position: 'relative', minHeight: 'max(760px, 110vh)' }}>
              {/* Photo — left-hand column, shown with its entry */}
              {p.photo && (
                <div className="hidden md:block" style={{
                  position: 'absolute', left: 20, top: '27%', width: '21.4%', aspectRatio: '612 / 548', overflow: 'hidden', background: '#111',
                  opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(30px)',
                  transition: 'opacity .8s ease, transform 1s cubic-bezier(.16,1,.3,1)',
                }}>
                  <img src={p.photo.src} alt={p.photo.alt} loading="lazy" style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transform: on ? 'scale(1)' : 'scale(1.1)', transition: 'transform 1.6s cubic-bezier(.16,1,.3,1)',
                  }} />
                </div>
              )}

              {/* Entry — on the rule; the current one fills blue → black */}
              {/* column from ≈ x 550 at 1440 (one grid column right of x 410) to the right edge; entries that
                  aren't current sit 100px further in */}
              <div className={`absolute inset-y-0 right-0 left-5 ${on ? 'md:left-[calc(28.5%+(100%-30px)/10)]' : 'md:left-[calc(28.5%+(100%-30px)/10+100px)]'}`}
                style={{ borderLeft: `1px solid ${GREY}`, transition: 'left .8s cubic-bezier(.16,1,.3,1)' }}>
                <div aria-hidden style={{
                  position: 'absolute', inset: 0, left: -1, borderRadius: '6px 0 0 6px',
                  background: 'linear-gradient(to right, #55a6ff 0%, rgba(85,166,255,.35) 55%, #000 100%)',
                  opacity: on ? 1 : 0, transition: 'opacity .8s ease',
                }} />
                <Content p={p} on={on} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Content({ p, on }: { p: Partner; on: boolean }) {
  const color = on ? '#fff' : GREY
  return (
    <div style={{ position: 'relative', height: '100%', padding: '55px 20px 60px 38px', display: 'flex', flexDirection: 'column', color, transition: 'color .6s ease' }}>
      <div style={{ display: 'flex', gap: 'clamp(20px, 2.6vw, 38px)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, paddingTop: 'clamp(10px, 1.2vw, 18px)', flexShrink: 0 }}>
          {p.flags.map(f => <FlagIcon key={f} flag={f} />)}
        </div>
        <div>
          <RevealText as="h3" text={p.name} style={{
            fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(44px, 6.1vw, 88px)', lineHeight: 1.03, letterSpacing: '-1px', margin: 0, maxWidth: 480,
          }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginTop: 58 }}>
            {p.links.map(l => <VisitLink key={l.label} {...l} />)}
          </div>
        </div>
      </div>
      {/* description — from ≈ x 800 at 1440 */}
      <div style={{ marginTop: 'auto', paddingTop: 80 }}>
        <div className="md:ml-[37.9%]" style={{ maxWidth: 600 }}>
          <RevealText by="line" text={p.text} style={{ fontFamily: FONT.sans, fontSize: 'clamp(20px, 2.1vw, 30px)', lineHeight: 1.4, margin: 0 }} />
        </div>
      </div>
    </div>
  )
}

function VisitLink({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:!bg-white"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 20, height: 42, padding: '0 12px', borderRadius: 6,
        background: '#a9a9a9', color: '#333', textDecoration: 'none', transition: 'background .3s ease',
        fontFamily: FONT.mono, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.02em',
      }}>
      {label}
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x=".6" y=".6" width="16.8" height="16.8" rx="1" />
        <path d="M6 12 12 6M7.5 6H12v4.5" />
      </svg>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}> (opens in a new tab)</span>
    </a>
  )
}

type Flag = 'de' | 'pt' | 'se'
function FlagIcon({ flag }: { flag: Flag }): ReactNode {
  const box = { width: 52, height: 34, display: 'block', borderRadius: 2 } as const
  if (flag === 'de') return (
    <svg viewBox="0 0 5 3" style={box} role="img" aria-label="Germany"><rect width="5" height="1" y="0" fill="#000" /><rect width="5" height="1" y="1" fill="#DD0000" /><rect width="5" height="1" y="2" fill="#FFCE00" /></svg>
  )
  if (flag === 'se') return (
    <svg viewBox="0 0 16 10" style={box} role="img" aria-label="Sweden"><rect width="16" height="10" fill="#006AA7" /><rect x="5" width="2" height="10" fill="#FECC00" /><rect y="4" width="16" height="2" fill="#FECC00" /></svg>
  )
  return (
    <svg viewBox="0 0 30 20" style={box} role="img" aria-label="Portugal">
      <rect width="30" height="20" fill="#FF0000" /><rect width="12" height="20" fill="#006600" />
      <circle cx="12" cy="10" r="4.2" fill="#FFFF00" /><circle cx="12" cy="10" r="3" fill="#FF0000" />
      <rect x="10.6" y="8.2" width="2.8" height="3.6" rx=".6" fill="#fff" />
    </svg>
  )
}
