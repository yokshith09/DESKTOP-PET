# Loaf — Roadmap

The one page that tracks progress. Flow: **build principles → phases → milestones → features.**
Everything else is reference — open it when a feature needs it:

| Need | Document |
|------|----------|
| Why / what the product is | [Product Document](docs/00-product/product-document.md) · [PRD](docs/02-prd/PRD.md) |
| How it is built | [TRD](docs/03-trd/TRD.md) · [Schema](docs/05-backend/backend-schema.md) · [ADRs](docs/01-build-principles/07-architecture-decisions.md) |
| What it looks like | [App flow](docs/04-design/app-flow.md) · [UI/UX brief](docs/04-design/ui-ux-brief.md) |
| Feature detail (acceptance, tests) | [`docs/features/`](docs/features/README.md) |
| Sizes and exit gates | [Implementation plan](docs/06-plan/implementation-plan.md) |

**Rule from here:** this file gets status updates only. Scope or design changes go in one line in the PR description, and only get a formal amendment if a locked document would otherwise contradict the code.

---

## 1. Build principles

Full text: [`docs/01-build-principles/`](docs/01-build-principles/README.md).

1. **Event-driven, always** — no polling; one-shot timers are fine.
2. **Lightweight, always** — idle CPU <1%, RAM <100 MB.
3. **Local-first** — user data lives in SQLite on their machine.
4. **One feature at a time** — finish and verify before the next.
5. **UI first** — design before backend.
6. **Tests early** — before or alongside code; >80% coverage to ship.
7. **Learn fundamentals first** — understand it before reaching for a library.
8. **Usable at every phase** — each phase ships something people can use.
9. **No premature optimisation** — make it work, right, then fast.
10. **Technical debt is a debt** — log it with a payoff date.

## 2. Phases

| Phase | Name | Ships | Status |
|------:|------|-------|--------|
| **0** | Foundation | Scaffold, event bus, database, settings, tray, CI | 🟡 In progress |
| **1** | Workspace | Notes, tasks, daily log, meetings, minimal pet → **v1.0.0** | ⬜ Not started |
| 2 | Browser Intelligence | App + browser time tracking, dashboard | ⬜ |
| 3 | Pet & Companion | Animated pet that reacts to events | ⬜ |
| 4 | Developer Companion | Git and local build awareness | ⬜ |
| 5 | MCP Integrations | MCP client, OAuth, GitHub / Gmail / Calendar / Slack / Notion | ⬜ |
| 5.1 | CI Status | CI results and reactions | ⬜ |
| 6 | Voice | Activation-based voice → tasks, notes, queries | ⬜ |
| 7 | Characters | 18 characters, outfits | ⬜ |

Global search was removed from v1 (ADR-017). Phases 2–7 below are outlines; each is sized from its own feature list just before it starts.

---

## Phase 0 — Foundation

**Goal:** a base everything else stands on. **Exit gate:** all F0 acceptance criteria pass on Windows and macOS, V-1, V-2, V-3 and V-5 recorded.

**Legend:** ✅ done · 🟡 core logic done and tested, UI/OS wiring waits on the shell · 🟡 Review = built, awaiting a check only you can do · ⬜ not started · ⏸ gated

**Code so far:** `loaf-core` has 143 tests; every rule above marked done or 🟡 logic is mutation-checked where it matters.

> **Open decision (V-2):** a hello-world Windows build measures about 105 MB total RAM (private bytes) against a 100 MB budget; macOS measures 47.5 MB. Features that don't touch the shell (everything in `loaf-core`) continue; shell-dependent ones wait for the decision. A second Windows figure (private working set) is being measured.

