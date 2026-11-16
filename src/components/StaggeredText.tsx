import type { CSSProperties, ReactNode } from 'react'

// ─── Staggered hero text ──────────────────────────────────────────────────────
// `noOrphan` keeps the last two words on the same line (they wrap together),
// so the text never ends on a lone word. Each word still animates on its own.

export function StaggeredText({ text, active, noOrphan = false, className, style }: {
  text: string; active: boolean; noOrphan?: boolean; className?: string; style?: CSSProperties
}) {
  const list = text.split(' ')
  const word = (w: string, wi: number) => (
    // The mask clips each word while it rises; pad it below (and pull the
    // layout back up) so descenders like g, p, y aren't cut off.
    <span key={wi} style={{ display: 'inline-block', marginRight: wi < list.length - 1 ? '0.25em' : 0, overflow: 'hidden', paddingBottom: '.18em', marginBottom: '-.18em' }}>
      <span style={{
        display: 'inline-block',
        transform: active ? 'translateY(0)' : 'translateY(110%)',
        opacity: active ? 1 : 0,
        transition: `transform .7s ${.05 + wi * .06}s cubic-bezier(.22,1,.36,1), opacity .5s ${.05 + wi * .06}s ease`,
      }}>
        {w}
      </span>
    </span>
  )
  let words: ReactNode[] = list.map(word)
  if (noOrphan && list.length > 2) {
    const pair = <span key="last" style={{ whiteSpace: 'nowrap' }}>{words.slice(-2)}</span>
    words = [...words.slice(0, -2), pair]
  }
  return <span className={className} style={{ display: 'block', ...style }}>{words}</span>
}
