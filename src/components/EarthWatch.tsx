import { A } from '../data/pages'
import { FONT } from '../lib/fonts'
import { useInView } from '../hooks/useInView'
import { RevealText } from './RevealText'

// ─── "NEO doesn't stop the vessel…" ───────────────────────────────────────────
// Tall photo on the left, 20px in from the edge (≈ 44% of the width); statement + mono
// line from grid column 7, vertically centred on the photo. The photo rises
// in and settles from a slight zoom; the copy reveals word by word after it.
// Spacing: the section above already ends with 300px, so this one only adds
// 300px below.

const COL = 'calc((100% - 40px - 90px) / 10)'   // one column of the 10-col grid

export function EarthWatch() {
  const [ref, inView] = useInView<HTMLDivElement>('0px 0px -15% 0px')

  return (
    <section style={{ paddingBottom: 300 }}>
      <div style={{ position: 'relative' }}>
        {/* Photo */}
        <div ref={ref} className="mx-5 md:mr-0 md:w-[44%]" style={{ aspectRatio: '870 / 1453', overflow: 'hidden', background: '#111' }}>
          <img src={`${A}/earth-watch.jpg`} alt="A ship's bridge at night, radar and chart screens glowing" loading="lazy" style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: inView ? 1 : 0, transform: inView ? 'scale(1)' : 'scale(1.12)',
            transition: 'opacity 1.2s cubic-bezier(.16,1,.3,1), transform 2.2s cubic-bezier(.16,1,.3,1)',
          }} />
        </div>

        {/* Copy — from grid column 7, centred (a touch low) on the photo; stacks below on mobile */}
        <div className="px-5 pt-16 md:p-0 md:absolute md:top-[54%] md:-translate-y-1/2" style={{ left: `calc(20px + 6 * (${COL} + 10px))`, right: 20, maxWidth: 620 }}>
          <RevealText as="h2" text={"NEO doesn't stop the vessel, fight the fire, or patrol the cable."} delay={.3} style={{
            fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(32px, 3.4vw, 48px)', lineHeight: 1.12, letterSpacing: '-.5px', color: '#fff', margin: 0, maxWidth: 580,
          }} />
          <RevealText text="It makes sure someone can see it, in time to act, not after the fact has occurred." delay={.7} style={{
            fontFamily: FONT.mono, fontSize: 12, lineHeight: 1.45, color: '#a7a7a7', maxWidth: 400, margin: '60px 0 0',
          }} />
        </div>
      </div>
    </section>
  )
}
