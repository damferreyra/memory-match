# Phase 5: HUD + Scoring - Research

**Researched:** 2026-03-11
**Domain:** Phaser 3 HUD rendering, repeating timer events, DataManager registry, scoring state
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**HUD layout** — Left / Center / Right arrangement in the 70px strip:
- Left: "Round X / 3" label, left-aligned
- Center: timer bar (TIMER_BAR_WIDTH=400, TIMER_BAR_HEIGHT=18) horizontally centered; "0:XX" countdown text directly below bar center
- Right: "Score: XXXXX", right-aligned
- A thin horizontal separator line at y=70 divides HUD from game grid
- All HUD positions added as named constants to config/ui.ts — no inline magic numbers
- HUD objects set to HUD_DEPTH=20

**Score display** — HUD shows running total (cumulative across all rounds), not round-only score:
- `TOTAL_SCORE` in the Phaser registry is the single source of truth — updated immediately on each match
- `currentStreak` tracked as a private GameScene field; resets to 0 on mismatch
- Score text updates immediately when a match is confirmed (not after tween completes)
- Phase 6 reads TOTAL_SCORE from registry for the round-complete panel breakdown

**Timer behavior:**
- Timer starts after the peek phase ends (in the `delayedCall` callback, once cards flip back face-down)
- Uses `this.time.addEvent({ delay: 1000, repeat: timeLimit - 1, callback: onTick })` for clean 1s intervals
- `onTick` decrements `timeRemaining`, updates bar width and "0:XX" text, applies `TIMER_COLOR_URGENT` when `timeRemaining < TIMER_URGENT_THRESHOLD` (10s)
- Timer bar fill width = `(timeRemaining / timeLimit) * TIMER_BAR_WIDTH`
- Store the TimerEvent as a private field — cancelled in `handleShutdown()`

**Game-over freeze:**
- When `timeRemaining` hits 0: cancel timer event, set `this.isChecking = true` permanently, emit `this.events.emit('gameOver')`
- `isChecking = true` is sufficient to block all future card clicks — no need for `setInteractive(false)` on all 16 containers

### Claude's Discretion
- Exact font sizes and weights for HUD labels (within SCORE_FONT_SIZE=22 baseline)
- Timer bar background rect color (dark, low-alpha)
- Exact pixel positions within the 70px strip for text baselines
- Whether to add a HUD background rect or leave it transparent

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HUD-01 | HUD displays round label ("Round X / 3"), score ("Score: XXXXX"), timer bar, and timer text ("0:XX") | `this.add.text()` + `this.add.rectangle()` or Graphics; all constants pre-exist in config/ui.ts |
| HUD-02 | Countdown timer starts at `timeLimit` seconds for the current round and decrements each second | `this.time.addEvent({ delay: 1000, repeat: timeLimit - 1, callback: onTick })` — confirmed Phaser 3 API |
| HUD-03 | Timer bar shrinks proportionally; turns red (`TIMER_COLOR_URGENT`) when fewer than 10 seconds remain | Fill rect width = `(timeRemaining / timeLimit) * TIMER_BAR_WIDTH`; `TIMER_COLOR_URGENT` and `TIMER_URGENT_THRESHOLD` already in config/ui.ts |
| HUD-04 | Matching a pair awards 100 base + streak bonus (50 per consecutive match, capped at +200) | `computeMatchScore(streak)` already implemented and tested in game-logic.ts; `this.registry.inc()` confirmed in Phaser DataManager |
| HUD-05 | Missing a pair resets the streak counter to 0 | `currentStreak = 0` in mismatch branch of `evaluatePair()` |
| HUD-06 | Timer expiry emits `'gameOver'` event and stops all card interaction | Cancel TimerEvent, set `isChecking = true`, emit `this.events.emit('gameOver')` |
</phase_requirements>

---

## Summary

