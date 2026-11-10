import * as THREE from 'three'
import type { DeathStyle } from '../../game/heroDesigns'
import { expandSevers, type DamageType, type HitZone, type Sever, type SeverSpec } from './anims'
import { SKIN_BONES } from './bake'
import {
  beamTunnel,
  disposeTree,
  Gore,
  goreMaterial,
  goreUniforms,
  PK,
  stain,
  stumpCap,
  type EmitAt,
  type Emitter,
  type Pool,
} from './gore'
import { RAG, Ragdoll, type XfBone } from './ragdoll'
import type { BoneName, Proportions, RigBones } from './rig'

export interface DeathOpts {
  dmg: DamageType
  zone: HitZone
  style: DeathStyle
  sever: SeverSpec | null
  seed: number
}

type V3 = [number, number, number]

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

const EMBER_HOT = new THREE.Color('#ffb040')
const EMBER_COLD = new THREE.Color('#2a0a04')
const UP = new THREE.Vector3(0, 1, 0)

/** Ragdoll + gore for one fighter's death, driven by time since the killing blow. */
export class DeathFx {
  readonly rd: Ragdoll
  readonly gore: Gore
  active = false
  private U = goreUniforms()
  private goreMats = new Map<THREE.Material, THREE.Material>()
  private swapped: { mesh: THREE.Mesh; orig: THREE.Material | THREE.Material[] }[] = []
  private wounds: THREE.Object3D[] = []
  private ember = new THREE.MeshBasicMaterial({ color: '#ffb040' })
  private opts: DeathOpts | null = null
  private dur = 2.4
  private lastT = 0
  private pr: Proportions
  private frame: THREE.Group
  private floor: number

  constructor(pr: Proportions, frame: THREE.Group, floor: number) {
    this.pr = pr
    this.frame = frame
    this.floor = floor
    this.rd = new Ragdoll(pr)
    this.gore = new Gore(floor)
    frame.add(this.gore.group)
  }

  start(bones: RigBones, meshes: THREE.Mesh[], opts: DeathOpts, dur: number) {
    this.opts = opts
    this.dur = dur
    this.rd.start(bones, this.frame, { ...opts, floor: this.floor })
    this.active = true
    this.lastT = 0

    const { dmg } = opts
    const U = this.U
    U.uHole.value.set(0, 0, 0, 0)
    U.uChar.value = 0
    U.uEmber.value = 0
    U.uFlash.value = 0
    if (dmg === 'beam' || dmg === 'burn' || dmg === 'shock') {
      for (const mesh of meshes) {
        const orig = mesh.material
        if (Array.isArray(orig)) continue
        let gm = this.goreMats.get(orig)
        if (!gm) {
          gm = goreMaterial(orig, U)
          this.goreMats.set(orig, gm)
        }
        this.swapped.push({ mesh, orig })
        mesh.material = gm
      }
    }
    this.addWounds(bones)
    this.gore.begin(this.plan(), this.pools(), opts.seed)
  }

  get dmg(): DamageType | null {
    return this.active && this.opts ? this.opts.dmg : null
  }

  private get holeY() {
    return this.pr.chestH * 0.45
  }

  private get holeR() {
    return this.pr.chestW * 0.25
  }

  private attach(bones: RigBones, bone: BoneName, obj: THREE.Object3D, pos: V3, normal?: V3) {
    const g = bones[bone]
    if (!g) return
    obj.position.set(pos[0], pos[1], pos[2])
    if (normal) obj.quaternion.setFromUnitVectors(UP, new THREE.Vector3(...normal).normalize())
    g.add(obj)
    this.wounds.push(obj)
  }

  /** Where the cut is on the body side and on the severed part, in each bone's space. */
  private cut(s: Sever) {
    const pr = this.pr
    const L = pr.limb
    switch (s) {
      case 'lArm':
        return { body: 'chest' as const, at: [pr.shoulderX, pr.chestH * 0.84, 0] as V3, n: [1, 0.2, 0] as V3, part: 'lUpper' as const, r: 0.032 * L }
      case 'rArm':
        return { body: 'chest' as const, at: [-pr.shoulderX, pr.chestH * 0.84, 0] as V3, n: [-1, 0.2, 0] as V3, part: 'rUpper' as const, r: 0.032 * L }
      case 'lLeg':
        return { body: 'pelvis' as const, at: [pr.hipX, -0.02, 0] as V3, n: [0.3, -1, 0] as V3, part: 'lThigh' as const, r: 0.048 * L }
      case 'rLeg':
        return { body: 'pelvis' as const, at: [-pr.hipX, -0.02, 0] as V3, n: [-0.3, -1, 0] as V3, part: 'rThigh' as const, r: 0.048 * L }
      case 'head':
        return { body: 'neck' as const, at: [0, pr.neck * 0.9, 0] as V3, n: [0, 1, 0] as V3, part: 'head' as const, r: 0.034 * L }
    }
  }

