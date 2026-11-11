import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CELL_SIZE, coordsToSquare, squareToCoords, type Square } from '../game/types'
import { buildBoardForest } from './boardForest'
import { isPointerDrag } from './isPointerDrag'
import { GROUND_RADIUS, TERRAIN_REV, WATER_Y, groundY, walkY } from './terrainHeight'
import { getToonGradient, PALETTE } from './toon'

interface BoardProps {
  selected: Square | null
  legalTargets: Square[]
  lastMove: { from: Square; to: Square } | null
  checkedKing: Square | null
  onSquareClick: (square: Square) => void
}

/** Tight spacing on the hills; the flat outer bowl stays coarse. */
const FINE_HALF = CELL_SIZE * 5.2
const FINE_STEP = 0.32
const COARSE_STEP = 4.2

function axisSamples(limit: number, fine: number, fineStep: number, coarseStep: number) {
  const xs: number[] = []
  const push = (v: number) => {
    const x = Math.max(-limit, Math.min(limit, v))
    if (xs.length === 0 || x - xs[xs.length - 1]! > 1e-3) xs.push(x)
  }
  push(-limit)
  for (let x = -limit + coarseStep; x < -fine; x += coarseStep) push(x)
  for (let x = -fine; x <= fine; x += fineStep) push(x)
  push(fine)
  for (let x = fine + coarseStep; x < limit; x += coarseStep) push(x)
  push(limit)
  return xs
}

function hash2(ix: number, iz: number) {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function valueNoise(x: number, z: number) {
  const x0 = Math.floor(x)
  const z0 = Math.floor(z)
  const fx = x - x0
  const fz = z - z0
  const sx = fx * fx * (3 - 2 * fx)
  const sz = fz * fz * (3 - 2 * fz)
  const a = hash2(x0, z0)
  const b = hash2(x0 + 1, z0)
  const c = hash2(x0, z0 + 1)
  const d = hash2(x0 + 1, z0 + 1)
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz
}

function fbm(x: number, z: number) {
  let v = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < 4; i++) {
    v += a * valueNoise(x * f, z * f)
    f *= 2
    a *= 0.5
  }
  return v
}

/** Repeating grass mottling so plateaus aren't one flat green. */
function grassDetailMap() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create grass detail canvas')
  const img = ctx.createImageData(size, size)
  const data = img.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const blot = fbm(u * 3.2, v * 3.2)
      const mid = fbm(u * 7.5 + 2.2, v * 7.5 + 0.8)
      const shade = 0.58 + blot * 0.34 + (mid - 0.5) * 0.16
      const g = Math.max(0, Math.min(255, Math.round(shade * 255)))
      const i = (y * size + x) * 4
      data[i] = g
      data[i + 1] = g
      data[i + 2] = g
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.LinearSRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.needsUpdate = true
  return tex
}

const MOSS = new THREE.Color('#5a7a48')
const MOSS_DEEP = new THREE.Color('#456338')
const GRASS = new THREE.Color('#6a864e')
const GRASS_FLAT = new THREE.Color('#62824a')
const MUD = new THREE.Color('#5e5340')
const BANK = new THREE.Color('#6a7058')
const WET = new THREE.Color('#4a6558')

function tintAt(x: number, z: number, y: number, out: THREE.Color) {
  const alongRiver = Math.abs(x) < CELL_SIZE * 2.4 && y < WATER_Y + 0.45
  const patch = fbm(x * 0.11, z * 0.11)

  if (alongRiver) {
    out.copy(WET)
  } else if (y >= 0.35) {
    // Hills / plateaus — richer green
    const t = Math.min(1, (y - 0.35) / 1.2)
    out.copy(GRASS).lerp(MOSS, t)
    out.lerp(MOSS_DEEP, patch * 0.65 * t)
  } else if (y < -0.35) {
    // Only the submerged / steep bank stays muddy
    const t = Math.min(1, (-0.35 - y) / 0.7)
    out.copy(BANK).lerp(MUD, t)
  } else {
    // Flat apron + mid board — grassy everywhere off the river
    out.copy(GRASS_FLAT).lerp(MOSS, patch * 0.4)
    out.lerp(GRASS, 0.2 + patch * 0.25)
  }
  return out
}

