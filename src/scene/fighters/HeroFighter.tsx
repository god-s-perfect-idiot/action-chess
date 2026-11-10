import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { getHeroDesign, type HeroDesign } from '../../game/heroDesigns'
import type { PieceColor } from '../../game/types'
import { deathDuration, evalPose, type AnimInput, type Sever, type SeverSpec } from './anims'
import { bakeFighter, SKIN_BONES } from './bake'
import { DeathFx } from './death'
import { P } from './Part'
import { applyPose, lerpPose, restPose, type BoneName, type RigBones } from './rig'
import { S } from './shapes'

const noRaycast = () => null

export interface FighterApi {
  design: HeroDesign
  /** `speed` 0..1 drives cape / hair drag. */
  update: (anim: AnimInput, dt: number, speed: number) => void
  /** Where the ragdoll came to rest, in the fighter's local frame. False when not dead. */
  corpse: (out: THREE.Vector3) => boolean
  /** Whether the current death leaves blood on the floor. */
  bled: () => boolean
}

const RATE: Record<AnimInput['kind'], number> = {
  idle: 9,
  ready: 12,
  move: 16,
  attack: 34,
  hurt: 30,
  death: 18,
}

const SEVERS: Sever[] = ['lArm', 'rArm', 'head', 'lLeg', 'rArm', 'lArm']

function wrapAngle(a: number): number {
  return a - Math.round(a / (Math.PI * 2)) * Math.PI * 2
}

const _q = new THREE.Quaternion()
const _qAim = new THREE.Quaternion()
const _g = new THREE.Vector3()
const _yNeg = new THREE.Vector3(0, -1, 0)

/**
 * Swing a hanging part (cape, coat tails, long hair) about its local X so it
 * points toward world gravity in the parent's frame, plus `drag` for motion.
 * Positive X swings the free end backward. When the body lies on its side the
 * panel is also twisted about the parent's Y so it drapes flat instead of
 * standing up like a fin.
 */
function hang(g: THREE.Object3D | undefined, drag: number, lo: number, hi: number) {
  if (!g?.parent) return
  g.parent.getWorldQuaternion(_q).invert()
  _g.set(0, -1, 0).applyQuaternion(_q)
  const a = Math.atan2(-_g.z, -_g.y)
  let twist = Math.atan2(_g.x, -_g.z)
  if (twist > Math.PI / 2) twist -= Math.PI
  else if (twist < -Math.PI / 2) twist += Math.PI
  const lying = Math.min(1, Math.max(0, (1 - Math.abs(_g.y)) * 2.5 - 0.5))
  g.rotation.order = 'YXZ'
  g.rotation.x = Math.min(hi, Math.max(lo, a + drag))
  g.rotation.y = twist * lying
}

/**
 * Keep calf exhaust aimed along the fighter's -Z (straight back), not the shin
 * pitch — otherwise the plume kicks up and down with each stride.
 * Plume mesh extends along the jet's local −Y.
 */
function aimExhaust(j: THREE.Object3D, facing: THREE.Object3D | undefined) {
  if (!j.parent || !facing) return
  // World exhaust dir from fighter facing: mostly −Z, slight down for heel thrust.
  facing.getWorldQuaternion(_q)
  _g.set(0, -0.1, -1).normalize().applyQuaternion(_q)
  _qAim.setFromUnitVectors(_yNeg, _g)
  // Convert desired world rotation into the shin parent's local frame.
  j.parent.getWorldQuaternion(_q).invert()
  j.quaternion.copy(_q).multiply(_qAim)
}

/** Live exhaust cones parented to each shin — scale with thrust from `update`. */
function EngineJet({
  jetRef,
  shinLen,
  limb,
}: {
  jetRef: (g: THREE.Group | null) => void
  shinLen: number
  limb: number
}) {
  // Hot fire read — white core → yellow → orange → red tip. Always loud on the board.
  const mats = useMemo(
    () => ({
      core: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      hot: new THREE.MeshBasicMaterial({ color: '#ffe566' }),
      mid: new THREE.MeshBasicMaterial({ color: '#ff8a1a' }),
      tip: new THREE.MeshBasicMaterial({ color: '#ff3a10' }),
      rim: new THREE.MeshBasicMaterial({ color: '#ffb040' }),
    }),
    [],
  )
  const L = limb
  return (
    <group
      ref={jetRef}
      position={[0, -shinLen * 0.86, -0.07 * L]}
      scale={1}
    >
      {/* Mouth flare at the nozzle. Plume runs along −Y; aimExhaust points that back. */}
      <P s={S.sphere(0.04 * L, 10, 8)} m={mats.core} line={false} shadow={false} p={[0, 0.01, 0]} sc={[1.1, 0.55, 1.1]} />
      <P s={S.cone(0.045 * L, 0.14, 10)} m={mats.hot} line={false} shadow={false} p={[0, -0.03, 0]} />
      <P s={S.cone(0.055 * L, 0.28, 10)} m={mats.mid} line={false} shadow={false} p={[0, -0.14, 0]} />
      <P s={S.cone(0.036 * L, 0.38, 9)} m={mats.tip} line={false} shadow={false} p={[0, -0.36, 0]} />
      {/* Side tongues so the plume reads from the side / above. */}
      <P s={S.cone(0.022 * L, 0.2, 7)} m={mats.rim} line={false} shadow={false} p={[0.03 * L, -0.18, 0.01]} r={[0, 0, 0.35]} />
      <P s={S.cone(0.022 * L, 0.2, 7)} m={mats.rim} line={false} shadow={false} p={[-0.03 * L, -0.18, 0.01]} r={[0, 0, -0.35]} />
      <P s={S.cone(0.018 * L, 0.18, 6)} m={mats.hot} line={false} shadow={false} p={[0, -0.22, -0.025 * L]} r={[0.35, 0, 0]} />
    </group>
  )
}

/** Ghost afterimages for Lemillion permeation — translucent silhouettes trailing behind. */
function PhaseTrail({
  streakRef,
  color,
  color2,
}: {
  streakRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      a: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false }),
      b: new THREE.MeshBasicMaterial({ color: color2, transparent: true, opacity: 0.3, depthWrite: false }),
      core: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }),
    }),
    [color, color2],
  )
  const ghosts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        lag: 0.08 + i * 0.07,
        h: 0.55 + (i % 3) * 0.08,
        w: 0.18 + (i % 2) * 0.04,
      })),
    [],
  )
  return (
    <group ref={streakRef} visible={false}>
      {ghosts.map((g, i) => (
        <group key={i} position={[0, g.h * 0.5, -g.lag]}>
          <P s={S.box(g.w, g.h, 0.08, 0.04)} m={i % 2 ? mats.a : mats.b} line={false} shadow={false} />
          <P s={S.sphere(g.w * 0.45, 8, 6)} m={mats.core} line={false} shadow={false} p={[0, g.h * 0.55, 0]} />
        </group>
      ))}
    </group>
  )
}

/** Silver spatial gates for Finral — entry/exit rings (children 0–2 entry, 3–5 exit). */
function PortalTrail({
  streakRef,
  color,
  color2,
}: {
  streakRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      a: new THREE.MeshBasicMaterial({ color }),
      b: new THREE.MeshBasicMaterial({ color: color2 }),
      core: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      fill: new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
      }),
    }),
    [color, color2],
  )
  const gates = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        // Tall enough to walk through — roughly shoulder-to-floor.
        r: 0.42 + (i % 3) * 0.08,
        tube: 0.028 - (i % 3) * 0.004,
      })),
    [],
  )
  return (
    <group ref={streakRef} visible={false}>
      {gates.map((g, i) => (
        <group key={i} position={[0, 0.58, 0.48]}>
          <P s={S.torus(g.r, g.tube, Math.PI * 2, 28)} m={i % 2 ? mats.a : mats.b} line={false} shadow={false} />
          <P s={S.torus(g.r * 0.72, g.tube * 0.55, Math.PI * 2, 24)} m={mats.core} line={false} shadow={false} />
          {i % 3 === 0 && (
            <P
              s={S.cyl(g.r * 0.9, g.r * 0.9, 0.012, 28)}
              m={mats.fill}
              line={false}
              shadow={false}
              r={[Math.PI / 2, 0, 0]}
            />
          )}
        </group>
      ))}
    </group>
  )
}

