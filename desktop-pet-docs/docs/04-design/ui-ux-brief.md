# Loaf — UI/UX Design Brief

**Milestone:** D5 · **Version:** 1.1 · **Date:** 2026-10-03 · **Status:** 🔒 LOCKED (approved 2026-10-03)
**Derives from:** PRD (D2 v1.1), App Flow (D4 v1.1) · **Feeds:** feature specs (`06-feature-definition.md`), frontend implementation
**Changes in v1.1:** §10 pet table phase label aligned with D0 Amendment D0-A1 (characters = Phase 7); tokens, wireframes and keymap unchanged.

This brief gives enough direction to build Phase 1 UI without a separate Figma pass. Visual polish (illustration, final pet art) can be iterated without changing structure.

---

## 1. Design Principles

| # | Principle | In practice |
|---|-----------|-------------|
| 1 | **Calm, not busy** | Neutral surfaces, one accent color, color reserved for meaning (note colors, status, overdue) |
| 2 | **Keyboard first, mouse friendly** | Every action reachable by shortcut; every shortcut discoverable via tooltip |
| 3 | **Zero-save** | Autosave everywhere; no Save buttons in editors |
| 4 | **Native-feeling** | System fonts, OS shortcut conventions, respects OS theme and reduced motion |
| 5 | **Light on resources** | No blur/glass effects, no heavy shadows, no animated backgrounds; transitions ≤150 ms, CSS only |
| 6 | **Today-centric** | The app opens on what matters now, not on a database of everything |

## 2. Personality & Tone

Friendly and quiet — like a warm loaf of bread on the desk. Copy is short, plain, second person, never cute in error states.

| Context | ✅ Write | ❌ Avoid |
|---------|---------|---------|
| Empty Today | "Nothing planned yet. Add the first thing you want to finish today." | "Woohoo! A blank slate! 🎉" |
| Error | "Couldn't save the note. Your text is still here — try again." | "Oops! Something went wrong 😅" |
| Delete all | "This permanently deletes every note, task, meeting and log on this computer." | "Are you sure?" |

## 3. Layout

```
┌──────────────┬──────────────────────────────┬─────────────────────────────┐
│ SIDEBAR 232px│ LIST / VIEW (flex)           │ DETAIL PANEL 420–560px       │
│              │                              │ (opens on selection)         │
│ 🔍 Search ⌘K │ View title        [+ New]    │ Title                        │
│              │ Filters / tabs               │ Toolbar (pin label color …)  │
│ Today        │                              │ Body                         │
│ Tasks        │ Rows / cards                 │                              │
│ Notes        │                              │                              │
│ Meetings     │                              │                              │
│ Daily Logs   │                              │                              │
│ ───────      │                              │                              │
│ Labels ▸     │                              │                              │
│ Archive      │                              │                              │
│ Settings     │                              │                              │
└──────────────┴──────────────────────────────┴─────────────────────────────┘
Min window 800×600 · default 1200×800 · <1000px: detail panel goes full-width with Back
```

## 4. Design Tokens

All values are CSS custom properties on `:root[data-theme]`.

### 4.1 Color — UI

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` | `#FAF8F5` | `#1B1A18` | Window background (warm, bread-toned neutral) |
| `--surface` | `#FFFFFF` | `#242320` | Cards, panels |
| `--surface-2` | `#F2EFEA` | `#2D2B28` | Sidebar, hover |
| `--border` | `#E4DFD7` | `#3A3733` | Dividers |
| `--text` | `#1F1D1A` | `#EDEAE4` | Primary text |
| `--text-2` | `#6B655C` | `#A39D93` | Secondary text |
| `--accent` | `#C26A2B` | `#E08B4A` | Primary actions, focus ring, selection (crust orange) |
| `--accent-contrast` | `#FFFFFF` | `#1B1A18` | Text on accent |
| `--danger` | `#B3261E` | `#F2B8B5` | Delete, overdue |
| `--success` | `#2E7D32` | `#81C995` | Completed |
| `--warning` | `#9A6700` | `#F0C674` | Pending |

All text/background pairs must meet WCAG 2.1 AA (4.5:1 body, 3:1 large text/UI). [Guessing] The values above are a starting palette; contrast must be verified with a checker in F0-14 and adjusted, not assumed.

