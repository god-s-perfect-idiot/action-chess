import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { now } from './clock';
import { celMaterial } from './materials';
import { P } from './Part';
import { aimY, S } from './shapes';
function rand(id, k) {
    const x = Math.sin(id * 91.17 + k * 17.31) * 43758.5453;
    return x - Math.floor(x);
}
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
/** Pop up quickly, hold, shrink away. */
const pop = (u, rise = 0.18, fall = 0.45) => u <= 0 || u >= 1 ? 0 : u < rise ? ease(u / rise) : u > 1 - fall ? ease((1 - u) / fall) : 1;
function useMats(e) {
    return useMemo(() => ({
        a: new THREE.MeshBasicMaterial({ color: e.color }),
        b: new THREE.MeshBasicMaterial({ color: e.color2 }),
        white: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
        dark: new THREE.MeshBasicMaterial({ color: '#16121e' }),
        smoke: celMaterial('#e8e6ea'),
        smokeShade: celMaterial('#b8b4c0'),
        blood: new THREE.MeshBasicMaterial({ color: '#8a0a14' }),
        bloodDark: new THREE.MeshBasicMaterial({ color: '#5c0610' }),
    }), [e.color, e.color2]);
}
/** Drives a group per frame with travel / impact phases; hides outside its window. */
function useFx(e, fn) {
    const ref = useRef(null);
    useFrame(() => {
        const g = ref.current;
        if (!g)
            return;
        const t = now() - e.start;
        const total = e.travel + e.dur;
        if (t < 0 || t > total) {
            g.visible = false;
            return;
        }
        g.visible = true;
        const tp = e.travel > 0 ? Math.min(1, t / e.travel) : 1;
        const u = t < e.travel ? -1 : (t - e.travel) / e.dur;
        fn(g, tp, u);
    });
    return ref;
}
// ───────────────────────── Building blocks ─────────────────────────
function Burst({ e, spikes = 8, scale = 1, mat }) {
    const M = useMats(e);
    const dirs = useMemo(() => Array.from({ length: spikes }, (_, i) => {
        const a = (i / spikes) * Math.PI * 2 + rand(e.id, i) * 0.5;
        const el = (rand(e.id, i + 40) - 0.5) * 1.4;
        return new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el) + 0.2, Math.sin(a) * Math.cos(el)).normalize();
    }), [e.id, spikes]);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0) {
            g.scale.setScalar(0.0001);
            return;
        }
        g.position.copy(e.to);
        const s = pop(u, 0.12, 0.6) * e.size * scale;
        g.scale.setScalar(Math.max(0.0001, s));
        g.children.forEach((c, i) => {
            if (i === 0) {
                c.scale.setScalar(1 - u * 0.6);
                return;
            }
            const d = dirs[i - 1];
            if (!d)
                return;
            const out = 0.35 + ease(u) * 0.55;
            c.position.copy(d).multiplyScalar(out);
            c.scale.set(1, 0.4 + (1 - u) * 1.2, 1);
        });
    });
    const m = M[mat ?? 'a'];
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.shard(0.32, 0.32, 0.32), m: M.white, shadow: false }), dirs.map((d, i) => (_jsx(P, { s: S.cone(0.07, 0.55, 4), m: i % 2 ? m : M.b, shadow: false, r: aimY(d.x, d.y, d.z) }, i)))] }));
}
function Ring({ e, ground = false, radius = 1.2, delay = 0 }) {
    const M = useMats(e);
    const ref = useFx(e, (g, _tp, u0) => {
        const u = (u0 - delay) / (1 - delay);
        if (u0 < 0 || u < 0) {
            g.scale.setScalar(0.0001);
            return;
        }
        g.position.copy(e.to);
        if (ground)
            g.position.y = 0.06;
        const r = (0.2 + ease(u) * radius) * e.size;
        g.scale.set(r, r, Math.max(0.0001, (1 - u) * e.size));
        if (!ground)
            g.lookAt(e.from.x, e.to.y, e.from.z);
    });
    return (_jsx("group", { ref: ref, children: _jsx("group", { rotation: ground ? [Math.PI / 2, 0, 0] : [0, 0, 0], children: _jsx(P, { s: S.torus(1, 0.06, Math.PI * 2, 32), m: M.a, shadow: false }) }) }));
}
function Beam({ e, dark = false }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        const from = e.from;
        const dir = new THREE.Vector3().subVectors(e.to, from);
        const len = dir.length() * (u < 0 ? ease(tp) : 1);
        g.position.copy(from);
        g.lookAt(e.to);
        const w = (u < 0 ? 0.6 + tp * 0.4 : pop(u, 0.05, 0.5) * (1 + Math.sin(u * 60) * 0.08)) * e.size;
        g.scale.set(Math.max(0.0001, w), Math.max(0.0001, w), Math.max(0.0001, len));
    });
    return (_jsxs("group", { ref: ref, children: [_jsxs("group", { position: [0, 0, 0.5], rotation: [Math.PI / 2, 0, 0], children: [_jsx(P, { s: S.cyl(0.22, 0.22, 1, 14, true), m: dark ? M.dark : M.a, shadow: false }), _jsx(P, { s: S.cyl(0.11, 0.11, 1.002, 10, true), m: dark ? M.a : M.white, line: false, shadow: false })] }), _jsx(P, { s: S.sphere(0.34, 14, 10), m: dark ? M.dark : M.a, shadow: false })] }));
}
/** Gates of Babylon — gold reality-ripples bloom behind the caster; random noble phantasms lance out. */
function BabylonGates({ e, count = 8 }) {
    const M = useMats(e);
    const ripple = useMemo(() => ({
        rim: new THREE.MeshBasicMaterial({
            color: e.color,
            transparent: true,
            opacity: 0.92,
            depthWrite: false,
        }),
        rimSoft: new THREE.MeshBasicMaterial({
            color: e.color2,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
        }),
        core: new THREE.MeshBasicMaterial({
            color: '#fff6c8',
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        }),
        veil: new THREE.MeshBasicMaterial({
            color: e.color,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            side: THREE.DoubleSide,
        }),
        warp: new THREE.MeshBasicMaterial({
            color: e.color2,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
            side: THREE.DoubleSide,
        }),
    }), [e.color, e.color2]);
    const portals = useMemo(() => {
        // Basis: portals sit on a wall behind Gilgamesh, facing the target.
        const forward = new THREE.Vector3().subVectors(e.to, e.from);
        if (forward.lengthSq() < 1e-8)
            forward.set(0, 0, 1);
        else
            forward.normalize();
        const back = forward.clone().negate();
        const worldUp = new THREE.Vector3(0, 1, 0);
        let right = new THREE.Vector3().crossVectors(forward, worldUp);
        if (right.lengthSq() < 1e-6)
            right.set(1, 0, 0);
        else
            right.normalize();
        const up = new THREE.Vector3().crossVectors(right, forward).normalize();
        return Array.from({ length: count }, (_, i) => {
            const col = (i % 3) - 1;
            const row = Math.floor(i / 3) - 0.5;
            const jitterR = (rand(e.id, i) - 0.5) * 0.28;
            const jitterU = (rand(e.id, i + 20) - 0.5) * 0.22;
            const depth = 0.42 + rand(e.id, i + 40) * 0.55;
            const offset = new THREE.Vector3()
                .addScaledVector(back, depth * e.size)
                .addScaledVector(right, (col * 0.42 + jitterR) * e.size)
                .addScaledVector(up, (0.18 + row * 0.38 + jitterU) * e.size);
            const kind = Math.floor(rand(e.id, i + 60) * 6); // sword / spear / axe / dagger / mace / arrow
            return {
                offset,
                lag: 0.04 + i * 0.05 + rand(e.id, i + 80) * 0.03,
                kind,
                spin: (rand(e.id, i + 100) - 0.5) * 6,
                phase: rand(e.id, i + 120) * Math.PI * 2,
                sizeMul: 0.75 + rand(e.id, i + 140) * 0.45,
            };
        });
    }, [e.id, e.size, e.from, e.to, count]);
    const ref = useFx(e, (g, tp, u) => {
        const open = u < 0 ? ease(Math.min(1, tp / 0.28)) : pop(u, 0.04, 0.5);
        const t = now() - e.start;
        g.children.forEach((c, i) => {
            const p = portals[i];
            if (!p)
                return;
            const portal = c.children[0];
            const weapon = c.children[1];
            const origin = new THREE.Vector3().copy(e.from).add(p.offset);
            portal.position.copy(origin);
            portal.lookAt(e.to);
            const breath = 1 + Math.sin(t * 7 + p.phase) * 0.06;
            const ps = Math.max(0.0001, open * e.size * p.sizeMul * breath * (0.7 + (u < 0 ? 0.15 : (1 - u) * 0.25)));
            portal.scale.setScalar(ps);
            portal.visible = open > 0.04;
            // Concentric rings pulse outward like gold ripples tearing reality.
            portal.children.forEach((ring, ri) => {
                if (ri >= 4)
                    return;
                const wave = ((t * 1.85 + p.phase + ri * 0.52) % 1.25) / 1.25;
                ring.scale.setScalar(Math.max(0.0001, 0.5 + wave * 1.25));
                ring.visible = open > 0.04;
            });
            const local = Math.min(1, Math.max(0, (tp - p.lag) / Math.max(0.22, 1 - p.lag)));
            if (u < 0 && local > 0.02 && local < 1) {
                // Emerges from the portal mouth a short distance, then flies to the target.
                const emerge = Math.min(1, local / 0.18);
                const fly = Math.max(0, (local - 0.18) / 0.82);
                const mouth = new THREE.Vector3().lerpVectors(origin, e.to, 0.06 * ease(emerge));
                weapon.visible = true;
                weapon.position.lerpVectors(mouth, e.to, ease(fly));
                weapon.lookAt(e.to);
                weapon.rotateX(Math.PI / 2);
                weapon.rotateZ(p.spin * local);
                weapon.scale.setScalar(e.size * (0.55 + ease(emerge) * 0.4));
            }
            else if (u >= 0 && local >= 1) {
                weapon.visible = u < 0.22;
                weapon.position.copy(e.to);
                weapon.scale.setScalar(e.size * 0.95 * (1 - u / 0.22));
            }
            else {
                weapon.visible = false;
            }
        });
    });
    return (_jsx("group", { ref: ref, children: portals.map((p, i) => (_jsxs("group", { children: [_jsxs("group", { children: [_jsx("group", { children: _jsx(P, { s: S.torus(0.32, 0.018, Math.PI * 2, 28), m: ripple.rim, line: false, shadow: false }) }), _jsx("group", { children: _jsx(P, { s: S.torus(0.26, 0.014, Math.PI * 2, 24), m: ripple.rimSoft, line: false, shadow: false }) }), _jsx("group", { children: _jsx(P, { s: S.torus(0.2, 0.01, Math.PI * 2, 22), m: ripple.core, line: false, shadow: false }) }), _jsx("group", { children: _jsx(P, { s: S.torus(0.14, 0.008, Math.PI * 2, 20), m: ripple.rimSoft, line: false, shadow: false }) }), _jsx(P, { s: S.cyl(0.22, 0.22, 0.01, 24), m: ripple.veil, line: false, shadow: false, r: [Math.PI / 2, 0, 0] }), _jsx(P, { s: S.cyl(0.14, 0.14, 0.008, 20), m: ripple.warp, line: false, shadow: false, r: [Math.PI / 2, 0, 0] }), _jsx(P, { s: S.sphere(0.05, 10, 8), m: ripple.core, line: false, shadow: false })] }), _jsxs("group", { children: [p.kind === 0 && (_jsxs(_Fragment, { children: [_jsx(P, { s: S.box(0.045, 0.045, 0.44, 0.01), m: M.a, shadow: false }), _jsx(P, { s: S.shard(0.1, 0.22, 0.018), m: M.b, shadow: false, p: [0, 0, 0.3] }), _jsx(P, { s: S.box(0.13, 0.028, 0.035, 0.008), m: M.a, shadow: false, p: [0, 0, -0.16] }), _jsx(P, { s: S.sphere(0.035, 8, 6), m: M.b, line: false, shadow: false, p: [0, 0, -0.24] })] })), p.kind === 1 && (_jsxs(_Fragment, { children: [_jsx(P, { s: S.cyl(0.022, 0.022, 0.58, 6), m: M.a, shadow: false }), _jsx(P, { s: S.cone(0.07, 0.24, 5), m: M.b, shadow: false, p: [0, 0.34, 0], r: [Math.PI, 0, 0] }), _jsx(P, { s: S.box(0.1, 0.018, 0.028, 0.006), m: M.a, shadow: false, p: [0, -0.18, 0] })] })), p.kind === 2 && (_jsxs(_Fragment, { children: [_jsx(P, { s: S.cyl(0.028, 0.028, 0.38, 6), m: M.b, shadow: false }), _jsx(P, { s: S.shard(0.2, 0.15, 0.035), m: M.a, shadow: false, p: [0.09, 0.22, 0], r: [0, 0, 0.45] }), _jsx(P, { s: S.shard(0.15, 0.12, 0.03), m: M.b, shadow: false, p: [-0.07, 0.2, 0], r: [0, 0, -0.55] })] })), p.kind === 3 && (_jsxs(_Fragment, { children: [_jsx(P, { s: S.box(0.035, 0.035, 0.28, 0.008), m: M.a, shadow: false }), _jsx(P, { s: S.shard(0.07, 0.14, 0.015), m: M.b, shadow: false, p: [0, 0, 0.18] }), _jsx(P, { s: S.box(0.09, 0.022, 0.03, 0.006), m: M.a, shadow: false, p: [0, 0, -0.1] })] })), p.kind === 4 && (_jsxs(_Fragment, { children: [_jsx(P, { s: S.cyl(0.03, 0.03, 0.36, 6), m: M.b, shadow: false }), _jsx(P, { s: S.sphere(0.1, 10, 8), m: M.a, shadow: false, p: [0, 0.22, 0] }), _jsx(P, { s: S.box(0.08, 0.02, 0.025, 0.006), m: M.a, shadow: false, p: [0, -0.12, 0] })] })), p.kind === 5 && (_jsxs(_Fragment, { children: [_jsx(P, { s: S.cyl(0.016, 0.016, 0.48, 5), m: M.a, shadow: false }), _jsx(P, { s: S.cone(0.05, 0.14, 4), m: M.b, shadow: false, p: [0, 0.28, 0], r: [Math.PI, 0, 0] }), _jsx(P, { s: S.box(0.07, 0.012, 0.02, 0.004), m: M.a, shadow: false, p: [0, -0.14, 0] })] }))] })] }, i))) }));
}
/** Objects that fly from `from` to `to` during the travel phase. */
function Volley({ e, count, shape }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        g.visible = u < 0;
        g.children.forEach((c, i) => {
            const lag = i * 0.08;
            const p = Math.min(1, Math.max(0, (tp - lag) / (1 - lag * count * 0.5 + 0.0001)));
            c.position.lerpVectors(e.from, e.to, p);
            c.position.y += Math.sin(p * Math.PI) * (shape === 'card' ? (i - (count - 1) / 2) * 0.25 * e.size : shape === 'feather' ? (i - (count - 1) / 2) * 0.12 * e.size : 0);
            c.position.x += shape === 'card' ? Math.sin(p * Math.PI) * (i - (count - 1) / 2) * 0.3 * e.size : shape === 'bullet' || shape === 'feather' ? (i - (count - 1) / 2) * 0.1 * e.size : 0;
            c.visible = p > 0 && p < 1;
            if (shape === 'ring') {
                c.lookAt(e.to);
                const s = (0.5 + p * 0.8) * e.size;
                c.scale.setScalar(s);
            }
            else if (shape === 'card') {
                c.rotation.set(p * 20 + i, p * 14, 0);
                c.scale.setScalar(e.size);
            }
            else if (shape === 'kunai' || shape === 'bullet' || shape === 'feather') {
                c.lookAt(e.to);
                c.rotateX(Math.PI / 2);
                if (shape === 'feather')
                    c.rotateZ((i - (count - 1) / 2) * 0.35);
                c.scale.setScalar(e.size * (shape === 'bullet' ? 0.7 : shape === 'feather' ? 0.9 : shape === 'kunai' ? 0.95 : 0.85));
            }
            else {
                c.scale.setScalar(e.size);
            }
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: count }, (_, i) => (_jsxs("group", { children: [shape === 'card' && _jsx(P, { s: S.box(0.2, 0.3, 0.015, 0.02), m: i % 2 ? M.a : M.white, shadow: false }), shape === 'ring' && _jsx(P, { s: S.torus(0.35, 0.05, Math.PI * 2, 24), m: i % 2 ? M.a : M.b, shadow: false }), shape === 'orb' && _jsx(P, { s: S.sphere(0.22, 12, 10), m: M.a, shadow: false }), shape === 'hook' && _jsx(P, { s: S.cone(0.12, 0.3, 4), m: M.b, shadow: false, r: [Math.PI / 2, 0, 0] }), shape === 'kunai' && (_jsxs("group", { children: [_jsx(P, { s: S.box(0.06, 0.06, 0.18, 0.02), m: M.white, shadow: false, p: [0, 0, -0.12] }), _jsx(P, { s: S.cone(0.07, 0.28, 3), m: M.b, shadow: false, p: [0, 0, 0.08], r: [Math.PI / 2, 0, 0] }), _jsx(P, { s: S.cone(0.04, 0.14, 3), m: M.dark, shadow: false, p: [0.08, 0, 0.02], r: [Math.PI / 2, 0, 0.6] }), _jsx(P, { s: S.cone(0.04, 0.14, 3), m: M.dark, shadow: false, p: [-0.08, 0, 0.02], r: [Math.PI / 2, 0, -0.6] })] })), shape === 'bullet' && (_jsxs("group", { children: [_jsx(P, { s: S.cyl(0.04, 0.04, 0.55, 8), m: M.white, shadow: false }), _jsx(P, { s: S.cyl(0.055, 0.03, 0.12, 8), m: M.a, shadow: false, p: [0, 0.28, 0] }), _jsx(P, { s: S.cyl(0.02, 0.02, 0.35, 6), m: M.b, line: false, shadow: false, p: [0, -0.2, 0] })] })), shape === 'feather' && (_jsxs("group", { children: [_jsx(P, { s: S.shard(0.1, 0.42, 0.03), m: M.a, shadow: false }), _jsx(P, { s: S.shard(0.06, 0.28, 0.02), m: M.b, shadow: false, p: [0.02, -0.04, 0.01] }), _jsx(P, { s: S.cone(0.035, 0.1, 3), m: M.dark, shadow: false, p: [0, 0.22, 0], r: [Math.PI, 0, 0] })] }))] }, i))) }));
}
/** Bright yellow afterimage ribbon that streaks behind a flying kunai. */
function KunaiTrail({ e }) {
    const M = useMats(e);
    const streaks = 9;
    const ref = useFx(e, (g, tp, u) => {
        g.visible = u < 0 && tp > 0.02;
        if (u >= 0)
            return;
        const tip = new THREE.Vector3().lerpVectors(e.from, e.to, ease(tp));
        g.children.forEach((c, i) => {
            const back = Math.min(1, Math.max(0, tp - (i + 1) * 0.045));
            const p = ease(back);
            c.position.lerpVectors(e.from, tip, p);
            c.lookAt(tip);
            c.rotateX(Math.PI / 2);
            const fade = 1 - i / streaks;
            const w = Math.max(0.0001, e.size * (0.55 + fade * 0.7) * (0.35 + (1 - tp) * 0.4));
            c.scale.set(w * 0.35 * fade, w * (0.9 + fade), w * 0.35 * fade);
            c.visible = back > 0.02;
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: streaks }, (_, i) => (_jsx("group", { children: _jsx(P, { s: S.cyl(0.045, 0.02, 0.55, 6, true), m: i % 2 ? M.a : M.white, line: false, shadow: false }) }, i))) }));
}
/** Overhead Rasengan — spinning chakra orb that drives straight down into the target. */
function Rasengan({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        if (u < 0) {
            // Travel = short drop from above the victim into them.
            g.position.lerpVectors(e.from, e.to, ease(tp));
            const charge = 0.55 + tp * 0.7;
            g.scale.setScalar(Math.max(0.0001, e.size * charge));
            g.rotation.y = tp * 28;
            g.rotation.x = tp * 11;
            return;
        }
        g.position.copy(e.to);
        const s = pop(u, 0.08, 0.55) * e.size * (1.4 + Math.sin(u * 40) * 0.08);
        g.scale.setScalar(Math.max(0.0001, s));
        g.rotation.y = 18 + u * 22;
        g.children.forEach((c, i) => {
            if (i === 0)
                return;
            c.rotation.z = u * (10 + i * 3);
            c.rotation.x = u * (6 + i * 2);
        });
    });
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.sphere(0.28, 16, 12), m: M.white, shadow: false }), _jsx(P, { s: S.sphere(0.38, 14, 10), m: M.a, line: false, shadow: false }), _jsx("group", { rotation: [Math.PI / 2, 0, 0], children: _jsx(P, { s: S.torus(0.42, 0.045, Math.PI * 2, 28), m: M.a, shadow: false }) }), _jsx("group", { rotation: [0.4, 0.7, 0.2], children: _jsx(P, { s: S.torus(0.48, 0.03, Math.PI * 2, 24), m: M.b, shadow: false }) }), _jsx("group", { rotation: [-0.5, -0.4, 0.6], children: _jsx(P, { s: S.torus(0.34, 0.025, Math.PI * 2, 20), m: M.white, shadow: false }) })] }));
}
function Chain({ e }) {
    const M = useMats(e);
    const links = 10;
    const ref = useFx(e, (g, tp, u) => {
        const reach = u < 0 ? ease(tp) : 1 - ease(u);
        g.children.forEach((c, i) => {
            const p = (i / (links - 1)) * reach;
            c.position.lerpVectors(e.from, e.to, p);
            c.position.y += Math.sin(p * Math.PI) * 0.15 * e.size;
            c.lookAt(e.to);
            c.rotateZ(i % 2 ? Math.PI / 2 : 0);
            c.scale.setScalar(e.size);
            c.visible = reach > 0.02;
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: links }, (_, i) => (_jsx("group", { children: _jsx(P, { s: i === links - 1 ? S.cone(0.14, 0.35, 4) : S.torus(0.09, 0.025, Math.PI * 2, 10), m: i === links - 1 ? M.b : M.a, shadow: false, r: i === links - 1 ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0] }) }, i))) }));
}
function Slash({ e, sweeps = 1 }) {
    const M = useMats(e);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        g.position.copy(e.to);
        g.lookAt(e.from.x, e.to.y, e.from.z);
        g.children.forEach((c, i) => {
            const local = Math.min(1, Math.max(0, u * (1 + i * 0.3) - i * 0.2));
            c.rotation.z = -1.2 + ease(local) * 1.6 + i * 1.1;
            const w = pop(local, 0.15, 0.6);
            c.scale.set(e.size * 1.2, e.size * 1.2, Math.max(0.0001, w * e.size));
            c.visible = w > 0.001;
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: sweeps }, (_, i) => (_jsx("group", { rotation: [0, 0, 0], children: _jsxs("group", { rotation: [0.3 * (i % 2 ? -1 : 1), 0, 0], children: [_jsx(P, { s: S.torus(0.75, 0.07, Math.PI * 0.9, 24), m: i % 2 ? M.b : M.a, shadow: false, sc: [1, 1, 0.35] }), _jsx(P, { s: S.torus(0.75, 0.03, Math.PI * 0.85, 24), m: M.white, line: false, shadow: false, p: [0, 0, 0.02], sc: [1, 1, 0.35] })] }) }, i))) }));
}
/** Senbonzakura — pink blade-petals that swirl out along the cut and drift away. */
function SakuraPetals({ e, count = 28 }) {
    const M = useMats(e);
    const petals = useMemo(() => Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rand(e.id, i) * 0.7;
        const elev = (rand(e.id, i + 40) - 0.25) * 1.2;
        const spiral = 0.55 + rand(e.id, i + 11) * 1.1;
        const rise = 0.35 + rand(e.id, i + 22) * 1.15;
        const spin = (rand(e.id, i + 33) - 0.5) * 14;
        const delay = rand(e.id, i + 5) * 0.28;
        return { a, elev, spiral, rise, spin, delay, size: 0.55 + rand(e.id, i + 60) * 0.7 };
    }), [e.id, count]);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0) {
            g.visible = false;
            return;
        }
        g.visible = true;
        g.position.copy(e.to);
        g.lookAt(e.from.x, e.to.y, e.from.z);
        g.children.forEach((c, i) => {
            const p = petals[i];
            const local = Math.min(1, Math.max(0, (u - p.delay) / (1 - p.delay * 0.5)));
            if (local <= 0) {
                c.visible = false;
                return;
            }
            c.visible = true;
            const swirl = p.a + local * p.spiral * 2.4;
            const rad = ease(local) * e.size * (0.35 + p.spiral * 0.85);
            const y = Math.sin(p.elev) * e.size * 0.35 + p.rise * local * e.size - local * local * e.size * 0.55;
            c.position.set(Math.cos(swirl) * rad, y, Math.sin(swirl) * rad * 0.55);
            c.rotation.set(local * p.spin, swirl * 1.4, local * p.spin * 0.6);
            const s = pop(local, 0.08, 0.45) * e.size * 0.22 * p.size;
            c.scale.setScalar(Math.max(0.0001, s));
        });
    });
    return (_jsx("group", { ref: ref, children: petals.map((_, i) => (_jsx("group", { children: _jsx(P, { s: S.shard(0.1, 0.16, 0.018), m: i % 3 === 0 ? M.white : i % 3 === 1 ? M.a : M.b, shadow: false, line: false }) }, i))) }));
}
function Pierce({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        g.position.copy(e.to);
        g.lookAt(e.from.x, e.to.y, e.from.z);
        const w = pop(u, 0.04, 0.7);
        g.scale.set(Math.max(0.0001, w * e.size), Math.max(0.0001, w * e.size), e.size * (1 + u * 0.6));
    });
    return (_jsxs("group", { ref: ref, children: [_jsx("group", { rotation: [Math.PI / 2, 0, 0], children: _jsx(P, { s: S.cyl(0.03, 0.03, 3.2, 8), m: M.white, shadow: false }) }), _jsx(P, { s: S.shard(0.12, 0.6, 0.12), m: M.a, shadow: false }), _jsx(P, { s: S.shard(0.6, 0.12, 0.12), m: M.a, shadow: false })] }));
}
function Bolts({ e }) {
    const M = useMats(e);
    const segs = 6;
    const bolts = 3;
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        const frame = Math.floor(u * 18);
        const alive = u < 0.75;
        g.children.forEach((bolt, b) => {
            bolt.visible = alive && (frame + b) % 3 !== 0;
            let px = e.to.x + (rand(e.id + frame, b) - 0.5) * e.size * 0.6;
            let py = e.to.y + e.size * 2.2;
            let pz = e.to.z + (rand(e.id + frame, b + 9) - 0.5) * e.size * 0.6;
            bolt.children.forEach((seg, i) => {
                const nx = e.to.x + (rand(e.id + frame, b * 20 + i) - 0.5) * e.size * 0.9 * (1 - i / segs);
                const ny = py - (e.size * 2.2) / segs;
                const nz = e.to.z + (rand(e.id + frame, b * 30 + i) - 0.5) * e.size * 0.9 * (1 - i / segs);
                const len = Math.hypot(nx - px, ny - py, nz - pz);
                seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2);
                const r = aimY(nx - px, ny - py, nz - pz);
                seg.rotation.set(r[0], r[1], r[2]);
                seg.scale.set(e.size, len, e.size);
                px = nx;
                py = ny;
                pz = nz;
            });
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: bolts }, (_, b) => (_jsx("group", { children: Array.from({ length: segs }, (_, i) => (_jsx("group", { children: _jsx(P, { s: S.box(0.07, 1, 0.07, 0.02), m: i % 2 ? M.a : M.white, shadow: false }) }, i))) }, b))) }));
}
function Debris({ e, count = 10, kind }) {
    const M = useMats(e);
    const vel = useMemo(() => Array.from({ length: count }, (_, i) => {
        const a = rand(e.id, i) * Math.PI * 2;
        const up = kind === 'smoke' ? 0.4 + rand(e.id, i + 7) * 0.5 : kind === 'flame' ? 1.4 + rand(e.id, i + 7) : 0.6 + rand(e.id, i + 7) * 1.4;
        const sp = kind === 'smoke' ? 0.8 + rand(e.id, i + 3) * 0.6 : 0.8 + rand(e.id, i + 3) * 1.4;
        return new THREE.Vector3(Math.cos(a) * sp, up, Math.sin(a) * sp);
    }), [e.id, count, kind]);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        g.children.forEach((c, i) => {
            const v = vel[i];
            const t = u * (kind === 'smoke' ? 0.7 : 1);
            const grav = kind === 'blood' ? 4 : kind === 'shard' || kind === 'cube' ? 2.2 : kind === 'flame' ? -0.3 : 0.2;
            const y = e.to.y + (v.y * t - grav * t * t) * e.size;
            c.position.set(e.to.x + v.x * t * e.size, kind === 'blood' ? Math.max(0.02, y) : y, e.to.z + v.z * t * e.size);
            if (kind === 'cube') {
                c.visible = Math.floor(u * 20 + i) % 2 === 0;
                c.position.set(e.to.x + (rand(e.id, i * 3 + Math.floor(u * 8)) - 0.5) * e.size * 1.6, e.to.y + (rand(e.id, i * 5 + Math.floor(u * 8)) - 0.3) * e.size * 1.6, e.to.z + (rand(e.id, i * 7 + Math.floor(u * 8)) - 0.5) * e.size * 1.6);
            }
            c.rotation.set(u * 9 + i, u * 7 + i * 2, 0);
            const s = kind === 'smoke'
                ? pop(u, 0.25, 0.55) * (0.8 + rand(e.id, i + 20) * 0.6)
                : kind === 'star'
                    ? pop(u, 0.2, 0.5) * (0.6 + Math.sin(u * 30 + i) * 0.4)
                    : pop(u, 0.05, 0.4);
            c.scale.setScalar(Math.max(0.0001, s * e.size));
        });
    });
    return (_jsx("group", { ref: ref, children: vel.map((_, i) => (_jsxs("group", { children: [kind === 'shard' && _jsx(P, { s: S.shard(0.09, 0.22, 0.04), m: i % 2 ? M.a : M.b, shadow: false }), kind === 'cube' && _jsx(P, { s: S.box(0.22, 0.22, 0.22, 0.01), m: i % 3 ? M.a : M.white, shadow: false }), kind === 'star' && _jsx(P, { s: S.shard(0.12, 0.12, 0.12), m: i % 2 ? M.a : M.white, shadow: false }), kind === 'smoke' && _jsx(P, { s: S.sphere(0.32, 12, 10), m: i % 3 ? M.smoke : M.smokeShade, shadow: false }), kind === 'flame' && _jsx(P, { s: S.cone(0.16, 0.42, 6), m: i % 2 ? M.a : M.b, shadow: false }), kind === 'blood' && _jsx(P, { s: S.sphere(0.07, 6, 5), m: i % 2 ? M.blood : M.bloodDark, line: false, shadow: false })] }, i))) }));
}
function Gravity({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        g.position.copy(e.to);
        const grow = u < 0 ? ease(tp) * 0.9 : u < 0.5 ? 0.9 + u * 0.4 : (1 - u) * 2.2;
        const s = Math.max(0.0001, grow * e.size);
        g.scale.setScalar(s);
        g.rotation.y += 0.2;
    });
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.sphere(0.45, 16, 12), m: M.dark, shadow: false }), _jsx("group", { rotation: [Math.PI / 2 - 0.3, 0, 0], children: _jsx(P, { s: S.torus(0.7, 0.05, Math.PI * 2, 32), m: M.a, shadow: false }) }), _jsx("group", { rotation: [Math.PI / 2 + 0.5, 0.4, 0], children: _jsx(P, { s: S.torus(0.85, 0.035, Math.PI * 2, 32), m: M.b, shadow: false }) })] }));
}
/** Opaque spatial gate behind the target — opens, sucks, then snaps shut. */
function PortalSnap({ e }) {
    const mats = useMemo(() => ({
        rim: new THREE.MeshBasicMaterial({ color: e.color }),
        rimAlt: new THREE.MeshBasicMaterial({ color: e.color2 }),
        core: new THREE.MeshBasicMaterial({ color: '#f4f7fb' }),
        fill: new THREE.MeshBasicMaterial({ color: e.color, side: THREE.DoubleSide }),
        dark: new THREE.MeshBasicMaterial({ color: '#0c1018', side: THREE.DoubleSide }),
        blood: new THREE.MeshBasicMaterial({ color: '#8a0a14' }),
    }), [e.color, e.color2]);
    const behind = useMemo(() => {
        const forward = new THREE.Vector3().subVectors(e.to, e.from);
        if (forward.lengthSq() < 1e-8)
            forward.set(0, 0, 1);
        else
            forward.normalize();
        // Sit just past the victim, facing back toward the attacker.
        return new THREE.Vector3().copy(e.to).addScaledVector(forward, e.size * 0.72);
    }, [e.from, e.to, e.size]);
    const ref = useFx(e, (g, tp, u) => {
        g.position.copy(behind);
        g.lookAt(e.from);
        // Travel: bloom open. Impact: hold while sucking, then crush shut with the kill.
        let open = 0;
        if (u < 0)
            open = ease(tp);
        else if (u < 0.68)
            open = 1;
        else
            open = 1 - ease((u - 0.68) / 0.22);
        const pulse = 1 + Math.sin((now() - e.start) * 9) * 0.04 * open;
        const s = Math.max(0.0001, open * e.size * 1.35 * pulse);
        g.scale.setScalar(s);
        g.visible = open > 0.04;
        // Inner suction rings crawl inward during the pull.
        const pull = u < 0 ? 0 : Math.min(1, u / 0.68);
        g.children.forEach((c, i) => {
            if (i < 3) {
                const ring = c;
                const wave = ((now() - e.start) * 1.6 + i * 0.45) % 1;
                const shrink = 1 - pull * 0.35 - wave * 0.12;
                ring.scale.setScalar(Math.max(0.0001, shrink));
                ring.rotation.z = (now() - e.start) * (1.2 + i * 0.35) * (i % 2 ? 1 : -1);
            }
            else if (i === 5) {
                // Blood spray only on the snap.
                const snap = u >= 0.68 && u < 0.95 ? pop((u - 0.68) / 0.27, 0.15, 0.55) : 0;
                c.visible = snap > 0.04;
                c.scale.setScalar(Math.max(0.0001, snap * 1.4));
            }
        });
    });
    return (_jsxs("group", { ref: ref, visible: false, children: [_jsx("group", { children: _jsx(P, { s: S.torus(0.48, 0.04, Math.PI * 2, 32), m: mats.rim, line: false, shadow: false }) }), _jsx("group", { children: _jsx(P, { s: S.torus(0.36, 0.028, Math.PI * 2, 28), m: mats.rimAlt, line: false, shadow: false }) }), _jsx("group", { children: _jsx(P, { s: S.torus(0.24, 0.02, Math.PI * 2, 24), m: mats.core, line: false, shadow: false }) }), _jsx(P, { s: S.cyl(0.42, 0.42, 0.02, 28), m: mats.fill, line: false, shadow: false, r: [Math.PI / 2, 0, 0] }), _jsx(P, { s: S.cyl(0.28, 0.28, 0.016, 24), m: mats.dark, line: false, shadow: false, r: [Math.PI / 2, 0, 0] }), _jsx("group", { children: Array.from({ length: 8 }, (_, i) => {
                    const a = (i / 8) * Math.PI * 2;
                    return (_jsx(P, { s: S.sphere(0.05, 6, 5), m: mats.blood, line: false, shadow: false, p: [Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.08] }, i));
                }) })] }));
}
/** Green wind crescent blades racing the travel path. */
function WindBlades({ e }) {
    const M = useMats(e);
    const blades = 4;
    const ref = useFx(e, (g, tp, u) => {
        if (u < 0) {
            g.position.lerpVectors(e.from, e.to, ease(tp));
            g.lookAt(e.to);
            g.scale.setScalar(e.size * (0.55 + tp * 0.45));
            g.rotation.z = tp * Math.PI * 2;
            return;
        }
        g.position.copy(e.to);
        const s = pop(u, 0.08, 0.55) * e.size;
        g.scale.setScalar(Math.max(0.0001, s * 1.15));
        g.rotation.y += 0.35;
        g.children.forEach((c, i) => {
            c.rotation.z = u * 4 + i * 0.9;
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: blades }, (_, i) => (_jsxs("group", { rotation: [0, (i / blades) * Math.PI * 2, 0.2], children: [_jsx(P, { s: S.panel(0.08, 0.42, 0.01, 0.02), m: i % 2 ? M.a : M.b, shadow: false, p: [0.18, 0.05, 0], r: [0.4, 0, 0.6] }), _jsx(P, { s: S.shard(0.03, 0.16, 0.012), m: M.white, line: false, shadow: false, p: [0.28, 0.12, 0.02], r: [0.2, 0, 0.9] })] }, i))) }));
}
/** Rising cyclone — stacked spinning rings + debris vortex. */
function Whirl({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        const target = u < 0 ? new THREE.Vector3().lerpVectors(e.from, e.to, ease(tp)) : e.to;
        g.position.copy(target);
        const grow = u < 0 ? ease(tp) * 0.75 : u < 0.4 ? 0.75 + u * 1.1 : (1 - u) * 1.6;
        g.scale.setScalar(Math.max(0.0001, grow * e.size));
        g.rotation.y += 0.45;
        g.children.forEach((c, i) => {
            c.rotation.y += 0.12 + i * 0.04;
            c.position.y = (i - 1) * 0.18 * e.size * (u < 0 ? tp : 1 - u * 0.3);
        });
    });
    return (_jsxs("group", { ref: ref, children: [[0.55, 0.75, 0.95].map((r, i) => (_jsx("group", { rotation: [Math.PI / 2 + (i - 1) * 0.15, 0, 0], children: _jsx(P, { s: S.torus(r, 0.04 - i * 0.006, Math.PI * 2, 28), m: i % 2 ? M.a : M.b, shadow: false }) }, i))), _jsx(P, { s: S.sphere(0.2, 12, 10), m: M.white, line: false, shadow: false })] }));
}
function SpeedLines({ e }) {
    const M = useMats(e);
    const lines = 7;
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        g.position.lerpVectors(e.from, e.to, 0.5);
        g.lookAt(e.to);
        const len = e.from.distanceTo(e.to);
        g.children.forEach((c, i) => {
            const w = pop(u - i * 0.03, 0.05, 0.7);
            c.position.set((rand(e.id, i) - 0.5) * e.size * 1.2, (rand(e.id, i + 5) - 0.2) * e.size * 1.4, (rand(e.id, i + 9) - 0.5) * len * 0.3);
            c.scale.set(Math.max(0.0001, w * e.size), Math.max(0.0001, w * e.size), len * (0.4 + rand(e.id, i + 11) * 0.6));
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: lines }, (_, i) => (_jsx("group", { children: _jsx("group", { rotation: [Math.PI / 2, 0, 0], children: _jsx(P, { s: S.cyl(0.03, 0.03, 1, 6), m: i % 2 ? M.a : M.white, shadow: false }) }) }, i))) }));
}
/** Horizontal laser-bolt of jagged electricity along the travel path. */
function BeamBolts({ e }) {
    const M = useMats(e);
    const segs = 8;
    const bolts = 2;
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        const frame = Math.floor(u * 22);
        const alive = u < 0.85;
        g.children.forEach((bolt, b) => {
            bolt.visible = alive && (frame + b) % 2 === 0;
            let px = e.from.x;
            let py = e.from.y + e.size * 0.9;
            let pz = e.from.z;
            bolt.children.forEach((seg, i) => {
                const nt = Math.min(1, (i + 1) / segs);
                const nx = e.from.x + (e.to.x - e.from.x) * nt + (rand(e.id + frame, b * 20 + i) - 0.5) * e.size * 0.35 * (1 - Math.abs(nt - 0.5) * 1.2);
                const ny = e.from.y +
                    e.size * 0.9 +
                    (e.to.y - e.from.y) * nt +
                    (rand(e.id + frame, b * 30 + i) - 0.5) * e.size * 0.45;
                const nz = e.from.z + (e.to.z - e.from.z) * nt + (rand(e.id + frame, b * 40 + i) - 0.5) * e.size * 0.35 * (1 - Math.abs(nt - 0.5) * 1.2);
                const sl = Math.hypot(nx - px, ny - py, nz - pz);
                seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2);
                const r = aimY(nx - px, ny - py, nz - pz);
                seg.rotation.set(r[0], r[1], r[2]);
                seg.scale.set(e.size * (b === 0 ? 1.1 : 0.7), Math.max(0.001, sl), e.size * (b === 0 ? 1.1 : 0.7));
                px = nx;
                py = ny;
                pz = nz;
            });
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: bolts }, (_, b) => (_jsx("group", { children: Array.from({ length: segs }, (_, i) => (_jsx("group", { children: _jsx(P, { s: S.box(0.08, 1, 0.08, 0.02), m: i % 2 ? M.a : M.white, shadow: false }) }, i))) }, b))) }));
}
/** Hollow Purple — violet core that grows while flying, then shreds the target. */
function MurasakiOrb({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        const p = u < 0 ? ease(tp) : 1;
        g.position.lerpVectors(e.from, e.to, p);
        const grow = u < 0 ? 0.4 + ease(tp) * 1.05 : u < 0.28 ? 1.45 + u * 2.2 : Math.max(0.0001, (1 - u) * 2.6);
        g.scale.setScalar(Math.max(0.0001, grow * e.size));
        g.rotation.y += 0.38;
        g.rotation.x += 0.14;
    });
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.sphere(0.58, 18, 14), m: M.a, shadow: false }), _jsx(P, { s: S.sphere(0.3, 14, 10), m: M.white, line: false, shadow: false }), _jsx(P, { s: S.sphere(0.72, 12, 10), m: M.b, line: false, shadow: false }), _jsx("group", { rotation: [Math.PI / 2 - 0.25, 0, 0], children: _jsx(P, { s: S.torus(0.82, 0.07, Math.PI * 2, 32), m: M.b, shadow: false }) }), _jsx("group", { rotation: [Math.PI / 2 + 0.45, 0.55, 0], children: _jsx(P, { s: S.torus(1.05, 0.045, Math.PI * 2, 28), m: M.a, shadow: false }) })] }));
}
/** Ryūjin Jakka — towering flame columns that erase the entire front cell. */
function InfernoStorm({ e }) {
    const M = useMats(e);
    const pillars = 7;
    const jets = useMemo(() => Array.from({ length: pillars }, (_, i) => {
        const a = (i / pillars) * Math.PI * 2 + rand(e.id, i) * 0.4;
        const r = (0.15 + rand(e.id, i + 20) * 0.55) * e.size;
        return {
            x: Math.cos(a) * r,
            z: Math.sin(a) * r,
            h: 1.6 + rand(e.id, i + 40) * 2.4,
            w: 0.35 + rand(e.id, i + 60) * 0.55,
            lag: rand(e.id, i + 5) * 0.18,
        };
    }), [e.id, e.size]);
    const ref = useFx(e, (g, tp, u) => {
        const charge = u < 0 ? ease(tp) : 1;
        g.position.copy(e.to);
        g.position.y = 0.02;
        // Wall of fire racing from caster into the block during travel.
        const wall = g.children[0];
        if (wall) {
            wall.visible = u < 0 || u < 0.35;
            const p = u < 0 ? ease(tp) : 1;
            wall.position.lerpVectors(new THREE.Vector3(e.from.x - e.to.x, 0.4, e.from.z - e.to.z), new THREE.Vector3(0, 0.5, 0), p);
            const ws = Math.max(0.0001, e.size * (0.9 + p * 1.4) * (u < 0 ? 0.7 + tp * 0.5 : pop(u, 0.05, 0.55)));
            wall.scale.set(ws * 1.6, ws * (1.2 + p), ws * 0.5);
            wall.lookAt(e.from.x, wall.position.y, e.from.z);
        }
        g.children.forEach((c, i) => {
            if (i === 0)
                return;
            const jet = jets[i - 1];
            if (!jet)
                return;
            const local = u < 0 ? charge * (0.35 + jet.lag) : Math.min(1, Math.max(0, (u - jet.lag) / (1 - jet.lag * 0.4)));
            const rise = u < 0 ? ease(tp) * 0.45 : pop(local, 0.08, 0.45);
            c.visible = rise > 0.02;
            c.position.set(jet.x, jet.h * rise * 0.5, jet.z);
            c.scale.set(Math.max(0.0001, jet.w * e.size * (0.7 + rise)), Math.max(0.0001, jet.h * rise * e.size), Math.max(0.0001, jet.w * e.size * (0.7 + rise)));
            c.rotation.y = (u < 0 ? tp : u) * (4 + i);
        });
    });
    return (_jsxs("group", { ref: ref, children: [_jsxs("group", { children: [_jsx(P, { s: S.box(1.2, 0.9, 0.35, 0.08), m: M.a, shadow: false }), _jsx(P, { s: S.box(0.7, 0.55, 0.2, 0.05), m: M.white, line: false, shadow: false, p: [0, 0.1, 0.05] })] }), jets.map((_, i) => (_jsxs("group", { children: [_jsx(P, { s: S.cone(0.35, 1, 6), m: i % 2 ? M.a : M.b, shadow: false }), _jsx(P, { s: S.cone(0.18, 0.7, 5), m: M.white, line: false, shadow: false, p: [0, 0.15, 0] })] }, i)))] }));
}
/** Charred crater burned into the pavement — fills the front block. */
function ScorchPatch({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0) {
            g.scale.setScalar(0.0001);
            return;
        }
        g.position.copy(e.to);
        g.position.y = 0.015;
        const s = pop(u, 0.06, 0.35) * e.size * 2.4;
        g.scale.set(Math.max(0.0001, s), 1, Math.max(0.0001, s * 0.92));
    });
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.cyl(0.55, 0.55, 0.02, 20), m: M.dark, shadow: false }), _jsx(P, { s: S.cyl(0.32, 0.32, 0.018, 16), m: M.a, line: false, shadow: false, p: [0, 0.008, 0] }), _jsx(P, { s: S.cyl(0.16, 0.16, 0.016, 12), m: M.white, line: false, shadow: false, p: [0, 0.012, 0] })] }));
}
/** Scorched black line burned into the pavement along the dash. */
function ScorchLine({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        g.position.lerpVectors(e.from, e.to, 0.5);
        g.position.y = Math.min(e.from.y, e.to.y) + 0.02;
        g.lookAt(e.to.x, g.position.y, e.to.z);
        const len = e.from.distanceTo(e.to);
        const w = pop(u, 0.08, 0.55);
        g.scale.set(Math.max(0.0001, w * e.size * 0.55), 1, Math.max(0.0001, len * 0.92));
    });
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.box(0.14, 0.02, 1, 0.01), m: M.dark, shadow: false }), _jsx(P, { s: S.box(0.05, 0.015, 1, 0.008), m: M.a, shadow: false, p: [0, 0.01, 0] })] }));
}
/** Point-blank lightning dump — rapid jagged arcs punching into the target. */
function BarrageBolts({ e }) {
    const M = useMats(e);
    const segs = 5;
    const bolts = 6;
    const ref = useFx(e, (g, _tp, u) => {
        if (u < 0)
            return;
        const frame = Math.floor(u * 28);
        const alive = u < 0.92;
        g.children.forEach((bolt, b) => {
            // Staggered pulses so it reads as a barrage, not one flash.
            const pulse = (frame + b * 2) % 5;
            bolt.visible = alive && pulse < 3;
            const fromHand = b % 2 === 0;
            let px = fromHand
                ? e.from.x + (rand(e.id + frame, b) - 0.5) * e.size * 0.3
                : e.to.x + (rand(e.id + frame, b) - 0.5) * e.size * 0.5;
            let py = fromHand ? e.from.y + e.size * 0.4 : e.to.y + e.size * (1.6 + (b % 3) * 0.35);
            let pz = fromHand
                ? e.from.z + (rand(e.id + frame, b + 3) - 0.5) * e.size * 0.3
                : e.to.z + (rand(e.id + frame, b + 3) - 0.5) * e.size * 0.5;
            bolt.children.forEach((seg, i) => {
                const t = (i + 1) / segs;
                const nx = e.to.x + (rand(e.id + frame, b * 17 + i) - 0.5) * e.size * 0.55 * (1 - t);
                const ny = fromHand
                    ? e.from.y + (e.to.y - e.from.y + e.size * 0.5) * t + (rand(e.id + frame, b * 23 + i) - 0.5) * e.size * 0.35
                    : py - (e.size * 1.8) / segs;
                const nz = e.to.z + (rand(e.id + frame, b * 29 + i) - 0.5) * e.size * 0.55 * (1 - t);
                const len = Math.hypot(nx - px, ny - py, nz - pz);
                seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2);
                const r = aimY(nx - px, ny - py, nz - pz);
                seg.rotation.set(r[0], r[1], r[2]);
                seg.scale.set(e.size * (0.7 + (b % 2) * 0.4), Math.max(0.001, len), e.size * (0.7 + (b % 2) * 0.4));
                px = nx;
                py = ny;
                pz = nz;
            });
        });
    });
    return (_jsx("group", { ref: ref, children: Array.from({ length: bolts }, (_, b) => (_jsx("group", { children: Array.from({ length: segs }, (_, i) => (_jsx("group", { children: _jsx(P, { s: S.box(0.08, 1, 0.08, 0.02), m: i % 2 ? M.a : M.white, shadow: false }) }, i))) }, b))) }));
}
/** Blood left on the tile after a corpse vanishes; `size` is the pool radius. */
function BloodPool({ e }) {
    const mat = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#4e030a',
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
    }), []);
    const geo = useMemo(() => {
        const g = new THREE.CircleGeometry(1, 22);
        const pos = g.attributes.position;
        const k = rand(e.id, 3) * 6;
        for (let i = 1; i < pos.count; i++) {
            const a = Math.atan2(pos.getY(i), pos.getX(i));
            const r = 0.82 + 0.18 * Math.sin(a * 3 + k) + 0.1 * Math.sin(a * 7 + k * 2.3);
            pos.setXY(i, Math.cos(a) * r, Math.sin(a) * r);
        }
        g.rotateX(-Math.PI / 2);
        return g;
    }, [e.id]);
    const ref = useFx(e, (g, _tp, u) => {
        g.position.copy(e.to);
        g.scale.set(e.size, 1, e.size * 0.86);
        const m = g.children[0].material;
        m.opacity = u < 0.6 ? 0.95 : 0.95 * (1 - (u - 0.6) / 0.4);
    });
    return (_jsx("group", { ref: ref, children: _jsx("mesh", { geometry: geo, material: mat, renderOrder: 1 }) }));
}
/** Yeoui — stone pillar that shrinks, then towers up and slams the target. */
function YeouiPillar({ e }) {
    const M = useMats(e);
    const ref = useFx(e, (g, tp, u) => {
        // Travel: shrink → grow overhead. Impact: slam down and hold huge briefly.
        const grow = u < 0
            ? 0.15 + ease(tp) * 2.4
            : u < 0.35
                ? 2.55 + ease(u / 0.35) * 1.1
                : 3.65 * pop(u, 0.05, 0.55);
        const height = Math.max(0.2, grow) * e.size;
        const thick = (0.35 + Math.min(1.4, grow * 0.35)) * e.size;
        g.position.set(e.to.x, height * 0.5 + (u < 0 ? 0.4 * (1 - tp) : 0), e.to.z);
        g.scale.set(thick, height, thick);
        g.rotation.z = (u < 0 ? (1 - tp) * 0.35 : 0) * (rand(e.id, 1) > 0.5 ? 1 : -1);
    });
    return (_jsxs("group", { ref: ref, children: [_jsx(P, { s: S.cyl(0.5, 0.48, 1, 14), m: M.dark, shadow: false }), _jsx(P, { s: S.cyl(0.52, 0.52, 0.08, 14), m: M.a, shadow: false, p: [0, 0.42, 0] }), _jsx(P, { s: S.cyl(0.52, 0.52, 0.08, 14), m: M.a, shadow: false, p: [0, -0.42, 0] }), _jsx(P, { s: S.cyl(0.28, 0.28, 1.02, 10), m: M.b, line: false, shadow: false })] }));
}
// ───────────────────────── Composite fx ─────────────────────────
function FxView({ e }) {
    switch (e.kind) {
        case 'impact':
            return (_jsxs(_Fragment, { children: [_jsx(Burst, { e: e, spikes: 10, scale: 1.1 }), _jsx(Ring, { e: e, radius: 1.4 })] }));
        case 'fire':
            return (_jsxs(_Fragment, { children: [_jsx(Burst, { e: e, spikes: 8 }), _jsx(Debris, { e: e, count: 12, kind: "flame" })] }));
        case 'inferno':
            return (_jsxs(_Fragment, { children: [_jsx(InfernoStorm, { e: e }), _jsx(ScorchPatch, { e: e }), _jsx(ScorchLine, { e: e }), _jsx(Burst, { e: e, spikes: 14, scale: 1.8 }), _jsx(Burst, { e: e, spikes: 10, scale: 1.2, mat: "b" }), _jsx(Debris, { e: e, count: 28, kind: "flame" }), _jsx(Debris, { e: e, count: 16, kind: "smoke" }), _jsx(Debris, { e: e, count: 12, kind: "shard" }), _jsx(Ring, { e: e, ground: true, radius: 2.8 }), _jsx(Ring, { e: e, ground: true, radius: 2.0, delay: 0.12 }), _jsx(Ring, { e: e, ground: true, radius: 1.2, delay: 0.24 }), _jsx(Ring, { e: e, radius: 2.2 }), _jsx(SpeedLines, { e: e })] }));
        case 'shockwave':
            return (_jsxs(_Fragment, { children: [_jsx(Ring, { e: e, ground: true, radius: 2.4 }), _jsx(Ring, { e: e, ground: true, radius: 1.6, delay: 0.15 }), _jsx(Debris, { e: e, count: 10, kind: "shard" }), _jsx(Burst, { e: e, spikes: 6, scale: 0.8 })] }));
        case 'slash':
            return (_jsxs(_Fragment, { children: [_jsx(Slash, { e: e, sweeps: 2 }), _jsx(Burst, { e: e, spikes: 6, scale: 0.6 })] }));
        case 'ratioSlash':
            return (_jsxs(_Fragment, { children: [_jsx(Slash, { e: e, sweeps: 3 }), _jsx(Pierce, { e: e }), _jsx(Burst, { e: e, spikes: 8, scale: 0.75 }), _jsx(Debris, { e: e, count: 10, kind: "shard" })] }));
        case 'sakura':
            return (_jsxs(_Fragment, { children: [_jsx(Slash, { e: e, sweeps: 2 }), _jsx(SakuraPetals, { e: e, count: 32 }), _jsx(Burst, { e: e, spikes: 8, scale: 0.7 }), _jsx(Debris, { e: e, count: 12, kind: "star" }), _jsx(Ring, { e: e, radius: 1.15 })] }));
        case 'pierce':
            return (_jsxs(_Fragment, { children: [_jsx(Pierce, { e: e }), _jsx(Burst, { e: e, spikes: 4, scale: 0.5 })] }));
        case 'beam':
            return (_jsxs(_Fragment, { children: [_jsx(Beam, { e: e }), _jsx(Burst, { e: e, spikes: 10, scale: 1.1 }), _jsx(Debris, { e: e, count: 8, kind: "star" })] }));
        case 'darkBeam':
            return (_jsxs(_Fragment, { children: [_jsx(Beam, { e: e, dark: true }), _jsx(Gravity, { e: { ...e, from: e.to } }), _jsx(Burst, { e: e, spikes: 8, mat: "b" })] }));
        case 'murasaki':
            return (_jsxs(_Fragment, { children: [_jsx(MurasakiOrb, { e: e }), _jsx(Beam, { e: e }), _jsx(Pierce, { e: e }), _jsx(ScorchLine, { e: e }), _jsx(Burst, { e: e, spikes: 14, scale: 1.25, mat: "b" }), _jsx(Debris, { e: e, count: 16, kind: "star" }), _jsx(Ring, { e: e, radius: 1.5 })] }));
        case 'percentBlast':
            return (_jsxs(_Fragment, { children: [_jsx(Beam, { e: e, dark: true }), _jsx(Beam, { e: e }), _jsx(Pierce, { e: e }), _jsx(ScorchLine, { e: e }), _jsx(Burst, { e: e, spikes: 16, scale: 1.45, mat: "b" }), _jsx(Burst, { e: e, spikes: 12, scale: 1.1 }), _jsx(Debris, { e: e, count: 20, kind: "shard" }), _jsx(Debris, { e: e, count: 14, kind: "star" }), _jsx(Ring, { e: e, radius: 1.7 }), _jsx(Ring, { e: e, ground: true, radius: 1.5 }), _jsx(Ring, { e: e, ground: true, radius: 0.9, delay: 0.12 }), _jsx(SpeedLines, { e: e })] }));
        case 'rings':
            return (_jsxs(_Fragment, { children: [_jsx(Volley, { e: e, count: 4, shape: "ring" }), _jsx(Ring, { e: e, radius: 1.4 }), _jsx(Debris, { e: e, count: 8, kind: "star" })] }));
        case 'chain':
            return (_jsxs(_Fragment, { children: [_jsx(Chain, { e: e }), _jsx(Burst, { e: e, spikes: 6, scale: 0.7 })] }));
        case 'cards':
            return (_jsxs(_Fragment, { children: [_jsx(Volley, { e: e, count: 5, shape: "card" }), _jsx(Burst, { e: e, spikes: 8 })] }));
        case 'lightning':
            return (_jsxs(_Fragment, { children: [_jsx(Bolts, { e: e }), _jsx(Burst, { e: e, spikes: 8 }), _jsx(Ring, { e: e, ground: true, radius: 1.4 })] }));
        case 'voltBeam':
            return (_jsxs(_Fragment, { children: [_jsx(BeamBolts, { e: e }), _jsx(SpeedLines, { e: e }), _jsx(ScorchLine, { e: e }), _jsx(Bolts, { e: e }), _jsx(Burst, { e: e, spikes: 10 }), _jsx(Ring, { e: e, ground: true, radius: 1.2 })] }));
        case 'voltBarrage':
            return (_jsxs(_Fragment, { children: [_jsx(SpeedLines, { e: e }), _jsx(BarrageBolts, { e: e }), _jsx(Bolts, { e: e }), _jsx(Debris, { e: e, count: 14, kind: "star" }), _jsx(Burst, { e: e, spikes: 12 }), _jsx(Ring, { e: e, ground: true, radius: 1.3 }), _jsx(Ring, { e: e, ground: true, radius: 0.7, delay: 0.18 })] }));
        case 'shards':
            return (_jsxs(_Fragment, { children: [_jsx(Debris, { e: e, count: 14, kind: "shard" }), _jsx(Burst, { e: e, spikes: 6, scale: 0.7 })] }));
        case 'glitch':
            return (_jsxs(_Fragment, { children: [_jsx(Debris, { e: e, count: 14, kind: "cube" }), _jsx(Ring, { e: e, radius: 1.0 })] }));
        case 'sparkle':
            return (_jsxs(_Fragment, { children: [_jsx(Debris, { e: e, count: 16, kind: "star" }), _jsx(Ring, { e: e, radius: 1.2 })] }));
        case 'gravity':
            return (_jsxs(_Fragment, { children: [_jsx(Gravity, { e: e }), _jsx(Ring, { e: e, ground: true, radius: 1.8 }), _jsx(Debris, { e: e, count: 8, kind: "shard" })] }));
        case 'magnet':
            return (_jsxs(_Fragment, { children: [_jsx(Volley, { e: { ...e, from: e.to, to: e.from }, count: 3, shape: "ring" }), _jsx(Burst, { e: e, spikes: 8 })] }));
        case 'speed':
            return (_jsxs(_Fragment, { children: [_jsx(SpeedLines, { e: e }), _jsx(Burst, { e: e, spikes: 8 })] }));
        case 'phase':
            return (_jsxs(_Fragment, { children: [_jsx(Ring, { e: e, ground: true, radius: 1.8 }), _jsx(Ring, { e: e, ground: true, radius: 1.1, delay: 0.12 }), _jsx(Ring, { e: e, ground: true, radius: 0.6, delay: 0.22 }), _jsx(SpeedLines, { e: e }), _jsx(Debris, { e: e, count: 10, kind: "star" }), _jsx(Burst, { e: e, spikes: 6, scale: 0.75 })] }));
        case 'portal':
            // Gate blooms behind them, pulls, then snaps shut — limbs come apart.
            return (_jsxs(_Fragment, { children: [_jsx(PortalSnap, { e: e }), _jsx(Ring, { e: e, ground: true, radius: 1.5, delay: 0.05 }), _jsx(Ring, { e: e, ground: true, radius: 0.85, delay: 0.18 }), _jsx(SpeedLines, { e: e }), _jsx(Burst, { e: e, spikes: 10, scale: 0.95 }), _jsx(Debris, { e: e, count: 14, kind: "star" }), _jsx(Debris, { e: e, count: 10, kind: "blood" })] }));
        case 'kunai':
            return (_jsxs(_Fragment, { children: [_jsx(Volley, { e: e, count: 1, shape: "kunai" }), _jsx(KunaiTrail, { e: e }), _jsx(SpeedLines, { e: e }), _jsx(Ring, { e: e, radius: 0.7, delay: 0.02 }), _jsx(Burst, { e: e, spikes: 5, scale: 0.45 })] }));
        case 'rasengan':
            return (_jsxs(_Fragment, { children: [_jsx(Rasengan, { e: e }), _jsx(Ring, { e: e, ground: true, radius: 2.2 }), _jsx(Ring, { e: e, ground: true, radius: 1.4, delay: 0.1 }), _jsx(Ring, { e: e, radius: 1.6, delay: 0.04 }), _jsx(Burst, { e: e, spikes: 12, scale: 1.25 }), _jsx(Debris, { e: e, count: 14, kind: "shard" }), _jsx(Debris, { e: e, count: 10, kind: "blood" }), _jsx(SpeedLines, { e: e })] }));
        case 'bullet':
            return (_jsxs(_Fragment, { children: [_jsx(Volley, { e: e, count: 3, shape: "bullet" }), _jsx(Pierce, { e: e }), _jsx(SpeedLines, { e: e }), _jsx(Ring, { e: e, radius: 1.1 }), _jsx(Ring, { e: e, ground: true, radius: 1.0, delay: 0.08 }), _jsx(Burst, { e: e, spikes: 8, scale: 0.85 }), _jsx(Debris, { e: e, count: 8, kind: "star" })] }));
        case 'feather':
            return (_jsxs(_Fragment, { children: [_jsx(Volley, { e: e, count: 5, shape: "feather" }), _jsx(Pierce, { e: e }), _jsx(SpeedLines, { e: e }), _jsx(Ring, { e: e, radius: 1.2 }), _jsx(Ring, { e: e, radius: 0.7, delay: 0.1 }), _jsx(Ring, { e: e, ground: true, radius: 1.05, delay: 0.06 }), _jsx(Burst, { e: e, spikes: 10, scale: 0.9 }), _jsx(Debris, { e: e, count: 12, kind: "star" })] }));
        case 'babylon':
            return (_jsxs(_Fragment, { children: [_jsx(BabylonGates, { e: e, count: 9 }), _jsx(Slash, { e: e, sweeps: 3 }), _jsx(Pierce, { e: e }), _jsx(SpeedLines, { e: e }), _jsx(Ring, { e: e, radius: 1.35 }), _jsx(Ring, { e: e, radius: 0.8, delay: 0.12 }), _jsx(Ring, { e: e, ground: true, radius: 1.2, delay: 0.08 }), _jsx(Burst, { e: e, spikes: 12, scale: 1.05 }), _jsx(Debris, { e: e, count: 14, kind: "shard" }), _jsx(Debris, { e: e, count: 10, kind: "blood" })] }));
        case 'overhaul':
            // Touch → body deconstructs: crimson burst, flying shards, arterial spray.
            return (_jsxs(_Fragment, { children: [_jsx(Burst, { e: e, spikes: 16, scale: 1.35 }), _jsx(Ring, { e: e, radius: 1.6 }), _jsx(Ring, { e: e, radius: 1.0, delay: 0.08 }), _jsx(Ring, { e: e, ground: true, radius: 1.5, delay: 0.05 }), _jsx(Gravity, { e: { ...e, from: e.to } }), _jsx(Debris, { e: e, count: 22, kind: "shard" }), _jsx(Debris, { e: e, count: 18, kind: "blood" }), _jsx(Debris, { e: e, count: 8, kind: "smoke" })] }));
        case 'chainsaw':
            // Revving blades — multi-sweep cuts, arterial spray, metal shards.
            return (_jsxs(_Fragment, { children: [_jsx(Slash, { e: e, sweeps: 4 }), _jsx(SpeedLines, { e: e }), _jsx(Burst, { e: e, spikes: 14, scale: 1.15 }), _jsx(Ring, { e: e, radius: 1.3 }), _jsx(Ring, { e: e, ground: true, radius: 1.15, delay: 0.06 }), _jsx(Debris, { e: e, count: 16, kind: "shard" }), _jsx(Debris, { e: e, count: 20, kind: "blood" })] }));
        case 'kagune':
            // Rinkaku flurry — crimson sweeps, arterial spray, total carve.
            return (_jsxs(_Fragment, { children: [_jsx(Slash, { e: e, sweeps: 5 }), _jsx(SpeedLines, { e: e }), _jsx(Burst, { e: e, spikes: 16, scale: 1.25 }), _jsx(Ring, { e: e, radius: 1.45 }), _jsx(Ring, { e: e, ground: true, radius: 1.25, delay: 0.05 }), _jsx(Debris, { e: e, count: 18, kind: "shard" }), _jsx(Debris, { e: e, count: 26, kind: "blood" })] }));
        case 'yeoui':
            // Yeoui grows from a needle to a tower, then crushes the pad.
            return (_jsxs(_Fragment, { children: [_jsx(YeouiPillar, { e: e }), _jsx(SpeedLines, { e: e }), _jsx(Burst, { e: e, spikes: 14, scale: 1.4 }), _jsx(Ring, { e: e, radius: 1.8 }), _jsx(Ring, { e: e, ground: true, radius: 2.6 }), _jsx(Ring, { e: e, ground: true, radius: 1.8, delay: 0.1 }), _jsx(Ring, { e: e, ground: true, radius: 1.1, delay: 0.2 }), _jsx(Debris, { e: e, count: 22, kind: "shard" }), _jsx(Debris, { e: e, count: 10, kind: "smoke" })] }));
        case 'wind':
            // Razor air blades — green crescents cut the pad.
            return (_jsxs(_Fragment, { children: [_jsx(WindBlades, { e: e }), _jsx(Slash, { e: e, sweeps: 2 }), _jsx(SpeedLines, { e: e }), _jsx(Ring, { e: e, radius: 1.15 }), _jsx(Ring, { e: e, ground: true, radius: 1.0, delay: 0.06 }), _jsx(Burst, { e: e, spikes: 8, scale: 0.8 }), _jsx(Debris, { e: e, count: 10, kind: "star" })] }));
        case 'whirlwind':
            // Spirit Dive cyclone — spinning green vortex + blade shreds.
            return (_jsxs(_Fragment, { children: [_jsx(Whirl, { e: e }), _jsx(WindBlades, { e: e }), _jsx(Slash, { e: e, sweeps: 3 }), _jsx(SpeedLines, { e: e }), _jsx(Ring, { e: e, radius: 1.5 }), _jsx(Ring, { e: e, radius: 0.9, delay: 0.1 }), _jsx(Ring, { e: e, ground: true, radius: 1.6, delay: 0.05 }), _jsx(Burst, { e: e, spikes: 12, scale: 1.1 }), _jsx(Debris, { e: e, count: 16, kind: "star" }), _jsx(Debris, { e: e, count: 10, kind: "shard" })] }));
        case 'getsuga':
            // Final Getsuga — dark-dimension crescent that swallows the pad.
            return (_jsxs(_Fragment, { children: [_jsx(Beam, { e: e, dark: true }), _jsx(Gravity, { e: { ...e, from: e.to } }), _jsx(Slash, { e: e, sweeps: 3 }), _jsx(SpeedLines, { e: e }), _jsx(ScorchLine, { e: e }), _jsx(Burst, { e: e, spikes: 14, scale: 1.35, mat: "b" }), _jsx(Burst, { e: e, spikes: 10, scale: 1.0 }), _jsx(Debris, { e: e, count: 18, kind: "shard" }), _jsx(Debris, { e: e, count: 12, kind: "smoke" }), _jsx(Ring, { e: e, radius: 1.7 }), _jsx(Ring, { e: e, ground: true, radius: 1.5 }), _jsx(Ring, { e: e, ground: true, radius: 0.9, delay: 0.14 })] }));
        case 'sand':
            // Gaara / Shukaku — granular waves bury the pad, then crush.
            return (_jsxs(_Fragment, { children: [_jsx(Ring, { e: e, ground: true, radius: 2.0 }), _jsx(Ring, { e: e, ground: true, radius: 1.35, delay: 0.1 }), _jsx(Ring, { e: e, ground: true, radius: 0.75, delay: 0.2 }), _jsx(Gravity, { e: { ...e, from: e.to } }), _jsx(SpeedLines, { e: e }), _jsx(Burst, { e: e, spikes: 10, scale: 1.05 }), _jsx(Debris, { e: e, count: 18, kind: "smoke" }), _jsx(Debris, { e: e, count: 14, kind: "shard" }), _jsx(Debris, { e: e, count: 8, kind: "star" })] }));
        case 'hit':
            return (_jsxs(_Fragment, { children: [_jsx(Burst, { e: e, spikes: 6, scale: 0.45 }), _jsx(Debris, { e: e, count: 7, kind: "blood" })] }));
        case 'bloodPool':
            return _jsx(BloodPool, { e: e });
        case 'poof':
            return _jsx(Debris, { e: e, count: 9, kind: "smoke" });
        case 'poofSparkle':
            return _jsx(Debris, { e: e, count: 18, kind: "star" });
        case 'poofShards':
            return (_jsxs(_Fragment, { children: [_jsx(Debris, { e: e, count: 18, kind: "shard" }), _jsx(Debris, { e: e, count: 5, kind: "smoke" })] }));
    }
}
export function FxLayer({ events }) {
    return (_jsx("group", { children: events.map((e) => (_jsx(FxView, { e: e }, e.id))) }));
}
