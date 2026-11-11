import * as THREE from 'three'
import { CELL_SIZE } from '../../game/types'
import {
  EXCHANGE_ORDER,
  exchangeStats,
  type AnimInput,
  type ExchangeName,
  type ExchangeRole,
  type HitZone,
  type MoveStyle,
  type SkirmishMove,
} from './anims'

/**
 * Two fighters sharing one clock.
 * Lethal captures trade blows and chase before the signature kill.
 */

export interface BoutBeat {
  t: number
  dur: number
  kind: 'travel' | 'skirmish' | 'hurt' | 'guard'
  from: THREE.Vector2
  to: THREE.Vector2
  face: THREE.Vector2
  style: MoveStyle
  move: SkirmishMove
  zone: HitZone
  n: number
  snapAt?: number
  /** Paired phrase. Both fighters play this for the whole beat. */
  exchange?: ExchangeName
  role?: ExchangeRole
}

export interface DuelTap {
  t: number
  zone: HitZone
  at: THREE.Vector2
  from: THREE.Vector2
}

export interface LethalDuel {
  attacker: BoutBeat[]
  victim: BoutBeat[]
  /** Seconds from the start of the plan when the signature clip begins. */
  attackAt: number
  stop: THREE.Vector2
  killPos: THREE.Vector2
  taps: DuelTap[]
}

export interface BeatSample {
  anim: AnimInput
  yaw: number
  y: number
  speed: number
  yawRate: number
}

const _delta = new THREE.Vector2()

/** Step through the phrase list so back-to-back rallies are different moves. */
function phrase(seed: number, i: number): ExchangeName {
  return EXCHANGE_ORDER[(seed + i * 5) % EXCHANGE_ORDER.length]!
}

function beat(
  kind: BoutBeat['kind'],
  t: number,
  dur: number,
  from: THREE.Vector2,
  to: THREE.Vector2,
  face: THREE.Vector2,
  style: MoveStyle,
  move: SkirmishMove,
  zone: HitZone,
  n: number,
  snapAt?: number,
): BoutBeat {
  return { kind, t, dur, from, to, face, style, move, zone, n, snapAt }
}

class Lane {
  beats: BoutBeat[] = []
  pos: THREE.Vector2

  constructor(home: THREE.Vector2) {
    this.pos = home.clone()
  }

  travel(to: THREE.Vector2, dur: number, t: number, style: MoveStyle, snapAt?: number) {
    const from = this.pos.clone()
    const dest = to.clone()
    this.beats.push(beat('travel', t, dur, from, dest, dest.clone(), style, 'jab', 'mid', 1, snapAt))
    this.pos.copy(dest)
  }

  pose(
    kind: 'skirmish' | 'hurt' | 'guard',
    dur: number,
    t: number,
    face: THREE.Vector2,
    move: SkirmishMove,
    zone: HitZone,
    n: number,
  ) {
    const at = this.pos.clone()
    this.beats.push(beat(kind, t, dur, at, at.clone(), face.clone(), 'run', move, zone, n))
  }

  /** One side of a paired phrase. Position stays put; the clip carries the choreography. */
  exchange(name: ExchangeName, role: ExchangeRole, dur: number, t: number, face: THREE.Vector2) {
    const at = this.pos.clone()
    const b = beat('skirmish', t, dur, at, at.clone(), face.clone(), 'run', 'jab', 'mid', 1)
    b.exchange = name
    b.role = role
    this.beats.push(b)
  }
}

function assertCovered(beats: BoutBeat[], dur: number, label: string) {
  if (!import.meta.env.DEV) return
  if (!beats.length) throw new Error(`bout ${label} has no beats`)
  let cursor = 0
  for (const b of beats) {
    if (b.t > cursor + 0.06) throw new Error(`bout ${label} gap at ${cursor.toFixed(2)}`)
    cursor = Math.max(cursor, b.t + b.dur)
  }
  if (Math.abs(cursor - dur) > 0.08) {
    throw new Error(`bout ${label} ends at ${cursor.toFixed(2)}, expected ${dur.toFixed(2)}`)
  }
}