Phase 5 adds the live HUD overlay and scoring logic to the existing GameScene. All required constants are already defined in `config/ui.ts` (TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, SCORE_FONT_SIZE, TIMER_COLOR_NORMAL, TIMER_COLOR_URGENT, TIMER_URGENT_THRESHOLD, BASE_MATCH_SCORE, STREAK_BONUS_PER_MATCH, STREAK_BONUS_MAX). The scoring pure functions (`computeMatchScore`, `computeTimeBonus`) already exist in `game-logic.ts` and are tested. The Phaser 3 DataManager `inc()` method is confirmed for incrementing TOTAL_SCORE in the registry. The only new named constants needed are HUD positional layout values (text x/y coordinates, separator y) which must be added to `config/ui.ts`.

The critical implementation choices are: (1) use `this.add.rectangle()` with `setDisplaySize()` for the timer bar fill rather than Graphics clear/redraw (avoids repeated WebGL texture allocation), and (2) start the `time.addEvent` repeat timer inside the `startPeekPhase` delayedCall callback so players are not penalized for time they cannot act.

**Primary recommendation:** Add HUD positional constants to `config/ui.ts`, build the HUD in a dedicated `buildHud()` method in GameScene, integrate scoring into `evaluatePair()`, and integrate the timer into `startPeekPhase()`. No new files or libraries required.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| phaser | ^3.90.0 | Game framework — `this.add.text()`, `this.add.rectangle()`, `this.time.addEvent()`, `this.registry.inc()` | Project stack; all HUD features are built-in |
| TypeScript | ~5.7.2 | Strict mode type checking | Project requirement |

### No Additional Libraries

Everything needed is in Phaser 3's built-in API. No additional npm packages.

---

## Architecture Patterns

### Recommended Change to Project Structure

No new files. All changes are within existing files:

```
src/game/
├── config/
│   └── ui.ts          # ADD: HUD positional layout constants
└── scenes/
    └── GameScene.ts   # ADD: buildHud(), scoring state, timer, game-over emit
```

### Pattern 1: Timer Bar with Rectangle GameObject (not Graphics)

**What:** Use `this.add.rectangle()` for the timer bar fill. Update `displayWidth` each tick rather than calling `graphics.clear()` + `graphics.fillRect()`.

**Why:** Graphics clear/redraw allocates new WebGL geometry each call. Rectangle's `setDisplaySize()` mutates a cached quad — no re-allocation. This matters for a timer updating every second.

**Example:**
```typescript
// Source: Phaser 3 GameObjects.Rectangle API (docs.phaser.io)

// In buildHud() — create once
const barBg = this.add.rectangle(
    GAME_WIDTH / 2,
    HUD_BAR_Y,
    TIMER_BAR_WIDTH,
    TIMER_BAR_HEIGHT,
    HUD_BAR_BG_COLOR,
    HUD_BAR_BG_ALPHA,
).setDepth(HUD_DEPTH).setOrigin(0.5, 0.5);

// Fill rect — origin left so it shrinks from the right
this.timerBarFill = this.add.rectangle(
    GAME_WIDTH / 2 - TIMER_BAR_WIDTH / 2,
    HUD_BAR_Y,
    TIMER_BAR_WIDTH,
    TIMER_BAR_HEIGHT,
    TIMER_COLOR_NORMAL,
).setDepth(HUD_DEPTH).setOrigin(0, 0.5);

// In onTick() — update width each second
const fillWidth = (this.timeRemaining / this.timeLimit) * TIMER_BAR_WIDTH;
this.timerBarFill.setDisplaySize(Math.max(0, fillWidth), TIMER_BAR_HEIGHT);
if (this.timeRemaining < TIMER_URGENT_THRESHOLD) {
    this.timerBarFill.setFillStyle(TIMER_COLOR_URGENT);
}
```

**Note on `setFillStyle` vs `fillColor`:** Phaser 3 Rectangle exposes `setFillStyle(color, alpha?)` for color changes. Call this only once when crossing the 10-second threshold — guard with a flag to avoid re-calling every tick.

### Pattern 2: Repeating Timer with `time.addEvent`

