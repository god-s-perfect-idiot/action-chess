import type { AttackStyle, DeathStyle, HeroDesign } from '../../game/heroDesigns'
import { beat, IDLES, smooth, STANCE } from './idles'
import {
  arrayToPose,
  clonePose,
  lerpPose,
  P,
  POSE_SIZE,
  poseToArray,
  restPose,
  type PartialPose,
  type Pose,
} from './rig'

export { STANCE } from './idles'

const { sin, cos, abs, min, max, pow, round, PI } = Math
const TAU = PI * 2

const REST = restPose()

// ───────────────────────── Combat vocabulary ─────────────────────────

export type HitZone = 'high' | 'mid' | 'low'

/** How a lethal blow wrecks the body — drives ragdoll impulse and gore. */
export type DamageType = 'none' | 'blunt' | 'slash' | 'pierce' | 'beam' | 'burn' | 'shock'

export type Sever = 'lArm' | 'rArm' | 'lLeg' | 'rLeg' | 'head'
/** Single cut, or every limb + head for total dismemberment. */
export type SeverSpec = Sever | 'all'

export const ALL_SEVERS: Sever[] = ['lArm', 'rArm', 'lLeg', 'rLeg', 'head']

export function expandSevers(s: SeverSpec | null | undefined): Sever[] {
  if (!s) return []
  return s === 'all' ? ALL_SEVERS.slice() : [s]
}

// ───────────────────────── Clips ─────────────────────────

interface ClipKey {
  t: number
  pose: Pose
  /** Arrive at this key at full speed (strike contact) instead of easing in. */
  snap: boolean
}

export interface Clip {
  dur: number
  keys: ClipKey[]
  vals: Float32Array[]
  tans: Float32Array[]
}

type KeySpec = [number, PartialPose] | [number, PartialPose, 'snap']

/** Monotone cubic (Fritsch–Butland) tangents: smooth through keys, never overshoots holds. */
function finalize(keys: ClipKey[]): Clip {
  const n = keys.length
  const vals = keys.map((k) => poseToArray(k.pose))
  const tans = keys.map(() => new Float32Array(POSE_SIZE))
  for (let i = 1; i < n - 1; i++) {
    const h0 = keys[i].t - keys[i - 1].t
    const h1 = keys[i + 1].t - keys[i].t
    if (h0 < 1e-6 || h1 < 1e-6) continue
    const a = vals[i - 1]
    const b = vals[i]
    const c = vals[i + 1]
    const m = tans[i]
    for (let j = 0; j < POSE_SIZE; j++) {
      const d0 = (b[j] - a[j]) / h0
      const d1 = (c[j] - b[j]) / h1
      m[j] = d0 * d1 <= 0 ? 0 : (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1)
    }
  }
  return { dur: keys[n - 1].t, keys, vals, tans }
}

function clip(keys: KeySpec[], base: Pose = STANCE): Clip {
  return finalize(keys.map(([t, part, f]) => ({ t, pose: P(part, base), snap: f === 'snap' })))
}

const sampleBuf = new Float32Array(POSE_SIZE)

function sampleClip(c: Clip, t: number, out: Pose): Pose {
  const k = c.keys
  const n = k.length
  if (t <= k[0].t) return arrayToPose(c.vals[0], out)
  if (t >= k[n - 1].t) return arrayToPose(c.vals[n - 1], out)
  let i = 0
  while (i < n - 2 && t >= k[i + 1].t) i++
  const h = k[i + 1].t - k[i].t
  const s = h > 1e-6 ? (t - k[i].t) / h : 1
  const s2 = s * s
  const s3 = s2 * s
  const h00 = 2 * s3 - 3 * s2 + 1
  const h10 = s3 - 2 * s2 + s
  const h01 = -2 * s3 + 3 * s2
  const h11 = s3 - s2
  const a = c.vals[i]
  const b = c.vals[i + 1]
  const ma = c.tans[i]
  const mb = c.tans[i + 1]
  if (k[i + 1].snap) {
    // Ease out of the wind-up, arrive at 1.5× average speed: reads as a hit, stays monotone.
    for (let j = 0; j < POSE_SIZE; j++) {
      const d = b[j] - a[j]
      sampleBuf[j] = a[j] + d * (h01 + 1.5 * h11)
    }
  } else {
    for (let j = 0; j < POSE_SIZE; j++) {
      sampleBuf[j] = h00 * a[j] + h10 * h * ma[j] + h01 * b[j] + h11 * h * mb[j]
    }
  }
  return arrayToPose(sampleBuf, out)
}

// ───────────────────────── Locomotion ─────────────────────────

export type MoveStyle = 'run' | 'dash' | 'walk' | 'leap' | 'sprint' | 'vector' | 'fly' | 'teleport'

interface Gait {
  /** Fraction of the cycle each foot is planted. < 0.5 gives a flight phase. */
  duty: number
  lift: number
  /** <1 pulls the swing apex earlier (heel kicks up behind before the knee drives). */
  peak: number
  hipBase: number
  bob: number
  /** +1: pelvis highest at mid-stance (walk); -1: lowest (run compression). */
  bobSign: 1 | -1
  lean: number
  pitch: number
  yaw: number
  roll: number
  sway: number
  arm: number
  armBase: number
  armOut: number
  elbow: number
  elbowSwing: number
  head: number
  width: number
  toeOff: number
  heel: number
  /** Foot plants this far ahead of the hip. */
  reach: number
}

const GAITS: Record<Exclude<MoveStyle, 'leap' | 'vector' | 'fly' | 'teleport'>, Gait> = {
  walk: {
    duty: 0.62,
    lift: 0.05,
    peak: 0.85,
    hipBase: -0.014,
    bob: 0.011,
    bobSign: 1,
    lean: 0.04,
    pitch: 0.02,
    yaw: 0.13,
    roll: 0.05,
    sway: 0.012,
    arm: 0.36,
    armBase: 0.03,
    armOut: 0.1,
    elbow: -0.32,
    elbowSwing: 0.22,
    head: 0.02,
    width: -0.006,
    toeOff: 0.5,
    heel: -0.32,
    reach: 0.0,
  },
  run: {
    duty: 0.4,
    lift: 0.16,
    peak: 0.62,
    hipBase: -0.045,
    bob: 0.022,
    bobSign: -1,
    lean: 0.2,
    pitch: 0.08,
    yaw: 0.2,
    roll: 0.06,
    sway: 0.008,
    arm: 0.85,
    armBase: -0.12,
    armOut: 0.14,
    elbow: -1.55,
    elbowSwing: 0.32,
    head: -0.14,
    width: -0.014,
    toeOff: 0.75,
    heel: -0.12,
    reach: 0.02,
  },
  sprint: {
    duty: 0.34,
    lift: 0.21,
    peak: 0.55,
    hipBase: -0.05,
    bob: 0.026,
    bobSign: -1,
    lean: 0.3,
    pitch: 0.12,
    yaw: 0.22,
    roll: 0.05,
    sway: 0.006,
    arm: 1.05,
    armBase: -0.18,
    armOut: 0.12,
    elbow: -1.5,
    elbowSwing: 0.42,
    head: -0.2,
    width: -0.016,
    toeOff: 0.9,
    heel: 0,
    reach: 0.03,
  },
  dash: {
    duty: 0.32,
    lift: 0.17,
    peak: 0.55,
    hipBase: -0.08,
    bob: 0.02,
    bobSign: -1,
    lean: 0.42,
    pitch: 0.25,
    yaw: 0.12,
    roll: 0.03,
    sway: 0.004,
    arm: 0.1,
    armBase: 1.15,
    armOut: 0.3,
    elbow: -0.15,
    elbowSwing: 0.05,
    head: -0.55,
    width: -0.01,
    toeOff: 0.8,
    heel: 0,
    reach: 0.04,
  },
}

/** Foot target + toe angle for one leg at cycle phase `u` (0 = heel strike). */
function legAt(u: number, g: Gait, L: number, out: [number, number, number, number]) {
  const D = g.duty
  let z: number
  let y: number
  let toe: number
  if (u < D) {
    const s = u / D
    z = L / 2 - s * L
    toe = g.heel * (1 - smooth(s / 0.22)) + g.toeOff * smooth((s - 0.62) / 0.38)
    // Heel peels off the ground as the toe pushes.
    y = max(0, toe) * 0.05
  } else {
    const s = (u - D) / (1 - D)
    z = -L / 2 + L * smooth(pow(s, 1.15))
    y = g.lift * sin(PI * pow(s, g.peak)) + g.toeOff * 0.05 * (1 - smooth(s / 0.3))
    toe = g.toeOff * (1 - smooth(s / 0.4)) - 0.25 * sin(PI * s) + g.heel * smooth((s - 0.7) / 0.3)
  }
  out[0] = g.width
  out[1] = y
  out[2] = z + g.reach
  out[3] = toe
}

const legL: [number, number, number, number] = [0, 0, 0, 0]
const legR: [number, number, number, number] = [0, 0, 0, 0]

/** Accelerator — shove the air, then ride the redirected kick. No leg cycle. */
function vectorPose(p: number, t: number): Pose {
  const plant = 1 - smooth(min(1, max(0, p) / 0.12))
  const settle = smooth(max(0, (p - 0.86) / 0.14))
  const flight = (1 - plant) * (1 - settle)
  const pulse = 0.55 + 0.45 * sin(t * 22)
  const hover = 0.015 * plant + (0.075 + 0.018 * pulse) * flight + 0.01 * settle
  const push = 0.45 * plant + (1.05 + 0.14 * pulse) * flight + 0.25 * settle
  return P({
    root: [sin(t * 16) * 0.01 * flight, hover, 0],
    hipY: -0.16 * plant - 0.05 * settle,
    hips: [0.4 * plant + 0.1 * flight, 0, 0],
    spine: [0.5 * plant + (-0.14 + 0.05 * pulse) * flight + 0.18 * settle, 0, 0],
    chest: [0.14 * plant - 0.06 * flight, 0, 0],
    head: [-0.28 * plant - 0.18 * flight, sin(t * 11) * 0.04 * flight, 0],
    // Arms locked back — palms shove air the other way.
    lArm: [0.15 + push * 0.8, 0.12 + push * 0.12, 0.5 + push * 0.6],
    rArm: [0.15 + push * 0.8, -(0.12 + push * 0.12), 0.5 + push * 0.6],
    lElbow: [-0.08 - 0.06 * pulse * flight, 0, 0],
    rElbow: [-0.08 - 0.06 * pulse * flight, 0, 0],
    lHand: [0.25 + 0.45 * push, 0, 0.2],
    rHand: [0.25 + 0.45 * push, 0, -0.2],
    // Legs trailing stiff — he's not running.
    lFoot: [0.02, 0.05 * plant + 0.11 * flight, 0.05 - 0.03 * flight],
    rFoot: [0.03, 0.04 * plant + 0.09 * flight, -0.04 - 0.03 * flight],
    lToe: 0.2 + 0.5 * flight,
    rToe: 0.15 + 0.45 * flight,
  })
}

/** Gilgamesh — arms crossed, regal glide; world Y carries altitude. */
function flyPose(p: number, t: number): Pose {
  const plant = 1 - smooth(min(1, max(0, p) / 0.1))
  const settle = smooth(max(0, (p - 0.88) / 0.12))
  const flight = (1 - plant) * (1 - settle)
  const bob = sin(t * 3.2) * 0.015 * flight
  return P({
    root: [0, 0.04 * plant + bob + 0.06 * settle, 0],
    hipY: -0.04 * plant,
    hips: [0.08 * plant, -0.1 * flight, 0.04],
    spine: [0.15 * plant + (-0.06 + bob * 0.4) * flight, 0.12 * flight, 0],
    chest: [-0.04 * flight, 0.06 * flight, 0],
    head: [-0.1 * flight, 0.15 * flight, 0],
    lArm: [-0.55, -1.3, 0.35],
    lElbow: [-1.95, 0, 0],
    rArm: [-0.42, -1.3, 0.35],
    rElbow: [-1.95, 0, 0],
    lFoot: [0.02, 0.04 * plant + 0.08 * flight, 0.04 - 0.02 * flight],
    rFoot: [0.03, 0.04 * plant + 0.09 * flight, -0.04 - 0.02 * flight],
    lToe: 0.25 + 0.4 * flight,
    rToe: 0.2 + 0.45 * flight,
  })
}

/** Caped Baldy Serious Mode — crouch, vanish, rematerialize mid-stride. */
function teleportPose(p: number, _t: number): Pose {
  const vanish = smooth(min(1, max(0, (p - 0.12) / 0.12)))
  const appear = smooth(min(1, max(0, (p - 0.72) / 0.14)))
  const gone = vanish * (1 - appear)
  const plant = 1 - vanish
  const land = appear
  return P({
    vis: 1 - gone,
    root: [0, 0.02 * plant + 0.04 * land, 0],
    hipY: -0.14 * plant - 0.1 * land,
    hips: [0.08 * plant, 0.15 * land, 0],
    spine: [0.35 * plant + 0.12 * land, 0, 0],
    chest: [0.1 * plant, 0, 0],
    head: [-0.15 * plant + 0.05 * land, 0, 0],
    // Fists ready — not a run cycle.
    lArm: [-0.85 - 0.2 * plant, -0.15, 0.55],
    rArm: [-0.85 - 0.2 * plant, 0.15, 0.55],
    lElbow: [-1.55, 0, 0],
    rElbow: [-1.55, 0, 0],
    lHand: [0.35, 0, 0],
    rHand: [0.35, 0, 0],
    lFoot: [0.05, 0.02 * plant, 0.1 * plant + 0.08 * land],
    rFoot: [0.06, 0.02 * plant, -0.08 * plant - 0.06 * land],
    blink: gone > 0.5 ? 1 : 0,
  })
}

function gaitPose(cycle: number, style: Exclude<MoveStyle, 'leap' | 'vector' | 'fly' | 'teleport'>, stride: number): Pose {
  const g = GAITS[style]
  const u = cycle - Math.floor(cycle)
  const L = stride * g.duty
  legAt(u, g, L, legL)
  legAt((u + 0.5) % 1, g, L, legR)
  const ph = u * TAU
  // Extreme of vertical motion sits at each mid-stance: twice per cycle.
  const mid = ph - PI * g.duty
  const bob2 = cos(2 * mid)
  const side = cos(mid)
  const twist = cos(ph)
  const armPh = cos(ph - 0.35)
  const hipYaw = -g.yaw * twist
  const spineYaw = g.yaw * 0.6 * twist
  const chestYaw = g.yaw * 0.55 * twist
  return P({
    root: [g.sway * side, 0, 0],
    hipY: g.hipBase + g.bobSign * g.bob * bob2,
    hips: [g.pitch, hipYaw, g.roll * side],
    spine: [g.lean + 0.03 * bob2 * -g.bobSign, spineYaw, -g.roll * 0.6 * side],
    chest: [0.02 * bob2, chestYaw, -g.roll * 0.3 * side],
    neck: [0, 0, 0],
    head: [g.head + 0.03 * g.bobSign * bob2, -(hipYaw + spineYaw + chestYaw) * 0.9, g.roll * 0.4 * side],
    lFoot: [legL[0], legL[1], legL[2]],
    rFoot: [legR[0], legR[1], legR[2]],
    lToe: legL[3],
    rToe: legR[3],
    lArm: [g.armBase + g.arm * armPh, 0, g.armOut + 0.04 * max(0, -armPh)],
    rArm: [g.armBase - g.arm * armPh, 0, g.armOut + 0.04 * max(0, armPh)],
    lElbow: [g.elbow + g.elbowSwing * armPh, 0, 0],
    rElbow: [g.elbow - g.elbowSwing * armPh, 0, 0],
    lHand: [0.15 + 0.1 * armPh, 0, 0],
    rHand: [0.15 - 0.1 * armPh, 0, 0],
  })
}

const LEAP = clip(
  [
    [0, { hipY: -0.2, hips: [0.3, 0, 0], spine: [0.4, 0, 0], head: [-0.3, 0, 0], lFoot: [0.03, 0, 0.06], rFoot: [0.03, 0, -0.06], lArm: [0.8, 0, 0.3], rArm: [0.8, 0, 0.3], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0] }],
    [0.14, { hipY: 0.02, hips: [0.05, 0, 0], spine: [0.05, 0, 0], head: [-0.1, 0, 0], lFoot: [0, 0.06, 0.12], rFoot: [0, 0.1, -0.2], lToe: 0.6, rToe: 0.9, lArm: [-2.3, 0, 0.4], rArm: [-2.3, 0, 0.4], lElbow: [-0.5, 0, 0], rElbow: [-0.5, 0, 0] }],
    [0.45, { hipY: 0, hips: [-0.2, 0, 0], spine: [0.25, 0, 0], head: [-0.15, 0, 0], lFoot: [0, 0.3, 0.12], rFoot: [0, 0.22, -0.02], lToe: 0.5, rToe: 0.5, lArm: [-1.2, 0, 0.9], rArm: [-1.2, 0, 0.9], lElbow: [-0.8, 0, 0], rElbow: [-0.8, 0, 0] }],
    [0.78, { hipY: 0, hips: [0.05, 0, 0], spine: [0.1, 0, 0], lFoot: [0, 0.08, 0.1], rFoot: [0, 0.06, -0.02], lToe: 0.3, rToe: 0.3, lArm: [-1.0, 0, 0.8], rArm: [-1.0, 0, 0.8], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0] }],
    [0.88, { hipY: -0.2, hips: [0.3, 0, 0], spine: [0.45, 0, 0], head: [-0.3, 0, 0], lFoot: [0.03, 0, 0.08], rFoot: [0.03, 0, -0.06], lArm: [-0.7, 0, 0.6], rArm: [-0.7, 0, 0.6], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0] }],
    [1.0, { hipY: -0.08, hips: [0.1, 0, 0], spine: [0.15, 0, 0], lFoot: [0.03, 0, 0.06], rFoot: [0.03, 0, -0.04], lArm: [-0.4, 0, 0.4], rArm: [-0.4, 0, 0.4], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0] }],
  ],
  REST,
)

/** Lemillion travel — drop into the pad, blink across, rise out of the target. */
const PHASE_LEAP = clip(
  [
    [0, { hipY: -0.18, spine: [0.35, 0, 0], lArm: [0.55, 0, 0.4], rArm: [0.55, 0, 0.4], lElbow: [-0.4, 0, 0], rElbow: [-0.4, 0, 0] }],
    // Crouch and sink through the floor.
    [0.14, { hipY: -0.32, root: [0, -0.18, 0.02], spine: [0.55, 0, 0], hips: [0.2, 0, 0], lArm: [0.9, 0, 0.45], rArm: [0.9, 0, 0.45], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] }],
    [0.28, { vis: 0, hipY: -0.4, root: [0, -0.55, 0.02], spine: [0.6, 0, 0] }],
    // Hold invisible until the world snap; stay underground.
    [0.5, { vis: 0, root: [0, -0.55, 0], hipY: -0.35 }],
    // Rise out of the destination pad.
    [0.62, { vis: 1, root: [0, -0.28, 0], hipY: -0.22, hips: [0.15, 0.2, 0], spine: [0.35, -0.15, 0], lFoot: [0.04, 0.08, 0.1], rFoot: [0.05, 0.08, -0.08], lArm: [0.4, 0, 0.5], rArm: [0.4, 0, 0.5], head: [-0.1, 0, 0] }],
    [0.78, { root: [0, 0.04, 0], hipY: -0.1, hips: [0, 0.25, 0], spine: [0.15, -0.2, 0], lFoot: [0.04, 0.02, 0.12], rFoot: [0.05, 0.02, -0.08], rArm: [-1.35, 0, 0.1], rElbow: [-0.2, 0, 0], lArm: [0.3, 0, 0.55], lElbow: [-1.2, 0, 0], head: [0.05, -0.15, 0] }],
    [1.0, { hipY: -0.08, spine: [0.12, 0, 0], lFoot: [0.03, 0, 0.08], rFoot: [0.04, 0, -0.06], lArm: [-0.45, 0, 0.5], rArm: [-0.45, 0, 0.5], lElbow: [-1.2, 0, 0], rElbow: [-1.2, 0, 0] }],
  ],
  REST,
)

/** Finral travel — cast a big gate, walk into it, walk out of the exit. */
const PORTAL_LEAP = clip(
  [
    [0, { hipY: -0.1, spine: [0.15, -0.12, 0], rArm: [-0.45, 0.12, 0.48], rElbow: [-1.4, 0, 0], lArm: [-0.5, 0, 0.42], lElbow: [-1.5, 0, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.05, 0, -0.06], prop: 0 }],
    // Cast the entry portal.
    [0.1, { hipY: -0.1, spine: [0.1, -0.35, 0], chest: [0, -0.15, 0], rArm: [-1.45, 0.15, 0.1], rElbow: [-0.08, 0, 0], rHand: [-0.65, 0, 0.2], lArm: [0.2, 0, 0.5], head: [0.05, -0.25, 0], prop: 1 }],
    // Walk-in step 1 — left foot leads toward the gate.
    [0.2, { hipY: -0.06, root: [0.01, 0, 0.12], hips: [0.04, -0.12, 0.04], spine: [0.08, -0.1, 0], chest: [0, -0.05, 0], head: [0.02, -0.08, 0], lFoot: [0.03, 0.02, 0.18], rFoot: [0.05, 0, -0.1], lToe: 0.15, rToe: 0.35, lArm: [0.25, 0, 0.18], lElbow: [-0.4, 0, 0], rArm: [-0.15, 0, 0.18], rElbow: [-0.45, 0, 0], prop: 1 }],
    // Walk-in step 2 — right foot through the threshold.
    [0.32, { hipY: -0.05, root: [-0.01, 0.01, 0.28], hips: [0.03, 0.12, -0.04], spine: [0.1, 0.05, 0], head: [0.02, 0.05, 0], lFoot: [0.04, 0, -0.06], rFoot: [0.04, 0.025, 0.2], lToe: 0.4, rToe: 0.1, lArm: [-0.2, 0, 0.16], lElbow: [-0.45, 0, 0], rArm: [0.28, 0, 0.16], rElbow: [-0.35, 0, 0], prop: 1 }],
    // Disappear mid-stride inside the gate.
    [0.4, { vis: 0, hipY: -0.04, root: [0, 0.01, 0.38], hips: [0.02, -0.08, 0], spine: [0.08, 0, 0], lFoot: [0.03, 0.02, 0.14], rFoot: [0.04, 0, -0.04], lArm: [0.15, 0, 0.14], rArm: [-0.1, 0, 0.14], prop: 1 }],
    // World snap; emerge behind the exit gate.
    [0.5, { vis: 0, root: [0, 0.01, -0.38], hipY: -0.04, prop: 1 }],
    // Walk-out step 1 — left foot out of the exit.
    [0.58, { vis: 1, hipY: -0.05, root: [0.01, 0.01, -0.26], hips: [0.04, -0.12, 0.04], spine: [0.08, -0.05, 0], head: [0.02, -0.05, 0], lFoot: [0.03, 0.02, 0.16], rFoot: [0.05, 0, -0.1], lToe: 0.12, rToe: 0.35, lArm: [0.22, 0, 0.16], lElbow: [-0.4, 0, 0], rArm: [-0.12, 0, 0.16], rElbow: [-0.45, 0, 0], prop: 1 }],
    // Walk-out step 2 — right foot clears the gate.
    [0.72, { hipY: -0.06, root: [-0.01, 0, -0.08], hips: [0.03, 0.1, -0.03], spine: [0.08, 0.04, 0], lFoot: [0.04, 0, -0.05], rFoot: [0.04, 0.02, 0.14], lToe: 0.35, rToe: 0.1, lArm: [-0.15, 0, 0.15], lElbow: [-0.4, 0, 0], rArm: [0.22, 0, 0.15], rElbow: [-0.35, 0, 0], prop: 0.7 }],
    // Settle past the portal as it closes.
    [0.88, { hipY: -0.08, root: [0, 0, 0.04], hips: [0.02, 0.04, 0], spine: [0.1, -0.08, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.05, 0, -0.06], lArm: [-0.4, 0, 0.4], lElbow: [-1.3, 0, 0], rArm: [-0.4, 0, 0.4], rElbow: [-1.3, 0, 0], prop: 0.25 }],
    [1.0, { hipY: -0.1, spine: [0.1, 0, 0], lFoot: [0.03, 0, 0.08], rFoot: [0.04, 0, -0.06], lArm: [-0.5, 0, 0.45], rArm: [-0.5, 0, 0.45], lElbow: [-1.4, 0, 0], rElbow: [-1.4, 0, 0], prop: 0 }],
  ],
  REST,
)

/** Minato travel — hurl a marked kunai, stay put until it lands, then flash onto the mark. */
const KUNAI_LEAP = clip(
  [
    // Planted wind-up — kunai cocked behind the ear.
    [0, { hipY: -0.18, hips: [0.22, -0.2, 0], spine: [0.28, -0.2, 0], rArm: [-0.45, 0.45, 0.5], rElbow: [-1.55, 0, 0], lArm: [-0.65, 0, 0.4], lElbow: [-1.2, 0, 0], head: [0.05, -0.25, 0] }],
    // Flash-release — arm snaps forward; body stays on the departure pad.
    [0.12, { hipY: -0.12, hips: [0.1, -0.1, 0], spine: [0.12, -0.45, 0], chest: [0, -0.15, 0], rArm: [-1.58, 0.08, 0], rElbow: [0, 0, 0], rHand: [-0.5, 0, 0.35], lArm: [0.32, 0, 0.55], head: [0.05, -0.35, 0] }, 'snap'],
    // Hold the throw pose while the marked kunai flies — do NOT teleport yet.
    [0.28, { hipY: -0.1, spine: [0.08, -0.3, 0], rArm: [-1.4, 0.05, 0.1], rElbow: [-0.2, 0, 0], lArm: [0.28, 0, 0.5], head: [0.02, -0.2, 0] }],
    [0.5, { hipY: -0.1, spine: [0.1, -0.22, 0], rArm: [-1.25, 0.08, 0.18], rElbow: [-0.35, 0, 0], lArm: [-0.4, 0, 0.45], lElbow: [-1.1, 0, 0], head: [0, -0.15, 0] }],
    // Kunai lands (MINATO_SNAP ~0.62) — blink off the pad.
    [0.6, { hipY: -0.08, spine: [0.08, -0.18, 0], rArm: [-1.15, 0.05, 0.2], rElbow: [-0.4, 0, 0] }],
    [0.62, { vis: 0, root: [0, 0.02, 0], hipY: -0.04 }],
    // Rematerialize on the mark with the yellow afterimage flash.
    [0.66, { vis: 1, root: [0, 0, 0], hipY: -0.16, hips: [0.18, 0.35, 0], spine: [0.22, -0.3, 0], lFoot: [0.05, 0.02, 0.12], rFoot: [0.06, 0.02, -0.1], rArm: [-1.3, 0, 0.18], rElbow: [-0.25, 0, 0], lArm: [0.28, 0, 0.5], lElbow: [-1.25, 0, 0], head: [-0.15, -0.12, 0] }, 'snap'],
    [0.82, { hipY: -0.18, hips: [0.25, 0.12, 0], spine: [0.28, -0.08, 0], lFoot: [0.05, 0, 0.1], rFoot: [0.05, 0, -0.08], rArm: [-1.0, 0, 0.28], rElbow: [-0.45, 0, 0], lArm: [-0.85, 0, 0.35], lElbow: [-0.55, 0, 0] }],
    [1.0, { hipY: -0.16, hips: [0.22, 0, 0], spine: [0.25, 0, 0], lFoot: [0.05, 0, 0.08], rFoot: [0.05, 0, -0.06], lArm: [-0.95, 0, 0.32], rArm: [0.45, 0, 0.35], lElbow: [-0.45, 0, 0], rElbow: [-0.55, 0, 0] }],
  ],
  REST,
)

/** Todo travel — wind-up clap, swap flash, rematerialize on the target. */
const CLAP_LEAP = clip(
  [
    [0, { hipY: -0.1, spine: [0.12, 0, 0], lArm: [-0.5, -1.1, 0.4], rArm: [-0.42, -1.1, 0.4], lElbow: [-1.9, 0, 0], rElbow: [-1.9, 0, 0] }],
    // Arms open for the clap.
    [0.12, { hipY: -0.12, spine: [0.15, 0, 0], chest: [0.1, 0, 0], lArm: [-0.95, -0.9, 0.5], rArm: [-0.95, 0.9, 0.5], lElbow: [-1.55, 0, 0], rElbow: [-1.55, 0, 0], head: [-0.1, 0, 0] }],
    // Clap!
    [0.22, { hipY: -0.14, spine: [0.28, 0, 0], chest: [0.14, 0, 0], lArm: [-0.72, -0.08, 0.28], rArm: [-0.72, 0.08, 0.28], lElbow: [-1.95, 0, 0], rElbow: [-1.95, 0, 0], lHand: [0.55, 0, 0], rHand: [0.55, 0, 0] }],
    [0.28, { vis: 0, root: [0, 0.02, 0], hipY: -0.08 }],
    [0.5, { vis: 0, root: [0, 0, 0] }],
    // Appear on the target with a follow-through clap pose.
    [0.58, { vis: 1, root: [0, 0, 0], hipY: -0.12, hips: [0, 0.2, 0], spine: [0.2, -0.15, 0], chest: [0.1, 0, 0], lFoot: [0.05, 0.01, 0.1], rFoot: [0.06, 0.01, -0.08], lArm: [-0.7, -0.05, 0.3], rArm: [-0.7, 0.05, 0.3], lElbow: [-1.9, 0, 0], rElbow: [-1.9, 0, 0], lHand: [0.45, 0, 0], rHand: [0.45, 0, 0], head: [0.05, -0.1, 0] }],
    [0.78, { hipY: -0.12, hips: [0, 0.1, 0], spine: [0.12, -0.08, 0], lFoot: [0.05, 0, 0.08], rFoot: [0.06, 0, -0.06], lArm: [-0.55, -0.85, 0.4], rArm: [-0.45, -0.85, 0.4], lElbow: [-1.85, 0, 0], rElbow: [-1.85, 0, 0] }],
    [1.0, { hipY: -0.1, spine: [0.08, 0, 0], lFoot: [0.05, 0, 0.06], rFoot: [0.05, 0, -0.05], lArm: [-0.55, -1.15, 0.38], rArm: [-0.42, -1.15, 0.38], lElbow: [-1.95, 0, 0], rElbow: [-1.95, 0, 0] }],
  ],
  REST,
)