/** Flying Thunder God marks — kunai silhouettes + yellow afterimage flashes along the L. */
function KunaiTrail({
  streakRef,
  color,
  color2,
}: {
  streakRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      blade: new THREE.MeshBasicMaterial({ color: '#2a2e36', transparent: true, opacity: 0.85, depthWrite: false }),
      tag: new THREE.MeshBasicMaterial({ color: color2, transparent: true, opacity: 0.75, depthWrite: false }),
      flash: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65, depthWrite: false }),
      core: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }),
    }),
    [color, color2],
  )
  const marks = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        lag: 0.05 + i * 0.08,
        y: 0.35 + (i % 3) * 0.12,
        spin: (i % 2 ? 1 : -1) * 0.4,
      })),
    [],
  )
  return (
    <group ref={streakRef} visible={false}>
      {marks.map((m, i) => (
        <group key={i} position={[0, m.y, -m.lag]} rotation={[0.3, m.spin, 0.2]}>
          {i === 0 ? (
            <>
              <P s={S.cone(0.028, 0.1, 3)} m={mats.blade} line={false} shadow={false} r={[Math.PI / 2, 0, 0]} />
              <P s={S.box(0.018, 0.018, 0.05, 0.006)} m={mats.tag} line={false} shadow={false} p={[0, 0, -0.06]} />
            </>
          ) : (
            <>
              <P s={S.torus(0.09 + (i % 3) * 0.02, 0.012, Math.PI * 2, 16)} m={i % 2 ? mats.flash : mats.core} line={false} shadow={false} />
              <P s={S.shard(0.02, 0.06, 0.008)} m={mats.flash} line={false} shadow={false} p={[0.04, 0.02, 0]} />
            </>
          )}
        </group>
      ))}
    </group>
  )
}

/** Boogie Woogie clap rings — blue swap pulses that trail Todo's L. */
function ClapTrail({
  streakRef,
  color,
  color2,
}: {
  streakRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      a: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false }),
      b: new THREE.MeshBasicMaterial({ color: color2, transparent: true, opacity: 0.45, depthWrite: false }),
      core: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false }),
    }),
    [color, color2],
  )
  const rings = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        lag: 0.05 + i * 0.1,
        r: 0.14 + (i % 3) * 0.05,
      })),
    [],
  )
  return (
    <group ref={streakRef} visible={false}>
      {rings.map((g, i) => (
        <group key={i} position={[0, 0.7, -g.lag]} rotation={[Math.PI / 2, 0, 0]}>
          <P s={S.torus(g.r, 0.016, Math.PI * 2, 22)} m={i % 2 ? mats.a : mats.b} line={false} shadow={false} />
          <P s={S.torus(g.r * 0.55, 0.008, Math.PI * 2, 18)} m={mats.core} line={false} shadow={false} />
        </group>
      ))}
    </group>
  )
}

/** Full Cowl — jagged cyan/green OFA electricity bolts that crackle around the body. */
function FullCowlAura({
  formRef,
  color,
  color2,
}: {
  formRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      bolt: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }),
      arc: new THREE.MeshBasicMaterial({ color: color2, transparent: true, opacity: 0.75, depthWrite: false }),
      core: new THREE.MeshBasicMaterial({ color: '#e8fff4', transparent: true, opacity: 0.55, depthWrite: false }),
    }),
    [color, color2],
  )
  const bolts = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return {
          a,
          elev: 0.25 + (i % 4) * 0.22,
          len: 0.14 + (i % 3) * 0.06,
          rad: 0.012 + (i % 2) * 0.006,
          orbit: 0.18 + (i % 3) * 0.04,
        }
      }),
    [],
  )
  return (
    <group ref={formRef} visible={false}>
      <P s={S.torus(0.22, 0.014, Math.PI * 1.7, 18)} m={mats.core} line={false} shadow={false} p={[0, 0.55, -0.02]} r={[Math.PI / 2 + 0.2, 0, 0]} />
      <P s={S.torus(0.16, 0.01, Math.PI * 1.4, 14)} m={mats.arc} line={false} shadow={false} p={[0, 0.85, -0.01]} r={[Math.PI / 2 + 0.15, 0, 0]} />
      {bolts.map((b, i) => (
        <P
          key={i}
          s={S.shard(b.rad, b.len, b.rad * 0.7)}
          m={i % 2 ? mats.bolt : mats.arc}
          line={false}
          shadow={false}
          p={[Math.cos(b.a) * b.orbit, b.elev, Math.sin(b.a) * b.orbit * 0.75]}
          r={[0.35, -b.a, Math.PI * 0.5 + (i % 3) * 0.2]}
        />
      ))}
    </group>
  )
}

/** Idle Death Gamble Jackpot — golden-green aura shell + star glints (near-invincible look). */
function JackpotAura({
  formRef,
  color,
  color2,
}: {
  formRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      gold: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }),
      green: new THREE.MeshBasicMaterial({ color: color2, transparent: true, opacity: 0.8, depthWrite: false }),
      core: new THREE.MeshBasicMaterial({ color: '#fff8c8', transparent: true, opacity: 0.55, depthWrite: false }),
      star: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false }),
    }),
    [color, color2],
  )
  const beams = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        return {
          a,
          elev: 0.2 + (i % 4) * 0.2,
          len: 0.2 + (i % 3) * 0.08,
          rad: 0.018 + (i % 2) * 0.008,
          orbit: 0.2 + (i % 3) * 0.05,
        }
      }),
    [],
  )
  const stars = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2
        return {
          a,
          elev: 0.35 + (i % 4) * 0.22,
          orbit: 0.24 + (i % 3) * 0.06,
          size: 0.028 + (i % 2) * 0.01,
        }
      }),
    [],
  )
  return (
    <group ref={formRef} visible={false}>
      {/* Invincibility shell rings. */}
      <P s={S.torus(0.26, 0.016, Math.PI * 2, 22)} m={mats.gold} line={false} shadow={false} p={[0, 0.5, 0]} r={[Math.PI / 2, 0, 0]} />
      <P s={S.torus(0.2, 0.012, Math.PI * 1.8, 18)} m={mats.green} line={false} shadow={false} p={[0, 0.78, -0.02]} r={[Math.PI / 2 + 0.18, 0, 0]} />
      <P s={S.torus(0.14, 0.01, Math.PI * 1.5, 14)} m={mats.core} line={false} shadow={false} p={[0, 1.0, -0.01]} r={[Math.PI / 2 + 0.12, 0, 0]} />
      {beams.map((b, i) => (
        <P
          key={`b${i}`}
          s={S.shard(b.rad, b.len, b.rad * 0.65)}
          m={i % 2 ? mats.gold : mats.green}
          line={false}
          shadow={false}
          p={[Math.cos(b.a) * b.orbit, b.elev, Math.sin(b.a) * b.orbit * 0.7]}
          r={[0.4, -b.a, Math.PI * 0.5 + (i % 3) * 0.15]}
        />
      ))}
      {stars.map((s, i) => (
        <P
          key={`s${i}`}
          s={S.shard(s.size * 0.35, s.size, s.size * 0.2)}
          m={mats.star}
          line={false}
          shadow={false}
          p={[Math.cos(s.a) * s.orbit, s.elev, Math.sin(s.a) * s.orbit * 0.65]}
          r={[0.2, s.a, Math.PI * 0.25]}
        />
      ))}
    </group>
  )
}

/** ???% Mob — same body, two palette bakes that flicker as the model itself. */
function mobFormDesign(base: HeroDesign, form: 'purple' | 'black'): HeroDesign {
  if (form === 'purple') {
    return {
      ...base,
      palette: {
        skin: '#4a2880',
        hair: '#1a0830',
        hairAlt: '#e040ff',
        primary: '#5a20a0',
        secondary: '#3a1868',
        accent: '#ff40c8',
        trim: '#180828',
        metal: '#f0d0ff',
        eye: '#ffffff',
        glow: '#ff40c8',
      },
    }
  }
  return {
    ...base,
    palette: {
      skin: '#0a080c',
      hair: '#050408',
      hairAlt: '#101018',
      primary: '#060508',
      secondary: '#0c0a10',
      accent: '#14141c',
      trim: '#040306',
      metal: '#e8e8f0',
      eye: '#ffffff',
      glow: '#ffffff',
    },
  }
}

/** Long Speed Force trail streaming straight back while he sprints. */
function ElectricTrail({
  streakRef,
  color,
  color2,
}: {
  streakRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      core: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      a: new THREE.MeshBasicMaterial({ color }),
      b: new THREE.MeshBasicMaterial({ color: color2 }),
    }),
    [color, color2],
  )
  // Long cylinders aimed −Z; live update stretches them into a rear streak.
  const bolts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        len: 0.9 + (i % 5) * 0.35 + (i % 3) * 0.2,
        thick: 0.01 + (i % 4) * 0.006,
      })),
    [],
  )
  return (
    <group ref={streakRef} visible={false}>
      {bolts.map((b, i) => (
        <group key={i}>
          {/* Cylinder along −Z, rooted at the body and stretching straight back. */}
          <P
            s={S.cyl(b.thick, b.thick * 0.12, b.len, 5)}
            m={i % 3 === 0 ? mats.core : i % 2 ? mats.a : mats.b}
            line={false}
            shadow={false}
            p={[0, 0, -b.len * 0.5]}
            r={[Math.PI / 2, 0, 0]}
          />
        </group>
      ))}
    </group>
  )
}

function thrustFor(anim: AnimInput, speed: number, t: number): number {
  // Flames only while sprinting or fighting — idle/ready stay dark.
  if (anim.kind === 'move') return 1.55 + speed * 0.55
  if (anim.kind === 'attack') {
    const u = anim.t
    if (u < 0.16) return 0.9 + u * 4
    if (u < 0.36) return 2.1
    if (u < 0.7) return 1.55
    return 0.85
  }
  void t
  return 0
}

