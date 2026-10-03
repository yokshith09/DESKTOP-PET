# LOAF — Product Document
**Version 1.4** · **Status: 🔒 LOCKED (D0) · amended D0-A1 … D0-A4**  
**Last updated:** October 3, 2026 (see §15 Amendments)

---

## 1. Product Overview

**Loaf** is a lightweight desktop companion application for Windows and macOS that helps users organize, track, and understand their daily work through an integrated workspace combined with a persistent, event-reactive pet interface.

**Core identity:**
- A personal workspace (notes, tasks, meetings, daily progress tracking)
- A desktop companion that observes and reacts to user activity
- A browser-aware system that tracks and visualizes digital time
- An event-driven platform for integrations and automations

**Non-negotiable principles:**
1. Event-driven architecture (no polling, no unnecessary background work)
2. Lightweight resource footprint (low CPU, RAM, battery impact)
3. Local-first data storage (privacy by default)
4. Pet is required and present from v1 (not optional)
5. Cross-platform (Windows + macOS simultaneously)

---

## 2. User & Use Case Definition

### Primary User
A knowledge worker or student who:
- Works across multiple applications (code editor, browser, documentation tools)
- Manages tasks, meetings, and ad-hoc work
- Wants a single place to organize daily work without heavy overhead
- Values privacy and local control over cloud synchronization
- Appreciates lightweight, unobtrusive presence on their desktop

### Primary Use Cases

**UC1: Daily Work Organization**
- User starts their workday
- Opens Loaf to see planned tasks, pending items, and daily context
- Creates or updates notes as work progresses
- Marks tasks complete as they finish
- Closes Loaf or lets it run in background while working

**UC2: Task Lifecycle Management**
- User plans tasks for today, tomorrow, or a specific date
- Tasks transition through states: Planned → In Progress → Completed
- Completed tasks create a historical record
- Pending tasks remain visible until explicitly completed or cancelled
- User can defer or cancel tasks without losing context

**UC3: Meeting Capture**
- User attends a meeting
- Records meeting details (title, participants, discussion, decisions)
- Extracts action items and converts them into tasks
- Later, voice transcription can populate meeting notes automatically

**UC4: Browser Activity Awareness**
- User opens browser and works across multiple tabs
- Loaf tracks which domains consume time
- User sees aggregate time per app, domain, and tab
- User can close tabs directly from Loaf dashboard
- Privacy controls allow excluding sensitive domains (banking, healthcare)

**UC5: Historical Context**
- User starts system after a break (overnight, between days)
- Loaf shows what was planned, what was completed, what remains
- User can quickly understand where they left off
- Previous-day history is available for reference

**UC6: Pet Reactions**
- User completes a task → pet celebrates
- User opens code editor → pet reacts contextually
- User finishes a meeting → pet gives notification
- Pet behavior is tied to system events, not arbitrary animations

---

## 3. Core Product Architecture

### 3.1 Foundational Layers

```
┌─────────────────────────────────────────────┐
│        PRESENTATION LAYER                   │
│   (Tauri UI + TypeScript + React)           │
├─────────────────────────────────────────────┤
│        PET & DASHBOARD INTERFACE            │
│   (Transparent window, tray, notifications) │
├─────────────────────────────────────────────┤
│        EVENT BUS / ORCHESTRATION            │
│   (Rust core — event routing & timing)      │
├─────────────────────────────────────────────┤
│        DATA LAYER                           │
│   (SQLite — notes, tasks, sessions, logs)   │
├─────────────────────────────────────────────┤
│        OS INTEGRATION LAYER                 │
│   (App tracking, browser extensions, OS     │
│    notifications, settings, permissions)    │
├─────────────────────────────────────────────┤
│        EXTERNAL INTEGRATIONS                │
│   (MCP clients, JEV voice, OAuth)           │
└─────────────────────────────────────────────┘
```

### 3.2 Event-Driven Constraint

**All state changes flow through an event model, not polling or timers.**

Examples:
- User creates a note → `NoteCreated` event → SQLite persisted → UI notified
- App comes to foreground → `AppFocused` event → activity recorded → pet notified
- Task marked complete → `TaskCompleted` event → daily log updated → pet reacts
- Browser tab closes → `TabClosed` event → time session ended → dashboard updated

**Prohibited patterns:**
- Checking app every 100ms
- Continuous background scanning
- Timer-based polling for changes
- Wasteful re-renders

**Batching rule:**
- Frequent events (keystroke, mouse movement) are batched before persistence
- Infrequent events (task creation, tab open) are persisted immediately
- Disk writes happen in intervals, not per-event

---

## 4. Product Components

### 4.1 Notes System (Priority P0 · Phase 1)

**Definition:** A lightweight note-taking system inspired by Google Keep, structured around work and daily context.

**Core entities:**

