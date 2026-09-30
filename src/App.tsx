import { useState, useRef, useCallback } from 'react'
import { PAGES } from './data/pages'
import { ease } from './lib/motion'
import { GlobalNav } from './components/GlobalNav'
import { TransitionOverlay } from './components/TransitionOverlay'
import { OrbitalNav, ClosingSection } from './components/OrbitalNav'
import { EarthPage } from './pages/EarthPage'
import { MissionsPage } from './pages/MissionsPage'
import { SystemsPage } from './pages/SystemsPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentPage, setCurrentPage] = useState(0)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [introResetKey, setIntroResetKey] = useState(0)
  const pageKeyRef = useRef(0)

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

  const navigate = useCallback((targetId: number) => {
    if (isTransitioning || targetId === currentPage) return
    if (targetId < 0 || targetId >= PAGES.length) return
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

  const page = PAGES[currentPage]
  const showGlobalNav = currentPage !== 1 && currentPage !== 2

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <TransitionOverlay opacity={overlayOpacity} />
      <GlobalNav currentPage={currentPage} onNavigate={navigate} visible={showGlobalNav} />

      {/* Opening orbital nav — scroll up at the top to orbit back */}
      <OrbitalNav key={`open-${currentPage}`} currentPage={currentPage} onNavigate={navigate} mode="opening" />

      <div key={pageKeyRef.current}>
        {currentPage === 0 && <EarthPage />}
        {currentPage === 1 && <MissionsPage introResetKey={introResetKey} />}
        {currentPage === 2 && <SystemsPage introResetKey={introResetKey} />}
        {currentPage >= 3  && <PlaceholderPage page={page} />}
        <ClosingSection currentPage={currentPage} onNavigate={navigate} />
      </div>
    </div>
  )
}
