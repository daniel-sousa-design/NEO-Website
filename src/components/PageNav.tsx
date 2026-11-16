import { useState, useEffect, useRef } from 'react'
import { A } from '../data/pages'
import type { IntroPhase } from '../hooks/useIntroAnimation'
import { PageMenu } from './PageMenu'
import { GlassBackdrop, type GlassParams } from './GlassBackdrop'
import { NavBar } from './NavBar'

// Which top nav to show: 'bar' (logo + NEO tiles, centred page box that
// stacks out the other pages, orbital loader on the right — see NavBar) or
// 'pill' (the original logo + page pill that expands sideways — see PageMenu).
const NAV_STYLE: 'bar' | 'pill' = 'bar'
// The bar sits fixed at the top of the screen from the start, with no glass
// panel or rule behind it (its slot still holds the hero layout).
const BAR = NAV_STYLE === 'bar'

// Figma Glass panel values for the pinned bar (see GlassBackdrop for mapping).
const NAV_GLASS: GlassParams = {
  lightAngle: 79, lightIntensity: 20,
  refraction: 63, depth: 34, dispersion: 53, frost: 20, splay: 100,
}

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
  const isDone = introPhase === 'done'
  const lineVisible = introPhase !== 'init'

  return (
    <div ref={slotRef} style={{ height: height || undefined }}>
      <div
        ref={navRef}
        style={{
          position: BAR || isStuck ? 'fixed' : 'relative', top: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', alignItems: 'center',
          padding: BAR ? '13px 20px' : '23px 20px 22px',
          borderBottom: !BAR && lineVisible && !isStuck ? '1px solid rgba(244,244,244,.12)' : '1px solid transparent',
          transform: !lineVisible ? 'translateY(12px)' : hidden ? 'translateY(-110%)' : 'translateY(0)',
          opacity: lineVisible ? 1 : 0,
          transition: 'border-color .35s ease, transform .5s cubic-bezier(.22,1,.36,1), opacity .5s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* Glass backdrop — only once pinned over the page */}
        <GlassBackdrop params={NAV_GLASS} active={!BAR && isStuck} />

        {NAV_STYLE === 'bar' ? (
          <NavBar title={title} logoVisible={logoVisible} boxesVisible={pillVisible} interactive={isDone} />
        ) : (<>
          {/* Logo — pinned left */}
          <div style={{
            height: 39, width: 57, flexShrink: 0, position: 'relative', overflow: 'hidden',
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? 'translateX(0)' : 'translateX(-16px)',
            transition: 'opacity .5s .08s ease, transform .6s .08s cubic-bezier(.22,1,.36,1)',
          }}>
            <img src={`${A}/neo-logo.svg`} alt="NEO" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Page pill — aligned to the hero text's left edge; expands into all pages on hover */}
          <PageMenu title={title} visible={pillVisible} interactive={isDone} />
        </>)}
      </div>
    </div>
  )
}