function burst(dist: number): number {
  if (dist < 0.08) return 0.18
  return Math.max(0.26, Math.min(0.62, dist / (CELL_SIZE * 3.05)))
}

interface Clock {
  t: number
}

function stare(lanes: Lane[], faces: THREE.Vector2[], dur: number, clock: Clock) {
  for (let i = 0; i < lanes.length; i++) {
    lanes[i]!.pose('guard', dur, clock.t, faces[i]!, 'jab', 'mid', 1)
  }
  clock.t += dur
}

function moveSpeed(style: MoveStyle): number {
  if (style === 'walk') return 0.35
  if (style === 'vector') return 1.25
  if (style === 'fly') return 0.85
  if (style === 'teleport') return 1.4
  return 1
}

/** World pose for one fighter at `pt` seconds into a shared script. Writes position into `out`. */
export function sampleBeat(beats: BoutBeat[], pt: number, out: THREE.Vector2): BeatSample {
  if (!beats.length) {
    return { anim: { kind: 'ready', t: pt }, yaw: 0, y: 0, speed: 0, yawRate: 8 }
  }
  let b = beats[0]!
  for (let i = 1; i < beats.length; i++) {
    if (beats[i]!.t <= pt + 1e-4) b = beats[i]!
    else break
  }
  const local = Math.max(0, pt - b.t)
  const dur = Math.max(b.dur, 1e-4)
  if (b.kind === 'travel') {
    const p = Math.min(1, local / dur)
    const style = b.style
    if (style === 'teleport') out.copy(p < (b.snapAt ?? 0.5) ? b.from : b.to)
    else {
      const k = style === 'leap' ? p : THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85
      out.lerpVectors(b.from, b.to, k)
    }
    _delta.subVectors(b.to, b.from)
    const dist = _delta.length()
    let yaw = 0
    if (dist > 1e-4) yaw = Math.atan2(_delta.x, _delta.y)
    else {
      _delta.subVectors(b.face, out)
      if (_delta.lengthSq() > 1e-6) yaw = Math.atan2(_delta.x, _delta.y)
    }
    let y = 0
    if (style === 'leap') y = Math.sin(p * Math.PI) * UNIT_SCALE * (0.5 + (dist / CELL_SIZE) * 0.22)
    else if (style === 'fly') {
      const lift = UNIT_SCALE * 0.42
      y =
        lift *
        (p < 0.12
          ? THREE.MathUtils.smootherstep(p / 0.12, 0, 1)
          : p > 0.88
            ? 1 - THREE.MathUtils.smootherstep((p - 0.88) / 0.12, 0, 1)
            : 1)
    }
    return {
      anim: { kind: 'move', style, t: local, p, dist: (p * dist) / UNIT_SCALE },
      yaw,
      y,
      speed: moveSpeed(style),
      yawRate: style === 'teleport' ? 90 : 18,
    }
  }
  out.copy(b.to)
  _delta.subVectors(b.face, b.to)
  const yaw = _delta.lengthSq() > 1e-6 ? Math.atan2(_delta.x, _delta.y) : 0
  const anim: AnimInput =
    b.kind === 'skirmish'
      ? b.exchange && b.role
        ? { kind: 'skirmish', t: local, move: b.move, exchange: b.exchange, role: b.role }
        : { kind: 'skirmish', t: local, move: b.move }
      : b.kind === 'hurt'
        ? { kind: 'hurt', t: local, zone: b.zone, n: b.n }
        : { kind: 'ready', t: local }
  return {
    anim,
    yaw,
    y: 0,
    speed: b.kind === 'skirmish' ? (b.role === 'answer' ? 0.35 : 0.6) : b.kind === 'hurt' ? 0.2 : 0,
    yawRate: b.kind === 'guard' ? 12 : 24,
  }
}

const UNIT_SCALE = CELL_SIZE * 0.252

