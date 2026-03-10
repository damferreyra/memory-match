# Phase 3: Grid - Research

**Researched:** 2026-03-10
**Domain:** Phaser 3 GameObjects (Container, Graphics, Text), pure TypeScript logic, Vitest unit testing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Config files — all constants exactly as specified in MEMORY_GAME_PLAN.md:**
- `config/cards.ts`: CARD_WIDTH=140, CARD_HEIGHT=140, CARD_CORNER_RADIUS=12, CARD_BACK_COLOR=0x2c3e50, CARD_BACK_BORDER=0x1a252f, CARD_MATCHED_TINT=0x888888, SYMBOLS array, SYMBOL_COLORS record (hex integers), SYMBOL_FONT_SIZE=52, CARD_FACE_BG=0xffffff, CARD_FACE_BORDER=0xcccccc
- `config/grid.ts`: GRID_COLS=4, GRID_ROWS=4, GRID_GAP=12, GRID_ORIGIN_Y=90, `getCardPosition(index, layout)` pure function
- `config/rounds.ts`: ROUND_CONFIGS array with 3 entries (60s/1.5s, 45s/1.0s, 30s/0.5s)
- `config/ui.ts`: depth constants (CARD_DEPTH=10, HUD_DEPTH=20, OVERLAY_DEPTH=30), HUD sizing, timer colors, flip/mismatch timing, streak/scoring constants

**Pure logic (game-logic.ts):**
- Zero Phaser imports — required for Vitest without mocking
- Export: `CardState` type, `CardData` interface, `shuffle<T>()`, `generateCardPairs(symbolCount)`, `isMatch(a, b)`, `computeMatchScore(streak)`, `computeTimeBonus(seconds)`
- Types live in game-logic.ts (no separate types.ts needed)

**Vitest tests:**
- `game-logic.test.ts`: shuffle preserves all elements; generateCardPairs(8) → 16 items, each 0–7 appears exactly twice; isMatch() true/false; computeMatchScore() caps at BASE_MATCH_SCORE + STREAK_BONUS_MAX; computeTimeBonus() floors correctly
- `config/grid.test.ts`: getCardPosition(0, layout) within canvas bounds; getCardPosition(15, layout) within canvas bounds; all 16 positions distinct; no card center exceeds GAME_WIDTH or GAME_HEIGHT

