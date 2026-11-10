import * as THREE from 'three';
import { CELL_SIZE, squareToCoords, } from '../../game/types';
import { EXCHANGE_ORDER, exchangeStats, } from './anims';
const _delta = new THREE.Vector2();
/** Step through the phrase list so back-to-back rallies are different moves. */
function phrase(seed, i) {
    return EXCHANGE_ORDER[(seed + i * 5) % EXCHANGE_ORDER.length];
}
function beat(kind, t, dur, from, to, face, style, move, zone, n, snapAt) {
    return { kind, t, dur, from, to, face, style, move, zone, n, snapAt };
}
class Lane {
    beats = [];
    pos;
    constructor(home) {
        this.pos = home.clone();
    }
    travel(to, dur, t, style, snapAt) {
        const from = this.pos.clone();
        const dest = to.clone();
        this.beats.push(beat('travel', t, dur, from, dest, dest.clone(), style, 'jab', 'mid', 1, snapAt));
        this.pos.copy(dest);
    }
    pose(kind, dur, t, face, move, zone, n) {
        const at = this.pos.clone();
        this.beats.push(beat(kind, t, dur, at, at.clone(), face.clone(), 'run', move, zone, n));
    }
    /** One side of a paired phrase. Position stays put; the clip carries the choreography. */
    exchange(name, role, dur, t, face) {
        const at = this.pos.clone();
        const b = beat('skirmish', t, dur, at, at.clone(), face.clone(), 'run', 'jab', 'mid', 1);
        b.exchange = name;
        b.role = role;
        this.beats.push(b);
    }
}
function assertCovered(beats, dur, label) {
    if (!import.meta.env.DEV)
        return;
    if (!beats.length)
        throw new Error(`bout ${label} has no beats`);
    let cursor = 0;
    for (const b of beats) {
        if (b.t > cursor + 0.06)
            throw new Error(`bout ${label} gap at ${cursor.toFixed(2)}`);
        cursor = Math.max(cursor, b.t + b.dur);
    }
    if (Math.abs(cursor - dur) > 0.08) {
        throw new Error(`bout ${label} ends at ${cursor.toFixed(2)}, expected ${dur.toFixed(2)}`);
    }
}
function burst(dist) {
    if (dist < 0.08)
        return 0.18;
    return Math.max(0.26, Math.min(0.62, dist / (CELL_SIZE * 3.05)));
}
function stare(lanes, faces, dur, clock) {
    for (let i = 0; i < lanes.length; i++) {
        lanes[i].pose('guard', dur, clock.t, faces[i], 'jab', 'mid', 1);
    }
    clock.t += dur;
}
/** One pass: meet on the shared edge, then the presser crosses onto the other block. */
function pressCycle(A, B, homeA, homeB, clock, seed, phase) {
    const delta = new THREE.Vector2().subVectors(homeB, homeA);
    const len = delta.length() || 1;
    delta.multiplyScalar(1 / len);
    const perp = new THREE.Vector2(-delta.y, delta.x);
    const aEdge = homeA.clone().lerp(homeB, 0.36);
    const bEdge = homeA.clone().lerp(homeB, 0.64);
    const aPresses = phase === 0;
    const press = aPresses ? homeA.clone().lerp(homeB, 0.78) : homeB.clone().lerp(homeA, 0.78);
    const give = (aPresses ? homeB : homeA).clone().addScaledVector(perp, CELL_SIZE * 0.15);
    const step = (toA, toB) => {
        const d = Math.max(A.pos.distanceTo(toA), B.pos.distanceTo(toB));
        const dur = burst(d);
        A.travel(toA, dur, clock.t, 'dash');
        B.travel(toB, dur, clock.t, 'dash');
        clock.t += dur;
    };
    const rally = (aLeads, i) => {
        const name = phrase(seed, i);
        const st = exchangeStats(name);
        const lead = aLeads ? A : B;
        const answer = aLeads ? B : A;
        lead.exchange(name, 'lead', st.dur, clock.t, answer.pos);
        answer.exchange(name, 'answer', st.dur, clock.t, lead.pos);
        clock.t += st.dur;
    };
    const base = phase * 3;
    step(aEdge, bEdge);
    rally(aPresses, base);
    stare([A, B], [B.pos, A.pos], 0.12, clock);
    rally(!aPresses, base + 1);
    step(aPresses ? press : give, aPresses ? give : press);
    rally(aPresses, base + 2);
    step(homeA, homeB);
}
function flank(F, home, watch, t0, t1) {
    const window = Math.max(0.2, t1 - t0);
    const edge = home.clone().lerp(watch, 0.32);
    let outDur = Math.min(0.38, window * 0.28);
    let backDur = Math.min(0.36, window * 0.24);
    if (outDur + backDur > window - 0.08) {
        const scale = (window - 0.08) / Math.max(outDur + backDur, 1e-3);
        outDur *= scale;
        backDur *= scale;
    }
    const mid = window - outDur - backDur;
    F.travel(edge, outDur, t0, 'dash');
    F.pose('guard', mid, t0 + outDur, watch, 'jab', 'mid', 1);
    F.travel(home, backDur, t0 + outDur + mid, 'run');
}
function pad(beats, dur, face) {
    if (!beats.length)
        return;
    const last = beats[beats.length - 1];
    const end = last.t + last.dur;
    if (dur - end > 0.04) {
        beats.push(beat('guard', end, dur - end, last.to.clone(), last.to.clone(), face.clone(), 'run', 'jab', 'mid', 1));
    }
}
function fullDuel(aHome, bHome, seed) {
    const A = new Lane(aHome);
    const B = new Lane(bHome);
    const clock = { t: 0 };
    pressCycle(A, B, aHome, bHome, clock, seed, 0);
    stare([A, B], [bHome, aHome], 0.32, clock);
    pressCycle(A, B, aHome, bHome, clock, seed, 1);
    stare([A, B], [aHome, bHome], 0.4, clock);
    assertCovered(A.beats, clock.t, 'spar-a');
    assertCovered(B.beats, clock.t, 'spar-b');
    return { dur: clock.t, a: A.beats, b: B.beats };
}
function homeVec(square) {
    const [x, z] = squareToCoords(square);
    return new THREE.Vector2(x, z);
}
function buildPair(a, b, seed) {
    const duel = fullDuel(homeVec(a.square), homeVec(b.square), seed);
    const tracks = new Map();
    tracks.set(a.id, duel.a);
    tracks.set(b.id, duel.b);
    return { dur: duel.dur, tracks };
}
function buildTag(solo, primary, ally, seed) {
    const sH = homeVec(solo.square);
    const pH = homeVec(primary.square);
    const aH = homeVec(ally.square);
    const S = new Lane(sH);
    const P = new Lane(pH);
    const A = new Lane(aH);
    const clock = { t: 0 };
    const first = (seed % 2);
    let t0 = 0;
    pressCycle(S, P, sH, pH, clock, seed, first);
    flank(A, aH, sH, t0, clock.t);
    stare([S, P, A], [pH, sH, sH], 0.28, clock);
    t0 = clock.t;
    pressCycle(S, A, sH, aH, clock, seed + 7, first === 0 ? 1 : 0);
    flank(P, pH, sH, t0, clock.t);
    stare([S, P, A], [aH, sH, sH], 0.36, clock);
    assertCovered(S.beats, clock.t, solo.id);
    assertCovered(P.beats, clock.t, primary.id);
    assertCovered(A.beats, clock.t, ally.id);
    const tracks = new Map();
    tracks.set(solo.id, S.beats);
    tracks.set(primary.id, P.beats);
    tracks.set(ally.id, A.beats);
    return { dur: clock.t, tracks };
}
function buildParallel(pairs, seed) {
    const left = fullDuel(homeVec(pairs[0][0].square), homeVec(pairs[0][1].square), seed);
    const right = fullDuel(homeVec(pairs[1][0].square), homeVec(pairs[1][1].square), seed + 13);
    const dur = Math.max(left.dur, right.dur);
    pad(left.a, dur, homeVec(pairs[0][1].square));
    pad(left.b, dur, homeVec(pairs[0][0].square));
    pad(right.a, dur, homeVec(pairs[1][1].square));
    pad(right.b, dur, homeVec(pairs[1][0].square));
    assertCovered(left.a, dur, pairs[0][0].id);
    assertCovered(left.b, dur, pairs[0][1].id);
    assertCovered(right.a, dur, pairs[1][0].id);
    assertCovered(right.b, dur, pairs[1][1].id);
    const tracks = new Map();
    tracks.set(pairs[0][0].id, left.a);
    tracks.set(pairs[0][1].id, left.b);
    tracks.set(pairs[1][0].id, right.a);
    tracks.set(pairs[1][1].id, right.b);
    return { dur, tracks };
}
function segmentsCross(a, b, c, d) {
    const orient = (p, q, r) => Math.sign((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
    const o1 = orient(a, b, c);
    const o2 = orient(a, b, d);
    const o3 = orient(c, d, a);
    const o4 = orient(c, d, b);
    return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
}
function nonCrossingPairs(ws, bs) {
    const options = [
        [[ws[0], bs[0]], [ws[1], bs[1]]],
        [[ws[0], bs[1]], [ws[1], bs[0]]],
    ];
    let best = null;
    let bestD = Infinity;
    for (const opt of options) {
        if (!opt.every(([p, q]) => chebyshev(p.square, q.square) <= 1))
            continue;
        const pa = homeVec(opt[0][0].square);
        const pb = homeVec(opt[0][1].square);
        const qa = homeVec(opt[1][0].square);
        const qb = homeVec(opt[1][1].square);
        if (segmentsCross(pa, pb, qa, qb))
            continue;
        const d = pa.distanceToSquared(pb) + qa.distanceToSquared(qb);
        if (d < bestD) {
            bestD = d;
            best = opt;
        }
    }
    return best;
}
function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function chebyshev(a, b) {
    return Math.max(Math.abs(a.charCodeAt(0) - b.charCodeAt(0)), Math.abs(a.charCodeAt(1) - b.charCodeAt(1)));
}
function pickAlly(side, anchor, enemies, pool, used) {
    let best = null;
    let bestScore = Infinity;
    for (const p of pool) {
        if (p.id === anchor.id || p.color !== side || used.has(p.id))
            continue;
        if (chebyshev(p.square, anchor.square) > 1)
            continue;
        if (!enemies.some((e) => chebyshev(p.square, e.square) <= 1))
            continue;
        const score = hash(`${p.id}|${anchor.id}`);
        if (score < bestScore) {
            bestScore = score;
            best = p;
        }
    }
    return best;
}
function lanesOf(homes, colorOf) {
    const ids = [...homes.keys()];
    const segs = [];
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const idA = ids[i];
            const idB = ids[j];
            const ca = colorOf(idA);
            const cb = colorOf(idB);
            if (!ca || !cb || ca === cb)
                continue;
            const a = homes.get(idA);
            const b = homes.get(idB);
            if (chebyshev(a, b) > 1)
                continue;
            segs.push([homeVec(a), homeVec(b)]);
        }
    }
    return segs;
}
function crosses(a, b, segs) {
    const pa = homeVec(a);
    const pb = homeVec(b);
    return segs.some(([c, d]) => segmentsCross(pa, pb, c, d));
}
/**
 * Most neighboring pairs stay 1v1. A roll can pull one ally per side, and only
 * when that ally is actually inside the fight's 3×3 and next to an enemy.
 * Parallel 2v2s whose paths would cross drop back to a 3-person tag instead.
 */
