import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { TrackedPiece } from '../game/pieceIds'
import {
  CELL_SIZE,
  PERSON_HEIGHT,
  squareToCoords,
  WORLD_TILE_MARGIN,
} from '../game/types'
import type { Square } from '../game/types'
import { Board } from './Board'
import { Cityscape } from './Cityscape'
import { Pieces } from './Pieces'
import { walkY } from './terrainHeight'
import { PALETTE } from './toon'

interface ChessSceneProps {
  pieces: TrackedPiece[]
  selected: Square | null
  /** Stable id — pull-in only when the user focuses a new fighter. */
  selectedId?: string | null
  legalTargets: Square[]
  lastMove: { from: Square; to: Square } | null
  checkedKing: Square | null
  /** Primary piece giving check (facing target for the bodyguard). */
  checkerSquare?: Square | null
  defeatedKing?: Square | null
  onSquareClick: (square: Square) => void
  boardFreeAtRef?: MutableRefObject<number>
}

const BOARD_SPAN = CELL_SIZE * 8
/** Far enough that the full 8×8 (plus HUD chrome) fits in view. */
const MAX_DISTANCE = BOARD_SPAN * 1.62
const MIN_DISTANCE = BOARD_SPAN * 0.36
const OVERVIEW_DISTANCE = BOARD_SPAN * 1.28
/** Pull-in distance when a fighter is tapped. */
const FOCUS_DISTANCE = BOARD_SPAN * 0.52
const PAN_BOUNDS = BOARD_SPAN * 0.72
/** Matches Cityscape / terrainHeight bowl radius. */
const WORLD_RADIUS = CELL_SIZE * (4 + WORLD_TILE_MARGIN + 10)
/**
 * Fog is camera-distance based. At max zoom the far board edge is ~MAX + half
 * diagonal; keep the 8×8 + apron clear and only melt the outer berm.
 */
const FOG_NEAR = MAX_DISTANCE + CELL_SIZE * (6 + WORLD_TILE_MARGIN * 0.5)
const FOG_FAR = MAX_DISTANCE + WORLD_RADIUS * 1.25
/** Extra headroom so sky / distant entrance cliffs never clip at overview. */
const CAMERA_FAR = FOG_FAR + CELL_SIZE * 40

const _offset = new THREE.Vector3()

