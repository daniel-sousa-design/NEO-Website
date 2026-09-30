import { useState, useEffect, useRef } from 'react'
import { A, BLUE, SEL } from '../data/pages'
import { FONT } from '../lib/fonts'
import { ease } from '../lib/motion'
import { PageHero } from '../components/PageHero'
import { RevealText } from '../components/RevealText'

// ─── Page: Systems ────────────────────────────────────────────────────────────

type SystemId = 'a' | 'b'

const SYSTEMS: Record<SystemId, {
  label: string; tagline: string; eyebrow?: string; title: string; body: string; img: string | null
}> = {
  a: {
    label: 'System A', tagline: 'One that captures.',
    eyebrow: 'VHR Earth Observation', title: 'The Satellite',
    body: "NEO's primary product: a VHR optical multispectral satellite, at least 50cm native resolution in the panchromatic band, multispectral.",
    img: `${A}/satellite-render.png`,
  },
  b: {
    label: 'System B', tagline: 'One that operates.',
    title: 'ORBI: Ground Segment',
    body: 'An integrated software suite for planning, operating, managing, processing, distributing, and commercialising satellite missions and data — supporting single satellites, constellations, and heterogeneous systems.',
    img: null, // TODO: ORBI visual
  },
}

const SERVICES = [
  { n: '01', title: 'Built to Your Design', sub: 'Contract Satellite Manufacturing', body: "NEO's manufacturing competence, made available as a service to build satellites to third-party designs and intellectual property." },
  { n: '02', title: 'Ongoing Support', sub: 'Maintenance & Troubleshooting', body: 'Support, maintenance, and troubleshooting for clients already flying and operating NEO satellites, with or without the ground segment included.' },
]

// Feathers every edge of the satellite render: its backdrop isn't pure black.
// The cinematic crop is taller, so its fade is centred on the satellite (42%).
const FEATHER = 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 60%, transparent 100%)'
const CINE_FEATHER = 'radial-gradient(ellipse 50% 50% at 50% 42%, #000 62%, transparent 100%)'

const BITCOUNT = { fontFamily: FONT.bitcount, fontWeight: 400, color: '#fff', textTransform: 'uppercase', letterSpacing: 0, lineHeight: 1.1, fontVariationSettings: '"CRSV" 0, "ELSH" 0, "ELXP" 0' } as const

