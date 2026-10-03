# Loaf — Product Requirements Document (PRD)

**Milestone:** D2 · **Version:** 1.4 · **Date:** 2026-10-03 · **Status:** 🔒 LOCKED — §9 decisions D-1…D-10 approved 2026-10-03
**Derives from:** `docs/00-product/product-document.md` (D0 v1.4), `docs/01-build-principles/` (D1)
**Changes in v1.1:** §9 approved and locked; §8 phase numbering reconciled with D0. **v1.2:** §8 reordered to the owner's phase order (D0-A2, ADR-015). **v1.3:** CI split out to Phase 5.1 (D2-A3, ADR-016). **v1.4:** global search removed (D2-A4, ADR-017). See §12.

This PRD turns the Product Document into **testable requirements**. Phase 0 and Phase 1 (the first release) are specified to feature level. Phases 2–7 are specified to capability level and get their own PRD addendum before their build starts (Principle 4: one phase at a time).

---

## 1. Problem & Goal

**Problem.** Knowledge workers and students spread their day across notes apps, to-do lists, meeting docs, and browser tabs. At the end of the day they can't easily answer "what did I plan, what did I finish, what's still open, and where did my time go?" — and existing tools that answer this are cloud-based, heavy, or invasive.

**Goal of v1 (Phase 1 release).** A local-first desktop workspace where a user can capture notes, manage tasks through a clear lifecycle, record meetings and turn action items into tasks, and see an automatic daily log — with a companion pet present on the desktop — while staying under 1% idle CPU and 100 MB RAM.

## 2. Target User

| Persona | Description | Primary need |
|---------|-------------|--------------|
| **P1 — Student builder** (primary) | CS student juggling coursework, projects, internships, hackathons | One place for tasks + notes + "what did I do today" |
| **P2 — Individual developer** | Works in IDE + browser all day | Low-friction capture, later dev-aware companion (Phase 4) |
| **P3 — Privacy-minded knowledge worker** | Avoids cloud tools for personal work logs | Local data, export/delete control |

**Not targeted in v1:** teams, shared workspaces, mobile users, users needing cloud sync.

## 3. Success Metrics (Phase 1)

| Metric | Target | How measured (local only, no telemetry) |
|--------|--------|------------------------------------------|
| Daily use | Founder + 5 testers use it ≥5 days/week for 2 weeks | Tester self-report + their own daily logs |
| Capture speed | Global shortcut → note saved in <5 s of user time | Manual timing script |
| Task lifecycle adoption | ≥70% of created tasks reach COMPLETED/CANCELLED within 14 days | Local stats screen (tester shares screenshot) |
| Performance | All budgets in `09-performance-budgets.md` pass on Win + macOS | Release profiling |
| Stability | Zero data-loss bugs during 2-week beta | Bug tracker |

[Certain] Loaf has no telemetry (ADR-012), so all metrics come from testers voluntarily, never from the app phoning home.

## 4. Scope Summary

| In Phase 0 + 1 (v1 release) | Out of v1 |
|-----------------------------|-----------|
| Notes, labels, colors, pin, archive, Markdown | Cloud sync, collaboration |
| Tasks with 5-state lifecycle, dates, priority, project, work updates | Recurring tasks, subtasks, time estimates |
| Meetings with participants, decisions, action items → tasks | Recording, transcription |
| Daily Work Log (task sections only) | Work-session / app / browser time (Phase 2) |
| Per-view filters and sorts (labels, task status, dates, participants) | Global search (withdrawn, D2-A4), semantic/AI search |
| Minimal pet (static sprite, drag, hide/show, size, opacity, on-top) | Animations, reactions, sleep (Phase 3) |
| Tray/menu bar, auto-start, single instance | Voice, MCP, dev companion |
| Settings, theme, shortcuts, export/import/delete | Encryption at rest, multiple languages |

---

## 5. Functional Requirements — Phase 0 (Foundation)

