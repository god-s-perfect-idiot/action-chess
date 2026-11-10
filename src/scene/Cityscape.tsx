import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CELL_SIZE, PERSON_HEIGHT, WORLD_TILE_MARGIN } from '../game/types'
import { getToonGradient, hash01, PALETTE } from './toon'

/** Soft apron pads — earthier / greener than the battle grid. */
const SECTOR_A = ['#8a8478', '#868074', '#827c70', '#888278'] as const
const SECTOR_B = ['#6e7668', '#6a7264', '#666e60', '#6c7466'] as const

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

const PAD_GAP = 0.42

/** Broken apron tiles past the 8×8 — mossy, incomplete, not a clean checker. */
function buildWorldTiles() {
  const tile = CELL_SIZE - PAD_GAP
  const pads: THREE.BufferGeometry[] = []
  const dress: THREE.BufferGeometry[] = []
  const colorsA = SECTOR_A.map((h) => new THREE.Color(h))
  const colorsB = SECTOR_B.map((h) => new THREE.Color(h))
  const moss = new THREE.Color(PALETTE.moss)
  const mossLite = new THREE.Color(PALETTE.mossLite)
  const dirt = new THREE.Color(PALETTE.dirt)
  const rubble = new THREE.Color('#8a8478')
  const leaf = new THREE.Color(PALETTE.leaf)

  const min = -WORLD_TILE_MARGIN
  const max = 7 + WORLD_TILE_MARGIN

  for (let rank = min; rank <= max; rank++) {
    for (let file = min; file <= max; file++) {
      if (file >= 0 && file <= 7 && rank >= 0 && rank <= 7) continue

      const seed = file * 17 + rank * 31
      const roll = hash01(seed)
      // Outer apron thins out — missing tiles read as reclaimed ground
      const dist = Math.max(
        Math.abs(file - 3.5) - 3.5,
        Math.abs(rank - 3.5) - 3.5,
      )
      if (dist > 2.5 && roll < 0.28) continue
      if (dist > 4 && roll < 0.55) continue

      const x = (file - 3.5) * CELL_SIZE
      const z = (rank - 3.5) * CELL_SIZE
      // Leave the mid river corridor clear so apron pads don't z-fight water
      if (Math.abs(x) < CELL_SIZE * 0.75) continue
      const light = (file + rank) % 2 === 1
      const variant = Math.floor(hash01(seed + 11) * 4) % 4
      const pad = light ? colorsA[variant]! : colorsB[variant]!

      // Slightly irregular pad sizes so the apron isn't a perfect grid
      const shrink = 0.85 + hash01(seed + 2) * 0.18
      const tw = tile * shrink
      const td = tile * (0.88 + hash01(seed + 4) * 0.16)
      const ox = (hash01(seed + 6) - 0.5) * PAD_GAP * 0.35
      const oz = (hash01(seed + 8) - 0.5) * PAD_GAP * 0.35

      pads.push(colored(new THREE.BoxGeometry(tw, 0.18, td), x + ox, 0.01, z + oz, pad))

      // Moss blotch
      if (roll > 0.25) {
        const r = 0.35 + hash01(seed + 15) * 0.55
        dress.push(
          colored(
            new THREE.CircleGeometry(r, 8).rotateX(-Math.PI / 2),
            x + (hash01(seed + 3) - 0.5) * tw * 0.5,
            0.12,
            z + (hash01(seed + 5) - 0.5) * td * 0.5,
            hash01(seed + 7) > 0.5 ? mossLite : moss,
          ),
        )
      }

      // Corner rubble
      if (hash01(seed + 19) > 0.62) {
        const sx = (hash01(seed + 21) > 0.5 ? 1 : -1) * tw * 0.35
        const sz = (hash01(seed + 23) > 0.5 ? 1 : -1) * td * 0.35
        dress.push(
          colored(
            rotY(
              new THREE.BoxGeometry(0.4 + hash01(seed) * 0.35, 0.16, 0.28),
              hash01(seed + 25) * 2,
            ),
            x + sx,
            0.16,
            z + sz,
            rubble,
          ),
        )
      }

      // Dirt smear on broken pads
      if (hash01(seed + 27) > 0.7) {
        dress.push(
          colored(
            new THREE.CircleGeometry(0.3 + hash01(seed + 29) * 0.3, 7).rotateX(-Math.PI / 2),
            x,
            0.115,
            z,
            dirt,
          ),
        )
      }

      // Leaf litter
      if (hash01(seed + 31) > 0.55) {
        for (let i = 0; i < 2; i++) {
          dress.push(
            colored(
              new THREE.PlaneGeometry(0.2, 0.1).rotateX(-Math.PI / 2),
              x + (hash01(seed + 33 + i) - 0.5) * tw * 0.6,
              0.125,
              z + (hash01(seed + 35 + i) - 0.5) * td * 0.6,
              leaf,
            ),
          )
        }
      }
    }
  }

  return {
    pads: mergeAndDispose(pads),
    dress: mergeAndDispose(dress),
  }
}