### 4.2 Color — Notes (8 + default)

| Name | Light tint | Dark tint |
|------|-----------|-----------|
| default | `--surface` | `--surface` |
| red | `#FBE4E2` | `#4A2523` |
| orange | `#FCE8D5` | `#4A3220` |
| yellow | `#FBF3C9` | `#46401F` |
| green | `#E1F2DE` | `#24391F` |
| teal | `#DCF1EE` | `#1F3A37` |
| blue | `#DDE8F8` | `#22304A` |
| purple | `#ECE2F7` | `#352848` |
| gray | `#ECEAE6` | `#353330` |

Color is never the only signal: the color picker shows names on hover, and filter-by-color lists names.

### 4.3 Status

| Status | Icon | Color token |
|--------|------|-------------|
| PLANNED | ○ hollow circle | `--text-2` |
| IN_PROGRESS | ◐ half circle | `--accent` |
| PENDING | ⏸ pause | `--warning` |
| COMPLETED | ● check | `--success` |
| CANCELLED | ⊘ | `--text-2` + strikethrough title |
| Overdue badge | ! | `--danger` |

Priority: High = `▲` accent, Medium = `■` text-2, Low = `▼` text-2 (none = no glyph).

### 4.4 Typography

System stack: `-apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Roboto, sans-serif`. Mono: `ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace`. No bundled web fonts (size + RAM).

| Token | Size / line height | Weight | Use |
|-------|-------------------|--------|-----|
| `--fs-xl` | 22 / 28 | 600 | View titles |
| `--fs-lg` | 17 / 24 | 600 | Panel titles, note title input |
| `--fs-md` | 14 / 20 | 400 | Body, rows |
| `--fs-sm` | 12 / 16 | 400 | Metadata, timestamps |

Font size setting S/M/L scales the root by 0.9 / 1.0 / 1.15.

### 4.5 Spacing, radius, elevation, motion

- Spacing scale (px): 2 · 4 · 8 · 12 · 16 · 24 · 32
- Radius: 6 (inputs, rows) · 10 (cards, panels) · 999 (chips)
- Elevation: one shadow only, for popovers/overlays: `0 8px 24px rgb(0 0 0 / .12)`
- Motion: 120 ms ease-out for panel open, 80 ms for hover; **0 ms when `prefers-reduced-motion`**
- Focus: 2 px `--accent` ring, offset 2 px, always visible on keyboard focus

## 5. Component Inventory (Phase 1)

| Component | Variants / states | Used in |
|-----------|------------------|---------|
| Sidebar item | default, hover, active, with count | All |
| Button | primary, secondary, ghost, danger; disabled; loading | All |
| Icon button | with tooltip incl. shortcut | Toolbars |
| Text input / textarea | default, focus, error, disabled | Editors, forms |
| Quick-add input | idle, typing, submitting | Today, Tasks, SF-4 |
| Note card | default, pinned, colored, archived, selected, hover (shows pin/archive) | Notes, Today |
| Task row | per status; overdue; selected; hover actions (Start/Complete/…) | Today, Tasks, Logs |
| Status control | segmented actions showing only valid transitions | Task detail |
| Date picker | quick options (Today, Tomorrow, Next Mon) + calendar | Tasks, Meetings |
| Chip | label, participant, removable | Notes, Meetings |
| Color picker | 9 swatches with names | Note editor |
| Tabs | Tasks views, Settings sections | Tasks, Settings |
| Detail panel | open, full-width (narrow), with Back | All details |
| Search overlay | empty, typing, results grouped, no results | S-50 |
| Toast | info, success, error, with Undo action | Global |
| Modal | confirm, destructive (type-to-confirm) | S-13, S-61, S-62 |
| Empty state | per view (§7) | All lists |
| Stat tile | value, label, delta ▲▼ | Today, Log detail |
| Markdown preview | rendered, toggle Edit/Preview | Note, Meeting notes |

## 6. Key Screen Wireframes

