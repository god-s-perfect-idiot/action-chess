import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CELL_SIZE, PERSON_HEIGHT, WORLD_TILE_MARGIN } from '../game/types'
import { getToonGradient, hash01, PALETTE } from './toon'

/** Plaza tiles — slightly cooler/darker than the bordered battle pads. */
const SECTOR_A = ['#7a828a', '#767e86', '#727a82', '#788088'] as const
const SECTOR_B = ['#6a727a', '#666e76', '#626a72', '#687078'] as const

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

/** Checker plaza on the roof deck — same grid language as the battle pads. */
function buildWorldTiles() {
  const gap = 0.12
  const tile = CELL_SIZE - gap
  const pads: THREE.BufferGeometry[] = []
  const rims: THREE.BufferGeometry[] = []
  const colorsA = SECTOR_A.map((h) => new THREE.Color(h))
  const colorsB = SECTOR_B.map((h) => new THREE.Color(h))
  const rimA = new THREE.Color(PALETTE.sectorARim)
  const rimB = new THREE.Color(PALETTE.sectorBRim)
  const paint = new THREE.Color('#d8dee6')
  const ink = new THREE.Color('#4a525c')
  const grate = new THREE.Color('#3a424a')
  const warm = new THREE.Color('#c8b090')

  const min = -WORLD_TILE_MARGIN
  const max = 7 + WORLD_TILE_MARGIN

  for (let rank = min; rank <= max; rank++) {
    for (let file = min; file <= max; file++) {
      if (file >= 0 && file <= 7 && rank >= 0 && rank <= 7) continue

      const x = (file - 3.5) * CELL_SIZE
      const z = (rank - 3.5) * CELL_SIZE
      const light = (file + rank) % 2 === 1
      const seed = file * 17 + rank * 31
      const variant = Math.floor(hash01(seed + 11) * 4) % 4
      const pad = light ? colorsA[variant]! : colorsB[variant]!
      const rim = light ? rimA : rimB
      const roll = hash01(seed)

      pads.push(colored(new THREE.BoxGeometry(tile, 0.22, tile), x, 0.02, z, pad))
      rims.push(colored(new THREE.BoxGeometry(tile + 0.06, 0.035, tile + 0.06), x, 0.14, z, rim))

      const motif = Math.floor(roll * 5)
      if (motif === 0) {
        const ring = new THREE.RingGeometry(0.26, 0.4, 12)
        ring.rotateX(-Math.PI / 2)
        rims.push(colored(ring, x, 0.145, z, ink))
      } else if (motif === 1) {
        rims.push(colored(new THREE.BoxGeometry(0.85, 0.025, 0.85), x, 0.15, z, grate))
      } else if (motif === 2) {
        const alongX = hash01(seed + 9) > 0.5
        rims.push(
          colored(
            new THREE.BoxGeometry(alongX ? 1.4 : 0.12, 0.02, alongX ? 0.12 : 1.4),
            x,
            0.15,
            z,
            paint,
          ),
        )
      } else if (motif === 3) {
        rims.push(
          colored(
            new THREE.CircleGeometry(0.2, 8).rotateX(-Math.PI / 2),
            x + (hash01(seed + 3) - 0.5) * 1.6,
            0.148,
            z + (hash01(seed + 5) - 0.5) * 1.6,
            warm,
          ),
        )
      }
    }
  }

  return {
    pads: mergeAndDispose(pads),
    rims: mergeAndDispose(rims),
  }
}

/**
 * Rooftop tournament pad: detailed deck dressing + a ring of big towers just
 * past the camera orbit so the sky stays open above the fight.
 */
