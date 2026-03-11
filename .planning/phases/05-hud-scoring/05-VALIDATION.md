---
phase: 5
slug: hud-scoring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | vite/config.dev.mjs (vitest inline config) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green + manual play-test
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-xx | 01 | 1 | HUD-01 | manual | — visual inspection | N/A | ⬜ pending |
| 05-01-xx | 01 | 1 | HUD-02 | manual | — requires Phaser scene | N/A | ⬜ pending |
| 05-01-xx | 01 | 1 | HUD-03 | manual | — requires Phaser scene | N/A | ⬜ pending |
| 05-02-xx | 02 | 1 | HUD-04 | unit | `npm run test` | ✅ exists | ⬜ pending |
| 05-02-xx | 02 | 1 | HUD-05 | manual | — requires scene state | N/A | ⬜ pending |
| 05-02-xx | 02 | 1 | HUD-06 | manual | — requires scene + time | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing test infrastructure covers all phase requirements that are unit-testable. `computeMatchScore` and `computeTimeBonus` already have tests in `game-logic.test.ts`. The remaining HUD behaviors involve Phaser scene rendering and are validated by manual play-test.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HUD elements rendered at correct depth | HUD-01 | Phaser scene visual output | Open game, verify HUD labels/bar render above cards |
| Timer starts at timeLimit, decrements each second | HUD-02 | Requires live Phaser time loop | Start round, observe countdown ticking each second |
| Timer bar shrinks proportionally; turns red <10s | HUD-03 | Requires Phaser scene + time | Play until <10s remain, verify bar is red and width matches ratio |
| Streak resets to 0 on mismatch | HUD-05 | Requires scene flip state | Flip two mismatched cards, verify next match earns base 100 only |
| Timer expiry stops interaction and emits gameOver | HUD-06 | Requires scene + time integration | Let timer expire, verify cards unclickable and game-over panel appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
