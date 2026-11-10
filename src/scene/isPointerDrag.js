/** Ignore click after orbit/pan drag (screen-space px). */
const DRAG_THRESHOLD_PX = 6;
export function isPointerDrag(origin, point, threshold = DRAG_THRESHOLD_PX) {
    const dx = point.clientX - origin.x;
    const dy = point.clientY - origin.y;
    return dx * dx + dy * dy > threshold * threshold;
}
