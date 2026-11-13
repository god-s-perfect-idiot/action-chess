import type { ReactNode } from 'react'
import type * as THREE from 'three'
import type { Ctx } from './Outfit'
import { sides } from './Outfit'
import { P } from './Part'
import type { BoneName } from './rig'
import { aimY, dirFrom, S } from './shapes'

type V3 = [number, number, number]

/** All head-slot coordinates are relative to the head center. */
export function buildHead(c: Ctx) {
  const { pr, M, add } = c
  const r = pr.headR
  const covered =
    c.has('blankMask') ||
    c.has('smileMask') ||
    c.has('engineVents') ||
    c.has('kanekiMask') ||
    c.has('shukakuAwaken') ||
    c.has('dominoMask')

  if (!c.has('shukakuAwaken')) {
    add('head', <P s={S.sphere(r, 20, 16)} m={M.skin} sc={[0.96, 1, 0.98]} />)
    add('head', <P s={S.sphere(r * 0.74, 16, 12)} m={M.skin} p={[0, -r * 0.36, r * 0.16]} sc={[0.86, 0.78, 0.8]} />)
    sides((s) =>
      add('head', <P s={S.sphere(r * 0.2, 10, 8)} m={M.skin} p={[s * r * 0.9, -r * 0.1, -r * 0.04]} sc={[0.5, 1, 0.8]} />),
    )
  }
  if (!covered) {
    buildFace(c)
  }
  if (!c.has('shukakuAwaken')) buildHair(c)
  buildHeadgear(c)
}

function faceZ(r: number, x: number, y: number): number {
  const a = x / (0.96 * r)
  const b = y / r
  return 0.98 * r * Math.sqrt(Math.max(0, 1 - a * a - b * b))
}

