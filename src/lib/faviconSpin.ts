// ─── Spinning favicon ─────────────────────────────────────────────────────────
// Turns the NEO favicon a full 360° about its vertical axis, like the symbol on
// the ORBI dashboard: the page redraws the tab icon ~20 times a second on a
// canvas — the body extruded from slices (white faces, grey sides), the dot a
// round disc — then puts the crisp static SVG back. Browsers show this in
// Chrome, Edge and Firefox; Safari keeps the static icon.

const BODY = new Path2D('M57.0804 19.6068V22.3494L40.4416 39.0027H19.5898V19.3959H0V16.6532L16.6388 0H37.4906V19.6068H57.0804Z')
const DOT = { x: 49.1959, y: 8.04088, r: 7.0074 }
const W = 57.0804, H = 39.0027        // the logo's drawing size
const SIZE = 64                        // canvas px
const DEPTH = 9                        // extrusion, in logo units
const SLICES = 7
const MS = 1300
const FRAME_MS = 50
const STATIC = `${import.meta.env.BASE_URL}favicon.svg`

const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

let running = 0   // id of the current run, so a new one cancels the old

export function spinFavicon() {
  if (typeof document === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) return
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const id = ++running
  const s = SIZE / W, oy = (SIZE - H * s) / 2, cx = W / 2
  const start = performance.now()
  let lastFrame = 0

  const draw = (a: number) => {
    const cos = Math.cos(a), sin = Math.sin(a)
    ctx.clearRect(0, 0, SIZE, SIZE)
    // Slices back to front (by how far toward the viewer each sits), then the dot mid-stack.
    const slices = Array.from({ length: SLICES }, (_, i) => (i / (SLICES - 1) - .5) * DEPTH)
      .sort((p, q) => p * cos - q * cos)
    const paintSlice = (z: number, face: boolean) => {
      ctx.save()
      ctx.translate(0, oy)
      ctx.scale(s, s)
      ctx.translate(cx + z * sin, 0)
      ctx.scale(cos || .0001, 1)
      ctx.translate(-cx, 0)
      ctx.fillStyle = face ? '#fff' : '#8f8f8f'
      ctx.fill(BODY)
      ctx.restore()
    }
    const paintDot = () => {
      ctx.save()
      ctx.translate(0, oy)
      ctx.scale(s, s)
      ctx.beginPath()
      ctx.arc(cx + (DOT.x - cx) * cos, DOT.y, DOT.r, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.restore()
    }
    slices.forEach((z, i) => {
      if (i === Math.floor(SLICES / 2)) paintDot()
      paintSlice(z, i === SLICES - 1)
    })
  }

  const tick = (t: number) => {
    if (id !== running) return
    const k = Math.min(1, (t - start) / MS)
    if (k >= 1) { link.href = STATIC; return }
    if (t - lastFrame >= FRAME_MS) {
      lastFrame = t
      draw(ease(k) * Math.PI * 2)
      link.href = canvas.toDataURL('image/png')
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
