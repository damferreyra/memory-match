---
phase: 05-hud-scoring
plan: 01
subsystem: ui
tags: [phaser3, typescript, hud, timer-bar, score-display]

# Dependency graph
requires:
  - phase: 04-flip-mechanics
    provides: GameScene with flip state machine, private fields, and create() lifecycle
provides:
  - HUD positional/visual constants in config/ui.ts (HUD_TEXT_Y, HUD_ROUND_X, HUD_SCORE_X, HUD_BAR_Y, HUD_COUNTDOWN_Y, HUD_BAR_BG_COLOR, HUD_BAR_BG_ALPHA)
  - GameScene.buildHud() rendering a static HUD strip with round label, score, timer bar, countdown text, and separator line
  - Three private HUD fields on GameScene (scoreText, countdownText, timerBarFill) ready for live updates in Plan 02
affects:
  - 05-02: live timer and scoring logic will animate the three HUD fields built here

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "HUD positional constants grouped at end of config/ui.ts — all positions from named imports, zero magic numbers in scene code"
    - "definite-assignment (!) on private HUD fields set in buildHud() — satisfies strict null checks without requiring | null"

key-files:
  created: []
  modified:
    - src/game/config/ui.ts
    - src/game/scenes/GameScene.ts

key-decisions:
  - "HUD positional constants appended to config/ui.ts without modifying existing constants — keeps all layout values co-located and avoids import cycles by using literal 1004 for HUD_SCORE_X"
  - "buildHud() called after drawBackground() and before buildGrid() in GameScene.create() — ensures correct z-order: background < HUD < cards"
  - "Timer bar fill uses origin (0, 0.5) positioned at left edge of bar area — Plan 02 can shrink it by changing width directly without repositioning"

patterns-established:
  - "HUD construction pattern: buildHud() reads registry for initial values, creates all display objects once, stores mutable refs as private fields"
  - "Text color '#ffffff' string only inside Phaser Text style objects — all Graphics/Rectangle color arguments remain hex integers 0xRRGGBB"

requirements-completed: [HUD-01]

# Metrics
duration: ~10min
completed: 2026-03-11
---

# Phase 5 Plan 01: HUD Scoring Summary

**Static HUD strip built in GameScene with round label, score display, green timer bar, countdown text, and separator line — all positioned from named constants, ready for live animation in Plan 02**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-11 (session with human checkpoint)
- **Completed:** 2026-03-11T14:49:35Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 2

## Accomplishments

- `config/ui.ts` gains 7 new HUD positional and visual constants with no existing constants modified
- `GameScene.buildHud()` renders the full HUD strip: "Round X / 3" left-aligned, "Score: 0" right-aligned, green timer bar centered, "1:00" countdown text below the bar, thin separator line
- Three private fields (`scoreText`, `countdownText`, `timerBarFill`) exist on GameScene with definite-assignment assertions, ready for Plan 02 to animate
- Human visually verified correct layout at checkpoint — approved with no issues

## Task Commits

Each task was committed atomically:

1. **Task 1: Add HUD positional constants to config/ui.ts** - `071f795` (feat)
2. **Task 2: Add buildHud() and HUD object fields to GameScene** - `be4f17c` (feat)
3. **Task 3: Checkpoint — Verify static HUD layout** - `d8cd1cf` (chore — checkpoint approved)

**Plan metadata:** (docs commit — see final commit below)

## Files Created/Modified

- `src/game/config/ui.ts` — Added 7 HUD layout constants: HUD_TEXT_Y, HUD_ROUND_X, HUD_SCORE_X, HUD_BAR_Y, HUD_COUNTDOWN_Y, HUD_BAR_BG_COLOR, HUD_BAR_BG_ALPHA
- `src/game/scenes/GameScene.ts` — Added buildHud() method, three private HUD fields, call site in create()

## Decisions Made

- HUD_SCORE_X uses literal `1004` (= GAME_WIDTH - 20) instead of a computed import to avoid potential circular dependency between config files — the comment documents the derivation
- Timer bar fill origin set to `(0, 0.5)` at the left edge of the bar area so Plan 02 can shrink width rightward without repositioning the rectangle
- buildHud() called between drawBackground() and buildGrid() to maintain the intended depth order: background renders first, HUD elements at depth 20 sit above cards at depth 10

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three HUD display fields exist and are initialised with correct starting values
- Plan 02 can immediately wire `this.time.addEvent` countdown, `scoreText.setText()` on match, and `timerBarFill.width` scaling — no structural changes needed
- `npm run test` and `npm run lint` both pass cleanly

---
*Phase: 05-hud-scoring*
*Completed: 2026-03-11*

## Self-Check: PASSED

- FOUND: .planning/phases/05-hud-scoring/05-01-SUMMARY.md
- FOUND: commit 071f795 (feat: HUD positional constants)
- FOUND: commit be4f17c (feat: buildHud and HUD fields)
- FOUND: commit d8cd1cf (chore: checkpoint approved)
