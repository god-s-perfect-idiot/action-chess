import type { HeroDef } from './heroes'
import type { PieceType } from './types'

/** Chess army slots the player fills for Dawn before battle. */
export const DECK_QUOTA: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
}

export const DECK_SIZE = Object.values(DECK_QUOTA).reduce((a, b) => a + b, 0)

export const DECK_ORDER: PieceType[] = ['k', 'q', 'r', 'n', 'b', 'p']

export function countByPiece(ids: readonly string[], heroes: HeroDef[]): Record<PieceType, number> {
  const byId = new Map(heroes.map((h) => [h.id, h]))
  const counts: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  for (const id of ids) {
    const piece = byId.get(id)?.piece
    if (piece) counts[piece] += 1
  }
  return counts
}

export function deckComplete(ids: readonly string[], heroes: HeroDef[]): boolean {
  if (ids.length !== DECK_SIZE) return false
  const counts = countByPiece(ids, heroes)
  return DECK_ORDER.every((p) => counts[p] === DECK_QUOTA[p])
}

export function sortDeckIds(ids: readonly string[], heroes: HeroDef[]): string[] {
  const byId = new Map(heroes.map((h) => [h.id, h]))
  const rank = new Map(DECK_ORDER.map((p, i) => [p, i]))
  return [...ids].sort((a, b) => {
    const ha = byId.get(a)
    const hb = byId.get(b)
    const ra = ha ? (rank.get(ha.piece) ?? 99) : 99
    const rb = hb ? (rank.get(hb.piece) ?? 99) : 99
    if (ra !== rb) return ra - rb
    return (ha?.codename ?? a).localeCompare(hb?.codename ?? b)
  })
}