**What:** Use `repeat: timeLimit - 1` so the event fires `timeLimit` times total (initial fire + N-1 repeats).

**When to use:** Any countdown that must fire exactly N times at 1-second intervals.

```typescript
// Source: Phaser 3 Time.Clock.addEvent API (docs.phaser.io)

// Called inside startPeekPhase delayedCall callback
private startTimer(): void {
    const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
    this.timeLimit = ROUND_CONFIGS[round - 1].timeLimit;
    this.timeRemaining = this.timeLimit;

    this.timerEvent = this.time.addEvent({
        delay: 1000,
        repeat: this.timeLimit - 1,
        callback: this.onTick,
        callbackScope: this,
    });
}

private onTick(): void {
    this.timeRemaining--;
    this.updateTimerDisplay();
    if (this.timeRemaining <= 0) {
        this.onTimeExpired();
    }
}
```

**Important:** `repeat: N` means the event fires `N + 1` times total (initial call + N repeats). To fire exactly `timeLimit` times, use `repeat: timeLimit - 1`.

### Pattern 3: Scoring Integration in `evaluatePair()`

**What:** Call `computeMatchScore(this.currentStreak)` in the match branch, increment streak, write to registry.

```typescript
// Source: existing game-logic.ts computeMatchScore() + Phaser DataManager.inc()

// Match branch
const earned = computeMatchScore(this.currentStreak);
this.currentStreak++;
this.registry.inc(REGISTRY_KEYS.TOTAL_SCORE, earned);
this.scoreText.setText(`Score: ${this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number}`);

// Mismatch branch
this.currentStreak = 0;
```

### Pattern 4: HUD Text with `setOrigin()` for Alignment

**What:** Use origin control to align HUD labels precisely without computing pixel offsets.

```typescript
// Source: Phaser 3 Text API

// Left-aligned round label
this.add.text(HUD_ROUND_X, HUD_TEXT_Y, `Round ${round} / 3`, {
    fontSize: `${SCORE_FONT_SIZE}px`,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
}).setOrigin(0, 0.5).setDepth(HUD_DEPTH);

// Right-aligned score label — origin (1, 0.5) so text grows leftward
this.scoreText = this.add.text(HUD_SCORE_X, HUD_TEXT_Y, 'Score: 0', {
    fontSize: `${SCORE_FONT_SIZE}px`,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
}).setOrigin(1, 0.5).setDepth(HUD_DEPTH);

// Countdown text centered below bar
this.countdownText = this.add.text(GAME_WIDTH / 2, HUD_COUNTDOWN_Y, '1:00', {
    fontSize: `${SCORE_FONT_SIZE}px`,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
}).setOrigin(0.5, 0).setDepth(HUD_DEPTH);
```

### Pattern 5: Separator Line via Graphics (draw once, never redraw)

**What:** Use a Graphics object to draw the separator line once at `create()` time.

```typescript
// Draw once — no update needed
const sep = this.add.graphics();
sep.lineStyle(1, 0x444466, 0.6);
sep.beginPath();
sep.moveTo(0, HUD_HEIGHT);
sep.lineTo(GAME_WIDTH, HUD_HEIGHT);
sep.strokePath();
sep.setDepth(HUD_DEPTH);
```

### Pattern 6: Game-Over Freeze

**What:** When timer expires, set `isChecking = true` permanently and emit the event. No need to call `setInteractive(false)` on containers.

```typescript
private onTimeExpired(): void {
    if (this.timerEvent) {
        this.timerEvent.remove(false);
        this.timerEvent = null;
    }
    this.isChecking = true; // blocks all future handleCardClick calls
    this.events.emit('gameOver');
}
```

### Anti-Patterns to Avoid

