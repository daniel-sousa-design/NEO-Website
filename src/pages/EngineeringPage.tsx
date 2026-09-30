import { PageHero } from '../components/PageHero'
import { ImageOrbit } from '../components/ImageOrbit'
import { DisciplinesTable } from '../components/DisciplinesTable'

// ─── Page: Engineering ────────────────────────────────────────────────────────
// Hero → image orbit → (300px) → six disciplines table → (300px) → footer.

export function EngineeringPage({ introResetKey = 0 }: { introResetKey?: number }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Engineering" headline="Getting systems into orbit, and keeping them there, is an engineering problem first." introResetKey={introResetKey} />
      <ImageOrbit />
      <div style={{ height: 300 }} />
      <DisciplinesTable />
    </div>
  )
}
