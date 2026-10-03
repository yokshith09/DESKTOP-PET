# Architecture Decisions — ADR Log

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02 · **ADR-014, ADR-015 appended 2026-10-03**. Existing ADRs change only via a new ADR that supersedes them. New ADRs may be appended at any time.

Each decision records **what we chose, why, what we rejected, and what it costs**. Confidence tags: [Certain] verified fact, [Likely] strong inference, [Guessing] must be verified in Phase 0.

---

## ADR-001: Tauri v2 as the application shell

**Decision:** Tauri v2 (Rust core + system webview).
**Why:** Small binary, low RAM vs Electron, native Rust for the core, single codebase for Windows + macOS.
**Rejected:** Electron (bundles Chromium; RAM budget unrealistic). Native per-OS (two codebases, breaks parity). Flutter desktop (weaker OS-integration story for tray/transparent windows/native messaging).
**Cost / Risk:**
- [Likely] Windows uses WebView2 (Edge/Chromium) and macOS uses WKWebView (Safari engine). UI must be tested on both — rendering and JS behavior differ.
- [Guessing] Tauri v2's minimum supported macOS may be higher than the product's 10.13 target. **Phase 0 verification task V-1.** If unsupported, the product constraint is amended to the real minimum.
- [Likely] WebView2 runs as separate processes on Windows; their memory counts against the 100 MB budget. **Phase 0 verification task V-2** (see 09).

## ADR-002: Rust core owns all state and logic

**Decision:** All business logic, persistence, event routing, and OS integration live in Rust. The frontend is a view layer: it renders state and sends user intents.
**Why:** One source of truth; testable without UI; webview can be closed without losing state.
**Rejected:** Logic in the frontend with SQLite via a JS plugin (splits truth, harder to test, harder to keep idle).
**Cost:** More IPC boilerplate; every UI action needs a Tauri command.

## ADR-003: React + TypeScript + Vite for the frontend

**Decision:** React 18+, TypeScript strict mode, Vite bundler, plain CSS modules or a light utility layer.
**Why:** Mature testing ecosystem (Vitest + RTL), familiar, strong typing for IPC contracts.
**Rejected:** Svelte/Solid (smaller bundles, but less tooling familiarity — acceptable future option, not now). Heavy component libraries (bundle size, RAM).
**Rule:** No global state library in Phase 1. React state + a thin store fed by core events. Revisit only with measured need.

## ADR-004: Internal event bus on Tokio broadcast channels

**Decision:** A typed `Event` enum in Rust; publishers send through a `tokio::sync::broadcast` channel; subscribers (DB writer, UI forwarder, pet engine, daily-log builder) each own a receiver.
**Why:** Matches the event-driven constraint; zero CPU when idle (receivers park); decouples features.
**Rejected:** Ad-hoc callbacks (tight coupling). External message broker (absurd for a desktop app).
**Rules:**
- Every event is a variant of one `Event` enum, versioned, serializable.
- Event names are past tense: `NoteCreated`, `TaskCompleted`, `TabFocused`.
- Lagging subscribers must handle `RecvError::Lagged` explicitly (log + resync from DB).
- Core → UI: forwarded via Tauri `emit`. UI → Core: Tauri commands that validate then publish events.

## ADR-005: SQLite via `rusqlite`, single file, WAL mode

