---
phase: 06-round-system
plan: 01
subsystem: ui
tags: [phaser3, typescript, rounds, scoring, events]

# Dependency graph
requires:
  - phase: 05-hud-scoring
    provides: Live HUD with timer, score, and game-over event
provides:
  - Round win detection in GameScene based on all cards matched
  - Per-round score tracking including time bonus application
  - Enriched roundComplete and gameOver events with score payloads
  - Robust timer and mismatch timer cleanup on scene shutdown
affects: [06-round-system, 07-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Round completion helper checkForRoundCompletion() funnels match evaluation into a dedicated handleRoundWin() handler"
    - "Time bonus computed via computeTimeBonus(timeRemaining) and applied to both roundScore and TOTAL_SCORE in the registry"
    - "Event payloads use strongly typed objects for roundComplete and gameOver, carrying totalScore and isLastRound flags"

key-files:
  created: []
  modified:
    - src/game/scenes/GameScene.ts

key-decisions:
  - "checkForRoundCompletion() centralizes round win detection and delegates to handleRoundWin(), keeping evaluatePair() focused on per-pair logic"
  - "TOTAL_ROUNDS in the registry is optional; handleRoundWin() falls back to ROUND_CONFIGS.length when absent to determine isLastRound"
  - "isChecking remains true after a round win so further card clicks are blocked until UIScene handles the transition"

patterns-established:
  - "Round advancement pattern: CURRENT_ROUND read from registry and incremented only after emitting roundComplete when a non-final round is won"
  - "Timer cleanup pattern reused for round wins and timer expiry: timerEvent?.remove(false) followed by null assignment"

requirements-completed: [ROUND-01, ROUND-04, ROUND-05, ROUND-06]

# Metrics
duration: ~10min
completed: 2026-03-11
---

# Phase 6 Plan 01: Round Win and Events Summary

**GameScene now tracks per-round score, applies a time-based bonus on round win, and emits enriched roundComplete and gameOver events while ensuring all round-related timers are cleaned up on restart**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-11T18:30:00Z
- **Completed:** 2026-03-11T18:40:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `roundScore` tracking to `GameScene`, resetting at the start of each round and accumulating only on successful matches
- Introduced `checkForRoundCompletion()` to detect when all cards are matched and delegate to `handleRoundWin()`
- Implemented `handleRoundWin()` to stop the countdown, compute and apply a time bonus via `computeTimeBonus(timeRemaining)`, advance `CURRENT_ROUND` when appropriate, and emit a strongly typed `roundComplete` event with `{ round, roundScore, totalScore, isLastRound }`
- Enriched `onTimeExpired()` to emit a `gameOver` event carrying `{ totalScore }`, while preserving timer cancellation and click blocking semantics
- Confirmed that existing mismatch and timer shutdown logic still cancels `mismatchTimer` and `timerEvent` via `handleShutdown()`, preventing leaked ticks across scene restarts

## Task Commits

Each task was committed atomically:

1. **Task 1: Track per-round score and detect round completion in GameScene** - `df1ba07` (feat)
2. **Task 2: Apply time bonus, emit enriched events, and harden shutdown cleanup** - `676245e` (feat)

**Plan metadata:** (docs commit — see final commit below)

## Files Created/Modified

- `src/game/scenes/GameScene.ts` - Extended with roundScore tracking, round completion helper, time bonus application, enriched event payloads, and reuse of existing timer cleanup patterns

## Decisions Made

- checkForRoundCompletion() is responsible for deciding whether the round is complete; it leaves `isChecking` false only when more matches remain, and lets handleRoundWin() set it true on round completion
- time bonus is applied only when positive, ensuring no accidental score reduction on edge cases where timeRemaining could be 0 when the last match is made
- isLastRound is computed using either `TOTAL_ROUNDS` from the registry or `ROUND_CONFIGS.length`, so future changes in round count require no scene code edits

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Round win and game-over events now expose the full payloads UIScene needs for overlays in 06-02
- Registry round advancement is in place; UIScene can restart GameScene using updated `CURRENT_ROUND` while relying on TOTAL_SCORE for cumulative scoring
- `npm run test` and `npm run lint` both pass cleanly with the new round system logic in place

---
*Phase: 06-round-system*
*Completed: 2026-03-11*

