import { useState, useEffect, useRef, type MouseEvent } from 'react'
import { A, BLUE, PAGES } from '../data/pages'
import { FONT } from '../lib/fonts'
import { pathFor } from '../lib/routes'
import { useNavigation, OPEN_ORBIT_EVENT } from '../lib/navigation'
import { animateScrollTo } from '../lib/scroll'
import { RingCursor } from './RingCursor'
import { TypedText } from './TypedText'

// ─── Nav bar (trial layout) ───────────────────────────────────────────────────
//   left    logo tile (brand blue) + "NEO" tile
//   centre  the current page, "01 ··· Earth". Hover / keyboard focus: the other
//           pages drop out from behind it as identical boxes, stacked down with
//           a small gap, in sitemap order; click one to load it.
//   right   the orbital loader (the orbital nav's ring). Click: opens the orbital
//           nav overlay. On Earth, which has no pages behind it, it scrolls to
//           the closing orbital nav at the foot of the page instead.
// Boxes share the height and radius of the old pills.

const H = 46, RADIUS = 7, GAP = 5         // 1.2× the old pills (38 / 6 / 4)
// On phones it narrows to leave room for the logo tile and the loader on either side.
const BOX_W = 'clamp(min(228px, 100vw - 160px), 22.8vw, 336px)'
const TILE = 'rgba(232,232,232,.94)'
const TILE_HOVER = '#fff'
const INK = '#1e1e1e'
const EASE = 'cubic-bezier(.16,1,.3,1)'
const CLOSE_DELAY_MS = 140

const num = (i: number) => String(i + 1).padStart(2, '0')

export function NavBar({ title, logoVisible, boxesVisible, interactive }: {
  title: string; logoVisible: boolean; boxesVisible: boolean; interactive: boolean
}) {
  const appear = (on: boolean, delay = 0) => ({
    opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(-8px)',
    transition: `opacity .5s ${delay}s ease, transform .6s ${delay}s ${EASE}`,
  })
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: H }}>
      {/* Left: logo + NEO */}
      <div style={{ display: 'flex', gap: 10 }}>
        <a href={pathFor(0)} aria-label="NEO home" className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" style={{
          width: 50, height: H, borderRadius: RADIUS, background: BLUE, display: 'grid', placeItems: 'center', ...appear(logoVisible),
        }}>
          <img src={`${A}/neo-logo.svg`} alt="" style={{ width: 31, height: 'auto', display: 'block' }} />
        </a>
        {/* NEO tile: hidden on phones (below 768px) */}
        <div className="hidden md:flex" style={{
          height: H, padding: '0 22px', borderRadius: RADIUS, background: TILE, alignItems: 'center',
          fontFamily: FONT.mono, fontSize: 14, color: BLUE, letterSpacing: '.04em', ...appear(logoVisible, .06),
        }}>NEO</div>
      </div>

      {/* Centre: current page, the rest stacking down on hover */}
      <PageStack title={title} visible={boxesVisible} interactive={interactive} />

      {/* Right: orbital loader */}
      <OrbitButton visible={boxesVisible} />
    </div>
  )
}

