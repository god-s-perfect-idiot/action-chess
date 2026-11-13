import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { HairStyle, HeroDesign, IdleStyle } from '../../game/heroDesigns'
import { UNIT_SCALE } from '../../game/types'
import { walkY } from '../terrainHeight'
import { now } from './clock'
import { HeroFighter, type FighterApi } from './HeroFighter'

/** Full body-recovery sequence length (seconds, game clock). */
export const RETRIEVAL_DUR = 1.65

const IN = 0.2
const HOLD = 0.4
const APPROACH = 0.45
const TOUCH = 0.25
const OUT = 0.35

/** Exit flicker begins this many seconds after retrieval start. */
export const RETRIEVAL_OUT_AT = IN + HOLD + APPROACH + TOUCH

const POSES: IdleStyle[] = [
  'joninSalute',
  'joninKneel',
  'ninjaCrouch',
  'armsCrossed',
  'lookout',
  'boxer',
  'coolStand',
  'kungfu',
  'focused',
]

const HAIRS: { hair: HairStyle; color: string; alt: string }[] = [
  { hair: 'spiky', color: '#3a2418', alt: '#1a100c' },
  { hair: 'messy', color: '#1a1410', alt: '#0c0a08' },
  { hair: 'bowl', color: '#2a2018', alt: '#14100c' },
  { hair: 'slicked', color: '#4a3020', alt: '#2a1810' },
  { hair: 'undercut', color: '#1c1814', alt: '#0e0c0a' },
  { hair: 'buzz', color: '#3a2820', alt: '#201810' },
  { hair: 'shaggy', color: '#5a4030', alt: '#302018' },
  { hair: 'sweptBack', color: '#241810', alt: '#120c08' },
]

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function joninDesign(seed: number, pose: IdleStyle, hairIdx: number): HeroDesign {
  const h = HAIRS[hairIdx % HAIRS.length]
  return {
    body: 'athletic',
    figure: 'm',
    tweak: {
      height: 0.98 + hash(seed + 3) * 0.08,
      bulk: 0.96 + hash(seed + 5) * 0.1,
      shoulders: 1.0 + hash(seed + 7) * 0.08,
      head: 1.0 + hash(seed + 9) * 0.04,
    },
    palette: {
      skin: hash(seed + 11) > 0.55 ? '#e8b888' : '#d4a078',
      hair: h.color,
      hairAlt: h.alt,
      primary: '#1a2848',
      secondary: '#6a7a3e',
      accent: '#c01828',
      trim: '#152038',
      metal: '#c8ccd4',
      eye: hash(seed + 13) > 0.5 ? '#3a2418' : '#2a3850',
      glow: '#8a9a48',
    },
    face: {
      eyes: hash(seed + 15) > 0.6 ? 'sharp' : 'fierce',
      brows: hash(seed + 17) > 0.5 ? 'soft' : 'angry',
      mouth: hash(seed + 19) > 0.55 ? 'line' : 'grin',
    },
    hair: h.hair,
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['joninSuit'],
    weapon: 'none',
    idle: pose,
    attack: 'leafCombo',
    death: 'crumple',
    tempo: 1,
  }
}

/** Body-flicker stretch: silhouette collapses into vertical lines. */
export function flickerScale(p: number, appear: boolean, out = new THREE.Vector3()): THREE.Vector3 {
  const t = appear ? Math.min(1, Math.max(0, p)) : Math.min(1, Math.max(0, 1 - p))
  const ease = t * t * (3 - 2 * t)
  const mid = Math.sin(ease * Math.PI)
  // Keep the streak about character height — thin/tall, not a sky-high tower.
  const sy = 1 + mid * 0.55
  const sxz = Math.max(0.06, 1 - mid * 0.88)
  if (!appear && p > 0.92) return out.set(0.001, sy, 0.001)
  return out.set(sxz, sy, sxz)
}

/**
 * Board body-flicker travel — same stretch as the jonin squad / king protectors.
 * First half collapses on the departure pad; second half rematerializes on arrival.
 */
export function bodyFlickerTravelScale(
  p: number,
  out = new THREE.Vector3(),
  snap = 0.5,
): THREE.Vector3 {
  const u = Math.min(1, Math.max(0, p))
  if (u < snap) {
    const local = snap > 1e-6 ? u / snap : 1
    return flickerScale(local, false, out)
  }
  const local = snap < 1 - 1e-6 ? (u - snap) / (1 - snap) : 1
  return flickerScale(local, true, out)
}

