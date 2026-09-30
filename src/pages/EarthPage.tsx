import { FONT } from '../lib/fonts'

// ─── Page: Earth ──────────────────────────────────────────────────────────────

export function EarthPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', paddingTop: 80 }}>
      <div style={{ maxWidth: 700 }}>
        <p style={{ color: 'rgba(217,64,64,.55)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 32 }}>01 / 07</p>
        <h1 style={{ fontFamily: FONT.sans, fontSize: 'clamp(3rem,6vw,90px)', color: '#fff', fontWeight: 400, lineHeight: 1, letterSpacing: '-1.8px', margin: '0 0 32px' }}>
          Earth.
        </h1>
        <div style={{ width: 40, height: 1.5, background: '#d94040', marginBottom: 24 }} />
        <p style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6, maxWidth: '36ch' }}>
          This page is coming soon.
        </p>
      </div>
    </div>
  )
}