### S-01 Today
```
Good morning · Friday, 2 Oct                                [+ Task] [+ Note]
┌ Yesterday ───────────────────────────────────────────────────────────────┐
│ Completed 4 of 6 planned · 2 pending · 1 overdue          View log →    │
└──────────────────────────────────────────────────────────────────────────┘
[ + Add a task for today…                                              ↵ ]

IN PROGRESS (1)
 ◐ Write TRD                                  ▲ High   due Today   [Pause][✓]
OVERDUE (1)
 ○ Submit assignment report                     ! Overdue  due 30 Sep      [Start][✓]
PLANNED TODAY (3)
 ○ Review PRD decisions                                            [Start][✓]
 ○ Set up Tauri scaffold                                           [Start][✓]
 ○ Reply to team email                                                [Start][✓]

FOLLOW-UPS TODAY
 Standup — follow up on schema review                               Open →
PINNED NOTES
 [ Hackathon ideas ]  [ Loaf v1 scope ]  [ Shortcuts ]
```

### S-10 Notes + S-11 Note editor
```
Notes                          [Sort: Last edited ▾]  [+ New]   │ ◀  Loaf v1 scope            📌 🏷 🎨 🗄 🗑 │
Labels: All · work(12) · personal(4) · #hackathon(3)            │ ───────────────────────────────────────── │
PINNED                                                          │ Edit | Preview                            │
┌────────────┐ ┌────────────┐                                   │ ## Must ship                               │
│Loaf v1     │ │Shortcuts   │                                   │ - Notes, tasks, meetings                   │
│scope…      │ │Ctrl+K …    │                                   │ - Daily log                                │
└────────────┘ └────────────┘                                   │                                            │
OTHERS                                                          │ work  #loaf  +                             │
┌────────────┐ ┌────────────┐ ┌────────────┐                    │ Edited 2 min ago · Created 30 Sep          │
```

### S-21 Task detail
```
◀  Write TRD                                              ⋯ (Defer, Delete)
Status:  ◐ In progress     [Pause] [Complete] [Cancel]
Planned  Today ▾    Due  Fri 2 Oct ▾    Priority  High ▾    Project  Loaf ▾
Linked note  Loaf v1 scope →        From meeting  —
Description
 Cover event catalog and IPC.
Work updates                                         [+ Add update]
 10:42  Event catalog done
 09:15  Started outline
History ▸  (Created 30 Sep · Started 2 Oct 09:10)
```

### S-31 Meeting editor
```
◀  Weekly sync                                   Thu 1 Oct, 16:00 ▾   🗑
Participants  [Asha ×] [Ravi ×] [+ add]
Notes   Edit | Preview
 Discussed project split…
Decisions
 1. Ravi takes the API module            ⋮
 2. Report due Monday                  ⋮
 [+ Add decision]
Action items
 ☐ Draft report intro   @Me   [Convert to task]
 ☐ Write API tests   @Ravi    ✓ Task: Planned →
 [+ Add action item]
Follow-up  Mon 5 Oct ▾
```

### S-50 Search overlay
```
┌──────────────────────────────────────────────────────────────┐
│ 🔍 hackath|                                            Esc   │
│ Filters: [All ▾] [Any date ▾] [Include archived ☐]           │
├──────────────────────────────────────────────────────────────┤
│ NOTES (2)                                                    │
│ ▸ **Hackath**on ideas — GCP setup, MCP server…        30 Sep │
│   **Hackath**on retro — what went well…  (Archived)   12 Aug │
│ TASKS (1)                                                    │
│   ● Submit **hackath**on form                 Completed 29 Jul│
│ MEETINGS (1)                                                 │
│   Hackathon kickoff — @mentors…                     20 Jul │
└──────────────────────────────────────────────────────────────┘
```

### S-41 Daily Log detail
```
◀  Thursday, 1 Oct 2026                              [Export .md]
┌ Completed ┐ ┌ Planned ┐ ┌ Ratio ┐ ┌ Notes ┐ ┌ Meetings ┐
│  4  ▲1    │ │  6  ─   │ │ 67% ▲ │ │ 3  ▼2 │ │  1       │
└───────────┘ └─────────┘ └───────┘ └───────┘ └──────────┘
COMPLETED   ● Write PRD · ● Fix schema · …
PENDING     ⏸ Pet sprite brief
CANCELLED   ⊘ Try Svelte spike
OVERDUE     ! Submit assignment report
(Reconstructed — Loaf wasn't running this day)   ← only if reconstructed
```

