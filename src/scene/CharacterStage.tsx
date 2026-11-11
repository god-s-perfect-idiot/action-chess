import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getHeroDesign, HERO_DESIGNS, type HeroDesign } from '../game/heroDesigns'
import { protectorForKing } from '../game/protectors'
import {
  attackFor,
  deathDuration,
  type AnimInput,
  type AttackDef,
  type DamageType,
  type HitZone,
  type MoveStyle,
} from './fighters/anims'
import { buildProtectorDuel, sampleBeat } from './fighters/bouts'
import { now } from './fighters/clock'
import { FxLayer, type FxEvent } from './fighters/Fx'
import { HeroFighter, type FighterApi } from './fighters/HeroFighter'
import { outlineUniforms } from './fighters/materials'

export type AnimMode = 'cycle' | 'idle' | 'run' | 'attack' | 'death' | 'check' | 'checkmate'

export const ANIM_MODES: AnimMode[] = ['cycle', 'idle', 'run', 'attack', 'death']
/** Extra preview modes shown on king character cards. */
export const KING_ANIM_MODES: AnimMode[] = ['check', 'checkmate']

/** Damage types the self-death preview cycles through. */
export const DAMAGE_TYPES: DamageType[] = ['beam', 'slash', 'pierce', 'blunt', 'burn', 'shock']

/** Local-units/sec so run cadence matches board travel feel. */
const RUN_DIST_RATE = 2.5
const RUN_LOOP = 1.2
/** One-way shuttle length so the Characters run preview travels A→B instead of in place. */
const RUN_PATH = 1.35
/** Sparring partner distance in front of the fighter (+Z): board melee stop / one square for ranged. */
const MELEE_Z = 0.66
const RANGED_Z = 1.6
const FX_SIZE = 0.55
const ZONE_Y: Record<HitZone, number> = { high: 0.98, mid: 0.75, low: 0.4 }

let fxSeq = 1

function locoOf(d: HeroDesign): MoveStyle {
  return d.locomotion ?? 'run'
}

type RunPreview = {
  anim: AnimInput
  x: number
  y: number
  z: number
  yaw: number
}

/** Seconds for one A→B leg at this hero's locomotion. */
function runOneWay(d: HeroDesign): number {
  const style = locoOf(d)
  if (style === 'leap') return RUN_LOOP
  if (style === 'vector') return 1.15
  if (style === 'teleport') return 0.95
  if (style === 'fly') return Math.max(0.55, RUN_PATH / (RUN_DIST_RATE * (d.moveSpeedMul ?? 1)))
  return Math.max(0.35, RUN_PATH / (RUN_DIST_RATE * (d.moveSpeedMul ?? 1)))
}

/**
 * Characters-page run preview: gait/clip plus world shuttle A→B→A along +Z
 * so footfall and facing read correctly (board travel does the same).
 */
function runPreview(d: HeroDesign, t: number): RunPreview {
  const style = locoOf(d)
  const oneWay = runOneWay(d)
  const cycle = oneWay * 2
  const u = ((t % cycle) + cycle) % cycle
  const going = u < oneWay
  const local = going ? u : u - oneWay
  const p = oneWay > 1e-6 ? Math.min(1, local / oneWay) : 1
  const from = going ? -RUN_PATH * 0.5 : RUN_PATH * 0.5
  const to = going ? RUN_PATH * 0.5 : -RUN_PATH * 0.5
  const yaw = going ? 0 : Math.PI

  let along = p
  let y = 0
  if (style === 'teleport') {
    // Hold on the departure pad, then snap onto arrival while invisible.
    along = p < 0.5 ? 0 : 1
  } else if (style === 'leap') {
    along = p
    y = Math.sin(p * Math.PI) * (0.5 + RUN_PATH * 0.12)
  } else if (style === 'fly') {
    along = THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85
    const lift = 0.42
    y =
      lift *
      (p < 0.12
        ? THREE.MathUtils.smootherstep(p / 0.12, 0, 1)
        : p > 0.88
          ? 1 - THREE.MathUtils.smootherstep((p - 0.88) / 0.12, 0, 1)
          : 1)
  } else {
    // Match board easing so gait isn't perfectly linear with world motion.
    along = THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85
  }

  const z = from + (to - from) * along
  const traveled = Math.abs(z - from)

  let anim: AnimInput
  if (style === 'leap' || style === 'vector' || style === 'teleport' || style === 'fly') {
    anim = { kind: 'move', style, t: style === 'vector' || style === 'fly' ? t : local, p, dist: traveled }
  } else {
    // Gait cycle keyed off distance covered so stride matches translation.
    const rate = RUN_DIST_RATE * (d.moveSpeedMul ?? 1)
    anim = { kind: 'move', style, t, p: 0, dist: t * rate }
  }

  return { anim, x: 0, y, z, yaw }
}

