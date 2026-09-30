import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { PAGES, SEL } from '../data/pages'
import { FONT } from '../lib/fonts'
import { lerp, ease } from '../lib/motion'
import { RingCursor } from './RingCursor'

// ─── Orbital nav (closing = forward, opening = reverse) ───────────────────────
// One component drives both orbital navs:
//
//   closing — full-viewport section at the bottom of every page: closing title
//             top-left (36pt), the card ladder in the centre, credits + buttons
//             pinned at the bottom. Scroll DOWN orbits toward the next pages
//             (cards travel right→left), clamped at the last page.
//   opening — the same ladder mirrored, as a fixed overlay summoned by scrolling
//             UP at the very top of a page. Scroll UP orbits back through the
//             previous pages (cards travel left→right), clamped at the first page.
//
// Interaction (identical in both, with the scroll direction flipped):
//   1. A scroll pops the neighbouring card into the centre with a springy 3D snap.
//   2. Then it forks on where the cursor is:
//      · over the centre card  → the outline ring cursor fills with scroll; the
//        tile expands and floods blue in lock-step; once full, that page loads.
//        (Closing expands upward, opening expands downward.)
//      · anywhere else         → the carousel keeps orbiting, the cursor becomes
//        the solid orbiting ring.
//   Scrolling the other way drains the loader, then orbits back; past the
//   current page the nav releases (opening mode closes the overlay).
//   Cards tilt in 3D toward the pointer on hover, easing back on leave.

const CLOSING_TITLES: Record<number, string> = {
  0: 'Everything we build points back to Earth.',
  1: 'Whichever level you choose, it runs on the same two systems.',
  2: 'Two systems. Every mission NEO flies.',
}
function closingTitle(page: number) {
  return CLOSING_TITLES[page] ?? `${PAGES[page].title} is only the beginning.`
}
function openingTitle(page: number, current: number) {
  return page === current ? 'Retrace the orbit.' : `Back to ${PAGES[page].title}.`
}

type Slot = { cx: number; cy: number; w: number; h: number; font: number; op: number }
const SLOT: Record<number, Slot> = {
  [-1]: { cx: -16, cy: 104, w: 16, h: 12, font: 16, op: 0 },
  0:    { cx: 9,   cy: 84,  w: 22, h: 18, font: 24, op: 0.35 },
  1:    { cx: 20,  cy: 62,  w: 27, h: 24, font: 32, op: 0.8 },
  2:    { cx: 50,  cy: 50,  w: 34, h: 40, font: 50, op: 1 },
  3:    { cx: 80,  cy: 30,  w: 42, h: 46, font: 72, op: 0.85 },
  4:    { cx: 112, cy: 12,  w: 42, h: 46, font: 72, op: 0 },
}

const NOTCH        = 90    // wheel units per orbit step
const COMMIT_TOTAL = 820   // wheel units to fill the loader and load the page
const STEP_LOCK_MS = 560   // lock while a pop-into-place settles

