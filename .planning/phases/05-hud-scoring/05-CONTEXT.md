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
- HUD occupies the top 70px strip (y=0 to y=70), set to HUD_DEPTH=20
- Left side (x≈20): "Round X / 3" label, SCORE_FONT_SIZE=22px, left-aligned
- Right side (x≈GAME_WIDTH-20): "Score: XXXXX", same font size, right-aligned
- Center: timer bar (TIMER_BAR_WIDTH=400, TIMER_BAR_HEIGHT=18) horizontally centered at x=GAME_WIDTH/2, vertically centered in strip (y≈26)
- "0:XX" countdown text sits directly below the bar center, small font (≈16px)
- A thin horizontal separator line at y=70 divides HUD from game grid
- All HUD positions added as named constants to config/ui.ts — no inline magic numbers

### Score state
- `currentStreak` and `roundScore` are private fields on GameScene (not in registry)
- On each match: `roundScore += computeMatchScore(currentStreak)`, then `currentStreak++`
- On each mismatch: `currentStreak = 0`
- Score text updates immediately (no animation — Phase 7 handles animated counter POLISH-05)
- TOTAL_SCORE in registry stays at 0 until Phase 6 commits it at round end
- `roundScore` is what the HUD "Score:" display shows during the round

### Timer mechanism
- Use `this.time.addEvent({ delay: 1000, repeat: timeLimit - 1, callback: onTick })` for clean 1s intervals
- `onTick` decrements `timeRemaining`, updates the timer bar width and text, applies urgent color when <10s
- Store the `TimerEvent` as a private field so it can be cancelled in `handleShutdown()`
- Timer bar fill width = `(timeRemaining / timeLimit) * TIMER_BAR_WIDTH`

### Game-over freeze
- When `timeRemaining` hits 0: cancel the timer event, set `this.isChecking = true` permanently (blocks all future clicks), call `this.events.emit('gameOver')` on the scene
- UIScene (Phase 6) subscribes to this event — no other action needed from GameScene
- Do NOT call `setInteractive(false)` on cards — the isChecking guard is sufficient and cleaner to unwind

### Claude's Discretion
- Exact font family for HUD text (Arial, sans-serif — same as cards)
- Whether round label uses bold weight
- Exact stroke/fill style for the separator line
- Exact HUD y-coordinates for text baselines (within the 70px strip)
- Timer bar background rect color (dark, low-alpha)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeMatchScore(streak)` in `game-logic.ts` — takes current streak, returns base + bonus (capped). Call with `currentStreak` before incrementing.
- `computeTimeBonus(seconds)` in `game-logic.ts` — used in Phase 6 at round end, not Phase 5
- `ROUND_CONFIGS[round - 1].timeLimit` — gives starting seconds for the timer
- `REGISTRY_KEYS.CURRENT_ROUND` — read at GameScene create() to know which round config to use

### Established Patterns
- `this.add.graphics()` + `fillStyle()` + `fillRect()` — for timer bar background and fill
- `this.add.text(x, y, str, { fontSize, fontFamily, color })` with `.setOrigin()` — for HUD labels
- `this.time.delayedCall()` — already used for mismatch; `time.addEvent` is the same API for repeating
- `this.events.on('shutdown', this.handleShutdown, this)` — timer event must be added to handleShutdown cleanup

### Integration Points
- `evaluatePair()` is where streak tracking and score increments plug in — match branch adds score, mismatch branch resets streak
- `handleShutdown()` must cancel the timer TimerEvent (add alongside mismatchTimer cleanup)
- `startPeekPhase()` sets `isChecking=true` during reveal — timer should NOT start until peek ends (start timer in the delayedCall callback, after cards flip back)

</code_context>

<specifics>
## Specific Ideas

- No specific visual references provided — standard clean HUD is appropriate
- User skipped discussion, deferring all layout/implementation choices to Claude

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-hud-scoring*
*Context gathered: 2026-03-11*
