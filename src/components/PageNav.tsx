import { useState, useEffect, useRef } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import type { IntroPhase } from '../hooks/useIntroAnimation'
import { TypedText } from './TypedText'

// ─── Page nav ─────────────────────────────────────────────────────────────────
// Sits in the hero on load (spacer above it). Once scrolled up to the top of
// the viewport it pins there (position: fixed) and gains its glass backdrop;
// scrolling back above that point returns it to the hero. A placeholder of the
// same height holds its slot in the flow so nothing jumps.
// Slides away while a [data-hides-page-nav] section (the closing orbital nav,
// which has its own title in that corner) fills the top of the screen.

export function PageNav({ title, introPhase }: { title: string; introPhase: IntroPhase }) {
  const slotRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const update = () => {
      if (!slotRef.current || !navRef.current) return
      const navH = navRef.current.offsetHeight
      setHeight(navH)
      setIsStuck(slotRef.current.getBoundingClientRect().top <= 0)
      const cover = document.querySelector('[data-hides-page-nav]')
      setHidden(!!cover && cover.getBoundingClientRect().top <= navH)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  const logoVisible = introPhase !== 'init'
  const pillVisible = introPhase === 'pill' || introPhase === 'hero' || introPhase === 'done'
  const lineVisible = introPhase !== 'init'

  return (
    <div ref={slotRef} style={{ height: height || undefined }}>
      <div
        ref={navRef}
        style={{
          position: isStuck ? 'fixed' : 'relative', top: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', alignItems: 'center',
          padding: '23px 20px 22px',
          borderBottom: lineVisible ? '1px solid rgba(244,244,244,.12)' : '1px solid transparent',
          background: isStuck ? 'rgba(0,0,0,.78)' : 'transparent',
          backdropFilter: isStuck ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: isStuck ? 'blur(14px)' : 'none',
          transform: !lineVisible ? 'translateY(12px)' : hidden ? 'translateY(-110%)' : 'translateY(0)',
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
          <img src={`${A}/neo-logo.svg`} alt="NEO" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
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
    </div>
  )
}
