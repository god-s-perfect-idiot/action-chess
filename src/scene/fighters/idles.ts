import type { IdleStyle } from '../../game/heroDesigns'
import { P, type Pose } from './rig'

const { sin, cos, abs, max, floor, PI } = Math

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const smooth = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}
/** Deterministic noise in [-1, 1]. */
export const noise = (n: number) => {
  const x = sin(n * 127.1 + 311.7) * 43758.5453
  return (x - floor(x)) * 2 - 1
}
/** 1 for `width` seconds at the start of every `period`, eased. */
export const beat = (t: number, period: number, width: number) => {
  const local = t % period
  if (local > width) return 0
  return sin((local / width) * PI)
}

// ───────────────────────── Shared stances ─────────────────────────

export const STANCE = P({
  hipY: -0.05,
  hips: [0, -0.28, 0],
  spine: [0.08, 0.14, 0],
  chest: [0, 0.08, 0],
  head: [0.02, 0.06, 0],
  lFoot: [0.03, 0, 0.1],
  rFoot: [0.05, 0, -0.08],
  lArm: [-0.8, 0, 0.32],
  lElbow: [-1.9, 0, 0],
  rArm: [-0.4, 0, 0.42],
  rElbow: [-2.2, 0, 0],
  lHand: [0.2, 0, 0],
  rHand: [0.2, 0, 0],
})

// ───────────────────────── Idles ─────────────────────────

export type IdleFn = (t: number) => Pose

