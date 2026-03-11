---
phase: 4
slug: flip-mechanics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | none — inherits Vite config |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test` + `npm run dev` manual smoke
- **Before `/gsd:verify-work`:** Full suite must be green + all manual smoke items verified
- **Max feedback latency:** ~2 seconds (automated) + ~60 seconds (manual smoke per wave)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | FLIP-02 | manual smoke | `npm run dev` — peek phase visible | manual-only | ⬜ pending |
| 4-01-02 | 01 | 1 | FLIP-01 | manual smoke | `npm run dev` — click flips card with scaleX tween | manual-only | ⬜ pending |
| 4-01-03 | 01 | 1 | FLIP-03 | manual smoke | `npm run dev` — third click rejected while pair evaluating | manual-only | ⬜ pending |
| 4-01-04 | 01 | 1 | — | automated | `npm run test` — no regressions in game-logic.test.ts | ✅ exists | ⬜ pending |
| 4-02-01 | 02 | 2 | FLIP-04 | manual smoke | `npm run dev` — matched pair locks face-up with tint | manual-only | ⬜ pending |
| 4-02-02 | 02 | 2 | FLIP-05 | manual smoke | `npm run dev` — mismatched pair flips back after 800ms | manual-only | ⬜ pending |
| 4-02-03 | 02 | 2 | — | automated | `npm run test` — no regressions | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

No new test files needed — Phase 4 behavior requires Phaser runtime (canvas/DOM) and cannot be unit-tested with Vitest. The `isMatch()` function called during evaluation is already covered by `game-logic.test.ts`.

*Existing test files:*
- `src/game/game-logic.test.ts` — covers `isMatch()`, `shuffle()`, `generateCardPairs()`
- `src/game/config/grid.test.ts` — covers `getCardPosition()`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Peek phase reveals all 16 card faces for peekDuration then flips back | FLIP-02 | Phaser tween/timer — requires canvas runtime | Start game, observe round start: all faces visible → auto flip-back |
| Click a face-down card → scaleX tween (1→0→1) shows card face | FLIP-01 | Phaser tween animation — requires canvas | After peek, click any card; verify smooth flip animation reveals symbol |
| Third card click rejected while pair being evaluated | FLIP-03 | Input guard — requires interactive game session | Flip 2 cards, rapidly click a 3rd before evaluation completes; 3rd must not flip |
| Matched pair locks face-up with grey tint | FLIP-04 | Visual tint — requires canvas rendering | Find a matching pair; verify both stay face-up with desaturated tint |
| Mismatched pair flips back face-down after 800ms | FLIP-05 | Timed animation — requires Phaser timer | Flip two non-matching cards; verify both flip back ~800ms later |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (automated) / ~60s (manual smoke)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
