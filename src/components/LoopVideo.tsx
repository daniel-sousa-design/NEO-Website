import { useEffect, useRef, type CSSProperties } from 'react'

// ─── Looping video with a pause between loops ─────────────────────────────────
// Muted autoplay (browsers only allow silent autoplay). Instead of the native
// `loop`, waits `pauseMs` on the last frame before restarting.

export function LoopVideo({ src, pauseMs = 1000, style }: { src: string; pauseMs?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onEnded = () => {
      timer = setTimeout(() => { v.currentTime = 0; v.play().catch(() => {}) }, pauseMs)
    }
    v.addEventListener('ended', onEnded)
    return () => { clearTimeout(timer); v.removeEventListener('ended', onEnded) }
  }, [pauseMs])

  return <video ref={ref} src={src} autoPlay muted playsInline preload="auto" aria-hidden="true" style={style} />
}
