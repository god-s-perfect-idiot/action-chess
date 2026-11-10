import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import * as THREE from 'three';
import { getHeroDesign } from '../game/heroDesigns';
import { CELL_SIZE, squareToCoords, UNIT_SCALE, } from '../game/types';
import { attackFor, deathDuration, } from './fighters/anims';
import { now, TIME_SCALE } from './fighters/clock';
import { FxLayer } from './fighters/Fx';
import { buildLethalDuel, sampleBeat, sparTrack, tickSpars, } from './fighters/bouts';
import { HeroFighter } from './fighters/HeroFighter';
import { outlineUniforms } from './fighters/materials';
import { isPointerDrag } from './isPointerDrag';
/** Tile top in fighter-local units; fighters stand sunk into it at y = 0. */
const BOARD_FLOOR = 0.1575 / UNIT_SCALE;
const ZONE_Y = { high: 0.98, mid: 0.75, low: 0.4 };
function planEnd(plan) {
    return plan.start + plan.waitUntil + plan.finish;
}
function coords(sq) {
    const [x, z] = squareToCoords(sq);
    return new THREE.Vector2(x, z);
}
function moveStyle(type, heroId, color, awakened = false) {
    const loco = getHeroDesign(heroId, color, { awakened }).locomotion;
    if (loco)
        return loco;
    if (type === 'n')
        return 'leap';
    if (type === 'r')
        return 'dash';
    if (type === 'k')
        return 'walk';
    return 'run';
}
const SPEED = {
    run: CELL_SIZE * 2.6,
    dash: CELL_SIZE * 5.5,
    walk: CELL_SIZE * 1.4,
    leap: 0,
    /** Normal gait, engine-boosted travel speed. */
    sprint: CELL_SIZE * 6.4,
    /** Vector shove — readable coast, not a blink. */
    vector: CELL_SIZE * 3.4,
    /** Regal mid-air glide. */
    fly: CELL_SIZE * 3.2,
    /** Serious Mode blink — duration mostly fixed; speed is a soft hint. */
    teleport: CELL_SIZE * 8,
};
function travelTime(style, dist, design) {
    if (dist < 1e-3)
        return 0;
    if (style === 'leap')
        return 0.45 + (dist / CELL_SIZE) * 0.12;
    if (style === 'teleport') {
        // Finral needs a beat longer so the walk-in / walk-out reads.
        if (design?.extras.includes('finralSuit'))
            return 0.62 + (dist / CELL_SIZE) * 0.06;
        // Minato: throw → wait for kunai → yellow flash rematerialize on the mark.
        if (design?.extras.includes('minatoSuit'))
            return 0.72 + (dist / CELL_SIZE) * 0.06;
        return 0.32 + (dist / CELL_SIZE) * 0.04;
    }
    const mul = design?.moveSpeedMul ?? 1;
    const speed = SPEED[style] * mul;
    // Fast heroes need a lower floor or one-square sprints still feel capped.
    const floor = mul >= 3 ? 0.05 : style === 'vector' || style === 'fly' ? 0.22 : 0.28;
    return Math.max(floor, dist / speed);
}
function homeYaw(color) {
    return color === 'w' ? 0 : Math.PI;
}
function dampAngle(cur, target, rate, dt) {
    let d = target - cur;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return cur + d * (1 - Math.exp(-rate * dt));
}
function heroSeed(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++)
        h = (h * 31 + id.charCodeAt(i)) % 9973;
    return (h % 1000) / 1000;
}
function hashBout(...parts) {
    let h = 2166136261;
    const s = parts.join('|');
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
const fxColor = (heroId, color, awakened = false) => {
    const p = getHeroDesign(heroId, color, { awakened }).palette;
    return { c1: p.glow ?? p.accent, c2: p.accent === (p.glow ?? p.accent) ? p.hair : p.accent };
};
let fxId = 1;
/** Progress when Minato's marked kunai lands / body snaps onto the mark. */
const MINATO_SNAP = 0.62;
/** Flying Thunder God travel — kunai flies to the mark, then yellow flash as he rematerializes. */
function minatoKunaiTravelFx(from, to, start, dur, colors) {
    if (dur < 0.08)
        return null;
    const up = UNIT_SCALE * 0.72;
    // Match KUNAI_LEAP: release ~0.12, land + teleport at MINATO_SNAP.
    const release = dur * 0.12;
    const arrive = dur * MINATO_SNAP;
    return {
        id: fxId++,
        kind: 'kunai',
        start: start + release,
        travel: Math.max(0.08, arrive - release),
        dur: 0.38,
        from: new THREE.Vector3(from.x, up, from.y),
        to: new THREE.Vector3(to.x, up * 0.95, to.y),
        color: colors.c1,
        color2: colors.c2,
        size: UNIT_SCALE * 0.48,
    };
}
/** White / black team readout while a fighter is selected. */
const TEAM_GLOW = {
    w: { rim: '#ffffff', core: '#f2f6ff', soft: '#c8d6ee' },
    b: { rim: '#1a1d24', core: '#07080c', soft: '#2c313c' },
};
/**
 * Floor pool under a fighter. Parent is scaled by UNIT_SCALE, so we inverse-scale
 * and work in world units — otherwise the disc sits under the tile surface.
 */
function TeamGlow({ color, focused }) {
    const group = useRef(null);
    const rimMat = useRef(null);
    const coreMat = useRef(null);
    const softMat = useRef(null);
    const palette = TEAM_GLOW[color];
    const inv = 1 / UNIT_SCALE;
    // Sit just above pad toppers / selection rings (~0.2 world).
    const yLocal = 0.22 * inv;
    useFrame(() => {
        const t = now();
        // ~2s full cycle: fade in, hold soft, fade out, rest dark.
        const cycle = (Math.sin((t * Math.PI) / 1) + 1) * 0.5; // 0..1 over 2s
        const breath = cycle * cycle * (3 - 2 * cycle); // smoothstep
        const focusBoost = focused ? 1.25 : 1;
        const softPeak = (color === 'w' ? 0.22 : 0.28) * focusBoost;
        const corePeak = (color === 'w' ? 0.28 : 0.36) * focusBoost;
        const rimPeak = (color === 'w' ? 0.4 : 0.48) * focusBoost;
        if (softMat.current)
            softMat.current.opacity = softPeak * breath;
        if (coreMat.current)
            coreMat.current.opacity = corePeak * breath;
        if (rimMat.current)
            rimMat.current.opacity = rimPeak * breath;
        if (group.current) {
            const s = 0.94 + breath * (focused ? 0.12 : 0.08);
            group.current.scale.set(inv * s, inv, inv * s);
        }
    });
    const rSoft = CELL_SIZE * 0.38;
    const rCore = CELL_SIZE * 0.22;
    const rRimIn = CELL_SIZE * 0.22;
    const rRimOut = CELL_SIZE * 0.32;
    return (_jsxs("group", { ref: group, scale: [inv, inv, inv], position: [0, yLocal, 0], children: [_jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], renderOrder: 2, children: [_jsx("circleGeometry", { args: [rSoft, 40] }), _jsx("meshBasicMaterial", { ref: softMat, color: palette.soft, transparent: true, opacity: 0, depthWrite: false, depthTest: false })] }), _jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.002, 0], renderOrder: 3, children: [_jsx("circleGeometry", { args: [rCore, 36] }), _jsx("meshBasicMaterial", { ref: coreMat, color: palette.core, transparent: true, opacity: 0, depthWrite: false, depthTest: false })] }), _jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.004, 0], renderOrder: 4, children: [_jsx("ringGeometry", { args: [rRimIn, rRimOut, 48] }), _jsx("meshBasicMaterial", { ref: rimMat, color: palette.rim, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide })] })] }));
}
// ───────────────────────── One fighter on the board ─────────────────────────
function adoptBeat(beats, pt, st, setKind) {
    const sampled = sampleBeat(beats, pt, st.pos);
    if (sampled.anim.kind === 'ready')
        sampled.anim = { kind: 'ready', t: setKind('ready') };
    else
        setKind(sampled.anim.kind);
    return sampled;
}
function playPlan(plan, pt, st, setKind, faceYaw) {
    if (plan.beats && plan.beats.length && pt < (plan.beatsEnd ?? 0)) {
        return adoptBeat(plan.beats, pt, st, setKind);
    }
    let yaw = faceYaw;
    let y = 0;
    let speed = 0;
    const turn = plan.turnRate ?? 18;
    let yawRate = turn;
    const travel = (a, b, dur, local, style) => {
        const p = dur > 0 ? Math.min(1, local / dur) : 1;
        if (style === 'teleport') {
            // Hold on the departure pad, then snap onto the arrival while invisible.
            const snap = plan.snapAt ?? 0.5;
            st.pos.copy(p < snap ? a : b);
        }
        else {
            st.pos.lerpVectors(a, b, style === 'leap' ? p : THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85);
        }
        const d = new THREE.Vector2().subVectors(b, a);
        if (d.lengthSq() > 1e-6)
            yaw = Math.atan2(d.x, d.y);
        const dist = d.length();
        if (style === 'leap') {
            y = Math.sin(p * Math.PI) * UNIT_SCALE * (0.5 + (dist / CELL_SIZE) * 0.22);
        }
        else if (style === 'fly') {
            // Sustained hover height — fly toward the pad, not a hop arc.
            const lift = UNIT_SCALE * 0.42;
            y = lift * (p < 0.12 ? THREE.MathUtils.smootherstep(p / 0.12, 0, 1) : p > 0.88 ? 1 - THREE.MathUtils.smootherstep((p - 0.88) / 0.12, 0, 1) : 1);
        }
        speed =
            style === 'walk'
                ? 0.35
                : style === 'vector'
                    ? 1.25
                    : style === 'fly'
                        ? 0.85
                        : style === 'teleport'
                            ? 1.4
                            : 1;
        yawRate = style === 'teleport' ? 90 : turn;
        return { kind: 'move', style, t: local, p, dist: (p * dist) / UNIT_SCALE };
    };
    const faceVictim = () => {
        if (!plan.victim)
            return;
        const d = new THREE.Vector2().subVectors(plan.victim, plan.stop);
        if (d.lengthSq() > 1e-6)
            yaw = Math.atan2(d.x, d.y);
    };
    let anim;
    if (pt < plan.approach) {
        anim = travel(plan.from, plan.stop, plan.approach, pt, plan.style);
    }
    else if (plan.attackAt >= 0 && pt < plan.attackAt + plan.attackDur) {
        st.pos.copy(plan.stop);
        faceVictim();
        yawRate = 25;
        speed = 0.5;
        anim = { kind: 'attack', t: pt - plan.attackAt };
    }
    else if (pt < plan.waitUntil) {
        st.pos.copy(plan.stop);
        faceVictim();
        anim = { kind: 'ready', t: setKind('ready') };
    }
    else {
        anim = travel(plan.stop, plan.to, plan.finish, pt - plan.waitUntil, plan.finishStyle);
    }
    if (anim.kind === 'move' || anim.kind === 'attack')
        setKind(anim.kind);
    return { anim, yaw, y, speed, yawRate };
}
function BoardFighter({ piece, selected, teamGlow, defeatedAt, ghost, director, onPieceClick, onCorpse, }) {
    const root = useRef(null);
    const api = useRef(null);
    const pointerDown = useRef({ x: 0, y: 0 });
    const state = useRef({
        yaw: homeYaw(piece.color),
        pos: ghost
            ? (ghost.carry?.from.clone() ?? ghost.origin.clone())
            : coords(piece.square),
        since: now(),
        lastKind: 'idle',
        reported: false,
    });
    const seed = useMemo(() => heroSeed(piece.id), [piece.id]);
    useFrame((_, rawDt) => {
        const g = root.current;
        const f = api.current;
        if (!g || !f)
            return;
        const dt = Math.min(rawDt, 0.1) * TIME_SCALE;
        const t = now();
        const st = state.current;
        let anim;
        let yaw = homeYaw(piece.color);
        let y = 0;
        let speed = 0;
        let yawRate = 10;
        let scale = UNIT_SCALE;
        const setKind = (kind) => {
            if (st.lastKind !== kind) {
                st.lastKind = kind;
                st.since = t;
            }
            return t - st.since;
        };
        if (ghost) {
            const carry = ghost.carry;
            const carryDone = !carry || t >= planEnd(carry);
            if (carry && !carryDone) {
                const played = playPlan(carry, t - carry.start, st, setKind, st.yaw);
                anim = played.anim;
                yaw = played.yaw;
                y = played.y;
                speed = played.speed;
                yawRate = played.yawRate;
            }
            else if (ghost.beats.length && t < ghost.duelUntil) {
                const played = adoptBeat(ghost.beats, t - ghost.duelStart, st, setKind);
                anim = played.anim;
                yaw = played.yaw;
                y = played.y;
                speed = played.speed;
                yawRate = played.yawRate;
            }
            else {
                st.pos.copy(ghost.pos);
                const toA = new THREE.Vector2().subVectors(ghost.attacker, ghost.pos);
                yaw = Math.atan2(toA.x, toA.y);
                let n = 0;
                while (n < ghost.hurts.length && ghost.hurts[n].at <= t)
                    n++;
                if (t >= ghost.hitAt) {
                    anim = { kind: 'death', t: t - ghost.hitAt, dmg: ghost.dmg, zone: ghost.zone, sever: ghost.sever };
                    yawRate = 30;
                }
                else if (n > 0) {
                    const h = ghost.hurts[n - 1];
                    anim = { kind: 'hurt', t: t - h.at, zone: h.zone, n, hold: h.hold };
                    setKind('hurt');
                }
                else {
                    anim = { kind: 'ready', t: setKind('ready') };
                }
            }
            const shrink = THREE.MathUtils.smoothstep(t, ghost.vanishAt, ghost.vanishAt + 0.22);
            scale = UNIT_SCALE * Math.max(0.0001, 1 - shrink);
        }
        else if (defeatedAt !== null && t >= defeatedAt) {
            const home = coords(piece.square);
            if (st.pos.distanceToSquared(home) > 1e-4)
                st.pos.lerp(home, 1 - Math.exp(-10 * dt));
            anim = { kind: 'death', t: t - defeatedAt, dmg: 'none', zone: 'mid' };
            yaw = st.yaw;
        }
        else {
            const plan = director.plans.get(piece.id);
            const pt = plan ? t - plan.start : 0;
            if (plan && pt < 0) {
                // Queued: hold the start square until this beat begins.
                st.pos.copy(plan.from);
                anim = { kind: 'ready', t: setKind('ready') };
            }
            else if (plan && pt < plan.waitUntil + plan.finish) {
                const played = playPlan(plan, pt, st, setKind, homeYaw(piece.color));
                anim = played.anim;
                yaw = played.yaw;
                y = played.y;
                speed = played.speed;
                yawRate = played.yawRate;
            }
            else {
                if (plan)
                    director.plans.delete(piece.id);
                const home = coords(piece.square);
                const spar = selected ? null : sparTrack(director.spars, piece.id);
                if (spar) {
                    const local = ((t - spar.started) % spar.dur + spar.dur) % spar.dur;
                    const played = adoptBeat(spar.beats, local, st, setKind);
                    anim = played.anim;
                    yaw = played.yaw;
                    y = played.y;
                    speed = played.speed;
                    yawRate = played.yawRate;
                }
                else {
                    // Snap only for real teleports (plaza-scale). A neighbor visit eases home.
                    if (st.pos.distanceToSquared(home) > CELL_SIZE * CELL_SIZE * 2.56) {
                        st.pos.copy(home);
                    }
                    else {
                        st.pos.lerp(home, 1 - Math.exp(-10 * dt));
                    }
                    anim = selected
                        ? { kind: 'ready', t: setKind('ready') }
                        : { kind: 'idle', t: t + seed * 10 };
                    if (!selected)
                        setKind('idle');
                }
            }
        }
        st.yaw = dampAngle(st.yaw, yaw, yawRate, dt);
        g.position.set(st.pos.x, y, st.pos.y);
        g.rotation.y = st.yaw;
        g.scale.setScalar(scale);
        if (!ghost)
            director.pos.set(piece.id, st.pos);
        f.update(anim, dt, speed);
        if (ghost && onCorpse && !st.reported && t >= ghost.vanishAt - 0.12) {
            st.reported = true;
            const at = new THREE.Vector3();
            if (f.corpse(at)) {
                g.updateMatrix();
                at.applyMatrix4(g.matrix);
            }
            else
                at.set(st.pos.x, 0, st.pos.y);
            onCorpse(ghost, at, f.bled());
        }
    });
    return (_jsxs("group", { ref: root, scale: UNIT_SCALE, onPointerDown: (e) => {
            pointerDown.current = { x: e.clientX, y: e.clientY };
        }, onClick: (e) => {
            if (ghost)
                return;
            // Orbit drag often starts on a fighter; don't treat that as a focus tap.
            if (isPointerDrag(pointerDown.current, e))
                return;
            e.stopPropagation();
            onPieceClick(piece.square);
        }, onPointerOver: (e) => {
            if (ghost)
                return;
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
        }, onPointerOut: () => {
            document.body.style.cursor = 'default';
        }, children: [_jsxs("mesh", { position: [0, 0.6, 0], children: [_jsx("cylinderGeometry", { args: [0.22, 0.22, 1.25, 8] }), _jsx("meshBasicMaterial", { transparent: true, opacity: 0, depthWrite: false, colorWrite: false })] }), teamGlow && !ghost && (_jsx(TeamGlow, { color: piece.color, focused: selected })), _jsx(HeroFighter, { heroId: piece.heroId, color: piece.color, seed: seed, apiRef: api, floor: BOARD_FLOOR, awakened: piece.awakened })] }));
}
export function Pieces({ pieces, selected, defeatedKing = null, onPieceClick, boardFreeAtRef, }) {
    const director = useRef({
        plans: new Map(),
        pos: new Map(),
        freeAt: 0,
        spars: [],
    }).current;
    const prev = useRef(pieces);
    const [ghosts, setGhosts] = useState([]);
    const [fx, setFx] = useState([]);
    const [kingDeathAt, setKingDeathAt] = useState(null);
    const { gl } = useThree();
    const showTeamGlow = selected !== null;
    const publishFreeAt = (t) => {
        director.freeAt = Math.max(director.freeAt, t);
        if (boardFreeAtRef)
            boardFreeAtRef.current = director.freeAt;
    };
    useFrame(() => {
        const dpr = gl.getPixelRatio();
        outlineUniforms.uResY.value = gl.domElement.height;
        outlineUniforms.uThickness.value = UNIT_SCALE * 0.011;
        outlineUniforms.uMinPx.value = 1.05 * dpr;
        outlineUniforms.uMaxPx.value = 2.6 * dpr;
        if (boardFreeAtRef)
            boardFreeAtRef.current = director.freeAt;
        const time = now();
        const busy = new Set();
        for (const [id, plan] of director.plans) {
            if (time < planEnd(plan))
                busy.add(id);
        }
        if (selected) {
            const sel = pieces.find((p) => p.square === selected);
            if (sel)
                busy.add(sel.id);
        }
        if (defeatedKing) {
            const king = pieces.find((p) => p.square === defeatedKing && p.type === 'k');
            if (king)
                busy.add(king.id);
        }
        director.spars = tickSpars(director.spars, pieces, busy, time);
    });
    useLayoutEffect(() => {
        const before = prev.current;
        prev.current = pieces;
        if (before === pieces)
            return;
        const byId = new Map(before.map((p) => [p.id, p]));
        const nextIds = new Set(pieces.map((p) => p.id));
        const movers = pieces.filter((p) => {
            const old = byId.get(p.id);
            return old && old.square !== p.square;
        });
        const captured = before.filter((p) => !nextIds.has(p.id));
        // A reset (or any bulk change) snaps instead of animating 30 sprints.
        if (movers.length > 3 || captured.length > 1) {
            director.plans.clear();
            director.pos.clear();
            director.spars = [];
            director.freeAt = 0;
            if (boardFreeAtRef)
                boardFreeAtRef.current = 0;
            setGhosts([]);
            setFx([]);
            setKingDeathAt(null);
            return;
        }
        // Stage beats: finish whatever is already in flight before the next move/kill.
        // Engine gating should keep this to one ply, but chain if a plan is mid-flight.
        let t0 = Math.max(now(), director.freeAt);
        const newGhosts = [];
        const newFx = [];
        for (const mover of movers) {
            const old = byId.get(mover.id);
            // Square to square, unless they're mid-spar within a block of home.
            // A queued plan still departs from where that plan was going to land.
            const existing = director.plans.get(mover.id);
            const logical = existing ? existing.to.clone() : coords(old.square);
            let from = logical.clone();
            if (!existing) {
                const vis = director.pos.get(mover.id);
                if (vis && vis.distanceTo(logical) < CELL_SIZE * 1.25)
                    from = vis.clone();
            }
            if (existing)
                t0 = Math.max(t0, planEnd(existing));
            const to = coords(mover.square);
            const style = moveStyle(old.type, mover.heroId, mover.color, mover.awakened);
            const moverDesign = getHeroDesign(mover.heroId, mover.color, {
                awakened: mover.awakened,
            });
            const victim = captured.find((c) => c.color !== mover.color) ?? null;
            const turnRate = (moverDesign.moveSpeedMul ?? 1) >= 4 ? 90 : 18;
            if (!victim) {
                const approach = travelTime(style, from.distanceTo(to), moverDesign);
                const isMinato = moverDesign.extras.includes('minatoSuit');
                const plan = {
                    start: t0,
                    from,
                    stop: to,
                    to,
                    style,
                    approach,
                    attackAt: -1,
                    attackDur: 0,
                    victim: null,
                    waitUntil: approach,
                    finish: 0,
                    finishStyle: style,
                    turnRate,
                    snapAt: isMinato ? MINATO_SNAP : undefined,
                };
                director.plans.set(mover.id, plan);
                if (isMinato) {
                    const kunai = minatoKunaiTravelFx(from, to, t0, approach, fxColor(mover.heroId, mover.color, mover.awakened));
                    if (kunai)
                        newFx.push(kunai);
                }
                t0 = planEnd(plan);
                continue;
            }
            // Let the victim finish their own move/kill stage before they can die.
            const victimPlan = director.plans.get(victim.id) ?? null;
            const victimDoneAt = victimPlan ? planEnd(victimPlan) : t0;
            if (victimPlan)
                director.plans.delete(victim.id);
            t0 = Math.max(t0, victimDoneAt);
            const atk = attackFor(moverDesign);
            const vLogical = victimPlan ? victimPlan.to.clone() : coords(victim.square);
            let vStart = vLogical.clone();
            if (!victimPlan) {
                const vis = director.pos.get(victim.id);
                if (vis && vis.distanceTo(vLogical) < CELL_SIZE * 1.25)
                    vStart = vis.clone();
            }
            const isMinato = moverDesign.extras.includes('minatoSuit');
            const duel = buildLethalDuel({
                start: from,
                fireHome: logical,
                vStart,
                vHome: vLogical,
                ranged: atk.ranged,
                style,
                seed: hashBout(mover.id, victim.id, old.square, victim.square),
                snapAt: isMinato ? MINATO_SNAP : undefined,
                signatureDur: atk.clip.dur,
                travel: (dist) => travelTime(style, dist, moverDesign),
            });
            const opening = duel.attacker[0];
            if (isMinato && opening?.kind === 'travel' && opening.style === 'teleport' && opening.dur > 0.08) {
                const kunai = minatoKunaiTravelFx(opening.from, opening.to, t0 + opening.t, opening.dur, fxColor(mover.heroId, mover.color, mover.awakened));
                if (kunai)
                    newFx.push(kunai);
            }
            const attackAt = duel.attackAt;
            const stop = duel.stop;
            const vPos = duel.killPos;
            const dir = new THREE.Vector2().subVectors(vPos, stop);
            if (dir.lengthSq() > 1e-6)
                dir.normalize();
            else
                dir.set(0, 1);
            const hitAt = t0 + attackAt + atk.hit;
            const vDesign = getHeroDesign(victim.heroId, victim.color, {
                awakened: victim.awakened,
            });
            const vanishAt = hitAt + deathDuration(vDesign, atk.dmg) + 0.35;
            const waitUntil = Math.max(attackAt + atk.clip.dur, vanishAt + 0.15 - t0);
            const finishStyle = style === 'fly' ? 'fly' : atk.ranged ? style : 'walk';
            const finish = travelTime(finishStyle, stop.distanceTo(to), moverDesign);
            const plan = {
                start: t0,
                from,
                stop,
                to,
                style,
                approach: 0,
                attackAt,
                attackDur: atk.clip.dur,
                victim: vPos,
                waitUntil,
                finish,
                snapAt: isMinato ? MINATO_SNAP : undefined,
                finishStyle,
                turnRate,
                beats: duel.attacker,
                beatsEnd: attackAt,
            };
            director.plans.set(mover.id, plan);
            const lethal = atk.hits[atk.hits.length - 1];
            newGhosts.push({
                piece: victim,
                pos: vPos,
                origin: vStart,
                attacker: stop,
                hitAt,
                vanishAt,
                hurts: atk.hits.slice(0, -1).map((h) => ({ at: t0 + attackAt + h.t, zone: h.zone, hold: h.hold })),
                dmg: atk.dmg,
                zone: lethal?.zone ?? 'mid',
                sever: atk.sever,
                carry: victimPlan,
                beats: duel.victim,
                duelStart: t0,
                duelUntil: t0 + attackAt,
            });
            // Signature effect. Duel taps are the non-lethal exchanges before it.
            const { c1, c2 } = fxColor(mover.heroId, mover.color, mover.awakened);
            for (const tap of duel.taps) {
                newFx.push({
                    id: fxId++,
                    kind: 'hit',
                    start: t0 + tap.t,
                    travel: 0,
                    dur: 0.32,
                    from: new THREE.Vector3(tap.from.x, ZONE_Y[tap.zone] * UNIT_SCALE * 0.9, tap.from.y),
                    to: new THREE.Vector3(tap.at.x, ZONE_Y[tap.zone] * UNIT_SCALE, tap.at.y),
                    color: '#fff1c4',
                    color2: c1,
                    size: UNIT_SCALE * 0.32,
                });
            }
            const up = UNIT_SCALE * 0.78;
            const fwd = new THREE.Vector3(dir.x, 0, dir.y);
            const src = new THREE.Vector3(stop.x, up, stop.y).addScaledVector(fwd, UNIT_SCALE * 0.35);
            const dst = new THREE.Vector3(vPos.x, up * 0.95, vPos.y);
            // Flash projectile (e.g. Minato kunai) before the signature lands.
            if (atk.throwFx) {
                newFx.push({
                    id: fxId++,
                    kind: atk.throwFx.kind,
                    start: t0 + attackAt + atk.throwFx.at,
                    travel: atk.throwFx.travel,
                    dur: 0.28,
                    from: src.clone(),
                    to: dst.clone(),
                    color: c1,
                    color2: c2,
                    size: UNIT_SCALE * 0.5,
                });
            }
            const rasengan = atk.fx === 'rasengan';
            const babylon = atk.fx === 'babylon';
            const portal = atk.fx === 'portal';
            const inferno = atk.fx === 'inferno';
            const fxFrom = rasengan
                ? new THREE.Vector3(vPos.x, up * 1.85, vPos.y)
                : src;
            const fxTo = rasengan
                ? new THREE.Vector3(vPos.x, up * 0.85, vPos.y)
                : inferno
                    ? new THREE.Vector3(vPos.x, up * 0.35, vPos.y)
                    : dst;
            const sakura = atk.fx === 'sakura';
            newFx.push({
                id: fxId++,
                kind: atk.fx,
                start: t0 +
                    attackAt +
                    (atk.ranged || babylon || portal
                        ? atk.release
                        : rasengan
                            ? atk.fxAt - 0.16
                            : atk.fxAt),
                travel: atk.ranged || babylon
                    ? Math.max(0, atk.hit - atk.release)
                    : portal
                        ? Math.max(0, atk.fxAt - atk.release)
                        : rasengan
                            ? 0.16
                            : 0,
                dur: atk.fx === 'beam' || atk.fx === 'darkBeam' || atk.fx === 'murasaki' || atk.fx === 'percentBlast'
                    ? atk.fx === 'murasaki' || atk.fx === 'percentBlast'
                        ? 0.75
                        : 0.55
                    : atk.fx === 'voltBarrage'
                        ? 0.95
                        : atk.fx === 'rasengan'
                            ? 0.75
                            : inferno
                                ? 1.35
                                : portal
                                    ? Math.max(0.7, atk.hit - atk.fxAt + 0.2)
                                    : sakura || babylon
                                        ? 0.95
                                        : 0.6,
                from: fxFrom,
                to: fxTo,
                color: sakura ? '#ff8ec8' : babylon ? '#f0d050' : inferno ? '#ff6a18' : c1,
                color2: sakura ? '#ff4aa0' : babylon ? '#ffe060' : inferno ? '#ffd24a' : c2,
                size: UNIT_SCALE *
                    (moverDesign.attack === 'emberFlick'
                        ? 0.32
                        : moverDesign.attack === 'cruelSun'
                            ? 1.85
                            : rasengan
                                ? 0.62
                                : inferno
                                    ? 1.35
                                    : sakura || babylon
                                        ? 0.68
                                        : 0.55),
            });
            // Small impact for every punch/kick of the combo the signature fx doesn't cover.
            if (!atk.ranged) {
                for (const h of atk.hits) {
                    if (Math.abs(h.t - atk.fxAt) < 0.06)
                        continue;
                    const at = vPos.clone().addScaledVector(dir, -UNIT_SCALE * 0.12);
                    newFx.push({
                        id: fxId++,
                        kind: 'hit',
                        start: t0 + attackAt + h.t,
                        travel: 0,
                        dur: 0.4,
                        from: src,
                        to: new THREE.Vector3(at.x, ZONE_Y[h.zone] * UNIT_SCALE, at.y),
                        color: '#fff1c4',
                        color2: c1,
                        size: UNIT_SCALE * 0.4,
                    });
                }
            }
            t0 = planEnd(plan);
        }
        publishFreeAt(t0);
        if (newGhosts.length)
            setGhosts((g) => [...g, ...newGhosts]);
        if (newFx.length)
            setFx((f) => [...f, ...newFx]);
    }, [pieces, director, boardFreeAtRef]);
    // Checkmate death waits until the mating move/kill stage finishes.
    useLayoutEffect(() => {
        if (!defeatedKing) {
            setKingDeathAt(null);
            return;
        }
        setKingDeathAt((prev) => {
            if (prev !== null)
                return prev;
            const king = pieces.find((p) => p.square === defeatedKing && p.type === 'k');
            if (!king)
                return null;
            const start = Math.max(now(), director.freeAt) + 0.08;
            const dur = deathDuration(getHeroDesign(king.heroId, king.color));
            publishFreeAt(start + dur + 0.35);
            return start;
        });
    }, [defeatedKing, pieces, director, boardFreeAtRef]);
    const onCorpse = (g, at, bled) => {
        const vDesign = getHeroDesign(g.piece.heroId, g.piece.color, {
            awakened: g.piece.awakened,
        });
        const poofKind = vDesign.death === 'dissolve' ? 'poofSparkle' : vDesign.death === 'shatter' ? 'poofShards' : 'poof';
        const vc = fxColor(g.piece.heroId, g.piece.color, g.piece.awakened);
        const t = now();
        const evs = [
            {
                id: fxId++,
                kind: poofKind,
                start: t,
                travel: 0,
                dur: 0.85,
                from: new THREE.Vector3(at.x, 0.3, at.z),
                to: new THREE.Vector3(at.x, UNIT_SCALE * 0.3, at.z),
                color: vc.c1,
                color2: vc.c2,
                size: UNIT_SCALE * 0.6,
            },
        ];
        // The ragdoll's own pools vanish with it; leave one on the tile for a while.
        if (bled) {
            const floorY = BOARD_FLOOR * UNIT_SCALE + 0.002;
            evs.push({
                id: fxId++,
                kind: 'bloodPool',
                start: t + 0.05,
                travel: 0,
                dur: 6,
                from: new THREE.Vector3(at.x, floorY, at.z),
                to: new THREE.Vector3(at.x, floorY, at.z),
                color: '#4e030a',
                color2: '#4e030a',
                size: UNIT_SCALE * 0.15,
            });
        }
        setFx((f) => [...f, ...evs]);
    };
    // Drop ghosts and fx once they have played out.
    useEffect(() => {
        if (!ghosts.length && !fx.length)
            return;
        const id = window.setInterval(() => {
            const t = now();
            setGhosts((g) => {
                const keep = g.filter((x) => t < x.vanishAt + 0.4);
                return keep.length === g.length ? g : keep;
            });
            setFx((f) => {
                const keep = f.filter((x) => t < x.start + x.travel + x.dur + 0.1);
                return keep.length === f.length ? f : keep;
            });
        }, 250);
        return () => window.clearInterval(id);
    }, [ghosts.length, fx.length]);
    return (_jsxs("group", { children: [pieces.map((piece) => (_jsx(BoardFighter, { piece: piece, selected: selected === piece.square, teamGlow: showTeamGlow, defeatedAt: defeatedKing === piece.square && piece.type === 'k' ? kingDeathAt : null, ghost: null, director: director, onPieceClick: onPieceClick }, piece.id))), ghosts.map((g) => (_jsx(BoardFighter, { piece: g.piece, selected: false, teamGlow: false, defeatedAt: null, ghost: g, director: director, onPieceClick: onPieceClick, onCorpse: onCorpse }, `ghost-${g.piece.id}-${g.hitAt}`))), _jsx(FxLayer, { events: fx })] }));
}