### Milestone CP1 — Foundation & verification
| ID | Feature | Days | Status |
|----|---------|-----:|--------|
| F0-01 | Tauri + React/TS scaffold, builds on Windows & macOS | 1.5 | 🟡 Review — builds on both OSes; V-1 (oldest macOS) needs your Mac |
| F0-02 | CI matrix + early RAM measurement (V-2) | 1.5 | 🟡 Review — CI green; **Windows over budget, decision pending** |
| F0-13 | Error model, logging, panic hook | 1.0 | ✅ Done — 16 tests |
| F0-03 | Event bus | 1.5 | ✅ Done — 11 tests |
| F0-04 | Database, migrations, integrity check | 1.5 | ✅ Done — 24 tests |
| F0-05 | DB writer thread + read pool | 1.5 | ✅ Done — 10 tests, mutation-checked |
| F0-06 | Clock + midnight rollover scheduler | 2.0 | 🟡 Core done (clock, DST, scheduler); OS wake/timezone hooks wait on the shell |
| F0-07 | Settings + typed IPC to the frontend | 1.5 | ⏸ Waits on V-2 |
| F0-08 | Tray, single instance, close-hides, quit | 1.0 | ⏸ Waits on V-2 |
| F0-09 | Autostart (`--hidden`) | 0.5 | ⏸ Waits on V-2 |
| F0-10 | Frontend shell: sidebar, router, theme, tokens | 2.0 | ⏸ Waits on V-2 |
| F0-11 | Export / import / delete all data | 2.5 | ⏸ Waits on V-2 |
| F0-12 | Performance harness; final V-2, V-3, V-5 | 2.0 | ⏸ Waits on V-2 |
| | **Milestone total** | **20.0** | |

---

## Phase 1 — Workspace (first release, v1.0.0)

**Goal:** a usable local-first workspace: capture notes, run tasks through a lifecycle, log meetings, see an automatic daily log, with the pet present. **Exit gate:** all PRD R1 requirements implemented, budgets pass on both OSes, `v1.0.0` tagged.

### Milestone CP2 — Notes core
| ID | Feature | Days | Status |
|----|---------|-----:|--------|
| F1-01 | Create note + editor + autosave | 2.0 | 🟡 Logic done; editor UI waits on the shell |
| F1-02 | Notes list: pinned/others, cards, sort | 1.5 | 🟡 Logic done (list, sort, filter); UI waits |
| F1-03 | Edit semantics (`edited_at`, reopen) | 0.5 | ✅ Logic done (`edited_at` rules) |
| F1-04 | Delete with 5 s undo | 1.0 | 🟡 Logic done (snapshot + restore); undo toast waits |
| F1-05 | Pin / unpin | 0.5 | 🟡 Logic done; UI waits |
| F1-06 | Archive / restore + Archive view | 1.0 | 🟡 Logic done; Archive view waits |
| F1-07 | Labels: add, filter, manage | 2.0 | 🟡 Logic done (Unicode-safe labels); sidebar + manager UI wait |
| F1-08 | Note colour | 0.5 | 🟡 Logic done; picker UI waits |
| F1-09 | Markdown edit / preview | 1.0 | ⬜ |
| | **Milestone total** | **10.0** | |

### Milestone CP3 — Tasks & Daily Log
| ID | Feature | Days | Status |
|----|---------|-----:|--------|
| F1-10 | Create task + quick add | 1.5 | 🟡 Logic done (create, quick add); UI waits |
| F1-11 | Task state machine + history + transition UI | 2.0 | 🟡 Logic done (all 25 transitions + history); transition UI waits |
| F1-12 | Dates, priority, project, overdue, defer | 1.5 | 🟡 Logic done (dates, priority, project, overdue, defer); UI waits |
| F1-13 | Task detail: work updates, link note, history | 1.5 | 🟡 Part done (history, note link, delete rule); work updates ⬜ |
| F1-14 | Task views: Today / Upcoming / Pending / All / Completed | 2.0 | 🟡 Logic done (all five views, filters); UI waits |
| F1-15 | Daily log: live, freeze at rollover, missed days | 3.0 | 🟡 Logic done (live, freeze, reconcile, freezer; 23 tests); UI waits |
| F1-16 | Daily Logs view + compare + Markdown export | 1.5 | ⬜ |
| | **Milestone total** | **13.0** | |
Daily-log tests must cover midnight, DST, timezone change and a multi-day gap before this milestone closes (logs are immutable, so a bug is permanent).