// ───────────────────────── Strike library ─────────────────────────

interface Move {
  dur: number
  contact: number
  zone: HitZone
  /** Net yaw the move leaves on the body (spins). */
  spin?: number
  /** Keys after t=0; the move starts and ends in the fighting stance. */
  keys: KeySpec[]
}

type MoveName =
  | 'jab'
  | 'cross'
  | 'hook'
  | 'uppercut'
  | 'frontKick'
  | 'roundhouse'
  | 'spinBackKick'
  | 'knee'
  | 'lowKick'

const MOVES: Record<MoveName, Move> = {
  jab: {
    dur: 0.28,
    contact: 0.1,
    zone: 'high',
    keys: [
      [0.04, { hipY: -0.06, hips: [0, -0.32, 0], chest: [0, 0.12, 0], lArm: [-0.95, 0, 0.28], lElbow: [-1.8, 0, 0] }],
      [0.1, { root: [0, 0, 0.09], hipY: -0.07, hips: [0.02, -0.45, 0], spine: [0.12, 0.02, 0], chest: [0, -0.12, 0], head: [0.05, 0.12, 0], lFoot: [0.03, 0, 0.18], rFoot: [0.05, 0, -0.06], lArm: [-1.55, 0.05, 0.1], lElbow: [-0.06, 0, 0], lHand: [0, 0, 0.2] }, 'snap'],
      [0.16, { root: [0, 0, 0.07], hipY: -0.07, hips: [0.02, -0.42, 0], spine: [0.1, 0.04, 0], chest: [0, -0.08, 0], lFoot: [0.03, 0, 0.17], lArm: [-1.3, 0, 0.2], lElbow: [-0.9, 0, 0] }],
      [0.28, {}],
    ],
  },
  cross: {
    dur: 0.32,
    contact: 0.13,
    zone: 'high',
    keys: [
      [0.05, { hipY: -0.07, hips: [0, -0.42, 0], chest: [0, 0, 0], rArm: [-0.2, 0, 0.45], rElbow: [-2.2, 0, 0], rFoot: [0.05, 0, -0.1] }],
      [0.13, { root: [0, 0, 0.11], hipY: -0.09, hips: [0.04, 0.3, 0], spine: [0.14, 0.1, 0], chest: [0, 0.06, 0], head: [0.06, -0.2, 0], lFoot: [0.03, 0, 0.17], rFoot: [0.05, 0.015, -0.05], rToe: 0.55, rArm: [-1.57, 0, 0.04], rElbow: [-0.04, 0, 0], rHand: [0, 0, 0.2], lArm: [-0.95, 0, 0.3], lElbow: [-2.0, 0, 0] }, 'snap'],
      [0.2, { root: [0, 0, 0.08], hipY: -0.08, hips: [0.02, 0.2, 0], spine: [0.12, 0.08, 0], lFoot: [0.03, 0, 0.15], rArm: [-1.3, 0, 0.2], rElbow: [-0.9, 0, 0], rToe: 0.3 }],
      [0.32, {}],
    ],
  },
  hook: {
    dur: 0.34,
    contact: 0.15,
    zone: 'high',
    keys: [
      [0.07, { hipY: -0.09, hips: [0, -0.55, 0], spine: [0.1, -0.1, 0], chest: [0, -0.15, 0], lArm: [-0.5, -0.3, 1.1], lElbow: [-1.6, 0, 0], lFoot: [0.03, 0, 0.13] }],
      [0.15, { root: [0, 0, 0.12], hipY: -0.09, hips: [0.02, 0.15, 0], spine: [0.16, 0.05, 0], chest: [0, 0.08, 0], head: [0.05, 0.15, 0.05], lFoot: [0.03, 0, 0.15], lToe: 0.35, lArm: [0, -1.25, 1.45], lElbow: [-1.45, 0, 0], lHand: [0, 0, 0], rArm: [-0.5, 0, 0.4], rElbow: [-2.2, 0, 0] }, 'snap'],
      [0.23, { root: [0, 0, 0.1], hipY: -0.08, hips: [0, 0.3, 0], spine: [0.14, 0.12, 0], chest: [0, 0.12, 0], lFoot: [0.03, 0, 0.14], lArm: [-0.3, -1.3, 1.2], lElbow: [-1.7, 0, 0] }],
      [0.34, {}],
    ],
  },
  uppercut: {
    dur: 0.36,
    contact: 0.16,
    zone: 'high',
    keys: [
      [0.08, { hipY: -0.14, hips: [0.12, -0.45, 0], spine: [0.28, -0.05, 0.08], chest: [0, 0, 0], head: [-0.1, 0, 0], rArm: [0.05, 0, 0.35], rElbow: [-1.75, 0, 0], rFoot: [0.05, 0, -0.1] }],
      [0.16, { root: [0, 0.02, 0.1], hipY: -0.02, hips: [0, 0.3, 0], spine: [-0.08, 0.15, -0.04], chest: [-0.1, 0.1, 0], head: [-0.2, -0.1, 0], lFoot: [0.03, 0, 0.14], rFoot: [0.05, 0.03, -0.05], rToe: 0.7, rArm: [-1.05, 0, 0.1], rElbow: [-1.9, 0, 0], rHand: [-0.3, 0, 0], lArm: [-0.9, 0, 0.35], lElbow: [-2.0, 0, 0] }, 'snap'],
      [0.24, { root: [0, 0.01, 0.08], hipY: -0.04, hips: [0, 0.25, 0], spine: [-0.02, 0.12, 0], rArm: [-1.3, 0, 0.15], rElbow: [-1.6, 0, 0], rToe: 0.4, lFoot: [0.03, 0, 0.13] }],
      [0.36, {}],
    ],
  },
  frontKick: {
    dur: 0.44,
    contact: 0.2,
    zone: 'mid',
    keys: [
      [0.1, { hipY: -0.05, hips: [0.05, -0.15, 0], spine: [-0.05, 0.05, 0], lFoot: [0.03, 0, 0.06], rFoot: [0.02, 0.3, 0.1], rToe: 0.2 }],
      [0.2, { root: [0, 0, 0.05], hipY: -0.03, hips: [-0.18, -0.05, 0], spine: [-0.18, 0.05, 0], chest: [-0.05, 0, 0], head: [0.22, 0, 0], lFoot: [0.03, 0, 0.03], lToe: 0.15, rFoot: [0, 0.33, 0.43], rToe: 1.1, lArm: [-0.55, 0, 0.5], lElbow: [-1.7, 0, 0], rArm: [0.25, 0, 0.45], rElbow: [-1.3, 0, 0] }, 'snap'],
      [0.3, { hipY: -0.05, hips: [0, -0.1, 0], spine: [-0.05, 0.05, 0], lFoot: [0.03, 0, 0.05], rFoot: [0.02, 0.25, 0.12], rToe: 0.3 }],
      [0.44, {}],
    ],
  },
  roundhouse: {
    dur: 0.56,
    contact: 0.27,
    zone: 'high',
    keys: [
      [0.1, { hipY: -0.08, hips: [0, 0.45, -0.1], spine: [0, -0.2, 0], lFoot: [0.03, 0, 0.08], lToe: 0.2, rFoot: [0.12, 0.22, -0.02], rToe: 0.4, rArm: [-0.1, 0, 0.6], rElbow: [-1.6, 0, 0] }],
      [0.27, { root: [0, 0, 0.02], hipY: -0.06, hips: [0, 1.25, -0.35], spine: [-0.05, -0.6, -0.1], chest: [0, -0.25, 0], head: [0.1, -0.45, 0.15], lFoot: [0.03, 0, 0.06], lToe: 0.35, rFoot: [-0.02, 0.7, 0.36], rToe: 1.1, lArm: [-0.9, 0, 0.45], lElbow: [-1.7, 0, 0], rArm: [0.55, 0, 0.85], rElbow: [-0.5, 0, 0] }, 'snap'],
      [0.4, { hipY: -0.08, hips: [0, 0.8, -0.15], spine: [0, -0.35, 0], chest: [0, -0.1, 0], lFoot: [0.03, 0, 0.07], rFoot: [0.12, 0.3, 0.02], rToe: 0.4, rArm: [0.2, 0, 0.6], rElbow: [-1.2, 0, 0] }],
      [0.56, {}],
    ],
  },
  spinBackKick: {
    dur: 0.64,
    contact: 0.32,
    zone: 'mid',
    spin: TAU,
    keys: [
      [0.12, { rootRot: [0, 1.3, 0], hipY: -0.09, spine: [0.1, 0, 0], head: [0, -0.9, 0], lFoot: [0.03, 0, 0.06], rFoot: [0.06, 0.04, -0.06], lArm: [-0.9, 0, 0.5], rArm: [-0.5, 0, 0.6] }],
      [0.26, { rootRot: [0, PI * 0.92, 0], hipY: -0.07, hips: [0.15, 0, 0], spine: [0.35, 0, 0], head: [-0.3, 0, 0], lFoot: [0.03, 0, 0.04], rFoot: [0.02, 0.28, -0.08], rToe: 0.2 }],
      [0.32, { rootRot: [0, PI, 0], root: [0, 0, 0.05], hipY: -0.05, hips: [0.35, 0, 0], spine: [0.45, 0, 0], chest: [0.1, 0, 0], head: [-0.6, 0, 0], lFoot: [0.03, 0, 0.03], lToe: 0.2, rFoot: [0, 0.4, -0.44], rToe: -0.3, lArm: [-0.4, 0, 0.7], lElbow: [-1.2, 0, 0], rArm: [-0.2, 0, 0.8], rElbow: [-1.0, 0, 0] }, 'snap'],
      [0.44, { rootRot: [0, PI * 1.35, 0], hipY: -0.07, hips: [0.1, 0, 0], spine: [0.2, 0, 0], rFoot: [0.03, 0.14, -0.12], rToe: 0.3 }],
      [0.64, { rootRot: [0, TAU, 0] }],
    ],
  },
  knee: {
    dur: 0.4,
    contact: 0.18,
    zone: 'mid',
    keys: [
      [0.08, { root: [0, 0, 0.1], hipY: -0.06, spine: [0.15, 0, 0], lArm: [-1.45, 0, 0.22], lElbow: [-0.5, 0, 0], rArm: [-1.45, 0, 0.22], rElbow: [-0.5, 0, 0], lFoot: [0.03, 0, 0.16] }],
      [0.18, { root: [0, 0.02, 0.15], hipY: -0.02, hips: [-0.15, 0.1, 0], spine: [0.32, 0, 0], chest: [0.1, 0, 0], head: [-0.15, 0, 0], lFoot: [0.03, 0, 0.08], lToe: 0.55, rFoot: [0, 0.34, 0.1], rToe: 1.0, lArm: [-1.1, 0, 0.25], lElbow: [-1.3, 0, 0], rArm: [-1.1, 0, 0.25], rElbow: [-1.3, 0, 0], lHand: [0.6, 0, 0], rHand: [0.6, 0, 0] }, 'snap'],
      [0.28, { root: [0, 0, 0.1], hipY: -0.05, spine: [0.2, 0, 0], rFoot: [0.03, 0.12, -0.02], lArm: [-1.2, 0, 0.25], lElbow: [-1.0, 0, 0], rArm: [-1.2, 0, 0.25], rElbow: [-1.0, 0, 0] }],
      [0.4, {}],
    ],
  },
  lowKick: {
    dur: 0.42,
    contact: 0.19,
    zone: 'low',
    keys: [
      [0.08, { hipY: -0.08, hips: [0, 0.3, 0], spine: [0.05, -0.1, 0], rFoot: [0.12, 0.08, -0.08], rToe: 0.3 }],
      [0.19, { hipY: -0.08, hips: [0, 0.95, -0.1], spine: [0.05, -0.5, 0], chest: [0, -0.2, 0], head: [0.05, -0.3, 0], lFoot: [0.03, 0, 0.08], lToe: 0.3, rFoot: [-0.02, 0.2, 0.38], rToe: 0.9, lArm: [-1.0, 0, 0.5], lElbow: [-1.8, 0, 0], rArm: [0.4, 0, 0.7], rElbow: [-0.8, 0, 0] }, 'snap'],
      [0.3, { hipY: -0.07, hips: [0, 0.5, 0], spine: [0.05, -0.25, 0], rFoot: [0.1, 0.06, -0.02] }],
      [0.42, {}],
    ],
  },
}

// ───────────────────────── Signature attacks ─────────────────────────

export type FxKind =
  | 'fire'
  | 'impact'
  | 'shockwave'
  | 'slash'
  | 'pierce'
  | 'beam'
  | 'darkBeam'
  | 'rings'
  | 'chain'
  | 'cards'
  | 'lightning'
  | 'voltBeam'
  | 'voltBarrage'
  | 'shards'
  | 'glitch'
  | 'sparkle'
  | 'gravity'
  | 'magnet'
  | 'speed'
  | 'phase'
  | 'portal'
  | 'kunai'
  | 'rasengan'
  | 'bullet'
  | 'feather'
  | 'ratioSlash'
  | 'sakura'
  | 'murasaki'
  | 'babylon'
  | 'inferno'
  | 'overhaul'
  | 'percentBlast'
  | 'chainsaw'
  | 'kagune'
  | 'yeoui'
  | 'wind'
  | 'whirlwind'
  | 'getsuga'
  | 'sand'

type SigHit = number | { t: number; zone?: HitZone; /** Keep the victim reaction until the next blow. */ hold?: boolean }

interface Sig {
  clip: Clip
  /** Seconds after start when the signature effect lands. */
  hit: number
  /** Extra contact beats inside the clip (multi-strike signatures); defaults to [hit]. */
  hits?: SigHit[]
  zone?: HitZone
  ranged: boolean
  release: number
  fx: FxKind
  /** Fast pre-hit projectile (local times within the signature clip). */
  throwFx?: { kind: FxKind; release: number; arrive: number }
}

const GUARD_L: PartialPose = { lArm: [-0.8, 0, 0.32], lElbow: [-1.9, 0, 0] }

