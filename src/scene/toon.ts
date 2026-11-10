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
  sky: '#6eb8f0',
  fog: '#d2e8f6',
  asphalt: '#4e5460',
  asphaltDark: '#383e48',
  concrete: '#d0d6e0',
  concreteDark: '#7a8494',
  /** Battle-grid pads — close grays; the border frames the 8×8, not contrast */
  sectorA: '#8a929a',
  sectorB: '#7a828a',
  sectorARim: '#7a828a',
  sectorBRim: '#6a727a',
  curb: '#2e343c',
  plaza: '#a8b0ba',
  building: '#b8c0cc',
  buildingDark: '#8a96a4',
  buildingAccent: '#c4a888',
  buildingAccentAlt: '#8aa0b0',
  windowDay: '#d8ecf8',
  lamp: '#d0d4d8',
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
