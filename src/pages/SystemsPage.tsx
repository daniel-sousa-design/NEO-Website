import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { PageHero } from '../components/PageHero'

// ─── Page: Systems ────────────────────────────────────────────────────────────

export function SystemsPage({ introResetKey }: { introResetKey: number }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Systems" introResetKey={introResetKey}
        headline="Every mission runs on two systems."
        sub="Together, they are what a mission actually is." />

      {/* The Satellite section */}
      <section style={{ display: 'flex', alignItems: 'center', gap: 60, padding: '80px 20px', minHeight: '60vh' }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <img src={`${A}/d6522.svg`} alt="VHR Earth Observation" style={{ width: 153, height: 'auto', display: 'block', marginBottom: 4 }} />
          <img src={`${A}/7931a.svg`} alt="The Satellite" style={{ width: 277, height: 'auto', display: 'block' }} />
        </div>
        <div style={{ flex: '3 0 0', position: 'relative' }}>
          <img src={`${A}/90a31.png`} alt="Satellite" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
        <div style={{ flexShrink: 0, width: 249 }}>
          <img src={`${A}/d9c95.svg`} alt="Description" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      </section>

      {/* System A / System B */}
      <section style={{ padding: '40px 20px 80px' }}>
        <div style={{ display: 'flex', width: 600, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ flex: '0 0 300px', background: '#55a6ff', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#d3d3d3', margin: 0, lineHeight: 1.5 }}>System A</p>
            <p style={{ fontFamily: FONT.sans, fontSize: 21, color: '#fff', margin: 0, lineHeight: 1.1 }}>One that captures.</p>
          </div>
          <div style={{ flex: '0 0 300px', border: '1px solid #222', borderLeft: 'none', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#4e4e4e', margin: 0, lineHeight: 1.5 }}>System B</p>
            <p style={{ fontFamily: FONT.sans, fontSize: 21, color: '#4e4e4e', margin: 0, lineHeight: 1.1 }}>One that operates.</p>
          </div>
        </div>
      </section>

      {/* ORBI */}
      <section style={{ padding: '80px 20px' }}>
        <p style={{ fontFamily: FONT.bitcount, fontWeight: 400, fontSize: 36, color: '#fff', textTransform: 'uppercase', letterSpacing: 0, lineHeight: 1.1, margin: '0 0 16px', fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0' }}>
          ORBI: Ground Segment
        </p>
        <p style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.3, maxWidth: 338 }}>
          An integrated software suite for planning, operating, managing, processing, distributing, and commercialising satellite missions and data — supporting single satellites, constellations, and heterogeneous systems.
        </p>
      </section>

      {/* Services */}
      <section style={{ padding: '80px 20px' }}>
        <h2 style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2.5rem,6vw,90px)', color: '#fff', letterSpacing: '-1.8px', lineHeight: 1, maxWidth: 917, margin: '0 0 80px' }}>
          Beyond the two systems, NEO offers two further services built around them:
        </h2>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { n: '01', title: 'Built to Your Design', sub: 'Contract Satellite Manufacturing', body: "NEO's manufacturing competence, made available as a service to build satellites to third-party designs and intellectual property." },
            { n: '02', title: 'Ongoing Support', sub: 'Maintenance & Troubleshooting', body: 'Support, maintenance, and troubleshooting for clients already flying and operating NEO satellites, with or without the ground segment included.' },
          ].map(s => (
            <div key={s.n} style={{ flex: '0 0 572px', borderTop: '1px solid #4e4e4e', paddingTop: 20, display: 'flex', gap: 40 }}>
              <p style={{ fontFamily: FONT.medium, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, flexShrink: 0 }}>{s.n}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                <div>
                  <p style={{ fontFamily: FONT.medium, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, margin: '0 0 12px' }}>{s.title}</p>
                  <p style={{ fontFamily: FONT.sans, fontSize: 12, color: '#a7a7a7', lineHeight: 1.3, margin: 0 }}>{s.sub}</p>
                </div>
                <p style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.3, margin: 0 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
