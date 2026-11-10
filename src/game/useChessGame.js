import { Chess } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTrackedPieces, reconcilePieces, } from './pieceIds';
import { now as animNow } from '../scene/fighters/clock';
import { stockfish, uciToMove } from './stockfish';
function readPieces(chess) {
    const pieces = [];
    const board = chess.board();
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const cell = board[rank][file];
            if (!cell)
                continue;
            const square = `${'abcdefgh'[file]}${8 - rank}`;
            pieces.push({ square, type: cell.type, color: cell.color });
        }
    }
    return pieces;
}
function deriveStatus(chess) {
    if (chess.isCheckmate())
        return 'checkmate';
    if (chess.isStalemate())
        return 'stalemate';
    if (chess.isDraw())
        return 'draw';
    if (chess.inCheck())
        return 'check';
    return 'playing';
}
function sleep(ms, signal) {
    return new Promise((resolve) => {
        const start = performance.now();
        const tick = () => {
            if (signal.cancelled) {
                resolve();
                return;
            }
            if (performance.now() - start >= ms) {
                resolve();
                return;
            }
            window.setTimeout(tick, Math.min(50, ms));
        };
        window.setTimeout(tick, Math.min(50, ms));
    });
}
function isPromotionMove(chess, from, to) {
    const moves = chess.moves({ square: from, verbose: true });
    return moves.some((m) => m.to === to && Boolean(m.promotion));
}
export function useChessGame(initialDifficulty = 'normal', initialMode = 'versus') {
    const chessRef = useRef(new Chess());
    const requestId = useRef(0);
    /** Absolute anim-clock time when staged moves/FX are done. Written by Pieces. */
    const boardFreeAtRef = useRef(0);
    const [difficulty, setDifficulty] = useState(initialDifficulty);
    const [mode, setMode] = useState(initialMode);
    const [fen, setFen] = useState(() => chessRef.current.fen());
    const [selected, setSelected] = useState(null);
    const [legalTargets, setLegalTargets] = useState([]);
    const [pendingPromotion, setPendingPromotion] = useState(null);
    const [lastMove, setLastMove] = useState(null);
    const [thinking, setThinking] = useState(false);
    const [history, setHistory] = useState([]);
    const [pieces, setPieces] = useState(() => createTrackedPieces());
    const sync = useCallback((move) => {
        const chess = chessRef.current;
        const from = move ? move.from : null;
        const to = move ? move.to : null;
        setPieces((prev) => reconcilePieces(prev, readPieces(chess), from, to));
        setFen(chess.fen());
        setHistory(chess.history());
        if (move) {
            setLastMove({ from: move.from, to: move.to });
        }
        setSelected(null);
        setLegalTargets([]);
        setPendingPromotion(null);
    }, []);
    const status = useMemo(() => deriveStatus(chessRef.current), [fen]);
    const turn = useMemo(() => chessRef.current.turn(), [fen]);
    const completePromotion = useCallback((promotion) => {
        const pending = pendingPromotion;
        if (!pending)
            return;
        const chess = chessRef.current;
        try {
            const move = chess.move({
                from: pending.from,
                to: pending.to,
                promotion,
            });
            sync(move);
        }
        catch {
            setPendingPromotion(null);
        }
    }, [pendingPromotion, sync]);
    const cancelPromotion = useCallback(() => {
        setPendingPromotion(null);
    }, []);
    const selectSquare = useCallback((square) => {
        const chess = chessRef.current;
        if (mode === 'autopilot')
            return;
        if (thinking)
            return;
        if (pendingPromotion)
            return;
        if (status === 'checkmate' || status === 'stalemate' || status === 'draw')
            return;
        if (chess.turn() !== 'w')
            return;
        if (selected && legalTargets.includes(square)) {
            if (isPromotionMove(chess, selected, square)) {
                setPendingPromotion({ from: selected, to: square });
                return;
            }
            try {
                const move = chess.move({
                    from: selected,
                    to: square,
                });
                sync(move);
                return;
            }
            catch {
                // fall through to reselect
            }
        }
        // Second tap on the same fighter clears selection.
        if (selected === square) {
            setSelected(null);
            setLegalTargets([]);
            return;
        }
        const piece = chess.get(square);
        if (!piece || piece.color !== 'w') {
            setSelected(null);
            setLegalTargets([]);
            return;
        }
        const moves = chess.moves({ square: square, verbose: true });
        setSelected(square);
        setLegalTargets(moves.map((m) => m.to));
    }, [
        legalTargets,
        mode,
        pendingPromotion,
        selected,
        status,
        sync,
        thinking,
    ]);
    const reset = useCallback((nextDifficulty, nextMode) => {
        requestId.current += 1;
        chessRef.current.reset();
        boardFreeAtRef.current = 0;
        setThinking(false);
        setLastMove(null);
        setSelected(null);
        setLegalTargets([]);
        setPendingPromotion(null);
        setHistory([]);
        setPieces(createTrackedPieces());
        if (nextDifficulty)
            setDifficulty(nextDifficulty);
        if (nextMode)
            setMode(nextMode);
        setFen(chessRef.current.fen());
    }, []);
    useEffect(() => {
        void stockfish.init().catch((err) => {
            console.error('Failed to boot Stockfish', err);
        });
    }, []);
    useEffect(() => {
        const chess = chessRef.current;
        if (chess.isGameOver())
            return;
        const engineToMove = mode === 'autopilot' || chess.turn() === 'b';
        if (!engineToMove)
            return;
        const myRequest = ++requestId.current;
        const fenAtStart = chess.fen();
        const signal = { cancelled: false };
        setThinking(true);
        const pauseMs = mode === 'autopilot' ? 700 : 280;
        void (async () => {
            try {
                await sleep(pauseMs, signal);
                if (signal.cancelled || myRequest !== requestId.current)
                    return;
                // Let staged walk/attack/death finish before the next engine ply.
                while (!signal.cancelled &&
                    myRequest === requestId.current &&
                    animNow() < boardFreeAtRef.current) {
                    await sleep(40, signal);
                }
                if (signal.cancelled || myRequest !== requestId.current)
                    return;
                if (chess.fen() !== fenAtStart)
                    return;
                const uci = await stockfish.getBestMove(fenAtStart, difficulty);
                if (signal.cancelled || myRequest !== requestId.current)
                    return;
                // Stale search — position already changed (or was repaired).
                if (chess.fen() !== fenAtStart)
                    return;
                const { from, to, promotion } = uciToMove(uci);
                const move = chess.move({
                    from: from,
                    to: to,
                    promotion: promotion ?? 'q',
                });
                sync(move);
            }
            catch (err) {
                if (myRequest === requestId.current && !signal.cancelled) {
                    console.error(err);
                }
            }
            finally {
                if (myRequest === requestId.current) {
                    setThinking(false);
                }
            }
        })();
        return () => {
            signal.cancelled = true;
            requestId.current += 1;
        };
    }, [fen, difficulty, mode, sync]);
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
        playerColor: 'w',
        history,
        pieces,
        boardFreeAtRef,
        selectSquare,
        completePromotion,
        cancelPromotion,
        setDifficulty,
        setMode,
        reset,
    };
}
