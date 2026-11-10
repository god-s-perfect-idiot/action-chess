/** Dev-only `?slow=4` runs board choreography and FX at quarter speed. */
export const TIME_SCALE = import.meta.env.DEV
    ? 1 / Math.max(1, Number(new URLSearchParams(window.location.search).get('slow')) || 1)
    : 1;
export const now = () => (performance.now() / 1000) * TIME_SCALE;