const SIGS: Record<AttackStyle, Sig> = {
  flameKick: {
    hit: 0.3,
    zone: 'high',
    release: 0.3,
    ranged: false,
    fx: 'fire',
    clip: clip([
      [0, {}],
      [0.14, { hipY: -0.08, hips: [0, 0.4, 0], spine: [0.1, -0.3, 0], rFoot: [0.05, 0.2, 0.0], root: [0, 0, 0.08], rArm: [0.3, 0, 0.6], rElbow: [-1.0, 0, 0] }],
      [0.3, { hipY: -0.02, hips: [0, 1.05, 0.15], spine: [0, -0.45, -0.45], chest: [0, -0.3, 0], rFoot: [0.16, 0.5, 0.42], rToe: 0.6, root: [0, 0, 0.24], lArm: [-1.2, 0, 0.9], lElbow: [-1.2, 0, 0], rArm: [0.4, 0, 1.0], rElbow: [-0.4, 0, 0] }],
      [0.46, { hipY: -0.02, hips: [0, 1.15, 0.15], spine: [0, -0.5, -0.45], chest: [0, -0.3, 0], rFoot: [0.2, 0.46, 0.38], rToe: 0.6, root: [0, 0, 0.24], lArm: [-1.2, 0, 0.9], lElbow: [-1.2, 0, 0], rArm: [0.4, 0, 1.0], rElbow: [-0.4, 0, 0] }],
      [0.66, { hipY: -0.06, rFoot: [0.04, 0.12, -0.02], root: [0, 0, 0.12] }],
      [0.9, {}],
    ]),
  },
  magPull: {
    hit: 0.58,
    release: 0.12,
    ranged: false,
    fx: 'magnet',
    clip: clip([
      [0, {}],
      [0.15, { hipY: -0.06, spine: [0.15, 0, 0], lArm: [-1.5, 0, 0.15], lElbow: [-0.1, 0, 0], rArm: [-1.5, 0, 0.15], rElbow: [-0.1, 0, 0], lHand: [-1.2, 0, 0], rHand: [-1.2, 0, 0] }],
      [0.4, { hipY: -0.1, spine: [-0.15, 0, 0], root: [0, 0, -0.04], lArm: [-0.7, 0, 0.35], lElbow: [-2.2, 0, 0], rArm: [-0.7, 0, 0.35], rElbow: [-2.2, 0, 0] }],
      [0.58, { hipY: -0.05, hips: [0, 0.5, 0], spine: [0.2, -0.5, 0], root: [0, 0, 0.26], lFoot: [0.03, 0, 0.18], rArm: [-1.55, 0, 0.1], rElbow: [-0.05, 0, 0], rHand: [-0.2, 0, 0], ...GUARD_L }],
      [0.8, { hipY: -0.05, hips: [0, 0.5, 0], spine: [0.2, -0.5, 0], root: [0, 0, 0.22], lFoot: [0.03, 0, 0.18], rArm: [-1.5, 0, 0.1], rElbow: [-0.1, 0, 0] }],
      [1.0, {}],
    ]),
  },
  stomp: {
    hit: 0.5,
    release: 0.5,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.sumo(0))],
        [0.2, { hipY: -0.16, lFoot: [0.11, 0, 0], rFoot: [0.11, 0, 0], spine: [0.3, 0, 0], lArm: [0.4, 0, 0.6], rArm: [0.4, 0, 0.6] }],
        [0.36, { root: [0, 0.32, 0.18], hipY: 0.0, lFoot: [0.1, 0.12, 0.05], rFoot: [0.1, 0.16, 0.0], spine: [-0.15, 0, 0], lArm: [-2.6, 0, 0.7], rArm: [-2.6, 0, 0.7], lElbow: [-0.5, 0, 0], rElbow: [-0.5, 0, 0] }],
        [0.5, { root: [0, 0, 0.25], hipY: -0.2, lFoot: [0.12, 0, 0], rFoot: [0.12, 0, 0], spine: [0.4, 0, 0], lArm: [-0.4, 0, 1.2], rArm: [-0.4, 0, 1.2], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] }],
        [0.75, { root: [0, 0, 0.25], hipY: -0.18, lFoot: [0.12, 0, 0], rFoot: [0.12, 0, 0], spine: [0.35, 0, 0], lArm: [-0.5, 0, 1.1], rArm: [-0.5, 0, 1.1] }],
        [1.0, { root: [0, 0, 0.1], hipY: -0.08, lFoot: [0.1, 0, 0], rFoot: [0.1, 0, 0], spine: [0.3, 0, 0], lArm: [-0.7, 0, 0.42], rArm: [-0.7, 0, 0.42], lElbow: [-0.35, 0, 0], rElbow: [-0.35, 0, 0] }],
      ],
      REST,
    ),
  },
  thrust: {
    hit: 0.22,
    release: 0.2,
    ranged: false,
    fx: 'pierce',
    clip: clip([
      [0, { rArm: [-0.4, -0.3, 0.2], rElbow: [-2.4, 0, 0], rHand: [0, 0, 0] }],
      [0.14, { hipY: -0.08, root: [0, 0, -0.04], rArm: [0.2, -0.3, 0.25], rElbow: [-2.4, 0, 0], spine: [0, 0.3, 0] }],
      [0.22, { hipY: -0.12, root: [0, 0, 0.36], lFoot: [0.03, 0, 0.24], rFoot: [0.05, 0, -0.16], hips: [0, 0.4, 0], spine: [0.1, -0.4, 0], rArm: [-1.55, 0, 0.06], rElbow: [-0.02, 0, 0], rHand: [-1.5, 0, 0], lArm: [0.6, 0, 0.5], lElbow: [-0.3, 0, 0], blink: 0 }],
      [0.6, { hipY: -0.12, root: [0, 0, 0.36], lFoot: [0.03, 0, 0.24], rFoot: [0.05, 0, -0.16], hips: [0, 0.4, 0], spine: [0.1, -0.4, 0], rArm: [-1.55, 0, 0.06], rElbow: [-0.02, 0, 0], rHand: [-1.5, 0, 0], lArm: [0.6, 0, 0.5], lElbow: [-0.3, 0, 0], blink: 1 }],
      [0.95, P({}, IDLES.focused(0))],
    ]),
  },
  soundBlast: {
    hit: 0.72,
    release: 0.4,
    ranged: true,
    fx: 'rings',
    clip: clip([
      [0, {}],
      [0.25, { hipY: -0.06, spine: [-0.2, 0, 0], head: [-0.3, 0, 0], lArm: [-0.4, 0, 1.3], rArm: [-0.4, 0, 1.3], lElbow: [-1.2, 0, 0], rElbow: [-1.2, 0, 0], rFoot: [0.05, 0, -0.1] }],
      [0.4, { hipY: -0.08, spine: [0.25, 0, 0], head: [0.1, 0, 0], root: [0, 0, 0.06], lArm: [-1.5, 0, 0.2], rArm: [-1.5, 0, 0.2], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.3, 0, 0], rHand: [-1.3, 0, 0] }],
      [0.8, { hipY: -0.08, spine: [0.25, 0, 0], root: [0, 0, 0.06], lArm: [-1.5, 0, 0.2], rArm: [-1.5, 0, 0.2], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.3, 0, 0], rHand: [-1.3, 0, 0] }],
      [1.05, P({ hips: [0, 0, 0.12], lArm: [-2.7, 0, 0.4], lElbow: [-0.3, 0, 0], head: [0, 0, 0.2] }, REST)],
    ]),
  },
  shoulderCharge: {
    hit: 0.32,
    release: 0.32,
    ranged: false,
    fx: 'impact',
    clip: clip([
      [0, {}],
      [0.16, { hipY: -0.14, root: [0, 0, -0.06], hips: [0.2, 0.6, 0], spine: [0.4, 0.5, 0], lArm: [-0.2, -0.6, 0.15], lElbow: [-2.0, 0, 0], rFoot: [0.05, 0, -0.16] }],
      [0.32, { hipY: -0.1, root: [0, 0, 0.42], hips: [0.25, 0.9, 0], spine: [0.45, 0.6, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.05, 0.08, -0.2], lArm: [-0.2, -0.6, 0.25], lElbow: [-2.0, 0, 0], rArm: [0.5, 0, 0.5], rElbow: [-1.0, 0, 0] }],
      [0.55, { hipY: -0.08, root: [0, 0, 0.36], hips: [0.15, 0.6, 0], spine: [0.3, 0.4, 0] }],
      [0.85, {}],
    ]),
  },
  palmPush: {
    hit: 0.48,
    release: 0.48,
    ranged: false,
    fx: 'sparkle',
    clip: clip(
      [
        [0, {}],
        [0.12, { vis: 0, root: [0, 0.05, 0] }],
        [0.32, { vis: 0, root: [0, 0.05, 0.32] }],
        [0.36, { vis: 1, root: [0, 0, 0.32], hipY: -0.06, spine: [0.1, 0, 0], lArm: [-0.5, 0, 0.3], rArm: [-0.5, 0, 0.3], lElbow: [-1.8, 0, 0], rElbow: [-1.8, 0, 0] }],
        [0.48, { root: [0, 0, 0.4], hipY: -0.1, lFoot: [0.03, 0, 0.16], spine: [0.15, 0, 0], lArm: [-1.5, 0, 0.12], rArm: [-1.5, 0, 0.12], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.4, 0, 0], rHand: [-1.4, 0, 0] }],
        [0.75, { root: [0, 0, 0.36], hipY: -0.08, lFoot: [0.03, 0, 0.14], lArm: [-1.4, 0, 0.12], rArm: [-1.4, 0, 0.12], lHand: [-1.4, 0, 0], rHand: [-1.4, 0, 0] }],
        [1.0, P({}, IDLES.shy(0))],
      ],
      REST,
    ),
  },
  hookThrow: {
    hit: 0.62,
    release: 0.42,
    ranged: true,
    fx: 'chain',
    clip: clip([
      [0, {}],
      [0.15, { rArm: [-2.6, 0, 0.6], rElbow: [-0.8, 0, 0], spine: [-0.1, 0.4, 0] }],
      [0.3, { rArm: [-2.8, 0, -0.2], rElbow: [-0.4, 0, 0], spine: [-0.05, 0.5, 0] }],
      [0.42, { hipY: -0.08, root: [0, 0, 0.06], rArm: [-1.5, 0, 0.1], rElbow: [0, 0, 0], spine: [0.2, -0.3, 0], lFoot: [0.03, 0, 0.16] }],
      [0.66, { hipY: -0.06, rArm: [-1.45, 0, 0.1], rElbow: [-0.05, 0, 0], spine: [0.15, -0.3, 0], lFoot: [0.03, 0, 0.16] }],
      [0.85, { hipY: -0.1, root: [0, 0, -0.08], rArm: [-0.6, 0, 0.3], rElbow: [-2.0, 0, 0], spine: [-0.25, 0.3, 0], lFoot: [0.03, 0, 0.18] }],
      [1.1, {}],
    ]),
  },
  dashStrike: {
    hit: 0.34,
    release: 0.34,
    ranged: false,
    fx: 'speed',
    clip: clip([
      [0, {}],
      [0.1, { hipY: -0.14, spine: [0.4, 0, 0], lArm: [1.0, 0, 0.3], rArm: [1.0, 0, 0.3], lElbow: [-0.1, 0, 0], rElbow: [-0.1, 0, 0] }],
      [0.14, { vis: 0, root: [0, 0, 0.1] }],
      [0.3, { vis: 0, root: [0, 0, 0.42] }],
      [0.34, { vis: 1, root: [0, 0, 0.42], hipY: -0.12, hips: [0, 0.5, 0], spine: [0.2, -0.6, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.16], rArm: [-1.55, 0, 0.05], rElbow: [0, 0, 0], lArm: [0.4, 0, 0.6], lElbow: [-1.4, 0, 0] }],
      [0.6, { root: [0, 0, 0.42], hipY: -0.12, hips: [0, 0.5, 0], spine: [0.2, -0.6, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.16], rArm: [-1.5, 0, 0.05], rElbow: [-0.05, 0, 0], lArm: [0.4, 0, 0.6], lElbow: [-1.4, 0, 0] }],
      [0.85, {}],
    ]),
  },
  turboKick: {
    // Kept for roster compatibility — prefer turboPunch for engine H2H.
    hit: 0.4,
    release: 0.4,
    ranged: false,
    fx: 'speed',
    clip: clip([
      [0, {}],
      [0.12, { hipY: -0.2, spine: [0.45, 0, 0], lArm: [0.9, 0, 0.35], rArm: [0.9, 0, 0.35] }],
      [0.18, { vis: 0, root: [0, 0.05, 0.12] }],
      [0.34, { vis: 0, root: [0, 0.12, 0.4] }],
      [0.4, { vis: 1, root: [0, 0.08, 0.42], hipY: -0.04, hips: [0, 0.35, 0.2], spine: [0.05, -0.35, -0.35], rFoot: [0.14, 0.42, 0.45], rToe: 0.7, lArm: [-1.1, 0, 1.0], rArm: [0.3, 0, 1.05] }],
      [0.85, {}],
    ]),
  },
  turboPunch: {
    // Engine boost → dash in → cross → hook. Pure hand-to-hand with turbo.
    hit: 0.5,
    hits: [0.5, 0.62],
    zone: 'high',
    release: 0.5,
    ranged: false,
    fx: 'fire',
    clip: clip(
      [
        [0, P({}, IDLES.engineRev(0))],
        // Rev & crouch — engines spool.
        [0.1, { hipY: -0.18, spine: [0.35, 0, 0], chest: [0.08, 0, 0], lArm: [-0.9, 0, 0.55], lElbow: [-1.5, 0, 0], rArm: [-0.9, 0, 0.55], rElbow: [-1.5, 0, 0], lFoot: [0.05, 0.02, 0.1], rFoot: [0.05, 0, -0.08], head: [-0.1, 0, 0] }],
        // Boost dash (vanish).
        [0.16, { vis: 0, root: [0, 0.04, 0.1], hipY: -0.1 }],
        [0.3, { vis: 0, root: [0, 0.06, 0.38] }],
        // Arrive in guard, throw the right cross.
        [0.36, { vis: 1, root: [0, 0, 0.38], hipY: -0.12, hips: [0, -0.55, 0], spine: [0.1, -0.45, 0], chest: [0, -0.25, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.12], lArm: [-0.85, 0, 0.4], lElbow: [-1.7, 0, 0], rArm: [0.5, 0, 0.55], rElbow: [-1.9, 0, 0], head: [0.05, -0.2, 0] }],
        // Cross lands (hit).
        [0.5, { root: [0, 0, 0.42], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.18, -0.55, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.14], rArm: [-1.55, 0, 0.02], rElbow: [0, 0, 0], rHand: [-0.2, 0, 0], lArm: [0.35, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.05, -0.25, 0] }],
        // Engine-boosted left hook follow-up.
        [0.62, { root: [0, 0, 0.4], hipY: -0.12, hips: [0, -0.35, 0.15], spine: [0.12, 0.35, -0.15], lFoot: [0.05, 0, 0.14], rFoot: [0.05, 0, -0.1], lArm: [-1.35, -0.4, 0.35], lElbow: [-0.35, 0, 0], lHand: [-0.4, 0, 0.3], rArm: [-0.7, 0, 0.55], rElbow: [-1.4, 0, 0] }],
        [0.78, { root: [0, 0, 0.36], hipY: -0.1, hips: [0, 0.2, 0], spine: [0.1, -0.15, 0], lArm: [-1.2, 0, 0.25], lElbow: [-0.5, 0, 0], rArm: [-0.85, 0, 0.45], rElbow: [-1.5, 0, 0], lFoot: [0.04, 0, 0.12], rFoot: [0.05, 0, -0.08] }],
        [1.0, P({}, IDLES.engineRev(0))],
      ],
      REST,
    ),
  },
  flyingKick: {
    hit: 0.36,
    release: 0.36,
    ranged: false,
    fx: 'impact',
    clip: clip([
      [0, {}],
      [0.12, { hipY: -0.18, spine: [0.35, 0, 0], lArm: [0.8, 0, 0.3], rArm: [0.8, 0, 0.3] }],
      [0.24, { root: [0, 0.3, 0.2], hipY: 0, spine: [-0.1, 0, 0], lFoot: [0.02, 0.28, 0.08], rFoot: [0.02, 0.1, -0.1], lArm: [-2.0, 0, 0.7], rArm: [-1.0, 0, 0.9] }],
      [0.36, { root: [0, 0.26, 0.42], rootRot: [-0.35, 0, 0], hipY: 0, spine: [-0.15, 0, 0], lFoot: [0.02, 0.12, 0.48], lToe: -0.3, rFoot: [0.02, 0.22, -0.02], lArm: [-0.8, 0, 1.2], rArm: [-0.5, 0, 1.0], lElbow: [-0.5, 0, 0], rElbow: [-1.2, 0, 0] }],
      [0.55, { root: [0, 0.05, 0.38], hipY: -0.05, lFoot: [0.03, 0.05, 0.1], rFoot: [0.03, 0.04, -0.04], lArm: [-1.0, 0, 0.9], rArm: [-1.0, 0, 0.9] }],
      [0.68, { root: [0, 0, 0.32], hipY: -0.2, spine: [0.4, 0, 0], lFoot: [0.06, 0, 0.12], rFoot: [0.05, 0, -0.08], lArm: [-1.1, 0, 0.3], lElbow: [-0.3, 0, 0], lHand: [1.0, 0, 0] }],
      [0.95, P({}, IDLES.ninjaCrouch(0))],
    ]),
  },
  phasePunch: {
    // Permeation: sink → appear under them → drag into the floor → erupt & decapitate.
    hit: 0.5,
    hits: [
      { t: 0.5, zone: 'low', hold: true },
      { t: 0.92, zone: 'high' },
    ],
    zone: 'high',
    release: 0.5,
    ranged: false,
    fx: 'phase',
    clip: clip(
      [
        [0, P({}, IDLES.millionSmile(0))],
        // Crouch and phase into the pad.
        [0.1, { hipY: -0.24, spine: [0.5, 0, 0], chest: [0.12, 0, 0], lArm: [0.75, 0, 0.4], rArm: [0.75, 0, 0.4], lElbow: [-0.15, 0, 0], rElbow: [-0.15, 0, 0], head: [-0.2, 0, 0] }],
        [0.16, { vis: 0, hipY: -0.42, root: [0, -0.28, 0.06] }],
        // Ghost under the board toward their feet.
        [0.32, { vis: 0, root: [0, -0.72, 0.38], hipY: -0.2 }],
        // Erupt from BELOW — hands latch onto their ankles.
        [0.4, { vis: 1, root: [0, -0.58, 0.42], hipY: -0.08, hips: [0, 0.2, 0], spine: [-0.55, 0, 0], chest: [-0.25, 0, 0], lFoot: [0.04, 0.2, 0.08], rFoot: [0.05, 0.18, -0.06], lArm: [-2.55, -0.15, 0.35], lElbow: [-0.15, 0, 0], rArm: [-2.55, 0.15, 0.35], rElbow: [-0.15, 0, 0], lHand: [-0.4, 0, 0], rHand: [-0.4, 0, 0], head: [-0.55, 0, 0] }],
        // Yank them into the floor (trap hit).
        [0.5, { root: [0, -0.78, 0.42], hipY: -0.12, hips: [0, 0.15, 0], spine: [-0.35, 0, 0], chest: [-0.15, 0, 0], lFoot: [0.05, 0.12, 0.06], rFoot: [0.05, 0.1, -0.05], lArm: [-1.85, -0.1, 0.2], lElbow: [-0.35, 0, 0], rArm: [-1.85, 0.1, 0.2], rElbow: [-0.35, 0, 0], lHand: [0.3, 0, 0], rHand: [0.3, 0, 0], head: [-0.35, 0, 0] }, 'snap'],
        // Slip back under while they stay stuck.
        [0.58, { vis: 0, root: [0, -0.55, 0.34], hipY: -0.2 }],
        // Pop out beside the stuck torso, grin cocked for the chop.
        [0.72, { vis: 1, root: [0, 0.02, 0.34], hipY: -0.12, hips: [0, -0.55, 0], spine: [0.1, -0.45, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.14], rFoot: [0.06, 0, -0.12], lArm: [-0.7, 0, 0.45], lElbow: [-1.5, 0, 0], rArm: [0.55, 0.2, 0.85], rElbow: [-1.7, 0, 0], head: [0.05, -0.2, 0] }],
        // Decapitation — flat chop through the stuck neck.
        [0.92, { root: [0, 0, 0.4], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.22, -0.5, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.06, 0, -0.14], rArm: [-1.55, 0.1, 0.05], rElbow: [0, 0, 0], rHand: [-0.35, 0, 0.55], lArm: [0.4, 0, 0.55], lElbow: [-1.35, 0, 0], head: [0.08, -0.25, 0] }, 'snap'],
        [1.1, { root: [0, 0, 0.36], hipY: -0.1, hips: [0, 0.2, 0], spine: [0.12, -0.15, 0], rArm: [-1.2, 0, 0.2], rElbow: [-0.35, 0, 0], lArm: [-0.55, 0, 0.5], lElbow: [-1.1, 0, 0] }],
        [1.3, P({}, IDLES.millionSmile(0))],
      ],
      REST,
    ),
  },
  portalGate: {
    // Spatial Magic: cast a gate → teleport through → palm strike from the exit.
    hit: 0.54,
    zone: 'mid',
    release: 0.54,
    ranged: false,
    fx: 'portal',
    clip: clip(
      [
        [0, P({ prop: 0 }, IDLES.portalReady(0))],
        [0.12, { prop: 1, hipY: -0.12, spine: [0.12, -0.4, 0], chest: [0, -0.2, 0], rArm: [-1.5, 0.2, 0.1], rElbow: [-0.05, 0, 0], rHand: [-0.7, 0, 0.25], lArm: [0.35, 0, 0.55], lElbow: [-1.4, 0, 0], head: [0.05, -0.3, 0] }],
        [0.2, { prop: 1, vis: 0, root: [0, 0.08, 0.1], hipY: -0.06, rArm: [-1.55, 0, 0.05], rElbow: [0, 0, 0] }],
        [0.38, { prop: 1, vis: 0, root: [0, 0.1, 0.36] }],
        [0.44, { prop: 1, vis: 1, root: [0, 0.04, 0.38], hipY: -0.1, hips: [0, -0.45, 0], spine: [0.1, -0.35, 0], chest: [0, -0.15, 0], lFoot: [0.04, 0.02, 0.14], rFoot: [0.05, 0.02, -0.1], lArm: [-0.8, 0, 0.4], lElbow: [-1.5, 0, 0], rArm: [0.4, 0, 0.5], rElbow: [-1.7, 0, 0], head: [0.05, -0.2, 0] }],
        [0.54, { prop: 0.6, root: [0, 0, 0.42], hipY: -0.12, hips: [0, 0.45, 0], spine: [0.18, -0.45, 0], chest: [0, -0.15, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.05, 0, -0.12], rArm: [-1.55, 0, 0.05], rElbow: [0, 0, 0], rHand: [-1.2, 0, 0], lArm: [0.3, 0, 0.55], lElbow: [-1.3, 0, 0], head: [0.05, -0.2, 0] }, 'snap'],
        [0.72, { prop: 0.2, root: [0, 0, 0.38], hipY: -0.1, hips: [0, 0.15, 0], spine: [0.1, -0.15, 0], rArm: [-1.35, 0, 0.15], rElbow: [-0.2, 0, 0], rHand: [-0.9, 0, 0], lArm: [-0.55, 0, 0.5], lElbow: [-1.2, 0, 0] }],
        [0.95, { prop: 0, root: [0, 0, 0.28], hipY: -0.08, spine: [0.1, 0, 0], lArm: [-0.55, 0, 0.45], rArm: [-0.55, 0, 0.45], lElbow: [-1.3, 0, 0], rElbow: [-1.3, 0, 0] }],
        [1.15, P({ prop: 0 }, IDLES.portalReady(0))],
      ],
      REST,
    ),
  },
  shardPalm: {
    hit: 0.38,
    release: 0.38,
    ranged: false,
    fx: 'shards',
    clip: clip(
      [
        [0, P({}, IDLES.mirrorGaze(0))],
        [0.18, { rootRot: [0, -1.2, 0], hipY: -0.06, root: [0, 0, 0.12], rArm: [-0.4, 0, 1.0], rElbow: [-0.6, 0, 0], lArm: [-0.3, 0, 0.8] }],
        [0.38, { rootRot: [0, 0, 0], hipY: -0.1, root: [0, 0, 0.36], lFoot: [0.02, 0, 0.16], rFoot: [0.05, 0, -0.1], spine: [0.12, -0.3, 0], rArm: [-1.55, 0, 0.1], rElbow: [0, 0, 0], rHand: [-1.5, 0, 0], lArm: [0.3, 0, 0.8], lElbow: [-0.3, 0, 0] }],
        [0.7, { hipY: -0.1, root: [0, 0, 0.34], lFoot: [0.02, 0, 0.16], rFoot: [0.05, 0, -0.1], spine: [0.12, -0.3, 0], rArm: [-1.5, 0, 0.1], rElbow: [0, 0, 0], rHand: [-1.5, 0, 0], lArm: [0.3, 0, 0.8], lElbow: [-0.3, 0, 0] }],
        [0.95, P({}, IDLES.mirrorGaze(0))],
      ],
      REST,
    ),
  },
  spotlight: {
    hit: 0.62,
    release: 0.45,
    ranged: true,
    fx: 'beam',
    clip: clip(
      [
        [0, P({}, IDLES.idolPose(0))],
        [0.28, { hips: [0, 0, 0.15], rArm: [-3.0, 0, 0.2], rElbow: [-0.3, 0, 0], lArm: [-0.3, 0, 0.9], lElbow: [-0.4, 0, 0], head: [-0.3, 0, 0] }],
        [0.45, { hips: [0, -0.3, 0.1], spine: [0.05, 0.3, 0], root: [0, 0, 0.05], lFoot: [0.0, 0, 0.12], rArm: [-1.6, 0, 0.15], rElbow: [-0.3, 0, 0], rHand: [-1.4, 0, 0], lArm: [0.2, 0, 1.1], lElbow: [-0.3, 0, 0] }],
        [0.9, { hips: [0, -0.3, 0.1], spine: [0.05, 0.3, 0], root: [0, 0, 0.05], lFoot: [0.0, 0, 0.12], rArm: [-1.6, 0, 0.15], rElbow: [-0.3, 0, 0], rHand: [-1.4, 0, 0], lArm: [0.2, 0, 1.1], lElbow: [-0.3, 0, 0] }],
        [1.1, { hips: [0, 0.2, 0.2], lFoot: [-0.04, 0, 0.06], rArm: [-0.7, -0.2, 0.25], rElbow: [-1.7, 0, 0], lArm: [-2.8, 0, 0.5], lElbow: [-0.5, 0, 0], head: [0, 0.2, 0.3], blink: 1 }],
        [1.3, P({}, IDLES.idolPose(0))],
      ],
      REST,
    ),
  },
  powerPunch: {
    hit: 0.52,
    zone: 'high',
    release: 0.52,
    ranged: false,
    fx: 'impact',
    clip: clip([
      [0, {}],
      [0.3, { hipY: -0.1, hips: [0, -0.6, 0], spine: [0.05, -0.5, 0], chest: [0, -0.3, 0], rArm: [0.6, 0, 0.5], rElbow: [-1.8, 0, 0], lArm: [-1.3, 0, 0.3], lElbow: [-0.6, 0, 0] }],
      [0.52, { hipY: -0.14, root: [0, 0, 0.3], hips: [0, 0.5, 0], spine: [0.2, -0.5, 0], chest: [0, -0.15, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.06, 0, -0.14], rArm: [-1.55, 0, 0.0], rElbow: [0, 0, 0], lArm: [0.4, 0, 0.5], lElbow: [-1.6, 0, 0] }],
      [0.85, { hipY: -0.14, root: [0, 0, 0.3], hips: [0, 0.5, 0], spine: [0.2, -0.5, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.06, 0, -0.14], rArm: [-1.5, 0, 0.0], rElbow: [-0.05, 0, 0], lArm: [0.4, 0, 0.5], lElbow: [-1.6, 0, 0] }],
      [1.15, P({}, IDLES.commander(0))],
    ]),
  },
  beam: {
    hit: 0.68,
    release: 0.55,
    ranged: true,
    fx: 'beam',
    clip: clip(
      [
        [0, P({}, IDLES.prayer(0))],
        [0.38, { hipY: -0.1, hips: [0, -0.5, 0], spine: [0, -0.4, 0], lFoot: [0.06, 0, 0.08], rFoot: [0.06, 0, -0.08], lArm: [0.4, 0, 0.3], lElbow: [-1.6, 0, 0], rArm: [0.4, 0, 0.3], rElbow: [-1.6, 0, 0], lHand: [0, 0, 0.6], rHand: [0, 0, 0.6], blink: 0 }],
        [0.55, { hipY: -0.12, hips: [0, 0.2, 0], spine: [0.15, -0.1, 0], lFoot: [0.06, 0, 0.14], rFoot: [0.06, 0, -0.1], lArm: [-1.55, 0, 0.08], lElbow: [0, 0, 0], rArm: [-1.55, 0, 0.08], rElbow: [0, 0, 0], lHand: [-1.4, 0, 0], rHand: [-1.4, 0, 0] }],
        [1.0, { hipY: -0.12, hips: [0, 0.2, 0], spine: [0.15, -0.1, 0], lFoot: [0.06, 0, 0.14], rFoot: [0.06, 0, -0.1], lArm: [-1.55, 0, 0.08], lElbow: [0, 0, 0], rArm: [-1.55, 0, 0.08], rElbow: [0, 0, 0], lHand: [-1.4, 0, 0], rHand: [-1.4, 0, 0] }],
        [1.25, P({}, IDLES.prayer(0))],
      ],
      REST,
    ),
  },
  cardThrow: {
    hit: 0.68,
    release: 0.44,
    ranged: true,
    fx: 'cards',
    clip: clip([
      [0, P({}, IDLES.cardShuffle(0))],
      [0.12, { hipY: -0.08, rArm: [-0.8, -1.0, 0.3], rElbow: [-1.8, 0, 0], lArm: [-0.6, 0, 0.6] }],
      [0.36, { rootRot: [0, PI * 2, 0], hipY: -0.04, rArm: [-1.2, -1.4, 0.4], rElbow: [-1.6, 0, 0] }],
      [0.46, { rootRot: [0, PI * 2, 0], hipY: -0.1, root: [0, 0, 0.05], lFoot: [0.03, 0, 0.14], spine: [0.15, -0.4, 0], rArm: [-1.5, 0.3, 0.3], rElbow: [-0.1, 0, 0], rHand: [0, 0, -0.6], lArm: [0.4, 0, 0.6] }],
      [0.8, { rootRot: [0, PI * 2, 0], hipY: -0.08, root: [0, 0, 0.05], lFoot: [0.03, 0, 0.14], spine: [0.1, -0.4, 0], rArm: [-1.4, 0.3, 0.3], rElbow: [-0.1, 0, 0], lArm: [0.4, 0, 0.6], head: [0, 0, 0.2] }],
      [1.0, P({ rootRot: [0, PI * 2, 0] }, IDLES.cardShuffle(0))],
    ]),
  },
  thunderDrop: {
    hit: 0.56,
    release: 0.56,
    ranged: false,
    fx: 'lightning',
    clip: clip([
      [0, {}],
      [0.14, { hipY: -0.2, spine: [0.3, 0, 0], lArm: [0.9, 0, 0.4], rArm: [0.9, 0, 0.4] }],
      [0.36, { root: [0, 0.75, 0.2], hipY: 0, rootRot: [0.3, 0, 0], lFoot: [0, 0.22, 0.04], rFoot: [0, 0.2, -0.04], spine: [0.2, 0, 0], rArm: [-2.9, 0, 0.3], rElbow: [-0.2, 0, 0], lArm: [-0.8, 0, 0.9] }],
      [0.56, { root: [0, 0, 0.36], hipY: -0.3, rootRot: [0, 0, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.05, 0.02, -0.2], spine: [0.6, 0, 0], rArm: [-1.1, 0, 0.2], rElbow: [-0.1, 0, 0], rHand: [-0.6, 0, 0], lArm: [0.4, 0, 1.0], lElbow: [-0.3, 0, 0] }],
      [0.8, { root: [0, 0, 0.34], hipY: -0.28, lFoot: [0.05, 0, 0.16], rFoot: [0.05, 0.02, -0.2], spine: [0.55, 0, 0], rArm: [-1.1, 0, 0.2], rElbow: [-0.1, 0, 0], lArm: [0.4, 0, 1.0], lElbow: [-0.3, 0, 0], head: [-0.4, 0, 0] }],
      [1.05, {}],
    ]),
  },
  gridStrike: {
    // Sprint in → point-blank lightning barrage. Hit on first contact; flurry keeps pumping.
    hit: 0.4,
    hits: [0.4, 0.5, 0.6, 0.72],
    release: 0.4,
    ranged: false,
    fx: 'voltBarrage',
    clip: clip(
      [
        [0, P({}, IDLES.speedCrouch(0))],
        // Explode out of the crouch into a sprint.
        [0.08, { hipY: -0.2, spine: [0.5, 0, 0], chest: [0.1, 0, 0], lArm: [0.9, 0, 0.25], rArm: [-0.9, 0, 0.25], lElbow: [-1.4, 0, 0], rElbow: [-1.4, 0, 0], lFoot: [0.04, 0.08, 0.14], rFoot: [0.04, 0, -0.1], head: [-0.25, 0, 0] }],
        // Blur-sprint close — visible, legs cycling, closing the gap.
        [0.16, { root: [0, 0.04, 0.16], hipY: -0.06, spine: [0.35, -0.1, 0], hips: [0.1, 0.2, 0], lFoot: [0.02, 0.12, -0.12], rFoot: [0.02, 0.02, 0.16], lArm: [-1.0, 0, 0.2], rArm: [1.0, 0, 0.2], lElbow: [-1.5, 0, 0], rElbow: [-1.5, 0, 0], head: [-0.2, 0.1, 0] }],
        [0.24, { root: [0, 0.05, 0.28], hipY: -0.05, spine: [0.38, 0.1, 0], hips: [0.1, -0.2, 0], lFoot: [0.02, 0.02, 0.16], rFoot: [0.02, 0.12, -0.12], lArm: [1.0, 0, 0.2], rArm: [-1.0, 0, 0.2], lElbow: [-1.5, 0, 0], rElbow: [-1.5, 0, 0], head: [-0.2, -0.1, 0] }],
        [0.32, { root: [0, 0.02, 0.38], hipY: -0.1, spine: [0.3, -0.15, 0], hips: [0, 0.15, 0], lFoot: [0.04, 0.04, 0.1], rFoot: [0.05, 0, -0.1], lArm: [-0.7, 0, 0.45], lElbow: [-1.6, 0, 0], rArm: [-0.5, 0, 0.55], rElbow: [-1.7, 0, 0], head: [-0.1, 0.15, 0] }],
        // Plant + first palm dump (hit).
        [0.4, { root: [0, 0, 0.42], hipY: -0.14, hips: [0, 0.5, 0], spine: [0.2, -0.55, 0], chest: [0, -0.25, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.06, 0, -0.14], rArm: [-1.55, 0, 0.05], rElbow: [0, 0, 0], rHand: [-0.4, 0, 0], lArm: [0.4, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.05, -0.25, 0] }],
        // Left jab arc.
        [0.5, { root: [0, 0, 0.44], hipY: -0.12, hips: [0, -0.45, 0.1], spine: [0.15, 0.4, -0.1], chest: [0, 0.15, 0], lFoot: [0.05, 0, 0.14], rFoot: [0.05, 0, -0.1], lArm: [-1.5, -0.25, 0.2], lElbow: [-0.15, 0, 0], lHand: [-0.45, 0, 0.2], rArm: [-0.6, 0, 0.55], rElbow: [-1.5, 0, 0], head: [0, 0.2, 0] }],
        // Right cross arc.
        [0.6, { root: [0, 0, 0.46], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.22, -0.55, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.12], rArm: [-1.6, 0, 0], rElbow: [0, 0, 0], rHand: [-0.5, 0, 0], lArm: [0.35, 0, 0.6], lElbow: [-1.4, 0, 0], head: [0.05, -0.3, 0] }],
        // Both-hands overload — fill them with lightning.
        [0.72, { root: [0, 0.02, 0.44], hipY: -0.1, hips: [0, 0, 0], spine: [0.05, 0, 0], chest: [-0.1, 0, 0], lFoot: [0.05, 0.02, 0.12], rFoot: [0.05, 0.02, -0.1], lArm: [-1.35, 0, 0.15], lElbow: [-0.2, 0, 0], lHand: [-0.6, 0, 0.15], rArm: [-1.35, 0, 0.15], rElbow: [-0.2, 0, 0], rHand: [-0.6, 0, -0.15], head: [-0.2, 0, 0] }],
        [0.88, { root: [0, 0, 0.4], hipY: -0.16, hips: [0, 0.2, 0], spine: [0.25, -0.2, 0], lFoot: [0.05, 0, 0.14], rFoot: [0.06, 0, -0.1], lArm: [-0.9, 0, 0.45], lElbow: [-1.2, 0, 0], rArm: [-0.9, 0, 0.45], rElbow: [-1.2, 0, 0], head: [-0.1, 0.1, 0] }],
        [1.15, P({}, IDLES.speedCrouch(0))],
      ],
      REST,
    ),
  },
  clawSwipe: {
    hit: 0.46,
    hits: [0.26, 0.46],
    zone: 'high',
    release: 0.46,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({}, IDLES.slouch(0))],
        [0.14, { hipY: -0.08, spine: [0.3, 0.5, 0], rArm: [-2.6, 0, 0.9], rElbow: [-0.6, 0, 0], lArm: [0.3, 0, 0.4] }],
        [0.26, { hipY: -0.1, root: [0, 0, 0.25], spine: [0.4, -0.5, 0], lFoot: [0.04, 0, 0.14], rArm: [-0.6, 0, -0.2], rElbow: [-0.2, 0, 0], lArm: [-2.6, 0, 0.9], lElbow: [-0.6, 0, 0] }],
        [0.46, { hipY: -0.12, root: [0, 0, 0.34], spine: [0.45, 0.5, 0], lFoot: [0.04, 0, 0.18], lArm: [-0.6, 0, -0.2], lElbow: [-0.2, 0, 0], rArm: [0.4, 0, 0.6], rElbow: [-0.3, 0, 0] }],
        [0.7, { hipY: -0.1, root: [0, 0, 0.3], spine: [0.4, 0.3, 0], lFoot: [0.04, 0, 0.16], lArm: [-0.5, 0, -0.1], rArm: [0.3, 0, 0.5] }],
        [0.95, P({}, IDLES.slouch(0))],
      ],
      REST,
    ),
  },
  zap: {
    hit: 0.34,
    release: 0.34,
    ranged: false,
    fx: 'lightning',
    clip: clip(
      [
        [0, {}],
        [0.15, { root: [0, 0.12, 0.15], hipY: 0, lFoot: [0.02, 0.06, 0.04], rFoot: [0.02, 0.04, -0.04], rArm: [-2.0, 0, 0.3], rElbow: [-1.0, 0, 0] }],
        [0.34, { root: [0, 0, 0.34], hipY: -0.08, spine: [0.2, -0.3, 0], lFoot: [0.03, 0, 0.14], rArm: [-1.55, 0, 0.08], rElbow: [0, 0, 0], rHand: [-1.4, 0, 0], lArm: [0.3, 0, 0.7] }],
        [0.55, { root: [0, 0, 0.2], hipY: -0.06, spine: [-0.2, 0, 0.1], rArm: [-0.6, 0, 0.8], rElbow: [-1.3, 0, 0], lArm: [-0.6, 0, 0.8], lElbow: [-1.3, 0, 0], head: [-0.2, 0.3, 0] }],
        [0.85, P({}, IDLES.jitter(0))],
      ],
      REST,
    ),
  },
  hammerFist: {
    hit: 0.55,
    zone: 'high',
    release: 0.55,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.armsCrossed(0))],
        [0.35, { hipY: 0.0, root: [0, 0, 0.1], spine: [-0.25, 0, 0], chest: [-0.1, 0, 0], lArm: [-3.0, -0.3, 0.15], rArm: [-3.0, -0.3, 0.15], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0], lFoot: [0.08, 0, 0.08], rFoot: [0.08, 0, -0.05] }],
        [0.55, { hipY: -0.2, root: [0, 0, 0.26], spine: [0.7, 0, 0], chest: [0.2, 0, 0], lArm: [-1.0, -0.3, 0.1], rArm: [-1.0, -0.3, 0.1], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0], lFoot: [0.1, 0, 0.12], rFoot: [0.1, 0, -0.06] }],
        [0.85, { hipY: -0.18, root: [0, 0, 0.26], spine: [0.65, 0, 0], lArm: [-1.0, -0.3, 0.1], rArm: [-1.0, -0.3, 0.1], lFoot: [0.1, 0, 0.12], rFoot: [0.1, 0, -0.06] }],
        [1.15, P({}, IDLES.armsCrossed(0))],
      ],
      REST,
    ),
  },
  slash: {
    hit: 0.36,
    hits: [0.22, 0.36],
    release: 0.36,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({}, IDLES.scalpelTwirl(0))],
        [0.12, { hipY: -0.06, root: [0, 0, 0.1], spine: [0.1, 0.5, 0], rArm: [-1.3, -0.6, 1.0], rElbow: [-1.6, 0, 0] }],
        [0.22, { hipY: -0.1, root: [0, 0, 0.3], spine: [0.15, -0.5, 0], lFoot: [0.02, 0, 0.16], rArm: [-1.3, 0.5, 0.0], rElbow: [-0.2, 0, 0] }],
        [0.36, { hipY: -0.12, root: [0, 0, 0.34], spine: [0.15, 0.4, 0], lFoot: [0.02, 0, 0.16], rArm: [-1.8, 0.2, 1.1], rElbow: [-0.2, 0, 0], rHand: [0, 0, 0.6] }],
        [0.7, { hipY: -0.1, root: [0, 0, 0.3], spine: [0.1, 0.35, 0], lFoot: [0.02, 0, 0.14], rArm: [-1.6, 0.2, 1.0], rElbow: [-0.3, 0, 0] }],
        [0.95, P({}, IDLES.scalpelTwirl(0))],
      ],
      REST,
    ),
  },
  erase: {
    hit: 0.6,
    release: 0.6,
    ranged: true,
    fx: 'glitch',
    clip: clip(
      [
        [0, P({}, IDLES.glitch(0.5))],
        [0.4, { lFoot: [0.02, 0, 0], rFoot: [0.02, 0, 0], head: [-0.1, 0, 0.3], rArm: [-1.55, 0, 0.1], rElbow: [0, 0, 0], rHand: [-1.5, 0, 0] }],
        [0.6, { lFoot: [0.02, 0, 0], rFoot: [0.02, 0, 0], head: [0.1, 0, 0.3], rArm: [-1.5, 0, 0.1], rElbow: [-0.2, 0, 0], rHand: [-0.2, 0, 0], vis: 1 }],
        [0.66, { lFoot: [0.02, 0, 0], rFoot: [0.02, 0, 0], head: [0.1, 0, 0.3], rArm: [-1.5, 0, 0.1], rElbow: [-0.2, 0, 0], vis: 0.6 }],
        [0.72, { lFoot: [0.02, 0, 0], rFoot: [0.02, 0, 0], head: [0.1, 0, 0.3], rArm: [-1.5, 0, 0.1], rElbow: [-0.2, 0, 0], vis: 1 }],
        [1.0, P({}, IDLES.glitch(0.5))],
      ],
      REST,
    ),
  },
  peck: {
    hit: 0.5,
    hits: [0.12, 0.24, 0.36, 0.5],
    zone: 'high',
    release: 0.5,
    ranged: false,
    fx: 'shards',
    clip: clip(
      [
        [0, P({}, IDLES.perch(0))],
        ...[0.12, 0.24, 0.36, 0.5].flatMap((t, i): [number, PartialPose][] => [
          [t - 0.06, { hipY: -0.16, root: [0, 0, 0.15 + i * 0.04], hips: [0.3, 0, 0], spine: [0.5, i % 2 ? 0.3 : -0.3, 0], head: [-0.4, 0, 0], lArm: i % 2 ? [-1.0, 0, 0.3] : [0.5, 0, 0.6], rArm: i % 2 ? [0.5, 0, 0.6] : [-1.0, 0, 0.3], lElbow: [-1.2, 0, 0], rElbow: [-1.2, 0, 0] }],
          [t, { hipY: -0.14, root: [0, 0, 0.3 + i * 0.03], hips: [0.3, 0, 0], spine: [0.55, i % 2 ? -0.3 : 0.3, 0], head: [-0.3, 0, 0], lArm: i % 2 ? [0.6, 0, 0.6] : [-1.55, 0, 0.05], rArm: i % 2 ? [-1.55, 0, 0.05] : [0.6, 0, 0.6], lElbow: [-0.05, 0, 0], rElbow: [-0.05, 0, 0] }],
        ]),
        [0.8, P({ root: [0, 0, 0.28] }, IDLES.perch(0))],
        [1.0, P({}, IDLES.perch(0))],
      ],
      REST,
    ),
  },
  slideKick: {
    hit: 0.36,
    zone: 'low',
    release: 0.36,
    ranged: false,
    fx: 'impact',
    clip: clip(
      [
        [0, P({}, IDLES.pockets(0))],
        [0.12, { hipY: -0.06, spine: [0.3, 0, 0], lArm: [0.6, 0, 0.3], rArm: [0.6, 0, 0.3] }],
        [0.36, { root: [0, 0, 0.42], hipY: -0.34, spine: [-0.5, 0, 0], head: [0.4, 0, 0], lFoot: [0.02, 0.04, 0.4], lToe: -0.3, rFoot: [0.04, 0, 0.02], lArm: [0.3, 0, 0.7], rArm: [0.6, 0, 0.4], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] }],
        [0.6, { root: [0, 0, 0.44], hipY: -0.3, spine: [-0.4, 0, 0], head: [0.3, 0, 0], lFoot: [0.02, 0.02, 0.36], rFoot: [0.04, 0, 0.02], lArm: [0.3, 0, 0.7], rArm: [0.6, 0, 0.4] }],
        [0.85, { root: [0, 0, 0.3], hipY: -0.08, spine: [0.1, 0, 0] }],
        [1.05, P({}, IDLES.pockets(0))],
      ],
      REST,
    ),
  },
  pounce: {
    hit: 0.42,
    release: 0.42,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({}, IDLES.feral(0))],
        [0.2, { hipY: -0.26, root: [0, 0, -0.04], hips: [0.4, 0, 0], spine: [0.55, 0, 0], head: [-0.6, 0, 0], lArm: [0.4, 0, 0.6], rArm: [0.4, 0, 0.6], lFoot: [0.09, 0, 0.06], rFoot: [0.08, 0, -0.1] }],
        [0.34, { root: [0, 0.22, 0.32], hipY: 0, spine: [0.3, 0, 0], head: [-0.4, 0, 0], lFoot: [0.03, 0.16, -0.06], rFoot: [0.03, 0.1, -0.14], lArm: [-2.4, 0, 0.5], rArm: [-2.4, 0, 0.5], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0], lHand: [-0.8, 0, 0], rHand: [-0.8, 0, 0] }],
        [0.42, { root: [0, 0.05, 0.42], hipY: -0.1, spine: [0.55, 0, 0], head: [-0.5, 0, 0], lFoot: [0.05, 0.02, 0.12], rFoot: [0.05, 0.02, -0.06], lArm: [-1.0, 0, 0.35], rArm: [-1.0, 0, 0.35], lElbow: [-0.1, 0, 0], rElbow: [-0.1, 0, 0], lHand: [-0.6, 0, 0], rHand: [-0.6, 0, 0] }],
        [0.7, { root: [0, 0, 0.4], hipY: -0.18, hips: [0.3, 0, 0], spine: [0.45, 0, 0], head: [-0.6, 0, 0], lFoot: [0.09, 0, 0.1], rFoot: [0.08, 0, -0.06], lArm: [-1.1, 0, 0.45], rArm: [-0.9, 0, 0.5], lElbow: [-0.9, 0, 0], rElbow: [-1.1, 0, 0] }],
        [0.95, P({}, IDLES.feral(0))],
      ],
      REST,
    ),
  },
  spinKick: {
    hit: 0.38,
    release: 0.38,
    ranged: false,
    fx: 'speed',
    clip: clip([
      [0, {}],
      [0.1, { hipY: -0.1, spine: [0.15, 0, 0] }],
      [0.38, { rootRot: [0, PI * 1.5, 0], root: [0, 0.08, 0.22], hipY: 0, spine: [0, 0, 0.45], rFoot: [0.3, 0.42, 0.25], rToe: 0.6, lArm: [-0.6, 0, 1.3], rArm: [-0.6, 0, 1.3], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0] }],
      [0.52, { rootRot: [0, PI * 2, 0], root: [0, 0, 0.24], hipY: -0.04, spine: [0, 0, 0.2], rFoot: [0.12, 0.2, 0.05], lArm: [-0.6, 0, 1.0], rArm: [-0.6, 0, 1.0] }],
      [0.85, { rootRot: [0, PI * 2, 0], root: [0, 0, 0.1] }],
    ]),
  },
  axeKick: {
    hit: 0.46,
    zone: 'high',
    release: 0.46,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.kungfu(0))],
        [0.3, { hipY: -0.02, root: [0, 0, 0.2], spine: [-0.25, 0, 0], lFoot: [0.03, 0, 0.0], rFoot: [0.0, 0.62, 0.22], rToe: 0.2, lArm: [-0.6, 0, 1.1], rArm: [-0.6, 0, 1.1] }],
        [0.46, { hipY: -0.12, root: [0, 0, 0.3], spine: [0.35, 0, 0], lFoot: [0.03, 0, -0.04], rFoot: [0.02, 0.02, 0.3], lArm: [0.2, 0, 1.0], rArm: [0.2, 0, 1.0], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0] }],
        [0.75, { hipY: -0.12, root: [0, 0, 0.3], spine: [0.3, 0, 0], lFoot: [0.03, 0, -0.04], rFoot: [0.02, 0.0, 0.28], lArm: [0.2, 0, 1.0], rArm: [0.2, 0, 1.0] }],
        [1.0, P({}, IDLES.kungfu(0))],
      ],
      REST,
    ),
  },
  darkBeam: {
    hit: 0.7,
    release: 0.5,
    ranged: true,
    fx: 'darkBeam',
    clip: clip(
      [
        [0, P({}, IDLES.float(0))],
        [0.35, { root: [0, 0.3, 0], lFoot: [0, 0, -0.02], rFoot: [0, 0.05, -0.05], lToe: 0.7, rToe: 0.8, spine: [-0.2, 0, 0], head: [-0.3, 0, 0], lArm: [-1.4, 0, 1.2], rArm: [-1.4, 0, 1.2], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] }],
        [0.5, { root: [0, 0.3, 0], lFoot: [0, 0, -0.02], rFoot: [0, 0.05, -0.05], lToe: 0.7, rToe: 0.8, spine: [0.15, 0, 0], lArm: [-1.55, 0, 0.15], rArm: [-1.55, 0, 0.15], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.4, 0, 0], rHand: [-1.4, 0, 0] }],
        [1.0, { root: [0, 0.3, 0], lFoot: [0, 0, -0.02], rFoot: [0, 0.05, -0.05], lToe: 0.7, rToe: 0.8, spine: [0.15, 0, 0], lArm: [-1.55, 0, 0.15], rArm: [-1.55, 0, 0.15], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.4, 0, 0], rHand: [-1.4, 0, 0] }],
        [1.3, P({}, IDLES.float(0))],
      ],
      REST,
    ),
  },
  murasaki: {
    // Hollow Purple — gather both hands, thrust the violet orb, tear the file open.
    hit: 0.72,
    zone: 'mid',
    release: 0.48,
    ranged: true,
    fx: 'murasaki',
    clip: clip(
      [
        [0, P({}, IDLES.pockets(0))],
        [0.26, { hips: [0, -0.2, 0.08], spine: [-0.18, 0.12, 0], chest: [-0.08, 0.05, 0], head: [-0.12, 0.08, 0], lFoot: [0.03, 0, 0.06], rFoot: [0.04, 0, -0.04], lArm: [-1.15, 0.45, 0.95], rArm: [-1.15, -0.45, 0.95], lElbow: [-0.55, 0, 0], rElbow: [-0.55, 0, 0], lHand: [-0.7, 0.2, 0], rHand: [-0.7, -0.2, 0] }],
        [0.48, { hips: [0, -0.35, 0.1], spine: [0.14, 0.22, 0], chest: [0.08, 0.1, 0], root: [0, 0, 0.1], lFoot: [0.02, 0, 0.16], rFoot: [0.05, 0, -0.1], head: [0.06, -0.12, 0], lArm: [-1.58, 0.12, 0.1], rArm: [-1.58, -0.12, 0.1], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.45, 0.05, 0], rHand: [-1.45, -0.05, 0] }],
        [0.95, { hips: [0, -0.32, 0.1], spine: [0.12, 0.2, 0], chest: [0.06, 0.08, 0], root: [0, 0, 0.08], lFoot: [0.02, 0, 0.14], rFoot: [0.05, 0, -0.08], head: [0.04, -0.1, 0], lArm: [-1.52, 0.1, 0.12], rArm: [-1.52, -0.1, 0.12], lElbow: [-0.05, 0, 0], rElbow: [-0.05, 0, 0], lHand: [-1.4, 0.04, 0], rHand: [-1.4, -0.04, 0] }],
        [1.25, P({}, IDLES.pockets(0))],
      ],
      REST,
    ),
  },
  featherShot: {
    // Fierce Wings — hover, snap the wings open, fire a red feather volley.
    hit: 0.58,
    hits: [0.34, 0.46, 0.58],
    zone: 'mid',
    release: 0.28,
    ranged: true,
    fx: 'feather',
    clip: clip(
      [
        [0, P({}, IDLES.wingHover(0))],
        [0.14, { root: [0, 0.24, -0.04], hipY: -0.04, hips: [0, -0.25, 0], spine: [-0.12, 0.2, 0], chest: [-0.06, 0.1, 0], lFoot: [0.02, 0.05, 0.02], rFoot: [0.03, 0.06, -0.04], lArm: [-0.4, 0, 0.85], rArm: [-0.4, 0, 0.85], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0], head: [-0.1, -0.2, 0], flap: 0.15 }],
        [0.28, { root: [0, 0.28, -0.02], hips: [0, 0.15, 0], spine: [-0.05, -0.15, 0], chest: [0.05, -0.08, 0], lArm: [-1.2, 0, 1.15], rArm: [-1.2, 0, 1.15], lElbow: [-0.1, 0, 0], rElbow: [-0.1, 0, 0], head: [0.05, -0.25, 0], flap: 1.15 }],
        [0.4, { root: [0, 0.26, 0], spine: [-0.08, -0.1, 0], lArm: [-1.05, 0.1, 1.05], rArm: [-1.05, -0.1, 1.05], flap: 0.95 }],
        [0.52, { root: [0, 0.3, -0.03], spine: [-0.02, -0.18, 0], lArm: [-1.25, -0.05, 1.2], rArm: [-1.25, 0.05, 1.2], lElbow: [0, 0, 0], rElbow: [0, 0, 0], flap: 1.25 }],
        [0.78, { root: [0, 0.24, 0], spine: [-0.06, 0.05, 0], lArm: [-0.6, 0, 0.7], rArm: [-0.35, -0.9, 0.7], lElbow: [-0.4, 0, 0], rElbow: [-1.4, 0, 0], flap: 0.55 }],
        [1.1, P({}, IDLES.wingHover(0))],
      ],
      REST,
    ),
  },
  micSwing: {
    hit: 0.48,
    release: 0.48,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({}, IDLES.darkIdol(0))],
        [0.2, { root: [0, 0, 0.15], hipY: -0.06, hips: [0, -0.6, 0], spine: [0.05, 0.5, 0], rArm: [-1.3, 0, 1.5], rElbow: [-0.2, 0, 0], rHand: [0, 0, -1.2], lArm: [-0.8, 0, 0.6] }],
        [0.48, { rootRot: [0, -PI * 2, 0], root: [0, 0, 0.32], hipY: -0.1, hips: [0, 0.4, 0], spine: [0.1, -0.6, 0], lFoot: [0.03, 0, 0.16], rArm: [-1.5, 1.0, 0.4], rElbow: [-0.1, 0, 0], rHand: [0, 0, -1.2], lArm: [0.3, 0, 1.0] }],
        [0.75, { rootRot: [0, -PI * 2, 0], root: [0, 0, 0.3], hipY: -0.08, hips: [0, 0.4, 0], spine: [0.1, -0.5, 0], lFoot: [0.03, 0, 0.14], rArm: [-1.5, 1.0, 0.4], rElbow: [-0.1, 0, 0], rHand: [0, 0, -1.2], lArm: [0.3, 0, 1.0] }],
        [1.05, P({ rootRot: [0, -PI * 2, 0] }, IDLES.darkIdol(0))],
      ],
      REST,
    ),
  },
  gravitySlam: {
    hit: 0.6,
    release: 0.3,
    ranged: true,
    fx: 'gravity',
    clip: clip(
      [
        [0, P({}, IDLES.lordly(0))],
        [0.3, { lFoot: [0.06, 0, 0.04], rFoot: [0.06, 0, -0.03], spine: [-0.1, 0, 0], chest: [-0.1, 0, 0], head: [-0.15, 0, 0], lArm: [-2.6, 0, 0.3], lElbow: [-0.2, 0, 0], lHand: [-0.6, 0, -0.9], rArm: [0.3, 0.8, 0.12], rElbow: [-1.3, 0, 0] }],
        [0.6, { hipY: -0.08, lFoot: [0.07, 0, 0.08], rFoot: [0.06, 0, -0.05], spine: [0.3, 0, 0], head: [0.1, 0, 0], lArm: [-1.0, 0, 0.3], lElbow: [-0.3, 0, 0], lHand: [0.8, 0, 0], rArm: [0.3, 0.8, 0.12], rElbow: [-1.3, 0, 0] }],
        [0.9, { hipY: -0.08, lFoot: [0.07, 0, 0.08], rFoot: [0.06, 0, -0.05], spine: [0.28, 0, 0], lArm: [-1.0, 0, 0.3], lElbow: [-0.3, 0, 0], lHand: [0.8, 0, 0], rArm: [0.3, 0.8, 0.12], rElbow: [-1.3, 0, 0] }],
        [1.15, P({}, IDLES.lordly(0))],
      ],
      REST,
    ),
  },
  iaido: {
    hit: 0.24,
    release: 0.24,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({ prop: 0 }, IDLES.iaido(0))],
        [0.16, P({ prop: 0, blink: 0, hipY: -0.16, root: [0, 0, 0.05] }, IDLES.iaido(0))],
        [0.2, { prop: 1, hipY: -0.18, root: [0, 0, 0.38], lFoot: [0.04, 0, 0.26], rFoot: [0.06, 0, -0.14], hips: [0.1, 0.3, 0], spine: [0.25, -0.5, 0], rArm: [-1.5, 0.6, 1.2], rElbow: [-0.1, 0, 0], rHand: [0, 0, 0.3], lArm: [0.1, -0.8, 0.5], lElbow: [-1.2, 0, 0] }],
        [0.7, { prop: 1, hipY: -0.18, root: [0, 0, 0.38], lFoot: [0.04, 0, 0.26], rFoot: [0.06, 0, -0.14], hips: [0.1, 0.3, 0], spine: [0.25, -0.5, 0], rArm: [-1.45, 0.6, 1.25], rElbow: [-0.1, 0, 0], rHand: [0, 0, 0.3], lArm: [0.1, -0.8, 0.5], lElbow: [-1.2, 0, 0], blink: 1 }],
        [0.95, { prop: 1, hipY: -0.1, root: [0, 0, 0.3], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.1], spine: [0.1, 0.1, 0], rArm: [-1.0, -0.9, 0.4], rElbow: [-1.4, 0, 0], lArm: [-0.25, -0.8, 0.4], lElbow: [-1.2, 0, 0], blink: 1 }],
        [1.05, P({ prop: 0, root: [0, 0, 0.2] }, IDLES.iaido(0))],
        [1.3, P({ prop: 0 }, IDLES.iaido(0))],
      ],
      REST,
    ),
  },
  senbonzakura: {
    // Draw → diagonal cut; blade scatters into flowing sakura petals.
    hit: 0.28,
    hits: [0.22, 0.28],
    zone: 'high',
    release: 0.22,
    ranged: false,
    fx: 'sakura',
    clip: clip(
      [
        [0, P({ prop: 0 }, IDLES.iaido(0))],
        [0.14, P({ prop: 0, blink: 0, hipY: -0.16, root: [0, 0, 0.04], spine: [0.2, 0.35, 0] }, IDLES.iaido(0))],
        [0.22, { prop: 1, hipY: -0.18, root: [0, 0, 0.36], lFoot: [0.04, 0, 0.24], rFoot: [0.06, 0, -0.14], hips: [0.1, 0.35, 0], spine: [0.28, -0.55, 0], chest: [0.08, -0.2, 0], rArm: [-1.55, 0.65, 1.15], rElbow: [-0.08, 0, 0], rHand: [0, 0, 0.35], lArm: [0.15, -0.75, 0.55], lElbow: [-1.15, 0, 0] }],
        [0.28, { prop: 1, hipY: -0.18, root: [0, 0, 0.4], lFoot: [0.04, 0, 0.26], rFoot: [0.06, 0, -0.14], hips: [0.12, 0.4, 0], spine: [0.3, 0.45, 0], chest: [0.1, 0.15, 0], head: [0.05, -0.1, 0], rArm: [-1.7, -0.35, 1.2], rElbow: [-0.05, 0, 0], rHand: [0, 0, 0.4], lArm: [0.1, -0.7, 0.6], lElbow: [-1.1, 0, 0] }, 'snap'],
        [0.55, { prop: 1, hipY: -0.16, root: [0, 0, 0.36], lFoot: [0.04, 0, 0.22], rFoot: [0.06, 0, -0.12], spine: [0.22, 0.3, 0], rArm: [-1.5, -0.25, 1.05], rElbow: [-0.15, 0, 0], rHand: [0, 0, 0.3], lArm: [0.05, -0.75, 0.5], lElbow: [-1.15, 0, 0], blink: 1 }],
        [0.85, { prop: 1, hipY: -0.12, root: [0, 0, 0.28], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.1], spine: [0.12, 0.15, 0], rArm: [-1.05, -0.85, 0.45], rElbow: [-1.35, 0, 0], lArm: [-0.2, -0.8, 0.4], lElbow: [-1.2, 0, 0], blink: 1 }],
        [1.05, P({ prop: 0, root: [0, 0, 0.18] }, IDLES.iaido(0))],
        [1.25, P({ prop: 0 }, IDLES.iaido(0))],
      ],
      REST,
    ),
  },
  tectonicRam: {
    // Harden → Unbreakable crouch → rocky-fist charge into the pad.
    hit: 0.52,
    release: 0.52,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.armsCrossed(0))],
        // Flex — body hardens, fists clench into stone.
        [0.14, { hipY: -0.16, spine: [0.28, 0, 0], chest: [0.12, 0, 0], head: [-0.25, 0, 0], lArm: [-0.9, -0.7, 0.75], rArm: [-0.9, 0.7, 0.75], lElbow: [-1.55, 0, 0], rElbow: [-1.55, 0, 0], lHand: [0.7, 0, 0], rHand: [0.7, 0, 0], lFoot: [0.1, 0, 0.1], rFoot: [0.1, 0, -0.08] }],
        // Drop low — living armor stance.
        [0.28, { hipY: -0.22, root: [0, 0, -0.04], spine: [0.5, 0, 0], chest: [0.18, 0, 0], head: [-0.15, 0, 0], lArm: [-0.35, -0.15, 0.85], rArm: [-0.35, 0.15, 0.85], lElbow: [-0.55, 0, 0], rElbow: [-0.55, 0, 0], lHand: [0.4, 0, 0], rHand: [0.4, 0, 0], lFoot: [0.12, 0, 0.12], rFoot: [0.12, 0, -0.1] }],
        // Drive forward as a battering ram — both rocky fists leading.
        [0.4, { hipY: -0.14, root: [0, 0, 0.22], hips: [0.1, 0.25, 0], spine: [0.45, 0.1, 0], chest: [0.15, 0, 0], lFoot: [0.08, 0, 0.18], rFoot: [0.1, 0, -0.14], lArm: [-1.35, -0.1, 0.2], rArm: [-1.35, 0.1, 0.2], lElbow: [-0.15, 0, 0], rElbow: [-0.15, 0, 0], lHand: [-0.5, 0, 0], rHand: [-0.5, 0, 0], head: [0.05, 0, 0] }],
        // Impact — Unbreakable cross.
        [0.52, { hipY: -0.18, root: [0, 0, 0.42], hips: [0.12, 0.55, 0], spine: [0.3, -0.45, 0], chest: [0.1, -0.12, 0], lFoot: [0.06, 0, 0.2], rFoot: [0.08, 0, -0.14], rArm: [-1.6, 0, 0.02], rElbow: [0, 0, 0], rHand: [-0.55, 0, 0], lArm: [0.4, -0.2, 0.55], lElbow: [-1.4, 0, 0], head: [0.08, -0.2, 0] }, 'snap'],
        [0.72, { root: [0, 0, 0.38], hipY: -0.14, hips: [0.08, 0.3, 0], spine: [0.22, -0.25, 0], lFoot: [0.06, 0, 0.16], rFoot: [0.07, 0, -0.1], rArm: [-1.35, 0, 0.15], rElbow: [-0.2, 0, 0], lArm: [0.3, -0.15, 0.55], lElbow: [-1.15, 0, 0] }],
        [1.05, P({}, IDLES.armsCrossed(0))],
      ],
      REST,
    ),
  },
  railShot: {
    // Vector lock → hypersonic vanish → redirected kinetic punch.
    hit: 0.36,
    release: 0.36,
    ranged: false,
    fx: 'speed',
    clip: clip(
      [
        [0, P({}, IDLES.cocky(0))],
        // Arms out — calculate / reflect stance.
        [0.1, { hipY: -0.1, spine: [0.15, 0, 0], chest: [0.05, 0, 0], lArm: [-0.2, 0, 1.35], rArm: [-0.2, 0, 1.35], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], lHand: [0.4, 0, 0], rHand: [0.4, 0, 0], head: [-0.2, 0.1, 0] }],
        // Fire as a redirected vector streak.
        [0.14, { vis: 0, root: [0, 0.01, 0.1], hipY: -0.06 }],
        [0.3, { vis: 0, root: [0, 0.01, 0.42] }],
        // Rematerialize mid-strike — kinetic slug punch.
        [0.36, { vis: 1, root: [0, 0, 0.42], hipY: -0.12, hips: [0, 0.55, 0], spine: [0.12, -0.55, 0], chest: [0, -0.15, 0], lFoot: [0.03, 0, 0.18], rFoot: [0.05, 0, -0.14], rArm: [-1.55, 0, 0.04], rElbow: [0, 0, 0], rHand: [-0.4, 0, 0], lArm: [0.35, 0, 0.6], lElbow: [-1.3, 0, 0], head: [0.05, -0.25, 0] }],
        [0.58, { root: [0, 0, 0.4], hipY: -0.1, hips: [0, 0.35, 0], spine: [0.1, -0.35, 0], lFoot: [0.03, 0, 0.16], rFoot: [0.04, 0, -0.1], rArm: [-1.35, 0, 0.12], rElbow: [-0.15, 0, 0], lArm: [0.3, 0, 0.65], lElbow: [-1.1, 0, 0] }],
        [0.9, P({}, IDLES.cocky(0))],
      ],
      REST,
    ),
  },
  dustBurst: {
    hit: 0.5,
    release: 0.5,
    ranged: false,
    fx: 'sparkle',
    clip: clip(
      [
        [0, P({}, IDLES.flutter(0))],
        [0.25, { root: [0, 0.2, 0.2], rootRot: [0, PI, 0], lFoot: [0, 0.05, 0.0], rFoot: [0, 0.08, -0.04], lToe: 0.6, rToe: 0.6, lArm: [-0.3, 0, 0.4], rArm: [-0.3, 0, 0.4], lElbow: [-1.5, 0, 0], rElbow: [-1.5, 0, 0], flap: 0.1 }],
        [0.5, { root: [0, 0.22, 0.32], rootRot: [0, PI * 2, 0], lFoot: [0, 0.05, 0.0], rFoot: [0, 0.08, -0.04], lToe: 0.6, rToe: 0.6, spine: [-0.15, 0, 0], lArm: [-1.4, 0, 1.4], rArm: [-1.4, 0, 1.4], lElbow: [0, 0, 0], rElbow: [0, 0, 0], flap: 1.3 }],
        [0.8, { root: [0, 0.18, 0.3], rootRot: [0, PI * 2, 0], lFoot: [0, 0.05, 0.0], rFoot: [0, 0.08, -0.04], lToe: 0.6, rToe: 0.6, lArm: [-1.3, 0, 1.3], rArm: [-1.3, 0, 1.3], flap: 1.1 }],
        [1.05, P({ rootRot: [0, PI * 2, 0] }, IDLES.flutter(0))],
      ],
      REST,
    ),
  },
  boogieWoogie: {
    // Clap → Boogie Woogie swap behind the foe → blue-flash smash into their back.
    hit: 0.62,
    zone: 'mid',
    release: 0.62,
    ranged: false,
    fx: 'phase',
    clip: clip(
      [
        [0, P({}, IDLES.clapReady(0))],
        // Wind-up — palms out for the clap.
        [0.12, { hipY: -0.14, spine: [0.2, 0, 0], chest: [0.1, 0, 0], lArm: [-1.0, -0.95, 0.5], rArm: [-1.0, 0.95, 0.5], lElbow: [-1.45, 0, 0], rElbow: [-1.45, 0, 0], head: [-0.15, 0, 0] }],
        // CLAP.
        [0.22, { hipY: -0.16, spine: [0.32, 0, 0], lArm: [-0.8, -0.12, 0.32], rArm: [-0.8, 0.12, 0.32], lElbow: [-1.95, 0, 0], rElbow: [-1.95, 0, 0], lHand: [0.55, 0, 0], rHand: [0.55, 0, 0] }],
        // Vanish on the clap — swap flash.
        [0.28, { vis: 0, root: [0, 0.04, 0.12], hipY: -0.08 }],
        // Ghost past the foe, turning to face their back.
        [0.44, { vis: 0, root: [0, 0.06, 0.92], rootRot: [0, PI, 0] }],
        // Rematerialize BEHIND — right hand cocked for the smash.
        [0.52, { vis: 1, root: [0, 0, 0.92], rootRot: [0, PI, 0], hipY: -0.16, hips: [0, -0.55, 0], spine: [0.12, 0.4, 0], chest: [0, 0.18, 0], lFoot: [0.05, 0, 0.14], rFoot: [0.06, 0, -0.14], rArm: [0.55, 0, 0.5], rElbow: [-1.9, 0, 0], lArm: [-0.85, 0, 0.4], lElbow: [-1.6, 0, 0], head: [0.05, 0.2, 0] }, 'snap'],
        // Crushing smash into their back.
        [0.62, { root: [0, 0, 0.88], rootRot: [0, PI, 0], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.22, -0.5, 0], chest: [0, -0.18, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.06, 0, -0.12], rArm: [-1.55, 0, 0.04], rElbow: [0, 0, 0], rHand: [-0.45, 0, 0], lArm: [0.35, 0, 0.55], lElbow: [-1.35, 0, 0], head: [0.05, -0.25, 0] }, 'snap'],
        [0.82, { root: [0, 0, 0.86], rootRot: [0, PI, 0], hipY: -0.12, hips: [0, 0.3, 0], spine: [0.15, -0.3, 0], lFoot: [0.05, 0, 0.14], rFoot: [0.05, 0, -0.1], rArm: [-1.35, 0, 0.12], rElbow: [-0.2, 0, 0], lArm: [0.3, 0, 0.55], lElbow: [-1.15, 0, 0] }],
        // Unwind facing forward again.
        [1.1, P({ rootRot: [0, TAU, 0] }, IDLES.clapReady(0))],
      ],
      REST,
    ),
  },
  flyingRaijin: {
    // Flying Thunder God: flash-throw marked kunai → wait for land → appear above → Rasengan slam.
    hit: 0.88,
    zone: 'high',
    release: 0.12,
    ranged: false,
    fx: 'rasengan',
    // Kunai lands as he rematerializes — no blink until the mark is set.
    throwFx: { kind: 'kunai', release: 0.12, arrive: 0.48 },
    clip: clip(
      [
        [0, P({}, IDLES.ninjaCrouch(0))],
        // Wind-up — kunai cocked behind the ear.
        [0.08, { hipY: -0.18, hips: [0.2, -0.4, 0], spine: [0.22, -0.4, 0], chest: [0, -0.18, 0], rArm: [-0.45, 0.55, 0.55], rElbow: [-1.7, 0, 0], lArm: [0.3, 0, 0.55], head: [0.05, -0.3, 0] }],
        // Flash-release — arm snaps forward; dagger is already gone.
        [0.12, { hipY: -0.12, hips: [0.12, -0.15, 0], spine: [0.1, -0.5, 0], rArm: [-1.6, 0.1, 0], rElbow: [0, 0, 0], rHand: [-0.55, 0, 0.4], lArm: [0.35, 0, 0.55], head: [0.05, -0.4, 0] }, 'snap'],
        // Stay planted while the marked kunai flies — do NOT teleport yet.
        [0.28, { hipY: -0.1, hips: [0.1, -0.1, 0], spine: [0.08, -0.35, 0], rArm: [-1.4, 0.05, 0.12], rElbow: [-0.25, 0, 0], lArm: [0.3, 0, 0.55], head: [0.02, -0.25, 0] }],
        [0.42, { hipY: -0.1, hips: [0.08, -0.08, 0], spine: [0.1, -0.25, 0], rArm: [-1.25, 0.08, 0.18], rElbow: [-0.4, 0, 0], lArm: [-0.35, 0, 0.5], lElbow: [-1.15, 0, 0], head: [0, -0.18, 0] }],
        // Kunai lands — blink off, then rematerialize ABOVE the mark.
        [0.48, { vis: 0, root: [0, 0.08, 0.08], hipY: -0.06, rArm: [-1.5, 0, 0], rElbow: [0, 0, 0] }],
        [0.5, { vis: 1, root: [0, 0.88, 0.38], rootRot: [0.35, 0, 0], hipY: 0, hips: [0.05, 0.2, 0], spine: [-0.15, -0.2, 0], chest: [-0.1, 0, 0], lFoot: [0.02, 0.18, 0.06], rFoot: [0.02, 0.16, -0.04], rArm: [-2.85, 0.15, 0.2], rElbow: [-0.15, 0, 0], rHand: [-0.3, 0, 0.2], lArm: [-0.7, 0, 0.85], lElbow: [-0.4, 0, 0], head: [-0.35, -0.1, 0] }, 'snap'],
        // Hold the drop — Rasengan cocked high.
        [0.68, { root: [0, 0.82, 0.4], rootRot: [0.4, 0, 0], hipY: 0, spine: [-0.05, -0.15, 0], chest: [-0.08, 0, 0], lFoot: [0.02, 0.16, 0.05], rFoot: [0.02, 0.14, -0.04], rArm: [-2.95, 0.1, 0.12], rElbow: [-0.05, 0, 0], rHand: [-0.2, 0, 0.15], lArm: [-0.55, 0, 0.9], lElbow: [-0.3, 0, 0], head: [-0.4, -0.05, 0] }],
        // Rasengan drives straight down into them — lethal.
        [0.88, { root: [0, 0.02, 0.42], rootRot: [0, 0, 0], hipY: -0.28, hips: [0.15, 0.35, 0], spine: [0.65, -0.25, 0], chest: [0.2, -0.1, 0], lFoot: [0.05, 0, 0.18], rFoot: [0.06, 0.02, -0.16], rArm: [-1.35, 0, 0.05], rElbow: [-0.05, 0, 0], rHand: [-0.85, 0, 0], lArm: [0.45, 0, 0.95], lElbow: [-0.25, 0, 0], head: [-0.45, -0.15, 0] }, 'snap'],
        [1.08, { root: [0, 0, 0.4], hipY: -0.24, hips: [0.18, 0.2, 0], spine: [0.5, -0.15, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.05, 0, -0.12], rArm: [-1.2, 0, 0.15], rElbow: [-0.2, 0, 0], lArm: [0.3, 0, 0.85], lElbow: [-0.4, 0, 0], head: [-0.3, -0.1, 0] }],
        [1.3, P({}, IDLES.ninjaCrouch(0))],
      ],
      REST,
    ),
  },
  wristShot: {
    // Dual wrist-guns lock → fire tracers down the diagonal.
    hit: 0.62,
    zone: 'mid',
    release: 0.28,
    ranged: true,
    fx: 'bullet',
    clip: clip(
      [
        [0, P({}, IDLES.marksman(0))],
        [0.14, { hipY: -0.1, hips: [0, -0.25, 0], spine: [0.1, -0.2, 0], chest: [0.05, -0.1, 0], lArm: [-0.6, -0.2, 0.7], rArm: [-0.6, 0.2, 0.7], lElbow: [-1.5, 0, 0], rElbow: [-1.5, 0, 0], head: [-0.1, -0.15, 0] }],
        [0.28, { hipY: -0.12, root: [0, 0, -0.04], hips: [0, 0.15, 0], spine: [0.18, -0.1, 0], lFoot: [0.06, 0, 0.1], rFoot: [0.06, 0, -0.08], lArm: [-1.55, 0, 0.06], rArm: [-1.55, 0, 0.06], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-0.2, 0, 0], rHand: [-0.2, 0, 0], head: [0.05, 0, 0] }],
        [0.4, { hipY: -0.1, root: [0, 0, -0.02], spine: [0.12, -0.08, 0], lArm: [-1.45, 0.08, 0.1], rArm: [-1.45, -0.08, 0.1], lElbow: [-0.05, 0, 0], rElbow: [-0.05, 0, 0] }],
        [0.52, { hipY: -0.12, root: [0, 0, -0.05], spine: [0.2, -0.12, 0], lArm: [-1.55, -0.05, 0.04], rArm: [-1.55, 0.05, 0.04], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-0.25, 0, 0], rHand: [-0.25, 0, 0] }],
        [0.85, { hipY: -0.1, root: [0, 0, -0.03], spine: [0.15, -0.08, 0], lArm: [-1.5, 0, 0.08], rArm: [-1.5, 0, 0.08], lElbow: [-0.05, 0, 0], rElbow: [-0.05, 0, 0] }],
        [1.1, P({}, IDLES.marksman(0))],
      ],
      REST,
    ),
  },
  ratioSlice: {
    // Measure the weak point → cleaver comes down on the critical line.
    hit: 0.42,
    hits: [0.28, 0.42],
    zone: 'high',
    release: 0.42,
    ranged: false,
    fx: 'ratioSlash',
    clip: clip(
      [
        [0, P({}, IDLES.ratioReady(0))],
        [0.14, { hipY: -0.1, root: [0, 0, 0.06], spine: [0.15, 0.45, 0], chest: [0.05, 0.2, 0], head: [-0.1, 0.2, 0], rArm: [-2.4, 0.2, 0.85], rElbow: [-0.5, 0, 0], rHand: [0, 0, 0.35], lArm: [-0.6, 0, 0.55], lElbow: [-1.2, 0, 0], blink: 0 }],
        [0.28, { hipY: -0.12, root: [0, 0, 0.28], lFoot: [0.04, 0, 0.18], rFoot: [0.05, 0, -0.12], hips: [0.1, -0.35, 0], spine: [0.2, -0.55, 0], chest: [0.1, -0.25, 0], rArm: [-1.35, 0.55, -0.15], rElbow: [-0.15, 0, 0], rHand: [0, 0, 0.5], lArm: [0.35, 0, 0.7], lElbow: [-0.4, 0, 0] }],
        [0.42, { hipY: -0.14, root: [0, 0, 0.36], lFoot: [0.04, 0, 0.22], rFoot: [0.06, 0, -0.14], hips: [0.12, 0.45, 0], spine: [0.25, 0.5, 0], chest: [0.08, 0.2, 0], head: [0.05, -0.15, 0], rArm: [-1.7, -0.35, 1.15], rElbow: [-0.1, 0, 0], rHand: [0, 0, 0.55], lArm: [-0.4, 0, 0.85], lElbow: [-0.5, 0, 0], blink: 1 }],
        [0.72, { hipY: -0.12, root: [0, 0, 0.32], lFoot: [0.04, 0, 0.18], rFoot: [0.05, 0, -0.12], spine: [0.18, 0.35, 0], rArm: [-1.55, -0.25, 1.0], rElbow: [-0.2, 0, 0], rHand: [0, 0, 0.45], lArm: [-0.3, 0, 0.7] }],
        [1.05, P({}, IDLES.ratioReady(0))],
      ],
      REST,
    ),
  },
  gatesOfBabylon: {
    // Fly in close → open golden gates → rain random noble phantasms.
    hit: 0.72,
    hits: [0.42, 0.55, 0.72],
    zone: 'mid',
    release: 0.28,
    ranged: false,
    fx: 'babylon',
    clip: clip(
      [
        [0, P({}, IDLES.kingHover(0))],
        // Still hovering — dismissive glance, gates begin to bloom.
        [0.18, { root: [0, 0.24, -0.02], hips: [0, -0.15, 0], spine: [-0.08, 0.2, 0], chest: [-0.04, 0.1, 0], head: [-0.1, -0.25, 0], lArm: [-0.55, -1.3, 0.35], lElbow: [-1.95, 0, 0], rArm: [-0.42, -1.3, 0.35], rElbow: [-1.95, 0, 0], lFoot: [0.02, 0.05, 0.03], rFoot: [0.03, 0.06, -0.04], lToe: 0.55, rToe: 0.6 }],
        // One hand flicks open — portals roar.
        [0.32, { root: [0, 0.26, 0], hips: [0, 0.1, 0], spine: [-0.04, -0.15, 0], chest: [0.04, -0.08, 0], head: [0.05, -0.3, 0], lArm: [-0.5, -1.2, 0.4], lElbow: [-1.85, 0, 0], rArm: [-1.35, 0.2, 0.85], rElbow: [-0.15, 0, 0], rHand: [-0.4, 0, 0], lFoot: [0.02, 0.05, 0.03], rFoot: [0.03, 0.06, -0.04], lToe: 0.55, rToe: 0.6 }],
        // Arms wide — treasury emptying, blades already airborne.
        [0.48, { root: [0, 0.28, 0.02], spine: [-0.06, -0.1, 0], chest: [0.02, -0.05, 0], head: [-0.05, -0.2, 0], lArm: [-1.15, 0.15, 1.05], rArm: [-1.15, -0.15, 1.05], lElbow: [-0.1, 0, 0], rElbow: [-0.1, 0, 0], lHand: [-0.3, 0, 0], rHand: [-0.3, 0, 0], lFoot: [0.02, 0.06, 0.02], rFoot: [0.03, 0.07, -0.04], lToe: 0.55, rToe: 0.6 }],
        // Hold the rain — smug smile through the slaughter.
        [0.72, { root: [0, 0.26, 0.02], spine: [-0.05, 0.05, 0], chest: [-0.02, 0.04, 0], head: [-0.08, -0.15, 0], lArm: [-0.85, -0.4, 0.75], rArm: [-0.55, -1.15, 0.55], lElbow: [-0.5, 0, 0], rElbow: [-1.7, 0, 0], lFoot: [0.02, 0.05, 0.03], rFoot: [0.03, 0.06, -0.04], lToe: 0.55, rToe: 0.6 }],
        [1.05, P({}, IDLES.kingHover(0))],
      ],
      REST,
    ),
  },
  overhaul: {
    // Slow step in → gloved palm to the chest → everything in front comes apart.
    hit: 0.62,
    zone: 'mid',
    release: 0.62,
    ranged: false,
    fx: 'overhaul',
    clip: clip(
      [
        [0, P({}, IDLES.plagueReady(0))],
        // Adjust glove, cold stare — measured wind-up.
        [0.22, { hipY: -0.1, root: [0, 0, 0.04], hips: [0.05, -0.2, 0], spine: [0.12, 0.25, 0], chest: [0.06, 0.1, 0], head: [-0.15, 0.15, 0], lArm: [-0.7, 0.2, 0.55], lElbow: [-1.4, 0, 0], lHand: [0.3, 0, 0.2], rArm: [0.15, 0.55, 0.25], rElbow: [-1.55, 0, 0], lFoot: [0.05, 0, 0.08], rFoot: [0.06, 0, -0.06] }],
        // Reach — white glove drives straight forward into the opponent.
        [0.48, { hipY: -0.12, root: [0, 0, 0.22], hips: [0.08, 0.35, 0], spine: [0.22, -0.35, 0], chest: [0.12, -0.15, 0], head: [0.05, -0.1, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.07, 0, -0.12], lArm: [-1.55, 0.05, 0.08], lElbow: [-0.12, 0, 0], lHand: [-0.55, 0, 0], rArm: [0.35, 0.45, 0.45], rElbow: [-1.35, 0, 0] }],
        // Contact — Overhaul fires; palm flat on the torso.
        [0.62, { hipY: -0.14, root: [0, 0, 0.4], hips: [0.1, 0.45, 0], spine: [0.28, -0.4, 0], chest: [0.14, -0.18, 0], head: [0.08, -0.12, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.08, 0, -0.14], lArm: [-1.72, 0, 0.02], lElbow: [0, 0, 0], lHand: [-0.7, 0, 0], rArm: [0.4, 0.4, 0.5], rElbow: [-1.25, 0, 0] }, 'snap'],
        // Hold the touch a beat while they disassemble.
        [0.88, { hipY: -0.12, root: [0, 0, 0.38], hips: [0.08, 0.35, 0], spine: [0.22, -0.3, 0], chest: [0.1, -0.12, 0], head: [0.05, -0.08, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.07, 0, -0.12], lArm: [-1.6, 0, 0.08], lElbow: [-0.08, 0, 0], lHand: [-0.55, 0, 0], rArm: [0.3, 0.45, 0.45], rElbow: [-1.35, 0, 0] }],
        [1.2, P({}, IDLES.plagueReady(0))],
      ],
      REST,
    ),
  },
  ryujinJakka: {
    // Plant the staff → raise it → unleash a block-consuming inferno on the front square.
    hit: 0.78,
    zone: 'mid',
    release: 0.42,
    ranged: true,
    fx: 'inferno',
    clip: clip(
      [
        [0, P({}, IDLES.staffLean(0))],
        [0.22, { hipY: -0.12, lFoot: [0.1, 0, 0.06], rFoot: [0.1, 0, -0.06], hips: [0.04, 0.1, 0], spine: [0.18, 0.08, 0], chest: [0.1, 0.05, 0], head: [-0.15, 0.1, 0], lArm: [-1.05, 0.2, 0.35], lElbow: [-1.2, 0, 0], rArm: [-1.05, -0.2, 0.35], rElbow: [-1.2, 0, 0], lHand: [-0.5, 0.1, 0.1], rHand: [-0.5, -0.1, 0.1] }],
        [0.42, { hipY: -0.06, root: [0, 0, 0.06], lFoot: [0.08, 0, 0.1], rFoot: [0.09, 0, -0.08], hips: [0.05, -0.15, 0], spine: [-0.2, 0.12, 0], chest: [-0.12, 0.08, 0], head: [-0.25, 0.05, 0], lArm: [-2.55, 0.25, 0.55], lElbow: [-0.35, 0, 0], rArm: [-2.55, -0.25, 0.55], rElbow: [-0.35, 0, 0], lHand: [-0.2, 0.15, 0], rHand: [-0.2, -0.15, 0] }],
        [0.78, { hipY: -0.14, root: [0, 0, 0.22], lFoot: [0.08, 0, 0.18], rFoot: [0.1, 0, -0.1], hips: [0.08, 0.35, 0], spine: [0.35, -0.25, 0], chest: [0.18, -0.12, 0], head: [0.1, -0.2, 0], lArm: [-1.55, 0.15, 0.2], lElbow: [-0.1, 0, 0], rArm: [-1.55, -0.15, 0.2], rElbow: [-0.1, 0, 0], lHand: [-1.35, 0.08, 0], rHand: [-1.35, -0.08, 0], blink: 0 }],
        [1.15, { hipY: -0.12, root: [0, 0, 0.18], lFoot: [0.08, 0, 0.14], rFoot: [0.09, 0, -0.08], spine: [0.28, -0.18, 0], chest: [0.12, -0.08, 0], head: [0.05, -0.15, 0], lArm: [-1.45, 0.12, 0.25], rArm: [-1.45, -0.12, 0.25], lElbow: [-0.15, 0, 0], rElbow: [-0.15, 0, 0], lHand: [-1.2, 0.06, 0], rHand: [-1.2, -0.06, 0], blink: 1 }],
        [1.45, P({}, IDLES.staffLean(0))],
      ],
      REST,
    ),
  },
  emberFlick: {
    // Night Escanor — timid palm flick that coughs out a small tongue of fire.
    hit: 0.42,
    zone: 'mid',
    release: 0.42,
    ranged: false,
    fx: 'fire',
    clip: clip(
      [
        [0, P({}, IDLES.shy(0))],
        [0.16, { hipY: -0.04, lFoot: [-0.02, 0, 0.02], rFoot: [-0.02, 0, 0], spine: [0.08, 0.12, -0.06], chest: [0.04, 0.08, 0], head: [0.28, 0.2, 0.1], lArm: [-0.35, -0.35, 0.12], lElbow: [-1.0, 0, 0], rArm: [-0.55, 0.15, 0.35], rElbow: [-1.35, 0, 0], rHand: [-0.4, 0, 0.2] }],
        [0.42, { hipY: -0.06, root: [0, 0, 0.1], lFoot: [0.02, 0, 0.08], spine: [0.12, -0.15, 0], chest: [0.06, -0.08, 0], head: [0.1, -0.1, 0], lArm: [-0.5, -0.2, 0.2], lElbow: [-1.1, 0, 0], rArm: [-1.45, 0, 0.15], rElbow: [-0.15, 0, 0], rHand: [-1.1, 0, 0] }, 'snap'],
        [0.62, { hipY: -0.05, root: [0, 0, 0.08], spine: [0.1, -0.1, 0], head: [0.18, 0.05, 0.08], lArm: [-0.4, -0.35, 0.15], rArm: [-1.2, 0, 0.2], rElbow: [-0.4, 0, 0], rHand: [-0.7, 0, 0] }],
        [0.9, P({}, IDLES.shy(0))],
      ],
      REST,
    ),
  },
  cruelSun: {
    // Day Escanor — hoist Rhitta, then slam a Cruel Sun that eats the pad in fire.
    hit: 0.82,
    zone: 'mid',
    release: 0.48,
    ranged: true,
    fx: 'inferno',
    clip: clip(
      [
        [0, P({}, IDLES.sunshineStance(0))],
        [0.28, { hipY: -0.08, lFoot: [0.1, 0, 0.08], rFoot: [0.1, 0, -0.06], hips: [0.05, 0.15, 0], spine: [0.15, 0.12, 0], chest: [0.08, 0.08, 0], head: [-0.1, 0.15, 0], lArm: [-0.6, 0.15, 0.35], lElbow: [-1.0, 0, 0], rArm: [-2.55, 0.35, 0.55], rElbow: [-0.25, 0, 0], rHand: [0.2, 0.15, 0] }],
        [0.48, { hipY: -0.02, root: [0, 0.04, 0.06], lFoot: [0.08, 0, 0.1], rFoot: [0.09, 0, -0.08], hips: [0.04, -0.2, 0], spine: [-0.35, 0.1, 0], chest: [-0.2, 0.08, 0], head: [-0.4, 0.05, 0], lArm: [-1.8, 0.25, 0.5], lElbow: [-0.4, 0, 0], rArm: [-2.9, -0.15, 0.35], rElbow: [-0.15, 0, 0], rHand: [-0.2, -0.1, 0], blink: 0 }],
        [0.82, { hipY: -0.18, root: [0, 0, 0.28], lFoot: [0.1, 0, 0.2], rFoot: [0.12, 0, -0.12], hips: [0.12, 0.4, 0], spine: [0.55, -0.3, 0], chest: [0.28, -0.15, 0], head: [0.2, -0.25, 0], lArm: [-0.5, 0.3, 0.55], lElbow: [-0.8, 0, 0], rArm: [-1.15, -0.2, 0.15], rElbow: [-0.1, 0, 0], rHand: [-1.4, 0, 0] }, 'snap'],
        [1.15, { hipY: -0.14, root: [0, 0, 0.22], lFoot: [0.1, 0, 0.16], rFoot: [0.1, 0, -0.1], spine: [0.4, -0.2, 0], chest: [0.18, -0.1, 0], head: [0.08, -0.15, 0], lArm: [-0.55, 0.2, 0.4], rArm: [-1.25, -0.15, 0.2], rElbow: [-0.2, 0, 0], rHand: [-1.1, 0, 0], blink: 1 }],
        [1.5, P({}, IDLES.sunshineStance(0))],
      ],
      REST,
    ),
  },
  seriousPunch: {
    // Serious Series — crouch, blink onto them, one world-ending straight.
    hit: 0.58,
    zone: 'high',
    release: 0.58,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.focused(0))],
        // Drop into Serious crouch — fists clenched, eyes sharp.
        [0.14, { hipY: -0.2, spine: [0.4, 0, 0], chest: [0.12, 0, 0], head: [-0.2, 0, 0], blink: 0, lArm: [-0.95, -0.2, 0.65], rArm: [-0.95, 0.2, 0.65], lElbow: [-1.65, 0, 0], rElbow: [-1.65, 0, 0], lHand: [0.55, 0, 0], rHand: [0.55, 0, 0], lFoot: [0.08, 0, 0.1], rFoot: [0.08, 0, -0.08] }],
        // Vanish — Serious teleport.
        [0.2, { vis: 0, root: [0, 0.02, 0.08], hipY: -0.12 }],
        [0.38, { vis: 0, root: [0, 0.04, 0.4] }],
        // Rematerialize mid-punch — already driving the right hand.
        [0.46, { vis: 1, root: [0, 0, 0.38], hipY: -0.14, hips: [0, -0.55, 0], spine: [0.15, -0.45, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.12], lArm: [-0.7, 0, 0.4], lElbow: [-1.7, 0, 0], rArm: [0.55, 0, 0.55], rElbow: [-1.95, 0, 0], head: [0.05, -0.25, 0], blink: 0 }],
        // Impact — Serious Punch lands; shockwave rides the fist.
        [0.58, { root: [0, 0, 0.44], hipY: -0.16, hips: [0, 0.6, 0], spine: [0.22, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.07, 0, -0.14], rArm: [-1.6, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.55, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.45, 0, 0], head: [0.08, -0.3, 0], blink: 0 }, 'snap'],
        // Hold the follow-through a beat — air still ringing.
        [0.82, { root: [0, 0, 0.42], hipY: -0.14, hips: [0, 0.45, 0], spine: [0.18, -0.4, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.12], rArm: [-1.5, 0, 0.05], rElbow: [-0.05, 0, 0], rHand: [-0.35, 0, 0], lArm: [0.35, 0, 0.55], lElbow: [-1.3, 0, 0] }],
        [1.1, P({}, IDLES.focused(0))],
      ],
      REST,
    ),
  },
  mobPunch: {
    // Normal Mob — stiff, telegraphed right cross. Physically weak.
    hit: 0.48,
    zone: 'mid',
    release: 0.48,
    ranged: false,
    fx: 'impact',
    clip: clip(
      [
        [0, P({}, IDLES.deadpan(0))],
        [0.22, { hipY: -0.04, hips: [0, -0.25, 0], spine: [0.06, -0.2, 0], chest: [0, -0.1, 0], head: [0.02, -0.1, 0], lArm: [0.1, 0, 0.2], lElbow: [-0.4, 0, 0], rArm: [0.35, 0, 0.45], rElbow: [-1.4, 0, 0], rHand: [0.2, 0, 0], lFoot: [0.02, 0, 0.04], rFoot: [0.03, 0, -0.04] }],
        [0.48, { hipY: -0.06, root: [0, 0, 0.14], hips: [0, 0.3, 0], spine: [0.12, -0.3, 0], chest: [0, -0.1, 0], lFoot: [0.03, 0, 0.1], rFoot: [0.04, 0, -0.08], rArm: [-1.4, 0, 0.08], rElbow: [-0.15, 0, 0], rHand: [-0.2, 0, 0], lArm: [0.25, 0, 0.3], lElbow: [-0.5, 0, 0], head: [0.04, -0.15, 0] }, 'snap'],
        [0.7, { hipY: -0.04, root: [0, 0, 0.1], hips: [0, 0.15, 0], spine: [0.08, -0.15, 0], rArm: [-1.1, 0, 0.15], rElbow: [-0.4, 0, 0], lArm: [0.2, 0, 0.25] }],
        [0.95, P({}, IDLES.deadpan(0))],
      ],
      REST,
    ),
  },
  percentBlast: {
    // ???% — vanish-dash in, palm open, explosive psychic beam tears the pad.
    hit: 0.55,
    hits: [0.28, 0.55],
    zone: 'mid',
    release: 0.32,
    ranged: true,
    fx: 'percentBlast',
    clip: clip(
      [
        [0, P({}, IDLES.percentRage(0))],
        // Aura surge — hair-up float, hands gathering.
        [0.1, { root: [0, 0.18, 0], hipY: -0.02, spine: [-0.2, 0, 0], chest: [-0.1, 0, 0], head: [-0.25, 0, 0], lFoot: [0.03, 0.12, 0.02], rFoot: [0.03, 0.12, -0.02], lToe: 0.6, rToe: 0.6, lArm: [-1.35, 0.4, 0.9], rArm: [-1.35, -0.4, 0.9], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], blink: 0 }],
        // Blink-dash toward them.
        [0.14, { vis: 0, root: [0, 0.2, 0.12] }],
        [0.24, { vis: 0, root: [0, 0.16, 0.34] }],
        // Rematerialize — left palm thrust for the first psychic hit.
        [0.28, { vis: 1, root: [0, 0.08, 0.36], hipY: -0.08, hips: [0, 0.35, 0], spine: [0.2, -0.35, 0], chest: [0.1, -0.15, 0], lFoot: [0.04, 0.04, 0.14], rFoot: [0.05, 0.04, -0.1], lArm: [-1.55, 0, 0.05], lElbow: [0, 0, 0], lHand: [-1.4, 0, 0], rArm: [0.3, 0, 0.55], rElbow: [-1.2, 0, 0], head: [0.05, -0.2, 0] }, 'snap'],
        // Both hands forward — explosive beam.
        [0.55, { root: [0, 0.1, 0.4], hipY: -0.1, hips: [0, 0.2, 0], spine: [0.25, -0.15, 0], chest: [0.12, -0.08, 0], lFoot: [0.04, 0.06, 0.16], rFoot: [0.05, 0.06, -0.1], lToe: 0.4, rToe: 0.4, lArm: [-1.58, 0.08, 0.08], rArm: [-1.58, -0.08, 0.08], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.45, 0.05, 0], rHand: [-1.45, -0.05, 0], head: [0.08, -0.15, 0], blink: 0 }],
        [0.85, { root: [0, 0.12, 0.36], hipY: -0.06, spine: [0.15, -0.1, 0], lArm: [-1.5, 0.06, 0.12], rArm: [-1.5, -0.06, 0.12], lHand: [-1.35, 0.04, 0], rHand: [-1.35, -0.04, 0], blink: 1 }],
        [1.15, P({}, IDLES.percentRage(0))],
      ],
      REST,
    ),
  },
  leafCombo: {
    // Taijutsu master — Leaf dash in (like Ingenium), cross → hook → rising kick.
    hit: 0.78,
    hits: [0.48, 0.6, 0.78],
    zone: 'high',
    release: 0.48,
    ranged: false,
    fx: 'speed',
    clip: clip(
      [
        [0, P({}, IDLES.niceGuy(0))],
        // Drop the thumbs-up into a Naruto-run crouch — arms swept back.
        [0.1, { hipY: -0.2, spine: [0.42, 0, 0], chest: [0.12, 0, 0], head: [-0.45, 0, 0], lArm: [0.85, 0, 0.85], rArm: [0.85, 0, 0.85], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], lFoot: [0.06, 0.02, 0.1], rFoot: [0.06, 0, -0.08] }],
        // Youth dash — vanish across the pad.
        [0.16, { vis: 0, root: [0, 0.04, 0.1], hipY: -0.12 }],
        [0.32, { vis: 0, root: [0, 0.06, 0.4] }],
        // Rematerialize in guard, chamber the right cross.
        [0.38, { vis: 1, root: [0, 0, 0.38], hipY: -0.12, hips: [0, -0.55, 0], spine: [0.12, -0.45, 0], chest: [0, -0.22, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.12], lArm: [-0.85, 0, 0.4], lElbow: [-1.7, 0, 0], rArm: [0.5, 0, 0.55], rElbow: [-1.9, 0, 0], head: [0.05, -0.2, 0] }],
        // Cross lands.
        [0.48, { root: [0, 0, 0.44], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.2, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.14], rArm: [-1.55, 0, 0.02], rElbow: [0, 0, 0], rHand: [-0.35, 0, 0], lArm: [0.35, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.05, -0.25, 0] }, 'snap'],
        // Sharp left hook — martial arts timing, no wasted motion.
        [0.6, { root: [0, 0, 0.42], hipY: -0.12, hips: [0, -0.4, 0.18], spine: [0.14, 0.4, -0.18], lFoot: [0.05, 0, 0.14], rFoot: [0.05, 0, -0.1], lArm: [-1.4, -0.45, 0.35], lElbow: [-0.3, 0, 0], lHand: [-0.45, 0, 0.35], rArm: [-0.65, 0, 0.55], rElbow: [-1.45, 0, 0], head: [0.05, 0.2, 0] }, 'snap'],
        // Rising front kick — the taijutsu finisher.
        [0.78, { root: [0, 0, 0.28], hipY: -0.04, hips: [-0.22, -0.05, 0], spine: [-0.22, 0.1, 0], chest: [-0.08, 0, 0], head: [0.22, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.25, rFoot: [0, 0.38, 0.5], rToe: 1.15, lArm: [-0.55, 0, 0.55], lElbow: [-1.55, 0, 0], rArm: [0.35, 0, 0.55], rElbow: [-1.15, 0, 0] }, 'snap'],
        [0.95, { hipY: -0.1, hips: [0, -0.1, 0], spine: [0.08, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.16, 0.1], rToe: 0.3, lArm: [-0.75, 0, 0.4], rArm: [-0.55, 0, 0.4] }],
        [1.15, P({}, IDLES.niceGuy(0))],
      ],
      REST,
    ),
  },
  gatesBurn: {
    // Eighth Gate — blink in, blistering taijutsu flurry; final blow chars them (no fireball).
    hit: 0.72,
    hits: [0.28, 0.38, 0.48, 0.58, 0.72],
    zone: 'high',
    release: 0.28,
    ranged: false,
    fx: 'speed',
    clip: clip(
      [
        [0, P({}, IDLES.focused(0))],
        // Wide Gates crouch — arms flung back, steam rising.
        [0.08, { hipY: -0.22, spine: [0.48, 0, 0], chest: [0.15, 0, 0], head: [-0.3, 0, 0], blink: 0, lArm: [0.55, -0.85, 1.1], rArm: [0.55, 0.85, 1.1], lElbow: [-0.35, 0, 0], rElbow: [-0.35, 0, 0], lHand: [0.4, 0, 0], rHand: [0.4, 0, 0], lFoot: [0.1, 0, 0.12], rFoot: [0.1, 0, -0.1] }],
        // Teleport blink onto them.
        [0.12, { vis: 0, root: [0, 0.04, 0.12], hipY: -0.14 }],
        [0.2, { vis: 0, root: [0, 0.05, 0.4] }],
        // Rematerialize mid-jab.
        [0.24, { vis: 1, root: [0, 0, 0.38], hipY: -0.12, hips: [0, -0.45, 0], spine: [0.15, -0.35, 0], chest: [0, -0.15, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.1], lArm: [0.45, 0, 0.5], lElbow: [-1.8, 0, 0], rArm: [-0.7, 0, 0.4], rElbow: [-1.6, 0, 0], head: [0.05, -0.15, 0], blink: 0 }],
        // Jab.
        [0.28, { root: [0, 0, 0.42], hipY: -0.13, hips: [0.02, -0.5, 0], spine: [0.14, 0.05, 0], lFoot: [0.04, 0, 0.18], lArm: [-1.55, 0.05, 0.08], lElbow: [-0.05, 0, 0], lHand: [0, 0, 0.15], rArm: [-0.9, 0, 0.4], rElbow: [-1.8, 0, 0], head: [0.05, 0.1, 0] }, 'snap'],
        // Cross.
        [0.38, { root: [0, 0, 0.46], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.18, -0.5, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.12], rArm: [-1.55, 0, 0.02], rElbow: [0, 0, 0], rHand: [-0.35, 0, 0], lArm: [0.4, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.05, -0.22, 0] }, 'snap'],
        // Hook.
        [0.48, { root: [0, 0, 0.44], hipY: -0.12, hips: [0, -0.4, 0.2], spine: [0.14, 0.4, -0.18], lFoot: [0.05, 0, 0.14], rFoot: [0.05, 0, -0.1], lArm: [-1.4, -0.5, 0.4], lElbow: [-0.25, 0, 0], lHand: [-0.4, 0, 0.35], rArm: [-0.65, 0, 0.55], rElbow: [-1.4, 0, 0], head: [0.05, 0.22, 0] }, 'snap'],
        // Uppercut.
        [0.58, { root: [0, 0.02, 0.4], hipY: -0.04, hips: [0, 0.35, 0], spine: [-0.08, 0.15, 0], chest: [-0.1, 0.1, 0], head: [-0.2, -0.1, 0], lFoot: [0.04, 0, 0.14], rFoot: [0.05, 0.04, -0.06], rToe: 0.65, rArm: [-1.1, 0, 0.1], rElbow: [-1.85, 0, 0], rHand: [-0.35, 0, 0], lArm: [-0.9, 0, 0.4], lElbow: [-1.9, 0, 0] }, 'snap'],
        // Finisher kick — impact chars them from the Gate heat.
        [0.72, { root: [0, 0, 0.3], hipY: -0.04, hips: [-0.22, -0.05, 0], spine: [-0.22, 0.1, 0], chest: [-0.08, 0, 0], head: [0.22, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.25, rFoot: [0, 0.4, 0.52], rToe: 1.15, lArm: [-0.55, 0, 0.55], lElbow: [-1.55, 0, 0], rArm: [0.35, 0, 0.55], rElbow: [-1.15, 0, 0] }, 'snap'],
        [0.88, { hipY: -0.1, hips: [0, -0.1, 0], spine: [0.1, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.14, 0.08], rToe: 0.25, lArm: [-0.75, 0, 0.4], rArm: [-0.55, 0, 0.4] }],
        [1.05, P({}, IDLES.focused(0))],
      ],
      REST,
    ),
  },
  ofaPunch: {
    // Full Cowl base — plant, wind the right, Detroit Smash shockwave that breaks them.
    hit: 0.54,
    zone: 'high',
    release: 0.54,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.focused(0))],
        // Coil — green sparks ready, fists up.
        [0.18, { hipY: -0.14, hips: [0, -0.55, 0], spine: [0.12, -0.4, 0], chest: [0.05, -0.2, 0], head: [-0.05, -0.15, 0], blink: 0, lArm: [-0.9, -0.15, 0.55], rArm: [0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rElbow: [-1.9, 0, 0], lFoot: [0.05, 0, 0.1], rFoot: [0.06, 0, -0.08] }],
        // Drive through — explosive straight lands.
        [0.54, { hipY: -0.16, root: [0, 0, 0.34], hips: [0, 0.6, 0], spine: [0.22, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.07, 0, -0.14], rArm: [-1.6, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.55, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.08, -0.28, 0], blink: 0 }, 'snap'],
        [0.82, { hipY: -0.14, root: [0, 0, 0.3], hips: [0, 0.45, 0], spine: [0.18, -0.4, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.12], rArm: [-1.48, 0, 0.05], rElbow: [-0.08, 0, 0], rHand: [-0.35, 0, 0], lArm: [0.35, 0, 0.5], lElbow: [-1.35, 0, 0] }],
        [1.12, P({}, IDLES.focused(0))],
      ],
      REST,
    ),
  },
  ofaSmash: {
    // Awakened Full Cowl — blink in, Delaware Smash punch, then iron-sole kick detonates.
    hit: 0.78,
    hits: [0.42, 0.78],
    zone: 'mid',
    release: 0.42,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.focused(0))],
        // Crouch — OFA crackling, ready to vanish.
        [0.1, { hipY: -0.2, spine: [0.4, 0, 0], chest: [0.12, 0, 0], head: [-0.2, 0, 0], blink: 0, lArm: [-0.95, -0.25, 0.7], rArm: [-0.95, 0.25, 0.7], lElbow: [-1.65, 0, 0], rElbow: [-1.65, 0, 0], lHand: [0.5, 0, 0], rHand: [0.5, 0, 0], lFoot: [0.08, 0, 0.1], rFoot: [0.08, 0, -0.08] }],
        // Teleport blink — Full Cowl speed.
        [0.16, { vis: 0, root: [0, 0.04, 0.1], hipY: -0.12 }],
        [0.3, { vis: 0, root: [0, 0.05, 0.38] }],
        // Rematerialize mid-punch (first hit).
        [0.36, { vis: 1, root: [0, 0, 0.36], hipY: -0.14, hips: [0, -0.5, 0], spine: [0.16, -0.45, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.12], lArm: [-0.7, 0, 0.4], lElbow: [-1.7, 0, 0], rArm: [0.55, 0, 0.55], rElbow: [-1.95, 0, 0], head: [0.05, -0.25, 0], blink: 0 }],
        [0.42, { root: [0, 0, 0.44], hipY: -0.16, hips: [0, 0.6, 0], spine: [0.22, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.07, 0, -0.14], rArm: [-1.6, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.6, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.45, 0, 0], head: [0.08, -0.3, 0], blink: 0 }, 'snap'],
        // Chamber Shoot Style kick.
        [0.56, { root: [0, 0, 0.22], hipY: -0.08, hips: [0.1, -0.2, 0], spine: [0.05, 0.12, 0], chest: [0.02, 0.06, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.04, 0.3, 0.1], rToe: 0.4, lArm: [-0.65, 0, 0.55], rArm: [0.3, 0, 0.5], lElbow: [-1.45, 0, 0], rElbow: [-1.2, 0, 0] }],
        // Iron-sole kick detonates (lethal).
        [0.78, { root: [0, 0, 0.2], hipY: -0.04, hips: [-0.22, -0.05, 0], spine: [-0.22, 0.1, 0], chest: [-0.08, 0, 0], head: [0.22, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.2, rFoot: [0, 0.38, 0.52], rToe: 1.15, lArm: [-0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rArm: [0.35, 0, 0.5], rElbow: [-1.2, 0, 0] }, 'snap'],
        [1.0, { hipY: -0.08, hips: [0, -0.1, 0], spine: [0.05, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.18, 0.1], rToe: 0.3, lArm: [-0.7, 0, 0.4], rArm: [-0.5, 0, 0.4] }],
        [1.25, P({}, IDLES.focused(0))],
      ],
      REST,
    ),
  },
  texasSmash: {
    // Thin True Form — plant, wind the right, Texas Smash shockwave punch.
    hit: 0.54,
    zone: 'high',
    release: 0.54,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.truthStand(0))],
        // Drop the defiant stand into a coiled punch.
        [0.16, { hipY: -0.14, hips: [0, -0.55, 0], spine: [0.14, -0.4, 0], chest: [0.05, -0.2, 0], head: [-0.05, -0.15, 0], blink: 0, lArm: [-0.9, -0.15, 0.55], rArm: [0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rElbow: [-1.9, 0, 0], lFoot: [0.06, 0, 0.1], rFoot: [0.07, 0, -0.08] }],
        // Drive through — Texas Smash lands.
        [0.54, { hipY: -0.16, root: [0, 0, 0.36], hips: [0, 0.65, 0], spine: [0.24, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.05, 0, 0.22], rFoot: [0.08, 0, -0.14], rArm: [-1.65, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.55, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.08, -0.28, 0], blink: 0 }, 'snap'],
        [0.82, { hipY: -0.14, root: [0, 0, 0.32], hips: [0, 0.45, 0], spine: [0.18, -0.4, 0], lFoot: [0.05, 0, 0.2], rFoot: [0.07, 0, -0.12], rArm: [-1.5, 0, 0.05], rElbow: [-0.08, 0, 0], rHand: [-0.35, 0, 0], lArm: [0.35, 0, 0.5], lElbow: [-1.35, 0, 0] }],
        [1.12, P({}, IDLES.truthStand(0))],
      ],
      REST,
    ),
  },
  unitedSmash: {
    // Muscle form — leap in, chain two explosive United States of Smash punches.
    hit: 0.78,
    hits: [0.36, 0.78],
    zone: 'high',
    release: 0.36,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.plusUltra(0))],
        // Crouch-coil — buff frame winding power.
        [0.1, { hipY: -0.22, spine: [0.45, 0, 0], chest: [0.15, 0, 0], head: [-0.2, 0, 0], blink: 0, lArm: [-0.85, -0.2, 0.65], rArm: [-0.85, 0.2, 0.65], lElbow: [-1.55, 0, 0], rElbow: [-1.55, 0, 0], lHand: [0.5, 0, 0], rHand: [0.5, 0, 0], lFoot: [0.08, 0, 0.1], rFoot: [0.08, 0, -0.08] }],
        // Leap arc toward them.
        [0.18, { root: [0, 0.28, 0.12], hipY: -0.06, lFoot: [0.04, 0.16, 0.06], rFoot: [0.04, 0.16, -0.04], lToe: 0.5, rToe: 0.5, lArm: [0.4, -0.5, 0.8], rArm: [0.4, 0.5, 0.8], lElbow: [-0.4, 0, 0], rElbow: [-0.4, 0, 0] }],
        [0.28, { root: [0, 0.18, 0.32], hipY: -0.1, lFoot: [0.04, 0.1, 0.12], rFoot: [0.05, 0.1, -0.08], lArm: [-0.5, 0, 0.45], rArm: [0.5, 0, 0.55], lElbow: [-1.5, 0, 0], rElbow: [-1.8, 0, 0] }],
        // First explosive right lands.
        [0.36, { root: [0, 0, 0.4], hipY: -0.16, hips: [0, 0.6, 0], spine: [0.22, -0.55, 0], chest: [0, -0.2, 0], lFoot: [0.05, 0, 0.2], rFoot: [0.07, 0, -0.12], rArm: [-1.65, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.6, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.45, 0, 0], head: [0.08, -0.3, 0], blink: 0 }, 'snap'],
        // Chamber the left for the finisher.
        [0.52, { root: [0, 0, 0.28], hipY: -0.14, hips: [0, -0.5, 0], spine: [0.16, 0.4, 0], chest: [0.05, 0.15, 0], lFoot: [0.05, 0, 0.12], rFoot: [0.06, 0, -0.1], lArm: [0.55, 0, 0.55], lElbow: [-1.9, 0, 0], rArm: [-0.7, 0, 0.4], rElbow: [-1.6, 0, 0], head: [0.05, 0.2, 0] }],
        // Second explosive punch detonates.
        [0.78, { root: [0, 0, 0.46], hipY: -0.18, hips: [0, -0.65, 0], spine: [0.26, 0.55, 0], chest: [0, 0.18, 0], lFoot: [0.05, 0, 0.24], rFoot: [0.08, 0, -0.14], lArm: [-1.65, 0, 0.0], lElbow: [0, 0, 0], lHand: [-0.65, 0, 0], rArm: [0.5, 0, 0.6], rElbow: [-1.4, 0, 0], head: [0.1, 0.28, 0], blink: 0 }, 'snap'],
        [1.02, { root: [0, 0, 0.4], hipY: -0.14, hips: [0, -0.4, 0], spine: [0.2, 0.35, 0], lFoot: [0.05, 0, 0.2], rFoot: [0.07, 0, -0.12], lArm: [-1.5, 0, 0.05], lElbow: [-0.08, 0, 0], lHand: [-0.4, 0, 0], rArm: [0.4, 0, 0.5], rElbow: [-1.25, 0, 0] }],
        [1.28, P({}, IDLES.plusUltra(0))],
      ],
      REST,
    ),
  },
  chainsawRip: {
    // Pull the cord → sprout saws → frantic arm/head rip that takes a limb.
    hit: 0.62,
    hits: [0.28, 0.46, 0.62],
    zone: 'high',
    release: 0.28,
    ranged: false,
    fx: 'chainsaw',
    clip: clip(
      [
        [0, P({}, IDLES.denjiStand(0))],
        // Yank the starter cord — lean in, right arm yanking.
        [0.1, { hipY: -0.1, hips: [0.1, -0.25, 0], spine: [0.2, 0.35, 0], chest: [0.08, 0.1, 0], head: [-0.15, 0.2, 0], blink: 0, lArm: [0.15, 0, 0.2], lElbow: [-0.5, 0, 0], rArm: [-1.1, 0.6, 0.9], rElbow: [-1.4, 0, 0], rHand: [0.4, 0, 0.2], lFoot: [0.04, 0, 0.08], rFoot: [0.05, 0, -0.06] }],
        // Saws out — lunging cross-slash with both arm blades.
        [0.28, { hipY: -0.14, root: [0, 0, 0.28], hips: [0.12, 0.55, 0], spine: [0.35, -0.55, 0], chest: [0.1, -0.2, 0], head: [0.15, -0.25, 0], lFoot: [0.05, 0, 0.18], rFoot: [0.07, 0, -0.12], lArm: [-1.55, -0.2, 0.15], lElbow: [-0.15, 0, 0], lHand: [-0.5, 0, 0], rArm: [0.55, 0.3, 0.7], rElbow: [-1.2, 0, 0] }, 'snap'],
        // Reverse cut — left blade through the midsection.
        [0.46, { hipY: -0.16, root: [0, 0, 0.36], hips: [0.1, -0.55, 0], spine: [0.3, 0.55, 0], chest: [0.08, 0.15, 0], head: [0.1, 0.25, 0], lFoot: [0.05, 0, 0.2], rFoot: [0.07, 0, -0.12], rArm: [-1.5, 0.25, 0.2], rElbow: [-0.1, 0, 0], rHand: [-0.45, 0, 0], lArm: [0.5, -0.25, 0.65], lElbow: [-1.15, 0, 0] }, 'snap'],
        // Head-saw finisher — drive the forehead blade through.
        [0.62, { hipY: -0.18, root: [0, 0, 0.42], hips: [0.15, 0.4, 0], spine: [0.5, -0.35, 0], chest: [0.2, -0.15, 0], head: [-0.75, -0.1, 0], blink: 0, lFoot: [0.05, 0, 0.22], rFoot: [0.08, 0, -0.14], lArm: [-0.9, -0.4, 0.7], lElbow: [-0.8, 0, 0], rArm: [-0.9, 0.4, 0.7], rElbow: [-0.8, 0, 0], lHand: [-0.3, 0, 0], rHand: [-0.3, 0, 0] }, 'snap'],
        [0.9, { hipY: -0.14, root: [0, 0, 0.34], hips: [0.1, 0.25, 0], spine: [0.3, -0.2, 0], head: [-0.4, 0, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.06, 0, -0.1], lArm: [-0.7, -0.2, 0.5], rArm: [-0.7, 0.2, 0.5], lElbow: [-1.0, 0, 0], rElbow: [-1.0, 0, 0] }],
        [1.15, P({}, IDLES.denjiStand(0))],
      ],
      REST,
    ),
  },
  heroOfHell: {
    // Hero of Hell — four-arm whirlwind that carves the body apart.
    hit: 0.72,
    hits: [0.22, 0.38, 0.54, 0.72],
    zone: 'mid',
    release: 0.22,
    ranged: false,
    fx: 'chainsaw',
    clip: clip(
      [
        [0, P({}, IDLES.hellCrouch(0))],
        // Coil — blades crossed, intestine scarf whipping.
        [0.1, { hipY: -0.26, hips: [0.4, 0, 0], spine: [0.55, 0.2, 0], chest: [0.25, 0.1, 0], head: [-0.65, 0.15, 0], blink: 0, lArm: [-1.55, -0.55, 1.0], rArm: [-1.55, 0.55, 1.0], lElbow: [-0.25, 0, 0], rElbow: [-0.25, 0, 0], lHand: [-0.5, 0, 0.2], rHand: [-0.5, 0, 0.2], lFoot: [0.14, 0, 0.12], rFoot: [0.14, 0, -0.1] }],
        // First dual-arm rip.
        [0.22, { hipY: -0.2, root: [0, 0, 0.26], hips: [0.35, 0.6, 0], spine: [0.4, -0.65, 0], chest: [0.15, -0.25, 0], head: [-0.35, -0.3, 0], lFoot: [0.1, 0, 0.2], rFoot: [0.12, 0, -0.12], lArm: [-1.7, 0.2, 0.1], lElbow: [0, 0, 0], lHand: [-0.6, 0, 0], rArm: [0.6, 0.4, 0.85], rElbow: [-1.1, 0, 0] }, 'snap'],
        // Cross-cut reverse.
        [0.38, { hipY: -0.22, root: [0, 0, 0.34], hips: [0.35, -0.65, 0], spine: [0.42, 0.7, 0], chest: [0.15, 0.2, 0], head: [-0.3, 0.35, 0], lFoot: [0.1, 0, 0.22], rFoot: [0.12, 0, -0.12], rArm: [-1.7, -0.2, 0.1], rElbow: [0, 0, 0], rHand: [-0.6, 0, 0], lArm: [0.6, -0.4, 0.85], lElbow: [-1.1, 0, 0] }, 'snap'],
        // Upper pair + head saw — diagonal carve.
        [0.54, { hipY: -0.24, root: [0, 0.04, 0.4], hips: [0.4, 0.35, 0], spine: [0.55, -0.4, 0], chest: [0.22, -0.15, 0], head: [-0.85, -0.15, 0], blink: 0, lFoot: [0.1, 0, 0.24], rFoot: [0.13, 0, -0.14], lArm: [-1.4, -0.55, 0.55], rArm: [-1.4, 0.55, 0.55], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], lHand: [-0.55, 0, 0], rHand: [-0.55, 0, 0] }, 'snap'],
        // Finisher — dive through them; everything comes apart.
        [0.72, { hipY: -0.28, root: [0, 0, 0.5], hips: [0.5, 0.5, 0], spine: [0.7, -0.5, 0], chest: [0.3, -0.2, 0], head: [-1.0, 0, 0], blink: 0, lFoot: [0.12, 0, 0.26], rFoot: [0.14, 0, -0.14], lArm: [-1.75, -0.3, 0.05], rArm: [-1.75, 0.3, 0.05], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-0.7, 0, 0], rHand: [-0.7, 0, 0] }, 'snap'],
        [0.98, { hipY: -0.24, root: [0, 0, 0.42], hips: [0.4, 0.3, 0], spine: [0.5, -0.3, 0], head: [-0.6, 0, 0], lFoot: [0.12, 0, 0.2], rFoot: [0.12, 0, -0.12], lArm: [-1.4, -0.4, 0.5], rArm: [-1.4, 0.4, 0.5], lElbow: [-0.35, 0, 0], rElbow: [-0.35, 0, 0] }],
        [1.25, P({}, IDLES.hellCrouch(0))],
      ],
      REST,
    ),
  },
  jackpotRush: {
    // Hakari base — hands leave the pockets for a hard cross, then a rising kick.
    hit: 0.72,
    hits: [0.36, 0.72],
    zone: 'mid',
    release: 0.36,
    ranged: false,
    fx: 'impact',
    clip: clip(
      [
        [0, P({}, IDLES.pockets(0))],
        // Pull fists from the puffer into a boxer's crouch.
        [0.12, { hipY: -0.14, spine: [0.3, 0, 0], chest: [0.1, 0, 0], head: [-0.08, 0, 0], lArm: [-0.9, -0.12, 0.55], rArm: [-0.9, 0.12, 0.55], lElbow: [-1.55, 0, 0], rElbow: [-1.55, 0, 0], lFoot: [0.06, 0, 0.1], rFoot: [0.06, 0, -0.08] }],
        // Right cross lands (first hit).
        [0.36, { root: [0, 0, 0.3], hipY: -0.15, hips: [0, 0.58, 0], spine: [0.2, -0.52, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.07, 0, -0.12], rArm: [-1.58, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.4, 0, 0], lArm: [0.42, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.06, -0.28, 0] }, 'snap'],
        // Chamber the kick.
        [0.5, { root: [0, 0, 0.22], hipY: -0.08, hips: [0.1, -0.22, 0], spine: [0.06, 0.12, 0], chest: [0.02, 0.05, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.04, 0.3, 0.1], rToe: 0.4, lArm: [-0.65, 0, 0.55], rArm: [0.28, 0, 0.5], lElbow: [-1.4, 0, 0], rElbow: [-1.2, 0, 0] }],
        // Rising front kick (lethal).
        [0.72, { root: [0, 0, 0.2], hipY: -0.04, hips: [-0.22, -0.05, 0], spine: [-0.22, 0.1, 0], chest: [-0.08, 0, 0], head: [0.22, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.2, rFoot: [0, 0.38, 0.5], rToe: 1.15, lArm: [-0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rArm: [0.35, 0, 0.5], rElbow: [-1.2, 0, 0] }, 'snap'],
        [0.95, { hipY: -0.08, hips: [0, -0.1, 0], spine: [0.05, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.18, 0.1], rToe: 0.3, lArm: [-0.7, 0, 0.4], rArm: [-0.5, 0, 0.4] }],
        [1.2, P({}, IDLES.pockets(0))],
      ],
      REST,
    ),
  },
  jackpotBurst: {
    // Jackpot — blink in, twin explosive punches, then a detonating kick.
    hit: 0.8,
    hits: [0.38, 0.56, 0.8],
    zone: 'mid',
    release: 0.38,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.jackpotIdle(0))],
        // Domain flash — crouch, aura cresting.
        [0.1, { hipY: -0.2, spine: [0.4, 0, 0], chest: [0.12, 0, 0], head: [-0.2, 0, 0], blink: 0, lArm: [-1.0, -0.3, 0.7], rArm: [-1.0, 0.3, 0.7], lElbow: [-1.6, 0, 0], rElbow: [-1.6, 0, 0], lFoot: [0.08, 0, 0.1], rFoot: [0.08, 0, -0.08] }],
        // Teleport blink — Jackpot speed.
        [0.16, { vis: 0, root: [0, 0.05, 0.1], hipY: -0.12 }],
        [0.28, { vis: 0, root: [0, 0.06, 0.36] }],
        // Rematerialize mid-right cross (first explosive hit).
        [0.34, { vis: 1, root: [0, 0, 0.36], hipY: -0.14, hips: [0, -0.5, 0], spine: [0.16, -0.45, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.12], lArm: [-0.7, 0, 0.4], lElbow: [-1.7, 0, 0], rArm: [0.55, 0, 0.55], rElbow: [-1.95, 0, 0], head: [0.05, -0.25, 0], blink: 0 }],
        [0.38, { root: [0, 0, 0.44], hipY: -0.16, hips: [0, 0.62, 0], spine: [0.22, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.07, 0, -0.14], rArm: [-1.62, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.65, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.45, 0, 0], head: [0.08, -0.3, 0], blink: 0 }, 'snap'],
        // Left cross detonates (second hit).
        [0.48, { root: [0, 0, 0.3], hipY: -0.12, hips: [0, -0.45, 0], spine: [0.15, 0.35, 0], chest: [0, 0.12, 0], lFoot: [0.05, 0, 0.12], rFoot: [0.05, 0, -0.1], lArm: [0.5, 0, 0.55], lElbow: [-1.9, 0, 0], rArm: [-0.75, 0, 0.4], rElbow: [-1.5, 0, 0] }],
        [0.56, { root: [0, 0, 0.46], hipY: -0.16, hips: [0, -0.65, 0], spine: [0.24, 0.55, 0], chest: [0, 0.18, 0], lFoot: [0.05, 0, 0.24], rFoot: [0.07, 0, -0.12], lArm: [-1.62, 0, 0.0], lElbow: [0, 0, 0], lHand: [-0.65, 0, 0], rArm: [0.48, 0, 0.55], rElbow: [-1.4, 0, 0], head: [0.08, 0.28, 0], blink: 0 }, 'snap'],
        // Chamber detonating kick.
        [0.66, { root: [0, 0, 0.22], hipY: -0.08, hips: [0.1, -0.2, 0], spine: [0.05, 0.12, 0], chest: [0.02, 0.06, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.04, 0.32, 0.1], rToe: 0.4, lArm: [-0.65, 0, 0.55], rArm: [0.3, 0, 0.5], lElbow: [-1.45, 0, 0], rElbow: [-1.2, 0, 0] }],
        // Explosive kick (lethal).
        [0.8, { root: [0, 0, 0.2], hipY: -0.04, hips: [-0.24, -0.05, 0], spine: [-0.24, 0.1, 0], chest: [-0.08, 0, 0], head: [0.24, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.2, rFoot: [0, 0.4, 0.54], rToe: 1.2, lArm: [-0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rArm: [0.35, 0, 0.5], rElbow: [-1.2, 0, 0] }, 'snap'],
        [1.02, { hipY: -0.08, hips: [0, -0.1, 0], spine: [0.05, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.18, 0.1], rToe: 0.3, lArm: [-0.7, 0, 0.4], rArm: [-0.5, 0, 0.4] }],
        [1.28, P({}, IDLES.jackpotIdle(0))],
      ],
      REST,
    ),
  },
  ghoulSlash: {
    // Kaneki base — dash in, twin claw slashes that take a limb.
    hit: 0.52,
    hits: [0.28, 0.52],
    zone: 'high',
    release: 0.28,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({}, IDLES.ghoulReady(0))],
        // Coil — claws back, weight forward.
        [0.12, { hipY: -0.12, hips: [0.1, 0.25, 0], spine: [0.25, 0.4, 0], chest: [0.1, 0.15, 0], head: [-0.2, 0.2, 0], blink: 0, lArm: [0.35, 0, 0.5], lElbow: [-1.5, 0, 0], rArm: [-2.4, 0.4, 0.85], rElbow: [-0.4, 0, 0], rHand: [-0.5, 0, 0.2], lFoot: [0.05, 0, 0.1], rFoot: [0.06, 0, -0.08] }],
        // Right claw rake (first cut).
        [0.28, { hipY: -0.14, root: [0, 0, 0.3], hips: [0.12, 0.55, 0], spine: [0.3, -0.55, 0], chest: [0.1, -0.2, 0], head: [0.1, -0.25, 0], lFoot: [0.05, 0, 0.18], rFoot: [0.07, 0, -0.12], rArm: [-0.55, -0.2, -0.15], rElbow: [-0.15, 0, 0], rHand: [-0.55, 0, 0], lArm: [-2.3, -0.35, 0.8], lElbow: [-0.5, 0, 0] }, 'snap'],
        // Left reverse slash (lethal).
        [0.52, { hipY: -0.16, root: [0, 0, 0.4], hips: [0.1, -0.55, 0], spine: [0.32, 0.55, 0], chest: [0.1, 0.18, 0], head: [0.08, 0.28, 0], lFoot: [0.05, 0, 0.22], rFoot: [0.07, 0, -0.12], lArm: [-0.5, 0.2, -0.15], lElbow: [-0.15, 0, 0], lHand: [-0.55, 0, 0], rArm: [0.4, 0.3, 0.65], rElbow: [-1.1, 0, 0] }, 'snap'],
        [0.78, { hipY: -0.12, root: [0, 0, 0.32], hips: [0.08, -0.3, 0], spine: [0.22, 0.3, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.06, 0, -0.1], lArm: [-0.7, 0, 0.35], rArm: [-0.6, 0, 0.4], lElbow: [-1.0, 0, 0], rElbow: [-1.0, 0, 0] }],
        [1.05, P({}, IDLES.ghoulReady(0))],
      ],
      REST,
    ),
  },
  rinkakuRip: {
    // Centipede — superfast kagune whirlwind that carves the body apart.
    hit: 0.7,
    hits: [0.2, 0.38, 0.54, 0.7],
    zone: 'mid',
    release: 0.2,
    ranged: false,
    fx: 'kagune',
    clip: clip(
      [
        [0, P({}, IDLES.centipedeIdle(0))],
        // Crouch — tails flare, claws out.
        [0.08, { hipY: -0.24, hips: [0.4, 0, 0], spine: [0.55, 0.25, 0], chest: [0.22, 0.1, 0], head: [-0.55, 0.2, 0], blink: 0, flap: 0.85, lArm: [-1.5, -0.55, 1.0], rArm: [-1.5, 0.55, 1.0], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0], lHand: [-0.55, 0, 0.25], rHand: [-0.55, 0, 0.25], lFoot: [0.12, 0, 0.14], rFoot: [0.12, 0, -0.12] }],
        // First rinkaku cross-cut.
        [0.2, { hipY: -0.2, root: [0, 0, 0.28], hips: [0.35, 0.65, 0], spine: [0.4, -0.7, 0], chest: [0.15, -0.25, 0], head: [-0.3, -0.35, 0], flap: 1.1, lFoot: [0.1, 0, 0.22], rFoot: [0.12, 0, -0.14], lArm: [-1.7, 0.25, 0.1], lElbow: [0, 0, 0], lHand: [-0.65, 0, 0], rArm: [0.65, 0.45, 0.9], rElbow: [-1.0, 0, 0] }, 'snap'],
        // Reverse tail rake.
        [0.38, { hipY: -0.22, root: [0, 0, 0.36], hips: [0.35, -0.7, 0], spine: [0.42, 0.75, 0], chest: [0.15, 0.22, 0], head: [-0.25, 0.4, 0], flap: 0.95, lFoot: [0.1, 0, 0.24], rFoot: [0.12, 0, -0.14], rArm: [-1.7, -0.25, 0.1], rElbow: [0, 0, 0], rHand: [-0.65, 0, 0], lArm: [0.65, -0.45, 0.9], lElbow: [-1.0, 0, 0] }, 'snap'],
        // Diagonal dual-tail carve.
        [0.54, { hipY: -0.24, root: [0, 0.04, 0.42], hips: [0.4, 0.4, 0], spine: [0.55, -0.45, 0], chest: [0.22, -0.15, 0], head: [-0.7, -0.15, 0], blink: 0, flap: 1.2, lFoot: [0.1, 0, 0.26], rFoot: [0.13, 0, -0.15], lArm: [-1.45, -0.55, 0.55], rArm: [-1.45, 0.55, 0.55], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], lHand: [-0.6, 0, 0], rHand: [-0.6, 0, 0] }, 'snap'],
        // Finisher — all four tails punch through; total dismember.
        [0.7, { hipY: -0.28, root: [0, 0, 0.52], hips: [0.5, 0.55, 0], spine: [0.72, -0.55, 0], chest: [0.3, -0.2, 0], head: [-0.9, 0, 0], blink: 0, flap: 1.35, lFoot: [0.12, 0, 0.28], rFoot: [0.14, 0, -0.15], lArm: [-1.8, -0.3, 0.05], rArm: [-1.8, 0.3, 0.05], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-0.75, 0, 0], rHand: [-0.75, 0, 0] }, 'snap'],
        [0.95, { hipY: -0.22, root: [0, 0, 0.4], hips: [0.35, 0.3, 0], spine: [0.45, -0.25, 0], head: [-0.5, 0, 0], flap: 0.7, lFoot: [0.12, 0, 0.2], rFoot: [0.12, 0, -0.12], lArm: [-1.3, -0.4, 0.55], rArm: [-1.3, 0.4, 0.55], lElbow: [-0.4, 0, 0], rElbow: [-0.4, 0, 0] }],
        [1.2, P({}, IDLES.centipedeIdle(0))],
      ],
      REST,
    ),
  },
  plasmaSlash: {
    // Ignite Excalibur → diagonal plasma cut that burns on contact.
    hit: 0.32,
    hits: [0.22, 0.32],
    zone: 'high',
    release: 0.32,
    ranged: false,
    fx: 'fire',
    clip: clip(
      [
        [0, P({}, IDLES.knightReady(0))],
        // Guard high — plasma blade flares.
        [0.12, { hipY: -0.1, root: [0, 0, 0.06], hips: [0.08, -0.25, 0], spine: [0.15, 0.45, 0], chest: [0.08, 0.15, 0], head: [-0.1, 0.2, 0], blink: 0, lArm: [-0.4, -0.6, 0.4], lElbow: [-1.2, 0, 0], rArm: [-1.55, -0.55, 1.05], rElbow: [-0.25, 0, 0], rHand: [0.15, 0, 0.35], lFoot: [0.05, 0, 0.12], rFoot: [0.07, 0, -0.1] }],
        // First burn-cut across.
        [0.22, { hipY: -0.14, root: [0, 0, 0.32], hips: [0.1, 0.45, 0], spine: [0.22, -0.55, 0], chest: [0.1, -0.18, 0], head: [0.05, -0.15, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.08, 0, -0.14], rArm: [-1.65, 0.45, 0.15], rElbow: [-0.1, 0, 0], rHand: [0.1, 0, 0.4], lArm: [0.2, -0.7, 0.5], lElbow: [-1.15, 0, 0] }, 'snap'],
        // Reverse plasma slash — fire trails the edge.
        [0.32, { hipY: -0.16, root: [0, 0, 0.38], hips: [0.12, 0.35, 0], spine: [0.25, 0.5, 0], chest: [0.12, 0.15, 0], head: [0.08, -0.1, 0], lFoot: [0.04, 0, 0.24], rFoot: [0.08, 0, -0.14], rArm: [-1.75, -0.3, 1.15], rElbow: [-0.08, 0, 0], rHand: [0.05, 0, 0.45], lArm: [0.15, -0.65, 0.55], lElbow: [-1.1, 0, 0] }, 'snap'],
        [0.55, { hipY: -0.12, root: [0, 0, 0.32], hips: [0.08, 0.2, 0], spine: [0.18, 0.25, 0], lFoot: [0.05, 0, 0.18], rFoot: [0.07, 0, -0.1], rArm: [-1.4, -0.2, 0.85], rElbow: [-0.35, 0, 0], rHand: [0.1, 0, 0.25], lArm: [-0.2, -0.55, 0.4], lElbow: [-1.2, 0, 0], blink: 1 }],
        [0.85, P({}, IDLES.knightReady(0))],
      ],
      REST,
    ),
  },
  excaliburInferno: {
    // Hoist the colossal blade → slam a fire-eating Excalibur into the pad.
    hit: 0.78,
    zone: 'mid',
    release: 0.48,
    ranged: true,
    fx: 'inferno',
    clip: clip(
      [
        [0, P({}, IDLES.knightReady(0))],
        // Plant feet — huge sword rises overhead.
        [0.24, { hipY: -0.1, lFoot: [0.1, 0, 0.1], rFoot: [0.1, 0, -0.08], hips: [0.06, 0.15, 0], spine: [0.12, 0.15, 0], chest: [0.08, 0.1, 0], head: [-0.15, 0.2, 0], lArm: [-0.85, 0.25, 0.45], lElbow: [-0.9, 0, 0], rArm: [-2.55, 0.4, 0.65], rElbow: [-0.2, 0, 0], rHand: [0.25, 0.2, 0.1] }],
        // Peak — blade towers; plasma ignites into fire.
        [0.48, { hipY: -0.04, root: [0, 0.05, 0.08], lFoot: [0.09, 0, 0.12], rFoot: [0.1, 0, -0.1], hips: [0.05, -0.2, 0], spine: [-0.35, 0.12, 0], chest: [-0.18, 0.08, 0], head: [-0.4, 0.05, 0], blink: 0, lArm: [-1.85, 0.3, 0.55], lElbow: [-0.35, 0, 0], rArm: [-2.95, -0.1, 0.4], rElbow: [-0.12, 0, 0], rHand: [-0.15, -0.05, 0] }],
        // Slam — colossal Excalibur crashes down in a fire storm.
        [0.78, { hipY: -0.2, root: [0, 0, 0.3], lFoot: [0.1, 0, 0.22], rFoot: [0.12, 0, -0.14], hips: [0.14, 0.45, 0], spine: [0.6, -0.35, 0], chest: [0.3, -0.18, 0], head: [0.22, -0.28, 0], lArm: [-0.55, 0.35, 0.55], lElbow: [-0.7, 0, 0], rArm: [-1.1, -0.25, 0.12], rElbow: [-0.08, 0, 0], rHand: [-1.45, 0, 0] }, 'snap'],
        [1.1, { hipY: -0.16, root: [0, 0, 0.24], lFoot: [0.1, 0, 0.18], rFoot: [0.1, 0, -0.1], spine: [0.42, -0.22, 0], chest: [0.2, -0.1, 0], head: [0.1, -0.15, 0], lArm: [-0.6, 0.25, 0.45], rArm: [-1.25, -0.18, 0.2], rElbow: [-0.2, 0, 0], rHand: [-1.15, 0, 0], blink: 1 }],
        [1.45, P({}, IDLES.knightReady(0))],
      ],
      REST,
    ),
  },
  moriCombo: {
    // Jin Mori — plant, drive a right cross, then snap a rising front kick.
    hit: 0.72,
    hits: [0.36, 0.72],
    zone: 'mid',
    release: 0.36,
    ranged: false,
    fx: 'impact',
    clip: clip(
      [
        [0, P({}, IDLES.moriReady(0))],
        [0.12, { hipY: -0.12, spine: [0.28, 0, 0], chest: [0.08, 0, 0], head: [-0.1, 0, 0], lArm: [-0.85, -0.15, 0.55], rArm: [-0.85, 0.15, 0.55], lElbow: [-1.55, 0, 0], rElbow: [-1.55, 0, 0], lFoot: [0.06, 0, 0.08], rFoot: [0.06, 0, -0.06] }],
        [0.36, { root: [0, 0, 0.28], hipY: -0.14, hips: [0, 0.55, 0], spine: [0.18, -0.5, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.06, 0, -0.12], rArm: [-1.55, 0, 0.02], rElbow: [0, 0, 0], rHand: [-0.35, 0, 0], lArm: [0.4, 0, 0.55], lElbow: [-1.5, 0, 0], head: [0.05, -0.25, 0] }, 'snap'],
        [0.5, { root: [0, 0, 0.2], hipY: -0.08, hips: [0.08, -0.2, 0], spine: [0.05, 0.1, 0], chest: [0.02, 0.05, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.04, 0.28, 0.08], rToe: 0.35, lArm: [-0.6, 0, 0.55], rArm: [0.25, 0, 0.5], lElbow: [-1.4, 0, 0], rElbow: [-1.2, 0, 0] }],
        [0.72, { root: [0, 0, 0.18], hipY: -0.04, hips: [-0.2, -0.05, 0], spine: [-0.2, 0.08, 0], chest: [-0.06, 0, 0], head: [0.2, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.2, rFoot: [0, 0.36, 0.48], rToe: 1.1, lArm: [-0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rArm: [0.3, 0, 0.5], rElbow: [-1.2, 0, 0] }, 'snap'],
        [0.95, { hipY: -0.08, hips: [0, -0.1, 0], spine: [0.05, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.18, 0.1], rToe: 0.3, lArm: [-0.7, 0, 0.4], rArm: [-0.5, 0, 0.4] }],
        [1.2, P({}, IDLES.moriReady(0))],
      ],
      REST,
    ),
  },
  yeouiCrush: {
    // Monkey King — shrink Yeoui, grow it to tower size, then crush the pad.
    hit: 0.72,
    hits: [0.42, 0.72],
    zone: 'mid',
    release: 0.42,
    ranged: false,
    fx: 'yeoui',
    clip: clip(
      [
        [0, P({ prop: 1 }, IDLES.cloudHover(0))],
        // Plant — shrink the pillar in hand.
        [0.14, { prop: 1, root: [0, 0.06, 0.04], hipY: -0.12, hips: [0.1, -0.2, 0], spine: [0.2, 0.15, 0], chest: [0.08, 0.08, 0], head: [-0.1, 0.15, 0], blink: 0, lArm: [-0.7, -0.25, 0.45], lElbow: [-1.2, 0, 0], rArm: [-1.15, 0.45, 0.85], rElbow: [-0.45, 0, 0], rHand: [0.2, 0.15, 0.2], lFoot: [0.08, 0.02, 0.1], rFoot: [0.08, 0.02, -0.08] }],
        // Raise the growing pillar overhead (first shock).
        [0.42, { prop: 1, root: [0, 0.08, 0.12], hipY: -0.06, hips: [0.05, -0.15, 0], spine: [-0.35, 0.1, 0], chest: [-0.15, 0.06, 0], head: [-0.35, 0.05, 0], blink: 0, lArm: [-1.75, 0.25, 0.55], lElbow: [-0.35, 0, 0], rArm: [-2.85, -0.1, 0.45], rElbow: [-0.15, 0, 0], rHand: [-0.2, 0, 0.05], lFoot: [0.08, 0, 0.12], rFoot: [0.1, 0, -0.1] }, 'snap'],
        // Slam — tower-sized Yeoui flattens them.
        [0.72, { prop: 1, root: [0, 0, 0.28], hipY: -0.2, hips: [0.15, 0.45, 0], spine: [0.55, -0.35, 0], chest: [0.25, -0.15, 0], head: [0.2, -0.25, 0], lArm: [-0.6, 0.3, 0.5], lElbow: [-0.7, 0, 0], rArm: [-1.15, -0.2, 0.15], rElbow: [-0.1, 0, 0], rHand: [-1.35, 0, 0], lFoot: [0.1, 0, 0.22], rFoot: [0.12, 0, -0.14] }, 'snap'],
        [1.0, { prop: 1, root: [0, 0.04, 0.22], hipY: -0.14, hips: [0.1, 0.25, 0], spine: [0.35, -0.2, 0], chest: [0.15, -0.08, 0], head: [0.08, -0.12, 0], lArm: [-0.65, 0.2, 0.4], rArm: [-1.3, -0.15, 0.25], rElbow: [-0.25, 0, 0], rHand: [-0.9, 0, 0], lFoot: [0.08, 0, 0.16], rFoot: [0.1, 0, -0.1], blink: 1 }],
        [1.3, P({ prop: 1 }, IDLES.cloudHover(0))],
      ],
      REST,
    ),
  },
  beamCannon: {
    // Special Beam Cannon — two fingers to the brow, charge, then thrust the beam.
    hit: 0.72,
    release: 0.52,
    ranged: true,
    fx: 'beam',
    clip: clip(
      [
        [0, P({}, IDLES.gohanReady(0))],
        // Fingers to the forehead — ki gathers.
        [0.28, { hipY: -0.1, hips: [0, -0.25, 0], spine: [0.05, -0.15, 0], chest: [0.02, -0.08, 0], head: [-0.2, 0.1, 0], blink: 0, lFoot: [0.08, 0, 0.08], rFoot: [0.08, 0, -0.08], lArm: [-1.85, 0.15, 0.85], lElbow: [-0.45, 0, 0], lHand: [-0.9, 0.2, 0.15], rArm: [-1.75, -0.1, 0.75], rElbow: [-0.55, 0, 0], rHand: [-0.85, -0.1, 0.1] }],
        // Hold the charge — aura swells.
        [0.48, { hipY: -0.12, hips: [0, -0.2, 0], spine: [0.08, -0.1, 0], chest: [0.04, -0.05, 0], head: [-0.25, 0.08, 0], blink: 0, lFoot: [0.08, 0, 0.1], rFoot: [0.08, 0, -0.08], lArm: [-1.9, 0.18, 0.9], lElbow: [-0.4, 0, 0], lHand: [-0.95, 0.25, 0.18], rArm: [-1.8, -0.12, 0.8], rElbow: [-0.5, 0, 0], rHand: [-0.9, -0.12, 0.12] }],
        // Both hands thrust — Special Beam Cannon fires.
        [0.72, { hipY: -0.14, root: [0, 0, 0.18], hips: [0, 0.25, 0], spine: [0.22, -0.12, 0], chest: [0.12, -0.06, 0], head: [0.05, -0.1, 0], lFoot: [0.08, 0, 0.16], rFoot: [0.08, 0, -0.1], lArm: [-1.58, 0.06, 0.06], rArm: [-1.58, -0.06, 0.06], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lHand: [-1.45, 0.04, 0], rHand: [-1.45, -0.04, 0], blink: 0 }, 'snap'],
        [1.05, { hipY: -0.12, root: [0, 0, 0.14], spine: [0.15, -0.08, 0], lArm: [-1.5, 0.05, 0.1], rArm: [-1.5, -0.05, 0.1], lHand: [-1.35, 0.03, 0], rHand: [-1.35, -0.03, 0], blink: 1 }],
        [1.3, P({}, IDLES.gohanReady(0))],
      ],
      REST,
    ),
  },
  ssj2Combo: {
    // SSJ2 — vanish, rematerialize mid-punch, then a rising kick that ends them.
    // Lightning is form aura only — the hit itself is a blunt punch/kick.
    hit: 0.78,
    hits: [0.42, 0.78],
    zone: 'mid',
    release: 0.42,
    ranged: false,
    fx: 'shockwave',
    clip: clip(
      [
        [0, P({}, IDLES.ssj2Ready(0))],
        // Crouch — lightning crackles, ready to vanish.
        [0.1, { hipY: -0.22, spine: [0.42, 0, 0], chest: [0.14, 0, 0], head: [-0.22, 0, 0], blink: 0, lArm: [-0.95, -0.3, 0.75], rArm: [-0.95, 0.3, 0.75], lElbow: [-1.65, 0, 0], rElbow: [-1.65, 0, 0], lHand: [0.45, 0, 0], rHand: [0.45, 0, 0], lFoot: [0.1, 0, 0.1], rFoot: [0.1, 0, -0.08] }],
        // Z-Vanish blink.
        [0.16, { vis: 0, root: [0, 0.04, 0.1], hipY: -0.12 }],
        [0.3, { vis: 0, root: [0, 0.05, 0.4] }],
        // Rematerialize mid-punch (first hit).
        [0.36, { vis: 1, root: [0, 0, 0.38], hipY: -0.14, hips: [0, -0.5, 0], spine: [0.16, -0.45, 0], chest: [0, -0.2, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.12], lArm: [-0.7, 0, 0.4], lElbow: [-1.7, 0, 0], rArm: [0.55, 0, 0.55], rElbow: [-1.95, 0, 0], head: [0.05, -0.25, 0], blink: 0 }],
        [0.42, { root: [0, 0, 0.46], hipY: -0.16, hips: [0, 0.65, 0], spine: [0.24, -0.55, 0], chest: [0, -0.18, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.07, 0, -0.14], rArm: [-1.65, 0, 0.0], rElbow: [0, 0, 0], rHand: [-0.65, 0, 0], lArm: [0.45, 0, 0.55], lElbow: [-1.45, 0, 0], head: [0.08, -0.3, 0], blink: 0 }, 'snap'],
        // Chamber the rising kick.
        [0.56, { root: [0, 0, 0.22], hipY: -0.08, hips: [0.1, -0.2, 0], spine: [0.05, 0.12, 0], chest: [0.02, 0.06, 0], lFoot: [0.04, 0, 0.08], rFoot: [0.04, 0.32, 0.1], rToe: 0.4, lArm: [-0.65, 0, 0.55], rArm: [0.3, 0, 0.5], lElbow: [-1.45, 0, 0], rElbow: [-1.2, 0, 0] }],
        // Devastating kick (lethal).
        [0.78, { root: [0, 0, 0.2], hipY: -0.04, hips: [-0.24, -0.05, 0], spine: [-0.24, 0.1, 0], chest: [-0.08, 0, 0], head: [0.24, 0, 0], lFoot: [0.04, 0, 0.04], lToe: 0.2, rFoot: [0, 0.4, 0.54], rToe: 1.2, lArm: [-0.55, 0, 0.55], lElbow: [-1.6, 0, 0], rArm: [0.35, 0, 0.5], rElbow: [-1.2, 0, 0] }, 'snap'],
        [1.0, { hipY: -0.08, hips: [0, -0.1, 0], spine: [0.05, 0.05, 0], lFoot: [0.04, 0, 0.06], rFoot: [0.04, 0.18, 0.1], rToe: 0.3, lArm: [-0.7, 0, 0.4], rArm: [-0.5, 0, 0.4] }],
        [1.25, P({}, IDLES.ssj2Ready(0))],
      ],
      REST,
    ),
  },
  windSlash: {
    // Wind Magic — chamber air blades, then a twin crescent cut across the pad.
    hit: 0.42,
    hits: [0.28, 0.42],
    zone: 'mid',
    release: 0.28,
    ranged: true,
    fx: 'wind',
    clip: clip(
      [
        [0, P({}, IDLES.focused(0))],
        [0.12, { hipY: -0.1, root: [0, 0, 0.04], spine: [-0.12, 0.25, 0], chest: [-0.06, 0.1, 0], head: [-0.15, -0.1, 0], lArm: [-0.55, -0.4, 0.85], rArm: [-1.15, 0.35, 0.95], lElbow: [-0.9, 0, 0], rElbow: [-0.35, 0, 0], lHand: [0.2, 0, -0.4], rHand: [-0.3, 0, 0.2] }],
        [0.22, { hipY: -0.12, root: [0, 0, 0.12], hips: [0, -0.25, 0], spine: [0.08, 0.45, 0], chest: [0.04, 0.15, 0], lFoot: [0.03, 0, 0.1], rFoot: [0.05, 0, -0.08], lArm: [-0.9, -0.55, 0.7], rArm: [-1.45, -0.55, 1.15], lElbow: [-0.5, 0, 0], rElbow: [-0.1, 0, 0], rHand: [0, 0, 0.45], head: [0.05, -0.2, 0] }],
        [0.28, { hipY: -0.14, root: [0, 0, 0.28], hips: [0.08, 0.35, 0], spine: [0.18, -0.55, 0], chest: [0.08, -0.18, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.06, 0, -0.12], rArm: [-1.55, 0.65, 0.15], rElbow: [-0.05, 0, 0], rHand: [0.1, 0, 0.35], lArm: [0.25, -0.7, 0.55], lElbow: [-1.25, 0, 0], head: [0.06, -0.15, 0] }, 'snap'],
        [0.42, { hipY: -0.14, root: [0, 0, 0.34], hips: [0.1, -0.4, 0], spine: [0.2, 0.5, 0], chest: [0.06, 0.12, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.12], lArm: [-1.5, -0.55, 0.2], lElbow: [-0.08, 0, 0], lHand: [0.1, 0, 0.3], rArm: [0.3, 0.55, 0.55], rElbow: [-1.2, 0, 0], head: [0.05, 0.1, 0] }, 'snap'],
        [0.7, { hipY: -0.1, root: [0, 0, 0.26], spine: [0.1, 0.2, 0], lFoot: [0.03, 0, 0.14], rFoot: [0.05, 0, -0.08], lArm: [-0.85, -0.35, 0.55], rArm: [-0.7, 0.25, 0.55], lElbow: [-0.7, 0, 0], rElbow: [-0.55, 0, 0] }],
        [1.05, P({}, IDLES.focused(0))],
      ],
      REST,
    ),
  },
  whirlwind: {
    // Spirit Dive — hover, spin up fairy wings, unleash a green cyclone volley.
    hit: 0.55,
    hits: [0.38, 0.48, 0.55],
    zone: 'mid',
    release: 0.3,
    ranged: true,
    fx: 'whirlwind',
    clip: clip(
      [
        [0, P({}, IDLES.flutter(0))],
        [0.14, { root: [0, 0.26, -0.02], hipY: -0.04, hips: [0, -0.2, 0], spine: [-0.15, 0.15, 0], chest: [-0.08, 0.08, 0], lFoot: [0.02, 0.06, 0.02], rFoot: [0.03, 0.07, -0.04], lToe: 0.55, rToe: 0.6, lArm: [-0.45, 0, 0.9], rArm: [-0.45, 0, 0.9], lElbow: [-0.35, 0, 0], rElbow: [-0.35, 0, 0], head: [-0.12, -0.15, 0], flap: 0.25 }],
        [0.28, { root: [0, 0.32, 0], rootRot: [0, PI, 0], hips: [0, 0.1, 0], spine: [-0.08, -0.1, 0], lArm: [-1.15, 0, 1.2], rArm: [-1.15, 0, 1.2], lElbow: [-0.05, 0, 0], rElbow: [-0.05, 0, 0], head: [0.05, -0.2, 0], flap: 1.15 }],
        [0.38, { root: [0, 0.34, 0.04], rootRot: [0, PI * 2, 0], spine: [0.05, -0.15, 0], lArm: [-1.35, 0.1, 1.25], rArm: [-1.35, -0.1, 1.25], lElbow: [0, 0, 0], rElbow: [0, 0, 0], flap: 1.3 }, 'snap'],
        [0.48, { root: [0, 0.3, 0.06], rootRot: [0, PI * 2, 0], spine: [-0.05, 0.1, 0], lArm: [-1.2, -0.15, 1.1], rArm: [-1.2, 0.15, 1.1], flap: 1.05 }],
        [0.55, { root: [0, 0.36, 0.02], rootRot: [0, PI * 2, 0], spine: [-0.02, -0.2, 0], lArm: [-1.4, 0, 1.3], rArm: [-1.4, 0, 1.3], flap: 1.35 }, 'snap'],
        [0.82, { root: [0, 0.28, 0], rootRot: [0, PI * 2, 0], spine: [-0.06, 0.05, 0], lArm: [-0.7, 0, 0.75], rArm: [-0.55, -0.6, 0.7], lElbow: [-0.45, 0, 0], rElbow: [-1.1, 0, 0], flap: 0.6 }],
        [1.15, P({ rootRot: [0, PI * 2, 0] }, IDLES.flutter(0))],
      ],
      REST,
    ),
  },
  thunderSlash: {
    // Zenitsu — nervous crouch → iaido draw-cut with a yellow spark trail.
    hit: 0.26,
    hits: [0.26],
    zone: 'high',
    release: 0.26,
    ranged: false,
    fx: 'lightning',
    clip: clip(
      [
        [0, P({ prop: 0 }, IDLES.thunderReady(0))],
        [0.14, P({ prop: 0, blink: 0, hipY: -0.18, root: [0, 0, 0.04], spine: [0.28, 0.4, 0] }, IDLES.thunderReady(0))],
        [0.22, { prop: 1, hipY: -0.2, root: [0, 0, 0.36], lFoot: [0.04, 0, 0.24], rFoot: [0.06, 0, -0.14], hips: [0.12, 0.35, 0], spine: [0.3, -0.55, 0], chest: [0.1, -0.2, 0], rArm: [-1.55, 0.65, 1.15], rElbow: [-0.08, 0, 0], rHand: [0, 0, 0.35], lArm: [0.15, -0.75, 0.55], lElbow: [-1.15, 0, 0], head: [0.05, -0.15, 0] }, 'snap'],
        [0.5, { prop: 1, hipY: -0.18, root: [0, 0, 0.38], lFoot: [0.04, 0, 0.24], rFoot: [0.06, 0, -0.14], hips: [0.1, 0.3, 0], spine: [0.25, -0.45, 0], rArm: [-1.5, 0.55, 1.2], rElbow: [-0.1, 0, 0], rHand: [0, 0, 0.3], lArm: [0.1, -0.8, 0.5], lElbow: [-1.2, 0, 0], blink: 1 }],
        [0.85, { prop: 1, hipY: -0.12, root: [0, 0, 0.28], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.1], spine: [0.12, 0.15, 0], rArm: [-1.05, -0.85, 0.45], rElbow: [-1.35, 0, 0], lArm: [-0.2, -0.8, 0.4], lElbow: [-1.2, 0, 0], blink: 1 }],
        [1.05, P({ prop: 0, root: [0, 0, 0.18] }, IDLES.thunderReady(0))],
        [1.28, P({ prop: 0 }, IDLES.thunderReady(0))],
      ],
      REST,
    ),
  },
  thunderclapSlash: {
    // Awakened Zenitsu — Flash-pace sprint in, then a flurry of lightning-powered iaido cuts.
    hit: 0.42,
    hits: [0.32, 0.42, 0.55, 0.68],
    zone: 'high',
    release: 0.32,
    ranged: false,
    fx: 'voltBarrage',
    clip: clip(
      [
        [0, P({ prop: 0 }, IDLES.speedCrouch(0))],
        // Explode out of the crouch into a thunder sprint.
        [0.08, { prop: 0, hipY: -0.22, spine: [0.55, 0, 0], chest: [0.12, 0, 0], lArm: [0.9, 0, 0.25], rArm: [-0.9, 0, 0.25], lElbow: [-1.4, 0, 0], rElbow: [-1.4, 0, 0], lFoot: [0.04, 0.08, 0.14], rFoot: [0.04, 0, -0.1], head: [-0.25, 0, 0] }],
        [0.16, { prop: 0, root: [0, 0.04, 0.18], hipY: -0.08, spine: [0.4, -0.1, 0], hips: [0.1, 0.2, 0], lFoot: [0.02, 0.12, -0.12], rFoot: [0.02, 0.02, 0.16], lArm: [-1.0, 0, 0.2], rArm: [1.0, 0, 0.2], lElbow: [-1.5, 0, 0], rElbow: [-1.5, 0, 0], head: [-0.2, 0.1, 0] }],
        [0.24, { prop: 0, root: [0, 0.05, 0.3], hipY: -0.06, spine: [0.42, 0.1, 0], hips: [0.1, -0.2, 0], lFoot: [0.02, 0.02, 0.16], rFoot: [0.02, 0.12, -0.12], lArm: [1.0, 0, 0.2], rArm: [-1.0, 0, 0.2], lElbow: [-1.5, 0, 0], rElbow: [-1.5, 0, 0] }],
        // First Form draw — lightning slash (hit).
        [0.32, { prop: 1, root: [0, 0, 0.4], hipY: -0.16, hips: [0.12, 0.45, 0], spine: [0.28, -0.6, 0], chest: [0.1, -0.25, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.06, 0, -0.14], rArm: [-1.6, 0.7, 1.2], rElbow: [0, 0, 0], rHand: [0, 0, 0.4], lArm: [0.15, -0.7, 0.55], lElbow: [-1.1, 0, 0], head: [0.05, -0.2, 0], blink: 1 }, 'snap'],
        // Reverse cut.
        [0.42, { prop: 1, root: [0, 0, 0.44], hipY: -0.16, hips: [0.1, -0.5, 0], spine: [0.25, 0.55, 0], chest: [0.08, 0.18, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.06, 0, -0.12], rArm: [-1.7, -0.4, 1.15], rElbow: [-0.05, 0, 0], rHand: [0, 0, 0.4], lArm: [0.1, -0.65, 0.6], lElbow: [-1.05, 0, 0], head: [0.05, 0.15, 0], blink: 1 }, 'snap'],
        // Cross slash.
        [0.55, { prop: 1, root: [0, 0.02, 0.46], hipY: -0.14, hips: [0, 0.5, 0], spine: [0.3, -0.5, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.06, 0, -0.12], rArm: [-1.55, 0.55, 1.05], rElbow: [0, 0, 0], rHand: [0, 0, 0.35], lArm: [-0.4, -0.9, 0.45], lElbow: [-0.8, 0, 0], head: [0, -0.25, 0], blink: 1 }, 'snap'],
        // Final thunderclap overhead.
        [0.68, { prop: 1, root: [0, 0.04, 0.48], hipY: -0.12, hips: [0, 0, 0], spine: [0.15, 0, 0], chest: [-0.05, 0, 0], lFoot: [0.05, 0.02, 0.14], rFoot: [0.05, 0.02, -0.1], lArm: [-1.4, -0.2, 0.35], rArm: [-1.55, 0.2, 0.35], lElbow: [-0.15, 0, 0], rElbow: [-0.1, 0, 0], lHand: [-0.3, 0, 0.2], rHand: [-0.4, 0, 0.25], head: [-0.2, 0, 0], blink: 1 }, 'snap'],
        [0.9, { prop: 1, root: [0, 0, 0.4], hipY: -0.16, spine: [0.22, -0.15, 0], lArm: [-0.9, 0, 0.45], rArm: [-1.1, 0.4, 0.7], lElbow: [-1.1, 0, 0], rElbow: [-0.5, 0, 0], blink: 1 }],
        [1.15, P({ prop: 0 }, IDLES.speedCrouch(0))],
      ],
      REST,
    ),
  },
  zangetsuSlash: {
    // Ichigo — hoist oversized Zangetsu off the shoulder into a heavy cleaving slash.
    hit: 0.36,
    hits: [0.24, 0.36],
    zone: 'high',
    release: 0.36,
    ranged: false,
    fx: 'slash',
    clip: clip(
      [
        [0, P({}, IDLES.ichigoReady(0))],
        // Chamber — blade rises overhead.
        [0.14, { hipY: -0.1, root: [0, 0, 0.06], hips: [0.06, -0.2, 0], spine: [-0.12, 0.2, 0], chest: [-0.06, 0.1, 0], head: [-0.2, 0.15, 0], blink: 0, lArm: [-0.55, -0.35, 0.55], lElbow: [-0.9, 0, 0], rArm: [-2.35, -0.25, 0.75], rElbow: [-0.2, 0, 0], rHand: [0.15, 0.1, 0.2], lFoot: [0.05, 0, 0.1], rFoot: [0.07, 0, -0.1] }],
        // First diagonal cleave.
        [0.24, { hipY: -0.14, root: [0, 0, 0.3], hips: [0.1, 0.45, 0], spine: [0.22, -0.55, 0], chest: [0.1, -0.18, 0], head: [0.05, -0.15, 0], lFoot: [0.04, 0, 0.2], rFoot: [0.08, 0, -0.14], rArm: [-1.7, 0.5, 0.2], rElbow: [-0.08, 0, 0], rHand: [0.1, 0, 0.4], lArm: [0.25, -0.7, 0.5], lElbow: [-1.15, 0, 0] }, 'snap'],
        // Reverse heavy slash — orange Getsuga trail.
        [0.36, { hipY: -0.16, root: [0, 0, 0.38], hips: [0.12, 0.35, 0], spine: [0.28, 0.5, 0], chest: [0.12, 0.15, 0], head: [0.08, -0.1, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.08, 0, -0.14], rArm: [-1.85, -0.35, 1.2], rElbow: [-0.05, 0, 0], rHand: [0.05, 0, 0.45], lArm: [0.15, -0.65, 0.55], lElbow: [-1.1, 0, 0] }, 'snap'],
        [0.6, { hipY: -0.12, root: [0, 0, 0.3], hips: [0.08, 0.2, 0], spine: [0.16, 0.25, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.07, 0, -0.1], rArm: [-1.45, -0.25, 0.9], rElbow: [-0.35, 0, 0], rHand: [0.1, 0, 0.25], lArm: [-0.2, -0.45, 0.4], lElbow: [-1.0, 0, 0], blink: 1 }],
        [0.95, P({}, IDLES.ichigoReady(0))],
      ],
      REST,
    ),
  },
  getsugaSlash: {
    // Final Getsuga — dash through, then a void-dimension crescent that erases the pad.
    hit: 0.48,
    hits: [0.28, 0.48],
    zone: 'mid',
    release: 0.28,
    ranged: true,
    fx: 'getsuga',
    clip: clip(
      [
        [0, P({}, IDLES.mugetsuReady(0))],
        // Coil — void pressure gathers in the blade-arm.
        [0.12, { hipY: -0.14, root: [0, 0, 0.04], hips: [0.08, -0.25, 0], spine: [0.2, 0.35, 0], chest: [0.08, 0.12, 0], head: [-0.15, 0.2, 0], blink: 0, lArm: [-0.5, -0.45, 0.55], lElbow: [-1.0, 0, 0], rArm: [-1.65, -0.55, 1.1], rElbow: [-0.2, 0, 0], rHand: [0.2, 0, 0.35], lFoot: [0.05, 0, 0.12], rFoot: [0.07, 0, -0.1] }],
        // First void cut (close).
        [0.28, { hipY: -0.16, root: [0, 0, 0.36], hips: [0.12, 0.5, 0], spine: [0.28, -0.6, 0], chest: [0.12, -0.2, 0], head: [0.05, -0.2, 0], lFoot: [0.04, 0, 0.22], rFoot: [0.08, 0, -0.14], rArm: [-1.75, 0.55, 0.15], rElbow: [-0.05, 0, 0], rHand: [0.1, 0, 0.45], lArm: [0.2, -0.7, 0.55], lElbow: [-1.15, 0, 0] }, 'snap'],
        // Dark-dimension Getsuga — wide void crescent (lethal).
        [0.48, { hipY: -0.18, root: [0, 0.02, 0.42], hips: [0.1, 0.25, 0], spine: [0.32, 0.45, 0], chest: [0.14, 0.12, 0], head: [0.1, -0.15, 0], lFoot: [0.04, 0, 0.24], rFoot: [0.08, 0, -0.14], rArm: [-1.9, -0.25, 1.25], rElbow: [0, 0, 0], rHand: [0.05, 0, 0.5], lArm: [0.1, -0.6, 0.6], lElbow: [-1.05, 0, 0] }, 'snap'],
        [0.75, { hipY: -0.12, root: [0, 0, 0.32], hips: [0.06, 0.15, 0], spine: [0.18, 0.2, 0], lFoot: [0.05, 0, 0.16], rFoot: [0.07, 0, -0.1], rArm: [-1.2, -0.15, 0.7], rElbow: [-0.35, 0, 0], lArm: [-0.3, -0.35, 0.45], lElbow: [-0.9, 0, 0], blink: 1 }],
        [1.1, P({}, IDLES.mugetsuReady(0))],
      ],
      REST,
    ),
  },
  sandBarrage: {
    // Gaara — raise the gourd sand, then twin crushing waves across the pad.
    hit: 0.44,
    hits: [0.3, 0.44],
    zone: 'mid',
    release: 0.3,
    ranged: true,
    fx: 'sand',
    clip: clip(
      [
        [0, P({}, IDLES.armsCrossed(0))],
        // Uncross — palms open to call the sand.
        [0.12, { hipY: -0.1, root: [0, 0, 0.04], spine: [-0.08, 0.15, 0], chest: [-0.04, 0.08, 0], head: [-0.1, -0.1, 0], lArm: [-0.85, -0.55, 0.95], rArm: [-0.85, 0.55, 0.95], lElbow: [-0.35, 0, 0], rElbow: [-0.35, 0, 0], lHand: [0.3, 0, -0.25], rHand: [0.3, 0, 0.25] }],
        [0.22, { hipY: -0.12, root: [0, 0, 0.1], hips: [0, -0.2, 0], spine: [0.06, 0.35, 0], chest: [0.04, 0.12, 0], lFoot: [0.03, 0, 0.08], rFoot: [0.05, 0, -0.06], lArm: [-1.15, -0.65, 1.05], rArm: [-1.35, 0.45, 1.15], lElbow: [-0.15, 0, 0], rElbow: [-0.1, 0, 0], lHand: [0.15, 0, -0.35], rHand: [0.1, 0, 0.4], head: [0.05, -0.15, 0] }],
        // First sand wave (right palm sweep).
        [0.3, { hipY: -0.14, root: [0, 0, 0.26], hips: [0.08, 0.35, 0], spine: [0.16, -0.5, 0], chest: [0.08, -0.16, 0], lFoot: [0.04, 0, 0.16], rFoot: [0.06, 0, -0.1], rArm: [-1.55, 0.7, 0.2], rElbow: [-0.05, 0, 0], rHand: [0.15, 0, 0.4], lArm: [0.2, -0.65, 0.55], lElbow: [-1.2, 0, 0], head: [0.06, -0.12, 0] }, 'snap'],
        // Second crushing surge (left).
        [0.44, { hipY: -0.14, root: [0, 0, 0.32], hips: [0.1, -0.4, 0], spine: [0.18, 0.48, 0], chest: [0.06, 0.12, 0], lFoot: [0.04, 0, 0.18], rFoot: [0.06, 0, -0.1], lArm: [-1.5, -0.6, 0.25], lElbow: [-0.08, 0, 0], lHand: [0.1, 0, 0.35], rArm: [0.25, 0.5, 0.55], rElbow: [-1.15, 0, 0], head: [0.05, 0.1, 0] }, 'snap'],
        [0.72, { hipY: -0.1, root: [0, 0, 0.22], spine: [0.08, 0.15, 0], lFoot: [0.03, 0, 0.12], rFoot: [0.05, 0, -0.08], lArm: [-0.75, -0.3, 0.55], rArm: [-0.65, 0.25, 0.55], lElbow: [-0.65, 0, 0], rElbow: [-0.55, 0, 0] }],
        [1.05, P({}, IDLES.armsCrossed(0))],
      ],
      REST,
    ),
  },
  sandCoffin: {
    // Shukaku — sink into sand → rematerialize → bury them in a sand tomb → crush.
    hit: 0.52,
    hits: [
      { t: 0.52, zone: 'low', hold: true },
      { t: 0.95, zone: 'mid' },
    ],
    zone: 'mid',
    release: 0.52,
    ranged: false,
    fx: 'sand',
    clip: clip(
      [
        [0, P({}, IDLES.feral(0))],
        // Crouch — sand pools underfoot.
        [0.1, { hipY: -0.26, spine: [0.55, 0, 0], chest: [0.12, 0, 0], lArm: [0.7, 0, 0.45], rArm: [0.7, 0, 0.45], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], head: [-0.25, 0, 0] }],
        // Dissolve into the pad.
        [0.18, { vis: 0, hipY: -0.45, root: [0, -0.32, 0.08] }],
        // Ghost under sand toward their feet.
        [0.34, { vis: 0, root: [0, -0.75, 0.4], hipY: -0.2 }],
        // Erupt from sand — claws latch onto them.
        [0.42, { vis: 1, root: [0, -0.55, 0.44], hipY: -0.08, hips: [0, 0.2, 0], spine: [-0.5, 0, 0], chest: [-0.22, 0, 0], lFoot: [0.04, 0.18, 0.08], rFoot: [0.05, 0.16, -0.06], lArm: [-2.5, -0.2, 0.4], lElbow: [-0.12, 0, 0], rArm: [-2.5, 0.2, 0.4], rElbow: [-0.12, 0, 0], lHand: [-0.45, 0, 0], rHand: [-0.45, 0, 0], head: [-0.5, 0, 0] }],
        // Sand coffin clamps shut (trap / bury).
        [0.52, { root: [0, -0.72, 0.44], hipY: -0.14, hips: [0, 0.12, 0], spine: [-0.3, 0, 0], chest: [-0.12, 0, 0], lFoot: [0.05, 0.1, 0.06], rFoot: [0.05, 0.08, -0.05], lArm: [-1.7, -0.15, 0.25], lElbow: [-0.4, 0, 0], rArm: [-1.7, 0.15, 0.25], rElbow: [-0.4, 0, 0], lHand: [0.35, 0, 0], rHand: [0.35, 0, 0], head: [-0.3, 0, 0] }, 'snap'],
        // Sink briefly while the tomb holds them.
        [0.62, { vis: 0, root: [0, -0.5, 0.36], hipY: -0.22 }],
        // Rematerialize over the coffin to crush.
        [0.76, { vis: 1, root: [0, 0.04, 0.36], hipY: -0.1, hips: [0, -0.4, 0], spine: [0.08, -0.35, 0], chest: [0, -0.15, 0], lFoot: [0.04, 0, 0.14], rFoot: [0.06, 0, -0.1], lArm: [-0.85, 0, 0.55], lElbow: [-1.2, 0, 0], rArm: [-0.85, 0, 0.55], rElbow: [-1.2, 0, 0], head: [0.05, -0.15, 0] }],
        // Crush the sand tomb — lethal bury.
        [0.95, { root: [0, 0, 0.42], hipY: -0.18, hips: [0, 0.45, 0], spine: [0.35, 0, 0], chest: [0.12, 0, 0], lFoot: [0.05, 0, 0.18], rFoot: [0.06, 0, -0.12], lArm: [-1.85, -0.15, 0.15], lElbow: [-0.1, 0, 0], rArm: [-1.85, 0.15, 0.15], rElbow: [-0.1, 0, 0], lHand: [0.4, 0, 0], rHand: [0.4, 0, 0], head: [0.15, 0, 0] }, 'snap'],
        [1.15, { root: [0, 0, 0.34], hipY: -0.1, hips: [0, 0.15, 0], spine: [0.12, 0, 0], lArm: [-0.9, 0, 0.45], rArm: [-0.9, 0, 0.45], lElbow: [-0.55, 0, 0], rElbow: [-0.55, 0, 0] }],
        [1.35, P({}, IDLES.feral(0))],
      ],
      REST,
    ),
  },
}

