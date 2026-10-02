import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { animateScrollTo } from '../lib/scroll'
import { PageHero } from '../components/PageHero'
import { RevealText } from '../components/RevealText'
import { OrbiDashboard } from '../components/OrbiDashboard'
import { MissionOrbit } from '../components/MissionOrbit'

const MissionLayers3D = lazy(() => import('../components/MissionLayers3D'))
import { LoopVideo } from '../components/LoopVideo'

// Page grid: 20px side margins, 10 columns, 10px gutters. Single column on mobile.
const GRID = 'grid grid-cols-1 md:grid-cols-10 gap-x-[10px] gap-y-12 px-5 items-center'

// Square media box shared by the problem player and the mission graphic.
const BOX = 'aspect-square w-full md:w-[min(100%,43.06vw)]'

const PROBLEMS = [
  'Identifying vessels in restricted waters.',
  'Mapping disasters as they unfold.',
  'Watching ports and industrial corridors that go unmonitored for days at a time.',
  'Protecting the infrastructure that data and finance depend on.',
  'Tracking change at facilities before it becomes public.',
  'Tracking change along borders before it becomes public.',
]

// Each problem's clip (portrait, looping) and its square thumbnail for the button.
const MEDIA = ['01-vessel', '02-disasters', '03-ports', '04-infrastructure', '05-facilities', '06-border']
  .map(n => ({ video: `${A}/problems/${n}.mp4`, poster: `${A}/problems/${n}-poster.jpg`, thumb: `${A}/problems/${n}-thumb.jpg` }))

const TIERS = [
  { title: 'The Satellite', img: null, video: `${A}/video/neo-sat-dolly-01.mp4`, desc: 'A VHR optical multispectral satellite, delivered as a standalone product.' },
  { title: 'The Ground Segment - ORBI', img: null, dash: true, desc: 'The software to plan, command, monitor, and process data for satellites you already operate.' },
  { title: 'The Satellite + Ground Segment', img: `${A}/7aa13.png`, desc: "The satellite paired with ORBI, NEO's Ground Segment." },
  { title: 'The Complete Mission', img: null, orbit: true, desc: 'Everything, plus mission design, launch, licensing, commissioning and ongoing operation.' },
]

// Card backgrounds where they differ from #222: the ORBI dashboard card light, the orbit card mid-grey.
const CARD_BG: Record<number, string> = { 1: '#D3D3D3', 3: '#4E4E4E' }

const pad = (i: number) => String(i + 1).padStart(2, '0')

// ─── Page: Missions ───────────────────────────────────────────────────────────

