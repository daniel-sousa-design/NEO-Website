import type { Page } from '../data/pages'
import { FONT } from '../lib/fonts'

// ─── Placeholder ──────────────────────────────────────────────────────────────

export function PlaceholderPage({ page }: { page: Page }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', paddingTop: 80 }}>
      <p style={{ color: `rgba(${page.rgb},.55)`, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 32 }}>
        {String(page.id + 1).padStart(2, '0')} / 07
      </p>
      <h1 style={{ fontFamily: FONT.sans, fontSize: 'clamp(3rem,6vw,90px)', color: '#fff', fontWeight: 400, lineHeight: 1, letterSpacing: '-1.8px', margin: '0 0 32px' }}>
        {page.title}.
      </h1>
      <div style={{ width: 40, height: 1.5, background: page.color, marginBottom: 24 }} />
      <p style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.6, maxWidth: '36ch' }}>
        This section is coming soon.
      </p>
    </div>
  )
}
