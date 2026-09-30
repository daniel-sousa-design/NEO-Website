import { useState, useEffect, useRef } from 'react'

// ─── Typed text component (pill reveal) ───────────────────────────────────────

export function TypedText({ text, active, delay = 0 }: { text: string; active: boolean; delay?: number }) {
  const [count, setCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) { setCount(0); return }
    setTimeout(() => {
      let i = 0
      intervalRef.current = setInterval(() => {
        i++
        setCount(i)
        if (i >= text.length && intervalRef.current) clearInterval(intervalRef.current)
      }, 48)
    }, delay)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, text, delay])

  return <>{text.slice(0, count)}</>
}
