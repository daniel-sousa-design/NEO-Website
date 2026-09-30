import type { Page } from '../data/pages'
import { PageHero } from '../components/PageHero'

// ─── Placeholder ──────────────────────────────────────────────────────────────

export function PlaceholderPage({ page }: { page: Page }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title={page.title} headline={`${page.title}.`} sub="This section is coming soon." />
    </div>
  )
}