export function SystemsPage({ introResetKey }: { introResetKey: number }) {
  return (
    <div style={{ background: '#000' }}>
      <PageHero title="Systems" introResetKey={introResetKey}
        headline="Every mission runs on two systems."
        sub="Together, they are what a mission actually is." />

      <SystemsShowcase />

      {/* Services: 300px below the systems, columns 250px under the title, right-aligned */}
      <section style={{ padding: '300px 20px 300px' }}>
        <RevealText as="h2" text="Beyond the two systems, NEO offers two further services built around them:" style={{
          fontFamily: FONT.sans, fontWeight: 400, fontSize: 'clamp(2.5rem,6vw,90px)', color: '#fff', letterSpacing: '-1.8px', lineHeight: 1, maxWidth: 917, margin: '0 0 250px',
        }} />
        <div className="flex flex-col md:flex-row md:justify-end" style={{ gap: 20 }}>
          {SERVICES.map((s, i) => (
            <div key={s.n} className="md:w-[min(572px,50%)]" style={{ borderTop: '1px solid #4e4e4e', paddingTop: 20, display: 'flex', gap: 40 }}>
              <RevealText text={s.n} delay={i * .1} style={{ fontFamily: FONT.medium, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, margin: 0, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                <div>
                  <RevealText text={s.title} delay={i * .1 + .05} style={{ fontFamily: FONT.medium, fontSize: 32, color: '#fff', letterSpacing: '-.64px', lineHeight: 1.2, margin: '0 0 12px' }} />
                  <RevealText text={s.sub} delay={i * .1 + .15} style={{ fontFamily: FONT.sans, fontSize: 12, color: '#a7a7a7', lineHeight: 1.3, margin: 0 }} />
                </div>
                <RevealText text={s.body} delay={i * .1 + .2} style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.3, margin: 0 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Systems showcase ─────────────────────────────────────────────────────────
// A pinned stage (the section is taller than the viewport; the stage sticks
// while the extra height scrolls past):
//
// Each system (toggle A / B) has its own two states. Switching systems
// scrolls back to state 1 so the new system always opens on its first state.
//
//   1. Cinematic (scroll-scrubbed) — the system's title at double size, centred
//      at the top, reveals word by word; its visual rises up from below as you
//      scroll, until it sits centred and big, bleeding off the bottom where a
//      gradient melts it into the page. It tilts in 3D toward the pointer.
//   2. Break — past BREAK the stage switches to the composition by itself (a
//      timed transition, not scrubbed): the cinematic drifts up and fades, the
//      two-column layout (text left, visual right) rises in and its copy
//      reveals. Scrolling back above BREAK plays it in reverse.

const SCRUB_VH = 160      // extra scroll the stage stays pinned for
const RISE_END = .35      // pinned progress at which the render has fully risen
const BREAK    = .5       // pinned progress at which the stage switches to the composition
const RISE_VH  = 55       // how far below its resting place the render starts, in vh
const CINE_H   = 280      // cinematic render height, in vh (double the original 140)
const CINE_TOP_EDGE = .385  // the satellite's top edge (panel line), as a fraction of the render's height
const CINE_EDGE_VH  = 27    // where that edge rests on screen, in vh — just under the title
const CINE_TOP = CINE_EDGE_VH - CINE_TOP_EDGE * CINE_H  // resting top of the render, in vh
const CINE_START_SCALE = .5 // the render grows from half size (140vh tall)…
const CINE_START_TOP   = 4  // …starting from where that smaller render sat (top, in vh), plus RISE_VH below
const TILT_X = 9, TILT_Y = 14   // max render tilt, degrees
const SWITCH_VISIBLE = .3       // a system switch cuts to where this much of the stage is on screen

function SystemsShowcase() {
  const [system, setSystem] = useState<SystemId>('a')
  const sectionRef = useRef<HTMLElement>(null)
  const [rise, setRise] = useState(0)             // render rise 0..1 (scrubbed)
  const [composed, setComposed] = useState(false) // past BREAK: composition state
  const [toggleShown, setToggleShown] = useState(false)
  const toggleRef = useRef(false)
  const holdRef = useRef<number | null>(null) // scrollY of a switch jump; keeps the toggle up until the user moves on

  // Scrub progress + toggle presence. With hysteresis, the toggle shows once
  // ≥80% of the stage (the opening shot, on the way in) is on screen, and
  // hides once half of it has scrolled away.
  useEffect(() => {
    const update = () => {
      const r = sectionRef.current?.getBoundingClientRect()
      if (!r) return
      const vh = window.innerHeight
      const pinned = r.height - vh
      const prog = Math.max(0, Math.min(1, -r.top / pinned))
      // Rise is scrubbed from the moment the section enters the viewport until
      // RISE_END of the pinned scroll.
      const t = Math.max(0, Math.min(1, (vh - r.top) / (vh + RISE_END * pinned)))
      setRise(t * t * (3 - 2 * t))
      setComposed(prog >= BREAK)
      const stageVisible = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top)) / vh
      let next = toggleRef.current
      if (stageVisible >= .8) next = true
      else if (stageVisible < .5) next = false
      // After a switch jump the stage is only partly in view: keep the toggle
      // up until the stage fills the screen again or the user scrolls back up.
      if (holdRef.current !== null) {
        if (stageVisible >= .8 || window.scrollY < holdRef.current - 40) holdRef.current = null
        else next = true
      }
      if (next !== toggleRef.current) { toggleRef.current = next; setToggleShown(next) }
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  // Pointer-driven 3D tilt, eased every frame and written straight to the DOM.
  const tiltRef = useRef<HTMLDivElement>(null)
  const tiltTarget = useRef({ x: 0, y: 0 })
  useEffect(() => {
    let raf = 0, x = 0, y = 0, last = performance.now()
    const tick = (t: number) => {
      const k = 1 - Math.exp(-4 * Math.max(0, Math.min(.05, (t - last) / 1000)))
      last = t
      x += (tiltTarget.current.x - x) * k
      y += (tiltTarget.current.y - y) * k
      if (tiltRef.current) tiltRef.current.style.transform = `perspective(1400px) rotateX(${-y * TILT_X}deg) rotateY(${x * TILT_Y}deg)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Switching systems always opens the new one on its first state: cut
  // straight (no scroll animation) to where the stage is SWITCH_VISIBLE in
  // view, so its render rises in again as you scroll.
  const selectSystem = (id: SystemId) => {
    if (id === system) return
    setSystem(id)
    const el = sectionRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - (1 - SWITCH_VISIBLE) * window.innerHeight
    holdRef.current = top
    window.scrollTo({ top, behavior: 'instant' })
  }

  const sys = SYSTEMS[system]

  return (
    <>
      <section ref={sectionRef} style={{ position: 'relative', height: `${100 + SCRUB_VH}vh` }}>
        <div
          onMouseMove={e => { tiltTarget.current = { x: e.clientX / window.innerWidth - .5, y: e.clientY / window.innerHeight - .5 } }}
          onMouseLeave={() => { tiltTarget.current = { x: 0, y: 0 } }}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

          {/* 1. Cinematic — leaves by itself once composed */}
          <div aria-hidden={composed} style={{
            position: 'absolute', inset: 0,
            opacity: composed ? 0 : 1, transform: `translateY(${composed ? -70 : 0}px)`,
            transition: 'opacity .8s cubic-bezier(.4,0,.2,1), transform 1s cubic-bezier(.4,0,.2,1)',
          }}>
            {/* Render: scrubbed up from below the title while growing from its
                start size to full size; bleeds off the bottom */}
            <div style={{
              position: 'absolute', left: '50%', top: `${CINE_TOP}vh`, height: `${CINE_H}vh`, aspectRatio: '1856 / 2304',
              transformOrigin: '50% 0',
              transform: `translateX(-50%) translateY(${(1 - rise) * (CINE_START_TOP - CINE_TOP + RISE_VH)}vh) scale(${CINE_START_SCALE + (1 - CINE_START_SCALE) * rise})`,
              opacity: Math.min(1, rise * 1.6),
            }}>
              <div ref={tiltRef} style={{ position: 'relative', width: '100%', height: '100%', willChange: 'transform' }}>
                {/* One visual per system, cross-faded by the toggle */}
                {(['a', 'b'] as const).map(id => {
                  const img = SYSTEMS[id].img
                  const shown = { opacity: id === system ? 1 : 0, transition: 'opacity .6s ease' }
                  return img
                    ? <img key={id} src={img} alt={SYSTEMS[id].title} style={{
                        ...shown, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        maskImage: CINE_FEATHER, WebkitMaskImage: CINE_FEATHER,
                      }} />
                    : <div key={id} style={{ ...shown, position: 'absolute', left: '6%', right: '6%', top: '24%', aspectRatio: '16 / 10', background: '#222', borderRadius: 8 }} />
                })}
              </div>
            </div>
            {/* Melt the render into the page */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, #000 100%)' }} />
            {/* Title sits above the render; replays its reveal on a system switch */}
            <RevealText key={system} as="h2" text={sys.title} style={{
              ...BITCOUNT, position: 'absolute', top: '12vh', left: 0, right: 0, textAlign: 'center', zIndex: 2, margin: 0,
              fontSize: 'clamp(40px, 5vw, 72px)',
            }} />
          </div>

          {/* 2. Composition: text on the left, visual on the right — arrives by itself */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-x-[10px] gap-y-12 px-5 items-center" aria-hidden={!composed} style={{
            position: 'absolute', inset: 0, pointerEvents: composed ? 'auto' : 'none',
            opacity: composed ? 1 : 0, transform: `translateY(${composed ? 0 : 50}px)`,
            transition: composed
              ? 'opacity 1s .3s cubic-bezier(.16,1,.3,1), transform 1.2s .3s cubic-bezier(.16,1,.3,1)'
              : 'opacity .5s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1)',
          }}>
            <div className="md:col-[2/5]">
              {sys.eyebrow
                ? <RevealText key={`e${system}`} text={sys.eyebrow} ready={composed} style={{ fontFamily: FONT.mono, fontSize: 12, color: '#a7a7a7', lineHeight: 1.3, margin: '0 0 12px' }} />
                : null}
              <RevealText key={`t${system}`} as="h2" text={sys.title} delay={.05} ready={composed} style={{ ...BITCOUNT, fontSize: 36, margin: 0 }} />
              <RevealText key={`b${system}`} text={sys.body} delay={.2} ready={composed} style={{
                fontFamily: FONT.mono, fontWeight: 400, fontSize: 12, color: '#fff', lineHeight: 1.3, maxWidth: 338, margin: '60px 0 0',
              }} />
            </div>
            <div className="md:col-[5/10]" style={{ position: 'relative', aspectRatio: '1548 / 1041', transform: 'scale(1.5)' }}>
              {(['a', 'b'] as const).map(id => {
                const img = SYSTEMS[id].img
                const style = { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: id === system ? 1 : 0, transition: 'opacity .6s ease' } as const
                return img
                  ? <img key={id} src={img} alt={SYSTEMS[id].title} style={{ ...style, objectFit: 'cover', objectPosition: '50% 46%', maskImage: FEATHER, WebkitMaskImage: FEATHER }} />
                  : <div key={id} style={{ ...style, background: '#222', borderRadius: 6 }} />
              })}
            </div>
          </div>
        </div>
      </section>

      <SystemToggle value={system} onChange={selectSystem} shown={toggleShown} />
    </>
  )
}

// ─── System toggle ────────────────────────────────────────────────────────────
// Pinned 60px from the bottom of the viewport, centred. Rises + fades in when
// shown, reverses when hidden. The blue fill travels between the halves as a
// band that softens to 0% → blue → 0% mid-move, settling solid on arrival.

const SWITCH_MS = 480

function SystemToggle({ value, onChange, shown }: { value: SystemId; onChange: (id: SystemId) => void; shown: boolean }) {
  const fillRef = useRef<HTMLDivElement>(null)
  const pos = useRef(value === 'b' ? 1 : 0)   // 0 = over A, 1 = over B

  useEffect(() => {
    const el = fillRef.current
    if (!el) return
    const from = pos.current
    const to = value === 'b' ? 1 : 0
    const paint = (p: number, soft: number) => {
      const left = p * 50, right = left + 50
      const clear = `rgba(${SEL},0)`
      el.style.background = `linear-gradient(90deg, ${clear} ${left - soft}%, ${BLUE} ${left + soft}%, ${BLUE} ${right - soft}%, ${clear} ${right + soft}%)`
    }
    if (from === to) { paint(to, 0); return }
    let raf = 0
    const start = performance.now()
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / SWITCH_MS)
      pos.current = from + (to - from) * ease(k)
      paint(pos.current, Math.sin(Math.PI * k) * 22)
      if (k < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <div role="group" aria-label="Systems" style={{
      position: 'fixed', left: '50%', bottom: 60, zIndex: 30,
      width: 'min(600px, calc(100vw - 40px))', display: 'flex', borderRadius: 6, overflow: 'hidden',
      background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid #222',
      opacity: shown ? 1 : 0, transform: `translate(-50%, ${shown ? 0 : 16}px)`, pointerEvents: shown ? 'auto' : 'none',
      transition: 'opacity .6s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)',
    }}>
      <div ref={fillRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      {(['a', 'b'] as const).map(id => {
        const active = id === value
        return (
          <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={active}
            className="focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
            style={{
              position: 'relative', flex: '1 1 50%', padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
              background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
            }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 12, lineHeight: 1.5, color: active ? '#d3d3d3' : '#4e4e4e', transition: 'color .5s ease' }}>{SYSTEMS[id].label}</span>
            <span style={{ fontFamily: FONT.sans, fontSize: 21, lineHeight: 1.1, color: active ? '#fff' : '#4e4e4e', transition: 'color .5s ease' }}>{SYSTEMS[id].tagline}</span>
          </button>
        )
      })}
    </div>
  )
}
