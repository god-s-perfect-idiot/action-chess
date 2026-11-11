import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  CELL_SIZE,
  FILES,
  PERSON_HEIGHT,
  RANKS,
  squareToCoords,
  type Square,
} from '../game/types'
import { WATER_Y, groundY } from './terrainHeight'
import { hash01, PALETTE } from './toon'

function colored(
  geo: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
): THREE.BufferGeometry {
  geo.translate(x, y, z)
  const n = geo.attributes.position.count
  const data = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    data[i * 3] = color.r
    data[i * 3 + 1] = color.g
    data[i * 3 + 2] = color.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(data, 3))
  return geo
}

function mergeAndDispose(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (parts.length === 0) {
    const empty = new THREE.BufferGeometry()
    empty.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3))
    empty.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3))
    return empty
  }
  const merged = mergeGeometries(parts)
  parts.forEach((g) => g.dispose())
  return merged ?? parts[0]!
}

function rotY(geo: THREE.BufferGeometry, yaw: number) {
  if (yaw) geo.rotateY(yaw)
  return geo
}

type Kind = 'rock' | 'stump' | 'shrub' | 'tree'

/**
 * Scatter rocks, stumps, shrubs, and small trees across board cells.
 * Props hug cell corners/edges so fighter centers stay clear.
 */