// ───────────────────────── Combos ─────────────────────────

interface ComboSpec {
  pre?: MoveName[]
  post?: MoveName[]
  /** Truncate the signature here before `post` (skip its slow recovery). */
  cut?: number
  dmg?: DamageType
  sever?: SeverSpec
}

const COMBOS: Partial<Record<AttackStyle, ComboSpec>> = {
  flameKick: { pre: ['jab', 'cross'] },
  magPull: { pre: ['lowKick'] },
  stomp: { pre: ['jab', 'cross'] },
  thrust: { pre: ['jab', 'jab'] },
  shoulderCharge: { pre: ['jab', 'cross', 'hook'] },
  turboPunch: { post: ['roundhouse'], cut: 0.7 },
  flyingKick: { pre: ['frontKick', 'spinBackKick'] },
  phasePunch: { dmg: 'slash', sever: 'head' },
  portalGate: { pre: ['jab', 'cross'] },
  flyingRaijin: { dmg: 'blunt' },
  boogieWoogie: { dmg: 'blunt' },
  wristShot: { dmg: 'pierce', sever: 'head' },
  featherShot: { dmg: 'pierce', sever: 'head' },
  shardPalm: { pre: ['jab', 'lowKick'] },
  powerPunch: { pre: ['jab', 'cross'] },
  clawSwipe: { pre: ['knee'], sever: 'lArm' },
  zap: { pre: ['jab'] },
  hammerFist: { pre: ['frontKick', 'cross'] },
  slash: { sever: 'rArm' },
  slideKick: { pre: ['roundhouse'] },
  pounce: { pre: ['hook'] },
  tectonicRam: { pre: ['cross', 'uppercut'] },
  axeKick: { pre: ['jab', 'spinBackKick'] },
  micSwing: { pre: ['frontKick'], dmg: 'blunt' },
  iaido: { sever: 'head' },
  senbonzakura: { sever: 'head', dmg: 'slash' },
  railShot: { post: ['hook', 'uppercut'], cut: 0.5 },
  cardThrow: { sever: 'rArm' },
  ratioSlice: { sever: 'rArm', dmg: 'slash' },
  murasaki: { dmg: 'pierce', sever: 'head' },
  gatesOfBabylon: { dmg: 'slash' },
  overhaul: { dmg: 'slash', sever: 'all' },
  ryujinJakka: { dmg: 'burn' },
  emberFlick: { dmg: 'burn' },
  cruelSun: { dmg: 'burn' },
  seriousPunch: { dmg: 'blunt' },
  mobPunch: { dmg: 'blunt' },
  percentBlast: { dmg: 'beam', sever: 'head' },
  // Dash-in already closes — spin kick after the rising kick.
  leafCombo: { post: ['roundhouse'], cut: 0.9 },
  // Speed FX on hits; burn damage chars the corpse on the finisher.
  gatesBurn: { post: ['spinBackKick'], cut: 0.85, dmg: 'burn' },
  ofaPunch: { pre: ['jab', 'cross'], dmg: 'blunt' },
  ofaSmash: { dmg: 'blunt' },
  texasSmash: { pre: ['jab', 'cross'], dmg: 'blunt' },
  unitedSmash: { dmg: 'blunt' },
  chainsawRip: { dmg: 'slash', sever: 'head' },
  heroOfHell: { dmg: 'slash', sever: 'all' },
  jackpotRush: { pre: ['jab', 'cross'] },
  jackpotBurst: { dmg: 'blunt' },
  ghoulSlash: { dmg: 'slash', sever: 'rArm' },
  rinkakuRip: { dmg: 'slash', sever: 'all' },
  plasmaSlash: { dmg: 'burn', sever: 'rArm' },
  excaliburInferno: { dmg: 'burn', sever: 'head' },
  moriCombo: { pre: ['jab', 'cross'] },
  yeouiCrush: { dmg: 'blunt' },
  beamCannon: { dmg: 'beam', sever: 'head' },
  ssj2Combo: { dmg: 'blunt' },
  windSlash: { pre: ['jab'], dmg: 'slash' },
  whirlwind: { dmg: 'slash' },
  thunderSlash: { sever: 'head', dmg: 'shock' },
  thunderclapSlash: { sever: 'head', dmg: 'shock' },
  zangetsuSlash: { dmg: 'slash', sever: 'rArm' },
  getsugaSlash: { dmg: 'slash', sever: 'head' },
  sandBarrage: { pre: ['jab'], dmg: 'blunt' },
  sandCoffin: { dmg: 'blunt', sever: 'head' },
}

