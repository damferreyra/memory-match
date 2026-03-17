---
phase: quick
plan: 260317-phv
subsystem: ui
tags: [phaser3, typescript, tweens, game-loop, race-condition]

# Dependency graph
requires:
  - phase: 04-flip-mechanics
    provides: flipCardDown tween, isChecking guard, mismatch evaluation loop
provides:
  - pendingFlipDowns counter guard ensuring isChecking clears only after both flip-down animations complete
affects: [GameScene, mismatch evaluation, card interaction]

# Tech tracking
tech-stack:
  added: []
  patterns: [counter-based animation completion guard for parallel tweens]

key-files:
  created: []
  modified:
    - src/game/scenes/GameScene.ts

key-decisions:
  - "pendingFlipDowns counter (not a boolean flag) is the correct primitive — two parallel tweens need independent completion tracking before a shared state change"
  - "Counter is set to 2 inside the delayedCall callback (not in evaluatePair directly) so it is always paired with the two flipCardDown calls it guards"

patterns-established:
  - "Parallel tween completion guard: set counter = N before launching N parallel tweens; each tween decrements and only the last one (counter <= 0) triggers the shared state change"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-17
---

# Quick Fix 260317-phv: Double-Flip Race Condition Summary

**Counter-based pendingFlipDowns guard in GameScene ensures isChecking only clears after both mismatch flip-down animations complete, eliminating the rapid-click double-animation bug.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-17T18:24:00Z
- **Completed:** 2026-03-17T18:29:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Identified root cause: the first of two parallel flipCardDown tweens was unconditionally setting `isChecking = false`, allowing clicks before the second card's animation finished
- Added `private pendingFlipDowns = 0` field, reset in `create()` each round
- Set `pendingFlipDowns = 2` in evaluatePair mismatch branch before both flipCardDown calls
- Replaced unconditional `this.isChecking = false` with counter decrement + conditional clear in flipCardDown inner tween onComplete
- Build, lint (Biome), and all 14 Vitest unit tests pass clean

## Task Commits

1. **Task 1: Diagnose and fix the double-flip race condition in flipCardDown** - `f36fb3e` (fix)

## Files Created/Modified
- `src/game/scenes/GameScene.ts` - Added pendingFlipDowns field, wired counter in evaluatePair mismatch branch and flipCardDown onComplete

## Decisions Made
- Counter set inside the `delayedCall` callback (not at the evaluatePair call site) so it is always co-located with and immediately preceding the two `flipCardDown` calls it guards — clearer intent and no risk of stale value if the callback is cancelled before firing.
- `pendingFlipDowns <= 0` (not `=== 0`) as the condition, so any unexpected extra decrement cannot leave `isChecking` stuck true permanently.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- First Edit attempt used space indentation in the old_string for the evaluatePair block; the file uses tabs (Biome-enforced). Second attempt with correct tab characters succeeded immediately.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Card interaction loop is now race-condition-free; ready to continue Phase 6 Plan 02 (UIScene overlays) without this latent bug.

---
*Phase: quick*
*Completed: 2026-03-17*

## Self-Check: PASSED
- `src/game/scenes/GameScene.ts` — FOUND
- Commit `f36fb3e` — FOUND
