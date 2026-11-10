import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import {
  CELL_SIZE,
  FILES,
  RANKS,
  squareToCoords,
  type Square,
} from '../game/types'
import { isPointerDrag } from './isPointerDrag'
import { getToonGradient, hash01, PALETTE } from './toon'

interface BoardProps {
  selected: Square | null
  legalTargets: Square[]
  lastMove: { from: Square; to: Square } | null
  checkedKing: Square | null
  onSquareClick: (square: Square) => void
}

/** Slight warm/cool/dust shifts — close grays, not a loud checker. */
const SECTOR_A_VARIANTS = ['#8e969e', '#8a929a', '#869098', '#8c949c'] as const
const SECTOR_B_VARIANTS = ['#7e868e', '#7a828a', '#768088', '#7c848c'] as const

function BlockDressing({
  file,
  rank,
  light,
  detailMat,
  accentMat,
  warmMat,
  coolMat,
  grateMat,
}: {
  file: number
  rank: number
  light: boolean
  detailMat: THREE.MeshToonMaterial
  accentMat: THREE.MeshToonMaterial
  warmMat: THREE.MeshToonMaterial
  coolMat: THREE.MeshToonMaterial
  grateMat: THREE.MeshToonMaterial
}) {
  const seed = file * 17 + rank * 31
  const props = useMemo(() => {
    const items: ReactNode[] = []
    const kind = hash01(seed)
    const kind2 = hash01(seed + 9)
    const kind3 = hash01(seed + 21)
    const motif = Math.floor(kind * 8)

    // Primary motif — every pad gets one so the grid feels authored
    if (motif === 0) {
      items.push(
        <mesh
          key="hatch"
          position={[0, 0.14, 0]}
          rotation={[-Math.PI / 2, 0, kind * 2]}
        >
          <ringGeometry args={[0.28, 0.42, 16]} />
          <meshBasicMaterial
            color={PALETTE.ink}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>,
      )
    } else if (motif === 1) {
      const alongX = kind2 > 0.5
      items.push(
        <mesh
          key="stripe"
          position={[(kind3 - 0.5) * 0.6, 0.15, (kind2 - 0.5) * 0.6]}
          material={detailMat}
          rotation={alongX ? [0, Math.PI / 2, 0] : [0, 0, 0]}
        >
          <boxGeometry args={[0.14, 0.025, 1.55]} />
        </mesh>,
      )
    } else if (motif === 2) {
      items.push(
        <mesh key="grate" position={[0, 0.15, 0]} material={grateMat}>
          <boxGeometry args={[0.75, 0.03, 0.5]} />
        </mesh>,
      )
      for (let g = -1; g <= 1; g++) {
        items.push(
          <mesh key={`slot-${g}`} position={[g * 0.2, 0.165, 0]} material={accentMat}>
            <boxGeometry args={[0.08, 0.02, 0.4]} />
          </mesh>,
        )
      }
    } else if (motif === 3) {
      const yaw = Math.floor(kind2 * 4) * (Math.PI / 2)
      const paint = kind3 > 0.5 ? warmMat : coolMat
      items.push(
        <mesh key="arrow" position={[0, 0.15, 0]} rotation={[0, yaw, 0]} material={paint}>
          <boxGeometry args={[0.95, 0.02, 0.16]} />
        </mesh>,
        <mesh
          key="arrow-tip"
          position={[Math.sin(yaw) * 0.48, 0.151, Math.cos(yaw) * 0.48]}
          rotation={[0, yaw + Math.PI / 4, 0]}
          material={paint}
        >
          <boxGeometry args={[0.32, 0.02, 0.32]} />
        </mesh>,
      )
    } else if (motif === 4) {
      const ox = (kind2 > 0.5 ? 1 : -1) * 1.55
      const oz = (kind3 > 0.5 ? 1 : -1) * 1.55
      items.push(
        <mesh key="stub" position={[ox, 0.16, oz]} material={accentMat}>
          <boxGeometry args={[0.4, 0.07, 0.4]} />
        </mesh>,
      )
    } else if (motif === 5) {
      items.push(
        <mesh key="plate" position={[0, 0.15, 0]} material={grateMat}>
          <boxGeometry args={[0.9, 0.025, 0.9]} />
        </mesh>,
        <mesh key="plate-in" position={[0, 0.162, 0]} material={accentMat}>
          <boxGeometry args={[0.55, 0.02, 0.55]} />
        </mesh>,
      )
    } else if (motif === 6) {
      const alongX = kind2 > 0.5
      for (let d = -1; d <= 1; d++) {
        items.push(
          <mesh
            key={`dash-${d}`}
            position={[alongX ? d * 0.72 : 0, 0.15, alongX ? 0 : d * 0.72]}
            material={detailMat}
          >
            <boxGeometry args={[alongX ? 0.48 : 0.11, 0.02, alongX ? 0.11 : 0.48]} />
          </mesh>,
        )
      }
    } else {
      items.push(
        <mesh
          key="wear"
          position={[(kind2 - 0.5) * 1.1, 0.14, (kind3 - 0.5) * 1.1]}
          rotation={[-Math.PI / 2, 0, kind * 3]}
        >
          <circleGeometry args={[0.32 + kind2 * 0.22, 12]} />
          <meshBasicMaterial color="#6a8070" transparent opacity={0.28} />
        </mesh>,
      )
    }

    // Secondary accent — rivets, edge ticks, or a warm paint chip
    if (kind3 > 0.55) {
      items.push(
        <mesh
          key="chip"
          position={[(hash01(seed + 7) - 0.5) * 2.1, 0.148, (hash01(seed + 13) - 0.5) * 2.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={warmMat}
        >
          <circleGeometry args={[0.11, 8]} />
        </mesh>,
      )
    }
    if (!light && kind > 0.62) {
      const ox = (hash01(seed + 3) - 0.5) * 1.7
      const oz = (hash01(seed + 5) - 0.5) * 1.7
      items.push(
        <mesh key="bolt" position={[ox, 0.155, oz]} material={coolMat}>
          <boxGeometry args={[0.22, 0.04, 0.22]} />
        </mesh>,
      )
    }

    // Soft sector id tick in one corner — tiny, readable up close
    const idYaw = ((file + rank) % 4) * (Math.PI / 2)
    items.push(
      <mesh
        key="id"
        position={[Math.cos(idYaw) * 1.7, 0.145, Math.sin(idYaw) * 1.7]}
        rotation={[-Math.PI / 2, 0, idYaw]}
      >
        <planeGeometry args={[0.55, 0.12]} />
        <meshBasicMaterial
          color={light ? '#c8d0d8' : '#5a6870'}
          transparent
          opacity={0.35}
        />
      </mesh>,
    )

    return items
  }, [file, rank, light, seed, detailMat, accentMat, warmMat, coolMat, grateMat])

  return <group>{props}</group>
}

export function Board({
  selected,
  legalTargets,
  lastMove,
  checkedKing,
  onSquareClick,
}: BoardProps) {
  const pointerDown = useRef({ x: 0, y: 0 })
  const gradientMap = useMemo(() => getToonGradient(), [])

  const mats = useMemo(() => {
    const makePad = (hex: string) =>
      new THREE.MeshToonMaterial({ color: hex, gradientMap })

    return {
      sectorA: SECTOR_A_VARIANTS.map(makePad),
      sectorB: SECTOR_B_VARIANTS.map(makePad),
      rimA: makePad(PALETTE.sectorARim),
      rimB: makePad(PALETTE.sectorBRim),
      curb: makePad(PALETTE.curb),
      asphaltDark: makePad(PALETTE.asphaltDark),
      detail: makePad('#b4bcc6'),
      accent: makePad('#5a626c'),
      warm: makePad('#e8c090'),
      cool: makePad('#8ec0d8'),
      grate: makePad('#3a424a'),
    }
  }, [gradientMap])

  const squares = useMemo(() => {
    const list: {
      square: Square
      x: number
      z: number
      light: boolean
      file: number
      rank: number
      variant: number
    }[] = []
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = `${FILES[file]}${RANKS[rank]}` as Square
        const [x, z] = squareToCoords(square)
        const seed = file * 17 + rank * 31
        list.push({
          square,
          x,
          z,
          light: (file + rank) % 2 === 1,
          file,
          rank,
          variant: Math.floor(hash01(seed + 11) * 4) % 4,
        })
      }
    }
    return list
  }, [])

  const gap = 0.12
  const tile = CELL_SIZE - gap
  const boardSpan = CELL_SIZE * 8

  return (
    <group>
      <mesh position={[0, -0.32, 0]} material={mats.curb} receiveShadow castShadow>
        <boxGeometry args={[boardSpan + 3.1, 0.5, boardSpan + 3.1]} />
      </mesh>
      <mesh position={[0, -0.52, 0]} material={mats.asphaltDark} receiveShadow>
        <boxGeometry args={[boardSpan + 5.6, 0.35, boardSpan + 5.6]} />
      </mesh>

      {/* Simple border around the playable 8×8 — pads stay quiet close-grays. */}
      <mesh position={[0, -0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[boardSpan + 1.1, 0.2, boardSpan + 1.1]} />
        <meshBasicMaterial color="#3a424c" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[boardSpan + 0.55, 0.06, boardSpan + 0.55]} />
        <meshBasicMaterial color="#5a646e" />
      </mesh>
      {(
        [
          [0, boardSpan * 0.5 + 0.22, boardSpan + 0.55, 0.22],
          [0, -(boardSpan * 0.5 + 0.22), boardSpan + 0.55, 0.22],
          [boardSpan * 0.5 + 0.22, 0, 0.22, boardSpan + 0.55],
          [-(boardSpan * 0.5 + 0.22), 0, 0.22, boardSpan + 0.55],
        ] as const
      ).map(([x, z, w, d], i) => (
        <mesh key={`grid-border-${i}`} position={[x, 0.08, z]}>
          <boxGeometry args={[w, 0.05, d]} />
          <meshBasicMaterial color="#c8d0d8" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}

      {squares.map(({ square, x, z, light, file, rank, variant }) => {
        const isSelected = selected === square
        const isTarget = legalTargets.includes(square)
        const isLast =
          lastMove?.from === square || lastMove?.to === square
        const isCheck = checkedKing === square
        const pad = light ? mats.sectorA[variant] : mats.sectorB[variant]
        const rim = light ? mats.rimA : mats.rimB

        return (
          <group key={square} position={[x, 0, z]}>
            <mesh
              material={pad}
              position={[0, 0.02, 0]}
              receiveShadow
              castShadow
              onPointerDown={(e) => {
                pointerDown.current = { x: e.clientX, y: e.clientY }
              }}
              onClick={(e) => {
                if (isPointerDrag(pointerDown.current, e)) return
                e.stopPropagation()
                onSquareClick(square)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default'
              }}
            >
              <boxGeometry args={[tile, 0.22, tile]} />
            </mesh>

            <mesh material={rim} position={[0, 0.14, 0]} receiveShadow>
              <boxGeometry args={[tile + 0.06, 0.035, tile + 0.06]} />
            </mesh>

            <BlockDressing
              file={file}
              rank={rank}
              light={light}
              detailMat={mats.detail}
              accentMat={mats.accent}
              warmMat={mats.warm}
              coolMat={mats.cool}
              grateMat={mats.grate}
            />

            {isLast && (
              <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[tile * 0.92, tile * 0.92]} />
                <meshBasicMaterial
                  color={PALETTE.last}
                  transparent
                  opacity={0.26}
                />
              </mesh>
            )}
            {isSelected && (
              <>
                <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[tile * 0.28, tile * 0.36, 4]} />
                  <meshBasicMaterial
                    color={PALETTE.select}
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[tile * 0.9, tile * 0.9]} />
                  <meshBasicMaterial
                    color={PALETTE.select}
                    transparent
                    opacity={0.15}
                  />
                </mesh>
              </>
            )}
            {isTarget && (
              <group
                onPointerDown={(e) => {
                  pointerDown.current = { x: e.clientX, y: e.clientY }
                }}
                onClick={(e) => {
                  if (isPointerDrag(pointerDown.current, e)) return
                  e.stopPropagation()
                  onSquareClick(square)
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'default'
                }}
              >
                {/* Full-pad wash so long queen/rook/bishop slides stay obvious from overview. */}
                <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[tile * 0.92, tile * 0.92]} />
                  <meshBasicMaterial
                    color={PALETTE.move}
                    transparent
                    opacity={0.22}
                  />
                </mesh>
                <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[tile * 0.3, tile * 0.38, 24]} />
                  <meshBasicMaterial
                    color={PALETTE.move}
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                  <cylinderGeometry args={[tile * 0.16, tile * 0.16, 0.12, 20]} />
                  <meshBasicMaterial
                    color={PALETTE.move}
                    transparent
                    opacity={0.95}
                  />
                </mesh>
                {/* Tall hit volume so distant slides beat fighter meshes in the raycast. */}
                <mesh position={[0, 1.1, 0]}>
                  <cylinderGeometry args={[tile * 0.42, tile * 0.42, 2.2, 12]} />
                  <meshBasicMaterial
                    transparent
                    opacity={0}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            )}
            {isCheck && (
              <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.1, 1.45, 24]} />
                <meshBasicMaterial
                  color={PALETTE.check}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
