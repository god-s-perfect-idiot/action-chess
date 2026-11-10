import * as THREE from 'three'
import type { DeathStyle } from '../../game/heroDesigns'
import { expandSevers, type DamageType, type HitZone, type Sever, type SeverSpec } from './anims'
import type { BoneName, Proportions, RigBones } from './rig'

// Particle ids. The *_F entries are free roots that a severed part swaps onto.
const PEL = 0
const LHIP = 1
const RHIP = 2
const LKNEE = 3
const RKNEE = 4
const LANK = 5
const RANK = 6
const CHEST = 7
const NECK = 8
const HEAD = 9
const NOSE = 10
const LSH = 11
const RSH = 12
const LELB = 13
const RELB = 14
const LWR = 15
const RWR = 16
const LSH_F = 17
const RSH_F = 18
const LHIP_F = 19
const RHIP_F = 20
const NECK_F = 21
const N = 22

export const RAG = { PEL, CHEST, NECK, HEAD, NOSE, LSH, RSH, LELB, RELB, LWR, RWR, LHIP, RHIP, LKNEE, RKNEE, LANK, RANK }

const DT = 1 / 120
const GRAVITY = 7
const ITER = 8

interface Link {
  a: number
  b: number
  len: number
  k: number
  /** Only push apart (keeps limbs from folding through the body). */
  min: boolean
}

interface Limb {
  top: number
  mid: number
  end: number
  knee: boolean
  parent: 'pelvis' | 'chest'
  severed: boolean
  axis: THREE.Vector3
}

export interface RagdollStart {
  dmg: DamageType
  zone: HitZone
  style: DeathStyle
  sever: SeverSpec | null
  seed: number
  floor: number
}

function rng(seed: number) {
  let s = Math.floor(seed * 2147483646) + 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()
const _d = new THREE.Vector3()
const _e = new THREE.Vector3()
const _u = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _qi = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)

/** Rotation whose Y axis is `y` and whose X axis is as close to `xHint` as possible. */
function frameXY(xHint: THREE.Vector3, y: THREE.Vector3, out: THREE.Quaternion) {
  const Y = _a.copy(y).normalize()
  const Xa = _b.copy(xHint).addScaledVector(Y, -xHint.dot(Y))
  if (Xa.lengthSq() < 1e-8) Xa.set(1, 0, 0)
  Xa.normalize()
  const Z = _c.crossVectors(Xa, Y)
  _m.makeBasis(Xa, Y, Z)
  return out.setFromRotationMatrix(_m)
}

/** Rotation whose Y axis is `y` and whose Z axis is as close to `zHint` as possible. */
function frameYZ(y: THREE.Vector3, zHint: THREE.Vector3, out: THREE.Quaternion) {
  const Y = _a.copy(y).normalize()
  const Z = _c.copy(zHint).addScaledVector(Y, -zHint.dot(Y))
  if (Z.lengthSq() < 1e-8) Z.set(0, 0, 1)
  Z.normalize()
  const Xa = _b.crossVectors(Y, Z)
  _m.makeBasis(Xa, Y, Z)
  return out.setFromRotationMatrix(_m)
}

/** Body-space transform of a bone, as last written by the ragdoll. */
export interface BoneXf {
  pos: THREE.Vector3
  q: THREE.Quaternion
}

const XF_BONES = [
  'pelvis',
  'spine',
  'chest',
  'neck',
  'head',
  'lUpper',
  'rUpper',
  'lFore',
  'rFore',
  'lThigh',
  'rThigh',
  'lShin',
  'rShin',
] as const satisfies readonly BoneName[]
export type XfBone = (typeof XF_BONES)[number]

/**
 * Verlet ragdoll seeded from the fighter's current bone pose. Simulates in the
 * fighter's local frame (body space) and writes bone rotations back directly,
 * bypassing the pose rig. Deterministic for a given start, so it can be
 * scrubbed by re-simulating from zero.
 */
