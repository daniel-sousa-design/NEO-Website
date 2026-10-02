import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { FONT } from '../lib/fonts'

// ─── Mission layers (3D) ──────────────────────────────────────────────────────
// Six glass slabs, A–F, orbiting the centre of the frame — like the Complete
// Mission card's orbit, but in true perspective: a round, level orbit seen from
// a little above, so nearer slabs are larger and pass in front. Each slab rocks
// gently as it travels, and hovering one tips it towards the viewer.
//
// The glass is real refractive glass (three.js transmission): it bends and
// blurs what's behind it — the other slabs, the light grey ground — and
// catches studio reflections and a clear-coat sheen. It's black glass: dark
// tinted, frosted, against the light ground. The frost (roughness) increases from F (clear) to A.
//
// The whole sequence is scrubbed by the scroll — followed with a soft lag, so
// it glides — and runs both ways. As the box comes into view the slabs arrive
// from close to the viewer, large, shrinking onto the orbit, F first. The orbit
// turns as you scroll; then they gather into a vertical stack, A on top, grown
// to fill the frame, floating gently. Scrolling on, they spread back onto the
// orbit and recede into the distance, small. Renders only while on screen.

const N = 6
const W = 3, D = 1.85, T = .05, R_CORNER = .07   // slab width, depth, thickness, corner radius (seen from above)
const BEVEL = .012                                // the soft edge round each slab
const BG = '#d3d3d3'                          // background: light grey
const FROST = [.45, .39, .33, .27, .21, .15] // roughness, A → F: A most frosted
const ORBIT_R = 3.9                               // orbit radius (a level circle round the frame's centre)
const SCROLL_SPIN = 3.2                           // rad the orbit turns across the section's scroll
const WOBBLE = .09                                // rad of rocking as they travel
const CAM = new THREE.Vector3(0, 7, 16.5)          // camera: in front, a little above
const FOV = 31

// Arriving / leaving
const NEAR = new THREE.Vector3(1.2, 2.6, 9.2)     // arrive from here — close to the viewer, so large
const FAR = new THREE.Vector3(-.6, -1.2, -22)     // leave towards here — far away, so small
const STAGGER = .3       // each slab trails the one below by this share of a move

// The timeline: scroll progress 0 (box's top at the bottom of the screen) …
// 1 (box's bottom at the top), split into moves. The box is centred at ~.5.
const ARRIVE = [.06, .34]   // onto the orbit
const GATHER = [.38, .5]    // into the stack
const SPREAD = [.6, .7]     // back onto the orbit
const DEPART = [.72, .92]   // away into the distance
const SMOOTH = 2.6          // how quickly the animation catches up with the scroll (higher = tighter)

// The stack
const STACK_GAP = 1.4       // vertical gap between stacked slabs
const STACK_SCALE = 1.55    // slabs grow to this size in the stack, filling the frame
const FLOAT = .07           // how far each stacked slab bobs up and down

// Hover tilt: a spring towards 1 while hovered, back to 0 after.
const SPRING_K = 140, SPRING_C = 10

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t * t
const seg = (p: number, [a, b]: number[]) => clamp01((p - a) / (b - a))
const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

