# Phase 4: Flip Mechanics - Research

**Researched:** 2026-03-11
**Domain:** Phaser 3 Tweens, Input, GameObjects.Container interactivity, state machine
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLIP-01 | Clicking a face-down card flips it face-up using a scaleX tween (1→0, swap content, 0→1) | Phaser Tween API confirmed: `this.tweens.add` with `scaleX` target; two-step tween via `onComplete` callback or chained tweens; 150ms per half from `FLIP_DURATION_MS` in config/ui.ts |
| FLIP-02 | Peek phase at round start: all 16 cards briefly show faces for `peekDuration` seconds, then flip back face-down | `ROUND_CONFIGS[round-1].peekDuration` available; peek = flip all 16 up, `this.time.delayedCall(peekDuration * 1000, ...)` then flip all back; must block interaction during peek |
| FLIP-03 | Player can flip at most 2 cards per turn; further clicks blocked while a pair is being evaluated (`isChecking` guard) | `isChecking: boolean` class property; early-return guard in click handler; must also block during flip tweens |
| FLIP-04 | Two matching cards lock face-up with visual matched state (de-saturated tint) | `CARD_MATCHED_TINT = 0x888888` in config/cards.ts; `container.setTint(CARD_MATCHED_TINT)` on both matched containers; `card.state = 'matched'` |
| FLIP-05 | Two non-matching cards flip back face-down after `MISMATCH_HOLD_MS` (800ms) delay | `MISMATCH_HOLD_MS = 800` in config/ui.ts; `this.time.delayedCall(MISMATCH_HOLD_MS, ...)` then flip both back; cancel timer in `handleShutdown()` |
</phase_requirements>

## Summary

Phase 4 adds interactivity to the static grid from Phase 3. The core challenge is orchestrating a precise state machine across multiple async Phaser operations: flip tweens, timed delays, and input guards. The GameScene already provides `this.cards: CardData[]` and `this.containers: Phaser.GameObjects.Container[]` — Phase 4 wires these up with click handlers and tween sequences.

The scaleX flip trick is a classic Phaser pattern: tween `scaleX` from 1 to 0 (card "disappears" edge-on), swap which child layers are visible at the midpoint, then tween from 0 back to 1 (card "reappears" showing the other face). All timing values are already defined in `config/ui.ts` (`FLIP_DURATION_MS = 150`, `MISMATCH_HOLD_MS = 800`). All match/mismatch visual constants are in `config/cards.ts` (`CARD_MATCHED_TINT = 0x888888`).

The dominant risk is race conditions: a second click arriving during a tween, or both tweens not completing before evaluation runs. The solution is a single `isChecking` boolean that is set true whenever two cards are in flight and cleared only after evaluation is fully complete (match locked or mismatch tween finished). Shutdown cleanup is mandatory — all active tweens and delayed calls must be cancelled in `handleShutdown()` to prevent callbacks firing after the scene is gone.

**Primary recommendation:** Implement the flip state machine in a single wave: peek phase first (proves tweens work), then click-to-flip with guard, then match/mismatch evaluation. Keep all timing in constants — never inline millisecond values.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | ^3.90.0 (installed) | Tweens, Input, delayedCall, Container.setTint | Already in project; no alternative |
| TypeScript | ~5.7.2 (installed) | Strict mode; state machine types | Already in project |
| Vitest | ^4.0.18 (installed) | Unit tests for any new pure logic | Already configured; `npm run test` |
| Biome | ^2.4.4 (installed) | Tabs, single quotes, linter | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vite | ^6.3.1 (installed) | Dev server for manual smoke testing | Visual verification of flip animation |

### Alternatives Considered
None — stack is fixed. No new dependencies are needed for Phase 4.

