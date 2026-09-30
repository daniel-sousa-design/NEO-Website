import { useState } from 'react'
import { A, BLUE } from '../data/pages'
import { FONT } from '../lib/fonts'
import { PageHero } from '../components/PageHero'
import { RevealText } from '../components/RevealText'
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
  'Tracking change at facilities and along borders before it becomes public.',
  'Problem 06 copy to come.', // TODO: real copy for the sixth problem
]

// Stand-ins for each problem's video.
const DISPLAY_GREYS = ['#3a3a3a', '#4a4a4a', '#333333', '#555555', '#2e2e2e', '#444444']

const TIERS = [
  { title: 'The Satellite', img: null, video: `${A}/video/neo-sat-dolly-01.mp4`, desc: 'A VHR optical multispectral satellite, delivered as a standalone product.' },
  { title: 'The Ground Segment - ORBI', img: null, desc: 'The software to plan, command, monitor, and process data for satellites you already operate.' },
  { title: 'The Satellite + Ground Segment', img: `${A}/7aa13.png`, desc: "The satellite paired with ORBI, NEO's Ground Segment." },
  { title: 'The Complete Mission', img: null, desc: 'Everything, plus mission design, launch, licensing, commissioning and ongoing operation.' },
]

const pad = (i: number) => String(i + 1).padStart(2, '0')

// ─── Page: Missions ───────────────────────────────────────────────────────────

export function MissionsPage({ introResetKey }: { introResetKey: number }) {
  const [selected, setSelected] = useState(0)

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
              <button key={i} type="button" onClick={() => setSelected(i)} aria-pressed={active} aria-label={`${pad(i)} ${text}`}
                className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neo-blue"
                style={{
                  width: 'min(72px, 12.5vw)', aspectRatio: '1', borderRadius: 10, flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer', padding: 0,
                  background: '#222', border: `1px solid ${active ? 'transparent' : 'rgba(217,217,217,.2)'}`,
                  transition: 'border-color .3s ease',
                }}>
                {/* Future: image or icon masked by this square */}
                {active && <span className="neo-sweep" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* Selected problem: text on column 2, player box ending on column 9 */}
      <section className={GRID} style={{ paddingBottom: 300 }}>
        <div className="md:col-[2/5]">
          <RevealText key={`n${selected}`} text={pad(selected)}
            style={{ fontFamily: FONT.sans, fontSize: 72, color: '#fff', letterSpacing: '-1.44px', lineHeight: 1.2, margin: 0 }} />
          <RevealText key={`t${selected}`} text={PROBLEMS[selected]} delay={.08}
            style={{ fontFamily: FONT.sans, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, margin: '28px 0 0' }} />
        </div>
        <div className={`${BOX} md:col-[5/10] md:justify-self-end`}
          style={{ background: '#222', borderRadius: 6, padding: '5.6% 11.3%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 32, flexShrink: 0, padding: '0 10px', border: '1px solid rgba(255,255,255,.28)', borderRadius: 4 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <img src={`${A}/0162c.svg`} alt="" style={{ width: 22, height: 16 }} />
              <img src={`${A}/fe169.svg`} alt="" style={{ width: 27, height: 16 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE }} />
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,.5)' }}>Live</span>
            </div>
          </div>
          {/* Video display: placeholder shade per problem until the videos land */}
          <div style={{ flex: 1, borderRadius: 2, background: DISPLAY_GREYS[selected], transition: 'background-color .5s ease' }} />
        </div>
      </section>

      {/* What kind of mission: box on columns 1-5, text from column 6 */}
      <section className={GRID} style={{ paddingBottom: 300 }}>
        <div className={`${BOX} md:col-[1/6]`} style={{ background: '#222', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
          {[`${A}/c8f1b.svg`, `${A}/463e8.svg`, `${A}/bda6d.svg`, `${A}/99a28.svg`, `${A}/2e97a.svg`].map((src, i) => (
            <img key={i} src={src} alt="" style={{ position: 'absolute', left: '8.6%', width: '82.4%', height: '20.5%', top: `${9.8 + i * 14.9}%`, mixBlendMode: 'color-dodge' }} />
          ))}
        </div>
        <div className="md:col-[6/11]">
          <RevealText as="h2" text="What kind of mission do you want to accomplish?"
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
              <div style={{ aspectRatio: '279/340', borderRadius: 6, background: i === 3 ? '#4e4e4e' : '#222', overflow: 'hidden', position: 'relative' }}>
                {tier.img && <img src={tier.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
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