/**
 * Overgrown ruin bowl: low broken walls, rubble piles, bush/tree clumps, and a
 * soft distant tree line — no skyscraper ring so the plaza reads larger.
 */
function buildRuinBowl(boardHalf: number) {
  const solid: THREE.BufferGeometry[] = []
  const soft: THREE.BufferGeometry[] = []

  const stone = new THREE.Color('#8a8478')
  const stoneDark = new THREE.Color('#6a645c')
  const rubble = new THREE.Color('#7a7468')
  const moss = new THREE.Color(PALETTE.moss)
  const mossLite = new THREE.Color(PALETTE.mossLite)
  const leaf = new THREE.Color(PALETTE.leaf)
  const leafDark = new THREE.Color('#3a5834')
  const trunk = new THREE.Color('#5a4a38')
  const dirt = new THREE.Color(PALETTE.dirt)

  const wallR = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN * 0.72)

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

    const h = PERSON_HEIGHT * (0.55 + hash01(i * 3) * 0.9)
    const w = CELL_SIZE * (0.55 + hash01(i * 5) * 0.45)
    const d = PERSON_HEIGHT * (0.28 + hash01(i * 7) * 0.2)
    solid.push(
      colored(rotY(new THREE.BoxGeometry(w, h, d), yaw), x, h / 2, z, hash01(i) > 0.5 ? stone : stoneDark),
    )
    // Moss cap / stain on wall top
    if (hash01(i * 9) > 0.35) {
      solid.push(
        colored(
          rotY(new THREE.BoxGeometry(w * 0.9, PERSON_HEIGHT * 0.06, d * 1.05), yaw),
          x,
          h + 0.02,
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
          h * 0.35,
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
    for (let i = 0; i < layers; i++) {
      const r = s * (0.45 + hash01(seed + i) * 0.5) * (1 - i * 0.1)
      const y = s * (0.28 + i * 0.24)
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

    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.65, trunkR * 1.15, trunkH, 6)
    trunkGeo.rotateZ(lean)
    solid.push(colored(trunkGeo, x, trunkH / 2, z, barkCol))

    // Short branch stubs so trunks feel woody, not poles
    if (hash01(seed + 4) > 0.4) {
      const by = trunkH * (0.45 + hash01(seed + 5) * 0.25)
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
    const cy = trunkH + canopy * 0.15
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

  // Near bushes — irregular clusters inside the wall
  const bushClusters: [number, number, number][] = [
    [0.35, boardHalf + CELL_SIZE * 1.6, 4],
    [1.1, boardHalf + CELL_SIZE * 3.2, 3],
    [1.85, boardHalf + CELL_SIZE * 2.0, 5],
    [2.4, boardHalf + CELL_SIZE * 4.1, 2],
    [3.05, boardHalf + CELL_SIZE * 1.8, 4],
    [3.7, boardHalf + CELL_SIZE * 3.6, 3],
    [4.55, boardHalf + CELL_SIZE * 2.4, 3],
    [5.2, boardHalf + CELL_SIZE * 4.5, 2],
    [5.85, boardHalf + CELL_SIZE * 1.5, 4],
  ]
  bushClusters.forEach(([a, baseR, count], ci) => {
    for (let j = 0; j < count; j++) {
      const jitterA = a + (hash01(ci * 17 + j * 3) - 0.5) * 0.55
      const r = baseR + (hash01(ci * 19 + j * 5) - 0.35) * CELL_SIZE * 1.8
      pushBush(
        Math.cos(jitterA) * r,
        Math.sin(jitterA) * r,
        PERSON_HEIGHT * (0.35 + hash01(ci * 23 + j) * 0.5),
        ci * 40 + j * 7,
      )
    }
  })

  // Low earth banks only — no solid green rim (trees own the silhouette)
  for (let i = 0; i < 28; i++) {
    if (hash01(i * 1.9) < 0.18) continue
    const a = (i / 28) * Math.PI * 2 + (hash01(i * 2.1) - 0.5) * 0.25
    const r = wallR + CELL_SIZE * (0.6 + hash01(i * 3.3) * 1.4)
    const h = PERSON_HEIGHT * (0.55 + hash01(i * 4.1) * 0.7)
    const w = CELL_SIZE * (0.9 + hash01(i * 1.7) * 1.1)
    solid.push(
      colored(
        rotY(new THREE.BoxGeometry(w, h, CELL_SIZE * (0.9 + hash01(i) * 0.6)), a),
        Math.cos(a) * r,
        h * 0.4,
        Math.sin(a) * r,
        hash01(i) > 0.5 ? dirt : stoneDark,
      ),
    )
  }

  // Forest rings all around — spaced trunks with gaps, multiple depths
  const forestRings: [number, number, number][] = [
    // [base radius, count, scale]
    [wallR + CELL_SIZE * 1.0, 22, 0.85],
    [wallR + CELL_SIZE * 2.6, 28, 1.0],
    [wallR + CELL_SIZE * 4.4, 32, 1.15],
    [wallR + CELL_SIZE * 6.4, 36, 1.3],
    [wallR + CELL_SIZE * 8.6, 30, 1.45],
  ]
  forestRings.forEach(([baseR, count, scale], ring) => {
    for (let i = 0; i < count; i++) {
      // Skip some slots so gaps open between trees
      if (hash01(ring * 50 + i * 7) < 0.22) continue
      const step = (Math.PI * 2) / count
      const a =
        i * step +
        (hash01(ring * 11 + i * 3) - 0.5) * step * 0.85 +
        ring * 0.17
      const r = baseR + (hash01(ring * 13 + i * 5) - 0.5) * CELL_SIZE * 1.6
      pushTree(
        Math.cos(a) * r,
        Math.sin(a) * r,
        scale * (0.85 + hash01(ring * 17 + i) * 0.35),
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
    soft.push(
      colored(
        new THREE.CircleGeometry(PERSON_HEIGHT * (0.6 + hash01(i) * 0.8), 8).rotateX(-Math.PI / 2),
        Math.cos(a) * r,
        0.05,
        Math.sin(a) * r,
        dirt,
      ),
    )
  }

  return {
    solid: mergeAndDispose(solid),
    soft: mergeAndDispose(soft),
  }
}

export function Cityscape() {
  const gradientMap = useMemo(() => getToonGradient(), [])
  const groundMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#4a5840', gradientMap }),
    [gradientMap],
  )
  const soilMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#3e4638', gradientMap }),
    [gradientMap],
  )
  const hazeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.fog,
        side: THREE.BackSide,
        fog: false,
      }),
    [],
  )
  const hazeFloorMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#6a7860',
        fog: false,
      }),
    [],
  )

  const boardHalf = CELL_SIZE * 4
  const deckSpan = CELL_SIZE * (8 + WORLD_TILE_MARGIN * 2)
  // Ground + haze reach past the outer forest ring so woods don't clip at a circle
  const bowlR = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN + 10)
  const hazeR = bowlR + CELL_SIZE * 3.5

  const ruin = useMemo(() => buildRuinBowl(boardHalf), [boardHalf])
  const worldTiles = useMemo(() => buildWorldTiles(), [])

  useEffect(
    () => () => {
      ruin.solid.dispose()
      ruin.soft.dispose()
      worldTiles.pads.dispose()
      worldTiles.dress.dispose()
    },
    [ruin, worldTiles],
  )

  const meshMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const softMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const tileMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )

  return (
    <group>
      {/* Floor stops at the berm — no infinite plain stretching to a horizon */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.35, 0]}
        material={groundMat}
        receiveShadow
      >
        <circleGeometry args={[bowlR, 48]} />
      </mesh>

      {/* Soil slab under apron tiles */}
      <mesh position={[0, -0.1, 0]} material={soilMat} receiveShadow>
        <boxGeometry args={[deckSpan + CELL_SIZE * 1.2, 0.22, deckSpan + CELL_SIZE * 1.2]} />
      </mesh>

      <mesh geometry={worldTiles.pads} material={tileMat} receiveShadow castShadow />
      <mesh geometry={worldTiles.dress} material={tileMat} receiveShadow />

      <mesh geometry={ruin.solid} material={meshMat} castShadow receiveShadow />
      <mesh geometry={ruin.soft} material={softMat} castShadow receiveShadow />

      {/* Haze cup — walls + dome in fog color so ground never meets open sky */}
      <mesh position={[0, PERSON_HEIGHT * 3.5, 0]} material={hazeMat}>
        <cylinderGeometry args={[hazeR, hazeR * 1.08, PERSON_HEIGHT * 12, 32, 1, true]} />
      </mesh>
      <mesh material={hazeMat}>
        <sphereGeometry args={[hazeR * 1.12, 28, 16]} />
      </mesh>
      {/* Outer apron under the berm so gaps don't flash empty */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        material={hazeFloorMat}
      >
        <ringGeometry args={[bowlR * 0.92, hazeR * 1.15, 48]} />
      </mesh>
    </group>
  )
}
