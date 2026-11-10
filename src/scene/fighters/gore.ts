import * as THREE from 'three'
import { outlineMaterial, outlineUniforms } from './materials'

// ───────────────────────── Particles ─────────────────────────

export const PK = { Blood: 0, Flame: 1, Smoke: 2, Spark: 3 } as const
export type PK = (typeof PK)[keyof typeof PK]

export interface EmitAt {
  p: THREE.Vector3
  d: THREE.Vector3
}

export interface Emitter {
  kind: PK
  t0: number
  t1: number
  /** Particles per second at full strength. */
  rate: number
  speed: [number, number]
  spread: number
  size: [number, number]
  /** Arterial pulsing: beats per second (0 = steady). */
  pulse?: number
  /** Strength multiplier over the emitter's life (0..1 → 0..1). */
  fade?: boolean
  at: (out: EmitAt, rand: () => number) => void
  acc?: number
}

export interface Pool {
  t0: number
  grow: number
  maxR: number
  at: (out: THREE.Vector3) => void
  cur?: THREE.Vector3
}

const MAX_P = 320
const MAX_SPLAT = 90
const MAX_POOL = 4

const BLOOD_A = new THREE.Color('#7a0610')
const BLOOD_B = new THREE.Color('#b3141e')
const FLAME_A = new THREE.Color('#fff3a0')
const FLAME_B = new THREE.Color('#ff7a1a')
const FLAME_C = new THREE.Color('#c81e0a')
const SMOKE_A = new THREE.Color('#3a383c')
const SMOKE_B = new THREE.Color('#9a979e')
const SPARK_A = new THREE.Color('#e8fbff')
const SPARK_B = new THREE.Color('#1f9dff')

/** Flat irregular blob lying in XZ, radius ~1. */
function blobGeometry(seed: number, segs = 18): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(1, segs)
  const pos = g.attributes.position
  for (let i = 1; i < pos.count; i++) {
    const a = Math.atan2(pos.getY(i), pos.getX(i))
    const r = 0.82 + 0.18 * Math.sin(a * 3 + seed) + 0.1 * Math.sin(a * 7 + seed * 2.3)
    pos.setXY(i, Math.cos(a) * r, Math.sin(a) * r)
  }
  g.rotateX(-Math.PI / 2)
  return g
}

let shared: {
  drop: THREE.BufferGeometry
  blob: THREE.BufferGeometry
  pool: THREE.BufferGeometry
  dropMat: THREE.MeshBasicMaterial
  splatMat: THREE.MeshBasicMaterial
  poolMat: THREE.MeshBasicMaterial
} | null = null

