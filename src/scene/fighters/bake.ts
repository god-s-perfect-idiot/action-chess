import { Children, isValidElement, type ReactNode } from 'react'
import * as THREE from 'three'
import type { HeroDesign } from '../../game/heroDesigns'
import { buildExtras } from './Extras'
import { buildHead } from './HeadParts'
import { fighterMaterials, outlineMaterial } from './materials'
import { buildBody, type Ctx } from './Outfit'
import { P } from './Part'
import { proportionsFor, type BoneName, type Proportions } from './rig'
import type { Shape } from './shapes'

/** Bones that carry parts, in skin-index order. */
export const SKIN_BONES: BoneName[] = [
  'pelvis',
  'propStow',
  'tails',
  'lThigh',
  'lShin',
  'lFoot',
  'rThigh',
  'rShin',
  'rFoot',
  'spine',
  'chest',
  'cape',
  'wingL',
  'wingR',
  'lUpper',
  'lFore',
  'lHand',
  'rUpper',
  'rFore',
  'rHand',
  'propHand',
  'neck',
  'head',
  'eyes',
  'hairBack',
]

/** One skinned draw: every part sharing a material kind, across all bones. */
export interface BakedPart {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  castShadow: boolean
}

interface Bucket {
  material: THREE.Material
  castShadow: boolean
  colored: boolean
  pos: number[]
  nor: number[]
  col: number[]
  bone: number[]
  idx: number[]
}

/** Vertex-coloured stand-ins, shared by every fighter, keyed by everything but colour. */
const sharedMaterials = new Map<string, THREE.Material>()

function sharedFor(src: THREE.Material): { key: string; material: THREE.Material } {
  const key = `${src.type}|${src.side}|${src.transparent}`
  let m = sharedMaterials.get(key)
  if (!m) {
    m = src.clone()
    ;(m as THREE.MeshBasicMaterial).color.set('#ffffff')
    m.vertexColors = true
    sharedMaterials.set(key, m)
  }
  return { key, material: m }
}

const _v = new THREE.Vector3()
const _n = new THREE.Vector3()
const _nm = new THREE.Matrix3()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _s = new THREE.Vector3()
const _p = new THREE.Vector3()

type V3 = [number, number, number]

function localMatrix(p?: V3, r?: V3, sc?: V3 | number): THREE.Matrix4 {
  _p.set(0, 0, 0)
  if (p) _p.set(p[0], p[1], p[2])
  _q.identity()
  if (r) _q.setFromEuler(_e.set(r[0], r[1], r[2]))
  _s.set(1, 1, 1)
  if (typeof sc === 'number') _s.setScalar(sc)
  else if (sc) _s.set(sc[0], sc[1], sc[2])
  return new THREE.Matrix4().compose(_p, _q, _s)
}

function append(
  b: Bucket,
  geo: THREE.BufferGeometry,
  m: THREE.Matrix4,
  bone: number,
  color?: THREE.Color,
) {
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const base = b.pos.length / 3
  _nm.getNormalMatrix(m)
  for (let i = 0; i < pos.count; i++) {
    _v.fromBufferAttribute(pos, i).applyMatrix4(m)
    b.pos.push(_v.x, _v.y, _v.z)
    _n.fromBufferAttribute(nor, i).applyMatrix3(_nm).normalize()
    b.nor.push(_n.x, _n.y, _n.z)
    b.bone.push(bone)
    if (color) b.col.push(color.r, color.g, color.b)
  }
  // Mirrored parts flip winding once the transform is baked in.
  const flip = m.determinant() < 0
  const index = geo.index
  const n = index ? index.count : pos.count
  for (let i = 0; i < n; i += 3) {
    const a = index ? index.getX(i) : i
    const c1 = index ? index.getX(i + 1) : i + 1
    const c2 = index ? index.getX(i + 2) : i + 2
    if (flip) b.idx.push(base + a, base + c2, base + c1)
    else b.idx.push(base + a, base + c1, base + c2)
  }
}

