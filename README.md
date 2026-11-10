# War Chesst

Cel-shaded 3D chess vs Stockfish.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints.

## Modes

| Mode | Behavior |
| --- | --- |
| Versus | You play White — click a piece, then a target square |
| Autopilot | AI vs AI — Stockfish plays both sides |

## Difficulty

| Level | Behavior |
| --- | --- |
| Easy | Limited Elo / low skill |
| Normal | Club-level Stockfish |
| Hard | Strong search |
| Impossible | Unrestricted Stockfish lite |

Engine files live in `public/engine/` (Stockfish 19 lite, single-threaded).