function applyMover(g: THREE.Group | null, preview: RunPreview | null) {
  if (!g) return
  if (!preview) {
    g.position.set(0, 0, 0)
    g.rotation.y = 0
    return
  }
  g.position.set(preview.x, preview.y, preview.z)
  g.rotation.y = preview.yaw
}

function fxColors(d: HeroDesign) {
  const p = d.palette
  const c1 = p.glow ?? p.accent
  return { c1, c2: p.accent === c1 ? p.hair : p.accent }
}

const victimZ = (atk: AttackDef) => (atk.ranged ? RANGED_Z : MELEE_Z)

function makeAttackFx(d: HeroDesign, attackAbsStart: number): FxEvent[] {
  const atk = attackFor(d)
  const { c1, c2 } = fxColors(d)
  const up = 0.78
  const vz = victimZ(atk)
  const from = new THREE.Vector3(0, up, 0.35)
  const to = new THREE.Vector3(0, up * 0.95, vz)
  const out: FxEvent[] = []
  if (atk.throwFx) {
    out.push({
      id: fxSeq++,
      kind: atk.throwFx.kind,
      start: attackAbsStart + atk.throwFx.at,
      travel: atk.throwFx.travel,
      dur: 0.28,
      from: from.clone(),
      to: to.clone(),
      color: c1,
      color2: c2,
      size: FX_SIZE * 0.9,
    })
  }
  const rasengan = atk.fx === 'rasengan'
  const sakura = atk.fx === 'sakura'
  const babylon = atk.fx === 'babylon'
  const portal = atk.fx === 'portal'
  const inferno = atk.fx === 'inferno'
  const megaShock = atk.fx === 'megaShockwave'
  const airShock = atk.fx === 'airShockwave'
  out.push({
    id: fxSeq++,
    kind: atk.fx,
    start:
      attackAbsStart +
      (atk.ranged || babylon || portal ? atk.release : rasengan ? atk.fxAt - 0.16 : atk.fxAt),
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
    from: rasengan ? new THREE.Vector3(0, up * 1.85, vz) : from,
    to: rasengan
      ? new THREE.Vector3(0, up * 0.85, vz)
      : inferno
        ? new THREE.Vector3(0, up * 0.35, vz)
        : to,
    color: sakura ? '#ff8ec8' : babylon ? '#f0d050' : inferno ? '#ff6a18' : c1,
    color2: sakura ? '#ff4aa0' : babylon ? '#ffe060' : inferno ? '#ffd24a' : c2,
    size:
      d.attack === 'emberFlick'
        ? FX_SIZE * 0.55
        : d.attack === 'cruelSun'
          ? FX_SIZE * 2.85
          : d.attack === 'percentBlast'
            ? FX_SIZE * 1.55
            : rasengan
              ? FX_SIZE * 1.12
              : inferno
                ? FX_SIZE * 2.15
                : megaShock
                  ? FX_SIZE * 2.0
                  : sakura || babylon
                    ? FX_SIZE * 1.2
                    : airShock
                      ? FX_SIZE * 1.25
                      : FX_SIZE,
  })
  if (!atk.ranged) {
    for (const h of atk.hits) {
      if (Math.abs(h.t - atk.fxAt) < 0.06) continue
      out.push({
        id: fxSeq++,
        kind: 'hit',
        start: attackAbsStart + h.t,
        travel: 0,
        dur: 0.4,
        from,
        to: new THREE.Vector3(0, ZONE_Y[h.zone], vz - 0.12),
        color: '#fff1c4',
        color2: c1,
        size: 0.4,
      })
    }
  }
  return out
}

/** What the sparring partner does `local` seconds into the attacker's attack. */
function victimAnim(atk: AttackDef, local: number, die: number): AnimInput {
  if (local >= atk.hit) {
    if (local < atk.hit + die + 0.3) {
      const lethal = atk.hits[atk.hits.length - 1]
      return { kind: 'death', t: local - atk.hit, dmg: atk.dmg, zone: lethal?.zone ?? 'mid', sever: atk.sever }
    }
    return { kind: 'ready', t: local }
  }
  let n = 0
  while (n < atk.hits.length - 1 && atk.hits[n].t <= local) n++
  if (n > 0) {
    const h = atk.hits[n - 1]
    return { kind: 'hurt', t: local - h.t, zone: h.zone, n, hold: h.hold }
  }
  return { kind: 'ready', t: local }
}