export interface RetrievalEvent {
  id: number
  /** World position of the resting corpse. */
  at: THREE.Vector3
  start: number
  seed: number
}

function JoninActor({
  design,
  seed,
  offset,
  corpse,
  start,
  stagger,
}: {
  design: HeroDesign
  seed: number
  offset: THREE.Vector3
  corpse: THREE.Vector3
  start: number
  stagger: number
}) {
  const root = useRef<THREE.Group>(null)
  const api = useRef<FighterApi | null>(null)
  const scale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const spawn = useMemo(() => corpse.clone().add(offset), [corpse, offset])
  const touch = useMemo(() => {
    const d = offset.clone()
    if (d.lengthSq() < 1e-6) d.set(0.4, 0, 0.2)
    d.normalize().multiplyScalar(UNIT_SCALE * 0.22)
    return corpse.clone().add(d)
  }, [corpse, offset])

  useFrame((_, rawDt) => {
    const g = root.current
    const f = api.current
    if (!g || !f) return
    const dt = Math.min(0.05, rawDt)
    const t = now() - start - stagger
    if (t < -0.02) {
      g.visible = false
      return
    }
    g.visible = true

    let x = spawn.x
    let z = spawn.z
    let style: IdleStyle | undefined
    let animT = t + seed * 4

    if (t < IN) {
      flickerScale(t / IN, true, scale)
    } else if (t < IN + HOLD) {
      scale.set(1, 1, 1)
    } else if (t < IN + HOLD + APPROACH) {
      const p = (t - IN - HOLD) / APPROACH
      const e = p * p * (3 - 2 * p)
      x = spawn.x + (touch.x - spawn.x) * e
      z = spawn.z + (touch.z - spawn.z) * e
      scale.set(1, 1, 1)
      if (e >= 0.55) style = 'joninReach'
    } else if (t < IN + HOLD + APPROACH + TOUCH) {
      x = touch.x
      z = touch.z
      scale.set(1, 1, 1)
      style = 'joninReach'
      animT = 2.5 + (t - IN - HOLD - APPROACH) * 0.4
    } else {
      const p = Math.min(1, (t - IN - HOLD - APPROACH - TOUCH) / OUT)
      flickerScale(p, false, scale)
      x = touch.x
      z = touch.z
      style = 'joninReach'
      if (p >= 1) g.visible = false
    }

    const yaw = Math.atan2(corpse.x - x, corpse.z - z)
    g.position.set(x, walkY(x, z), z)
    g.rotation.set(0, yaw, 0)
    g.scale.set(scale.x * UNIT_SCALE, scale.y * UNIT_SCALE, scale.z * UNIT_SCALE)
    f.update({ kind: 'idle', t: animT, style }, dt, 0)
  })

  return (
    <group ref={root} visible={false}>
      <HeroFighter heroId={null} color="w" seed={seed} apiRef={api} design={design} floor={0} />
    </group>
  )
}

/**
 * Three Leaf jonin body-flicker in around a corpse, touch it, then flicker out with it.
 */
export function BodyRetrieval({ event }: { event: RetrievalEvent }) {
  const team = useMemo(() => {
    const usedHair = new Set<number>()
    const usedPose = new Set<number>()
    const pick = (pool: number, used: Set<number>, salt: number) => {
      let i = Math.floor(hash(event.seed + salt) * pool)
      for (let n = 0; n < pool; n++) {
        const j = (i + n) % pool
        if (!used.has(j)) {
          used.add(j)
          return j
        }
      }
      return i
    }
    return [0, 1, 2].map((i) => {
      const pose = POSES[pick(POSES.length, usedPose, 21 + i * 3)]
      const hair = pick(HAIRS.length, usedHair, 41 + i * 5)
      const ang = (i / 3) * Math.PI * 2 + hash(event.seed + i) * 0.7
      const rad = UNIT_SCALE * (0.38 + hash(event.seed + 8 + i) * 0.18)
      return {
        design: joninDesign(event.seed * 17 + i * 97, pose, hair),
        seed: event.seed + i * 13,
        offset: new THREE.Vector3(Math.sin(ang) * rad, 0, Math.cos(ang) * rad),
        stagger: i * 0.05,
      }
    })
  }, [event])

  return (
    <group>
      {team.map((j, i) => (
        <JoninActor
          key={i}
          design={j.design}
          seed={j.seed}
          offset={j.offset}
          corpse={event.at}
          start={event.start}
          stagger={j.stagger}
        />
      ))}
    </group>
  )
}