## 7. Empty, Loading & Error States

| View | Empty state copy | Primary action |
|------|------------------|----------------|
| Today | "Nothing planned yet. Add the first thing you want to finish today." | Quick add focused |
| Notes | "Notes you write live here. Press Ctrl+N to start one." | New note |
| Archive | "Archived notes show up here. They stay searchable." | — |
| Tasks (any tab) | "No tasks here." + tab-specific hint | Quick add |
| Meetings | "Log a meeting to keep decisions and turn action items into tasks." | New meeting |
| Daily Logs | "Your first log appears tomorrow, after today ends." | — |
| Search, no results | "No matches for "x". Try fewer words or include archived." | Toggle archived |

Loading: skeleton rows only if a load exceeds 150 ms (most won't). Errors: inline under fields; operation failures as error toast with Retry.

## 8. Keyboard Map

`Mod` = Ctrl (Windows) / Cmd (macOS).

| Scope | Shortcut | Action |
|-------|----------|--------|
| Global (OS-wide, rebindable) | `Mod+Shift+N` | New note (opens main window) |
| | `Mod+Shift+T` | Quick-add task popup |
| | `Mod+Shift+K` | Open Loaf search |
| | `Mod+Shift+P` | Show/hide pet |
| App | `Mod+K` | Search overlay |
| | `Mod+N` | New note |
| | `Mod+T` | New task (focus quick add) |
| | `Mod+M` | New meeting |
| | `Mod+1…5` | Today · Tasks · Notes · Meetings · Daily Logs |
| | `Mod+,` | Settings |
| | `Esc` | Close panel / overlay |
| | `Mod+W` | Hide window |
| | `Mod+Q` | Quit |
| Note editor | `Mod+Shift+P` (in editor) → **conflicts with global pet toggle** → use `Mod+D` | Pin / unpin |
| | `Mod+E` | Toggle Edit / Preview |
| | `Mod+Shift+A` | Archive |
| | `Mod+L` | Add label |
| Lists | `↑ ↓` / `Enter` | Move / open |
| Task (selected) | `S` start · `P` pause · `C` complete · `D` defer · `X` cancel | Status actions (only valid ones fire) |

## 9. Accessibility

- Full keyboard path for every flow in App Flow §4 (tested in manual E2E)
- Roles/labels on all icon buttons; list rows are `listitem` with accessible names including status and due date
- Focus is trapped in modals and returned to the trigger on close
- Respect OS font scaling and `prefers-reduced-motion`, `prefers-color-scheme`
- Contrast AA verified per token pair (F0-14 acceptance criterion)

## 10. Pet Visual Brief (Phase 1 scope)

| Item | Phase 1 | Phase 3+ |
|------|---------|----------|
| Character | One original character. Working concept: **a small round loaf-shaped creature with a tiny face** — fits the name, readable at 48 px, ownable | Animations and reactions (Phase 3); 18 characters and outfits (Phase 7) |
| Asset | Single idle frame PNG/WebP with alpha; master at 512×512, exported at 64 / 96 / 128 px (S/M/L) @1x and @2x | Sprite sheets, ≤3 s per animation, 30 FPS cap |
| Style | Flat shapes, 2–3 tones, thin outline so it reads on light and dark desktops | Same style system |
| Behavior | Static. Hover shows a subtle 1 px lift via CSS transform (no loop). Click opens Today | State machine (TRD §5 `pet`) |
| Placement | Default bottom-right of primary display, 24 px from edges, above taskbar/dock | Sleep corner |

The pet art is the only asset requiring a designer or illustration tool; everything else is built from tokens. Commissioning or creating it is a CP4 dependency, not a CP1 blocker — a placeholder shape ships until then.

## 11. Platform Conventions

| Topic | Windows | macOS |
|-------|---------|-------|
| Window controls | Right, native | Left traffic lights, native |
| Tray | Notification area, left-click opens | Menu bar, click opens menu |
| Modifier | Ctrl | Cmd |
| Settings shortcut | Ctrl+, | Cmd+, |
| Title bar | Native (no custom chrome in v1) | Native |
