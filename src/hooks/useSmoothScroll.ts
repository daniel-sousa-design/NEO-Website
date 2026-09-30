import { useEffect } from 'react'
import { isScrollLocked } from '../lib/scroll'

// ─── Smooth wheel scroll ──────────────────────────────────────────────────────
// Mouse-wheel / trackpad input moves a target position; the page eases toward
// it every frame, so scrolling glides and settles a beat after input stops.
//
// Plays nicely with everything else that scrolls:
//   · OrbitalNav claims wheel events with preventDefault — those are left alone
//     (see the capture → late-bubble listener pair below).
//   · Keyboard, scrollbar drag, touch and window.scrollTo stay native; any
//     scroll we didn't cause re-syncs the target and cancels the glide.
//   · Skipped while the intro locks the page (body overflow: hidden), for
//     pinch-zoom, horizontal gestures, and under prefers-reduced-motion.

const SMOOTHING = 7   // higher = snappier; ~7 settles in roughly half a second
const LINE_PX = 40    // deltaMode 1 (lines) → px

export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let target = window.scrollY
    let current = window.scrollY
    let lastSet = -1          // last position we wrote, to tell our scrolls from others
    let raf = 0
    let lastT = 0

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight

    const frame = (t: number) => {
      // rAF's frame time can predate the wheel event that started the glide.
      const dt = Math.max(0, Math.min(.05, (t - lastT) / 1000))
      lastT = t
      current += (target - current) * (1 - Math.exp(-SMOOTHING * dt))
      if (Math.abs(target - current) < .5) current = target
      lastSet = current
      window.scrollTo(0, current)
      raf = current === target ? 0 : requestAnimationFrame(frame)
    }

    const stop = () => { cancelAnimationFrame(raf); raf = 0 }

    // Runs after every other window wheel listener: a bubble listener added
    // during the capture pass is invoked last in the bubble pass.
    const onWheelLate = (e: WheelEvent) => {
      if (e.defaultPrevented) return                    // claimed by OrbitalNav
      e.preventDefault()
      const unit = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1
      if (!raf) { current = target = window.scrollY; lastT = performance.now() }
      target = Math.max(0, Math.min(maxScroll(), target + e.deltaY * unit))
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onWheelCapture = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      if (isScrollLocked()) return
      window.addEventListener('wheel', onWheelLate, { once: true, passive: false })
    }

    const onScroll = () => {
      if (Math.abs(window.scrollY - lastSet) > 1) { stop(); current = target = window.scrollY }
    }

    window.addEventListener('wheel', onWheelCapture, { capture: true, passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      stop()
      window.removeEventListener('wheel', onWheelCapture, { capture: true })
      window.removeEventListener('wheel', onWheelLate)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}
