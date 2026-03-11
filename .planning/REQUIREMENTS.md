# Requirements: Memory Match

**Defined:** 2026-03-10
**Core Value:** Players can flip two cards and discover whether they match — the core flip-and-compare loop must work flawlessly.

## v1 Requirements

Requirements for the complete playable game (Phases 3–6). Phases 1–2 already delivered.

### Grid

- [x] **GRID-01**: Config files exist: `config/cards.ts`, `config/grid.ts`, `config/rounds.ts`, `config/ui.ts` with all constants defined per MEMORY_GAME_PLAN.md
- [x] **GRID-02**: Pure function `generateCardPairs(8)` returns 16 shuffled symbolIds (each 0–7 appears exactly twice)
- [x] **GRID-03**: Pure function `getCardPosition(index, layout)` returns correct pixel coordinates for all 16 card indices
- [x] **GRID-04**: Unit tests pass: `game-logic.test.ts` and `config/grid.test.ts` (via `npm run test`)
- [x] **GRID-05**: 16 face-down cards rendered in a 4×4 grid, centered on the 1024×768 canvas

### Flip

- [x] **FLIP-01**: Clicking a face-down card flips it face-up using a scaleX tween (1→0, swap content, 0→1)
- [x] **FLIP-02**: Peek phase at round start: all 16 cards briefly show faces for `peekDuration` seconds, then flip back face-down
- [x] **FLIP-03**: Player can flip at most 2 cards per turn; further clicks are blocked while a pair is being evaluated (`isChecking` guard)
- [x] **FLIP-04**: If two flipped cards match, they lock face-up and receive a visual matched state (de-saturated tint)
- [x] **FLIP-05**: If two flipped cards do not match, both flip back face-down after `MISMATCH_HOLD_MS` (800ms) delay

### HUD & Scoring

- [x] **HUD-01**: HUD displays round label ("Round X / 3"), score ("Score: XXXXX"), timer bar, and timer text ("0:XX")
- [x] **HUD-02**: Countdown timer starts at `timeLimit` seconds for the current round and decrements each second
- [x] **HUD-03**: Timer bar shrinks proportionally; turns red (`TIMER_COLOR_URGENT`) when fewer than 10 seconds remain
- [x] **HUD-04**: Matching a pair awards 100 base points + streak bonus (50 per consecutive match, capped at +200)
- [x] **HUD-05**: Missing a pair resets the streak counter to 0
- [x] **HUD-06**: Timer expiry emits `'gameOver'` event and stops all card interaction

### Round System

- [x] **ROUND-01**: Winning a round (all 8 pairs matched) pauses the timer, computes time bonus (`secondsRemaining × 10`), and emits `'roundComplete'` with `{ round, roundScore, totalScore, isLastRound }`
- [ ] **ROUND-02**: UIScene launches as a parallel overlay from `GameScene.create()` and subscribes to `'roundComplete'` and `'gameOver'` events
- [ ] **ROUND-03**: Round-complete panel shows score breakdown and a "Next Round" button → restarts GameScene with incremented round (or "You Win!" + "Play Again" on final round)
- [x] **ROUND-04**: Game-over panel shows total score and a "Try Again" button → resets registry and returns to MenuScene
- [x] **ROUND-05**: Round 2 uses 45s timer and 1.0s peek; Round 3 uses 30s timer and 0.5s peek
- [x] **ROUND-06**: GameScene registers a `'shutdown'` handler that kills all tweens and cancels any pending mismatch timers

## v2 Requirements

Deferred to Phase 7 polish. Not in current roadmap phases.

### Polish

- **POLISH-01**: Streak indicator — flash text ("2× STREAK!" etc.) when a consecutive match is made
- **POLISH-02**: Card-flip sound effect (synthesized via WebAudioContext or loaded SFX)
- **POLISH-03**: Match sound effect
- **POLISH-04**: Particle burst on successful match (Phaser built-in ParticleEmitter)
- **POLISH-05**: Animated score counter — tween the score number up when it changes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiplayer | Single-player only by design |
| localStorage / high-score board | Deferred; not core to v1 loop |
| External sprite/texture art | All rendering via Phaser.Graphics |
| Difficulty selection on menu | Progression is round-based; no user config needed |
| Dynamic grid sizes | Always 4×4; scope guard from MEMORY_GAME_PLAN.md |
| Audio in Phases 3–6 | Sound added only in Phase 7 polish |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GRID-01 | Phase 3 | Complete |
| GRID-02 | Phase 3 | Complete |
| GRID-03 | Phase 3 | Complete |
| GRID-04 | Phase 3 | Complete |
| GRID-05 | Phase 3 | Complete |
| FLIP-01 | Phase 4 | Complete |
| FLIP-02 | Phase 4 | Complete |
| FLIP-03 | Phase 4 | Complete |
| FLIP-04 | Phase 4 | Complete |
| FLIP-05 | Phase 4 | Complete |
| HUD-01 | Phase 5 | Complete |
| HUD-02 | Phase 5 | Complete |
| HUD-03 | Phase 5 | Complete |
| HUD-04 | Phase 5 | Complete |
| HUD-05 | Phase 5 | Complete |
| HUD-06 | Phase 5 | Complete |
| ROUND-01 | Phase 6 | Complete |
| ROUND-02 | Phase 6 | Pending |
| ROUND-03 | Phase 6 | Pending |
| ROUND-04 | Phase 6 | Complete |
| ROUND-05 | Phase 6 | Complete |
| ROUND-06 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after Phase 3 Plan 02 completion (GRID-05 complete)*
