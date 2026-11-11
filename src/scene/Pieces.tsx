import { useFrame, useThree } from '@react-three/fiber'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import * as THREE from 'three'
import { getHeroDesign } from '../game/heroDesigns'
import type { TrackedPiece } from '../game/pieceIds'
import {
  CELL_SIZE,
  PERSON_HEIGHT,
  squareToCoords,
  UNIT_SCALE,
  type PieceType,
  type Square,
} from '../game/types'
import { walkY } from './terrainHeight'
import {
  attackFor,
  deathDuration,
  type AnimInput,
  type DamageType,
  type HoldKind,
  type HitZone,
  type MoveStyle,
  type SeverSpec,
} from './fighters/anims'
import { now, TIME_SCALE } from './fighters/clock'
import {
  BodyRetrieval,
  flickerScale,
  RETRIEVAL_DUR,
  RETRIEVAL_OUT_AT,
  type RetrievalEvent,
} from './fighters/BodyRetrieval'
import { FxLayer, type FxEvent } from './fighters/Fx'
import {
  buildLethalDuel,
  buildProtectorDuel,
  sampleBeat,
  type BoutBeat,
} from './fighters/bouts'
import { HeroFighter, type FighterApi } from './fighters/HeroFighter'
import {
  FLICKER_IN,
  FLICKER_OUT,
  KingProtectorActor,
  protectorFlickerFx,
  protectorStand,
  type ProtectorSpawn,
} from './fighters/KingProtector'
import { outlineUniforms } from './fighters/materials'
import { isPointerDrag } from './isPointerDrag'
import { protectorForKing } from '../game/protectors'

interface Plan {
  start: number
  from: THREE.Vector2
  stop: THREE.Vector2
  to: THREE.Vector2
  style: MoveStyle
  approach: number
  /** Seconds from start; -1 when no capture. */
  attackAt: number
  attackDur: number
  victim: THREE.Vector2 | null
  /** Seconds from start when the final step onto the square begins. */
  waitUntil: number
  finish: number
  finishStyle: MoveStyle
  /** Shared exchange before the signature. Empty on plain moves. */
  beats?: BoutBeat[]
  /** Seconds from `start` when `beats` hands off to the signature (or the move ends). */
  beatsEnd?: number
  /** Facing blend rate while traveling; high values read as instant vector redirects. */
  turnRate?: number
  /**
   * Teleport progress (0..1) when the body snaps from departure → arrival.
   * Default 0.5; Minato waits for the marked kunai (~0.62).
   */
  snapAt?: number
}

interface Ghost {
  piece: TrackedPiece
  /** Rest position once any carried plan finishes (usually the destination tile). */
  pos: THREE.Vector2
  /** Where the victim is standing when the duel clock starts. */
  origin: THREE.Vector2
  attacker: THREE.Vector2
  hitAt: number
  /** Jonin recovery team arrives; body flickers out shortly after. */
  vanishAt: number
  /** Absolute time when corpse + jonin are fully gone. */
  goneAt: number
  /** Exchange that plays after `carry`, before the killing signature. */
  beats: BoutBeat[]
  duelStart: number
  duelUntil: number
  /** Non-lethal blows of the combo (absolute times) that stagger before the kill. */
  hurts: { at: number; zone: HitZone; hold?: HoldKind }[]
  dmg: DamageType
  zone: HitZone
  sever?: SeverSpec
  /** Finish this move/kill choreography before the death stage. */
  carry: Plan | null
}

const _flicker = new THREE.Vector3()

/** Feet sit on the terrain surface (group origin). Ragdolls settle there. */
const BOARD_FLOOR = 0

const ZONE_Y: Record<HitZone, number> = { high: 0.98, mid: 0.75, low: 0.4 }

interface Director {
  plans: Map<string, Plan>
  pos: Map<string, THREE.Vector2>
  /** Absolute time when the board is free for the next staged beat. */
  freeAt: number
}

function planEnd(plan: Plan): number {
  return plan.start + plan.waitUntil + plan.finish
}

function coords(sq: Square): THREE.Vector2 {
  const [x, z] = squareToCoords(sq)
  return new THREE.Vector2(x, z)
}

function moveStyle(
  type: PieceType,
  heroId: string | null,
  color: 'w' | 'b',
  awakened = false,
): MoveStyle {
  const loco = getHeroDesign(heroId, color, { awakened }).locomotion
  if (loco) return loco
  if (type === 'n') return 'leap'
  if (type === 'r') return 'dash'
  if (type === 'k') return 'walk'
  return 'run'
}

const SPEED: Record<MoveStyle, number> = {
  run: CELL_SIZE * 2.6,
  dash: CELL_SIZE * 5.5,
  walk: CELL_SIZE * 1.4,
  leap: 0,
  /** Normal gait, engine-boosted travel speed. */
  sprint: CELL_SIZE * 6.4,
  /** Vector shove — readable coast, not a blink. */
  vector: CELL_SIZE * 3.4,
  /** Regal mid-air glide. */
  fly: CELL_SIZE * 3.2,
  /** Serious Mode blink — duration mostly fixed; speed is a soft hint. */
  teleport: CELL_SIZE * 8,
}

function travelTime(style: MoveStyle, dist: number, design?: ReturnType<typeof getHeroDesign>): number {
  if (dist < 1e-3) return 0
  if (style === 'leap') {
    const mul = design?.moveSpeedMul ?? 1
    return Math.max(0.18, (0.45 + (dist / CELL_SIZE) * 0.12) / mul)
  }
  if (style === 'teleport') {
    // Finral needs a beat longer so the walk-in / walk-out reads.
    if (design?.extras.includes('finralSuit')) return 0.62 + (dist / CELL_SIZE) * 0.06
    // Minato: throw → wait for kunai → yellow flash rematerialize on the mark.
    if (design?.extras.includes('minatoSuit')) return 0.72 + (dist / CELL_SIZE) * 0.06
    return 0.32 + (dist / CELL_SIZE) * 0.04
  }
  const mul = design?.moveSpeedMul ?? 1
  const speed = SPEED[style] * mul
  // Fast heroes need a lower floor or one-square sprints still feel capped.
  const floor = mul >= 3 ? 0.05 : style === 'vector' || style === 'fly' ? 0.22 : 0.28
  return Math.max(floor, dist / speed)
}

