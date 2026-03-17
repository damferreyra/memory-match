---
phase: quick
plan: 260317-phv
type: execute
wave: 1
depends_on: []
files_modified:
  - src/game/scenes/GameScene.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Rapidly clicking a card while mismatch flip-back animation is running does not cause the card to play the flip animation twice"
    - "isChecking is false only after BOTH mismatched cards have fully completed their flip-down animation"
    - "A card in state flippingDown cannot be selected or re-animated by a click"
  artifacts:
    - path: "src/game/scenes/GameScene.ts"
      provides: "Fixed flip-down concurrency guard"
      contains: "pendingFlipDowns"
  key_links:
    - from: "flipCardDown onComplete"
      to: "isChecking = false"
      via: "pendingFlipDowns counter"
      pattern: "pendingFlipDowns"
---

<objective>
Fix the double-flip-animation bug that occurs when a player clicks rapidly during the mismatch flip-back sequence.

Purpose: The game's core flip-and-compare loop must work flawlessly. Cards should never animate twice.
Output: GameScene.ts with a counter-based guard ensuring isChecking is only cleared after both flip-down animations complete.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Diagnose and fix the double-flip race condition in flipCardDown</name>
  <files>src/game/scenes/GameScene.ts</files>
  <action>
The bug is a race condition between two parallel flipCardDown tweens and the isChecking flag.

**Root cause:**
When evaluatePair() detects a mismatch it calls flipCardDown(indexA) and flipCardDown(indexB). Each call adds two nested tweens (scaleX→0 then scaleX→1). The two animations run in parallel. The FIRST card to complete its inner tween sets `isChecking = false` while the SECOND card is still mid-animation with state `'flippingDown'`. At that exact moment a rapid click passes the `isChecking` guard (false) AND the state guard (`'flippingDown' !== 'faceDown'` — this correctly blocks it). BUT if the first card completes AND its state is now `'faceDown'`, the user can click it immediately, triggering a new flipCardUp tween on a card whose pair partner is still animating. Then when the second card also calls `isChecking = false`, the system is in an inconsistent state with one card mid-flip-up and isChecking already false.

**Fix — add a `pendingFlipDowns` counter to GameScene:**

1. Add a private field: `private pendingFlipDowns = 0;`

2. Initialize it to 0 in `create()` alongside the other field resets.

3. In `evaluatePair()` mismatch branch, BEFORE calling `flipCardDown(indexA)` and `flipCardDown(indexB)`, set: `this.pendingFlipDowns = 2;`

4. In `flipCardDown()` inner tween onComplete (where `card.state = 'faceDown'` is set), replace the unconditional `this.isChecking = false;` with:
```typescript
card.state = 'faceDown';
this.pendingFlipDowns--;
if (this.pendingFlipDowns <= 0) {
    this.isChecking = false;
}
```

This ensures isChecking only becomes false after BOTH animations complete, regardless of which finishes first.

**Also verify the state guard in handleCardClick is correct:** `this.cards[index].state !== 'faceDown'` already blocks clicks on cards in `'flippingDown'` state — this guard is correct and must be kept as-is.

No new constants needed — `pendingFlipDowns` is implementation detail, not config. TypeScript strict mode: initialize `pendingFlipDowns = 0` inline on the field declaration (not just in create) to satisfy `noUnusedLocals` / definite assignment.
  </action>
  <verify>
    <automated>npm run build 2>&1 && npm run lint 2>&1 && npm run test 2>&1</automated>
  </verify>
  <done>Build passes with no TypeScript errors. Lint passes. Tests pass. The double-animation is no longer reproducible by rapid clicking during the mismatch hold window.</done>
</task>

</tasks>

<verification>
After applying the fix:
1. Run `npm run build` — must exit 0 with no TS errors
2. Run `npm run lint` — must exit 0
3. Run `npm run test` — all tests pass
4. Manual smoke test: open http://localhost:8080, play a round, deliberately mismatch pairs and click rapidly during the 800ms hold — cards should never double-animate
</verification>

<success_criteria>
- `pendingFlipDowns` counter introduced and used in flipCardDown onComplete
- `isChecking = false` only fires when `pendingFlipDowns` reaches 0
- `pendingFlipDowns` is reset to 2 in the mismatch branch of evaluatePair before the two flipCardDown calls
- Build, lint, and tests all green
</success_criteria>

<output>
After completion, create `.planning/quick/260317-phv-we-need-to-investigate-why-some-times-if/260317-phv-SUMMARY.md`
</output>