function PageStack({ title, visible, interactive }: { title: string; visible: boolean; interactive: boolean }) {
  const { current, navigate } = useNavigation()
  const [open, setOpen] = useState(false)
  const closeT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => () => clearTimeout(closeT.current), [])
  // Touch: no hover, so tapping the current box toggles the stack; a tap
  // anywhere outside it closes it again.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])
  const show = () => { if (!interactive) return; clearTimeout(closeT.current); setOpen(true) }
  const hide = () => { clearTimeout(closeT.current); closeT.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS) }
  const expanded = open && interactive
  const touchRef = useRef(false)   // last press was a touch (not a mouse)

  const go = (e: MouseEvent, id: number) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return   // new tab etc.: let the link work
    e.preventDefault()
    if (id === current && touchRef.current) { if (interactive) setOpen(o => !o); return }
    setOpen(false)
    if (id !== current) navigate(id)
  }

  // The other pages, in sitemap order, each with its slot below the current box.
  const others = PAGES.filter(p => p.id !== current)

  const box = (isCurrent: boolean) => ({
    position: 'absolute' as const, left: 0, top: 0, width: '100%', height: H, padding: '0 17px', borderRadius: RADIUS,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 19, textDecoration: 'none',
    fontFamily: FONT.sans, fontSize: 18, lineHeight: 1, color: INK, whiteSpace: 'nowrap' as const,
    zIndex: isCurrent ? 2 : 1,
  })

  return (
    <div ref={rootRef}
      // Hover opens it for a mouse only; mobile browsers fake a mouse-enter on
      // tap, which would fight the tap toggle.
      onPointerDown={e => { touchRef.current = e.pointerType !== 'mouse' }}
      onPointerEnter={e => { if (e.pointerType === 'mouse') show() }}
      onPointerLeave={e => { if (e.pointerType === 'mouse') hide() }}
      onFocus={() => { if (!touchRef.current) show() }}
      onBlur={e => { if (!rootRef.current?.contains(e.relatedTarget as Node)) hide() }}
      style={{
        position: 'absolute', left: '50%', top: 0, width: BOX_W, transform: 'translateX(-50%)',
        // while open, the hover area covers the whole stack so the pointer can travel down it
        height: expanded ? H + others.length * (H + GAP) : H,
      }}>
      <nav aria-label="Pages">
        <a href={pathFor(current)} onClick={e => go(e, current)} aria-current="page"
          className="hover:!bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{
            ...box(true), background: TILE, opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(-8px)',
            transition: `opacity .5s ease, transform .6s ${EASE}, background-color .25s ease`,
          }}>
          <span>{num(current)}</span>
          <span><TypedText text={title} active={visible} /></span>
        </a>
        {others.map((p, k) => (
          <a key={p.id} href={pathFor(p.id)} onClick={e => go(e, p.id)}
            tabIndex={expanded ? 0 : -1}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onMouseEnter={e => { e.currentTarget.style.background = TILE_HOVER }}
            onMouseLeave={e => { e.currentTarget.style.background = TILE }}
            style={{
              ...box(false), background: TILE,
              opacity: expanded ? 1 : 0, pointerEvents: expanded ? 'auto' : 'none',
              transform: `translateY(${expanded ? (k + 1) * (H + GAP) : 0}px)`,
              // drop out top → bottom; fold back bottom → top
              transition: [
                `transform .55s ${EASE} ${expanded ? k * .03 : (others.length - 1 - k) * .02}s`,
                `opacity .3s ease ${expanded ? k * .03 : 0}s`,
                'background-color .25s ease',
              ].join(', '),
            }}>
            <span>{num(p.id)}</span>
            <span>{p.title}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

function OrbitButton({ visible }: { visible: boolean }) {
  const { current } = useNavigation()
  const [hover, setHover] = useState(false)
  const open = () => {
    if (current > 0) { window.dispatchEvent(new Event(OPEN_ORBIT_EVENT)); return }
    // Earth: nothing to orbit back to, so go to the closing orbital nav instead.
    const closing = document.querySelector('[data-hides-page-nav]')
    if (closing) animateScrollTo(closing.getBoundingClientRect().top + window.scrollY, 1400)
  }
  return (
    <button type="button" aria-label="Open the orbital navigation" onClick={open}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      style={{
        marginLeft: 'auto', width: H, height: H, padding: 0, border: 0, borderRadius: '50%', background: 'none', cursor: 'pointer',
        display: 'grid', placeItems: 'center', opacity: visible ? 1 : 0, transition: 'opacity .5s .1s ease',
      }}>
      {/* The orbital nav's ring: hollow dots at rest, orbiting on hover */}
      <span style={{ display: 'block', transform: 'scale(.86)' }}>
        <RingCursor variant={hover ? 'filled' : 'outline'} />
      </span>
    </button>
  )
}
