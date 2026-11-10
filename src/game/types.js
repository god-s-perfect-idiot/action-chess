export const GAME_MODE_CONFIG = {
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
};
/** World size of one battle sector (chess square). */
export const CELL_SIZE = 7.8;
/**
 * Fighters are authored at ~1.1 local units tall; ~0.365 of a cell keeps people
 * the same absolute size while pads get roomier. City dressing should scale off
 * PERSON_HEIGHT / FLOOR_HEIGHT so ruins and foliage match the cast.
 */
export const UNIT_SCALE = CELL_SIZE * 0.365;
/** Approx athletic fighter standing height in world units. */
export const PERSON_HEIGHT = UNIT_SCALE * 1.15;
/** Typical building floor-to-floor height (~3m for a ~1.8m person). */
export const FLOOR_HEIGHT = PERSON_HEIGHT * 1.7;
/** How many cells of overgrown apron extend past each board edge. */
export const WORLD_TILE_MARGIN = 6;
export const DIFFICULTY_CONFIG = {
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
};
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
/** Standard chess piece names (roles on the board). */
export const PIECE_CODENAME = {
    p: 'Pawn',
    n: 'Knight',
    b: 'Bishop',
    r: 'Rook',
    q: 'Queen',
    k: 'King',
};
export const SIDES = {
    w: { name: 'You', short: 'YOU', tag: 'P1', autoName: 'Dawn', autoTag: 'AI' },
    b: { name: 'Rival', short: 'CPU', tag: 'CPU', autoName: 'Eclipse', autoTag: 'AI' },
};
export function squareToCoords(square) {
    const file = FILES.indexOf(square[0]);
    const rank = RANKS.indexOf(square[1]);
    return [(file - 3.5) * CELL_SIZE, (rank - 3.5) * CELL_SIZE];
}
export function coordsToSquare(x, z) {
    const file = Math.round(x / CELL_SIZE + 3.5);
    const rank = Math.round(z / CELL_SIZE + 3.5);
    if (file < 0 || file > 7 || rank < 0 || rank > 7)
        return null;
    return `${FILES[file]}${RANKS[rank]}`;
}
export function sectorLabel(square) {
    return `BLOCK ${square.toUpperCase()}`;
}
