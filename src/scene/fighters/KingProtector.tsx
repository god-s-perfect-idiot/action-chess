import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { HeroDesign } from '../../game/heroDesigns'
import { PERSON_HEIGHT, UNIT_SCALE } from '../../game/types'
import { walkY } from '../terrainHeight'
import { type AnimInput } from './anims'
import { type BoutBeat, sampleBeat } from './bouts'
import { now } from './clock'
import { flickerScale } from './BodyRetrieval'
import { HeroFighter, type FighterApi } from './HeroFighter'

export const FLICKER_IN = 0.28
export const FLICKER_OUT = 0.32

export interface ProtectorSpawn {
  id: number
  design: HeroDesign
  /** Feet position beside the king. */
  at: THREE.Vector3
  /** World XZ the protector faces (checker). */
  face: THREE.Vector2
  start: number
  seed: number
  /** Absolute clock when the protector should leave (check cleared). */
  leaveAt: number | null
  /** Absolute clock when fight choreography begins; null while only guarding. */
  fightAt: number | null
  beats: BoutBeat[]
  /** Absolute clock when protector death begins. */
  deathAt: number | null
  /** Absolute clock when the actor is fully gone. */
  goneAt: number
}

const _pos = new THREE.Vector2()
const _flicker = new THREE.Vector3()

export function KingProtectorActor({ event }: { event: ProtectorSpawn }) {
  const root = useRef<THREE.Group>(null)
  const api = useRef<FighterApi | null>(null)
  const state = useRef({
    yaw: Math.atan2(event.face.x - event.at.x, event.face.y - event.at.z),
  })

  useFrame((_, rawDt) => {
    const g = root.current
    const f = api.current
    if (!g || !f) return
    const dt = Math.min(0.05, rawDt)
    const t = now()
    const local = t - event.start

    if (local < -0.02 || t >= event.goneAt) {
      g.visible = false
      return
    }
    g.visible = true

    let x = event.at.x
    let z = event.at.z
    let anim: AnimInput = { kind: 'idle', t: local + event.seed * 4 }
    let yaw = Math.atan2(event.face.x - x, event.face.y - z)
    let yawRate = 14
    let scaleX = 1
    let scaleY = 1
    let scaleZ = 1

    if (local < FLICKER_IN) {
      flickerScale(local / FLICKER_IN, true, _flicker)
      scaleX = _flicker.x
      scaleY = _flicker.y
      scaleZ = _flicker.z
    }

    const fight = event.fightAt
    const deathAt = event.deathAt
    if (fight !== null && t >= fight && (deathAt === null || t < deathAt)) {
      const sampled = sampleBeat(event.beats, t - fight, _pos)
      x = _pos.x
      z = _pos.y
      if (sampled.anim.kind === 'ready') {
        anim = { kind: 'idle', t: local + event.seed * 4 }
      } else {
        anim = sampled.anim
      }
      yaw = sampled.yaw
      yawRate = sampled.yawRate
    } else if (deathAt !== null && t >= deathAt) {
      anim = { kind: 'death', t: t - deathAt, dmg: 'slash', zone: 'mid' }
      yawRate = 30
      if (event.beats.length) {
        sampleBeat(event.beats, Math.max(0, deathAt - fight! - 0.01), _pos)
        x = _pos.x
        z = _pos.y
      }
    } else if (event.leaveAt !== null && t >= event.leaveAt) {
      const p = Math.min(1, (t - event.leaveAt) / FLICKER_OUT)
      flickerScale(p, false, _flicker)
      scaleX = _flicker.x
      scaleY = _flicker.y
      scaleZ = _flicker.z
      if (p >= 1) g.visible = false
    }

    let d = yaw - state.current.yaw
    d = Math.atan2(Math.sin(d), Math.cos(d))
    state.current.yaw += d * (1 - Math.exp(-yawRate * dt))

    g.position.set(x, walkY(x, z), z)
    g.rotation.set(0, state.current.yaw, 0)
    g.scale.set(scaleX * UNIT_SCALE, scaleY * UNIT_SCALE, scaleZ * UNIT_SCALE)
    f.update(anim, dt, 0)
  })

  return (
    <group ref={root} visible={false}>
      <HeroFighter
        heroId={null}
        color="w"
        seed={event.seed}
        apiRef={api}
        design={event.design}
        floor={0}
      />
    </group>
  )
}

/** World offset beside the king, biased toward the checker. */
export function protectorStand(
  king: THREE.Vector2,
  threat: THREE.Vector2,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const dir = new THREE.Vector2().subVectors(threat, king)
  if (dir.lengthSq() < 1e-4) dir.set(0, 1)
  else dir.normalize()
  const perp = new THREE.Vector2(-dir.y, dir.x)
  // Stand a clear step toward the threat so the guard isn't hugging the king.
  const stand = king
    .clone()
    .addScaledVector(dir, UNIT_SCALE * 1.15)
    .addScaledVector(perp, UNIT_SCALE * 0.42)
  return out.set(stand.x, 0, stand.y)
}

export function protectorFlickerFx(
  at: THREE.Vector3,
  start: number,
  appear: boolean,
  id: number,
) {
  return {
    id,
    kind: 'bodyFlicker' as const,
    start,
    travel: 0,
    dur: appear ? FLICKER_IN : FLICKER_OUT,
    from: at.clone(),
    to: at.clone(),
    color: '#1a2848',
    color2: appear ? '#c8a050' : '#8a0a14',
    size: PERSON_HEIGHT,
  }
}
