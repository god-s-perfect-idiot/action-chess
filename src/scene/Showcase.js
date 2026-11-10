import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { HERO_DESIGNS } from '../game/heroDesigns';
import { ANIM_MODES, CharacterStage, DAMAGE_TYPES } from './CharacterStage';
/**
 * Dev gallery: `?showcase` for all heroes, `?showcase=<heroId>` for one.
 * `&mode=attack&f=0.4` freezes every hero at 40% through its clip.
 * `&mode=death&dmg=beam` previews one damage type's death; `&cam=3,1,0.3` moves the camera.
 */
export function Showcase({ only }) {
    const params = new URLSearchParams(window.location.search);
    const [mode, setMode] = useState(params.get('mode') ?? 'cycle');
    const f = params.get('f');
    const freeze = f === null ? null : Number(f);
    const dmgParam = params.get('dmg');
    const damage = dmgParam && DAMAGE_TYPES.includes(dmgParam) ? dmgParam : null;
    const camParam = params.get('cam')?.split(',').map(Number);
    const cam = camParam?.length === 3 && camParam.every(Number.isFinite) ? camParam : undefined;
    const awakened = params.has('awakened') || params.get('awake') === '1';
    const ids = only && HERO_DESIGNS[only] ? [only] : Object.keys(HERO_DESIGNS);
    return (_jsxs("div", { style: { position: 'fixed', inset: 0, background: '#cfd8e3' }, children: [_jsx(CharacterStage, { ids: ids, mode: mode, freeze: freeze, damage: damage, cam: cam, awakened: awakened }), _jsx("div", { style: { position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }, children: ANIM_MODES.map((m) => (_jsx("button", { type: "button", onClick: () => setMode(m), style: { padding: '6px 12px', fontWeight: mode === m ? 700 : 400 }, children: m }, m))) })] }));
}
