# Build Order — Phases & Milestones

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Changes require a written amendment at the bottom of this file.

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
- Full-text search
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
└── Save/Cancel

Search
├── Search input
├── Results list (notes + tasks + meetings)
└── Filter by type

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
- [ ] Can search across notes
- [ ] Notes survive restart
- [ ] Full-text search works (<500ms for 5000 items)
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
- Voice (Phase 4)
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

## Phase 4: Voice & Integrations Foundation

**Goal:** Add voice input and prepare for MCP integrations.

**What's built:**
- Voice activation (button or wake word)
- JEV integration (provider layer)
- Intent parsing (Create task, Create note, Query, etc.)
- Voice-to-task pipeline
- Voice-to-note pipeline
- Voice queries (What did I do today?, Time on app X?)
- MCP client scaffold
- OAuth flow for integrations
- All tests

**What's NOT built:**
- Meeting transcription (comes later)
- Individual integrations (Gmail, GitHub, etc.)
- Automatic voice reactions
- Always-on microphone

**Acceptance Criteria:**
- [ ] Can activate voice via button
- [ ] Voice audio captured and sent to JEV
- [ ] Intent parsed correctly
- [ ] Can create task via voice
- [ ] Can create note via voice
- [ ] Can query data via voice
- [ ] Results spoken aloud (text-to-speech)
- [ ] JEV responses cached/logged locally
- [ ] MCP client can be instantiated
- [ ] OAuth flow works
- [ ] Test coverage >80%

**Ship:** Yes. Voice becomes available for task/note creation.

---

## Phase 5: Developer Companion

**Goal:** Add git, build, and CI awareness.

**What's built:**
- Git repository watcher
- Commit detection
- Build system monitoring
- CI status checks (GitHub Actions, Jenkins) — a **documented polling exception** with backoff, see 07 ADR-009
- Pet reactions to git/build events
- Build failure notifications
- Suggested task creation on build failure
- All tests

**What's NOT built:**
- Automatic task creation (requires user confirmation)
- Advanced CI integration (only GitHub Actions, Jenkins in v1)
- Code analysis
- Performance metrics

**Acceptance Criteria:**
- [ ] Can detect git push
- [ ] Pet reacts to git push (celebration)
- [ ] Can detect build start/complete
- [ ] Pet shows build state (working, success, failure)
- [ ] Can check CI status
- [ ] Notifications on CI failure
- [ ] User can create task from build failure
- [ ] Test coverage >80%

**Ship:** Yes. Developers now have workspace awareness + git/CI reactions.

---

## Phase 6: MCP Integrations

**Goal:** Connect to external services (Gmail, GitHub, Slack, Calendar, Notion).

**What's built:**
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

**Acceptance Criteria:**
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
| **Security Review** | 4+ | Before external integrations |

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
Phase 4 (Voice) ←──────────────────┐ │  │   │
    ↓                              │ │  │   │
Phase 5 (Developer) ←────────────┐ │ │  │   │
    ↓                            │ │ │  │   │
Phase 6 (MCP) ←────────────────┐ │ │ │  │   │
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