function buildFace(c: Ctx) {
  const { d, pr, M, add } = c
  const r = pr.headR
  const f = d.face
  const ex = r * 0.36
  const ey = -r * 0.1
  const ez = faceZ(r, ex, ey)

  // ── Eyes ──
  if (f.eyes !== 'hidden') {
    sides((s) => {
      const yaw = s * 0.36
      const at: V3 = [s * ex, ey, ez - r * 0.02]
      const items: ReactNode[] = []
      const push = (n: ReactNode) => items.push(<group key={items.length}>{n}</group>)
      if (f.eyes === 'closed') {
        push(<P s={S.torus(r * 0.15, r * 0.028, Math.PI, 10)} m={M.ink} line={false} p={[0, r * 0.02, r * 0.04]} r={[0, 0, Math.PI]} />)
      } else {
        const tall =
          f.eyes === 'round' ? 1.2 : f.eyes === 'sharp' ? 0.72 : f.eyes === 'sleepy' ? 0.6 : f.eyes === 'fierce' ? 0.82 : 1
        const scleraMat = f.eyes === 'glow' ? M.ink : M.white
        push(<P s={S.sphere(r * 0.2, 14, 10)} m={scleraMat} p={[0, 0, 0]} sc={[0.88, tall, 0.28]} shadow={false} />)
        const irisMat = f.eyes === 'glow' ? M.glow : M.iris
        const irisS = f.eyes === 'fierce' ? 0.6 : f.eyes === 'glow' ? 0.78 : 0.72
        push(<P s={S.sphere(r * 0.2 * irisS, 12, 10)} m={irisMat} line={false} shadow={false} p={[s * -r * 0.01, -r * 0.015, r * 0.04]} sc={[0.82, Math.min(tall, 1.1), 0.3]} />)
        if (f.eyes !== 'glow') {
          push(<P s={S.sphere(r * 0.06, 10, 8)} m={M.ink} line={false} shadow={false} p={[s * -r * 0.01, -r * 0.02, r * 0.058]} sc={[0.8, 1.1, 0.3]} />)
          push(<P s={S.sphere(r * 0.04, 8, 6)} m={M.white} line={false} shadow={false} p={[s * r * 0.04, r * 0.05 * tall, r * 0.07]} sc={[1, 1, 0.3]} />)
        } else {
          push(<P s={S.sphere(r * 0.05, 8, 6)} m={M.glowAlt} line={false} shadow={false} p={[0, 0, r * 0.07]} sc={[1, 1.3, 0.3]} />)
        }
        const lashTilt = f.eyes === 'sharp' ? 0.3 : f.eyes === 'fierce' ? -0.25 : f.eyes === 'sleepy' ? 0.05 : 0.15
        const lashY = f.eyes === 'sleepy' ? r * 0.04 : r * 0.2 * tall * 0.95
        push(<P s={S.box(r * 0.44, r * 0.07, r * 0.07, r * 0.03)} m={M.ink} line={false} shadow={false} p={[s * r * 0.01, lashY, r * 0.05]} r={[0, 0, s * lashTilt]} />)
        if (f.eyes === 'sleepy') {
          push(<P s={S.box(r * 0.4, r * 0.12, r * 0.06, r * 0.03)} m={M.skinShade} line={false} shadow={false} p={[0, r * 0.11, r * 0.035]} />)
        }
        if (pr.fem && f.eyes !== 'fierce') {
          push(<P s={S.box(r * 0.1, r * 0.04, r * 0.04, r * 0.015)} m={M.ink} line={false} shadow={false} p={[s * r * 0.22, lashY + r * 0.01, r * 0.04]} r={[0, 0, s * 0.6]} />)
        }
      }
      add('eyes', <group position={at} rotation={[0.06, yaw, 0]}>{items}</group>)
    })
  }

  // ── Brows ──
  if (f.brows !== 'none') {
    sides((s) => {
      const tilt =
        f.brows === 'angry' ? s * 0.38 : f.brows === 'raised' ? -s * 0.2 : f.brows === 'soft' ? -s * 0.08 : 0
      const by = ey + r * (f.brows === 'raised' ? 0.42 : 0.33)
      const bx = s * ex * 0.95
      add(
        'head',
        <P
          s={S.box(r * 0.36, r * 0.06, r * 0.05, r * 0.025)}
          m={M.hairShade}
          line={false}
          shadow={false}
          p={[bx, by, faceZ(r, bx, by) + r * 0.005]}
          r={[-0.2, s * 0.35, tilt]}
        />,
      )
    })
  }

  // ── Nose ──
  add('head', <P s={S.sphere(r * 0.045, 8, 6)} m={M.skinShade} line={false} shadow={false} p={[0, -r * 0.3, faceZ(r, 0, -r * 0.3) + r * 0.01]} sc={[0.7, 1, 0.6]} />)

  // ── Mouth ──
  const my = -r * 0.52
  const mz = faceZ(r, 0, my) + r * 0.005
  switch (f.mouth) {
    case 'line':
      add('head', <P s={S.box(r * 0.22, r * 0.035, r * 0.03, r * 0.012)} m={M.ink} line={false} shadow={false} p={[0, my, mz]} />)
      break
    case 'smile':
      add('head', <P s={S.torus(r * 0.12, r * 0.025, Math.PI, 10)} m={M.ink} line={false} shadow={false} p={[0, my + r * 0.07, mz - r * 0.02]} r={[0.2, 0, Math.PI]} />)
      break
    case 'grin':
      add('head', <P s={S.sphere(r * 0.16, 12, 8)} m={M.mouth} line={false} shadow={false} p={[0, my, mz - r * 0.04]} sc={[1.1, 0.5, 0.35]} />)
      add('head', <P s={S.box(r * 0.28, r * 0.05, r * 0.03, r * 0.015)} m={M.white} line={false} shadow={false} p={[0, my + r * 0.04, mz + r * 0.008]} />)
      break
    case 'frown':
      add('head', <P s={S.torus(r * 0.11, r * 0.025, Math.PI, 10)} m={M.ink} line={false} shadow={false} p={[0, my - r * 0.06, mz - r * 0.02]} r={[-0.2, 0, 0]} />)
      break
    case 'open':
      add('head', <P s={S.sphere(r * 0.1, 10, 8)} m={M.mouth} line={false} shadow={false} p={[0, my, mz - r * 0.02]} sc={[1, 0.9, 0.35]} />)
      break
    case 'fang':
      add('head', <P s={S.box(r * 0.26, r * 0.035, r * 0.03, r * 0.012)} m={M.ink} line={false} shadow={false} p={[0, my, mz]} />)
      sides((s) =>
        add('head', <P s={S.cone(r * 0.03, r * 0.08, 4)} m={M.white} line={false} shadow={false} p={[s * r * 0.08, my - r * 0.04, mz]} r={[Math.PI, 0, 0]} />),
      )
      break
    case 'none':
      break
  }

  // ── Marks ──
  for (const mark of f.marks ?? []) {
    switch (mark) {
      case 'freckles':
        sides((s) => {
          for (let i = 0; i < 3; i++) {
            const x = s * (r * 0.32 + i * r * 0.07)
            const y = -r * (0.3 + (i % 2) * 0.05)
            add('head', <P s={S.sphere(r * 0.02, 6, 4)} m={d.hair === 'antenna' ? M.glow : M.mouth} line={false} shadow={false} p={[x, y, faceZ(r, x, y) + r * 0.004]} />)
          }
        })
        break
      case 'blush':
        sides((s) => {
          const x = s * r * 0.45
          const y = -r * 0.32
          add('head', <P s={S.sphere(r * 0.1, 10, 6)} m={M.mouth} line={false} shadow={false} p={[x, y, faceZ(r, x, y) - r * 0.02]} sc={[1.2, 0.5, 0.25]} r={[0, s * 0.45, 0]} />)
        })
        break
      case 'soot': {
        const x = -r * 0.5
        const y = -r * 0.36
        add('head', <P s={S.sphere(r * 0.12, 10, 6)} m={M.skinShade} line={false} shadow={false} p={[x, y, faceZ(r, x, y) - r * 0.03]} sc={[1.3, 0.6, 0.3]} r={[0, -0.5, 0.3]} />)
        break
      }
      case 'scarBrow': {
        const x = r * 0.38
        const y = r * 0.18
        add('head', <P s={S.box(r * 0.05, r * 0.38, r * 0.03, r * 0.015)} m={M.mouth} line={false} shadow={false} p={[x, y, faceZ(r, x, y) + r * 0.004]} r={[0, 0.36, -0.25]} />)
        break
      }
      case 'scarCheek': {
        const x = -r * 0.48
        const y = -r * 0.34
        add('head', <P s={S.box(r * 0.3, r * 0.04, r * 0.03, r * 0.015)} m={M.mouth} line={false} shadow={false} p={[x, y, faceZ(r, x, y) + r * 0.004]} r={[0, -0.5, 0.5]} />)
        break
      }
      case 'scarEye': {
        // Todo — jagged vertical slash over the left eye (brow → cheek).
        const x = -r * 0.34
        ;[
          [r * 0.42, r * 0.55, -0.15],
          [r * 0.06, r * 0.48, 0.08],
          [-r * 0.28, r * 0.42, -0.12],
        ].forEach(([y, h, tip]) => {
          add(
            'head',
            <P
              s={S.box(r * 0.045, h, r * 0.028, r * 0.012)}
              m={M.mouth}
              line={false}
              shadow={false}
              p={[x + tip * r * 0.15, y, faceZ(r, x, y) + r * 0.006]}
              r={[0, -0.35, tip]}
            />,
          )
        })
        break
      }
      case 'scarCross': {
        // Yamamoto — crossed forehead scars.
        const y = r * 0.42
        const z = faceZ(r, 0, y) + r * 0.01
        add('head', <P s={S.box(r * 0.55, r * 0.045, r * 0.03, r * 0.012)} m={M.mouth} line={false} shadow={false} p={[0, y, z]} r={[0, 0, 0.55]} />)
        add('head', <P s={S.box(r * 0.55, r * 0.045, r * 0.03, r * 0.012)} m={M.mouth} line={false} shadow={false} p={[0, y, z]} r={[0, 0, -0.55]} />)
        break
      }
      case 'nosePaint':
        add('head', <P s={S.box(r * 1.2, r * 0.07, r * 0.05, r * 0.02)} m={M.accent} line={false} shadow={false} p={[0, -r * 0.24, faceZ(r, 0, -r * 0.24) - r * 0.04]} />)
        break
      case 'hawkMarks':
        // Small triangular under-eye marks (bird-of-prey).
        sides((s) => {
          const x = s * r * 0.38
          const y = -r * 0.28
          add(
            'head',
            <P
              s={S.cone(r * 0.055, r * 0.1, 3)}
              m={M.ink}
              line={false}
              shadow={false}
              p={[x, y, faceZ(r, x, y) + r * 0.01]}
              r={[Math.PI / 2 + 0.35, 0, s * 0.15]}
            />,
          )
        })
        break
      case 'sonicMarks':
        // Speed-o'-Sonic — horizontal purple teardrops under each eye.
        sides((s) => {
          const x = s * r * 0.36
          const y = -r * 0.26
          const z = faceZ(r, x, y) + r * 0.01
          add(
            'head',
            <P
              s={S.box(r * 0.16, r * 0.055, r * 0.03, r * 0.02)}
              m={M.accent}
              line={false}
              shadow={false}
              p={[x, y, z]}
              r={[0, s * 0.35, s * 0.08]}
            />,
          )
          add(
            'head',
            <P
              s={S.sphere(r * 0.04, 8, 6)}
              m={M.accent}
              line={false}
              shadow={false}
              p={[x + s * r * 0.08, y - r * 0.01, z + r * 0.002]}
              sc={[1.4, 0.7, 0.5]}
            />,
          )
        })
        break
      case 'circuit':
        sides((s) => {
          const x = s * r * 0.55
          const y = -r * 0.35
          add('head', <P s={S.box(r * 0.04, r * 0.3, r * 0.02, r * 0.01)} m={M.glow} line={false} shadow={false} p={[x, y, faceZ(r, x, y)]} r={[0, s * 0.55, 0]} />)
          add('head', <P s={S.box(r * 0.2, r * 0.04, r * 0.02, r * 0.01)} m={M.glow} line={false} shadow={false} p={[x * 0.85, y - r * 0.15, faceZ(r, x * 0.85, y - r * 0.15)]} r={[0, s * 0.5, 0]} />)
        })
        break
      case 'thread':
        sides((s) => {
          const x = s * r * 0.4
          const y = -r * 0.36
          add('head', <P s={S.box(r * 0.025, r * 0.26, r * 0.02, r * 0.01)} m={M.accent} line={false} shadow={false} p={[x, y, faceZ(r, x, y) + r * 0.004]} r={[0, s * 0.4, s * 0.15]} />)
        })
        break
    }
  }
}

// ───────────────────────── Hair ─────────────────────────