/** Orbiting pebbles / dust around fortress boots — reads as micro-tremors. */
function TremorDebris({
  fieldRef,
  color,
  color2,
}: {
  fieldRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      a: new THREE.MeshBasicMaterial({ color }),
      b: new THREE.MeshBasicMaterial({ color: color2 }),
    }),
    [color, color2],
  )
  const specs = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        r: 0.07 + (i % 4) * 0.025,
        y: 0.02 + (i % 3) * 0.035,
        phase: i * 0.7,
        size: 0.01 + (i % 3) * 0.006,
      })),
    [],
  )
  return (
    <group ref={fieldRef} position={[0, 0, 0]}>
      {specs.map((s, i) => (
        <group key={i} position={[s.r, s.y, 0]}>
          <P s={S.shard(s.size, s.size * 1.4, s.size * 0.8)} m={i % 2 ? mats.a : mats.b} line={false} shadow={false} />
        </group>
      ))}
    </group>
  )
}

/** Denji → Chainsaw Man — orange saw-head + arm blades that snap on during attack. */
function ChainsawForm({
  shellRef,
  kind,
  side = 1,
  limb = 1,
  headR = 0.08,
  armLen = 0.2,
}: {
  shellRef: (g: THREE.Group | null) => void
  kind: 'head' | 'fore'
  side?: number
  limb?: number
  headR?: number
  armLen?: number
}) {
  const mats = useMemo(
    () => ({
      orange: new THREE.MeshToonMaterial({ color: '#e07028' }),
      orangeDark: new THREE.MeshToonMaterial({ color: '#a84818' }),
      metal: new THREE.MeshToonMaterial({ color: '#c8ccd4' }),
      black: new THREE.MeshToonMaterial({ color: '#1a1c22' }),
      tooth: new THREE.MeshBasicMaterial({ color: '#f0f2f6' }),
      blood: new THREE.MeshBasicMaterial({ color: '#c01828' }),
    }),
    [],
  )
  const L = limb
  const s = side

  if (kind === 'head') {
    const r = headR
    return (
      <group ref={shellRef} visible={false}>
        {/* Orange chainsaw housing that swallows the human face. */}
        <P s={S.sphere(r * 1.15, 14, 12)} m={mats.orange} p={[0, r * 0.08, r * 0.05]} sc={[1.15, 1.05, 1.25]} />
        <P s={S.sphere(r * 0.95, 12, 10)} m={mats.orangeDark} p={[0, r * 0.05, -r * 0.35]} sc={[1.1, 0.9, 0.85]} />
        {/* Grill mouth. */}
        <P s={S.box(r * 0.95, r * 0.42, r * 0.35, r * 0.08)} m={mats.black} p={[0, -r * 0.2, r * 0.95]} />
        {[-2, -1, 0, 1, 2].map((i) => (
          <P
            key={i}
            s={S.box(r * 0.09, r * 0.32, r * 0.07, r * 0.02)}
            m={mats.tooth}
            line={false}
            p={[i * r * 0.16, -r * 0.28, r * 1.15]}
          />
        ))}
        {/* Forehead blade. */}
        <P s={S.box(r * 0.14, r * 0.5, r * 1.7, r * 0.04)} m={mats.metal} p={[0, r * 0.2, r * 1.65]} r={[0.12, 0, 0]} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <P
            key={`t${i}`}
            s={S.cone(r * 0.05, r * 0.11, 4)}
            m={i % 2 ? mats.blood : mats.black}
            line={false}
            p={[0, r * (0.42 - i * 0.07), r * (1.1 + i * 0.15)]}
            r={[Math.PI * 0.5, 0, i % 2 ? 0.45 : -0.45]}
          />
        ))}
        {/* Starter handle on top. */}
        <P s={S.box(r * 0.55, r * 0.14, r * 0.18, r * 0.04)} m={mats.black} p={[0, r * 1.05, -r * 0.05]} />
        <P s={S.cyl(r * 0.07, r * 0.07, r * 0.32, 8)} m={mats.black} p={[0, r * 0.78, -r * 0.12]} />
        {/* Side engine housings. */}
        {([-1, 1] as const).map((x) => (
          <P
            key={x}
            s={S.cyl(r * 0.28, r * 0.28, r * 0.35, 10)}
            m={mats.black}
            p={[x * r * 0.85, r * 0.05, -r * 0.1]}
            r={[0, 0, Math.PI / 2]}
          />
        ))}
      </group>
    )
  }

  // Arm blade along the forearm.
  return (
    <group ref={shellRef} visible={false}>
      <P s={S.box(0.045 * L, 0.14 * L, 0.32 * L, 0.012)} m={mats.metal} p={[s * 0.045 * L, -armLen * 0.4, 0.02]} r={[0.1, s * 0.15, 0]} />
      <P s={S.box(0.02 * L, 0.08 * L, 0.28 * L, 0.006)} m={mats.black} line={false} p={[s * 0.055 * L, -armLen * 0.4, 0.04]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <P
          key={i}
          s={S.cone(0.014 * L, 0.03 * L, 4)}
          m={i % 2 ? mats.blood : mats.black}
          line={false}
          p={[s * 0.055 * L, -armLen * (0.2 + i * 0.1), 0.14 * L]}
          r={[Math.PI * 0.5, 0, s * (i % 2 ? 0.5 : -0.5)]}
        />
      ))}
    </group>
  )
}

/** Red Riot Unbreakable plates — rocky ridges that snap on during run / attack. */
function HardenArmor({
  shellRef,
  kind,
  side = 1,
  limb = 1,
  chestH = 0.3,
  chestD = 0.12,
  headR = 0.08,
  armLen = 0.2,
}: {
  shellRef: (g: THREE.Group | null) => void
  kind: 'chest' | 'head' | 'upper' | 'fore' | 'hand' | 'thigh' | 'shin'
  side?: number
  limb?: number
  chestH?: number
  chestD?: number
  headR?: number
  armLen?: number
}) {
  const mats = useMemo(
    () => ({
      rock: new THREE.MeshToonMaterial({ color: '#d2b48c' }),
      ridge: new THREE.MeshToonMaterial({ color: '#a88868' }),
      crack: new THREE.MeshBasicMaterial({ color: '#1a1210' }),
      glow: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    }),
    [],
  )
  const L = limb
  const s = side

  if (kind === 'chest') {
    return (
      <group ref={shellRef} visible={false}>
        <P s={S.box(0.22 * L, chestH * 0.7, 0.04, 0.012)} m={mats.rock} p={[0, chestH * 0.45, chestD * 0.55]} />
        <P s={S.box(0.14 * L, chestH * 0.35, 0.03, 0.008)} m={mats.ridge} p={[0, chestH * 0.62, chestD * 0.6]} />
        {[ -1, 1 ].map((x) => (
          <P
            key={x}
            s={S.shard(0.05 * L, 0.09 * L, 0.03)}
            m={mats.ridge}
            p={[x * 0.1 * L, chestH * 0.5, chestD * 0.58]}
            r={[0.2, x * 0.3, x * 0.4]}
          />
        ))}
        <P s={S.box(0.16 * L, 0.012, 0.01, 0.003)} m={mats.crack} line={false} shadow={false} p={[0, chestH * 0.4, chestD * 0.64]} />
        <P s={S.box(0.012, chestH * 0.4, 0.01, 0.003)} m={mats.crack} line={false} shadow={false} p={[0.04 * L, chestH * 0.48, chestD * 0.64]} r={[0, 0, 0.2]} />
      </group>
    )
  }

  if (kind === 'head') {
    const r = headR
    return (
      <group ref={shellRef} visible={false}>
        {/* Jagged mask growths + white Unbreakable eyes. */}
        {[ -1, 1 ].map((x) => (
          <group key={x}>
            <P s={S.shard(r * 0.22, r * 0.35, r * 0.12)} m={mats.crack} p={[x * r * 0.55, r * 0.05, r * 0.55]} r={[0.3, x * 0.4, x * 0.25]} />
            <P s={S.sphere(r * 0.09, 8, 6)} m={mats.glow} line={false} shadow={false} p={[x * r * 0.28, r * 0.08, r * 0.78]} />
            <P s={S.cone(r * 0.06, r * 0.14, 4)} m={mats.ridge} line={false} p={[x * r * 0.22, -r * 0.55, r * 0.7]} r={[Math.PI * 0.85, 0, 0]} />
          </group>
        ))}
        <P s={S.shard(r * 0.18, r * 0.28, r * 0.1)} m={mats.rock} p={[0, r * 0.55, r * 0.4]} r={[-0.5, 0, 0]} />
        <P s={S.cone(r * 0.05, r * 0.12, 4)} m={mats.crack} line={false} p={[0, -r * 0.5, r * 0.75]} r={[Math.PI * 0.9, 0, 0]} />
      </group>
    )
  }

  if (kind === 'upper') {
    return (
      <group ref={shellRef} visible={false}>
        <P s={S.box(0.07 * L, armLen * 0.55, 0.06 * L, 0.014)} m={mats.rock} p={[s * 0.01, -armLen * 0.4, 0.01]} />
        <P s={S.shard(0.035 * L, 0.06 * L, 0.025)} m={mats.ridge} p={[s * 0.035 * L, -armLen * 0.35, 0.035 * L]} r={[0.3, s * 0.4, s * 0.5]} />
        <P s={S.shard(0.028 * L, 0.05 * L, 0.02)} m={mats.crack} line={false} p={[s * 0.02, -armLen * 0.55, 0.04 * L]} r={[0.5, 0, s * 0.3]} />
      </group>
    )
  }

  if (kind === 'fore') {
    return (
      <group ref={shellRef} visible={false}>
        <P s={S.box(0.08 * L, armLen * 0.65, 0.07 * L, 0.016)} m={mats.rock} p={[0, -armLen * 0.5, 0]} />
        <P s={S.shard(0.04 * L, 0.07 * L, 0.03)} m={mats.ridge} p={[s * 0.03 * L, -armLen * 0.4, 0.04 * L]} r={[0.4, s * 0.3, 0]} />
        <P s={S.shard(0.035 * L, 0.055 * L, 0.025)} m={mats.ridge} p={[-s * 0.025 * L, -armLen * 0.6, 0.035 * L]} r={[0.55, -s * 0.25, 0]} />
        <P s={S.box(0.05 * L, 0.012, 0.01, 0.003)} m={mats.crack} line={false} shadow={false} p={[0, -armLen * 0.45, 0.045 * L]} />
      </group>
    )
  }

  if (kind === 'hand') {
    return (
      <group ref={shellRef} visible={false}>
        {/* Rocky claws. */}
        {[ -0.02, 0, 0.02 ].map((x, i) => (
          <P
            key={i}
            s={S.cone(0.012 * L, 0.045 * L, 4)}
            m={i === 1 ? mats.ridge : mats.rock}
            line={false}
            p={[s * x * L, -0.05 * L, 0.02 * L]}
            r={[Math.PI * 0.85, 0, s * x * 8]}
          />
        ))}
      </group>
    )
  }

  if (kind === 'thigh') {
    return (
      <group ref={shellRef} visible={false}>
        <P s={S.box(0.08 * L, armLen * 0.5, 0.07 * L, 0.014)} m={mats.rock} p={[0, -armLen * 0.4, 0.01]} />
        <P s={S.shard(0.04 * L, 0.07 * L, 0.03)} m={mats.ridge} p={[s * 0.03 * L, -armLen * 0.35, 0.04 * L]} r={[0.3, s * 0.2, 0]} />
      </group>
    )
  }

  // shin
  return (
    <group ref={shellRef} visible={false}>
      <P s={S.box(0.07 * L, armLen * 0.55, 0.06 * L, 0.014)} m={mats.rock} p={[0, -armLen * 0.45, 0.015]} />
      <P s={S.shard(0.035 * L, 0.06 * L, 0.025)} m={mats.ridge} p={[s * 0.025 * L, -armLen * 0.4, 0.04 * L]} r={[0.4, 0, s * 0.25]} />
    </group>
  )
}

