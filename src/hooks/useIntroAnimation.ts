import { useState, useEffect, useRef } from 'react'
import { lockScroll, unlockScroll, animateScrollTo } from '../lib/scroll'

// ─── Page intro animation hook ────────────────────────────────────────────────
// Sequence: line → logo → pill → hero. Re-runs whenever resetKey changes.
// Scrolling (both directions) is locked for the whole sequence; once it
// finishes, the page eases down INTRO_NUDGE_PX to hint there is more below.

export type IntroPhase = 'init' | 'line' | 'logo' | 'pill' | 'hero' | 'done'

const INTRO_NUDGE_PX = 100
const INTRO_NUDGE_MS = 1100

export function useIntroAnimation(resetKey: number) {
  const [phase, setPhase] = useState<IntroPhase>('init')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    lockScroll()
    setPhase('init')
    let cancelNudge = () => {}
    const s = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timers.current.push(t) }
    s(() => setPhase('line'), 120)
    s(() => setPhase('logo'), 480)
    s(() => setPhase('pill'), 900)
    s(() => setPhase('hero'), 1500)
    s(() => {
      setPhase('done')
      unlockScroll()
      if (window.scrollY < INTRO_NUDGE_PX) cancelNudge = animateScrollTo(INTRO_NUDGE_PX, INTRO_NUDGE_MS)
    }, 2600)
    return () => { timers.current.forEach(clearTimeout); cancelNudge(); unlockScroll() }
  }, [resetKey])

  return phase
}
