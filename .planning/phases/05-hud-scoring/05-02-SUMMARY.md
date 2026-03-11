---
phase: 05-hud-scoring
plan: 02
subsystem: ui
tags: [phaser3, typescript, timer, scoring, streak, game-loop]

# Dependency graph
requires:
  - phase: 05-hud-scoring
    plan: 01
    provides: GameScene with static HUD strip (scoreText, countdownText, timerBarFill private fields)
provides:
  - Live countdown timer that decrements once per second using Phaser TimerEvent
  - Timer bar that shrinks proportionally and turns red (TIMER_COLOR_URGENT) when fewer than 10s remain
  - Real-time score updates on every match via computeMatchScore() and registry.inc()
  - Streak tracking: currentStreak increments on match, resets to 0 on mismatch
  - Game-over freeze: onTimeExpired() cancels timer, sets isChecking=true, emits 'gameOver'
  - timerEvent cleanup in handleShutdown() preventing ghost ticks on scene restart
affects:
  - 05-03 (round complete): will read TOTAL_SCORE from registry after round ends
  - 06 (round system): gameOver event fired here triggers UIScene overlay

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phaser time.addEvent with repeat: timeLimit - 1 fires exactly timeLimit times (0..timeLimit-1 ticks)"
    - "timerIsUrgent boolean flag prevents calling setFillStyle every tick — only once at threshold crossing"
    - "computeMatchScore(currentStreak) called before incrementing streak — streak represents prior consecutive matches"
    - "registry.inc() for atomic score accumulation across rounds; scoreText updated synchronously in evaluatePair()"

key-files:
  created: []
  modified:
    - src/game/scenes/GameScene.ts

key-decisions:
  - "startTimer() called in startPeekPhase delayedCall callback (after peek ends), not in create() — players not penalized for peek window"
  - "timerBarFill.setDisplaySize() used for shrinking bar — no WebGL geometry re-allocation, origin (0, 0.5) held fixed from Plan 01"
  - "onTimeExpired() sets isChecking=true permanently (no reset path) to block all future card clicks"
  - "currentStreak reset in mismatch branch before delayedCall so next match (after flip-back) earns base 100 only"

patterns-established:
  - "Timer cleanup pattern: timerEvent?.remove(false) then null assignment in both onTimeExpired() and handleShutdown()"
  - "Score update pattern: computeMatchScore(streak) → streak++ → registry.inc() → scoreText.setText() — all synchronous, no tween callbacks"

requirements-completed: [HUD-02, HUD-03, HUD-04, HUD-05, HUD-06]

# Metrics
duration: ~15min
completed: 2026-03-11
---

# Phase 5 Plan 02: HUD Scoring Summary

**Live countdown timer with shrinking bar (red under 10s), streak-bonus scoring wired into evaluatePair(), and game-over freeze on expiry — all operating on GameScene's existing HUD display objects**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-11
- **Completed:** 2026-03-11
- **Tasks:** 2 auto + 1 checkpoint (approved)
- **Files modified:** 1

## Accomplishments

- `startTimer()` creates a Phaser TimerEvent with `repeat: timeLimit - 1` — fires exactly `timeLimit` times, reaching 0:00 without going negative
- `onTick()` decrements `timeRemaining`, formats countdown text (M:SS), calls `timerBarFill.setDisplaySize()` for proportional shrink, and calls `setFillStyle(TIMER_COLOR_URGENT)` exactly once when crossing the 10s threshold
- `onTimeExpired()` cancels the timer, sets `isChecking = true` permanently, and emits `'gameOver'` — freezing all card clicks
- `evaluatePair()` match branch updated: `computeMatchScore(currentStreak)` scored before streak increment, `registry.inc()` accumulates total, `scoreText` updated synchronously
- Mismatch branch resets `currentStreak = 0` before the flip-back timer so the next match earns base 100
- `handleShutdown()` now cancels both `mismatchTimer` and `timerEvent` — no ghost ticks on scene restart

## Task Commits

Each task was committed atomically:

1. **Task 1: Add timer fields, startTimer, onTick, and onTimeExpired** - `8d7be44` (feat)
2. **Task 2: Wire scoring and streak tracking into evaluatePair()** - `1854856` (feat)

**Checkpoint:** Approved — plan complete.

## Files Created/Modified

- `src/game/scenes/GameScene.ts` — Added `timerEvent`, `timeLimit`, `timeRemaining`, `timerIsUrgent`, `currentStreak` fields; added `startTimer()`, `onTick()`, `onTimeExpired()` methods; updated `evaluatePair()` match and mismatch branches; updated `startPeekPhase()` callback; updated `handleShutdown()`

## Decisions Made

- `startTimer()` placed in `startPeekPhase` callback rather than `create()` so the peek window does not consume the player's countdown time
- `repeat: this.timeLimit - 1` gives exactly `timeLimit` ticks (Phaser `repeat: N` fires N+1 times total including the first)
- `timerIsUrgent` flag prevents calling `setFillStyle` on every tick — only transitions once, eliminating redundant WebGL calls
- `currentStreak` reset at the start of the mismatch `else` branch (before the delayedCall) so the streak state is cleared immediately

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Timer runs live, scoring updates in real time, game freezes on expiry — HUD-02 through HUD-06 satisfied
- Checkpoint approved; ready for Plan 03 (round-complete flow, time bonus, round advancement).
- `npm run test` and `npm run lint` both pass cleanly with zero warnings

---
*Phase: 05-hud-scoring*
*Completed: 2026-03-11*

## Self-Check: PASSED

- FOUND: .planning/phases/05-hud-scoring/05-02-SUMMARY.md
- FOUND: commit 8d7be44 (feat: timer fields, startTimer, onTick, onTimeExpired)
- FOUND: commit 1854856 (feat: scoring and streak tracking in evaluatePair)
