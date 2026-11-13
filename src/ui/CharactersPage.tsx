import { useMemo, useState } from 'react'
import { heroRosterArtCandidates } from '../game/heroArt'
import { HEROES, type HeroDef } from '../game/heroes'
import { getHeroDesign } from '../game/heroDesigns'
import {
  difficultyLabel,
  filterRoster,
  getHeroRosterProfile,
  type RosterClass,
} from '../game/heroRoster'
import { protectorForKing } from '../game/protectors'
import { PIECE_CODENAME } from '../game/types'
import {
  ANIM_MODES,
  CharacterStage,
  DAMAGE_TYPES,
  KING_ANIM_MODES,
  type AnimMode,
} from '../scene/CharacterStage'
import type { DamageType } from '../scene/fighters/anims'

const CLASS_TABS: { id: RosterClass; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'p', label: 'Pawn' },
  { id: 'r', label: 'Rook' },
  { id: 'n', label: 'Knight' },
  { id: 'b', label: 'Bishop' },
  { id: 'q', label: 'Queen' },
  { id: 'k', label: 'King' },
]

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="roster-stat" title={`${label} ${value}/5`}>
      <span className="roster-stat-label">{label}</span>
      <span className="roster-stat-track" aria-hidden="true">
        <span
          className="roster-stat-fill"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </span>
      <span className="roster-stat-val">{value}</span>
    </div>
  )
}

function PortraitTile({
  hero,
  active,
  onSelect,
}: {
  hero: HeroDef
  active: boolean
  onSelect: () => void
}) {
  const design = getHeroDesign(hero.id, hero.color)
  const initial = hero.codename.slice(0, 1).toUpperCase()
  const candidates = heroRosterArtCandidates(hero.id)
  const [artIndex, setArtIndex] = useState(0)
  const artSrc = artIndex < candidates.length ? candidates[artIndex] : null

  return (
    <button
      type="button"
      className={`comic-panel ${active ? 'active' : ''}`}
      onClick={onSelect}
      aria-pressed={active}
      title={`${hero.codename} · ${PIECE_CODENAME[hero.piece]}`}
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
      </span>
      <span className="comic-caption">
        <span className="comic-caption-name">{hero.codename}</span>
        <span className="comic-caption-role">{PIECE_CODENAME[hero.piece]}</span>
      </span>
    </button>
  )
}

