import { useMemo, useState } from 'react'
import {
  countByPiece,
  DECK_ORDER,
  DECK_QUOTA,
  DECK_SIZE,
  deckComplete,
  randomDeck,
  sortDeckIds,
} from '../game/deck'
import { heroRosterArtCandidates } from '../game/heroArt'
import { getHeroDesign } from '../game/heroDesigns'
import { HEROES, type HeroDef } from '../game/heroes'
import { filterRoster, type RosterClass } from '../game/heroRoster'
import {
  GAME_MODE_CONFIG,
  PIECE_CODENAME,
  SIDES,
  type GameMode,
  type PieceColor,
} from '../game/types'
import { CharacterStage } from '../scene/CharacterStage'

const CLASS_TABS: { id: RosterClass; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'p', label: 'Pawn' },
  { id: 'r', label: 'Rook' },
  { id: 'n', label: 'Knight' },
  { id: 'b', label: 'Bishop' },
  { id: 'q', label: 'Queen' },
  { id: 'k', label: 'King' },
]

type TeamSide = PieceColor

function PortraitTile({
  hero,
  selected,
  locked,
  otherTeam,
  onToggle,
}: {
  hero: HeroDef
  selected: boolean
  locked: boolean
  otherTeam: boolean
  onToggle: () => void
}) {
  const design = getHeroDesign(hero.id, hero.color)
  const initial = hero.codename.slice(0, 1).toUpperCase()
  const candidates = heroRosterArtCandidates(hero.id)
  const [artIndex, setArtIndex] = useState(0)
  const artSrc = artIndex < candidates.length ? candidates[artIndex] : null

  return (
    <button
      type="button"
      className={`comic-panel ${selected ? 'active' : ''} ${locked && !selected ? 'pick-locked' : ''} ${otherTeam ? 'pick-other-team' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
      disabled={locked && !selected}
      title={
        otherTeam
          ? 'Already on the other team'
          : locked && !selected
            ? `${PIECE_CODENAME[hero.piece]} slots full`
            : `${selected ? 'Remove' : 'Add'} ${hero.codename}`
      }
    >
      <span className="comic-panel-ink" aria-hidden="true" />
      <span
        className="comic-panel-art"
        style={{
          background: `linear-gradient(145deg, ${design.palette.primary} 0%, ${design.palette.secondary} 55%, ${design.palette.accent} 120%)`,
        }}
      >
        {artSrc ? (
          <img
            className="roster-tile-art"
            src={artSrc}
            alt=""
            draggable={false}
            onError={() => setArtIndex((i) => i + 1)}
          />
        ) : (
          <>
            <span
              className="roster-tile-initial"
              style={{ color: design.palette.trim }}
            >
              {initial}
            </span>
            <span
              className="roster-tile-glow"
              style={{ background: design.palette.glow ?? design.palette.accent }}
            />
          </>
        )}
        {selected ? <span className="pick-check" aria-hidden="true">✓</span> : null}
        {otherTeam ? (
          <span className="pick-other-badge" aria-hidden="true">
            Taken
          </span>
        ) : null}
      </span>
      <span className="comic-caption">
        <span className="comic-caption-name">{hero.codename}</span>
        <span className="comic-caption-role">{PIECE_CODENAME[hero.piece]}</span>
      </span>
    </button>
  )
}

export function PickFightersPage({
  mode,
  onBack,
  onConfirm,
}: {
  mode: GameMode
  onBack: () => void
  onConfirm: (whiteDeck: string[], blackDeck?: string[]) => void
}) {
  const dualTeam = mode === 'autopilot'
  const [classTab, setClassTab] = useState<RosterClass>('all')
  const [activeTeam, setActiveTeam] = useState<TeamSide>('w')
  const [whiteIds, setWhiteIds] = useState<string[]>([])
  const [blackIds, setBlackIds] = useState<string[]>([])

  const selectedIds = activeTeam === 'w' ? whiteIds : blackIds
  const setSelectedIds = activeTeam === 'w' ? setWhiteIds : setBlackIds
  const otherIds = activeTeam === 'w' ? blackIds : whiteIds
  const otherSet = useMemo(() => new Set(otherIds), [otherIds])

  const roster = useMemo(
    () => filterRoster(HEROES, { classTab, query: '' }),
    [classTab],
  )

  const selectedHeroes = useMemo(() => {
    const byId = new Map(HEROES.map((h) => [h.id, h]))
    return sortDeckIds(selectedIds, HEROES)
      .map((id) => byId.get(id))
      .filter((h): h is HeroDef => Boolean(h))
  }, [selectedIds])

  const counts = useMemo(
    () => countByPiece(selectedIds, HEROES),
    [selectedIds],
  )

  const whiteComplete = deckComplete(whiteIds, HEROES)
  const blackComplete = deckComplete(blackIds, HEROES)
  const complete = dualTeam ? whiteComplete && blackComplete : whiteComplete
  const modeCfg = GAME_MODE_CONFIG[mode]
  const stageIds = selectedHeroes.map((h) => h.id)
  const teamLabel =
    dualTeam
      ? activeTeam === 'w'
        ? SIDES.w.autoName
        : SIDES.b.autoName
      : 'Your'

  function toggleHero(hero: HeroDef) {
    if (dualTeam && otherSet.has(hero.id)) return
    setSelectedIds((prev) => {
      if (prev.includes(hero.id)) {
        return prev.filter((id) => id !== hero.id)
      }
      let used = 0
      for (const id of prev) {
        const h = HEROES.find((x) => x.id === id)
        if (h?.piece === hero.piece) used += 1
      }
      if (used >= DECK_QUOTA[hero.piece]) return prev
      return [...prev, hero.id]
    })
  }

  function clearDeck() {
    setSelectedIds([])
  }

  function fillRandomDeck() {
    if (dualTeam) {
      const white = randomDeck(HEROES)
      setWhiteIds(white)
      setBlackIds(randomDeck(HEROES, white))
      return
    }
    setWhiteIds(randomDeck(HEROES))
  }

  function handleConfirm() {
    const white = sortDeckIds(whiteIds, HEROES)
    if (dualTeam) {
      onConfirm(white, sortDeckIds(blackIds, HEROES))
      return
    }
    onConfirm(white)
  }

  return (
    <div className="pick-page">
      <div className="menu-bg" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
        <span className="halftone" />
        <span className="speed-lines" />
      </div>

      <div className="pick-shell">
        <header className="pick-head">
          <div className="pick-brand">
            <p className="eyebrow">
              <span className="kanji">選抜</span> DECK BUILD
            </p>
            <h1 className="pick-title">
              {dualTeam ? 'Pick Both Armies' : 'Pick Fighters'}
            </h1>
          </div>
          <div className="pick-head-actions">
            <button type="button" className="chars-back" onClick={onBack}>
              Back
            </button>
            <button
              type="button"
              className={`enter-btn pick-confirm ${mode === 'autopilot' ? 'enter-auto' : ''}`}
              onClick={fillRandomDeck}
              title="Fill a random legal deck"
            >
              <span className="enter-kanji">乱</span>
              <span className="enter-label">RANDOM</span>
            </button>
            <button
              type="button"
              className={`enter-btn pick-confirm ${mode === 'autopilot' ? 'enter-auto' : ''}`}
              disabled={!complete}
              onClick={handleConfirm}
            >
              <span className="enter-kanji">{modeCfg.kanji}</span>
              <span className="enter-label">{modeCfg.cta}</span>
            </button>
          </div>
        </header>

        <div className="pick-main">
          <aside className="pick-deck-pane" aria-label="Selected deck">
            {dualTeam ? (
              <div className="pick-team-tabs" role="tablist" aria-label="Team">
                {(
                  [
                    { id: 'w' as const, label: SIDES.w.autoName, ids: whiteIds },
                    { id: 'b' as const, label: SIDES.b.autoName, ids: blackIds },
                  ] as const
                ).map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTeam === team.id}
                    className={`pick-team-tab team-${team.id} ${activeTeam === team.id ? 'active' : ''} ${deckComplete(team.ids, HEROES) ? 'ready' : ''}`}
                    onClick={() => setActiveTeam(team.id)}
                  >
                    <span className="pick-team-name">{team.label}</span>
                    <span className="pick-team-count">
                      {team.ids.length}/{DECK_SIZE}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="panel-head">
                <span>Your Deck</span>
                <span className="chars-count">
                  {selectedIds.length}/{DECK_SIZE}
                </span>
              </div>
            )}

            {dualTeam ? (
              <div className="panel-head pick-team-head">
                <span>{teamLabel} Deck</span>
                <span className="chars-count">
                  {selectedIds.length}/{DECK_SIZE}
                </span>
              </div>
            ) : null}

            <div className="pick-quota-row" aria-label="Class slots">
              {DECK_ORDER.map((piece) => {
                const have = counts[piece]
                const need = DECK_QUOTA[piece]
                const full = have >= need
                return (
                  <button
                    key={piece}
                    type="button"
                    className={`pick-quota-chip ${full ? 'full' : ''} ${classTab === piece ? 'active' : ''}`}
                    onClick={() => setClassTab(piece)}
                    title={`${PIECE_CODENAME[piece]} ${have}/${need}`}
                  >
                    <span>{PIECE_CODENAME[piece].slice(0, 1)}</span>
                    <span>
                      {have}/{need}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="pick-deck-list comic-scroll">
              {selectedHeroes.length === 0 ? (
                <p className="lock-empty">
                  {dualTeam
                    ? `Tap fighters below to build ${teamLabel}.`
                    : 'Tap fighters below to build your army.'}
                </p>
              ) : (
                selectedHeroes.map((hero) => {
                  const design = getHeroDesign(hero.id, hero.color)
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      className="pick-deck-row"
                      onClick={() => toggleHero(hero)}
                      title={`Remove ${hero.codename}`}
                    >
                      <span
                        className="pick-deck-swatch"
                        style={{ background: design.palette.primary }}
                      />
                      <span className="pick-deck-copy">
                        <span className="pick-deck-name">{hero.codename}</span>
                        <span className="pick-deck-role">
                          {PIECE_CODENAME[hero.piece]}
                        </span>
                      </span>
                      <span className="pick-deck-remove" aria-hidden="true">
                        ✕
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {selectedIds.length > 0 ? (
              <button
                type="button"
                className="pick-clear-btn"
                onClick={clearDeck}
              >
                Clear deck
              </button>
            ) : null}
          </aside>

          <section className="pick-stage-pane" aria-label="Selected lineup">
            {stageIds.length > 0 ? (
              <CharacterStage
                ids={stageIds}
                mode="idle"
                layout="lineup"
                className="pick-stage"
              />
            ) : (
              <div className="pick-stage-empty">
                <p>
                  {dualTeam
                    ? `${teamLabel} fighters idle here`
                    : 'Selected fighters idle here'}
                </p>
                <span>
                  {dualTeam
                    ? 'Build Dawn, then Eclipse'
                    : 'Face the squad before you deploy'}
                </span>
              </div>
            )}
          </section>
        </div>

        <section className="pick-roster" aria-label="Fighter roster">
          <div
            className="roster-filter-bar pick-tabs comic-scroll"
            role="tablist"
            aria-label="Piece class"
          >
            {CLASS_TABS.map((tab) => {
              const slot =
                tab.id === 'all'
                  ? null
                  : `${counts[tab.id]}/${DECK_QUOTA[tab.id]}`
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={classTab === tab.id}
                  className={`roster-class-tab ${classTab === tab.id ? 'active' : ''}`}
                  onClick={() => setClassTab(tab.id)}
                >
                  {tab.label}
                  {slot ? <span className="pick-tab-count">{slot}</span> : null}
                </button>
              )
            })}
          </div>

          <div className="comic-page pick-comic comic-scroll" role="list">
            {roster.map((h) => {
              const selected = selectedIds.includes(h.id)
              const otherTeam = dualTeam && otherSet.has(h.id)
              const locked =
                otherTeam || counts[h.piece] >= DECK_QUOTA[h.piece]
              return (
                <div key={h.id} role="listitem" className="comic-gutter-cell">
                  <PortraitTile
                    hero={h}
                    selected={selected}
                    locked={locked}
                    otherTeam={otherTeam}
                    onToggle={() => toggleHero(h)}
                  />
                </div>
              )
            })}
            {roster.length === 0 ? (
              <p className="roster-empty">No fighters in this class.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
