# UI First — Design Before Code

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Changes require a written amendment at the bottom of this file.

Every feature starts with a detailed UI design. Never write backend code before the UI is locked.

## Why UI First?

1. **UI is the contract** — Backend must satisfy what UI needs
2. **Design reveals requirements** — Problems surface during design, not mid-code
3. **Tests are easier** — UI tests drive what backend needs to do
4. **Team alignment** — Everyone sees what's being built before code starts
5. **Scope control** — Oversized features are obvious during design

## UI Design Process

### Step 1: Wireframe / Sketch

Create a simple wireframe or text description of the feature:

```
Notes Home

┌──────────────────────────┐
│ LOAF — Today             │
├──────────────────────────┤
│                          │
│ Search [___________]  +  │  ← Search input, create button
│                          │
│ PINNED                   │
│  [Card 1]  [Card 2]      │
│                          │
│ ALL NOTES                │
│  Note 1                  │
│  Note 2                  │
│  Note 3                  │
│                          │
│ [Archive] [Settings]     │
└──────────────────────────┘
```

### Step 2: Acceptance Criteria

Write what the UI should do:

```
Notes Home Should:
✓ Display all notes as cards (pinned first)
✓ Show search input at top
✓ Allow creating new note (+ button)
✓ Allow filtering by label
✓ Allow sorting by recent
✓ Show archive link
✓ Show settings link
✓ Fit on 1280x800 screen
✓ Support keyboard shortcuts (Ctrl+N for new)
```

### Step 3: Interaction Spec

Define what happens on user actions:

```
When user clicks "+ button":
→ Open Create dialog
→ Focus title input
→ Show body input
→ Show color picker, labels, archive toggle
→ Show save/cancel buttons

When user clicks note card:
→ Open Edit dialog
→ Load note data into form
→ Allow editing title, body, labels, color
→ Show delete button
→ Show save/cancel buttons

When user types in search:
→ Debounce 300ms
→ Search notes, tasks, meetings
→ Show results by type
→ Highlight matching text
```

### Step 4: Component Spec

Define each UI component:

```
NotesHome Component
├── SearchBar
│   ├── Input: text
│   ├── Output: search query (string)
│   └── Action: on input → debounce → search
├── CreateButton
│   ├── Label: "+"
│   └── Action: on click → open CreateDialog
├── PinnedNotes
│   ├── Input: notes (array, filtered pinned=true)
│   ├── Display: card grid
│   └── Action: on click → open EditDialog
├── AllNotes
│   ├── Input: notes (array)
│   ├── Display: list
│   └── Action: on click → open EditDialog
└── Footer
    ├── Archive link
    └── Settings link

CreateDialog Component
├── TitleInput
│   ├── Placeholder: "Note title..."
│   └── Max: 200 chars
├── BodyInput
│   ├── Placeholder: "Note body..."
│   ├── Type: textarea
│   └── Supports: Markdown
├── Labels
│   ├── Multi-select
│   ├── Autocomplete from existing labels
│   └── Create new label
├── ColorPicker
│   ├── 6–8 color options
│   └── Visual preview
├── PinToggle
│   └── Boolean (on/off)
├── SaveButton
│   └── Action: save note, close dialog
└── CancelButton
    └── Action: close dialog
```

### Step 5: Data Requirements

Define what data each component needs:

```
NotesHome requires:
├── notes: Array<Note>
├── searchQuery: string
├── selectedLabel: string (optional)
├── sortBy: "recent" | "created"
└── events:
    ├── onCreateNote()
    ├── onEditNote(id)
    └── onSearch(query)

Note type:
├── id: string (UUID)
├── title: string
├── body: string
├── labels: Array<string>
├── color: "red" | "yellow" | "blue" | ...
├── pinned: boolean
├── archived: boolean
├── created: ISO timestamp
├── lastEdited: ISO timestamp
└── events:
    ├── onEdit()
    ├── onDelete()
    ├── onPin()
    └── onArchive()
```

## UI-First Workflow

### For each feature:

```
1. Draw / wireframe the UI
   └─ (5 min per screen)

2. Write acceptance criteria
   └─ (10 min: what should it do?)

3. Write interaction spec
   └─ (15 min: what happens on click, type, submit?)

4. Write component spec
   └─ (20 min: what components, what inputs/outputs?)

5. Write data requirements
   └─ (10 min: what data does each component need?)

6. Get design reviewed
   └─ (30 min: team agrees on what's being built)

7. Write UI tests
   └─ (before coding: tests that check the UI matches spec)

8. Build backend (data model, API)
   └─ (tests verify it satisfies UI needs)

9. Wire backend to UI
   └─ (components call backend functions)

10. End-to-end test
    └─ (user can complete the full workflow)

Total: ~2–3 hours before code starts. This saves 4–6 hours in rework.
```

## Example: Create Note Feature

### Wireframe
```
┌─────────────────┐
│ Create Note     │
├─────────────────┤
│ Title:          │
│ [___________]   │
│                 │
│ Body:           │
│ [___________]   │
│ [___________]   │
│ [___________]   │
│                 │
│ Labels:         │
│ [work] [#idea]  │
│ +               │
│                 │
│ Color: [●●●●]   │
│                 │
│ [Save] [Cancel] │
└─────────────────┘
```

### Acceptance Criteria
```
✓ Title input required, max 200 chars
✓ Body input supports Markdown
✓ Can add multiple labels
✓ Can create new label
✓ 8 colors available
✓ Clicking save creates note + closes dialog
✓ Clicking cancel closes dialog without saving
✓ Keyboard shortcut: Ctrl+S to save
✓ Keyboard shortcut: Esc to cancel
```

### Interaction Spec
```
Focus title:
  on load → title input is focused

Type in title:
  show character count (e.g., "42 / 200")
  disable save if title is empty

Type in body:
  support Markdown syntax highlighting
  show live preview (optional, Phase 2)

Click on labels input:
  show dropdown of existing labels
  allow typing to filter
  allow pressing Enter to create new label

Click color picker:
  show 8 color swatches
  highlight selected color
  update note preview color

Click save:
  validate title is not empty
  validate body is not empty
  send CreateNote event with note data
  close dialog
  redirect to notes home

Click cancel:
  close dialog without saving
```

### Component Spec
```
CreateNote Component
├── TitleInput Component
│   ├── Input: value (string)
│   ├── Props: placeholder, maxLength
│   ├── Output: onChangeTitle (string)
│   └── Validation: required, max 200 chars
├── BodyInput Component
│   ├── Input: value (string)
│   ├── Props: placeholder
│   ├── Output: onChangeBody (string)
│   └── Validation: optional, Markdown preview
├── LabelsInput Component
│   ├── Input: labels (Array<string>), existingLabels (Array<string>)
│   ├── Output: onAddLabel (string), onRemoveLabel (string)
│   └── Features: autocomplete, new label creation
├── ColorPicker Component
│   ├── Input: selectedColor (string)
│   ├── Props: colors (Array<string>)
│   ├── Output: onSelectColor (string)
│   └── Visual: color swatches
├── SaveButton Component
│   ├── Input: disabled (boolean)
│   ├── Output: onSave ()
│   └── Label: "Save"
└── CancelButton Component
    ├── Output: onCancel ()
    └── Label: "Cancel"
```

### Data Requirements
```
CreateNote component needs:
├── title: string (initially "")
├── body: string (initially "")
├── labels: Array<string> (initially [])
├── selectedColor: string (initially "gray")
├── existingLabels: Array<string> (from database)
└── handlers:
    ├── onSave → emit CreateNote event with all data
    ├── onCancel → close dialog
    └── validation → title must not be empty

Backend must provide:
├── Database table: notes
├── Event: NoteCreated(title, body, labels, color)
├── Query: getExistingLabels() → Array<string>
└── Write: insertNote(title, body, labels, color) → Note
```

## Review Checklist for UI Design

Before starting code, answer these:

```
Design Review Checklist:

[ ] Can I draw every screen?
[ ] Do I know what happens on every click?
[ ] Do I know what data each component needs?
[ ] Do I know what the backend must provide?
[ ] Can I write tests for this UI without the backend?
[ ] Have I considered keyboard navigation?
[ ] Have I considered window resizing (min 800×600 → full screen)?
[ ] Have I considered empty states?
[ ] Have I considered error states?
[ ] Do all team members agree on this design?

If all boxes are checked → start coding.
If any box is unchecked → finish design first.
```

---

Next: Read **04-testing-strategy.md** for test-first methodology.