function buildHair(c: Ctx) {
  const { d, pr, M, add } = c
  const r = pr.headR
  const hair = M.hair
  const alt = M.hairShade

  /** Scalp shell tilted back so the hairline sits above the brows and the face stays clear. */
  const cap = (sc = 1.08, oy = 0.12, oz = -0.1, m: THREE.Material = hair, squash: V3 = [1, 1, 1]) =>
    add(
      'head',
      <P s={S.dome(r * sc, Math.PI * 0.58)} m={m} p={[0, r * oy, r * oz]} r={[-0.42, 0, 0]} sc={squash} />,
    )

  /** Cone rooted on the scalp at (yaw,pitch), pointing toward (dyaw,dpitch). */
  const lock = (
    yaw: number,
    pitch: number,
    dyaw: number,
    dpitch: number,
    len: number,
    rad: number,
    m: THREE.Material = hair,
    bone: BoneName = 'head',
    at = 1.0,
    flat = 1,
  ) => {
    const o = dirFrom(yaw, pitch)
    const v = dirFrom(dyaw, dpitch)
    const base: V3 = [o[0] * r * at, o[1] * r * at + r * 0.06, o[2] * r * at]
    if (bone === 'hairBack') {
      base[1] -= r * 0.3
      base[2] += r * 0.6
    }
    const pos: V3 = [base[0] + (v[0] * len * r) / 2, base[1] + (v[1] * len * r) / 2, base[2] + (v[2] * len * r) / 2]
    add(bone, <P s={S.cone(rad * r, len * r, 6)} m={m} p={pos} r={aimY(v[0], v[1], v[2])} sc={[1, 1, flat]} />)
  }
  const spike = (yaw: number, pitch: number, len: number, rad: number, m: THREE.Material = hair, at = 0.9) =>
    lock(yaw, pitch, yaw, pitch, len, rad, m, 'head', at)
  const bangs = (yaws: number[], len = 0.62, rad = 0.2, m: THREE.Material = hair, droop = -72) =>
    yaws.forEach((y) => lock(y, 42, y * 0.6, droop, len, rad, m, 'head', 0.98, 0.55))

  switch (d.hair) {
    case 'spiky':
      cap()
      ;[
        [0, 80, 0.9],
        [40, 60, 0.85],
        [-40, 60, 0.85],
        [100, 45, 0.8],
        [-100, 45, 0.8],
        [150, 40, 0.85],
        [-150, 40, 0.85],
        [180, 55, 0.9],
        [70, 72, 0.75],
        [-70, 72, 0.75],
      ].forEach(([y, p, l]) => spike(y, p, l, 0.3))
      bangs([-28, 0, 28], 0.6, 0.22)
      lock(10, 50, 10, -55, 0.5, 0.15, alt, 'head', 0.98, 0.5)
      break
    case 'staticUp':
      // Wind-swept Quicksilver silhouette — short locks standing / swept up by charge.
      cap(1.05, 0.1, -0.08)
      ;[
        [0, 78, 0.95],
        [22, 72, 0.9],
        [-22, 72, 0.9],
        [48, 68, 0.82],
        [-48, 68, 0.82],
        [78, 58, 0.7],
        [-78, 58, 0.7],
        [120, 52, 0.65],
        [-120, 52, 0.65],
        [155, 62, 0.75],
        [-155, 62, 0.75],
        [180, 70, 0.85],
      ].forEach(([y, p, l], i) => spike(y, p, l, i % 3 === 0 ? 0.2 : 0.26, i % 2 ? alt : hair))
      // Forward upswept fringe.
      ;[
        [-18, 62, 0.55],
        [0, 68, 0.6],
        [18, 62, 0.55],
      ].forEach(([y, p, l]) => spike(y, p, l, 0.16, hair, 0.98))
      ;[
        [10, 88, 0.4],
        [-14, 90, 0.38],
      ].forEach(([y, p, l]) => spike(y, p, l, 0.1, alt, 1.02))
      break
    case 'messy':
      cap(1.07)
      ;[
        [20, 75, 0.5],
        [-50, 65, 0.5],
        [120, 50, 0.55],
        [-120, 50, 0.55],
        [170, 35, 0.5],
        [70, 40, 0.45],
      ].forEach(([y, p, l]) => spike(y, p, l, 0.28))
      bangs([-35, -10, 18], 0.55, 0.22, hair, -60)
      break
    case 'undercut':
      cap(1.02, 0.05, -0.05, alt)
      add('head', <P s={S.sphere(r * 0.85, 14, 10)} m={hair} p={[r * 0.12, r * 0.55, -r * 0.05]} sc={[1.15, 0.6, 1.2]} r={[0, 0, -0.25]} />)
      lock(20, 60, -40, -40, 0.85, 0.28, hair, 'head', 0.95, 0.5)
      lock(60, 55, 80, 10, 0.6, 0.2, hair, 'head', 0.95, 0.6)
      break
    case 'buzz':
      cap(1.02, 0.07, -0.06, alt)
      break
    case 'bun':
      cap(1.08, 0.12, -0.12)
      add('head', <P s={S.sphere(r * 0.42, 14, 10)} m={hair} p={[0, r * 0.62, -r * 0.72]} />)
      add('head', <P s={S.torus(r * 0.3, r * 0.06, Math.PI * 2, 14)} m={M.accent} p={[0, r * 0.52, -r * 0.62]} r={[0.9, 0, 0]} />)
      sides((s) => lock(s * 70, 20, s * 75, -85, 1.05, 0.14, hair, 'head', 0.98, 0.55))
      bangs([-30, -10, 10, 30], 0.5, 0.16)
      break
    case 'manBun':
      // High messy man-bun — pulled back, top knot, dark band.
      cap(1.06, 0.1, -0.1)
      add('head', <P s={S.sphere(r * 0.48, 14, 10)} m={hair} p={[0, r * 0.95, -r * 0.18]} sc={[1.05, 0.95, 1.05]} />)
      add('head', <P s={S.sphere(r * 0.28, 12, 8)} m={alt} p={[0, r * 1.12, -r * 0.12]} sc={[1.1, 0.7, 1.0]} />)
      add('head', <P s={S.torus(r * 0.28, r * 0.05, Math.PI * 2, 14)} m={M.trim} p={[0, r * 0.78, -r * 0.16]} r={[1.1, 0, 0]} />)
      lock(-25, 55, -20, -40, 0.55, 0.16, hair, 'head', 0.98, 0.45)
      lock(20, 50, 15, -35, 0.5, 0.14, alt, 'head', 0.98, 0.45)
      bangs([-18, 0, 18], 0.35, 0.12, hair, -40)
      for (let i = -2; i <= 2; i++) lock(i * 28 + 180, 25, i * 28 + 180, -70, 0.7, 0.18, hair, 'hairBack', 0.95, 0.55)
      break
    case 'bob':
      cap(1.12, 0.1, -0.08)
      add('head', <P s={S.sphere(r * 1.1, 16, 12)} m={hair} p={[0, -r * 0.08, -r * 0.3]} sc={[1.1, 0.95, 0.9]} />)
      bangs([-40, -20, 0, 20, 40], 0.5, 0.18)
      sides((s) => lock(s * 80, 10, s * 85, -80, 0.7, 0.3, hair, 'head', 1.0, 0.6))
      lock(-30, 45, -30, -60, 0.45, 0.1, alt, 'head', 1.01, 0.5)
      break
    case 'bowl':
      // Mob — flatter mop/bowl; covers forehead and ears without afro bulk.
      cap(1.08, 0.08, -0.08, hair, [1.0, 0.86, 1.0])
      add('head', <P s={S.sphere(r * 0.94, 16, 12)} m={hair} p={[0, -r * 0.05, -r * 0.2]} sc={[1.02, 0.8, 0.94]} />)
      bangs([-42, -22, -6, 6, 22, 42], 0.5, 0.17, hair, -78)
      sides((s) => {
        lock(s * 78, 8, s * 88, -88, 0.68, 0.22, hair, 'head', 1.0, 0.6)
        lock(s * 95, 16, s * 100, -70, 0.4, 0.14, alt, 'head', 0.98, 0.48)
      })
      for (let i = -2; i <= 2; i++) lock(i * 28 + 180, 14, i * 28 + 180, -48, 0.4, 0.14, hair, 'hairBack', 0.92, 0.5)
      break
    case 'coverEye':
      cap(1.12, 0.1, -0.08)
      lock(-20, 55, 25, -65, 1.0, 0.36, hair, 'head', 1.0, 0.45)
      lock(10, 60, 30, -60, 0.9, 0.25, hair, 'head', 1.02, 0.45)
      bangs([-40, -25], 0.45, 0.18)
      for (let i = -2; i <= 2; i++) lock(i * 30 + 180, 20, i * 30 + 180, -82, 1.0, 0.28, hair, 'hairBack', 0.95, 0.7)
      sides((s) => lock(s * 85, 15, s * 90, -80, 0.85, 0.22, alt, 'head', 1.0, 0.6))
      break
    case 'long':
    case 'hime': {
      cap(1.1, 0.12, -0.1)
      const backLen = d.hair === 'hime' ? 3.6 : 4.2
      add(
        'hairBack',
        <P s={S.panel(r * 1.8, r * backLen, r * 0.34, -r * 0.5)} m={hair} p={[0, -r * backLen * 0.42, -r * 0.3]} r={[0.08, 0, 0]} />,
      )
      if (d.hair === 'hime') {
        add('head', <P s={S.box(r * 1.55, r * 0.34, r * 0.3, r * 0.1)} m={hair} p={[0, r * 0.55, r * 0.68]} r={[0.35, 0, 0]} />)
        sides((s) =>
          add('head', <P s={S.box(r * 0.3, r * 1.9, r * 0.2, r * 0.08)} m={hair} p={[s * r * 0.86, -r * 0.65, r * 0.2]} />),
        )
      } else {
        bangs([-35, -12, 12, 35], 0.62, 0.22)
        sides((s) => lock(s * 70, 25, s * 72, -86, 1.7, 0.24, hair, 'head', 0.98, 0.55))
        lock(-15, 50, -15, -70, 0.55, 0.1, alt, 'head', 1.0, 0.5)
      }
      break
    }
    case 'twinTails':
      cap(1.1, 0.12, -0.1)
      bangs([-36, -14, 8, 30], 0.6, 0.2)
      sides((s) => {
        add('hairBack', <P s={S.sphere(r * 0.24, 10, 8)} m={M.accent} p={[s * r * 0.9, r * 0.55, r * 0.35]} />)
        add('hairBack', <P s={S.cone(r * 0.5, r * 3.2, 8)} m={hair} p={[s * r * 1.35, -r * 1.0, r * 0.2]} r={[Math.PI - 0.08, 0, s * 0.28]} />)
        add('hairBack', <P s={S.cone(r * 0.25, r * 2.0, 6)} m={alt} p={[s * r * 1.5, -r * 1.3, r * 0.05]} r={[Math.PI - 0.05, 0, s * 0.18]} sc={[1, 1, 0.6]} />)
        add('hairBack', <P s={S.box(r * 0.3, r * 0.22, r * 0.12, r * 0.05)} m={M.accent} p={[s * r * 1.08, r * 0.62, r * 0.32]} r={[0, 0, s * 0.5]} />)
      })
      break
    case 'mohawk': {
      cap(1.02, 0.05, -0.05, alt)
      // Ridge of spikes along the sagittal arc, front → back.
      const arc = (t: number): [number, number] => (t <= 90 ? [0, t] : [180, 180 - t])
      for (let i = 0; i < 7; i++) {
        const t = 35 + i * 20
        const [oy, op] = arc(t)
        const [dy, dp] = arc(Math.min(t + 25, 175))
        lock(oy, op, dy, dp, 1.05 - Math.abs(i - 2) * 0.1, 0.2, i % 2 ? alt : hair, 'head', 0.92, 0.45)
      }
      break
    }
    case 'slicked':
      cap(1.07, 0.1, -0.14, hair, [1, 0.95, 1.12])
      lock(160, 40, 175, -10, 0.7, 0.3, hair)
      lock(-160, 40, -175, -10, 0.7, 0.3, hair)
      lock(180, 20, 180, -40, 0.6, 0.26, hair)
      lock(15, 50, 30, -70, 0.45, 0.06, alt, 'head', 1.0, 0.6)
      break
    case 'sweptBack':
      cap(1.07, 0.1, -0.1)
      ;[
        [0, 65],
        [30, 55],
        [-30, 55],
        [60, 40],
        [-60, 40],
        [0, 40],
      ].forEach(([y, p], i) =>
        lock(y, p, 180 - y * 0.3, 18 + i * 3, 1.0 + (i % 2) * 0.2, 0.26, i === 0 ? alt : hair, 'head', 0.95),
      )
      bangs([20], 0.55, 0.16)
      break
    case 'pomp':
      // Hakari — tall wavy pompadour swept up and back.
      cap(1.12, 0.14, -0.16, hair, [1.05, 1.18, 1.08])
      ;[
        [0, 82, 1.35],
        [18, 78, 1.25],
        [-18, 78, 1.25],
        [36, 70, 1.1],
        [-36, 70, 1.1],
        [55, 58, 0.95],
        [-55, 58, 0.95],
        [0, 68, 1.15],
      ].forEach(([y, p, l], i) =>
        lock(y, p, 175 - y * 0.25, 8 + i * 2, l, 0.3, i % 3 === 0 ? alt : hair, 'head', 0.98, 0.55),
      )
      ;[
        [80, 48, 0.85],
        [-80, 48, 0.85],
        [120, 42, 0.75],
        [-120, 42, 0.75],
        [155, 50, 0.8],
        [-155, 50, 0.8],
      ].forEach(([y, p, l], i) => lock(y, p, y, -20 - (i % 2) * 8, l, 0.26, i % 2 ? alt : hair, 'hairBack', 0.95))
      bangs([-22, 0, 22], 0.48, 0.14)
      break
    case 'mane':
      cap(1.1, 0.12, -0.12)
      for (let i = 0; i < 9; i++) {
        const yaw = 100 + i * 20
        lock(yaw, 25, yaw, -45, 1.3 + (i % 2) * 0.3, 0.32, i % 3 === 0 ? alt : hair, 'hairBack', 0.95)
      }
      ;[
        [0, 80],
        [45, 62],
        [-45, 62],
        [90, 45],
        [-90, 45],
      ].forEach(([y, p]) => spike(y, p, 0.8, 0.3))
      bangs([-30, 0, 30], 0.7, 0.22)
      break
    case 'antenna':
      cap(1.08)
      ;[
        [0, 75],
        [60, 55],
        [-60, 55],
        [130, 45],
        [-130, 45],
        [180, 40],
      ].forEach(([y, p]) => spike(y, p, 0.65, 0.26))
      sides((s) => {
        lock(s * 25, 70, s * 25, 82, 1.4, 0.1, alt, 'head', 0.95)
        const tip = dirFrom(s * 25, 82)
        const base = dirFrom(s * 25, 70)
        add(
          'head',
          <P s={S.sphere(r * 0.09, 8, 6)} m={M.glow} shadow={false} p={[base[0] * r * 0.95 + tip[0] * r * 1.4, base[1] * r * 0.95 + r * 0.06 + tip[1] * r * 1.4, base[2] * r * 0.95 + tip[2] * r * 1.4]} />,
        )
      })
      bangs([-25, 5, 30], 0.55, 0.2)
      break
    case 'twinTuft':
      // All Might — two tall vertical antenna tufts, short sides, shadowed brow fringe.
      cap(1.05, 0.1, -0.08)
      sides((s) => {
        spike(s * 10, 92, 1.25, 0.16)
        spike(s * 16, 84, 1.0, 0.13, alt)
        spike(s * 22, 74, 0.7, 0.11)
      })
      ;[
        [90, 42, 0.45],
        [-90, 42, 0.45],
        [130, 38, 0.4],
        [-130, 38, 0.4],
        [180, 48, 0.5],
      ].forEach(([y, p, l]) => spike(y, p, l, 0.18))
      bangs([-22, 0, 22], 0.42, 0.16, hair, -58)
      break
    case 'fringe':
      cap(1.08)
      lock(10, 50, 45, -62, 1.0, 0.34, hair, 'head', 1.0, 0.45)
      lock(35, 48, 55, -55, 0.85, 0.26, hair, 'head', 1.0, 0.45)
      lock(-25, 50, -20, -70, 0.6, 0.2, alt, 'head', 1.0, 0.45)
      ;[
        [160, 30],
        [-160, 30],
        [180, 10],
        [130, 20],
        [-130, 20],
      ].forEach(([y, p]) => lock(y, p, y, -40, 0.7, 0.28, hair))
      break
    case 'shaggy':
      cap(1.1, 0.1, -0.08)
      for (let i = 0; i < 10; i++) {
        const yaw = -180 + i * 36
        lock(yaw, 35, yaw, -55, 0.75 + (i % 3) * 0.12, 0.28, i % 4 === 0 ? alt : hair, 'head', 0.98, 0.7)
      }
      bangs([-38, -14, 10, 34], 0.68, 0.2, hair, -66)
      spike(30, 75, 0.5, 0.26)
      spike(-60, 70, 0.45, 0.24)
      break
    case 'braid':
    case 'braids': {
      cap(1.08, 0.12, -0.1)
      bangs([-30, -5, 22], 0.55, 0.2)
      const twin = d.hair === 'braids'
      const xs = twin ? [1, -1] : [0]
      for (const s of xs) {
        for (let i = 0; i < 6; i++) {
          const sz = r * (0.22 - i * 0.015)
          add(
            'hairBack',
            <P s={S.sphere(sz, 10, 8)} m={i % 2 ? alt : hair} p={[s * r * (0.55 + i * 0.03), -r * (0.2 + i * 0.32), -r * 0.05 - i * r * 0.02]} sc={[1, 1.25, 1]} />,
          )
        }
        add(
          'hairBack',
          <P s={S.sphere(r * 0.12, 8, 6)} m={twin ? M.glow : M.accent} p={[s * r * 0.75, -r * 2.2, -r * 0.18]} />,
        )
      }
      break
    }
    case 'feathers':
      cap(1.07, 0.1, -0.1)
      for (let i = 0; i < 7; i++) {
        const yaw = -90 + i * 30
        const v = dirFrom(180 - yaw * 0.25, 35 - Math.abs(yaw) * 0.12)
        const o = dirFrom(yaw * 0.5, 55)
        add(
          'head',
          <P s={S.shard(r * 0.14, r * 0.62, r * 0.05)} m={i % 2 ? alt : hair} p={[o[0] * r + v[0] * r * 0.55, o[1] * r + r * 0.06 + v[1] * r * 0.55, o[2] * r * 0.6 + v[2] * r * 0.55]} r={aimY(v[0], v[1], v[2])} />,
        )
      }
      bangs([-20, 15], 0.6, 0.18)
      break
    case 'angular':
      cap(1.05, 0.08, -0.08)
      add('head', <P s={S.box(r * 1.9, r * 0.5, r * 1.9, r * 0.06)} m={hair} p={[0, r * 0.62, -r * 0.08]} r={[0.1, 0.785, 0]} />)
      add('head', <P s={S.box(r * 0.9, r * 0.3, r * 0.3, r * 0.05)} m={alt} p={[-r * 0.3, r * 0.42, r * 0.8]} r={[0.5, 0, 0.25]} />)
      sides((s) => add('head', <P s={S.box(r * 0.2, r * 0.8, r * 0.5, r * 0.05)} m={hair} p={[s * r * 0.92, 0, -r * 0.1]} />))
      break
    case 'fluffy':
      cap(1.12, 0.1, -0.08)
      ;[
        [0, 70],
        [60, 45],
        [-60, 45],
        [120, 30],
        [-120, 30],
        [180, 35],
        [90, 0],
        [-90, 0],
      ].forEach(([y, p]) => {
        const v = dirFrom(y, p)
        add('head', <P s={S.sphere(r * 0.5, 12, 10)} m={hair} p={[v[0] * r * 0.85, v[1] * r * 0.85 + r * 0.08, v[2] * r * 0.85 - r * 0.08]} />)
      })
      bangs([-30, 0, 30], 0.5, 0.24)
      break
    case 'none':
      break
  }
}

