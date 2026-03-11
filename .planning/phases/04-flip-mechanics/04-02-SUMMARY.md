---
phase: 04-flip-mechanics
plan: 02
subsystem: ui
tags: [phaser3, typescript, tween, state-machine, card-flip, pair-evaluation, match-lock, mismatch-timer]

# Dependency graph
requires:
  - phase: 04-flip-mechanics-01
    provides: flip state machine (isChecking, flippedIndices, mismatchTimer), flipCardDown(), flipCardUp(), evaluatePair() stub, handleShutdown()
provides:
  - evaluatePair() fully implemented: isMatch() call, match branch locks both cards with CARD_MATCHED_TINT and clears flippedIndices, mismatch branch schedules flipCardDown via time.delayedCall stored in mismatchTimer
  - tintContainer() helper: applies tint to each container child that supports setTint (workaround for Container lacking Tint component in Phaser TS types)
  - Complete flip-and-compare game loop: peek phase → click-to-flip → pair evaluation → match lock or mismatch flip-back → ready for next flip
affects: [05-hud-timer-scoring, 06-round-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - evaluatePair() split between match branch (immediate reset) and mismatch branch (deferred reset via delayedCall)
    - tintContainer() helper pattern for applying tint to Container children (Container omits Tint component from TypeScript interface)
    - mismatchTimer stored as class property so handleShutdown() can cancel it with remove(false)

key-files:
  created: []
  modified:
    - src/game/scenes/GameScene.ts

key-decisions:
  - "tintContainer() helper iterates container children with runtime setTint check — Phaser.GameObjects.Container lacks setTint in its TypeScript type definition (omits Tint component from implements list), so direct container.setTint() causes TS2339 error under strict mode"
  - "isChecking reset timing differs between branches: immediate in match branch, deferred to flipCardDown.onComplete in mismatch branch — isChecking must stay true during the 800ms hold delay to block third-card clicks"
  - "flippedIndices cleared inside delayedCall callback (not before) to ensure indexA/indexB are available for flipCardDown calls via closure capture"

patterns-established:
  - "tintContainer() pattern: iterate container.each() with runtime 'setTint' in child duck-type check to avoid TypeScript type gaps in Phaser Container API"
  - "Deferred state reset pattern: mismatch branch resets flippedIndices inside delayedCall, isChecking inside flipCardDown.onComplete — both deferred to after visual transition completes"

requirements-completed: [FLIP-04, FLIP-05]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 4 Plan 02: Pair Evaluation Summary

**evaluatePair() fully implemented with isMatch(), grey CARD_MATCHED_TINT match lock, and 800ms MISMATCH_HOLD_MS delayedCall flip-back — completing the flip-and-compare game loop**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T13:11:03Z
- **Completed:** 2026-03-11T13:15:00Z
- **Tasks:** 1 of 2 (Task 1 auto-executed; Task 2 checkpoint:human-verify — awaiting approval)
- **Files modified:** 1

## Accomplishments

- Added `isMatch` import from `game-logic`, `CARD_MATCHED_TINT` from `config/cards`, `MISMATCH_HOLD_MS` from `config/ui`
- Replaced evaluatePair() stub with full implementation: match branch locks cards as `'matched'` and applies grey tint; mismatch branch schedules flip-back via `time.delayedCall` stored in `mismatchTimer`
- Added `tintContainer()` helper to iterate container children and apply tint — necessary because `Phaser.GameObjects.Container` does not implement the Tint component in its TypeScript type definition
- All verification checks pass: `npm run test` 14/14, `npm run lint` 0 errors, `npx tsc --noEmit` exit 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement evaluatePair() — match lock and mismatch scheduling** - `b5a33b0` (feat)
2. **Task 2: Verify match lock, mismatch flip-back, and full game loop** - checkpoint:human-verify (awaiting)

## Files Created/Modified

- `src/game/scenes/GameScene.ts` - Added tintContainer() helper, implemented evaluatePair() with isMatch/setTint/delayedCall, added 3 new imports (isMatch, CARD_MATCHED_TINT, MISMATCH_HOLD_MS)

## Decisions Made

- **tintContainer() helper instead of container.setTint()**: Phaser.GameObjects.Container omits the Tint component from its TypeScript `implements` list, so `container.setTint()` causes TS2339 under strict mode. The helper iterates children with a runtime duck-type check, applying tint only to children that expose `setTint`. This is functionally equivalent to the plan's intent (grey desaturation of matched cards) while satisfying TypeScript strict mode.
- **isChecking reset timing**: In the match branch, `isChecking = false` is set immediately after locking both cards — no animation is pending so new clicks can proceed instantly. In the mismatch branch, `isChecking` is NOT reset here — it remains `true` through the 800ms delay and through the flipCardDown tween, only resetting inside flipCardDown's second `onComplete`. This prevents any clicks during the hold and animation window.
- **flippedIndices cleared in delayedCall closure**: The mismatch branch clears `flippedIndices = []` inside the `delayedCall` callback rather than immediately. `indexA` and `indexB` are captured by the closure from the destructured constants, so the callback correctly calls `flipCardDown(indexA)` and `flipCardDown(indexB)` after the delay.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added tintContainer() helper — Container.setTint() causes TS2339 under strict mode**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `Phaser.GameObjects.Container` does not include the `Tint` component in its TypeScript type definition. Calling `container.setTint(CARD_MATCHED_TINT)` produces `error TS2339: Property 'setTint' does not exist on type 'Container'`.
- **Fix:** Added `tintContainer(container, tint)` private method that iterates `container.each()` and applies tint to each child via runtime duck-type check. This achieves the same visual result (grey de-saturation of all card children) while satisfying TypeScript strict mode.
- **Files modified:** src/game/scenes/GameScene.ts
- **Verification:** `npx tsc --noEmit` exits 0; `npm run lint` exits 0; `npm run test` 14/14 pass
- **Committed in:** b5a33b0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — TypeScript TS2339 type error on Container.setTint)
**Impact on plan:** Minimal — visual result is identical. The tintContainer() helper iterates children and applies tint individually, producing the same grey de-saturation on matched cards. No behavior change.

## Issues Encountered

One TypeScript strict mode error discovered during verification: `container.setTint()` is not in Phaser Container's type definition. Resolved with tintContainer() helper (Rule 1 auto-fix).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04-02 Task 1 complete — evaluatePair() fully implemented and verified by automated checks
- Task 2 (checkpoint:human-verify) requires browser verification of match lock, mismatch flip-back, and isChecking guard
- After human-verify approval: Phase 4 complete, Phase 5 (HUD, Timer, Scoring) can proceed
- flipCardDown() mismatchTimer cancellation in handleShutdown() is fully wired and ready

---
*Phase: 04-flip-mechanics*
*Completed: 2026-03-11*

## Self-Check: PASSED

- `src/game/scenes/GameScene.ts` exists and contains evaluatePair() with isMatch(), tintContainer(), time.delayedCall()
- Commit `b5a33b0` exists in git log
- `npm run test`: 14/14 passed
- `npm run lint`: 0 errors (exit 0)
- `npx tsc --noEmit`: exit 0
