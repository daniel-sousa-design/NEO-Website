import { useState, type CSSProperties, type ReactNode } from 'react'
import { FONT } from '../lib/fonts'
import { useSweep } from '../hooks/useSweep'

// ─── Sweep button ─────────────────────────────────────────────────────────────
// A mono pill whose background sweeps to a solid colour (brand blue by default)
// on hover / focus — the site's "gradient to full colour" motion. `forced`
// holds it filled, e.g. while selected (pass `pressed` too, for a toggle).

export function SweepButton({ children, onClick, rgb = '85,166,255', color, colorOn, forced = false, pressed, style, ...rest }: {
  children: ReactNode; onClick?: () => void; rgb?: string; color: string; colorOn: string; forced?: boolean; pressed?: boolean
  style?: CSSProperties; 'aria-disabled'?: boolean
}) {
  const [hover, setOn] = useState(false)
  const on = hover || forced
  const fill = useSweep<HTMLSpanElement>(on, { rgb, ms: 480 })
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} {...rest}
      onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      style={{
        position: 'relative', overflow: 'hidden', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', border: 0, borderRadius: 4,
        fontFamily: FONT.mono, cursor: onClick ? 'pointer' : 'default', color: on ? colorOn : color, transition: 'color .35s ease', ...style,
      }}>
      <span ref={fill} aria-hidden style={{ position: 'absolute', inset: 0 }} />
      <span style={{ position: 'relative' }}>{children}</span>
    </button>
  )
}