export function MissionsPage({ introResetKey }: { introResetKey: number }) {
  const [selected, setSelected] = useState(0)
  // Picking a problem also scrolls the page so its title and video display sit centred on screen.
  const problemTextRef = useRef<HTMLDivElement>(null)
  const problemBoxRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(true)
  const pick = (i: number) => {
    setSelected(i)
    setPlaying(true)
    const a = problemTextRef.current?.getBoundingClientRect(), b = problemBoxRef.current?.getBoundingClientRect()
    if (!a || !b) return
    const mid = (Math.min(a.top, b.top) + Math.max(a.bottom, b.bottom)) / 2
    // eased (not the browser's 'smooth', which the wheel glide could cut short); longer for longer trips
    const dist = Math.abs(mid - window.innerHeight / 2)
    if (dist > 2) animateScrollTo(window.scrollY + mid - window.innerHeight / 2, Math.min(1500, 800 + dist * .4))
  }

  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Missions" introResetKey={introResetKey}
        headline="We want space to work for earth."
        sub="NEO's satellites and ground systems already do this work." />

      {/* Six problems */}
      <section style={{ padding: '120px 20px', textAlign: 'center' }}>
        <RevealText as="h2" text={'Six different problems.\nOne underlying capability.'}
          style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2rem,5vw,72px)', color: '#fff', letterSpacing: '-1.44px', lineHeight: 1.1, margin: '0 0 80px' }} />
        <div role="group" aria-label="Problems" style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 2.5vw, 22px)', justifyContent: 'center' }}>
          {PROBLEMS.map((text, i) => {
            const active = i === selected
            return (
              <button key={i} type="button" onClick={() => pick(i)} aria-pressed={active} aria-label={`${pad(i)} ${text}`}
                className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neo-blue"
                style={{
                  width: 'min(72px, 12.5vw)', aspectRatio: '1', borderRadius: 10, flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer', padding: 0,
                  background: '#222', border: `1px solid ${active ? 'transparent' : 'rgba(217,217,217,.2)'}`,
                  transition: 'border-color .3s ease',
                }}>
                {/* the problem's thumbnail, dimmed until selected */}
                <img src={MEDIA[i].thumb} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: active ? 1 : .55, transition: 'opacity .3s ease' }} />
                {active && <span className="neo-sweep" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* Selected problem: text on column 2, player box ending on column 9 */}
      <section className={GRID} style={{ paddingBottom: 300 }}>
        <div ref={problemTextRef} className="md:col-[2/4]">
          <RevealText key={`n${selected}`} text={pad(selected)}
            style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 144, color: '#fff', letterSpacing: '-2.88px', lineHeight: 1, margin: 0 }} />
          <RevealText key={`t${selected}`} text={PROBLEMS[selected]} delay={.08}
            style={{ fontFamily: FONT.sans, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, margin: '28px 0 0' }} />
        </div>
        {/* Player: play / pause stacked top left, previous / next at the bottom left, the video beside them */}
        <div ref={problemBoxRef} className={`${BOX} md:col-[5/10] md:justify-self-end`}
          style={{ position: 'relative', containerType: 'inline-size', background: '#1e1e1e', borderRadius: 6 }}>
          <PlayerButton label="Play" on={playing} onClick={() => setPlaying(true)} style={{ top: '10.06%' }}>
            <path d="M8 5.5v13a.6.6 0 0 0 .9.5l10-6.3a.6.6 0 0 0 0-1L8.9 5a.6.6 0 0 0-.9.5z" fill="currentColor" />
          </PlayerButton>
          <PlayerButton label="Pause" on={!playing} onClick={() => setPlaying(false)} style={{ top: '18.93%' }}>
            <path d="M8.5 6v12M15.5 6v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </PlayerButton>
          <div style={{ position: 'absolute', left: '10.8%', top: '82.1%', width: '7.9%', height: '4.65%', display: 'flex', border: '1.5px solid #434343', borderRadius: '.9cqw' }}>
            {[-1, 1].map(dir => (
              <button key={dir} type="button" aria-label={dir < 0 ? 'Previous problem' : 'Next problem'} onClick={() => pick((selected + dir + PROBLEMS.length) % PROBLEMS.length)}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ flex: 1, display: 'grid', placeItems: 'center', border: 0, borderLeft: dir > 0 ? '1.5px solid #434343' : 0, background: 'none', padding: 0, cursor: 'pointer' }}>
                <svg viewBox="0 0 10 16" aria-hidden style={{ width: '1.1cqw', transform: dir < 0 ? 'scaleX(-1)' : undefined }}>
                  <path d="M2 1.5 8 8l-6 6.5" fill="none" stroke="#5a5a5a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          {/* Video display: the selected problem's clip — the six cross-fade, only the shown one plays */}
          <div style={{ position: 'absolute', left: '20.45%', top: '10.06%', width: '62.65%', height: '76.8%', borderRadius: '2cqw', overflow: 'hidden', background: '#434343' }}>
            {MEDIA.map((m, i) => <ProblemClip key={m.video} {...m} on={i === selected} playing={playing} label={PROBLEMS[i]} />)}
          </div>
        </div>
      </section>

      {/* What kind of mission: box on columns 1-5, text from column 7 */}
      <section className={GRID} style={{ paddingBottom: 300 }}>
        <MissionLayers />
        <div className="md:col-[7/11]">
          {/* wraps freely: here a single word on the last line is fine */}
          <RevealText as="h2" freeWrap text="What kind of mission do you want to accomplish?"
            style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2rem,3.5vw,50px)', color: '#fff', letterSpacing: '-1px', lineHeight: 1.1, maxWidth: 500, margin: '0 0 48px' }} />
          <RevealText text="Whatever the answer, NEO can deliver as much of it as you need: from the satellite alone to a fully operated mission." delay={.15}
            style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.4, maxWidth: 470, margin: 0 }} />
        </div>
      </section>

      {/* How much to deliver */}
      <section style={{ padding: '0 20px 350px' }}>
        <RevealText as="h2" text="How much of the mission do you want us to deliver?"
          style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2rem,3.5vw,50px)', color: '#fff', letterSpacing: '-1px', lineHeight: 1.1, maxWidth: 700, margin: '0 0 100px' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 20 }}>
          {TIERS.map((tier, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ aspectRatio: '279/340', borderRadius: 6, background: CARD_BG[i] ?? '#222', overflow: 'hidden', position: 'relative' }}>
                {tier.img && <img src={tier.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                {tier.orbit && <MissionOrbit style={{ position: 'absolute', inset: 0 }} />}
                {/* Live ORBI dashboard: 10% in from the left, running off the right edge — ~53% of it shows.
                    Display only (inert: no clicks, hover or focus), fading out towards the card's right edge. */}
                {tier.dash && (
                  <div inert aria-hidden style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    maskImage: 'linear-gradient(to right, #000 55%, rgba(0,0,0,.35) 100%)', WebkitMaskImage: 'linear-gradient(to right, #000 55%, rgba(0,0,0,.35) 100%)',
                  }}>
                    <OrbiDashboard style={{ position: 'absolute', left: '10%', top: '50%', width: '170%', transform: 'translateY(-50%)' }} />
                  </div>
                )}
                {tier.video && <LoopVideo src={tier.video} pauseMs={1000} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                <RevealText text={tier.title} delay={i * .08}
                  style={{ fontFamily: FONT.sans, fontSize: 26, color: '#fff', letterSpacing: '-.52px', lineHeight: 1.2, margin: 0 }} />
                <RevealText text={tier.desc} delay={i * .08 + .12}
                  style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#d3d3d3', lineHeight: 1.4, margin: 0 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/** One problem's clip in the display: fades in when `on`, and plays while on and `playing`. */
function ProblemClip({ video, poster, on, playing, label }: { video: string; poster: string; on: boolean; playing: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (on && playing) v.play().catch(() => {})
    else v.pause()
  }, [on, playing])
  return (
    <video ref={ref} src={video} poster={poster} muted loop playsInline preload={on ? 'auto' : 'metadata'} aria-label={label} aria-hidden={!on}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: on ? 1 : 0, transition: 'opacity .6s ease' }} />
  )
}

