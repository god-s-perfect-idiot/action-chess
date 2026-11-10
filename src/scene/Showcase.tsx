import { useState } from 'react'
import { HERO_DESIGNS } from '../game/heroDesigns'
import type { DamageType } from './fighters/anims'
import { ANIM_MODES, CharacterStage, DAMAGE_TYPES, type AnimMode } from './CharacterStage'

/**
 * Dev gallery: `?showcase` for all heroes, `?showcase=<heroId>` for one.
 * `&mode=attack&f=0.4` freezes every hero at 40% through its clip.
 * `&mode=death&dmg=beam` previews one damage type's death; `&cam=3,1,0.3` moves the camera.
 */
export function Showcase({ only }: { only: string | null }) {
  const params = new URLSearchParams(window.location.search)
  const [mode, setMode] = useState<AnimMode>((params.get('mode') as AnimMode | null) ?? 'cycle')
  const f = params.get('f')
  const freeze = f === null ? null : Number(f)
  const dmgParam = params.get('dmg') as DamageType | null
  const damage = dmgParam && DAMAGE_TYPES.includes(dmgParam) ? dmgParam : null
  const camParam = params.get('cam')?.split(',').map(Number)
  const cam = camParam?.length === 3 && camParam.every(Number.isFinite) ? (camParam as [number, number, number]) : undefined
  const awakened = params.has('awakened') || params.get('awake') === '1'
  const ids = only && HERO_DESIGNS[only] ? [only] : Object.keys(HERO_DESIGNS)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#cfd8e3' }}>
      <CharacterStage ids={ids} mode={mode} freeze={freeze} damage={damage} cam={cam} awakened={awakened} />
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
        {ANIM_MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{ padding: '6px 12px', fontWeight: mode === m ? 700 : 400 }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
