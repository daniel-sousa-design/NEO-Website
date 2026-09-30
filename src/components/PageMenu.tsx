import { useState, useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react'
import { PAGES } from '../data/pages'
import { FONT } from '../lib/fonts'
import { pathFor } from '../lib/routes'
import { useNavigation } from '../lib/navigation'
import { TypedText } from './TypedText'

// ─── Page menu (top nav pill) ─────────────────────────────────────────────────
// At rest: one pill, the current page (typed in during the intro).
// Hover or keyboard focus: identical pills for every page slide out from
// behind it, shuffling into sitemap order — the current pill slides to its own
// slot among them. Leaving reverses it back to the single pill.

const GAP = 8
const CLOSE_DELAY_MS = 140
const EASE = 'cubic-bezier(.16,1,.3,1)'
const PILL = 'rounded-[6px] bg-[rgba(244,244,244,.2)]'

export function PageMenu({ title, visible, interactive }: { title: string; visible: boolean; interactive: boolean }) {
  const { current, navigate } = useNavigation()
  const [open, setOpen] = useState(false)
  const closeT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rootRef = useRef<HTMLDivElement>(null)

  // Natural pill widths, measured from a hidden row (the live current pill is
  // mid-typing during the intro, so it can't be measured directly).
  const measureRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<number[]>([])
  useLayoutEffect(() => {
    const measure = () => {
      const row = measureRef.current
      if (row) setWidths([...row.children].map(c => (c as HTMLElement).offsetWidth))
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  useEffect(() => () => clearTimeout(closeT.current), [])

  const show = () => { if (!interactive) return; clearTimeout(closeT.current); setOpen(true) }
  const hide = () => { clearTimeout(closeT.current); closeT.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS) }
  const expanded = open && interactive

  // Slot x for each page in the open row; everything collapses to 0 (behind the current pill).
  const xs = widths.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + widths[i - 1] + GAP], [])
  const rowWidth = widths.length ? xs[xs.length - 1] + widths[widths.length - 1] : 0

  const go = (e: MouseEvent, id: number) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return  // new tab etc.: let the link work
    e.preventDefault()
    setOpen(false)
    if (id !== current) navigate(id)
  }

  const text = { fontFamily: FONT.mono, fontSize: 12, color: '#fff', lineHeight: 1.5, whiteSpace: 'nowrap' } as const

  return (
    <div ref={rootRef}
      onMouseEnter={show} onMouseLeave={hide}
      onFocus={show}
      onBlur={e => { if (!rootRef.current?.contains(e.relatedTarget as Node)) hide() }}
      style={{
        position: 'absolute', left: 'calc(20% + 58px)', height: 38,
        width: expanded ? rowWidth : widths[current] ?? 'auto',
      }}>
      {/* Hidden measuring row */}
      <div ref={measureRef} aria-hidden style={{ position: 'absolute', visibility: 'hidden', display: 'flex', pointerEvents: 'none' }}>
        {PAGES.map(p => <span key={p.id} style={{ ...text, padding: '10px 12px' }}>{p.title}</span>)}
      </div>

      <nav aria-label="Pages">
        {PAGES.map((p, i) => {
          const isCurrent = i === current
          const x = expanded ? xs[i] ?? 0 : 0
          const delay = expanded ? Math.abs(i - current) * .035 : 0
          const shownPill = isCurrent ? visible : expanded
          return (
            <a key={p.id} href={pathFor(i)} onClick={e => go(e, i)}
              aria-current={isCurrent ? 'page' : undefined}
              tabIndex={isCurrent || expanded ? 0 : -1}
              className={`${PILL} hover:bg-[rgba(244,244,244,.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              style={{
                position: 'absolute', left: 0, top: 0, padding: '10px 12px', overflow: 'hidden', textDecoration: 'none',
                zIndex: isCurrent ? 2 : 1,
                maxWidth: isCurrent ? (visible ? 200 : 0) : 200,
                opacity: shownPill ? 1 : 0,
                pointerEvents: shownPill ? 'auto' : 'none',
                transform: `translateX(${x}px)`,
                transition: [
                  `transform .6s ${EASE} ${delay}s`,
                  `opacity .35s ease ${isCurrent ? 0 : delay}s`,
                  'max-width .55s cubic-bezier(.22,1,.36,1)',
                  'background-color .25s ease',
                ].join(', '),
              }}>
              <span style={text}>{isCurrent ? <TypedText text={title} active={visible} /> : p.title}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