Phase 0 is not user-facing as a release, but these behaviors are user-visible and testable.

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R0-01 | **Single instance** | Launching Loaf while running focuses the existing main window; no second process remains |
| R0-02 | **Tray / menu bar presence** | Icon present on both OSes; menu: Open Loaf, New Note, New Task, Show/Hide Pet, Settings, Quit |
| R0-03 | **Close hides, Quit quits** | Closing the main window hides it; app keeps running; Quit from tray exits all processes |
| R0-04 | **Auto-start** | Toggle in Settings; when on, Loaf starts at login hidden to tray with pet visible |
| R0-05 | **Local database** | DB created at OS app-data path on first launch; survives restart and app update |
| R0-06 | **Migrations safe** | Before applying a schema migration, a copy `loaf.db.bak-<version>` is written; failed migration leaves original DB untouched and shows an error |
| R0-07 | **Export** | Settings → Export writes a single JSON file of all user data to a user-chosen path |
| R0-08 | **Import** | Settings → Import accepts a Loaf export **only into an empty workspace** (v1); validates schema version; all-or-nothing |
| R0-09 | **Delete all data** | Two-step confirmation (type `DELETE`); wipes DB, settings, pet position; app returns to first-run state |
| R0-10 | **Day rollover** | At local midnight (or on first launch/wake on a new day), the previous day's log is frozen (see R1-40) |
| R0-11 | **Theme** | Light / Dark / System; applies instantly to main and pet windows |

## 6. Functional Requirements — Phase 1 (First Release)

Requirement IDs map 1:1 to feature specs (`F1-xx`) in the Implementation Plan.

### 6.1 Notes

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-01 | Create note | Title optional (≤200 chars), body optional (≤100,000 chars); a note with both empty is discarded on close; saved <100 ms |
| R1-02 | Autosave | Edits persist without a Save button: on 800 ms typing pause, on blur, and on window close. No per-keystroke writes |
| R1-03 | Notes list | Pinned section first, then others; default sort = last edited desc; sort options: last edited, created, color |
| R1-04 | Edit note | Opening a note restores cursor at end; edited timestamp updates only on content change |
| R1-05 | Delete note | Confirm dialog; 5-second Undo toast; after that the note is gone (no trash in v1) |
| R1-06 | Pin / unpin | From card hover, editor toolbar, or shortcut; reflects instantly |
| R1-07 | Archive / restore | Archived notes leave the Notes list, appear in the Archive view until restored |
| R1-08 | Labels | Add/remove multiple labels; autocomplete existing; create inline; rename/delete label in Labels manager; deleting a label removes it from notes, not the notes. Label names are unique case-insensitively **including non-ASCII** (`work`/`WORK`, `Éclair`/`ÉCLAIR` are the same label) — creating or renaming to an existing name selects it instead of duplicating (Schema §3.2) |
| R1-09 | Label filter | Sidebar label list filters Notes view; count shown per label |
| R1-10 | Color | 8 colors + default; color shows on card and editor background tint |
| R1-11 | Markdown | Body stored as Markdown source; Edit mode = plain text; Preview mode renders headings, lists, checkboxes (read-only), code, links, bold/italic; raw HTML is not rendered |

### 6.2 Tasks

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-20 | Create task | Title required (≤300 chars); optional description, planned date, due date, priority (Low/Med/High), project; default status PLANNED; planned date defaults to today when created from Today view |
| R1-21 | Quick add | Single-line input on Today and Tasks views; Enter creates task with today's planned date |
| R1-22 | Status transitions | Only transitions in §6.2.1 are allowed; invalid transitions are not offered in UI and rejected by core |
| R1-23 | Timestamps | `started_at` set on first move to IN_PROGRESS; `completed_at` set on COMPLETED, cleared on reopen; every transition recorded in history |
| R1-24 | Defer | "Defer" sets planned date to tomorrow or a chosen date; status unchanged; recorded in history |
| R1-25 | Work updates | Append-only timestamped progress notes on a task; shown newest first; cannot be edited, can be deleted within 5 min |
| R1-26 | Link note | Task can link to one note; link opens the note; deleting the note clears the link |
| R1-27 | Task views | Today (planned today + overdue + in progress), Upcoming (next 7 days), Pending, All (with filters: status, priority, project, date range), Completed (history) |
| R1-28 | Overdue | Task with due date < today and status not COMPLETED/CANCELLED shows Overdue badge |
| R1-29 | Delete task | Allowed only from CANCELLED or COMPLETED state, with confirm (§9 D-3, approved). Deleting a task erases its `task_events` history; past daily logs are unaffected because snapshots copy titles (Schema §3.4, §3.7) |