export class Ragdoll {
  active = false
  t = 0
  readonly xf = Object.fromEntries(
    XF_BONES.map((n) => [n, { pos: new THREE.Vector3(), q: new THREE.Quaternion() }]),
  ) as Record<XfBone, BoneXf>
  readonly p = Array.from({ length: N }, () => new THREE.Vector3())
  private prev = Array.from({ length: N }, () => new THREE.Vector3())
  private p0 = Array.from({ length: N }, () => new THREE.Vector3())
  private v0 = Array.from({ length: N }, () => new THREE.Vector3())
  private r = new Float32Array(N)
  private w = new Float32Array(N)
  private on = new Uint8Array(N)
  private links: Link[] = []
  private limbs: Limb[] = []
  private saved = new Map<THREE.Object3D, THREE.Vector3>()
  private opts: RagdollStart | null = null
  private rand = rng(0.5)
  private pelvisQ = new THREE.Quaternion()
  private chestQ = new THREE.Quaternion()
  private headQ = new THREE.Quaternion()
  private axisTmp = new THREE.Vector3()
  sever: SeverSpec | null = null
  severs: Sever[] = []

  private pr: Proportions

  constructor(pr: Proportions) {
    this.pr = pr
  }

  start(bones: RigBones, frame: THREE.Object3D, opts: RagdollStart) {
    const pr = this.pr
    this.opts = opts
    this.sever = opts.sever
    this.severs = expandSevers(opts.sever)
    this.saved.clear()
    for (const g of Object.values(bones)) if (g) this.saved.set(g, g.position.clone())

    bones.body?.updateWorldMatrix(true, true)
    const at = (g: THREE.Object3D | undefined, i: number, local?: [number, number, number]) => {
      const v = this.p0[i]
      if (local) v.set(local[0], local[1], local[2])
      else v.set(0, 0, 0)
      if (g) {
        g.localToWorld(v)
        frame.worldToLocal(v)
      }
    }
    at(bones.pelvis, PEL)
    at(bones.lThigh, LHIP)
    at(bones.rThigh, RHIP)
    at(bones.lShin, LKNEE)
    at(bones.rShin, RKNEE)
    at(bones.lFoot, LANK)
    at(bones.rFoot, RANK)
    at(bones.chest, CHEST)
    at(bones.neck, NECK)
    at(bones.head, HEAD, [0, pr.headR * 0.95, 0])
    at(bones.head, NOSE, [0, pr.headR * 0.95, pr.headR])
    at(bones.lUpper, LSH)
    at(bones.rUpper, RSH)
    at(bones.lFore, LELB)
    at(bones.rFore, RELB)
    at(bones.lHand, LWR)
    at(bones.rHand, RWR)
    this.p0[LSH_F].copy(this.p0[LSH])
    this.p0[RSH_F].copy(this.p0[RSH])
    this.p0[LHIP_F].copy(this.p0[LHIP])
    this.p0[RHIP_F].copy(this.p0[RHIP])
    this.p0[NECK_F].copy(this.p0[NECK])

    const L = pr.limb
    const radius: [number, number][] = [
      [PEL, pr.pelvisD * 0.5],
      [LHIP, 0.045 * L],
      [RHIP, 0.045 * L],
      [LKNEE, 0.032 * L],
      [RKNEE, 0.032 * L],
      [LANK, pr.ankle * 0.8],
      [RANK, pr.ankle * 0.8],
      [CHEST, pr.chestD * 0.5],
      [NECK, 0.04],
      [HEAD, pr.headR],
      [NOSE, 0.02],
      [LSH, 0.04 * L],
      [RSH, 0.04 * L],
      [LELB, 0.028 * L],
      [RELB, 0.028 * L],
      [LWR, 0.024 * L],
      [RWR, 0.024 * L],
      [LSH_F, 0.04 * L],
      [RSH_F, 0.04 * L],
      [LHIP_F, 0.045 * L],
      [RHIP_F, 0.045 * L],
      [NECK_F, 0.04],
    ]
    for (const [i, rr] of radius) this.r[i] = rr
    for (let i = 0; i < N; i++) this.w[i] = 1
    for (const i of [PEL, LHIP, RHIP, CHEST, NECK, LSH, RSH]) this.w[i] = 0.55
    this.w[HEAD] = 0.8

    this.buildLinks()
    this.limbs = [
      { top: LSH, mid: LELB, end: LWR, knee: false, parent: 'chest', severed: false, axis: new THREE.Vector3(1, 0, 0) },
      { top: RSH, mid: RELB, end: RWR, knee: false, parent: 'chest', severed: false, axis: new THREE.Vector3(1, 0, 0) },
      { top: LHIP, mid: LKNEE, end: LANK, knee: true, parent: 'pelvis', severed: false, axis: new THREE.Vector3(1, 0, 0) },
      { top: RHIP, mid: RKNEE, end: RANK, knee: true, parent: 'pelvis', severed: false, axis: new THREE.Vector3(1, 0, 0) },
    ]
    this.on.fill(1)
    for (const i of [LSH_F, RSH_F, LHIP_F, RHIP_F, NECK_F]) this.on[i] = 0
    for (const s of this.severs) this.applySever(s)
    // Board fighters stand slightly sunk into the tiles; corpses rest on top.
    for (let i = 0; i < N; i++) this.p0[i].y = Math.max(this.p0[i].y, opts.floor + this.r[i])

    this.initialVelocity(opts)
    this.active = true
    this.reset()
  }