  private addWounds(bones: RigBones) {
    const o = this.opts!
    const pr = this.pr
    if (o.dmg === 'beam') {
      this.ember.color.copy(EMBER_HOT)
      this.ember.visible = true
      this.U.uHole.value.set(0, this.holeY, 0, this.holeR)
      this.U.uHoleBone.value = SKIN_BONES.indexOf('chest')
      this.attach(bones, 'chest', beamTunnel(this.holeR, pr.chestD * 1.15, this.ember), [0, this.holeY, 0])
    } else if (o.dmg === 'pierce') {
      const r = pr.chestW * 0.16
      this.attach(bones, 'chest', stain(r), [0.01, this.holeY, pr.chestD * 0.5])
      const back = stain(r * 1.3)
      back.rotation.y = Math.PI
      this.attach(bones, 'chest', back, [-0.01, this.holeY, -pr.chestD * 0.5])
    } else if (o.dmg === 'slash' && o.sever) {
      for (const s of expandSevers(o.sever)) {
        const c = this.cut(s)
        this.attach(bones, c.body, stumpCap(c.r), c.at, c.n)
        this.attach(bones, c.part, stumpCap(c.r * 0.95), [0, 0, 0], s === 'head' ? [0, -1, 0] : [0, 1, 0])
      }
    }
  }

  private from(bone: XfBone, local: V3, dir: V3, dirSpace: 'bone' | 'world' = 'bone') {
    const rd = this.rd
    return (out: EmitAt) => {
      rd.point(bone, local, out.p)
      if (dirSpace === 'bone') rd.dir(bone, dir, out.d)
      else out.d.set(dir[0], dir[1], dir[2])
    }
  }

  private fromParticles(ids: number[], dir: V3) {
    const p = this.rd.p
    return (out: EmitAt, rand: () => number) => {
      out.p.copy(p[ids[Math.floor(rand() * ids.length) % ids.length]])
      out.p.x += (rand() - 0.5) * 0.05
      out.p.z += (rand() - 0.5) * 0.05
      out.d.set(dir[0], dir[1], dir[2])
    }
  }

