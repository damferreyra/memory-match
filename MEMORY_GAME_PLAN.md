# Memory Match — Game Plan

A new Phaser 3 memory matching game built on the same stack and patterns as Math Quest.
This document is the blueprint for a **new, separate project** scaffolded from scratch.

---

## Game Design

### Core Loop
1. A 4×4 grid of 16 cards is laid out face-down (8 pairs).
2. At round start, all cards briefly show their faces ("peek" phase), then flip back.
3. The player clicks two cards per turn:
   - **Match** → cards stay face-up, locked. Score awarded.
   - **No match** → both cards flip back face-down after a short delay.
4. Round ends when either all 8 pairs are matched (win) or the timer hits 0 (game over).
5. On round win, proceed to the next round (harder). On game over, show the game-over screen.
6. After the final round is won, show a victory/congratulations screen.

### Round Progression (3 rounds)

| Round | Grid | Pairs | Time Limit | Peek Duration |
|-------|------|-------|------------|---------------|
| 1     | 4×4  | 8     | 60 s       | 1.5 s         |
| 2     | 4×4  | 8     | 45 s       | 1.0 s         |
| 3     | 4×4  | 8     | 30 s       | 0.5 s         |

All 3 rounds use the same grid. Difficulty comes from less time and a shorter memory peek.

### Scoring
- **Per match**: 100 base points.
- **Streak bonus**: each consecutive match without a miss adds +50 (capped at +200 per match).
  - Miss resets streak to 0.
- **Time bonus at round end**: `Math.floor(timeRemaining) × 10` points.
- Score is cumulative across all rounds.

### Win / Lose Conditions
- **Round win**: all 8 pairs matched before timer expires → advance to next round.
- **Game over**: timer hits 0 → show game-over panel (display total score).
- **Game win**: all rounds completed → show victory panel (display total score).

### Card Visual Design (no external art needed)
Cards are drawn with Phaser.Graphics + Text:
- **Face-down**: dark-blue rounded rectangle, decorative `?` symbol.
- **Face-up**: colored rounded rectangle + symbol text (emoji or letter).
- **Matched**: same face-up appearance, slightly de-saturated tint (0xaaaaaa) to indicate locked.

Symbol set (8 symbols, one per pair):
```
★  ♦  ♠  ♥  ✿  ♪  ▲  ●
```
Each symbol gets a distinct bright color from a palette defined in `config/cards.ts`.

---

## Stack

Identical to Math Quest. Copy these files verbatim and adjust where noted:

| File | Action |
|------|--------|
| `package.json` | Copy, change `"name"` to `"memory-match"` |
| `tsconfig.json` | Copy as-is |
| `biome.json` | Copy as-is |
| `vite/config.dev.mjs` | Copy as-is (port 8080) |
| `vite/config.prod.mjs` | Copy as-is |
| `index.html` | Copy, change title to `Memory Match` |
| `log.js` | Copy as-is (optional dev logging) |

---

## Project File Structure

```
memory-match/
├── index.html
├── package.json
├── tsconfig.json
├── biome.json
├── log.js
├── vite/
│   ├── config.dev.mjs
│   └── config.prod.mjs
└── src/
    ├── main.ts                        # Entry: StartGame('game-container')
    └── game/
        ├── main.ts                    # Phaser Game config + StartGame() factory
        ├── constants.ts               # SCENE_KEYS, REGISTRY_KEYS, GAME_WIDTH/HEIGHT
        ├── game-logic.ts              # shuffle(), generateCardPairs() — pure, no Phaser
        ├── game-logic.test.ts         # Vitest tests for pure logic
        ├── config/
        │   ├── assets.ts              # ASSET_KEYS enum (minimal — mostly Graphics drawn)
        │   ├── cards.ts               # SYMBOLS, SYMBOL_COLORS, card visual constants
        │   ├── grid.ts                # GRID layout, CARD_SIZE, GAP, getCardPosition()
        │   ├── grid.test.ts           # Vitest tests for getCardPosition()
        │   ├── rounds.ts              # ROUND_CONFIGS array (timeLimit, peekDuration)
        │   └── ui.ts                  # Depth constants + overlay configs
        └── scenes/
            ├── BootScene.ts           # Asset preload → MenuScene
            ├── MenuScene.ts           # Title + Play button → GameScene
            ├── GameScene.ts           # Grid, cards, flip logic, timer, scoring
            └── UIScene.ts             # Round-complete, game-over, game-win overlays
```

---

## Config File Schemas

### `constants.ts`
```typescript
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
} as const;

export const REGISTRY_KEYS = {
  CURRENT_ROUND: 'currentRound',   // number, 1-based. MenuScene initializes to 1.
  TOTAL_SCORE: 'totalScore',       // number. GameScene accumulates.
  TOTAL_ROUNDS: 'totalRounds',     // number. Set from ROUND_CONFIGS.length at start.
} as const;
```