function toGeometry(b: Bucket): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const count = b.bone.length
  const skinIndex = new Uint16Array(count * 4)
  const skinWeight = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    skinIndex[i * 4] = b.bone[i]
    skinWeight[i * 4] = 1
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3))
  if (b.colored) g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3))
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4))
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4))
  g.setIndex(b.idx)
  return g
}

interface PartProps {
  s: Shape
  m: THREE.Material
  p?: V3
  r?: V3
  sc?: V3 | number
  line?: boolean
  shadow?: boolean
  children?: ReactNode
}

interface GroupProps {
  position?: V3
  rotation?: V3
  scale?: V3 | number
  children?: ReactNode
}

/** Offsets of the plain groups that wrap a bone's parts in `HeroFighter`'s rig. */
function slotOffset(name: BoneName, pr: Proportions): THREE.Matrix4 {
  const m = new THREE.Matrix4()
  if (name === 'head') m.makeTranslation(0, pr.headR * 0.95, 0)
  else if (name === 'eyes') m.makeTranslation(0, pr.headR * 0.1, 0)
  return m
}

function bake(slots: Partial<Record<BoneName, ReactNode[]>>, pr: Proportions): BakedPart[] {
  const buckets = new Map<string, Bucket>()
  const bucket = (key: string, material: THREE.Material, castShadow: boolean, colored: boolean) => {
    let b = buckets.get(key)
    if (!b) {
      b = { material, castShadow, colored, pos: [], nor: [], col: [], bone: [], idx: [] }
      buckets.set(key, b)
    }
    return b
  }

  const walk = (node: ReactNode, parent: THREE.Matrix4, bone: number) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return
      if (child.type === P) {
        const { s, m, p, r, sc, line = true, shadow = true, children } = child.props as PartProps
        const mat = parent.clone().multiply(localMatrix(p, r, sc))
        const { key, material } = sharedFor(m)
        const color = (m as THREE.MeshBasicMaterial).color
        append(bucket(`${key}|${shadow}`, material, shadow, true), s.geo, mat, bone, color)
        if (line) append(bucket('outline', outlineMaterial, false, false), s.hull, mat, bone)
        walk(children, mat, bone)
      } else if (child.type === 'group') {
        const { position, rotation, scale, children } = child.props as GroupProps
        walk(children, parent.clone().multiply(localMatrix(position, rotation, scale)), bone)
      } else {
        throw new Error(`bakeFighter: unsupported element ${String(child.type)}`)
      }
    })
  }
  SKIN_BONES.forEach((name, i) => walk(slots[name], slotOffset(name, pr), i))

  // Outlines last so they draw after the fills they wrap.
  return [...buckets.values()]
    .sort((a, b) => Number(a.material === outlineMaterial) - Number(b.material === outlineMaterial))
    .map((b) => ({ geometry: toGeometry(b), material: b.material, castShadow: b.castShadow }))
}

const cache = new Map<HeroDesign, { pr: Proportions; parts: BakedPart[] }>()

/**
 * Merge every static part of a fighter into one skinned geometry per material
 * kind (colours baked into vertices, each vertex rigidly bound to its bone in
 * that bone's local space). ~250 draws per fighter become ~5.
 * Designs are module constants, so results are cached for the app lifetime.
 */
export function bakeFighter(design: HeroDesign): { pr: Proportions; parts: BakedPart[] } {
  const hit = cache.get(design)
  if (hit) return hit
  const pr = proportionsFor(design)
  const slots: Partial<Record<BoneName, ReactNode[]>> = {}
  const ctx: Ctx = {
    d: design,
    pr,
    M: fighterMaterials(design.palette),
    add: (bone, node) => {
      ;(slots[bone] ??= []).push(node)
    },
    has: (e) => design.extras.includes(e),
  }
  buildBody(ctx)
  buildHead(ctx)
  buildExtras(ctx)
  const out = { pr, parts: bake(slots, pr) }
  cache.set(design, out)
  return out
}