**GameScene rendering:**
- Match MenuScene's gradient background (0x1a1a2e → 0x16213e)
- Each card = `Phaser.GameObjects.Container` holding: back Graphics rect (rounded, CARD_BACK_COLOR fill + CARD_BACK_BORDER border), face Graphics rect (white, hidden initially), symbol Text (hidden initially)
- Face-down state: show back rect, hide face rect and symbol text
- `?` symbol on face-down: white (#ffffff), font size 48px, centered — smaller than symbol font size (52px)
- Set depth to CARD_DEPTH (10) on all card containers

**MenuScene cleanup:**
- MenuScene's local SYMBOLS/SYMBOL_COLORS arrays stay as-is for Phase 3 — no refactor needed

### Claude's Discretion
- Exact border width/stroke thickness on cards
- Whether to use `fillRoundedRect` with border via separate `strokeRoundedRect` or layered rects
- Container centering approach (setOrigin vs positional offset)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRID-01 | Config files exist: `config/cards.ts`, `config/grid.ts`, `config/rounds.ts`, `config/ui.ts` with all constants defined per MEMORY_GAME_PLAN.md | All constant values are fully specified in the plan — verbatim copy, no research ambiguity |
| GRID-02 | Pure function `generateCardPairs(8)` returns 16 shuffled symbolIds (each 0–7 appears exactly twice) | Fisher-Yates shuffle pattern verified; pure function with no Phaser dependency |
| GRID-03 | Pure function `getCardPosition(index, layout)` returns correct pixel coordinates for all 16 card indices | Grid geometry math verified: origin (214, 90), last card center (740, 616) — all within canvas |
| GRID-04 | Unit tests pass: `game-logic.test.ts` and `config/grid.test.ts` (via `npm run test`) | Vitest already installed (^4.0.18) and configured via `vitest run`; no test files exist yet (Wave 0 gaps) |
| GRID-05 | 16 face-down cards rendered in a 4×4 grid, centered on the 1024×768 canvas | Phaser Container + Graphics pattern established by MenuScene; depth constants from config/ui.ts |
</phase_requirements>

## Summary

Phase 3 is a well-specified implementation phase with no ambiguity — MEMORY_GAME_PLAN.md provides exact constant values, complete type definitions, and function signatures for every file. The research task is primarily verification and pattern extraction rather than discovery.

The core technical challenge is three distinct concerns: (1) authoring four config modules with exact constant values, (2) implementing pure TypeScript logic functions with no Phaser dependency so Vitest can run them without mocking, and (3) rendering 16 `Phaser.GameObjects.Container` instances in GameScene using patterns already established by MenuScene. These three concerns are independent and can be implemented in parallel within the wave structure.

The grid geometry math has been verified: with GAME_WIDTH=1024, CARD_WIDTH=140, GRID_COLS=4, GRID_GAP=12 the total grid width is 596px, giving GRID_ORIGIN_X=214. The bottom edge of the grid sits at y=686, leaving 82px margin before the canvas bottom (768). All 16 card centers are within canvas bounds. No existing test files exist — both test files are Wave 0 gaps.

**Primary recommendation:** Implement config files and game-logic.ts first (pure TypeScript, no runtime needed), write and pass all tests, then implement GameScene rendering last. This order lets the test suite validate logic before any rendering work begins.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | ^3.90.0 (installed) | GameObjects.Container, Graphics, Text, Scene | Already in project; no alternative |
| TypeScript | ~5.7.2 (installed) | Strict typing, `noUnusedLocals`, `noUnusedParameters` | Already in project |
| Vitest | ^4.0.18 (installed) | Unit test runner for pure logic | Already configured; `npm run test` = `vitest run` |
| Biome | ^2.4.4 (installed) | Formatter (tabs, single quotes) + linter | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vite | ^6.3.1 (installed) | Dev server port 8080 | Manual smoke testing only in this phase |

### Alternatives Considered
None — stack is fixed. No new dependencies are introduced in Phase 3.

**Installation:**
```bash
# No new packages needed — all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure (after Phase 3)
```
src/game/
├── constants.ts              # GAME_WIDTH/HEIGHT, SCENE_KEYS, REGISTRY_KEYS (EXISTS)
├── game-logic.ts             # Pure logic — NO Phaser imports (NEW)
├── game-logic.test.ts        # Vitest tests for pure logic (NEW)
├── config/
│   ├── assets.ts             # ASSET_KEYS enum (EXISTS)
│   ├── cards.ts              # SYMBOLS, SYMBOL_COLORS, card visual constants (NEW)
│   ├── grid.ts               # GRID_LAYOUT, getCardPosition() (NEW)
│   ├── grid.test.ts          # Vitest tests for getCardPosition() (NEW)
│   ├── rounds.ts             # ROUND_CONFIGS array (NEW)
│   └── ui.ts                 # Depth constants, HUD sizing, timing, scoring (NEW)
└── scenes/
    ├── BootScene.ts          # EXISTS — untouched
    ├── MenuScene.ts          # EXISTS — untouched
    ├── GameScene.ts          # EXISTS placeholder — fill create()
    └── UIScene.ts            # EXISTS placeholder — untouched
```

### Pattern 1: Pure Logic Module (game-logic.ts)
**What:** All game logic functions export from a single file with zero Phaser imports.
**When to use:** Any function that operates on plain data types only (numbers, arrays, interfaces). Never import Phaser here.
**Example:**
```typescript
// Source: MEMORY_GAME_PLAN.md — Pure Logic section
import { STREAK_BONUS_PER_MATCH, STREAK_BONUS_MAX, BASE_MATCH_SCORE, TIME_BONUS_PER_SECOND } from './config/ui';

export type CardState = 'faceDown' | 'flippingUp' | 'faceUp' | 'flippingDown' | 'matched';

export interface CardData {
	id: number;       // unique 0..15
	symbolId: number; // 0..7
	state: CardState;
}

export function shuffle<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function generateCardPairs(symbolCount: number): number[] {
	const pairs = Array.from({ length: symbolCount }, (_, i) => [i, i]).flat();
	return shuffle(pairs);
}

export function isMatch(symbolA: number, symbolB: number): boolean {
	return symbolA === symbolB;
}

export function computeMatchScore(streakCount: number): number {
	const bonus = Math.min(streakCount * STREAK_BONUS_PER_MATCH, STREAK_BONUS_MAX);
	return BASE_MATCH_SCORE + bonus;
}

export function computeTimeBonus(secondsRemaining: number): number {
	return Math.floor(secondsRemaining) * TIME_BONUS_PER_SECOND;
}
```

### Pattern 2: GridLayout Interface and getCardPosition()
**What:** A pure function that computes pixel center coordinates from a card index and a layout config object. Lives in `config/grid.ts` with no Phaser import.
**When to use:** Anywhere a card position is needed — both in GameScene rendering and in tests.
**Example:**
```typescript
// Source: MEMORY_GAME_PLAN.md — config/grid.ts schema
import { GAME_WIDTH } from '../constants';
import { CARD_WIDTH, CARD_HEIGHT } from './cards';

export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const GRID_GAP = 12;

// Derived: (1024 - (4*140 + 3*12)) / 2 = (1024 - 596) / 2 = 214
export const GRID_ORIGIN_X = (GAME_WIDTH - GRID_COLS * CARD_WIDTH - (GRID_COLS - 1) * GRID_GAP) / 2;
export const GRID_ORIGIN_Y = 90;

export interface GridLayout {
	cols: number;
	rows: number;
	cardWidth: number;
	cardHeight: number;
	gap: number;
	originX: number;
	originY: number;
}

export const GRID_LAYOUT: GridLayout = {
	cols: GRID_COLS,
	rows: GRID_ROWS,
	cardWidth: CARD_WIDTH,
	cardHeight: CARD_HEIGHT,
	gap: GRID_GAP,
	originX: GRID_ORIGIN_X,
	originY: GRID_ORIGIN_Y,
};

export function getCardPosition(index: number, layout: GridLayout): { x: number; y: number } {
	const col = index % layout.cols;
	const row = Math.floor(index / layout.cols);
	return {
		x: layout.originX + col * (layout.cardWidth + layout.gap) + layout.cardWidth / 2,
		y: layout.originY + row * (layout.cardHeight + layout.gap) + layout.cardHeight / 2,
	};
}
```

### Pattern 3: Card Container in GameScene
**What:** Each card is a `Phaser.GameObjects.Container` positioned at the card center, holding layered Graphics and Text objects.
**When to use:** Building the 16-card grid in `GameScene.create()` via a `buildGrid()` helper method.
**Example:**
```typescript
// Source: CONTEXT.md — GameScene rendering decisions + MenuScene.ts pattern
private buildGrid(cardPairs: number[]): void {
	for (let i = 0; i < cardPairs.length; i++) {
		const pos = getCardPosition(i, GRID_LAYOUT);
		const container = this.add.container(pos.x, pos.y);
		container.setDepth(CARD_DEPTH);

		// Back face (visible initially)
		const back = this.add.graphics();
		back.fillStyle(CARD_BACK_COLOR);
		back.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
		// Border layer (drawn underneath or via strokeRoundedRect — see Claude's Discretion)

		// Question mark label on back
		const questionMark = this.add.text(0, 0, '?', {
			fontSize: '48px',
			fontFamily: 'Arial, sans-serif',
			color: '#ffffff',
		}).setOrigin(0.5);

		// Front face (hidden initially)
		const front = this.add.graphics();
		front.fillStyle(CARD_FACE_BG);
		front.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
		front.setVisible(false);

		// Symbol text (hidden initially)
		const symbol = SYMBOLS[cardPairs[i]];
		const symbolText = this.add.text(0, 0, symbol, {
			fontSize: `${SYMBOL_FONT_SIZE}px`,
			fontFamily: 'Arial, sans-serif',
			color: `#${SYMBOL_COLORS[symbol as Symbol].toString(16).padStart(6, '0')}`,
		}).setOrigin(0.5).setVisible(false);

		container.add([back, questionMark, front, symbolText]);
	}
}
```

**Note on Container coordinates:** When a child is added to a Container at (0, 0), it renders at the container's world position. Graphics drawcalls inside a container use coordinates relative to the container origin. A card Container placed at `pos.x, pos.y` (the card center) means the Graphics rect should be drawn at `(-CARD_WIDTH/2, -CARD_HEIGHT/2)` to be centered on the container origin.

### Pattern 4: Background Gradient (reused from MenuScene)
**What:** Identical gradient call to match MenuScene visual consistency.
**When to use:** First draw call in `GameScene.create()`.
**Example:**
```typescript
// Source: MenuScene.ts (existing)
const bg = this.add.graphics();
bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
```

### Anti-Patterns to Avoid
- **Magic numbers in GameScene:** Do not write literal values like `140`, `12`, `0x2c3e50` in scene code. Every value must come from a named constant in a config file.
- **Phaser import in game-logic.ts:** Any Phaser import in game-logic.ts will cause Vitest to fail because Phaser requires a DOM/canvas environment. The scoring constants it needs (STREAK_BONUS_PER_MATCH etc.) live in `config/ui.ts` which is plain TypeScript — that import is safe.
- **Storing CardData in the Container itself:** Phase 4 needs to look up `CardData` by container. Store card data in a parallel array indexed by card index, not as a property on the Container.
- **Container origin misconception:** `this.add.container(x, y)` places the container origin at (x, y). There is no `setOrigin()` on Container — children's positions are relative to this origin. Draw the card rect at `(-W/2, -H/2)` to center it on the origin.
- **CSS color strings in fillStyle:** Phaser `graphics.fillStyle()` requires a hex integer (`0xRRGGBB`), not a CSS string (`'#ffffff'`). Use hex integers everywhere. CSS strings are only valid in `this.add.text()` `color` property.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fisher-Yates shuffle | Custom swap logic | The canonical algorithm from MEMORY_GAME_PLAN.md | Off-by-one errors in shuffle implementations are common; the plan provides the exact reference implementation |
| Card pixel coordinates | Ad-hoc x/y math per card | `getCardPosition(index, GRID_LAYOUT)` from config/grid.ts | Centralizes layout math; makes grid.test.ts possible; enables Phase 4 hit-testing by index |
| Round configuration | Inline timing values | `ROUND_CONFIGS[roundIndex]` from config/rounds.ts | Registry stores `CURRENT_ROUND` (1-based); `ROUND_CONFIGS[round - 1]` gives the right config |
| Color conversion for Text | Manual hex-to-CSS | `'#' + color.toString(16).padStart(6, '0')` | Text `color` property needs CSS string but constants are hex integers |

**Key insight:** In this phase, "don't hand-roll" means don't inline constants — every value must route through a named config export. The plan has already solved all the hard problems; the task is faithful transcription.

## Common Pitfalls

### Pitfall 1: Vitest Running in Node (no DOM/Canvas)
**What goes wrong:** If `game-logic.ts` imports anything from Phaser (even transitively), Vitest fails with `ReferenceError: window is not defined` or similar canvas errors.
**Why it happens:** Phaser assumes a browser environment. Vitest runs in Node by default.
**How to avoid:** Keep `game-logic.ts` with zero Phaser imports. The only imports allowed are from `./config/ui` (plain TypeScript constants). Verify: `grep -r 'phaser' src/game/game-logic.ts` should return nothing.
**Warning signs:** Test file shows import error on `game-logic.ts` before any test runs.

### Pitfall 2: Container Children Coordinates Are Relative
**What goes wrong:** Developer draws `fillRoundedRect(pos.x, pos.y, ...)` inside a container, placing the card at double-offset.
**Why it happens:** The container is already positioned at `pos.x, pos.y`; children coordinates are relative to container origin (0,0).
**How to avoid:** Draw rect at `(-CARD_WIDTH/2, -CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, radius)`. Text at `(0, 0).setOrigin(0.5)`.
**Warning signs:** Cards appear in wrong positions or off-screen.

### Pitfall 3: `noUnusedLocals` / `noUnusedParameters` TypeScript Errors
**What goes wrong:** `npm run test` fails type-check or build because a constant exported from config is not yet consumed by any scene.
**Why it happens:** `tsconfig.json` has `"noUnusedLocals": true` and `"noUnusedParameters": true`.
**How to avoid:** Constants are exported (not local), so `noUnusedLocals` does not fire on exported values. However, function parameters that are unused WILL cause errors. Ensure `getCardPosition` uses all parameters of `GridLayout` it references, and `computeMatchScore(streakCount)` uses `streakCount`.
**Warning signs:** TypeScript compiler errors in `tsc --noEmit` output.

### Pitfall 4: Symbol Color Conversion for Phaser Text
**What goes wrong:** `SYMBOL_COLORS` stores hex integers (`0xf39c12`), but `this.add.text()` `color` property requires a CSS color string (`'#f39c12'`).
**Why it happens:** Two different color format conventions: Graphics uses hex int, Text uses CSS string.
**How to avoid:** Convert at the call site: `'#' + SYMBOL_COLORS[symbol].toString(16).padStart(6, '0')`. Note: symbols in SYMBOLS are `as const` so the key type is `Symbol` (the project type, not built-in Symbol).
**Warning signs:** Card face shows text in wrong color or default white.

### Pitfall 5: CardData Array Not Accessible from Phase 4
**What goes wrong:** Phase 4 needs `CardData` for each container to implement flip logic, but if data is only local to `buildGrid()`, Phase 4 has no way to access it.
**Why it happens:** Scope leak — state created inside a method and not stored on `this`.
**How to avoid:** Store `this.cards: CardData[]` and `this.containers: Phaser.GameObjects.Container[]` as class properties on `GameScene`. Phase 4 will add interactivity using these arrays.
**Warning signs:** Phase 4 has to restructure the data model, requiring a full rewrite.

### Pitfall 6: GRID_ORIGIN_X Computed at Import Time
**What goes wrong:** `config/grid.ts` imports from `../constants` and `./cards` to compute `GRID_ORIGIN_X`. If import order is circular, the value resolves as `NaN`.
**Why it happens:** Module evaluation order; circular imports are the risk.
**How to avoid:** The import chain is `grid.ts → constants.ts` (no Phaser) and `grid.ts → cards.ts` (no Phaser). Neither imports from `grid.ts`, so there is no circular dependency. Safe.
**Warning signs:** `GRID_ORIGIN_X` is `NaN` at runtime; cards all render at the same x position.

## Code Examples

Verified patterns from existing codebase and MEMORY_GAME_PLAN.md:

### Vitest Test Structure for game-logic.test.ts
```typescript
// Source: MEMORY_GAME_PLAN.md — Test Plan section
import { describe, expect, it } from 'vitest';
import { generateCardPairs, isMatch, computeMatchScore, computeTimeBonus, shuffle } from './game-logic';
import { BASE_MATCH_SCORE, STREAK_BONUS_MAX } from './config/ui';

describe('shuffle', () => {
	it('preserves all elements', () => {
		const input = [1, 2, 3, 4, 5];
		const result = shuffle([...input]);
		expect(result).toHaveLength(input.length);
		expect(result.sort()).toEqual(input.sort());
	});
});

describe('generateCardPairs', () => {
	it('returns 16 items for symbolCount=8', () => {
		const pairs = generateCardPairs(8);
		expect(pairs).toHaveLength(16);
	});
	it('each symbolId 0–7 appears exactly twice', () => {
		const pairs = generateCardPairs(8);
		for (let i = 0; i < 8; i++) {
			expect(pairs.filter((s) => s === i)).toHaveLength(2);
		}
	});
});

describe('computeMatchScore', () => {
	it('caps at BASE_MATCH_SCORE + STREAK_BONUS_MAX', () => {
		const max = computeMatchScore(100); // streakCount large enough to exceed cap
		expect(max).toBe(BASE_MATCH_SCORE + STREAK_BONUS_MAX);
	});
});
```

### Vitest Test Structure for config/grid.test.ts
```typescript
// Source: MEMORY_GAME_PLAN.md — Test Plan section + CONTEXT.md
import { describe, expect, it } from 'vitest';
import { getCardPosition, GRID_LAYOUT } from './grid';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

describe('getCardPosition', () => {
	it('index 0 is within canvas bounds', () => {
		const pos = getCardPosition(0, GRID_LAYOUT);
		expect(pos.x).toBeGreaterThan(0);
		expect(pos.x).toBeLessThan(GAME_WIDTH);
		expect(pos.y).toBeGreaterThan(0);
		expect(pos.y).toBeLessThan(GAME_HEIGHT);
	});
	it('index 15 is within canvas bounds', () => {
		const pos = getCardPosition(15, GRID_LAYOUT);
		expect(pos.x).toBeLessThan(GAME_WIDTH);
		expect(pos.y).toBeLessThan(GAME_HEIGHT);
	});
	it('all 16 positions are distinct', () => {
		const positions = Array.from({ length: 16 }, (_, i) => getCardPosition(i, GRID_LAYOUT));
		const keys = positions.map((p) => `${p.x},${p.y}`);
		expect(new Set(keys).size).toBe(16);
	});
});
```

### Gradient Background (copy from MenuScene)
```typescript
// Source: src/game/scenes/MenuScene.ts (existing, verified)
const bg = this.add.graphics();
bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
```

### Graphics Rounded Rectangle (established in MenuScene)
```typescript
// Source: src/game/scenes/MenuScene.ts (existing, verified)
const btn = this.add.graphics();
btn.fillStyle(0xe74c3c);
btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
```

### Border via strokeRoundedRect (Claude's Discretion — recommended approach)
```typescript
// Phaser 3 Graphics supports strokeRoundedRect for bordered cards
const back = this.add.graphics();
back.fillStyle(CARD_BACK_COLOR);
back.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
back.lineStyle(2, CARD_BACK_BORDER, 1);
back.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Phaser.GameObjects.Sprite` for cards | `Phaser.GameObjects.Container` + `Graphics` | Project design decision | No external textures needed; all rendering is procedural |
| Separate test framework (Jest) | Vitest | Project uses Vite; Vitest is the idiomatic choice | `npm run test` = `vitest run`; no jest.config needed |

**Note on Vitest version:** The project uses Vitest ^4.0.18 (very recent). The `vitest run` command (non-watch) is already configured as `npm run test`. No separate `vitest.config.ts` file was found in the project — Vitest will pick up test files matching `**/*.test.ts` by default when run from the project root.

## Open Questions

1. **strokeRoundedRect availability in Phaser 3.90**
   - What we know: `fillRoundedRect` is confirmed used in MenuScene. `strokeRoundedRect` is a documented Phaser Graphics method present since Phaser 3.13.
   - What's unclear: Minor API surface — not verified against Phaser 3.90 changelog.
   - Recommendation: Use `strokeRoundedRect` (it has been stable for many versions). Fallback if it causes issues: use `lineStyle` + `strokeRect` for the border only (loses rounded corners but functionally equivalent).

2. **Vitest config file needed?**
   - What we know: No `vitest.config.ts` found in the project; `npm run test` is `vitest run`.
   - What's unclear: Whether Vitest 4.x requires explicit config for TypeScript path resolution.
   - Recommendation: Try without config file first. Vitest inherits Vite's TypeScript config. If module resolution fails, add minimal `vitest.config.ts` with `{ test: { environment: 'node' } }`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | none detected — `vitest run` uses Vite config inheritance |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRID-01 | Config constants exported with correct values | unit | `npm run test` (grid.test.ts checks GRID_LAYOUT values) | Wave 0 |
| GRID-02 | generateCardPairs(8) returns 16 items, each symbolId 0–7 exactly twice | unit | `npm run test` (game-logic.test.ts) | Wave 0 |
| GRID-03 | getCardPosition(index, layout) returns correct pixel coords for all 16 indices | unit | `npm run test` (grid.test.ts) | Wave 0 |
| GRID-04 | All unit tests pass via `npm run test` | unit | `npm run test` | Wave 0 |
| GRID-05 | 16 face-down cards visible in 4x4 grid on 1024x768 canvas | smoke (manual) | `npm run dev` + visual inspect | manual-only |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/game/game-logic.test.ts` — covers GRID-02, GRID-04 (shuffle, generateCardPairs, isMatch, computeMatchScore, computeTimeBonus)
- [ ] `src/game/config/grid.test.ts` — covers GRID-01 (layout constants), GRID-03 (getCardPosition all 16 positions), GRID-04
- [ ] No missing framework install — Vitest already in devDependencies

## Sources

### Primary (HIGH confidence)
- `MEMORY_GAME_PLAN.md` (project file) — Complete constant values, type definitions, function signatures, test plan
- `src/game/scenes/MenuScene.ts` (project file) — Graphics drawing patterns, gradient call, rounded rect pattern
- `src/game/constants.ts` (project file) — GAME_WIDTH=1024, GAME_HEIGHT=768, SCENE_KEYS, REGISTRY_KEYS
- `package.json` (project file) — Confirmed versions: Phaser ^3.90.0, Vitest ^4.0.18, `npm run test` = `vitest run`
- `tsconfig.json` (project file) — `noUnusedLocals`, `noUnusedParameters`, `strict: true`
- `.planning/phases/03-grid/03-CONTEXT.md` — Locked implementation decisions

### Secondary (MEDIUM confidence)
- Phaser 3 Graphics API (fillRoundedRect, strokeRoundedRect, fillGradientStyle) — verified via MenuScene usage; strokeRoundedRect assumed stable since Phaser 3.13+

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed in package.json
- Architecture: HIGH — all patterns verified in existing MenuScene.ts and MEMORY_GAME_PLAN.md
- Pitfalls: HIGH — derived from TypeScript config, Phaser API behavior, and module system constraints
- Test infrastructure: HIGH — Vitest installed, command verified; only gap is the test files themselves (Wave 0)

**Research date:** 2026-03-10
**Valid until:** 2026-06-10 (stable stack; Phaser 3 API is stable)
