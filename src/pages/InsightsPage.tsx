import { PageHero } from '../components/PageHero'
import { NewsFeed } from '../components/NewsFeed'
import { ForestWatch } from '../components/ForestWatch'

// ─── Page: Insights ───────────────────────────────────────────────────────────
// Hero → intro + featured article + filtered news grid → (500px) →
// "The same eye…" (image grows on scroll) → (400px) → footer.

export function InsightsPage({ introResetKey = 0 }: { introResetKey?: number }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Insights" headline="That capability produces something solid: Evidence." introResetKey={introResetKey} />
      <NewsFeed />
      <ForestWatch />
    </div>
  )
}
