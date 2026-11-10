import { OrbitControls, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { CELL_SIZE } from '../game/types'
import type { TrackedPiece } from '../game/pieceIds'
import type { Square } from '../game/types'
import { Board } from './Board'
import { Cityscape } from './Cityscape'
import { Pieces } from './Pieces'
import { PALETTE } from './toon'

interface ChessSceneProps {
  pieces: TrackedPiece[]
  selected: Square | null
  legalTargets: Square[]
  lastMove: { from: Square; to: Square } | null
  checkedKing: Square | null
  defeatedKing?: Square | null
  onSquareClick: (square: Square) => void
  boardFreeAtRef?: MutableRefObject<number>
}

const BOARD_SPAN = CELL_SIZE * 8
/** Far enough that the full 8×8 (plus HUD chrome) fits in view. */
const MAX_DISTANCE = BOARD_SPAN * 1.62
const MIN_DISTANCE = BOARD_SPAN * 0.36
const OVERVIEW_DISTANCE = BOARD_SPAN * 1.28

function SceneContent(props: ChessSceneProps) {
  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      {/* Light fog — rooftop should keep a clear sky dome */}
      <fog attach="fog" args={[PALETTE.fog, 170, 420]} />
      <Sky
        distance={450000}
        sunPosition={[55, 55, -12]}
        inclination={0.52}
        azimuth={0.18}
        mieCoefficient={0.003}
        rayleigh={1.15}
        turbidity={1.6}
      />

      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#e8f4ff', '#b0b8a8', 0.95]} />
      <directionalLight
        castShadow
        position={[36, 56, -14]}
        intensity={2.35}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={220}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        color="#fff6e8"
      />
      <directionalLight position={[-24, 22, 28]} intensity={0.55} color="#a8d8f8" />
      <pointLight position={[0, 22, 0]} intensity={0.45} distance={60} color="#fff8ec" />

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
          defeatedKing={props.defeatedKing}
          onPieceClick={props.onSquareClick}
          boardFreeAtRef={props.boardFreeAtRef}
        />
      </group>

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={1.15}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        target={[0, 0.4, 0]}
      />
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
        far: 480,
      }}
      gl={{
        antialias: true,
        alpha: false,
        toneMappingExposure: 1.12,
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