const _protPos = new THREE.Vector2()
const PROT_Z = 0.58
const PROT_X = 0.38
const THREAT_Z = 1.15

function Unit({
  id,
  x,
  z,
  mode,
  seed,
  freeze,
  damage,
  awakened = false,
}: {
  id: string
  x: number
  z: number
  mode: AnimMode
  seed: number
  freeze: number | null
  damage: DamageType | null
  awakened?: boolean
}) {
  const api = useRef<FighterApi | null>(null)
  const foe = useRef<FighterApi | null>(null)
  const guard = useRef<FighterApi | null>(null)
  const mover = useRef<THREE.Group>(null)
  const guardRoot = useRef<THREE.Group>(null)
  const clock = useRef({ t: 0 })
  const fired = useRef(-1)
  const [fx, setFx] = useState<FxEvent[]>([])
  const protector = protectorForKing(id)
  const guardStage = (mode === 'check' || mode === 'checkmate') && Boolean(protector)
  const sparring = mode === 'attack' || mode === 'cycle' || guardStage
  const atkDef = attackFor(getHeroDesign(id, 'w', { awakened }))
  const foeDesign = getHeroDesign(id, 'b', { awakened })
  const foeDie = deathDuration(foeDesign, atkDef.dmg)
  const duel = useRef(
    protector
      ? buildProtectorDuel({
          attackerStart: new THREE.Vector2(0, THREAT_Z),
          protectorStart: new THREE.Vector2(PROT_X, PROT_Z),
          kingHome: new THREE.Vector2(0, 0),
          seed: Math.floor(seed * 9973),
        })
      : null,
  )

  useEffect(() => {
    fired.current = -1
    setFx([])
    clock.current.t = 0
    applyMover(mover.current, null)
    duel.current = protector
      ? buildProtectorDuel({
          attackerStart: new THREE.Vector2(0, THREAT_Z),
          protectorStart: new THREE.Vector2(PROT_X, PROT_Z),
          kingHome: new THREE.Vector2(0, 0),
          seed: Math.floor(seed * 9973),
        })
      : null
  }, [mode, id, damage, awakened, protector, seed])

  const fireFx = (design: HeroDesign, attackLocalT: number, key: number) => {
    if (freeze !== null || fired.current === key) return
    fired.current = key
    const events = makeAttackFx(design, now() - attackLocalT)
    const tNow = now()
    setFx((prev) => [...prev.filter((e) => tNow < e.start + e.travel + e.dur + 0.1), ...events])
  }

  useFrame((_, dt) => {
    const a = api.current
    if (!a) return
    const v = foe.current
    const g = guard.current
    clock.current.t += dt
    const t = clock.current.t
    const atk = attackFor(a.design)
    const atkDur = atk.clip.dur
    const die = (dmg: DamageType) => deathDuration(a.design, dmg)
    const selfDmg = (k: number) => damage ?? DAMAGE_TYPES[k % DAMAGE_TYPES.length]

    if (mode === 'check' && protector) {
      a.update({ kind: 'ready', t }, dt, 0)
      v?.update({ kind: 'ready', t }, dt, 0)
      g?.update({ kind: 'idle', t }, dt, 0)
      if (guardRoot.current) {
        guardRoot.current.position.set(PROT_X, 0, PROT_Z)
        guardRoot.current.rotation.y = 0
        guardRoot.current.visible = true
      }
      return
    }

    if (mode === 'checkmate' && protector && duel.current) {
      const d = duel.current
      const protDie = deathDuration(protector.design, 'slash')
      const kingDie = die('slash')
      const period = d.kingHitAt + kingDie + 1.4
      const local = t % period
      const loop = Math.floor(t / period)

      if (local < d.protectorHitAt) {
        const ks = sampleBeat(d.king, local, _protPos)
        a.update(ks.anim.kind === 'ready' ? { kind: 'ready', t: local } : ks.anim, dt, 0)
        const as = sampleBeat(d.attacker, local, _protPos)
        v?.update(as.anim.kind === 'ready' ? { kind: 'ready', t: local } : as.anim, dt, 0)
        const ps = sampleBeat(d.protector, local, _protPos)
        if (guardRoot.current) {
          guardRoot.current.position.set(_protPos.x, 0, _protPos.y)
          guardRoot.current.rotation.y = ps.yaw
          guardRoot.current.visible = true
        }
        g?.update(ps.anim.kind === 'ready' ? { kind: 'idle', t: local } : ps.anim, dt, 0)
      } else if (local < d.kingHitAt) {
        // Guardian is down — king keeps trading with the attacker, then falls.
        const ks = sampleBeat(d.king, local, _protPos)
        a.update(ks.anim.kind === 'ready' ? { kind: 'ready', t: local } : ks.anim, dt, 0)
        const as = sampleBeat(d.attacker, local, _protPos)
        v?.update(as.anim.kind === 'ready' ? { kind: 'ready', t: local } : as.anim, dt, 0)
        if (guardRoot.current) {
          guardRoot.current.visible = local - d.protectorHitAt < protDie + 0.35
        }
        g?.update(
          { kind: 'death', t: local - d.protectorHitAt, dmg: 'slash', zone: 'mid' },
          dt,
          0,
        )
      } else {
        a.update({ kind: 'death', t: local - d.kingHitAt, dmg: 'slash', zone: 'mid' }, dt, 0)
        v?.update({ kind: 'ready', t: local }, dt, 0)
        if (guardRoot.current) {
          guardRoot.current.visible = local - d.protectorHitAt < protDie + 0.5
        }
        g?.update(
          { kind: 'death', t: local - d.protectorHitAt, dmg: 'slash', zone: 'mid' },
          dt,
          0,
        )
      }

      if (fired.current !== loop) {
        fired.current = loop
        const tNow = now()
        const hits: FxEvent[] = d.taps.map((tap) => ({
          id: fxSeq++,
          kind: 'hit' as const,
          start: tNow + tap.t,
          travel: 0,
          dur: 0.35,
          from: new THREE.Vector3(tap.from.x, 0.7, tap.from.y),
          to: new THREE.Vector3(tap.at.x, 0.7, tap.at.y),
          color: '#fff1c4',
          color2: '#ff4d6d',
          size: 0.4,
        }))
        setFx((prev) => [...prev.filter((e) => tNow < e.start + e.travel + e.dur + 0.1), ...hits])
      }
      return
    }

    if (freeze !== null && mode !== 'cycle') {
      if (mode === 'run') {
        const preview = runPreview(a.design, freeze * runOneWay(a.design) * 2)
        applyMover(mover.current, preview)
        a.update(preview.anim, 0.1, 0.6)
        return
      }
      applyMover(mover.current, null)
      if (mode === 'death') {
        const dmg = damage ?? 'beam'
        a.update({ kind: 'death', t: freeze * die(dmg), dmg, zone: 'mid' }, 0.1, 0)
      } else if (mode === 'attack') {
        a.update({ kind: 'attack', t: freeze * atkDur }, 0.1, 0)
        v?.update(victimAnim(atk, freeze * atkDur, foeDie), 0.1, 0)
      } else if (mode === 'check' || mode === 'checkmate') {
        a.update({ kind: 'ready', t: freeze * 4 }, 0.1, 0)
      } else a.update({ kind: mode, t: freeze * 4 }, 0.1, 0)
      return
    }
    let anim: AnimInput
    let foeAnim: AnimInput = { kind: 'ready', t }
    let preview: RunPreview | null = null
    if (mode === 'idle') anim = { kind: 'idle', t }
    else if (mode === 'run') {
      preview = runPreview(a.design, t)
      anim = preview.anim
    } else if (mode === 'attack') {
      const period = Math.max(atkDur, atk.hit + foeDie + 0.3) + 0.6
      const local = t % period
      anim = local < atkDur ? { kind: 'attack', t: local } : { kind: 'ready', t }
      foeAnim = victimAnim(atk, local, foeDie)
      if (local < atkDur) fireFx(a.design, local, Math.floor(t / period))
    } else if (mode === 'death') {
      const k = Math.floor(t / (die('shock') + 1.2))
      const dmg = selfDmg(k)
      anim = { kind: 'death', t: t - k * (die('shock') + 1.2), dmg, zone: 'mid' }
      if (anim.t > die(dmg) + 0.6) anim = { kind: 'ready', t }
    } else {
      const runSeg = 2
      const atkAt = 4 + runSeg
      const selfAt = atkAt + Math.max(atkDur + 0.8, atk.hit + foeDie + 0.5)
      const cycle = selfAt + die('shock') + 1.2
      const k = Math.floor(t / cycle)
      const c = t % cycle
      if (c < 3) anim = { kind: 'idle', t }
      else if (c < 3.6) anim = { kind: 'ready', t }
      else if (c < 3.6 + runSeg) {
        preview = runPreview(a.design, c - 3.6)
        anim = preview.anim
      } else if (c < atkAt) anim = { kind: 'ready', t }
      else if (c < atkAt + atkDur) {
        const local = c - atkAt
        anim = { kind: 'attack', t: local }
        fireFx(a.design, local, k)
      } else if (c < selfAt) anim = { kind: 'ready', t }
      else anim = { kind: 'death', t: c - selfAt, dmg: selfDmg(k), zone: 'mid' }
      if (c >= atkAt) foeAnim = victimAnim(atk, c - atkAt, foeDie)
    }
    applyMover(mover.current, preview)
    a.update(anim, dt, anim.kind === 'move' ? 1 : 0)
    v?.update(foeAnim, dt, 0)
  })
  return (
    <group position={[x, 0, z]}>
      <group ref={mover}>
        <HeroFighter
          heroId={id}
          color="w"
          seed={seed}
          apiRef={api}
          awakened={awakened}
        />
      </group>
      {sparring ? (
        <group
          position={[0, 0, guardStage ? THREAT_Z : victimZ(atkDef)]}
          rotation={[0, Math.PI, 0]}
        >
          <HeroFighter
            heroId={id}
            color="b"
            seed={(seed + 0.41) % 1}
            apiRef={foe}
            awakened={awakened}
          />
        </group>
      ) : null}
      {guardStage && protector ? (
        <group ref={guardRoot} position={[PROT_X, 0, PROT_Z]}>
          <HeroFighter
            heroId={null}
            color="w"
            seed={(seed + 0.73) % 1}
            apiRef={guard}
            design={protector.design}
          />
        </group>
      ) : null}
      <FxLayer events={fx} />
    </group>
  )
}