  private plan(): Emitter[] {
    const o = this.opts!
    const pr = this.pr
    const dur = this.dur
    const R = RAG
    const face: V3 = [0, pr.headR * 0.65, pr.headR * 0.85]
    const blood = (e: Omit<Emitter, 'kind'>): Emitter => ({ kind: PK.Blood, ...e })
    switch (o.dmg) {
      case 'none':
        return []
      case 'blunt': {
        const mouth = this.from('head', face, [0, 0.35, 1])
        return [
          blood({ t0: 0, t1: 0.13, rate: o.zone === 'low' ? 90 : 320, speed: [0.6, 1.7], spread: 0.5, size: [0.007, 0.014], at: mouth }),
          blood({ t0: 0.45, t1: dur, rate: 24, speed: [0.02, 0.12], spread: 0.35, size: [0.006, 0.01], at: this.from('head', face, [0, -0.6, 1]) }),
        ]
      }
      case 'slash': {
        const cuts = expandSevers(o.sever)
        if (!cuts.length) return []
        const rateMul = cuts.length > 1 ? 0.55 : 1
        return cuts.flatMap((s) => {
          const c = this.cut(s)
          const stump = this.from(c.body, c.at, c.n)
          const part = this.from(c.part, [0, 0, 0], s === 'head' ? [0, -1, 0] : [0, 1, 0])
          return [
            blood({ t0: 0, t1: 0.1, rate: 520 * rateMul, speed: [0.5, 1.9], spread: 0.6, size: [0.008, 0.015], at: stump }),
            blood({ t0: 0, t1: 1.9, rate: 150 * rateMul, pulse: 2.2, speed: [0.7, 1.7], spread: 0.28, size: [0.008, 0.015], at: stump }),
            blood({ t0: 1.9, t1: dur, rate: 28 * rateMul, speed: [0.05, 0.2], spread: 0.4, size: [0.006, 0.011], at: stump }),
            blood({ t0: 0, t1: 1.3, rate: 60 * rateMul, fade: true, speed: [0.1, 0.5], spread: 0.5, size: [0.006, 0.012], at: part }),
          ]
        })
      }
      case 'pierce': {
        const front = this.from('chest', [0, this.holeY, pr.chestD * 0.5], [0, 0.1, 1])
        const back = this.from('chest', [0, this.holeY, -pr.chestD * 0.5], [0, 0.1, -1])
        return [
          blood({ t0: 0, t1: 0.09, rate: 480, speed: [0.8, 2.2], spread: 0.45, size: [0.008, 0.015], at: back }),
          blood({ t0: 0, t1: 1.5, rate: 110, pulse: 1.8, speed: [0.35, 1.1], spread: 0.3, size: [0.007, 0.013], at: front }),
          blood({ t0: 0, t1: 1.5, rate: 80, pulse: 1.8, speed: [0.3, 0.9], spread: 0.3, size: [0.007, 0.013], at: back }),
          blood({ t0: 0.4, t1: dur, rate: 22, speed: [0.03, 0.15], spread: 0.4, size: [0.006, 0.011], at: this.from('head', face, [0, -0.6, 1]) }),
        ]
      }
      case 'beam': {
        const front = this.from('chest', [0, this.holeY, pr.chestD * 0.55], [0, 0, 1])
        const back = this.from('chest', [0, this.holeY, -pr.chestD * 0.55], [0, 0, -1])
        const frontUp = this.from('chest', [0, this.holeY, pr.chestD * 0.55], [0, 1, 0], 'world')
        const backUp = this.from('chest', [0, this.holeY, -pr.chestD * 0.55], [0, 1, 0], 'world')
        const smoke = (at: Emitter['at']): Emitter => ({ kind: PK.Smoke, t0: 0.05, t1: 1.7, rate: 16, fade: true, speed: [0.12, 0.3], spread: 0.35, size: [0.025, 0.045], at })
        return [
          { kind: PK.Spark, t0: 0, t1: 0.16, rate: 260, speed: [1.2, 2.8], spread: 0.5, size: [0.008, 0.014], at: back },
          smoke(frontUp),
          smoke(backUp),
          // Cauterised at first; the bleeding starts once the edges cool.
          blood({ t0: 0.75, t1: dur, rate: 36, speed: [0.02, 0.2], spread: 0.5, size: [0.006, 0.012], at: front }),
          blood({ t0: 0.75, t1: dur, rate: 36, speed: [0.02, 0.2], spread: 0.5, size: [0.006, 0.012], at: back }),
        ]
      }
      case 'burn': {
        const all = [R.PEL, R.CHEST, R.NECK, R.HEAD, R.LSH, R.RSH, R.LELB, R.RELB, R.LWR, R.RWR, R.LHIP, R.RHIP, R.LKNEE, R.RKNEE, R.LANK, R.RANK]
        const torso = [R.PEL, R.CHEST, R.NECK, R.HEAD, R.LSH, R.RSH]
        return [
          { kind: PK.Flame, t0: 0, t1: 2.1, rate: 230, fade: true, speed: [0.15, 0.5], spread: 0.4, size: [0.03, 0.065], at: this.fromParticles(all, [0, 1, 0]) },
          { kind: PK.Smoke, t0: 0.3, t1: dur, rate: 18, speed: [0.1, 0.25], spread: 0.3, size: [0.03, 0.05], at: this.fromParticles(torso, [0, 1, 0]) },
        ]
      }
      case 'shock': {
        const all = [R.CHEST, R.NECK, R.HEAD, R.LSH, R.RSH, R.LELB, R.RELB, R.LWR, R.RWR, R.LKNEE, R.RKNEE, R.LANK, R.RANK]
        return [
          { kind: PK.Spark, t0: 0, t1: 1.0, rate: 200, speed: [0.8, 2.2], spread: 1.2, size: [0.014, 0.026], at: this.fromParticles(all, [0, 0.4, 0]) },
          { kind: PK.Smoke, t0: 0.8, t1: dur, rate: 12, speed: [0.1, 0.22], spread: 0.3, size: [0.025, 0.04], at: this.fromParticles([R.CHEST, R.HEAD, R.PEL], [0, 1, 0]) },
        ]
      }
    }
  }

