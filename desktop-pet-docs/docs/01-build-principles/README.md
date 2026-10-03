# Loaf — Build Principles Index & Milestone Plan

Version 1.1 · 2026-10-03 · **D0–D7 all locked**

## Document Status

| # | File | Status | Purpose |
|---|------|--------|---------|
| 00 | overview.md | 🔒 Locked | Philosophy, how to use this set |
| 01 | core-principles.md | 🔒 Locked | 10 decision rules, decision tree, PR checklist |
| 02 | build-order.md | 🔒 Locked | Phases 0–7, acceptance criteria, shipping checklist |
| 03 | ui-first.md | 🔒 Locked | Wireframe → spec → tests → code workflow |
| 04 | testing-strategy.md | 🔒 Locked | Pyramid, TDD loop, tooling, coverage targets |
| 05 | learning-fundamentals.md | 🔒 Locked | What to understand before each phase |
| 06 | feature-definition.md | 🔒 Locked | Feature spec template, Ready/Done, F1 breakdown |
| 07 | architecture-decisions.md | 🔒 Locked | ADR-001…014, Phase 0 verification tasks V-1…V-5 |
| 08 | code-organization.md | ⏸ On hold | Unlocks after scaffold + event bus exist |
| 09 | performance-budgets.md | 🔒 Locked | Ceilings, per-phase allocation, measurement |
| 10 | team-coordination.md | ⏸ On hold | Unlocks at 2nd contributor or end of Phase 0 |
| 11 | quality-gates.md | ⏸ On hold | Unlocks when CI + baselines exist |

## Consistency Fixes Applied in v1.0

| File | Was | Now |
|------|-----|-----|
| 00, 02 | "Zero technical debt" | Debt allowed only if logged with payoff date (matches Principle 10) |
| 01 | "No timers" | No interval loops; one-shot scheduled wakeups allowed; exceptions only via ADR-009 |
| 02 | Phase 1 pet = "static placeholder" | Minimal pet ships in Phase 1 (non-negotiable "pet required from v1") |
| 02 | Phase 5 "CI status polling" *(now Phase 5.1 — ADR-016)* | Documented polling exception with backoff (ADR-009) |
| 02 | Character customization "Phase 5" | Phase 7 |
| 03 | "mobile/responsive" check | Window resizing check (desktop app) |
| 04 | File truncated mid-TDD section | Completed: TDD loop, tooling, test rules, coverage by phase, bug rule |

---

## Milestone Plan

### Stage A — Documentation (before any product code)

| ID | Milestone | Depends on | Exit condition |
|----|-----------|-----------|----------------|
| D0 | Product Document | — | ✅ Done |
| D1 | Build Principles (this set) | D0 | ✅ Done — 9 locked, 3 on hold |
| D2 | PRD | D0, D1 | 🔒 Locked 2026-10-03 — `docs/02-prd/PRD.md` (§9 D-1…D-10 approved) |
| D3 | TRD | D2, 07 | 🔒 Locked 2026-10-03 — `docs/03-trd/TRD.md` |
| D4 | App Flow | D2 | 🔒 Locked 2026-10-03 — `docs/04-design/app-flow.md` |
| D5 | UI/UX Design Brief | D4 | 🔒 Locked 2026-10-03 — `docs/04-design/ui-ux-brief.md` |
| D6 | Backend Schema | D3 | 🔒 Locked 2026-10-03 — `docs/05-backend/` (migration 001 applied on SQLite 3.45.1) |
| D7 | Implementation Plan | D2–D6 | 🔒 Locked 2026-10-03 — `docs/06-plan/implementation-plan.md` |

### Stage B — Build Checkpoints (Phases 0 → 1, first shippable product)

Feature IDs are authoritative in `docs/06-plan/implementation-plan.md`. No calendar dates — each checkpoint starts only when the previous one's exit condition is met.