function homeYaw(color: 'w' | 'b') {
  return color === 'w' ? 0 : Math.PI
}

function dampAngle(cur: number, target: number, rate: number, dt: number) {
  let d = target - cur
  d = Math.atan2(Math.sin(d), Math.cos(d))
  return cur + d * (1 - Math.exp(-rate * dt))
}

function heroSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973
  return (h % 1000) / 1000
}

function hashBout(...parts: string[]): number {
  let h = 2166136261
  const s = parts.join('|')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const fxColor = (heroId: string | null, color: 'w' | 'b', awakened = false) => {
  const p = getHeroDesign(heroId, color, { awakened }).palette
  return { c1: p.glow ?? p.accent, c2: p.accent === (p.glow ?? p.accent) ? p.hair : p.accent }
}

let fxId = 1

/** Progress when Minato's marked kunai lands / body snaps onto the mark. */
const MINATO_SNAP = 0.62

/** Flying Thunder God travel — kunai flies to the mark, then yellow flash as he rematerializes. */
function minatoKunaiTravelFx(
  from: THREE.Vector2,
  to: THREE.Vector2,
  start: number,
  dur: number,
  colors: { c1: string; c2: string },
): FxEvent | null {
  if (dur < 0.08) return null
  const up = UNIT_SCALE * 0.72
  // Match KUNAI_LEAP: release ~0.12, land + teleport at MINATO_SNAP.
  const release = dur * 0.12
  const arrive = dur * MINATO_SNAP
  return {
    id: fxId++,
    kind: 'kunai',
    start: start + release,
    travel: Math.max(0.08, arrive - release),
    dur: 0.38,
    from: new THREE.Vector3(from.x, up, from.y),
    to: new THREE.Vector3(to.x, up * 0.95, to.y),
    color: colors.c1,
    color2: colors.c2,
    size: UNIT_SCALE * 0.48,
  }
}

/** White / black team readout while a fighter is selected. */
const TEAM_GLOW = {
  w: { rim: '#ffffff', core: '#f2f6ff', soft: '#c8d6ee' },
  b: { rim: '#1a1d24', core: '#07080c', soft: '#2c313c' },
} as const

/**
 * Floor pool under a fighter. Parent is scaled by UNIT_SCALE, so we inverse-scale
 * and work in world units — otherwise the disc sits under the tile surface.
 */
function TeamGlow({ color, focused }: { color: 'w' | 'b'; focused: boolean }) {
  const group = useRef<THREE.Group>(null)
  const rimMat = useRef<THREE.MeshBasicMaterial>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)
  const softMat = useRef<THREE.MeshBasicMaterial>(null)
  const palette = TEAM_GLOW[color]
  const inv = 1 / UNIT_SCALE
  // Sit just above pad toppers / selection rings (~0.2 world).
  const yLocal = 0.22 * inv

  useFrame(() => {
    const t = now()
    // ~2s full cycle: fade in, hold soft, fade out, rest dark.
    const cycle = (Math.sin((t * Math.PI) / 1) + 1) * 0.5 // 0..1 over 2s
    const breath = cycle * cycle * (3 - 2 * cycle) // smoothstep
    const focusBoost = focused ? 1.25 : 1
    const softPeak = (color === 'w' ? 0.22 : 0.28) * focusBoost
    const corePeak = (color === 'w' ? 0.28 : 0.36) * focusBoost
    const rimPeak = (color === 'w' ? 0.4 : 0.48) * focusBoost
    if (softMat.current) softMat.current.opacity = softPeak * breath
    if (coreMat.current) coreMat.current.opacity = corePeak * breath
    if (rimMat.current) rimMat.current.opacity = rimPeak * breath
    if (group.current) {
      const s = 0.94 + breath * (focused ? 0.12 : 0.08)
      group.current.scale.set(inv * s, inv, inv * s)
    }
  })

  const rSoft = CELL_SIZE * 0.38
  const rCore = CELL_SIZE * 0.22
  const rRimIn = CELL_SIZE * 0.22
  const rRimOut = CELL_SIZE * 0.32

  return (
    <group ref={group} scale={[inv, inv, inv]} position={[0, yLocal, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={() => {}}>
        <circleGeometry args={[rSoft, 40]} />
        <meshBasicMaterial
          ref={softMat}
          color={palette.soft}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
        renderOrder={3}
        raycast={() => {}}
      >
        <circleGeometry args={[rCore, 36]} />
        <meshBasicMaterial
          ref={coreMat}
          color={palette.core}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        renderOrder={4}
        raycast={() => {}}
      >
        <ringGeometry args={[rRimIn, rRimOut, 48]} />
        <meshBasicMaterial
          ref={rimMat}
          color={palette.rim}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// ───────────────────────── One fighter on the board ─────────────────────────

function adoptBeat(
  beats: BoutBeat[],
  pt: number,
  st: { pos: THREE.Vector2 },
  setKind: (kind: AnimInput['kind']) => number,
): { anim: AnimInput; yaw: number; y: number; speed: number; yawRate: number } {
  const sampled = sampleBeat(beats, pt, st.pos)
  if (sampled.anim.kind === 'ready') sampled.anim = { kind: 'ready', t: setKind('ready') }
  else setKind(sampled.anim.kind)
  return sampled
}

function playPlan(
  plan: Plan,
  pt: number,
  st: { pos: THREE.Vector2 },
  setKind: (kind: AnimInput['kind']) => number,
  faceYaw: number,
): { anim: AnimInput; yaw: number; y: number; speed: number; yawRate: number } {
  if (plan.beats && plan.beats.length && pt < (plan.beatsEnd ?? 0)) {
    return adoptBeat(plan.beats, pt, st, setKind)
  }
  let yaw = faceYaw
  let y = 0
  let speed = 0
  const turn = plan.turnRate ?? 18
  let yawRate = turn

  const travel = (
    a: THREE.Vector2,
    b: THREE.Vector2,
    dur: number,
    local: number,
    style: MoveStyle,
  ): AnimInput => {
    const p = dur > 0 ? Math.min(1, local / dur) : 1
    if (style === 'teleport') {
      // Hold on the departure pad, then snap onto the arrival while invisible.
      const snap = plan.snapAt ?? 0.5
      st.pos.copy(p < snap ? a : b)
    } else {
      st.pos.lerpVectors(
        a,
        b,
        style === 'leap' ? p : THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85,
      )
    }
    const d = new THREE.Vector2().subVectors(b, a)
    if (d.lengthSq() > 1e-6) yaw = Math.atan2(d.x, d.y)
    const dist = d.length()
    if (style === 'leap') {
      y = Math.sin(p * Math.PI) * UNIT_SCALE * (0.5 + (dist / CELL_SIZE) * 0.22)
    } else if (style === 'fly') {
      // Sustained hover height — fly toward the pad, not a hop arc.
      const lift = UNIT_SCALE * 0.42
      y = lift * (p < 0.12 ? THREE.MathUtils.smootherstep(p / 0.12, 0, 1) : p > 0.88 ? 1 - THREE.MathUtils.smootherstep((p - 0.88) / 0.12, 0, 1) : 1)
    }
    speed =
      style === 'walk'
        ? 0.35
        : style === 'vector'
          ? 1.25
          : style === 'fly'
            ? 0.85
            : style === 'teleport'
              ? 1.4
              : 1
    yawRate = style === 'teleport' ? 90 : turn
    return { kind: 'move', style, t: local, p, dist: (p * dist) / UNIT_SCALE }
  }

  const faceVictim = () => {
    if (!plan.victim) return
    const d = new THREE.Vector2().subVectors(plan.victim, plan.stop)
    if (d.lengthSq() > 1e-6) yaw = Math.atan2(d.x, d.y)
  }

  let anim: AnimInput
  if (pt < plan.approach) {
    anim = travel(plan.from, plan.stop, plan.approach, pt, plan.style)
  } else if (plan.attackAt >= 0 && pt < plan.attackAt + plan.attackDur) {
    st.pos.copy(plan.stop)
    faceVictim()
    yawRate = 25
    speed = 0.5
    anim = { kind: 'attack', t: pt - plan.attackAt }
  } else if (pt < plan.waitUntil) {
    st.pos.copy(plan.stop)
    faceVictim()
    anim = { kind: 'ready', t: setKind('ready') }
  } else {
    anim = travel(plan.stop, plan.to, plan.finish, pt - plan.waitUntil, plan.finishStyle)
  }
  if (anim.kind === 'move' || anim.kind === 'attack') setKind(anim.kind)
  return { anim, yaw, y, speed, yawRate }
}

function BoardFighter({
  piece,
  selected,
  teamGlow,
  defeatedAt,
  ghost,
  director,
  onPieceClick,
  onCorpse,
}: {
  piece: TrackedPiece
  selected: boolean
  /** Show white/black team aura on every piece while a selection is active. */
  teamGlow: boolean
  /** Absolute clock time when defeat death should begin; null if alive. */
  defeatedAt: number | null
  ghost: Ghost | null
  director: Director
  onPieceClick: (square: Square) => void
  /** Ghosts report where the ragdoll came to rest just before vanishing. */
  onCorpse?: (ghost: Ghost, at: THREE.Vector3, bled: boolean) => void
}) {
  const root = useRef<THREE.Group>(null)
  const api = useRef<FighterApi | null>(null)
  const pointerDown = useRef({ x: 0, y: 0 })
  const state = useRef({
    yaw: homeYaw(piece.color),
    pos: ghost
      ? (ghost.carry?.from.clone() ?? ghost.origin.clone())
      : coords(piece.square),
    since: now(),
    lastKind: 'idle' as AnimInput['kind'],
    reported: false,
  })
  const seed = useMemo(() => heroSeed(piece.id), [piece.id])

  useFrame((_, rawDt) => {
    const g = root.current
    const f = api.current
    if (!g || !f) return
    const dt = Math.min(rawDt, 0.1) * TIME_SCALE
    const t = now()
    const st = state.current
    let anim: AnimInput
    let yaw = homeYaw(piece.color)
    let y = 0
    let speed = 0
    let yawRate = 10
    let scale = UNIT_SCALE

    const setKind = (kind: AnimInput['kind']) => {
      if (st.lastKind !== kind) {
        st.lastKind = kind
        st.since = t
      }
      return t - st.since
    }

    if (ghost) {
      const carry = ghost.carry
      const carryDone = !carry || t >= planEnd(carry)
      if (carry && !carryDone) {
        const played = playPlan(carry, t - carry.start, st, setKind, st.yaw)
        anim = played.anim
        yaw = played.yaw
        y = played.y
        speed = played.speed
        yawRate = played.yawRate
      } else if (ghost.beats.length && t < ghost.duelUntil) {
        const played = adoptBeat(ghost.beats, t - ghost.duelStart, st, setKind)
        anim = played.anim
        yaw = played.yaw
        y = played.y
        speed = played.speed
        yawRate = played.yawRate
      } else {
        st.pos.copy(ghost.pos)
        const toA = new THREE.Vector2().subVectors(ghost.attacker, ghost.pos)
        yaw = Math.atan2(toA.x, toA.y)
        let n = 0
        while (n < ghost.hurts.length && ghost.hurts[n].at <= t) n++
        if (t >= ghost.hitAt) {
          anim = { kind: 'death', t: t - ghost.hitAt, dmg: ghost.dmg, zone: ghost.zone, sever: ghost.sever }
          yawRate = 30
        } else if (n > 0) {
          const h = ghost.hurts[n - 1]
          anim = { kind: 'hurt', t: t - h.at, zone: h.zone, n, hold: h.hold }
          setKind('hurt')
        } else {
          anim = { kind: 'ready', t: setKind('ready') }
        }
      }
      // Body-flicker out with the jonin recovery team (vertical streak vanish).
      if (t >= ghost.vanishAt + RETRIEVAL_OUT_AT) {
        const p = Math.min(1, (t - ghost.vanishAt - RETRIEVAL_OUT_AT) / (RETRIEVAL_DUR - RETRIEVAL_OUT_AT))
        flickerScale(p, false, _flicker)
      } else {
        _flicker.set(1, 1, 1)
      }
    } else if (defeatedAt !== null && t >= defeatedAt) {
      const home = coords(piece.square)
      if (st.pos.distanceToSquared(home) > 1e-4) st.pos.lerp(home, 1 - Math.exp(-10 * dt))
      anim = { kind: 'death', t: t - defeatedAt, dmg: 'none', zone: 'mid' }
      yaw = st.yaw
    } else {
      const plan = director.plans.get(piece.id)
      const pt = plan ? t - plan.start : 0
      if (plan && pt < 0) {
        // Queued: hold the start square until this beat begins.
        st.pos.copy(plan.from)
        anim = { kind: 'ready', t: setKind('ready') }
      } else if (plan && pt < plan.waitUntil + plan.finish) {
        const played = playPlan(plan, pt, st, setKind, homeYaw(piece.color))
        anim = played.anim
        yaw = played.yaw
        y = played.y
        speed = played.speed
        yawRate = played.yawRate
      } else {
        if (plan) director.plans.delete(piece.id)
        const home = coords(piece.square)
        // Snap only for real teleports (plaza-scale). A short leftover eases home.
        if (st.pos.distanceToSquared(home) > CELL_SIZE * CELL_SIZE * 2.56) {
          st.pos.copy(home)
        } else {
          st.pos.lerp(home, 1 - Math.exp(-10 * dt))
        }
        anim = selected
          ? { kind: 'ready', t: setKind('ready') }
          : { kind: 'idle', t: t + seed * 10 }
        if (!selected) setKind('idle')
      }
    }

    st.yaw = dampAngle(st.yaw, yaw, yawRate, dt)
    // Upright only — height follows the ground, facing stays level.
    const ground = walkY(st.pos.x, st.pos.y)
    g.rotation.set(0, st.yaw, 0)
    g.position.set(st.pos.x, y + ground, st.pos.y)
    if (ghost && t >= ghost.vanishAt + RETRIEVAL_OUT_AT) {
      g.scale.set(scale * _flicker.x, scale * _flicker.y, scale * _flicker.z)
      if (_flicker.x < 0.02) g.visible = false
    } else {
      g.visible = true
      g.scale.setScalar(scale)
    }
    if (!ghost) director.pos.set(piece.id, st.pos)
    f.update(anim, dt, speed)

    if (ghost && onCorpse && !st.reported && t >= ghost.vanishAt - 0.12) {
      st.reported = true
      const at = new THREE.Vector3()
      if (f.corpse(at)) {
        g.updateMatrix()
        at.applyMatrix4(g.matrix)
      } else at.set(st.pos.x, 0, st.pos.y)
      onCorpse(ghost, at, f.bled())
    }
  })

  return (
    <group
      ref={root}
      scale={UNIT_SCALE}
      onPointerDown={(e) => {
        pointerDown.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={(e) => {
        if (ghost) return
        // Orbit drag often starts on a fighter; don't treat that as a focus tap.
        if (isPointerDrag(pointerDown.current, e)) return
        e.stopPropagation()
        onPieceClick(piece.square)
      }}
      onPointerOver={(e) => {
        if (ghost) return
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 1.25, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {teamGlow && !ghost && (
        <TeamGlow color={piece.color} focused={selected} />
      )}
      <HeroFighter
        heroId={piece.heroId}
        color={piece.color}
        seed={seed}
        apiRef={api}
        floor={BOARD_FLOOR}
        awakened={piece.awakened}
      />
    </group>
  )
}

// ───────────────────────── Choreography ─────────────────────────

interface PiecesProps {
  pieces: TrackedPiece[]
  selected: Square | null
  checkedKing?: Square | null
  checkerSquare?: Square | null
  defeatedKing?: Square | null
  onPieceClick: (square: Square) => void
  /** Written each plan update so the game loop can wait out choreography. */
  boardFreeAtRef?: MutableRefObject<number>
}

export function Pieces({
  pieces,
  selected,
  checkedKing = null,
  checkerSquare = null,
  defeatedKing = null,
  onPieceClick,
  boardFreeAtRef,
}: PiecesProps) {
  const director = useRef<Director>({
    plans: new Map(),
    pos: new Map(),
    freeAt: 0,
  }).current
  const prev = useRef<TrackedPiece[]>(pieces)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [fx, setFx] = useState<FxEvent[]>([])
  const [retrievals, setRetrievals] = useState<RetrievalEvent[]>([])
  const [protectors, setProtectors] = useState<ProtectorSpawn[]>([])
  const protectorsRef = useRef<ProtectorSpawn[]>([])
  const [kingDeathAt, setKingDeathAt] = useState<number | null>(null)
  const guardKey = useRef<string | null>(null)
  const mateKey = useRef<string | null>(null)
  const { gl } = useThree()
  const showTeamGlow = selected !== null

  const commitProtectors = (next: ProtectorSpawn[] | ((prev: ProtectorSpawn[]) => ProtectorSpawn[])) => {
    setProtectors((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      protectorsRef.current = resolved
      return resolved
    })
  }

  const publishFreeAt = (t: number) => {
    director.freeAt = Math.max(director.freeAt, t)
    if (boardFreeAtRef) boardFreeAtRef.current = director.freeAt
  }

  useFrame(() => {
    const dpr = gl.getPixelRatio()
    outlineUniforms.uResY.value = gl.domElement.height
    outlineUniforms.uThickness.value = UNIT_SCALE * 0.011
    outlineUniforms.uMinPx.value = 1.05 * dpr
    outlineUniforms.uMaxPx.value = 2.6 * dpr
    if (boardFreeAtRef) boardFreeAtRef.current = director.freeAt
  })

  useLayoutEffect(() => {
    const before = prev.current
    prev.current = pieces
    if (before === pieces) return

    const byId = new Map(before.map((p) => [p.id, p]))
    const nextIds = new Set(pieces.map((p) => p.id))
    const movers = pieces.filter((p) => {
      const old = byId.get(p.id)
      return old && old.square !== p.square
    })
    const captured = before.filter((p) => !nextIds.has(p.id))

    // A reset (or any bulk change) snaps instead of animating 30 sprints.
    if (movers.length > 3 || captured.length > 1) {
      director.plans.clear()
      director.pos.clear()
      director.freeAt = 0
      if (boardFreeAtRef) boardFreeAtRef.current = 0
      setGhosts([])
      setFx([])
      setRetrievals([])
      setKingDeathAt(null)
      return
    }

    // Stage beats: finish whatever is already in flight before the next move/kill.
    // Engine gating should keep this to one ply, but chain if a plan is mid-flight.
    let t0 = Math.max(now(), director.freeAt)
    const newGhosts: Ghost[] = []
    const newFx: FxEvent[] = []

    for (const mover of movers) {
      const old = byId.get(mover.id)!
      // A queued plan still departs from where that plan was going to land.
      const existing = director.plans.get(mover.id)
      const logical = existing ? existing.to.clone() : coords(old.square)
      let from = logical.clone()
      if (!existing) {
        const vis = director.pos.get(mover.id)
        if (vis && vis.distanceTo(logical) < CELL_SIZE * 1.25) from = vis.clone()
      }
      if (existing) t0 = Math.max(t0, planEnd(existing))
      const to = coords(mover.square)
      const style = moveStyle(old.type, mover.heroId, mover.color, mover.awakened)
      const moverDesign = getHeroDesign(mover.heroId, mover.color, {
        awakened: mover.awakened,
      })
      const victim = captured.find((c) => c.color !== mover.color) ?? null

      const turnRate = (moverDesign.moveSpeedMul ?? 1) >= 4 ? 90 : 18

      if (!victim) {
        const approach = travelTime(style, from.distanceTo(to), moverDesign)
        const isMinato = moverDesign.extras.includes('minatoSuit')
        const plan: Plan = {
          start: t0,
          from,
          stop: to,
          to,
          style,
          approach,
          attackAt: -1,
          attackDur: 0,
          victim: null,
          waitUntil: approach,
          finish: 0,
          finishStyle: style,
          turnRate,
          snapAt: isMinato ? MINATO_SNAP : undefined,
        }
        director.plans.set(mover.id, plan)
        if (isMinato) {
          const kunai = minatoKunaiTravelFx(from, to, t0, approach, fxColor(mover.heroId, mover.color, mover.awakened))
          if (kunai) newFx.push(kunai)
        }
        t0 = planEnd(plan)
        continue
      }

      // Let the victim finish their own move/kill stage before they can die.
      const victimPlan = director.plans.get(victim.id) ?? null
      const victimDoneAt = victimPlan ? planEnd(victimPlan) : t0
      if (victimPlan) director.plans.delete(victim.id)
      t0 = Math.max(t0, victimDoneAt)

      const atk = attackFor(moverDesign)
      const vLogical = victimPlan ? victimPlan.to.clone() : coords(victim.square)
      let vStart = vLogical.clone()
      if (!victimPlan) {
        const vis = director.pos.get(victim.id)
        if (vis && vis.distanceTo(vLogical) < CELL_SIZE * 1.25) vStart = vis.clone()
      }
      const isMinato = moverDesign.extras.includes('minatoSuit')
      const duel = buildLethalDuel({
        start: from,
        fireHome: logical,
        vStart,
        vHome: vLogical,
        ranged: atk.ranged,
        style,
        seed: hashBout(mover.id, victim.id, old.square, victim.square),
        snapAt: isMinato ? MINATO_SNAP : undefined,
        signatureDur: atk.clip.dur,
        travel: (dist) => travelTime(style, dist, moverDesign),
      })
      const opening = duel.attacker[0]
      if (isMinato && opening?.kind === 'travel' && opening.style === 'teleport' && opening.dur > 0.08) {
        const kunai = minatoKunaiTravelFx(
          opening.from,
          opening.to,
          t0 + opening.t,
          opening.dur,
          fxColor(mover.heroId, mover.color, mover.awakened),
        )
        if (kunai) newFx.push(kunai)
      }
      const attackAt = duel.attackAt
      const stop = duel.stop
      const vPos = duel.killPos
      const dir = new THREE.Vector2().subVectors(vPos, stop)
      if (dir.lengthSq() > 1e-6) dir.normalize()
      else dir.set(0, 1)
      const hitAt = t0 + attackAt + atk.hit
      const vDesign = getHeroDesign(victim.heroId, victim.color, {
        awakened: victim.awakened,
      })
      const vanishAt = hitAt + deathDuration(vDesign, atk.dmg) + 0.35
      const goneAt = vanishAt + RETRIEVAL_DUR
      const waitUntil = Math.max(attackAt + atk.clip.dur, goneAt + 0.05 - t0)
      const finishStyle: MoveStyle = style === 'fly' ? 'fly' : atk.ranged ? style : 'walk'
      const finish = travelTime(finishStyle, stop.distanceTo(to), moverDesign)

      const plan: Plan = {
        start: t0,
        from,
        stop,
        to,
        style,
        approach: 0,
        attackAt,
        attackDur: atk.clip.dur,
        victim: vPos,
        waitUntil,
        finish,
        snapAt: isMinato ? MINATO_SNAP : undefined,
        finishStyle,
        turnRate,
        beats: duel.attacker,
        beatsEnd: attackAt,
      }
      director.plans.set(mover.id, plan)

      const lethal = atk.hits[atk.hits.length - 1]
      newGhosts.push({
        piece: victim,
        pos: vPos,
        origin: vStart,
        attacker: stop,
        hitAt,
        vanishAt,
        goneAt,
        hurts: atk.hits.slice(0, -1).map((h) => ({ at: t0 + attackAt + h.t, zone: h.zone, hold: h.hold })),
        dmg: atk.dmg,
        zone: lethal?.zone ?? 'mid',
        sever: atk.sever,
        carry: victimPlan,
        beats: duel.victim,
        duelStart: t0,
        duelUntil: t0 + attackAt,
      })

      // Signature effect. Duel taps are the non-lethal exchanges before it.
      const { c1, c2 } = fxColor(mover.heroId, mover.color, mover.awakened)
      const lifted = (x: number, z: number, y: number) => y + walkY(x, z)
      for (const tap of duel.taps) {
        newFx.push({
          id: fxId++,
          kind: 'hit',
          start: t0 + tap.t,
          travel: 0,
          dur: 0.32,
          from: new THREE.Vector3(tap.from.x, lifted(tap.from.x, tap.from.y, ZONE_Y[tap.zone] * UNIT_SCALE * 0.9), tap.from.y),
          to: new THREE.Vector3(tap.at.x, lifted(tap.at.x, tap.at.y, ZONE_Y[tap.zone] * UNIT_SCALE), tap.at.y),
          color: '#fff1c4',
          color2: c1,
          size: UNIT_SCALE * 0.32,
        })
      }
      const up = UNIT_SCALE * 0.78
      const fwd = new THREE.Vector3(dir.x, 0, dir.y)
      const src = new THREE.Vector3(stop.x, lifted(stop.x, stop.y, up), stop.y).addScaledVector(fwd, UNIT_SCALE * 0.35)
      const dst = new THREE.Vector3(vPos.x, lifted(vPos.x, vPos.y, up * 0.95), vPos.y)
      // Flash projectile (e.g. Minato kunai) before the signature lands.
      if (atk.throwFx) {
        newFx.push({
          id: fxId++,
          kind: atk.throwFx.kind,
          start: t0 + attackAt + atk.throwFx.at,
          travel: atk.throwFx.travel,
          dur: 0.28,
          from: src.clone(),
          to: dst.clone(),
          color: c1,
          color2: c2,
          size: UNIT_SCALE * 0.5,
        })
      }
      const rasengan = atk.fx === 'rasengan'
      const babylon = atk.fx === 'babylon'
      const portal = atk.fx === 'portal'
      const inferno = atk.fx === 'inferno'
      const megaShock = atk.fx === 'megaShockwave'
      const airShock = atk.fx === 'airShockwave'
      const fxFrom = rasengan
        ? new THREE.Vector3(vPos.x, lifted(vPos.x, vPos.y, up * 1.85), vPos.y)
        : src
      const fxTo = rasengan
        ? new THREE.Vector3(vPos.x, lifted(vPos.x, vPos.y, up * 0.85), vPos.y)
        : inferno
          ? new THREE.Vector3(vPos.x, lifted(vPos.x, vPos.y, up * 0.35), vPos.y)
          : dst
      const sakura = atk.fx === 'sakura'
      newFx.push({
        id: fxId++,
        kind: atk.fx,
        start:
          t0 +
          attackAt +
          (atk.ranged || babylon || portal
            ? atk.release
            : rasengan
              ? atk.fxAt - 0.16
              : atk.fxAt),
        travel:
          atk.ranged || babylon
            ? Math.max(0, atk.hit - atk.release)
            : portal
              ? Math.max(0, atk.fxAt - atk.release)
              : rasengan
                ? 0.16
                : 0,
        dur:
          atk.fx === 'beam' || atk.fx === 'darkBeam' || atk.fx === 'murasaki' || atk.fx === 'percentBlast'
            ? atk.fx === 'murasaki' || atk.fx === 'percentBlast'
              ? 0.75
              : 0.55
            : atk.fx === 'voltBarrage'
              ? 0.95
              : atk.fx === 'rasengan'
                ? 0.75
                : inferno || megaShock
                  ? 1.35
                  : portal
                    ? Math.max(0.7, atk.hit - atk.fxAt + 0.2)
                    : sakura || babylon
                      ? 0.95
                      : airShock
                        ? 0.75
                        : 0.6,
        from: fxFrom,
        to: fxTo,
        color: sakura ? '#ff8ec8' : babylon ? '#f0d050' : inferno ? '#ff6a18' : c1,
        color2: sakura ? '#ff4aa0' : babylon ? '#ffe060' : inferno ? '#ffd24a' : c2,
        size:
          UNIT_SCALE *
          (moverDesign.attack === 'emberFlick'
            ? 0.32
            : moverDesign.attack === 'cruelSun'
              ? 1.85
              : rasengan
                ? 0.62
                : inferno
                  ? 1.35
                  : megaShock
                    ? 1.25
                    : sakura || babylon
                      ? 0.68
                      : airShock
                        ? 0.7
                        : 0.55),
      })

      // Small impact for every punch/kick of the combo the signature fx doesn't cover.
      if (!atk.ranged) {
        for (const h of atk.hits) {
          if (Math.abs(h.t - atk.fxAt) < 0.06) continue
          const at = vPos.clone().addScaledVector(dir, -UNIT_SCALE * 0.12)
          newFx.push({
            id: fxId++,
            kind: 'hit',
            start: t0 + attackAt + h.t,
            travel: 0,
            dur: 0.4,
            from: src,
            to: new THREE.Vector3(at.x, lifted(at.x, at.y, ZONE_Y[h.zone] * UNIT_SCALE), at.y),
            color: '#fff1c4',
            color2: c1,
            size: UNIT_SCALE * 0.4,
          })
        }
      }

      t0 = planEnd(plan)
    }

    publishFreeAt(t0)

    if (newGhosts.length) setGhosts((g) => [...g, ...newGhosts])
    if (newFx.length) setFx((f) => [...f, ...newFx])
  }, [pieces, director, boardFreeAtRef])

  // Check → bodyguard body-flickers in, sword drawn, facing the threat.
  useLayoutEffect(() => {
    if (!checkedKing) {
      // Check cleared — flicker out any living guards that aren't mid-fight.
      const t = Math.max(now(), director.freeAt)
      const prev = protectorsRef.current
      const leavingIds = new Set(
        prev
          .filter((p) => p.leaveAt === null && p.fightAt === null && p.deathAt === null)
          .map((p) => p.id),
      )
      if (leavingIds.size) {
        const leaving = prev.filter((p) => leavingIds.has(p.id))
        commitProtectors(
          prev.map((p) =>
            leavingIds.has(p.id)
              ? { ...p, leaveAt: t, goneAt: t + FLICKER_OUT + 0.05 }
              : p,
          ),
        )
        setFx((f) => [
          ...f,
          ...leaving.map((p) => protectorFlickerFx(p.at, t, false, fxId++)),
        ])
        publishFreeAt(t + FLICKER_OUT + 0.1)
      }
      guardKey.current = null
      return
    }

    const king = pieces.find((p) => p.square === checkedKing && p.type === 'k')
    if (!king) return
    const prot = protectorForKing(king.heroId)
    if (!prot) return

    const key = `${king.id}:${checkedKing}:${checkerSquare ?? ''}`
    if (guardKey.current === key) return
    guardKey.current = key

    const threatSq = checkerSquare ?? checkedKing
    const kingPos = coords(checkedKing)
    const threatPos = coords(threatSq)
    const at = protectorStand(kingPos, threatPos)
    const start = Math.max(now(), director.freeAt) + 0.06

    const spawn: ProtectorSpawn = {
      id: fxId++,
      design: prot.design,
      at: at.clone(),
      face: threatPos.clone(),
      start,
      seed: hashBout(prot.id, king.id) % 1000,
      leaveAt: null,
      fightAt: null,
      beats: [],
      deathAt: null,
      goneAt: start + 600,
    }

    commitProtectors((list) => {
      const keepFighting = list.filter(
        (p) => p.fightAt !== null && now() < p.goneAt,
      )
      return [...keepFighting, spawn]
    })
    setFx((f) => [...f, protectorFlickerFx(at, start, true, fxId++)])
    publishFreeAt(start + FLICKER_IN + 0.05)
  }, [checkedKing, checkerSquare, pieces, director, boardFreeAtRef])

  // Checkmate: king + protector fight the mating piece; protector dies, then king.
  useLayoutEffect(() => {
    if (!defeatedKing) {
      setKingDeathAt(null)
      mateKey.current = null
      return
    }
    const king = pieces.find((p) => p.square === defeatedKing && p.type === 'k')
    if (!king) return
    const key = `${king.id}:${defeatedKing}`
    if (mateKey.current === key) return
    mateKey.current = key

    const protDef = protectorForKing(king.heroId)
    const threatSq = checkerSquare ?? defeatedKing
    const attacker = pieces.find((p) => p.square === threatSq) ?? null
    const kingPos = coords(defeatedKing)
    const threatPos = coords(threatSq)
    const stand = protectorStand(kingPos, threatPos)
    const fightStart = Math.max(now(), director.freeAt) + 0.12

    if (!protDef) {
      // No bodyguard — fall back to a plain king death.
      const dur = deathDuration(getHeroDesign(king.heroId, king.color))
      setKingDeathAt(fightStart)
      publishFreeAt(fightStart + dur + 0.35)
      return
    }

    const duel = buildProtectorDuel({
      attackerStart: threatPos.clone(),
      protectorStart: new THREE.Vector2(stand.x, stand.z),
      kingHome: kingPos.clone(),
      seed: hashBout(king.id, threatSq, 'mate'),
    })
    const protDie = deathDuration(protDef.design, 'slash')
    const kingDie = deathDuration(getHeroDesign(king.heroId, king.color))
    const protDeathAt = fightStart + duel.protectorHitAt
    const kingDeath = fightStart + duel.kingHitAt

    commitProtectors((list) => {
      const active = list.find((p) => p.deathAt === null && p.leaveAt === null)
      if (active) {
        return list.map((p) =>
          p.id === active.id
            ? {
                ...p,
                face: threatPos.clone(),
                at: stand.clone(),
                fightAt: fightStart,
                beats: duel.protector,
                deathAt: protDeathAt,
                goneAt: protDeathAt + protDie + 0.45,
                leaveAt: null,
              }
            : p,
        )
      }
      return [
        ...list,
        {
          id: fxId++,
          design: protDef.design,
          at: stand.clone(),
          face: threatPos.clone(),
          start: fightStart - FLICKER_IN,
          seed: hashBout(protDef.id, king.id) % 1000,
          leaveAt: null,
          fightAt: fightStart,
          beats: duel.protector,
          deathAt: protDeathAt,
          goneAt: protDeathAt + protDie + 0.45,
        },
      ]
    })

    // Inject skirmish beats onto the mating piece and the king.
    if (attacker) {
      const from = threatPos.clone()
      director.plans.set(attacker.id, {
        start: fightStart,
        from,
        stop: from.clone(),
        to: from.clone(),
        style: 'walk',
        approach: 0,
        attackAt: -1,
        attackDur: 0,
        victim: kingPos.clone(),
        waitUntil: duel.kingHitAt + 0.05,
        finish: 0,
        finishStyle: 'walk',
        beats: duel.attacker,
        beatsEnd: duel.kingHitAt,
      })
    }
    director.plans.set(king.id, {
      start: fightStart,
      from: kingPos.clone(),
      stop: kingPos.clone(),
      to: kingPos.clone(),
      style: 'walk',
      approach: 0,
      attackAt: -1,
      attackDur: 0,
      victim: threatPos.clone(),
      waitUntil: duel.kingHitAt,
      finish: 0,
      finishStyle: 'walk',
      beats: duel.king,
      beatsEnd: duel.kingHitAt,
    })

    // Hit sparks during the last stand.
    const newFx: FxEvent[] = []
    for (const tap of duel.taps) {
      newFx.push({
        id: fxId++,
        kind: 'hit',
        start: fightStart + tap.t,
        travel: 0,
        dur: 0.35,
        from: new THREE.Vector3(tap.from.x, UNIT_SCALE * 0.7, tap.from.y),
        to: new THREE.Vector3(tap.at.x, UNIT_SCALE * 0.7, tap.at.y),
        color: '#fff1c4',
        color2: '#ff4d6d',
        size: UNIT_SCALE * 0.4,
      })
    }
    if (newFx.length) setFx((f) => [...f, ...newFx])

    setKingDeathAt(kingDeath)
    publishFreeAt(kingDeath + kingDie + 0.4)
  }, [defeatedKing, checkerSquare, pieces, director, boardFreeAtRef])

  const onCorpse = (g: Ghost, at: THREE.Vector3, bled: boolean) => {
    const t = Math.max(now(), g.vanishAt)
    const floorY = walkY(at.x, at.z)
    // Anchor flicker at the feet; size = standing character height.
    const feet = new THREE.Vector3(at.x, floorY, at.z)
    const charH = PERSON_HEIGHT
    const seed = Math.floor(g.hitAt * 1000 + g.piece.id.length * 17) % 100000
    const evs: FxEvent[] = []
    // Arrival body-flicker streaks — one burst per jonin around the corpse.
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + seed * 0.01
      const rad = UNIT_SCALE * 0.42
      const p = new THREE.Vector3(at.x + Math.sin(ang) * rad, floorY, at.z + Math.cos(ang) * rad)
      evs.push({
        id: fxId++,
        kind: 'bodyFlicker',
        start: t + i * 0.05,
        travel: 0,
        dur: 0.28,
        from: p,
        to: p,
        color: '#1a2848',
        color2: '#6a7a3e',
        size: charH,
      })
    }
    // Exit flicker — corpse + team leave together.
    evs.push({
      id: fxId++,
      kind: 'bodyFlicker',
      start: t + RETRIEVAL_OUT_AT,
      travel: 0,
      dur: RETRIEVAL_DUR - RETRIEVAL_OUT_AT,
      from: feet,
      to: feet,
      color: '#1a2848',
      color2: '#8a0a14',
      size: charH,
    })
    // The ragdoll's own pools vanish with it; leave one on the tile for a while.
    if (bled) {
      evs.push({
        id: fxId++,
        kind: 'bloodPool',
        start: t + RETRIEVAL_OUT_AT + 0.1,
        travel: 0,
        dur: 6,
        from: new THREE.Vector3(at.x, floorY + 0.02, at.z),
        to: new THREE.Vector3(at.x, floorY + 0.02, at.z),
        color: '#4e030a',
        color2: '#4e030a',
        size: UNIT_SCALE * 0.15,
      })
    }
    setRetrievals((r) => [...r, { id: fxId++, at: at.clone(), start: t, seed }])
    setFx((f) => [...f, ...evs])
  }

  // Drop ghosts, retrievals, protectors, and fx once they have played out.
  useEffect(() => {
    if (!ghosts.length && !fx.length && !retrievals.length && !protectors.length) return
    const id = window.setInterval(() => {
      const t = now()
      setGhosts((g) => {
        const keep = g.filter((x) => t < x.goneAt + 0.15)
        return keep.length === g.length ? g : keep
      })
      setRetrievals((r) => {
        const keep = r.filter((x) => t < x.start + RETRIEVAL_DUR + 0.2)
        return keep.length === r.length ? r : keep
      })
      commitProtectors((p) => {
        const keep = p.filter((x) => t < x.goneAt + 0.15)
        return keep.length === p.length ? p : keep
      })
      setFx((f) => {
        const keep = f.filter((x) => t < x.start + x.travel + x.dur + 0.1)
        return keep.length === f.length ? f : keep
      })
    }, 250)
    return () => window.clearInterval(id)
  }, [ghosts.length, fx.length, retrievals.length, protectors.length])

  return (
    <group>
      {pieces.map((piece) => (
        <BoardFighter
          key={piece.id}
          piece={piece}
          selected={selected === piece.square}
          teamGlow={showTeamGlow}
          defeatedAt={
            defeatedKing === piece.square && piece.type === 'k' ? kingDeathAt : null
          }
          ghost={null}
          director={director}
          onPieceClick={onPieceClick}
        />
      ))}
      {ghosts.map((g) => (
        <BoardFighter
          key={`ghost-${g.piece.id}-${g.hitAt}`}
          piece={g.piece}
          selected={false}
          teamGlow={false}
          defeatedAt={null}
          ghost={g}
          director={director}
          onPieceClick={onPieceClick}
          onCorpse={onCorpse}
        />
      ))}
      {protectors.map((p) => (
        <KingProtectorActor key={p.id} event={p} />
      ))}
      {retrievals.map((r) => (
        <BodyRetrieval key={r.id} event={r} />
      ))}
      <FxLayer events={fx} />
    </group>
  )
}
