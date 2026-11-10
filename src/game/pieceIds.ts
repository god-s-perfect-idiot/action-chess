import { HEROES } from './heroes'
import type { BoardPiece, PieceColor, PieceType, Square } from './types'

export interface TrackedPiece extends BoardPiece {
  /** Stable id — hero roster id when known, keeps identity across moves/promotions. */
  id: string
  /** Roster hero id; null only for unexpected spawns. */
  heroId: string | null
  /**
   * Pawn promotion flag. Chess role becomes q/r/b/n by user/engine choice;
   * visuals switch to that hero's awakened look (same for every evolution).
   */
  awakened: boolean
}

const START: Array<{ square: Square; type: PieceType; color: PieceColor }> = [
  { square: 'a1', type: 'r', color: 'w' },
  { square: 'b1', type: 'n', color: 'w' },
  { square: 'c1', type: 'b', color: 'w' },
  { square: 'd1', type: 'q', color: 'w' },
  { square: 'e1', type: 'k', color: 'w' },
  { square: 'f1', type: 'b', color: 'w' },
  { square: 'g1', type: 'n', color: 'w' },
  { square: 'h1', type: 'r', color: 'w' },
  { square: 'a2', type: 'p', color: 'w' },
  { square: 'b2', type: 'p', color: 'w' },
  { square: 'c2', type: 'p', color: 'w' },
  { square: 'd2', type: 'p', color: 'w' },
  { square: 'e2', type: 'p', color: 'w' },
  { square: 'f2', type: 'p', color: 'w' },
  { square: 'g2', type: 'p', color: 'w' },
  { square: 'h2', type: 'p', color: 'w' },
  { square: 'a8', type: 'r', color: 'b' },
  { square: 'b8', type: 'n', color: 'b' },
  { square: 'c8', type: 'b', color: 'b' },
  { square: 'd8', type: 'q', color: 'b' },
  { square: 'e8', type: 'k', color: 'b' },
  { square: 'f8', type: 'b', color: 'b' },
  { square: 'g8', type: 'n', color: 'b' },
  { square: 'h8', type: 'r', color: 'b' },
  { square: 'a7', type: 'p', color: 'b' },
  { square: 'b7', type: 'p', color: 'b' },
  { square: 'c7', type: 'p', color: 'b' },
  { square: 'd7', type: 'p', color: 'b' },
  { square: 'e7', type: 'p', color: 'b' },
  { square: 'f7', type: 'p', color: 'b' },
  { square: 'g7', type: 'p', color: 'b' },
  { square: 'h7', type: 'p', color: 'b' },
]

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

/**
 * Deal every hero of a piece class across both teams so you can play as anyone.
 * Chess roles stay fixed; only the character skins are shuffled.
 */
export function createTrackedPieces(): TrackedPiece[] {
  const pools = new Map<PieceType, string[]>()
  for (const hero of HEROES) {
    const list = pools.get(hero.piece) ?? []
    list.push(hero.id)
    pools.set(hero.piece, list)
  }
  for (const list of pools.values()) shuffleInPlace(list)

  const next = new Map<PieceType, number>()
  return START.map((piece, index) => {
    const pool = pools.get(piece.type) ?? []
    const i = next.get(piece.type) ?? 0
    next.set(piece.type, i + 1)
    const heroId = pool[i] ?? null
    return {
      ...piece,
      id: heroId ?? `${piece.color}-${piece.type}-${index}`,
      heroId,
      awakened: false,
    }
  })
}

function sameRole(prev: TrackedPiece, cell: BoardPiece): boolean {
  if (prev.color !== cell.color) return false
  if (prev.type === cell.type) return true
  // Promotions keep the pawn's identity.
  return prev.type === 'p' && ['q', 'r', 'b', 'n'].includes(cell.type)
}

/** Rook from/to squares for a king that just castled two files. */
function castlingRookMove(
  lastFrom: Square,
  lastTo: Square,
): { from: Square; to: Square } | null {
  const map: Record<string, { from: Square; to: Square }> = {
    'e1g1': { from: 'h1', to: 'f1' },
    'e1c1': { from: 'a1', to: 'd1' },
    'e8g8': { from: 'h8', to: 'f8' },
    'e8c8': { from: 'a8', to: 'd8' },
  }
  return map[`${lastFrom}${lastTo}`] ?? null
}

/**
 * Reconcile tracked piece IDs with the live board after a move.
 *
 * Identity must stay on the same physical fighter. A naive "any same type"
 * match breaks castling: the a-file rook gets assigned to f1 and the h-file
 * rook looks captured — which reads as fighters walking off-grid / spawning.
 */
export function reconcilePieces(
  previous: TrackedPiece[],
  nextBoard: BoardPiece[],
  lastFrom: Square | null,
  lastTo: Square | null,
): TrackedPiece[] {
  const remaining = [...previous]
  const result: TrackedPiece[] = []
  const matchedCells = new Set<Square>()

  const takeAt = (index: number, cell: BoardPiece): TrackedPiece => {
    const [matched] = remaining.splice(index, 1)
    matchedCells.add(cell.square)
    const prev = matched!
    const promoted =
      prev.type === 'p' && ['q', 'r', 'b', 'n'].includes(cell.type)
    return {
      ...prev,
      square: cell.square,
      type: cell.type,
      color: cell.color,
      // Keep heroId / id so promotions retain face, name, and gimmick.
      // Promotion always awakens; once awakened it stays that way.
      awakened: prev.awakened || promoted,
    }
  }

  const takeBy = (
    cell: BoardPiece,
    pred: (p: TrackedPiece) => boolean,
  ): boolean => {
    const index = remaining.findIndex(pred)
    if (index < 0) return false
    result.push(takeAt(index, cell))
    return true
  }

  // 1) Primary mover (and castling rook) — explicit from→to identity.
  if (lastFrom && lastTo) {
    const dest = nextBoard.find((c) => c.square === lastTo)
    if (dest) {
      takeBy(dest, (p) => p.square === lastFrom)
    }

    const rook = castlingRookMove(lastFrom, lastTo)
    if (rook) {
      const rookDest = nextBoard.find((c) => c.square === rook.to)
      if (rookDest) {
        takeBy(rookDest, (p) => p.square === rook.from && p.type === 'r')
      }
    }
  }

  // 2) Pieces that never left their square.
  for (const cell of nextBoard) {
    if (matchedCells.has(cell.square)) continue
    takeBy(
      cell,
      (p) => p.square === cell.square && sameRole(p, cell),
    )
  }

  // 3) Remaining movers (rare): only claim fighters whose old square is empty
  //    on the new board. Never grab a piece that is still sitting elsewhere.
  const occupied = new Set(nextBoard.map((c) => c.square))
  for (const cell of nextBoard) {
    if (matchedCells.has(cell.square)) continue
    takeBy(
      cell,
      (p) => sameRole(p, cell) && !occupied.has(p.square),
    )
  }

  // 4) Absolute last resort — spawn. Should almost never fire mid-game.
  for (const cell of nextBoard) {
    if (matchedCells.has(cell.square)) continue
    result.push({
      ...cell,
      id: `${cell.color}-${cell.type}-${cell.square}-spawn`,
      heroId: null,
      awakened: false,
    })
  }

  return result
}