function sharedGore() {
  if (shared) return shared
  shared = {
    drop: new THREE.IcosahedronGeometry(1, 0),
    blob: blobGeometry(1.3, 12),
    pool: blobGeometry(4.1, 22),
    dropMat: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    splatMat: new THREE.MeshBasicMaterial({
      color: '#64050c',
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    poolMat: new THREE.MeshBasicMaterial({
      color: '#4e030a',
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  }
  return shared
}

const _m = new THREE.Matrix4()
const _c = new THREE.Color()
const _at: EmitAt = { p: new THREE.Vector3(), d: new THREE.Vector3() }
const _v = new THREE.Vector3()

/**
 * Blood droplets, flames, smoke and sparks for one corpse, plus the splats and
 * pools blood leaves on the floor. Lives in the fighter's local frame.
 */
export class Gore {
  readonly group = new THREE.Group()
  private parts: THREE.InstancedMesh
  private splats: THREE.InstancedMesh
  private pools: THREE.InstancedMesh
  private px = new Float32Array(MAX_P * 3)
  private pv = new Float32Array(MAX_P * 3)
  private age = new Float32Array(MAX_P)
  private life = new Float32Array(MAX_P)
  private size = new Float32Array(MAX_P)
  private kind = new Uint8Array(MAX_P)
  private alive = new Uint8Array(MAX_P)
  private tint = new Float32Array(MAX_P)
  private next = 0
  private splatN = 0
  private emitters: Emitter[] = []
  private poolList: Pool[] = []
  private seed = 1
  private floor: number

  constructor(floor: number) {
    this.floor = floor
    const s = sharedGore()
    this.parts = new THREE.InstancedMesh(s.drop, s.dropMat, MAX_P)
    this.parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.parts.setColorAt(0, _c.set('#ffffff'))
    this.splats = new THREE.InstancedMesh(s.blob, s.splatMat, MAX_SPLAT)
    this.pools = new THREE.InstancedMesh(s.pool, s.poolMat, MAX_POOL)
    for (const m of [this.parts, this.splats, this.pools]) {
      m.frustumCulled = false
      m.castShadow = false
      m.count = 0
      m.raycast = () => null
      this.group.add(m)
    }
    this.pools.renderOrder = 1
    this.splats.renderOrder = 2
  }

  private rand = () => {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }

  begin(emitters: Emitter[], pools: Pool[], seed: number) {
    this.clear()
    this.seed = Math.floor(seed * 1e6) + 7
    this.emitters = emitters
    this.poolList = pools
  }

  clear() {
    this.alive.fill(0)
    this.emitters = []
    this.poolList = []
    this.splatN = 0
    this.parts.count = 0
    this.splats.count = 0
    this.pools.count = 0
  }

  private spawn(kind: PK, at: EmitAt, e: Emitter) {
    const i = this.next
    this.next = (this.next + 1) % MAX_P
    const r = this.rand
    const sp = e.speed[0] + (e.speed[1] - e.speed[0]) * r()
    _v.set(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(2 * e.spread).add(at.d).normalize().multiplyScalar(sp)
    this.px.set([at.p.x, at.p.y, at.p.z], i * 3)
    this.pv.set([_v.x, _v.y, _v.z], i * 3)
    this.age[i] = 0
    this.kind[i] = kind
    this.size[i] = e.size[0] + (e.size[1] - e.size[0]) * r()
    this.tint[i] = r()
    this.life[i] = kind === PK.Blood ? 3 : kind === PK.Flame ? 0.3 + r() * 0.3 : kind === PK.Smoke ? 1.1 + r() * 0.8 : 0.18 + r() * 0.2
    this.alive[i] = 1
  }

  private splat(x: number, z: number, r: number) {
    const i = this.splatN % MAX_SPLAT
    this.splatN++
    const y = this.floor + 0.0012 + (i % 7) * 0.00008
    const a = this.rand() * Math.PI * 2
    _m.makeRotationY(a).scale(_v.set(r, 1, r * (0.7 + this.rand() * 0.5))).setPosition(x, y, z)
    this.splats.setMatrixAt(i, _m)
    this.splats.count = Math.min(MAX_SPLAT, this.splatN)
    this.splats.instanceMatrix.needsUpdate = true
  }

  update(t: number, dt: number) {
    const step = Math.min(dt, 0.05)
    for (const e of this.emitters) {
      if (t < e.t0 || t > e.t1) continue
      let k = e.rate
      if (e.pulse) k *= Math.pow(Math.max(0, Math.sin((t - e.t0) * e.pulse * Math.PI * 2)), 2) * 1.8 + 0.12
      if (e.fade) k *= 1 - (t - e.t0) / Math.max(0.001, e.t1 - e.t0)
      e.acc = (e.acc ?? 0) + k * step
      while (e.acc >= 1) {
        e.acc -= 1
        e.at(_at, this.rand)
        this.spawn(e.kind, _at, e)
      }
    }

    const floor = this.floor
    let n = 0
    for (let i = 0; i < MAX_P; i++) {
      if (!this.alive[i]) continue
      const kind = this.kind[i] as PK
      this.age[i] += step
      const age = this.age[i]
      if (age > this.life[i]) {
        this.alive[i] = 0
        continue
      }
      const o = i * 3
      const grav = kind === PK.Blood ? -6.5 : kind === PK.Flame ? 1.6 : kind === PK.Smoke ? 0.35 : -4
      const drag = kind === PK.Smoke ? 0.94 : kind === PK.Flame ? 0.92 : 0.995
      this.pv[o] *= drag
      this.pv[o + 1] = this.pv[o + 1] * drag + grav * step
      this.pv[o + 2] *= drag
      this.px[o] += this.pv[o] * step
      this.px[o + 1] += this.pv[o + 1] * step
      this.px[o + 2] += this.pv[o + 2] * step
      if (this.px[o + 1] < floor + 0.004) {
        if (kind === PK.Blood) {
          this.splat(this.px[o], this.px[o + 2], this.size[i] * (2 + this.tint[i] * 2.2))
          this.alive[i] = 0
          continue
        }
        this.px[o + 1] = floor + 0.004
        this.pv[o + 1] = Math.abs(this.pv[o + 1]) * 0.3
      }
      const u = age / this.life[i]
      let s = this.size[i]
      if (kind === PK.Flame) {
        s *= 1 - u * 0.8
        if (u < 0.35) _c.copy(FLAME_A).lerp(FLAME_B, u / 0.35)
        else _c.copy(FLAME_B).lerp(FLAME_C, (u - 0.35) / 0.65)
      } else if (kind === PK.Smoke) {
        s *= 0.6 + u * 1.6
        if (u > 0.7) s *= 1 - (u - 0.7) / 0.3
        _c.copy(SMOKE_A).lerp(SMOKE_B, u * 0.8 + this.tint[i] * 0.2)
      } else if (kind === PK.Spark) {
        s *= 1 - u
        _c.copy(SPARK_A).lerp(SPARK_B, this.tint[i])
      } else {
        _c.copy(BLOOD_A).lerp(BLOOD_B, this.tint[i])
      }
      // Fast drops stretch into streaks.
      const sy = kind === PK.Blood ? s * (1 + Math.min(2, Math.hypot(this.pv[o], this.pv[o + 1], this.pv[o + 2]) * 0.8)) : s
      _m.makeScale(s, sy, s).setPosition(this.px[o], this.px[o + 1], this.px[o + 2])
      this.parts.setMatrixAt(n, _m)
      this.parts.setColorAt(n, _c)
      n++
    }
    this.parts.count = n
    this.parts.instanceMatrix.needsUpdate = true
    if (this.parts.instanceColor) this.parts.instanceColor.needsUpdate = true

    let pn = 0
    for (const pool of this.poolList) {
      if (t < pool.t0 || pn >= MAX_POOL) continue
      pool.cur ??= new THREE.Vector3()
      pool.at(_v)
      if (t - pool.t0 < step * 1.5) pool.cur.copy(_v)
      else pool.cur.lerp(_v, 1 - Math.exp(-3 * step))
      const g = Math.min(1, (t - pool.t0) / pool.grow)
      const r = pool.maxR * (1 - (1 - g) * (1 - g))
      _m.makeScale(Math.max(0.0001, r), 1, Math.max(0.0001, r * 0.86)).setPosition(pool.cur.x, this.floor + 0.0007 + pn * 0.0002, pool.cur.z)
      this.pools.setMatrixAt(pn, _m)
      pn++
    }
    this.pools.count = pn
    this.pools.instanceMatrix.needsUpdate = true
  }

  dispose() {
    this.parts.dispose()
    this.splats.dispose()
    this.pools.dispose()
  }
}

// ───────────────────────── Wound meshes ─────────────────────────

let woundMats: {
  flesh: THREE.MeshToonMaterial
  deep: THREE.MeshBasicMaterial
  bone: THREE.MeshToonMaterial
  char: THREE.MeshBasicMaterial
  stain: THREE.MeshBasicMaterial
} | null = null

function wm() {
  return (woundMats ??= {
    flesh: new THREE.MeshToonMaterial({ color: '#a3121a', side: THREE.DoubleSide }),
    deep: new THREE.MeshBasicMaterial({ color: '#2a0306', side: THREE.DoubleSide }),
    bone: new THREE.MeshToonMaterial({ color: '#efe6d4' }),
    char: new THREE.MeshBasicMaterial({ color: '#170c08' }),
    stain: new THREE.MeshBasicMaterial({ color: '#6e0610' }),
  })
}

const noRay = () => null
function mesh(g: THREE.BufferGeometry, m: THREE.Material) {
  const x = new THREE.Mesh(g, m)
  x.raycast = noRay
  x.castShadow = false
  return x
}

/** Raw cut face: meat disc with a bone stub, facing +Y of the returned group. */
export function stumpCap(r: number): THREE.Group {
  const g = new THREE.Group()
  const M = wm()
  g.add(mesh(new THREE.CylinderGeometry(r, r * 0.92, r * 0.25, 12), M.flesh))
  const b = mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.32, r * 0.55, 8), M.bone)
  b.position.y = r * 0.12
  g.add(b)
  return g
}

/** Tunnel walls + charred lip for a beam hole along the bone's local Z. */
export function beamTunnel(r: number, depth: number, ember: THREE.Material): THREE.Group {
  const g = new THREE.Group()
  const M = wm()
  const tube = mesh(new THREE.CylinderGeometry(r * 0.985, r * 0.985, depth, 14, 1, true), M.deep)
  tube.rotation.x = Math.PI / 2
  g.add(tube)
  for (const z of [-depth / 2, depth / 2]) {
    const lip = mesh(new THREE.TorusGeometry(r * 1.06, r * 0.18, 5, 16), M.char)
    lip.position.z = z
    g.add(lip)
    const glow = mesh(new THREE.TorusGeometry(r * 1.0, r * 0.09, 4, 16), ember)
    glow.position.z = z * 1.02
    g.add(glow)
  }
  return g
}

/** Wet blood blot sitting on a body surface (local +Z out of the surface). */
export function stain(r: number): THREE.Mesh {
  const s = mesh(new THREE.SphereGeometry(1, 10, 6), wm().stain)
  s.scale.set(r, r * 1.25, r * 0.28)
  return s
}

export function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    if (c instanceof THREE.Mesh) c.geometry.dispose()
  })
}

