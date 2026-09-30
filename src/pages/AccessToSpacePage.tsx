import { useEffect, useRef, useState } from 'react'
import { FONT } from '../lib/fonts'
import { PageHero } from '../components/PageHero'
import { RfaCapabilities } from '../components/RfaCapabilities'
import { PhotoStrip } from '../components/PhotoStrip'
import { RevealText } from '../components/RevealText'

// ─── Page: Access to Space ────────────────────────────────────────────────────
// Hero → intro + "RFA One" + four capability groups → (300px) → photo strip →
// closing statement → (400px) → footer.

export function AccessToSpacePage({ introResetKey = 0 }: { introResetKey?: number }) {
  // Closing statement: lines reveal while it's in the middle band of the
  // screen, and play back out when it leaves — scrolling down or up.
  const statementRef = useRef<HTMLDivElement>(null)
  const [statementIn, setStatementIn] = useState(false)
  useEffect(() => {
    const el = statementRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStatementIn(e.isIntersecting), { rootMargin: '-15% 0px -15% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div style={{ background: '#000' }}>
      <PageHero
        title="Access to Space"
        headline="The discipline that builds satellites also builds what launches them."
        sub="A distinct business line: this isn't an extension of satellite engineering, but a separate competence built around launcher-grade structures."
        introResetKey={introResetKey}
      />
      <RfaCapabilities />
      <div style={{ height: 300 }} />
      <PhotoStrip />
      <section style={{ padding: '0 20px 400px' }}>
        <div ref={statementRef}>
          <RevealText as="h2" by="line" ready={statementIn} ownView={false} text="This work, carried out by NEO and CEiiA together, positions the partnership as a long-term contributor to next-generation small launchers and orbital transfer vehicles — and strengthens Europe's commercial-launch ecosystem in the process." style={{
            fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(22px, 2.1vw, 30px)', lineHeight: 1.27, color: '#fff',
            textAlign: 'center', maxWidth: 790, margin: '0 auto',
          }} />
        </div>
      </section>
    </div>
  )
}