/** A square player control: filled grey (dark icon) while it's the current state, outlined (grey icon) otherwise. */
function PlayerButton({ label, on, onClick, style, children }: { label: string; on: boolean; onClick: () => void; style?: CSSProperties; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={on} onClick={onClick}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      style={{
        position: 'absolute', left: '10.8%', width: '7.9%', aspectRatio: '1', padding: 0, cursor: 'pointer', borderRadius: '1.7cqw',
        display: 'grid', placeItems: 'center', background: on ? '#434343' : 'transparent', border: `1.5px solid ${on ? 'transparent' : '#434343'}`,
        color: on ? '#1e1e1e' : '#4a4a4a', transition: 'background .3s ease, border-color .3s ease, color .3s ease', ...style,
      }}>
      <svg viewBox="0 0 24 24" aria-hidden style={{ width: '45%' }}>{children}</svg>
    </button>
  )
}

// ─── Mission layers ───────────────────────────────────────────────────────────
// Six glass slabs, A–F, flying in on an orbit — drawn in 3D with three.js (see
// MissionLayers3D). Loaded only when the page needs it, to keep three.js out
// of the main bundle.

function MissionLayers() {
  return (
    <div role="img" aria-label="Six stacked glass layers, A to F" className={`${BOX} md:col-[1/6]`}
      style={{ background: '#D3D3D3', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
      <Suspense fallback={null}><MissionLayers3D /></Suspense>
    </div>
  )
}