export function OrbitalNav({ currentPage, onNavigate, mode }: {
  currentPage: number; onNavigate: (id: number) => void; mode: 'closing' | 'opening'
}) {
  const rev = mode === 'opening'
  const dir = rev ? -1 : 1                    // page direction the orbit travels
  const ref = useRef<HTMLElement>(null)
  const centerElRef = useRef<HTMLButtonElement | null>(null)
  const L = PAGES.length
  const maxStep = rev ? currentPage : L - 1 - currentPage   // clamped — no loop

  const [open, setOpen] = useState(!rev)           // opening overlay summoned?
  const [step, setStep] = useState(0)              // orbit offset from currentPage (0..maxStep)
  const [commitP, setCommitP] = useState(0)        // 0→1 loader fill on the centre card
  const [loading, setLoading] = useState(false)    // centre tile expanding → navigate
  const [cursor, setCursor] = useState<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false })
  const [overCenter, setOverCenter] = useState(false)
  const [tilt, setTilt] = useState<{ id: number; rx: number; ry: number } | null>(null)

  const notchAcc  = useRef(0)
  const commitAcc = useRef(0)
  const lockRef   = useRef(false)
  const posRef    = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setOpen(!rev); setStep(0); setCommitP(0); setLoading(false); setOverCenter(false)
    notchAcc.current = 0; commitAcc.current = 0; lockRef.current = false
  }, [currentPage, rev])

  // Track the pointer globally so the overlay knows where it is the moment it opens.
  useEffect(() => {
    const onMoveWin = (e: MouseEvent) => { posRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMoveWin, { passive: true })
    return () => window.removeEventListener('mousemove', onMoveWin)
  }, [])

  const centeredIdx = currentPage + dir * step

  const pointerOnCenter = () => {
    const el = centerElRef.current
    if (!el) return false
    const r = el.getBoundingClientRect()
    const { x, y } = posRef.current
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }

  const orbit = (delta: 1 | -1) => {
    notchAcc.current = 0
    lockRef.current = true
    setStep(s => Math.max(0, Math.min(maxStep, s + delta)))
    setTimeout(() => { lockRef.current = false }, STEP_LOCK_MS)
  }

  useEffect(() => {
    if (rev && currentPage === 0) return        // nothing behind the first page
    const onWheel = (e: WheelEvent) => {
      // Normalise so d > 0 always means "advance the orbit".
      const d = rev ? -e.deltaY : e.deltaY
      let engaged: boolean
      if (rev) {
        engaged = open || window.scrollY < 8
      } else {
        const rect = ref.current?.getBoundingClientRect()
        engaged = !!rect && rect.top <= 2 && rect.bottom <= window.innerHeight + 2
      }
      if (loading) { if (engaged) e.preventDefault(); return }

      if (d > 0) {
        if (!engaged) return
        e.preventDefault()
        // Opening: a notch of up-scroll at the top summons the overlay.
        if (rev && !open) {
          notchAcc.current += d
          if (notchAcc.current >= NOTCH) {
            notchAcc.current = 0; lockRef.current = true; setOpen(true)
            setTimeout(() => { lockRef.current = false }, STEP_LOCK_MS)
          }
          return
        }
        // Over the centre card → fill the loader and enter that page.
        if (pointerOnCenter() && centeredIdx !== currentPage) {
          commitAcc.current = Math.min(COMMIT_TOTAL, commitAcc.current + d)
          const cp = commitAcc.current / COMMIT_TOTAL
          setCommitP(cp)
          if (cp >= 1) {
            setLoading(true)
            setTimeout(() => onNavigate(centeredIdx), 560)
          }
          return
        }
        // Anywhere else → keep orbiting (stops at the end of the sitemap).
        if (step >= maxStep || lockRef.current) return
        if (commitAcc.current > 0) { commitAcc.current = 0; setCommitP(0) }
        notchAcc.current += d
        if (notchAcc.current >= NOTCH) orbit(1)
      } else if (d < 0) {
        // Unwind: drain the loader first, then orbit back. Past the current page
        // card (step 0) the nav releases.
        if (commitAcc.current > 0) {
          e.preventDefault()
          commitAcc.current = Math.max(0, commitAcc.current + d)
          setCommitP(commitAcc.current / COMMIT_TOTAL)
        } else if (step > 0) {
          e.preventDefault()
          if (lockRef.current) return
          notchAcc.current += d
          if (notchAcc.current <= -NOTCH) orbit(-1)
        } else if (rev && open) {
          e.preventDefault()
          if (lockRef.current) return
          notchAcc.current += d
          if (notchAcc.current <= -NOTCH) { notchAcc.current = 0; setOpen(false); setCursor(c => ({ ...c, on: false })) }
        } else if (rev) {
          notchAcc.current = 0
        }
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [rev, open, currentPage, step, maxStep, centeredIdx, loading, onNavigate])

  const onMove = (e: ReactMouseEvent) => {
    posRef.current = { x: e.clientX, y: e.clientY }
    setCursor({ x: e.clientX, y: e.clientY, on: true })
    setOverCenter(pointerOnCenter())
  }

  if (rev && currentPage === 0) return null

  const num = (id: number) => String(id + 1).padStart(2, '0')

  // Window of pages currently on stage: offsets -3..+2 → slots -1..4.
  // Opening mode walks the sitemap backwards and mirrors the ladder horizontally.
  const cards = [-3, -2, -1, 0, 1, 2]
    .map(off => ({ slot: off + 2, idx: centeredIdx + dir * off }))
    .filter(c => c.idx >= 0 && c.idx < L)

  // Page-load progress: the centre tile expands and the section floods blue in
  // lock-step with the ring cursor filling (commitP).
  const load = loading ? 1 : commitP
  const eLoad = ease(load)
  const lead  = ease(Math.min(1, load * 1.25))   // leading edge of the expansion

  return (
    <section ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setCursor(c => ({ ...c, on: false }))}
      style={{
        ...(rev
          ? { position: 'fixed', inset: 0, zIndex: 80, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .45s ease' }
          : { position: 'relative', width: '100%', height: '100vh' }),
        overflow: 'hidden', background: '#000', cursor: cursor.on ? 'none' : 'default',
      }}>

      {/* Blue flood — rises (closing) or falls (opening) as the centre tile loads */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 115% 72% at 50% ${rev ? lerp(-18, 48, eLoad) : lerp(118, 52, eLoad)}%, rgba(${SEL},${lerp(0.2, 0.96, eLoad)}) 0%, transparent ${lerp(64, 96, eLoad)}%)`,
      }} />

      {/* Title — closing sits top-left, opening mirrors to bottom-left */}
      <h2 style={{
        position: 'absolute', left: 40, margin: 0, zIndex: 4, ...(rev ? { bottom: 40 } : { top: 40 }),
        fontFamily: FONT.sans, fontWeight: 400, fontSize: 36, lineHeight: 1.15, letterSpacing: '-0.72px',
        color: '#fff', maxWidth: 460, opacity: 1 - Math.min(1, load * 2), transition: 'opacity .2s ease',
      }}>
        {rev ? openingTitle(centeredIdx, currentPage) : closingTitle(centeredIdx)}
      </h2>

      {/* Orbital carousel */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {cards.map(({ slot, idx }) => {
          const page = PAGES[idx]
          const s = SLOT[slot]
          const cx = rev ? 100 - s.cx : s.cx
          const isCenter = slot === 2
          const blue = isCenter ? 1 : 0

          let rectL = cx - s.w / 2, rectT = s.cy - s.h / 2, rectW = s.w, rectH = s.h, radius = 20
          let op = open ? s.op : 0
          if (isCenter && load > 0) {
            // Closing expands toward the top, opening toward the bottom.
            rectL = lerp(cx - s.w / 2, 0, eLoad)
            rectW = lerp(s.w, 100, eLoad)
            const top    = lerp(s.cy - s.h / 2, 0,   rev ? eLoad : lead)
            const bottom = lerp(s.cy + s.h / 2, 100, rev ? lead : eLoad)
            rectT = top; rectH = bottom - top
            radius = lerp(20, 0, eLoad)
            op = 1
          }

          // 3D perspective: every card (centre included) rests with a gentle fan
          // (mirrored in opening mode), and tilts toward the pointer on hover.
          let rx = 0
          let ry = (2 - slot) * 8 * dir
          if (tilt && tilt.id === page.id && !loading) { rx = tilt.rx; ry = tilt.ry }
          if (isCenter && load > 0) { rx = lerp(rx, 0, eLoad); ry = lerp(ry, 0, eLoad) }

          const g = isCenter ? 255 : 78
          const clickable = !isCenter && !loading
          const labelOp = isCenter ? 1 - Math.min(1, load * 2) : 1

          return (
            <button key={page.id} disabled={loading}
              ref={isCenter ? centerElRef : undefined}
              onClick={() => clickable && setStep(st => Math.max(0, Math.min(maxStep, st + (slot - 2))))}
              onMouseLeave={() => { if (tilt?.id === page.id) setTilt(null) }}
              onMouseMove={ev => {
                if (loading) return
                const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
                const px = (ev.clientX - r.left) / r.width - 0.5
                const py = (ev.clientY - r.top) / r.height - 0.5
                setTilt({ id: page.id, rx: -py * 26, ry: px * 26 })
              }}
              style={{
                position: 'absolute',
                left: `${rectL}%`, top: `${rectT}%`, width: `${rectW}%`, height: `${rectH}%`,
                background: `rgba(${SEL},${blue})`, borderRadius: radius,
                borderStyle: 'none none solid none', borderBottomWidth: 2,
                borderBottomColor: `rgba(64,64,64,${isCenter ? 0 : Math.min(1, op)})`,
                opacity: op, overflow: 'hidden', padding: 0, textAlign: 'left',
                transformStyle: 'preserve-3d',
                transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`,
                cursor: clickable ? 'none' : 'default', zIndex: isCenter ? 3 : 1,
                transition: [
                  'left .56s cubic-bezier(.34,1.4,.5,1)',
                  'top .56s cubic-bezier(.34,1.4,.5,1)',
                  'width .56s cubic-bezier(.34,1.4,.5,1)',
                  'height .56s cubic-bezier(.34,1.4,.5,1)',
                  'transform .3s ease',
                  'background .45s ease',
                  'border-radius .45s ease',
                  `opacity .4s ease ${rev && open && load === 0 ? (4 - slot) * 0.06 : 0}s`,
                ].join(', '),
              }}>
              <span style={{ position: 'absolute', top: 14, left: 20, fontFamily: FONT.sans, fontSize: s.font, color: `rgb(${g},${g},${g})`, letterSpacing: '-1px', lineHeight: 1.1, opacity: labelOp, transition: 'font-size .56s cubic-bezier(.34,1.4,.5,1), color .45s ease, opacity .3s ease' }}>{num(idx)}</span>
              <span style={{ position: 'absolute', bottom: 14, left: 20, fontFamily: FONT.sans, fontSize: s.font, color: `rgb(${g},${g},${g})`, letterSpacing: '-1px', lineHeight: 1.1, whiteSpace: 'nowrap', opacity: labelOp, transition: 'font-size .56s cubic-bezier(.34,1.4,.5,1), color .45s ease, opacity .3s ease' }}>{page.title}</span>
            </button>
          )
        })}
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 4, ...(rev ? { top: 40 } : { bottom: 84 }),
        fontFamily: FONT.mono, fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase',
        color: `rgba(${SEL},.55)`, opacity: loading ? 0 : 0.7, transition: 'opacity .3s ease',
      }}>
        {rev
          ? (step === 0 ? 'Scroll up to orbit back · down to close' : 'Scroll up on the centre to return · elsewhere to keep orbiting')
          : (step === 0 ? 'Scroll to orbit the next pages' : 'Scroll on the centre to enter · elsewhere to keep orbiting')}
      </div>

      {/* Footer — credits + buttons (closing only) */}
      {!rev && (
        <div style={{
          position: 'absolute', bottom: 24, left: 20, right: 20, zIndex: 4,
          opacity: loading ? 0 : 1, transition: 'opacity .4s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 9, letterSpacing: '.36px', textTransform: 'uppercase', color: '#7a7a7a', maxWidth: 188, lineHeight: 1 }}>
            © 2026 NEO. All rights reserved
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Company', 'Careers', 'Contact'].map(label => (
              <button key={label} style={{
                height: 30, padding: '0 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: 'rgba(244,244,244,.2)', fontFamily: FONT.mono, fontSize: 12, color: '#fff', lineHeight: 1.5,
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom ring cursor */}
      {cursor.on && open && !loading && (
        <div style={{ position: 'fixed', left: cursor.x, top: cursor.y, transform: 'translate(-50%,-50%)', zIndex: 90, pointerEvents: 'none' }}>
          <RingCursor variant={overCenter && centeredIdx !== currentPage ? 'outline' : 'filled'} fill={commitP} />
        </div>
      )}
    </section>
  )
}

export function ClosingSection(props: { currentPage: number; onNavigate: (id: number) => void }) {
  return <OrbitalNav {...props} mode="closing" />
}
