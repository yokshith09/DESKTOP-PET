# Loaf

A lightweight, local-first desktop companion for Windows and macOS: notes, tasks, meetings and an automatic daily work log, with a desktop pet that lives alongside your work.

**Status:** 🔒 **D0–D7 locked** (2026-10-03) → next: **CP1 Foundation** (`F0-01` Tauri scaffold). No application code exists yet.

## Non-negotiables
Event-driven (no polling) · Idle CPU <1% · RAM <100 MB · Local-first SQLite · Pet present from v1 · Windows + macOS parity

## Documentation

| ID | Document | Path | Status |
|----|----------|------|--------|
| D0 | Product Document | [`docs/00-product/product-document.md`](docs/00-product/product-document.md) | 🔒 Locked · amended D0-A1 |
| D1 | Build Principles (00–11) | [`docs/01-build-principles/`](docs/01-build-principles/README.md) | 🔒 9 locked · ⏸ 3 on hold |
| D2 | PRD | [`docs/02-prd/PRD.md`](docs/02-prd/PRD.md) | 🔒 Locked 2026-10-03 |
| D3 | TRD | [`docs/03-trd/TRD.md`](docs/03-trd/TRD.md) | 🔒 Locked 2026-10-03 |
| D4 | App Flow | [`docs/04-design/app-flow.md`](docs/04-design/app-flow.md) | 🔒 Locked 2026-10-03 |
| D5 | UI/UX Design Brief | [`docs/04-design/ui-ux-brief.md`](docs/04-design/ui-ux-brief.md) | 🔒 Locked 2026-10-03 |
| D6 | Backend Schema + migration 001 | [`docs/05-backend/`](docs/05-backend/backend-schema.md) | 🔒 Locked 2026-10-03 |
| D7 | Implementation Plan | [`docs/06-plan/implementation-plan.md`](docs/06-plan/implementation-plan.md) | 🔒 Locked 2026-10-03 |

## Decision log
| Date | Decision |
|------|----------|
| 2026-10-03 | PRD §9 decisions **D-1 … D-10 approved**; D2–D7 locked |
| 2026-10-03 | **ADR-014** accepted — FTS index maintained by the repository layer, superseding ADR-006's trigger clause |
| 2026-10-03 | **D0-A1** — phase numbering authority moved to `02-build-order.md`; D0 states priority only |
| 2026-10-03 | **D6-A1** — four schema corrections (migration transaction ownership, no `DELETED` task event, Unicode label folding, ADR-014 reference) |

A full account of the consistency review that preceded the lock is in
[`docs/01-build-principles/README.md`](docs/01-build-principles/README.md#cross-document-consistency-review-2026-10-03).

## Open before CP1 starts
Nothing blocking. The first unresolved questions are the Phase 0 verification
tasks **V-1 … V-5** (`docs/01-build-principles/07-architecture-decisions.md`),
measured in `F0-01` and `F0-12`. **V-2 (total RAM <100 MB)** is the one that can
force a new ADR before CP2.

## Milestones
`D0–D7 docs` → **CP1** Foundation + verification → CP2 Notes → CP3 Tasks + Daily Log → CP4 Meetings, Search, Pet, Today → **CP5 v1.0.0** → M2 Browser → M3 Pet → M4 Voice → M5 Developer → M6 MCP → M7 Characters

## Repository layout
```
docs/
├── 00-product/         D0 product document
├── 01-build-principles/ D1 build principles (00–11 + index)
├── 02-prd/             D2 product requirements
├── 03-trd/             D3 technical requirements
├── 04-design/          D4 app flow, D5 UI/UX brief
├── 05-backend/         D6 schema + migrations/
└── 06-plan/            D7 implementation plan
```
Application code (`src-tauri/`, `src/`) arrives with CP1.
