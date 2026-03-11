# Roadmap: Memory Match

## Overview

Phases 1 and 2 (Bootstrap and Boot/Menu Scenes) are already complete. This roadmap covers the remaining work to deliver a fully playable game: rendering the card grid, implementing the flip-and-compare loop, wiring up the HUD and scoring, and completing the round progression system. All 22 v1 requirements are mapped across 4 phases (3–6).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Bootstrap** - Project scaffold, toolchain, dev server confirmed running
- [x] **Phase 2: Boot + Menu Scenes** - BootScene and MenuScene complete, registry initialized
- [x] **Phase 3: Grid** - Config constants, pure game-logic functions, 16 face-down cards on canvas (gap closure in progress) (completed 2026-03-11)
- [x] **Phase 4: Flip Mechanics** - Peek phase, click-to-flip tween, match/mismatch evaluation loop (completed 2026-03-11)
- [x] **Phase 5: HUD + Scoring** - Round/score/timer HUD rendered, scoring rules applied, game-over event (completed 2026-03-11)
- [ ] **Phase 6: Round System** - UIScene overlay, round-complete and game-over panels, 3-round progression

## Phase Details

### Phase 1: Bootstrap
**Goal**: Project is runnable and the full toolchain works
**Depends on**: Nothing (first phase)
**Requirements**: (Phases 1–2 already delivered — see MEMORY_GAME_PLAN.md)
**Success Criteria** (what must be TRUE):
  1. `npm run dev` serves the game at port 8080 with no errors
  2. `npm run lint` passes with Biome enforcing tabs and single quotes
  3. `npm run test` runs the Vitest suite without failures
**Plans**: Complete

Plans:
- [x] 01-01: Scaffold Phaser 3 + TypeScript + Vite + Biome + Vitest project

### Phase 2: Boot + Menu Scenes
**Goal**: Players reach the main menu and can start a game
**Depends on**: Phase 1
**Requirements**: (Phases 1–2 already delivered — see MEMORY_GAME_PLAN.md)
**Success Criteria** (what must be TRUE):
  1. BootScene loads and transitions to MenuScene without errors
  2. MenuScene displays the game title and a PLAY button
  3. Clicking PLAY writes round=1 and score=0 to the registry and starts GameScene
**Plans**: Complete

Plans:
- [x] 02-01: Implement BootScene and MenuScene with registry initialization

### Phase 3: Grid
**Goal**: A shuffled 4x4 grid of face-down cards is rendered and centered on the canvas, backed by tested pure logic
**Depends on**: Phase 2
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-05
**Success Criteria** (what must be TRUE):
  1. All config constants exist in `config/cards.ts`, `config/grid.ts`, `config/rounds.ts`, `config/ui.ts` and are consumed without magic numbers anywhere in game code
  2. `npm run test` passes for `game-logic.test.ts` and `config/grid.test.ts`, confirming `generateCardPairs()` produces exactly 16 symbolIds (0–7 each appearing twice) and `getCardPosition()` returns correct pixel coords for all 16 indices
  3. Opening the game and clicking PLAY shows 16 face-down cards arranged in a 4x4 grid visually centered on the 1024x768 canvas
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Config files (cards, grid, rounds, ui) + game-logic.ts + Vitest tests (TDD)
- [x] 03-02-PLAN.md — GameScene renders 4x4 grid of face-down cards (human-verify checkpoint)
- [ ] 03-03-PLAN.md — Gap closure: add BG_GRADIENT_TOP/BOTTOM constants, remove inline hex literals from GameScene

### Phase 4: Flip Mechanics
**Goal**: Players can flip cards and the full match/mismatch evaluation loop works correctly
**Depends on**: Phase 3
**Requirements**: FLIP-01, FLIP-02, FLIP-03, FLIP-04, FLIP-05
**Success Criteria** (what must be TRUE):
  1. At round start, all 16 cards briefly reveal their face symbols for `peekDuration` seconds then flip back face-down automatically
  2. Clicking a face-down card plays a scaleX tween (1→0, content swap, 0→1) and reveals the card face
  3. Clicking a third card while two are being evaluated does nothing (isChecking guard is active)
  4. Two matching cards lock face-up with a de-saturated tint; two non-matching cards flip back face-down after 800ms
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Flip state machine: container interactivity, peek phase, click-to-flip tween, isChecking guard
- [ ] 04-02-PLAN.md — Match lock with tint, mismatch flip-back with delayedCall, evaluatePair() implementation

### Phase 5: HUD + Scoring
**Goal**: Players can see their round, score, and remaining time at all times, and scoring rules are enforced
**Depends on**: Phase 4
**Requirements**: HUD-01, HUD-02, HUD-03, HUD-04, HUD-05, HUD-06
**Success Criteria** (what must be TRUE):
  1. The HUD shows "Round X / 3", "Score: XXXXX", a proportionally shrinking timer bar, and a "0:XX" countdown text that all update live during play
  2. The timer bar turns red when fewer than 10 seconds remain
  3. Matching a pair increases the score by 100 base + streak bonus (50 per consecutive match, max +200); missing a pair resets the streak to 0
  4. When the countdown reaches 0, card interaction stops and a `'gameOver'` event is emitted
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — HUD positional constants + buildHud() method (round label, score display, timer bar, countdown, separator)
- [ ] 05-02-PLAN.md — Live timer (startTimer/onTick), scoring integration in evaluatePair(), game-over freeze

### Phase 6: Round System
**Goal**: A complete 3-round game loop runs end-to-end: win a round, see score breakdown, proceed or end game
**Depends on**: Phase 5
**Requirements**: ROUND-01, ROUND-02, ROUND-03, ROUND-04, ROUND-05, ROUND-06
**Success Criteria** (what must be TRUE):
  1. Matching all 8 pairs pauses the timer and emits `'roundComplete'` with round score, total score, and isLastRound flag
  2. The UIScene overlay appears (launched parallel from GameScene.create()) showing a round-complete panel with score breakdown and a "Next Round" button (or "You Win!" + "Play Again" on round 3)
  3. Timer expiry shows a game-over panel with total score and a "Try Again" button that resets registry and returns to MenuScene
  4. Round 2 starts with a 45s timer and 1.0s peek; Round 3 starts with a 30s timer and 0.5s peek
  5. Shutting down GameScene (on restart or game-over) cancels all active tweens and pending mismatch timers
**Plans**: 2 plans

Plans:
- [ ] 06-01: Win condition, time-bonus calculation, roundComplete and gameOver events
- [ ] 06-02: UIScene overlay with round-complete and game-over panels
- [ ] 06-03: Round progression (per-round config) and GameScene shutdown cleanup

## Progress

**Execution Order:**
Phases execute in numeric order: 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bootstrap | 1/1 | Complete | 2026-03-10 |
| 2. Boot + Menu Scenes | 1/1 | Complete | 2026-03-10 |
| 3. Grid | 3/3 | Complete   | 2026-03-11 |
| 4. Flip Mechanics | 2/2 | Complete   | 2026-03-11 |
| 5. HUD + Scoring | 2/2 | Complete   | 2026-03-11 |
| 6. Round System | 0/3 | Not started | - |