| Entity | Description |
|--------|-------------|
| **Note** | Discrete unit of information: title, body, timestamps, metadata |
| **Label** | User-defined category (e.g., #hackathon, #work, #personal) |
| **Color** | Visual grouping (system provides 6–8 standard colors) |
| **Pin** | Boolean flag to keep note at top of list |
| **Archive** | Boolean flag to move note out of active view |
| **Created** | ISO timestamp of creation |
| **Last Edited** | ISO timestamp of last modification |

**Note capabilities:**
- Create note with title and body
- Edit title and body
- Add/remove labels
- Change color
- Pin/unpin
- Archive/unarchive
- Delete permanently
- Restore from archive
- Sort by: recently edited, created date, label, color, pin status
- Support for plain text and Markdown
- Survive application restart
- Survive application updates
- Support empty title (body-only notes)
- Keyboard shortcuts (Ctrl+N to new note, etc.)
- Fast startup (no scanning all notes on launch)

**Note lifecycle:**
```
CREATE → ACTIVE → EDIT → ACTIVE → ARCHIVE → RESTORE → ACTIVE → DELETE
         ↑                                              ↓
         └──────────────────────────────────────────────┘
```

**Constraints:**
- Notes are stored locally in SQLite
- No syncing to cloud initially
- No collaborative editing
- No rich-text formatting (Markdown only)

---

### 4.2 Task System (Priority P0 · Phase 1)

**Definition:** Task management system integrated with notes, designed around daily work planning and completion tracking.

**Core entities:**

| Field | Type | Description |
|-------|------|-------------|
| **Title** | String | Task name |
| **Description** | String (optional) | Additional context |
| **Status** | Enum | PLANNED, IN_PROGRESS, COMPLETED, PENDING, CANCELLED |
| **Planned Date** | Date (optional) | When task was planned for |
| **Due Date** | Date (optional) | When task is due |
| **Started** | ISO timestamp (optional) | When task was started |
| **Completed** | ISO timestamp (optional) | When task was completed |
| **Priority** | Enum (optional) | LOW, MEDIUM, HIGH |
| **Project/Tag** | String (optional) | Associated project or category |
| **Work Updates** | List of strings | Historical notes on task progress |
| **Associated Note** | Reference (optional) | Link to related note |

**Task capabilities:**
- Create task with title and optional description
- Set planned date and due date independently
- Transition between states: PLANNED → IN_PROGRESS → COMPLETED
- Reopen completed tasks
- Defer tasks (move planned date forward)
- Cancel tasks without deletion
- Add work updates (progress notes)
- View completion history (what was done, when)
- Link tasks to notes
- Filter tasks by status, date, priority, project
- See pending tasks (not yet started, not completed)
- Fast task lookup by date

**Task states and transitions:**

```
PLANNED
  ├─ In Progress (user starts work)
  ├─ Deferred (user postpones)
  └─ Cancelled (user decides not to do)

IN_PROGRESS
  ├─ Completed (user finishes)
  ├─ PENDING (user pauses, expects to resume)
  └─ Cancelled (user abandons)

COMPLETED
  └─ Reopened (user undoes completion)

PENDING
  ├─ In Progress (user resumes)
  └─ Cancelled

CANCELLED
  └─ Reopened (user changes mind)
```

**Constraints:**
- Tasks are stored locally
- No recurring tasks in v1
- No subtasks in v1
- No time estimates in v1

---

### 4.3 Daily Work Log (Priority P0 · Phase 1)

**Definition:** Automatic daily summary that aggregates planned, in-progress, completed, and pending tasks for a given day.

**Structure:**

| Section | Content |
|---------|---------|
| **Date** | ISO date (e.g., 2026-09-30) |
| **Planned** | All tasks with `Planned Date` = today, sorted by priority |
| **In Progress** | All tasks with `Status` = IN_PROGRESS as of 23:59 today |
| **Completed** | All tasks with `Completed` timestamp on this date |
| **Pending** | All tasks with `Status` = PENDING as of 23:59 today |
| **Work Sessions** | Aggregate activity (Coding: 2h 14m, Documentation: 48m, etc.) |
| **Summary Stats** | Tasks completed / planned, app usage, browser time |

**Capabilities:**
- System automatically creates a daily log entry at midnight (or on first access of a new day)
- View today's log
- View previous days' logs
- Compare today vs. yesterday
- Export daily log
- Logs are immutable once created (no retroactive editing)
- Logs persist indefinitely

**Constraints:**
- Daily logs are generated from task state at end of day
- No manual log editing
- No log deletion

---

### 4.4 Meetings System (Priority P0 · Phase 1)

**Definition:** Structured note type for capturing meeting context, decisions, and action items.

**Core entities:**

| Field | Type | Description |
|-------|------|-------------|
| **Title** | String | Meeting name |
| **Date/Time** | ISO timestamp | When meeting occurred |
| **Participants** | List of strings | Names/emails of attendees |
| **Notes** | String | Free-form meeting discussion notes |
| **Transcript** | String (optional) | Full meeting transcript (filled by voice later) |
| **Decisions** | List of strings | Key decisions made |
| **Action Items** | List with assignee | Tasks arising from meeting |
| **Follow-up** | Date (optional) | When follow-up is needed |

**Meeting capabilities:**
- Create meeting note
- Record participants
- Add discussion notes
- Capture decisions
- Capture action items with assignees
- Link action items to tasks
- Later: auto-populate from voice/transcription
- Filter meetings by date and participant
- Generate meeting summary

**Meeting to Task conversion:**
- Each action item can be converted to a task
- Action item becomes task title
- Assignee becomes task metadata
- Due date is inferred from meeting follow-up date

**Constraints:**
- No automatic recording in v1
- No transcription in v1
- Meeting transcription arrives with Voice, in Phase 6

---

### 4.5 Search System — ❌ REMOVED (D0-A4)

Global search was withdrawn by the product owner on 2026-10-03 (ADR-017). The workspace is navigated through sidebar views, label filters, and per-view filters and sorts: notes by label, tasks by status/priority/project/date, meetings by date and participant. No full-text index exists. Section number 4.5 is kept so §4.6 onward do not renumber.

---

### 4.6 Pet System (Priority P0 · Phase 1 minimal · Phase 3 reactive)

**Definition:** A persistent, always-present animated desktop companion that reacts to system events.

**Core attributes:**
- Lightweight sprite-based animation (WebP or PNG)
- Transparent window (no background, no border)
- Always-on-top option (toggleable)
- Draggable (user can reposition)
- Resizable (small to large)
- Hide/show button (tray or keyboard)
- Sleep mode (pet enters inactive state)
- Idle animations (subtle movement when no events)
- Hover reactions (pet responds to mouse proximity)
- Event-reactive behavior (described in Section 4.6.1)

**Pet behaviors:**

#### 4.6.1 Event Reactions

| Event | Pet Behavior | Timing |
|-------|--------------|--------|
| **Task Created** | Brief acknowledgment animation | Immediate |
| **Task Completed** | Celebration animation | Immediate |
| **Task Pending** | Awaiting animation (patient pose) | When status changes |
| **Meeting Started** | Focused pose | When meeting note created |
| **Meeting Ended** | Relief animation | When meeting note closed |
| **App Focused (VS Code)** | Developer animation (glasses, coding pose) | On app focus |
| **App Focused (Figma)** | Design pose | On app focus |
| **Browser Tab Opened** | Alert animation | On tab open |
| **Long Coding Session** | Encouragement animation | After 2h continuous |
| **Idle (no events)** | Idle animation (breathing, subtle movement) | Continuous, low energy |
| **Sleep Mode Activated** | Curl up, move to corner | When user toggles sleep |
| **Sleep Mode Active** | Minimal animation, no notifications | While enabled |
| **System Startup** | Wake-up animation + greeting | On app launch |
| **Milestone Reached** | Special celebration | On configured milestones |

**Constraints:**
- Pet animations are state-driven, not time-driven
- Pet does not generate sound in v1 (sound comes in later phases)
- Pet does not occupy screen real estate (transparent, draggable, hideable)
- Pet animations are short (1–3 seconds max)
- Pet is never intrusive or blocking
- No character customization in v1 (single pet asset at launch)

**Pet independence:**
- Pet behavior engine is decoupled from pet asset
- Behavior is defined as event → state → animation
- Swapping pet asset does not require changing behavior logic

---

### 4.7 Browser Tracking System (Priority P1 · Phase 2)

**Definition:** Multi-browser activity tracking system that records which websites and apps consume user time.

**Architecture:**
```
Chrome Extension ──┐
Edge Extension ────┤
Firefox Extension──┤  → Browser Bridge → Rust Core → SQLite → Dashboard
Safari Extension ──┘
```

**Data collected:**
- Browser name (Chrome, Edge, Firefox, Safari)
- Window ID
- Tab ID
- Tab title
- Domain (derived from URL)
- URL (stored, optional encryption)
- Time opened
- Time closed
- Time focused
- Session duration

**Browser capabilities:**
- Detect tab open
- Detect tab close
- Detect tab activation/focus
- Detect window focus
- Record domain and time spent
- Close tab from dashboard
- View open tabs across all browsers
- Filter tabs by browser, domain, recency
- Search tabs by title

**Domain categorization:**
- User-defined categories (Work, Entertainment, Research, Social, Shopping, Banking, Health)
- System-default categories (GitHub → Work, YouTube → Entertainment)
- User can override category per domain
- Categories used in daily insights and filtering

**Privacy controls:**
- User can mark domains as "Do Not Track"
- User can exclude entire browsers from tracking
- Tracked vs. untracked domains are visually distinguished
- User can delete tracking data by domain, date range, or all
- No data sent externally (all local)

**Constraints:**
- Browser extensions are required (no global browser API exists)
- Tab title may not be available for all browsers (Safari restrictions)
- Cross-browser tracking is aggregated, not per-browser
- No fingerprinting or identification of user activity beyond domain-level

---

### 4.8 Time & Activity Tracking System (Priority P1 · Phase 2)

**Definition:** Automatic tracking of app usage, browser usage, and time allocation across the workday.

**Data model:**

| Entity | Description |
|--------|-------------|
| **App Session** | Application in foreground, start time, end time, duration |
| **Browser Session** | Browser window in foreground, start time, end time, duration |
| **Domain Session** | Individual domain activity within browser, start time, end time, duration |
| **Tab Session** | Individual tab activity, start time, end time, duration |
| **Activity Category** | Aggregated activity type (Coding, Documentation, Research, Entertainment, Meetings, etc.) |

**Tracking mechanism:**
- OS event: app comes to foreground → `AppFocused` event
- Record: app name, timestamp, previous app
- When app loses focus: close session, record duration
- For browser: also track active tab, domain
- Batch writes (don't write every focus change immediately)

**Constraints:**
- Tracking only records app/domain, not keystroke-level detail
- No screenshot or screen recording
- No audio/microphone recording
- No location tracking
- Activity categorization is user-configurable

---

### 4.9 Dashboard & Insights System (Priority P1 · Phase 2)

**Definition:** Visual summary of daily, weekly, and historical activity patterns.

**Dashboard views:**

#### Today Dashboard
- Total computer time (hours + minutes)
- Time by category (Coding, Documentation, Research, Entertainment, Other)
- Top 5 apps by time
- Top 5 domains by time
- Hourly activity chart (08:00 → 09:00 → 10:00, etc.)
- Comparison: today vs. yesterday (delta in each category)

#### Apps View
- All apps tracked today, sorted by time
- Time spent per app
- Number of sessions per app
- Average session duration
- Trend (more or less than yesterday)

#### Domains View
- All domains visited today, sorted by time
- Time spent per domain
- Number of sessions per domain
- Categorization (Work, Entertainment, etc.)
- Ability to toggle domain tracking on/off

#### Browser Tabs View
- All open tabs across all browsers
- Time spent per tab
- Close tab action
- Search and filter

#### Insights Dashboard
- Daily summary (time, apps, domains, focus level)
- Weekly summary (average daily time, top apps, trends)
- Activity patterns (peak hours, most productive time, most distracting apps)
- Week-over-week comparison
- Month-over-month summary

**Constraints:**
- Insights use only local data (no external benchmarks initially)
- No ML-driven predictions in v1
- Insights are descriptive, not prescriptive
- No notifications based on usage patterns in v1

---

### 4.10 Settings & Configuration (Priority P0 · Phase 1)

**Definition:** User-accessible controls for behavior, tracking, privacy, and UI preferences.

**Settings categories:**

| Category | Options |
|----------|---------|
| **Startup** | Auto-start Loaf on system boot (yes/no) |
| **Pet** | Always on top (yes/no), Pet size (small/medium/large), Pet opacity (0–100%) |
| **Tracking** | Track apps (yes/no), Track browser (yes/no), Do not track list (domains) |
| **Privacy** | Data export (all data as JSON), Data delete (confirm & wipe all), Encryption at rest (yes/no) |
| **Notifications** | Pet reactions (yes/no), Task notifications (yes/no), Browser notifications (yes/no) |
| **Appearance** | Light/dark theme, Font size, Language (English, others later) |
| **Keyboard** | Shortcuts for new note, new task, show/hide pet |
| **Advanced** | SQLite path (for backup), Log level (debug/info/warn), Clear cache, Reset to defaults |

**Constraints:**
- Settings are stored locally
- No cloud sync of settings
- Export/delete operate on all user data
- No per-project or per-workspace settings in v1

---

### 4.11 Voice System (Priority P3 · Phase 6)

**Definition:** Voice interface for creating notes, tasks, and querying workspace (uses JEV model through provider layer).

**Architecture:**
```
Microphone → Audio Buffer → Wake Detection → JEV → Intent → Action
```

**Voice capabilities:**
- Create task: "Add finish report to today's tasks"
- Create note: "Note: remember to follow up on GCP setup"
- Query: "What did I do today?"
- Query: "How much time did I spend on Chrome?"
- Action: "Open today's notes"
- Action: "Mark deployment as completed"
- Action: "Show me pending tasks"

**Voice constraints:**
- No always-on listening (battery/privacy)
- Activation phrase or button required (not passive)
- JEV invoked only on user request, not continuous
- Transcription stored locally (optional, user-controlled)
- No training on user voice data

---

### 4.12 MCP Integration Layer (Priority P2 · Phase 5, including the MCP client scaffold and OAuth)

**Definition:** Optional integration with external services through Model Context Protocol (MCP).

**Supported integrations (planned):**
- Gmail (read emails, send reminders)
- Google Calendar (read events, check availability)
- GitHub (read PRs, issues, activity)
- Slack (read messages, post notifications)
- Notion (read pages, sync notes)
- Linear (read issues, sync with tasks)
- Other MCP servers (pluggable)

**MCP capabilities:**
- Discover available services
- Authenticate via OAuth
- Read external information
- React to external events
- Push notifications
- Create tasks from external data (GitHub PR → task)
- Sync metadata (calendar events → daily log)

**MCP constraints:**
- No data stored externally (only metadata cached locally)
- User controls which integrations are enabled
- Authentication is OAuth2, not API keys/passwords
- MCP is optional (core product works without it)
- No automatic data sync (event-driven only)

---

### 4.13 Developer Companion Features (Priority P2 · Phase 4 local git/build · Phase 5.1 CI)

**Definition:** System reactions to development-specific events.

**Tracked events:**
- Git push (commit made, branch pushed)
- Build started (compilation begins)
- Build completed (success or failure)
- CI passed (automated tests pass)
- CI failed (automated tests fail)
- Deployment started
- Deployment completed

**Phase split (D0-A3):** git, local build and their reactions ship in Phase 4. CI passed/failed, deployment events and CI-failure task suggestion ship in Phase 5.1, after MCP.

**Pet reactions to developer events:**
- `git push` → Celebration animation
- `build running` → Working/focused animation
- `build successful` → Success animation
- `build failed` → Worried/concerned animation
- `CI passed` → Celebration
- `CI failed` → Alert animation
- `deployment running` → Careful/attentive animation

**Developer companion capabilities:**
- Watch local git repository for activity
- Poll or hook into build system
- Read CI output (GitHub Actions, Jenkins, etc.) — *Phase 5.1*
- Show build status in dashboard
- Notify on build failure
- Suggest task creation on CI failure

**Constraints:**
- No automatic task creation (user confirms)
- No automatic repo scanning (only watched repos)
- Configuration per repository (not global)

---

### 4.14 Character Ecosystem (Priority P3 · Phase 7)

**Definition:** Extensible pet character system with multiple characters and customization options.

**Character system components:**
- **Base character library** (18 base characters, each with unique visual style)
- **Character closet** (per-character outfit storage)
- **Outfits** (visual variants: casual, formal, seasonal, themed)
- **Animations** (per-character animation set, event-specific)
- **Seasonal packs** (holiday-themed outfits and animations)
- **App-specific reactions** (character-specific behavior per app context)

**Character capabilities:**
- Switch between characters (persistent choice)
- Equip outfits per character
- Unlock outfits via gameplay or progression
- Create custom outfit combinations
- Download community-created character packs
- Export/share character preferences

**Constraints:**
- Character selection is user-persistent (choice survives restarts)
- Outfits are cosmetic only (don't affect behavior)
- No character personality differences in v1 (same behavior system)
- Community character packs come after launch

---

## 5. Data Model & Storage

### 5.1 Core Entities

```sql
notes
├── id (PK)
├── title
├── body
├── created (timestamp)
├── last_edited (timestamp)
├── color
├── pinned (boolean)
├── archived (boolean)
└── labels (many-to-many)

tasks
├── id (PK)
├── title
├── description
├── status (PLANNED, IN_PROGRESS, COMPLETED, PENDING, CANCELLED)
├── planned_date
├── due_date
├── started (timestamp)
├── completed (timestamp)
├── priority
├── project_tag
├── associated_note_id (FK)
└── work_updates (text array)

meetings
├── id (PK)
├── title
├── date_time (timestamp)
├── participants (text array)
├── notes (text)
├── transcript (text, optional)
├── decisions (text array)
└── action_items (FK to tasks)

daily_logs
├── id (PK)
├── date (ISO date)
├── planned_tasks (FK array to tasks)
├── completed_tasks (FK array to tasks)
├── pending_tasks (FK array to tasks)
├── work_sessions (aggregated)
└── summary_stats (JSON)

app_sessions
├── id (PK)
├── app_name
├── started (timestamp)
├── ended (timestamp)
├── duration (seconds)
└── category (inferred from app)

browser_sessions
├── id (PK)
├── browser_name
├── window_id
├── started (timestamp)
├── ended (timestamp)
└── duration (seconds)

browser_tabs
├── id (PK)
├── browser_session_id (FK)
├── tab_id
├── title
├── domain
├── url (optional)
├── opened (timestamp)
├── closed (timestamp)
├── focused (timestamp)
└── duration (seconds)

domains
├── id (PK)
├── domain (unique)
├── category (Work, Entertainment, Research, etc.)
├── tracked (boolean)
├── first_seen (timestamp)
└── last_seen (timestamp)

settings
├── key (PK)
└── value (JSON)

user_preferences
├── key (PK)
└── value (JSON)
```

### 5.2 Storage Constraints

- **Database:** SQLite (local, single-file)
- **File location:** OS-standard app data directory
  - Windows: `%APPDATA%\Loaf\loaf.db`
  - macOS: `~/Library/Application Support/Loaf/loaf.db`
- **Backup:** User can export all data as JSON
- **Deletion:** User can permanently delete all data
- **Encryption:** Optional (planned for later phase)
- **Database size target:** <100 MB for typical 1-year usage

---

## 6. Integration Points

### 6.1 OS Integration

| Platform | Integration | Purpose |
|----------|-----------|---------|
| **Windows** | Window Focus API | Detect foreground app |
| **Windows** | Native Notifications | System notifications |
| **Windows** | Tray Icon | Quick access |
| **macOS** | Accessibility API | Detect foreground app |
| **macOS** | UserNotification | System notifications |
| **macOS** | Menu Bar | Quick access |
| **Both** | Registry/Plist | Settings storage |
| **Both** | File System | Database location |
| **Both** | Startup folder | Auto-start |

### 6.2 Browser Integration

| Browser | Integration Type | Method |
|---------|-----------------|--------|
| **Chrome** | Extension | Manifest V3 |
| **Edge** | Extension | Manifest V3 |
| **Firefox** | Extension | WebExtensions API |
| **Safari** | Extension | Safari App Extensions |

Each extension communicates with Rust core via local bridge (IPC or HTTP).

### 6.3 Voice Integration

- **JEV Provider:** Through API or local model
- **Audio Input:** OS-level microphone access
- **Audio Processing:** Buffering and silence detection

### 6.4 MCP Integration

- **MCP Clients:** Pluggable MCP server support
- **Authentication:** OAuth2 for external services
- **Event Processing:** MCP events → internal event system

---

## 7. User Workflows

### 7.1 Daily Startup Workflow

```
User starts computer
   ↓
Loaf auto-starts (if enabled)
   ↓
Pet appears with greeting animation
   ↓
Dashboard shows:
   - What was planned yesterday
   - What was completed yesterday
   - What remains pending
   - Today's first planned task
   ↓
User reviews daily work context
   ↓
User opens workspace (notes, tasks)
   ↓
User begins work
```

### 7.2 Task Lifecycle Workflow

```
User creates task: "Finish project report"
   ↓
Task status = PLANNED
Planned date = Today
   ↓
User starts work
   ↓
User marks task: IN_PROGRESS
   ↓
(Pet may show encouragement after 2h)
   ↓
User completes task
   ↓
Task status = COMPLETED
Completed timestamp = now
   ↓
Pet celebrates
   ↓
Daily log updated (task now in "Completed" section)
```

### 7.3 Meeting to Task Workflow

```
User creates meeting note
   ↓
User records:
   - Title
   - Participants
   - Discussion notes
   - Decisions
   - Action items with assignees
   ↓
User converts action item to task
   ↓
Task is created with:
   - Title = action item text
   - Assignee metadata = extracted
   - Due date = meeting follow-up date
   ↓
Meeting note links to task
```

### 7.4 Browser Activity to Insight Workflow

```
User opens multiple browser tabs
   ↓
Extensions track tab open, title, domain
   ↓
User switches between tabs throughout day
   ↓
Extensions record focus time per tab
   ↓
At end of day, dashboard shows:
   - Time per domain
   - Time per app
   - Top distracting sites
   - Hourly activity breakdown
   ↓
User reviews insights
   ↓
(Optional) User adjusts tracking for sensitive domains
```

### 7.5 Pet Reaction Workflow

```
User completes task
   ↓
TaskCompleted event fires
   ↓
Event routed to Pet Behavior Engine
   ↓
Pet behavior = celebration animation
   ↓
Animation renders for 2–3 seconds
   ↓
Pet returns to idle state
```

---

## 8. Product Assumptions

1. **Single-machine use:** User works on one primary computer (desktop or laptop), not multiple machines simultaneously
2. **Local storage is acceptable:** User accepts that data is not synced to cloud
3. **Browser extensions are available:** All major browsers support extensions (Safari may have limitations)
4. **User will interact with notes daily:** Core value requires regular engagement
5. **Event-driven tracking is sufficient:** Foreground app tracking is adequate for activity awareness
6. **Pet presence adds value:** User finds companion reactions useful, not annoying
7. **Privacy is important:** User prefers local storage over cloud convenience
8. **Task structure matches user workflow:** Task states (Planned, In Progress, Completed) align with how user works
9. **Daily context is useful:** User benefits from seeing "where they left off"
10. **Integration with external services is optional:** Core product works standalone

---

## 9. Constraints & Non-Functional Requirements

### 9.1 Performance

| Metric | Target |
|--------|--------|
| **App startup time** | <2 seconds |
| **Note creation** | <100ms |
| **Task creation** | <100ms |
| **Daily log generation** | <500ms |
| **Dashboard render** | <300ms |
| **Pet animation framerate** | 30 FPS (not 60) |

### 9.2 Resource Usage

| Metric | Target | Constraint |
|--------|--------|-----------|
| **Idle CPU** | <1% | No continuous polling |
| **RAM footprint** | <100 MB | Lightweight |
| **Disk writes** | Batched, <1/minute | Event-driven, not per-keystroke |
| **Battery drain** | Minimal | Local processing, no network |
| **GPU usage** | None (CPU rendering) | Sprite-based animation only |

### 9.3 Reliability

- **Data durability:** All changes persisted to SQLite immediately or within batch window
- **Crash recovery:** Application survives crash; no data loss on restart
- **Backup:** User can export all data as JSON
- **Rollback:** User can restore from export

### 9.4 Security & Privacy

- **Local storage:** All user data stored locally, never sent externally unless explicitly enabled (MCP)
- **Encryption:** Optional at-rest encryption (planned, not v1)
- **Authentication:** No user account required; no login
- **Permissions:** Only requests OS permissions absolutely necessary
- **Third-party data:** No analytics, no telemetry, no tracking
- **GDPR-ready:** User can export and delete all data

### 9.5 Cross-Platform

- **Windows:** Windows 10 or later, x86-64 and ARM64
- **macOS:** macOS 10.13 or later, Intel and Apple Silicon
- **Feature parity:** All features available on both platforms
- **Platform-specific UI:** Respect native OS conventions (menu bar, tray, notifications)

---

## 10. Success Metrics (to be defined separately)

**Note:** Specific metrics and targets will be defined in a separate Product Success document. This Product Document focuses on *what the product is*, not *how to measure if it succeeds*.

---

## 11. Out of Scope (V1)

The following are explicitly **not** part of the initial release but may be added in later phases:

- Cloud syncing
- Collaborative notes/shared workspaces
- Recurring tasks
- Subtasks
- Time estimates
- Recurring meetings
- Meeting recording/transcription (added in Phase 6, with Voice)
- MCP integrations (added in Phase 5, including the client scaffold)
- Voice commands (added in Phase 6)
- Character customization/closet (added in Phase 7)
- Advanced AI/ML features
- Themes/dark mode customization (basic only)
- Mobile app
- Web interface
- Social features
- Gamification/streaks
- Advanced analytics
- Predictive suggestions
- Automatic time categorization (ML)
- Screen recording
- Always-on microphone
- Continuous background monitoring

---

## 12. Definitions & Terminology

| Term | Definition |
|------|-----------|
| **Event-driven** | State changes flow through discrete events, not polling or timers |
| **Session** | A continuous period where an app, browser, or domain is active |
| **Focus** | Application or window is in foreground and receiving input |
| **Batch write** | Multiple changes are accumulated and persisted in a single database write |
| **Daily log** | Automatic summary of planned, completed, and pending tasks for a calendar day |
| **Action item** | Task arising from a meeting, assigned to a person |
| **Domain** | Root website (github.com, stackoverflow.com) extracted from URL |
| **Work session** | Time spent in a coding/productive app (VS Code, Figma, etc.) |
| **Browser session** | Time spent in any browser window |
| **Pet behavior** | Visual/animation reaction tied to system event |
| **MCP integration** | Connection to external service via Model Context Protocol |
| **Voice intent** | Parsed meaning of voice command (Create task, Query, Action) |

---

## 13. Appendix: Architecture Diagram

```
                           LOAF ECOSYSTEM
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                 DESKTOP       WORKSPACE    BACKEND
                COMPANION     (CORE PRODUCT) SYSTEMS
                    │           │           │
        ┌─────────┬─┴─┬─────────┼───────┐   │
        │         │   │         │       │   │
      PET     TRAY  WINDOW   NOTES   TASKS MEETINGS
     STATE   ACCESS MGMT     SYSTEM  SYSTEM SYSTEM
        │         │   │         │       │   │
        └─────────┼───┴─────────┼───────┴───┤
                  │             │           │
            EVENT BUS (Rust Core)          │
                  │             │           │
        ┌─────────┼─────────────┼───────────┤
        │         │             │           │
       OS       DATA          VOICE        MCP
    INTEGRATION  LAYER        SYSTEM      CLIENTS
        │         │             │           │
    ┌─App    ┌─SQLite       ├─ JEV      ├─Gmail
    ├─Browser├─Backup      ├─Whisper   ├─GitHub
    ├─Focus  ├─Lists        ├─Intent    ├─Slack
    └─File   └─Export       └─Actions   ├─Calendar
                                        └─Custom

```

---

## 14. Document Governance

- **Owner:** [Product Manager]
- **Last Updated:** October 3, 2026
- **Version:** 1.4
- **Status:** 🔒 Locked · amended (see §15)

---

**This Product Document is the single source of truth for Loaf. All subsequent documents (PRD, TRD, Design Brief, Implementation Plan) derive from this definition.**

---

## 15. Amendments

### Amendment D0-A1 (2026-10-03) — phase/priority labels corrected *(phase numbers superseded by D0-A2 below)*

**Problem.** §4 headings used a single `P<n>` tag for two different things. In §4.1–§4.10 it meant **priority** (P0 = must-have for v1, P1 = next), but in §4.11–§4.14 it was read as **phase**, and those phase numbers contradicted every downstream document: D0 had Voice at P3, MCP at P3–P4, Developer at P4 and Characters at P5, while `02-build-order.md` (locked), the PRD §8 table and the Implementation Plan all use Voice 4, Developer 5, MCP 6, Characters 7.

**Resolution.** Priority and phase are now stated separately in every §4 heading, and the phase numbers follow `02-build-order.md`, which is authoritative for sequencing. Scope is unchanged — nothing moved into or out of v1.

| Component | Was | Now |
|-----------|-----|-----|
| §4.1–4.5, §4.10 Notes, Tasks, Daily Log, Meetings, Search, Settings | P0 | Priority P0 · Phase 1 |
| §4.6 Pet | P0 | Priority P0 · Phase 1 minimal (static sprite) · Phase 3 reactive |
| §4.7–4.9 Browser, Time & Activity, Dashboard | P1 | Priority P1 · Phase 2 |
| §4.11 Voice | P3 | Priority P2 · **Phase 4** |
| §4.12 MCP | P3–P4 | Priority P2 · client scaffold **Phase 4** · integrations **Phase 6** |
| §4.13 Developer Companion | P4 | Priority P2 · **Phase 5** |
| §4.14 Character Ecosystem | P5 | Priority P3 · **Phase 7** |

§11 "Out of Scope (V1)" was corrected to match (it had MCP and voice "added in Phase 3", characters "Phase 5"), and its misleading "(v1; added in …)" prefix — which read as though the item were both in and out of v1 — was dropped.

**Authority rule going forward:** phase numbering lives in `01-build-principles/02-build-order.md`. This document states priority; it defers to the build order for sequence.

### Amendment D0-A2 (2026-10-03) — phase order set by the product owner

**Supersedes the phase numbers in D0-A1.** D0-A1 explained D0's `P<n>` tags as priority/phase confusion and aligned phases 4–7 to the build order as it then stood. That explanation was an inference, and the owner has since decided the order directly:

**Notes (1) → Browser (2) → Pet (3) → Developer (4) → MCP (5) → Voice (6) → Characters (7).**

| Component | D0 original | D0-A1 | Now (D0-A2) |
|-----------|-------------|-------|-------------|
| §4.13 Developer Companion | P4 | Priority P2 · Phase 5 | Priority P2 · **Phase 4** |
| §4.12 MCP Integration Layer | P3–P4 | Priority P2 · scaffold Phase 4 · integrations Phase 6 | Priority P2 · **Phase 5**, scaffold and OAuth included |
| §4.11 Voice System | P3 | Priority P2 · Phase 4 | Priority **P3** · **Phase 6** |
| §4.14 Character Ecosystem | P5 | Priority P3 · Phase 7 | Unchanged · Phase 7 |

Scope is unchanged — nothing moved into or out of v1. Three knock-on effects, recorded in ADR-015 and `02-build-order.md` A-3: the MCP client scaffold and OAuth moved from the Voice phase to the MCP phase; Developer Companion now runs before OAuth exists, so its CI checks use a keychain-held access token; and meeting transcription follows Voice to Phase 6. §4.4 and §11 were updated to match.

**Authority rule unchanged:** phase numbering lives in `01-build-principles/02-build-order.md`.

### Amendment D0-A3 (2026-10-03) — CI moves after MCP

The product owner decided CI is built after MCP integration. §4.13 splits: git and local-build awareness stay in **Phase 4**; CI status, CI reactions, deployment events and CI-failure task suggestions move to **Phase 5.1**, after MCP and before Voice. No phase renumbering and no change to v1 scope. CI authenticates through the Phase 5 GitHub login, replacing the pasted-token assumption in D0-A2's knock-on notes. See ADR-016 and `02-build-order.md` A-4.

### Amendment D0-A4 (2026-10-03) — global search removed

The product owner will not use search, so it is out of v1. This withdraws **§4.5 in full**, and every search line item elsewhere in this document: "Search" in the Note entity table (§4.1) and capabilities, "Search tasks" (§4.2), "Search meetings" (§4.4 → replaced by a date/participant filter), "search" in the Keyboard settings row (§4.10), the "<500ms search across 5000 items" target (§9.1), and the Search node in the §13 diagram. Where any remaining text conflicts, this amendment governs.

Not affected: per-view filters and sorts, label and participant autocomplete, and the Phase 2 Browser Tabs "Search and filter"/"Search tabs by title" lines (§4.7, §4.9) — those are list filtering and will be specified in Phase 2's PRD addendum. Scope that remains in v1 is otherwise unchanged. See ADR-017.