- **Graphics.clear() on every tick for the timer bar:** Causes repeated WebGL geometry allocation. Use Rectangle.setDisplaySize() instead.
- **Magic numbers for HUD positions:** All x/y pixel values must be named constants in `config/ui.ts`.
- **CSS color strings in text style:** Color must be a hex string like `'#ffffff'`, not a name like `'white'`. (Phaser Text accepts CSS color strings, but project convention uses hex values. For Graphics/Rectangle, use `0xRRGGBB` integers.)
- **Starting timer in `create()` before peek phase completes:** Players would lose time during the forced reveal window.
- **Calling `setFillStyle` on every tick:** Guard with a `this.isUrgent` boolean; only switch color once when crossing the threshold.
- **Using `repeat: timeLimit` instead of `repeat: timeLimit - 1`:** Would fire one extra tick, giving timeRemaining = -1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repeating 1s interval | Manual `delayedCall` chain, recursive setTimeout | `this.time.addEvent({ repeat })` | Native to Phaser, pauses with scene, auto-cleans on scene stop |
| Score accumulation with overflow protection | Manual clamp logic | `computeMatchScore(streak)` from game-logic.ts | Already written, already tested, caps at STREAK_BONUS_MAX |
| Timer bar fill width | Geometry recalculation + Graphics | `rectangle.setDisplaySize()` | Built-in, no re-allocation |
| Registry increment | `this.registry.set(key, this.registry.get(key) + n)` | `this.registry.inc(key, n)` | Cleaner, chainable, officially supported |

**Key insight:** All complex logic (scoring formula, streak capping, time bonus) is already implemented and tested in `game-logic.ts`. Phase 5 only wires it in — no new algorithms needed.

---

## Common Pitfalls

### Pitfall 1: Timer fires N+1 times
**What goes wrong:** `repeat: timeLimit` fires `timeLimit + 1` times, causing `timeRemaining` to hit -1 instead of 0.
**Why it happens:** The Phaser `repeat` parameter means "repeat this many more times after the initial fire", not "fire this many times total".
**How to avoid:** Always use `repeat: timeLimit - 1` for a countdown that should fire exactly `timeLimit` times.
**Warning signs:** Timer goes past 0:00 and shows -0:01 or negative values.

### Pitfall 2: Setting `isUrgent` color every tick
**What goes wrong:** `setFillStyle` called 10 times (once per second from 9s down to 0s), which is harmless but wasteful.
**How to avoid:** Add `private timerIsUrgent = false;` field. In `onTick`, only call `setFillStyle(TIMER_COLOR_URGENT)` when transitioning from false to true.

### Pitfall 3: Score updates after tween completes (not immediately)
**What goes wrong:** Scoring is placed in the `flipCardUp` tween `onComplete` cascade instead of in `evaluatePair()`.
**Why it happens:** Developers sometimes think "score after visual confirmation" — but the design decision is "score when match is confirmed logically".
**How to avoid:** Score update and streak increment happen inside `evaluatePair()` match branch, not in any tween callback.

### Pitfall 4: Timer event not cancelled on shutdown
**What goes wrong:** Scene is restarted (e.g., round over) but the old TimerEvent keeps firing, calling `onTick` on a destroyed scene.
**How to avoid:** `handleShutdown()` must call `this.timerEvent?.remove(false)` alongside `this.mismatchTimer?.remove(false)`.

### Pitfall 5: `noUnusedLocals` rejects unreferenced private fields
**What goes wrong:** TypeScript strict mode flags `private timerEvent` or `private timerBarFill` if their type annotation doesn't match actual usage.
**How to avoid:** Declare fields as `private timerEvent: Phaser.Time.TimerEvent | null = null;` and assign from `buildHud()` or `startTimer()`. Ensure both read and write paths exist.

### Pitfall 6: `registry.inc()` before registry key is initialized
**What goes wrong:** If `TOTAL_SCORE` has never been set, `registry.inc` creates a key with the increment value (e.g., first match earns 100, registry.inc would set it to 100 — correct, but only works if MenuScene has already called `registry.set(REGISTRY_KEYS.TOTAL_SCORE, 0)`).
**How to avoid:** MenuScene already calls `this.registry.set(REGISTRY_KEYS.TOTAL_SCORE, 0)` at round start (confirmed in MenuScene.ts line 82). This is already handled.

---

## Code Examples

