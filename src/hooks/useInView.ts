import { useState, useEffect, useRef } from 'react'

// ─── In-view hook ─────────────────────────────────────────────────────────────
// Flips to true once the element scrolls into view. By default it then stays
// true; with `once = false` it flips back when the element drops below the
// trigger line again (scrolling up), so reveals can play in reverse. Leaving
// off the top of the screen doesn't count — it stays revealed.

export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px', once = true) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || (once && inView)) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        if (once) io.disconnect()
      } else if (!once && entry.boundingClientRect.top > 0) {
        setInView(false)
      }
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin, once])

  return [ref, inView] as const
}
