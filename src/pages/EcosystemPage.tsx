import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { useInView } from '../hooks/useInView'
import { PageHero } from '../components/PageHero'
import { Partnerships } from '../components/Partnerships'
import { RevealText } from '../components/RevealText'

// ─── Page: Ecosystem ──────────────────────────────────────────────────────────
// Hero → partnerships → (400px) → closing statement + photo → (300px) → footer.

const COL = 'calc((100% - 40px - 90px) / 10)'   // one column of the 10-col grid

export function EcosystemPage({ introResetKey = 0 }: { introResetKey?: number }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Ecosystem" headline="NEO builds within a network of partners that extends what it can deliver." introResetKey={introResetKey} />
      <Partnerships />
      <NetworkClose />
    </div>
  )
}

/** The Earth page's closing layout, mirrored: tall photo on the right, 20px in
 *  from the edge (≈ 44% of the width); statement on the left, from grid
 *  column 2, vertically centred on the photo. The photo rises in and
 *  settles from a slight zoom; the text follows line by line. */
function NetworkClose() {
  const [ref, inView] = useInView<HTMLDivElement>('0px 0px -15% 0px')

  return (
    <section style={{ padding: '400px 0 300px' }}>
      <div style={{ position: 'relative' }}>
        <div ref={ref} className="mx-5 md:ml-auto md:w-[44%]" style={{ aspectRatio: '870 / 1453', overflow: 'hidden', background: '#111' }}>
          <img src={`${A}/ecosystem/network.jpg`} alt="New Space Portugal partners, GEOSAT among them, around a meeting table" loading="lazy" style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: '38% 50%', display: 'block',
            opacity: inView ? 1 : 0, transform: inView ? 'scale(1)' : 'scale(1.12)',
            transition: 'opacity 1.2s cubic-bezier(.16,1,.3,1), transform 2.2s cubic-bezier(.16,1,.3,1)',
          }} />
        </div>

        {/* Statement — grid column 2 onwards, ending one column + 40px short of the photo, centred (a touch low) on it; stacks below on mobile */}
        <div className="px-5 pt-16 md:p-0 md:absolute md:top-[54%] md:-translate-y-1/2" style={{ left: `calc(20px + ${COL} + 10px)`, right: `calc(44% + 60px + ${COL} + 10px)` }}>
          <RevealText by="line" delay={.3} text="Through this network, NEO's satellites are set to join the Atlantic Constellation and Lusíadas — Earth Observation programs under Portugal's New Space Agenda, backed by the Recovery and Resilience Plan." style={{
            fontFamily: FONT.sans, fontSize: 'clamp(22px, 2.1vw, 30px)', lineHeight: 1.27, color: '#fff', margin: 0,
          }} />
        </div>
      </div>
    </section>
  )
}
