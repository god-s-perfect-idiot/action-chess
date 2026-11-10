import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CELL_SIZE, FILES, RANKS, squareToCoords, } from '../game/types';
import { isPointerDrag } from './isPointerDrag';
import { getToonGradient, hash01, PALETTE } from './toon';
const PAD_GAP = 0.55;
/**
 * Straight mid-board river runs along +Z (rank direction), slight bank wobble only.
 * Center sits between the d/e files so water splits the plaza.
 */
/** Straight center line — no wobble (wobble caused overlapping segment z-fight). */
const RIVER_X = 0;
function streamDist(x, _z) {
    return Math.abs(x - RIVER_X);
}
/** Secondary dry scar / rubble tear across the opposite diagonal. */
function scarDist(x, z) {
    const line = -x * 0.55 + Math.sin(x * 0.08) * CELL_SIZE * 0.6;
    return Math.abs(z - line);
}
function terrainAt(file, rank) {
    const [x, z] = squareToCoords(`${FILES[file]}${RANKS[rank]}`);
    const sd = streamDist(x, z);
    if (sd < CELL_SIZE * 0.38)
        return 'water';
    if (sd < CELL_SIZE * 0.72)
        return 'bank';
    if (scarDist(x, z) < CELL_SIZE * 0.42)
        return 'ruin';
    // Corner biomes
    if (file <= 2 && rank >= 5)
        return 'moss';
    if (file >= 5 && rank <= 2)
        return 'mud';
    if (file <= 1 || rank <= 1)
        return 'ruin';
    return 'stone';
}
/**
 * Soft regional height — a few lifted shelves and shallow sinks across the 8×8.
 * Water cells stay at river level.
 */
