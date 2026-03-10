# Phase 3: Grid - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Write all config constant files (`config/cards.ts`, `config/grid.ts`, `config/rounds.ts`, `config/ui.ts`), the pure game-logic module (`game-logic.ts`) with Vitest unit tests, and render 16 face-down cards in a 4×4 grid in `GameScene.create()`. Card interaction and flip logic are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Config files
- All constants exactly as specified in MEMORY_GAME_PLAN.md — no deviations
- `config/cards.ts`: CARD_WIDTH=140, CARD_HEIGHT=140, CARD_CORNER_RADIUS=12, CARD_BACK_COLOR=0x2c3e50, CARD_BACK_BORDER=0x1a252f, CARD_MATCHED_TINT=0x888888, SYMBOLS array, SYMBOL_COLORS record (hex integers), SYMBOL_FONT_SIZE=52, CARD_FACE_BG=0xffffff, CARD_FACE_BORDER=0xcccccc
- `config/grid.ts`: GRID_COLS=4, GRID_ROWS=4, GRID_GAP=12, GRID_ORIGIN_Y=90, `getCardPosition(index, layout)` pure function
- `config/rounds.ts`: ROUND_CONFIGS array with 3 entries (60s/1.5s, 45s/1.0s, 30s/0.5s)
- `config/ui.ts`: depth constants (CARD_DEPTH=10, HUD_DEPTH=20, OVERLAY_DEPTH=30), HUD sizing, timer colors, flip/mismatch timing, streak/scoring constants

### Pure logic (game-logic.ts)
- Zero Phaser imports — required for Vitest without mocking
- Export: `CardState` type, `CardData` interface, `shuffle<T>()`, `generateCardPairs(symbolCount)`, `isMatch(a, b)`, `computeMatchScore(streak)`, `computeTimeBonus(seconds)`
- Types can live in game-logic.ts (no separate types.ts needed)

### Vitest tests
- `game-logic.test.ts`: shuffle preserves all elements; generateCardPairs(8) → 16 items, each 0–7 appears exactly twice; isMatch() true/false; computeMatchScore() caps at BASE_MATCH_SCORE + STREAK_BONUS_MAX; computeTimeBonus() floors correctly
- `config/grid.test.ts`: getCardPosition(0, layout) within canvas bounds; getCardPosition(15, layout) within canvas bounds; all 16 positions distinct; no card center exceeds GAME_WIDTH or GAME_HEIGHT

### GameScene rendering
- Match MenuScene's gradient background (0x1a1a2e → 0x16213e) for visual consistency
- Render each card as a `Phaser.GameObjects.Container` holding: back Graphics rect (rounded, CARD_BACK_COLOR fill + CARD_BACK_BORDER border), face Graphics rect (white, hidden initially), symbol Text (hidden initially)
- Face-down state: show back rect, hide face rect and symbol text
- `?` symbol on face-down: white (#ffffff), font size 48px, centered on card — large enough to be readable, smaller than symbol font size (52px)
- Set depth to CARD_DEPTH (10) on all card containers

### MenuScene cleanup
- When cards.ts is created, MenuScene's local SYMBOLS/SYMBOL_COLORS arrays can stay as-is for Phase 3 (they use CSS strings for Phaser Text which is correct) — no refactor needed, they're separate concerns (display text vs. Graphics fillStyle)

### Claude's Discretion
- Exact border width/stroke thickness on cards
- Whether to use `fillRoundedRect` with border via separate `strokeRoundedRect` or layered rects
- Container centering approach (setOrigin vs positional offset)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `constants.ts`: GAME_WIDTH (1024), GAME_HEIGHT (768) — import these in grid.ts for GRID_ORIGIN_X calculation
- `SCENE_KEYS.GAME`: already registered in Phaser game config — GameScene just needs its `create()` filled
- `MenuScene.ts` gradient: `fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1)` — reuse exact same call in GameScene for visual consistency

### Established Patterns
- Graphics drawing: `this.add.graphics()` → `fillStyle(color)` → `fillRoundedRect(x, y, w, h, radius)` — MenuScene establishes this pattern
- Text: `this.add.text(x, y, str, { fontSize, fontFamily, color })` with `.setOrigin(0.5)` for centering
- Hex integers for all `fillStyle` colors (0xRRGGBB format)
- Imports via relative paths from `../constants`

### Integration Points
- `GameScene.create()` is the entry point — everything wires here
- `REGISTRY_KEYS.CURRENT_ROUND` is already set to 1 by MenuScene before GameScene starts
- `game-logic.ts` will import constants from `config/cards.ts` (STREAK_BONUS_PER_MATCH, STREAK_BONUS_MAX, BASE_MATCH_SCORE, TIME_BONUS_PER_SECOND) for score functions

</code_context>

<specifics>
## Specific Ideas

- MEMORY_GAME_PLAN.md is the authoritative spec — follow it exactly for all constant values
- Card containers should be structured so Phase 4 can add `.setInteractive()` and flip tweens without restructuring the container

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-grid*
*Context gathered: 2026-03-10*