function buildRooftop(orbitR: number, boardHalf: number) {
  const deck: THREE.BufferGeometry[] = []
  const far: THREE.BufferGeometry[] = []
  const windows: THREE.BufferGeometry[] = []

  const concrete = new THREE.Color('#9aa4ae')
  const concreteDark = new THREE.Color('#7a8490')
  const steel = new THREE.Color('#6a727c')
  const steelDark = new THREE.Color('#4a525a')
  const trim = new THREE.Color('#c8d0d8')
  const rust = new THREE.Color('#8a6a58')
  const glass = new THREE.Color('#c8e4f8')
  const glassLit = new THREE.Color('#fff0c8')
  const facadeA = new THREE.Color('#8a949e')
  const facadeB = new THREE.Color('#6a7480')
  const facadeC = new THREE.Color('#9aa098')
  const facadeD = new THREE.Color('#7a8894')
  const facadeE = new THREE.Color('#a8b0b8')
  const facades = [facadeA, facadeB, facadeC, facadeD, facadeE]
  const paint = new THREE.Color('#d8dee4')

  const parapetH = PERSON_HEIGHT * 0.55
  const deckEdge = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN * 0.92)

  // ── Parapet ring around the tiled roof deck ──────────────────────
  const wallT = PERSON_HEIGHT * 0.22
  const sides: [number, number, number, number][] = [
    [0, deckEdge, deckEdge * 2 + wallT, wallT],
    [0, -deckEdge, deckEdge * 2 + wallT, wallT],
    [deckEdge, 0, wallT, deckEdge * 2 + wallT],
    [-deckEdge, 0, wallT, deckEdge * 2 + wallT],
  ]
  sides.forEach(([x, z, w, d]) => {
    deck.push(colored(new THREE.BoxGeometry(w, parapetH, d), x, parapetH / 2, z, concreteDark))
    deck.push(
      colored(new THREE.BoxGeometry(w * 1.01, PERSON_HEIGHT * 0.06, d * 1.01), x, parapetH + 0.03, z, trim),
    )
  })

  // Glass rail posts along parapet — sky reads through between them
  for (let i = 0; i < 48; i++) {
    if (i % 12 < 2) continue // leave corners to pillars
    const t = i / 48
    const side = Math.floor(t * 4)
    const u = (t * 4) % 1
    let x = 0
    let z = 0
    if (side === 0) {
      x = -deckEdge + u * deckEdge * 2
      z = deckEdge
    } else if (side === 1) {
      x = deckEdge
      z = deckEdge - u * deckEdge * 2
    } else if (side === 2) {
      x = deckEdge - u * deckEdge * 2
      z = -deckEdge
    } else {
      x = -deckEdge
      z = -deckEdge + u * deckEdge * 2
    }
    deck.push(
      colored(
        new THREE.BoxGeometry(PERSON_HEIGHT * 0.06, PERSON_HEIGHT * 0.7, PERSON_HEIGHT * 0.06),
        x,
        parapetH + PERSON_HEIGHT * 0.35,
        z,
        steel,
      ),
    )
  }
  // Top handrail
  for (const [x, z, w, d] of sides) {
    deck.push(
      colored(
        new THREE.BoxGeometry(
          w > d ? w : PERSON_HEIGHT * 0.05,
          PERSON_HEIGHT * 0.05,
          d > w ? d : PERSON_HEIGHT * 0.05,
        ),
        x,
        parapetH + PERSON_HEIGHT * 0.72,
        z,
        trim,
      ),
    )
  }

  // Corner pillars
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const x = sx * deckEdge
    const z = sz * deckEdge
    deck.push(
      colored(
        new THREE.BoxGeometry(PERSON_HEIGHT * 0.5, parapetH * 1.5, PERSON_HEIGHT * 0.5),
        x,
        parapetH * 0.75,
        z,
        concrete,
      ),
    )
    deck.push(
      colored(
        new THREE.BoxGeometry(PERSON_HEIGHT * 0.2, PERSON_HEIGHT * 1.1, PERSON_HEIGHT * 0.2),
        x,
        parapetH + PERSON_HEIGHT * 0.55,
        z,
        steelDark,
      ),
    )
  }

  // ── Roof mechanicals ─────────────────────────────────────────────
  const vents: [number, number, number][] = [
    [boardHalf + CELL_SIZE * 2.2, CELL_SIZE * 3.5, 0.2],
    [-(boardHalf + CELL_SIZE * 2.8), -CELL_SIZE * 2.4, 1.1],
    [CELL_SIZE * 4.5, boardHalf + CELL_SIZE * 2.6, -0.4],
    [-CELL_SIZE * 3.2, -(boardHalf + CELL_SIZE * 3.0), 0.9],
    [boardHalf + CELL_SIZE * 5.5, -CELL_SIZE * 5.0, 0.5],
    [-(boardHalf + CELL_SIZE * 4.8), CELL_SIZE * 5.5, -0.7],
    [CELL_SIZE * 6.5, CELL_SIZE * 6.0, 0.15],
    [-CELL_SIZE * 7.0, -CELL_SIZE * 4.5, 1.3],
    [CELL_SIZE * 8.2, -CELL_SIZE * 7.5, 0.6],
    [-CELL_SIZE * 5.5, CELL_SIZE * 8.0, -1.0],
    [boardHalf + CELL_SIZE * 7.2, CELL_SIZE * 2.0, 0.3],
    [-(boardHalf + CELL_SIZE * 6.5), CELL_SIZE * 1.2, 0.8],
  ]
  vents.forEach(([x, z, yaw], i) => {
    const w = PERSON_HEIGHT * (1.1 + hash01(i * 3) * 0.9)
    const d = PERSON_HEIGHT * (0.9 + hash01(i * 5) * 0.8)
    const h = PERSON_HEIGHT * (0.55 + hash01(i * 7) * 0.5)
    deck.push(colored(rotY(new THREE.BoxGeometry(w, h, d), yaw), x, h / 2, z, steel))
    deck.push(
      colored(
        rotY(new THREE.BoxGeometry(w * 0.85, PERSON_HEIGHT * 0.08, d * 0.85), yaw),
        x,
        h + 0.04,
        z,
        steelDark,
      ),
    )
    // Fan grille ribs
    for (let g = -1; g <= 1; g++) {
      deck.push(
        colored(
          rotY(new THREE.BoxGeometry(w * 0.7, PERSON_HEIGHT * 0.03, PERSON_HEIGHT * 0.04), yaw),
          x,
          h + 0.1,
          z + g * d * 0.22,
          trim,
        ),
      )
    }
    if (hash01(i * 2.1) > 0.4) {
      deck.push(
        colored(
          new THREE.CylinderGeometry(PERSON_HEIGHT * 0.12, PERSON_HEIGHT * 0.14, PERSON_HEIGHT * 0.85, 6),
          x + w * 0.28,
          h + PERSON_HEIGHT * 0.4,
          z,
          rust,
        ),
      )
    }
  })

  // Satellite dishes
  for (const [x, z] of [
    [boardHalf + CELL_SIZE * 3.8, -CELL_SIZE * 6.5],
    [-(boardHalf + CELL_SIZE * 5.2), CELL_SIZE * 4.0],
    [CELL_SIZE * 7.5, boardHalf + CELL_SIZE * 4.5],
  ] as const) {
    const dish = new THREE.CircleGeometry(PERSON_HEIGHT * 0.55, 12)
    dish.rotateX(-0.9)
    deck.push(colored(dish, x, PERSON_HEIGHT * 0.85, z, trim))
    deck.push(
      colored(
        new THREE.CylinderGeometry(0.06, 0.08, PERSON_HEIGHT * 0.7, 5),
        x,
        PERSON_HEIGHT * 0.35,
        z,
        steelDark,
      ),
    )
  }

  // Cable trays
  for (const side of [-1, 1] as const) {
    const z = side * (boardHalf + CELL_SIZE * 1.6)
    const pipe = new THREE.CylinderGeometry(
      PERSON_HEIGHT * 0.08,
      PERSON_HEIGHT * 0.08,
      CELL_SIZE * 5.5,
      6,
    )
    pipe.rotateZ(Math.PI / 2)
    deck.push(colored(pipe, CELL_SIZE * 2.5 * side, PERSON_HEIGHT * 0.35, z, steelDark))
    for (let k = -2; k <= 2; k++) {
      deck.push(
        colored(
          new THREE.BoxGeometry(PERSON_HEIGHT * 0.1, PERSON_HEIGHT * 0.3, PERSON_HEIGHT * 0.1),
          CELL_SIZE * 2.5 * side + k * CELL_SIZE * 1.1,
          PERSON_HEIGHT * 0.15,
          z,
          steel,
        ),
      )
    }
    // Ladder tray beside the pipe
    deck.push(
      colored(
        new THREE.BoxGeometry(CELL_SIZE * 4.5, PERSON_HEIGHT * 0.08, PERSON_HEIGHT * 0.35),
        CELL_SIZE * 2.2 * side,
        PERSON_HEIGHT * 0.55,
        z + side * PERSON_HEIGHT * 0.45,
        steel,
      ),
    )
  }

  // Access stair bulkheads
  const bulkheads: [number, number, number][] = [
    [0, boardHalf + CELL_SIZE * 1.15, 0],
    [0, -(boardHalf + CELL_SIZE * 1.15), Math.PI],
    [boardHalf + CELL_SIZE * 1.15, 0, Math.PI / 2],
    [-(boardHalf + CELL_SIZE * 1.15), 0, -Math.PI / 2],
  ]
  bulkheads.forEach(([x, z, yaw]) => {
    const h = PERSON_HEIGHT * 1.15
    deck.push(
      colored(
        rotY(new THREE.BoxGeometry(PERSON_HEIGHT * 1.6, h, PERSON_HEIGHT * 1.1), yaw),
        x,
        h / 2,
        z,
        concrete,
      ),
    )
    deck.push(
      colored(
        rotY(new THREE.BoxGeometry(PERSON_HEIGHT * 0.7, PERSON_HEIGHT * 0.95, 0.08), yaw),
        x,
        PERSON_HEIGHT * 0.55,
        z + Math.cos(yaw) * PERSON_HEIGHT * 0.56,
        steelDark,
      ),
    )
    deck.push(
      colored(
        rotY(new THREE.BoxGeometry(PERSON_HEIGHT * 0.5, PERSON_HEIGHT * 0.08, 0.06), yaw),
        x,
        PERSON_HEIGHT * 1.05,
        z + Math.cos(yaw) * PERSON_HEIGHT * 0.58,
        trim,
      ),
    )
  })

  // Helipad marking on one corner of the apron
  {
    const hx = -(boardHalf + CELL_SIZE * 6.5)
    const hz = boardHalf + CELL_SIZE * 6.5
    const ring = new THREE.RingGeometry(PERSON_HEIGHT * 1.1, PERSON_HEIGHT * 1.35, 24)
    ring.rotateX(-Math.PI / 2)
    deck.push(colored(ring, hx, 0.16, hz, paint))
    deck.push(colored(new THREE.BoxGeometry(PERSON_HEIGHT * 0.25, 0.03, PERSON_HEIGHT * 1.6), hx, 0.17, hz, paint))
    deck.push(colored(new THREE.BoxGeometry(PERSON_HEIGHT * 1.6, 0.03, PERSON_HEIGHT * 0.25), hx, 0.17, hz, paint))
  }

  // Water tank + antenna
  {
    const x = boardHalf + CELL_SIZE * 6.2
    const z = boardHalf + CELL_SIZE * 5.8
    const tankH = PERSON_HEIGHT * 1.4
    deck.push(
      colored(
        new THREE.CylinderGeometry(PERSON_HEIGHT * 0.7, PERSON_HEIGHT * 0.7, tankH, 10),
        x,
        tankH / 2,
        z,
        steel,
      ),
    )
    deck.push(
      colored(
        new THREE.ConeGeometry(PERSON_HEIGHT * 0.72, PERSON_HEIGHT * 0.35, 10),
        x,
        tankH + PERSON_HEIGHT * 0.15,
        z,
        steelDark,
      ),
    )
    deck.push(
      colored(
        new THREE.CylinderGeometry(PERSON_HEIGHT * 0.08, PERSON_HEIGHT * 0.08, PERSON_HEIGHT * 2.4, 5),
        x + PERSON_HEIGHT * 0.95,
        PERSON_HEIGHT * 1.2,
        z,
        steelDark,
      ),
    )
  }

  // ── Surrounding skyscrapers — just past orbit, tall, framed against sky ─
  const pushTower = (
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    col: THREE.Color,
    seed: number,
  ) => {
    // Main shaft
    far.push(colored(new THREE.BoxGeometry(w, h, d), x, h / 2, z, col))
    // Setback crown
    const crownH = h * (0.12 + hash01(seed) * 0.1)
    far.push(
      colored(
        new THREE.BoxGeometry(w * 0.72, crownH, d * 0.72),
        x,
        h + crownH / 2,
        z,
        steelDark,
      ),
    )
    // Spire on the tallest
    if (h > PERSON_HEIGHT * 28) {
      far.push(
        colored(
          new THREE.CylinderGeometry(0.15, 0.25, PERSON_HEIGHT * 3.5, 5),
          x,
          h + crownH + PERSON_HEIGHT * 1.7,
          z,
          steel,
        ),
      )
    }
    // Vertical fins
    if (hash01(seed + 2) > 0.35) {
      for (const face of [-1, 1] as const) {
        far.push(
          colored(
            new THREE.BoxGeometry(w * 0.06, h * 0.92, d * 1.04),
            x + face * w * 0.48,
            h * 0.48,
            z,
            trim,
          ),
        )
      }
    }
    // Window grid on the inward face (toward plaza)
    const inward = Math.atan2(-x, -z)
    const cols = Math.max(3, Math.floor(w / (PERSON_HEIGHT * 0.55)))
    const rows = Math.max(6, Math.floor(h / (PERSON_HEIGHT * 1.15)))
    for (let r = 1; r < rows - 1; r++) {
      if (r % 5 === 0) continue // mechanical floor gap
      for (let c = 0; c < cols; c++) {
        if (hash01(seed + r * 11 + c * 3) < 0.22) continue
        const lit = hash01(seed + r + c) > 0.78
        const wx = ((c + 0.5) / cols - 0.5) * w * 0.75
        const wy = (r / rows) * h * 0.9 + h * 0.05
        const pane = new THREE.PlaneGeometry(PERSON_HEIGHT * 0.32, PERSON_HEIGHT * 0.4)
        pane.rotateY(inward)
        const ox = Math.sin(inward) * (d * 0.5 + 0.05)
        const oz = Math.cos(inward) * (d * 0.5 + 0.05)
        windows.push(
          colored(pane, x + Math.cos(inward) * wx + ox, wy, z - Math.sin(inward) * wx + oz, lit ? glassLit : glass, lit ? 0.7 : 0.45),
        )
      }
    }
  }

  // Primary ring — big towers framing the rooftop
  const skyR = orbitR + CELL_SIZE * 1.4
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.08
    if (hash01(i * 0.37) < 0.08) continue
    const r = skyR + hash01(i * 3.1) * CELL_SIZE * 1.8
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const w = CELL_SIZE * (1.4 + hash01(i * 2.2) * 1.6)
    const d = CELL_SIZE * (1.3 + hash01(i * 4.1) * 1.5)
    const h = PERSON_HEIGHT * (18 + hash01(i * 5.7) * 22)
    const col = facades[Math.floor(hash01(i * 1.7) * facades.length) % facades.length]!
    pushTower(x, z, w, d, h, col, i * 17)
  }

  // Secondary ring — deeper city mass
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + 0.35
    const r = skyR + CELL_SIZE * 4.5 + hash01(i * 6.1) * CELL_SIZE * 3.5
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const w = CELL_SIZE * (1.2 + hash01(i * 2.7) * 1.8)
    const d = CELL_SIZE * (1.2 + hash01(i * 3.9) * 1.6)
    const h = PERSON_HEIGHT * (14 + hash01(i * 8.3) * 20)
    const col = facades[Math.floor(hash01(i * 0.9) * facades.length) % facades.length]!
    pushTower(x, z, w, d, h, col, i * 31 + 9)
  }

  // Landmark supers — punch the skyline
  const landmarks: [number, number, number, number, number][] = [
    [skyR + CELL_SIZE * 2.2, -skyR * 0.55, CELL_SIZE * 2.0, CELL_SIZE * 1.8, PERSON_HEIGHT * 42],
    [-skyR * 0.6, skyR + CELL_SIZE * 2.0, CELL_SIZE * 1.9, CELL_SIZE * 2.1, PERSON_HEIGHT * 38],
    [skyR * 0.45, -skyR - CELL_SIZE * 1.5, CELL_SIZE * 1.7, CELL_SIZE * 2.0, PERSON_HEIGHT * 36],
    [-skyR - CELL_SIZE * 1.8, skyR * 0.25, CELL_SIZE * 2.2, CELL_SIZE * 1.7, PERSON_HEIGHT * 44],
    [skyR + CELL_SIZE * 5.5, skyR * 0.7, CELL_SIZE * 1.6, CELL_SIZE * 1.6, PERSON_HEIGHT * 32],
    [-skyR * 0.2, skyR + CELL_SIZE * 5.0, CELL_SIZE * 1.8, CELL_SIZE * 1.5, PERSON_HEIGHT * 34],
  ]
  landmarks.forEach(([x, z, w, d, h], i) => {
    pushTower(x, z, w, d, h, facades[i % facades.length]!, 100 + i * 13)
  })

  return {
    deck: mergeAndDispose(deck),
    far: mergeAndDispose(far),
    windows: mergeAndDispose(windows),
  }
}

