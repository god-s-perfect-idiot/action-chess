import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CELL_SIZE, PERSON_HEIGHT, WORLD_TILE_MARGIN } from '../game/types'
import { groundY } from './terrainHeight'
import { getToonGradient, hash01, PALETTE } from './toon'

/** Inner cliff rim radius — used for camera fade + entrance placement. */
function cliffRimRadius(boardHalf = CELL_SIZE * 4) {
  const wallR = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN * 0.72)
  return wallR + CELL_SIZE * 1.85
}

function colored(
  geo: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
  alpha?: number,
): THREE.BufferGeometry {
  geo.translate(x, y, z)
  const n = geo.attributes.position.count
  const size = alpha === undefined ? 3 : 4
  const data = new Float32Array(n * size)
  for (let i = 0; i < n; i++) {
    data[i * size] = color.r
    data[i * size + 1] = color.g
    data[i * size + 2] = color.b
    if (alpha !== undefined) data[i * size + 3] = alpha
  }
  geo.setAttribute('color', new THREE.BufferAttribute(data, size))
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

/**
 * Overgrown ruin bowl: low broken walls near the plaza, a tight tree belt, and
 * a tall cliff rim that hides the outer apron instead of a sparse forest ring.
 */
function buildRuinBowl(boardHalf: number) {
  const solid: THREE.BufferGeometry[] = []
  const soft: THREE.BufferGeometry[] = []
  const cliffSolid: THREE.BufferGeometry[] = []
  const cliffSoft: THREE.BufferGeometry[] = []
  const entranceSolid: THREE.BufferGeometry[] = []
  const entranceSoft: THREE.BufferGeometry[] = []
  const horizonSolid: THREE.BufferGeometry[] = []
  const horizonSoft: THREE.BufferGeometry[] = []

  const stone = new THREE.Color('#8a8478')
  const stoneDark = new THREE.Color('#6a645c')
  const cliff = new THREE.Color('#5e584e')
  const cliffDark = new THREE.Color('#454038')
  const cliffLite = new THREE.Color('#7a7368')
  const cliffFar = new THREE.Color('#6a655c')
  const rubble = new THREE.Color('#7a7468')
  const moss = new THREE.Color(PALETTE.moss)
  const mossLite = new THREE.Color(PALETTE.mossLite)
  const leaf = new THREE.Color(PALETTE.leaf)
  const leafDark = new THREE.Color('#3a5834')
  const dirt = new THREE.Color(PALETTE.dirt)

  const wallR = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN * 0.72)
  /** Keep ruins / cliffs / forest off the mid river so water can run through the bowl. */
  const riverClear = CELL_SIZE * 3.2
  const onRiver = (x: number) => Math.abs(x) < riverClear
  const at = (x: number, z: number, yOff: number) => groundY(x, z) + yOff
  const cliffR = cliffRimRadius(boardHalf)

  // ── Broken perimeter wall (low, incomplete) ─────────────────────
  for (let i = 0; i < 36; i++) {
    if (hash01(i * 1.7) < 0.22) continue // gaps in the wall
    const t = i / 36
    const side = Math.floor(t * 4)
    const u = (t * 4) % 1
    let x = 0
    let z = 0
    let yaw = 0
    if (side === 0) {
      x = -wallR + u * wallR * 2
      z = wallR
      yaw = 0
    } else if (side === 1) {
      x = wallR
      z = wallR - u * wallR * 2
      yaw = Math.PI / 2
    } else if (side === 2) {
      x = wallR - u * wallR * 2
      z = -wallR
      yaw = 0
    } else {
      x = -wallR
      z = -wallR + u * wallR * 2
      yaw = Math.PI / 2
    }
    if (onRiver(x)) continue

    const h = PERSON_HEIGHT * (0.55 + hash01(i * 3) * 0.9)
    const w = CELL_SIZE * (0.55 + hash01(i * 5) * 0.45)
    const d = PERSON_HEIGHT * (0.28 + hash01(i * 7) * 0.2)
    const base = groundY(x, z)
    solid.push(
      colored(rotY(new THREE.BoxGeometry(w, h, d), yaw), x, at(x, z, h / 2), z, hash01(i) > 0.5 ? stone : stoneDark),
    )
    // Moss cap / stain on wall top
    if (hash01(i * 9) > 0.35) {
      solid.push(
        colored(
          rotY(new THREE.BoxGeometry(w * 0.9, PERSON_HEIGHT * 0.06, d * 1.05), yaw),
          x,
          base + h + 0.02,
          z,
          moss,
        ),
      )
    }
    // Ivy strip on face
    if (hash01(i * 11) > 0.5) {
      solid.push(
        colored(
          rotY(new THREE.BoxGeometry(w * 0.35, h * 0.55, d * 0.15), yaw),
          x + Math.sin(yaw) * d * 0.4,
          base + h * 0.35,
          z + Math.cos(yaw) * d * 0.4,
          leaf,
        ),
      )
    }
  }

  // Corner rubble mounds
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const cx = sx * (boardHalf + CELL_SIZE * 2.2)
    const cz = sz * (boardHalf + CELL_SIZE * 2.2)
    for (let k = 0; k < 5; k++) {
      const ox = (hash01(k * 3 + sx * 7) - 0.5) * CELL_SIZE * 1.4
      const oz = (hash01(k * 5 + sz * 9) - 0.5) * CELL_SIZE * 1.4
      const bw = PERSON_HEIGHT * (0.4 + hash01(k + 2) * 0.7)
      const bh = PERSON_HEIGHT * (0.2 + hash01(k + 4) * 0.45)
      const bd = PERSON_HEIGHT * (0.3 + hash01(k + 6) * 0.5)
      solid.push(
        colored(
          rotY(new THREE.BoxGeometry(bw, bh, bd), hash01(k) * 2),
          cx + ox,
          bh / 2,
          cz + oz,
          rubble,
        ),
      )
    }
    // Moss on mound
    soft.push(
      colored(
        new THREE.CircleGeometry(PERSON_HEIGHT * 1.1, 10).rotateX(-Math.PI / 2),
        cx,
        0.14,
        cz,
        mossLite,
      ),
    )
  }

  const bark = new THREE.Color('#5c4330')
  const barkDark = new THREE.Color('#3e2e20')
  const barkLite = new THREE.Color('#7a5a40')

  const pushBush = (x: number, z: number, s: number, seed: number) => {
    const layers = 2 + Math.floor(hash01(seed) * 2)
    const base = groundY(x, z)
    for (let i = 0; i < layers; i++) {
      const r = s * (0.45 + hash01(seed + i) * 0.5) * (1 - i * 0.1)
      const y = base + s * (0.28 + i * 0.24)
      soft.push(
        colored(
          new THREE.SphereGeometry(r, 6, 5),
          x + (hash01(seed + i * 3) - 0.5) * s * 0.45,
          y,
          z + (hash01(seed + i * 5) - 0.5) * s * 0.45,
          i % 2 ? leaf : leafDark,
        ),
      )
    }
  }

  /** Real tree: tall visible trunk + lifted canopy so wood reads between them. */
  const pushTree = (x: number, z: number, scale: number, seed: number) => {
    const trunkH = PERSON_HEIGHT * (1.8 + hash01(seed) * 2.4) * scale
    const trunkR = PERSON_HEIGHT * (0.1 + hash01(seed + 1) * 0.08) * scale
    const lean = (hash01(seed + 2) - 0.5) * 0.12
    const barkCol = hash01(seed + 3) > 0.66 ? barkLite : hash01(seed + 3) > 0.33 ? bark : barkDark
    const base = groundY(x, z)

    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.65, trunkR * 1.15, trunkH, 6)
    trunkGeo.rotateZ(lean)
    solid.push(colored(trunkGeo, x, base + trunkH / 2, z, barkCol))

    // Short branch stubs so trunks feel woody, not poles
    if (hash01(seed + 4) > 0.4) {
      const by = base + trunkH * (0.45 + hash01(seed + 5) * 0.25)
      const yaw = hash01(seed + 6) * Math.PI * 2
      const bl = trunkR * (3.5 + hash01(seed + 7) * 3)
      const branch = new THREE.CylinderGeometry(trunkR * 0.25, trunkR * 0.4, bl, 4)
      branch.rotateZ(Math.PI / 2 + lean)
      branch.rotateY(yaw)
      solid.push(
        colored(branch, x + Math.cos(yaw) * bl * 0.35, by, z + Math.sin(yaw) * bl * 0.35, barkCol),
      )
    }

    // Canopy sits high on the trunk — gaps between trees stay readable
    const canopy = PERSON_HEIGHT * (0.9 + hash01(seed + 8) * 0.85) * scale
    const cy = base + trunkH + canopy * 0.15
    const kind = hash01(seed + 9)
    if (kind > 0.55) {
      // Pine-ish stacked cones
      soft.push(
        colored(
          new THREE.ConeGeometry(canopy * 0.85, canopy * 1.5, 7),
          x + lean * trunkH * 0.5,
          cy + canopy * 0.15,
          z,
          leafDark,
        ),
      )
      soft.push(
        colored(
          new THREE.ConeGeometry(canopy * 0.55, canopy * 0.9, 6),
          x + lean * trunkH * 0.5,
          cy + canopy * 0.75,
          z,
          leaf,
        ),
      )
    } else {
      // Broadleaf — 2–3 offset spheres, not one blob
      soft.push(
        colored(
          new THREE.SphereGeometry(canopy * 0.7, 7, 6),
          x + lean * trunkH * 0.4,
          cy,
          z,
          leaf,
        ),
      )
      soft.push(
        colored(
          new THREE.SphereGeometry(canopy * 0.5, 6, 5),
          x + canopy * 0.35,
          cy + canopy * 0.25,
          z - canopy * 0.15,
          leafDark,
        ),
      )
      if (hash01(seed + 10) > 0.35) {
        soft.push(
          colored(
            new THREE.SphereGeometry(canopy * 0.4, 5, 4),
            x - canopy * 0.3,
            cy + canopy * 0.15,
            z + canopy * 0.25,
            leaf,
          ),
        )
      }
    }
  }

  // Near bushes — kept close to the wall so the apron stays clean
  const bushClusters: [number, number, number][] = [
    [0.35, boardHalf + CELL_SIZE * 1.35, 3],
    [1.2, boardHalf + CELL_SIZE * 1.9, 3],
    [2.05, boardHalf + CELL_SIZE * 1.55, 4],
    [2.9, boardHalf + CELL_SIZE * 2.1, 2],
    [3.75, boardHalf + CELL_SIZE * 1.45, 3],
    [4.6, boardHalf + CELL_SIZE * 1.85, 3],
    [5.45, boardHalf + CELL_SIZE * 1.5, 3],
  ]
  bushClusters.forEach(([a, baseR, count], ci) => {
    for (let j = 0; j < count; j++) {
      const jitterA = a + (hash01(ci * 17 + j * 3) - 0.5) * 0.35
      const r = baseR + (hash01(ci * 19 + j * 5) - 0.5) * CELL_SIZE * 0.55
      const bx = Math.cos(jitterA) * r
      if (onRiver(bx)) continue
      pushBush(
        bx,
        Math.sin(jitterA) * r,
        PERSON_HEIGHT * (0.35 + hash01(ci * 23 + j) * 0.45),
        ci * 40 + j * 7,
      )
    }
  })

  // Cliff rim — thin inner face only (no wide shelves; those ate the overview)
  const cliffSegs = 48
  const cliffBaseH = PERSON_HEIGHT * 8.5
  for (let i = 0; i < cliffSegs; i++) {
    const a = (i / cliffSegs) * Math.PI * 2
    const x = Math.cos(a) * cliffR
    const z = Math.sin(a) * cliffR
    if (onRiver(x)) continue

    const h = cliffBaseH * (0.9 + hash01(i * 2.3) * 0.18)
    const w = ((Math.PI * 2 * cliffR) / cliffSegs) * 1.12
    const d = CELL_SIZE * (0.7 + hash01(i * 1.7) * 0.35)
    const faceCol = hash01(i * 4.1) > 0.55 ? cliff : hash01(i * 4.1) > 0.25 ? cliffDark : stoneDark
    const base = groundY(x, z)

    cliffSolid.push(colored(rotY(new THREE.BoxGeometry(w, h, d), a), x, base + h * 0.48, z, faceCol))

    if (hash01(i * 7.3) > 0.4) {
      cliffSolid.push(
        colored(
          rotY(new THREE.BoxGeometry(w * 0.35, h * (0.25 + hash01(i * 3) * 0.35), d * 0.15), a),
          x - Math.cos(a) * d * 0.4,
          base + h * (0.25 + hash01(i * 9) * 0.35),
          z - Math.sin(a) * d * 0.4,
          hash01(i * 11) > 0.5 ? moss : leafDark,
        ),
      )
    }

    cliffSoft.push(
      colored(
        new THREE.SphereGeometry(PERSON_HEIGHT * (1.2 + hash01(i * 8.1) * 0.6), 6, 5),
        x - Math.cos(a) * CELL_SIZE * 0.08,
        base + h * 0.95 + PERSON_HEIGHT * 0.35,
        z - Math.sin(a) * CELL_SIZE * 0.08,
        hash01(i) > 0.45 ? leafDark : leaf,
      ),
    )
  }

  // Far entrance cliffs at river mouths — back in the BG for parallax / horizon cover
  for (const sz of [1, -1] as const) {
    for (let layer = 0; layer < 4; layer++) {
      const depth = cliffR + CELL_SIZE * (4.2 + layer * 3.2)
      const z = sz * depth
      for (const sx of [-1, 1] as const) {
        const seed = layer * 17 + (sx + 2) * 5 + (sz + 2) * 31
        // Flank the gorge; stay out of the overview's near field
        const x =
          sx *
          (riverClear * (0.85 + layer * 0.12) +
            CELL_SIZE * (0.55 + layer * 0.7 + hash01(seed) * 0.5))
        const h = PERSON_HEIGHT * (7.5 + layer * 3.4 + hash01(seed + 1) * 2.8)
        const w = CELL_SIZE * (3.2 + layer * 1.1 + hash01(seed + 2) * 1.2)
        const d = CELL_SIZE * (2.4 + layer * 0.8)
        const yaw = (sx * sz > 0 ? 0.1 : -0.1) + (hash01(seed + 3) - 0.5) * 0.18
        const base = groundY(x, z)
        const col = layer === 0 ? cliff : layer === 1 ? cliffFar : cliffDark
        entranceSolid.push(
          colored(rotY(new THREE.BoxGeometry(w, h, d), yaw), x, base + h * 0.45, z, col),
        )
        entranceSolid.push(
          colored(
            rotY(new THREE.BoxGeometry(w * 1.15, h * 0.5, d * 0.75), yaw),
            x + sx * CELL_SIZE * 0.4,
            base + h * 0.72,
            z + sz * CELL_SIZE * 0.45,
            cliffLite,
          ),
        )
        entranceSoft.push(
          colored(
            new THREE.SphereGeometry(PERSON_HEIGHT * (1.8 + layer * 0.35), 6, 5),
            x,
            base + h * 0.95 + PERSON_HEIGHT * 0.5,
            z,
            leafDark,
          ),
        )
        if (hash01(seed + 4) > 0.3) {
          entranceSoft.push(
            colored(
              new THREE.SphereGeometry(PERSON_HEIGHT * (1.2 + hash01(seed + 5) * 0.5), 5, 4),
              x - sx * CELL_SIZE * 0.55,
              base + h * 0.88 + PERSON_HEIGHT * 0.3,
              z + sz * CELL_SIZE * 0.25,
              leaf,
            ),
          )
        }
      }
      // Back ridge closes the skyline through the gorge
      if (layer >= 1) {
        const cz = sz * (depth + CELL_SIZE * (1.4 + layer * 0.4))
        const ch = PERSON_HEIGHT * (8 + layer * 2.2)
        const cw = riverClear * (1.35 + layer * 0.4)
        entranceSolid.push(
          colored(
            new THREE.BoxGeometry(cw, ch, CELL_SIZE * (1.8 + layer * 0.45)),
            0,
            groundY(0, cz) + ch * 0.42,
            cz,
            cliffDark,
          ),
        )
        entranceSoft.push(
          colored(
            new THREE.SphereGeometry(PERSON_HEIGHT * (2.4 + layer * 0.45), 6, 5),
            (hash01(layer + sz * 3) - 0.5) * CELL_SIZE * 1.2,
            groundY(0, cz) + ch * 0.92,
            cz,
            leafDark,
          ),
        )
      }
    }
  }

  // Low talus / earth footing under the cliff — even, not scattered banks
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 + 0.04
    const r = cliffR - CELL_SIZE * (0.95 + hash01(i * 2.2) * 0.25)
    const bx = Math.cos(a) * r
    const bz = Math.sin(a) * r
    if (onRiver(bx)) continue
    const h = PERSON_HEIGHT * (0.7 + hash01(i * 3.1) * 0.45)
    const w = CELL_SIZE * (1.05 + hash01(i * 1.4) * 0.35)
    solid.push(
      colored(
        rotY(new THREE.BoxGeometry(w, h, CELL_SIZE * 0.85), a),
        bx,
        at(bx, bz, h * 0.38),
        bz,
        hash01(i) > 0.55 ? dirt : stoneDark,
      ),
    )
  }

  // Tight woodland belt between ruins and cliff — even spacing, little jitter
  const forestRings: [number, number, number][] = [
    [wallR + CELL_SIZE * 0.55, 34, 0.95],
    [wallR + CELL_SIZE * 1.45, 40, 1.1],
  ]
  forestRings.forEach(([baseR, count, scale], ring) => {
    for (let i = 0; i < count; i++) {
      if (hash01(ring * 50 + i * 7) < 0.08) continue
      const step = (Math.PI * 2) / count
      const a = i * step + ring * 0.09 + (hash01(ring * 11 + i * 3) - 0.5) * step * 0.22
      const r = baseR + (hash01(ring * 13 + i * 5) - 0.5) * CELL_SIZE * 0.35
      const tx = Math.cos(a) * r
      if (onRiver(tx)) continue
      pushTree(
        tx,
        Math.sin(a) * r,
        scale * (0.92 + hash01(ring * 17 + i) * 0.18),
        ring * 100 + i * 13,
      )
    }
  })

  // Fallen columns / debris near mid-sides
  const debris: [number, number, number][] = [
    [boardHalf + CELL_SIZE * 1.3, CELL_SIZE * 2.5, 0.4],
    [-(boardHalf + CELL_SIZE * 1.5), -CELL_SIZE * 1.8, 1.1],
    [CELL_SIZE * 3.2, boardHalf + CELL_SIZE * 1.4, 0.2],
    [-CELL_SIZE * 2.8, -(boardHalf + CELL_SIZE * 1.6), 0.9],
    [boardHalf + CELL_SIZE * 3.5, -CELL_SIZE * 4.0, 0.6],
    [-(boardHalf + CELL_SIZE * 4.0), CELL_SIZE * 3.5, -0.5],
  ]
  debris.forEach(([x, z, yaw], i) => {
    const len = PERSON_HEIGHT * (1.2 + hash01(i * 2) * 1.4)
    solid.push(
      colored(
        rotY(new THREE.CylinderGeometry(PERSON_HEIGHT * 0.14, PERSON_HEIGHT * 0.16, len, 6), yaw),
        x,
        PERSON_HEIGHT * 0.16,
        z,
        stoneDark,
      ),
    )
    // Tip moss
    soft.push(
      colored(
        new THREE.SphereGeometry(PERSON_HEIGHT * 0.22, 5, 4),
        x + Math.cos(yaw) * len * 0.35,
        PERSON_HEIGHT * 0.28,
        z + Math.sin(yaw) * len * 0.35,
        moss,
      ),
    )
  })

  // Dirt patches where tiles are missing near wall
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const r = boardHalf + CELL_SIZE * (0.6 + hash01(i * 6) * 1.8)
    const dx = Math.cos(a) * r
    if (onRiver(dx)) continue
    soft.push(
      colored(
        new THREE.CircleGeometry(PERSON_HEIGHT * (0.6 + hash01(i) * 0.8), 8).rotateX(-Math.PI / 2),
        dx,
        0.05,
        Math.sin(a) * r,
        dirt,
      ),
    )
  }

  // Far horizon mountains — past the apron so zoom-out never shows a flat ground→sky edge
  const horizonR = cliffR + CELL_SIZE * 7.5
  const horizonSegs = 40
  const horizonH = PERSON_HEIGHT * 22
  for (let i = 0; i < horizonSegs; i++) {
    const a = (i / horizonSegs) * Math.PI * 2 + 0.05
    const x = Math.cos(a) * horizonR
    const z = Math.sin(a) * horizonR
    const h = horizonH * (0.75 + hash01(i * 3.1) * 0.45)
    const w = ((Math.PI * 2 * horizonR) / horizonSegs) * 1.2
    const d = CELL_SIZE * (3.2 + hash01(i * 2.2) * 2.4)
    const col = hash01(i * 4) > 0.55 ? cliffDark : hash01(i * 4) > 0.25 ? cliff : stoneDark
    horizonSolid.push(
      colored(rotY(new THREE.BoxGeometry(w, h, d), a), x, h * 0.42, z, col),
    )
    // Second ridge slightly farther / lower for depth
    const r2 = horizonR + CELL_SIZE * (1.8 + hash01(i * 5.5) * 1.4)
    const h2 = h * (0.55 + hash01(i * 7.1) * 0.3)
    horizonSolid.push(
      colored(
        rotY(new THREE.BoxGeometry(w * 1.15, h2, CELL_SIZE * 2.8), a),
        Math.cos(a) * r2,
        h2 * 0.4,
        Math.sin(a) * r2,
        cliffDark,
      ),
    )
    // Tree-line silhouette on the near ridge
    horizonSoft.push(
      colored(
        new THREE.SphereGeometry(PERSON_HEIGHT * (1.8 + hash01(i * 8) * 1.2), 6, 5),
        x - Math.cos(a) * CELL_SIZE * 0.2,
        h * 0.88 + PERSON_HEIGHT * 0.4,
        z - Math.sin(a) * CELL_SIZE * 0.2,
        leafDark,
      ),
    )
    if (hash01(i * 6.3) > 0.35) {
      horizonSoft.push(
        colored(
          new THREE.SphereGeometry(PERSON_HEIGHT * (1.2 + hash01(i * 9) * 0.7), 5, 4),
          Math.cos(a + 0.04) * r2,
          h2 * 0.9,
          Math.sin(a + 0.04) * r2,
          leaf,
        ),
      )
    }
  }

  return {
    solid: mergeAndDispose(solid),
    soft: mergeAndDispose(soft),
    cliffSolid: mergeAndDispose(cliffSolid),
    cliffSoft: mergeAndDispose(cliffSoft),
    entranceSolid: mergeAndDispose(entranceSolid),
    entranceSoft: mergeAndDispose(entranceSoft),
    horizonSolid: mergeAndDispose(horizonSolid),
    horizonSoft: mergeAndDispose(horizonSoft),
  }
}

