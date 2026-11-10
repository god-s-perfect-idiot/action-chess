import * as THREE from 'three'
import type { HeroPalette } from '../../game/heroDesigns'

let celRamp: THREE.DataTexture | null = null

/** Hard 3-band ramp — reads as anime cel shading rather than soft toon. */
function getCelRamp(): THREE.DataTexture {
  if (celRamp) return celRamp
  const tones = [118, 190, 255]
  const data = new Uint8Array(tones.length * 4)
  tones.forEach((v, i) => {
    data.set([v, v, v, 255], i * 4)
  })
  celRamp = new THREE.DataTexture(data, tones.length, 1, THREE.RGBAFormat)
  celRamp.minFilter = THREE.NearestFilter
  celRamp.magFilter = THREE.NearestFilter
  celRamp.generateMipmaps = false
  celRamp.needsUpdate = true
  return celRamp
}

export function celMaterial(color: string): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: getCelRamp() })
}

/** Screen-space-clamped inverted hull: thin when far, never vanishing, never blobby. */
export const outlineUniforms = {
  uThickness: { value: 0.03 },
  uMinPx: { value: 1.25 },
  uMaxPx: { value: 3.2 },
  uResY: { value: 900 },
  uColor: { value: new THREE.Color('#0d0f14') },
}

export const outlineMaterial = new THREE.ShaderMaterial({
  uniforms: outlineUniforms,
  side: THREE.BackSide,
  vertexShader: /* glsl */ `
    #include <common>
    #include <skinning_pars_vertex>
    uniform float uThickness;
    uniform float uMinPx;
    uniform float uMaxPx;
    uniform float uResY;
    void main() {
      #include <skinbase_vertex>
      #include <begin_vertex>
      #include <beginnormal_vertex>
      #include <skinnormal_vertex>
      #include <skinning_vertex>
      vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
      // Zero-scaled bones (stowed props) zero the normal; leave those collapsed.
      vec3 n = normalMatrix * objectNormal;
      float nl = length(n);
      n = nl > 1e-6 ? n / nl : vec3(0.0);
      float w = max(-mv.z, 0.01);
      float pxPerUnit = projectionMatrix[1][1] * uResY * 0.5 / w;
      float px = clamp(uThickness * pxPerUnit, uMinPx, uMaxPx);
      mv.xyz += n * (px / pxPerUnit);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    void main() { gl_FragColor = vec4(uColor, 1.0); }
  `,
})

export interface FighterMaterials {
  skin: THREE.MeshToonMaterial
  skinShade: THREE.MeshToonMaterial
  hair: THREE.MeshToonMaterial
  hairShade: THREE.MeshToonMaterial
  primary: THREE.MeshToonMaterial
  secondary: THREE.MeshToonMaterial
  accent: THREE.MeshToonMaterial
  trim: THREE.MeshToonMaterial
  metal: THREE.MeshToonMaterial
  light: THREE.MeshToonMaterial
  dark: THREE.MeshToonMaterial
  white: THREE.MeshBasicMaterial
  ink: THREE.MeshBasicMaterial
  iris: THREE.MeshBasicMaterial
  mouth: THREE.MeshBasicMaterial
  glow: THREE.MeshBasicMaterial
  glowAlt: THREE.MeshBasicMaterial
  /** Dark back-face lining for open shells (hoods, cups). */
  lining: THREE.MeshBasicMaterial
}

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex)
  c.multiplyScalar(f)
  return `#${c.getHexString()}`
}

/** Per-palette colour sources; baking copies their colours into vertex colours. */
export function fighterMaterials(p: HeroPalette): FighterMaterials {
  return {
    skin: celMaterial(p.skin),
    skinShade: celMaterial(shade(p.skin, 0.82)),
    hair: celMaterial(p.hair),
    hairShade: celMaterial(p.hairAlt ?? shade(p.hair, 0.7)),
    primary: celMaterial(p.primary),
    secondary: celMaterial(p.secondary),
    accent: celMaterial(p.accent),
    trim: celMaterial(p.trim),
    metal: celMaterial(p.metal ?? '#b8c2cc'),
    light: celMaterial('#f2efe8'),
    dark: celMaterial('#1c1e24'),
    white: new THREE.MeshBasicMaterial({ color: '#fbfdff' }),
    ink: new THREE.MeshBasicMaterial({ color: '#12141a' }),
    iris: new THREE.MeshBasicMaterial({ color: p.eye }),
    mouth: new THREE.MeshBasicMaterial({ color: '#5a2630' }),
    glow: new THREE.MeshBasicMaterial({ color: p.glow ?? p.accent }),
    glowAlt: new THREE.MeshBasicMaterial({
      color: new THREE.Color(p.glow ?? p.accent).lerp(new THREE.Color('#ffffff'), 0.55),
    }),
    lining: new THREE.MeshBasicMaterial({
      color: new THREE.Color(p.primary).multiplyScalar(0.35),
      side: THREE.BackSide,
    }),
  }
}