export default function MissionLayers3D() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    let disposed = false

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.setClearColor(BG, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), .04).texture
    scene.environment = env

    const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 100)
    camera.position.copy(CAM)
    camera.lookAt(0, 0, 0)

    const key = new THREE.DirectionalLight(0xffffff, 2)
    key.position.set(-4, 9, 6)
    scene.add(key)

    scene.background = new THREE.Color(BG)   // also what the glass refracts

    // a thin rounded rectangle, extruded, its edges softly bevelled; centred, lying flat
    const shape = new THREE.Shape()
    const hw = W / 2 - BEVEL, hd = D / 2 - BEVEL, r = R_CORNER
    shape.moveTo(-hw + r, -hd)
    shape.lineTo(hw - r, -hd); shape.quadraticCurveTo(hw, -hd, hw, -hd + r)
    shape.lineTo(hw, hd - r); shape.quadraticCurveTo(hw, hd, hw - r, hd)
    shape.lineTo(-hw + r, hd); shape.quadraticCurveTo(-hw, hd, -hw, hd - r)
    shape.lineTo(-hw, -hd + r); shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd)
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T - 2 * BEVEL, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 4, curveSegments: 8 })
    geo.translate(0, 0, -(T - 2 * BEVEL) / 2)
    geo.rotateX(-Math.PI / 2)
    const slabs: { group: THREE.Group; mesh: THREE.Mesh }[] = []
    const textures: THREE.Texture[] = []

    for (let i = 0; i < N; i++) {
      const group = new THREE.Group()
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: FROST[i],
        transmission: 1, thickness: .15, ior: 1.5,
        attenuationColor: new THREE.Color('#262626'), attenuationDistance: .3,
        clearcoat: 1, clearcoatRoughness: .08, specularIntensity: .45, envMapIntensity: .6,
      })
      const mesh = new THREE.Mesh(geo, glass)
      mesh.userData.index = i
      group.add(mesh)

      // the letter, printed on the top face near the back-left corner
      const c = document.createElement('canvas')
      c.width = c.height = 256
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      textures.push(tex)
      // toneMapped off: the letter stays pure white
      const letter = new THREE.Mesh(new THREE.PlaneGeometry(.95, .95), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }))
      letter.rotation.x = -Math.PI / 2
      letter.position.set(-W / 2 + .55, T / 2 + .004, -D / 2 + .52)
      mesh.add(letter)
      group.userData.draw = () => {
        const g = c.getContext('2d')!
        g.clearRect(0, 0, 256, 256)
        g.fillStyle = '#fff'
        g.font = `200px ${FONT.bitcount}`
        g.textBaseline = 'middle'
        g.textAlign = 'center'
        g.fillText(String.fromCharCode(65 + i), 128, 136)
        tex.needsUpdate = true
      }
      scene.add(group)
      slabs.push({ group, mesh })
    }
    const drawLetters = () => slabs.forEach(s => s.group.userData.draw())
    drawLetters()
    document.fonts?.load(`200px ${FONT.bitcount}`).then(() => { if (!disposed) drawLetters() })

    // ── Hover: which slab is under the pointer ──
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(9, 9)
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    const onLeave = () => pointer.set(9, 9)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    const deform = slabs.map(() => ({ d: 0, v: 0 }))

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    // ── Timeline ──
    let last = performance.now(), raf = 0, visible = false, p = -1   // p: smoothed scroll progress
    const orbitPos = new THREE.Vector3(), stackPos = new THREE.Vector3()
    const tick = (now: number) => {
      raf = visible ? requestAnimationFrame(tick) : 0
      const dt = Math.min(.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      const b = host.getBoundingClientRect(), vh = window.innerHeight
      const target = clamp01((vh - b.top) / (vh + b.height))
      p = p < 0 ? target : p + (target - p) * (1 - Math.exp(-SMOOTH * dt))
      const arrive = seg(p, ARRIVE), depart = seg(p, DEPART)
      const stack = Math.min(seg(p, GATHER), 1 - seg(p, SPREAD))

      // hover
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(slabs.map(s => s.mesh), false)[0]
      const hovered = hit ? (hit.object.userData.index as number) : -1

      const span = 1 + (N - 1) * STAGGER
      slabs.forEach(({ group, mesh }, i) => {
        // place on the orbit
        const th = p * SCROLL_SPIN + i / N * Math.PI * 2
        orbitPos.set(Math.cos(th) * ORBIT_R, 0, Math.sin(th) * ORBIT_R)
        // arriving from close by / leaving into the distance (F first, A last)
        const order = N - 1 - i
        // gathered into the stack — F first, A on top — floating gently
        const kStack = easeInOut(clamp01(stack * span - order * STAGGER))
        stackPos.set(0, (2.5 - i) * STACK_GAP + FLOAT * Math.sin(t * 1.2 + i * .8), 0)
        orbitPos.lerp(stackPos, kStack)
        const kIn = easeOut(clamp01(arrive * span - order * STAGGER))
        const kOut = easeIn(clamp01(depart * span - order * STAGGER))
        const grow = 1 + (STACK_SCALE - 1) * kStack
        if (kOut > 0) { group.position.lerpVectors(orbitPos, FAR, kOut); group.scale.setScalar(1 - .55 * kOut) }
        else { group.position.lerpVectors(NEAR, orbitPos, kIn); group.scale.setScalar(grow * (1 + .25 * (1 - kIn))) }
        // rocking as it travels — calmer and squared up in the stack
        const rock = 1 - .6 * kStack
        group.rotation.set(rock * WOBBLE * Math.sin(t * 1.3 + i * 1.7), (1 - kStack) * Math.sin(th) * .12, rock * WOBBLE * Math.sin(t * 1.05 + th))
        // hover: tip towards the viewer, then spring back
        const s = deform[i]
        const a = SPRING_K * ((hovered === i ? 1 : 0) - s.d) - SPRING_C * s.v
        s.v += a * dt; s.d += s.v * dt
        mesh.rotation.set(.42 * s.d, 0, -.12 * s.d)
      })
      renderer.render(scene, camera)
    }

    resize()
    renderer.render(scene, camera)
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
    }, { rootMargin: '20% 0px 20% 0px' })
    io.observe(host)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      geo.dispose(); env.dispose(); pmrem.dispose()
      textures.forEach(t => t.dispose())
      scene.traverse(o => { if (o instanceof THREE.Mesh) { (o.material as THREE.Material).dispose(); if (o.geometry !== geo) o.geometry.dispose() } })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={ref} aria-hidden style={{ position: 'absolute', inset: 0 }} />
}
