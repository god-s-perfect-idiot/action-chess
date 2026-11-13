import { useMemo, useState } from 'react'
import {
  countByPiece,
  DECK_ORDER,
  DECK_QUOTA,
  DECK_SIZE,
  deckComplete,
  sortDeckIds,
} from '../game/deck'
import { heroRosterArtCandidates } from '../game/heroArt'
import { getHeroDesign } from '../game/heroDesigns'
import { HEROES, type HeroDef } from '../game/heroes'
import { filterRoster, type RosterClass } from '../game/heroRoster'
import { GAME_MODE_CONFIG, PIECE_CODENAME, type GameMode } from '../game/types'
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

function PortraitTile({
  hero,
  selected,
  locked,
  onToggle,
}: {
  hero: HeroDef
  selected: boolean
  locked: boolean
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
      className={`comic-panel ${selected ? 'active' : ''} ${locked && !selected ? 'pick-locked' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
      disabled={locked && !selected}
      title={
        locked && !selected
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
  onConfirm: (deck: string[]) => void
}) {
  const [classTab, setClassTab] = useState<RosterClass>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const complete = deckComplete(selectedIds, HEROES)
  const modeCfg = GAME_MODE_CONFIG[mode]
  const stageIds = selectedHeroes.map((h) => h.id)

  function toggleHero(hero: HeroDef) {
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
            <h1 className="pick-title">Pick Fighters</h1>
          </div>
          <div className="pick-head-actions">
            <button type="button" className="chars-back" onClick={onBack}>
              Back
            </button>
            <button
              type="button"
              className={`enter-btn pick-confirm ${mode === 'autopilot' ? 'enter-auto' : ''}`}
              disabled={!complete}
              onClick={() => onConfirm(sortDeckIds(selectedIds, HEROES))}
            >
              <span className="enter-kanji">{modeCfg.kanji}</span>
              <span className="enter-label">{modeCfg.cta}</span>
            </button>
          </div>
        </header>

        <div className="pick-main">
          <aside className="pick-deck-pane" aria-label="Selected deck">
            <div className="panel-head">
              <span>Your Deck</span>
              <span className="chars-count">
                {selectedIds.length}/{DECK_SIZE}
              </span>
            </div>

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
                  Tap fighters below to build your army.
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
                <p>Selected fighters idle here</p>
                <span>Face the squad before you deploy</span>
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
              const locked = counts[h.piece] >= DECK_QUOTA[h.piece]
              return (
                <div key={h.id} role="listitem" className="comic-gutter-cell">
                  <PortraitTile
                    hero={h}
                    selected={selected}
                    locked={locked}
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
