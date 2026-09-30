import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { useIntroAnimation } from '../hooks/useIntroAnimation'
import { PageNav } from '../components/PageNav'
import { StaggeredText } from '../components/StaggeredText'

// ─── Page: Missions ───────────────────────────────────────────────────────────

export function MissionsPage({ introResetKey }: { introResetKey: number }) {
  const phase = useIntroAnimation(introResetKey)
  const heroActive = phase === 'hero' || phase === 'done'

  return (
    <div style={{ background: '#000' }}>
      {/* Hero: spacer pushes nav to ~48vh, nav sticky inside, text below */}
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {/* Full-hero background gradient */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 1440 1024' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-5.9323e-14 -147.75 324.38 -2.6743e-12 720 1078)'><stop stop-color='rgba(85,166,255,0)' offset='0.37946'/><stop stop-color='rgba(85,166,255,1)' offset='0.76846'/></radialGradient></defs></svg>")`,
        }} />

        {/* Spacer — positions nav at ~25vh (halfway between top and center) */}
        <div style={{ height: 'calc(25vh - 42px)', position: 'relative', zIndex: 1 }} />

        {/* Nav lives here in document flow */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <PageNav title="Missions" introPhase={phase} />
        </div>

        {/* Hero text below the nav */}
        <div style={{ position: 'relative', zIndex: 1, paddingTop: '10vh', paddingLeft: 'calc(20% + 58px)', paddingBottom: '10vh' }}>
          <StaggeredText
            text="We want space to work for earth."
            active={heroActive}
            style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(3rem,6.25vw,90px)', color: '#fff', lineHeight: 1.05, letterSpacing: '-1.8px', maxWidth: 853, margin: 0 }}
          />
          <p style={{
            fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.3, marginTop: 32, maxWidth: 277,
            opacity: heroActive ? 1 : 0, transform: heroActive ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity .6s .55s ease, transform .7s .55s cubic-bezier(.22,1,.36,1)',
          }}>
            NEO's satellites and ground systems already do this work.
          </p>
        </div>
      </div>

      {/* Six problems */}
      <section style={{ padding: '120px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: FONT.medium, fontWeight: 500, fontSize: 'clamp(2rem,5vw,72px)', color: '#fff', letterSpacing: '-1.44px', lineHeight: 1.1, margin: '0 0 80px' }}>
          Six different problems.<br />One underlying capability.
        </h2>
        <div style={{ display: 'flex', gap: 25, alignItems: 'center', justifyContent: 'center' }}>
          {[true, false, false, false, false, false].map((active, i) => (
            <div key={i} style={{
              width: 80, height: 80, borderRadius: 10, flexShrink: 0, position: 'relative', overflow: 'hidden',
              border: active ? '1px solid #55a6ff' : '1px solid rgba(217,217,217,.2)', background: active ? undefined : '#222',
            }}>
              {active && <img src={`${A}/a34de.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'luminosity' }} />}
            </div>
          ))}
        </div>
      </section>

      {/* Mission 01 */}
      <section style={{ padding: '0 20px 120px', display: 'flex', gap: 80, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 auto' }}>
          <p style={{ fontFamily: FONT.sans, fontSize: 72, color: '#fff', letterSpacing: '-1.44px', lineHeight: 1.2, margin: 0 }}>01</p>
          <p style={{ fontFamily: FONT.sans, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, marginTop: 16, maxWidth: 450 }}>Identifying vessels in restricted waters.</p>
        </div>
        <div style={{ flex: '0 0 700px', background: '#222', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', height: 38, borderBottom: '1px solid #4e4e4e' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img src={`${A}/0162c.svg`} alt="" style={{ width: 28, height: 20 }} />
              <img src={`${A}/fe169.svg`} alt="" style={{ width: 34, height: 20 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={`${A}/a787c.svg`} alt="" style={{ width: 8, height: 8 }} />
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: '#4e4e4e' }}>Live</span>
            </div>
          </div>
          <img src={`${A}/a34de.png`} alt="Satellite view" style={{ width: '100%', height: 494, objectFit: 'cover', mixBlendMode: 'luminosity', display: 'block' }} />
        </div>
      </section>

      {/* What kind of mission */}
      <section style={{ display: 'flex', alignItems: 'center', padding: '80px 20px', gap: 80 }}>
        <div style={{ flex: '0 0 700px', background: '#222', borderRadius: '6px 0 6px 6px', height: 700, position: 'relative', overflow: 'hidden' }}>
          {[`${A}/c8f1b.svg`, `${A}/463e8.svg`, `${A}/bda6d.svg`, `${A}/99a28.svg`, `${A}/2e97a.svg`].map((src, i) => (
            <div key={i} style={{ position: 'absolute', left: 85, width: 529, height: 127, top: 102 + i * 92, mixBlendMode: 'color-dodge' }}>
              <img src={src} alt="" style={{ display: 'block', width: '96.62%', margin: '0 auto', height: '100%' }} />
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 0', maxWidth: 471 }}>
          <h2 style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2rem,3.5vw,50px)', color: '#fff', letterSpacing: '-1px', lineHeight: 1.1, margin: '0 0 32px' }}>
            What kind of mission do you want to accomplish?
          </h2>
          <p style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.4, maxWidth: 333 }}>
            Whatever the answer, NEO can deliver as much of it as you need: from the satellite alone to a fully operated mission.
          </p>
        </div>
      </section>

      {/* How much to deliver */}
      <section style={{ padding: '80px 20px' }}>
        <h2 style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2rem,3.5vw,50px)', color: '#fff', letterSpacing: '-1px', lineHeight: 1.1, maxWidth: 700, margin: '0 0 80px' }}>
          How much of the mission do you want us to deliver?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[
            { title: 'The Satellite', img: `${A}/a34de.png`, desc: 'A VHR optical multispectral satellite, delivered as a standalone product.' },
            { title: 'The Ground Segment - ORBI', img: null, desc: 'The software to plan, command, monitor, and process data for satellites you already operate.' },
            { title: 'The Satellite + Ground Segment', img: `${A}/7aa13.png`, desc: "The satellite paired with ORBI, NEO's Ground Segment." },
            { title: 'The Complete Mission', img: null, desc: 'Everything, plus mission design, launch, licensing, commissioning and ongoing operation.' },
          ].map((tier, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ aspectRatio: '279/340', borderRadius: 6, background: i === 3 ? '#4e4e4e' : '#222', overflow: 'hidden', position: 'relative' }}>
                {tier.img && <img src={tier.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontFamily: FONT.sans, fontSize: 26, color: '#fff', letterSpacing: '-.52px', lineHeight: 1.2, margin: 0 }}>{tier.title}</p>
                <p style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#d3d3d3', lineHeight: 1.4, margin: 0 }}>{tier.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
