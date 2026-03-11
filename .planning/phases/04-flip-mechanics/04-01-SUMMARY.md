---
phase: 04-flip-mechanics
plan: 01
subsystem: ui
tags: [phaser3, typescript, tween, state-machine, card-flip, peek-phase]

# Dependency graph
requires:
  - phase: 03-grid
    provides: GameScene with 16 face-down cards in containers, buildGrid(), CardData type, generateCardPairs()
provides:
  - Flip state machine in GameScene: isChecking guard, flippedIndices tracking, mismatchTimer slot
  - showCardFace / showCardBack child-visibility helpers
  - flipCardUp() two-step scaleX tween (1→0→1) with state transitions
  - flipCardDown() two-step scaleX tween (1→0→1) with state reset (stub for plan 04-02)
  - handleCardClick() with three guards (isChecking, non-faceDown, duplicate-index)
  - startPeekPhase() reading peekDuration from ROUND_CONFIGS via registry round
  - handleShutdown() killing all tweens and cancelling mismatch timer
  - evaluatePair() stub (fully implemented in plan 04-02)
  - Container interactivity: setSize + setInteractive + pointerdown on each card in buildGrid()
affects: [04-02-pair-evaluation, 05-hud-timer-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Two-step scaleX tween pattern for card flip (1→0 with face-swap at midpoint, 0→1)
    - isChecking boolean as global evaluation lock preventing third-card clicks
    - startPeekPhase reads REGISTRY_KEYS.CURRENT_ROUND to look up ROUND_CONFIGS[round-1].peekDuration
    - shutdown handler pattern: events.on('shutdown') + tweens.killAll() + timer.remove()
    - Container interactivity: setSize() before setInteractive() (Containers have no default input bounds)

key-files:
  created: []
  modified:
    - src/game/scenes/GameScene.ts

key-decisions:
  - "flipCardDown referenced via void this.flipCardDown.bind(this) in evaluatePair stub to satisfy noUnusedLocals until plan 04-02 implements evaluatePair"
  - "state reset in create() for isChecking/flippedIndices/mismatchTimer ensures clean restart on scene.start()"
  - "evaluatePair() called from inside flipCardUp second tween onComplete (after card is fully faceUp), not from handleCardClick"

patterns-established:
  - "Two-step scaleX tween: first tween 1→0 sets flippingUp/flippingDown, onComplete swaps face, second tween 0→1 sets faceUp/faceDown"
  - "isChecking guard blocks all clicks during peek phase AND during two-card evaluation window"
  - "startPeekPhase sets isChecking=true immediately, clears to false after delayedCall completes"

requirements-completed: [FLIP-01, FLIP-02, FLIP-03]

# Metrics
duration: 7min
completed: 2026-03-11
---

# Phase 4 Plan 01: Flip State Machine Summary

**Interactive card flip with two-step scaleX tween, peek-phase reveal using ROUND_CONFIGS peekDuration, and isChecking guard blocking illegal third-card clicks**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-11T09:34:38Z
- **Completed:** 2026-03-11T09:41:00Z
- **Tasks:** 1 of 2 auto-executed (Task 2 is checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments

- Added flip state machine class properties (isChecking, flippedIndices, mismatchTimer) to GameScene
- Wired container interactivity (setSize + setInteractive + pointerdown) inside buildGrid() loop
- Implemented showCardFace/showCardBack helpers toggling 4 container children by index
- Implemented flipCardUp() with two-step scaleX tween sequence and evaluatePair() trigger
- Implemented flipCardDown() with two-step scaleX tween sequence and isChecking reset (stub-ready for plan 04-02)
- Implemented handleCardClick() with three guards: isChecking lock, non-faceDown check, duplicate-index check
- Implemented startPeekPhase() using ROUND_CONFIGS peekDuration from registry round number
- Implemented handleShutdown() cancelling tweens and mismatch timer
- Registered shutdown handler and peek phase call at end of create()

## Task Commits

Each task was committed atomically:

1. **Task 1: Add class properties, container interactivity, and helper methods** - `3d1667e` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `src/game/scenes/GameScene.ts` - Extended with full flip state machine: 9 new private methods, 3 new class properties, interactivity wiring in buildGrid(), shutdown+peek registration in create()

## Decisions Made

- **flipCardDown stub reference**: `void this.flipCardDown.bind(this)` in the evaluatePair() stub satisfies `noUnusedLocals` TypeScript strict mode without importing unused symbols or breaking the contract. Plan 04-02 replaces this with real implementation.
- **State reset in create()**: isChecking, flippedIndices, and mismatchTimer are explicitly reset in create() to ensure clean state on scene restart (scene.start() is called between rounds in the round system).
- **evaluatePair() trigger location**: Pair evaluation is triggered from inside flipCardUp()'s second tween onComplete — after the card is fully face-up — not from handleCardClick(). This ensures both cards are visually revealed before pair logic runs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `void this.flipCardDown.bind(this)` in evaluatePair() stub**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** TypeScript `noUnusedLocals` error TS6133 — `flipCardDown` declared but never read. Plan said not to import symbols unused in this plan; same principle applies to private methods.
- **Fix:** Added `void this.flipCardDown.bind(this)` inside the evaluatePair() stub body. This is a no-op at runtime, satisfies TypeScript's usage check, and is replaced when plan 04-02 implements evaluatePair() fully.
- **Files modified:** src/game/scenes/GameScene.ts
- **Verification:** `npx tsc --noEmit` exits 0; `npm run lint` exits 0; `npm run test` 14/14 pass
- **Committed in:** 3d1667e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — TypeScript noUnusedLocals)
**Impact on plan:** Minimal — the fix is a no-op at runtime and maintains strict TypeScript compliance as required by CLAUDE.md.

## Issues Encountered

None beyond the auto-fixed TypeScript noUnusedLocals issue above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Task 2 (checkpoint:human-verify) is pending visual verification in browser
- After human verification, plan 04-02 (pair evaluation: isMatch, match/mismatch handling, flippedIndices reset) can proceed
- flipCardDown() and mismatchTimer are fully implemented and ready for plan 04-02 to wire into evaluatePair()

---

*Phase: 04-flip-mechanics*
*Completed: 2026-03-11*

## Self-Check: PASSED

- `src/game/scenes/GameScene.ts` exists and contains all required methods
- Commit `3d1667e` exists in git log
- `npm run test`: 14/14 passed
- `npm run lint`: 0 errors, 0 warnings (exit 0)
- `npx tsc --noEmit`: exit 0