const DAMAGE: Record<FxKind, DamageType> = {
  fire: 'burn',
  impact: 'blunt',
  shockwave: 'blunt',
  slash: 'slash',
  pierce: 'pierce',
  beam: 'beam',
  darkBeam: 'beam',
  rings: 'blunt',
  chain: 'pierce',
  cards: 'slash',
  lightning: 'shock',
  voltBeam: 'shock',
  voltBarrage: 'shock',
  shards: 'pierce',
  glitch: 'beam',
  sparkle: 'blunt',
  gravity: 'blunt',
  magnet: 'blunt',
  speed: 'blunt',
  phase: 'blunt',
  portal: 'blunt',
  kunai: 'pierce',
  rasengan: 'blunt',
  bullet: 'pierce',
  feather: 'pierce',
  ratioSlash: 'slash',
  sakura: 'slash',
  murasaki: 'pierce',
  babylon: 'slash',
  inferno: 'burn',
  overhaul: 'slash',
  percentBlast: 'beam',
  chainsaw: 'slash',
  kagune: 'slash',
  yeoui: 'blunt',
  wind: 'slash',
  whirlwind: 'slash',
  getsuga: 'slash',
  sand: 'blunt',
}

export interface Hit {
  t: number
  zone: HitZone
  /** Keep this reaction posed until the next blow / death (floor trap, etc.). */
  hold?: boolean
}