// ───────────────────────── Headgear ─────────────────────────

function buildHeadgear(c: Ctx) {
  const { pr, M, add, has } = c
  const r = pr.headR
  const ey = -r * 0.1

  if (has('hood')) {
    add('head', <P s={S.sphereCut(r * 1.32, 1.7, Math.PI * 0.82)} m={M.primary} p={[0, r * 0.12, -r * 0.14]} r={[-0.25, 0, 0]} />)
    add('head', <P s={S.sphereCut(r * 1.28, 1.7, Math.PI * 0.82)} m={M.lining} line={false} p={[0, r * 0.12, -r * 0.14]} r={[-0.25, 0, 0]} />)
    add('head', <P s={S.cone(r * 0.45, r * 0.7, 8)} m={M.primary} p={[0, r * 0.4, -r * 1.3]} r={[-2.2, 0, 0]} />)
  }
  if (has('helmet')) {
    add('head', <P s={S.dome(r * 1.16, Math.PI * 0.55)} m={M.trim} p={[0, r * 0.02, -r * 0.03]} />)
    add('head', <P s={S.torus(r * 1.0, r * 0.1, Math.PI * 1.1, 18)} m={M.accent} p={[0, r * 0.55, r * 0.15]} r={[-1.1, 0, -Math.PI * 0.05]} />)
    add('head', <P s={S.box(r * 0.25, r * 0.5, r * 0.12, r * 0.05)} m={M.accent} p={[0, r * 1.08, 0]} />)
    sides((s) => add('head', <P s={S.cyl(r * 0.3, r * 0.3, r * 0.14, 12)} m={M.accent} p={[s * r * 0.98, -r * 0.05, 0]} r={[0, 0, Math.PI / 2]} />))
  }
  if (has('engineVents')) {
    // Revs knight-engine helm — white shell, dark slit visor, jaw vents, ear fins.
    add('head', <P s={S.sphere(r * 1.12, 18, 14)} m={M.primary} p={[0, r * 0.02, 0]} sc={[0.98, 1.05, 1.02]} />)
    add('head', <P s={S.sphere(r * 0.78, 14, 12)} m={M.primary} p={[0, -r * 0.42, r * 0.12]} sc={[0.92, 0.82, 0.88]} />)
    add('head', <P s={S.box(r * 1.05, r * 0.22, r * 0.18, r * 0.06)} m={M.dark} p={[0, r * 0.08, r * 0.88]} />)
    add('head', <P s={S.box(r * 0.72, r * 0.08, r * 0.06, r * 0.02)} m={M.ink} line={false} p={[0, r * 0.1, r * 0.98]} />)
    for (let i = -1; i <= 1; i++) {
      add(
        'head',
        <P s={S.box(r * 0.05, r * 0.22, r * 0.04, r * 0.015)} m={M.metal} line={false} p={[i * r * 0.16, -r * 0.42, r * 0.78]} />,
      )
    }
    sides((s) => {
      add('head', <P s={S.box(r * 0.18, r * 0.42, r * 0.28, r * 0.05)} m={M.primary} p={[s * r * 0.78, r * 0.55, -r * 0.15]} r={[0.15, s * 0.35, s * -0.55]} />)
      add('head', <P s={S.box(r * 0.08, r * 0.22, r * 0.12, r * 0.03)} m={M.metal} p={[s * r * 0.92, r * 0.72, -r * 0.22]} r={[0.2, s * 0.4, s * -0.6]} />)
      add('head', <P s={S.box(r * 0.12, r * 0.28, r * 0.1, r * 0.03)} m={M.metal} line={false} p={[s * r * 0.95, -r * 0.05, r * 0.15]} />)
    })
    add('neck', <P s={S.cyl(0.04 * Math.sqrt(pr.limb), 0.05 * Math.sqrt(pr.limb), pr.neck * 0.85, 12)} m={M.primary} p={[0, pr.neck * 0.35, 0]} />)
    add('neck', <P s={S.box(0.09, 0.07, 0.06, 0.02)} m={M.secondary} p={[0, pr.neck * 0.15, 0.035]} />)
  }
  if (has('goggles')) {
    add('head', <P s={S.torus(r * 1.03, r * 0.06, Math.PI * 2, 24)} m={M.trim} p={[0, r * 0.42, -r * 0.05]} r={[Math.PI / 2 + 0.35, 0, 0]} />)
    sides((s) => {
      const x = s * r * 0.36
      const y = r * 0.58
      add('head', <P s={S.cyl(r * 0.24, r * 0.24, r * 0.16, 14)} m={M.metal} p={[x, y, faceZ(r, x, y) + r * 0.06]} r={[Math.PI / 2 - 0.5, 0, 0]} />)
      add('head', <P s={S.cyl(r * 0.19, r * 0.19, r * 0.04, 14)} m={M.glow} line={false} p={[x, y + r * 0.04, faceZ(r, x, y) + r * 0.14]} r={[Math.PI / 2 - 0.5, 0, 0]} />)
    })
  }
  if (has('blankMask') || has('smileMask')) {
    const smile = has('smileMask')
    add('head', <P s={S.sphere(r * 0.9, 16, 12)} m={M.light} p={[0, -r * 0.1, r * 0.3]} sc={[0.95, 1.08, 0.78]} />)
    if (smile) {
      add('head', <P s={S.torus(r * 0.34, r * 0.05, Math.PI, 14)} m={M.ink} line={false} p={[0, -r * 0.3, r * 0.95]} r={[0.25, 0, Math.PI]} />)
      for (let i = -2; i <= 2; i++) {
        add('head', <P s={S.box(r * 0.03, r * 0.12, r * 0.03, r * 0.01)} m={M.ink} line={false} p={[i * r * 0.12, -r * 0.47 + Math.abs(i) * r * 0.05, r * 0.93]} />)
      }
      sides((s) => {
        add('head', <P s={S.torus(r * 0.12, r * 0.035, Math.PI, 10)} m={M.ink} line={false} p={[s * r * 0.33, r * 0.02, r * 0.97]} r={[0, s * 0.3, 0]} />)
        add('head', <P s={S.sphere(r * 0.08, 8, 6)} m={M.accent} line={false} p={[s * r * 0.48, -r * 0.24, r * 0.88]} sc={[1.3, 0.6, 0.3]} />)
      })
    } else {
      add('head', <P s={S.box(r * 0.5, r * 0.025, r * 0.02, r * 0.01)} m={M.ink} line={false} p={[0, ey, r * 1.0]} />)
      add('head', <P s={S.box(r * 0.03, r * 0.3, r * 0.02, r * 0.01)} m={M.ink} line={false} p={[r * 0.3, r * 0.3, r * 0.92]} r={[0.3, 0.3, 0.4]} />)
    }
  }
  if (has('qMask')) {
    add('head', <P s={S.box(r * 1.72, r * 0.48, r * 0.2, r * 0.1)} m={M.primary} p={[0, ey + r * 0.04, r * 0.76]} />)
    add('head', <P s={S.torus(r * 0.1, r * 0.025, Math.PI * 1.4, 10)} m={M.accent} line={false} p={[r * 0.68, ey + r * 0.12, r * 0.88]} r={[0, 0.5, -0.6]} />)
    add('head', <P s={S.box(r * 0.025, r * 0.1, r * 0.02, r * 0.01)} m={M.accent} line={false} p={[r * 0.66, ey - r * 0.06, r * 0.88]} r={[0, 0.5, 0]} />)
    add('head', <P s={S.sphere(r * 0.025, 6, 4)} m={M.accent} line={false} p={[r * 0.66, ey - r * 0.16, r * 0.86]} />)
  }
  if (has('visor')) {
    add('head', <P s={S.torus(r * 0.95, r * 0.13, Math.PI * 1.15, 20)} m={M.glow} p={[0, ey + r * 0.02, -r * 0.02]} r={[Math.PI / 2, 0, Math.PI * 0.07 + Math.PI]} sc={[1, 1, 0.8]} />)
    add('head', <P s={S.box(r * 0.25, r * 0.05, r * 0.05, r * 0.02)} m={M.trim} line={false} p={[0, ey + r * 0.02, r * 1.07]} />)
  }
  if (has('speedGoggles')) {
    // Speed — wraparound amber goggles (no cowl); dark frame, glow lenses.
    add('head', <P s={S.box(r * 1.65, r * 0.2, r * 0.14, r * 0.06)} m={M.trim} p={[0, ey + r * 0.06, r * 0.72]} />)
    add('head', <P s={S.box(r * 0.18, r * 0.1, r * 0.06, r * 0.03)} m={M.trim} line={false} p={[0, ey + r * 0.04, faceZ(r, 0, ey) + r * 0.1]} />)
    sides((s) => {
      const x = s * r * 0.36
      const y = ey + r * 0.02
      const z = faceZ(r, x, y)
      add('head', <P s={S.box(r * 0.5, r * 0.2, r * 0.08, r * 0.05)} m={M.trim} p={[x, y, z + r * 0.05]} r={[0, s * 0.3, s * 0.05]} />)
      add(
        'head',
        <P
          s={S.box(r * 0.4, r * 0.13, r * 0.04, r * 0.03)}
          m={M.glow}
          line={false}
          shadow={false}
          p={[x, y + r * 0.01, z + r * 0.12]}
          r={[0, s * 0.3, 0]}
        />,
      )
      add('head', <P s={S.box(r * 0.22, r * 0.12, r * 0.1, r * 0.04)} m={M.trim} line={false} p={[s * r * 0.78, y, r * 0.35]} r={[0, s * 0.9, 0]} />)
    })
  }
  if (has('redRushCowl')) {
    // Red Rush — open-face cowl in primary (same maroon as the suit) + scarlet goggles.
    add('head', <P s={S.sphere(r * 1.1, 18, 14)} m={M.primary} p={[0, r * 0.08, -r * 0.02]} sc={[1.02, 0.92, 1.04]} />)
    add('head', <P s={S.sphere(r * 1.06, 16, 12)} m={M.primary} p={[0, r * 0.32, -r * 0.06]} sc={[0.98, 0.62, 1.0]} />)
    sides((s) => {
      add('head', <P s={S.box(r * 0.4, r * 0.95, r * 0.7, r * 0.12)} m={M.primary} p={[s * r * 0.72, r * 0.02, -r * 0.02]} r={[0.08, s * 0.12, s * 0.04]} />)
      add('head', <P s={S.box(r * 0.26, r * 0.55, r * 0.38, r * 0.09)} m={M.primary} p={[s * r * 0.82, r * 0.18, -r * 0.3]} r={[0.2, s * 0.35, s * -0.1]} />)
    })
    // Neck gaiter — stops above the chin so the mouth reads open-face.
    add('head', <P s={S.sphere(r * 0.78, 12, 10)} m={M.primary} p={[0, -r * 0.48, -r * 0.02]} sc={[0.88, 0.55, 0.82]} />)
    add('neck', <P s={S.cyl(0.042 * Math.sqrt(pr.limb), 0.05 * Math.sqrt(pr.limb), pr.neck * 0.9, 12)} m={M.primary} p={[0, pr.neck * 0.32, 0]} />)
    // Wraparound goggle band + glowing scarlet lenses.
    add('head', <P s={S.box(r * 1.65, r * 0.2, r * 0.14, r * 0.06)} m={M.primary} p={[0, ey + r * 0.06, r * 0.72]} />)
    add('head', <P s={S.box(r * 0.18, r * 0.1, r * 0.06, r * 0.03)} m={M.primary} line={false} p={[0, ey + r * 0.04, faceZ(r, 0, ey) + r * 0.1]} />)
    sides((s) => {
      const x = s * r * 0.36
      const y = ey + r * 0.02
      const z = faceZ(r, x, y)
      add('head', <P s={S.box(r * 0.5, r * 0.2, r * 0.08, r * 0.05)} m={M.accent} p={[x, y, z + r * 0.05]} r={[0, s * 0.3, s * 0.05]} />)
      add(
        'head',
        <P
          s={S.box(r * 0.4, r * 0.13, r * 0.04, r * 0.03)}
          m={M.glow}
          line={false}
          shadow={false}
          p={[x, y + r * 0.01, z + r * 0.12]}
          r={[0, s * 0.3, 0]}
        />,
      )
      // Side wing of the wraparound lens.
      add('head', <P s={S.box(r * 0.22, r * 0.12, r * 0.1, r * 0.04)} m={M.accent} line={false} p={[s * r * 0.78, y, r * 0.35]} r={[0, s * 0.9, 0]} />)
    })
  }
  if (has('dominoMask')) {
    // Speedster cowl — full face/jaw/cheek wrap. Manhattan keeps an open crown for red spikes.
    const manhattan = has('manhattanMark')
    // Zoom — hollow black voids instead of white Flash lenses.
    const voidLenses = !manhattan && c.d.face.eyes === 'hidden'
    // Reverse Flash — red Negative Speed Force glow lenses.
    const voltGlow = !manhattan && c.d.face.eyes === 'glow'
    add('head', <P s={S.sphere(r * 1.12, 18, 14)} m={M.primary} p={[0, -r * 0.04, r * 0.02]} sc={[1.02, 1.0, 1.06]} />)
    if (!manhattan) {
      // Classic Flash / Reverse Flash / Zoom — sealed crown (no hair breakout).
      add('head', <P s={S.sphere(r * 1.08, 16, 12)} m={M.primary} p={[0, r * 0.28, -r * 0.04]} sc={[1.0, 0.72, 1.02]} />)
    }
    add('head', <P s={S.sphere(r * 0.86, 14, 12)} m={M.primary} p={[0, -r * 0.42, r * 0.16]} sc={[0.92, 0.8, 0.9]} />)
    // Brow ridge + bridge over the lenses.
    add('head', <P s={S.box(r * 1.55, r * 0.28, r * 0.22, r * 0.1)} m={M.primary} p={[0, ey + r * 0.22, r * 0.78]} />)
    sides((s) => {
      add('head', <P s={S.box(r * 0.42, r * 1.1, r * 0.78, r * 0.14)} m={M.primary} p={[s * r * 0.74, -r * 0.06, r * 0.06]} r={[0.06, s * 0.1, s * 0.04]} />)
      add('head', <P s={S.box(r * 0.28, r * 0.6, r * 0.42, r * 0.1)} m={M.primary} p={[s * r * 0.84, r * 0.12, -r * 0.28]} r={[0.18, s * 0.38, s * -0.12]} />)
      // Winged ear bolts — accent (gold / red / cyan / blue via palette).
      add('head', <P s={S.box(r * 0.08, r * 0.22, r * 0.28, r * 0.03)} m={M.accent} line={false} p={[s * r * 1.05, r * 0.28, -r * 0.08]} r={[0.2, s * 0.4, s * -0.55]} />)
      add('head', <P s={S.box(r * 0.05, r * 0.12, r * 0.14, r * 0.02)} m={M.glow} line={false} shadow={false} p={[s * r * 1.1, r * 0.36, -r * 0.12]} r={[0.25, s * 0.45, s * -0.6]} />)
    })
    // Eye lenses — glow for Manhattan / Reverse Flash; void pits for Zoom; white plates for classic scarlet.
    const lensFrame = manhattan ? M.secondary : voidLenses || voltGlow ? M.trim : M.metal
    const lensGlow = manhattan || voltGlow ? M.glow : voidLenses ? M.ink : M.metal
    sides((s) => {
      const x = s * r * 0.34
      const y = ey + r * 0.02
      const z = faceZ(r, x, y)
      add('head', <P s={S.box(r * 0.48, r * 0.22, r * 0.08, r * 0.06)} m={lensFrame} p={[x, y, z + r * 0.06]} r={[0, s * 0.28, s * 0.06]} />)
      add(
        'head',
        <P
          s={S.box(r * 0.38, r * 0.14, r * 0.04, r * 0.03)}
          m={lensGlow}
          line={false}
          shadow={false}
          p={[x, y + r * 0.01, z + r * 0.13]}
          r={[0, s * 0.28, 0]}
        />,
      )
    })
    add('head', <P s={S.box(r * 0.16, r * 0.08, r * 0.04, r * 0.02)} m={lensFrame} line={false} p={[0, ey + r * 0.04, faceZ(r, 0, ey) + r * 0.08]} />)
    if (manhattan) {
      // Dr. Manhattan forehead mark — circle + nucleus.
      add('head', <P s={S.cyl(r * 0.12, r * 0.12, r * 0.04, 14)} m={M.glow} line={false} shadow={false} p={[0, r * 0.42, faceZ(r, 0, r * 0.42) + r * 0.06]} r={[Math.PI / 2, 0, 0]} />)
      add('head', <P s={S.cyl(r * 0.04, r * 0.04, r * 0.03, 10)} m={M.metal} line={false} shadow={false} p={[0, r * 0.42, faceZ(r, 0, r * 0.42) + r * 0.09]} r={[Math.PI / 2, 0, 0]} />)
    }
  }
  if (has('shades')) {
    sides((s) => {
      const x = s * r * 0.36
      add('head', <P s={S.box(r * 0.56, r * 0.3, r * 0.08, r * 0.08)} m={M.dark} p={[x, ey, faceZ(r, x, ey) + r * 0.04]} r={[0, s * 0.32, 0]} />)
      add('head', <P s={S.box(r * 0.36, r * 0.05, r * 0.02, r * 0.02)} m={M.glowAlt} line={false} p={[x + s * r * 0.03, ey + r * 0.07, faceZ(r, x, ey) + r * 0.09]} r={[0, s * 0.32, -0.4]} />)
      add('head', <P s={S.box(r * 0.5, r * 0.04, r * 0.04, r * 0.02)} m={M.dark} line={false} p={[s * r * 0.8, ey + r * 0.02, r * 0.3]} r={[0, s * 1.3, 0]} />)
    })
    add('head', <P s={S.box(r * 0.2, r * 0.05, r * 0.05, r * 0.02)} m={M.dark} line={false} p={[0, ey + r * 0.05, faceZ(r, 0, ey) + r * 0.05]} />)
  }
  if (has('roundShades')) {
    sides((s) => {
      const x = s * r * 0.36
      const z = faceZ(r, x, ey) + r * 0.06
      add('head', <P s={S.cyl(r * 0.22, r * 0.22, r * 0.04, 16)} m={M.dark} p={[x, ey, z]} r={[Math.PI / 2, 0, s * 0.0]} />)
      add('head', <P s={S.torus(r * 0.22, r * 0.035, Math.PI * 2, 16)} m={M.glow} line={false} p={[x, ey, z + r * 0.02]} />)
    })
  }
  if (has('headset')) {
    add('head', <P s={S.torus(r * 1.02, r * 0.04, Math.PI, 18)} m={M.trim} p={[0, r * 0.05, -r * 0.05]} r={[0, 0, 0]} />)
    add('head', <P s={S.cyl(r * 0.24, r * 0.24, r * 0.12, 12)} m={M.trim} p={[-r * 0.98, -r * 0.08, 0]} r={[0, 0, Math.PI / 2]} />)
    add('head', <P s={S.cyl(r * 0.025, r * 0.025, r * 0.8, 6)} m={M.trim} line={false} p={[-r * 0.78, -r * 0.4, r * 0.4]} r={[1.1, 0, 0.5]} />)
    add('head', <P s={S.sphere(r * 0.08, 8, 6)} m={M.glow} p={[-r * 0.4, -r * 0.55, r * 0.78]} />)
  }
  if (has('tiara')) {
    add('head', <P s={S.torus(r * 0.85, r * 0.04, Math.PI, 16)} m={M.metal} p={[0, r * 0.68, r * 0.1]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    for (let i = -1; i <= 1; i++) {
      add('head', <P s={S.cone(r * 0.09, r * (i === 0 ? 0.38 : 0.24), 4)} m={M.metal} p={[i * r * 0.32, r * (0.86 + (i === 0 ? 0.08 : 0)), r * 0.68 - Math.abs(i) * r * 0.1]} r={[0.25, 0, -i * 0.2]} />)
    }
    add('head', <P s={S.shard(r * 0.08, r * 0.12, r * 0.05)} m={M.glow} p={[0, r * 0.8, r * 0.82]} r={[0.25, 0, 0]} />)
  }
  if (has('halo')) {
    add('head', <P s={S.cyl(r * 1.25, r * 1.25, r * 0.06, 28)} m={M.ink} p={[0, r * 0.4, -r * 1.25]} r={[Math.PI / 2, 0, 0]} />)
    add('head', <P s={S.torus(r * 1.38, r * 0.09, Math.PI * 2, 32)} m={M.glow} shadow={false} p={[0, r * 0.4, -r * 1.25]} />)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      add('head', <P s={S.cone(r * 0.1, r * 0.45, 4)} m={M.glow} shadow={false} line={false} p={[Math.cos(a) * r * 1.65, r * 0.4 + Math.sin(a) * r * 1.65, -r * 1.27]} r={[0, 0, a - Math.PI / 2]} />)
    }
  }
  if (has('veil')) {
    add('head', <P s={S.sphereCut(r * 1.22, 2.0, Math.PI * 0.6)} m={M.trim} p={[0, r * 0.18, -r * 0.1]} r={[-0.3, 0, 0]} />)
    add('hairBack', <P s={S.panel(r * 2.2, r * 5.5, r * 0.12, -r * 0.8)} m={M.trim} p={[0, -r * 2.4, -r * 0.65]} r={[0.12, 0, 0]} />)
    add('head', <P s={S.torus(r * 1.0, r * 0.05, Math.PI * 2, 20)} m={M.metal} line={false} p={[0, r * 0.42, -r * 0.05]} r={[Math.PI / 2 + 0.3, 0, 0]} />)
  }
  if (has('antennaClips')) {
    sides((s) => {
      add('head', <P s={S.cyl(r * 0.03, r * 0.03, r * 0.9, 6)} m={M.trim} p={[s * r * 0.4, r * 1.25, r * 0.15]} r={[0.3, 0, -s * 0.35]} />)
      add('head', <P s={S.shard(r * 0.22, r * 0.4, r * 0.06)} m={M.accent} p={[s * r * 0.62, r * 1.62, r * 0.32]} r={[0.5, 0, -s * 0.9]} />)
    })
  }
  if (has('hairPin')) {
    add('head', <P s={S.cyl(r * 0.035, r * 0.035, r * 1.6, 6)} m={M.metal} p={[r * 0.1, r * 0.75, -r * 0.7]} r={[0.2, 0, -1.0]} />)
    add('head', <P s={S.sphere(r * 0.1, 8, 6)} m={M.accent} p={[r * 0.72, r * 1.15, -r * 0.6]} />)
    add('head', <P s={S.cyl(r * 0.015, r * 0.015, r * 0.5, 4)} m={M.metal} line={false} p={[r * 0.72, r * 0.85, -r * 0.6]} />)
  }
  if (has('mouthguard')) {
    add('head', <P s={S.box(r * 0.42, r * 0.2, r * 0.12, r * 0.06)} m={M.accent} p={[0, -r * 0.5, faceZ(r, 0, -r * 0.5) + r * 0.03]} />)
    sides((s) =>
      add('head', <P s={S.box(r * 0.6, r * 0.05, r * 0.05, r * 0.02)} m={M.trim} line={false} p={[s * r * 0.55, -r * 0.45, r * 0.55]} r={[0, s * 0.9, 0.2 * s]} />),
    )
  }
}