function scriptFor(members, seed) {
    const whites = members.filter((p) => p.color === 'w');
    const blacks = members.filter((p) => p.color === 'b');
    if (whites.length === 1 && blacks.length === 1)
        return buildPair(whites[0], blacks[0], seed);
    if (whites.length === 2 && blacks.length === 2) {
        const pairs = nonCrossingPairs([whites[0], whites[1]], [blacks[0], blacks[1]]);
        if (pairs)
            return buildParallel(pairs, seed);
    }
    const soloSide = whites.length <= blacks.length ? 'w' : 'b';
    const solo = (soloSide === 'w' ? whites : blacks)[0];
    const others = soloSide === 'w' ? blacks : whites;
    return buildTag(solo, others[0], others[1] ?? others[0], seed);
}
function assignSpars(pool, segs, phase, time) {
    const pairs = [];
    for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
            const a = pool[i];
            const b = pool[j];
            if (a.color === b.color)
                continue;
            if (chebyshev(a.square, b.square) > 1)
                continue;
            const lo = a.id < b.id ? a.id : b.id;
            const hi = a.id < b.id ? b.id : a.id;
            pairs.push({ a, b, score: hash(`${lo}>${hi}@${phase}`) });
        }
    }
    pairs.sort((p, q) => p.score - q.score);
    const used = new Set();
    const made = [];
    for (const pair of pairs) {
        if (used.has(pair.a.id) || used.has(pair.b.id))
            continue;
        if (crosses(pair.a.square, pair.b.square, segs))
            continue;
        const roll = hash(`${pair.a.id}*${pair.b.id}@${phase}`) % 5;
        const members = [pair.a, pair.b];
        const consider = (side, anchor, enemies) => {
            if (members.length >= 4)
                return;
            const ally = pickAlly(side, anchor, enemies, pool, used);
            if (!ally || members.some((m) => m.id === ally.id))
                return;
            members.push(ally);
        };
        // 0–1 stay a duel. 2 or 3 pulls one side. 4 invites one ally each.
        if (roll === 2 || roll === 4)
            consider(pair.a.color, pair.a, [pair.b]);
        if (roll === 3 || roll === 4)
            consider(pair.b.color, pair.b, members.filter((m) => m.color !== pair.b.color));
        if (members.length === 4) {
            const whites = members.filter((m) => m.color === 'w');
            const blacks = members.filter((m) => m.color === 'b');
            if (whites.length === 2 &&
                blacks.length === 2 &&
                !nonCrossingPairs([whites[0], whites[1]], [blacks[0], blacks[1]])) {
                members.pop();
            }
        }
        const ids = members.map((m) => m.id).sort();
        const seed = hash(`${ids.join('|')}@${phase}`) % 997;
        const script = scriptFor(members, seed);
        if (script.tracks.size > 4 || script.tracks.size < 2)
            continue;
        const homes = new Map();
        for (const m of members) {
            if (!script.tracks.has(m.id))
                continue;
            homes.set(m.id, m.square);
            used.add(m.id);
        }
        for (const lane of lanesOf(homes, (id) => members.find((m) => m.id === id)?.color))
            segs.push(lane);
        made.push({ started: time, dur: script.dur, homes, tracks: script.tracks });
    }
    return made;
}
export function tickSpars(prev, pieces, busy, time) {
    const byId = new Map(pieces.map((p) => [p.id, p]));
    const kept = prev.filter((b) => {
        const age = time - b.started;
        if (age >= b.dur * 2 && age % b.dur < 0.22)
            return false;
        for (const [id, square] of b.homes) {
            const p = byId.get(id);
            if (!p || p.square !== square || busy.has(id))
                return false;
        }
        return true;
    });
    const taken = new Set();
    for (const b of kept) {
        for (const id of b.homes.keys())
            taken.add(id);
    }
    const pool = pieces.filter((p) => !taken.has(p.id) && !busy.has(p.id));
    const segs = kept.flatMap((b) => lanesOf(b.homes, (id) => byId.get(id)?.color));
    const fresh = assignSpars(pool, segs, Math.floor(time / 9), time);
    if (!fresh.length && kept.length === prev.length && kept.every((b, i) => b === prev[i]))
        return prev;
    return fresh.length ? [...kept, ...fresh] : kept;
}
export function sparTrack(spars, id) {
    for (const s of spars) {
        const beats = s.tracks.get(id);
        if (beats)
            return { beats, started: s.started, dur: s.dur };
    }
    return null;
}
function moveSpeed(style) {
    if (style === 'walk')
        return 0.35;
    if (style === 'vector')
        return 1.25;
    if (style === 'fly')
        return 0.85;
    if (style === 'teleport')
        return 1.4;
    return 1;
}
/** World pose for one fighter at `pt` seconds into a shared script. Writes position into `out`. */
export function sampleBeat(beats, pt, out) {
    if (!beats.length) {
        return { anim: { kind: 'ready', t: pt }, yaw: 0, y: 0, speed: 0, yawRate: 8 };
    }
    let b = beats[0];
    for (let i = 1; i < beats.length; i++) {
        if (beats[i].t <= pt + 1e-4)
            b = beats[i];
        else
            break;
    }
    const local = Math.max(0, pt - b.t);
    const dur = Math.max(b.dur, 1e-4);
    if (b.kind === 'travel') {
        const p = Math.min(1, local / dur);
        const style = b.style;
        if (style === 'teleport')
            out.copy(p < (b.snapAt ?? 0.5) ? b.from : b.to);
        else {
            const k = style === 'leap' ? p : THREE.MathUtils.smootherstep(p, 0, 1) * 0.15 + p * 0.85;
            out.lerpVectors(b.from, b.to, k);
        }
        _delta.subVectors(b.to, b.from);
        const dist = _delta.length();
        let yaw = 0;
        if (dist > 1e-4)
            yaw = Math.atan2(_delta.x, _delta.y);
        else {
            _delta.subVectors(b.face, out);
            if (_delta.lengthSq() > 1e-6)
                yaw = Math.atan2(_delta.x, _delta.y);
        }
        let y = 0;
        if (style === 'leap')
            y = Math.sin(p * Math.PI) * UNIT_SCALE * (0.5 + (dist / CELL_SIZE) * 0.22);
        else if (style === 'fly') {
            const lift = UNIT_SCALE * 0.42;
            y =
                lift *
                    (p < 0.12
                        ? THREE.MathUtils.smootherstep(p / 0.12, 0, 1)
                        : p > 0.88
                            ? 1 - THREE.MathUtils.smootherstep((p - 0.88) / 0.12, 0, 1)
                            : 1);
        }
        return {
            anim: { kind: 'move', style, t: local, p, dist: (p * dist) / UNIT_SCALE },
            yaw,
            y,
            speed: moveSpeed(style),
            yawRate: style === 'teleport' ? 90 : 18,
        };
    }
    out.copy(b.to);
    _delta.subVectors(b.face, b.to);
    const yaw = _delta.lengthSq() > 1e-6 ? Math.atan2(_delta.x, _delta.y) : 0;
    const anim = b.kind === 'skirmish'
        ? b.exchange && b.role
            ? { kind: 'skirmish', t: local, move: b.move, exchange: b.exchange, role: b.role }
            : { kind: 'skirmish', t: local, move: b.move }
        : b.kind === 'hurt'
            ? { kind: 'hurt', t: local, zone: b.zone, n: b.n }
            : { kind: 'ready', t: local };
    return {
        anim,
        yaw,
        y: 0,
        speed: b.kind === 'skirmish' ? (b.role === 'answer' ? 0.35 : 0.6) : b.kind === 'hurt' ? 0.2 : 0,
        yawRate: b.kind === 'guard' ? 12 : 24,
    };
}
const UNIT_SCALE = CELL_SIZE * 0.365;
export function buildLethalDuel(opts) {
    const A = new Lane(opts.start);
    const V = new Lane(opts.vStart);
    const taps = [];
    const clock = { t: 0 };
    const chase = opts.style === 'fly' ? 'fly' : 'dash';
    const rally = (lead, answer, i) => {
        const name = phrase(opts.seed, i);
        const st = exchangeStats(name);
        lead.exchange(name, 'lead', st.dur, clock.t, answer.pos);
        answer.exchange(name, 'answer', st.dur, clock.t, lead.pos);
        for (const hit of st.contacts) {
            const src = hit.who === 'lead' ? lead : answer;
            const dst = hit.who === 'lead' ? answer : lead;
            taps.push({
                t: clock.t + hit.t,
                zone: hit.zone,
                at: dst.pos.clone(),
                from: src.pos.clone(),
            });
        }
        clock.t += st.dur;
    };
    const sync = (toA, toB) => {
        const d = Math.max(A.pos.distanceTo(toA), V.pos.distanceTo(toB));
        const dur = Math.max(0.22, Math.min(0.58, burst(d)));
        A.travel(toA, dur, clock.t, chase);
        V.travel(toB, dur, clock.t, 'dash');
        clock.t += dur;
    };
    const beside = (target, fromPos, aim) => {
        const d = new THREE.Vector2().subVectors(fromPos, target);
        if (d.lengthSq() < 1e-4)
            d.copy(aim).multiplyScalar(-1);
        else
            d.normalize();
        return target.clone().addScaledVector(d, CELL_SIZE * 0.4);
    };
    if (opts.ranged) {
        const toward = new THREE.Vector2().subVectors(opts.fireHome, opts.vStart);
        const td = toward.length();
        if (td > 1e-3)
            toward.multiplyScalar(1 / td);
        else
            toward.set(0, 1);
        const perp = new THREE.Vector2(-toward.y, toward.x).multiplyScalar(opts.seed % 2 === 0 ? 1 : -1);
        const rush = Math.min(Math.max(0, td - CELL_SIZE * 0.5), CELL_SIZE * 1.15);
        const vicTarget = opts.vStart.clone().addScaledVector(toward, rush);
        const side = opts.fireHome.clone().addScaledVector(perp, CELL_SIZE * 0.28);
        const charge = Math.max(0.36, Math.min(0.72, (rush + CELL_SIZE * 0.25) / (CELL_SIZE * 2.5)));
        A.travel(side, charge, 0, opts.style === 'fly' ? 'fly' : 'dash');
        V.travel(vicTarget, charge, 0, 'run');
        clock.t = charge;
        rally(V, A, 1);
        if (opts.signatureDur < 2.15)
            rally(A, V, 4);
        const back = Math.max(0.32, Math.min(0.62, A.pos.distanceTo(opts.fireHome) / (CELL_SIZE * 2.6) + 0.2));
        A.travel(opts.fireHome, back, clock.t, opts.style === 'fly' ? 'fly' : 'dash');
        V.travel(opts.vHome, back, clock.t, 'run');
        clock.t += back;
        stare([A, V], [opts.vHome, opts.fireHome], 0.18, clock);
        assertCovered(A.beats, clock.t, 'ranged-atk');
        assertCovered(V.beats, clock.t, 'ranged-vic');
        return {
            attacker: A.beats,
            victim: V.beats,
            attackAt: clock.t,
            stop: opts.fireHome.clone(),
            killPos: opts.vHome.clone(),
            taps,
        };
    }
    const aim = new THREE.Vector2().subVectors(opts.vHome, opts.start);
    const len = aim.length();
    if (len > 1e-4)
        aim.multiplyScalar(1 / len);
    else
        aim.set(0, 1);
    const perp = new THREE.Vector2(-aim.y, aim.x).multiplyScalar(opts.seed % 2 === 0 ? 1 : -1);
    const meetV = opts.vHome.clone().addScaledVector(aim, -CELL_SIZE * 0.08);
    const meetA = opts.vHome.clone().addScaledVector(aim, -CELL_SIZE * 0.4);
    const distA = opts.start.distanceTo(meetA);
    const distV = opts.vStart.distanceTo(meetV);
    let opening = distA < 0.08 ? 0 : distA < CELL_SIZE * 0.22 ? 0.24 : opts.travel(distA);
    if (opening < 0.2 && distV > 0.15)
        opening = 0.28;
    if (opening > 0.04) {
        A.travel(meetA, opening, 0, opts.style, opts.snapAt);
        const step = Math.min(0.36, Math.max(0.18, opening * 0.42));
        const hold = opening - step;
        if (hold > 0.04)
            V.pose('guard', hold, 0, opts.start, 'jab', 'mid', 1);
        V.travel(meetV, hold > 0.04 ? step : opening, hold > 0.04 ? hold : 0, 'dash');
        clock.t = opening;
    }
    else {
        A.pos.copy(meetA);
        V.pos.copy(meetV);
    }
    const long = opts.signatureDur > 2.15;
    const pattern = long ? 1 : opts.seed % 3;
    const corner = (side) => {
        const off = perp.clone().multiplyScalar(side * CELL_SIZE * 0.34);
        const m = off.length();
        if (m > CELL_SIZE * 0.4)
            off.multiplyScalar((CELL_SIZE * 0.4) / m);
        return opts.vHome.clone().add(off);
    };
    // Three shapes, two phrases each (one phrase when the finisher is already long).
    // 0 pocket: both combos in place. 1 angle: circle right between them.
    // 2 counter: the defender opens, then they circle the other way.
    const attackerOpens = pattern !== 2;
    rally(attackerOpens ? A : V, attackerOpens ? V : A, pattern);
    if (pattern !== 0) {
        const c1 = corner(pattern === 1 ? 1 : -1);
        sync(beside(c1, A.pos, aim), c1);
    }
    if (!long)
        rally(attackerOpens ? V : A, attackerOpens ? A : V, pattern + 3);
    const killPos = V.pos.clone();
    const stop = beside(killPos, A.pos, aim);
    sync(stop, killPos);
    stare([A, V], [killPos, stop], 0.2, clock);
    assertCovered(A.beats, clock.t, 'melee-atk');
    assertCovered(V.beats, clock.t, 'melee-vic');
    return {
        attacker: A.beats,
        victim: V.beats,
        attackAt: clock.t,
        stop: A.pos.clone(),
        killPos: V.pos.clone(),
        taps,
    };
}
function selfCheckBouts() {
    const piece = (square, color, id) => ({
        square,
        type: 'p',
        color,
        id,
        heroId: null,
        awakened: false,
    });
    const travel = (d) => (d < 1e-3 ? 0 : Math.max(0.28, d / (CELL_SIZE * 2.6)));
    const a = new THREE.Vector2(0, 0);
    const b = new THREE.Vector2(CELL_SIZE, CELL_SIZE * 0.2);
    const out = new THREE.Vector2();
    for (const seed of [1, 2, 4, 9]) {
        for (const ranged of [false, true]) {
            const duel = buildLethalDuel({
                start: a,
                fireHome: a.clone(),
                vStart: b,
                vHome: b.clone(),
                ranged,
                style: seed % 2 ? 'run' : 'fly',
                seed,
                signatureDur: seed > 5 ? 2.8 : 1.1,
                travel,
            });
            sampleBeat(duel.attacker, 0, out);
            sampleBeat(duel.attacker, duel.attackAt * 0.5, out);
            sampleBeat(duel.victim, Math.max(0, duel.attackAt - 0.05), out);
            if (duel.attackAt < 0.4)
                throw new Error('lethal duel collapsed');
        }
    }
    const cluster = [
        piece('d4', 'w', 'w1'),
        piece('d5', 'b', 'b1'),
        piece('e4', 'w', 'w2'),
        piece('e5', 'b', 'b2'),
        piece('c4', 'w', 'w3'),
        piece('a4', 'w', 'farW'),
        piece('a5', 'b', 'farB'),
    ];
    for (let phase = 0; phase < 10; phase++) {
        const spars = tickSpars([], cluster, new Set(), phase * 9 + 0.3);
        const seen = new Set();
        if (!spars.length)
            throw new Error('expected an idle bout');
        for (const s of spars) {
            if (s.tracks.size < 2 || s.tracks.size > 4)
                throw new Error(`idle bout size ${s.tracks.size}`);
            for (const id of s.tracks.keys()) {
                if (seen.has(id))
                    throw new Error(`fighter ${id} double-booked`);
                seen.add(id);
            }
        }
    }
}
if (import.meta.env.DEV)
    selfCheckBouts();