export interface AttackDef {
  clip: Clip
  /** Seconds after attack start when the lethal blow lands. */
  hit: number
  /** Every contact in order; the last one is lethal, earlier ones stagger the victim. */
  hits: Hit[]
  /** When the signature fx lands (melee) — may precede `hit` when a combo follows it. */
  fxAt: number
  /** Ranged attacks fire from the start square; fx travels from `release` to `hit`. */
  ranged: boolean
  release: number
  fx: FxKind
  /** Optional flash projectile before the signature (absolute times within the attack clip). */
  throwFx?: { kind: FxKind; at: number; travel: number }
  dmg: DamageType
  sever?: SeverSpec
}

function buildAttack(style: AttackStyle): AttackDef {
  const sig = SIGS[style]
  const spec = COMBOS[style] ?? {}
  const pre = sig.ranged ? [] : (spec.pre ?? [])
  const post = sig.ranged ? [] : (spec.post ?? [])
  const keys: ClipKey[] = []
  const hits: Hit[] = []
  let T = 0
  let spin = 0
  let zOff = 0

  const addMove = (name: MoveName) => {
    const m = MOVES[name]
    for (const [dt, part, f] of m.keys) {
      const pose = P(part, STANCE)
      pose.rootRot[1] += spin
      pose.root[2] += zOff
      keys.push({ t: T + dt, pose, snap: f === 'snap' })
    }
    hits.push({ t: T + m.contact, zone: m.zone })
    spin += m.spin ?? 0
    T += m.dur
  }

  if (pre.length) {
    keys.push({ t: 0, pose: clonePose(STANCE), snap: false })
    // Step in to signature range, pressing a little further as the victim is knocked back.
    const step = clonePose(STANCE)
    step.root[2] = PRE_STEP
    step.hipY -= 0.03
    T = 0.14
    keys.push({ t: T, pose: step, snap: false })
    pre.forEach((m, i) => {
      zOff = PRE_STEP + HURT_PUSH * i
      addMove(m)
    })
    zOff = 0
  }

  const cut = post.length ? (spec.cut ?? sig.clip.dur) : sig.clip.dur
  sig.clip.keys.forEach((k, i) => {
    if (i === 0 && pre.length) return
    if (k.t > cut) return
    const pose = clonePose(k.pose)
    pose.rootRot[1] += spin
    keys.push({ t: T + k.t, pose, snap: k.snap })
  })
  if (post.length) {
    const end = sampleClip(sig.clip, cut, restPose())
    end.rootRot[1] += spin
    if (keys[keys.length - 1].t < T + cut - 1e-4) keys.push({ t: T + cut, pose: end, snap: false })
    spin = round(end.rootRot[1] / TAU) * TAU
    zOff = max(0, end.root[2] - 0.2)
  }
  for (const h of sig.hits ?? [sig.hit]) {
    const spec = typeof h === 'number' ? { t: h } : h
    hits.push({ t: T + spec.t, zone: spec.zone ?? sig.zone ?? 'mid', hold: spec.hold })
  }
  const fxAt = T + sig.hit
  const release = T + sig.release
  const throwFx = sig.throwFx
    ? {
        kind: sig.throwFx.kind,
        at: T + sig.throwFx.release,
        travel: Math.max(0.04, sig.throwFx.arrive - sig.throwFx.release),
      }
    : undefined
  T += cut

  if (post.length) {
    post.forEach(addMove)
    // Settle back over the step taken during the signature.
    const settle = clonePose(STANCE)
    settle.rootRot[1] += spin
    keys.push({ t: T + 0.25, pose: settle, snap: false })
  }

  const lastHit = post.length ? hits[hits.length - 1] : hits.reduce((a, b) => (b.t > a.t ? b : a))
  hits.sort((a, b) => a.t - b.t)
  return {
    clip: finalize(keys),
    hit: lastHit.t,
    hits,
    fxAt,
    ranged: sig.ranged,
    release,
    fx: sig.fx,
    throwFx,
    dmg: spec.dmg ?? DAMAGE[sig.fx],
    sever: spec.sever,
  }
}