function Billboard({
  position,
  rotationY,
}: {
  position: [number, number, number]
  rotationY: number
}) {
  const gradientMap = useMemo(() => getToonGradient(), [])
  const pole = useMemo(
    () => new THREE.MeshToonMaterial({ color: PALETTE.curb, gradientMap }),
    [gradientMap],
  )
  const face = useMemo(
    () => new THREE.MeshToonMaterial({ color: PALETTE.buildingAccent, gradientMap }),
    [gradientMap],
  )
  const poleH = PERSON_HEIGHT * 2.0
  const faceW = PERSON_HEIGHT * 2.4
  const faceH = PERSON_HEIGHT * 1.2

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={pole} position={[0, poleH / 2, 0]}>
        <boxGeometry args={[PERSON_HEIGHT * 0.12, poleH, PERSON_HEIGHT * 0.12]} />
      </mesh>
      <mesh material={face} position={[0, poleH + faceH * 0.2, PERSON_HEIGHT * 0.05]}>
        <boxGeometry args={[faceW, faceH, PERSON_HEIGHT * 0.1]} />
      </mesh>
      <mesh position={[0, poleH + faceH * 0.2, PERSON_HEIGHT * 0.12]}>
        <planeGeometry args={[faceW * 0.88, faceH * 0.8]} />
        <meshBasicMaterial color="#e8e4dc" transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

function FloodLight({ position }: { position: [number, number, number] }) {
  const gradientMap = useMemo(() => getToonGradient(), [])
  const pole = useMemo(
    () => new THREE.MeshToonMaterial({ color: PALETTE.curb, gradientMap }),
    [gradientMap],
  )
  const head = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#d8d4c0', gradientMap }),
    [gradientMap],
  )
  const poleH = PERSON_HEIGHT * 2.4

  return (
    <group position={position}>
      <mesh material={pole} position={[0, poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, poleH, 6]} />
      </mesh>
      <mesh material={head} position={[0, poleH + 0.1, 0]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[PERSON_HEIGHT * 0.55, PERSON_HEIGHT * 0.18, PERSON_HEIGHT * 0.4]} />
      </mesh>
    </group>
  )
}