/** Closed blue sky sphere + soft cloud puffs — fog-immune. */
function SkyDome() {
  const { scene } = useThree()
  const skyMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#5eb0e6',
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      }),
    [],
  )
  const cloudMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.62,
        fog: false,
        depthWrite: false,
      }),
    [],
  )
  useEffect(() => {
    const prev = scene.background
    scene.background = new THREE.Color('#6bb4e8')
    return () => {
      scene.background = prev
      skyMat.dispose()
      cloudMat.dispose()
    }
  }, [scene, skyMat, cloudMat])

  const R = WORLD_RADIUS * 1.85
  // Keep puffs high and out past the bowl so they never sit in front of the board
  const clouds: [number, number, number, number][] = [
    [0, 95, -140, 38],
    [-130, 88, 90, 30],
    [140, 85, 50, 28],
    [-60, 100, 150, 26],
    [70, 105, -110, 34],
    [-160, 80, -40, 24],
  ]
  return (
    <group>
      <mesh material={skyMat} frustumCulled={false}>
        <sphereGeometry args={[R, 48, 28]} />
      </mesh>
      {clouds.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} material={cloudMat} frustumCulled={false}>
          <sphereGeometry args={[s, 12, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Ease orbit target toward the focused fighter. Does not call controls.update()
 * — drei's OrbitControls already does, and double-updating with damping stutters.
 * User drags pause follow so pan/orbit stay responsive.
 */
function CameraFocus({
  selected,
  selectedId,
}: {
  selected: Square | null
  selectedId: string | null
}) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const desired = useRef(new THREE.Vector3(0, 0.4, 0))
  const pullDist = useRef<number | null>(null)
  const active = useRef(false)
  const dragging = useRef(false)
  const prevFocusId = useRef<string | null>(null)

  useEffect(() => {
    if (!controls) return
    const onStart = () => {
      dragging.current = true
    }
    const onEnd = () => {
      dragging.current = false
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls])

  useEffect(() => {
    if (selected) {
      const [x, z] = squareToCoords(selected)
      desired.current.set(x, walkY(x, z) + PERSON_HEIGHT * 0.55, z)
      active.current = true
      // Zoom-in only on a new focus tap — not when the same fighter walks.
      if (selectedId && prevFocusId.current !== selectedId) {
        pullDist.current = FOCUS_DISTANCE
      }
    } else {
      // Leave the camera where the player put it; don't yank back to center.
      pullDist.current = null
      active.current = false
    }
    prevFocusId.current = selectedId
  }, [selected, selectedId])

  useFrame((_, dt) => {
    if (!controls || !active.current || dragging.current) return

    const k = 1 - Math.exp(-7.5 * Math.min(dt, 0.05))
    const target = controls.target
    if (target.distanceToSquared(desired.current) > 1e-5) {
      target.lerp(desired.current, k)
    }

    if (pullDist.current != null) {
      const cam = controls.object
      _offset.subVectors(cam.position, target)
      const cur = _offset.length()
      const next = THREE.MathUtils.lerp(cur, pullDist.current, k)
      if (cur > 1e-4) _offset.multiplyScalar(next / cur)
      cam.position.copy(target).add(_offset)
      if (Math.abs(cur - pullDist.current) < 0.08) pullDist.current = null
    }
  })

  return null
}

/** Keep orbit pan from sliding off the board into empty fog. */
function PanClamp({ limit }: { limit: number }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  useFrame(() => {
    if (!controls) return
    const t = controls.target
    t.x = THREE.MathUtils.clamp(t.x, -limit, limit)
    t.z = THREE.MathUtils.clamp(t.z, -limit, limit)
  })
  return null
}

function SceneContent(props: ChessSceneProps) {
  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      {/* Fog starts past the 8×8 + apron; melts cliffs into the blue horizon */}
      <fog attach="fog" args={[PALETTE.fog, FOG_NEAR, FOG_FAR]} />

      <SkyDome />

      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#c5e0f5', '#6a7858', 0.95]} />
      <directionalLight
        castShadow
        position={[53, 70, -20]}
        intensity={1.95}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={265}
        shadow-camera-left={-135}
        shadow-camera-right={135}
        shadow-camera-top={135}
        shadow-camera-bottom={-135}
        color="#fff2d8"
      />
      <directionalLight position={[-35, 27, 31]} intensity={0.45} color="#98b878" />
      <pointLight position={[0, 23, 0]} intensity={0.3} distance={96} color="#fff8ec" />

      <Cityscape />

      <group>
        <Board
          selected={props.selected}
          legalTargets={props.legalTargets}
          lastMove={props.lastMove}
          checkedKing={props.checkedKing}
          onSquareClick={props.onSquareClick}
        />
        <Pieces
          pieces={props.pieces}
          selected={props.selected}
          checkedKing={props.checkedKing}
          checkerSquare={props.checkerSquare ?? null}
          defeatedKing={props.defeatedKing}
          onPieceClick={props.onSquareClick}
          boardFreeAtRef={props.boardFreeAtRef}
        />
      </group>

      <OrbitControls
        makeDefault
        enablePan
        screenSpacePanning
        enableDamping
        dampingFactor={0.08}
        panSpeed={0.7}
        rotateSpeed={0.55}
        zoomSpeed={0.85}
        minPolarAngle={0.35}
        maxPolarAngle={1.15}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        target={[0, 0.4, 0]}
      />
      <CameraFocus
        selected={props.selected}
        selectedId={props.selectedId ?? null}
      />
      <PanClamp limit={PAN_BOUNDS} />
    </>
  )
}

export function ChessScene(props: ChessSceneProps) {
  const camDist = OVERVIEW_DISTANCE
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{
        position: [camDist * 0.55, camDist * 0.72, -camDist * 0.85],
        fov: 42,
        near: 0.5,
        far: CAMERA_FAR,
      }}
      gl={{
        antialias: true,
        alpha: false,
        toneMappingExposure: 1.08,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(PALETTE.sky), 1)
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
