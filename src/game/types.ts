export type Difficulty = 'easy' | 'normal' | 'hard' | 'impossible'

export type GameMode = 'versus' | 'autopilot'

export const GAME_MODE_CONFIG: Record<
  GameMode,
  { label: string; blurb: string; tag: string; cta: string; kanji: string }
> = {
  versus: {
    label: 'Versus',
    blurb: 'You vs Stockfish',
    tag: '1P',
    cta: "LET'S GO!",
    kanji: '勝負',
  },
  autopilot: {
    label: 'Autopilot',
    blurb: 'AI vs AI — sit back and watch',
    tag: 'AI',
    cta: 'WATCH!',
    kanji: '観戦',
  },
}

export type Square =
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type PieceColor = 'w' | 'b'

export interface BoardPiece {
  square: Square
  type: PieceType
  color: PieceColor
}

export interface DifficultyConfig {
  label: string
  blurb: string
  threat: string
  rank: string
  skillLevel: number
  depth: number
  moveTimeMs: number
  uciElo?: number
}

/** World size of one battle sector (chess square). */
export const CELL_SIZE = 11.3

/**
 * Fighters are authored at ~1.1 local units tall; ~0.252 of a cell keeps people
 * the same absolute size while pads get roomier. City dressing should scale off
 * PERSON_HEIGHT / FLOOR_HEIGHT so ruins and foliage match the cast.
 */
export const UNIT_SCALE = CELL_SIZE * 0.252
/** Approx athletic fighter standing height in world units. */
export const PERSON_HEIGHT = UNIT_SCALE * 1.15
/** Typical building floor-to-floor height (~3m for a ~1.8m person). */
export const FLOOR_HEIGHT = PERSON_HEIGHT * 1.7
/** How many cells of overgrown apron extend past each board edge. */
export const WORLD_TILE_MARGIN = 6

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Warm-Up',
    blurb: 'Easy rival — find your rhythm',
    threat: 'D-RANK',
    rank: 'D',
    skillLevel: 2,
    depth: 4,
    moveTimeMs: 200,
    uciElo: 1100,
  },
  normal: {
    label: 'Rival Match',
    blurb: 'Even duel, fair fight',
    threat: 'C-RANK',
    rank: 'C',
    skillLevel: 8,
    depth: 8,
    moveTimeMs: 500,
    uciElo: 1600,
  },
  hard: {
    label: 'Hard Mode',
    blurb: 'Elite pressure, no holding back',
    threat: 'B-RANK',
    rank: 'B',
    skillLevel: 15,
    depth: 12,
    moveTimeMs: 900,
    uciElo: 2200,
  },
  impossible: {
    label: 'Final Boss',
    blurb: 'Go all out or get wiped',
    threat: 'S-RANK',
    rank: 'S',
    skillLevel: 20,
    depth: 18,
    moveTimeMs: 1800,
  },
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

/** Standard chess piece names (roles on the board). */
export const PIECE_CODENAME: Record<PieceType, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
}

export const SIDES = {
  w: { name: 'You', short: 'YOU', tag: 'P1', autoName: 'Dawn', autoTag: 'AI' },
  b: { name: 'Rival', short: 'CPU', tag: 'CPU', autoName: 'Eclipse', autoTag: 'AI' },
} as const

export function squareToCoords(square: Square): [number, number] {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number])
  const rank = RANKS.indexOf(square[1] as (typeof RANKS)[number])
  return [(file - 3.5) * CELL_SIZE, (rank - 3.5) * CELL_SIZE]
}

export function coordsToSquare(x: number, z: number): Square | null {
  const file = Math.round(x / CELL_SIZE + 3.5)
  const rank = Math.round(z / CELL_SIZE + 3.5)
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
  return `${FILES[file]}${RANKS[rank]}` as Square
}

export function sectorLabel(square: Square): string {
  return `BLOCK ${square.toUpperCase()}`
}