function OutlineSync() {
  const gl = useThree((s) => s.gl)
  useFrame(() => {
    const dpr = gl.getPixelRatio()
    outlineUniforms.uThickness.value = 0.011
    outlineUniforms.uMinPx.value = 1.05 * dpr
    outlineUniforms.uMaxPx.value = 2.6 * dpr
    outlineUniforms.uResY.value = gl.domElement.height
  })
  return null
}

const COLS = 8
const GAP = 1.3

export function CharacterStage({
  ids,
  mode,
  freeze = null,
  damage = null,
  awakened = false,
  cam,
  className,
}: {
  ids: string[]
  mode: AnimMode
  freeze?: number | null
  /** Death preview damage type; null cycles through all of them. */
  damage?: DamageType | null
  /** Preview a pawn's awakened promotion look. */
  awakened?: boolean
  /** Camera position override for single-hero views. */
  cam?: [number, number, number]
  className?: string
}) {
  const valid = ids.filter((id) => HERO_DESIGNS[id])
  const rows = Math.max(1, Math.ceil(valid.length / COLS))
  const single = valid.length === 1

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={
          single
            ? { position: cam ?? [1.9, 1.1, 1.9], fov: 35 }
            : { position: [0, 4, 9], fov: 40 }
        }
      >
        <color attach="background" args={['#cfd8e3']} />
        <ambientLight intensity={0.95} />
        <hemisphereLight args={['#dff0ff', '#b8c0a8', 0.85]} />
        <directionalLight castShadow position={[4, 8, 5]} intensity={2.1} color="#fff4e0" />
        <OutlineSync />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshToonMaterial color="#aeb8c4" />
        </mesh>
        {valid.map((id, i) => {
          const c = i % COLS
          const r = Math.floor(i / COLS)
          const x = single ? 0 : (c - (COLS - 1) / 2) * GAP
          const z = single ? 0 : (r - (rows - 1) / 2) * GAP * 1.2
          return (
            <Unit
              key={`${id}-${awakened ? 'awake' : 'base'}`}
              id={id}
              x={x}
              z={z}
              mode={mode}
              seed={(i * 0.137) % 1}
              freeze={freeze}
              damage={damage}
              awakened={awakened}
            />
          )
        })}
        <OrbitControls target={[0, single ? 0.6 : 0.5, single ? 0.3 : 0]} />
      </Canvas>
    </div>
  )
}
