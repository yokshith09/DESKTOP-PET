# F0-01: Tauri v2 + React/TS/Vite scaffold, V-1

## Status
READY

## User Story
As the developer, I want a project that builds and launches on Windows and macOS so every later feature has somewhere to live and V-1 is answered before anything depends on it.

## Phase & Priority
Phase 0 · P0 · 1.5 relative dev-days (plan D7)

## Depends On
None (first feature).

## UI
A single window titled "Loaf" showing a static placeholder ("Loaf — foundation build"). No design tokens, sidebar or router yet (F0-10). Wireframe: none needed.

## Acceptance Criteria
- [ ] Cargo workspace with two members: `src-tauri/` (Tauri v2 shell) and `crates/loaf-core/` (all business logic, **no `tauri` dependency**, so it compiles and tests anywhere — ADR-002)
- [ ] `pnpm` + Vite + React 18 + TypeScript `strict`; entry `main.html`; `pet.html` exists as an empty page for F1-22
- [ ] `pnpm tauri dev` opens the window; `pnpm tauri build` produces a release bundle on Windows and macOS (verified in F0-02 CI)
- [ ] Content-Security-Policy is `default-src 'self'`; Tauri capabilities grant only what the window uses
- [ ] `cargo tree` audited for HTTP-capable crates (TRD §7, zero network in Phase 0–1); anything that arrives transitively with Tauri is listed in the PR with why it cannot be reached at runtime
- [ ] **V-1 recorded:** the release bundle was launched on the oldest macOS the owner can access, with that version number written into `07-architecture-decisions.md` as an amendment. If it fails, the platform requirement in PRD §7 is amended to the real minimum
- [ ] Repository ignore rules, `rust-toolchain.toml` and a pinned Node/pnpm version are committed

## Events
None emitted or listened to.

## Data
None. No tables touched; no migration.

## Performance Budget
Bundle builds. Idle cost is measured in F0-02 (preliminary) and F0-12 (final), not here.

## Tests
- Rust: `cargo test --workspace` runs one smoke test in `loaf-core` and passes
- Frontend: Vitest renders the placeholder and asserts its text
- Script test: a check that fails the build if `loaf-core` ever gains a `tauri` dependency
- Manual: launch on each OS, record the macOS version for V-1

## Out of Scope
- Pet window, tray, DB, settings, router, design tokens (later features)
- Folder-organization doc `08` — written from this scaffold at CP1 exit, not now
- Code signing and installers (CP5)

## Open Questions
None.
