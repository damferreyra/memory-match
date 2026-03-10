# Memory Match

## What This Is

A single-player browser-based memory matching game built with Phaser 3 + TypeScript + Vite. Players flip cards in a 4×4 grid to find matching pairs before a countdown timer expires, across 3 progressively harder rounds. No external art — all cards are rendered with Phaser.Graphics.

## Core Value

Players can flip two cards and discover whether they match — the core flip-and-compare loop must work flawlessly before anything else matters.

## Requirements

### Validated

- ✓ Project bootstrapped (Phaser 3 + TypeScript + Vite + Biome + Vitest, port 8080) — Phase 1
- ✓ BootScene preloads and transitions to MenuScene — Phase 2
- ✓ MenuScene renders title + Play button, initializes registry (round=1, score=0), starts GameScene — Phase 2

### Active

- [ ] 4×4 grid of 16 face-down cards rendered and centered on canvas
- [ ] Pure logic: `generateCardPairs()`, `shuffle()`, `getCardPosition()` — tested with Vitest
- [ ] Cards flip face-up/face-down with scaleX tween animation
- [ ] Peek phase at round start (all cards briefly show faces, then flip back)
- [ ] Click handler tracks two flipped cards with `isChecking` guard
- [ ] Match: cards lock face-up, score awarded, win condition checked
- [ ] No-match: cards flip back after `MISMATCH_HOLD_MS` delay, streak resets
- [ ] HUD: round label, score text, timer bar (shrinks, turns red < 10s), timer text
- [ ] Countdown timer expires → emit `'gameOver'`
- [ ] Scoring: 100 base + streak bonus (capped +200) + time bonus (remaining × 10)
- [ ] UIScene overlay: subscribes to `'roundComplete'` and `'gameOver'`
- [ ] Round-complete panel: score breakdown, "Next Round" / "You Win!" button
- [ ] Game-over panel: final score, "Try Again" button
- [ ] 3-round progression (60s/1.5s peek → 45s/1.0s → 30s/0.5s)
- [ ] Tweens/timers cleaned up on scene shutdown
- [ ] Phase 7 polish: streak indicator, flip sound, match sound, particle burst on match, animated score counter

### Out of Scope

- Multiplayer — single player only
- High-score persistence (no localStorage in v1)
- Sprite/texture art — all Graphics-drawn
- Difficulty selection on menu — round-based progression only
- Dynamic grid sizes — always 4×4
- Sound in Phases 3–6 (Phase 7 only)

## Context

- Stack: Phaser 3 · TypeScript · Vite · Biome (formatter/linter) · Vitest (unit tests)
- Port: 8080 (`npm run dev`)
- All colors: hex integers (`0xRRGGBB`) — never CSS strings
- All string keys via enums: `SCENE_KEYS`, `REGISTRY_KEYS`, `ASSET_KEYS`
- No magic numbers — all constants in `config/`
- Pure logic (`game-logic.ts`) has zero Phaser imports — fully unit-testable
- UIScene launched as parallel overlay from `GameScene.create()`, listens before events fire
- Phaser registry for persistent state across scene restarts (round number, total score)
- Events (`'roundComplete'`, `'gameOver'`) for one-shot triggers
- Phase 1 and Phase 2 from MEMORY_GAME_PLAN.md are already implemented

## Constraints

- **Tech stack**: Phaser 3 + TypeScript — no framework changes
- **No external art**: all rendering via `Phaser.GameObjects.Graphics` + `Text`
- **Biome**: tab indentation, single quotes — enforced via `npm run lint`
- **No sound Phases 3–6**: audio deferred to Phase 7 polish only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Always 4×4 grid | Simplicity; difficulty via time/peek only | — Pending |
| UIScene as overlay | Decouples UI from game state machine | — Pending |
| Pure game-logic module | Enables Vitest unit tests without Phaser mock | — Pending |
| Registry for round/score | Survives scene.start() restarts | — Pending |

---
*Last updated: 2026-03-10 after initialization*