export const IDLES: Record<IdleStyle, IdleFn> = {
  warmup: (t) => {
    const b = sin(t * 4)
    const roll = sin(t * 1.1)
    const shake = beat(t, 3.2, 1.2)
    return P({
      hipY: -0.02 + b * 0.01,
      lFoot: [0.04, 0, 0.03],
      rFoot: [0.04, 0, -0.02],
      spine: [0.06, 0, 0],
      head: [0.08 + roll * 0.12, roll * 0.25, roll * 0.18],
      lArm: [-0.2 + sin(t * 11) * 0.12 * shake, 0, 0.22],
      lElbow: [-1.0 - sin(t * 13) * 0.4 * shake, 0, 0],
      lHand: [sin(t * 13) * 0.5 * shake, 0, 0],
      rArm: [-0.2 + sin(t * 11 + 1) * 0.12 * shake, 0, 0.22],
      rElbow: [-1.0 - sin(t * 13 + 1.7) * 0.4 * shake, 0, 0],
      rHand: [sin(t * 13 + 1.7) * 0.5 * shake, 0, 0],
    })
  },
  stretch: (t) => {
    const s = sin(t * 0.9)
    return P({
      lFoot: [0.06, 0, 0],
      rFoot: [0.06, 0, 0],
      root: [-s * 0.02, 0, 0],
      spine: [0, 0, s * 0.3],
      chest: [0, 0, s * 0.18],
      head: [0, 0, s * 0.15],
      lArm: [-2.9, 0, 0.25 + max(0, -s) * 0.3],
      lElbow: [-0.9 + max(0, s) * 0.6, 0, 0],
      rArm: [-2.9, 0, 0.25 + max(0, s) * 0.3],
      rElbow: [-0.9 + max(0, -s) * 0.6, 0, 0],
      lHand: [0, 0, -0.4],
      rHand: [0, 0, -0.4],
    })
  },
  sumo: (t) => {
    const w = sin(t * 1.3)
    const lift = (x: number) => Math.pow(max(0, x), 6) * 0.1
    return P({
      hipY: -0.1 - abs(w) * 0.02,
      root: [w * 0.035, 0, 0],
      hips: [0.1, 0, -w * 0.05],
      lFoot: [0.11, lift(-w), 0.0],
      rFoot: [0.11, lift(w), 0.0],
      spine: [0.32, 0, w * 0.08],
      chest: [0.05, 0, 0],
      head: [-0.35, 0, -w * 0.08],
      lArm: [-0.75, 0, 0.42],
      lElbow: [-0.35, 0, 0],
      rArm: [-0.75, 0, 0.42],
      rElbow: [-0.35, 0, 0],
      lHand: [0.6, 0, 0],
      rHand: [0.6, 0, 0],
    })
  },
  focused: (t) => {
    const br = sin(t * 1.6)
    return P({
      lFoot: [-0.015, 0, 0.04],
      rFoot: [-0.005, 0, -0.03],
      hips: [0, 0.15, 0],
      spine: [-0.02, -0.1, 0],
      chest: [-0.03 - br * 0.02, -0.05, 0],
      head: [0.05, -0.05, 0.04],
      rArm: [-0.95, -0.2, 0.18],
      rElbow: [-1.75, 0, 0],
      rHand: [-0.25 + br * 0.03, 0, 0],
      lArm: [0.4, 0.8, 0.22],
      lElbow: [-1.3, 0, 0],
      blink: 1,
    })
  },
  musicBob: (t) => {
    const ph = t * PI * 2.2
    const b = abs(sin(ph))
    const sway = sin(ph / 2)
    return P({
      hipY: -0.015 * b,
      hips: [0, 0, sway * 0.1],
      lFoot: [0.03, 0, 0.02],
      rFoot: [0.03, max(0, sin(ph)) * 0.02, -0.01],
      rToe: max(0, sin(ph)) * 0.35,
      spine: [0.02, 0, -sway * 0.06],
      head: [0.22 * b - 0.05, sway * 0.12, sway * 0.15],
      lArm: [-0.4, 0, 1.05],
      lElbow: [-2.5, 0, 0],
      lHand: [0, 0, 0.3],
      rArm: [-0.4 - b * 0.2, 0, 0.3],
      rElbow: [-1.4 - b * 0.4, 0, 0],
      rHand: [0, 0, sway * 0.5],
    })
  },
  boxer: (t) => {
    const b = abs(sin(t * 5.2))
    const feint = beat(t, 2.7, 0.25)
    return P(
      {
        hipY: -0.06 + b * 0.025,
        lFoot: [0.03, b * 0.012, 0.1],
        rFoot: [0.05, b * 0.012, -0.08],
        spine: [0.12, 0.14 + sin(t * 2.6) * 0.06, 0],
        head: [0.12, 0.06, sin(t * 2.6) * 0.08],
        lArm: [-0.8 - feint * 0.8, 0, 0.32],
        lElbow: [-1.9 + feint * 1.7, 0, 0],
        root: [sin(t * 1.3) * 0.02, 0, feint * 0.04],
      },
      STANCE,
    )
  },
  shy: (t) => {
    const s = sin(t * 0.9)
    const glance = beat(t, 6, 1.4)
    return P({
      lFoot: [-0.025, 0, 0.01],
      rFoot: [-0.025, 0, 0.0],
      lToe: 0,
      hips: [0, 0, s * 0.05],
      spine: [0.06, s * 0.05, -s * 0.04],
      head: [0.32 - glance * 0.35, s * 0.15 + glance * 0.3, 0.18 * s],
      lArm: [-0.25, -0.5, 0.06],
      lElbow: [-0.95, 0, 0],
      lHand: [0, 0, -0.3],
      rArm: [-0.25, -0.5, 0.06],
      rElbow: [-0.95, 0, 0],
      rHand: [0, 0, -0.3],
    })
  },
  lookout: (t) => {
    const scan = sin(t * 0.55)
    return P({
      lFoot: [0.04, 0, 0.05],
      rFoot: [0.03, 0, -0.04],
      hips: [0, scan * 0.15, 0.06],
      spine: [0.04, scan * 0.25, -0.04],
      head: [0.04, scan * 0.4, 0],
      lArm: [-1.65, -0.5, 0.95],
      lElbow: [-2.15, 0, 0],
      lHand: [0.4, 0, 0.4],
      rArm: [-0.15, 0, 0.2],
      rElbow: [-0.6, 0, 0],
    })
  },
  sprinter: (t) => {
    const ph = t * 6
    const s = sin(ph)
    return P({
      hipY: -0.02 - abs(s) * 0.02,
      lFoot: [0.02, max(0, -s) * 0.06, 0.02],
      rFoot: [0.02, max(0, s) * 0.06, -0.01],
      lToe: max(0, -s) * 0.5,
      rToe: max(0, s) * 0.5,
      spine: [0.1, s * 0.08, 0],
      head: [0.02, -s * 0.06, 0],
      lArm: [s * 0.5, 0, 0.15],
      lElbow: [-1.5, 0, 0],
      rArm: [-s * 0.5, 0, 0.15],
      rElbow: [-1.5, 0, 0],
    })
  },
  engineRev: (t) => {
    // Idle turbo warmup — heel pumps, vibration, ready-to-sprint lean.
    const rev = sin(t * 9.5)
    const throb = abs(sin(t * 14))
    const stomp = beat(t, 1.8, 0.28)
    const side = sin(t * 2.4)
    return P({
      hipY: -0.08 - throb * 0.018 - stomp * 0.04,
      root: [side * 0.012, stomp * 0.02, 0.02],
      hips: [0.08, side * 0.08, 0],
      lFoot: [0.05, max(0, -rev) * 0.05 + stomp * 0.03, 0.08],
      rFoot: [0.05, max(0, rev) * 0.05, -0.06],
      lToe: max(0, -rev) * 0.55 + stomp * 0.3,
      rToe: max(0, rev) * 0.55,
      spine: [0.22 + throb * 0.04, side * 0.06, 0],
      chest: [0.06, 0, 0],
      head: [-0.08, -side * 0.12, 0],
      lArm: [-0.55 + rev * 0.12, 0, 0.55],
      lElbow: [-1.35 - throb * 0.15, 0, 0],
      rArm: [-0.55 - rev * 0.12, 0, 0.55],
      rElbow: [-1.35 - throb * 0.15, 0, 0],
      lHand: [0.25, 0, 0],
      rHand: [0.25, 0, 0],
    })
  },
  ninjaCrouch: (t) => {
    const s = sin(t * 1.8)
    const look = sin(t * 0.6)
    return P({
      hipY: -0.24 + s * 0.012,
      lFoot: [0.08, 0, 0.12],
      rFoot: [0.06, 0, -0.1],
      hips: [0.35, 0, 0],
      spine: [0.35, look * 0.15, 0],
      chest: [0.1, 0, 0],
      head: [-0.55, look * 0.4, 0],
      lArm: [-1.15, 0, 0.25],
      lElbow: [-0.3, 0, 0],
      lHand: [1.1, 0, 0],
      rArm: [0.7, 0, 0.35],
      rElbow: [-0.6, 0, 0],
    })
  },
  mirrorGaze: (t) => {
    const s = sin(t * 0.8)
    return P({
      lFoot: [-0.01, 0, 0.05],
      rFoot: [0.01, 0, -0.03],
      hips: [0, -0.15, 0.05],
      spine: [0, 0.15, -0.04],
      head: [0.32, 0.3 + s * 0.05, -0.1],
      lArm: [-1.15, -0.4, 0.35],
      lElbow: [-1.5, 0, 0],
      lHand: [-0.3, 0, 1.3 + s * 0.15],
      rArm: [-0.3, -0.9, 0.1],
      rElbow: [-1.5, 0, 0],
    })
  },
  idolPose: (t) => {
    const ph = t * 2.4
    const pop = sin(ph)
    const wave = beat(t, 4.5, 1.6)
    return P({
      hips: [0, 0.12, pop * 0.14],
      root: [pop * 0.02, 0, 0],
      lFoot: [-0.03, 0, 0.06],
      rFoot: [0.04, 0, -0.02],
      spine: [-0.02, -0.1, -pop * 0.1],
      chest: [-0.04, 0, -pop * 0.04],
      head: [0, 0.1, pop * 0.16],
      rArm: [-0.7, -0.2, 0.25],
      rElbow: [-1.7, 0, 0],
      rHand: [-0.15, 0, 0],
      lArm: [0.1 - wave * 2.6, -1.2 + wave * 1.2, 0.72],
      lElbow: [-1.6 + wave * 0.9 + sin(t * 14) * 0.25 * wave, 0, 0],
      lHand: [0, 0, wave * sin(t * 14) * 0.4],
    })
  },
  commander: (t) => {
    const look = sin(t * 0.45)
    return P({
      lFoot: [0.06, 0, 0.01],
      rFoot: [0.06, 0, -0.01],
      spine: [-0.03, look * 0.1, 0],
      chest: [-0.08 - sin(t * 1.4) * 0.015, 0, 0],
      head: [-0.06, look * 0.35, 0],
      lArm: [0.38, 0.85, 0.12],
      lElbow: [-1.45, 0, 0],
      rArm: [0.38, 0.85, 0.12],
      rElbow: [-1.45, 0, 0],
    })
  },
  prayer: (t) => {
    const s = sin(t * 0.8)
    return P({
      lFoot: [0.01, 0, 0.01],
      rFoot: [0.01, 0, -0.01],
      hips: [0, 0, s * 0.03],
      spine: [0.06, 0, 0],
      head: [0.3, 0, s * 0.05],
      lArm: [-0.55, -1.05, 0.12],
      lElbow: [-2.0, 0, 0],
      lHand: [0, 0.3, -0.5],
      rArm: [-0.55, -1.05, 0.12],
      rElbow: [-2.0, 0, 0],
      rHand: [0, 0.3, -0.5],
      blink: 1,
    })
  },
  cardShuffle: (t) => {
    const f = sin(t * 9)
    const tilt = sin(t * 0.7)
    return P({
      lFoot: [0.0, 0, 0.05],
      rFoot: [0.04, 0, -0.04],
      hips: [0, 0.1, 0.08],
      spine: [0.08, -0.05, -0.06],
      head: [0.22, tilt * 0.2, tilt * 0.22],
      lArm: [-0.75, -0.6, 0.2],
      lElbow: [-1.6 - f * 0.12, 0, 0],
      lHand: [f * 0.3, 0, 0],
      rArm: [-0.75, -0.6, 0.2],
      rElbow: [-1.6 + f * 0.12, 0, 0],
      rHand: [-f * 0.3, 0, 0],
    })
  },
  crackle: (t) => {
    // Live suit discharge + anxious superhuman foot-tap.
    const j = (k: number) => noise(floor(t * 18) + k) * 0.08
    const surge = beat(t, 1.9, 0.42)
    const snap = beat(t + 0.7, 2.7, 0.18)
    const tap = (t * 14) % 1
    const tapLift = tap < 0.45 ? sin((tap / 0.45) * PI) : 0
    const tapSide = floor(t * 14) % 2
    return P({
      hipY: -0.05 - surge * 0.05 - snap * 0.02 - tapLift * 0.01,
      root: [j(0) * 0.35, snap * 0.02, 0],
      lFoot: [0.05 + tapLift * (tapSide ? 0.03 : 0), tapSide ? tapLift * 0.05 : 0, 0.04],
      rFoot: [0.05 + tapLift * (tapSide ? 0 : 0.03), tapSide ? 0 : tapLift * 0.05, -0.04],
      spine: [0.08 + j(1), j(2) * 1.4, j(3)],
      chest: [0, j(12) * 0.8, j(13)],
      head: [-0.06 + j(4), j(5) * 2.4, j(14)],
      lArm: [-0.45 + j(6), 0, 0.85 + surge * 0.55],
      lElbow: [-0.85 + j(7) - snap * 0.3, 0, 0],
      lHand: [-0.9 - surge * 0.2, 0, j(8) * 5],
      rArm: [-0.45 + j(9), 0, 0.85 + surge * 0.55],
      rElbow: [-0.85 + j(10) - snap * 0.3, 0, 0],
      rHand: [-0.9 - surge * 0.2, 0, j(11) * 5],
    })
  },
  speedCrouch: (t) => {
    // Three-point speedster halt — one hand grounded, arcs twitching.
    const j = (k: number) => noise(floor(t * 16) + k) * 0.06
    const surge = beat(t, 2.1, 0.35)
    const tap = (t * 11) % 1
    const tapLift = tap < 0.4 ? sin((tap / 0.4) * PI) : 0
    return P({
      hipY: -0.28 - surge * 0.02,
      root: [j(0) * 0.2, 0, 0.04],
      hips: [0.15, 0.35, 0.08],
      lFoot: [0.1, 0, 0.22],
      rFoot: [0.14, tapLift * 0.03, -0.18],
      lToe: 0.15,
      rToe: 0.35 + tapLift * 0.2,
      spine: [0.45 + j(1), -0.25 + j(2), 0.1],
      chest: [0.12, -0.1, 0],
      head: [-0.35 + j(3), 0.35 + j(4) * 1.5, 0.1],
      // Right hand plants on the ground.
      rArm: [0.55 + j(5), 0.2, 0.15],
      rElbow: [-0.35, 0, 0],
      rHand: [0.9, 0, j(6) * 2],
      // Left arm cocked back, ready to launch.
      lArm: [-1.35 + j(7), -0.4, 0.55 + surge * 0.25],
      lElbow: [-0.55 - surge * 0.2, 0, 0],
      lHand: [-0.3, 0, 0.4],
    })
  },
  slouch: (t) => {
    const s = sin(t * 0.9)
    return P({
      hipY: -0.04,
      lFoot: [0.05, 0, 0.03],
      rFoot: [0.05, 0, -0.02],
      hips: [0.08, s * 0.08, s * 0.05],
      spine: [0.32, 0, -s * 0.06],
      chest: [0.2, 0, 0],
      neck: [-0.25, 0, 0],
      head: [-0.25, s * 0.2, s * 0.1],
      lArm: [-0.3 + s * 0.15, 0, 0.18],
      lElbow: [-0.3, 0, 0],
      lHand: [0.3, 0, 0],
      rArm: [-0.3 - s * 0.15, 0, 0.18],
      rElbow: [-0.3, 0, 0],
      rHand: [0.3, 0, 0],
    })
  },
  jitter: (t) => {
    const hopT = (t * 1.6) % 1
    const hop = hopT < 0.35 ? sin((hopT / 0.35) * PI) : 0
    const side = floor(t * 1.6) % 2 ? 1 : -1
    const twitch = noise(floor(t * 5)) * 0.4
    return P({
      root: [side * 0.03, hop * 0.06, 0],
      hipY: -0.04 + hop * 0.02,
      lFoot: [0.02, hop * 0.03, 0.02],
      rFoot: [0.02, hop * 0.03, -0.02],
      spine: [0.12, 0, side * 0.05],
      head: [0.05, twitch, side * 0.1],
      lArm: [-0.6, -0.6, 0.15],
      lElbow: [-1.9, 0, 0],
      rArm: [-0.6, -0.6, 0.15],
      rElbow: [-1.9, 0, 0],
      lHand: [0.3, 0, 0],
      rHand: [0.3, 0, 0],
    })
  },
  armsCrossed: (t) => {
    const br = sin(t * 1.2)
    const nod = beat(t, 5, 0.8)
    return P({
      lFoot: [0.07, 0, 0.01],
      rFoot: [0.07, 0, -0.01],
      spine: [-0.03, 0, 0],
      chest: [-0.05 - br * 0.02, 0, 0],
      head: [-0.05 + nod * 0.2, sin(t * 0.4) * 0.15, 0],
      lArm: [-0.55, -1.25, 0.32],
      lElbow: [-1.95, 0, 0],
      rArm: [-0.42, -1.25, 0.32],
      rElbow: [-1.95, 0, 0],
    })
  },
  scalpelTwirl: (t) => {
    const spin = beat(t, 2.2, 0.6)
    return P({
      lFoot: [-0.01, 0, 0.05],
      rFoot: [0.04, 0, -0.03],
      hips: [0, 0.2, 0.1],
      spine: [0.02, -0.15, -0.05],
      head: [0.15, -0.25, 0.12],
      rArm: [-1.0, -0.3, 0.3],
      rElbow: [-1.5, 0, 0],
      rHand: [-0.3 + spin * PI * 2, 0, 0],
      lArm: [0.15, -1.2, 0.7],
      lElbow: [-1.6, 0, 0],
    })
  },
  glitch: (t) => {
    const k = floor(t * 1.3)
    const local = t * 1.3 - k
    const on = local < 0.08 ? 1 : 0
    const g = (n: number) => noise(k * 13 + n) * on
    return P({
      root: [g(1) * 0.05, 0, g(2) * 0.03],
      lFoot: [0.02, 0, 0.0],
      rFoot: [0.02, 0, 0.0],
      spine: [0.02 + g(3) * 0.3, g(4) * 0.4, g(5) * 0.2],
      head: [0.1 + g(6) * 0.6, g(7) * 1.2, g(8) * 0.6],
      lArm: [0.02 + g(9) * 1.2, 0, 0.08 + g(10) * 0.6],
      lElbow: [-0.1 + g(11), 0, 0],
      rArm: [0.02 + g(12) * 1.2, 0, 0.08 + g(13) * 0.6],
      rElbow: [-0.1 + g(14), 0, 0],
      vis: local > 0.04 && local < 0.06 ? 0.0 : 1,
    })
  },
  perch: (t) => {
    const pk = floor(t / 1.4)
    const turn = noise(pk) * 0.8
    const bob = beat(t, 1.4, 0.18)
    return P({
      hipY: -0.2,
      lFoot: [0.07, 0, 0.04],
      rFoot: [0.07, 0, 0.02],
      hips: [0.4, 0, 0],
      spine: [0.45, 0, 0],
      chest: [0.1, 0, 0],
      neck: [-0.4, 0, 0],
      head: [-0.35 + bob * 0.3, turn, turn * 0.4],
      lArm: [0.6, 0, 0.6],
      lElbow: [-0.6, 0, 0],
      lHand: [-0.5, 0, 0],
      rArm: [0.6, 0, 0.6],
      rElbow: [-0.6, 0, 0],
      rHand: [-0.5, 0, 0],
    })
  },
  pockets: (t) => {
    const s = sin(t * 0.7)
    const nod = abs(sin(t * 2.2)) * beat(t, 6, 3)
    return P({
      lFoot: [0.035, 0, 0.04],
      rFoot: [0.035, 0, -0.03],
      hips: [-0.06, s * 0.08, 0.06],
      spine: [-0.1, -s * 0.06, -0.04],
      head: [0.05 + nod * 0.12, 0.15 + s * 0.1, 0.05],
      lArm: [0.18, 0, 0.18],
      lElbow: [-0.55, 0, 0],
      lHand: [0.2, 0, 0],
      rArm: [0.18, 0, 0.18],
      rElbow: [-0.55, 0, 0],
      rHand: [0.2, 0, 0],
    })
  },
  feral: (t) => {
    const prowl = sin(t * 1.2)
    const br = sin(t * 3)
    return P({
      hipY: -0.16,
      root: [prowl * 0.05, 0, 0],
      lFoot: [0.09, 0, 0.08],
      rFoot: [0.08, 0, -0.08],
      hips: [0.3, prowl * 0.1, 0],
      spine: [0.35 + br * 0.03, -prowl * 0.12, 0],
      chest: [0.15, 0, 0],
      head: [-0.6, prowl * 0.25, 0],
      lArm: [-1.1, 0, 0.45],
      lElbow: [-0.9, 0, 0],
      lHand: [-0.6, 0, 0],
      rArm: [-0.9, 0, 0.5],
      rElbow: [-1.1, 0, 0],
      rHand: [-0.6, 0, 0],
    })
  },
  coolStand: (t) => {
    const s = sin(t * 0.6)
    return P({
      lFoot: [0.02, 0, 0.06],
      rFoot: [0.04, 0, -0.03],
      hips: [0, -0.35, 0.08],
      spine: [-0.04, 0.2, -0.05],
      chest: [0, 0.1, 0],
      head: [0.05, 0.6 + s * 0.1, 0.05],
      lArm: [0.1, 0, 0.12],
      lElbow: [-0.3, 0, 0],
      rArm: [0.15, -1.2, 0.68],
      rElbow: [-1.7, 0, 0],
    })
  },
  kungfu: (t) => {
    const c = t * 0.9
    return P({
      hipY: -0.14,
      lFoot: [0.1, 0, 0.03],
      rFoot: [0.1, 0, -0.03],
      spine: [0.02, sin(c) * 0.15, 0],
      head: [0, sin(c) * 0.1, 0],
      lArm: [-1.3 + sin(c) * 0.25, 0, 0.25 + cos(c) * 0.2],
      lElbow: [-0.4, 0, 0],
      lHand: [-1.2, 0, 0],
      rArm: [0.2, 0, 0.25],
      rElbow: [-2.0, 0, 0],
      rHand: [0.4, 0, 0],
    })
  },
  float: (t) => {
    const f = sin(t * 1.2)
    return P({
      root: [0, 0.16 + f * 0.035, 0],
      lFoot: [0.0, 0.0, -0.01],
      rFoot: [0.0, 0.06, -0.05],
      lToe: 0.7,
      rToe: 0.8,
      spine: [-0.05, 0, f * 0.03],
      head: [0.08, 0, f * 0.05],
      lArm: [-0.3, 0, 0.5 + f * 0.08],
      lElbow: [-0.4, 0, 0],
      lHand: [0.4, 0, -0.3],
      rArm: [-0.3, 0, 0.5 - f * 0.08],
      rElbow: [-0.4, 0, 0],
      rHand: [0.4, 0, -0.3],
    })
  },
  wingHover: (t) => {
    // Hawks — lazy mid-air hover with a steady wingbeat and cocky lean.
    const f = sin(t * 1.35)
    const flap = sin(t * 4.2)
    const glance = sin(t * 0.55)
    return P({
      root: [0, 0.2 + f * 0.04, 0],
      lFoot: [0.02, 0.04, 0.02],
      rFoot: [0.03, 0.05, -0.04],
      lToe: 0.55,
      rToe: 0.6,
      hips: [0, -0.2 + glance * 0.08, 0.05],
      spine: [-0.08, 0.15 + glance * 0.06, f * 0.03],
      chest: [-0.04, 0.08, 0],
      head: [0.06, 0.45 + glance * 0.15, 0.05],
      lArm: [0.05, 0, 0.2 + f * 0.05],
      lElbow: [-0.35, 0, 0],
      lHand: [0.15, 0, 0],
      rArm: [0.12, -1.15, 0.62],
      rElbow: [-1.65, 0, 0],
      flap: 0.45 + flap * 0.28,
    })
  },
  darkIdol: (t) => {
    const s = sin(t * 1.4)
    return P({
      hips: [0, 0.1, s * 0.1],
      lFoot: [-0.02, 0, 0.05],
      rFoot: [0.04, 0, -0.02],
      spine: [-0.04, -0.12, -s * 0.06],
      head: [0.12, 0.2, 0.2 + s * 0.05],
      rArm: [-2.4, -0.4, 0.3],
      rElbow: [-1.9, 0, 0],
      rHand: [0.6, 0, 0],
      lArm: [0.15, -1.2, 0.72],
      lElbow: [-1.6, 0, 0],
    })
  },
  lordly: (t) => {
    const s = sin(t * 0.8)
    return P({
      root: [0, 0.02 + s * 0.01, 0],
      lFoot: [0.05, 0, 0.03],
      rFoot: [0.05, 0, -0.02],
      spine: [-0.04, 0.08, 0],
      chest: [-0.06, 0, 0],
      head: [-0.08, 0.05, 0],
      lArm: [-1.1, 0, 0.45],
      lElbow: [-0.9, 0, 0],
      lHand: [-0.6 + s * 0.08, 0, -0.9],
      rArm: [0.3, 0.8, 0.12],
      rElbow: [-1.3, 0, 0],
    })
  },
  sunshineStance: (t) => {
    // Escanor day form — Rhitta rested across the shoulders, Pride at rest.
    const br = sin(t * 0.9)
    const glare = beat(t, 4.2, 0.7)
    return P({
      hipY: -0.04,
      lFoot: [0.08, 0, 0.06],
      rFoot: [0.08, 0, -0.05],
      hips: [0.02, 0.08, 0],
      spine: [-0.06 + br * 0.02, 0.1, 0],
      chest: [-0.08, 0.04, 0],
      head: [-0.12 + glare * 0.08, 0.12, 0],
      lArm: [-0.35, 0, 0.28],
      lElbow: [-0.85, 0, 0],
      lHand: [0.15, 0, 0.1],
      rArm: [-2.35, 0.55, 0.75],
      rElbow: [-0.55, 0, 0],
      rHand: [0.35, 0.25, 0.2],
    })
  },
  iaido: (t) => {
    const br = sin(t * 1.0)
    return P({
      hipY: -0.13,
      lFoot: [0.04, 0, 0.13],
      rFoot: [0.06, 0, -0.11],
      hips: [0.1, -0.35, 0],
      spine: [0.22, 0.25, 0],
      chest: [br * 0.02, 0.1, 0],
      head: [-0.12, 0.1, 0],
      lArm: [-0.25, -0.8, 0.4],
      lElbow: [-1.2, 0, 0],
      rArm: [-0.5, -1.0, 0.35],
      rElbow: [-1.4, 0, 0],
      blink: 1,
    })
  },
  flutter: (t) => {
    const ph = t * 3.2
    const s = sin(ph)
    return P({
      root: [0, 0.02 + abs(s) * 0.02, 0],
      lFoot: [-0.01, 0.025, 0.02],
      rFoot: [-0.01, 0.025, -0.02],
      lToe: 0.6,
      rToe: 0.6,
      spine: [-0.04, sin(ph / 2) * 0.1, 0],
      head: [0.05, sin(ph / 2) * 0.2, sin(ph / 2) * 0.12],
      lArm: [-0.2, 0, 0.9 + s * 0.35],
      lElbow: [-0.4 - s * 0.3, 0, 0],
      lHand: [0, 0, -s * 0.5],
      rArm: [-0.2, 0, 0.9 + s * 0.35],
      rElbow: [-0.4 - s * 0.3, 0, 0],
      rHand: [0, 0, -s * 0.5],
      flap: 0.35 + s * 0.35,
    })
  },
  tremor: (t) => {
    // Heavy fortress idle — localized micro-tremors under the boots.
    const throb = abs(sin(t * 11))
    const quake = beat(t, 1.55, 0.35)
    const sway = sin(t * 1.4)
    return P({
      hipY: -0.12 - throb * 0.022 - quake * 0.05,
      root: [sway * 0.01 + sin(t * 18) * 0.006 * throb, quake * 0.015, 0.02],
      hips: [0.08, sway * 0.05, 0],
      lFoot: [0.1, throb * 0.008 + quake * 0.02, 0.06],
      rFoot: [0.1, throb * 0.008, -0.05],
      spine: [0.18 + throb * 0.03, sway * 0.04, 0],
      chest: [0.06, 0, 0],
      head: [-0.12, -sway * 0.1, 0],
      lArm: [-0.55, 0, 0.55 + throb * 0.08],
      lElbow: [-0.85, 0, 0],
      lHand: [0.35, 0, 0],
      rArm: [-0.55, 0, 0.55 + throb * 0.08],
      rElbow: [-0.85, 0, 0],
      rHand: [0.35, 0, 0],
    })
  },
  railHum: (t) => {
    // Hyper-focused coil hum — micro-vibration, locked linear stance.
    const hum = sin(t * 16)
    const pulse = beat(t, 2.1, 0.4)
    const lock = abs(sin(t * 0.8))
    return P({
      hipY: -0.07 - pulse * 0.02,
      root: [hum * 0.004, 0, 0.01],
      lFoot: [0.02, 0, 0.1],
      rFoot: [0.04, 0, -0.08],
      hips: [0, -0.2, 0],
      spine: [0.1 + pulse * 0.04, 0.12, hum * 0.02],
      chest: [0.02, 0.06, 0],
      head: [0.04, lock * 0.08, 0],
      lArm: [-0.7 + pulse * 0.15, 0, 0.38],
      lElbow: [-1.85 + pulse * 0.2, 0, 0],
      lHand: [-0.2 - pulse * 0.15, 0, hum * 0.2],
      rArm: [-0.55 + pulse * 0.1, 0, 0.48],
      rElbow: [-2.05 + pulse * 0.15, 0, 0],
      rHand: [-0.15 - pulse * 0.1, 0, -hum * 0.2],
    })
  },
  cocky: (t) => {
    const s = sin(t * 1.1)
    const flick = beat(t, 1.8, 0.25)
    return P({
      hips: [0, -0.15, 0.1 + s * 0.03],
      lFoot: [0.02, 0, 0.05],
      rFoot: [0.05, 0, -0.02],
      spine: [-0.05, 0.12, -0.06],
      head: [-0.12, -0.15 + s * 0.08, -0.12],
      lArm: [0.15, -1.2, 0.72],
      lElbow: [-1.6, 0, 0],
      rArm: [-1.1, -0.3, 0.4],
      rElbow: [-1.5, 0, 0],
      rHand: [-0.5 + flick * 1.4, 0, flick * 0.5],
    })
  },
  millionSmile: (t) => {
    // Big grin bounce — then permeate: crouch, sink through the pad, pop back out.
    const bob = sin(t * 2.4)
    const bounce = abs(sin(t * 4.8))
    const period = 4.6
    const local = t % period
    // 0–1.1 bounce · 1.1–1.9 sink · 1.9–2.7 under · 2.7–3.5 rise · 3.5–4.6 smile.
    let sink = 0
    if (local > 1.1 && local < 3.5) {
      if (local < 1.9) sink = smooth((local - 1.1) / 0.8)
      else if (local < 2.7) sink = 1
      else sink = 1 - smooth((local - 2.7) / 0.8)
    }
    const bounceAmt = bounce * (1 - sink)
    // Fade only once deep underground — no hard flicker.
    const vis = 1 - smooth(max(0, (sink - 0.55) / 0.35))
    return P({
      hipY: -0.06 - bounceAmt * 0.03 - sink * 0.38,
      root: [0, -sink * 0.62, 0.02],
      hips: [0.05 + sink * 0.25, bob * 0.12 * (1 - sink), 0],
      lFoot: [0.04, bounceAmt * 0.02 + sink * 0.04, 0.1],
      rFoot: [0.05, bounceAmt * 0.02 + sink * 0.04, -0.08],
      spine: [0.12 + bounceAmt * 0.04 + sink * 0.35, bob * 0.08 * (1 - sink), 0],
      chest: [0.04 + sink * 0.08, 0, 0],
      head: [-0.08 + bob * 0.05 * (1 - sink) - sink * 0.2, bob * 0.2 * (1 - sink), 0],
      lArm: [-0.45 + bob * 0.25 * (1 - sink) + sink * 0.5, 0, 0.55 + bounceAmt * 0.1],
      lElbow: [-1.2 + sink * 0.4, 0, 0],
      rArm: [-0.45 - bob * 0.25 * (1 - sink) + sink * 0.5, 0, 0.55 + bounceAmt * 0.1],
      rElbow: [-1.2 + sink * 0.4, 0, 0],
      lHand: [0.3, 0, 0],
      rHand: [0.3, 0, 0],
      vis,
    })
  },
  portalReady: (t) => {
    // Nervous ready stance — palm opens a gate in front, holds it, then closes.
    const bob = sin(t * 1.8)
    const sway = sin(t * 0.9)
    const period = 4.4
    const local = t % period
    // 0–1.2 idle · 1.2–1.8 cast · 1.8–2.9 hold · 2.9–3.5 close · 3.5–4.4 rest.
    let gate = 0
    if (local > 1.2 && local < 3.5) {
      if (local < 1.8) gate = smooth((local - 1.2) / 0.6)
      else if (local < 2.9) gate = 1
      else gate = 1 - smooth((local - 2.9) / 0.6)
    }
    return P({
      hipY: -0.08 + bob * 0.012,
      root: [sway * 0.01, 0, 0.02],
      hips: [0.04, sway * 0.08, 0],
      lFoot: [0.04, 0, 0.12],
      rFoot: [0.05, 0, -0.1],
      spine: [0.1 + gate * 0.06, -0.15 - gate * 0.2, sway * 0.04],
      chest: [0.04, -gate * 0.1, 0],
      head: [0.05 + bob * 0.04, -0.15 - gate * 0.15, sway * 0.08],
      lArm: [-0.55 + bob * 0.08, 0, 0.45 + gate * 0.15],
      lElbow: [-1.5 - gate * 0.2, 0, 0],
      rArm: [-0.35 - gate * 1.1, gate * 0.2, 0.55 - gate * 0.35],
      rElbow: [-1.6 + gate * 1.3, 0, 0],
      rHand: [gate * -0.8, 0, gate * 0.3],
      // Drive the portal FX in front — character stays put.
      prop: gate,
    })
  },
  clapReady: (t) => {
    // Broad cocky wait — arms folded, slight sway. Clap is for travel, not idle.
    const bob = sin(t * 1.5)
    const sway = sin(t * 0.7)
    const nod = beat(t, 5.2, 0.7)
    return P({
      hipY: -0.1 + bob * 0.01,
      root: [sway * 0.01, 0, 0.02],
      hips: [0.06, sway * 0.08, 0],
      lFoot: [0.08, 0, 0.06],
      rFoot: [0.08, 0, -0.06],
      spine: [0.02, sway * 0.06, 0],
      chest: [-0.02 - bob * 0.015, 0, 0],
      head: [-0.08 + nod * 0.15, -0.12 + sway * 0.1, -0.06],
      lArm: [-0.55, -1.2, 0.38],
      lElbow: [-1.95, 0, 0],
      rArm: [-0.42, -1.2, 0.38],
      rElbow: [-1.95, 0, 0],
    })
  },
  marksman: (t) => {
    // Arms crossed, left wrist-gun tipped toward the next diagonal.
    const br = sin(t * 1.1)
    const scan = sin(t * 0.55)
    const aim = beat(t, 4.2, 0.7)
    return P({
      hipY: -0.06 + br * 0.008,
      lFoot: [0.08, 0, 0.04],
      rFoot: [0.08, 0, -0.05],
      hips: [0.05, -0.1 + scan * 0.08, 0],
      spine: [0.04, 0.12 + scan * 0.1, -0.04],
      chest: [-0.04 - br * 0.015, 0.08, 0],
      head: [-0.05 + aim * 0.12, -0.25 + scan * 0.2, 0.05],
      lArm: [-0.85 - aim * 0.55, -0.9 + aim * 0.7, 0.4 - aim * 0.25],
      lElbow: [-1.7 + aim * 1.4, 0, 0],
      lHand: [-aim * 0.4, 0, 0],
      rArm: [-0.5, -1.15, 0.35],
      rElbow: [-1.85, 0, 0],
    })
  },
  ratioReady: (t) => {
    // Office stance — left adjusts the tie/goggles, right hangs the wrapped cleaver.
    const br = sin(t * 1.0)
    const sway = sin(t * 0.55)
    const adjust = beat(t, 4.8, 0.9)
    return P({
      hipY: -0.05 + br * 0.006,
      lFoot: [0.05, 0, 0.05],
      rFoot: [0.05, 0, -0.04],
      hips: [0.02, sway * 0.06, 0.04],
      spine: [0.04, -sway * 0.05, -0.03],
      chest: [0.02, 0.04, 0],
      head: [0.02 + adjust * 0.08, 0.1 + sway * 0.08, 0.04],
      lArm: [0.05 - adjust * 1.1, 0, 0.2 + adjust * 0.45],
      lElbow: [-0.7 - adjust * 0.9, 0, 0],
      lHand: [0.1 - adjust * 0.6, 0, adjust * 0.4],
      rArm: [0.25, 0.15, 0.35],
      rElbow: [-0.35, 0, 0],
      rHand: [0.15, 0, 0.2],
    })
  },
  kingHover: (t) => {
    // Gilgamesh — regal mid-air hover, arms crossed, looking down on mongrels.
    const f = sin(t * 1.15)
    const glance = sin(t * 0.45)
    return P({
      root: [0, 0.22 + f * 0.035, 0],
      lFoot: [0.02, 0.05, 0.03],
      rFoot: [0.03, 0.06, -0.04],
      lToe: 0.55,
      rToe: 0.6,
      hips: [0.04, -0.08 + glance * 0.06, 0.04],
      spine: [-0.06, 0.1 + glance * 0.05, f * 0.02],
      chest: [-0.05 - f * 0.01, 0.06, 0],
      head: [-0.12 + glance * 0.08, 0.15 + glance * 0.12, 0.05],
      lArm: [-0.55, -1.3, 0.35],
      lElbow: [-1.95, 0, 0],
      rArm: [-0.42, -1.3, 0.35],
      rElbow: [-1.95, 0, 0],
    })
  },
  staffLean: (t) => {
    // Yamamoto — planted stance, both hands resting on the wooden staff.
    const br = sin(t * 0.7)
    const look = sin(t * 0.35)
    return P({
      hipY: -0.08 + br * 0.004,
      lFoot: [0.08, 0, 0.04],
      rFoot: [0.08, 0, -0.04],
      hips: [0.02, look * 0.04, 0.02],
      spine: [0.06, look * 0.06, 0],
      chest: [0.02 + br * 0.012, 0.04, 0],
      head: [-0.08, look * 0.18, 0.04],
      lArm: [-0.85, 0.15, 0.28],
      lElbow: [-1.55, 0, 0],
      lHand: [-0.35, 0.1, 0.15],
      rArm: [-0.85, -0.15, 0.28],
      rElbow: [-1.55, 0, 0],
      rHand: [-0.35, -0.1, 0.15],
      prop: 0,
    })
  },
  plagueReady: (t) => {
    // Overhaul — cold, methodical; left glove hovering near the mask.
    const br = sin(t * 0.65)
    const look = sin(t * 0.4)
    return P({
      hipY: -0.06 + br * 0.004,
      lFoot: [0.05, 0, 0.06],
      rFoot: [0.06, 0, -0.05],
      hips: [0.02, look * 0.05, 0.02],
      spine: [0.08, 0.12 + look * 0.04, 0],
      chest: [0.04 + br * 0.01, 0.06, 0],
      head: [-0.12, look * 0.12, 0.04],
      lArm: [-1.05, 0.35, 0.55],
      lElbow: [-1.55, 0, 0],
      lHand: [0.15 + br * 0.05, 0.1, 0.25],
      rArm: [0.2, 0.55, 0.22],
      rElbow: [-1.65, 0, 0],
      rHand: [0.1, 0, 0],
    })
  },
  niceGuy: (t) => {
    // Might Guy — thumbs-up wink bounce, then a quick stretch into stance.
    const bob = sin(t * 2.8)
    const bounce = abs(sin(t * 5.6))
    const wink = beat(t, 2.6, 0.45)
    return P({
      hipY: -0.06 - bounce * 0.02,
      lFoot: [0.06, 0, 0.08],
      rFoot: [0.07, 0, -0.06],
      hips: [0.04, bob * 0.1, 0],
      spine: [0.08 + bounce * 0.03, bob * 0.08, 0],
      chest: [0.04, 0, 0],
      head: [-0.05 + bob * 0.06, bob * 0.22, 0.08],
      blink: wink > 0.2 && wink < 0.55 ? 1 : 0,
      // Left thumbs-up near the shoulder.
      lArm: [-2.35 + bob * 0.08, 0.55, 0.85],
      lElbow: [-0.55, 0, 0],
      lHand: [0.55 + bounce * 0.1, 0.35, 0.15],
      // Right hand on hip.
      rArm: [0.35, 0.85, 0.35],
      rElbow: [-1.55, 0, 0],
      rHand: [0.2, 0, 0.1],
    })
  },
  deadpan: (t) => {
    // Mob — rigid, arms at sides, blank stare. Almost no motion.
    const br = sin(t * 0.55)
    const glance = beat(t, 7.5, 0.9)
    return P({
      hipY: -0.02 + br * 0.003,
      lFoot: [0.02, 0, 0.02],
      rFoot: [0.02, 0, -0.01],
      hips: [0, 0, 0],
      spine: [0.02 + br * 0.008, 0, 0],
      chest: [br * 0.01, 0, 0],
      head: [0.04 - glance * 0.08, glance * 0.12, 0],
      lArm: [0.15, 0, 0.12],
      lElbow: [-0.25, 0, 0],
      lHand: [0.05, 0, 0],
      rArm: [0.15, 0, 0.12],
      rElbow: [-0.25, 0, 0],
      rHand: [0.05, 0, 0],
    })
  },
  plusUltra: (t) => {
    // All Might muscle form — double-bicep hero flex with a bounce.
    const bob = sin(t * 2.2)
    const bounce = abs(sin(t * 4.4))
    const flex = beat(t, 3.6, 0.9)
    return P({
      hipY: -0.04 - bounce * 0.015,
      lFoot: [0.08, 0, 0.1],
      rFoot: [0.08, 0, -0.1],
      hips: [0.02, bob * 0.06, 0],
      spine: [-0.08 + bounce * 0.03, bob * 0.05, 0],
      chest: [-0.06 - flex * 0.04, 0, 0],
      head: [-0.12 + bob * 0.04, bob * 0.15, 0],
      lArm: [-2.55 - flex * 0.15, 0.55 + bob * 0.08, 1.05],
      lElbow: [-0.45, 0, 0],
      lHand: [0.45, 0.2, 0.1],
      rArm: [-2.55 - flex * 0.15, -0.55 - bob * 0.08, 1.05],
      rElbow: [-0.45, 0, 0],
      rHand: [0.45, -0.2, 0.1],
    })
  },
  truthStand: (t) => {
    // All Might Truth — gaunt defiant stance, right fist clenched, left arm hanging.
    const br = sin(t * 1.4)
    const sway = sin(t * 0.7)
    const grit = beat(t, 4.2, 0.55)
    return P({
      hipY: -0.1 + br * 0.008,
      lFoot: [0.06, 0, 0.12],
      rFoot: [0.07, 0, -0.1],
      hips: [0.06, sway * 0.08, 0],
      spine: [0.18 + br * 0.02, -0.12 + sway * 0.05, sway * 0.04],
      chest: [0.08, -0.05, 0],
      head: [0.05 + br * 0.04, -0.1 + sway * 0.1, 0.05],
      blink: grit > 0.25 && grit < 0.45 ? 1 : 0,
      lArm: [0.25 + br * 0.05, 0.15, 0.25],
      lElbow: [-0.85, 0, 0],
      lHand: [0.1, 0, 0.05],
      rArm: [-0.95 + grit * 0.1, 0.25, 0.7],
      rElbow: [-1.55, 0, 0],
      rHand: [0.55, 0, 0.1],
    })
  },
  percentRage: (t) => {
    // ???% Mob — floating, trembling aura, arms hanging ready to blast.
    const br = sin(t * 3.8)
    const shake = sin(t * 18) * 0.015
    const pulse = sin(t * 2.2)
    return P({
      root: [shake, 0.12 + abs(pulse) * 0.04, 0],
      hipY: -0.04,
      lFoot: [0.04, 0.08 + abs(br) * 0.02, 0.02],
      rFoot: [0.04, 0.08 + abs(br) * 0.02, -0.02],
      lToe: 0.55,
      rToe: 0.55,
      hips: [0, br * 0.08, 0],
      spine: [-0.08 + br * 0.04, 0, shake * 2],
      chest: [-0.05, 0, -shake],
      head: [-0.15 + pulse * 0.05, br * 0.1, 0],
      lArm: [0.25 + br * 0.1, 0, 0.35],
      lElbow: [-0.35, 0, 0],
      rArm: [0.25 - br * 0.1, 0, 0.35],
      rElbow: [-0.35, 0, 0],
      lHand: [0.1, 0, 0.15],
      rHand: [0.1, 0, 0.15],
    })
  },
  denjiStand: (t) => {
    // Denji — left hand in pocket, right hanging loose, cocky head tilt.
    const s = sin(t * 0.65)
    const itch = beat(t, 5.5, 0.45)
    return P({
      hipY: -0.04,
      lFoot: [0.03, 0, 0.05],
      rFoot: [0.04, 0, -0.04],
      hips: [-0.08, s * 0.1, 0.05],
      spine: [-0.06, -s * 0.08, -0.05],
      chest: [-0.04, 0, 0],
      head: [0.08 + itch * 0.08, 0.22 + s * 0.12, 0.06],
      blink: itch > 0.2 && itch < 0.4 ? 1 : 0,
      // Left tucked in the pocket.
      lArm: [0.22, 0.05, 0.12],
      lElbow: [-0.7, 0, 0],
      lHand: [0.25, 0, 0.05],
      // Right hangs slack.
      rArm: [0.15 + s * 0.06, -0.1, 0.2],
      rElbow: [-0.35, 0, 0],
      rHand: [0.05, 0, 0],
    })
  },
  hellCrouch: (t) => {
    // Hero of Hell — hunched four-arm crouch, intestine scarf trailing, blades crossed.
    const br = sin(t * 1.6)
    const growl = beat(t, 3.8, 0.5)
    return P({
      hipY: -0.22 + br * 0.01,
      lFoot: [0.12, 0, 0.14],
      rFoot: [0.12, 0, -0.12],
      hips: [0.35, br * 0.08, 0],
      spine: [0.45 + br * 0.03, -br * 0.1, 0],
      chest: [0.2, 0, 0],
      head: [-0.55 + growl * 0.08, br * 0.15, 0],
      lArm: [-1.35, -0.35, 0.85],
      lElbow: [-0.55, 0, 0],
      lHand: [-0.4, 0, 0.15],
      rArm: [-1.35, 0.35, 0.85],
      rElbow: [-0.55, 0, 0],
      rHand: [-0.4, 0, 0.15],
    })
  },
  jackpotIdle: (t) => {
    // Hakari Jackpot — domain hand signs: OK circle at the brow, left palm cupped low.
    const s = sin(t * 1.4)
    const pulse = abs(sin(t * 3.2))
    return P({
      hipY: -0.06 + pulse * 0.01,
      lFoot: [0.05, 0, 0.08],
      rFoot: [0.05, 0, -0.06],
      hips: [0, s * 0.08, 0],
      spine: [-0.08 + pulse * 0.03, -s * 0.05, 0],
      chest: [-0.04, 0, 0],
      head: [-0.12, s * 0.1, 0],
      // Right — OK sign held near the forehead.
      rArm: [-1.55, 0.15, 0.55],
      rElbow: [-0.35, 0, 0],
      rHand: [-0.85 + pulse * 0.1, 0.2, 0.15],
      // Left — palm up, catching luck.
      lArm: [-0.55, -0.25, 0.35],
      lElbow: [-1.15, 0, 0],
      lHand: [-0.45, 0.35, 0.2],
      blink: 0,
    })
  },
  ghoulReady: (t) => {
    // Kaneki — loose A-stance, fists clenched, head slightly ducked behind the fringe.
    const s = sin(t * 0.85)
    const twitch = beat(t, 4.2, 0.35)
    return P({
      hipY: -0.08 + s * 0.008,
      lFoot: [0.05, 0, 0.1],
      rFoot: [0.05, 0, -0.08],
      hips: [0.05, s * 0.06, 0],
      spine: [0.12 + s * 0.02, -s * 0.08, 0],
      chest: [0.06, 0, 0],
      head: [-0.18 + twitch * 0.06, 0.15 + s * 0.12, 0],
      lArm: [-0.85, -0.15, 0.45],
      lElbow: [-1.35, 0, 0],
      lHand: [-0.35 + twitch * 0.15, 0, 0.1],
      rArm: [-0.85, 0.15, 0.45],
      rElbow: [-1.35, 0, 0],
      rHand: [-0.35 + twitch * 0.15, 0, -0.1],
      blink: twitch > 0.15 && twitch < 0.3 ? 1 : 0,
    })
  },
  centipedeIdle: (t) => {
    // Awakened Centipede — predatory crouch, claws open, rinkaku coiled behind.
    const br = sin(t * 1.8)
    const hunger = beat(t, 3.4, 0.45)
    return P({
      hipY: -0.18 + br * 0.012,
      lFoot: [0.1, 0, 0.14],
      rFoot: [0.1, 0, -0.12],
      hips: [0.28, br * 0.1, 0],
      spine: [0.4 + br * 0.04, -br * 0.12, 0],
      chest: [0.18, 0, 0],
      head: [-0.45 + hunger * 0.1, br * 0.2, 0],
      lArm: [-1.25, -0.35, 0.75],
      lElbow: [-0.65, 0, 0],
      lHand: [-0.55, 0, 0.2],
      rArm: [-1.25, 0.35, 0.75],
      rElbow: [-0.65, 0, 0],
      rHand: [-0.55, 0, 0.2],
      blink: 0,
      flap: 0.35 + br * 0.12 + hunger * 0.15,
    })
  },
  knightReady: (t) => {
    // Arthur — proud knight stance, Excalibur upright at the right hip.
    const br = sin(t * 1.05)
    const pulse = beat(t, 2.8, 0.4)
    return P({
      hipY: -0.08 + br * 0.006,
      lFoot: [0.06, 0, 0.12],
      rFoot: [0.07, 0, -0.1],
      hips: [0.08, -0.15 + br * 0.04, 0],
      spine: [0.1 + br * 0.015, 0.12, 0],
      chest: [0.04, 0.06, 0],
      head: [-0.08 + pulse * 0.04, 0.18 + br * 0.08, 0],
      lArm: [-0.55, -0.45, 0.35],
      lElbow: [-1.25, 0, 0],
      lHand: [0.15, 0, 0.1],
      rArm: [-0.7, 0.55, 0.55],
      rElbow: [-1.05, 0, 0],
      rHand: [0.25 + pulse * 0.08, 0.1, 0.15],
      blink: pulse > 0.2 && pulse < 0.35 ? 1 : 0,
    })
  },
  moriReady: (t) => {
    // Jin Mori — cocky A-stance, fists loose, ready to sprint.
    const s = sin(t * 1.2)
    return P({
      hipY: -0.1 + s * 0.008,
      lFoot: [0.08, 0, 0.1],
      rFoot: [0.08, 0, -0.08],
      hips: [0.05, s * 0.06, 0],
      spine: [0.1 + s * 0.02, -s * 0.08, 0],
      chest: [0.05, 0, 0],
      head: [-0.05, s * 0.1, 0],
      lArm: [-0.7, -0.2, 0.45],
      lElbow: [-1.4, 0, 0],
      lHand: [-0.2, 0, 0.1],
      rArm: [-0.7, 0.2, 0.45],
      rElbow: [-1.4, 0, 0],
      rHand: [-0.2, 0, -0.1],
    })
  },
  cloudHover: (t) => {
    // Monkey King — riding Geindun, floating with Yeoui on the shoulder.
    const f = sin(t * 1.3)
    const sway = sin(t * 0.85)
    return P({
      root: [0, 0.2 + f * 0.04, 0],
      lFoot: [0.02, 0.04, 0.02],
      rFoot: [0.02, 0.06, -0.04],
      lToe: 0.5,
      rToe: 0.55,
      hips: [0.05, -0.1 + sway * 0.06, 0.03],
      spine: [-0.05, 0.12 + sway * 0.05, f * 0.04],
      chest: [-0.02, 0.06, 0],
      head: [0.05, 0.15 + f * 0.08, 0],
      lArm: [-0.4, 0, 0.45 + f * 0.06],
      lElbow: [-0.5, 0, 0],
      rArm: [-0.9, 0.45, 0.7],
      rElbow: [-0.55, 0, 0],
      rHand: [0.2, 0.2, 0.2],
      prop: 1,
      blink: 0,
    })
  },
  gohanReady: (t) => {
    // Gohan — wide martial stance, fists clenched at the hips, soft ki breath.
    const br = sin(t * 1.1)
    const pulse = beat(t, 3.2, 0.4)
    return P({
      hipY: -0.12 + br * 0.008,
      lFoot: [0.1, 0, 0.08],
      rFoot: [0.1, 0, -0.08],
      hips: [0.05, br * 0.05, 0],
      spine: [0.08 + br * 0.02, -br * 0.06, 0],
      chest: [0.04, 0, 0],
      head: [-0.05 + pulse * 0.03, br * 0.08, 0],
      lArm: [-0.55, -0.35, 0.55],
      lElbow: [-1.55, 0, 0],
      lHand: [-0.25, 0, 0.1],
      rArm: [-0.55, 0.35, 0.55],
      rElbow: [-1.55, 0, 0],
      rHand: [-0.25, 0, -0.1],
      blink: pulse > 0.2 && pulse < 0.35 ? 1 : 0,
    })
  },
  ssj2Ready: (t) => {
    // SSJ2 — heavier crouch, fists out, lightning pulse in the breath.
    const br = sin(t * 1.45)
    const crack = beat(t, 2.4, 0.45)
    return P({
      hipY: -0.16 + br * 0.01,
      lFoot: [0.12, 0, 0.1],
      rFoot: [0.12, 0, -0.1],
      hips: [0.08, br * 0.08, 0],
      spine: [0.18 + br * 0.03, -br * 0.08, 0],
      chest: [0.1, 0, 0],
      head: [-0.12 + crack * 0.05, br * 0.1, 0],
      lArm: [-0.75, -0.45, 0.7],
      lElbow: [-1.45, 0, 0],
      lHand: [-0.4 + crack * 0.1, 0, 0.12],
      rArm: [-0.75, 0.45, 0.7],
      rElbow: [-1.45, 0, 0],
      rHand: [-0.4 + crack * 0.1, 0, -0.12],
      blink: 0,
    })
  },
  thunderReady: (t) => {
    // Zenitsu — nervous iaido crouch, left hand on the saya, eyes darting.
    const br = sin(t * 1.15)
    const glance = beat(t, 4.8, 1.1)
    const shiver = noise(floor(t * 9)) * 0.04
    return P({
      prop: 0,
      hipY: -0.14 + br * 0.008,
      lFoot: [0.05, 0, 0.12],
      rFoot: [0.07, 0, -0.1],
      hips: [0.08, -0.28 + shiver, 0],
      spine: [0.2 + br * 0.02, 0.2 + shiver, 0],
      chest: [br * 0.02, 0.08, 0],
      head: [-0.08 + glance * 0.2, 0.15 + glance * 0.35 + shiver, shiver],
      lArm: [-0.3, -0.85, 0.45],
      lElbow: [-1.15, 0, 0],
      lHand: [0.15, 0, 0.15],
      rArm: [-0.55 + shiver, -0.95, 0.4],
      rElbow: [-1.35, 0, 0],
      rHand: [0.2, 0.1, 0.1],
      blink: glance > 0.55 && glance < 0.7 ? 1 : 0,
    })
  },
  ichigoReady: (t) => {
    // Ichigo — Zangetsu resting across the right shoulder, free left hand, ready stare.
    const br = sin(t * 0.95)
    const sway = sin(t * 0.55) * 0.03
    return P({
      hipY: -0.08 + br * 0.006,
      lFoot: [0.05, 0, 0.08],
      rFoot: [0.06, 0, -0.1],
      hips: [0.04, -0.12 + sway, 0],
      spine: [0.06 + br * 0.015, 0.12 + sway, 0],
      chest: [br * 0.02, 0.06, 0],
      head: [-0.05, 0.18 + sway * 0.5, 0],
      lArm: [-0.15, -0.15, 0.35],
      lElbow: [-0.35, 0, 0],
      lHand: [0.05, 0, 0.05],
      // Blade on the shoulder — raised right arm, elbow bent, hand near ear.
      rArm: [-1.55, -0.55, 1.05],
      rElbow: [-0.45, 0, 0],
      rHand: [0.25, 0.15, 0.35],
      blink: beat(t, 3.6, 0.12) > 0.7 ? 1 : 0,
    })
  },
  mugetsuReady: (t) => {
    // Final Getsuga — still void pressure, dark blade arm hanging ready.
    const br = sin(t * 0.7)
    const drift = sin(t * 0.4) * 0.02
    return P({
      hipY: -0.06 + br * 0.005,
      root: [0, 0.01 + br * 0.004, 0],
      lFoot: [0.06, 0, 0.1],
      rFoot: [0.06, 0, -0.1],
      hips: [0.02, drift, 0],
      spine: [0.04 + br * 0.01, -0.08, 0],
      chest: [br * 0.015, -0.04, 0],
      head: [-0.08, 0.1 + drift, 0],
      lArm: [-0.25, -0.2, 0.4],
      lElbow: [-0.55, 0, 0],
      lHand: [0.05, 0, 0.08],
      rArm: [-0.85, 0.35, 0.55],
      rElbow: [-0.25, 0, 0],
      rHand: [0.1, 0, 0.2],
      blink: 0,
    })
  },
}
