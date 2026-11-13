import { useMemo, useState } from 'react'
import { getHeroById } from './game/heroes'
import {
  DIFFICULTY_CONFIG,
  GAME_MODE_CONFIG,
  PIECE_CODENAME,
  SIDES,
  sectorLabel,
  type Difficulty,
  type GameMode,
  type Square,
} from './game/types'
import {
  useChessGame,
  type PromotionPiece,
} from './game/useChessGame'
import { ChessScene } from './scene/ChessScene'
import { CharactersPage } from './ui/CharactersPage'
import { PickFightersPage } from './ui/PickFightersPage'
import './App.css'

const PROMOTION_OPTIONS: { type: PromotionPiece; label: string }[] = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
]

function StatPips({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-row" title={`${label} ${value}/5`}>
      <span className="stat-label">{label}</span>
      <span className="stat-pips" aria-label={`${label} ${value} of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`stat-pip ${i < value ? 'on' : ''}`}
          />
        ))}
      </span>
    </div>
  )
}

type Screen = 'menu' | 'characters' | 'pick' | 'battle'
type MenuStep = 'root' | 'normal'

function battleBanner(
  status: string,
  turn: 'w' | 'b',
  thinking: boolean,
  mode: GameMode,
): { title: string; sub: string; tone: string } {
  const auto = mode === 'autopilot'

  if (status === 'checkmate') {
    if (auto) {
      return turn === 'w'
        ? { title: 'K.O.', sub: 'Dawn side down', tone: 'defeat' }
        : { title: 'K.O.', sub: 'Eclipse side down', tone: 'victory' }
    }
    return turn === 'w'
      ? { title: 'K.O.', sub: 'You are out', tone: 'defeat' }
      : { title: 'VICTORY!', sub: 'Rival down', tone: 'victory' }
  }
  if (status === 'stalemate') {
    return { title: 'DRAW', sub: 'No moves left', tone: '' }
  }
  if (status === 'draw') {
    return { title: 'DRAW', sub: 'Board settles', tone: '' }
  }
  if (thinking) {
    if (auto) {
      return {
        title: turn === 'w' ? 'DAWN TURN' : 'ECLIPSE TURN',
        sub: 'Autopilot thinking…',
        tone: 'pulse',
      }
    }
    return {
      title: 'RIVAL TURN',
      sub: 'Thinking…',
      tone: 'pulse',
    }
  }
  if (status === 'check') {
    if (auto) {
      return turn === 'w'
        ? { title: 'BREAK!', sub: 'Dawn King locked', tone: 'threat' }
        : { title: 'BREAK!', sub: 'Eclipse King locked', tone: 'threat' }
    }
    return turn === 'w'
      ? { title: 'DANGER!', sub: 'Your King is locked', tone: 'threat' }
      : { title: 'BREAK!', sub: 'Rival King exposed', tone: 'threat' }
  }
  if (auto) {
    return { title: 'AUTOPILOT', sub: 'AI vs AI — sit tight', tone: 'pulse' }
  }
  return turn === 'w'
    ? { title: 'YOUR TURN', sub: 'Pick a fighter, then a square', tone: 'ally' }
    : { title: 'STANDBY', sub: 'Hold position', tone: 'pulse' }
}

function forceCount(
  pieces: { color: 'w' | 'b' }[],
  color: 'w' | 'b',
): number {
  return pieces.filter((p) => p.color === color).length
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [menuStep, setMenuStep] = useState<MenuStep>('root')
  const [menuDifficulty, setMenuDifficulty] = useState<Difficulty>('normal')
  const [menuMode, setMenuMode] = useState<GameMode>('versus')
  const game = useChessGame('normal', 'versus')

  const checkedKing = useMemo(() => {
    if (game.status !== 'check' && game.status !== 'checkmate') return null
    const king = game.pieces.find(
      (p) => p.type === 'k' && p.color === game.turn,
    )
    return (king?.square ?? null) as Square | null
  }, [game.pieces, game.status, game.turn])

  const primaryChecker = useMemo(() => {
    if (!game.checkers.length) return null
    if (game.lastMove && game.checkers.includes(game.lastMove.to)) {
      return game.lastMove.to
    }
    return game.checkers[0] ?? null
  }, [game.checkers, game.lastMove])

  const selectedUnit = useMemo(() => {
    if (!game.selected) return null
    return game.pieces.find((p) => p.square === game.selected) ?? null
  }, [game.pieces, game.selected])

  const pendingHero = useMemo(() => {
    if (!game.pendingPromotion) return null
    const unit = game.pieces.find(
      (p) => p.square === game.pendingPromotion!.from,
    )
    return unit ? { unit, hero: getHeroById(unit.heroId) } : null
  }, [game.pendingPromotion, game.pieces])

  const selectedHero = useMemo(
    () => getHeroById(selectedUnit?.heroId),
    [selectedUnit],
  )

  const difficulties = Object.keys(DIFFICULTY_CONFIG) as Difficulty[]
  const modes = Object.keys(GAME_MODE_CONFIG) as GameMode[]
  const auto = game.mode === 'autopilot'
  const banner = battleBanner(game.status, game.turn, game.thinking, game.mode)
  const selectedCfg = DIFFICULTY_CONFIG[menuDifficulty]
  const selectedMode = GAME_MODE_CONFIG[menuMode]
  const allyForce = forceCount(game.pieces, 'w')
  const foeForce = forceCount(game.pieces, 'b')
  const allyPct = Math.round((allyForce / 16) * 100)
  const foePct = Math.round((foeForce / 16) * 100)

  const openPickFighters = () => {
    setScreen('pick')
  }

  const startBattle = (deck: string[]) => {
    game.reset(menuDifficulty, menuMode, deck)
    setScreen('battle')
  }

  const quitToMenu = () => {
    game.reset(menuDifficulty, menuMode)
    setMenuStep('root')
    setScreen('menu')
  }

  return (
    <div
      className={`app ${screen === 'battle' ? 'in-battle' : 'in-menu'}${screen === 'pick' ? ' in-pick' : ''}`}
    >
      {screen === 'battle' && (
        <div className="stage">
          <ChessScene
            pieces={game.pieces}
            selected={game.selected}
            selectedId={game.selectedId}
            legalTargets={game.legalTargets}
            lastMove={game.lastMove}
            checkedKing={checkedKing}
            checkerSquare={primaryChecker}
            defeatedKing={game.status === 'checkmate' ? checkedKing : null}
            onSquareClick={game.selectSquare}
            boardFreeAtRef={game.boardFreeAtRef}
          />
        </div>
      )}

      {screen === 'battle' && (
        <div className="anime-frame" aria-hidden="true">
          <span className="corner c-tl" />
          <span className="corner c-tr" />
          <span className="corner c-bl" />
          <span className="corner c-br" />
          <span className="slash slash-a" />
          <span className="slash slash-b" />
        </div>
      )}

      {screen === 'characters' ? (
        <CharactersPage
          onBack={() => {
            setMenuStep('root')
            setScreen('menu')
          }}
        />
      ) : screen === 'pick' ? (
        <PickFightersPage
          mode={menuMode}
          onBack={() => setScreen('menu')}
          onConfirm={startBattle}
        />
      ) : screen === 'menu' ? (
        <div className="main-menu">
          <div className="menu-bg" aria-hidden="true">
            <span className="menu-bg-art" />
            <span className="menu-bg-veil" />
            <span className="blob blob-a" />
            <span className="blob blob-b" />
            <span className="blob blob-c" />
            <span className="halftone" />
            <span className="speed-lines" />
            <span className="spark s1" />
            <span className="spark s2" />
            <span className="spark s3" />
          </div>

          <div className="menu-shell comic-scroll">
            <header className="menu-brand">
              <p className="eyebrow">
                <span className="kanji">激闘</span> ANIME FIGHTER
              </p>
              <h1 className="brand-mark">
                Heroes will{' '}
                <span className="brand-mark-accent">die</span>
              </h1>
              <p className="brand-sub">
                {menuStep === 'root'
                  ? 'Choose your path'
                  : 'Pick a mode · Set the rank'}
              </p>
            </header>

            {menuStep === 'root' ? (
              <nav className="start-nav" aria-label="Start menu">
                <button
                  type="button"
                  className="start-nav-btn start-nav-primary"
                  onClick={() => setMenuStep('normal')}
                >
                  <span className="enter-kanji">通常</span>
                  <span className="start-nav-copy">
                    <span className="enter-label">Normal Battle</span>
                    <span className="start-nav-blurb">
                      Vs AI · pick difficulty
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className="start-nav-btn start-nav-secondary"
                  onClick={() => setScreen('characters')}
                >
                  <span className="enter-kanji">人物</span>
                  <span className="start-nav-copy">
                    <span className="enter-label">Characters</span>
                    <span className="start-nav-blurb">
                      Browse the full roster
                    </span>
                  </span>
                </button>
              </nav>
            ) : (
              <>
                <button
                  type="button"
                  className="menu-back-btn"
                  onClick={() => setMenuStep('root')}
                >
                  ← Back
                </button>

                <section className="mode-panel">
                  <div className="panel-head">
                    <span>Mode</span>
                    <span className={`mode-pill mode-${menuMode}`}>
                      {selectedMode.tag}
                    </span>
                  </div>
                  <div className="mode-grid">
                    {modes.map((key) => {
                      const cfg = GAME_MODE_CONFIG[key]
                      const active = menuMode === key
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`mode-card ${active ? 'active' : ''} mode-${key}`}
                          onClick={() => setMenuMode(key)}
                        >
                          <span className="mode-name">{cfg.label}</span>
                          <span className="mode-blurb">{cfg.blurb}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="rank-panel">
                  <div className="panel-head">
                    <span>Difficulty</span>
                    <span className={`rank-pill rank-${menuDifficulty}`}>
                      {selectedCfg.threat}
                    </span>
                  </div>
                  <div className="rank-grid">
                    {difficulties.map((key) => {
                      const cfg = DIFFICULTY_CONFIG[key]
                      const active = menuDifficulty === key
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`rank-card ${active ? 'active' : ''}`}
                          onClick={() => setMenuDifficulty(key)}
                        >
                          <span className="rank-letter">{cfg.rank}</span>
                          <span className="rank-body">
                            <span className="rank-name">{cfg.label}</span>
                            <span className="rank-blurb">{cfg.blurb}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <button
                  type="button"
                  className={`enter-btn ${menuMode === 'autopilot' ? 'enter-auto' : ''}`}
                  onClick={openPickFighters}
                >
                  <span className="enter-kanji">選抜</span>
                  <span className="enter-label">PICK FIGHTERS</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="battle-top">
            <div className="fighter-bar ally">
              <div className="fighter-portrait dawn-port">
                <span>{auto ? SIDES.w.autoTag : SIDES.w.tag}</span>
              </div>
              <div className="fighter-meta">
                <div className="fighter-name-row">
                  <strong>{auto ? SIDES.w.autoName : SIDES.w.name}</strong>
                  <span>{auto ? 'CPU' : 'P1'}</span>
                </div>
                <div className="hp-track">
                  <div className="hp-fill ally-fill" style={{ width: `${allyPct}%` }} />
                </div>
                <div className="fighter-sub">
                  {allyForce}/16 · {DIFFICULTY_CONFIG[game.difficulty].label}
                </div>
              </div>
            </div>

            <div className={`turn-slash ${banner.tone}`}>
              <span className="turn-title">{banner.title}</span>
              <span className="turn-sub">{banner.sub}</span>
            </div>

            <div className="fighter-bar foe">
              <div className="fighter-meta">
                <div className="fighter-name-row">
                  <strong>{auto ? SIDES.b.autoName : SIDES.b.name}</strong>
                  <span>CPU</span>
                </div>
                <div className="hp-track">
                  <div className="hp-fill foe-fill" style={{ width: `${foePct}%` }} />
                </div>
                <div className="fighter-sub">
                  {foeForce}/16 · {auto ? 'Autopilot' : 'AI'}
                </div>
              </div>
              <div className="fighter-portrait eclipse-port">
                <span>{auto ? SIDES.b.autoTag : SIDES.b.tag}</span>
              </div>
            </div>
          </header>

          <aside className="battle-side">
            <div className="lock-panel">
              <div className="panel-head">
                <span>Selected</span>
                <span className="mono">
                  {game.selected ? sectorLabel(game.selected) : '——'}
                </span>
              </div>
              {selectedUnit ? (
                <div className="lock-body">
                  <div className="hero-title-row">
                    <p className="hero-codename">
                      {selectedHero?.codename ?? PIECE_CODENAME[selectedUnit.type]}
                    </p>
                    <span
                      className={`hero-class-chip ${selectedUnit.awakened ? 'awakened' : ''}`}
                    >
                      {selectedUnit.awakened
                        ? `Awakened · ${PIECE_CODENAME[selectedUnit.type]}`
                        : PIECE_CODENAME[selectedUnit.type]}
                    </span>
                  </div>
                  {selectedHero ? (
                    <>
                      <p className="hero-true-name">{selectedHero.trueName}</p>
                      <p className="hero-gimmick">{selectedHero.gimmick}</p>
                      <p className="hero-detail">{selectedHero.blurb}</p>
                      <div className="hero-stats">
                        <StatPips label="PWR" value={selectedHero.stats.pwr} />
                        <StatPips label="SPD" value={selectedHero.stats.spd} />
                        <StatPips label="STY" value={selectedHero.stats.sty} />
                      </div>
                    </>
                  ) : (
                    <p className="hero-detail">
                      {selectedUnit.color === 'w' ? 'Dawn fighter' : 'Eclipse fighter'}
                    </p>
                  )}
                  <p className="hero-moves">
                    {selectedUnit.color === 'w' ? 'Dawn' : 'Eclipse'} ·{' '}
                    {game.legalTargets.length} moves
                  </p>
                </div>
              ) : (
                <p className="lock-empty">
                  {auto
                    ? 'Tap a fighter to inspect — autopilot handles moves.'
                    : 'Tap a fighter to inspect — yours to move.'}
                </p>
              )}
            </div>
          </aside>

          <footer className="battle-bottom">
            <div className="combo-log">
              <span className="log-label">Move Log</span>
              <div className="log-chips">
                {game.history.length === 0 ? (
                  <span className="log-empty">
                    {auto ? 'Engines warming up…' : 'Waiting for first move'}
                  </span>
                ) : (
                  game.history.slice(-5).map((move, i) => (
                    <span key={`${move}-${i}`} className="log-chip">
                      {move}
                    </span>
                  ))
                )}
              </div>
            </div>
            <button type="button" className="retreat-btn" onClick={quitToMenu}>
              Menu
            </button>
          </footer>

          {game.pendingPromotion && (
            <div className="awaken-overlay" role="dialog" aria-modal="true">
              <div className="awaken-panel">
                <p className="eyebrow">
                  <span className="kanji">覚醒</span> AWAKEN
                </p>
                <h2 className="awaken-title">
                  {pendingHero?.hero?.codename ?? 'Pawn'} Awakens
                </h2>
                <p className="awaken-sub">
                  Pick the evolution role — the look stays awakened either way.
                </p>
                <div className="awaken-choices">
                  {PROMOTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      className="awaken-choice"
                      onClick={() => game.completePromotion(opt.type)}
                    >
                      <span className="awaken-choice-role">{opt.label}</span>
                      <span className="awaken-choice-hint">
                        Moves as {opt.label.toLowerCase()}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="awaken-cancel"
                  onClick={game.cancelPromotion}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