const ATTACKS = new Map<string, AttackDef>()

/** Signatures lunge ~0.4 and reach ~0.78, so plain punches/kicks need to close this much. */
const PRE_STEP = 0.2
/** Root knockback per combo blow. */
const HURT_PUSH = 0.035

// ───────────────────────── Hit reactions ─────────────────────────

const HURT_HIGH: PartialPose = {
  hipY: -0.06,
  neck: [-0.2, 0, 0],
  spine: [-0.32, 0, 0],
  chest: [-0.16, 0, 0],
  head: [-0.55, 0, 0],
  lArm: [-0.4, 0, 0.9],
  rArm: [-0.4, 0, 0.9],
  lElbow: [-0.9, 0, 0],
  rElbow: [-0.9, 0, 0],
  lFoot: [0.03, 0, 0.06],
  rFoot: [0.05, 0, -0.16],
  blink: 1,
}

const HURT_MID: PartialPose = {
  hipY: -0.12,
  hips: [0.15, 0, 0],
  spine: [0.5, 0, 0],
  chest: [0.25, 0, 0],
  head: [0.2, 0, 0],
  lArm: [-0.5, -0.5, 0.15],
  rArm: [-0.5, -0.5, 0.15],
  lElbow: [-1.7, 0, 0],
  rElbow: [-1.7, 0, 0],
  lFoot: [0.03, 0, 0.03],
  rFoot: [0.05, 0, -0.14],
  blink: 1,
}

