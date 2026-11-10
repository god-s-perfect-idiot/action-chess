import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { FxKind } from './anims'
import { now } from './clock'
import { celMaterial } from './materials'
import { P } from './Part'
import { aimY, S } from './shapes'

export type FxType = FxKind | 'poof' | 'poofSparkle' | 'poofShards' | 'hit' | 'bloodPool'

export interface FxEvent {
  id: number
  kind: FxType
  /** Absolute time (seconds, performance clock) the effect begins. */
  start: number
  /** Seconds spent travelling from `from` to `to` (0 for on-target fx). */
  travel: number
  /** Seconds the impact portion lasts. */
  dur: number
  from: THREE.Vector3
  to: THREE.Vector3
  color: string
  color2: string
  /** World units — roughly one fighter height / 2. */
  size: number
}
function rand(id: number, k: number): number {
  const x = Math.sin(id * 91.17 + k * 17.31) * 43758.5453
  return x - Math.floor(x)
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
/** Pop up quickly, hold, shrink away. */
const pop = (u: number, rise = 0.18, fall = 0.45) =>
  u <= 0 || u >= 1 ? 0 : u < rise ? ease(u / rise) : u > 1 - fall ? ease((1 - u) / fall) : 1

function useMats(e: FxEvent) {
  return useMemo(
    () => ({
      a: new THREE.MeshBasicMaterial({ color: e.color }),
      b: new THREE.MeshBasicMaterial({ color: e.color2 }),
      white: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      dark: new THREE.MeshBasicMaterial({ color: '#16121e' }),
      smoke: celMaterial('#e8e6ea'),
      smokeShade: celMaterial('#b8b4c0'),
      blood: new THREE.MeshBasicMaterial({ color: '#8a0a14' }),
      bloodDark: new THREE.MeshBasicMaterial({ color: '#5c0610' }),
    }),
    [e.color, e.color2],
  )
}

/** Drives a group per frame with travel / impact phases; hides outside its window. */
function useFx(e: FxEvent, fn: (g: THREE.Group, travelP: number, u: number) => void) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const t = now() - e.start
    const total = e.travel + e.dur
    if (t < 0 || t > total) {
      g.visible = false
      return
    }
    g.visible = true
    const tp = e.travel > 0 ? Math.min(1, t / e.travel) : 1
    const u = t < e.travel ? -1 : (t - e.travel) / e.dur
    fn(g, tp, u)
  })
  return ref
}

// ───────────────────────── Building blocks ─────────────────────────

function Burst({ e, spikes = 8, scale = 1, mat }: { e: FxEvent; spikes?: number; scale?: number; mat?: 'a' | 'b' }) {
  const M = useMats(e)
  const dirs = useMemo(
    () =>
      Array.from({ length: spikes }, (_, i) => {
        const a = (i / spikes) * Math.PI * 2 + rand(e.id, i) * 0.5
        const el = (rand(e.id, i + 40) - 0.5) * 1.4
        return new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el) + 0.2, Math.sin(a) * Math.cos(el)).normalize()
      }),
    [e.id, spikes],
  )
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) {
      g.scale.setScalar(0.0001)
      return
    }
    g.position.copy(e.to)
    const s = pop(u, 0.12, 0.6) * e.size * scale
    g.scale.setScalar(Math.max(0.0001, s))
    g.children.forEach((c, i) => {
      if (i === 0) {
        c.scale.setScalar(1 - u * 0.6)
        return
      }
      const d = dirs[i - 1]
      if (!d) return
      const out = 0.35 + ease(u) * 0.55
      c.position.copy(d).multiplyScalar(out)
      c.scale.set(1, 0.4 + (1 - u) * 1.2, 1)
    })
  })
  const m = M[mat ?? 'a']
  return (
    <group ref={ref}>
      <P s={S.shard(0.32, 0.32, 0.32)} m={M.white} shadow={false} />
      {dirs.map((d, i) => (
        <P key={i} s={S.cone(0.07, 0.55, 4)} m={i % 2 ? m : M.b} shadow={false} r={aimY(d.x, d.y, d.z)} />
      ))}
    </group>
  )
}

function Ring({ e, ground = false, radius = 1.2, delay = 0 }: { e: FxEvent; ground?: boolean; radius?: number; delay?: number }) {
  const M = useMats(e)
  const ref = useFx(e, (g, _tp, u0) => {
    const u = (u0 - delay) / (1 - delay)
    if (u0 < 0 || u < 0) {
      g.scale.setScalar(0.0001)
      return
    }
    g.position.copy(e.to)
    if (ground) g.position.y = 0.06
    const r = (0.2 + ease(u) * radius) * e.size
    g.scale.set(r, r, Math.max(0.0001, (1 - u) * e.size))
    if (!ground) g.lookAt(e.from.x, e.to.y, e.from.z)
  })
  return (
    <group ref={ref}>
      <group rotation={ground ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
        <P s={S.torus(1, 0.06, Math.PI * 2, 32)} m={M.a} shadow={false} />
      </group>
    </group>
  )
}

function Beam({ e, dark = false }: { e: FxEvent; dark?: boolean }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    const from = e.from
    const dir = new THREE.Vector3().subVectors(e.to, from)
    const len = dir.length() * (u < 0 ? ease(tp) : 1)
    g.position.copy(from)
    g.lookAt(e.to)
    const w = (u < 0 ? 0.6 + tp * 0.4 : pop(u, 0.05, 0.5) * (1 + Math.sin(u * 60) * 0.08)) * e.size
    g.scale.set(Math.max(0.0001, w), Math.max(0.0001, w), Math.max(0.0001, len))
  })
  return (
    <group ref={ref}>
      <group position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <P s={S.cyl(0.22, 0.22, 1, 14, true)} m={dark ? M.dark : M.a} shadow={false} />
        <P s={S.cyl(0.11, 0.11, 1.002, 10, true)} m={dark ? M.a : M.white} line={false} shadow={false} />
      </group>
      <P s={S.sphere(0.34, 14, 10)} m={dark ? M.dark : M.a} shadow={false} />
    </group>
  )
}

