import type { CSSProperties } from 'react'

// ─── NEO mark, in 3D ──────────────────────────────────────────────────────────
// The NEO symbol as a solid: the angular body extruded by stacking slices in
// 3D, the dot a sphere that keeps facing the viewer so it reads round from
// every angle. Each time `turn` changes it spins a full 360° about its vertical
// axis, the sphere trailing the body by a beat. At rest it looks flat, like the
// logo; while turning it takes on a metal finish that eases back out after:
//
//   dark    dark grey, matte dark metal (the ORBI dashboard)
//   silver  white, a soft white metal (the Missions orbit card)
//
// `width` is the mark's width as any CSS length; the depth scales with it. Put
// it inside an element with `perspective`.

// The logo's 58 × 39 drawing: body and dot.
const BODY = 'M57.0804 19.6068V22.3494L40.4416 39.0027H19.5898V19.3959H0V16.6532L16.6388 0H37.4906V19.6068H57.0804Z'
const DOT = { cx: 49.1959, cy: 8.04088, r: 7.0074 }
const DEPTH = .1286, LAYERS = 16   // extrusion depth (share of the mark's width) and slices
const TURN = '1.3s cubic-bezier(.62,0,.25,1) both'   // a slightly longer ease into rest
const SHADE = '1.9s linear both'   // the finish outlasts the turn and eases out
const DOT_LAG = 90                 // ms the sphere trails the body by

const MASK = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 58 39'><path d='${BODY}'/></svg>`)}")`

type Finish = 'dark' | 'silver'
const FINISH: Record<Finish, { face: string; side: string; sheen: string; sphere: string }> = {
  dark: {
    face: '#454545', side: '#262626',
    sheen: 'linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.16) 46%, rgba(255,255,255,.34) 50%, rgba(255,255,255,.12) 55%, rgba(255,255,255,0) 66%) 0 0 / 320% 100%, linear-gradient(to bottom, rgba(255,255,255,.08), rgba(0,0,0,.25))',
    sphere: [
      'radial-gradient(circle at 34% 30%, rgba(210,210,210,.75) 0%, rgba(140,140,140,.35) 16%, rgba(0,0,0,0) 34%)',
      'linear-gradient(to bottom, rgba(255,255,255,0) 54%, rgba(255,255,255,.14) 60%, rgba(255,255,255,0) 68%)',
      'radial-gradient(circle at 42% 40%, #545454 0%, #3a3a3a 50%, #1e1e1e 92%, #151515 100%)',
    ].join(', '),
  },
  silver: {
    // white metal: barely-there greys, a soft bright streak sweeping across
    face: '#ffffff', side: '#cfd3d8',
    sheen: [
      'linear-gradient(105deg, rgba(150,158,170,0) 28%, rgba(150,158,170,.32) 41%, rgba(255,255,255,1) 50%, rgba(160,168,180,.28) 59%, rgba(150,158,170,0) 72%) 0 0 / 320% 100%',
      'linear-gradient(165deg, #ffffff 0%, #e6e9ec 40%, #fbfcfd 58%, #d6dade 85%, #eceef0 100%) 0 0 / 100% 100%',
    ].join(', '),
    // a soft highlight and a gentle fall-off — no reflection band across it
    sphere: [
      'radial-gradient(circle at 34% 30%, rgba(255,255,255,1) 0%, rgba(255,255,255,.6) 16%, rgba(255,255,255,0) 36%)',
      'radial-gradient(circle at 42% 40%, #fbfcfd 0%, #e2e5e9 50%, #c4c9cf 86%, #b3b9c0 100%)',
    ].join(', '),
  },
}

export function NeoMark3D({ turn, width, finish = 'dark' }: { turn: number; width: string; finish?: Finish }) {
  const f = FINISH[finish]
  const z = (k: number) => `translateZ(calc(${width} * ${k}))`
  const layer: CSSProperties = { position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }
  const sheen = (k: number): CSSProperties => ({
    position: 'absolute', inset: 0, transform: z(k),
    maskImage: MASK, WebkitMaskImage: MASK, maskSize: '100% 100%', WebkitMaskSize: '100% 100%',
    background: f.sheen, animation: `neo-sheen ${TURN}, neo-shade ${SHADE}`,
  })
  return (
    <div key={turn} style={{ position: 'relative', width, aspectRatio: '58 / 39', transformStyle: 'preserve-3d' }}>
      <div style={{ ...layer, animation: `neo-turn ${TURN}` }}>
        {Array.from({ length: LAYERS }, (_, i) => {
          const face = i === 0 || i === LAYERS - 1
          return (
            <svg key={i} viewBox="0 0 58 39" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: z((i / (LAYERS - 1) - .5) * -DEPTH), backfaceVisibility: 'visible' }}>
              <path fill={face ? f.face : f.side} d={BODY} />
            </svg>
          )
        })}
        {/* the finish on the front and back faces — only while turning */}
        <span aria-hidden style={sheen(DEPTH / 2 + .002)} />
        <span aria-hidden style={sheen(-DEPTH / 2 - .002)} />
      </div>
      {/* the dot: its own layer, a beat behind; counter-turns to keep facing the viewer */}
      <div style={{ ...layer, animation: `neo-turn ${TURN}`, animationDelay: `${DOT_LAG}ms` }}>
        <span aria-hidden style={{
          position: 'absolute', left: `${((DOT.cx - DOT.r) / 58) * 100}%`, top: `${((DOT.cy - DOT.r) / 39) * 100}%`,
          width: `${((DOT.r * 2) / 58) * 100}%`, aspectRatio: '1', borderRadius: '50%', background: f.face, overflow: 'hidden',
          animation: `neo-turn-back ${TURN}`, animationDelay: `${DOT_LAG}ms`,
        }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: f.sphere, animation: `neo-shade ${SHADE}`, animationDelay: `${DOT_LAG}ms` }} />
        </span>
      </div>
      <style>{`
        @keyframes neo-turn { from { transform: rotateY(0) } to { transform: rotateY(360deg) } }
        @keyframes neo-turn-back { from { transform: rotateY(0) } to { transform: rotateY(-360deg) } }
        @keyframes neo-shade { 0% { opacity: 0; animation-timing-function: ease-out } 20% { opacity: 1 } 45% { opacity: 1; animation-timing-function: cubic-bezier(.45,0,.2,1) } 100% { opacity: 0 } }
        @keyframes neo-sheen { from { background-position: 100% 0, 0 0 } to { background-position: 0% 0, 0 0 } }
        @media (prefers-reduced-motion: reduce) { [style*="neo-turn"], [style*="neo-shade"], [style*="neo-sheen"] { animation: none !important } }
      `}</style>
    </div>
  )
}