**Installation:**
```bash
# No new packages needed — all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure (after Phase 4)
```
src/game/
├── constants.ts              # SCENE_KEYS, REGISTRY_KEYS (unchanged)
├── game-logic.ts             # Pure logic (unchanged — isMatch, computeMatchScore already here)
├── game-logic.test.ts        # Existing tests (unchanged)
├── config/
│   ├── cards.ts              # CARD_MATCHED_TINT = 0x888888 (already defined, used now)
│   ├── grid.ts               # unchanged
│   ├── rounds.ts             # ROUND_CONFIGS[round-1].peekDuration consumed
│   └── ui.ts                 # FLIP_DURATION_MS, MISMATCH_HOLD_MS consumed
└── scenes/
    ├── GameScene.ts          # PRIMARY CHANGE: flip logic, peek phase, evaluation
    └── UIScene.ts            # unchanged (Phase 6)
```

### Pattern 1: ScaleX Flip Tween (two-step)
**What:** Animate `scaleX` 1→0 to "close" the card, swap visible children, then animate 0→1 to "open" with the new face showing.
**When to use:** Every card flip — both flip-up and flip-down transitions.
**Example:**
```typescript
// Source: Phaser 3 Tween API — confirmed in project (Phaser ^3.90.0)
private flipCardUp(index: number): void {
	const container = this.containers[index];
	const card = this.cards[index];
	card.state = 'flippingUp';

	// Step 1: scaleX 1 → 0
	this.tweens.add({
		targets: container,
		scaleX: 0,
		duration: FLIP_DURATION_MS,
		ease: 'Linear',
		onComplete: () => {
			// Swap visibility at midpoint
			this.showCardFace(index);

			// Step 2: scaleX 0 → 1
			this.tweens.add({
				targets: container,
				scaleX: 1,
				duration: FLIP_DURATION_MS,
				ease: 'Linear',
				onComplete: () => {
					card.state = 'faceUp';
					// caller is responsible for checking pair evaluation
				},
			});
		},
	});
}

private showCardFace(index: number): void {
	const container = this.containers[index];
	// children order: [back, questionMark, front, symbolText]
	// index 0 = back Graphics, index 1 = questionMark Text
	// index 2 = front Graphics, index 3 = symbolText Text
	(container.getAt(0) as Phaser.GameObjects.Graphics).setVisible(false);
	(container.getAt(1) as Phaser.GameObjects.Text).setVisible(false);
	(container.getAt(2) as Phaser.GameObjects.Graphics).setVisible(true);
	(container.getAt(3) as Phaser.GameObjects.Text).setVisible(true);
}

private showCardBack(index: number): void {
	const container = this.containers[index];
	(container.getAt(0) as Phaser.GameObjects.Graphics).setVisible(true);
	(container.getAt(1) as Phaser.GameObjects.Text).setVisible(true);
	(container.getAt(2) as Phaser.GameObjects.Graphics).setVisible(false);
	(container.getAt(3) as Phaser.GameObjects.Text).setVisible(false);
}
```

### Pattern 2: Container Interactive Input
**What:** Enable pointer input on a Container by setting a hit area and registering a `'pointerdown'` listener.
**When to use:** Set up once per card in `buildGrid()` (or a new `enableCardInput()` helper).
**Example:**
```typescript
// Source: Phaser 3 Container input API — Phaser ^3.90.0
// Containers require explicit hit area; use Rectangle matching card dimensions
container.setSize(CARD_WIDTH, CARD_HEIGHT);
container.setInteractive({ useHandCursor: true });
container.on('pointerdown', () => {
	this.handleCardClick(i);
});
```
**Critical note:** `this.add.container()` does NOT have pointer interactivity by default. `setSize()` + `setInteractive()` must both be called. The hit area is the rectangle of the given size centered on the container origin.

### Pattern 3: isChecking Guard
**What:** A class-level boolean that blocks all card clicks while a pair evaluation is in progress.
**When to use:** Check at the top of `handleCardClick()` before any other logic.
**Example:**
```typescript
// State on GameScene class
private isChecking = false;
private flippedIndices: number[] = [];
private mismatchTimer: Phaser.Time.TimerEvent | null = null;