#### 6.2.1 Task State Machine (authoritative)

| From \ To | PLANNED | IN_PROGRESS | PENDING | COMPLETED | CANCELLED |
|-----------|:------:|:-----------:|:-------:|:---------:|:---------:|
| PLANNED | — | ✅ Start | ❌ | ✅ Complete* | ✅ Cancel |
| IN_PROGRESS | ❌ | — | ✅ Pause | ✅ Complete | ✅ Cancel |
| PENDING | ❌ | ✅ Resume | — | ✅ Complete* | ✅ Cancel |
| COMPLETED | ✅ Reopen | ❌ | ❌ | — | ❌ |
| CANCELLED | ✅ Reopen | ❌ | ❌ | ❌ | — |

\* Direct completion without starting is allowed (users often finish small tasks without marking start). `started_at` stays null in that case. Resolves D0 §4.2 — see §9 D-4 (approved).

### 6.3 Meetings

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-30 | Create meeting | Title required; date/time defaults to now; optional participants, notes (Markdown), decisions, action items, follow-up date |
| R1-31 | Participants | Free-text chips (names or emails); autocomplete from previous meetings |
| R1-32 | Decisions | Ordered list of short text items; add/edit/remove/reorder |
| R1-33 | Action items | Text + optional assignee; each shows "Convert to task" |
| R1-34 | Convert to task | Creates task: title = action text, project = meeting title, due = follow-up date (if set), description includes assignee and link back to meeting; action item shows linked task status live |
| R1-35 | Meetings list | Sorted by date/time desc; filter by participant and date range |

### 6.4 Daily Work Log

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-40 | Freeze at rollover | At day rollover, a snapshot for the ended day is written once and never modified (DB-enforced) |
| R1-41 | Today = live | Today's log is computed live from current data; it becomes a snapshot only at rollover |
| R1-42 | Sections (Phase 1) | Planned, In Progress, Completed, Pending, Cancelled, Overdue, plus stats: completed/planned ratio, tasks created, notes created/edited, meetings held |
| R1-43 | Missed days | If Loaf was not running on some days, logs for those days are reconstructed from task history on next launch; days with no task/note/meeting activity get no log |
| R1-44 | History | Calendar/list of past logs; open any day; compare with previous day (deltas on stats) |
| R1-45 | Export day | Export a single day's log as Markdown |
| R1-46 | Activity sections | Work sessions / app time / browser time **hidden** until Phase 2 provides data |

### 6.5 Search — ❌ REMOVED (D2-A4)

Global search was withdrawn by the product owner on 2026-10-03 (ADR-017). Requirement IDs are retired, never reused.

| ID | Status |
|----|--------|
| R1-50 … R1-56 | **Removed.** Overlay, scope, matching, filters, ranking, performance and navigation requirements no longer apply |

Content stays reachable through the sidebar views, the label filter (R1-09), the task views and filters (R1-27), and the meetings filters (R1-35).

### 6.6 Minimal Pet

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-60 | Pet window | Transparent, frameless window showing one static idle sprite; appears on startup |
| R1-61 | Drag | Pet can be dragged anywhere; position persists per display; if display removed, pet returns to primary display bottom-right |
| R1-62 | Show/hide | Tray, shortcut, and Settings; state persists |
| R1-63 | Settings | Size S/M/L, opacity 30–100%, always-on-top on/off |
| R1-64 | Click | Single click on pet opens main window to Today |
| R1-65 | Cost | Pet visible adds ~0 idle CPU (no animation loop in Phase 1) |

### 6.7 Today View (Home)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-70 | Startup context | Shows: greeting + date; yesterday's summary (completed X of Y, pending count); today's planned tasks; in-progress tasks; overdue; quick add; pinned notes (max 4); upcoming follow-ups from meetings |
| R1-71 | First run | Empty states teach the 3 core actions: add a task, write a note, log a meeting |

