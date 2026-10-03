# Quality Gates — Automated Checks Before Merge and Release

> **Status: ⏸ ON HOLD** — to be written at the end of Phase 0, once CI exists and real baselines are measured.

## Why It's on Hold
Gates must point at real CI jobs and real measured numbers. Before Phase 0, both are hypothetical.

## Unlock Trigger
CI pipeline runs on both OSes (F0 feature) **and** Phase 0 baselines are recorded in 09.

## Will Cover
- Merge gates: build, lint (`clippy`, `eslint`), format, tests, coverage floor, benchmark regression
- Release gates: full idle profile, startup, RAM, cross-OS manual E2E, migration test on previous-version DB
- Code signing and notarization checks (Windows + macOS)
- Release artifacts, versioning, changelog rules
- What blocks a release vs what is a warning

## Already Decided Elsewhere (Inputs)
- Phase shipping checklist (02)
- Coverage targets by phase (04)
- Performance budgets and regression rule (09)
- Definition of Done (06)