export function buildBoardForest() {
  const solid: THREE.BufferGeometry[] = []
  const soft: THREE.BufferGeometry[] = []

  const bark = new THREE.Color('#5c4330')
  const barkDark = new THREE.Color('#3e2e20')
  const barkLite = new THREE.Color('#7a5a40')
  const stone = new THREE.Color('#8a8478')
  const stoneDark = new THREE.Color('#6a645c')
  const stoneLite = new THREE.Color('#9a9488')
  const moss = new THREE.Color(PALETTE.moss)
  const mossLite = new THREE.Color(PALETTE.mossLite)
  const leaf = new THREE.Color(PALETTE.leaf)
  const leafDark = new THREE.Color('#3a5834')

  const pushRock = (x: number, z: number, s: number, seed: number) => {
    const base = groundY(x, z)
    const count = 1 + Math.floor(hash01(seed) * 3)
    for (let i = 0; i < count; i++) {
      const rw = PERSON_HEIGHT * s * (0.22 + hash01(seed + i * 3) * 0.35)
      const rh = PERSON_HEIGHT * s * (0.12 + hash01(seed + i * 5) * 0.22)
      const rd = PERSON_HEIGHT * s * (0.18 + hash01(seed + i * 7) * 0.3)
      const ox = (hash01(seed + i * 11) - 0.5) * PERSON_HEIGHT * s * 0.55
      const oz = (hash01(seed + i * 13) - 0.5) * PERSON_HEIGHT * s * 0.55
      const yaw = hash01(seed + i * 17) * Math.PI * 2
      const col =
        hash01(seed + i) > 0.66 ? stoneLite : hash01(seed + i) > 0.33 ? stone : stoneDark
      solid.push(
        colored(
          rotY(new THREE.BoxGeometry(rw, rh, rd), yaw),
          x + ox,
          base + rh * 0.42,
          z + oz,
          col,
        ),
      )
      if (hash01(seed + i * 19) > 0.55) {
        soft.push(
          colored(
            new THREE.SphereGeometry(Math.min(rw, rd) * 0.35, 5, 4),
            x + ox,
            base + rh * 0.85,
            z + oz,
            moss,
          ),
        )
      }
    }
  }

  const pushStump = (x: number, z: number, s: number, seed: number) => {
    const base = groundY(x, z)
    const r = PERSON_HEIGHT * s * (0.16 + hash01(seed) * 0.1)
    const h = PERSON_HEIGHT * s * (0.22 + hash01(seed + 1) * 0.28)
    const barkCol = hash01(seed + 2) > 0.5 ? bark : barkDark
    solid.push(colored(new THREE.CylinderGeometry(r * 0.92, r * 1.08, h, 7), x, base + h / 2, z, barkCol))
    // Cut face
    soft.push(
      colored(
        new THREE.CylinderGeometry(r * 0.88, r * 0.88, PERSON_HEIGHT * 0.04, 8),
        x,
        base + h + PERSON_HEIGHT * 0.01,
        z,
        barkLite,
      ),
    )
    // Growth rings hint
    soft.push(
      colored(
        new THREE.TorusGeometry(r * 0.45, PERSON_HEIGHT * 0.012, 4, 10).rotateX(Math.PI / 2),
        x,
        base + h + PERSON_HEIGHT * 0.03,
        z,
        barkDark,
      ),
    )
    if (hash01(seed + 4) > 0.4) {
      soft.push(
        colored(
          new THREE.SphereGeometry(r * 0.55, 5, 4),
          x + r * 0.55,
          base + h * 0.35,
          z - r * 0.2,
          mossLite,
        ),
      )
    }
    // Broken root nub
    if (hash01(seed + 5) > 0.45) {
      const yaw = hash01(seed + 6) * Math.PI * 2
      const root = new THREE.CylinderGeometry(r * 0.22, r * 0.35, r * 1.4, 5)
      root.rotateZ(Math.PI / 2.4)
      root.rotateY(yaw)
      solid.push(
        colored(root, x + Math.cos(yaw) * r * 0.9, base + r * 0.2, z + Math.sin(yaw) * r * 0.9, barkCol),
      )
    }
  }

  const pushShrub = (x: number, z: number, s: number, seed: number) => {
    const base = groundY(x, z)
    const layers = 2 + Math.floor(hash01(seed) * 2)
    // Knee-high clumps — stay well under a fighter
    const scale = PERSON_HEIGHT * s * (0.12 + hash01(seed + 1) * 0.08)
    for (let i = 0; i < layers; i++) {
      const r = scale * (0.38 + hash01(seed + i * 3) * 0.28) * (1 - i * 0.08)
      soft.push(
        colored(
          new THREE.SphereGeometry(r, 6, 5),
          x + (hash01(seed + i * 5) - 0.5) * scale * 0.45,
          base + scale * (0.22 + i * 0.2),
          z + (hash01(seed + i * 7) - 0.5) * scale * 0.45,
          i % 2 ? leaf : leafDark,
        ),
      )
    }
  }

  /** Short understory tree — low enough not to hide the fight. */
  const pushSmallTree = (x: number, z: number, s: number, seed: number) => {
    const base = groundY(x, z)
    const trunkH = PERSON_HEIGHT * s * (0.85 + hash01(seed) * 0.75)
    const trunkR = PERSON_HEIGHT * s * (0.07 + hash01(seed + 1) * 0.05)
    const lean = (hash01(seed + 2) - 0.5) * 0.1
    const barkCol = hash01(seed + 3) > 0.5 ? bark : barkDark
    const trunk = new THREE.CylinderGeometry(trunkR * 0.7, trunkR * 1.15, trunkH, 6)
    trunk.rotateZ(lean)
    solid.push(colored(trunk, x, base + trunkH / 2, z, barkCol))

    const canopy = PERSON_HEIGHT * s * (0.55 + hash01(seed + 4) * 0.45)
    const cy = base + trunkH + canopy * 0.12
    if (hash01(seed + 5) > 0.45) {
      soft.push(
        colored(
          new THREE.ConeGeometry(canopy * 0.8, canopy * 1.35, 7),
          x + lean * trunkH * 0.45,
          cy + canopy * 0.1,
          z,
          leafDark,
        ),
      )
      soft.push(
        colored(
          new THREE.ConeGeometry(canopy * 0.5, canopy * 0.8, 6),
          x + lean * trunkH * 0.45,
          cy + canopy * 0.65,
          z,
          leaf,
        ),
      )
    } else {
      soft.push(
        colored(
          new THREE.SphereGeometry(canopy * 0.65, 6, 5),
          x + lean * trunkH * 0.35,
          cy,
          z,
          leaf,
        ),
      )
      soft.push(
        colored(
          new THREE.SphereGeometry(canopy * 0.42, 5, 4),
          x + canopy * 0.28,
          cy + canopy * 0.2,
          z - canopy * 0.12,
          leafDark,
        ),
      )
    }
  }

  const pickKind = (seed: number): Kind => {
    const r = hash01(seed)
    if (r < 0.28) return 'rock'
    if (r < 0.48) return 'stump'
    if (r < 0.78) return 'shrub'
    return 'tree'
  }

  const place = (kind: Kind, x: number, z: number, s: number, seed: number) => {
    if (kind === 'rock') pushRock(x, z, s, seed)
    else if (kind === 'stump') pushStump(x, z, s, seed)
    else if (kind === 'shrub') pushShrub(x, z, s, seed)
    else pushSmallTree(x, z, s, seed)
  }

  /** Corner / edge offsets — leave the cell middle free for fighters. */
  const cornerOf = (seed: number): [number, number] => {
    const corner = Math.floor(hash01(seed) * 4)
    const reach = CELL_SIZE * (0.28 + hash01(seed + 1) * 0.1)
    const jitter = CELL_SIZE * 0.06
    const jx = (hash01(seed + 2) - 0.5) * jitter
    const jz = (hash01(seed + 3) - 0.5) * jitter
    const sx = corner === 0 || corner === 3 ? -1 : 1
    const sz = corner < 2 ? -1 : 1
    return [sx * reach + jx, sz * reach + jz]
  }

  let cellIndex = 0
  for (const file of FILES) {
    for (const rank of RANKS) {
      const square = `${file}${rank}` as Square
      const [cx, cz] = squareToCoords(square)
      const seed = cellIndex * 17 + 41
      cellIndex++

      // Keep the river channel and submerged banks clear
      const gy = groundY(cx, cz)
      if (gy < WATER_Y + 0.35) continue
      if (Math.abs(cx) < CELL_SIZE * 0.85) continue

      // Sparse enough to read as woods, not a thicket
      if (hash01(seed) < 0.38) continue

      const [ox, oz] = cornerOf(seed + 5)
      const x = cx + ox
      const z = cz + oz
      if (groundY(x, z) < WATER_Y + 0.28) continue

      const kind = pickKind(seed + 9)
      const scale = 0.85 + hash01(seed + 11) * 0.45
      place(kind, x, z, scale, seed + 13)

      // Occasional second prop in another corner (rock + shrub pairs read well)
      if (hash01(seed + 19) > 0.62) {
        const [ox2, oz2] = cornerOf(seed + 23)
        // Prefer opposite side of the cell
        const x2 = cx - Math.sign(ox || 1) * Math.abs(ox2)
        const z2 = cz - Math.sign(oz || 1) * Math.abs(oz2)
        if (groundY(x2, z2) < WATER_Y + 0.28) continue
        const kind2: Kind = hash01(seed + 29) > 0.55 ? 'rock' : 'shrub'
        place(kind2, x2, z2, 0.7 + hash01(seed + 31) * 0.35, seed + 33)
      }
    }
  }

  return {
    solid: mergeAndDispose(solid),
    soft: mergeAndDispose(soft),
  }
}