  private link(a: number, b: number, k = 1, min = false, scale = 1) {
    this.links.push({ a, b, len: this.p0[a].distanceTo(this.p0[b]) * scale, k, min })
  }

  private buildLinks() {
    this.links = []
    const rigid = (ids: number[]) => {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) this.link(ids[i], ids[j])
    }
    rigid([PEL, LHIP, RHIP, CHEST])
    rigid([CHEST, NECK, LSH, RSH])
    // Spine: bends, but resists folding and twisting.
    this.link(LHIP, LSH, 0.22)
    this.link(RHIP, RSH, 0.22)
    this.link(PEL, NECK, 0.3)
    this.link(LHIP, RSH, 0.12)
    this.link(RHIP, LSH, 0.12)
    // Head + neck.
    rigid([NECK, HEAD, NOSE])
    this.link(CHEST, HEAD, 0.35)
    this.link(LSH, HEAD, 1, true, 0.85)
    this.link(RSH, HEAD, 1, true, 0.85)
    // Limbs.
    for (const [a, b, c] of [
      [LSH, LELB, LWR],
      [RSH, RELB, RWR],
      [LHIP, LKNEE, LANK],
      [RHIP, RKNEE, RANK],
    ]) {
      this.link(a, b)
      this.link(b, c)
      this.links.push({ a, b: c, len: (this.p0[a].distanceTo(this.p0[b]) + this.p0[b].distanceTo(this.p0[c])) * 0.38, k: 1, min: true })
    }
    this.links.push({ a: LKNEE, b: RKNEE, len: 0.07, k: 1, min: true })
    this.links.push({ a: LANK, b: RANK, len: 0.06, k: 1, min: true })
    this.links.push({ a: LWR, b: CHEST, len: 0.08, k: 1, min: true })
    this.links.push({ a: RWR, b: CHEST, len: 0.08, k: 1, min: true })
  }

  private applySever(s: Sever) {
    const swap = (from: number, to: number, inPart: (l: Link) => boolean) => {
      for (const l of this.links) {
        if ((l.a !== from && l.b !== from) || !inPart(l)) continue
        if (l.a === from) l.a = to
        else l.b = to
      }
      this.on[to] = 1
    }
    const inArm = (side: 'l' | 'r') => (l: Link) => {
      const o = l.a === (side === 'l' ? LSH : RSH) ? l.b : l.a
      return side === 'l' ? o === LELB || o === LWR : o === RELB || o === RWR
    }
    const inLeg = (side: 'l' | 'r') => (l: Link) => {
      const o = l.a === (side === 'l' ? LHIP : RHIP) ? l.b : l.a
      return side === 'l' ? o === LKNEE || o === LANK : o === RKNEE || o === RANK
    }
    if (s === 'lArm') {
      swap(LSH, LSH_F, inArm('l'))
      this.links = this.links.filter((l) => !(l.a === LWR && l.b === CHEST))
      this.limbs[0].top = LSH_F
      this.limbs[0].severed = true
    } else if (s === 'rArm') {
      swap(RSH, RSH_F, inArm('r'))
      this.links = this.links.filter((l) => !(l.a === RWR && l.b === CHEST))
      this.limbs[1].top = RSH_F
      this.limbs[1].severed = true
    } else if (s === 'lLeg') {
      swap(LHIP, LHIP_F, inLeg('l'))
      this.links = this.links.filter((l) => !(l.a === LKNEE && l.b === RKNEE) && !(l.a === LANK && l.b === RANK))
      this.limbs[2].top = LHIP_F
      this.limbs[2].severed = true
    } else if (s === 'rLeg') {
      swap(RHIP, RHIP_F, inLeg('r'))
      this.links = this.links.filter((l) => !(l.a === LKNEE && l.b === RKNEE) && !(l.a === LANK && l.b === RANK))
      this.limbs[3].top = RHIP_F
      this.limbs[3].severed = true
    } else if (s === 'head') {
      this.links = this.links.filter((l) => {
        const h = l.a === HEAD || l.b === HEAD || l.a === NOSE || l.b === NOSE
        if (!h) return true
        if (l.a === NECK || l.b === NECK) {
          if (l.a === NECK) l.a = NECK_F
          else l.b = NECK_F
          return true
        }
        return l.a === HEAD ? l.b === NOSE : l.a === NOSE ? l.b === HEAD : false
      })
      this.on[NECK_F] = 1
    }
  }

  private initialVelocity(o: RagdollStart) {
    const rand = rng(o.seed + 0.17)
    const p0 = this.p0
    const side = rand() < 0.5 ? -1 : 1
    const push = new THREE.Vector3()
    switch (o.dmg) {
      case 'none': push.set(0, 0, -0.3); break
      case 'blunt': push.set(0, 0.7, -1.25); break
      case 'slash': push.set(0.3 * side, 0.3, -0.75); break
      case 'pierce': push.set(0, 0.25, -0.95); break
      case 'beam': push.set(0, 0.5, -1.45); break
      case 'burn': push.set(0, 0, -0.3); break
      case 'shock': push.set(0, 0.15, -0.25); break
    }
    let buckle = 0
    let spin = 0
    let forward = 0
    switch (o.style) {
      case 'launched': push.y += 1.1; push.z *= 1.3; break
      case 'crumple': push.multiplyScalar(0.45); buckle = 1; break
      case 'kneel': push.multiplyScalar(0.3); buckle = 1.2; break
      case 'spinOut': spin = 6.5 * side; break
      case 'faceplant': push.multiplyScalar(0.45); forward = 1; break
      default: break
    }
    const hit = o.zone === 'high' ? p0[HEAD] : o.zone === 'low' ? _d.copy(p0[LKNEE]).add(p0[RKNEE]).multiplyScalar(0.5) : p0[CHEST]
    const pel = p0[PEL]
    for (let i = 0; i < N; i++) {
      const v = this.v0[i]
      const d2 = p0[i].distanceToSquared(hit)
      v.copy(push).multiplyScalar(0.45 + 0.9 * Math.exp(-d2 / 0.05))
      if (spin) {
        const rx = p0[i].x - pel.x
        const rz = p0[i].z - pel.z
        v.x += spin * rz
        v.z += -spin * rx
      }
      v.x += (rand() - 0.5) * 0.25
      v.z += (rand() - 0.5) * 0.25
    }
    if (buckle) {
      for (const i of [LKNEE, RKNEE]) this.v0[i].add(_a.set(0, -0.2, 0.9 * buckle))
      this.v0[PEL].y -= 0.6 * buckle
    }
    if (forward) {
      for (const i of [HEAD, NOSE, NECK, CHEST, LSH, RSH]) this.v0[i].z += 1.3
      for (const i of [LANK, RANK]) this.v0[i].z -= 0.5
    }
    for (const s of this.severs) {
      const out = s === 'lArm' || s === 'lLeg' ? 1 : -1
      const parts =
        s === 'lArm' ? [LSH_F, LELB, LWR] : s === 'rArm' ? [RSH_F, RELB, RWR] : s === 'lLeg' ? [LHIP_F, LKNEE, LANK] : s === 'rLeg' ? [RHIP_F, RKNEE, RANK] : [NECK_F, HEAD, NOSE]
      const kick =
        s === 'head'
          ? _a.set(0.4 * side, 2.6, -1.4)
          : s.endsWith('Arm')
            ? _a.set(out * 1.9, 2.0, -0.6)
            : _a.set(out * 0.9, 1.3, -1.0)
      // Full dismember flings parts harder and in more directions.
      const mul = this.severs.length > 1 ? 1.15 + rand() * 0.35 : 1
      parts.forEach((i, j) => this.v0[i].addScaledVector(kick, (1 - j * 0.15) * mul))
      if (s === 'head') this.v0[NOSE].add(_b.set(0, 1.2, 0))
      else this.v0[parts[2]].add(_b.set(0, 1.5, 0))
    }
  }

  /** Rewind to the moment of death. */
  reset() {
    this.t = 0
    this.rand = rng((this.opts?.seed ?? 0.5) + 0.61)
    for (let i = 0; i < N; i++) {
      this.p[i].copy(this.p0[i])
      this.prev[i].copy(this.p0[i]).addScaledVector(this.v0[i], -DT)
    }
    this.frames()
  }

  advance(t: number) {
    if (!this.active) return
    if (t < this.t - 1e-6) this.reset()
    let steps = 0
    while (this.t + DT <= t && steps++ < 720) this.step()
  }

  private holdAt(t: number): { w: number; jitter: number; anchored: boolean } {
    const o = this.opts!
    if (o.dmg === 'shock') return t < 0.85 ? { w: 0.3, jitter: 0.022, anchored: true } : { w: 0, jitter: 0, anchored: false }
    if (o.dmg === 'burn') return t < 1.05 ? { w: 0.22 * (1 - t / 1.05), jitter: 0.03, anchored: true } : { w: 0, jitter: 0, anchored: false }
    if (o.style === 'kneel' && t < 0.5) return { w: 0.08 * (1 - t / 0.5), jitter: 0, anchored: false }
    return t < 0.18 ? { w: 0.1 * (1 - t / 0.18), jitter: 0, anchored: false } : { w: 0, jitter: 0, anchored: false }
  }

  private step() {
    const p = this.p
    const prev = this.prev
    const floor = this.opts!.floor
    const g = GRAVITY * DT * DT
    for (let i = 0; i < N; i++) {
      if (!this.on[i]) continue
      const c = p[i]
      const o = prev[i]
      const vx = (c.x - o.x) * 0.998
      const vy = (c.y - o.y) * 0.998
      const vz = (c.z - o.z) * 0.998
      o.copy(c)
      c.x += vx
      c.y += vy - g
      c.z += vz
    }

    const hold = this.holdAt(this.t)
    if (hold.w > 0) {
      const ox = hold.anchored ? 0 : p[PEL].x - this.p0[PEL].x
      const oy = hold.anchored ? 0 : p[PEL].y - this.p0[PEL].y
      const oz = hold.anchored ? 0 : p[PEL].z - this.p0[PEL].z
      const legs = this.opts!.style === 'kneel'
      for (let i = 0; i < N; i++) {
        if (!this.on[i] || i >= LSH_F) continue
        if (legs && (i === LKNEE || i === RKNEE || i === LANK || i === RANK)) continue
        const j = hold.jitter * (i >= LELB && i <= RWR ? 2.2 : 1)
        _a.copy(this.p0[i])
        _a.x += ox + (this.rand() - 0.5) * j
        _a.y += oy + (this.rand() - 0.5) * j
        _a.z += oz + (this.rand() - 0.5) * j
        p[i].lerp(_a, hold.w)
      }
    }

    for (let it = 0; it < ITER; it++) {
      for (const l of this.links) {
        const a = p[l.a]
        const b = p[l.b]
        _a.subVectors(b, a)
        const d = _a.length()
        if (d < 1e-6) continue
        if (l.min && d >= l.len) continue
        const wa = this.w[l.a]
        const wb = this.w[l.b]
        const f = ((d - l.len) / d) * l.k / (wa + wb)
        a.addScaledVector(_a, f * wa)
        b.addScaledVector(_a, -f * wb)
      }
      this.updateFrames()
      for (const limb of this.limbs) this.hinge(limb)
    }

    for (let i = 0; i < N; i++) {
      if (!this.on[i]) continue
      const c = p[i]
      const lo = floor + this.r[i]
      if (c.y < lo) {
        const o = prev[i]
        const vy = c.y - o.y
        c.y = lo
        o.y = lo + vy * 0.25
        o.x += (c.x - o.x) * 0.22
        o.z += (c.z - o.z) * 0.22
      }
    }
    this.t += DT
  }

  private updateFrames() {
    const p = this.p
    frameXY(_d.subVectors(p[LHIP], p[RHIP]), _e.subVectors(p[CHEST], p[PEL]), this.pelvisQ)
    frameXY(_d.subVectors(p[LSH], p[RSH]), _e.subVectors(p[NECK], p[CHEST]), this.chestQ)
  }

  /** Hinge axis for a limb's upper segment, perpendicular to it. */
  private limbAxis(limb: Limb, u: THREE.Vector3): THREE.Vector3 {
    const axis = limb.axis
    if (!limb.severed) {
      const pq = limb.parent === 'pelvis' ? this.pelvisQ : this.chestQ
      const px = _b.set(1, 0, 0).applyQuaternion(pq)
      const pz = _c.set(0, 0, 1).applyQuaternion(pq)
      axis.copy(px).addScaledVector(u, -px.dot(u))
      axis.addScaledVector(_d.crossVectors(u, pz), -1)
    }
    axis.addScaledVector(u, -axis.dot(u))
    if (axis.lengthSq() < 1e-8) axis.copy(X)
    return axis.normalize()
  }

  private hinge(limb: Limb) {
    const p = this.p
    const top = p[limb.top]
    const mid = p[limb.mid]
    const end = p[limb.end]
    const u = _u.subVectors(mid, top)
    if (u.lengthSq() < 1e-10) return
    u.normalize()
    const a = this.limbAxis(limb, u)
    const l = _a.subVectors(end, mid)
    const corr = _e.copy(a).multiplyScalar(-l.dot(a))
    l.add(corr)
    const zb = _b.crossVectors(u, a)
    const side = l.dot(zb)
    if (limb.knee ? side > 0 : side < 0) corr.addScaledVector(zb, -side)
    // Split the fix so the hinge never adds net momentum (otherwise the corpse drifts).
    const w = this.w
    const k = 1 / (w[limb.end] + w[limb.mid] * 0.5)
    end.addScaledVector(corr, w[limb.end] * k)
    mid.addScaledVector(corr, -w[limb.mid] * k * 0.5)
    top.addScaledVector(corr, -w[limb.top] * k * 0.5)
  }

  private frames() {
    this.updateFrames()
  }

  /** Write the simulated body onto the rig. */
  write(bones: RigBones) {
    const pr = this.pr
    const p = this.p
    const xf = this.xf
    this.updateFrames()

    const body = bones.body
    if (body) {
      body.position.set(0, 0, 0)
      body.quaternion.identity()
      body.scale.setScalar(1)
    }

    const pel = xf.pelvis
    pel.pos.copy(p[PEL])
    pel.q.copy(this.pelvisQ)
    bones.pelvis?.position.copy(pel.pos)
    bones.pelvis?.quaternion.copy(pel.q)

    const headQ = this.headQ
    const headOff = this.severs.includes('head')
    const neckSrc = headOff ? p[NECK_F] : p[NECK]
    frameYZ(_d.subVectors(p[HEAD], neckSrc), _e.subVectors(p[NOSE], p[HEAD]), headQ)

    const spine = xf.spine
    spine.q.slerpQuaternions(pel.q, this.chestQ, 0.5)
    spine.pos.set(0, 0.03, 0).applyQuaternion(pel.q).add(pel.pos)
    bones.spine?.quaternion.copy(_qi.copy(pel.q).invert().multiply(spine.q))

    const chest = xf.chest
    chest.q.copy(this.chestQ)
    chest.pos.set(0, pr.abdomen, 0).applyQuaternion(spine.q).add(spine.pos)
    bones.chest?.quaternion.copy(_qi.copy(spine.q).invert().multiply(chest.q))

    const neck = xf.neck
    neck.pos.set(0, pr.chestH, 0).applyQuaternion(chest.q).add(chest.pos)
    const head = xf.head
    head.q.copy(headQ)
    if (headOff) {
      neck.q.copy(chest.q)
      bones.neck?.quaternion.identity()
      head.pos.copy(p[NECK_F])
      bones.head?.position.copy(_a.subVectors(head.pos, neck.pos).applyQuaternion(_qi.copy(neck.q).invert()))
    } else {
      neck.q.slerpQuaternions(chest.q, headQ, 0.5)
      bones.neck?.quaternion.copy(_qi.copy(chest.q).invert().multiply(neck.q))
      head.pos.set(0, pr.neck, 0).applyQuaternion(neck.q).add(neck.pos)
    }
    bones.head?.quaternion.copy(_qi.copy(neck.q).invert().multiply(headQ))

    const limbBones = [
      ['lUpper', 'lFore', 'lHand', chest, [pr.shoulderX, pr.chestH * 0.84, 0]],
      ['rUpper', 'rFore', 'rHand', chest, [-pr.shoulderX, pr.chestH * 0.84, 0]],
      ['lThigh', 'lShin', 'lFoot', pel, [pr.hipX, -0.02, 0]],
      ['rThigh', 'rShin', 'rFoot', pel, [-pr.hipX, -0.02, 0]],
    ] as const
    this.limbs.forEach((limb, i) => {
      const [upName, loName, endName, parent, off] = limbBones[i]
      const up = bones[upName]
      const lo = bones[loName]
      const tip = bones[endName]
      const uxf = xf[upName]
      if (limb.severed) {
        uxf.pos.copy(p[limb.top])
        up?.position.copy(_a.subVectors(uxf.pos, parent.pos).applyQuaternion(_qi.copy(parent.q).invert()))
      } else {
        uxf.pos.set(off[0], off[1], off[2]).applyQuaternion(parent.q).add(parent.pos)
      }
      const u = _u.subVectors(p[limb.mid], p[limb.top])
      if (u.lengthSq() < 1e-10) return
      u.normalize()
      const a = this.axisTmp.copy(this.limbAxis(limb, u))
      frameXY(a, _a.copy(u).negate(), uxf.q)
      up?.quaternion.copy(_qi.copy(parent.q).invert().multiply(uxf.q))
      const l = _a.subVectors(p[limb.end], p[limb.mid]).normalize()
      const zb = _b.crossVectors(u, a)
      let theta = Math.atan2(-l.dot(zb), l.dot(u))
      theta = limb.knee ? THREE.MathUtils.clamp(theta, 0, 2.7) : THREE.MathUtils.clamp(theta, -2.7, 0)
      lo?.quaternion.setFromAxisAngle(X, theta)
      const lxf = xf[loName]
      lxf.q.copy(uxf.q).multiply(lo?.quaternion ?? _q.identity())
      lxf.pos.copy(p[limb.mid])
      tip?.quaternion.setFromAxisAngle(X, limb.knee ? 0.45 : 0.25)
    })
  }

  /** Put the rig back the way `start` found it. */
  stop() {
    for (const [g, pos] of this.saved) g.position.copy(pos)
    this.saved.clear()
    this.active = false
  }

  /** Body-space point on a tracked bone. */
  point(bone: XfBone, local: [number, number, number], out: THREE.Vector3): THREE.Vector3 {
    const x = this.xf[bone]
    return out.set(local[0], local[1], local[2]).applyQuaternion(x.q).add(x.pos)
  }

  dir(bone: XfBone, local: [number, number, number], out: THREE.Vector3): THREE.Vector3 {
    return out.set(local[0], local[1], local[2]).applyQuaternion(this.xf[bone].q)
  }
}
