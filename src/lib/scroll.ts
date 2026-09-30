import { ease } from './motion'

// ─── Page scroll lock + scripted scroll ───────────────────────────────────────
// The lock is `overflow: hidden` on <body>: it stops native scrolling, and
// every custom wheel handler (useSmoothScroll, OrbitalNav) checks isScrollLocked()
// so scroll-up gestures are blocked too.

export function lockScroll()   { document.body.style.overflow = 'hidden' }
export function unlockScroll() { document.body.style.overflow = '' }
export function isScrollLocked() { return document.body.style.overflow === 'hidden' }

/** Ease the page to `top` over `ms`. Any user scroll input cancels it.
 *  Returns a cancel function. */
export function animateScrollTo(top: number, ms = 1000) {
  const from = window.scrollY
  const to = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, top))
  let raf = 0
  let start = 0
  const cancel = () => {
    cancelAnimationFrame(raf)
    for (const ev of INPUT_EVENTS) window.removeEventListener(ev, cancel, true)
  }
  const frame = (t: number) => {
    if (!start) start = t
    const p = Math.min(1, (t - start) / ms)
    window.scrollTo(0, from + (to - from) * ease(p))
    if (p < 1) raf = requestAnimationFrame(frame)
    else cancel()
  }
  for (const ev of INPUT_EVENTS) window.addEventListener(ev, cancel, { capture: true, passive: true })
  raf = requestAnimationFrame(frame)
  return cancel
}

const INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const