const HURT_LOW: PartialPose = {
  hipY: -0.15,
  hips: [0.1, 0, 0.18],
  spine: [0.25, 0, -0.22],
  head: [0.15, 0, 0.1],
  lFoot: [0.04, 0.05, 0.04],
  lToe: 0.5,
  rFoot: [0.05, 0, -0.12],
  lArm: [-0.6, 0, 0.8],
  rArm: [-0.3, 0, 0.7],
  lElbow: [-0.8, 0, 0],
  rElbow: [-1.0, 0, 0],
  blink: 1,
}

const hurtTargets = {
  high: [P(HURT_HIGH, STANCE), P({ ...HURT_HIGH, head: [-0.45, 0.5, 0.35], spine: [-0.25, 0.3, 0.1] }, STANCE)],
  mid: [P(HURT_MID, STANCE), P({ ...HURT_MID, spine: [0.45, -0.2, 0.08] }, STANCE)],
  low: [P(HURT_LOW, STANCE), P({ ...HURT_LOW, hips: [0.1, 0, -0.18], spine: [0.25, 0, 0.22] }, STANCE)],
}

/** Stuck mid-torso in the floor — arms thrashing, only the upper body free. */
function trapPose(t: number): Pose {
  const rise = t < 0.14 ? smooth(t / 0.14) : 1
  const thrash = sin(t * 18) * 0.12
  const thrash2 = cos(t * 14) * 0.1
  const out = P(
    {
      root: [thrash * 0.02, -0.6 * rise, 0],
      hipY: -0.18,
      hips: [0.08 + thrash * 0.15, thrash2 * 0.4, 0],
      spine: [-0.35 + thrash * 0.2, thrash2 * 0.5, thrash * 0.25],
      chest: [-0.2, thrash * 0.3, thrash2 * 0.15],
      head: [-0.45 + thrash * 0.15, thrash2 * 0.6, thrash * 0.2],
      neck: [-0.15, 0, 0],
      lArm: [-2.2 + thrash * 0.4, -0.5 + thrash2, 0.55],
      rArm: [-2.15 - thrash * 0.4, 0.5 - thrash2, 0.55],
      lElbow: [-0.35, 0, 0],
      rElbow: [-0.35, 0, 0],
      lHand: [0.4, 0, 0.3],
      rHand: [0.4, 0, 0.3],
      lFoot: [0.04, 0.15, 0.06],
      rFoot: [0.05, 0.12, -0.05],
      blink: 1,
    },
    STANCE,
  )
  return out
}

function hurtPose(t: number, zone: HitZone, n: number, hold = false): Pose {
  if (hold) return trapPose(t)
  const env = t < 0.05 ? smooth(t / 0.05) : 1 - smooth((t - 0.08) / 0.38)
  const target = hurtTargets[zone][n % 2]
  const out = lerpPose(restPose(), STANCE, target, env)
  // Each blow knocks them back a little further; it never springs back.
  out.root[2] = -HURT_PUSH * (n - 1 + smooth(t / 0.16))
  out.root[0] = (n % 2 ? 0.015 : -0.015) * env
  out.blink = env > 0.35 ? 1 : 0
  return out
}

// ───────────────────────── Public API ─────────────────────────

export type AnimInput =
  | { kind: 'idle'; t: number }
  | { kind: 'ready'; t: number }
  | { kind: 'move'; style: MoveStyle; t: number; p: number; dist: number }
  | { kind: 'attack'; t: number }
  /** Staggered by blow `n` (1-based) of a combo, `t` seconds ago. */
  | { kind: 'hurt'; t: number; zone: HitZone; n: number; hold?: boolean }
  | { kind: 'death'; t: number; dmg: DamageType; zone: HitZone; sever?: SeverSpec }

function scaleClip(c: Clip, s: number): Clip {
  return {
    dur: c.dur * s,
    keys: c.keys.map((k) => ({ t: k.t * s, pose: k.pose, snap: k.snap })),
    vals: c.vals,
    // Tangents are d(value)/d(t) — compressing time steepens them.
    tans: c.tans.map((t) => {
      const out = new Float32Array(t.length)
      for (let i = 0; i < t.length; i++) out[i] = t[i] / s
      return out
    }),
  }
}

function scaleAttack(a: AttackDef, mul: number): AttackDef {
  const s = 1 / mul
  return {
    ...a,
    clip: scaleClip(a.clip, s),
    hit: a.hit * s,
    release: a.release * s,
    fxAt: a.fxAt * s,
    hits: a.hits.map((h) => ({ t: h.t * s, zone: h.zone })),
    throwFx: a.throwFx
      ? { kind: a.throwFx.kind, at: a.throwFx.at * s, travel: a.throwFx.travel * s }
      : undefined,
  }
}

export function attackFor(d: HeroDesign): AttackDef {
  const mul = d.attackSpeedMul ?? 1
  const key = mul === 1 ? d.attack : `${d.attack}*${mul}`
  let a = ATTACKS.get(key)
  if (!a) {
    a = buildAttack(d.attack)
    if (mul !== 1) a = scaleAttack(a, mul)
    ATTACKS.set(key, a)
  }
  return a
}

/** Seconds a fighter lies on the board after the killing blow before vanishing. */
export function deathDuration(d: HeroDesign, dmg: DamageType = 'blunt'): number {
  if (d.death === 'shatter') return 1.15
  const extra = dmg === 'shock' ? 0.5 : dmg === 'burn' ? 0.35 : 0
  return (d.death === 'dissolve' ? 1.9 : 2.4) + extra
}

export type { DeathStyle }

/** Style-specific stride length (local units per full cycle). */
const STRIDE: Record<Exclude<MoveStyle, 'vector' | 'fly' | 'teleport'>, number> = {
  run: 1.05,
  dash: 1.35,
  walk: 0.5,
  leap: 1,
  sprint: 1.3,
}

const scratch = restPose()

/** Evaluate the target pose for this frame. `seed` desyncs identical idles. */
export function evalPose(d: HeroDesign, a: AnimInput, seed: number): Pose {
  const tempo = d.tempo ?? 1
  switch (a.kind) {
    case 'idle': {
      const t = a.t * tempo + seed * 7.3
      const pose = IDLES[d.idle](t)
      // Blink every few seconds unless the idle already shuts the eyes.
      if (pose.blink < 1) pose.blink = max(pose.blink, beat(a.t + seed * 3.1, 3.6 + seed, 0.14))
      return pose
    }
    case 'ready': {
      const idle = IDLES[d.idle](a.t * tempo + seed * 7.3)
      const b = abs(sin(a.t * 4.5)) * 0.015
      const sway = sin(a.t * 2.25) * 0.012
      const stance = P(
        {
          hipY: STANCE.hipY + b,
          root: [sway, 0, 0],
          lFoot: [0.03, b * 0.6, 0.1],
          rFoot: [0.05, b * 0.6, -0.08],
          lToe: b * 6,
          rToe: b * 6,
          head: [0.02 - b, 0.06, 0],
          lArm: [-0.8 - cos(a.t * 2.25) * 0.05, 0, 0.32],
          rArm: [-0.4 + cos(a.t * 2.25) * 0.05, 0, 0.42],
        },
        STANCE,
      )
      return clonePose(lerpPose(scratch, idle, stance, 0.7))
    }
    case 'move': {
      if (a.style === 'leap') {
        if (d.extras.includes('lemillionSuit')) return sampleClip(PHASE_LEAP, a.p, restPose())
        if (d.extras.includes('finralSuit')) return sampleClip(PORTAL_LEAP, a.p, restPose())
        if (d.extras.includes('minatoSuit')) return sampleClip(KUNAI_LEAP, a.p, restPose())
        if (d.extras.includes('todoKit')) return sampleClip(CLAP_LEAP, a.p, restPose())
        return sampleClip(LEAP, a.p, restPose())
      }
      if (a.style === 'vector') return vectorPose(a.p, a.t)
      if (a.style === 'fly') return flyPose(a.p, a.t)
      if (a.style === 'teleport') {
        // Character-specific blinks still use their signature clips.
        if (d.extras.includes('lemillionSuit')) return sampleClip(PHASE_LEAP, a.p, restPose())
        if (d.extras.includes('finralSuit')) return sampleClip(PORTAL_LEAP, a.p, restPose())
        if (d.extras.includes('minatoSuit')) return sampleClip(KUNAI_LEAP, a.p, restPose())
        if (d.extras.includes('todoKit')) return sampleClip(CLAP_LEAP, a.p, restPose())
        return teleportPose(a.p, a.t)
      }
      const stride = d.stride ?? STRIDE[a.style]
      return gaitPose(a.dist / stride, a.style, stride)
    }
    case 'attack':
      return sampleClip(attackFor(d).clip, a.t, restPose())
    case 'hurt':
      return hurtPose(a.t, a.zone, a.n, a.hold)
    case 'death':
      // The ragdoll owns the body; this only seeds the first frame.
      return clonePose(STANCE)
  }
}

