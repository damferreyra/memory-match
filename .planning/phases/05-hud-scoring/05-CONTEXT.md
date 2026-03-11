# Phase 5: HUD + Scoring - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a live HUD strip to GameScene: round label, score display, proportionally shrinking timer bar (turns red <10s), and "0:XX" countdown text. Enforce match scoring (100 base + streak bonus, capped at +200) and streak tracking inside `evaluatePair()`. Emit `'gameOver'` when the countdown reaches 0 and freeze all card interaction. Round-complete panel and multi-round progression are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### HUD layout
- Left / Center / Right arrangement in the 70px strip:
  - **Left**: "Round X / 3" label, left-aligned
  - **Center**: timer bar (TIMER_BAR_WIDTH=400, TIMER_BAR_HEIGHT=18) horizontally centered; "0:XX" countdown text directly below the bar center
  - **Right**: "Score: XXXXX", right-aligned
- A thin horizontal separator line at y=70 divides HUD from game grid
- All HUD positions added as named constants to config/ui.ts — no inline magic numbers
- HUD objects set to HUD_DEPTH=20

### Score display
- HUD shows **running total** (cumulative across all rounds), not round-only score
- `TOTAL_SCORE` in the Phaser registry is the single source of truth — updated immediately on each match
- `currentStreak` tracked as a private GameScene field; resets to 0 on mismatch
- Score text updates **immediately** when a match is confirmed (not after tween completes)
- Phase 6 reads TOTAL_SCORE from registry for the round-complete panel breakdown

### Timer behavior
- Timer starts **after the peek phase ends** (in the `delayedCall` callback, once cards flip back face-down)
- Uses `this.time.addEvent({ delay: 1000, repeat: timeLimit - 1, callback: onTick })` for clean 1s intervals
- `onTick` decrements `timeRemaining`, updates bar width and "0:XX" text, applies `TIMER_COLOR_URGENT` when `timeRemaining < TIMER_URGENT_THRESHOLD` (10s)
- Timer bar fill width = `(timeRemaining / timeLimit) * TIMER_BAR_WIDTH`
- Store the `TimerEvent` as a private field — cancelled in `handleShutdown()`

### Game-over freeze
- When `timeRemaining` hits 0: cancel timer event, set `this.isChecking = true` permanently, emit `this.events.emit('gameOver')`
- `isChecking = true` is sufficient to block all future card clicks — no need for `setInteractive(false)` on all 16 containers

### Claude's Discretion
- Exact font sizes and weights for HUD labels (within SCORE_FONT_SIZE=22 baseline)
- Timer bar background rect color (dark, low-alpha)
- Exact pixel positions within the 70px strip for text baselines
- Whether to add a HUD background rect or leave it transparent

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeMatchScore(streak)` in `game-logic.ts` — takes current streak before incrementing, returns base + bonus (capped). Call with `currentStreak`, then increment streak.
- `REGISTRY_KEYS.TOTAL_SCORE` — update this in registry on every match for cumulative tracking
- `REGISTRY_KEYS.CURRENT_ROUND` — read at `create()` to get `ROUND_CONFIGS[round - 1].timeLimit`
- `ROUND_CONFIGS[round - 1].timeLimit` — starting seconds for the timer

### Established Patterns
- `this.add.graphics()` + `fillStyle()` + `fillRect()` — for timer bar background and fill rects
- `this.add.text(x, y, str, { fontSize, fontFamily, color })` with `.setOrigin()` — for HUD labels
- `this.time.delayedCall()` — used in startPeekPhase(); `time.addEvent` is the same API for repeating
- `this.events.on('shutdown', this.handleShutdown, this)` — timer TimerEvent must be cancelled here

### Integration Points
- `evaluatePair()` match branch: `const earned = computeMatchScore(this.currentStreak); this.currentStreak++; this.registry.inc(TOTAL_SCORE, earned);` then update score text
- `evaluatePair()` mismatch branch: `this.currentStreak = 0`
- `startPeekPhase()` delayedCall callback: start timer here, after cards flip back
- `handleShutdown()`: cancel timer event alongside mismatchTimer cleanup

</code_context>

<specifics>
## Specific Ideas

- "Score: XXXXX" shows the cumulative total, not round-only — consistent with how most games display score
- Timer starts after peek so players aren't penalized for time they can't act

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-hud-scoring*
*Context gathered: 2026-03-11*
