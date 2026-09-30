import { FONT } from '../lib/fonts'
import { useIntroAnimation } from '../hooks/useIntroAnimation'
import { PageNav } from './PageNav'
import { StaggeredText } from './StaggeredText'

// ─── Page hero ────────────────────────────────────────────────────────────────
// The opening every page shares: blue horizon gradient, page nav (logo + typed
// title pill) at ~25vh, headline + short line of mono text below it. Runs the
// intro sequence (scroll locked, then a 100px nudge) — see useIntroAnimation.

const HORIZON = `url("data:image/svg+xml;utf8,<svg viewBox='0 0 1440 1024' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-5.9323e-14 -147.75 324.38 -2.6743e-12 720 1078)'><stop stop-color='rgba(85,166,255,0)' offset='0.37946'/><stop stop-color='rgba(85,166,255,1)' offset='0.76846'/></radialGradient></defs></svg>")`

export function PageHero({ title, headline, sub, introResetKey = 0 }: {
  title: string; headline: string; sub?: string; introResetKey?: number
}) {
  const phase = useIntroAnimation(introResetKey)
  const heroActive = phase === 'hero' || phase === 'done'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: HORIZON }} />

      {/* Spacer — positions nav at ~25vh (halfway between top and center) */}
      <div style={{ height: 'calc(25vh - 42px)', position: 'relative', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <PageNav title={title} introPhase={phase} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: '10vh', paddingLeft: 'calc(20% + 58px)', paddingBottom: '10vh' }}>
        <StaggeredText
          text={headline}
          active={heroActive}
          style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(3rem,6.25vw,90px)', color: '#fff', lineHeight: 1.05, letterSpacing: '-1.8px', maxWidth: 'min(1111px, calc(100% - 20px))', margin: 0 }}
        />
        {sub && <p style={{
          fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.3, marginTop: 'clamp(56px, 8vw, 115px)', maxWidth: 300, marginBottom: 0,
          opacity: heroActive ? 1 : 0, transform: heroActive ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity .6s .55s ease, transform .7s .55s cubic-bezier(.22,1,.36,1)',
        }}>
          {sub}
        </p>}
      </div>
    </div>
  )
}