**Decision:** One database file per user at the OS app-data path. `rusqlite` with bundled SQLite. WAL journal mode. Foreign keys ON.
**Why:** Local-first, zero setup, crash-safe, FTS5 available in the bundled build.
**Rejected:** `sqlx` (async + compile-time checks are nice, but adds weight we don't need; sync SQLite on a dedicated thread is simpler). Embedded KV stores (no FTS, no relational queries).
**Rules:**
- All DB access goes through one **DB writer task** that consumes events. Reads may use a separate read connection.
- Writes from high-frequency sources (browser, app focus) are buffered and flushed in one transaction **at most once per minute when idle**, or on shutdown.
- User-initiated writes (create/edit note) flush immediately — <100 ms target.

## ADR-006: Search via SQLite FTS5

**Status:** Accepted · **superseded in part by ADR-014** (the "kept in sync with triggers" clause only; FTS5 itself stands).

**Decision:** FTS5 virtual tables for notes, tasks, meetings, daily logs, kept in sync with triggers. Single search query unions the indexes and ranks with `bm25`.
**Why:** Meets <500 ms on 5000 items without external engines.
**Rejected:** In-memory JS search (RAM grows with data). Tantivy (excellent, but a second index to keep consistent — revisit only if FTS5 fails the budget).

## ADR-007: Schema migrations are versioned, forward-only, tested

**Decision:** `PRAGMA user_version` + numbered SQL migration files embedded in the binary, applied on startup inside a transaction. Backup the DB file before any migration.
**Why:** Users' data must survive every upgrade.
**Rejected:** Down migrations (rarely correct in practice; restore-from-backup instead).

## ADR-008: Separate transparent window for the pet

**Decision:** The pet is its own Tauri window (frameless, transparent, optional always-on-top) with its own lightweight frontend entry. It subscribes only to pet-relevant events.
**Why:** Can be shown/hidden independently; failure in the main UI doesn't kill the pet; the behavior engine (Rust state machine) is decoupled from the asset renderer.
**Rules:**
- Rendering stops completely (no rAF loop) when the pet is hidden or sleeping.
- Sprite-sheet animation, 30 FPS cap.
**Risk:** [Likely] Webview compositing uses the GPU by default on both OSes. "No GPU" is interpreted as **no GPU-intensive rendering (no WebGL, no shaders, no 3D)**, not zero GPU involvement. Phase 0 verification task V-3 measures it.

## ADR-009: Event-driven OS integration; documented polling exceptions

**Decision:** Use OS-native event sources wherever they exist:
- Foreground app (Windows): `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)`
- Foreground app (macOS): `NSWorkspace.didActivateApplicationNotification`
- Browser tabs: extension events (`tabs.onActivated`, `onUpdated`, `onRemoved`)
- Git repositories: file-system watcher on `.git` refs (`notify` crate)
- Day rollover: one-shot timer scheduled for next local midnight, rescheduled on wake/timezone change

**Documented exceptions (the only allowed interval checks):**

| Exception | Why no event exists | Constraint |
|-----------|--------------------|------------|
| CI status (Phase 4) | A desktop app cannot receive GitHub webhooks without a public endpoint | Only while a build is known to be running; exponential backoff 15 s → 5 min; stop when finished |
| MCP integration refresh (Phase 5) | Remote services may not push to a local client | User-configurable interval, default ≥15 min, paused when idle or on battery |

Any new exception requires a new ADR.

## ADR-010: Browser bridge via Native Messaging

**Decision:** Each browser extension talks to a small native messaging host bundled with Loaf, which forwards messages to the Rust core over a local channel. Safari uses a Safari Web Extension packaged inside the macOS app.
**Why:** The browser-sanctioned, permissioned path; no open localhost port.
**Rejected:** Local WebSocket/HTTP server (any local process or webpage could probe it; firewall prompts).
**Cost:** Per-browser host registration (Windows registry keys, macOS manifest locations); Safari needs Xcode packaging and signing.

## ADR-011: Secrets in the OS keychain, never in SQLite

**Decision:** OAuth tokens and API credentials (Phase 4+: the Phase 4 CI access token, then Phase 5 OAuth) are stored via Windows Credential Manager / macOS Keychain (e.g., `keyring` crate). SQLite stores only a reference.
**Why:** Data export must never leak tokens; DB file can be shared for debugging safely.

## ADR-012: Data ownership — export, delete, no telemetry

**Decision:** JSON export of all user data; full delete wipes the DB and keychain entries; no analytics or crash telemetry leaves the device in v1. Crash logs are written locally, and the user chooses to share them.
**Why:** Local-first and privacy are product promises, not settings.

## ADR-013: Single-instance app with tray as the control surface

**Decision:** Enforce single instance (second launch focuses the existing one). Closing the main window hides to tray; quitting is explicit from the tray. Auto-start via OS login-item mechanisms.
**Why:** A companion must be persistent without spawning duplicates that double resource use.

---

## ADR-014: Search index maintained by the repository layer, not SQL triggers

**Status:** Accepted (2026-10-03) · **Supersedes ADR-006** on the sync mechanism only. FTS5 as the search engine, the single unified index, and `bm25` ranking are unchanged.

**Decision:** The FTS5 index is written by Rust. Every repository write that changes indexed text calls `search::reindex(entity)` **inside the same transaction** as the source write. No `CREATE TRIGGER` keeps `search_index` in sync.

**Why:** A single indexed document spans a parent row and its children — a note's text plus its labels, a meeting's text plus its participants, decisions and action items. Trigger-based sync would need triggers on six tables (`notes`, `note_labels`, `labels`, `meeting_participants`, `meeting_decisions`, `meeting_action_items`), each having to re-derive the *whole* document from its own narrow view of the change. That is the fragile part: a missing trigger silently returns wrong search results, which is invisible until a user can't find their own note. One reindex call per aggregate write is one place to get right and one place to test.

**Rejected:** Triggers (as ADR-006 originally stated) — fragility above, and `AFTER DELETE` on a cascade gives no reliable hook to rebuild sibling documents. Rebuilding the index outside the write transaction — a crash between the two leaves search lying about the data.

**Cost / Risk:** Correctness now depends on application discipline, not the database. Three guardrails, all required (backend-schema.md §3.8): an integration test asserting a random CRUD sequence yields an index byte-identical to a from-scratch rebuild; a user-facing **Settings → Advanced → Rebuild search index**; and a startup check that rebuilds in the background when `search_map` row count ≠ entity count.

**Verification:** The consistency test above is an exit-gate item for CP4 feature F1-20.

---

## ADR-015: Phase order revised — Developer → MCP → Voice

**Status:** Accepted (2026-10-03) · **Supersedes the phase numbers** in ADR-009 and ADR-011; their decisions are unchanged.

**Decision:** Post-v1 phase order is 2 Browser · 3 Pet · **4 Developer · 5 MCP · 6 Voice** · 7 Characters. ADR-009's polling exceptions are now *CI status — Phase 4* and *MCP refresh — Phase 5*. ADR-011's keychain is first used in Phase 4 (CI access token) and again in Phase 5 (OAuth tokens).

**Why:** Product-owner decision. Voice follows the integrations it can query, and Developer Companion ships earlier for the developer persona (PRD P2).

**Rejected:** Keeping OAuth ahead of Developer Companion. It would have preserved a clean credentials story but forced Voice, which the owner placed last among the feature phases, to carry the OAuth/MCP foundation.

**Cost / Risk:** Phase 4 needs credentials before the OAuth flow exists, so it takes a pasted token (a worse UX than OAuth, but private-repo CI is the only case that needs one). Phase 5 absorbs the MCP scaffold and OAuth and is the largest post-v1 phase.

**Verification:** Phase 4 acceptance includes "token never in SQLite or export"; Phase 5 re-sizes its feature list before it starts.

---

## Phase 0 Verification Tasks

These are [Guessing]/[Likely] items that must be measured before Phase 1 starts. Results are appended to this file as amendments.

| ID | Question | Pass condition | If it fails |
|----|----------|----------------|-------------|
| V-1 | Does Tauri v2 run on macOS 10.13? | Hello-world bundle launches on the minimum target | Amend product constraint to real minimum |
| V-2 | Total RAM of Tauri app + webview processes at idle | <100 MB summed across all processes, both OSes | Re-scope budget definition in 09 or reconsider shell (new ADR) |
| V-3 | Idle CPU/GPU with pet window visible and animating | CPU <1% at rest, no sustained GPU load | Lower FPS, pause when occluded, or render via native canvas |
| V-4 | FTS5 search at 5000 mixed items | <500 ms p95 | Tune tokenizer/ranking or adopt Tantivy (new ADR) |
| V-5 | Event bus throughput under simulated browser burst | No dropped events, no UI jank | Add buffering at source |

---

## ADR Template (for new decisions)

```markdown
## ADR-0XX: <Title>
**Status:** Proposed | Accepted | Superseded by ADR-0YY
**Decision:**
**Why:**
**Rejected:**
**Cost / Risk:**
**Verification:** (how we'll know it was right)
```

---

Next: **08-code-organization.md** (⏸ on hold until Phase 0) · **09-performance-budgets.md** (🔒 locked)