function buildTerrain() {
  const xs = axisSamples(GROUND_RADIUS, FINE_HALF, FINE_STEP, COARSE_STEP)
  const zs = axisSamples(GROUND_RADIUS, FINE_HALF, FINE_STEP, COARSE_STEP)
  const nx = xs.length
  const nz = zs.length
  const positions = new Float32Array(nx * nz * 3)
  const uvs = new Float32Array(nx * nz * 2)
  const colors = new Float32Array(nx * nz * 3)
  const color = new THREE.Color()
  const uvScale = 1 / 14

  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = xs[ix]!
      const z = zs[iz]!
      const y = groundY(x, z)
      const i = iz * nx + ix
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      uvs[i * 2] = x * uvScale
      uvs[i * 2 + 1] = z * uvScale
      tintAt(x, z, y, color)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
  }

  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6)
  let k = 0
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix
      const b = a + 1
      const c = a + nx
      const d = c + 1
      indices[k++] = a
      indices[k++] = c
      indices[k++] = b
      indices[k++] = b
      indices[k++] = c
      indices[k++] = d
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.computeVertexNormals()
  return geo
}

/**
 * Water surface that only fills where the bed dips under WATER_Y — so banks
 * (including off-board apron) clip the river instead of a hard rectangle.
 */
function buildWater() {
  const halfX = CELL_SIZE * 3.4
  const halfZ = GROUND_RADIUS * 1.05
  const stepX = 0.55
  const stepZ = 1.1
  const waterY = WATER_Y + 0.08
  const wet = WATER_Y + 0.02

  const xs: number[] = []
  for (let x = -halfX; x <= halfX + 1e-6; x += stepX) xs.push(x)
  const zs: number[] = []
  for (let z = -halfZ; z <= halfZ + 1e-6; z += stepZ) zs.push(z)

  const nx = xs.length
  const nz = zs.length
  const submerged = new Uint8Array(nx * nz)
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      submerged[iz * nx + ix] = groundY(xs[ix]!, zs[iz]!) < wet ? 1 : 0
    }
  }

  const positions: number[] = []
  const indices: number[] = []
  const vertIndex = new Int32Array(nx * nz).fill(-1)

  const ensureVert = (ix: number, iz: number) => {
    const id = iz * nx + ix
    if (vertIndex[id]! >= 0) return vertIndex[id]!
    const vi = positions.length / 3
    positions.push(xs[ix]!, waterY, zs[iz]!)
    vertIndex[id] = vi
    return vi
  }

  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix
      const b = a + 1
      const c = a + nx
      const d = c + 1
      // Keep a cell if any corner is wet — soft shoreline against the banks
      if (!(submerged[a]! | submerged[b]! | submerged[c]! | submerged[d]!)) continue
      const ia = ensureVert(ix, iz)
      const ib = ensureVert(ix + 1, iz)
      const ic = ensureVert(ix, iz + 1)
      const idv = ensureVert(ix + 1, iz + 1)
      indices.push(ia, ic, ib, ib, ic, idv)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/** Cell marker draped on the surface — only shown once a piece is selected. */
function cellPatch(square: Square) {
  const [cx, cz] = squareToCoords(square)
  const n = 6
  const span = CELL_SIZE * 0.9
  const geo = new THREE.PlaneGeometry(span, span, n, n)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx
    const z = pos.getZ(i) + cz
    pos.setXYZ(i, x, walkY(x, z) + 0.07, z)
  }
  geo.computeVertexNormals()
  return geo
}

/**
 * Full 8×8 cell outline grid, draped on the terrain so the board reads clearly
 * once a fighter is selected.
 */
