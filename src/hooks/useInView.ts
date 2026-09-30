import { useState, useEffect, useRef } from 'react'

// ─── In-view hook ─────────────────────────────────────────────────────────────
// Flips to true once the element scrolls into view, then stays true.

export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])

  return [ref, inView] as const
}
