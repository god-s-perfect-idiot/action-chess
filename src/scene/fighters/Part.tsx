import type { ReactNode } from 'react'
import type * as THREE from 'three'
import { outlineMaterial } from './materials'
import type { Shape } from './shapes'

type V3 = [number, number, number]

const noRaycast = () => null

/** One cel-shaded mesh plus its black inverted-hull outline. */
export function P({
  s,
  m,
  p,
  r,
  sc,
  line = true,
  shadow = true,
  children,
}: {
  s: Shape
  m: THREE.Material
  p?: V3
  r?: V3
  sc?: V3 | number
  line?: boolean
  shadow?: boolean
  children?: ReactNode
}) {
  return (
    <group position={p} rotation={r} scale={sc}>
      <mesh
        geometry={s.geo}
        material={m}
        castShadow={shadow}
        raycast={noRaycast}
      />
      {line && (
        <mesh
          geometry={s.hull}
          material={outlineMaterial}
          raycast={noRaycast}
        />
      )}
      {children}
    </group>
  )
}