### 6.8 Settings, Shortcuts, Appearance

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1-80 | Settings sections | General (auto-start, theme, font size S/M/L), Pet, Shortcuts, Data (export/import/delete, DB location shown read-only), Advanced (log level, reset settings), About (version, licenses) |
| R1-81 | Global shortcuts (OS-wide) | New note, New task (quick add popup), Show/hide pet — all user-rebindable; conflicts detected |
| R1-82 | In-app shortcuts | See UI/UX Brief §8 keyboard map |
| R1-83 | Platform conventions | `Ctrl` on Windows ↔ `Cmd` on macOS everywhere |
| R1-84 | Not in v1 settings | Tracking (Phase 2), notifications (Phase 3), encryption, language — hidden, not disabled-greyed |

## 7. Non-Functional Requirements

Authoritative numbers live in `09-performance-budgets.md`. Summary:

| Area | Requirement |
|------|-------------|
| Performance | Startup <2 s; CRUD <100 ms; views <300 ms |
| Resources | Idle CPU <1%; RAM <100 MB summed across processes; ≤1 idle disk write/min |
| Reliability | No data loss on crash (WAL + immediate commit for user actions); DB integrity check on startup (`PRAGMA quick_check`) |
| Privacy | The app makes **zero** outbound network requests in Phase 0–1 (verifiable by firewall test) |
| Platforms | Windows 10+ x64/ARM64; macOS minimum per V-1 result, Intel + Apple Silicon |
| Accessibility | Full keyboard operation; WCAG 2.1 AA contrast; respects OS reduced-motion and font scaling |
| Updates | Phase 1 ships without auto-update; manual download (auto-update requires network → separate decision) |

## 8. Later Phases — Capability Requirements (Addendum required before build)

Phase numbering is authoritative in `01-build-principles/02-build-order.md` (Amendment A-3) and matches D0 as amended (D0-A2). Order: Browser 2 → Pet 3 → Developer 4 → MCP 5 → Voice 6 → Characters 7.

| Phase | D0 component | Must deliver | Key open questions for its PRD addendum |
|-------|--------------|-------------|------------------------------------------|
| 2 Browser Intelligence | §4.7–4.9 | Extensions ×4, native bridge, app + domain time, open tabs with close, privacy radar, dashboard | Store URL or domain only by default? Category taxonomy? Incognito handling (must be excluded) |
| 3 Pet & Companion | §4.6 (reactive) | Animations, event reactions (D0 §4.6.1), sleep mode, greeting, hover | Character design; reaction rate-limiting so it's never annoying |
| 4 Developer Companion | §4.13 (local) | Git watcher, local build state, pet reactions, task-from-build-failure; fully offline | Which build tools detected; repo discovery UX |
| 5 MCP Integrations | §4.12 | MCP client scaffold, OAuth, Gmail, GitHub, Slack, Calendar, Notion read-only, cached locally | Data retention for cached remote data |
| 5.1 CI Status | §4.13 (CI) | GitHub Actions status (Jenkins if sized), CI pass/fail reactions, CI-failure notification and task suggestion, via Phase 5 GitHub login | Jenkins auth without OAuth; deployment events source |
| 6 Voice | §4.11 | Activation-based voice, JEV provider, intents → note/task/query, meeting transcription | JEV local vs API (privacy vs accuracy); TTS needed? |
| 7 Character Ecosystem | §4.14 | 18 characters, outfits, seasonal, app-specific reactions | Asset pipeline, download vs bundled |

## 9. Decisions (🔒 APPROVED 2026-10-03)

These resolve gaps or contradictions in D0. Each was a [Likely]-quality judgment when proposed; all ten were **approved on 2026-10-03** and are now binding. Changes go through PRD amendments (§12), not edits.

