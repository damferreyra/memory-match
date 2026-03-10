---
phase: 03-grid
plan: 01
subsystem: game-logic
tags: [typescript, vitest, phaser3, config, pure-functions, tdd]

# Dependency graph
requires:
  - phase: 01-bootstrap
    provides: constants.ts with GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, REGISTRY_KEYS
  - phase: 02-boot-menu
    provides: scene infrastructure and registry patterns

provides:
  - config/cards.ts — card visual constants, SYMBOLS array, SYMBOL_COLORS
  - config/grid.ts — GRID_LAYOUT, getCardPosition() pure function
  - config/rounds.ts — RoundConfig interface, ROUND_CONFIGS (3 rounds)
  - config/ui.ts — depth constants, HUD/timer/overlay sizes, scoring constants
  - game-logic.ts — CardState type, CardData interface, shuffle, generateCardPairs, isMatch, computeMatchScore, computeTimeBonus
  - game-logic.test.ts — 10 Vitest tests covering all pure functions
  - config/grid.test.ts — 4 Vitest tests covering getCardPosition bounds and uniqueness

affects:
  - 03-grid-02 (GameScene grid rendering uses GRID_LAYOUT and getCardPosition)
  - 04-flip-mechanics (flip logic uses CardState, CardData, computeMatchScore)
  - 05-hud-timer (HUD uses ui.ts constants, timer uses ROUND_CONFIGS)
  - 06-round-system (UIScene uses ROUND_CONFIGS, computeTimeBonus)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure module pattern — game-logic.ts has zero Phaser imports enabling Vitest testing without mocking
    - Config isolation — all card sizes, colors, depths, timings in config/ files
    - TDD red-green cycle — tests written before implementation, committed separately

key-files:
  created:
    - src/game/config/cards.ts
    - src/game/config/grid.ts
    - src/game/config/rounds.ts
    - src/game/config/ui.ts
    - src/game/game-logic.ts
    - src/game/game-logic.test.ts
    - src/game/config/grid.test.ts
    - .gitignore
  modified: []

key-decisions:
  - "game-logic.ts imports only from ./config/ui — zero Phaser imports keeps tests fast and dependency-free"
  - "getCardPosition() lives in config/grid.ts (not game-logic.ts) — colocated with GRID_LAYOUT constant it operates on"
  - "GRID_ORIGIN_X computed as formula (= 214) rather than hardcoded — self-documenting and auto-updates if CARD_WIDTH changes"

patterns-established:
  - "Pure module pattern: game-logic.ts has zero Phaser imports so Vitest can test it without mocking"
  - "Config isolation: all card sizes, colors, depths, timings in config/ files — no magic numbers in scene code"
  - "TDD: RED commit (failing tests) then GREEN commit (implementation) — two separate commits per TDD cycle"
  - "Hex integers for all colors: 0xRRGGBB — never CSS color strings"

requirements-completed: [GRID-01, GRID-02, GRID-03, GRID-04]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 3 Plan 01: Config Modules and Pure Game Logic Summary

**Four TypeScript config modules and a pure game-logic module with 14 passing Vitest tests, establishing the data layer for all Phase 3-6 rendering and mechanics.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T20:24:50Z
- **Completed:** 2026-03-10T20:27:01Z
- **Tasks:** 2
- **Files modified:** 8 created, 1 modified (.gitignore new)

## Accomplishments
- All four config modules created with exact values from MEMORY_GAME_PLAN.md (no deviations)
- game-logic.ts implements shuffle, generateCardPairs, isMatch, computeMatchScore, computeTimeBonus with zero Phaser imports
- 14 Vitest tests pass: 10 in game-logic.test.ts + 4 in config/grid.test.ts
- GRID_ORIGIN_X = 214 verified by formula: (1024 - 4×140 - 3×12) / 2 = 214
- SYMBOLS array has exactly 8 entries matching the spec

## Task Commits

Each task was committed atomically:

1. **Task 1: Config modules (cards, grid, rounds, ui)** - `41f5676` (feat)
2. **Task 2: game-logic.test.ts and grid.test.ts (RED)** - `5c56d70` (test)
3. **Task 2: game-logic.ts implementation (GREEN)** - `47a7cc2` (feat)

_Note: TDD task 2 has two commits: RED (failing tests) then GREEN (implementation)_

## Files Created/Modified
- `src/game/config/cards.ts` — CARD_WIDTH/HEIGHT=140, SYMBOLS as const, SYMBOL_COLORS record, card visual constants
- `src/game/config/grid.ts` — GRID_COLS/ROWS=4, GRID_GAP=12, computed GRID_ORIGIN_X=214, GridLayout interface, getCardPosition()
- `src/game/config/rounds.ts` — RoundConfig interface, ROUND_CONFIGS array with 3 entries (60/1.5s, 45/1.0s, 30/0.5s)
- `src/game/config/ui.ts` — depth constants (10/20/30), HUD sizes, timer colors, overlay sizes, flip/scoring timing constants
- `src/game/game-logic.ts` — CardState type, CardData interface, shuffle/generateCardPairs/isMatch/computeMatchScore/computeTimeBonus
- `src/game/game-logic.test.ts` — 10 Vitest tests for all pure logic functions
- `src/game/config/grid.test.ts` — 4 Vitest tests for getCardPosition bounds and uniqueness
- `.gitignore` — created (required by biome.json useIgnoreFile:true setting)

## Decisions Made
- `getCardPosition()` placed in `config/grid.ts` (colocated with `GRID_LAYOUT`) rather than in `game-logic.ts`
- `GRID_ORIGIN_X` computed via formula rather than hardcoded to self-document and stay in sync if card dimensions change
- `game-logic.ts` imports only scoring constants from `./config/ui` — zero Phaser dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing .gitignore file**
- **Found during:** Task 1 verification (npm run lint)
- **Issue:** biome.json has `"useIgnoreFile": true` under vcs settings, but no .gitignore existed — Biome exited with configuration error
- **Fix:** Created `.gitignore` with standard entries (node_modules/, dist/, .DS_Store)
- **Files modified:** .gitignore (created)
- **Verification:** npm run lint passes after fix (15 files checked, no errors)
- **Committed in:** 41f5676 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The .gitignore creation was required for Biome to run at all. No scope creep — standard project file.

## Issues Encountered
None beyond the .gitignore blocking issue (handled via Rule 3 auto-fix above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All config constants are committed and lint-clean — ready for GameScene grid rendering (Plan 02)
- game-logic.ts exports are stable: shuffle, generateCardPairs, isMatch, computeMatchScore, computeTimeBonus
- getCardPosition() and GRID_LAYOUT are ready to use in GameScene.create() buildGrid() method
- ROUND_CONFIGS ready for GameScene to read current round config via registry

---
*Phase: 03-grid*
*Completed: 2026-03-10*
