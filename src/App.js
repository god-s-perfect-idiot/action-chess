import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { getHeroById } from './game/heroes';
import { DIFFICULTY_CONFIG, GAME_MODE_CONFIG, PIECE_CODENAME, SIDES, sectorLabel, } from './game/types';
import { useChessGame, } from './game/useChessGame';
import { ChessScene } from './scene/ChessScene';
import { CharactersPage } from './ui/CharactersPage';
import './App.css';
const PROMOTION_OPTIONS = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
];
function StatPips({ label, value }) {
    return (_jsxs("div", { className: "stat-row", title: `${label} ${value}/5`, children: [_jsx("span", { className: "stat-label", children: label }), _jsx("span", { className: "stat-pips", "aria-label": `${label} ${value} of 5`, children: Array.from({ length: 5 }, (_, i) => (_jsx("span", { className: `stat-pip ${i < value ? 'on' : ''}` }, i))) })] }));
}
function battleBanner(status, turn, thinking, mode) {
    const auto = mode === 'autopilot';
    if (status === 'checkmate') {
        if (auto) {
            return turn === 'w'
                ? { title: 'K.O.', sub: 'Dawn side down', tone: 'defeat' }
                : { title: 'K.O.', sub: 'Eclipse side down', tone: 'victory' };
        }
        return turn === 'w'
            ? { title: 'K.O.', sub: 'You are out', tone: 'defeat' }
            : { title: 'VICTORY!', sub: 'Rival down', tone: 'victory' };
    }
    if (status === 'stalemate') {
        return { title: 'DRAW', sub: 'No moves left', tone: '' };
    }
    if (status === 'draw') {
        return { title: 'DRAW', sub: 'Board settles', tone: '' };
    }
    if (thinking) {
        if (auto) {
            return {
                title: turn === 'w' ? 'DAWN TURN' : 'ECLIPSE TURN',
                sub: 'Autopilot thinking…',
                tone: 'pulse',
            };
        }
        return {
            title: 'RIVAL TURN',
            sub: 'Thinking…',
            tone: 'pulse',
        };
    }
    if (status === 'check') {
        if (auto) {
            return turn === 'w'
                ? { title: 'BREAK!', sub: 'Dawn King locked', tone: 'threat' }
                : { title: 'BREAK!', sub: 'Eclipse King locked', tone: 'threat' };
        }
        return turn === 'w'
            ? { title: 'DANGER!', sub: 'Your King is locked', tone: 'threat' }
            : { title: 'BREAK!', sub: 'Rival King exposed', tone: 'threat' };
    }
    if (auto) {
        return { title: 'AUTOPILOT', sub: 'AI vs AI — sit tight', tone: 'pulse' };
    }
    return turn === 'w'
        ? { title: 'YOUR TURN', sub: 'Pick a fighter, then a square', tone: 'ally' }
        : { title: 'STANDBY', sub: 'Hold position', tone: 'pulse' };
}
function forceCount(pieces, color) {
    return pieces.filter((p) => p.color === color).length;
}
export default function App() {
    const [screen, setScreen] = useState('menu');
    const [menuDifficulty, setMenuDifficulty] = useState('normal');
    const [menuMode, setMenuMode] = useState('versus');
    const game = useChessGame('normal', 'versus');
    const checkedKing = useMemo(() => {
        if (game.status !== 'check' && game.status !== 'checkmate')
            return null;
        const king = game.pieces.find((p) => p.type === 'k' && p.color === game.turn);
        return (king?.square ?? null);
    }, [game.pieces, game.status, game.turn]);
    const selectedUnit = useMemo(() => {
        if (!game.selected)
            return null;
        return game.pieces.find((p) => p.square === game.selected) ?? null;
    }, [game.pieces, game.selected]);
    const pendingHero = useMemo(() => {
        if (!game.pendingPromotion)
            return null;
        const unit = game.pieces.find((p) => p.square === game.pendingPromotion.from);
        return unit ? { unit, hero: getHeroById(unit.heroId) } : null;
    }, [game.pendingPromotion, game.pieces]);
    const selectedHero = useMemo(() => getHeroById(selectedUnit?.heroId), [selectedUnit]);
    const difficulties = Object.keys(DIFFICULTY_CONFIG);
    const modes = Object.keys(GAME_MODE_CONFIG);
    const auto = game.mode === 'autopilot';
    const banner = battleBanner(game.status, game.turn, game.thinking, game.mode);
    const selectedCfg = DIFFICULTY_CONFIG[menuDifficulty];
    const selectedMode = GAME_MODE_CONFIG[menuMode];
    const allyForce = forceCount(game.pieces, 'w');
    const foeForce = forceCount(game.pieces, 'b');
    const allyPct = Math.round((allyForce / 16) * 100);
    const foePct = Math.round((foeForce / 16) * 100);
    const startBattle = () => {
        game.reset(menuDifficulty, menuMode);
        setScreen('battle');
    };
    const quitToMenu = () => {
        game.reset(menuDifficulty, menuMode);
        setScreen('menu');
    };
    return (_jsxs("div", { className: `app ${screen === 'battle' ? 'in-battle' : 'in-menu'}`, children: [screen === 'battle' && (_jsx("div", { className: "stage", children: _jsx(ChessScene, { pieces: game.pieces, selected: game.selected, legalTargets: game.legalTargets, lastMove: game.lastMove, checkedKing: checkedKing, defeatedKing: game.status === 'checkmate' ? checkedKing : null, onSquareClick: game.selectSquare, boardFreeAtRef: game.boardFreeAtRef }) })), screen === 'battle' && (_jsxs("div", { className: "anime-frame", "aria-hidden": "true", children: [_jsx("span", { className: "corner c-tl" }), _jsx("span", { className: "corner c-tr" }), _jsx("span", { className: "corner c-bl" }), _jsx("span", { className: "corner c-br" }), _jsx("span", { className: "slash slash-a" }), _jsx("span", { className: "slash slash-b" })] })), screen === 'characters' ? (_jsx(CharactersPage, { onBack: () => setScreen('menu') })) : screen === 'menu' ? (_jsxs("div", { className: "main-menu", children: [_jsxs("div", { className: "menu-bg", "aria-hidden": "true", children: [_jsx("span", { className: "blob blob-a" }), _jsx("span", { className: "blob blob-b" }), _jsx("span", { className: "blob blob-c" }), _jsx("span", { className: "halftone" }), _jsx("span", { className: "speed-lines" }), _jsx("span", { className: "spark s1" }), _jsx("span", { className: "spark s2" }), _jsx("span", { className: "spark s3" })] }), _jsxs("div", { className: "menu-shell", children: [_jsxs("header", { className: "menu-brand", children: [_jsxs("p", { className: "eyebrow", children: [_jsx("span", { className: "kanji", children: "\u6FC0\u95D8" }), " ANIME FIGHTER"] }), _jsxs("h1", { className: "brand-mark", children: ["URBAN", _jsx("span", { className: "brand-mark-accent", children: "IA" })] }), _jsx("p", { className: "brand-sub", children: "Pick a mode \u00B7 Set the rank" })] }), _jsxs("section", { className: "mode-panel", children: [_jsxs("div", { className: "panel-head", children: [_jsx("span", { children: "Mode" }), _jsx("span", { className: `mode-pill mode-${menuMode}`, children: selectedMode.tag })] }), _jsx("div", { className: "mode-grid", children: modes.map((key) => {
                                            const cfg = GAME_MODE_CONFIG[key];
                                            const active = menuMode === key;
                                            return (_jsxs("button", { type: "button", className: `mode-card ${active ? 'active' : ''} mode-${key}`, onClick: () => setMenuMode(key), children: [_jsx("span", { className: "mode-name", children: cfg.label }), _jsx("span", { className: "mode-blurb", children: cfg.blurb })] }, key));
                                        }) })] }), _jsxs("section", { className: "rank-panel", children: [_jsxs("div", { className: "panel-head", children: [_jsx("span", { children: "Difficulty" }), _jsx("span", { className: `rank-pill rank-${menuDifficulty}`, children: selectedCfg.threat })] }), _jsx("div", { className: "rank-grid", children: difficulties.map((key) => {
                                            const cfg = DIFFICULTY_CONFIG[key];
                                            const active = menuDifficulty === key;
                                            return (_jsxs("button", { type: "button", className: `rank-card ${active ? 'active' : ''}`, onClick: () => setMenuDifficulty(key), children: [_jsx("span", { className: "rank-letter", children: cfg.rank }), _jsxs("span", { className: "rank-body", children: [_jsx("span", { className: "rank-name", children: cfg.label }), _jsx("span", { className: "rank-blurb", children: cfg.blurb })] })] }, key));
                                        }) })] }), _jsxs("button", { type: "button", className: "menu-secondary-btn", onClick: () => setScreen('characters'), children: [_jsx("span", { className: "enter-kanji", children: "\u4EBA\u7269" }), _jsx("span", { className: "enter-label", children: "Characters" })] }), _jsxs("button", { type: "button", className: `enter-btn ${menuMode === 'autopilot' ? 'enter-auto' : ''}`, onClick: startBattle, children: [_jsx("span", { className: "enter-kanji", children: selectedMode.kanji }), _jsx("span", { className: "enter-label", children: selectedMode.cta })] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("header", { className: "battle-top", children: [_jsxs("div", { className: "fighter-bar ally", children: [_jsx("div", { className: "fighter-portrait dawn-port", children: _jsx("span", { children: auto ? SIDES.w.autoTag : SIDES.w.tag }) }), _jsxs("div", { className: "fighter-meta", children: [_jsxs("div", { className: "fighter-name-row", children: [_jsx("strong", { children: auto ? SIDES.w.autoName : SIDES.w.name }), _jsx("span", { children: auto ? 'CPU' : 'P1' })] }), _jsx("div", { className: "hp-track", children: _jsx("div", { className: "hp-fill ally-fill", style: { width: `${allyPct}%` } }) }), _jsxs("div", { className: "fighter-sub", children: [allyForce, "/16 \u00B7 ", DIFFICULTY_CONFIG[game.difficulty].label] })] })] }), _jsxs("div", { className: `turn-slash ${banner.tone}`, children: [_jsx("span", { className: "turn-title", children: banner.title }), _jsx("span", { className: "turn-sub", children: banner.sub })] }), _jsxs("div", { className: "fighter-bar foe", children: [_jsxs("div", { className: "fighter-meta", children: [_jsxs("div", { className: "fighter-name-row", children: [_jsx("strong", { children: auto ? SIDES.b.autoName : SIDES.b.name }), _jsx("span", { children: "CPU" })] }), _jsx("div", { className: "hp-track", children: _jsx("div", { className: "hp-fill foe-fill", style: { width: `${foePct}%` } }) }), _jsxs("div", { className: "fighter-sub", children: [foeForce, "/16 \u00B7 ", auto ? 'Autopilot' : 'AI'] })] }), _jsx("div", { className: "fighter-portrait eclipse-port", children: _jsx("span", { children: auto ? SIDES.b.autoTag : SIDES.b.tag }) })] })] }), _jsx("aside", { className: "battle-side", children: _jsxs("div", { className: "lock-panel", children: [_jsxs("div", { className: "panel-head", children: [_jsx("span", { children: "Selected" }), _jsx("span", { className: "mono", children: game.selected ? sectorLabel(game.selected) : '——' })] }), selectedUnit ? (_jsxs("div", { className: "lock-body", children: [_jsxs("div", { className: "hero-title-row", children: [_jsx("p", { className: "hero-codename", children: selectedHero?.codename ?? PIECE_CODENAME[selectedUnit.type] }), _jsx("span", { className: `hero-class-chip ${selectedUnit.awakened ? 'awakened' : ''}`, children: selectedUnit.awakened
                                                        ? `Awakened · ${PIECE_CODENAME[selectedUnit.type]}`
                                                        : PIECE_CODENAME[selectedUnit.type] })] }), selectedHero ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "hero-true-name", children: selectedHero.trueName }), _jsx("p", { className: "hero-gimmick", children: selectedHero.gimmick }), _jsx("p", { className: "hero-detail", children: selectedHero.blurb }), _jsxs("div", { className: "hero-stats", children: [_jsx(StatPips, { label: "PWR", value: selectedHero.stats.pwr }), _jsx(StatPips, { label: "SPD", value: selectedHero.stats.spd }), _jsx(StatPips, { label: "STY", value: selectedHero.stats.sty })] })] })) : (_jsx("p", { className: "hero-detail", children: selectedUnit.color === 'w' ? 'Dawn fighter' : 'Eclipse fighter' })), _jsxs("p", { className: "hero-moves", children: [selectedUnit.color === 'w' ? 'Dawn' : 'Eclipse', " \u00B7", ' ', game.legalTargets.length, " moves"] })] })) : (_jsx("p", { className: "lock-empty", children: auto
                                        ? 'Autopilot running — hands off the board.'
                                        : 'Tap one of your fighters to begin.' }))] }) }), _jsxs("footer", { className: "battle-bottom", children: [_jsxs("div", { className: "combo-log", children: [_jsx("span", { className: "log-label", children: "Move Log" }), _jsx("div", { className: "log-chips", children: game.history.length === 0 ? (_jsx("span", { className: "log-empty", children: auto ? 'Engines warming up…' : 'Waiting for first move' })) : (game.history.slice(-5).map((move, i) => (_jsx("span", { className: "log-chip", children: move }, `${move}-${i}`)))) })] }), _jsx("button", { type: "button", className: "retreat-btn", onClick: quitToMenu, children: "Menu" })] }), game.pendingPromotion && (_jsx("div", { className: "awaken-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "awaken-panel", children: [_jsxs("p", { className: "eyebrow", children: [_jsx("span", { className: "kanji", children: "\u899A\u9192" }), " AWAKEN"] }), _jsxs("h2", { className: "awaken-title", children: [pendingHero?.hero?.codename ?? 'Pawn', " Awakens"] }), _jsx("p", { className: "awaken-sub", children: "Pick the evolution role \u2014 the look stays awakened either way." }), _jsx("div", { className: "awaken-choices", children: PROMOTION_OPTIONS.map((opt) => (_jsxs("button", { type: "button", className: "awaken-choice", onClick: () => game.completePromotion(opt.type), children: [_jsx("span", { className: "awaken-choice-role", children: opt.label }), _jsxs("span", { className: "awaken-choice-hint", children: ["Moves as ", opt.label.toLowerCase()] })] }, opt.type))) }), _jsx("button", { type: "button", className: "awaken-cancel", onClick: game.cancelPromotion, children: "Cancel" })] }) }))] }))] }));
}
