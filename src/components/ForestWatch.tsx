import { useEffect, useRef } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { RevealText } from './RevealText'
import { DotGrid } from './DotGrid'

// ─── "The same eye…" ──────────────────────────────────────────────────────────
// Over the dotted grid: a centred statement, then a tiny frame of the
// Insights case film (looping, muted) that grows as you scroll — scrubbed,
// eased — until it fills most of the width, pinned mid-screen for the latter
// part; then a mono note whose box ends at the video's right edge. The growth
// starts once the statement has risen a little past the middle of the screen and is
// mostly done by the time the frame pins.

const PIN_VH = 80             // pinned scroll at the end of the growth
const PULL_UP = 100           // px — frame starts this much closer to the statement
const START_LINE = .55        // growth starts when the statement's top reaches this fraction of the screen
const START = 40              // px — the frame's size at first
const END_W = .72             // fraction of the width it grows to
const FOLLOW = 7              // scrub easing (1/s)
const NOTE_GAP = .7           // the note's gap below the video, as a share of the natural one
const SPEED = 1.5            // growth completes over 1/SPEED of the scroll from start to the end of the pin
const RATIO = 16 / 9

// Quick to get going, settling at the end — so the frame visibly grows while
// the statement is still on its way up.
const easeOut = (t: number) => 1 - (1 - t) ** 2.4

export function ForestWatch() {
  const titleRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let raf = 0, last = performance.now(), cur = -1
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const title = titleRef.current, pin = pinRef.current, frame = frameRef.current
      if (!title || !pin || !frame) return
      const dt = Math.min(.05, Math.max(0, (t - last) / 1000))
      last = t
      const vh = window.innerHeight, pb = pin.getBoundingClientRect()
      if (pb.bottom < -200 || pb.top > vh * 2) return
      // 0 when the statement's top is at 30% of the screen … 1 when the pin ends.
      const tt = title.getBoundingClientRect().top
      const gap = pb.top - tt                                // statement → pin, constant
      const total = START_LINE * vh - (vh - pb.height - gap)  // scroll from start to the end of the pin
      const target = Math.max(0, Math.min(1, (START_LINE * vh - tt) / (total / SPEED)))
      cur = cur < 0 ? target : cur + (target - cur) * (1 - Math.exp(-FOLLOW * dt))
      const k = easeOut(cur)
      const endW = Math.min(pin.clientWidth * END_W, (vh - 160) * RATIO)
      frame.style.width = `${START + (endW - START) * k}px`
      frame.style.height = `${START + (endW / RATIO - START) * k}px`
    }
    raf = requestAnimationFrame(tick)

    // Only play while it's on screen.
    const v = videoRef.current
    const io = v && new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause() })
    if (v && io) io.observe(v)
    return () => { cancelAnimationFrame(raf); io?.disconnect() }
  }, [])

  return (
    <section style={{ position: 'relative', padding: '500px 20px 400px' }}>
      {/* Dotted grid — starts 300px into the section, clear of the news fade above */}
      <div style={{ position: 'absolute', inset: '300px 0 0' }}><DotGrid cols={15} /></div>

      <div ref={titleRef} style={{ position: 'relative' }}>
        <RevealText as="h2" by="line" text="The same eye that watches a facility rise could, one day, watch a forest disappear too:" style={{
          fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(22px, 2.1vw, 30px)', lineHeight: 1.27, color: '#fff',
          textAlign: 'center', maxWidth: 560, margin: '0 auto',
        }} />
      </div>

      {/* The film grows from a thumbnail; pinned mid-screen for the end of it */}
      <div ref={pinRef} style={{ position: 'relative', height: `${100 + PIN_VH}vh`, margin: `-${PULL_UP}px -20px 0` }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={frameRef} style={{ width: START, height: START, overflow: 'hidden', background: '#222', willChange: 'width, height' }}>
            <video ref={videoRef} src={`${A}/insights/insights-case.mp4`} poster={`${A}/insights/insights-case-poster.jpg`}
              muted loop playsInline preload="metadata" aria-label="Black-and-white footage: a facility from orbit, then forest, cleared land and smoke"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Note — same box, its right edge on the video's (the frame's final width, centred) */}
      <div style={{
        position: 'relative', maxWidth: 440, marginLeft: 'auto',
        // 30% closer to the video: the gap is the space under the centred frame, (100vh − frame height) / 2.
        marginTop: `calc(-${1 - NOTE_GAP} * (100vh - min(${END_W} * (100% + 40px) / ${RATIO}, 100vh - 160px)) / 2)`,
        marginRight: `calc((100% + 40px - min(${END_W} * (100% + 40px), (100vh - 160px) * ${RATIO})) / 2 - 20px)`,
      }}>
        <RevealText by="line" text="Zimbabwe alone lost 17% of its tree cover between 2001 and 2024, releasing an estimated 112 million tonnes of carbon - the kind of loss optical alone still catches too late, hidden for months at a time behind cloud cover it can't see through." style={{
          fontFamily: FONT.mono, fontSize: 13, lineHeight: 1.4, color: 'rgba(255,255,255,.86)', margin: 0,
        }} />
      </div>
    </section>
  )
}