private handleCardClick(index: number): void {
	const card = this.cards[index];

	// Guard 1: global evaluation lock
	if (this.isChecking) return;

	// Guard 2: card must be face-down (not already flipped or matched)
	if (card.state !== 'faceDown') return;

	// Guard 3: already have this card flipped (shouldn't happen, but defensive)
	if (this.flippedIndices.includes(index)) return;

	this.flipCardUp(index);
	this.flippedIndices.push(index);

	if (this.flippedIndices.length === 2) {
		this.isChecking = true;
		this.evaluatePair();
	}
}
```

### Pattern 4: Peek Phase
**What:** At round start, flip all 16 cards face-up simultaneously, wait `peekDuration` seconds, then flip all back face-down.
**When to use:** Called at the end of `GameScene.create()`, after `buildGrid()`.
**Example:**
```typescript
// Source: Phaser 3 delayedCall API — confirmed in project
private startPeekPhase(): void {
	const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
	const { peekDuration } = ROUND_CONFIGS[round - 1];

	// Block input during peek
	this.isChecking = true;

	// Flip all cards up (no tween for peek — immediate visibility swap)
	for (let i = 0; i < this.cards.length; i++) {
		this.showCardFace(i);
		this.cards[i].state = 'faceUp';
	}

	// Schedule flip-back after peekDuration
	this.time.delayedCall(peekDuration * 1000, () => {
		for (let i = 0; i < this.cards.length; i++) {
			if (this.cards[i].state !== 'matched') {
				this.showCardBack(i);
				this.cards[i].state = 'faceDown';
			}
		}
		this.isChecking = false;
	});
}
```
**Note on peek animation:** The peek phase can use immediate visibility swaps (no tween) — the reveal is intentional and simultaneous for all 16 cards. Adding a tween here creates complexity with 16 concurrent tweens. Immediate swap is simpler and correct per requirements ("briefly show faces").

### Pattern 5: Match and Mismatch Evaluation
**What:** After two cards are flipped up, check symbols and resolve: lock matched cards or schedule flip-back for mismatches.
**When to use:** Called exactly once when `flippedIndices.length === 2`.
**Example:**
```typescript
// Uses isMatch() from game-logic.ts (already imported)
private evaluatePair(): void {
	const [indexA, indexB] = this.flippedIndices;
	const cardA = this.cards[indexA];
	const cardB = this.cards[indexB];

	// Wait for flip animation to complete (2 * FLIP_DURATION_MS)
	// isChecking is already true; evaluation runs after tween completes
	if (isMatch(cardA.symbolId, cardB.symbolId)) {
		// Lock both cards as matched
		cardA.state = 'matched';
		cardB.state = 'matched';
		this.containers[indexA].setTint(CARD_MATCHED_TINT);
		this.containers[indexB].setTint(CARD_MATCHED_TINT);
		this.flippedIndices = [];
		this.isChecking = false;
		// Phase 5 will emit score event here
	} else {
		// Schedule flip-back after MISMATCH_HOLD_MS
		this.mismatchTimer = this.time.delayedCall(MISMATCH_HOLD_MS, () => {
			this.flipCardDown(indexA);
			this.flipCardDown(indexB);
			this.flippedIndices = [];
			// isChecking stays true until flip-down completes
		});
	}
}
```

### Pattern 6: Shutdown Cleanup
**What:** Cancel all active tweens and pending timers when the scene shuts down.
**When to use:** CLAUDE.md mandates this pattern; required for Phase 6 scene restarts.
**Example:**
```typescript
// Source: CLAUDE.md — Tweens Cleanup architecture section
// Register in create():
this.events.on('shutdown', this.handleShutdown, this);

