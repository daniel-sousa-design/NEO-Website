import type { CSSProperties } from 'react'

// ─── Staggered hero text ──────────────────────────────────────────────────────

export function StaggeredText({ text, active, className, style }: { text: string; active: boolean; className?: string; style?: CSSProperties }) {
  const list = text.split(' ')
  return (
    <span className={className} style={{ display: 'block', ...style }}>
      {list.map((word, wi) => (
        // The mask clips each word while it rises; pad it below (and pull the
        // layout back up) so descenders like g, p, y aren't cut off.
        <span key={wi} style={{ display: 'inline-block', marginRight: '0.25em', overflow: 'hidden', paddingBottom: '.18em', marginBottom: '-.18em' }}>
          <span style={{
            display: 'inline-block',
            transform: active ? 'translateY(0)' : 'translateY(110%)',
            opacity: active ? 1 : 0,
            transition: `transform .7s ${.05 + wi * .06}s cubic-bezier(.22,1,.36,1), opacity .5s ${.05 + wi * .06}s ease`,
          }}>
            {word}
          </span>
        </span>
      ))}
    </span>
  )
}