export function CharactersPage({ onBack }: { onBack: () => void }) {
  const [classTab, setClassTab] = useState<RosterClass>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(HEROES[0]?.id ?? '')
  const [mode, setMode] = useState<AnimMode>('idle')
  const [damage, setDamage] = useState<DamageType | null>(null)
  const [awakened, setAwakened] = useState(false)
  const [abilityKey, setAbilityKey] = useState<'P' | 'Q' | 'R'>('Q')

  const roster = useMemo(
    () => filterRoster(HEROES, { classTab, query }),
    [classTab, query],
  )

  const hero = useMemo(
    () => roster.find((h) => h.id === selectedId) ?? roster[0] ?? HEROES[0],
    [roster, selectedId],
  )

  const profile = useMemo(
    () => (hero ? getHeroRosterProfile(hero) : null),
    [hero],
  )

  function selectHero(h: HeroDef) {
    setSelectedId(h.id)
    setAbilityKey('Q')
    if (h.piece !== 'p') setAwakened(false)
    if (h.piece !== 'k' && (mode === 'check' || mode === 'checkmate')) {
      setMode('idle')
    }
  }

  function ensureSelection(nextRoster: HeroDef[]) {
    if (nextRoster.length > 0 && !nextRoster.some((h) => h.id === selectedId)) {
      selectHero(nextRoster[0]!)
    }
  }

  function selectClassTab(tab: RosterClass) {
    setClassTab(tab)
    ensureSelection(filterRoster(HEROES, { classTab: tab, query }))
  }

  const canAwaken = hero?.piece === 'p'
  const isKing = hero?.piece === 'k'
  const showAwakened = Boolean(canAwaken && awakened)
  const design = hero
    ? getHeroDesign(hero.id, hero.color, { awakened: showAwakened })
    : null
  const protector = hero ? protectorForKing(hero.id) : null
  const animModes =
    isKing && protector ? [...ANIM_MODES, ...KING_ANIM_MODES] : ANIM_MODES
  const activeAbility =
    profile?.abilities.find((a) => a.key === abilityKey) ?? profile?.abilities[1]

  return (
    <div className="characters-page">
      <div className="menu-bg" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
        <span className="halftone" />
        <span className="speed-lines" />
      </div>

      <div className="characters-shell">
        <header className="characters-head">
          <div className="characters-brand">
            <p className="eyebrow">
              <span className="kanji">人物</span> ROSTER
            </p>
            <h1 className="characters-title">Characters</h1>
          </div>
          <button type="button" className="chars-back" onClick={onBack}>
            Back
          </button>
        </header>

        <div className="characters-split">
          <section className="roster-pane" aria-label="Fighter list">
            <label className="roster-search">
              <span className="visually-hidden">Search fighters</span>
              <input
                type="search"
                value={query}
                placeholder="Search name, gimmick…"
                onChange={(e) => {
                  const next = e.target.value
                  setQuery(next)
                  ensureSelection(
                    filterRoster(HEROES, { classTab, query: next }),
                  )
                }}
              />
            </label>

            <div
              className="roster-filter-bar"
              role="tablist"
              aria-label="Piece class"
            >
              {CLASS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={classTab === tab.id}
                  className={`roster-class-tab ${classTab === tab.id ? 'active' : ''}`}
                  onClick={() => selectClassTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="roster-pane-head">
              <span>Fighters</span>
              <span className="chars-count">{roster.length}</span>
            </div>

            <div className="comic-page" role="list">
              {roster.map((h) => (
                <div key={h.id} role="listitem" className="comic-gutter-cell">
                  <PortraitTile
                    hero={h}
                    active={h.id === hero?.id}
                    onSelect={() => selectHero(h)}
                  />
                </div>
              ))}
              {roster.length === 0 ? (
                <p className="roster-empty">No fighters match.</p>
              ) : null}
            </div>
          </section>

          <section className="detail-pane" aria-label="Character info">
            <div className="roster-stage-wrap">
              {hero ? (
                <CharacterStage
                  key={`${hero.id}-${showAwakened ? 'awake' : 'base'}`}
                  ids={[hero.id]}
                  mode={mode}
                  damage={damage}
                  awakened={showAwakened}
                  className="chars-stage"
                />
              ) : null}
            </div>

            <div className="roster-toolbar">
              {canAwaken ? (
                <div className="chars-anim-bar roster-form-bar">
                  <button
                    type="button"
                    className={`chars-anim-btn ${!awakened ? 'active' : ''}`}
                    onClick={() => setAwakened(false)}
                  >
                    Base
                  </button>
                  <button
                    type="button"
                    className={`chars-anim-btn ${awakened ? 'active' : ''}`}
                    onClick={() => setAwakened(true)}
                  >
                    Awaken
                  </button>
                </div>
              ) : null}

              <div className="chars-anim-bar">
                {animModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chars-anim-btn ${mode === m ? 'active' : ''}`}
                    onClick={() => setMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {mode === 'death' ? (
                <div className="chars-anim-bar">
                  {([null, ...DAMAGE_TYPES] as const).map((d) => (
                    <button
                      key={d ?? 'all'}
                      type="button"
                      className={`chars-anim-btn ${damage === d ? 'active' : ''}`}
                      onClick={() => setDamage(d)}
                    >
                      {d ?? 'all'}
                    </button>
                  ))}
                </div>
              ) : null}

              {protector && (mode === 'check' || mode === 'checkmate') ? (
                <p className="chars-look roster-guard-note">
                  Guarded by {protector.codename} — {protector.blurb}
                </p>
              ) : null}
            </div>

            <div className="roster-dossier">
              {hero && profile && design ? (
                <>
                  <div className="panel-head">
                    <span>
                      {showAwakened ? 'Awakened' : profile.pieceLabel}
                    </span>
                    <span className={`roster-diff diff-${profile.difficulty}`}>
                      {difficultyLabel(profile.difficulty)}
                      <span className="roster-diff-pips" aria-hidden="true">
                        {Array.from({ length: 3 }, (_, i) => (
                          <span
                            key={i}
                            className={`roster-diff-pip ${i < profile.difficulty ? 'on' : ''}`}
                          />
                        ))}
                      </span>
                    </span>
                  </div>

                  <div className="roster-identity">
                    <p className="hero-codename">{hero.codename}</p>
                    <p className="hero-true-name">{hero.trueName}</p>
                    <p className="hero-gimmick">{hero.gimmick}</p>
                  </div>

                  <div className="roster-tags">
                    {profile.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`roster-tag ${tag === 'Awaken' ? 'awaken' : ''}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="hero-stats roster-stats">
                    <StatBar label="PWR" value={hero.stats.pwr} />
                    <StatBar label="SPD" value={hero.stats.spd} />
                    <StatBar label="STY" value={hero.stats.sty} />
                  </div>

                  <section className="roster-abilities">
                    <div className="roster-section-label">Abilities</div>
                    <div
                      className="roster-ability-keys"
                      role="tablist"
                      aria-label="Abilities"
                    >
                      {profile.abilities.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          role="tab"
                          aria-selected={abilityKey === a.key}
                          className={`roster-ability-key key-${a.key} ${abilityKey === a.key ? 'active' : ''}`}
                          onClick={() => setAbilityKey(a.key)}
                          title={a.name}
                        >
                          <span className="roster-ability-badge">{a.key}</span>
                          <span className="roster-ability-slot">{a.label}</span>
                        </button>
                      ))}
                    </div>
                    {activeAbility ? (
                      <div className="roster-ability-body">
                        <p className="roster-ability-name">{activeAbility.name}</p>
                        <p className="roster-ability-blurb">
                          {activeAbility.blurb}
                        </p>
                      </div>
                    ) : null}
                  </section>

                  <section className="roster-lore">
                    <div className="roster-section-label">Lore</div>
                    <p className="hero-detail">{hero.blurb}</p>
                    <p className="chars-look">{hero.look}</p>
                  </section>

                  {protector ? (
                    <section className="roster-protector">
                      <div className="roster-section-label">Bodyguard</div>
                      <p className="roster-ability-name">{protector.codename}</p>
                      <p className="roster-ability-blurb">
                        {protector.trueName} — {protector.blurb}
                      </p>
                    </section>
                  ) : null}

                  <dl className="chars-anim-meta">
                    <div>
                      <dt>Idle</dt>
                      <dd>{design.idle}</dd>
                    </div>
                    <div>
                      <dt>Attack</dt>
                      <dd>{design.attack}</dd>
                    </div>
                    <div>
                      <dt>Move</dt>
                      <dd>{design.locomotion ?? 'run'}</dd>
                    </div>
                    <div>
                      <dt>Death</dt>
                      <dd>{design.death}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="lock-empty">No fighters in the roster.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
