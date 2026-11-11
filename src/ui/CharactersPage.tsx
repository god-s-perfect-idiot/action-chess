import { useMemo, useState } from 'react'
import { HEROES } from '../game/heroes'
import { getHeroDesign } from '../game/heroDesigns'
import { PIECE_CODENAME } from '../game/types'
import {
  ANIM_MODES,
  CharacterStage,
  DAMAGE_TYPES,
  KING_ANIM_MODES,
  type AnimMode,
} from '../scene/CharacterStage'
import type { DamageType } from '../scene/fighters/anims'
import { protectorForKing } from '../game/protectors'

function StatPips({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-row" title={`${label} ${value}/5`}>
      <span className="stat-label">{label}</span>
      <span className="stat-pips" aria-label={`${label} ${value} of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`stat-pip ${i < value ? 'on' : ''}`} />
        ))}
      </span>
    </div>
  )
}

export function CharactersPage({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState(HEROES[0]?.id ?? '')
  const [mode, setMode] = useState<AnimMode>('idle')
  const [damage, setDamage] = useState<DamageType | null>(null)
  const [awakened, setAwakened] = useState(false)

  const hero = useMemo(
    () => HEROES.find((h) => h.id === selectedId) ?? HEROES[0],
    [selectedId],
  )

  const canAwaken = hero?.piece === 'p'
  const isKing = hero?.piece === 'k'
  const showAwakened = Boolean(canAwaken && awakened)
  const design = hero
    ? getHeroDesign(hero.id, hero.color, { awakened: showAwakened })
    : null
  const protector = hero ? protectorForKing(hero.id) : null
  const animModes = isKing && protector ? [...ANIM_MODES, ...KING_ANIM_MODES] : ANIM_MODES

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
          <div>
            <p className="eyebrow">
              <span className="kanji">人物</span> ROSTER
            </p>
            <h1 className="characters-title">Characters</h1>
          </div>
          <button type="button" className="chars-back" onClick={onBack}>
            Back
          </button>
        </header>

        <div className="characters-layout">
          <aside className="chars-list-panel">
            <div className="panel-head">
              <span>Fighters</span>
              <span className="chars-count">{HEROES.length}</span>
            </div>
            <ul className="chars-list">
              {HEROES.map((h) => {
                const active = h.id === hero?.id
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      className={`chars-row ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedId(h.id)
                        if (h.piece !== 'p') setAwakened(false)
                        if (h.piece !== 'k' && (mode === 'check' || mode === 'checkmate')) {
                          setMode('idle')
                        }
                      }}
                    >
                      <span className="chars-row-mark">{h.codename.slice(0, 1)}</span>
                      <span className="chars-row-body">
                        <span className="chars-row-name">{h.codename}</span>
                        <span className="chars-row-meta">
                          {PIECE_CODENAME[h.piece]}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <section className="chars-stage-panel">
            <div className="chars-stage-wrap">
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
            {canAwaken ? (
              <div className="chars-anim-bar">
                <button
                  type="button"
                  className={`chars-anim-btn ${!awakened ? 'active' : ''}`}
                  onClick={() => setAwakened(false)}
                >
                  base
                </button>
                <button
                  type="button"
                  className={`chars-anim-btn ${awakened ? 'active' : ''}`}
                  onClick={() => setAwakened(true)}
                >
                  awakened
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
            {protector && (mode === 'check' || mode === 'checkmate') ? (
              <p className="chars-look">
                Guarded by {protector.codename} — {protector.blurb}
              </p>
            ) : null}
            {mode === 'death' && (
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
            )}
          </section>

          <aside className="chars-detail-panel">
            {hero ? (
              <>
                <div className="panel-head">
                  <span>Profile</span>
                </div>
                <div className="hero-title-row">
                  <p className="hero-codename">{hero.codename}</p>
                  <span
                    className={`hero-class-chip ${showAwakened ? 'awakened' : ''}`}
                  >
                    {showAwakened
                      ? 'Awakened · Pawn'
                      : PIECE_CODENAME[hero.piece]}
                  </span>
                </div>
                <p className="hero-true-name">{hero.trueName}</p>
                <p className="hero-gimmick">{hero.gimmick}</p>
                <p className="hero-detail">{hero.blurb}</p>
                <p className="chars-look">{hero.look}</p>
                <div className="hero-stats">
                  <StatPips label="PWR" value={hero.stats.pwr} />
                  <StatPips label="SPD" value={hero.stats.spd} />
                  <StatPips label="STY" value={hero.stats.sty} />
                </div>
                {design ? (
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
                ) : null}
              </>
            ) : (
              <p className="lock-empty">No fighters in the roster.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