### New constants to add to `config/ui.ts`

```typescript
// Source: project convention — all HUD pixel values must be named constants

// HUD positional layout (within the 70px HUD strip)
export const HUD_TEXT_Y = 35;               // vertical center of HUD strip
export const HUD_ROUND_X = 20;              // left edge for round label
export const HUD_SCORE_X = GAME_WIDTH - 20; // right edge for score (origin 1,0.5)
export const HUD_BAR_Y = 28;               // timer bar vertical center
export const HUD_COUNTDOWN_Y = 42;          // countdown text top (below bar)
export const HUD_SEPARATOR_Y = HUD_HEIGHT;  // reuse HUD_HEIGHT=70

// Timer bar visual
export const HUD_BAR_BG_COLOR = 0x000000;
export const HUD_BAR_BG_ALPHA = 0.4;
```

Note: `GAME_WIDTH` must be imported from `../constants` in `ui.ts`, OR `HUD_SCORE_X` can be set as literal 1004 (= 1024 - 20). To avoid circular imports, use a literal or move it to constants.ts. Since `ui.ts` currently has no imports from `constants.ts`, the safest approach is to use the literal `1004` and add a comment.

### Full `startTimer()` method

```typescript
// Source: Phaser 3 time.addEvent API, locked decision from CONTEXT.md

private startTimer(): void {
    const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
    this.timeLimit = ROUND_CONFIGS[round - 1].timeLimit;
    this.timeRemaining = this.timeLimit;
    this.timerIsUrgent = false;

    this.timerEvent = this.time.addEvent({
        delay: 1000,
        repeat: this.timeLimit - 1,
        callback: this.onTick,
        callbackScope: this,
    });
}

private onTick(): void {
    this.timeRemaining--;
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    this.countdownText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    const fillWidth = (this.timeRemaining / this.timeLimit) * TIMER_BAR_WIDTH;
    this.timerBarFill.setDisplaySize(Math.max(0, fillWidth), TIMER_BAR_HEIGHT);

    if (!this.timerIsUrgent && this.timeRemaining < TIMER_URGENT_THRESHOLD) {
        this.timerIsUrgent = true;
        this.timerBarFill.setFillStyle(TIMER_COLOR_URGENT);
    }

    if (this.timeRemaining <= 0) {
        this.onTimeExpired();
    }
}
```

### Updated `evaluatePair()` match branch

```typescript
// Source: CONTEXT.md code_context + game-logic.ts existing API

if (isMatch(cardA.symbolId, cardB.symbolId)) {
    cardA.state = 'matched';
    cardB.state = 'matched';
    this.tintContainer(this.containers[indexA], CARD_MATCHED_TINT);
    this.tintContainer(this.containers[indexB], CARD_MATCHED_TINT);
    this.flippedIndices = [];

    // Scoring — immediate update on match confirmation
    const earned = computeMatchScore(this.currentStreak);
    this.currentStreak++;
    this.registry.inc(REGISTRY_KEYS.TOTAL_SCORE, earned);
    this.scoreText.setText(`Score: ${this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number}`);

    this.isChecking = false;
} else {
    this.currentStreak = 0;
    // ... existing mismatch timer logic unchanged
}
```

### Updated `handleShutdown()`

```typescript
private handleShutdown(): void {
    this.tweens.killAll();
    if (this.mismatchTimer) {
        this.mismatchTimer.remove(false);
        this.mismatchTimer = null;
    }
    if (this.timerEvent) {
        this.timerEvent.remove(false);
        this.timerEvent = null;
    }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Graphics.clear() + fillRect() for dynamic bars | Rectangle.setDisplaySize() | Phaser 3 GameObjects API matured | No per-tick geometry re-allocation |
| Manual registry get + add + set | registry.inc(key, amount) | Available since early Phaser 3 | Chainable, cleaner, officially supported |

**Nothing in this phase is outdated.** Phaser 3.90.0 fully supports all patterns.

---

## Open Questions

1. **`HUD_SCORE_X` requires GAME_WIDTH**
   - What we know: `config/ui.ts` currently has no imports from `constants.ts`
   - What's unclear: Whether to import `GAME_WIDTH` into `ui.ts` (introducing a cross-dependency) or use literal `1004`
   - Recommendation: Use literal `1004` with a comment `// GAME_WIDTH - 20` to avoid any circular import risk. The planner should decide which approach to standardize.

