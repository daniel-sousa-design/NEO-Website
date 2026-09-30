import { useState, useEffect, useRef } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import type { IntroPhase } from '../hooks/useIntroAnimation'
import { TypedText } from './TypedText'

// ─── Page nav ─────────────────────────────────────────────────────────────────
// Lives in document flow. Sits at ~48vh on load (spacer above it in hero).
// Becomes position:sticky when scrolled to top.
// Glass appears when stuck. Hides after 1s. Re-shows on scroll up.

export function PageNav({ title, introPhase }: { title: string; introPhase: IntroPhase }) {
  const navRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY   = useRef(0)
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const timerRunning  = useRef(false)
  const isStuckRef    = useRef(false)
  const navVisibleRef = useRef(true)
  const isDone = introPhase === 'done'

  // Use refs in the scroll handler to avoid stale closure / effect re-subscription.
  useEffect(() => {
    if (!isDone) return
    const onScroll = () => {
      if (!navRef.current) return
      const stuck   = navRef.current.getBoundingClientRect().top <= 1
      const goingUp = window.scrollY < lastScrollY.current
      lastScrollY.current = window.scrollY

      if (stuck !== isStuckRef.current) { isStuckRef.current = stuck; setIsStuck(stuck) }

      if (!stuck) {
        // Un-stuck: always visible, kill timer
        clearTimeout(hideTimerRef.current); timerRunning.current = false
        if (!navVisibleRef.current) { navVisibleRef.current = true; setNavVisible(true) }
        return
      }

      if (goingUp) {
        // Scrolling up: show and cancel any pending hide
        clearTimeout(hideTimerRef.current); timerRunning.current = false
        if (!navVisibleRef.current) { navVisibleRef.current = true; setNavVisible(true) }
      } else if (!timerRunning.current) {
        // Scrolling down, stuck, no timer yet: start hide countdown
        timerRunning.current = true
        hideTimerRef.current = setTimeout(() => {
          timerRunning.current = false
          navVisibleRef.current = false
          setNavVisible(false)
        }, 1000)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(hideTimerRef.current) }
  }, [isDone]) // stable — no state in closure

  const logoVisible = introPhase !== 'init'
  const pillVisible = introPhase === 'pill' || introPhase === 'hero' || introPhase === 'done'
  const lineVisible = introPhase !== 'init'

  return (
    <div
      ref={navRef}
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center',
        padding: '23px 20px 22px',
        borderBottom: lineVisible ? '1px solid rgba(244,244,244,.12)' : '1px solid transparent',
        background: isStuck ? 'rgba(0,0,0,.78)' : 'transparent',
        backdropFilter: isStuck ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: isStuck ? 'blur(14px)' : 'none',
        transform: (!isDone && !lineVisible)
          ? 'translateY(12px)'
          : (isDone && isStuck && !navVisible)
            ? 'translateY(-110%)'
            : 'translateY(0)',
        opacity: lineVisible ? 1 : 0,
        transition: 'background .35s ease, backdrop-filter .35s ease, transform .5s cubic-bezier(.22,1,.36,1), opacity .5s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Logo — pinned left */}
      <div style={{
        height: 39, width: 57, flexShrink: 0, position: 'relative', overflow: 'hidden',
        opacity: logoVisible ? 1 : 0,
        transform: logoVisible ? 'translateX(0)' : 'translateX(-16px)',
        transition: 'opacity .5s .08s ease, transform .6s .08s cubic-bezier(.22,1,.36,1)',
      }}>
        <img src={`${A}/d19e7.svg`} alt="NEO" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      {/* Pill — absolutely aligned to hero text left edge */}
      <div style={{
        position: 'absolute', left: 'calc(20% + 58px)',
        background: 'rgba(244,244,244,.2)', borderRadius: 6, padding: '10px 12px',
        maxWidth: pillVisible ? 200 : 0,
        overflow: 'hidden',
        opacity: pillVisible ? 1 : 0,
        transition: 'max-width .55s cubic-bezier(.22,1,.36,1), opacity .3s ease',
      }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 12, color: '#fff', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
          <TypedText text={title} active={pillVisible} />
        </span>
      </div>
    </div>
  )
}
