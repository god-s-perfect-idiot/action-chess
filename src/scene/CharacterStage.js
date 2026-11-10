import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getHeroDesign, HERO_DESIGNS } from '../game/heroDesigns';
import { attackFor, deathDuration, } from './fighters/anims';
import { now } from './fighters/clock';
import { FxLayer } from './fighters/Fx';
import { HeroFighter } from './fighters/HeroFighter';
import { outlineUniforms } from './fighters/materials';
export const ANIM_MODES = ['cycle', 'idle', 'run', 'attack', 'death'];
/** Damage types the self-death preview cycles through. */
export const DAMAGE_TYPES = ['beam', 'slash', 'pierce', 'blunt', 'burn', 'shock'];
/** Local-units/sec so run cadence matches board travel feel. */
const RUN_DIST_RATE = 2.5;
const RUN_LOOP = 1.2;
/** One-way shuttle length so the Characters run preview travels A→B instead of in place. */
const RUN_PATH = 1.35;
/** Sparring partner distance in front of the fighter (+Z): board melee stop / one square for ranged. */
const MELEE_Z = 0.66;
const RANGED_Z = 1.6;
const FX_SIZE = 0.55;
const ZONE_Y = { high: 0.98, mid: 0.75, low: 0.4 };
let fxSeq = 1;
function locoOf(d) {
    return d.locomotion ?? 'run';
}
/** Seconds for one A→B leg at this hero's locomotion. */
function runOneWay(d) {
    const style = locoOf(d);
    if (style === 'leap')
        return RUN_LOOP;
    if (style === 'vector')
        return 1.15;
    if (style === 'teleport')
        return 0.95;
    if (style === 'fly')
        return Math.max(0.55, RUN_PATH / (RUN_DIST_RATE * (d.moveSpeedMul ?? 1)));
    return Math.max(0.35, RUN_PATH / (RUN_DIST_RATE * (d.moveSpeedMul ?? 1)));
}
/**
 * Characters-page run preview: gait/clip plus world shuttle A→B→A along +Z
 * so footfall and facing read correctly (board travel does the same).
 */