export function Cityscape() {
  const gradientMap = useMemo(() => getToonGradient(), [])
  const groundMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#5a6878', gradientMap }),
    [gradientMap],
  )
  const roadMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: PALETTE.asphaltDark, gradientMap }),
    [gradientMap],
  )

  const boardHalf = CELL_SIZE * 4
  const maxDist = CELL_SIZE * 8 * 1.62
  const orbitR = maxDist * Math.sin(1.15)
  const deckSpan = CELL_SIZE * (8 + WORLD_TILE_MARGIN * 2)

  const roof = useMemo(() => buildRooftop(orbitR, boardHalf), [orbitR, boardHalf])
  const worldTiles = useMemo(() => buildWorldTiles(), [])

  useEffect(
    () => () => {
      roof.deck.dispose()
      roof.far.dispose()
      roof.windows.dispose()
      worldTiles.pads.dispose()
      worldTiles.rims.dispose()
    },
    [roof, worldTiles],
  )

  const meshMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const glassMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  const tileMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )

  const lights = useMemo(() => {
    const edge = boardHalf + CELL_SIZE * 0.75
    const spots: [number, number][] = [
      [edge, edge],
      [edge, -edge],
      [-edge, edge],
      [-edge, -edge],
      [0, edge + CELL_SIZE * 0.35],
      [0, -edge - CELL_SIZE * 0.35],
      [edge + CELL_SIZE * 0.35, 0],
      [-edge - CELL_SIZE * 0.35, 0],
    ]
    // Outer deck floodlights at parapet corners
    const outer = boardHalf + CELL_SIZE * (WORLD_TILE_MARGIN * 0.85)
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      spots.push([sx * outer, sz * outer])
    }
    return spots.map(([x, z], i) => ({
      key: `fl-${i}`,
      position: [x, 0, z] as [number, number, number],
    }))
  }, [boardHalf])

  const billboards = useMemo(() => {
    const r = boardHalf + CELL_SIZE * 7.5
    return [
      [r * 0.7, 0, -r * 0.55, 0.5],
      [-r * 0.65, 0, r * 0.6, -0.8],
      [r * 0.15, 0, r * 0.85, 2.6],
    ].map(([x, y, z, rot], i) => ({
      key: `bb-${i}`,
      position: [x, y, z] as [number, number, number],
      rotationY: rot,
    }))
  }, [boardHalf])

  return (
    <group>
      {/* Streets far below the pad — kept dark so the skyline + sky own the horizon */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.4, 0]}
        material={groundMat}
        receiveShadow
      >
        <ringGeometry args={[deckSpan * 0.52, 155, 48]} />
      </mesh>

      {/* Roof slab under the tiles */}
      <mesh position={[0, -0.12, 0]} material={roadMat} receiveShadow>
        <boxGeometry args={[deckSpan + CELL_SIZE * 0.8, 0.2, deckSpan + CELL_SIZE * 0.8]} />
      </mesh>

      <mesh geometry={worldTiles.pads} material={tileMat} receiveShadow castShadow />
      <mesh geometry={worldTiles.rims} material={tileMat} receiveShadow />

      <mesh geometry={roof.deck} material={meshMat} castShadow receiveShadow />
      <mesh geometry={roof.far} material={meshMat} castShadow receiveShadow />
      <mesh geometry={roof.windows} material={glassMat} />

      {lights.map(({ key, position }) => (
        <FloodLight key={key} position={position} />
      ))}
      {billboards.map(({ key, ...b }) => (
        <Billboard key={key} {...b} />
      ))}
    </group>
  )
}
