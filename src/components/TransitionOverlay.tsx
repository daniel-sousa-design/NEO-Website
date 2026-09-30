import { SEL } from '../data/pages'

// ─── Transition overlay ───────────────────────────────────────────────────────

export function TransitionOverlay({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null
  return <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none', background: `rgba(${SEL},${opacity})` }} />
}