### `config/rounds.ts`
```typescript
export interface RoundConfig {
  round: number;
  timeLimit: number;    // seconds
  peekDuration: number; // seconds all cards are visible at round start
}

export const ROUND_CONFIGS: RoundConfig[] = [
  { round: 1, timeLimit: 60, peekDuration: 1.5 },
  { round: 2, timeLimit: 45, peekDuration: 1.0 },
  { round: 3, timeLimit: 30, peekDuration: 0.5 },
];
```

### `config/cards.ts`
```typescript
export const CARD_WIDTH = 140;
export const CARD_HEIGHT = 140;
export const CARD_CORNER_RADIUS = 12;
export const CARD_BACK_COLOR = 0x2c3e50;      // dark blue-gray
export const CARD_BACK_BORDER = 0x1a252f;
export const CARD_MATCHED_TINT = 0x888888;

export const SYMBOLS = ['★', '♦', '♠', '♥', '✿', '♪', '▲', '●'] as const;
export type Symbol = (typeof SYMBOLS)[number];

// One color per symbol — hex integers
export const SYMBOL_COLORS: Record<Symbol, number> = {
  '★': 0xf39c12,
  '♦': 0xe74c3c,
  '♠': 0x8e44ad,
  '♥': 0xe91e8c,
  '✿': 0x27ae60,
  '♪': 0x2980b9,
  '▲': 0xf1c40f,
  '●': 0x16a085,
};

export const SYMBOL_FONT_SIZE = 52;
export const CARD_FACE_BG = 0xffffff;          // white face background
export const CARD_FACE_BORDER = 0xcccccc;
```

### `config/grid.ts`
```typescript
export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const GRID_GAP = 12;

// Computed: grid is centered on the canvas
// Origin: top-left corner of the full grid (pixels)
export const GRID_ORIGIN_X = (GAME_WIDTH - GRID_COLS * CARD_WIDTH - (GRID_COLS - 1) * GRID_GAP) / 2;
export const GRID_ORIGIN_Y = 90;   // leave room for HUD at top

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

// Pure function — no Phaser import — also lives in game-logic.ts or here
export function getCardPosition(index: number, layout: GridLayout): { x: number; y: number } {
  const col = index % layout.cols;
  const row = Math.floor(index / layout.cols);
  return {
    x: layout.originX + col * (layout.cardWidth + layout.gap) + layout.cardWidth / 2,
    y: layout.originY + row * (layout.cardHeight + layout.gap) + layout.cardHeight / 2,
  };
}
```

### `config/ui.ts`
```typescript
// Depth layering (always use these — never inline numbers)
export const CARD_DEPTH = 10;
export const HUD_DEPTH = 20;
export const OVERLAY_DEPTH = 30;         // round-complete and game-over panels

// HUD
export const HUD_HEIGHT = 70;
export const TIMER_BAR_WIDTH = 400;
export const TIMER_BAR_HEIGHT = 18;
export const SCORE_FONT_SIZE = 22;
export const TIMER_COLOR_NORMAL = 0x27ae60;
export const TIMER_COLOR_URGENT = 0xe74c3c;  // switch when < 10s remaining
export const TIMER_URGENT_THRESHOLD = 10;    // seconds

// Overlays (centered panels)
export const OVERLAY_PANEL_WIDTH = 440;
export const OVERLAY_PANEL_HEIGHT = 280;
export const OVERLAY_BACKDROP_ALPHA = 0.65;

// Flip animation
export const FLIP_DURATION_MS = 150;         // ms for each half of the scaleX tween
export const MISMATCH_HOLD_MS = 800;         // ms before flipping unmatched cards back

// Streak
export const STREAK_BONUS_PER_MATCH = 50;
export const STREAK_BONUS_MAX = 200;
export const BASE_MATCH_SCORE = 100;
export const TIME_BONUS_PER_SECOND = 10;
```

### `config/assets.ts`
```typescript
// Memory Match uses mostly Graphics-drawn cards, so few real assets.
// Add keys here when real textures are introduced.
export const ASSET_KEYS = {
  IMAGES: {
    BACKGROUND: 'background',
    LOGO: 'logo',
  },
} as const;
```

---

## Data Types (define in `game-logic.ts` or a `types.ts`)

```typescript
export type CardState = 'faceDown' | 'flippingUp' | 'faceUp' | 'flippingDown' | 'matched';

export interface CardData {
  id: number;        // unique 0..15
  symbolId: number;  // 0..7 (which symbol/color pair)
  state: CardState;
}
```

---

## Pure Logic (`game-logic.ts`)

No Phaser imports. All independently testable.