export function buildLethalDuel(opts: {
  start: THREE.Vector2
  fireHome: THREE.Vector2
  vStart: THREE.Vector2
  vHome: THREE.Vector2
  ranged: boolean
  style: MoveStyle
  seed: number
  snapAt?: number
  signatureDur: number
  travel: (dist: number) => number
}): LethalDuel {
  const A = new Lane(opts.start)
  const V = new Lane(opts.vStart)
  const taps: DuelTap[] = []
  const clock: Clock = { t: 0 }
  const chase: MoveStyle = opts.style === 'fly' ? 'fly' : 'dash'

  const rally = (lead: Lane, answer: Lane, i: number) => {
    const name = phrase(opts.seed, i)
    const st = exchangeStats(name)
    lead.exchange(name, 'lead', st.dur, clock.t, answer.pos)
    answer.exchange(name, 'answer', st.dur, clock.t, lead.pos)
    for (const hit of st.contacts) {
      const src = hit.who === 'lead' ? lead : answer
      const dst = hit.who === 'lead' ? answer : lead
      taps.push({
        t: clock.t + hit.t,
        zone: hit.zone,
        at: dst.pos.clone(),
        from: src.pos.clone(),
      })
    }
    clock.t += st.dur
  }
  const sync = (toA: THREE.Vector2, toB: THREE.Vector2) => {
    const d = Math.max(A.pos.distanceTo(toA), V.pos.distanceTo(toB))
    const dur = Math.max(0.22, Math.min(0.58, burst(d)))
    A.travel(toA, dur, clock.t, chase)
    V.travel(toB, dur, clock.t, 'dash')
    clock.t += dur
  }
  const beside = (target: THREE.Vector2, fromPos: THREE.Vector2, aim: THREE.Vector2) => {
    const d = new THREE.Vector2().subVectors(fromPos, target)
    if (d.lengthSq() < 1e-4) d.copy(aim).multiplyScalar(-1)
    else d.normalize()
    return target.clone().addScaledVector(d, CELL_SIZE * 0.4)
  }

  if (opts.ranged) {
    const toward = new THREE.Vector2().subVectors(opts.fireHome, opts.vStart)
    const td = toward.length()
    if (td > 1e-3) toward.multiplyScalar(1 / td)
    else toward.set(0, 1)
    const perp = new THREE.Vector2(-toward.y, toward.x).multiplyScalar(opts.seed % 2 === 0 ? 1 : -1)
    const rush = Math.min(Math.max(0, td - CELL_SIZE * 0.5), CELL_SIZE * 1.15)
    const vicTarget = opts.vStart.clone().addScaledVector(toward, rush)
    const side = opts.fireHome.clone().addScaledVector(perp, CELL_SIZE * 0.28)
    const charge = Math.max(0.36, Math.min(0.72, (rush + CELL_SIZE * 0.25) / (CELL_SIZE * 2.5)))
    A.travel(side, charge, 0, opts.style === 'fly' ? 'fly' : 'dash')
    V.travel(vicTarget, charge, 0, 'run')
    clock.t = charge
    rally(V, A, 1)
    if (opts.signatureDur < 2.15) rally(A, V, 4)
    const back = Math.max(0.32, Math.min(0.62, A.pos.distanceTo(opts.fireHome) / (CELL_SIZE * 2.6) + 0.2))
    A.travel(opts.fireHome, back, clock.t, opts.style === 'fly' ? 'fly' : 'dash')
    V.travel(opts.vHome, back, clock.t, 'run')
    clock.t += back
    stare([A, V], [opts.vHome, opts.fireHome], 0.18, clock)
    assertCovered(A.beats, clock.t, 'ranged-atk')
    assertCovered(V.beats, clock.t, 'ranged-vic')
    return {
      attacker: A.beats,
      victim: V.beats,
      attackAt: clock.t,
      stop: opts.fireHome.clone(),
      killPos: opts.vHome.clone(),
      taps,
    }
  }

  const aim = new THREE.Vector2().subVectors(opts.vHome, opts.start)
  const len = aim.length()
  if (len > 1e-4) aim.multiplyScalar(1 / len)
  else aim.set(0, 1)
  const perp = new THREE.Vector2(-aim.y, aim.x).multiplyScalar(opts.seed % 2 === 0 ? 1 : -1)
  const meetV = opts.vHome.clone().addScaledVector(aim, -CELL_SIZE * 0.08)
  const meetA = opts.vHome.clone().addScaledVector(aim, -CELL_SIZE * 0.4)
  const distA = opts.start.distanceTo(meetA)
  const distV = opts.vStart.distanceTo(meetV)
  let opening = distA < 0.08 ? 0 : distA < CELL_SIZE * 0.22 ? 0.24 : opts.travel(distA)
  if (opening < 0.2 && distV > 0.15) opening = 0.28
  if (opening > 0.04) {
    A.travel(meetA, opening, 0, opts.style, opts.snapAt)
    const step = Math.min(0.36, Math.max(0.18, opening * 0.42))
    const hold = opening - step
    if (hold > 0.04) V.pose('guard', hold, 0, opts.start, 'jab', 'mid', 1)
    V.travel(meetV, hold > 0.04 ? step : opening, hold > 0.04 ? hold : 0, 'dash')
    clock.t = opening
  } else {
    A.pos.copy(meetA)
    V.pos.copy(meetV)
  }

  const long = opts.signatureDur > 2.15
  const pattern = long ? 1 : opts.seed % 3
  const corner = (side: number) => {
    const off = perp.clone().multiplyScalar(side * CELL_SIZE * 0.34)
    const m = off.length()
    if (m > CELL_SIZE * 0.4) off.multiplyScalar((CELL_SIZE * 0.4) / m)
    return opts.vHome.clone().add(off)
  }

  // Three shapes, two phrases each (one phrase when the finisher is already long).
  // 0 pocket: both combos in place. 1 angle: circle right between them.
  // 2 counter: the defender opens, then they circle the other way.
  const attackerOpens = pattern !== 2
  rally(attackerOpens ? A : V, attackerOpens ? V : A, pattern)
  if (pattern !== 0) {
    const c1 = corner(pattern === 1 ? 1 : -1)
    sync(beside(c1, A.pos, aim), c1)
  }
  if (!long) rally(attackerOpens ? V : A, attackerOpens ? A : V, pattern + 3)

  const killPos = V.pos.clone()
  const stop = beside(killPos, A.pos, aim)
  sync(stop, killPos)
  stare([A, V], [killPos, stop], 0.2, clock)
  assertCovered(A.beats, clock.t, 'melee-atk')
  assertCovered(V.beats, clock.t, 'melee-vic')
  return {
    attacker: A.beats,
    victim: V.beats,
    attackAt: clock.t,
    stop: A.pos.clone(),
    killPos: V.pos.clone(),
    taps,
  }
}

