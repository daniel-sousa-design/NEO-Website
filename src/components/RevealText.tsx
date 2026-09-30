import { useState, useEffect, useLayoutEffect, type CSSProperties } from 'react'
import { useInView } from '../hooks/useInView'

// ─── Word-staggered text reveal ───────────────────────────────────────────────
// Once the text scrolls into view, each word fades up into place on its own,
// left to right in reading order. `\n` forces a line break.
// Remounting (e.g. with a new `key`) replays the reveal. `ready` holds the
// reveal back (and hides the text again when it turns false) — e.g. until
// another animation has finished. `by="line"` reveals whole rendered lines
// instead (grouped by where the words wrap), a little quicker. `ownView={false}`
// ignores the text's own visibility and plays as soon as `ready` is true —
// for text whose parent decides when a whole group plays.

const RISE = 14       // px each word travels up
const STAGGER = .07   // s between consecutive words
const EASE = 'cubic-bezier(.16,1,.3,1)'
const LINE_STAGGER = .09   // s between lines in line mode

export function RevealText({ text, as: Tag = 'p', delay = 0, ready = true, ownView = true, by = 'word', style, className }: {
  text: string; as?: 'p' | 'h2' | 'h3' | 'span'; delay?: number; ready?: boolean; ownView?: boolean; by?: 'word' | 'line'; style?: CSSProperties; className?: string
}) {
  const [ref, seen] = useInView<HTMLElement>()
  const inView = seen || !ownView
  const [shown, setShown] = useState(false)

  // Line mode: which rendered line each word sits on (re-measured on resize).
  const [lineOf, setLineOf] = useState<number[]>([])
  useLayoutEffect(() => {
    if (by !== 'line') return
    const measure = () => {
      const words = [...(ref.current?.querySelectorAll<HTMLElement>('.neo-reveal') ?? [])]
      let line = -1, lastTop = -Infinity
      setLineOf(words.map(w => { if (w.offsetTop > lastTop + 2) { line++; lastTop = w.offsetTop } return line }))
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [by, text, ref])

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
            const i = n++
            const d = by === 'line' ? delay + (lineOf[i] ?? 0) * LINE_STAGGER : delay + i * STAGGER
            const dur = by === 'line' ? [.7, .85] : [1, 1.2]
            return (
              <span key={wi}>
                {wi > 0 && ' '}
                <span className="neo-reveal" style={{
                  display: 'inline-block',
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : `translateY(${RISE}px)`,
                  transition: `opacity ${dur[0]}s ${d}s ${EASE}, transform ${dur[1]}s ${d}s ${EASE}`,
                }}>{word}</span>
              </span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
}
