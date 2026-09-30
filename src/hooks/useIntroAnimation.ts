import { useState, useEffect, useRef } from 'react'

// ─── Page intro animation hook ────────────────────────────────────────────────
// Sequence: line → logo → pill → hero. Re-runs whenever resetKey changes.

export type IntroPhase = 'init' | 'line' | 'logo' | 'pill' | 'hero' | 'done'

export function useIntroAnimation(resetKey: number) {
  const [phase, setPhase] = useState<IntroPhase>('init')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    document.body.style.overflow = 'hidden'
    setPhase('init')
    const s = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timers.current.push(t) }
    s(() => setPhase('line'), 120)
    s(() => setPhase('logo'), 480)
    s(() => setPhase('pill'), 900)
    s(() => setPhase('hero'), 1500)
    s(() => { setPhase('done'); document.body.style.overflow = '' }, 2600)
    return () => { timers.current.forEach(clearTimeout); document.body.style.overflow = '' }
  }, [resetKey])

  return phase
}
