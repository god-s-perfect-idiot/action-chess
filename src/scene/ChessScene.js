import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CELL_SIZE } from '../game/types';
import { Board } from './Board';
import { Cityscape } from './Cityscape';
import { Pieces } from './Pieces';
import { PALETTE } from './toon';
const BOARD_SPAN = CELL_SIZE * 8;
/** Far enough that the full 8×8 (plus HUD chrome) fits in view. */
const MAX_DISTANCE = BOARD_SPAN * 1.62;
const MIN_DISTANCE = BOARD_SPAN * 0.36;
const OVERVIEW_DISTANCE = BOARD_SPAN * 1.28;
function SceneContent(props) {
    return (_jsxs(_Fragment, { children: [_jsx("color", { attach: "background", args: [PALETTE.fog] }), _jsx("fog", { attach: "fog", args: [PALETTE.fog, 95, 165] }), _jsx("ambientLight", { intensity: 0.92 }), _jsx("hemisphereLight", { args: ['#c8d8c0', '#6a7858', 0.85] }), _jsx("directionalLight", { castShadow: true, position: [36, 48, -14], intensity: 1.95, "shadow-mapSize": [2048, 2048], "shadow-camera-far": 180, "shadow-camera-left": -90, "shadow-camera-right": 90, "shadow-camera-top": 90, "shadow-camera-bottom": -90, color: "#fff2d8" }), _jsx("directionalLight", { position: [-24, 18, 22], intensity: 0.45, color: "#98b878" }), _jsx("pointLight", { position: [0, 16, 0], intensity: 0.3, distance: 65, color: "#fff8ec" }), _jsx(Cityscape, {}), _jsxs("group", { children: [_jsx(Board, { selected: props.selected, legalTargets: props.legalTargets, lastMove: props.lastMove, checkedKing: props.checkedKing, onSquareClick: props.onSquareClick }), _jsx(Pieces, { pieces: props.pieces, selected: props.selected, defeatedKing: props.defeatedKing, onPieceClick: props.onSquareClick, boardFreeAtRef: props.boardFreeAtRef })] }), _jsx(OrbitControls, { makeDefault: true, enablePan: false, minPolarAngle: 0.35, maxPolarAngle: 1.15, minDistance: MIN_DISTANCE, maxDistance: MAX_DISTANCE, target: [0, 0.4, 0] })] }));
}
export function ChessScene(props) {
    const camDist = OVERVIEW_DISTANCE;
    return (_jsx(Canvas, { shadows: true, dpr: [1, 1.6], camera: {
            position: [camDist * 0.55, camDist * 0.72, -camDist * 0.85],
            fov: 42,
            near: 0.5,
            far: 220,
        }, gl: {
            antialias: true,
            alpha: false,
            toneMappingExposure: 1.08,
            powerPreference: 'high-performance',
        }, onCreated: ({ gl }) => {
            gl.setClearColor(new THREE.Color(PALETTE.fog), 1);
        }, children: _jsx(SceneContent, { ...props }) }));
}