function elevAt(file, rank, terrain) {
    if (terrain === 'water')
        return 0;
    // Low-frequency blobs so neighboring cells share a terrace / dip
    const a = Math.sin(file * 0.85 + 0.4) * Math.cos(rank * 0.55 + 0.2);
    const b = Math.sin(file * 0.35 + rank * 0.4 + 1.2);
    const c = Math.cos((file - 3.5) * 0.5) * Math.sin((rank - 3.5) * 0.55);
    let e = a * 0.14 + b * 0.1 + c * 0.12;
    // Push clear raised / sunken pockets
    if (file >= 5 && rank >= 5)
        e += 0.12;
    if (file <= 2 && rank <= 2)
        e -= 0.1;
    if (file >= 6 && rank <= 3)
        e += 0.08;
    if (file <= 3 && rank >= 5)
        e -= 0.06;
    if (terrain === 'bank')
        e *= 0.35;
    return Math.max(-0.16, Math.min(0.2, e));
}
const STONE_VARIANTS = ['#9e9688', '#949084', '#8e887c', '#a0988c'];
const MOSS_VARIANTS = ['#6a7860', '#627058', '#5e6c54', '#68765c'];
const MUD_VARIANTS = ['#6a5848', '#645244', '#5e4c40', '#705c4c'];
const BANK_VARIANTS = ['#7a6e58', '#746852', '#6e624c', '#80745c'];
const RUIN_VARIANTS = ['#8a8478', '#848074', '#7e7a6e', '#908c80'];
const WATER_BED = '#3a5048';
function WeedClump({ x, z, y = 0.12, scale, leafMat, stemMat, seed, }) {
    const blades = useMemo(() => {
        const n = 3 + Math.floor(hash01(seed) * 3);
        const out = [];
        for (let i = 0; i < n; i++) {
            out.push({
                ox: (hash01(seed + i * 3) - 0.5) * 0.28 * scale,
                oz: (hash01(seed + i * 5) - 0.5) * 0.28 * scale,
                h: (0.22 + hash01(seed + i * 7) * 0.35) * scale,
                lean: (hash01(seed + i * 11) - 0.5) * 0.45,
                yaw: hash01(seed + i * 13) * Math.PI,
            });
        }
        return out;
    }, [seed, scale]);
    return (_jsx("group", { position: [x, y, z], children: blades.map((b, i) => (_jsx("mesh", { position: [b.ox, b.h * 0.5, b.oz], rotation: [b.lean, b.yaw, b.lean * 0.4], material: i % 2 ? leafMat : stemMat, castShadow: true, children: _jsx("boxGeometry", { args: [0.045 * scale, b.h, 0.03 * scale] }) }, i))) }));
}
function BlockDressing({ file, rank, terrain, surfaceY, mossMat, mossLiteMat, dirtMat, leafMat, stemMat, rubbleMat, crackMat, brickMat, barkMat, }) {
    const seed = file * 17 + rank * 31;
    const props = useMemo(() => {
        if (terrain === 'water')
            return [];
        const items = [];
        const kind = hash01(seed);
        const kind2 = hash01(seed + 9);
        const kind3 = hash01(seed + 21);
        const half = CELL_SIZE * 0.38;
        // Lift decals off the pad face to kill z-fight
        const decalY = surfaceY + 0.035;
        const propY = surfaceY + 0.02;
        // Keep walkable centers mostly clear; push dressing to edges
        if (terrain === 'bank' || terrain === 'moss') {
            items.push(_jsx("mesh", { position: [(kind2 - 0.5) * half * 1.3, decalY, (kind3 > 0.5 ? 1 : -1) * half * 0.75], rotation: [-Math.PI / 2, 0, kind * 2], material: mossLiteMat, renderOrder: 1, children: _jsx("circleGeometry", { args: [0.45 + kind * 0.4, 10] }) }, "moss"));
            items.push(_jsx(WeedClump, { x: (kind2 > 0.5 ? 1 : -1) * half * 0.85, z: (kind3 - 0.5) * half, y: propY, scale: 1.1 + kind * 0.4, leafMat: leafMat, stemMat: stemMat, seed: seed + 3 }, "reed"));
        }
        if (terrain === 'mud') {
            items.push(_jsx("mesh", { position: [(kind - 0.5) * half * 0.5, decalY, (kind2 - 0.5) * half * 0.5], rotation: [-Math.PI / 2, 0, 0], material: dirtMat, renderOrder: 1, children: _jsx("circleGeometry", { args: [0.5 + kind3 * 0.45, 10] }) }, "puddle"));
        }
        if (terrain === 'stone' && kind > 0.45) {
            items.push(_jsx("mesh", { position: [0, decalY, (kind2 - 0.5) * 0.4], rotation: [0, kind3 * 0.5, 0], material: crackMat, children: _jsx("boxGeometry", { args: [half * 1.4, 0.03, 0.07] }) }, "crack"));
        }
        // Sparse edge weeds
        if (terrain !== 'ruin' && kind3 > 0.4) {
            items.push(_jsx(WeedClump, { x: (kind > 0.5 ? 1 : -1) * half * 0.9, z: (kind2 - 0.5) * half * 1.2, y: propY, scale: 0.8 + kind * 0.35, leafMat: leafMat, stemMat: stemMat, seed: seed + 20 }, "w0"));
        }
        // ── Personality props (corners / edges only) ─────────────────
        const sx = kind2 > 0.5 ? 1 : -1;
        const sz = kind3 > 0.5 ? 1 : -1;
        const cornerX = sx * half * 0.82;
        const cornerZ = sz * half * 0.82;
        // Debris stacks — ~30% of dry tiles
        if (hash01(seed + 40) > 0.7) {
            const n = 2 + Math.floor(hash01(seed + 41) * 3);
            for (let i = 0; i < n; i++) {
                const bw = 0.22 + hash01(seed + 42 + i) * 0.28;
                const bh = 0.08 + hash01(seed + 43 + i) * 0.1;
                const bd = 0.18 + hash01(seed + 44 + i) * 0.22;
                items.push(_jsx("mesh", { position: [
                        cornerX + (hash01(seed + 45 + i) - 0.5) * 0.35,
                        propY + bh * 0.5 + i * 0.07,
                        cornerZ + (hash01(seed + 46 + i) - 0.5) * 0.35,
                    ], rotation: [
                        hash01(seed + 47 + i) * 0.2,
                        hash01(seed + 48 + i) * Math.PI,
                        hash01(seed + 49 + i) * 0.15,
                    ], material: i % 2 ? rubbleMat : brickMat, castShadow: true, children: _jsx("boxGeometry", { args: [bw, bh, bd] }) }, `debris-${i}`));
            }
        }
        // Rare short chubby stump
        if (hash01(seed + 55) > 0.93) {
            const stumpH = 0.16 + hash01(seed + 56) * 0.06;
            const stumpR = 0.26 + hash01(seed + 57) * 0.08;
            const ox = -sx * half * 0.72;
            const oz = sz * half * 0.68;
            items.push(_jsx("mesh", { position: [ox, propY + stumpH * 0.5, oz], material: barkMat, castShadow: true, children: _jsx("cylinderGeometry", { args: [stumpR * 0.92, stumpR * 1.08, stumpH, 8] }) }, "stump"), _jsx("mesh", { position: [ox, propY + stumpH + 0.015, oz], rotation: [-Math.PI / 2, 0, 0], material: mossMat, renderOrder: 1, children: _jsx("circleGeometry", { args: [stumpR * 0.78, 8] }) }, "stump-top"));
        }
        // Corner L-wall — tallest at the corner, steps down as arms run out (~45%)
        if (hash01(seed + 60) > 0.55) {
            const brickH = 0.125;
            const brickW = 0.34;
            const brickD = 0.17;
            const cx = sx * half * 0.9;
            const cz = sz * half * 0.9;
            // How far each arm travels from the corner (in brick slots)
            const armA = 2 + Math.floor(hash01(seed + 61) * 3); // along ±X
            const armB = 2 + Math.floor(hash01(seed + 62) * 3); // along ±Z
            // Peak height at corner (3–5), then taper
            const peak = 3 + Math.floor(hash01(seed + 63) * 3);
            const placeBrick = (key, px, pz, course, alongX) => {
                const bond = (course % 2) * brickW * 0.12;
                items.push(_jsx("mesh", { position: [
                        px + (alongX ? bond : 0),
                        propY + brickH * (course + 0.5),
                        pz + (alongX ? 0 : bond),
                    ], material: course % 2 ? brickMat : rubbleMat, castShadow: true, children: _jsx("boxGeometry", { args: alongX
                            ? [brickW * 0.92, brickH * 0.88, brickD]
                            : [brickD, brickH * 0.88, brickW * 0.92] }) }, key));
            };
            // Corner column — full peak
            for (let c = 0; c < peak; c++) {
                placeBrick(`corner-${c}`, cx, cz, c, true);
            }
            // Tiny moss cap on the corner peak
            if (hash01(seed + 64) > 0.35) {
                items.push(_jsx("mesh", { position: [cx, propY + brickH * peak + 0.02, cz], rotation: [-Math.PI / 2, 0, 0], material: mossLiteMat, renderOrder: 1, children: _jsx("planeGeometry", { args: [brickW * 0.7, brickD * 0.9] }) }, "corner-moss"));
            }
            // Arm along X (away from corner toward cell center-ish / edge)
            for (let i = 1; i <= armA; i++) {
                // Height falls off: peak → … → 1 (sometimes skip a slot for ruin gaps)
                const h = Math.max(1, peak - i - (hash01(seed + 70 + i) > 0.75 ? 1 : 0));
                if (hash01(seed + 80 + i) < 0.12)
                    continue; // missing brick gap
                const px = cx - sx * i * brickW * 0.95;
                const pz = cz;
                for (let c = 0; c < h; c++) {
                    placeBrick(`armA-${i}-${c}`, px, pz, c, true);
                }
            }
            // Arm along Z
            for (let i = 1; i <= armB; i++) {
                const h = Math.max(1, peak - i - (hash01(seed + 90 + i) > 0.7 ? 1 : 0));
                if (hash01(seed + 100 + i) < 0.12)
                    continue;
                const px = cx;
                const pz = cz - sz * i * brickW * 0.95;
                for (let c = 0; c < h; c++) {
                    placeBrick(`armB-${i}-${c}`, px, pz, c, false);
                }
            }
            // Occasional lone bottom course further along one arm (ruin scatter)
            if (hash01(seed + 110) > 0.55) {
                const extra = armA + 1;
                placeBrick('lone-a', cx - sx * extra * brickW * 0.95, cz + (hash01(seed + 111) - 0.5) * 0.08, 0, true);
            }
            if (hash01(seed + 112) > 0.6) {
                const extra = armB + 1;
                placeBrick('lone-b', cx + (hash01(seed + 113) - 0.5) * 0.08, cz - sz * extra * brickW * 0.95, 0, false);
            }
        }
        return items;
    }, [
        terrain,
        surfaceY,
        seed,
        mossMat,
        mossLiteMat,
        dirtMat,
        leafMat,
        stemMat,
        rubbleMat,
        crackMat,
        brickMat,
        barkMat,
    ]);
    return _jsx("group", { children: props });
}
/** Features that ignore the grid — stream, scar, collapsed structures. */
function TerrainScars({ waterMat, waterDeepMat, foamMat, stoneMat, rubbleMat, mossMat, }) {
    const streakRefs = useRef([]);
    /** River runs past board + apron so it reads endless into the woods. */
    const riverHalfLen = CELL_SIZE * (4 + 14);
    const riverLen = riverHalfLen * 2;
    const riverW = CELL_SIZE * 1.15;
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        streakRefs.current.forEach((m, i) => {
            if (!m)
                return;
            const base = -riverHalfLen + (i / Math.max(streakRefs.current.length - 1, 1)) * riverLen;
            const drift = (t * 3.2 + i * 1.7) % riverLen;
            m.position.z = ((base + drift + riverHalfLen) % riverLen) - riverHalfLen;
            m.position.x = RIVER_X + (i % 2 === 0 ? -1 : 1) * riverW * 0.2;
        });
    });
    const scarRubble = useMemo(() => {
        const bits = [];
        for (let i = 0; i < 28; i++) {
            const t = i / 27;
            const x = -CELL_SIZE * 3.6 + t * CELL_SIZE * 7.2;
            const z = -x * 0.55 + Math.sin(x * 0.08) * CELL_SIZE * 0.6;
            bits.push({
                x: x + (hash01(i * 4) - 0.5) * CELL_SIZE * 0.85,
                z: z + (hash01(i * 6) - 0.5) * CELL_SIZE * 0.65,
                yaw: hash01(i) * Math.PI,
                s: 0.22 + hash01(i * 3) * 0.28,
            });
        }
        for (let i = 0; i < 16; i++) {
            const z = -CELL_SIZE * 4.5 + (i / 15) * CELL_SIZE * 9;
            const side = hash01(i * 9) > 0.5 ? 1 : -1;
            bits.push({
                x: RIVER_X + side * CELL_SIZE * (0.75 + hash01(i) * 0.35),
                z: z + (hash01(i * 2) - 0.5) * CELL_SIZE * 0.3,
                yaw: hash01(i * 5) * Math.PI,
                s: 0.18 + hash01(i * 7) * 0.22,
            });
        }
        return bits;
    }, []);
    const noHit = () => null;
    return (_jsxs("group", { children: [_jsx("mesh", { position: [RIVER_X, -0.16, 0], material: waterDeepMat, receiveShadow: true, raycast: noHit, children: _jsx("boxGeometry", { args: [riverW * 1.25, 0.28, riverLen] }) }), _jsx("mesh", { position: [RIVER_X, 0.05, 0], material: waterMat, receiveShadow: true, raycast: noHit, children: _jsx("boxGeometry", { args: [riverW, 0.08, riverLen] }) }), Array.from({ length: 12 }, (_, i) => (_jsx("mesh", { ref: (el) => {
                    streakRefs.current[i] = el;
                }, position: [0, 0.14, 0], material: foamMat, raycast: noHit, renderOrder: 2, children: _jsx("boxGeometry", { args: [riverW * 0.1, 0.015, CELL_SIZE * 0.5] }) }, `streak-${i}`))), _jsx("mesh", { position: [RIVER_X + riverW * 0.62, 0.18, 0], rotation: [-Math.PI / 2, 0, 0], material: mossMat, raycast: noHit, renderOrder: 1, children: _jsx("planeGeometry", { args: [riverW * 0.3, riverLen] }) }), _jsx("mesh", { position: [RIVER_X - riverW * 0.62, 0.18, 0], rotation: [-Math.PI / 2, 0, 0], material: mossMat, raycast: noHit, renderOrder: 1, children: _jsx("planeGeometry", { args: [riverW * 0.26, riverLen] }) }), scarRubble.map((b, i) => (_jsx("mesh", { position: [b.x, CELL_SIZE * 0.06 * b.s, b.z], rotation: [hash01(i) * 0.25, b.yaw, hash01(i + 1) * 0.15], material: i % 3 === 0 ? stoneMat : rubbleMat, castShadow: true, raycast: noHit, children: _jsx("boxGeometry", { args: [
                        CELL_SIZE * 0.28 * b.s,
                        CELL_SIZE * 0.08 * b.s,
                        CELL_SIZE * 0.22 * b.s,
                    ] }) }, `scar-${i}`)))] }));
}
export function Board({ selected, legalTargets, lastMove, checkedKing, onSquareClick, }) {
    const pointerDown = useRef({ x: 0, y: 0 });
    const gradientMap = useMemo(() => getToonGradient(), []);
    const mats = useMemo(() => {
        const make = (hex) => new THREE.MeshToonMaterial({ color: hex, gradientMap });
        return {
            stone: STONE_VARIANTS.map(make),
            moss: MOSS_VARIANTS.map(make),
            mud: MUD_VARIANTS.map(make),
            bank: BANK_VARIANTS.map(make),
            ruin: RUIN_VARIANTS.map(make),
            waterBed: make(WATER_BED),
            water: (() => {
                const m = make('#4a8a78');
                m.polygonOffset = true;
                m.polygonOffsetFactor = -1;
                m.polygonOffsetUnits = -1;
                return m;
            })(),
            waterDeep: make('#2a4840'),
            curb: make(PALETTE.curb),
            soil: make('#4a5240'),
            mossAccent: make(PALETTE.moss),
            mossLite: (() => {
                const m = make(PALETTE.mossLite);
                m.polygonOffset = true;
                m.polygonOffsetFactor = -2;
                m.polygonOffsetUnits = -2;
                return m;
            })(),
            dirt: (() => {
                const m = make(PALETTE.dirt);
                m.polygonOffset = true;
                m.polygonOffsetFactor = -2;
                m.polygonOffsetUnits = -2;
                return m;
            })(),
            leaf: make(PALETTE.leaf),
            stem: make('#3a5838'),
            rubble: make('#8a8478'),
            crack: make('#4a4840'),
            brick: make('#9a7a62'),
            bark: make('#5c4330'),
            stoneAccent: make('#9a9488'),
            foam: new THREE.MeshBasicMaterial({
                color: '#d8ece4',
                transparent: true,
                opacity: 0.3,
                depthWrite: false,
            }),
        };
    }, [gradientMap]);
    const squares = useMemo(() => {
        const list = [];
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const square = `${FILES[file]}${RANKS[rank]}`;
                const [x, z] = squareToCoords(square);
                const seed = file * 17 + rank * 31;
                const terrain = terrainAt(file, rank);
                list.push({
                    square,
                    x,
                    z,
                    file,
                    rank,
                    variant: Math.floor(hash01(seed + 11) * 4) % 4,
                    terrain,
                    elev: elevAt(file, rank, terrain),
                    // Keep footprints inside the cell so neighbors don't z-fight
                    padScale: 0.86 + hash01(seed + 5) * 0.1,
                    yaw: (hash01(seed + 8) - 0.5) * 0.05,
                });
            }
        }
        return list;
    }, []);
    const boardSpan = CELL_SIZE * 8;
    const padMatFor = (terrain, variant) => {
        switch (terrain) {
            case 'water':
                return mats.waterBed;
            case 'bank':
                return mats.bank[variant];
            case 'ruin':
                return mats.ruin[variant];
            case 'mud':
                return mats.mud[variant];
            case 'moss':
                return mats.moss[variant];
            default:
                return mats.stone[variant];
        }
    };
    return (_jsxs("group", { children: [_jsx("mesh", { position: [0, -0.22, 0], material: mats.soil, receiveShadow: true, children: _jsx("boxGeometry", { args: [boardSpan + 2.2, 0.45, boardSpan + 2.2] }) }), _jsx("mesh", { position: [0, -0.48, 0], material: mats.curb, receiveShadow: true, children: _jsx("boxGeometry", { args: [boardSpan + 3.6, 0.35, boardSpan + 3.6] }) }), _jsxs("mesh", { position: [0, -0.08, 0], receiveShadow: true, children: [_jsx("boxGeometry", { args: [boardSpan + 1.5, 0.12, boardSpan + 1.5] }), _jsx("meshToonMaterial", { color: "#4a5840", gradientMap: gradientMap })] }), [
                [-(boardSpan * 0.28 + 0.2), boardSpan * 0.5 + 0.38, boardSpan * 0.42, 0.48],
                [boardSpan * 0.28 + 0.2, boardSpan * 0.5 + 0.38, boardSpan * 0.42, 0.48],
                [-(boardSpan * 0.28 + 0.2), -(boardSpan * 0.5 + 0.38), boardSpan * 0.42, 0.48],
                [boardSpan * 0.28 + 0.2, -(boardSpan * 0.5 + 0.38), boardSpan * 0.42, 0.48],
                [boardSpan * 0.5 + 0.38, 0, 0.48, boardSpan + 1.05],
                [-(boardSpan * 0.5 + 0.38), 0, 0.48, boardSpan + 1.05],
            ].map(([x, z, w, d], i) => (_jsx("mesh", { position: [x, 0.22, z], material: mats.mossAccent, receiveShadow: true, castShadow: true, children: _jsx("boxGeometry", { args: [w, 0.18, d] }) }, `moss-border-${i}`))), squares.map(({ square, x, z, file, rank, variant, terrain, elev, padScale, yaw }) => {
                const isSelected = selected === square;
                const isTarget = legalTargets.includes(square);
                const isLast = lastMove?.from === square || lastMove?.to === square;
                const isCheck = checkedKing === square;
                const pad = padMatFor(terrain, variant);
                const wet = terrain === 'water';
                const tw = (CELL_SIZE - PAD_GAP) * padScale;
                const td = (CELL_SIZE - PAD_GAP) * (0.9 + hash01(file * 3 + rank) * 0.08);
                // Raised shelves get thicker pads; sinks sit lower into the soil
                const padH = 0.24 + Math.max(0, elev) * 0.5;
                const padY = (terrain === 'bank' ? 0.0 : 0.02) + elev;
                const surfaceY = padY + padH * 0.5;
                const markY = surfaceY + 0.04;
                return (_jsxs("group", { position: [x, 0, z], rotation: [0, yaw, 0], children: [!wet && (_jsx("mesh", { material: pad, position: [0, padY, 0], receiveShadow: true, castShadow: true, onPointerDown: (e) => {
                                pointerDown.current = { x: e.clientX, y: e.clientY };
                            }, onClick: (e) => {
                                if (isPointerDrag(pointerDown.current, e))
                                    return;
                                e.stopPropagation();
                                onSquareClick(square);
                            }, onPointerOver: (e) => {
                                e.stopPropagation();
                                document.body.style.cursor = 'pointer';
                            }, onPointerOut: () => {
                                document.body.style.cursor = 'default';
                            }, children: _jsx("boxGeometry", { args: [tw, padH, td] }) })), _jsxs("mesh", { position: [0, 0.9 + elev, 0], onPointerDown: (e) => {
                                pointerDown.current = { x: e.clientX, y: e.clientY };
                            }, onClick: (e) => {
                                if (isPointerDrag(pointerDown.current, e))
                                    return;
                                e.stopPropagation();
                                onSquareClick(square);
                            }, onPointerOver: (e) => {
                                e.stopPropagation();
                                document.body.style.cursor = 'pointer';
                            }, onPointerOut: () => {
                                document.body.style.cursor = 'default';
                            }, children: [_jsx("boxGeometry", { args: [CELL_SIZE * 0.85, 1.6, CELL_SIZE * 0.85] }), _jsx("meshBasicMaterial", { transparent: true, opacity: 0, depthWrite: false })] }), _jsx(BlockDressing, { file: file, rank: rank, terrain: terrain, surfaceY: surfaceY, mossMat: mats.mossAccent, mossLiteMat: mats.mossLite, dirtMat: mats.dirt, leafMat: mats.leaf, stemMat: mats.stem, rubbleMat: mats.rubble, crackMat: mats.crack, brickMat: mats.brick, barkMat: mats.bark }), isLast && (_jsxs("mesh", { position: [0, markY, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("planeGeometry", { args: [tw * 0.85, td * 0.85] }), _jsx("meshBasicMaterial", { color: PALETTE.last, transparent: true, opacity: 0.24 })] })), isSelected && (_jsxs(_Fragment, { children: [_jsxs("mesh", { position: [0, markY + 0.04, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [tw * 0.24, tw * 0.32, 4] }), _jsx("meshBasicMaterial", { color: PALETTE.select, transparent: true, opacity: 0.9, side: THREE.DoubleSide })] }), _jsxs("mesh", { position: [0, markY + 0.02, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("planeGeometry", { args: [tw * 0.82, td * 0.82] }), _jsx("meshBasicMaterial", { color: PALETTE.select, transparent: true, opacity: 0.14 })] })] })), isTarget && (_jsxs("group", { onPointerDown: (e) => {
                                pointerDown.current = { x: e.clientX, y: e.clientY };
                            }, onClick: (e) => {
                                if (isPointerDrag(pointerDown.current, e))
                                    return;
                                e.stopPropagation();
                                onSquareClick(square);
                            }, children: [_jsxs("mesh", { position: [0, markY + 0.04, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("planeGeometry", { args: [tw * 0.85, td * 0.85] }), _jsx("meshBasicMaterial", { color: PALETTE.move, transparent: true, opacity: 0.2 })] }), _jsxs("mesh", { position: [0, markY + 0.06, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [tw * 0.26, tw * 0.34, 24] }), _jsx("meshBasicMaterial", { color: PALETTE.move, transparent: true, opacity: 0.9, side: THREE.DoubleSide })] }), _jsxs("mesh", { position: [0, markY + 0.14, 0], children: [_jsx("cylinderGeometry", { args: [tw * 0.12, tw * 0.12, 0.12, 20] }), _jsx("meshBasicMaterial", { color: PALETTE.move, transparent: true, opacity: 0.95 })] })] })), isCheck && (_jsxs("mesh", { position: [0, markY + 0.06, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [tw * 0.3, tw * 0.4, 24] }), _jsx("meshBasicMaterial", { color: PALETTE.check, transparent: true, opacity: 0.85, side: THREE.DoubleSide })] }))] }, square));
            }), _jsx(TerrainScars, { waterMat: mats.water, waterDeepMat: mats.waterDeep, foamMat: mats.foam, stoneMat: mats.stoneAccent, rubbleMat: mats.rubble, mossMat: mats.mossAccent })] }));
}