```typescript
// Fisher-Yates shuffle — mutates and returns for convenience
export function shuffle<T>(array: T[]): T[] { ... }

// Returns array of 16 symbolIds [0,0,1,1,...,7,7] shuffled
export function generateCardPairs(symbolCount: number): number[] {
  const pairs = Array.from({ length: symbolCount }, (_, i) => [i, i]).flat();
  return shuffle(pairs);
}

// Returns true if two card symbolIds match
export function isMatch(symbolA: number, symbolB: number): boolean {
  return symbolA === symbolB;
}

// Compute score for a match
export function computeMatchScore(streakCount: number): number {
  const bonus = Math.min(streakCount * STREAK_BONUS_PER_MATCH, STREAK_BONUS_MAX);
  return BASE_MATCH_SCORE + bonus;
}

// Compute time bonus at round end
export function computeTimeBonus(secondsRemaining: number): number {
  return Math.floor(secondsRemaining) * TIME_BONUS_PER_SECOND;
}
```

---

## Scene Responsibilities

### `BootScene`
- `preload()`: load background image, logo (same as Math Quest).
- `create()`: transition to `MenuScene`.

### `MenuScene`
- Show game title "Memory Match".
- Show current round and total score if coming from a completed round (read from registry).
- "Play" button → write `REGISTRY_KEYS.CURRENT_ROUND = 1` and `TOTAL_SCORE = 0` → start `GameScene`.

### `GameScene`

**create():**
1. Read `CURRENT_ROUND` from registry, load `ROUND_CONFIGS[round - 1]`.
2. Draw background.
3. Call `buildGrid()`: create 16 `CardData` objects from `generateCardPairs(8)`, render each as a Container (back rect + front rect + symbol text).
4. Start "peek" phase: flip all cards face-up for `peekDuration` seconds, then flip all back.
5. Start countdown timer.
6. Launch `UIScene` as overlay.
7. Register `'shutdown'` cleanup handler.

**Card interaction:**
- Click on a `faceDown` card → `flipCard(card)` (tween scaleX 1→0, swap visibility, tween scaleX 0→1).
- Track `firstFlipped: CardData | null` and `secondFlipped: CardData | null`.
- When two cards are face-up and not yet resolved: `checkPair()`.
  - Match → `lockCards()`, update score, update streak, check win condition.
  - No match → wait `MISMATCH_HOLD_MS`, `flipBack(both)`, reset streak.
- Block further clicks while two cards are being evaluated (`isChecking: boolean` flag).

**Timer:**
- Use `this.time.addEvent({ ... })` for the countdown, update HUD every frame via `update()`.
- On expire → stop interaction → write score to registry → emit `'gameOver'`.

**Win condition** (all 8 pairs matched):
- Pause timer.
- Compute time bonus, add to total score, write to registry.
- Increment `CURRENT_ROUND` in registry.
- Emit `'roundComplete'` (with `{ score, round, isLastRound }`) → UIScene handles.

**HUD** (rendered in GameScene at `HUD_DEPTH`):
- Round label: "Round X / 3".
- Score text: "Score: XXXXX".
- Timer bar: colored rectangle that shrinks left-to-right; turns red below threshold.
- Timer text: "0:XX".

### `UIScene`

Launched from `GameScene.create()` as persistent overlay. Subscribes in `create()`:

- **`'roundComplete'`** → show round-complete panel:
  - "Round X Complete!"
  - Round score breakdown (match score + time bonus).
  - Cumulative score.
  - Button: "Next Round" → `scene.start(SCENE_KEYS.GAME)` (restarts GameScene, registry already has updated round+score).
  - If `isLastRound` → show "You Win!" instead, button: "Play Again" → reset registry, `scene.start(SCENE_KEYS.MENU)`.

- **`'gameOver'`** → show game-over panel:
  - "Time's Up!"
  - Final total score.
  - Button: "Try Again" → reset registry → `scene.start(SCENE_KEYS.MENU)`.

---

## Event Contracts

| Emitter | Event | Payload | Listener |
|---------|-------|---------|----------|
| GameScene | `'roundComplete'` | `{ round: number, roundScore: number, totalScore: number, isLastRound: boolean }` | UIScene |
| GameScene | `'gameOver'` | `{ totalScore: number }` | UIScene |

---

## Depth Layering

```
Background      depth 0   (default)
Cards           depth 10  → CARD_DEPTH
HUD elements    depth 20  → HUD_DEPTH
Overlays        depth 30  → OVERLAY_DEPTH
```

---

## Tweens Cleanup (critical — copy from Math Quest)

Register in `GameScene.create()`:
```typescript
this.events.on('shutdown', this.handleShutdown, this);

private handleShutdown(): void {
  this.tweens.killAll();
  // cancel any pending mismatch timers
  if (this.mismatchTimer) {
    this.mismatchTimer.remove();
    this.mismatchTimer = null;
  }
}
```

---

## Test Plan

