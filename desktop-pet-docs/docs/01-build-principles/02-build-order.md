# Build Order — Phases & Milestones

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02 · **amended A-1 … A-5 (2026-10-03)**. Changes require a written amendment at the bottom of this file.
> This file is the **authority for phase numbering** (see Amendment A-2).

This is the canonical sequence for building Loaf. Each phase is a complete, shippable increment.

## Phase 0: Foundation

**Goal:** Establish the base architecture so subsequent phases have a solid foundation.

**What's built:**
- Tauri project scaffold (Windows + macOS)
- Rust core with event bus
- SQLite database initialized
- Basic tray icon
- Settings storage and retrieval
- Data export/backup capability
- Auto-start configuration

**What's NOT built:**
- UI (just basic window)
- Pet
- Notes
- Features

**Acceptance Criteria:**
- [ ] Tauri compiles for Windows and macOS
- [ ] Event bus works (can emit and listen to events)
- [ ] SQLite is initialized and can read/write
- [ ] Settings persist across restarts
- [ ] App can be exported/reset without data loss
- [ ] All technical debt logged with a payoff date

**Ship:** No, this is foundation only. Phase 1 can start once this is done.

---

## Phase 1: Notes System

**Goal:** Build a complete, usable notes system. This is the first shipped product.

**What's built:**
- UI for notes home, create, edit, delete
- Notes table in SQLite
- Labels system
- Archive system
- Pin system
- Color system
- Daily work log (auto-generated)
- Task system (basic)
- Meeting notes (basic)
- All tests

**What's NOT built:**
- Pet animations and reactions (Phase 3). **Phase 1 ships a minimal pet** — transparent window, single static idle sprite, drag, hide/show — because "pet required from v1" is a non-negotiable constraint.
- Browser tracking
- Voice
- MCP
- Insights

**UI Components:**
```
Home
├── Pinned Notes (cards)
├── All Notes (list)
├── Archive link
└── Settings link

Create/Edit
├── Title input
├── Body input (textarea)
├── Labels input
├── Color picker
├── Pin toggle
├── Archive toggle
└── (no Save/Cancel — autosave; PRD R1-02)

Daily Log
├── Today's planned tasks
├── Today's completed tasks
├── Today's pending tasks
├── Upcoming deadlines
└── Previous days (link)
```

**Acceptance Criteria:**
- [ ] Can create note with title + body
- [ ] Can edit note
- [ ] Can delete note
- [ ] Can archive/unarchive
- [ ] Can pin/unpin
- [ ] Can add/remove labels
- [ ] Can change color
- [ ] Notes survive restart
- [ ] Daily log auto-generates and shows correct data
- [ ] Can create tasks with title, due date, status
- [ ] Can mark tasks complete
- [ ] Minimal pet present: transparent window, static idle sprite, draggable, hide/show, position persists
- [ ] Can create meeting notes with participants, decisions, action items
- [ ] Test coverage >80%
- [ ] App startup <2s
- [ ] No idle CPU >1%
- [ ] Complete user documentation

**Ship:** Yes. Phase 1 is the first public release.

---

## Phase 2: Browser Intelligence

**Goal:** Track browser activity and show usage insights.