/** Gates of Babylon — gold reality-ripples bloom behind the caster; random noble phantasms lance out. */
function BabylonGates({ e, count = 8 }: { e: FxEvent; count?: number }) {
  const M = useMats(e)
  const ripple = useMemo(
    () => ({
      rim: new THREE.MeshBasicMaterial({
        color: e.color,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      }),
      rimSoft: new THREE.MeshBasicMaterial({
        color: e.color2,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      core: new THREE.MeshBasicMaterial({
        color: '#fff6c8',
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
      veil: new THREE.MeshBasicMaterial({
        color: e.color,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      warp: new THREE.MeshBasicMaterial({
        color: e.color2,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    }),
    [e.color, e.color2],
  )
  const portals = useMemo(() => {
    // Basis: portals sit on a wall behind Gilgamesh, facing the target.
    const forward = new THREE.Vector3().subVectors(e.to, e.from)
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, 1)
    else forward.normalize()
    const back = forward.clone().negate()
    const worldUp = new THREE.Vector3(0, 1, 0)
    let right = new THREE.Vector3().crossVectors(forward, worldUp)
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
    else right.normalize()
    const up = new THREE.Vector3().crossVectors(right, forward).normalize()

    return Array.from({ length: count }, (_, i) => {
      const col = (i % 3) - 1
      const row = Math.floor(i / 3) - 0.5
      const jitterR = (rand(e.id, i) - 0.5) * 0.28
      const jitterU = (rand(e.id, i + 20) - 0.5) * 0.22
      const depth = 0.42 + rand(e.id, i + 40) * 0.55
      const offset = new THREE.Vector3()
        .addScaledVector(back, depth * e.size)
        .addScaledVector(right, (col * 0.42 + jitterR) * e.size)
        .addScaledVector(up, (0.18 + row * 0.38 + jitterU) * e.size)
      const kind = Math.floor(rand(e.id, i + 60) * 6) // sword / spear / axe / dagger / mace / arrow
      return {
        offset,
        lag: 0.04 + i * 0.05 + rand(e.id, i + 80) * 0.03,
        kind,
        spin: (rand(e.id, i + 100) - 0.5) * 6,
        phase: rand(e.id, i + 120) * Math.PI * 2,
        sizeMul: 0.75 + rand(e.id, i + 140) * 0.45,
      }
    })
  }, [e.id, e.size, e.from, e.to, count])

  const ref = useFx(e, (g, tp, u) => {
    const open = u < 0 ? ease(Math.min(1, tp / 0.28)) : pop(u, 0.04, 0.5)
    const t = now() - e.start
    g.children.forEach((c, i) => {
      const p = portals[i]
      if (!p) return
      const portal = c.children[0] as THREE.Object3D
      const weapon = c.children[1] as THREE.Object3D
      const origin = new THREE.Vector3().copy(e.from).add(p.offset)
      portal.position.copy(origin)
      portal.lookAt(e.to)
      const breath = 1 + Math.sin(t * 7 + p.phase) * 0.06
      const ps = Math.max(0.0001, open * e.size * p.sizeMul * breath * (0.7 + (u < 0 ? 0.15 : (1 - u) * 0.25)))
      portal.scale.setScalar(ps)
      portal.visible = open > 0.04

      // Concentric rings pulse outward like gold ripples tearing reality.
      portal.children.forEach((ring, ri) => {
        if (ri >= 4) return
        const wave = ((t * 1.85 + p.phase + ri * 0.52) % 1.25) / 1.25
        ring.scale.setScalar(Math.max(0.0001, 0.5 + wave * 1.25))
        ring.visible = open > 0.04
      })

      const local = Math.min(1, Math.max(0, (tp - p.lag) / Math.max(0.22, 1 - p.lag)))
      if (u < 0 && local > 0.02 && local < 1) {
        // Emerges from the portal mouth a short distance, then flies to the target.
        const emerge = Math.min(1, local / 0.18)
        const fly = Math.max(0, (local - 0.18) / 0.82)
        const mouth = new THREE.Vector3().lerpVectors(origin, e.to, 0.06 * ease(emerge))
        weapon.visible = true
        weapon.position.lerpVectors(mouth, e.to, ease(fly))
        weapon.lookAt(e.to)
        weapon.rotateX(Math.PI / 2)
        weapon.rotateZ(p.spin * local)
        weapon.scale.setScalar(e.size * (0.55 + ease(emerge) * 0.4))
      } else if (u >= 0 && local >= 1) {
        weapon.visible = u < 0.22
        weapon.position.copy(e.to)
        weapon.scale.setScalar(e.size * 0.95 * (1 - u / 0.22))
      } else {
        weapon.visible = false
      }
    })
  })

  return (
    <group ref={ref}>
      {portals.map((p, i) => (
        <group key={i}>
          <group>
            {/* Expanding gold reality-ripples (animated in useFx). */}
            <group>
              <P s={S.torus(0.32, 0.018, Math.PI * 2, 28)} m={ripple.rim} line={false} shadow={false} />
            </group>
            <group>
              <P s={S.torus(0.26, 0.014, Math.PI * 2, 24)} m={ripple.rimSoft} line={false} shadow={false} />
            </group>
            <group>
              <P s={S.torus(0.2, 0.01, Math.PI * 2, 22)} m={ripple.core} line={false} shadow={false} />
            </group>
            <group>
              <P s={S.torus(0.14, 0.008, Math.PI * 2, 20)} m={ripple.rimSoft} line={false} shadow={false} />
            </group>
            {/* Soft veil — warped gold plane through which the weapon appears. */}
            <P s={S.cyl(0.22, 0.22, 0.01, 24)} m={ripple.veil} line={false} shadow={false} r={[Math.PI / 2, 0, 0]} />
            <P s={S.cyl(0.14, 0.14, 0.008, 20)} m={ripple.warp} line={false} shadow={false} r={[Math.PI / 2, 0, 0]} />
            <P s={S.sphere(0.05, 10, 8)} m={ripple.core} line={false} shadow={false} />
          </group>
          <group>
            {p.kind === 0 && (
              <>
                <P s={S.box(0.045, 0.045, 0.44, 0.01)} m={M.a} shadow={false} />
                <P s={S.shard(0.1, 0.22, 0.018)} m={M.b} shadow={false} p={[0, 0, 0.3]} />
                <P s={S.box(0.13, 0.028, 0.035, 0.008)} m={M.a} shadow={false} p={[0, 0, -0.16]} />
                <P s={S.sphere(0.035, 8, 6)} m={M.b} line={false} shadow={false} p={[0, 0, -0.24]} />
              </>
            )}
            {p.kind === 1 && (
              <>
                <P s={S.cyl(0.022, 0.022, 0.58, 6)} m={M.a} shadow={false} />
                <P s={S.cone(0.07, 0.24, 5)} m={M.b} shadow={false} p={[0, 0.34, 0]} r={[Math.PI, 0, 0]} />
                <P s={S.box(0.1, 0.018, 0.028, 0.006)} m={M.a} shadow={false} p={[0, -0.18, 0]} />
              </>
            )}
            {p.kind === 2 && (
              <>
                <P s={S.cyl(0.028, 0.028, 0.38, 6)} m={M.b} shadow={false} />
                <P s={S.shard(0.2, 0.15, 0.035)} m={M.a} shadow={false} p={[0.09, 0.22, 0]} r={[0, 0, 0.45]} />
                <P s={S.shard(0.15, 0.12, 0.03)} m={M.b} shadow={false} p={[-0.07, 0.2, 0]} r={[0, 0, -0.55]} />
              </>
            )}
            {p.kind === 3 && (
              <>
                <P s={S.box(0.035, 0.035, 0.28, 0.008)} m={M.a} shadow={false} />
                <P s={S.shard(0.07, 0.14, 0.015)} m={M.b} shadow={false} p={[0, 0, 0.18]} />
                <P s={S.box(0.09, 0.022, 0.03, 0.006)} m={M.a} shadow={false} p={[0, 0, -0.1]} />
              </>
            )}
            {p.kind === 4 && (
              <>
                <P s={S.cyl(0.03, 0.03, 0.36, 6)} m={M.b} shadow={false} />
                <P s={S.sphere(0.1, 10, 8)} m={M.a} shadow={false} p={[0, 0.22, 0]} />
                <P s={S.box(0.08, 0.02, 0.025, 0.006)} m={M.a} shadow={false} p={[0, -0.12, 0]} />
              </>
            )}
            {p.kind === 5 && (
              <>
                <P s={S.cyl(0.016, 0.016, 0.48, 5)} m={M.a} shadow={false} />
                <P s={S.cone(0.05, 0.14, 4)} m={M.b} shadow={false} p={[0, 0.28, 0]} r={[Math.PI, 0, 0]} />
                <P s={S.box(0.07, 0.012, 0.02, 0.004)} m={M.a} shadow={false} p={[0, -0.14, 0]} />
              </>
            )}
          </group>
        </group>
      ))}
    </group>
  )
}

/** Objects that fly from `from` to `to` during the travel phase. */
function Volley({ e, count, shape }: { e: FxEvent; count: number; shape: 'card' | 'ring' | 'orb' | 'hook' | 'kunai' | 'bullet' | 'feather' }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    g.visible = u < 0
    g.children.forEach((c, i) => {
      const lag = i * 0.08
      const p = Math.min(1, Math.max(0, (tp - lag) / (1 - lag * count * 0.5 + 0.0001)))
      c.position.lerpVectors(e.from, e.to, p)
      c.position.y += Math.sin(p * Math.PI) * (shape === 'card' ? (i - (count - 1) / 2) * 0.25 * e.size : shape === 'feather' ? (i - (count - 1) / 2) * 0.12 * e.size : 0)
      c.position.x += shape === 'card' ? Math.sin(p * Math.PI) * (i - (count - 1) / 2) * 0.3 * e.size : shape === 'bullet' || shape === 'feather' ? (i - (count - 1) / 2) * 0.1 * e.size : 0
      c.visible = p > 0 && p < 1
      if (shape === 'ring') {
        c.lookAt(e.to)
        const s = (0.5 + p * 0.8) * e.size
        c.scale.setScalar(s)
      } else if (shape === 'card') {
        c.rotation.set(p * 20 + i, p * 14, 0)
        c.scale.setScalar(e.size)
      } else if (shape === 'kunai' || shape === 'bullet' || shape === 'feather') {
        c.lookAt(e.to)
        c.rotateX(Math.PI / 2)
        if (shape === 'feather') c.rotateZ((i - (count - 1) / 2) * 0.35)
        c.scale.setScalar(e.size * (shape === 'bullet' ? 0.7 : shape === 'feather' ? 0.9 : shape === 'kunai' ? 0.95 : 0.85))
      } else {
        c.scale.setScalar(e.size)
      }
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, i) => (
        <group key={i}>
          {shape === 'card' && <P s={S.box(0.2, 0.3, 0.015, 0.02)} m={i % 2 ? M.a : M.white} shadow={false} />}
          {shape === 'ring' && <P s={S.torus(0.35, 0.05, Math.PI * 2, 24)} m={i % 2 ? M.a : M.b} shadow={false} />}
          {shape === 'orb' && <P s={S.sphere(0.22, 12, 10)} m={M.a} shadow={false} />}
          {shape === 'hook' && <P s={S.cone(0.12, 0.3, 4)} m={M.b} shadow={false} r={[Math.PI / 2, 0, 0]} />}
          {shape === 'kunai' && (
            <group>
              <P s={S.box(0.06, 0.06, 0.18, 0.02)} m={M.white} shadow={false} p={[0, 0, -0.12]} />
              <P s={S.cone(0.07, 0.28, 3)} m={M.b} shadow={false} p={[0, 0, 0.08]} r={[Math.PI / 2, 0, 0]} />
              <P s={S.cone(0.04, 0.14, 3)} m={M.dark} shadow={false} p={[0.08, 0, 0.02]} r={[Math.PI / 2, 0, 0.6]} />
              <P s={S.cone(0.04, 0.14, 3)} m={M.dark} shadow={false} p={[-0.08, 0, 0.02]} r={[Math.PI / 2, 0, -0.6]} />
            </group>
          )}
          {shape === 'bullet' && (
            <group>
              <P s={S.cyl(0.04, 0.04, 0.55, 8)} m={M.white} shadow={false} />
              <P s={S.cyl(0.055, 0.03, 0.12, 8)} m={M.a} shadow={false} p={[0, 0.28, 0]} />
              <P s={S.cyl(0.02, 0.02, 0.35, 6)} m={M.b} line={false} shadow={false} p={[0, -0.2, 0]} />
            </group>
          )}
          {shape === 'feather' && (
            <group>
              <P s={S.shard(0.1, 0.42, 0.03)} m={M.a} shadow={false} />
              <P s={S.shard(0.06, 0.28, 0.02)} m={M.b} shadow={false} p={[0.02, -0.04, 0.01]} />
              <P s={S.cone(0.035, 0.1, 3)} m={M.dark} shadow={false} p={[0, 0.22, 0]} r={[Math.PI, 0, 0]} />
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

/** Bright yellow afterimage ribbon that streaks behind a flying kunai. */
function KunaiTrail({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const streaks = 9
  const ref = useFx(e, (g, tp, u) => {
    g.visible = u < 0 && tp > 0.02
    if (u >= 0) return
    const tip = new THREE.Vector3().lerpVectors(e.from, e.to, ease(tp))
    g.children.forEach((c, i) => {
      const back = Math.min(1, Math.max(0, tp - (i + 1) * 0.045))
      const p = ease(back)
      c.position.lerpVectors(e.from, tip, p)
      c.lookAt(tip)
      c.rotateX(Math.PI / 2)
      const fade = 1 - i / streaks
      const w = Math.max(0.0001, e.size * (0.55 + fade * 0.7) * (0.35 + (1 - tp) * 0.4))
      c.scale.set(w * 0.35 * fade, w * (0.9 + fade), w * 0.35 * fade)
      c.visible = back > 0.02
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: streaks }, (_, i) => (
        <group key={i}>
          <P s={S.cyl(0.045, 0.02, 0.55, 6, true)} m={i % 2 ? M.a : M.white} line={false} shadow={false} />
        </group>
      ))}
    </group>
  )
}

/** Overhead Rasengan — spinning chakra orb that drives straight down into the target. */
function Rasengan({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    if (u < 0) {
      // Travel = short drop from above the victim into them.
      g.position.lerpVectors(e.from, e.to, ease(tp))
      const charge = 0.55 + tp * 0.7
      g.scale.setScalar(Math.max(0.0001, e.size * charge))
      g.rotation.y = tp * 28
      g.rotation.x = tp * 11
      return
    }
    g.position.copy(e.to)
    const s = pop(u, 0.08, 0.55) * e.size * (1.4 + Math.sin(u * 40) * 0.08)
    g.scale.setScalar(Math.max(0.0001, s))
    g.rotation.y = 18 + u * 22
    g.children.forEach((c, i) => {
      if (i === 0) return
      c.rotation.z = u * (10 + i * 3)
      c.rotation.x = u * (6 + i * 2)
    })
  })
  return (
    <group ref={ref}>
      <P s={S.sphere(0.28, 16, 12)} m={M.white} shadow={false} />
      <P s={S.sphere(0.38, 14, 10)} m={M.a} line={false} shadow={false} />
      <group rotation={[Math.PI / 2, 0, 0]}>
        <P s={S.torus(0.42, 0.045, Math.PI * 2, 28)} m={M.a} shadow={false} />
      </group>
      <group rotation={[0.4, 0.7, 0.2]}>
        <P s={S.torus(0.48, 0.03, Math.PI * 2, 24)} m={M.b} shadow={false} />
      </group>
      <group rotation={[-0.5, -0.4, 0.6]}>
        <P s={S.torus(0.34, 0.025, Math.PI * 2, 20)} m={M.white} shadow={false} />
      </group>
    </group>
  )
}

function Chain({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const links = 10
  const ref = useFx(e, (g, tp, u) => {
    const reach = u < 0 ? ease(tp) : 1 - ease(u)
    g.children.forEach((c, i) => {
      const p = (i / (links - 1)) * reach
      c.position.lerpVectors(e.from, e.to, p)
      c.position.y += Math.sin(p * Math.PI) * 0.15 * e.size
      c.lookAt(e.to)
      c.rotateZ(i % 2 ? Math.PI / 2 : 0)
      c.scale.setScalar(e.size)
      c.visible = reach > 0.02
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: links }, (_, i) => (
        <group key={i}>
          <P s={i === links - 1 ? S.cone(0.14, 0.35, 4) : S.torus(0.09, 0.025, Math.PI * 2, 10)} m={i === links - 1 ? M.b : M.a} shadow={false} r={i === links - 1 ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0]} />
        </group>
      ))}
    </group>
  )
}

function Slash({ e, sweeps = 1 }: { e: FxEvent; sweeps?: number }) {
  const M = useMats(e)
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    g.position.copy(e.to)
    g.lookAt(e.from.x, e.to.y, e.from.z)
    g.children.forEach((c, i) => {
      const local = Math.min(1, Math.max(0, u * (1 + i * 0.3) - i * 0.2))
      c.rotation.z = -1.2 + ease(local) * 1.6 + i * 1.1
      const w = pop(local, 0.15, 0.6)
      c.scale.set(e.size * 1.2, e.size * 1.2, Math.max(0.0001, w * e.size))
      c.visible = w > 0.001
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: sweeps }, (_, i) => (
        <group key={i} rotation={[0, 0, 0]}>
          <group rotation={[0.3 * (i % 2 ? -1 : 1), 0, 0]}>
            <P s={S.torus(0.75, 0.07, Math.PI * 0.9, 24)} m={i % 2 ? M.b : M.a} shadow={false} sc={[1, 1, 0.35]} />
            <P s={S.torus(0.75, 0.03, Math.PI * 0.85, 24)} m={M.white} line={false} shadow={false} p={[0, 0, 0.02]} sc={[1, 1, 0.35]} />
          </group>
        </group>
      ))}
    </group>
  )
}

/** Senbonzakura — pink blade-petals that swirl out along the cut and drift away. */
function SakuraPetals({ e, count = 28 }: { e: FxEvent; count?: number }) {
  const M = useMats(e)
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rand(e.id, i) * 0.7
        const elev = (rand(e.id, i + 40) - 0.25) * 1.2
        const spiral = 0.55 + rand(e.id, i + 11) * 1.1
        const rise = 0.35 + rand(e.id, i + 22) * 1.15
        const spin = (rand(e.id, i + 33) - 0.5) * 14
        const delay = rand(e.id, i + 5) * 0.28
        return { a, elev, spiral, rise, spin, delay, size: 0.55 + rand(e.id, i + 60) * 0.7 }
      }),
    [e.id, count],
  )
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) {
      g.visible = false
      return
    }
    g.visible = true
    g.position.copy(e.to)
    g.lookAt(e.from.x, e.to.y, e.from.z)
    g.children.forEach((c, i) => {
      const p = petals[i]
      const local = Math.min(1, Math.max(0, (u - p.delay) / (1 - p.delay * 0.5)))
      if (local <= 0) {
        c.visible = false
        return
      }
      c.visible = true
      const swirl = p.a + local * p.spiral * 2.4
      const rad = ease(local) * e.size * (0.35 + p.spiral * 0.85)
      const y = Math.sin(p.elev) * e.size * 0.35 + p.rise * local * e.size - local * local * e.size * 0.55
      c.position.set(Math.cos(swirl) * rad, y, Math.sin(swirl) * rad * 0.55)
      c.rotation.set(local * p.spin, swirl * 1.4, local * p.spin * 0.6)
      const s = pop(local, 0.08, 0.45) * e.size * 0.22 * p.size
      c.scale.setScalar(Math.max(0.0001, s))
    })
  })
  return (
    <group ref={ref}>
      {petals.map((_, i) => (
        <group key={i}>
          <P
            s={S.shard(0.1, 0.16, 0.018)}
            m={i % 3 === 0 ? M.white : i % 3 === 1 ? M.a : M.b}
            shadow={false}
            line={false}
          />
        </group>
      ))}
    </group>
  )
}

function Pierce({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    g.position.copy(e.to)
    g.lookAt(e.from.x, e.to.y, e.from.z)
    const w = pop(u, 0.04, 0.7)
    g.scale.set(Math.max(0.0001, w * e.size), Math.max(0.0001, w * e.size), e.size * (1 + u * 0.6))
  })
  return (
    <group ref={ref}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <P s={S.cyl(0.03, 0.03, 3.2, 8)} m={M.white} shadow={false} />
      </group>
      <P s={S.shard(0.12, 0.6, 0.12)} m={M.a} shadow={false} />
      <P s={S.shard(0.6, 0.12, 0.12)} m={M.a} shadow={false} />
    </group>
  )
}

function Bolts({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const segs = 6
  const bolts = 3
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    const frame = Math.floor(u * 18)
    const alive = u < 0.75
    g.children.forEach((bolt, b) => {
      bolt.visible = alive && (frame + b) % 3 !== 0
      let px = e.to.x + (rand(e.id + frame, b) - 0.5) * e.size * 0.6
      let py = e.to.y + e.size * 2.2
      let pz = e.to.z + (rand(e.id + frame, b + 9) - 0.5) * e.size * 0.6
      bolt.children.forEach((seg, i) => {
        const nx = e.to.x + (rand(e.id + frame, b * 20 + i) - 0.5) * e.size * 0.9 * (1 - i / segs)
        const ny = py - (e.size * 2.2) / segs
        const nz = e.to.z + (rand(e.id + frame, b * 30 + i) - 0.5) * e.size * 0.9 * (1 - i / segs)
        const len = Math.hypot(nx - px, ny - py, nz - pz)
        seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2)
        const r = aimY(nx - px, ny - py, nz - pz)
        seg.rotation.set(r[0], r[1], r[2])
        seg.scale.set(e.size, len, e.size)
        px = nx
        py = ny
        pz = nz
      })
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: bolts }, (_, b) => (
        <group key={b}>
          {Array.from({ length: segs }, (_, i) => (
            <group key={i}>
              <P s={S.box(0.07, 1, 0.07, 0.02)} m={i % 2 ? M.a : M.white} shadow={false} />
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

function Debris({ e, count = 10, kind }: { e: FxEvent; count?: number; kind: 'shard' | 'cube' | 'star' | 'smoke' | 'flame' | 'blood' }) {
  const M = useMats(e)
  const vel = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = rand(e.id, i) * Math.PI * 2
        const up = kind === 'smoke' ? 0.4 + rand(e.id, i + 7) * 0.5 : kind === 'flame' ? 1.4 + rand(e.id, i + 7) : 0.6 + rand(e.id, i + 7) * 1.4
        const sp = kind === 'smoke' ? 0.8 + rand(e.id, i + 3) * 0.6 : 0.8 + rand(e.id, i + 3) * 1.4
        return new THREE.Vector3(Math.cos(a) * sp, up, Math.sin(a) * sp)
      }),
    [e.id, count, kind],
  )
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    g.children.forEach((c, i) => {
      const v = vel[i]
      const t = u * (kind === 'smoke' ? 0.7 : 1)
      const grav = kind === 'blood' ? 4 : kind === 'shard' || kind === 'cube' ? 2.2 : kind === 'flame' ? -0.3 : 0.2
      const y = e.to.y + (v.y * t - grav * t * t) * e.size
      c.position.set(e.to.x + v.x * t * e.size, kind === 'blood' ? Math.max(0.02, y) : y, e.to.z + v.z * t * e.size)
      if (kind === 'cube') {
        c.visible = Math.floor(u * 20 + i) % 2 === 0
        c.position.set(
          e.to.x + (rand(e.id, i * 3 + Math.floor(u * 8)) - 0.5) * e.size * 1.6,
          e.to.y + (rand(e.id, i * 5 + Math.floor(u * 8)) - 0.3) * e.size * 1.6,
          e.to.z + (rand(e.id, i * 7 + Math.floor(u * 8)) - 0.5) * e.size * 1.6,
        )
      }
      c.rotation.set(u * 9 + i, u * 7 + i * 2, 0)
      const s =
        kind === 'smoke'
          ? pop(u, 0.25, 0.55) * (0.8 + rand(e.id, i + 20) * 0.6)
          : kind === 'star'
            ? pop(u, 0.2, 0.5) * (0.6 + Math.sin(u * 30 + i) * 0.4)
            : pop(u, 0.05, 0.4)
      c.scale.setScalar(Math.max(0.0001, s * e.size))
    })
  })
  return (
    <group ref={ref}>
      {vel.map((_, i) => (
        <group key={i}>
          {kind === 'shard' && <P s={S.shard(0.09, 0.22, 0.04)} m={i % 2 ? M.a : M.b} shadow={false} />}
          {kind === 'cube' && <P s={S.box(0.22, 0.22, 0.22, 0.01)} m={i % 3 ? M.a : M.white} shadow={false} />}
          {kind === 'star' && <P s={S.shard(0.12, 0.12, 0.12)} m={i % 2 ? M.a : M.white} shadow={false} />}
          {kind === 'smoke' && <P s={S.sphere(0.32, 12, 10)} m={i % 3 ? M.smoke : M.smokeShade} shadow={false} />}
          {kind === 'flame' && <P s={S.cone(0.16, 0.42, 6)} m={i % 2 ? M.a : M.b} shadow={false} />}
          {kind === 'blood' && <P s={S.sphere(0.07, 6, 5)} m={i % 2 ? M.blood : M.bloodDark} line={false} shadow={false} />}
        </group>
      ))}
    </group>
  )
}

function Gravity({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    g.position.copy(e.to)
    const grow = u < 0 ? ease(tp) * 0.9 : u < 0.5 ? 0.9 + u * 0.4 : (1 - u) * 2.2
    const s = Math.max(0.0001, grow * e.size)
    g.scale.setScalar(s)
    g.rotation.y += 0.2
  })
  return (
    <group ref={ref}>
      <P s={S.sphere(0.45, 16, 12)} m={M.dark} shadow={false} />
      <group rotation={[Math.PI / 2 - 0.3, 0, 0]}>
        <P s={S.torus(0.7, 0.05, Math.PI * 2, 32)} m={M.a} shadow={false} />
      </group>
      <group rotation={[Math.PI / 2 + 0.5, 0.4, 0]}>
        <P s={S.torus(0.85, 0.035, Math.PI * 2, 32)} m={M.b} shadow={false} />
      </group>
    </group>
  )
}

/** Green wind crescent blades racing the travel path. */
function WindBlades({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const blades = 4
  const ref = useFx(e, (g, tp, u) => {
    if (u < 0) {
      g.position.lerpVectors(e.from, e.to, ease(tp))
      g.lookAt(e.to)
      g.scale.setScalar(e.size * (0.55 + tp * 0.45))
      g.rotation.z = tp * Math.PI * 2
      return
    }
    g.position.copy(e.to)
    const s = pop(u, 0.08, 0.55) * e.size
    g.scale.setScalar(Math.max(0.0001, s * 1.15))
    g.rotation.y += 0.35
    g.children.forEach((c, i) => {
      c.rotation.z = u * 4 + i * 0.9
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: blades }, (_, i) => (
        <group key={i} rotation={[0, (i / blades) * Math.PI * 2, 0.2]}>
          <P s={S.panel(0.08, 0.42, 0.01, 0.02)} m={i % 2 ? M.a : M.b} shadow={false} p={[0.18, 0.05, 0]} r={[0.4, 0, 0.6]} />
          <P s={S.shard(0.03, 0.16, 0.012)} m={M.white} line={false} shadow={false} p={[0.28, 0.12, 0.02]} r={[0.2, 0, 0.9]} />
        </group>
      ))}
    </group>
  )
}

/** Rising cyclone — stacked spinning rings + debris vortex. */
function Whirl({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    const target = u < 0 ? new THREE.Vector3().lerpVectors(e.from, e.to, ease(tp)) : e.to
    g.position.copy(target)
    const grow = u < 0 ? ease(tp) * 0.75 : u < 0.4 ? 0.75 + u * 1.1 : (1 - u) * 1.6
    g.scale.setScalar(Math.max(0.0001, grow * e.size))
    g.rotation.y += 0.45
    g.children.forEach((c, i) => {
      c.rotation.y += 0.12 + i * 0.04
      c.position.y = (i - 1) * 0.18 * e.size * (u < 0 ? tp : 1 - u * 0.3)
    })
  })
  return (
    <group ref={ref}>
      {[0.55, 0.75, 0.95].map((r, i) => (
        <group key={i} rotation={[Math.PI / 2 + (i - 1) * 0.15, 0, 0]}>
          <P s={S.torus(r, 0.04 - i * 0.006, Math.PI * 2, 28)} m={i % 2 ? M.a : M.b} shadow={false} />
        </group>
      ))}
      <P s={S.sphere(0.2, 12, 10)} m={M.white} line={false} shadow={false} />
    </group>
  )
}

function SpeedLines({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const lines = 7
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    g.position.lerpVectors(e.from, e.to, 0.5)
    g.lookAt(e.to)
    const len = e.from.distanceTo(e.to)
    g.children.forEach((c, i) => {
      const w = pop(u - i * 0.03, 0.05, 0.7)
      c.position.set((rand(e.id, i) - 0.5) * e.size * 1.2, (rand(e.id, i + 5) - 0.2) * e.size * 1.4, (rand(e.id, i + 9) - 0.5) * len * 0.3)
      c.scale.set(Math.max(0.0001, w * e.size), Math.max(0.0001, w * e.size), len * (0.4 + rand(e.id, i + 11) * 0.6))
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: lines }, (_, i) => (
        <group key={i}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <P s={S.cyl(0.03, 0.03, 1, 6)} m={i % 2 ? M.a : M.white} shadow={false} />
          </group>
        </group>
      ))}
    </group>
  )
}

/** Horizontal laser-bolt of jagged electricity along the travel path. */
function BeamBolts({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const segs = 8
  const bolts = 2
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    const frame = Math.floor(u * 22)
    const alive = u < 0.85
    g.children.forEach((bolt, b) => {
      bolt.visible = alive && (frame + b) % 2 === 0
      let px = e.from.x
      let py = e.from.y + e.size * 0.9
      let pz = e.from.z
      bolt.children.forEach((seg, i) => {
        const nt = Math.min(1, (i + 1) / segs)
        const nx =
          e.from.x + (e.to.x - e.from.x) * nt + (rand(e.id + frame, b * 20 + i) - 0.5) * e.size * 0.35 * (1 - Math.abs(nt - 0.5) * 1.2)
        const ny =
          e.from.y +
          e.size * 0.9 +
          (e.to.y - e.from.y) * nt +
          (rand(e.id + frame, b * 30 + i) - 0.5) * e.size * 0.45
        const nz =
          e.from.z + (e.to.z - e.from.z) * nt + (rand(e.id + frame, b * 40 + i) - 0.5) * e.size * 0.35 * (1 - Math.abs(nt - 0.5) * 1.2)
        const sl = Math.hypot(nx - px, ny - py, nz - pz)
        seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2)
        const r = aimY(nx - px, ny - py, nz - pz)
        seg.rotation.set(r[0], r[1], r[2])
        seg.scale.set(e.size * (b === 0 ? 1.1 : 0.7), Math.max(0.001, sl), e.size * (b === 0 ? 1.1 : 0.7))
        px = nx
        py = ny
        pz = nz
      })
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: bolts }, (_, b) => (
        <group key={b}>
          {Array.from({ length: segs }, (_, i) => (
            <group key={i}>
              <P s={S.box(0.08, 1, 0.08, 0.02)} m={i % 2 ? M.a : M.white} shadow={false} />
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

/** Hollow Purple — violet core that grows while flying, then shreds the target. */
function MurasakiOrb({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    const p = u < 0 ? ease(tp) : 1
    g.position.lerpVectors(e.from, e.to, p)
    const grow =
      u < 0 ? 0.4 + ease(tp) * 1.05 : u < 0.28 ? 1.45 + u * 2.2 : Math.max(0.0001, (1 - u) * 2.6)
    g.scale.setScalar(Math.max(0.0001, grow * e.size))
    g.rotation.y += 0.38
    g.rotation.x += 0.14
  })
  return (
    <group ref={ref}>
      <P s={S.sphere(0.58, 18, 14)} m={M.a} shadow={false} />
      <P s={S.sphere(0.3, 14, 10)} m={M.white} line={false} shadow={false} />
      <P s={S.sphere(0.72, 12, 10)} m={M.b} line={false} shadow={false} />
      <group rotation={[Math.PI / 2 - 0.25, 0, 0]}>
        <P s={S.torus(0.82, 0.07, Math.PI * 2, 32)} m={M.b} shadow={false} />
      </group>
      <group rotation={[Math.PI / 2 + 0.45, 0.55, 0]}>
        <P s={S.torus(1.05, 0.045, Math.PI * 2, 28)} m={M.a} shadow={false} />
      </group>
    </group>
  )
}

/** Ryūjin Jakka — towering flame columns that erase the entire front cell. */
function InfernoStorm({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const pillars = 7
  const jets = useMemo(
    () =>
      Array.from({ length: pillars }, (_, i) => {
        const a = (i / pillars) * Math.PI * 2 + rand(e.id, i) * 0.4
        const r = (0.15 + rand(e.id, i + 20) * 0.55) * e.size
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          h: 1.6 + rand(e.id, i + 40) * 2.4,
          w: 0.35 + rand(e.id, i + 60) * 0.55,
          lag: rand(e.id, i + 5) * 0.18,
        }
      }),
    [e.id, e.size],
  )
  const ref = useFx(e, (g, tp, u) => {
    const charge = u < 0 ? ease(tp) : 1
    g.position.copy(e.to)
    g.position.y = 0.02
    // Wall of fire racing from caster into the block during travel.
    const wall = g.children[0] as THREE.Object3D
    if (wall) {
      wall.visible = u < 0 || u < 0.35
      const p = u < 0 ? ease(tp) : 1
      wall.position.lerpVectors(
        new THREE.Vector3(e.from.x - e.to.x, 0.4, e.from.z - e.to.z),
        new THREE.Vector3(0, 0.5, 0),
        p,
      )
      const ws = Math.max(0.0001, e.size * (0.9 + p * 1.4) * (u < 0 ? 0.7 + tp * 0.5 : pop(u, 0.05, 0.55)))
      wall.scale.set(ws * 1.6, ws * (1.2 + p), ws * 0.5)
      wall.lookAt(e.from.x, wall.position.y, e.from.z)
    }
    g.children.forEach((c, i) => {
      if (i === 0) return
      const jet = jets[i - 1]
      if (!jet) return
      const local = u < 0 ? charge * (0.35 + jet.lag) : Math.min(1, Math.max(0, (u - jet.lag) / (1 - jet.lag * 0.4)))
      const rise = u < 0 ? ease(tp) * 0.45 : pop(local, 0.08, 0.45)
      c.visible = rise > 0.02
      c.position.set(jet.x, jet.h * rise * 0.5, jet.z)
      c.scale.set(
        Math.max(0.0001, jet.w * e.size * (0.7 + rise)),
        Math.max(0.0001, jet.h * rise * e.size),
        Math.max(0.0001, jet.w * e.size * (0.7 + rise)),
      )
      c.rotation.y = (u < 0 ? tp : u) * (4 + i)
    })
  })
  return (
    <group ref={ref}>
      <group>
        <P s={S.box(1.2, 0.9, 0.35, 0.08)} m={M.a} shadow={false} />
        <P s={S.box(0.7, 0.55, 0.2, 0.05)} m={M.white} line={false} shadow={false} p={[0, 0.1, 0.05]} />
      </group>
      {jets.map((_, i) => (
        <group key={i}>
          <P s={S.cone(0.35, 1, 6)} m={i % 2 ? M.a : M.b} shadow={false} />
          <P s={S.cone(0.18, 0.7, 5)} m={M.white} line={false} shadow={false} p={[0, 0.15, 0]} />
        </group>
      ))}
    </group>
  )
}

/** Charred crater burned into the pavement — fills the front block. */
function ScorchPatch({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) {
      g.scale.setScalar(0.0001)
      return
    }
    g.position.copy(e.to)
    g.position.y = 0.015
    const s = pop(u, 0.06, 0.35) * e.size * 2.4
    g.scale.set(Math.max(0.0001, s), 1, Math.max(0.0001, s * 0.92))
  })
  return (
    <group ref={ref}>
      <P s={S.cyl(0.55, 0.55, 0.02, 20)} m={M.dark} shadow={false} />
      <P s={S.cyl(0.32, 0.32, 0.018, 16)} m={M.a} line={false} shadow={false} p={[0, 0.008, 0]} />
      <P s={S.cyl(0.16, 0.16, 0.016, 12)} m={M.white} line={false} shadow={false} p={[0, 0.012, 0]} />
    </group>
  )
}

/** Scorched black line burned into the pavement along the dash. */
function ScorchLine({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    g.position.lerpVectors(e.from, e.to, 0.5)
    g.position.y = Math.min(e.from.y, e.to.y) + 0.02
    g.lookAt(e.to.x, g.position.y, e.to.z)
    const len = e.from.distanceTo(e.to)
    const w = pop(u, 0.08, 0.55)
    g.scale.set(Math.max(0.0001, w * e.size * 0.55), 1, Math.max(0.0001, len * 0.92))
  })
  return (
    <group ref={ref}>
      <P s={S.box(0.14, 0.02, 1, 0.01)} m={M.dark} shadow={false} />
      <P s={S.box(0.05, 0.015, 1, 0.008)} m={M.a} shadow={false} p={[0, 0.01, 0]} />
    </group>
  )
}

/** Point-blank lightning dump — rapid jagged arcs punching into the target. */
function BarrageBolts({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const segs = 5
  const bolts = 6
  const ref = useFx(e, (g, _tp, u) => {
    if (u < 0) return
    const frame = Math.floor(u * 28)
    const alive = u < 0.92
    g.children.forEach((bolt, b) => {
      // Staggered pulses so it reads as a barrage, not one flash.
      const pulse = (frame + b * 2) % 5
      bolt.visible = alive && pulse < 3
      const fromHand = b % 2 === 0
      let px = fromHand
        ? e.from.x + (rand(e.id + frame, b) - 0.5) * e.size * 0.3
        : e.to.x + (rand(e.id + frame, b) - 0.5) * e.size * 0.5
      let py = fromHand ? e.from.y + e.size * 0.4 : e.to.y + e.size * (1.6 + (b % 3) * 0.35)
      let pz = fromHand
        ? e.from.z + (rand(e.id + frame, b + 3) - 0.5) * e.size * 0.3
        : e.to.z + (rand(e.id + frame, b + 3) - 0.5) * e.size * 0.5
      bolt.children.forEach((seg, i) => {
        const t = (i + 1) / segs
        const nx = e.to.x + (rand(e.id + frame, b * 17 + i) - 0.5) * e.size * 0.55 * (1 - t)
        const ny = fromHand
          ? e.from.y + (e.to.y - e.from.y + e.size * 0.5) * t + (rand(e.id + frame, b * 23 + i) - 0.5) * e.size * 0.35
          : py - (e.size * 1.8) / segs
        const nz = e.to.z + (rand(e.id + frame, b * 29 + i) - 0.5) * e.size * 0.55 * (1 - t)
        const len = Math.hypot(nx - px, ny - py, nz - pz)
        seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2)
        const r = aimY(nx - px, ny - py, nz - pz)
        seg.rotation.set(r[0], r[1], r[2])
        seg.scale.set(e.size * (0.7 + (b % 2) * 0.4), Math.max(0.001, len), e.size * (0.7 + (b % 2) * 0.4))
        px = nx
        py = ny
        pz = nz
      })
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: bolts }, (_, b) => (
        <group key={b}>
          {Array.from({ length: segs }, (_, i) => (
            <group key={i}>
              <P s={S.box(0.08, 1, 0.08, 0.02)} m={i % 2 ? M.a : M.white} shadow={false} />
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

/** Blood left on the tile after a corpse vanishes; `size` is the pool radius. */
function BloodPool({ e }: { e: FxEvent }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#4e030a',
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [],
  )
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(1, 22)
    const pos = g.attributes.position
    const k = rand(e.id, 3) * 6
    for (let i = 1; i < pos.count; i++) {
      const a = Math.atan2(pos.getY(i), pos.getX(i))
      const r = 0.82 + 0.18 * Math.sin(a * 3 + k) + 0.1 * Math.sin(a * 7 + k * 2.3)
      pos.setXY(i, Math.cos(a) * r, Math.sin(a) * r)
    }
    g.rotateX(-Math.PI / 2)
    return g
  }, [e.id])
  const ref = useFx(e, (g, _tp, u) => {
    g.position.copy(e.to)
    g.scale.set(e.size, 1, e.size * 0.86)
    const m = (g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial
    m.opacity = u < 0.6 ? 0.95 : 0.95 * (1 - (u - 0.6) / 0.4)
  })
  return (
    <group ref={ref}>
      <mesh geometry={geo} material={mat} renderOrder={1} />
    </group>
  )
}

/** Yeoui — stone pillar that shrinks, then towers up and slams the target. */
function YeouiPillar({ e }: { e: FxEvent }) {
  const M = useMats(e)
  const ref = useFx(e, (g, tp, u) => {
    // Travel: shrink → grow overhead. Impact: slam down and hold huge briefly.
    const grow =
      u < 0
        ? 0.15 + ease(tp) * 2.4
        : u < 0.35
          ? 2.55 + ease(u / 0.35) * 1.1
          : 3.65 * pop(u, 0.05, 0.55)
    const height = Math.max(0.2, grow) * e.size
    const thick = (0.35 + Math.min(1.4, grow * 0.35)) * e.size
    g.position.set(e.to.x, height * 0.5 + (u < 0 ? 0.4 * (1 - tp) : 0), e.to.z)
    g.scale.set(thick, height, thick)
    g.rotation.z = (u < 0 ? (1 - tp) * 0.35 : 0) * (rand(e.id, 1) > 0.5 ? 1 : -1)
  })
  return (
    <group ref={ref}>
      <P s={S.cyl(0.5, 0.48, 1, 14)} m={M.dark} shadow={false} />
      <P s={S.cyl(0.52, 0.52, 0.08, 14)} m={M.a} shadow={false} p={[0, 0.42, 0]} />
      <P s={S.cyl(0.52, 0.52, 0.08, 14)} m={M.a} shadow={false} p={[0, -0.42, 0]} />
      <P s={S.cyl(0.28, 0.28, 1.02, 10)} m={M.b} line={false} shadow={false} />
    </group>
  )
}

// ───────────────────────── Composite fx ─────────────────────────

function FxView({ e }: { e: FxEvent }) {
  switch (e.kind) {
    case 'impact':
      return (
        <>
          <Burst e={e} spikes={10} scale={1.1} />
          <Ring e={e} radius={1.4} />
        </>
      )
    case 'fire':
      return (
        <>
          <Burst e={e} spikes={8} />
          <Debris e={e} count={12} kind="flame" />
        </>
      )
    case 'inferno':
      return (
        <>
          <InfernoStorm e={e} />
          <ScorchPatch e={e} />
          <ScorchLine e={e} />
          <Burst e={e} spikes={14} scale={1.8} />
          <Burst e={e} spikes={10} scale={1.2} mat="b" />
          <Debris e={e} count={28} kind="flame" />
          <Debris e={e} count={16} kind="smoke" />
          <Debris e={e} count={12} kind="shard" />
          <Ring e={e} ground radius={2.8} />
          <Ring e={e} ground radius={2.0} delay={0.12} />
          <Ring e={e} ground radius={1.2} delay={0.24} />
          <Ring e={e} radius={2.2} />
          <SpeedLines e={e} />
        </>
      )
    case 'shockwave':
      return (
        <>
          <Ring e={e} ground radius={2.4} />
          <Ring e={e} ground radius={1.6} delay={0.15} />
          <Debris e={e} count={10} kind="shard" />
          <Burst e={e} spikes={6} scale={0.8} />
        </>
      )
    case 'slash':
      return (
        <>
          <Slash e={e} sweeps={2} />
          <Burst e={e} spikes={6} scale={0.6} />
        </>
      )
    case 'ratioSlash':
      return (
        <>
          <Slash e={e} sweeps={3} />
          <Pierce e={e} />
          <Burst e={e} spikes={8} scale={0.75} />
          <Debris e={e} count={10} kind="shard" />
        </>
      )
    case 'sakura':
      return (
        <>
          <Slash e={e} sweeps={2} />
          <SakuraPetals e={e} count={32} />
          <Burst e={e} spikes={8} scale={0.7} />
          <Debris e={e} count={12} kind="star" />
          <Ring e={e} radius={1.15} />
        </>
      )
    case 'pierce':
      return (
        <>
          <Pierce e={e} />
          <Burst e={e} spikes={4} scale={0.5} />
        </>
      )
    case 'beam':
      return (
        <>
          <Beam e={e} />
          <Burst e={e} spikes={10} scale={1.1} />
          <Debris e={e} count={8} kind="star" />
        </>
      )
    case 'darkBeam':
      return (
        <>
          <Beam e={e} dark />
          <Gravity e={{ ...e, from: e.to }} />
          <Burst e={e} spikes={8} mat="b" />
        </>
      )
    case 'murasaki':
      return (
        <>
          <MurasakiOrb e={e} />
          <Beam e={e} />
          <Pierce e={e} />
          <ScorchLine e={e} />
          <Burst e={e} spikes={14} scale={1.25} mat="b" />
          <Debris e={e} count={16} kind="star" />
          <Ring e={e} radius={1.5} />
        </>
      )
    case 'percentBlast':
      return (
        <>
          <Beam e={e} dark />
          <Beam e={e} />
          <Pierce e={e} />
          <ScorchLine e={e} />
          <Burst e={e} spikes={16} scale={1.45} mat="b" />
          <Burst e={e} spikes={12} scale={1.1} />
          <Debris e={e} count={20} kind="shard" />
          <Debris e={e} count={14} kind="star" />
          <Ring e={e} radius={1.7} />
          <Ring e={e} ground radius={1.5} />
          <Ring e={e} ground radius={0.9} delay={0.12} />
          <SpeedLines e={e} />
        </>
      )
    case 'rings':
      return (
        <>
          <Volley e={e} count={4} shape="ring" />
          <Ring e={e} radius={1.4} />
          <Debris e={e} count={8} kind="star" />
        </>
      )
    case 'chain':
      return (
        <>
          <Chain e={e} />
          <Burst e={e} spikes={6} scale={0.7} />
        </>
      )
    case 'cards':
      return (
        <>
          <Volley e={e} count={5} shape="card" />
          <Burst e={e} spikes={8} />
        </>
      )
    case 'lightning':
      return (
        <>
          <Bolts e={e} />
          <Burst e={e} spikes={8} />
          <Ring e={e} ground radius={1.4} />
        </>
      )
    case 'voltBeam':
      return (
        <>
          <BeamBolts e={e} />
          <SpeedLines e={e} />
          <ScorchLine e={e} />
          <Bolts e={e} />
          <Burst e={e} spikes={10} />
          <Ring e={e} ground radius={1.2} />
        </>
      )
    case 'voltBarrage':
      return (
        <>
          <SpeedLines e={e} />
          <BarrageBolts e={e} />
          <Bolts e={e} />
          <Debris e={e} count={14} kind="star" />
          <Burst e={e} spikes={12} />
          <Ring e={e} ground radius={1.3} />
          <Ring e={e} ground radius={0.7} delay={0.18} />
        </>
      )
    case 'shards':
      return (
        <>
          <Debris e={e} count={14} kind="shard" />
          <Burst e={e} spikes={6} scale={0.7} />
        </>
      )
    case 'glitch':
      return (
        <>
          <Debris e={e} count={14} kind="cube" />
          <Ring e={e} radius={1.0} />
        </>
      )
    case 'sparkle':
      return (
        <>
          <Debris e={e} count={16} kind="star" />
          <Ring e={e} radius={1.2} />
        </>
      )
    case 'gravity':
      return (
        <>
          <Gravity e={e} />
          <Ring e={e} ground radius={1.8} />
          <Debris e={e} count={8} kind="shard" />
        </>
      )
    case 'magnet':
      return (
        <>
          <Volley e={{ ...e, from: e.to, to: e.from }} count={3} shape="ring" />
          <Burst e={e} spikes={8} />
        </>
      )
    case 'speed':
      return (
        <>
          <SpeedLines e={e} />
          <Burst e={e} spikes={8} />
        </>
      )
    case 'phase':
      return (
        <>
          <Ring e={e} ground radius={1.8} />
          <Ring e={e} ground radius={1.1} delay={0.12} />
          <Ring e={e} ground radius={0.6} delay={0.22} />
          <SpeedLines e={e} />
          <Debris e={e} count={10} kind="star" />
          <Burst e={e} spikes={6} scale={0.75} />
        </>
      )
    case 'portal':
      return (
        <>
          <Ring e={e} radius={1.6} />
          <Ring e={e} radius={1.05} delay={0.1} />
          <Ring e={e} radius={0.55} delay={0.2} />
          <Ring e={e} ground radius={1.4} delay={0.08} />
          <Volley e={e} count={3} shape="ring" />
          <Debris e={e} count={12} kind="star" />
          <Burst e={e} spikes={8} scale={0.85} />
        </>
      )
    case 'kunai':
      return (
        <>
          <Volley e={e} count={1} shape="kunai" />
          <KunaiTrail e={e} />
          <SpeedLines e={e} />
          <Ring e={e} radius={0.7} delay={0.02} />
          <Burst e={e} spikes={5} scale={0.45} />
        </>
      )
    case 'rasengan':
      return (
        <>
          <Rasengan e={e} />
          <Ring e={e} ground radius={2.2} />
          <Ring e={e} ground radius={1.4} delay={0.1} />
          <Ring e={e} radius={1.6} delay={0.04} />
          <Burst e={e} spikes={12} scale={1.25} />
          <Debris e={e} count={14} kind="shard" />
          <Debris e={e} count={10} kind="blood" />
          <SpeedLines e={e} />
        </>
      )
    case 'bullet':
      return (
        <>
          <Volley e={e} count={3} shape="bullet" />
          <Pierce e={e} />
          <SpeedLines e={e} />
          <Ring e={e} radius={1.1} />
          <Ring e={e} ground radius={1.0} delay={0.08} />
          <Burst e={e} spikes={8} scale={0.85} />
          <Debris e={e} count={8} kind="star" />
        </>
      )
    case 'feather':
      return (
        <>
          <Volley e={e} count={5} shape="feather" />
          <Pierce e={e} />
          <SpeedLines e={e} />
          <Ring e={e} radius={1.2} />
          <Ring e={e} radius={0.7} delay={0.1} />
          <Ring e={e} ground radius={1.05} delay={0.06} />
          <Burst e={e} spikes={10} scale={0.9} />
          <Debris e={e} count={12} kind="star" />
        </>
      )
    case 'babylon':
      return (
        <>
          <BabylonGates e={e} count={9} />
          <Slash e={e} sweeps={3} />
          <Pierce e={e} />
          <SpeedLines e={e} />
          <Ring e={e} radius={1.35} />
          <Ring e={e} radius={0.8} delay={0.12} />
          <Ring e={e} ground radius={1.2} delay={0.08} />
          <Burst e={e} spikes={12} scale={1.05} />
          <Debris e={e} count={14} kind="shard" />
          <Debris e={e} count={10} kind="blood" />
        </>
      )
    case 'overhaul':
      // Touch → body deconstructs: crimson burst, flying shards, arterial spray.
      return (
        <>
          <Burst e={e} spikes={16} scale={1.35} />
          <Ring e={e} radius={1.6} />
          <Ring e={e} radius={1.0} delay={0.08} />
          <Ring e={e} ground radius={1.5} delay={0.05} />
          <Gravity e={{ ...e, from: e.to }} />
          <Debris e={e} count={22} kind="shard" />
          <Debris e={e} count={18} kind="blood" />
          <Debris e={e} count={8} kind="smoke" />
        </>
      )
    case 'chainsaw':
      // Revving blades — multi-sweep cuts, arterial spray, metal shards.
      return (
        <>
          <Slash e={e} sweeps={4} />
          <SpeedLines e={e} />
          <Burst e={e} spikes={14} scale={1.15} />
          <Ring e={e} radius={1.3} />
          <Ring e={e} ground radius={1.15} delay={0.06} />
          <Debris e={e} count={16} kind="shard" />
          <Debris e={e} count={20} kind="blood" />
        </>
      )
    case 'kagune':
      // Rinkaku flurry — crimson sweeps, arterial spray, total carve.
      return (
        <>
          <Slash e={e} sweeps={5} />
          <SpeedLines e={e} />
          <Burst e={e} spikes={16} scale={1.25} />
          <Ring e={e} radius={1.45} />
          <Ring e={e} ground radius={1.25} delay={0.05} />
          <Debris e={e} count={18} kind="shard" />
          <Debris e={e} count={26} kind="blood" />
        </>
      )
    case 'yeoui':
      // Yeoui grows from a needle to a tower, then crushes the pad.
      return (
        <>
          <YeouiPillar e={e} />
          <SpeedLines e={e} />
          <Burst e={e} spikes={14} scale={1.4} />
          <Ring e={e} radius={1.8} />
          <Ring e={e} ground radius={2.6} />
          <Ring e={e} ground radius={1.8} delay={0.1} />
          <Ring e={e} ground radius={1.1} delay={0.2} />
          <Debris e={e} count={22} kind="shard" />
          <Debris e={e} count={10} kind="smoke" />
        </>
      )
    case 'wind':
      // Razor air blades — green crescents cut the pad.
      return (
        <>
          <WindBlades e={e} />
          <Slash e={e} sweeps={2} />
          <SpeedLines e={e} />
          <Ring e={e} radius={1.15} />
          <Ring e={e} ground radius={1.0} delay={0.06} />
          <Burst e={e} spikes={8} scale={0.8} />
          <Debris e={e} count={10} kind="star" />
        </>
      )
    case 'whirlwind':
      // Spirit Dive cyclone — spinning green vortex + blade shreds.
      return (
        <>
          <Whirl e={e} />
          <WindBlades e={e} />
          <Slash e={e} sweeps={3} />
          <SpeedLines e={e} />
          <Ring e={e} radius={1.5} />
          <Ring e={e} radius={0.9} delay={0.1} />
          <Ring e={e} ground radius={1.6} delay={0.05} />
          <Burst e={e} spikes={12} scale={1.1} />
          <Debris e={e} count={16} kind="star" />
          <Debris e={e} count={10} kind="shard" />
        </>
      )
    case 'getsuga':
      // Final Getsuga — dark-dimension crescent that swallows the pad.
      return (
        <>
          <Beam e={e} dark />
          <Gravity e={{ ...e, from: e.to }} />
          <Slash e={e} sweeps={3} />
          <SpeedLines e={e} />
          <ScorchLine e={e} />
          <Burst e={e} spikes={14} scale={1.35} mat="b" />
          <Burst e={e} spikes={10} scale={1.0} />
          <Debris e={e} count={18} kind="shard" />
          <Debris e={e} count={12} kind="smoke" />
          <Ring e={e} radius={1.7} />
          <Ring e={e} ground radius={1.5} />
          <Ring e={e} ground radius={0.9} delay={0.14} />
        </>
      )
    case 'sand':
      // Gaara / Shukaku — granular waves bury the pad, then crush.
      return (
        <>
          <Ring e={e} ground radius={2.0} />
          <Ring e={e} ground radius={1.35} delay={0.1} />
          <Ring e={e} ground radius={0.75} delay={0.2} />
          <Gravity e={{ ...e, from: e.to }} />
          <SpeedLines e={e} />
          <Burst e={e} spikes={10} scale={1.05} />
          <Debris e={e} count={18} kind="smoke" />
          <Debris e={e} count={14} kind="shard" />
          <Debris e={e} count={8} kind="star" />
        </>
      )
    case 'hit':
      return (
        <>
          <Burst e={e} spikes={6} scale={0.45} />
          <Debris e={e} count={7} kind="blood" />
        </>
      )
    case 'bloodPool':
      return <BloodPool e={e} />
    case 'poof':
      return <Debris e={e} count={9} kind="smoke" />
    case 'poofSparkle':
      return <Debris e={e} count={18} kind="star" />
    case 'poofShards':
      return (
        <>
          <Debris e={e} count={18} kind="shard" />
          <Debris e={e} count={5} kind="smoke" />
        </>
      )
  }
}

export function FxLayer({ events }: { events: FxEvent[] }) {
  return (
    <group>
      {events.map((e) => (
        <FxView key={e.id} e={e} />
      ))}
    </group>
  )
}