2. **Countdown format: "0:XX" vs "M:SS"**
   - What we know: The requirement says "0:XX" — consistent with `Math.floor(s / 60) : s % 60`
   - What's unclear: For Round 1, timer starts at 60s which displays as "1:00" not "0:60"
   - Recommendation: Use `M:SS` format (`Math.floor(timeRemaining / 60) + ':' + (timeRemaining % 60).toString().padStart(2, '0')`). This correctly shows "1:00" at start of Round 1.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | vite/config.dev.mjs (vitest inline config) or vitest.config at root — detected via `npm run test` → `vitest run` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HUD-01 | HUD elements rendered at correct depth | manual-only | — visual inspection | N/A |
| HUD-02 | Timer starts at timeLimit, decrements each second | manual-only | — requires Phaser scene | N/A |
| HUD-03 | Timer bar shrinks proportionally; turns red <10s | manual-only | — requires Phaser scene | N/A |
| HUD-04 | `computeMatchScore(streak)` returns correct value | unit | `npm run test` (game-logic.test.ts already covers this) | ✅ exists |
| HUD-05 | Streak resets to 0 on mismatch | manual-only | — requires scene state | N/A |
| HUD-06 | Timer expiry behavior | manual-only | — requires scene + time | N/A |

**Note on HUD-04:** `computeMatchScore` is already fully tested in `game-logic.test.ts`. No new test file needed for the pure logic. The scene-level wiring (calling the function and updating registry) is not unit-testable without Phaser mocks and is covered by manual play-testing.

### Sampling Rate
- **Per task commit:** `npm run test` (all pure logic tests, ~instantaneous)
- **Per wave merge:** `npm run test && npm run lint`
- **Phase gate:** Full suite green + manual play-test before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements that are unit-testable. `computeMatchScore` and `computeTimeBonus` already have tests. The remaining HUD-01 through HUD-06 behaviors involve Phaser scene rendering and are validated by manual play-test per project conventions.

---

## Sources

### Primary (HIGH confidence)
- Phaser 3 DataManager.inc() — confirmed via official docs.phaser.io search result and newdocs.phaser.io API reference
- Phaser 3 Time.addEvent `repeat` parameter — confirmed via docs.phaser.io/phaser/concepts/time
- `config/ui.ts` (project source) — all scoring and HUD sizing constants verified by direct file read
- `game-logic.ts` (project source) — `computeMatchScore()`, `computeTimeBonus()` verified by direct file read
- `GameScene.ts` (project source) — existing patterns for registry.get, tween, handleShutdown verified by direct file read
- `game-logic.test.ts` (project source) — test coverage of computeMatchScore confirmed

### Secondary (MEDIUM confidence)
- Phaser 3 Rectangle.setDisplaySize() vs Graphics.clear() pattern — via WebSearch cross-referencing phasergames.com and rexrainbow.github.io Phaser 3 notes
- Timer bar width pattern using scaleX — confirmed in Phaser health bar examples at phaser.io/examples

### Tertiary (LOW confidence)
- WebGL allocation cost of Graphics.clear() vs Rectangle — stated in Phaser community, no official benchmark cited

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project uses Phaser 3.90.0; all APIs confirmed in project source and docs
- Architecture: HIGH — all patterns directly derived from existing GameScene patterns + locked CONTEXT.md decisions
- Pitfalls: HIGH — derived from TypeScript strict mode behavior (noUnusedLocals) and Phaser TimerEvent `repeat` semantics, cross-verified

**Research date:** 2026-03-11
**Valid until:** 2026-05-01 (Phaser 3.x stable APIs; scoring logic is project-internal)
