import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { outlineMaterial } from './materials';
const noRaycast = () => null;
/** One cel-shaded mesh plus its black inverted-hull outline. */
export function P({ s, m, p, r, sc, line = true, shadow = true, children, }) {
    return (_jsxs("group", { position: p, rotation: r, scale: sc, children: [_jsx("mesh", { geometry: s.geo, material: m, castShadow: shadow, raycast: noRaycast }), line && (_jsx("mesh", { geometry: s.hull, material: outlineMaterial, raycast: noRaycast })), children] }));
}