private handleShutdown(): void {
	this.tweens.killAll();
	if (this.mismatchTimer) {
		this.mismatchTimer.remove(false);
		this.mismatchTimer = null;
	}
}
```

### Anti-Patterns to Avoid
- **Tweening Container.scaleX without `setSize()`:** The tween works on the visual scale, but input hit area remains full-size. Disable container interactivity while flipping to prevent double-clicks on a card being tweened.
- **Inline millisecond values:** `duration: 150` — use `FLIP_DURATION_MS` from config/ui.ts. `delayedCall(800, ...)` — use `MISMATCH_HOLD_MS`.
- **Evaluating the pair before flip tween completes:** If `evaluatePair()` runs while `state = 'flippingUp'`, the card states are inconsistent. Trigger evaluation only from inside the `onComplete` callback of the second flip-up tween.
- **Not clearing `flippedIndices` on mismatch cleanup:** Failing to reset `this.flippedIndices = []` after mismatch means the next click adds a third entry, corrupting evaluation.
- **Missing `setVisible(false)` for interactivity during peek:** During the peek, `isChecking = true` correctly blocks `handleCardClick`, but `state` is `'faceUp'` for all cards. When flip-back completes, `state` must be set back to `'faceDown'` — otherwise guard 2 in `handleCardClick` will reject future valid clicks.
- **Calling `container.setTint()` on Graphics children vs Container:** `Container.setTint()` propagates tint to all children (Graphics, Text). This is the correct level to apply the matched tint — do NOT iterate children manually.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Symbol match check | `cardA.symbolId === cardB.symbolId` inline | `isMatch(a, b)` from game-logic.ts | Already implemented and tested; keeps game logic testable |
| Two-step tween sequencing | `setTimeout` or manual frame counting | Phaser `onComplete` callback chaining | `this.tweens.add` with `onComplete` is idiomatic; `setTimeout` bypasses Phaser's scene lifecycle and won't be cancelled by `tweens.killAll()` |
| Delayed callback | `setTimeout(fn, 800)` | `this.time.delayedCall(MISMATCH_HOLD_MS, fn)` | Phaser `delayedCall` returns a `TimerEvent` that can be cancelled in `handleShutdown()`. `setTimeout` callbacks fire even after scene shutdown, causing crashes |
| Round config lookup | Hardcoded peek durations | `ROUND_CONFIGS[round - 1].peekDuration` | Centralizes per-round config; supports all 3 rounds correctly |
| Tint application | Manual per-child tint loops | `container.setTint(CARD_MATCHED_TINT)` | Container propagates tint to all children automatically |

**Key insight:** All async operations in GameScene MUST use Phaser's own time/tween system (`this.tweens`, `this.time`), never browser APIs (`setTimeout`, `requestAnimationFrame`). Only Phaser's system respects scene lifecycle — browser timers fire after scene shutdown and will crash on destroyed objects.

## Common Pitfalls

### Pitfall 1: Double-Click During Flip Tween
**What goes wrong:** Player clicks a card, tween starts (`state = 'flippingUp'`), player clicks the same card again before tween completes. If the state guard only checks `'faceDown'`, a `'flippingUp'` card passes guard 2.
**Why it happens:** `CardState` includes `'flippingUp'` and `'flippingDown'` — cards in these states are neither `'faceDown'` nor `'faceUp'`, but the guard must also exclude them.
**How to avoid:** Guard 2 must check `card.state !== 'faceDown'` (not `card.state === 'faceUp'`). Since only `'faceDown'` is clickable, `'flippingUp'`, `'faceUp'`, `'flippingDown'`, and `'matched'` all correctly return early.
**Warning signs:** A card appears to flip twice or has a scaleX=0 glitch mid-animation.

### Pitfall 2: Evaluation Running Before Second Flip Tween Completes
**What goes wrong:** `evaluatePair()` is called when `flippedIndices.length === 2` but inside `handleCardClick`, which fires before the flip animation completes. If `evaluatePair()` immediately starts the mismatch delay, the flip-back can happen while the flip-up tween is still running.
**Why it happens:** Tween runs asynchronously; `handleCardClick` returns before `onComplete` fires.
**How to avoid:** Trigger `evaluatePair()` (or the pair evaluation logic) only from inside the `onComplete` callback of the flip-up tween. One pattern: `handleCardClick` starts the flip but only calls `evaluatePair()` after the flip finishes.
**Warning signs:** Cards flip back before they visually complete showing the face.

### Pitfall 3: Container Interactivity Requires `setSize()`
**What goes wrong:** `container.setInteractive()` is called without `setSize()`. Clicks on the card do nothing.
**Why it happens:** Phaser Containers have no default input bounds — unlike Sprites, they have no texture to derive bounds from. An unbound Container input hitbox defaults to zero area.
**How to avoid:** Always call `container.setSize(CARD_WIDTH, CARD_HEIGHT)` before `container.setInteractive()`.
**Warning signs:** Console shows no errors, but card clicks are silently ignored.

### Pitfall 4: Peek Phase Leaves Cards in `'faceUp'` State
**What goes wrong:** After the peek, if `cards[i].state` is not reset to `'faceDown'`, the click guard (`card.state !== 'faceDown'`) rejects all clicks for those cards permanently.
**Why it happens:** The peek phase sets states to `'faceUp'`; if flip-back only changes visibility without updating `state`, the state is stale.
**How to avoid:** In the `delayedCall` callback that flips cards back after peek, set `card.state = 'faceDown'` for every non-matched card.
**Warning signs:** After peek, no cards respond to clicks.

### Pitfall 5: `setTimeout` vs `this.time.delayedCall`
**What goes wrong:** Using `setTimeout(() => ..., MISMATCH_HOLD_MS)` for the mismatch delay. When the user navigates to a new round (scene restart), the timer fires after the scene is destroyed and crashes on `.setVisible(false)` of a destroyed object.
**Why it happens:** Browser `setTimeout` has no knowledge of Phaser scene lifecycle.
**How to avoid:** Use `this.time.delayedCall(MISMATCH_HOLD_MS, callback)`. Store the returned `TimerEvent` in `this.mismatchTimer` and cancel it in `handleShutdown()` with `this.mismatchTimer.remove(false)`.
**Warning signs:** Random crashes on scene restart; "Cannot read property of destroyed game object" errors in console.

### Pitfall 6: `tweens.killAll()` in Shutdown
**What goes wrong:** Scene shuts down with active tweens (e.g., during a flip animation). The tween's `onComplete` fires post-shutdown, attempting to access destroyed containers.
**Why it happens:** Tweens are queued in Phaser's tween manager, which keeps references to targets. If the scene shuts down before a tween completes, the `onComplete` callback still fires.
**How to avoid:** Call `this.tweens.killAll()` in `handleShutdown()`. This immediately stops all tweens without firing their `onComplete` callbacks.
**Warning signs:** Errors about accessing properties of null/destroyed objects, appearing after scene transitions.

### Pitfall 7: `isChecking` Not Reset After Matched Pair
**What goes wrong:** Both cards match. `isChecking` is set `true` before evaluation but never set back to `false`. No further card flips are possible.
**Why it happens:** Developer forgets to reset `isChecking` in the match branch (only remembers the mismatch branch).
**How to avoid:** Reset `isChecking = false` in BOTH the match branch (immediately after locking) and after the mismatch flip-back tween completes.
**Warning signs:** After first match, no further clicks work; game appears frozen.

## Code Examples

Verified patterns from official Phaser API and existing codebase:

### Container setInteractive with hit area
```typescript
// Source: Phaser 3 API — Container input (Phaser ^3.90.0)
// Required: setSize() before setInteractive() for Container
container.setSize(CARD_WIDTH, CARD_HEIGHT);
container.setInteractive({ useHandCursor: true });
container.on('pointerdown', () => {
	this.handleCardClick(i); // capture i from buildGrid loop
});
```

### Two-step scaleX tween
```typescript
// Source: Phaser 3 Tween API — confirmed available in Phaser ^3.90.0
this.tweens.add({
	targets: container,
	scaleX: 0,
	duration: FLIP_DURATION_MS,   // 150ms from config/ui.ts
	ease: 'Linear',
	onComplete: () => {
		this.showCardFace(index); // swap visible children at midpoint
		this.tweens.add({
			targets: container,
			scaleX: 1,
			duration: FLIP_DURATION_MS,
			ease: 'Linear',
			onComplete: () => {
				card.state = 'faceUp';
				// safe to evaluate pair here
			},
		});
	},
});
```

### Phaser delayedCall (cancellable)
```typescript
// Source: Phaser 3 Time API — this.time.delayedCall returns TimerEvent
this.mismatchTimer = this.time.delayedCall(MISMATCH_HOLD_MS, () => {
	this.flipCardDown(indexA);
	this.flipCardDown(indexB);
	this.flippedIndices = [];
	// isChecking cleared when flip-down tween completes
});
```

### Container tint for matched state
```typescript
// Source: Phaser 3 Container.setTint API — propagates to all children
// CARD_MATCHED_TINT = 0x888888 defined in config/cards.ts
this.containers[indexA].setTint(CARD_MATCHED_TINT);
this.containers[indexB].setTint(CARD_MATCHED_TINT);
```

### Child layer access pattern
```typescript
// Container children order from Phase 3 buildGrid():
// [0] back    (Graphics — card back face)
// [1] questionMark (Text — '?' on back)
// [2] front   (Graphics — card front face)
// [3] symbolText (Text — symbol character)
const container = this.containers[index];
// Access by index (brittle but explicit):
(container.getAt(0) as Phaser.GameObjects.Graphics).setVisible(false);
(container.getAt(1) as Phaser.GameObjects.Text).setVisible(false);
(container.getAt(2) as Phaser.GameObjects.Graphics).setVisible(true);
(container.getAt(3) as Phaser.GameObjects.Text).setVisible(true);
```

### Shutdown handler registration
```typescript
// Source: CLAUDE.md — Tweens Cleanup pattern (mandatory)
// In GameScene.create():
this.events.on('shutdown', this.handleShutdown, this);