/**
 * Hide the cliff rim only when the camera pans into it — not at normal overview.
 * Zoom-out used to cull the whole wall; keep it visible as the bowl edge.
 */
function CliffFade({
  group,
  cliffR,
}: {
  group: RefObject<THREE.Group | null>
  cliffR: number
}) {
  const { camera } = useThree()
  const last = useRef(1)

  useFrame(() => {
    const g = group.current
    if (!g) return
    const camR = Math.hypot(camera.position.x, camera.position.z)
    // Only react when orbiting near the rim itself
    const prox = THREE.MathUtils.smoothstep(cliffR * 0.62, cliffR * 0.92, camR)
    const show = 1 - prox
    if (Math.abs(show - last.current) < 0.01) return
    last.current = show
    g.visible = show > 0.12
    g.scale.set(1, Math.max(0.25, show), 1)
  })

  return null
}

/** Soft-hide entrance cliffs only when the camera is right on top of them. */
function EntranceFade({
  group,
  cliffR,
}: {
  group: RefObject<THREE.Group | null>
  cliffR: number
}) {
  const { camera } = useThree()
  const last = useRef(1)

  useFrame(() => {
    const g = group.current
    if (!g) return
    const camR = Math.hypot(camera.position.x, camera.position.z)
    const prox = THREE.MathUtils.smoothstep(cliffR * 0.85, cliffR * 1.2, camR)
    const show = 1 - prox
    if (Math.abs(show - last.current) < 0.01) return
    last.current = show
    g.visible = show > 0.15
    g.scale.set(1, Math.max(0.3, show) * 0.85, 1)
  })

  return null
}

