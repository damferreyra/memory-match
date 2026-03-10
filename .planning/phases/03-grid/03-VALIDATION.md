---
phase: 3
slug: grid
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | none — inherits Vite config |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | GRID-04 | unit stub | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | GRID-04 | unit stub | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | GRID-01 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | GRID-01 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-05 | 01 | 1 | GRID-01 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-06 | 01 | 1 | GRID-01 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-01-07 | 01 | 1 | GRID-02, GRID-03 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | GRID-05 | smoke | `npm run dev` + visual | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/game/game-logic.test.ts` — stubs covering GRID-02 (generateCardPairs), GRID-04 (shuffle, isMatch, computeMatchScore, computeTimeBonus)
- [ ] `src/game/config/grid.test.ts` — stubs covering GRID-01 (GRID_LAYOUT constants), GRID-03 (getCardPosition all 16 positions), GRID-04

*No framework install needed — Vitest already in devDependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 16 face-down cards visible in 4×4 grid on canvas | GRID-05 | Requires Phaser renderer + browser | `npm run dev` → click PLAY → confirm 16 dark cards centered on canvas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
