import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** A render geometry plus a smooth-normal twin used for the inverted-hull outline. */
export interface Shape {
  geo: THREE.BufferGeometry
  hull: THREE.BufferGeometry
}

const cache = new Map<string, Shape>()

function hullOf(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const base = geo.clone()
  base.deleteAttribute('normal')
  base.deleteAttribute('uv')
  // Welding split vertices gives averaged normals, so hard edges extrude without gaps.
  const welded = mergeVertices(base, 1e-4)
  welded.computeVertexNormals()
  return welded
}

function shape(key: string, build: () => THREE.BufferGeometry): Shape {
  let s = cache.get(key)
  if (!s) {
    const geo = build()
    s = { geo, hull: hullOf(geo) }
    cache.set(key, s)
  }
  return s
}

const k = (n: number) => n.toFixed(4)

/**
 * Fighters are ~50px tall on screen and 32 of them are vertex-bound, so
 * requested segment counts are scaled down here rather than at every call site.
 */
const DETAIL = 0.65
const seg = (n: number, min: number) => Math.max(min, Math.round(n * DETAIL))

export const S = {
  box(w: number, h: number, d: number, round?: number): Shape {
    const r = round ?? Math.min(w, h, d) * 0.3
    return shape(`box:${k(w)}:${k(h)}:${k(d)}:${k(r)}`, () =>
      new RoundedBoxGeometry(w, h, d, 1, r),
    )
  },
  sphere(r: number, ws = 16, hs = 12): Shape {
    return shape(`sph:${k(r)}:${ws}:${hs}`, () =>
      new THREE.SphereGeometry(r, seg(ws, 6), seg(hs, 4)),
    )
  },
  /** Capsule whose top sits at y=0 and hangs down by `len` (good for limbs). */
  limb(r0: number, r1: number, len: number): Shape {
    return shape(`limb:${k(r0)}:${k(r1)}:${k(len)}`, () => {
      const pts: THREE.Vector2[] = []
      const steps = 3
      for (let i = 0; i <= steps; i++) {
        const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2)
        pts.push(new THREE.Vector2(Math.cos(a) * r1, -len + Math.sin(a) * r1))
      }
      for (let i = 1; i <= steps; i++) {
        const a = (i / steps) * (Math.PI / 2)
        pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0))
      }
      pts[0].x = 0
      pts[pts.length - 1].x = 0
      return new THREE.LatheGeometry(pts, 8)
    })
  },
  /** Sphere with a window cut out of the front (+Z), e.g. a hood. */
  sphereCut(r: number, window: number, thetaLen = Math.PI): Shape {
    return shape(`sphc:${k(r)}:${k(window)}:${k(thetaLen)}`, () =>
      new THREE.SphereGeometry(
        r,
        seg(20, 6),
        seg(14, 4),
        Math.PI / 2 + window / 2,
        Math.PI * 2 - window,
        0,
        thetaLen,
      ),
    )
  },
  /** Spherical cap (top dome). */
  dome(r: number, thetaLen: number): Shape {
    return shape(`dome:${k(r)}:${k(thetaLen)}`, () =>
      new THREE.SphereGeometry(r, seg(18, 6), seg(10, 4), 0, Math.PI * 2, 0, thetaLen),
    )
  },
  capsule(r: number, len: number): Shape {
    return shape(`cap:${k(r)}:${k(len)}`, () =>
      new THREE.CapsuleGeometry(r, len, 3, 8),
    )
  },
  cyl(rt: number, rb: number, h: number, segs = 12, open = false): Shape {
    return shape(`cyl:${k(rt)}:${k(rb)}:${k(h)}:${segs}:${open}`, () =>
      new THREE.CylinderGeometry(rt, rb, h, seg(segs, 5), 1, open),
    )
  },
  cone(r: number, h: number, seg = 8): Shape {
    return shape(`cone:${k(r)}:${k(h)}:${seg}`, () =>
      new THREE.ConeGeometry(r, h, seg),
    )
  },
  torus(R: number, t: number, arc = Math.PI * 2, segs = 20): Shape {
    return shape(`tor:${k(R)}:${k(t)}:${k(arc)}:${segs}`, () =>
      new THREE.TorusGeometry(R, t, 5, seg(segs, 6), arc),
    )
  },
  /** Flat diamond/shard. */
  shard(w: number, h: number, d: number): Shape {
    return shape(`shard:${k(w)}:${k(h)}:${k(d)}`, () =>
      new THREE.OctahedronGeometry(1, 0).scale(w, h, d),
    )
  },
  /** Thin curved panel (cloth flap / wing) bent around Y. */
  panel(w: number, h: number, d: number, bend = 0): Shape {
    return shape(`pan:${k(w)}:${k(h)}:${k(d)}:${k(bend)}`, () => {
      const g = bend !== 0 ? new THREE.BoxGeometry(w, h, d, 10, 1, 1) : new RoundedBoxGeometry(w, h, d, 2, d * 0.45)
      if (bend !== 0) {
        const pos = g.attributes.position
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          pos.setZ(i, pos.getZ(i) - bend * (x / w) * (x / w) * 4)
        }
        g.computeVertexNormals()
      }
      return g
    })
  },
}

const up = new THREE.Vector3(0, 1, 0)
const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()
const tmpV = new THREE.Vector3()

/** Euler that rotates +Y onto the given direction. */
export function aimY(x: number, y: number, z: number): [number, number, number] {
  tmpV.set(x, y, z).normalize()
  tmpQ.setFromUnitVectors(up, tmpV)
  tmpE.setFromQuaternion(tmpQ)
  return [tmpE.x, tmpE.y, tmpE.z]
}

/** Direction on a sphere: yaw 0 = forward (+Z), pitch 90 = straight up (degrees). */
export function dirFrom(yawDeg: number, pitchDeg: number): [number, number, number] {
  const yaw = (yawDeg * Math.PI) / 180
  const pitch = (pitchDeg * Math.PI) / 180
  return [
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ]
}
