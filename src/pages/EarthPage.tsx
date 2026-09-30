import { PageHero } from '../components/PageHero'
import { EarthStory } from '../components/EarthStory'
import { UnwatchedGrid } from '../components/UnwatchedGrid'
import { EarthWatch } from '../components/EarthWatch'

// ─── Page: Earth ──────────────────────────────────────────────────────────────

export function EarthPage({ introResetKey = 0 }: { introResetKey?: number }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Earth" headline="Space is the future we foresee. Earth is the future we need to see, now." introResetKey={introResetKey} />
      <EarthStory />
      <UnwatchedGrid />
      <EarthWatch />
    </div>
  )
}