/**
 * Checkmate last stand: mating piece vs king bodyguard (+ king assists).
 * Protector dies first; king death is scheduled after `kingHitAt`.
 */
export interface ProtectorDuel {
  attacker: BoutBeat[]
  protector: BoutBeat[]
  king: BoutBeat[]
  /** Seconds from fight start when the protector's death begins. */
  protectorHitAt: number
  /** Seconds from fight start when the king's death begins. */
  kingHitAt: number
  taps: DuelTap[]
}

export function buildProtectorDuel(opts: {
  attackerStart: THREE.Vector2
  protectorStart: THREE.Vector2
  kingHome: THREE.Vector2
  seed: number
}): ProtectorDuel {
  const A = new Lane(opts.attackerStart)
  const P = new Lane(opts.protectorStart)
  const K = new Lane(opts.kingHome)
  const taps: DuelTap[] = []
  const clock: Clock = { t: 0 }

  const rally = (lead: Lane, answer: Lane, i: number) => {
    const name = phrase(opts.seed, i)
    const st = exchangeStats(name)
    lead.exchange(name, 'lead', st.dur, clock.t, answer.pos)
    answer.exchange(name, 'answer', st.dur, clock.t, lead.pos)
    for (const hit of st.contacts) {
      const src = hit.who === 'lead' ? lead : answer
      const dst = hit.who === 'lead' ? answer : lead
      taps.push({
        t: clock.t + hit.t,
        zone: hit.zone,
        at: dst.pos.clone(),
        from: src.pos.clone(),
      })
    }
    clock.t += st.dur
  }

  // Face off — king holds guard while the protector steps in.
  stare([A, P, K], [P.pos, A.pos, A.pos], 0.22, clock)
  {
    // King stays on guard while protector and attacker trade (no timeline gaps).
    const t0 = clock.t
    rally(P, A, 1)
    K.pose('guard', clock.t - t0, t0, A.pos, 'jab', 'mid', 1)
  }
  // King joins with a short answer exchange while the protector presses.
  {
    const name = phrase(opts.seed, 4)
    const st = exchangeStats(name)
    P.exchange(name, 'lead', st.dur, clock.t, A.pos)
    A.exchange(name, 'answer', st.dur, clock.t, P.pos)
    K.exchange(name, 'answer', st.dur, clock.t, A.pos)
    for (const hit of st.contacts) {
      const src = hit.who === 'lead' ? P : A
      const dst = hit.who === 'lead' ? A : P
      taps.push({
        t: clock.t + hit.t,
        zone: hit.zone,
        at: dst.pos.clone(),
        from: src.pos.clone(),
      })
    }
    clock.t += st.dur
  }
  {
    const t0 = clock.t
    rally(A, P, 7)
    K.pose('guard', clock.t - t0, t0, A.pos, 'jab', 'mid', 1)
  }

  const protectorHitAt = clock.t
  // Finishing blows on the bodyguard — king still holding while they fall.
  A.pose('skirmish', 0.55, clock.t, P.pos, 'cross', 'high', 1)
  P.pose('hurt', 0.55, clock.t, A.pos, 'jab', 'mid', 2)
  K.pose('guard', 0.55, clock.t, A.pos, 'jab', 'mid', 1)
  clock.t += 0.55

  // After the guardian drops, the king presses the fight alone — then falls.
  stare([A, K], [K.pos, A.pos], 0.2, clock)
  rally(K, A, 11)
  rally(A, K, 14)
  stare([A, K], [K.pos, A.pos], 0.22, clock)
  const kingHitAt = clock.t

  assertCovered(A.beats, clock.t, 'prot-atk')
  assertCovered(P.beats, protectorHitAt + 0.55, 'prot-guard')
  assertCovered(K.beats, clock.t, 'prot-king')
  return {
    attacker: A.beats,
    protector: P.beats,
    king: K.beats,
    protectorHitAt,
    kingHitAt,
    taps,
  }
}