| Checkpoint | Scope | Exit condition |
|------------|-------|----------------|
| **CP1 — Foundation & Verification** | Tauri scaffold (Win + macOS), event bus, SQLite + migrations, settings, tray, single instance, auto-start, CI | V-1…V-5 measured and recorded; 08/10/11 unlocked and written; Phase 0 acceptance criteria pass |
| CP2 — Notes Core | F1-01…F1-09 | Notes usable end-to-end, survives restart |
| CP3 — Tasks & Daily Log | F1-10…F1-16 | Task lifecycle + auto-generated daily log correct across midnight |
| CP4 — Meetings, Search, Pet, Today, Settings | F1-17…F1-26 | Search <500 ms at 5000 items; minimal pet present |
| **CP5 — Phase 1 Release** | F1-27 · shipping checklist (02) on both OSes | First public release |

### Stage C — Product Phases (after first release)

| Milestone | Phase | Starts when |
|-----------|-------|-------------|
| M2 | Browser Intelligence | CP5 shipped (v1.0.0) |
| M3 | Pet & Companion | M2 shipping checklist met |
| M4 | Developer Companion | M3 shipping checklist met |
| M5 | MCP Integrations (incl. MCP client + OAuth) | M4 shipping checklist met |
| M5.1 | CI Status | M5 shipping checklist met |
| M6 | Voice | M5.1 shipping checklist met |
| M7 | Character Ecosystem | M6 shipping checklist met |

Each milestone's own feature list and sizing is produced immediately before that phase starts (`01-core-principles.md` Principle 4: one phase at a time) — exactly as CP1–CP5 were produced for Phase 0–1 in the Implementation Plan.

### Critical Path

```
D2 PRD → D3 TRD → D6 Schema ─┐
D2 PRD → D4 Flow → D5 UI ────┼→ D7 Plan → CP1 → CP2 → CP3 → CP4 → CP5 (first release)
                             │
          CP1 V-2 (RAM) ─────┘  ← highest-risk item; can change budgets before CP2
```

---

## Cross-Document Consistency Review (2026-10-03)

Run before locking D2–D7. Seven findings, all resolved; each is recorded as an
amendment in the document that owns the decision.

| # | Finding | Severity | Resolved in |
|---|---------|----------|-------------|
| 1 | D2–D7 blocked on PRD §9 approval | Blocker | PRD §9 approved; D2–D7 locked |
| 2 | ADR-006 (locked) mandated trigger-based FTS sync; D6 §3.8 rejected triggers | Contradiction between locked and derived docs | **ADR-014** supersedes ADR-006 on the mechanism; 05 Amendment A-1; TRD §5 |
| 3 | D0 phase numbers (Voice P3, MCP P3–P4, Dev P4, Characters P5) contradicted 02/PRD/plan (4/6/5/7) | Contradiction in the locked source of truth | Owner set the order: Pet 3 → Developer 4 → MCP 5 → CI 5.1 → Voice 6 → Characters 7. **D0-A2, 02 A-3, ADR-015**; PRD §8; D4 §7; 09 A-1 |
| 4 | `task_events.kind = 'DELETED'` unreachable — `task_id` cascades | Schema defect | Schema Amendment D6-A1 #2; migration 001; PRD R1-29 |
| 5 | Migration 001 embedded `BEGIN`/`COMMIT` + `user_version`, conflicting with the runner's transaction (ADR-007) | Schema defect — would fail at runtime | Schema Amendment D6-A1 #1; migration 001; TRD §5; plan F0-04 |
| 6 | "Unique case-insensitively" claimed, but `COLLATE NOCASE` folds ASCII only | Overstated guarantee | Schema Amendment D6-A1 #3 (`name_folded`); PRD R1-08; plan F1-07 |
| 7 | Committed `.zip` + `.bundle` and a duplicate root `implementation-plan.md` | Repo hygiene | Removed; `docs/` is the single source |

Findings 4–6 were verified empirically against SQLite 3.45.1 before the fix was
written, not reasoned about on paper.