/** Iron filings that snap into straight-line grid patterns around the railgun. */
function MagFilings({
  fieldRef,
  color,
  color2,
}: {
  fieldRef: (g: THREE.Group | null) => void
  color: string
  color2: string
}) {
  const mats = useMemo(
    () => ({
      a: new THREE.MeshBasicMaterial({ color }),
      b: new THREE.MeshBasicMaterial({ color: color2 }),
    }),
    [color, color2],
  )
  const specs = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        axis: i % 2,
        slot: Math.floor(i / 2),
        phase: i * 0.55,
      })),
    [],
  )
  return (
    <group ref={fieldRef} position={[0, 0.55, 0]}>
      {specs.map((s, i) => (
        <group key={i}>
          <P
            s={S.box(s.axis ? 0.14 : 0.008, 0.008, s.axis ? 0.008 : 0.14, 0.002)}
            m={i % 2 ? mats.a : mats.b}
            line={false}
            shadow={false}
          />
        </group>
      ))}
    </group>
  )
}

export function HeroFighter({
  heroId,
  color,
  seed,
  apiRef,
  floor = 0,
  awakened = false,
}: {
  heroId: string | null
  color: PieceColor
  seed: number
  apiRef: RefObject<FighterApi | null>
  /** Ground height (fighter-local) the ragdoll and blood settle on. */
  floor?: number
  /** Promoted pawn — uses that hero's awakened design. */
  awakened?: boolean
}) {
  const design = getHeroDesign(heroId, color, { awakened })
  /** Mob ???% — dual purple/black body bakes; the model itself flickers. */
  const mobDual = useMemo(() => {
    if (!design.extras.includes('mobAwaken')) return null
    return {
      purple: bakeFighter(mobFormDesign(design, 'purple')),
      black: bakeFighter(mobFormDesign(design, 'black')),
    }
  }, [design])
  const { pr, parts } = useMemo(() => {
    if (mobDual) return { pr: mobDual.black.pr, parts: mobDual.black.parts }
    return bakeFighter(design)
  }, [design, mobDual])
  const hasEngines = design.shoes === 'engines'
  const hasTremor =
    design.extras.includes('fortressPlate') || design.extras.includes('riotGear')
  const hasMag = design.extras.includes('magCoils')
  /** Flash Manhattan — solid body ↔ Speed Force streak travel form. */
  const hasVoltForm = design.extras.includes('arcSuit')
  /** Zenitsu awaken — yellow thunder speedster trail (Flash-pace). */
  const hasZenitsuTrail = design.extras.includes('zenitsuAwaken')
  /** Accelerator — red vector streaks while shoving air and coasting. */
  const hasVectorForm = design.extras.includes('vectorTee')
  /** Lemillion — permeation ghost trail while slipping the L. */
  const hasPhaseForm = design.extras.includes('lemillionSuit')
  /** Finral — silver spatial gates while hopping the L. */
  const hasPortalForm = design.extras.includes('finralSuit')
  /** Minato — Flying Thunder God kunai marks while hopping the L. */
  const hasKunaiForm = design.extras.includes('minatoSuit')
  /** Todo — Boogie Woogie clap rings while hopping the L. */
  const hasClapForm = design.extras.includes('todoKit')
  /** Red Riot — Unbreakable rocky plates while running / attacking. */
  const hasRiotHarden = design.extras.includes('riotGear')
  /** Denji — orange Chainsaw Man form while attacking. */
  const hasChainsawForm = design.extras.includes('denjiSuit')
  /** Mob ???% — purple ↔ black psychic form flicker. */
  const hasMobForm = design.extras.includes('mobAwaken')
  /** Deku awakened — cyan Full Cowl electricity crackle. */
  const hasFullCowl = design.extras.includes('dekuAwaken')
  /** Gohan SSJ2 — blue lightning crackle around the body. */
  const hasSsj2 = design.extras.includes('gohanSsj2')
  /** Yuno Spirit Dive — green mana glow around the body. */
  const hasSpiritDive = design.extras.includes('spiritDive')
  /** Zenitsu awaken — yellow thunder shell encasing the body. */
  const hasZenitsuThunder = design.extras.includes('zenitsuAwaken')
  /** Ichigo Mugetsu — dark void pressure aura. */
  const hasMugetsu = design.extras.includes('ichigoMugetsu')
  /** Hakari Jackpot — golden-green invincible aura. */
  const hasJackpot = design.extras.includes('hakariJackpot')
  /** Monkey King — Yeoui pillar that grows / shrinks on the prop hand. */
  const hasYeoui = design.weapon === 'yeoui'

  const bones = useRef<RigBones>({})
  const pose = useRef(restPose())
  const drag = useRef({ cape: 0.1, tails: 0.04, hair: 0.05, t: 0, trail: 0, harden: 0, saw: 0, jackpot: 0, yeoui: 1, thunder: 0, mugetsu: 0 })
  const jets = useRef<{ l: THREE.Group | null; r: THREE.Group | null }>({ l: null, r: null })
  const tremor = useRef<{ l: THREE.Group | null; r: THREE.Group | null }>({ l: null, r: null })
  const magField = useRef<THREE.Group | null>(null)
  const streaks = useRef<THREE.Group | null>(null)
  const phaseGhosts = useRef<THREE.Group | null>(null)
  const portalGates = useRef<THREE.Group | null>(null)
  const kunaiMarks = useRef<THREE.Group | null>(null)
  const clapRings = useRef<THREE.Group | null>(null)
  const mobForms = useRef<{ purple: THREE.Mesh[]; black: THREE.Mesh[] } | null>(null)
  const fullCowlAura = useRef<THREE.Group | null>(null)
  const ssj2Aura = useRef<THREE.Group | null>(null)
  const spiritDiveAura = useRef<THREE.Group | null>(null)
  const zenitsuAura = useRef<THREE.Group | null>(null)
  const mugetsuAura = useRef<THREE.Group | null>(null)
  const jackpotAura = useRef<THREE.Group | null>(null)
  const hardenShells = useRef<Record<string, THREE.Group | null>>({})
  const chainsawShells = useRef<Record<string, THREE.Group | null>>({})
  const frame = useRef<THREE.Group>(null)
  const meshes = useRef<THREE.Mesh[]>([])
  const death = useRef<DeathFx | null>(null)
  const posed = useRef(false)

  const setHarden = (key: string) => (g: THREE.Group | null) => {
    hardenShells.current[key] = g
  }
  const setSaw = (key: string) => (g: THREE.Group | null) => {
    chainsawShells.current[key] = g
  }

  const bone = (name: BoneName) => (g: THREE.Group | null) => {
    if (g) bones.current[name] = g
  }

  // Bake output is in each bone's local space, so bone inverses are identity.
  useLayoutEffect(() => {
    const rig = bones.current
    const body = rig.body
    if (!body) return
    const skeleton = new THREE.Skeleton(
      SKIN_BONES.map((name) => bones.current[name] as unknown as THREE.Bone),
      SKIN_BONES.map(() => new THREE.Matrix4()),
    )
    const bind = (baked: typeof parts) =>
      baked.map((part) => {
        const mesh = new THREE.SkinnedMesh(part.geometry, part.material)
        mesh.bind(skeleton, new THREE.Matrix4())
        mesh.castShadow = part.castShadow
        mesh.frustumCulled = false
        mesh.raycast = noRaycast
        body.add(mesh)
        return mesh
      })

    if (mobDual) {
      const purple = bind(mobDual.purple.parts)
      const black = bind(mobDual.black.parts)
      for (const m of black) m.visible = false
      mobForms.current = { purple, black }
      meshes.current = [...purple, ...black]
      return () => {
        death.current?.stop(rig)
        purple.forEach((m) => body.remove(m))
        black.forEach((m) => body.remove(m))
        meshes.current = []
        mobForms.current = null
        skeleton.dispose()
      }
    }

    const list = bind(parts)
    mobForms.current = null
    meshes.current = list
    return () => {
      death.current?.stop(rig)
      list.forEach((m) => body.remove(m))
      meshes.current = []
      skeleton.dispose()
    }
  }, [parts, mobDual])

  useLayoutEffect(() => {
    const g = frame.current
    if (!g) return
    const rig = bones.current
    const fx = new DeathFx(pr, g, floor)
    death.current = fx
    return () => {
      fx.stop(rig)
      fx.dispose()
      if (death.current === fx) death.current = null
    }
  }, [pr, floor])

  useLayoutEffect(() => {
    const hangParts = (dt: number, speed: number) => {
      const dr = drag.current
      dr.t += dt
      const flutter = Math.sin(dr.t * 2.3 + seed * 5) * 0.05
      const dk = 1 - Math.exp(-6 * Math.min(dt, 0.1))
      dr.cape += (0.1 + speed * 1.0 + flutter - dr.cape) * dk
      dr.tails += (0.03 + speed * 0.55 + flutter * 0.6 - dr.tails) * dk
      dr.hair += (0.05 + speed * 0.5 + flutter * 0.5 - dr.hair) * dk
      const b = bones.current
      hang(b.cape, dr.cape, -0.1, 2.4)
      hang(b.tails, dr.tails, -0.1, 1.8)
      hang(b.hairBack, dr.hair, -0.3, 1.7)
    }

    apiRef.current = {
      design,
      corpse(out) {
        const fx = death.current
        if (!fx?.active) return false
        fx.corpse(out)
        return true
      },
      bled: () => !!death.current?.active && death.current.bleeds(),
      update(anim, dt, speed) {
        const fx = death.current
        if (anim.kind === 'death' && fx) {
          if (fx.active && fx.dmg !== anim.dmg) fx.stop(bones.current)
          if (!fx.active) {
            if (!posed.current) applyPose(bones.current, pr, (pose.current = evalPose(design, { kind: 'ready', t: 0 }, seed)))
            const sever: SeverSpec | null =
              anim.dmg === 'slash' ? (anim.sever ?? SEVERS[Math.floor(seed * 997) % SEVERS.length]) : null
            fx.start(
              bones.current,
              meshes.current,
              { dmg: anim.dmg, zone: anim.zone, style: design.death, sever, seed },
              deathDuration(design, anim.dmg),
            )
          }
          fx.update(bones.current, anim.t, dt)
          hangParts(dt, 0)
          // Lock to one body form so death doesn't double-draw both bakes.
          if (mobForms.current) {
            for (const m of mobForms.current.purple) m.visible = true
            for (const m of mobForms.current.black) m.visible = false
          }
          for (const g of [
            streaks.current,
            phaseGhosts.current,
            portalGates.current,
            kunaiMarks.current,
            clapRings.current,
            jets.current.l,
            jets.current.r,
            ...Object.values(hardenShells.current),
            ...Object.values(chainsawShells.current),
          ]) {
            if (g) g.visible = false
          }
          return
        }
        if (fx?.active) fx.stop(bones.current)
        posed.current = true

        const target = evalPose(design, anim, seed)
        const cur = pose.current
        cur.rootRot[1] = target.rootRot[1] + wrapAngle(cur.rootRot[1] - target.rootRot[1])
        // Speedster idle lap needs a snappy follow so the circle doesn't lag into a wobble.
        const rate =
          anim.kind === 'idle' && target.prop > 0.2 && (hasVoltForm || hasZenitsuTrail)
            ? 26
            : RATE[anim.kind]
        const k = 1 - Math.exp(-rate * Math.min(dt, 0.1))
        lerpPose(cur, cur, target, k)
        cur.vis = target.vis
        cur.prop = target.prop
        cur.blink = target.blink
        applyPose(bones.current, pr, cur)

        hangParts(dt, speed)
        const dr = drag.current
        const b = bones.current

        if (hasYeoui && b.propHand) {
          // Always show Yeoui; during yeouiCrush shrink → tower → slam → settle.
          let target = 1
          if (anim.kind === 'attack') {
            const t = anim.t
            if (t < 0.14) target = 1 - 0.55 * (t / 0.14)
            else if (t < 0.42) target = 0.45 + 2.8 * ((t - 0.14) / 0.28)
            else if (t < 0.72) target = 3.25 + 0.9 * ((t - 0.42) / 0.3)
            else if (t < 1.05) target = 4.15 - 2.4 * Math.min(1, (t - 0.72) / 0.33)
            else target = 1.75 - 0.75 * Math.min(1, (t - 1.05) / 0.25)
          } else if (anim.kind === 'move') {
            target = 1.05
          }
          dr.yeoui += (target - dr.yeoui) * (1 - Math.exp(-14 * Math.min(dt, 0.1)))
          b.propHand.scale.setScalar(Math.max(0.2, dr.yeoui))
        }

        if ((hasVoltForm || hasVectorForm || hasZenitsuTrail) && streaks.current) {
          const trailing =
            (anim.kind === 'move' && speed > 0.12) ||
            (hasZenitsuTrail && anim.kind === 'attack' && anim.t > 0.05 && anim.t < 0.85) ||
            // Flash / awakened Zenitsu idle lap — prop marks the lightning orbit.
            ((hasVoltForm || hasZenitsuTrail) && anim.kind === 'idle' && cur.prop > 0.2)
          dr.trail += ((trailing ? 1 : 0) - dr.trail) * (1 - Math.exp(-14 * Math.min(dt, 0.1)))
          const body = b.body
          const g = streaks.current
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          g.scale.setScalar(1)
          if (on) {
            // Long bolts stream straight behind (−Z), slight flicker / lane jitter only.
            const tick = Math.floor(dr.t * (hasVectorForm ? 22 : hasZenitsuTrail ? 30 : 28))
            g.children.forEach((c, i) => {
              const snap = tick + i * 2
              const n1 = Math.sin(snap * 12.9898 + seed * 7.1 + i * 17.3) * 43758.5453
              const n2 = Math.sin(snap * 78.233 + seed * 3.7 + i * 9.1) * 43758.5453
              const r1 = n1 - Math.floor(n1)
              const r2 = n2 - Math.floor(n2)
              const lane = ((i % 7) - 3) * 0.055 + (r1 - 0.5) * 0.035
              const elev = 0.28 + (i % 5) * 0.1 + (r2 - 0.5) * 0.04
              c.position.set(lane, elev, -0.08)
              // Keep local −Z alignment; tiny roll flicker only.
              c.rotation.set(0, 0, (r1 - 0.5) * 0.25)
              const stretch =
                (hasVectorForm
                  ? 2.4 + (i % 5) * 0.45 + r2 * 0.7
                  : hasZenitsuTrail
                    ? 3.4 + (i % 5) * 0.75 + r2 * 1.2
                    : 3.2 + (i % 5) * 0.7 + r2 * 1.1) * dr.trail
              c.scale.set(0.65 + r1 * 0.3, 0.65 + r1 * 0.3, stretch)
              c.visible = ((tick + i) % 6) !== 0 || r2 > 0.2
            })
          }
        }

        if (hasPhaseForm && phaseGhosts.current) {
          // Idle sink / move blink / attack phase — ghosts while permeating.
          const phasing =
            (anim.kind === 'move' && (speed > 0.08 || cur.vis < 0.95)) ||
            (anim.kind === 'attack' && (cur.vis < 0.5 || (anim.t > 0.1 && anim.t < 0.75))) ||
            (anim.kind === 'idle' && (cur.vis < 0.98 || cur.root[1] < -0.08))
          dr.trail += ((phasing ? 1 : 0) - dr.trail) * (1 - Math.exp(-10 * Math.min(dt, 0.1)))
          const body = b.body
          const g = phaseGhosts.current
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          if (on) {
            const tick = Math.floor(dr.t * 14)
            const idleSink = anim.kind === 'idle'
            g.children.forEach((c, i) => {
              const fade = Math.max(0.15, 1 - i * 0.1) * dr.trail
              const wobble = Math.sin(dr.t * 9 + i * 1.3 + seed) * 0.02
              // Idle: stack ghosts into the floor; travel: trail behind.
              if (idleSink) {
                c.position.set(wobble, -0.04 - i * 0.07, Math.sin(dr.t * 4 + i) * 0.02)
              } else {
                c.position.set(wobble, 0.05 + Math.sin(dr.t * 6 + i) * 0.02, -(0.08 + i * 0.07) * (0.6 + dr.trail * 0.6))
              }
              c.scale.setScalar(fade * (0.85 + (i % 3) * 0.08))
              c.visible = ((tick + i) % 5) !== 0
            })
          }
        }

        if (hasPortalForm && portalGates.current) {
          // Idle cast uses pose.prop; travel/attack keep a gate open while blinking.
          const gating =
            (anim.kind === 'move' && (speed > 0.08 || cur.prop > 0.2 || cur.vis < 0.95)) ||
            (anim.kind === 'attack' && (anim.t > 0.1 && anim.t < 0.6 || cur.prop > 0.2)) ||
            ((anim.kind === 'idle' || anim.kind === 'ready') && cur.prop > 0.12)
          dr.trail += ((gating ? 1 : 0) - dr.trail) * (1 - Math.exp(-11 * Math.min(dt, 0.1)))
          const body = b.body
          const g = portalGates.current
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          if (on) {
            const gate = Math.max(dr.trail, cur.prop)
            const moving = anim.kind === 'move'
            const appearHalf = moving && 'p' in anim ? anim.p >= 0.5 : false
            g.children.forEach((c, i) => {
              const ring = i % 3
              const isExit = i >= 3
              // Idle: one portal in front. Travel: entry before snap, exit after.
              const show = !moving ? !isExit : appearHalf ? isExit : !isExit
              if (!show) {
                c.visible = false
                return
              }
              const fade = Math.max(0.35, 1 - ring * 0.14) * gate
              const spin = dr.t * (1.6 + ring * 0.25) + seed + (isExit ? 1.7 : 0)
              // Big walk-through gates: entry ahead (+Z), exit behind (−Z).
              const z = moving ? (isExit ? -0.42 : 0.5) : 0.52
              c.position.set(Math.sin(spin) * 0.015, 0.58 + Math.sin(dr.t * 4 + ring) * 0.02, z)
              // Keep the portal facing the walk axis — only a light roll shimmer.
              c.rotation.set(0, 0, Math.sin(spin) * 0.08)
              c.scale.setScalar(fade * (1.05 + ring * 0.08) * (0.7 + gate * 0.45))
              c.visible = true
            })
          }
        }

        if (hasKunaiForm && kunaiMarks.current) {
          const moveP = anim.kind === 'move' && 'p' in anim ? anim.p : -1
          // Yellow afterimage only on the throw and the rematerialize flash — not while gone.
          const marking =
            (anim.kind === 'move' &&
              ((moveP >= 0 && moveP < 0.2) ||
                (moveP >= 0.62 && cur.vis > 0.2 && cur.vis < 0.98))) ||
            (anim.kind === 'attack' &&
              ((anim.t > 0.08 && anim.t < 0.24) ||
                (cur.vis > 0.2 && cur.vis < 0.98 && anim.t > 0.48 && anim.t < 0.7)))
          dr.trail += ((marking ? 1 : 0) - dr.trail) * (1 - Math.exp(-14 * Math.min(dt, 0.1)))
          const body = b.body
          const g = kunaiMarks.current
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05 && cur.vis > 0.15
          g.visible = on
          if (on) {
            const tick = Math.floor(dr.t * 22)
            const appear = moveP >= 0.62 || (anim.kind === 'attack' && anim.t >= 0.48)
            g.children.forEach((c, i) => {
              const fade = Math.max(0.25, 1 - i * 0.12) * dr.trail
              const spin = dr.t * (5 + i * 0.6) + seed
              // On rematerialize, burst rings around the body; during throw, trail behind the arm.
              c.position.set(
                Math.sin(spin + i) * (appear ? 0.1 + i * 0.03 : 0.04),
                0.45 + Math.sin(dr.t * 7 + i) * 0.05 + (appear ? (i % 3) * 0.08 : 0),
                appear
                  ? Math.cos(spin * 0.7 + i) * (0.08 + i * 0.025)
                  : -(0.04 + i * 0.085) * (0.75 + dr.trail * 0.55),
              )
              c.rotation.set(0.5 + Math.sin(spin) * 0.3, spin * 0.5, 0.2)
              c.scale.setScalar(fade * (appear ? 1.15 : 0.95) * (0.95 + (i % 2) * 0.12))
              c.visible = ((tick + i) % 3) !== 0
            })
          }
        }

        if (hasClapForm && clapRings.current) {
          // Clap rings only on travel/attack — idle is arms-folded wait.
          const clapping =
            (anim.kind === 'move' && (speed > 0.08 || cur.vis < 0.95)) ||
            (anim.kind === 'attack' && ((anim.t > 0.1 && anim.t < 0.7) || cur.vis < 0.5))
          dr.trail += ((clapping ? 1 : 0) - dr.trail) * (1 - Math.exp(-12 * Math.min(dt, 0.1)))
          const body = b.body
          const g = clapRings.current
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          if (on) {
            const tick = Math.floor(dr.t * 18)
            g.children.forEach((c, i) => {
              const fade = Math.max(0.2, 1 - i * 0.14) * dr.trail
              const pulse = 1 + Math.sin(dr.t * 10 + i * 1.1) * 0.12
              // Burst rings around the clap, not a hop trail.
              c.position.set(
                Math.sin(dr.t * 3 + i) * 0.02,
                0.7 + Math.sin(dr.t * 6 + i) * 0.04,
                0.05 + i * 0.02,
              )
              c.rotation.set(Math.PI / 2, dr.t * 2 + i * 0.5, 0)
              c.scale.setScalar(fade * pulse * (0.95 + (i % 2) * 0.12))
              c.visible = ((tick + i) % 3) !== 0
            })
          }
        }

        if (hasEngines) {
          const thrust = thrustFor(anim, speed, dr.t + seed * 4)
          const flicker = 0.88 + Math.sin(dr.t * 48 + seed) * 0.12
          const wobble = Math.sin(dr.t * 31 + seed * 2) * 0.06
          const sx = thrust * (0.85 + wobble) * flicker
          // Stretch along −Y (exhaust axis) so the plume shoots back hard.
          const sy = thrust * (1.55 + Math.abs(wobble) * 0.4) * flicker
          for (const j of [jets.current.l, jets.current.r]) {
            if (!j) continue
            j.visible = thrust > 0.05
            if (!j.visible) continue
            // Face from the fighter root so spine lean doesn't tilt the jets.
            aimExhaust(j, frame.current ?? b.body)
            j.scale.set(Math.max(0.35, sx), Math.max(0.55, sy), Math.max(0.35, sx))
          }
        }

        if (hasRiotHarden) {
          const hardening =
            (anim.kind === 'move' && speed > 0.06) ||
            (anim.kind === 'attack' && anim.t > 0.04 && anim.t < 0.85)
          dr.harden += ((hardening ? 1 : 0) - dr.harden) * (1 - Math.exp(-12 * Math.min(dt, 0.1)))
          const on = dr.harden > 0.08
          const pulse = 1 + Math.sin(dr.t * 14 + seed) * 0.04 * dr.harden
          for (const g of Object.values(hardenShells.current)) {
            if (!g) continue
            g.visible = on
            if (on) g.scale.setScalar(0.85 + dr.harden * 0.2 * pulse)
          }
        }

        if (hasChainsawForm) {
          // Cord pull at attack start → full Chainsaw Man until recovery.
          const ripping = anim.kind === 'attack' && anim.t > 0.08 && anim.t < 0.92
          dr.saw += ((ripping ? 1 : 0) - dr.saw) * (1 - Math.exp(-18 * Math.min(dt, 0.1)))
          const on = dr.saw > 0.08
          const rev = 1 + Math.sin(dr.t * 42 + seed) * 0.06 * dr.saw
          for (const g of Object.values(chainsawShells.current)) {
            if (!g) continue
            g.visible = on
            if (on) g.scale.setScalar(0.9 + dr.saw * 0.15 * rev)
          }
        }

        if (hasMobForm && mobForms.current) {
          // The body itself flips purple ↔ black (~12 Hz) — not an aura overlay.
          const purpleOn = Math.floor(dr.t * 12 + seed * 3) % 2 === 0
          for (const m of mobForms.current.purple) m.visible = purpleOn
          for (const m of mobForms.current.black) m.visible = !purpleOn
        }

        if (hasFullCowl && fullCowlAura.current) {
          const cowling =
            anim.kind === 'idle' ||
            anim.kind === 'ready' ||
            (anim.kind === 'move' && speed > 0.04) ||
            (anim.kind === 'attack' && anim.t < 0.95)
          dr.trail += ((cowling ? 1 : 0) - dr.trail) * (1 - Math.exp(-14 * Math.min(dt, 0.1)))
          const g = fullCowlAura.current
          const body = b.body
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          if (on) {
            const pulse = 1 + Math.sin(dr.t * 28 + seed) * 0.1
            g.scale.setScalar((0.92 + dr.trail * 0.22) * pulse)
            const tick = Math.floor(dr.t * 22 + seed * 4)
            g.children.forEach((c, i) => {
              // Rings stay; bolts flicker on/off like OFA arcs.
              if (i < 2) {
                c.visible = true
                c.rotation.z = dr.t * (1.2 + i * 0.4)
              } else {
                c.visible = ((tick + i) % 3) !== 0
                c.rotation.y = dr.t * 4 + i
              }
            })
            if (anim.kind === 'move' || anim.kind === 'attack') {
              g.position.x += Math.sin(dr.t * 48) * 0.025
              g.position.y += Math.cos(dr.t * 40) * 0.02
            }
          }
        }

        if (hasSsj2 && ssj2Aura.current) {
          const raging =
            anim.kind === 'idle' ||
            anim.kind === 'ready' ||
            (anim.kind === 'move' && speed > 0.04) ||
            (anim.kind === 'attack' && anim.t < 0.95)
          dr.trail += ((raging ? 1 : 0) - dr.trail) * (1 - Math.exp(-16 * Math.min(dt, 0.1)))
          const g = ssj2Aura.current
          const body = b.body
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          if (on) {
            const pulse = 1 + Math.sin(dr.t * 32 + seed) * 0.12
            g.scale.setScalar((0.95 + dr.trail * 0.25) * pulse)
            const tick = Math.floor(dr.t * 26 + seed * 5)
            g.children.forEach((c, i) => {
              if (i < 2) {
                c.visible = true
                c.rotation.z = dr.t * (1.5 + i * 0.5)
              } else {
                c.visible = ((tick + i) % 2) !== 0
                c.rotation.y = dr.t * 6 + i
                c.rotation.z = dr.t * 4 + i * 0.8
              }
            })
            if (anim.kind === 'move' || anim.kind === 'attack') {
              g.position.x += Math.sin(dr.t * 55) * 0.03
              g.position.y += Math.cos(dr.t * 48) * 0.025
            }
          }
        }

        if (hasSpiritDive && spiritDiveAura.current) {
          const diving =
            anim.kind === 'idle' ||
            anim.kind === 'ready' ||
            anim.kind === 'move' ||
            (anim.kind === 'attack' && anim.t < 0.95)
          dr.trail += ((diving ? 1 : 0) - dr.trail) * (1 - Math.exp(-14 * Math.min(dt, 0.1)))
          const g = spiritDiveAura.current
          const body = b.body
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.trail > 0.05
          g.visible = on
          if (on) {
            const pulse = 1 + Math.sin(dr.t * 22 + seed) * 0.1
            g.scale.setScalar((0.94 + dr.trail * 0.24) * pulse)
            const tick = Math.floor(dr.t * 18 + seed * 3)
            g.children.forEach((c, i) => {
              if (i < 2) {
                c.visible = true
                c.rotation.z = dr.t * (1.1 + i * 0.35)
              } else {
                c.visible = ((tick + i) % 3) !== 0
                c.rotation.y = dr.t * 3.5 + i
              }
            })
            if (anim.kind === 'move' || anim.kind === 'attack') {
              g.position.x += Math.sin(dr.t * 36) * 0.02
              g.position.y += Math.cos(dr.t * 30) * 0.018
            }
          }
        }

        if (hasZenitsuThunder && zenitsuAura.current) {
          const thundering =
            anim.kind === 'idle' ||
            anim.kind === 'ready' ||
            (anim.kind === 'move' && speed > 0.04) ||
            (anim.kind === 'attack' && anim.t < 0.95)
          dr.thunder += ((thundering ? 1 : 0) - dr.thunder) * (1 - Math.exp(-16 * Math.min(dt, 0.1)))
          const g = zenitsuAura.current
          const body = b.body
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.thunder > 0.05
          g.visible = on
          if (on) {
            const pulse = 1 + Math.sin(dr.t * 36 + seed) * 0.14
            g.scale.setScalar((0.96 + dr.thunder * 0.28) * pulse)
            const tick = Math.floor(dr.t * 28 + seed * 5)
            g.children.forEach((c, i) => {
              if (i < 2) {
                c.visible = true
                c.rotation.z = dr.t * (1.8 + i * 0.55)
              } else {
                c.visible = ((tick + i) % 2) !== 0
                c.rotation.y = dr.t * 7 + i
                c.rotation.z = dr.t * 5 + i * 0.9
              }
            })
            if (anim.kind === 'move' || anim.kind === 'attack') {
              g.position.x += Math.sin(dr.t * 60) * 0.032
              g.position.y += Math.cos(dr.t * 52) * 0.028
            }
          }
        }

        if (hasMugetsu && mugetsuAura.current) {
          const voiding =
            anim.kind === 'idle' ||
            anim.kind === 'ready' ||
            (anim.kind === 'move' && speed > 0.04) ||
            (anim.kind === 'attack' && anim.t < 0.98)
          dr.mugetsu += ((voiding ? 1 : 0) - dr.mugetsu) * (1 - Math.exp(-12 * Math.min(dt, 0.1)))
          const g = mugetsuAura.current
          const body = b.body
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.mugetsu > 0.05
          g.visible = on
          if (on) {
            const pulse = 1 + Math.sin(dr.t * 18 + seed) * 0.1
            g.scale.setScalar((0.98 + dr.mugetsu * 0.22) * pulse)
            g.children.forEach((c, i) => {
              c.visible = true
              c.rotation.y = dr.t * (0.9 + i * 0.35)
              c.rotation.z = Math.sin(dr.t * 2.2 + i) * 0.15
            })
            if (anim.kind === 'move' || anim.kind === 'attack') {
              g.position.x += Math.sin(dr.t * 28) * 0.018
              g.position.y += Math.cos(dr.t * 22) * 0.014
            }
          }
        }

        if (hasJackpot && jackpotAura.current) {
          // Jackpot stays lit — near-invincible shell never drops while on the board.
          const jackpotting =
            anim.kind === 'idle' ||
            anim.kind === 'ready' ||
            anim.kind === 'move' ||
            (anim.kind === 'attack' && anim.t < 0.98) ||
            anim.kind === 'hurt'
          dr.jackpot += ((jackpotting ? 1 : 0) - dr.jackpot) * (1 - Math.exp(-16 * Math.min(dt, 0.1)))
          const g = jackpotAura.current
          const body = b.body
          if (body) {
            g.position.copy(body.position)
            g.rotation.copy(body.rotation)
          }
          const on = dr.jackpot > 0.05
          g.visible = on
          if (on) {
            const pulse = 1 + Math.sin(dr.t * 20 + seed) * 0.12
            g.scale.setScalar((0.95 + dr.jackpot * 0.28) * pulse)
            const tick = Math.floor(dr.t * 18 + seed * 3)
            g.children.forEach((c, i) => {
              if (i < 3) {
                c.visible = true
                c.rotation.z = dr.t * (1.4 + i * 0.5)
              } else {
                c.visible = ((tick + i) % 2) !== 0
                c.rotation.y = dr.t * 5 + i
                c.rotation.z = dr.t * 3 + i * 0.7
              }
            })
            if (anim.kind === 'move' || anim.kind === 'attack') {
              g.position.x += Math.sin(dr.t * 55) * 0.03
              g.position.y += Math.cos(dr.t * 42) * 0.025
            }
          }
        }

        if (hasTremor) {
          const t = dr.t + seed * 3
          const hardenedMove = hasRiotHarden && anim.kind === 'move' && dr.harden > 0.2
          const active =
            anim.kind === 'idle' || anim.kind === 'ready' || anim.kind === 'attack' || hardenedMove
          for (const [side, g] of [
            ['l', tremor.current.l],
            ['r', tremor.current.r],
          ] as const) {
            if (!g) continue
            g.visible = active
            if (!active) continue
            const sideSign = side === 'l' ? 1 : -1
            g.children.forEach((c, i) => {
              const a = t * (2.4 + i * 0.15) + i * 0.7 + sideSign
              const r = 0.07 + (i % 4) * 0.025
              const crush = 0.55 + Math.abs(Math.sin(t * 11 + i)) * 0.45
              c.position.set(Math.cos(a) * r, 0.02 + (i % 3) * 0.035 + Math.sin(a * 2) * 0.01, Math.sin(a) * r)
              c.rotation.set(a * 0.6, a, a * 0.4)
              const s = crush * (0.7 + (i % 3) * 0.15)
              c.scale.setScalar(s)
            })
          }
        }

        if (hasMag && magField.current) {
          const t = dr.t + seed * 2.4
          const cycle = (t * 0.55) % 1
          // Assemble (0–0.45) → hold (0.45–0.7) → snap apart (0.7–1).
          const assemble = cycle < 0.45 ? cycle / 0.45 : cycle < 0.7 ? 1 : 1 - (cycle - 0.7) / 0.3
          const show = anim.kind === 'idle' || anim.kind === 'ready' || anim.kind === 'attack'
          magField.current.visible = show && assemble > 0.04
          if (show) {
            magField.current.children.forEach((c, i) => {
              const axis = i % 2
              const slot = Math.floor(i / 2)
              const spread = 0.1 + slot * 0.055
              const jitter = (1 - assemble) * 0.12
              const jx = Math.sin(t * 9 + i * 1.7) * jitter
              const jy = Math.cos(t * 7 + i) * jitter
              const jz = Math.sin(t * 8 + i * 0.9) * jitter
              if (axis === 0) {
                c.position.set((-2.5 + slot) * 0.055 * assemble + jx, (slot % 3) * 0.05 * assemble + jy, jz)
              } else {
                c.position.set(jx, (slot % 3) * 0.05 * assemble + jy, (-2.5 + slot) * 0.055 * assemble + jz)
              }
              c.scale.setScalar(0.35 + assemble * 0.9)
              c.visible = assemble > 0.08
              void spread
            })
          }
        }
      },
    }
    return () => {
      apiRef.current = null
    }
  }, [apiRef, design, pr, seed, hasEngines, hasTremor, hasMag, hasVoltForm, hasZenitsuTrail, hasVectorForm, hasPhaseForm, hasPortalForm, hasKunaiForm, hasClapForm, hasRiotHarden, hasChainsawForm, hasMobForm, hasFullCowl, hasSsj2, hasSpiritDive, hasZenitsuThunder, hasMugetsu, hasJackpot, hasYeoui])

  const limb = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1
    return (
      <group ref={bone(`${side}Thigh`)} position={[s * pr.hipX, -0.02, 0]}>
        {hasRiotHarden && (
          <HardenArmor shellRef={setHarden(`${side}Thigh`)} kind="thigh" side={s} limb={pr.limb} armLen={pr.thigh} />
        )}
        <group ref={bone(`${side}Shin`)} position={[0, -pr.thigh, 0]}>
          {hasRiotHarden && (
            <HardenArmor shellRef={setHarden(`${side}Shin`)} kind="shin" side={s} limb={pr.limb} armLen={pr.shin} />
          )}
          {hasEngines && (
            <EngineJet
              shinLen={pr.shin}
              limb={pr.limb}
              jetRef={(g) => {
                jets.current[side] = g
              }}
            />
          )}
          <group ref={bone(`${side}Foot`)} position={[0, -pr.shin, 0]}>
            {hasTremor && (
              <TremorDebris
                color={design.palette.accent}
                color2={design.palette.metal ?? design.palette.trim}
                fieldRef={(g) => {
                  tremor.current[side] = g
                }}
              />
            )}
          </group>
        </group>
      </group>
    )
  }

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1
    return (
      <group ref={bone(`${side}Upper`)} position={[s * pr.shoulderX, pr.chestH * 0.84, 0]}>
        {hasRiotHarden && (
          <HardenArmor shellRef={setHarden(`${side}Upper`)} kind="upper" side={s} limb={pr.limb} armLen={pr.upperArm} />
        )}
        <group ref={bone(`${side}Fore`)} position={[0, -pr.upperArm, 0]}>
          {hasRiotHarden && (
            <HardenArmor shellRef={setHarden(`${side}Fore`)} kind="fore" side={s} limb={pr.limb} armLen={pr.forearm} />
          )}
          {hasChainsawForm && (
            <ChainsawForm shellRef={setSaw(`${side}Fore`)} kind="fore" side={s} limb={pr.limb} armLen={pr.forearm} />
          )}
          <group ref={bone(`${side}Hand`)} position={[0, -pr.forearm, 0]}>
            {hasRiotHarden && <HardenArmor shellRef={setHarden(`${side}Hand`)} kind="hand" side={s} limb={pr.limb} />}
            {side === 'r' && <group ref={bone('propHand')} />}
          </group>
        </group>
      </group>
    )
  }

  // Parts are skinned onto these bones; `slotOffset` in bake.ts mirrors the plain offset groups.
  // Trail is a sibling of `body` so it isn't affected by pose scale quirks.
  return (
    <group ref={frame}>
      {(hasVoltForm || hasVectorForm || hasZenitsuTrail) && (
        <ElectricTrail
          color={design.palette.glow ?? design.palette.accent}
          color2={design.palette.accent}
          streakRef={(g) => {
            streaks.current = g
          }}
        />
      )}
      {hasPhaseForm && (
        <PhaseTrail
          color={design.palette.accent}
          color2={design.palette.primary}
          streakRef={(g) => {
            phaseGhosts.current = g
          }}
        />
      )}
      {hasPortalForm && (
        <PortalTrail
          color={design.palette.glow ?? design.palette.metal ?? '#d8e2ec'}
          color2={design.palette.metal ?? '#c4ccd6'}
          streakRef={(g) => {
            portalGates.current = g
          }}
        />
      )}
      {hasKunaiForm && (
        <KunaiTrail
          color={design.palette.glow ?? design.palette.accent}
          color2={design.palette.primary}
          streakRef={(g) => {
            kunaiMarks.current = g
          }}
        />
      )}
      {hasClapForm && (
        <ClapTrail
          color={design.palette.glow ?? design.palette.accent}
          color2={design.palette.accent}
          streakRef={(g) => {
            clapRings.current = g
          }}
        />
      )}
      {hasFullCowl && (
        <FullCowlAura
          color={design.palette.glow ?? design.palette.accent}
          color2={design.palette.hairAlt ?? design.palette.accent}
          formRef={(g) => {
            fullCowlAura.current = g
          }}
        />
      )}
      {hasSsj2 && (
        <FullCowlAura
          color={design.palette.glow ?? '#5af0ff'}
          color2={design.palette.hairAlt ?? '#ffe868'}
          formRef={(g) => {
            ssj2Aura.current = g
          }}
        />
      )}
      {hasSpiritDive && (
        <FullCowlAura
          color={design.palette.glow ?? '#40ff88'}
          color2={design.palette.accent ?? '#a8ffd0'}
          formRef={(g) => {
            spiritDiveAura.current = g
          }}
        />
      )}
      {hasZenitsuThunder && (
        <FullCowlAura
          color={design.palette.glow ?? '#ffe848'}
          color2={design.palette.hairAlt ?? '#ff9020'}
          formRef={(g) => {
            zenitsuAura.current = g
          }}
        />
      )}
      {hasMugetsu && (
        <FullCowlAura
          color={design.palette.glow ?? '#2848a8'}
          color2={design.palette.accent ?? '#1a2438'}
          formRef={(g) => {
            mugetsuAura.current = g
          }}
        />
      )}
      {hasJackpot && (
        <JackpotAura
          color={design.palette.glow ?? design.palette.accent}
          color2={design.palette.hairAlt ?? '#a8ff40'}
          formRef={(g) => {
            jackpotAura.current = g
          }}
        />
      )}
      <group ref={bone('body')}>
        <group ref={bone('pelvis')} position={[0, pr.hipH, 0]}>
          <group ref={bone('propStow')} />
          <group ref={bone('tails')} position={[0, 0.03, -pr.pelvisD * 0.42]} />
          {hasMag && (
            <MagFilings
              color={design.palette.glow ?? design.palette.accent}
              color2={design.palette.metal ?? design.palette.primary}
              fieldRef={(g) => {
                magField.current = g
              }}
            />
          )}
          {limb('l')}
          {limb('r')}
          <group ref={bone('spine')} position={[0, 0.03, 0]}>
            <group ref={bone('chest')} position={[0, pr.abdomen, 0]}>
              {hasRiotHarden && (
                <HardenArmor
                  shellRef={setHarden('chest')}
                  kind="chest"
                  limb={pr.limb}
                  chestH={pr.chestH}
                  chestD={pr.chestD}
                />
              )}
              <group ref={bone('cape')} position={[0, pr.chestH * 0.92, -pr.chestD * 0.5]}>
                <group ref={bone('wingL')} position={[0.02, -0.05, -0.01]} />
                <group ref={bone('wingR')} position={[-0.02, -0.05, -0.01]} />
              </group>
              {arm('l')}
              {arm('r')}
              <group ref={bone('neck')} position={[0, pr.chestH, 0]}>
                <group ref={bone('head')} position={[0, pr.neck, 0]}>
                  {hasRiotHarden && <HardenArmor shellRef={setHarden('head')} kind="head" headR={pr.headR} />}
                  {hasChainsawForm && <ChainsawForm shellRef={setSaw('head')} kind="head" headR={pr.headR} />}
                  <group position={[0, pr.headR * 0.95, 0]}>
                    <group ref={bone('eyes')} position={[0, -pr.headR * 0.1, 0]} />
                    <group ref={bone('hairBack')} position={[0, pr.headR * 0.3, -pr.headR * 0.6]} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