### Milestone CP4 — Meetings, Pet, Today, Settings
| ID | Feature | Days | Status |
|----|---------|-----:|--------|
| F1-17 | Meeting create/edit + participants | 2.0 | ⬜ |
| F1-18 | Decisions + action items | 1.0 | ⬜ |
| F1-19 | Action item → task | 1.0 | ⬜ |
| F1-22 | Minimal pet window | 1.5 | ⬜ |
| F1-23 | Today view | 2.0 | ⬜ |
| F1-24 | Global shortcuts + quick-add popup + keymap | 2.0 | ⬜ |
| F1-25 | Settings screens | 1.5 | ⬜ |
| F1-26 | First run + empty states | 1.0 | ⬜ |
| | **Milestone total** | **12.0** | |
F1-20 and F1-21 (search) are cancelled and their numbers retired.

### Milestone CP5 — Release
| ID | Feature | Days | Status |
|----|---------|-----:|--------|
| F1-27 | Cross-OS E2E, installers, signing, **v1.0.0** | 3.0 | ⬜ |
| | **Milestone total** | **3.0** | |

**Phase 1 total: 58.0 relative dev-days** (relative size, not a forecast).

---

## Phase 2 — Browser Intelligence *(outline)*
**Milestone 2.1 — Capture**
- App-focus tracking (OS events, no polling)
- Chrome + Edge extensions (MV3)
- Native-messaging bridge to the core
- Firefox extension
- Safari extension

**Milestone 2.2 — Data & privacy**
- Browser / domain sessions, buffered writes (≤1/min)
- Domain categories
- Privacy radar: track / don't track, incognito excluded, delete data

**Milestone 2.3 — Dashboard**
- Today dashboard: time by category, top apps and domains, hourly chart
- Open tabs view + close tab
- Today vs yesterday

## Phase 3 — Pet & Companion *(outline)*
**Milestone 3.1 — Pet engine**
- Sprite renderer (30 FPS cap, stops when hidden)
- Idle and hover animations
- Behaviour state machine

**Milestone 3.2 — Reactions**
- Task created / completed / pending
- App focus (editor, design tool)
- Long-session encouragement, rate-limited

**Milestone 3.3 — Companion**
- Sleep mode
- Startup greeting
- Pet behaviour settings

## Phase 4 — Developer Companion *(outline; fully offline)*
**Milestone 4.1 — Git**
- Repository watcher on `.git` refs
- Commit and push detection

**Milestone 4.2 — Build**
- Local build monitoring
- Build state in the dashboard

**Milestone 4.3 — Reactions**
- Pet reactions to git and build events
- Build-failure notification
- Suggest a task from a failure

## Phase 5 — MCP Integrations *(outline; the largest post-v1 phase)*
**Milestone 5.1 — Foundation**
- MCP client scaffold
- OAuth 2.0 + PKCE, tokens in the OS keychain
- Integration settings and per-integration toggle
- MCP events routed into Loaf events

**Milestone 5.2 — Services (read-only)**
- GitHub
- Gmail (+ action-item extraction)
- Google Calendar
- Slack
- Notion

## Phase 5.1 — CI Status *(outline)*
**Milestone 5.1.1 — CI**
- GitHub Actions status (Jenkins if sizing allows)
- CI pass / fail pet reactions
- CI-failure notification and task suggestion

## Phase 6 — Voice *(outline)*
**Milestone 6.1 — Capture & intent**
- Activation (button / wake word), no always-on mic
- Audio capture and JEV provider
- Intent parsing

**Milestone 6.2 — Actions**
- Voice → task
- Voice → note
- Voice queries
- Spoken results

**Milestone 6.3 — Meetings**
- Meeting transcription into the transcript field

## Phase 7 — Characters *(outline)*
**Milestone 7.1 — Character system**
- Asset pipeline and lazy loading
- Character switching UI

**Milestone 7.2 — Wardrobe**
- Outfits and closet
- Seasonal packs

**Milestone 7.3 — Context**
- App-specific reactions
- Character pack download