// ───────────────────────── Body shader (hole / char / flash) ─────────────────────────

export interface GoreUniforms {
  uHole: { value: THREE.Vector4 }
  uHoleBone: { value: number }
  uChar: { value: number }
  uEmber: { value: number }
  uFlash: { value: number }
  uTime: { value: number }
}

export function goreUniforms(): GoreUniforms {
  return {
    uHole: { value: new THREE.Vector4(0, 0, 0, 0) },
    uHoleBone: { value: -1 },
    uChar: { value: 0 },
    uEmber: { value: 0 },
    uFlash: { value: 0 },
    uTime: { value: 0 },
  }
}

const GORE_PARS = /* glsl */ `
varying vec3 vGoreP;
varying float vGoreB;
uniform vec4 uHole;
uniform float uHoleBone;
uniform float uChar;
uniform float uEmber;
uniform float uFlash;
uniform float uTime;
`

const GORE_VERT = /* glsl */ `
vGoreP = position;
#ifdef USE_SKINNING
vGoreB = skinIndex.x;
#else
vGoreB = -1.0;
#endif
`

/** Hole test in the hit bone's local space: a cylinder through it along local Z. */
const GORE_HOLE = /* glsl */ `
float goreRim = 0.0;
if (uHole.w > 0.0 && abs(vGoreB - uHoleBone) < 0.5) {
  float gd = length(vGoreP.xy - uHole.xy);
  if (gd < uHole.w) discard;
  goreRim = 1.0 - smoothstep(uHole.w, uHole.w * 1.9, gd);
}
`