function buildBoardBorders() {
  const half = CELL_SIZE * 4
  const ribbon = CELL_SIZE * 0.028
  const lift = 0.1
  const samples = 14
  const positions: number[] = []
  const indices: number[] = []

  // Offset is chosen so D × P points +Y — otherwise rank lines face down and
  // disappear under FrontSide culling (leaving only file columns).
  const pushRibbon = (ax: number, az: number, bx: number, bz: number) => {
    const dx = bx - ax
    const dz = bz - az
    const len = Math.hypot(dx, dz) || 1
    const px = (dz / len) * ribbon
    const pz = (-dx / len) * ribbon
    let base = positions.length / 3
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const x = ax + dx * t
      const z = az + dz * t
      const y = walkY(x, z) + lift
      positions.push(x - px, y, z - pz, x + px, y, z + pz)
      if (i > 0) {
        const a = base
        const b = base + 1
        const c = base + 2
        const d = base + 3
        indices.push(a, c, b, b, c, d)
        base += 2
      }
    }
  }

  // Vertical edges (constant x) — shared borders between files
  for (let i = 0; i <= 8; i++) {
    const x = -half + i * CELL_SIZE
    pushRibbon(x, -half, x, half)
  }
  // Horizontal edges (constant z) — shared borders between ranks
  for (let i = 0; i <= 8; i++) {
    const z = -half + i * CELL_SIZE
    pushRibbon(-half, z, half, z)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function Board({
  selected,
  legalTargets,
  onSquareClick,
}: BoardProps) {
  const pointerDown = useRef({ x: 0, y: 0 })
  const gradientMap = useMemo(() => getToonGradient(), [])

  // Rebuild when the valley profile changes (empty deps would keep a stale mesh across HMR).
  const terrain = useMemo(() => buildTerrain(), [TERRAIN_REV])
  const water = useMemo(() => buildWater(), [TERRAIN_REV])
  const grassMap = useMemo(() => grassDetailMap(), [])
  const forest = useMemo(() => buildBoardForest(), [TERRAIN_REV])
  useEffect(
    () => () => {
      terrain.dispose()
      water.dispose()
      grassMap.dispose()
      forest.solid.dispose()
      forest.soft.dispose()
    },
    [terrain, water, grassMap, forest],
  )

  const forestMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )
  const forestSoftMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
    [gradientMap],
  )

  const marks = useMemo(() => {
    if (!selected) return []
    const list: { square: Square; geo: THREE.BufferGeometry; color: string }[] = [
      { square: selected, geo: cellPatch(selected), color: PALETTE.select },
    ]
    for (const square of legalTargets) {
      list.push({ square, geo: cellPatch(square), color: PALETTE.move })
    }
    return list
  }, [selected, legalTargets])

  const borderGeo = useMemo(() => (selected ? buildBoardBorders() : null), [selected])

  useEffect(
    () => () => {
      marks.forEach((m) => m.geo.dispose())
    },
    [marks],
  )

  useEffect(
    () => () => {
      borderGeo?.dispose()
    },
    [borderGeo],
  )

  const terrainMat = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, map: grassMap, gradientMap }),
    [gradientMap, grassMap],
  )
  const waterMat = useMemo(() => {
    const m = new THREE.MeshToonMaterial({
      color: '#3d7a6c',
      gradientMap,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
    return m
  }, [gradientMap])

  const pick = (clientX: number, clientY: number, point: THREE.Vector3) => {
    if (isPointerDrag(pointerDown.current, { clientX, clientY })) return
    const square = coordsToSquare(point.x, point.z)
    if (square) onSquareClick(square)
  }

  return (
    <group>
      <mesh
        geometry={terrain}
        material={terrainMat}
        receiveShadow
        onPointerDown={(e) => {
          pointerDown.current = { x: e.clientX, y: e.clientY }
        }}
        onClick={(e) => {
          e.stopPropagation()
          pick(e.clientX, e.clientY, e.point)
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      />

      {/* Valley water — clipped to submerged bed so banks frame the shoreline */}
      <mesh
        geometry={water}
        material={waterMat}
        renderOrder={2}
        receiveShadow
        onPointerDown={(e) => {
          pointerDown.current = { x: e.clientX, y: e.clientY }
        }}
        onClick={(e) => {
          e.stopPropagation()
          pick(e.clientX, e.clientY, e.point)
        }}
      />

      {/* Forest clutter in cell corners — rocks, stumps, shrubs, small trees */}
      <mesh
        geometry={forest.solid}
        material={forestMat}
        castShadow
        receiveShadow
        raycast={() => {}}
      />
      <mesh
        geometry={forest.soft}
        material={forestSoftMat}
        castShadow
        receiveShadow
        raycast={() => {}}
      />

      {borderGeo && (
        <mesh geometry={borderGeo} renderOrder={1} raycast={() => {}}>
          <meshBasicMaterial
            color="#f2efe4"
            transparent
            opacity={0.72}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {marks.map(({ square, geo, color }) => (
        <mesh
          key={square}
          geometry={geo}
          renderOrder={2}
          onPointerDown={(e) => {
            pointerDown.current = { x: e.clientX, y: e.clientY }
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (isPointerDrag(pointerDown.current, e)) return
            onSquareClick(square)
          }}
        >
          <meshBasicMaterial
            color={color}
            transparent
            opacity={square === selected ? 0.38 : 0.28}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}
    </group>
  )
}
