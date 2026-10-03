# Loaf

A lightweight, local-first desktop companion for Windows and macOS: notes, tasks, meetings and an automatic daily work log, with a desktop pet that lives alongside your work.

**Status:** Documentation phase complete (drafts in review) → next: **CP1 Foundation**.

## Non-negotiables
Event-driven (no polling) · Idle CPU <1% · RAM <100 MB · Local-first SQLite · Pet present from v1 · Windows + macOS parity

## Documentation

| ID | Document | Path | Status |
|----|----------|------|--------|
| D0 | Product Document | [`docs/00-product/product-document.md`](docs/00-product/product-document.md) | 🔒 Locked |
| D1 | Build Principles (00–11) | [`docs/01-build-principles/`](docs/01-build-principles/README.md) | 🔒 9 locked · ⏸ 3 on hold |
| D2 | PRD | [`docs/02-prd/PRD.md`](docs/02-prd/PRD.md) | 🟡 Review |
| D3 | TRD | [`docs/03-trd/TRD.md`](docs/03-trd/TRD.md) | 🟡 Review |
| D4 | App Flow | [`docs/04-design/app-flow.md`](docs/04-design/app-flow.md) | 🟡 Review |
| D5 | UI/UX Design Brief | [`docs/04-design/ui-ux-brief.md`](docs/04-design/ui-ux-brief.md) | 🟡 Review |
| D6 | Backend Schema + migration 001 | [`docs/05-backend/`](docs/05-backend/backend-schema.md) | 🟡 Review |
| D7 | Implementation Plan | [`docs/06-plan/implementation-plan.md`](docs/06-plan/implementation-plan.md) | 🟡 Review |

## Pending decisions before locking D2–D7
1. PRD §9 — ten gap-resolving decisions (D-1 … D-10)

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
