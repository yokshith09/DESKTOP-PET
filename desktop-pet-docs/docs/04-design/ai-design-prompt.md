# Prompt: Loaf productivity-tracker dashboard

Copy everything below the line into an AI design or coding tool (v0, Claude, Cursor, Lovable, Figma AI). It is self-contained.

---

You are a senior product designer and front-end engineer. Design and build the main window of **Loaf**, a local-first desktop productivity tracker (Windows and macOS, Tauri + React). Produce a polished, professional, information-dense dashboard in the style of Linear, Notion Calendar, Things and Raycast: restrained, sharp, structured. It must not look playful, childish or like a template.

## 1. Product in one paragraph
Loaf keeps a person's notes, tasks, reminders and daily logs on their own computer, with no account and no internet. The first thing they should see is **what they must do today**, then their notes. The whole app reads as a **productivity tracker**: how today is going, how the week went, and where their notes are.

## 2. Hard constraints
- Stack: React 18, TypeScript, Tailwind CSS v4, **shadcn/ui** (Radix) components, lucide-react icons. No other UI kit.
- Runs in a desktop webview and **opens maximized**. Design for 1280×800 up to 2560×1440. Minimum 900×600. Sidebar collapses below 1000 px.
- Performance budget: under 100 MB RAM, near-zero idle CPU. **No WebGL, no heavy blur or backdrop-filter, no continuous animations.** Transitions 100–150 ms; respect `prefers-reduced-motion`.
- System font stack only (no web fonts). Tabular numerals for all numbers.
- Light and dark themes, dark is the default. WCAG AA contrast. Full keyboard support and visible focus rings. Every icon-only button has an aria-label.
- Offline only. Never show spinners that imply the network.

## 3. Visual language
- Neutral graphite surfaces (dark) and clean paper (light). **One accent**: copper/amber, used only for the primary button, focus ring, active nav marker, pins and the "today" highlight in charts. Semantic colours only for status: green done, red overdue/missed, amber in progress.
- Radius 10–12 px for tiles, 6–8 px for controls. 1 px hairline borders, no drop shadows except popovers. Spacing scale 4/8/12/16/24.
- Type: 13–14 px body, 12 px meta, 11 px labels, 20–22 px page titles, 28 px for the big numbers in stat tiles. Sentence case, no all-caps headings, no gradient text, no emoji.
- Every dashboard block is a **tile** with one structure: 44 px header strip (title left, count badge, action right), scrollable body, optional footer with the composer or actions. Tiles sit on a strict 12-column grid with 16 px gaps and equal heights per row.
- Mascot: a small round bear ("Loaf") appears only in the sidebar logo, empty states and the Character page. Never as a hero.

## 4. Information architecture (sidebar, in order)
Overview · Today · Time · Notes · Character · MCP, then a Library group (Archive, Bin), then Labels, then Settings at the bottom. A top bar holds a global search field (`Ctrl/⌘ K`), a theme toggle and a primary **New note** button (`Ctrl/⌘ N`). Remember the last page.

## 5. Screens

### 5.1 Overview (home) — the productivity dashboard
Row 1, four stat tiles: **Notes** (count, pinned count) · **Open today** (tasks + reminders still open; overdue/missed in red) · **Next up** (time and title of the next reminder) · **Done this week** (completed tasks, change vs last week).
Row 2: **Today** tile (8 columns) and **Activity** tile (4 columns).
Row 3: **Pinned notes** strip, then **Recent notes**.
The Today tile is the star: it is a single agenda with a *Reminders* section (due by tonight, missed ones in red with the time) and a *Tasks* section (priority glyph ▲ ■ ▼, "In progress" and "Overdue" badges). Ticking completes with an Undo toast. Footer: type a task and press Enter; a bell button opens a popover to set a reminder (title, date-time, presets "In 1 hour", "This evening", "Tomorrow 9 AM").
The Activity tile shows notes and tasks touched per day for the last 7 days as bars, today highlighted in the accent.

### 5.2 Today (day detail)
Header with the full date and "N open · M overdue or missed". Three tiles:
1. **Today's time** — a ring showing completed ÷ planned, the big percentage, and under it "Planned / Done / Left".
2. **Agenda** — the same Reminders + Tasks agenda as Overview, plus an *Upcoming this week* section for later reminders, and the same composer.
3. **Activity** — a chronological feed of today: task completed, note created or edited, reminder fired, each with a time stamp and icon.

### 5.3 Time (daily logs, "digital wellbeing" style)
Think of the Digital Wellbeing screen on a phone, but for work done in Loaf.
- A **day picker**: a horizontal strip of the last 14 days with a mini bar under each day. Click a day to open it. Arrow keys move between days.
- A large **summary ring** for the selected day: tasks completed vs planned, with a text summary ("6 of 8 tasks, 75%").
- A **weekly bar chart** of tasks completed per day with a dashed line for the weekly average. Selected day highlighted.
- A **time-of-day strip**: 24 hourly cells showing when things were completed, so the person sees when they are productive. Darker = more.
- **Breakdown** list by status (Completed, In progress, Pending, Cancelled, Overdue) with counts and thin proportion bars, and by label/project when available.
- The day's **log entries** as a table: title, priority, final status, completed time.
- Footer note: "App and browser time will appear here in a later release." Do not fake app-usage data.
Frozen days are read-only; mark days that were reconstructed after the computer was off with a small badge.

### 5.4 Notes — "today first, then notes"
When the person opens Notes they must see, in this order:
1. A compact **Today strip** at the top: today's open tasks and due reminders as slim checkable rows (max 5, "View all" link). This is the first thing visible.
2. **Pinned** — visually distinct from everything else: a horizontal row of larger cards, each with an accent top edge and a pin icon, a bold title and 3 lines of text. Not the same card as normal notes.
3. **All notes** — a masonry grid of standard cards (title, 6-line excerpt, up to 3 label badges, relative time), grid/list toggle, sort menu (last edited, created, colour).
Card hover reveals pin, archive, delete. Click opens an editor dialog with autosave, colour picker (9 muted colours), label picker with create, pin, archive, delete, "Saved" indicator. Delete moves to the Bin with an Undo toast. Search results replace the layout with a flat result list.

### 5.5 Other pages
Character (preview, pose toggle, show/size/opacity/always-on-top controls), Settings (theme, text size, open at login), Bin (restore, delete forever, empty with confirmation, 30-day note), Archive, MCP (a "Planned" empty state).

## 6. Data the UI must be able to show
Task: title, status (PLANNED, IN_PROGRESS, PENDING, COMPLETED, CANCELLED), priority (LOW, MEDIUM, HIGH), planned date, due date, completed time. Reminder: title, remind time, done, missed. Note: title, body, colour, pinned, archived, labels, created/edited time. Daily log: date, planned/completed/pending/cancelled/overdue entries, stats (planned, completed, ratio, tasks created, notes created, notes edited), reconstructed flag.

## 7. States and polish
Provide empty, loading (skeleton, no spinner), error ("what happened, what is still safe") and long-text states for every tile. Use plain, calm copy: no exclamation marks, no emoji.

## 8. Deliverables
1. The component tree and a short design-token table (colour, radius, spacing, type).
2. Complete, runnable React + Tailwind code using shadcn/ui, one file per component, with realistic sample data.
3. Screenshots or a preview of Overview, Today, Time and Notes in dark and light at 1440×900.
4. A list of anything in this brief you could not honour and why.

Quality bar: if a screen could be mistaken for a generic admin template or a children's app, redo it.
