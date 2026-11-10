import { Chess, type Move, type Square as ChessSquare } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createTrackedPieces,
  reconcilePieces,
  type TrackedPiece,
} from './pieceIds'
import { now as animNow } from '../scene/fighters/clock'
import { stockfish, uciToMove } from './stockfish'
import type { BoardPiece, Difficulty, GameMode, PieceType, Square } from './types'

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'

export type PromotionPiece = Extract<PieceType, 'q' | 'r' | 'b' | 'n'>

export interface PendingPromotion {
  from: Square
  to: Square
}

function readPieces(chess: Chess): BoardPiece[] {
  const pieces: BoardPiece[] = []
  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const cell = board[rank][file]
      if (!cell) continue
      const square = `${'abcdefgh'[file]}${8 - rank}` as Square
      pieces.push({ square, type: cell.type, color: cell.color })
    }
  }
  return pieces
}

function deriveStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'draw'
  if (chess.inCheck()) return 'check'
  return 'playing'
}

function sleep(ms: number, signal: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    const start = performance.now()
    const tick = () => {
      if (signal.cancelled) {
        resolve()
        return
      }
      if (performance.now() - start >= ms) {
        resolve()
        return
      }
      window.setTimeout(tick, Math.min(50, ms))
    }
    window.setTimeout(tick, Math.min(50, ms))
  })
}

function isPromotionMove(
  chess: Chess,
  from: Square,
  to: Square,
): boolean {
  const moves = chess.moves({ square: from as ChessSquare, verbose: true })
  return moves.some((m) => m.to === to && Boolean(m.promotion))
}

export function useChessGame(
  initialDifficulty: Difficulty = 'normal',
  initialMode: GameMode = 'versus',
) {
  const chessRef = useRef(new Chess())
  const requestId = useRef(0)
  /** Absolute anim-clock time when staged moves/FX are done. Written by Pieces. */
  const boardFreeAtRef = useRef(0)
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
  const [mode, setMode] = useState<GameMode>(initialMode)
  const [fen, setFen] = useState(() => chessRef.current.fen())
  const [selected, setSelected] = useState<Square | null>(null)
  const [legalTargets, setLegalTargets] = useState<Square[]>([])
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null)
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  )
  const [thinking, setThinking] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [pieces, setPieces] = useState<TrackedPiece[]>(() =>
    createTrackedPieces(),
  )

  const sync = useCallback((move?: Move) => {
    const chess = chessRef.current
    const from = move ? (move.from as Square) : null
    const to = move ? (move.to as Square) : null
    setPieces((prev) => reconcilePieces(prev, readPieces(chess), from, to))
    setFen(chess.fen())
    setHistory(chess.history())
    if (move) {
      setLastMove({ from: move.from as Square, to: move.to as Square })
    }
    setSelected(null)
    setLegalTargets([])
    setPendingPromotion(null)
  }, [])

  const status = useMemo(() => deriveStatus(chessRef.current), [fen])
  const turn = useMemo(() => chessRef.current.turn(), [fen])

  const completePromotion = useCallback(
    (promotion: PromotionPiece) => {
      const pending = pendingPromotion
      if (!pending) return
      const chess = chessRef.current
      try {
        const move = chess.move({
          from: pending.from,
          to: pending.to,
          promotion,
        })
        sync(move)
      } catch {
        setPendingPromotion(null)
      }
    },
    [pendingPromotion, sync],
  )

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null)
  }, [])

  const selectSquare = useCallback(
    (square: Square) => {
      const chess = chessRef.current
      if (mode === 'autopilot') return
      if (thinking) return
      if (pendingPromotion) return
      if (status === 'checkmate' || status === 'stalemate' || status === 'draw')
        return
      if (chess.turn() !== 'w') return

      if (selected && legalTargets.includes(square)) {
        if (isPromotionMove(chess, selected, square)) {
          setPendingPromotion({ from: selected, to: square })
          return
        }
        try {
          const move = chess.move({
            from: selected,
            to: square,
          })
          sync(move)
          return
        } catch {
          // fall through to reselect
        }
      }

      // Second tap on the same fighter clears selection.
      if (selected === square) {
        setSelected(null)
        setLegalTargets([])
        return
      }

      const piece = chess.get(square as ChessSquare)
      if (!piece || piece.color !== 'w') {
        setSelected(null)
        setLegalTargets([])
        return
      }

      const moves = chess.moves({ square: square as ChessSquare, verbose: true })
      setSelected(square)
      setLegalTargets(moves.map((m) => m.to as Square))
    },
    [
      legalTargets,
      mode,
      pendingPromotion,
      selected,
      status,
      sync,
      thinking,
    ],
  )

  const reset = useCallback(
    (nextDifficulty?: Difficulty, nextMode?: GameMode) => {
      requestId.current += 1
      chessRef.current.reset()
      boardFreeAtRef.current = 0
      setThinking(false)
      setLastMove(null)
      setSelected(null)
      setLegalTargets([])
      setPendingPromotion(null)
      setHistory([])
      setPieces(createTrackedPieces())
      if (nextDifficulty) setDifficulty(nextDifficulty)
      if (nextMode) setMode(nextMode)
      setFen(chessRef.current.fen())
    },
    [],
  )

  useEffect(() => {
    void stockfish.init().catch((err) => {
      console.error('Failed to boot Stockfish', err)
    })
  }, [])

  useEffect(() => {
    const chess = chessRef.current
    if (chess.isGameOver()) return

    const engineToMove =
      mode === 'autopilot' || chess.turn() === 'b'
    if (!engineToMove) return

    const myRequest = ++requestId.current
    const fenAtStart = chess.fen()
    const signal = { cancelled: false }
    setThinking(true)

    const pauseMs = mode === 'autopilot' ? 700 : 280

    void (async () => {
      try {
        await sleep(pauseMs, signal)
        if (signal.cancelled || myRequest !== requestId.current) return

        // Let staged walk/attack/death finish before the next engine ply.
        while (
          !signal.cancelled &&
          myRequest === requestId.current &&
          animNow() < boardFreeAtRef.current
        ) {
          await sleep(40, signal)
        }
        if (signal.cancelled || myRequest !== requestId.current) return
        if (chess.fen() !== fenAtStart) return

        const uci = await stockfish.getBestMove(fenAtStart, difficulty)
        if (signal.cancelled || myRequest !== requestId.current) return
        // Stale search — position already changed (or was repaired).
        if (chess.fen() !== fenAtStart) return

        const { from, to, promotion } = uciToMove(uci)
        const move = chess.move({
          from: from as ChessSquare,
          to: to as ChessSquare,
          promotion: (promotion as PromotionPiece | undefined) ?? 'q',
        })
        sync(move)
      } catch (err) {
        if (myRequest === requestId.current && !signal.cancelled) {
          console.error(err)
        }
      } finally {
        if (myRequest === requestId.current) {
          setThinking(false)
        }
      }
    })()

    return () => {
      signal.cancelled = true
      requestId.current += 1
    }
  }, [fen, difficulty, mode, sync])

  return {
    fen,
    turn,
    selected,
    legalTargets,
    pendingPromotion,
    lastMove,
    status,
    difficulty,
    mode,
    thinking,
    playerColor: 'w' as const,
    history,
    pieces,
    boardFreeAtRef,
    selectSquare,
    completePromotion,
    cancelPromotion,
    setDifficulty,
    setMode,
    reset,
  }
}
