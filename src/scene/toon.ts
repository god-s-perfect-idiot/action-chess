import * as THREE from 'three'

let cachedGradient: THREE.CanvasTexture | null = null

/** 4-step cel gradient for MeshToonMaterial */
export function getToonGradient(): THREE.CanvasTexture {
  if (cachedGradient) return cachedGradient

  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create toon gradient canvas')
  }

  const stops = ['#2a3038', '#5a6570', '#9aa4b0', '#f0f4f8']
  stops.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect(i, 0, 1, 1)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  cachedGradient = texture
  return texture
}

export const PALETTE = {
  /** Haze cup — sky/fog/ground share one family so no hard horizon line */
  sky: '#9eb8a0',
  fog: '#a8c0a0',
  asphalt: '#5a5850',
  asphaltDark: '#3e3c36',
  concrete: '#b8b0a4',
  concreteDark: '#7a7468',
  /** Battle pads — warm stone / cool moss-dust; contrast is soft, not checker */
  sectorA: '#9a9488',
  sectorB: '#7e8678',
  sectorARim: '#7a7468',
  sectorBRim: '#5e6658',
  curb: '#3a3830',
  plaza: '#8a9078',
  building: '#9a9288',
  buildingDark: '#6a645c',
  buildingAccent: '#7a8a58',
  buildingAccentAlt: '#6a7860',
  windowDay: '#d0e4d8',
  lamp: '#c8c0b0',
  moss: '#5a7850',
  mossLite: '#7a9860',
  dirt: '#6a5a48',
  leaf: '#4a6840',
  whitePiece: '#fff8f0',
  whiteAccent: '#ff9a5c',
  blackPiece: '#2a3038',
  blackAccent: '#5a9ec8',
  ink: '#1a1e24',
  select: '#ffd56a',
  move: '#5dffb0',
  last: '#ff9a5c',
  check: '#ff4d6d',
  hudAmber: '#ffd56a',
  hudMint: '#5a9ec8',
} as const

/** Deterministic pseudo-random in [0,1) from integer seed. */
export function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