| File | What to test |
|------|-------------|
| `game-logic.test.ts` | `shuffle()` contains all elements; `generateCardPairs(8)` has 16 items, each 0-7 appears exactly twice; `isMatch()` true/false; `computeMatchScore(streak)` caps at correct max; `computeTimeBonus()` rounds correctly |
| `config/grid.test.ts` | `getCardPosition(0, layout)` is within canvas; `getCardPosition(15, layout)` is within canvas; all 16 positions distinct; no card exceeds `GAME_WIDTH` or `GAME_HEIGHT` |

---

## Implementation Phases

### Phase 1 — Project Bootstrap
- Create directory structure.
- Copy and adapt `package.json`, `tsconfig.json`, `biome.json`, `vite/` configs, `index.html`.
- Write `src/main.ts` and `src/game/main.ts` (Phaser game config with all 4 scenes, AUTO renderer, 1024×768).
- Write `constants.ts` with all SCENE_KEYS and REGISTRY_KEYS.
- Write `config/assets.ts` (minimal).
- **Verify**: `npm run dev` opens a blank black canvas with no errors.

### Phase 2 — Boot + Menu Scenes
- Write `BootScene.ts`: preload background, transition to Menu.
- Write `MenuScene.ts`: title text, Play button, registry init.
- **Verify**: clicking Play transitions to a blank GameScene (just a placeholder `create()`).

### Phase 3 — Grid Rendering (Static)
- Write `config/cards.ts`, `config/grid.ts`, `config/rounds.ts`.
- Write `generateCardPairs()` and `getCardPosition()` in `game-logic.ts`.
- Write `game-logic.test.ts` and `config/grid.test.ts`. Run `npm run test` — all pass.
- In `GameScene.create()`, render all 16 cards face-down using Graphics.
- **Verify**: 4×4 grid of dark cards visible, centered on canvas.

### Phase 4 — Card Flip Mechanics
- Implement `flipCard()` with scaleX tween (1→0, swap content, 0→1).
- Implement peek phase (all flip up for peekDuration, then flip back).
- Implement click handler: track `firstFlipped` / `secondFlipped`, `isChecking` guard.
- Implement `checkPair()`, `lockCards()`, `flipBack()`.
- **Verify**: click any two cards → they flip; match = stay up; no match = flip back after delay.

### Phase 5 — HUD, Timer, Scoring
- Write `config/ui.ts` with all constants.
- Add HUD to GameScene: round label, score text, timer bar, timer text.
- Implement countdown timer using `this.time.addEvent()`.
- Implement `update()` to redraw timer bar proportionally.
- Implement score accumulation: `computeMatchScore()`, `computeTimeBonus()`.
- On timer expire → emit `'gameOver'`.
- **Verify**: timer counts down; score increments on match; bar turns red below threshold.

### Phase 6 — Round System + UIScene Overlays
- Write `UIScene.ts`: subscribe to `'roundComplete'` and `'gameOver'`.
- Launch UIScene from GameScene.
- Implement round-complete panel (with "Next Round" / "You Win!" logic).
- Implement game-over panel.
- On Next Round: `scene.start(SCENE_KEYS.GAME)` (registry has updated CURRENT_ROUND).
- Add `'shutdown'` cleanup to GameScene.
- **Verify**: complete round 1 → round-complete panel → start round 2 with harder config.

### Phase 7 — Polish
- Add streak indicator (flash text showing "2x STREAK!" etc.).
- Add match sound effect (synthesized via Phaser's WebAudioContext or loaded SFX).
- Add card-flip sound.
- Add particle burst on match (Phaser's built-in ParticleEmitter).
- Animate HUD score counter (tween number up).
- Write `CLAUDE.md` for the new project.

---

## Patterns Inherited from Math Quest

| Pattern | How it applies |
|---------|---------------|
| Config isolation | All card sizes, colors, depths, timings in `config/` |
| Pure modules | `game-logic.ts` has no Phaser imports; fully testable |
| UIScene overlay | Launched from GameScene.create(), listens before events fire |
| Registry for persistent state | round number and total score survive scene restarts |
| Events for one-shot triggers | `'roundComplete'`, `'gameOver'` are imperative, not persisted |
| Tweens cleanup on shutdown | Prevent mismatch timer callbacks firing after scene destroy |
| Depth constants | Always use named constants from `config/ui.ts` |
| Hex integers for colors | `0xRRGGBB` — never CSS strings |
| No magic strings | SCENE_KEYS, REGISTRY_KEYS, ASSET_KEYS enums everywhere |

---

## What This Game Does NOT Have (scope guard)

- No multiplayer — single player only.
- No high-score persistence (no localStorage in v1).
- No sprite art — all Graphics-drawn.
- No sound in Phase 1–6 (added in Phase 7 polish only).
- No difficulty selection on menu — progression is entirely round-based.
- No dynamic grid size changes — always 4×4.