| ID | Gap in D0 | Decision | Reason |
|----|-----------|----------|--------|
| D-1 | Log is "immutable" yet "view today's log" | Today = live view; snapshot frozen at rollover | Both requirements hold without contradiction |
| D-2 | Log includes work sessions/browser time, but tracking ships in Phase 2 | Hide activity sections until Phase 2 | Showing empty sections looks broken |
| D-3 | D0 says "cancel without deletion" but no delete for tasks | Allow delete only from COMPLETED/CANCELLED | Junk/mistaken tasks must be removable; active work can't be lost by accident |
| D-4 | Can PLANNED go straight to COMPLETED? | Yes | Matches real behavior for small tasks |
| D-5 | D0 "Rollback: restore from export" but no import feature | Import into empty workspace only | Merge-import is complex; restore is the stated need |
| D-6 | Settings list "Encryption at rest" while D0 says not v1 | Hidden in v1 | No half features |
| D-7 | Notes "delete permanently" with no recovery | 5-second undo, no trash | Prevents accidental loss without adding a trash system |
| D-8 | "Matches partial words" | Prefix matching, not infix | FTS5 prefix indexes meet the budget; infix (trigram) roughly triples index size — revisit if users complain **(moot: search removed, D2-A4)** |
| D-9 | Startup "Dashboard" in D0 §7.1 vs Phase 2 dashboard | Phase 1 home = **Today view**; Dashboard name reserved for Phase 2 analytics | Avoids two screens with one name |
| D-10 | Auto-update not mentioned | Not in v1 | Would be the only network call; needs its own privacy decision |

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| RAM budget fails on Windows (WebView2) | [Likely] Medium | High | V-2 in CP1 before any Phase 1 work |
| macOS 10.13 unsupported by toolchain | [Guessing] Medium | Medium | V-1; amend platform requirement |
| Scope too large for planned calendar | [Likely] High | High | Implementation Plan re-estimates; cut order defined (§11) |
| Users find pet irrelevant before Phase 3 | [Guessing] Medium | Low | Phase 1 pet is click-to-open shortcut, so it has a job |
| Daily log reconstruction bugs (missed days) | [Likely] Medium | Medium | Task history table + property tests with fake clock |

## 11. Cut Order (if Phase 1 runs late)

Cut from the bottom first; never cut above the line.

1. ~~Never cut:~~ notes CRUD, tasks + state machine, daily log freeze, minimal pet, export/delete
2. ---------------------------------------------------------------
3. Meeting participant autocomplete (R1-31 autocomplete only)
4. Daily log compare + Markdown export (R1-44 compare, R1-45)
5. Label manager rename (R1-08 rename)
6. Import (R0-08) — export stays
7. Note sort options beyond last-edited (R1-03)
8. Global shortcuts rebinding UI (keep defaults) (R1-81)

---

## 12. Amendments

### Amendment D2-A4 (2026-10-03)
Global search removed (ADR-017, D0-A4). §6.5 and **R1-50 … R1-56 are withdrawn**; R1-07, R1-80, R1-81, the §1 goal, the §4 scope table, the §7 performance row, D-8 (now moot) and the §11 never-cut list are updated to match. R1-09 (label filter), R1-27 (task views) and R1-35 (meeting filters) are unchanged and are now the only discovery mechanisms. Not affected: Phase 2 Browser Tabs filtering.

### Amendment D2-A3 (2026-10-03)
§8: CI status, CI reactions and CI-failure task suggestion moved out of Phase 4 into **Phase 5.1** (after MCP, before Voice), authenticated via the Phase 5 GitHub login (ADR-016). Phase 4 is offline. No Phase 0–1 requirement changed.

### Amendment D2-A2 (2026-10-03)
§8 rows reordered and re-scoped to the owner's phase order (ADR-015): Developer 4, MCP 5 (now owns the MCP client scaffold and OAuth), Voice 6. §3 persona P2 now points at Phase 4. No Phase 0–1 requirement changed.

### Amendment D2-A1 (2026-10-03) — locked

- §9 decisions **D-1 … D-10 approved** and marked binding. No decision text changed; only its status.
- §8 phase table gained a D0-component column and a pointer to `02-build-order.md` as the authority for phase numbering, following D0 Amendment D0-A1. Phase assignments in §8 were already correct and are unchanged.
- R1-08 gained an explicit acceptance criterion for case-insensitive label uniqueness across the full Unicode range, so Schema Amendment D6-A1 #3 is testable at requirement level.
- R1-29 now states the history consequence of task deletion (Schema §3.4), so the no-`DELETED`-event decision is visible where the delete rule lives.
- R1-29 and §6.2.1 wording updated from "deviation"/"interpretation pending" to approved.

**Approval:** §9 is approved and this PRD is locked. All further changes are amendments appended above.
