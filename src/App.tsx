import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { PAGES } from './data/pages'
import { spinFavicon } from './lib/faviconSpin'
import { ease } from './lib/motion'
import { pageFromPath, pathFor, titleFor } from './lib/routes'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { NavigationContext } from './lib/navigation'
import { TransitionOverlay } from './components/TransitionOverlay'
import { OrbitalNav, ClosingSection } from './components/OrbitalNav'
import { EarthPage } from './pages/EarthPage'
import { MissionsPage } from './pages/MissionsPage'
import { SystemsPage } from './pages/SystemsPage'
import { EngineeringPage } from './pages/EngineeringPage'
import { AccessToSpacePage } from './pages/AccessToSpacePage'
import { EcosystemPage } from './pages/EcosystemPage'
import { InsightsPage } from './pages/InsightsPage'

// ─── App ──────────────────────────────────────────────────────────────────────

/** Page for the URL the site was opened on. Unknown or non-canonical paths
 *  (e.g. /earth, /nope) are rewritten in place so the address bar is correct. */
function initialPage() {
  const id = pageFromPath(window.location.pathname) ?? 0
  if (window.location.pathname !== pathFor(id)) {
    window.history.replaceState(null, '', pathFor(id) + window.location.search)
  }
  return id
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [introResetKey, setIntroResetKey] = useState(0)
  const pageKeyRef = useRef(0)
  useSmoothScroll()

  const revealPage = useCallback(() => {
    const start = performance.now()
    const dur = 900
    const fade = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setOverlayOpacity(1 - ease(p))
      if (p < 1) requestAnimationFrame(fade)
      else setIsTransitioning(false)
    }
    setTimeout(() => requestAnimationFrame(fade), 100)
  }, [])

  // `fromHistory` is set for back/forward, where the browser has already
  // changed the URL and we must not push another entry.
  const navigate = useCallback((targetId: number, fromHistory = false) => {
    if (isTransitioning || targetId === currentPage) return
    if (targetId < 0 || targetId >= PAGES.length) return
    if (!fromHistory) window.history.pushState(null, '', pathFor(targetId))
    setIsTransitioning(true)
    setOverlayOpacity(1)
    setTimeout(() => {
      pageKeyRef.current += 1
      setIntroResetKey(0)  // reset key so new page starts fresh
      setCurrentPage(targetId)
      window.scrollTo({ top: 0, behavior: 'instant' })
      revealPage()
    }, 180)
  }, [isTransitioning, currentPage, revealPage])

  // The app resets scroll itself on every page change.
  useEffect(() => { window.history.scrollRestoration = 'manual' }, [])

  // Back/forward: run the same transition as a click.
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  useEffect(() => {
    const onPop = () => navigateRef.current(pageFromPath(window.location.pathname) ?? 0, true)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Back/forward pressed mid-transition is dropped by `navigate`; once the
  // transition settles, catch up with whatever the URL now says.
  useEffect(() => {
    if (isTransitioning) return
    const target = pageFromPath(window.location.pathname) ?? 0
    if (target !== currentPage) navigate(target, true)
  }, [isTransitioning, currentPage, navigate])

  useEffect(() => { document.title = titleFor(currentPage) }, [currentPage])
  // The tab icon turns once on load and on every page change.
  useEffect(() => { spinFavicon() }, [currentPage])

  const nav = useMemo(() => ({ current: currentPage, navigate }), [currentPage, navigate])

  return (
    <NavigationContext.Provider value={nav}>
      <div style={{ background: '#000', minHeight: '100vh' }}>
        <TransitionOverlay opacity={overlayOpacity} />

        {/* Opening orbital nav — scroll up at the top to orbit back */}
        <OrbitalNav key={`open-${currentPage}`} currentPage={currentPage} onNavigate={navigate} mode="opening" />

        <div key={pageKeyRef.current}>
          {currentPage === 0 && <EarthPage introResetKey={introResetKey} />}
          {currentPage === 1 && <MissionsPage introResetKey={introResetKey} />}
          {currentPage === 2 && <SystemsPage introResetKey={introResetKey} />}
          {currentPage === 3 && <EngineeringPage introResetKey={introResetKey} />}
          {currentPage === 4 && <AccessToSpacePage introResetKey={introResetKey} />}
          {currentPage === 5 && <EcosystemPage introResetKey={introResetKey} />}
          {currentPage === 6 && <InsightsPage introResetKey={introResetKey} />}
          <ClosingSection currentPage={currentPage} onNavigate={navigate} />
        </div>
      </div>
    </NavigationContext.Provider>
  )
}
