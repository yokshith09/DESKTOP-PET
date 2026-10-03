# F0-02: CI matrix and preliminary V-2 RAM measurement

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want every push built and tested on Windows and macOS, and I want the project's largest risk — total RAM under 100 MB (V-2) — measured on a hello-world bundle now rather than after most of CP1 is built (ADR-018).

## Phase & Priority
Phase 0 · P0 · 1.5 relative dev-days (plan D7)

## Depends On
F0-01.

## UI
None (CI only). Results appear in the run summary and as an uploaded artifact.

## Acceptance Criteria
- [ ] Workflow runs on `windows-latest` and `macos-latest`: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test --workspace`, `cargo llvm-cov`, `pnpm lint`, `pnpm test --coverage`, `tauri build`
- [ ] A PR with a deliberately broken test fails CI (shown once, then reverted)
- [ ] **`v2-ram` job** builds the F0-01 release bundle on each OS, launches it, waits 120 s to settle, samples every 30 s for 5 min, and reports the **sum across all Loaf processes including webview children**, with a per-process table
- [ ] Windows sampling: private bytes of the Loaf process plus every descendant (this catches the `msedgewebview2` children)
- [ ] macOS sampling: physical footprint of the Loaf process plus the `com.apple.WebKit.*` helper processes that appeared after launch (WKWebView helpers are not children of the app, so they are matched by name and start time)
- [ ] The measuring scripts and their method live in the repo with a short note on what they cannot see; the first run's numbers are labelled **preliminary (CI runner)**
- [ ] Result is appended to `07-architecture-decisions.md` as an amendment. Per the plan's CP1 decision point: a sum over 100 MB on either OS stops work before F0-13; a result between 80 and 120 MB is confirmed on real hardware before any ADR is written
- [ ] The workflow adds no secrets and no deployment step

## Events
None.

## Data
None.

## Performance Budget
Full CI run ≤ 20 minutes; the `v2-ram` job ≤ 15 minutes. Idle cost of the app itself: this feature *measures* it.

## Tests
- The summing and parsing logic is a pure script with fixture inputs; unit-tested against a Windows-shaped and a macOS-shaped fixture, including a case with no webview child (must fail loudly, not report a low number)
- Manual: read the first real run's table and sanity-check it against Task Manager / Activity Monitor on the owner's machine if one is available

## Out of Scope
- Release signing, installers, notarization (CP5)
- Idle CPU and GPU (V-3, F0-12)
- The final V-2 on the real app (F0-12)
- Making the RAM check a required merge gate — done only after real numbers show it is stable (`11-quality-gates.md`)

## Open Questions
None.