**What's built:**
- Browser extensions (Chrome, Edge, Firefox, Safari)
- Browser bridge (local IPC to Rust core)
- Browser session tracking in SQLite
- Domain categorization
- Time aggregation by app/domain
- Dashboard showing time breakdown
- "Close tab from dashboard" action
- Open tabs view
- Privacy radar (track/don't track per domain)
- All tests

**What's NOT built:**
- Pet reactions to browser activity (Phase 2 shows data; app-specific pet reactions arrive in Phase 7)
- Advanced insights/trends
- Website blocking
- Session replay

**UI Components:**
```
Dashboard
├── Total computer time (today)
├── Time by category (Coding, Documentation, etc.)
├── Top apps (list with times)
├── Top domains (list with times)
├── Hourly activity (chart)
└── Today vs Yesterday (comparison)

Browser Tabs
├── Tabs by browser (Chrome, Edge, Firefox, Safari)
├── Tab title + domain
├── Time spent per tab
└── Close button (×)

Privacy Radar
├── Tracked domains (list)
├── Do-not-track domains (list)
├── Add domain to do-not-track
└── Delete all tracking data
```

**Acceptance Criteria:**
- [ ] Extensions compile for all browsers
- [ ] Extensions detect tab open/close/focus
- [ ] Data sent to Rust core via bridge
- [ ] App sessions recorded in SQLite
- [ ] Domain sessions recorded in SQLite
- [ ] Dashboard shows correct time breakdown (<300ms render)
- [ ] Can close tab from dashboard
- [ ] Can toggle tracking per domain
- [ ] Can delete tracking data
- [ ] Privacy radar works
- [ ] Test coverage >80%
- [ ] No additional idle CPU (extensions only fire on events)
- [ ] Complete user documentation

**Ship:** Yes. Phase 2 extends Phase 1 into a workspace + activity tracker.

---

## Phase 3: Pet & Companion

**Goal:** Add the pet as a present, event-reactive interface.

**What's built:**
- Pet sprite/asset
- Transparent window rendering
- Basic animations (idle, hover)
- Event-driven reactions (task completed, app focused, etc.)
- Sleep mode
- Hide/show
- Pet settings (size, opacity, always-on-top)
- Greeting on startup
- All tests

**What's NOT built:**
- Character customization (Phase 7)
- Voice (Phase 6)
- Advanced animations
- Sound

**Acceptance Criteria:**
- [ ] Pet renders in transparent window
- [ ] Pet can be dragged
- [ ] Pet can be hidden/shown
- [ ] Pet has idle animation
- [ ] Pet reacts to task completion
- [ ] Pet reacts to app focus (VS Code, Figma, etc.)
- [ ] Pet enters sleep mode
- [ ] Greeting on startup
- [ ] No GPU usage
- [ ] Framerate stable at 30 FPS
- [ ] Test coverage >80%
- [ ] No additional idle CPU

**Ship:** Yes. Now Loaf is a workspace with a companion.

---

## Phase 4: Developer Companion

**Goal:** Add local git and build awareness. Phase 4 is fully local — no network, no credentials. CI status arrives in Phase 5.1.

**What's built:**
- Git repository watcher
- Commit detection
- Local build system monitoring
- Pet reactions to git/build events
- Build failure notifications (from the local build)
- Suggested task creation on local build failure
- All tests

**What's NOT built:**
- CI status checks (GitHub Actions, Jenkins) — Phase 5.1
- CI pass/fail pet reactions and CI-failure notifications — Phase 5.1
- Deployment events — with CI in Phase 5.1
- Automatic task creation (requires user confirmation)
- Code analysis
- Performance metrics

**Acceptance Criteria:**
- [ ] Can detect git push
- [ ] Pet reacts to git push (celebration)
- [ ] Can detect build start/complete
- [ ] Pet shows build state (working, success, failure)
- [ ] Notification on local build failure
- [ ] User can create task from build failure
- [ ] Zero network requests (firewall test)
- [ ] Test coverage >80%

**Ship:** Yes. Developers now have workspace awareness + git/build reactions.

---

## Phase 5: MCP Integrations

**Goal:** Build the MCP client and OAuth foundation, then connect to external services (Gmail, GitHub, Slack, Calendar, Notion).

**What's built:**
- MCP client scaffold
- OAuth 2.0 + PKCE flow for integrations
- Gmail integration (read emails, extract action items)
- GitHub integration (read PRs, issues)
- Slack integration (read messages, send notifications)
- Google Calendar integration (show events)
- Notion integration (sync notes)
- Integration settings UI
- Per-integration enable/disable
- MCP event routing to Loaf events
- All tests

**What's NOT built:**
- Write-back to external services (v1 is read-only)
- Real-time sync (event-driven only)
- Advanced filtering
- CI status (Phase 5.1, built on this phase's GitHub login)
- Voice (Phase 6)

**Acceptance Criteria:**
- [ ] MCP client can be instantiated, list tools, call one
- [ ] OAuth flow works (loopback redirect, PKCE, tokens in keychain)
- [ ] Can authenticate Gmail via OAuth
- [ ] Can read recent emails
- [ ] Can extract action items from emails
- [ ] Can authenticate GitHub via OAuth
- [ ] Can read recent PRs and issues
- [ ] (repeat for Slack, Calendar, Notion)
- [ ] Integrations can be toggled on/off
- [ ] No data stored externally (cached locally only)
- [ ] Test coverage >80%

**Ship:** Yes. Loaf now connects to the tools developers use daily.

---

## Phase 5.1: CI Status

**Goal:** Show CI results and react to them, now that OAuth and the MCP client exist. Ships after Phase 5 and before Voice; it is an increment, not a renumbering.

**What's built:**
- CI status checks (GitHub Actions first; Jenkins if it fits the start-of-phase estimate) — a **documented polling exception** with backoff, see 07 ADR-009
- Authentication through the Phase 5 GitHub OAuth login and keychain-held tokens (ADR-011) — no pasted tokens
- CI passed / CI failed pet reactions
- CI failure notifications
- Suggested task creation on CI failure
- Deployment started/completed events if the CI provider exposes them
- All tests

**What's NOT built:**
- Automatic task creation (requires user confirmation)
- Providers beyond GitHub Actions and Jenkins
- Write-back to CI (re-run, cancel)

**Acceptance Criteria:**
- [ ] Can read CI status for a watched repo through the Phase 5 GitHub login
- [ ] Polls only while a build is known to be running; exponential backoff 15 s → 5 min; stops when finished (ADR-009)
- [ ] Pet reacts to CI passed and CI failed
- [ ] Notification on CI failure
- [ ] User can create a task from a CI failure
- [ ] No token in SQLite or in a data export
- [ ] Test coverage >80%

**Ship:** Yes. Developer Companion is now complete.

---

## Phase 6: Voice

**Goal:** Add activation-based voice input.

**What's built:**
- Voice activation (button or wake word)
- JEV integration (provider layer)
- Intent parsing (Create task, Create note, Query, etc.)
- Voice-to-task pipeline
- Voice-to-note pipeline
- Voice queries (What did I do today?, Time on app X?)
- Meeting transcription into the existing `meetings.transcript` column
- All tests

**What's NOT built:**
- Automatic voice reactions
- Always-on microphone
- New integrations (voice reuses the Phase 5 MCP client if a query needs it)

**Acceptance Criteria:**
- [ ] Can activate voice via button
- [ ] Voice audio captured and sent to JEV
- [ ] Intent parsed correctly
- [ ] Can create task via voice
- [ ] Can create note via voice
- [ ] Can query data via voice
- [ ] Results spoken aloud (text-to-speech)
- [ ] JEV responses cached/logged locally
- [ ] No microphone capture outside activation
- [ ] Test coverage >80%

**Ship:** Yes. Voice becomes available for task/note creation.

---

## Phase 7: Character Ecosystem

**Goal:** Add character customization and cosmetics.

**What's built:**
- 18 base character designs
- Character closet/outfit system
- Seasonal outfits
- App-specific behavior (VS Code → glasses, Spotify → dancing)
- Character switching UI
- Outfit equipping UI
- Character pack download mechanism
- All tests

**What's NOT built:**
- Community character creation tools
- Monetization (no paid cosmetics in v1)
- Advanced customization

**Acceptance Criteria:**
- [ ] Can switch between 18 characters
- [ ] Can equip outfits per character
- [ ] Pet behavior persists across restarts
- [ ] Seasonal content available
- [ ] VS Code detection triggers glasses animation
- [ ] Spotify detection triggers dance animation
- [ ] (other app-specific reactions)
- [ ] Character choice is persistent
- [ ] Test coverage >80%

**Ship:** Yes. Loaf is now a full companion with personality.

---

## Parallel Tracks (Not Sequential)

Some work happens in parallel:

| Track | Phases | Ownership |
|-------|--------|-----------|
| **Documentation** | 0–7 | Throughout each phase |
| **Design System** | 0–7 | Before UI in each phase |
| **Testing Infrastructure** | 0–7 | Before code in each phase |
| **Performance Profiling** | 2–7 | With each feature |
| **Security Review** | 4+ | Before external integrations (Phase 5 OAuth/MCP, Phase 5.1 CI polling) |

---

## Phase Dependencies

```
Phase 0 (Foundation)
    ↓
Phase 1 (Notes) ←───────────────────────────┐
    ↓                                       │
Phase 2 (Browser) ←─────────────────────┐   │
    ↓                                   │   │
Phase 3 (Pet) ←──────────────────────┐  │   │
    ↓                                │  │   │
Phase 4 (Developer) ←──────────────┐ │  │   │
    ↓                              │ │  │   │
Phase 5 (MCP) ←──────────────────┐ │ │  │   │
    ↓                            │ │ │  │   │
Phase 5.1 (CI status) ←─────────┐ │ │ │  │   │
    ↓                          │ │ │ │  │   │
Phase 6 (Voice) ←──────────────┐ │ │ │  │   │
    ↓                          │ │ │ │  │   │
Phase 7 (Characters) ←────────┐ │ │ │ │  │   │
                              │ │ │ │ │  │   │
All can run documentation ────┘ │ │ │ │  │   │
All can run design/tests ────────┘ │ │ │  │   │
All can run perf profiling ─────────┘ │ │  │   │
All can run security ───────────────────┘ │  │   │
```

In short: Phase 0 must complete first. Phases 1–7 are sequential (can't build Phase 2 until Phase 1 ships).

---

## Shipping Criteria

Each phase must meet these criteria before shipping:

```
Shipping Checklist:

Feature Complete?
  [ ] All acceptance criteria met
  [ ] UI matches spec
  [ ] All tests passing
  [ ] No known bugs

Quality Gates?
  [ ] Test coverage >80%
  [ ] No idle CPU regression
  [ ] Startup time <2s
  [ ] No crashes in testing
  [ ] Zero technical debt (or documented)

Documentation?
  [ ] Feature is documented
  [ ] User guide written
  [ ] Architecture notes added
  [ ] Code comments where non-obvious

Ready to Ship?
  [ ] Product is usable end-to-end
  [ ] Users can actually use this feature
  [ ] Release notes written
  [ ] Changelog updated
```

---

## Contingency

**If a phase is running late:**
- Don't add scope (cut features, move to next phase)
- Don't skip tests (run in parallel)
- Don't compromise code quality (ship less, ship better)

**If a phase discovers a critical bug in the previous phase:**
- Pause current phase
- Fix the bug in previous phase
- Resume current phase

**If team realizes the design is wrong mid-phase:**
- Pause development
- Fix design (go back to UI-first principle)
- Resume with corrected design

---

Next: Read **03-ui-first.md** for UI-first methodology.

---

## Amendments

### Amendment A-1 (2026-10-02)
Removed all calendar week numbers from phase headings. Phases are
sequenced, not scheduled: each phase begins only when the previous
phase's shipping checklist (below) is met. Progress tracking and
per-phase feature sizing live in the Implementation Plan
(`docs/06-plan/implementation-plan.md`) and are re-estimated from
that phase's own feature list immediately before the phase starts.
Scope and phase order are unchanged.

### Amendment A-2 (2026-10-03)
**This document is the authority for phase numbering.** *(The phase table in this amendment was superseded by Amendment A-3 below.)* D0 Amendment D0-A1
resolved a conflict in which `product-document.md` §4.11–§4.14 tagged Voice
P3, MCP P3–P4, Developer Companion P4 and Characters P5, against the
numbering used here and in the PRD and Implementation Plan. The numbering in
this file was correct and is unchanged:

| Phase | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|-------|---|---|---|---|---|---|---|
| | Notes + minimal pet | Browser Intelligence | Pet & Companion | Voice & Integrations Foundation | Developer Companion | MCP Integrations | Character Ecosystem |

D0 now states **priority** per component (P0/P1/P2/P3) and defers to this
file for sequence. Any future phase renumbering amends this file first.

### Amendment A-3 (2026-10-03) — phase order set by the product owner
The product owner set the final order: **Notes → Browser → Pet → Developer → MCP → Voice → Characters.** This supersedes the table in A-2 and the Phase 4–6 bodies above. Phases 0–3 and 7 are unchanged.

| Phase | Was (A-2) | Now |
|-------|-----------|-----|
| 4 | Voice & Integrations Foundation | **Developer Companion** |
| 5 | Developer Companion | **MCP Integrations** (now also owns the MCP client scaffold and OAuth, moved here from old Phase 4) |
| 6 | MCP Integrations | **Voice** (now voice only; the MCP scaffold and OAuth left it) |

Consequences carried into the same body text and downstream documents:
- The MCP client scaffold and OAuth flow moved from the old Phase 4 into Phase 5, so Phase 5 is larger than the old Phase 6 and needs re-sizing in its own start-of-phase estimate.
- Developer Companion now precedes OAuth. Its CI checks use a user-provided access token held in the keychain (ADR-011); OAuth login is Phase 5.
- ADR-009's polling exceptions are renumbered CI → Phase 4, MCP refresh → Phase 5 (see ADR-015).
- Meeting transcription (the `meetings.transcript` column) follows Voice to Phase 6.
- The Phase 7 gate now reads "Phase 6 shipping checklist met".

### Amendment A-4 (2026-10-03) — CI status moves after MCP
The product owner decided CI is built after MCP integration. Phase numbers 1–7 are unchanged; CI status becomes **Phase 5.1**, shipping after Phase 5 and before Voice.

| | Was (A-3) | Now |
|---|-----------|-----|
| Phase 4 Developer Companion | git + build + CI status | **git + local build only**; fully offline |
| CI status checks, CI reactions, CI-failure task suggestion | Phase 4 | **Phase 5.1** |
| CI credentials | pasted access token in keychain | **Phase 5 GitHub OAuth** + keychain |
| ADR-009 CI polling exception | Phase 4 | Phase 5.1 |

Consequences: Phase 4 makes no network requests, so the zero-network firewall test still holds through it; no credential is needed before OAuth exists; the pasted-token UX is dropped. Phase 5.1 depends on Phase 5's GitHub OAuth, so a Phase 5 slip delays CI but nothing else. See ADR-016.

### Amendment A-5 (2026-10-03) — search removed; editor sketch corrected
- **Search removed (ADR-017).** Phase 1's "Full-text search" build item, the Search UI sketch, and the acceptance lines "Can search across notes" and "Full-text search works (<500ms for 5000 items)" are deleted. Everything else in Phase 1 is unchanged.
- **Editor sketch corrected.** The Create/Edit sketch ended in "Save/Cancel", contradicting PRD R1-02 and UI brief principle 3 (autosave, no Save buttons). It now says so; the PRD and UI brief governed all along.
