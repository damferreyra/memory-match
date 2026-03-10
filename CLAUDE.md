# Memory Match — Claude Context

## What This Project Is

A single-player browser-based memory card matching game. Players flip cards in a 4×4 grid to find matching pairs before a countdown timer hits zero. 3 progressively harder rounds.

## Stack

| Tool | Version / Notes |
|------|----------------|
| Phaser 3 | Game framework — renderer, tweens, scenes, registry |
| TypeScript | Strict mode; `noUnusedLocals` + `noUnusedParameters` |
| Vite | Dev server port **8080** (`npm run dev`) |
| Biome | Formatter + linter (`npm run lint`) |
| Vitest | Unit tests (`npm run test`) |

## Key Commands

```bash
npm run dev     # start dev server (port 8080)
npm run build   # production build
npm run test    # run Vitest unit tests
npm run lint    # Biome lint + format check
```

## Project Structure

```
src/
├── main.ts                    # entry — calls StartGame('game-container')
└── game/
    ├── main.ts                # Phaser.Game config + StartGame() factory
    ├── constants.ts           # SCENE_KEYS, REGISTRY_KEYS, GAME_WIDTH/HEIGHT
    ├── game-logic.ts          # Pure functions: shuffle(), generateCardPairs(), isMatch(), computeMatchScore(), computeTimeBonus()
    ├── game-logic.test.ts     # Vitest tests for pure logic
    ├── config/
    │   ├── assets.ts          # ASSET_KEYS enum
    │   ├── cards.ts           # SYMBOLS, SYMBOL_COLORS, card visual constants
    │   ├── grid.ts            # GRID_LAYOUT, getCardPosition()
    │   ├── grid.test.ts       # Vitest tests for getCardPosition()
    │   ├── rounds.ts          # ROUND_CONFIGS (timeLimit, peekDuration per round)
    │   └── ui.ts              # Depth constants, HUD sizes, flip/mismatch timing, scoring constants
    └── scenes/
        ├── BootScene.ts       # Preload → MenuScene
        ├── MenuScene.ts       # Title + Play button → GameScene (resets registry)
        ├── GameScene.ts       # Grid, flip logic, timer, scoring, HUD
        └── UIScene.ts         # Overlay: round-complete and game-over panels
```

## Coding Conventions

- **Indentation**: tabs (Biome enforced)
- **Quotes**: single quotes (Biome enforced)
- **Colors**: always hex integers `0xRRGGBB` — never CSS color strings
- **No magic strings**: use `SCENE_KEYS`, `REGISTRY_KEYS`, `ASSET_KEYS` enums
- **No magic numbers**: all constants in `config/` files
- **Pure logic**: `game-logic.ts` has zero Phaser imports — keeps it unit-testable
- **Depth layering**: always use named constants from `config/ui.ts` (CARD_DEPTH=10, HUD_DEPTH=20, OVERLAY_DEPTH=30)

## Architecture Patterns

### Scene Communication
- **Registry** (`this.registry.set/get`) — persistent state across `scene.start()` restarts: `CURRENT_ROUND`, `TOTAL_SCORE`, `TOTAL_ROUNDS`
- **Events** (`this.scene.get(UI).events.emit(...)`) — one-shot triggers: `'roundComplete'`, `'gameOver'`

### UIScene Overlay
UIScene is launched from `GameScene.create()` via `this.scene.launch(SCENE_KEYS.UI)`. It subscribes to events in its own `create()` before any events can fire.

### Tweens Cleanup
Always register shutdown handler in GameScene:
```typescript
this.events.on('shutdown', this.handleShutdown, this);
```
Kill all tweens and cancel mismatch timers in `handleShutdown()`.

## Game Design Summary

| Round | Time Limit | Peek Duration |
|-------|-----------|---------------|
| 1     | 60s       | 1.5s          |
| 2     | 45s       | 1.0s          |
| 3     | 30s       | 0.5s          |

**Scoring**: 100 base per match + streak bonus (×50 per consecutive match, max +200) + time bonus (remaining seconds × 10) at round end.

**Card states**: `faceDown` → `flippingUp` → `faceUp` → `flippingDown` / `matched`

**8 symbols** (one per pair): `★ ♦ ♠ ♥ ✿ ♪ ▲ ●`

## Implementation Status

- ✅ Phase 1 — Project Bootstrap (structure, configs, entry, constants)
- ✅ Phase 2 — Boot + Menu Scenes
- ⬜ Phase 3 — Grid Rendering (config files, pure logic, 16 face-down cards)
- ⬜ Phase 4 — Card Flip Mechanics (tween, peek phase, pair checking)
- ⬜ Phase 5 — HUD, Timer, Scoring
- ⬜ Phase 6 — Round System + UIScene Overlays
- ⬜ Phase 7 — Polish (streak indicator, sounds, particles, animated score)

## Scope Guards (do NOT add these)

- No multiplayer
- No localStorage / high-score persistence (v1)
- No external sprite art — Graphics only
- No difficulty selection UI
- No dynamic grid size (always 4×4)
- No audio in Phases 3–6 (Phase 7 only)