export function Cityscape() {
  const gradientMap = useMemo(() => getToonGradient(), [])
  const groundMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#4a5e3c', gradientMap }),
    [gradientMap],
  )
  const hazeFloorMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#5a7050',
        fog: true,
      }),
    [],
  )

  const boardHalf = CELL_SIZE * 4
  const cliffR = cliffRimRadius(boardHalf)
  const bowlR = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN + 10)
  const apronR = bowlR + CELL_SIZE * 4
  const cliffRev = 13

  const ruin = useMemo(() => buildRuinBowl(boardHalf), [boardHalf, cliffRev])

  useEffect(
    () => () => {
      ruin.solid.dispose()
      ruin.soft.dispose()
      ruin.cliffSolid.dispose()
      ruin.cliffSoft.dispose()
      ruin.entranceSolid.dispose()
      ruin.entranceSoft.dispose()
      ruin.horizonSolid.dispose()
      ruin.horizonSoft.dispose()
    },
    [ruin],
  )

  const meshMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const softMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const cliffMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const cliffSoftMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const entranceMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const entranceSoftMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const horizonMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const horizonSoftMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )

  const cliffGroup = useRef<THREE.Group>(null)
  const entranceGroup = useRef<THREE.Group>(null)

  return (
    <group>
      {/* Underfill below the valley so the river bed isn't capped by a flat disk */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4.2, 0]}
        material={groundMat}
        receiveShadow
      >
        <circleGeometry args={[bowlR, 48]} />
      </mesh>

      <mesh geometry={ruin.solid} material={meshMat} castShadow receiveShadow />
      <mesh geometry={ruin.soft} material={softMat} castShadow receiveShadow />

      <group ref={cliffGroup}>
        <mesh geometry={ruin.cliffSolid} material={cliffMat} castShadow receiveShadow />
        <mesh geometry={ruin.cliffSoft} material={cliffSoftMat} castShadow receiveShadow />
      </group>
      <CliffFade group={cliffGroup} cliffR={cliffR} />

      {/* Entrance cliffs — BG parallax; soft-hide if the camera walks into them */}
      <group ref={entranceGroup} scale={[1, 0.85, 1]}>
        <mesh geometry={ruin.entranceSolid} material={entranceMat} castShadow receiveShadow />
        <mesh geometry={ruin.entranceSoft} material={entranceSoftMat} castShadow receiveShadow />
      </group>
      <EntranceFade group={entranceGroup} cliffR={cliffR} />

      {/* Always-on far mountains — hide the ground→sky seam at full zoom-out */}
      <mesh geometry={ruin.horizonSolid} material={horizonMat} receiveShadow />
      <mesh geometry={ruin.horizonSoft} material={horizonSoftMat} receiveShadow />

      {/* Soft ground apron under the outer cliffs */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.6, 0]}
        material={hazeFloorMat}
      >
        <ringGeometry args={[bowlR * 0.92, apronR, 48]} />
      </mesh>
    </group>
  )
}
