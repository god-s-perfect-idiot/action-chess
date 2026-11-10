import * as THREE from 'three';
const ATHLETIC = {
    ankle: 0.055,
    shin: 0.25,
    thigh: 0.26,
    hipX: 0.062,
    pelvisW: 0.17,
    pelvisD: 0.11,
    waistW: 0.145,
    abdomen: 0.11,
    chestH: 0.19,
    chestW: 0.2,
    chestD: 0.12,
    shoulderX: 0.125,
    upperArm: 0.17,
    forearm: 0.155,
    neck: 0.05,
    headR: 0.094,
    limb: 1,
    hand: 0.028,
    footL: 0.1,
};
const PRESETS = {
    athletic: ATHLETIC,
    lean: {
        ...ATHLETIC,
        thigh: 0.27,
        shin: 0.26,
        chestW: 0.18,
        waistW: 0.13,
        shoulderX: 0.112,
        limb: 0.84,
        pelvisW: 0.155,
    },
    tall: {
        ...ATHLETIC,
        ankle: 0.06,
        thigh: 0.305,
        shin: 0.295,
        abdomen: 0.12,
        chestH: 0.2,
        chestW: 0.185,
        waistW: 0.13,
        shoulderX: 0.118,
        upperArm: 0.19,
        forearm: 0.172,
        limb: 0.86,
        headR: 0.09,
        footL: 0.105,
    },
    petite: {
        ...ATHLETIC,
        ankle: 0.048,
        thigh: 0.2,
        shin: 0.19,
        hipX: 0.052,
        pelvisW: 0.14,
        pelvisD: 0.095,
        waistW: 0.118,
        abdomen: 0.088,
        chestH: 0.155,
        chestW: 0.155,
        chestD: 0.1,
        shoulderX: 0.098,
        upperArm: 0.13,
        forearm: 0.12,
        neck: 0.04,
        headR: 0.104,
        limb: 0.82,
        hand: 0.024,
        footL: 0.085,
    },
    heavy: {
        ...ATHLETIC,
        thigh: 0.24,
        shin: 0.225,
        hipX: 0.088,
        pelvisW: 0.25,
        pelvisD: 0.17,
        waistW: 0.25,
        abdomen: 0.125,
        chestH: 0.21,
        chestW: 0.29,
        chestD: 0.19,
        shoulderX: 0.165,
        upperArm: 0.16,
        forearm: 0.15,
        neck: 0.04,
        headR: 0.09,
        limb: 1.5,
        hand: 0.036,
        footL: 0.12,
    },
    titan: {
        ...ATHLETIC,
        ankle: 0.06,
        thigh: 0.3,
        shin: 0.29,
        hipX: 0.08,
        pelvisW: 0.21,
        pelvisD: 0.14,
        waistW: 0.19,
        abdomen: 0.135,
        chestH: 0.235,
        chestW: 0.29,
        chestD: 0.16,
        shoulderX: 0.168,
        upperArm: 0.205,
        forearm: 0.19,
        neck: 0.055,
        headR: 0.088,
        limb: 1.32,
        hand: 0.036,
        footL: 0.12,
    },
    wiry: {
        ...ATHLETIC,
        thigh: 0.27,
        shin: 0.27,
        chestW: 0.17,
        waistW: 0.12,
        pelvisW: 0.15,
        shoulderX: 0.108,
        upperArm: 0.195,
        forearm: 0.185,
        limb: 0.78,
        headR: 0.09,
    },
};
export function proportionsFor(d) {
    const b = { ...PRESETS[d.body] };
    const fem = d.figure === 'f';
    if (fem) {
        b.pelvisW *= 1.08;
        b.waistW *= 0.86;
        b.chestW *= 0.9;
        b.shoulderX *= 0.92;
        b.limb *= 0.92;
        b.hipX *= 1.04;
        b.headR *= 1.02;
    }
    const t = d.tweak ?? {};
    const h = t.height ?? 1;
    const bulk = t.bulk ?? 1;
    const sh = t.shoulders ?? 1;
    b.thigh *= h;
    b.shin *= h;
    b.abdomen *= h;
    b.chestH *= h;
    b.upperArm *= h;
    b.forearm *= h;
    b.limb *= bulk;
    b.chestD *= bulk;
    b.waistW *= bulk;
    b.chestW *= bulk * sh;
    b.shoulderX *= sh;
    b.headR *= t.head ?? 1;
    return { ...b, hipH: b.ankle + b.shin + b.thigh, fem };
}
const VEC_KEYS = [
    'root',
    'rootRot',
    'hips',
    'spine',
    'chest',
    'neck',
    'head',
    'lArm',
    'lElbow',
    'lHand',
    'rArm',
    'rElbow',
    'rHand',
    'lFoot',
    'rFoot',
];
const NUM_KEYS = ['hipY', 'lToe', 'rToe', 'blink', 'prop', 'flap', 'vis'];
export function restPose() {
    return {
        root: [0, 0, 0],
        rootRot: [0, 0, 0],
        hipY: 0,
        hips: [0, 0, 0],
        spine: [0, 0, 0],
        chest: [0, 0, 0],
        neck: [0, 0, 0],
        head: [0, 0, 0],
        lArm: [0.05, 0, 0.12],
        lElbow: [-0.25, 0, 0],
        lHand: [0, 0, 0],
        rArm: [0.05, 0, 0.12],
        rElbow: [-0.25, 0, 0],
        rHand: [0, 0, 0],
        lFoot: [0.01, 0, 0],
        rFoot: [0.01, 0, 0],
        lToe: 0,
        rToe: 0,
        blink: 0,
        prop: 0,
        flap: 0,
        vis: 1,
    };
}
/** Fill a partial pose on top of a base (rest by default). */
export function P(part, base) {
    const out = clonePose(base ?? restPose());
    for (const k of VEC_KEYS) {
        const v = part[k];
        if (v)
            out[k] = [v[0], v[1], v[2]];
    }
    for (const k of NUM_KEYS) {
        const v = part[k];
        if (v !== undefined)
            out[k] = v;
    }
    return out;
}
export function clonePose(p) {
    const out = { ...p };
    for (const k of VEC_KEYS)
        out[k] = [p[k][0], p[k][1], p[k][2]];
    return out;
}
export function lerpPose(out, a, b, t) {
    for (const k of VEC_KEYS) {
        const av = a[k];
        const bv = b[k];
        const ov = out[k];
        ov[0] = av[0] + (bv[0] - av[0]) * t;
        ov[1] = av[1] + (bv[1] - av[1]) * t;
        ov[2] = av[2] + (bv[2] - av[2]) * t;
    }
    for (const k of NUM_KEYS)
        out[k] = a[k] + (b[k] - a[k]) * t;
    return out;
}
/** Number of scalars in a flattened pose. */
export const POSE_SIZE = VEC_KEYS.length * 3 + NUM_KEYS.length;
export function poseToArray(p, out = new Float32Array(POSE_SIZE)) {
    let i = 0;
    for (const k of VEC_KEYS) {
        const v = p[k];
        out[i++] = v[0];
        out[i++] = v[1];
        out[i++] = v[2];
    }
    for (const k of NUM_KEYS)
        out[i++] = p[k];
    return out;
}
export function arrayToPose(a, out) {
    let i = 0;
    for (const k of VEC_KEYS) {
        const v = out[k];
        v[0] = a[i++];
        v[1] = a[i++];
        v[2] = a[i++];
    }
    for (const k of NUM_KEYS)
        out[k] = a[i++];
    return out;
}
/** Add `d` (already offset from rest) on top of `out`. */
export function addPose(out, d, w = 1) {
    for (const k of VEC_KEYS) {
        const v = d[k];
        if (!v)
            continue;
        out[k][0] += v[0] * w;
        out[k][1] += v[1] * w;
        out[k][2] += v[2] * w;
    }
    for (const k of NUM_KEYS) {
        const v = d[k];
        if (v !== undefined)
            out[k] += v * w;
    }
    return out;
}
const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
function setRot(g, v, mirror) {
    if (!g)
        return;
    if (mirror)
        g.rotation.set(v[0], -v[1], -v[2]);
    else
        g.rotation.set(v[0], v[1], v[2]);
}
function solveLeg(bones, pr, pose, side) {
    const thigh = side === 1 ? bones.lThigh : bones.rThigh;
    const shin = side === 1 ? bones.lShin : bones.rShin;
    const foot = side === 1 ? bones.lFoot : bones.rFoot;
    if (!thigh || !shin || !foot)
        return;
    const target = side === 1 ? pose.lFoot : pose.rFoot;
    const toe = side === 1 ? pose.lToe : pose.rToe;
    // Target ankle in body space → pelvis space → hip-joint space.
    tmpV.set(side * (pr.hipX + target[0]), pr.ankle + target[1], target[2]);
    tmpV.y -= pr.hipH + pose.hipY;
    tmpE.set(pose.hips[0], pose.hips[1], pose.hips[2]);
    tmpQ.setFromEuler(tmpE).invert();
    tmpV.applyQuaternion(tmpQ);
    tmpV.x -= side * pr.hipX;
    tmpV.y += 0.02;
    const L1 = pr.thigh;
    const L2 = pr.shin;
    const D = Math.hypot(tmpV.x, tmpV.y);
    const dist = Math.min(Math.hypot(D, tmpV.z), (L1 + L2) * 0.9995);
    const phi = Math.atan2(tmpV.x, -tmpV.y);
    const beta = Math.atan2(tmpV.z, D);
    const cosG = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
    const gamma = Math.acos(THREE.MathUtils.clamp(cosG, -1, 1));
    const cosK = (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2);
    const knee = Math.PI - Math.acos(THREE.MathUtils.clamp(cosK, -1, 1));
    const alpha = -(beta + gamma);
    thigh.rotation.set(alpha, side * 0.1, phi, 'ZXY');
    shin.rotation.set(knee, 0, 0);
    foot.rotation.set(-(pose.hips[0] + alpha + knee) + toe, 0, -phi * 0.6);
}
export function applyPose(bones, pr, pose) {
    const { body, pelvis } = bones;
    if (body) {
        body.position.set(pose.root[0], pose.root[1], pose.root[2]);
        body.rotation.set(pose.rootRot[0], pose.rootRot[1], pose.rootRot[2], 'YXZ');
        const s = Math.max(0.0001, pose.vis);
        body.scale.setScalar(s);
        body.visible = pose.vis > 0.001;
    }
    if (pelvis) {
        pelvis.position.y = pr.hipH + pose.hipY;
        pelvis.rotation.set(pose.hips[0], pose.hips[1], pose.hips[2]);
    }
    setRot(bones.spine, pose.spine, false);
    setRot(bones.chest, pose.chest, false);
    setRot(bones.neck, pose.neck, false);
    setRot(bones.head, pose.head, false);
    setRot(bones.lUpper, pose.lArm, false);
    setRot(bones.lFore, pose.lElbow, false);
    setRot(bones.lHand, pose.lHand, false);
    setRot(bones.rUpper, pose.rArm, true);
    setRot(bones.rFore, pose.rElbow, true);
    setRot(bones.rHand, pose.rHand, true);
    solveLeg(bones, pr, pose, 1);
    solveLeg(bones, pr, pose, -1);
    if (bones.eyes)
        bones.eyes.scale.y = Math.max(0.08, 1 - pose.blink);
    // Skinned meshes ignore bone visibility, so swapped props collapse to zero scale.
    if (bones.propHand)
        bones.propHand.scale.setScalar(pose.prop > 0.5 ? 1 : 0);
    if (bones.propStow)
        bones.propStow.scale.setScalar(pose.prop <= 0.5 ? 1 : 0);
    if (bones.wingL)
        bones.wingL.rotation.y = -pose.flap;
    if (bones.wingR)
        bones.wingR.rotation.y = pose.flap;
}