const GORE_COLOR = /* glsl */ `
${GORE_HOLE}
float goreN = fract(sin(dot(floor(vGoreP * 70.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.02, 0.012), goreRim);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.065, 0.06) * (0.7 + goreN * 0.6), uChar);
`

const GORE_LIGHT = /* glsl */ `
float goreVein = abs(sin(dot(vGoreP, vec3(91.0, 57.0, 73.0)) + 2.2 * sin(dot(vGoreP, vec3(-43.0, 88.0, 29.0)))));
float goreCrack = (1.0 - smoothstep(0.0, 0.16, goreVein)) * uEmber * smoothstep(0.2, 0.6, uChar) * (0.6 + 0.4 * sin(uTime * 7.0 + vGoreP.y * 60.0));
outgoingLight += vec3(1.0, 0.36, 0.06) * (goreCrack * 1.4 + goreRim * uEmber * 1.6);
outgoingLight = mix(outgoingLight, vec3(0.78, 0.93, 1.0), uFlash);
`

function inject(src: string, anchor: string, code: string, before = false): string {
  if (!src.includes(anchor)) return src
  return src.replace(anchor, before ? `${code}\n${anchor}` : `${anchor}\n${code}`)
}

/** Per-fighter clone of a baked material that can be holed, charred and flashed. */
export function goreMaterial(src: THREE.Material, U: GoreUniforms): THREE.Material {
  if (src === outlineMaterial) {
    const o = outlineMaterial
    return new THREE.ShaderMaterial({
      uniforms: { ...outlineUniforms, ...U },
      side: o.side,
      vertexShader: inject(inject(o.vertexShader, '#include <common>', GORE_PARS), '#include <begin_vertex>', GORE_VERT),
      fragmentShader: o.fragmentShader
        .replace('void main() {', `${GORE_PARS}\nvoid main() {\n${GORE_HOLE}`)
        .replace('gl_FragColor = vec4(uColor, 1.0);', 'gl_FragColor = vec4(mix(uColor, vec3(0.78, 0.93, 1.0), uFlash), 1.0);'),
    })
  }
  const m = src.clone()
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U)
    sh.vertexShader = inject(inject(sh.vertexShader, '#include <common>', GORE_PARS), '#include <begin_vertex>', GORE_VERT)
    let f = inject(sh.fragmentShader, '#include <common>', GORE_PARS)
    f = inject(f, '#include <color_fragment>', GORE_COLOR)
    f = f.includes('#include <opaque_fragment>')
      ? inject(f, '#include <opaque_fragment>', GORE_LIGHT, true)
      : inject(f, '#include <output_fragment>', GORE_LIGHT, true)
    sh.fragmentShader = f
  }
  m.customProgramCacheKey = () => `gore:${src.type}`
  return m
}