  private pools(): Pool[] {
    const o = this.opts!
    const p = this.rd.p
    const R = RAG
    const at = (i: number) => (out: THREE.Vector3) => out.copy(p[i])
    switch (o.dmg) {
      case 'blunt':
        return [{ t0: 0.7, grow: 1.6, maxR: o.zone === 'low' ? 0.07 : 0.11, at: at(R.HEAD) }]
      case 'slash': {
        const cuts = expandSevers(o.sever)
        if (!cuts.length) return []
        const poolFor = (s: Sever): Pool[] => {
          const body = s === 'head' ? R.NECK : s === 'lArm' ? R.LSH : s === 'rArm' ? R.RSH : s === 'lLeg' ? R.LHIP : R.RHIP
          const part = s === 'head' ? R.HEAD : s === 'lArm' ? R.LELB : s === 'rArm' ? R.RELB : s === 'lLeg' ? R.LKNEE : R.RKNEE
          const scale = cuts.length > 1 ? 0.7 : 1
          return [
            { t0: 0.35, grow: 1.8, maxR: 0.17 * scale, at: at(body) },
            { t0: 0.55, grow: 1.2, maxR: 0.07 * scale, at: at(part) },
          ]
        }
        return cuts.flatMap(poolFor)
      }
      case 'pierce':
        return [{ t0: 0.5, grow: 1.7, maxR: 0.15, at: at(R.CHEST) }]
      case 'beam':
        return [{ t0: 0.95, grow: 1.3, maxR: 0.14, at: at(R.CHEST) }]
      default:
        return []
    }
  }

  update(bones: RigBones, t: number, dt: number) {
    if (!this.active || !this.opts) return
    if (t < this.lastT - 1e-3) this.gore.begin(this.plan(), this.pools(), this.opts.seed)
    this.lastT = t
    this.rd.advance(t)
    this.rd.write(bones)

    const U = this.U
    U.uTime.value = t
    switch (this.opts.dmg) {
      case 'beam': {
        const e = Math.max(0, 1 - t / 1.1)
        U.uEmber.value = e
        this.ember.color.copy(EMBER_COLD).lerp(EMBER_HOT, e)
        break
      }
      case 'burn':
        U.uChar.value = smooth(t / 0.9) * 0.92
        U.uEmber.value = t < 1.2 ? 1 : Math.max(0, 1 - (t - 1.2) / 1.4)
        break
      case 'shock':
        U.uFlash.value = t < 0.9 ? (Math.floor(t * 26) % 2 ? 0.88 : 0.08) * (1 - t / 1.3) : 0
        U.uChar.value = smooth((t - 0.2) / 0.9) * 0.45
        U.uEmber.value = t > 0.3 && t < 1.6 ? 0.4 * (1 - (t - 0.3) / 1.3) : 0
        break
    }

    const body = bones.body
    if (body && this.opts.style === 'dissolve') {
      body.visible = t < this.dur - 0.7 || Math.floor(t * 22) % 3 !== 0
    }
    this.gore.update(t, dt)
  }

  stop(bones: RigBones) {
    if (!this.active) return
    this.rd.stop()
    for (const { mesh, orig } of this.swapped) mesh.material = orig
    this.swapped = []
    for (const w of this.wounds) {
      w.parent?.remove(w)
      disposeTree(w)
    }
    this.wounds = []
    this.gore.clear()
    if (bones.body) bones.body.visible = true
    this.active = false
  }

  /** Body-space resting point of the corpse (between pelvis and chest). */
  corpse(out: THREE.Vector3): THREE.Vector3 {
    const p = this.rd.p
    return out.copy(p[RAG.PEL]).add(p[RAG.CHEST]).multiplyScalar(0.5)
  }

  bleeds(): boolean {
    const d = this.opts?.dmg
    return d === 'blunt' || d === 'slash' || d === 'pierce' || d === 'beam'
  }

  dispose() {
    this.frame.remove(this.gore.group)
    this.gore.dispose()
    for (const m of this.goreMats.values()) m.dispose()
    this.goreMats.clear()
    this.ember.dispose()
  }
}