function runPreview(d, t) {
    const style = locoOf(d);
    const oneWay = runOneWay(d);
    const cycle = oneWay * 2;
    const u = ((t % cycle) + cycle) % cycle;
    const going = u < oneWay;
    const local = going ? u : u - oneWay;
    const p = oneWay > 1e-6 ? Math.min(1, local / oneWay) : 1;
    const from = going ? -RUN_PATH * 0.5 : RUN_PATH * 0.5;
    const to = going ? RUN_PATH * 0.5 : -RUN_PATH * 0.5;
    const yaw = going ? 0 : Math.PI;
    let along = p;
    let y = 0;
    if (style === 'teleport') {
        // Hold on the departure pad, then snap onto arrival while invisible.
        along = p < 0.5 ? 0 : 1;
    }
    else if (style === 'leap') {
        along = p;
        y = Math.sin(p * Math.PI) * (0.5 + RUN_PATH * 0.12);
    }
    else if (style === 'fly') {
        along = THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85;
        const lift = 0.42;
        y =
            lift *
                (p < 0.12
                    ? THREE.MathUtils.smootherstep(p / 0.12, 0, 1)
                    : p > 0.88
                        ? 1 - THREE.MathUtils.smootherstep((p - 0.88) / 0.12, 0, 1)
                        : 1);
    }
    else {
        // Match board easing so gait isn't perfectly linear with world motion.
        along = THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85;
    }
    const z = from + (to - from) * along;
    const traveled = Math.abs(z - from);
    let anim;
    if (style === 'leap' || style === 'vector' || style === 'teleport' || style === 'fly') {
        anim = { kind: 'move', style, t: style === 'vector' || style === 'fly' ? t : local, p, dist: traveled };
    }
    else {
        // Gait cycle keyed off distance covered so stride matches translation.
        const rate = RUN_DIST_RATE * (d.moveSpeedMul ?? 1);
        anim = { kind: 'move', style, t, p: 0, dist: t * rate };
    }
    return { anim, x: 0, y, z, yaw };
}
function applyMover(g, preview) {
    if (!g)
        return;
    if (!preview) {
        g.position.set(0, 0, 0);
        g.rotation.y = 0;
        return;
    }
    g.position.set(preview.x, preview.y, preview.z);
    g.rotation.y = preview.yaw;
}
function fxColors(d) {
    const p = d.palette;
    const c1 = p.glow ?? p.accent;
    return { c1, c2: p.accent === c1 ? p.hair : p.accent };
}
const victimZ = (atk) => (atk.ranged ? RANGED_Z : MELEE_Z);
function makeAttackFx(d, attackAbsStart) {
    const atk = attackFor(d);
    const { c1, c2 } = fxColors(d);
    const up = 0.78;
    const vz = victimZ(atk);
    const from = new THREE.Vector3(0, up, 0.35);
    const to = new THREE.Vector3(0, up * 0.95, vz);
    const out = [];
    if (atk.throwFx) {
        out.push({
            id: fxSeq++,
            kind: atk.throwFx.kind,
            start: attackAbsStart + atk.throwFx.at,
            travel: atk.throwFx.travel,
            dur: 0.28,
            from: from.clone(),
            to: to.clone(),
            color: c1,
            color2: c2,
            size: FX_SIZE * 0.9,
        });
    }
    const rasengan = atk.fx === 'rasengan';
    const sakura = atk.fx === 'sakura';
    const babylon = atk.fx === 'babylon';
    const portal = atk.fx === 'portal';
    const inferno = atk.fx === 'inferno';
    out.push({
        id: fxSeq++,
        kind: atk.fx,
        start: attackAbsStart +
            (atk.ranged || babylon || portal ? atk.release : rasengan ? atk.fxAt - 0.16 : atk.fxAt),
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
        from: rasengan ? new THREE.Vector3(0, up * 1.85, vz) : from,
        to: rasengan
            ? new THREE.Vector3(0, up * 0.85, vz)
            : inferno
                ? new THREE.Vector3(0, up * 0.35, vz)
                : to,
        color: sakura ? '#ff8ec8' : babylon ? '#f0d050' : inferno ? '#ff6a18' : c1,
        color2: sakura ? '#ff4aa0' : babylon ? '#ffe060' : inferno ? '#ffd24a' : c2,
        size: d.attack === 'emberFlick'
            ? FX_SIZE * 0.55
            : d.attack === 'cruelSun'
                ? FX_SIZE * 2.85
                : d.attack === 'percentBlast'
                    ? FX_SIZE * 1.55
                    : rasengan
                        ? FX_SIZE * 1.12
                        : inferno
                            ? FX_SIZE * 2.15
                            : sakura || babylon
                                ? FX_SIZE * 1.2
                                : FX_SIZE,
    });
    if (!atk.ranged) {
        for (const h of atk.hits) {
            if (Math.abs(h.t - atk.fxAt) < 0.06)
                continue;
            out.push({
                id: fxSeq++,
                kind: 'hit',
                start: attackAbsStart + h.t,
                travel: 0,
                dur: 0.4,
                from,
                to: new THREE.Vector3(0, ZONE_Y[h.zone], vz - 0.12),
                color: '#fff1c4',
                color2: c1,
                size: 0.4,
            });
        }
    }
    return out;
}
/** What the sparring partner does `local` seconds into the attacker's attack. */
function victimAnim(atk, local, die) {
    if (local >= atk.hit) {
        if (local < atk.hit + die + 0.3) {
            const lethal = atk.hits[atk.hits.length - 1];
            return { kind: 'death', t: local - atk.hit, dmg: atk.dmg, zone: lethal?.zone ?? 'mid', sever: atk.sever };
        }
        return { kind: 'ready', t: local };
    }
    let n = 0;
    while (n < atk.hits.length - 1 && atk.hits[n].t <= local)
        n++;
    if (n > 0) {
        const h = atk.hits[n - 1];
        return { kind: 'hurt', t: local - h.t, zone: h.zone, n, hold: h.hold };
    }
    return { kind: 'ready', t: local };
}
function Unit({ id, x, z, mode, seed, freeze, damage, awakened = false, }) {
    const api = useRef(null);
    const foe = useRef(null);
    const mover = useRef(null);
    const clock = useRef({ t: 0 });
    const fired = useRef(-1);
    const [fx, setFx] = useState([]);
    const sparring = mode === 'attack' || mode === 'cycle';
    const atkDef = attackFor(getHeroDesign(id, 'w', { awakened }));
    const foeDesign = getHeroDesign(id, 'b', { awakened });
    const foeDie = deathDuration(foeDesign, atkDef.dmg);
    useEffect(() => {
        fired.current = -1;
        setFx([]);
        clock.current.t = 0;
        applyMover(mover.current, null);
    }, [mode, id, damage, awakened]);
    const fireFx = (design, attackLocalT, key) => {
        if (freeze !== null || fired.current === key)
            return;
        fired.current = key;
        const events = makeAttackFx(design, now() - attackLocalT);
        const tNow = now();
        setFx((prev) => [...prev.filter((e) => tNow < e.start + e.travel + e.dur + 0.1), ...events]);
    };
    useFrame((_, dt) => {
        const a = api.current;
        if (!a)
            return;
        const v = foe.current;
        clock.current.t += dt;
        const t = clock.current.t;
        const atk = attackFor(a.design);
        const atkDur = atk.clip.dur;
        const die = (dmg) => deathDuration(a.design, dmg);
        const selfDmg = (k) => damage ?? DAMAGE_TYPES[k % DAMAGE_TYPES.length];
        if (freeze !== null && mode !== 'cycle') {
            if (mode === 'run') {
                const preview = runPreview(a.design, freeze * runOneWay(a.design) * 2);
                applyMover(mover.current, preview);
                a.update(preview.anim, 0.1, 0.6);
                return;
            }
            applyMover(mover.current, null);
            if (mode === 'death') {
                const dmg = damage ?? 'beam';
                a.update({ kind: 'death', t: freeze * die(dmg), dmg, zone: 'mid' }, 0.1, 0);
            }
            else if (mode === 'attack') {
                a.update({ kind: 'attack', t: freeze * atkDur }, 0.1, 0);
                v?.update(victimAnim(atk, freeze * atkDur, foeDie), 0.1, 0);
            }
            else
                a.update({ kind: mode, t: freeze * 4 }, 0.1, 0);
            return;
        }
        let anim;
        let foeAnim = { kind: 'ready', t };
        let preview = null;
        if (mode === 'idle')
            anim = { kind: 'idle', t };
        else if (mode === 'run') {
            preview = runPreview(a.design, t);
            anim = preview.anim;
        }
        else if (mode === 'attack') {
            const period = Math.max(atkDur, atk.hit + foeDie + 0.3) + 0.6;
            const local = t % period;
            anim = local < atkDur ? { kind: 'attack', t: local } : { kind: 'ready', t };
            foeAnim = victimAnim(atk, local, foeDie);
            if (local < atkDur)
                fireFx(a.design, local, Math.floor(t / period));
        }
        else if (mode === 'death') {
            const k = Math.floor(t / (die('shock') + 1.2));
            const dmg = selfDmg(k);
            anim = { kind: 'death', t: t - k * (die('shock') + 1.2), dmg, zone: 'mid' };
            if (anim.t > die(dmg) + 0.6)
                anim = { kind: 'ready', t };
        }
        else {
            const runSeg = 2;
            const atkAt = 4 + runSeg;
            const selfAt = atkAt + Math.max(atkDur + 0.8, atk.hit + foeDie + 0.5);
            const cycle = selfAt + die('shock') + 1.2;
            const k = Math.floor(t / cycle);
            const c = t % cycle;
            if (c < 3)
                anim = { kind: 'idle', t };
            else if (c < 3.6)
                anim = { kind: 'ready', t };
            else if (c < 3.6 + runSeg) {
                preview = runPreview(a.design, c - 3.6);
                anim = preview.anim;
            }
            else if (c < atkAt)
                anim = { kind: 'ready', t };
            else if (c < atkAt + atkDur) {
                const local = c - atkAt;
                anim = { kind: 'attack', t: local };
                fireFx(a.design, local, k);
            }
            else if (c < selfAt)
                anim = { kind: 'ready', t };
            else
                anim = { kind: 'death', t: c - selfAt, dmg: selfDmg(k), zone: 'mid' };
            if (c >= atkAt)
                foeAnim = victimAnim(atk, c - atkAt, foeDie);
        }
        applyMover(mover.current, preview);
        a.update(anim, dt, anim.kind === 'move' ? 1 : 0);
        v?.update(foeAnim, dt, 0);
    });
    return (_jsxs("group", { position: [x, 0, z], children: [_jsx("group", { ref: mover, children: _jsx(HeroFighter, { heroId: id, color: "w", seed: seed, apiRef: api, awakened: awakened }) }), sparring ? (_jsx("group", { position: [0, 0, victimZ(atkDef)], rotation: [0, Math.PI, 0], children: _jsx(HeroFighter, { heroId: id, color: "b", seed: (seed + 0.41) % 1, apiRef: foe, awakened: awakened }) })) : null, _jsx(FxLayer, { events: fx })] }));
}
function OutlineSync() {
    const gl = useThree((s) => s.gl);
    useFrame(() => {
        const dpr = gl.getPixelRatio();
        outlineUniforms.uThickness.value = 0.011;
        outlineUniforms.uMinPx.value = 1.05 * dpr;
        outlineUniforms.uMaxPx.value = 2.6 * dpr;
        outlineUniforms.uResY.value = gl.domElement.height;
    });
    return null;
}
const COLS = 8;
const GAP = 1.3;
export function CharacterStage({ ids, mode, freeze = null, damage = null, awakened = false, cam, className, }) {
    const valid = ids.filter((id) => HERO_DESIGNS[id]);
    const rows = Math.max(1, Math.ceil(valid.length / COLS));
    const single = valid.length === 1;
    return (_jsx("div", { className: className, style: { width: '100%', height: '100%' }, children: _jsxs(Canvas, { shadows: true, dpr: [1, 2], camera: single
                ? { position: cam ?? [1.9, 1.1, 1.9], fov: 35 }
                : { position: [0, 4, 9], fov: 40 }, children: [_jsx("color", { attach: "background", args: ['#cfd8e3'] }), _jsx("ambientLight", { intensity: 0.95 }), _jsx("hemisphereLight", { args: ['#dff0ff', '#b8c0a8', 0.85] }), _jsx("directionalLight", { castShadow: true, position: [4, 8, 5], intensity: 2.1, color: "#fff4e0" }), _jsx(OutlineSync, {}), _jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [40, 40] }), _jsx("meshToonMaterial", { color: "#aeb8c4" })] }), valid.map((id, i) => {
                    const c = i % COLS;
                    const r = Math.floor(i / COLS);
                    const x = single ? 0 : (c - (COLS - 1) / 2) * GAP;
                    const z = single ? 0 : (r - (rows - 1) / 2) * GAP * 1.2;
                    return (_jsx(Unit, { id: id, x: x, z: z, mode: mode, seed: (i * 0.137) % 1, freeze: freeze, damage: damage, awakened: awakened }, `${id}-${awakened ? 'awake' : 'base'}`));
                }), _jsx(OrbitControls, { target: [0, single ? 0.6 : 0.5, single ? 0.3 : 0] })] }) }));
}
