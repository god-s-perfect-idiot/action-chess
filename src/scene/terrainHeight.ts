import { CELL_SIZE, WORLD_TILE_MARGIN } from '../game/types'

/** Matches the cityscape bowl so this mesh is the only ground. */
export const GROUND_RADIUS =
  CELL_SIZE * 4 + CELL_SIZE * (WORLD_TILE_MARGIN + 10)

/** River plane. Feet stand on this where the valley dips below it. */
export const WATER_Y = -1.05

/** Bump when valley / ground profile changes so Board rebuilds its mesh. */
export const TERRAIN_REV = 11

const BOARD_HALF = CELL_SIZE * 4

function smooth(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Flat top, sloped shoulder. 1 in the middle → 0 at the ellipse edge. */
function plateau(
  x: number,
  z: number,
  cx: number,
  cz: number,
  rx: number,
  rz: number,
): number {
  const d = Math.hypot((x - cx) / rx, (z - cz) / rz)
  if (d >= 1) return 0
  if (d <= 0.38) return 1
  return 1 - smooth((d - 0.38) / 0.62)
}

/**
 * Mid-map river bed — runs the full ground length, not only the board.
 * Wide shallow floodplain + deeper thalweg; banks stay above water so the
 * water mesh can be clipped to the real shoreline.
 */
function valley(x: number): number {
  const bed = -2.15 * Math.exp(-((x / (CELL_SIZE * 1.15)) ** 2))
  const flood = -0.85 * Math.exp(-((x / (CELL_SIZE * 2.6)) ** 2))
  return bed + flood
}

/** Board hills / rolls — kept inside the plaza so outer woods stay flat. */
function hills(x: number, z: number): number {
  const east = 2.7 * plateau(x, z, CELL_SIZE * 2.35, CELL_SIZE * 2.15, CELL_SIZE * 2.7, CELL_SIZE * 2.45)
  const west = 2.15 * plateau(x, z, -CELL_SIZE * 2.55, CELL_SIZE * 0.35, CELL_SIZE * 2.5, CELL_SIZE * 3.3)
  const se = 1.85 * plateau(x, z, CELL_SIZE * 2.6, -CELL_SIZE * 2.35, CELL_SIZE * 2.15, CELL_SIZE * 2.05)
  const sw = -0.7 * plateau(x, z, -CELL_SIZE * 2.7, -CELL_SIZE * 2.55, CELL_SIZE * 2.0, CELL_SIZE * 1.85)
  const nw = 1.15 * plateau(x, z, -CELL_SIZE * 2.2, CELL_SIZE * 2.85, CELL_SIZE * 1.7, CELL_SIZE * 1.55)

  // ~one undulation per square, then shorter slopes, then small divots
  const roll =
    Math.sin(x * 0.8 + 1.3) * Math.cos(z * 0.72 + 0.4) * 0.42 +
    Math.sin(x * 1.55 + z * 1.25) * Math.cos(z * 1.4 - x * 0.45) * 0.22 +
    Math.sin(x * 3.05 + 0.6) * Math.sin(z * 2.75 + 1.1) * 0.1

  return east + west + se + sw + nw + roll
}

/** 1 on the board, 0 a little outside it so ruins stay on flat ground. */
function reliefMask(x: number, z: number): number {
  const d = Math.max(Math.abs(x), Math.abs(z)) / BOARD_HALF
  if (d <= 1.02) return 1
  if (d >= 1.55) return 0
  return 1 - smooth((d - 1.02) / 0.53)
}

/** Terrain surface. Can sit under the river. */
export function groundY(x: number, z: number): number {
  // Plaza keeps its hills; outer apron stays near y=0 (grassy) and only the
  // valley dips — so banks still frame the river off-board.
  return valley(x) + hills(x, z) * reliefMask(x, z)
}

/** Height a fighter stands on — river surface where the bed is submerged. */
export function walkY(x: number, z: number): number {
  // Water box is centered on WATER_Y; stand on its top face.
  return Math.max(groundY(x, z), WATER_Y + 0.08)
}
