import { OrbitControls } from '@react-three/drei'
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
      <color attach="background" args={[PALETTE.fog]} />
      {/* Fog starts past the 8×8 + apron; only the outer berm melts away */}
      <fog attach="fog" args={[PALETTE.fog, 95, 165]} />

      <ambientLight intensity={0.92} />
      <hemisphereLight args={['#c8d8c0', '#6a7858', 0.85]} />
      <directionalLight
        castShadow
        position={[36, 48, -14]}
        intensity={1.95}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={180}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        color="#fff2d8"
      />
      <directionalLight position={[-24, 18, 22]} intensity={0.45} color="#98b878" />
      <pointLight position={[0, 16, 0]} intensity={0.3} distance={65} color="#fff8ec" />

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
        far: 220,
      }}
      gl={{
        antialias: true,
        alpha: false,
        toneMappingExposure: 1.08,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(PALETTE.fog), 1)
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