private handleShutdown(): void {
	this.tweens.killAll();
	if (this.mismatchTimer) {
		this.mismatchTimer.remove(false);
		this.mismatchTimer = null;
	}
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Phaser.GameObjects.Sprite` with texture atlas | `Container` + `Graphics` procedural drawing | Project design decision (Phase 3) | No external assets; all visuals code-driven |
| `setTimeout` for game delays | `this.time.delayedCall` | Phaser 3 convention | Lifecycle-safe; cancellable in shutdown |
| Separate tween plugin or `gsap` | Phaser built-in `this.tweens.add` | Phaser 3 built-in | No extra dependency; integrates with scene lifecycle |

**No deprecated approaches:** The scaleX flip tween via `this.tweens.add` has been stable since Phaser 3.0. Container interactivity with `setSize()` + `setInteractive()` is current best practice for Phaser 3.

## Open Questions

1. **Evaluation timing: inside `onComplete` vs separate call**
   - What we know: `evaluatePair()` must not run until both flip-up tweens complete. The second flip-up tween's `onComplete` is the safe trigger point.
   - What's unclear: Should `evaluatePair()` be called from inside the second flip's `onComplete`, or should it be a method called by `handleCardClick` after detecting `flippedIndices.length === 2`?
   - Recommendation: Call `evaluatePair()` from the `onComplete` of the second card's flip-up tween. This guarantees both cards are visually faceUp before evaluation begins. `handleCardClick` initiates the flip; the `onComplete` fires evaluation.

2. **Peek phase: immediate visibility swap vs tween**
   - What we know: Requirements say "briefly reveal their face symbols" — no explicit animation required for peek.
   - What's unclear: Whether to use tweens (16 simultaneous tweens) or immediate `.setVisible()` swaps for the peek reveal.
   - Recommendation: Use immediate visibility swaps (no tween) for peek. 16 simultaneous tweens are noisier to implement and slower. The reveal should feel instantaneous — the point is memory, not animation.

3. **disableInteractive during flip**
   - What we know: `isChecking` guard blocks the third card. But during the flip tween itself, a card is in `'flippingUp'` state — which the guard correctly blocks via `card.state !== 'faceDown'`.
   - What's unclear: Whether `container.disableInteractive()` should also be called per-card during its own flip.
   - Recommendation: State guard is sufficient. Adding `disableInteractive()` adds complexity without benefit since `'flippingUp'` state already blocks re-clicks. Keep it simple.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | none — `vitest run` uses Vite config inheritance |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLIP-01 | scaleX tween flip up via click | smoke (manual) | `npm run dev` + visual inspect | manual-only |
| FLIP-02 | Peek phase: 16 cards show faces for peekDuration then flip back | smoke (manual) | `npm run dev` + visual inspect | manual-only |
| FLIP-03 | isChecking guard blocks third click | smoke (manual) | `npm run dev` + rapid click test | manual-only |
| FLIP-04 | Matched cards lock face-up with tint | smoke (manual) | `npm run dev` + visual inspect | manual-only |
| FLIP-05 | Mismatched cards flip back after 800ms | smoke (manual) | `npm run dev` + visual inspect | manual-only |

**Note on unit test coverage:** Phase 4 is primarily Phaser scene code (tweens, input, Container mutations) — these cannot be unit-tested with Vitest because Phaser requires a canvas/DOM environment. The `isMatch()` function used in evaluation is already covered by `game-logic.test.ts`. No new pure logic functions are introduced in Phase 4 that would warrant new Vitest tests. All validation is manual smoke testing.

### Sampling Rate
- **Per task commit:** `npm run test` (confirms existing tests still pass; no regressions)
- **Per wave merge:** `npm run test` + `npm run dev` manual smoke
- **Phase gate:** `npm run test` green + manual verification of all 5 FLIP requirements before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all automated test requirements. No new test files are needed for Phase 4 (all new behavior requires Phaser runtime). Existing `game-logic.test.ts` and `config/grid.test.ts` already pass and cover the logic Phase 4 calls.

## Sources

### Primary (HIGH confidence)
- `src/game/config/ui.ts` (project file) — FLIP_DURATION_MS=150, MISMATCH_HOLD_MS=800 confirmed
- `src/game/config/cards.ts` (project file) — CARD_MATCHED_TINT=0x888888 confirmed
- `src/game/config/rounds.ts` (project file) — ROUND_CONFIGS with peekDuration per round confirmed
- `src/game/game-logic.ts` (project file) — isMatch(), CardState type, CardData interface confirmed
- `src/game/scenes/GameScene.ts` (project file) — this.cards, this.containers array structure; container child order [back, questionMark, front, symbolText] confirmed
- `CLAUDE.md` (project file) — CardState values, Tweens Cleanup pattern, Scene Communication pattern
- `.planning/REQUIREMENTS.md` (project file) — FLIP-01 through FLIP-05 exact behaviors
- `package.json` (project file) — Phaser ^3.90.0, Vitest ^4.0.18 confirmed installed

### Secondary (MEDIUM confidence)
- Phaser 3 Container `setSize()` + `setInteractive()` pattern — verified via Phaser 3 documentation knowledge; confirmed stable across Phaser 3.x versions
- Phaser 3 `this.tweens.add` with `scaleX` target and `onComplete` — stable Tween API since Phaser 3.0
- Phaser 3 `this.time.delayedCall` returning cancellable `TimerEvent` — standard pattern in all Phaser 3 game examples

### Tertiary (LOW confidence)
None — all findings are based on project source files or well-established Phaser 3 API patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed in package.json; no new dependencies
- Architecture: HIGH — all patterns derived from existing project files and CLAUDE.md
- Pitfalls: HIGH — derived from CardState type analysis, Phaser lifecycle behavior, and state machine logic
- Test infrastructure: HIGH — existing Vitest setup confirmed; Phase 4 is manual-smoke-only for new behavior

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable Phaser 3 API; no fast-moving dependencies in scope)
