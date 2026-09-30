import { useState, useEffect, type CSSProperties } from 'react'
import { useInView } from '../hooks/useInView'

// ─── Word-staggered text reveal ───────────────────────────────────────────────
// Once the text scrolls into view, each word fades up into place on its own,
// left to right in reading order. `\n` forces a line break.
// Remounting (e.g. with a new `key`) replays the reveal. `ready` holds the
// reveal back (and hides the text again when it turns false) — e.g. until
// another animation has finished.

const RISE = 14       // px each word travels up
const STAGGER = .07   // s between consecutive words
const EASE = 'cubic-bezier(.16,1,.3,1)'

export function RevealText({ text, as: Tag = 'p', delay = 0, ready = true, style, className }: {
  text: string; as?: 'p' | 'h2' | 'h3' | 'span'; delay?: number; ready?: boolean; style?: CSSProperties; className?: string
}) {
  const [ref, inView] = useInView<HTMLElement>()
  const [shown, setShown] = useState(false)

  // Wait a frame after entering view so the hidden state is painted first.
  useEffect(() => {
    if (!ready) { setShown(false); return }
    if (!inView) return
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [inView, ready])

  let n = 0
  return (
    <Tag ref={ref as never} className={className} style={style}>
      {text.split('\n').map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {line.split(' ').map((word, wi) => {
            const d = delay + n++ * STAGGER
            return (
              <span key={wi}>
                {wi > 0 && ' '}
                <span className="neo-reveal" style={{
                  display: 'inline-block',
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : `translateY(${RISE}px)`,
                  transition: `opacity 1s ${d}s ${EASE}, transform 1.2s ${d}s ${EASE}`,
                }}>{word}</span>
              </span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
}