function selfCheckBouts() {
  const travel = (d: number) => (d < 1e-3 ? 0 : Math.max(0.28, d / (CELL_SIZE * 2.6)))
  const a = new THREE.Vector2(0, 0)
  const b = new THREE.Vector2(CELL_SIZE, CELL_SIZE * 0.2)
  const out = new THREE.Vector2()
  for (const seed of [1, 2, 4, 9]) {
    for (const ranged of [false, true]) {
      const duel = buildLethalDuel({
        start: a,
        fireHome: a.clone(),
        vStart: b,
        vHome: b.clone(),
        ranged,
        style: seed % 2 ? 'run' : 'fly',
        seed,
        signatureDur: seed > 5 ? 2.8 : 1.1,
        travel,
      })
      sampleBeat(duel.attacker, 0, out)
      sampleBeat(duel.attacker, duel.attackAt * 0.5, out)
      sampleBeat(duel.victim, Math.max(0, duel.attackAt - 0.05), out)
      if (duel.attackAt < 0.4) throw new Error('lethal duel collapsed')
    }
    const pd = buildProtectorDuel({
      attackerStart: a,
      protectorStart: b,
      kingHome: new THREE.Vector2(CELL_SIZE * 0.4, -CELL_SIZE * 0.15),
      seed,
    })
    sampleBeat(pd.protector, 0, out)
    sampleBeat(pd.king, pd.kingHitAt * 0.5, out)
    if (pd.protectorHitAt < 0.5 || pd.kingHitAt <= pd.protectorHitAt) {
      throw new Error('protector duel timing collapsed')
    }
  }
}

if (import.meta.env.DEV) selfCheckBouts()
