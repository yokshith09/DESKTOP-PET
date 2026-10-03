# Testing Strategy — Tests Before Code

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Changes require a written amendment at the bottom of this file.

Tests are written before or alongside code, never after. Target: >80% coverage before shipping each feature.

## Testing Pyramid

```
           Automated
            ↓
    ┌──────────────┐
    │ UI Tests     │  ← Component tests (React)
    │ (20%)        │
    ├──────────────┤
    │ Integration  │  ← Feature end-to-end
    │ Tests (30%)  │
    ├──────────────┤
    │ Unit Tests   │  ← Individual functions
    │ (40%)        │
    ├──────────────┤
    │ Manual Tests │  ← Human verification
    │ (10%)        │
    └──────────────┘
```

Target for shipping: 80% automated, 20% manual.

## Test Types & When to Write Them

### 1. Unit Tests (40% of coverage)

**What:** Test individual functions in isolation.

**When to write:** Before coding the function.

**Example:**
```rust
// Test: note validation
#[test]
fn test_note_title_required() {
    let note = Note::new(String::new(), "body".to_string(), vec![]);
    assert!(note.is_err());
}

#[test]
fn test_note_title_max_200_chars() {
    let title = "a".repeat(201);
    let note = Note::new(title, "body".to_string(), vec![]);
    assert!(note.is_err());
}

#[test]
fn test_note_created_timestamp() {
    let note = Note::new("Title".to_string(), "body".to_string(), vec![]).unwrap();
    assert!(note.created.is_some());
}
```

**Coverage:** Every function, every code path.

### 2. Integration Tests (30% of coverage)

**What:** Test multiple components working together.

**When to write:** Before wiring backend to UI.

**Example:**
```rust
// Test: create and search notes
#[test]
fn test_create_and_search_notes() {
    let mut db = Database::new_in_memory();
    
    // Create note
    let note1 = Note::new("Hackathon".to_string(), "GCP setup".to_string(), vec!["work".to_string()]).unwrap();
    db.insert_note(&note1).unwrap();
    
    // Search for it
    let results = db.search_notes("hackathon").unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].title, "Hackathon");
}

#[test]
fn test_archive_note_not_in_active_list() {
    let mut db = Database::new_in_memory();
    
    let mut note = Note::new("Title".to_string(), "body".to_string(), vec![]).unwrap();
    db.insert_note(&note).unwrap();
    
    // Archive it
    note.archived = true;
    db.update_note(&note).unwrap();
    
    // Not in active list
    let active = db.get_active_notes().unwrap();
    assert!(!active.iter().any(|n| n.id == note.id));
}
```

**Coverage:** Feature workflows, edge cases.

### 3. UI Tests (20% of coverage)

**What:** Test React components render correctly and respond to user input.

**When to write:** Before building components.

**Example:**
```typescript
// Test: NotesHome renders and allows creating notes
describe("NotesHome", () => {
  it("renders search input and create button", () => {
    const { getByPlaceholderText, getByText } = render(<NotesHome />);
    
    expect(getByPlaceholderText("Search notes...")).toBeInTheDocument();
    expect(getByText("+")).toBeInTheDocument();
  });

  it("opens create dialog when + button clicked", () => {
    const { getByText, getByDisplayValue } = render(<NotesHome />);
    
    fireEvent.click(getByText("+"));
    
    expect(getByPlaceholderText("Note title...")).toBeInTheDocument();
  });

  it("searches notes on input", () => {
    const { getByPlaceholderText, getByText } = render(
      <NotesHome notes={[
        { id: "1", title: "Hackathon", body: "GCP setup", labels: ["work"], pinned: false, archived: false },
        { id: "2", title: "Shopping", body: "Milk, bread", labels: ["personal"], pinned: false, archived: false }
      ]} />
    );
    
    fireEvent.change(getByPlaceholderText("Search notes..."), { target: { value: "hackathon" } });
    
    expect(getByText("Hackathon")).toBeInTheDocument();
    expect(queryByText("Shopping")).not.toBeInTheDocument();
  });
});
```

**Coverage:** Component rendering, user interactions, edge cases.

### 4. End-to-End (Manual) Tests (10% of coverage)

**What:** A human sits down and uses the feature exactly as a real user would.

**When to write:** After code is done; before shipping.

**Example:**
```
Manual E2E Test: Create Note

Setup:
- Launch Loaf
- Notes home is visible

Steps:
1. Click + button
   → Create dialog opens
   → Title input is focused
   → No validation errors

2. Type "Project Ideas"
   → Character count shows "14 / 200"
   
3. Tab to body input
   → Type "GCP auth, database design"
   
4. Click labels input
   → Type "work"
   → Autocomplete shows existing labels
   → Press Enter to add
   → Label appears with × to remove
   
5. Select color
   → Click color picker
   → Select blue
   → Preview updates
   
6. Click save
   → Dialog closes
   → Note appears in notes home
   → Note has correct title, color, label
   
7. Click note to edit
   → Dialog opens with note data
   → Can edit and save changes
   → Note updates in home
   
8. Pin note
   → Note moves to pinned section
   → Refresh browser
   → Note still pinned
   
9. Archive note
   → Note disappears from active
   → Click archive link
   → Archived note visible
   → Note can be unarchived
   
10. Search for note
    → Type "project" in search
    → Even archived notes appear
    → Click result
    → Note loads
    
Expected: All steps pass without errors
```

## Test Coverage by Feature

### Phase 1: Notes System

Target: 80% coverage

```
Unit Tests (40%):
├─ Note model (validation, serialization)
├─ Task model (validation, state transitions)
├─ Meeting model (validation, action item extraction)
├─ Database operations (CRUD, search)
└─ Label management

Integration Tests (30%):
├─ Create note → appears in list → search finds it
├─ Edit note → updates correctly → survives restart
├─ Archive note → not in active list
├─ Label assignment → filter by label works
├─ Task status transitions → daily log correct
└─ Meeting to task conversion → task created with correct data

UI Tests (20%):
├─ NotesHome renders notes as cards
├─ Create button opens dialog
├─ Search filters notes
├─ Archive button removes from view
├─ Pin button moves to top
├─ Daily log shows correct summary
└─ Settings page allows export/delete

Manual Tests (10%):
├─ Full create note workflow
├─ Full edit note workflow
├─ Archive and restore
├─ Search across 100+ notes
└─ Create and complete task
```

### Phase 2: Browser Tracking

Target: 80% coverage

```
Unit Tests (40%):
├─ App session model (creation, duration calculation)
├─ Browser session model
├─ Domain categorization
├─ Time aggregation (by app, by domain, by hour)
├─ Privacy filtering (exclude domains)
└─ Activity categorization

Integration Tests (30%):
├─ Extension → bridge → core → database pipeline
├─ Domain tracking → aggregation → dashboard shows correct time
├─ Close tab from dashboard → tab closes in browser
├─ Privacy radar → toggling tracking affects data
└─ Privacy → deleting data removes all traces

UI Tests (20%):
├─ Dashboard renders time breakdown
├─ Tab list shows all open tabs
├─ Close button removes tab from list
├─ Privacy radar toggle works
├─ Time comparison (today vs yesterday)
└─ Search tabs by domain

Manual Tests (10%):
├─ Install extension, track browser use
├─ Visit 10+ domains
├─ Close tab from dashboard
├─ Toggle privacy on/off
├─ Export tracking data
└─ Delete all tracking data
```

## Writing Tests First (TDD)

### Workflow

```
1. Write acceptance criteria
   └─ What should the feature do? (from the UI spec, see 03-ui-first.md)

2. Write UI test (failing)
   └─ Tests what the component should render and how it responds

3. Write unit tests for the backend contract (failing)
   └─ Validation, state transitions, queries the UI needs

4. Write the minimum code to make unit tests pass
   └─ Red → Green. No extra features.

5. Write integration test (failing) for the full workflow
   └─ UI event → Tauri command → Rust core → SQLite → event back to UI

6. Wire backend to UI until integration + UI tests pass

7. Refactor with all tests green
   └─ Make it right. Tests protect you.

8. Run the manual E2E script
   └─ Human verification before the feature is marked done
```

### The Red–Green–Refactor Rule

- **Red:** The test must fail first. A test that never failed proves nothing.
- **Green:** Write the smallest code that passes. Resist building ahead.
- **Refactor:** Only with green tests. Never refactor and add behavior in the same commit.

## Tooling (Locked)

| Layer | Tool | Runs |
|-------|------|------|
| Rust unit + integration | `cargo test` | Every commit |
| Rust coverage | `cargo llvm-cov` | Every PR |
| SQLite tests | In-memory DB (`:memory:`) per test | Every commit |
| Frontend unit/UI | Vitest + React Testing Library | Every commit |
| Frontend coverage | Vitest `--coverage` (v8) | Every PR |
| E2E (automated, Phase 1+) | WebdriverIO + `tauri-driver` (Windows); manual script on macOS | Before release |
| Performance | Benchmarks + idle profiling (see 09-performance-budgets.md) | Before release |

[Likely] `tauri-driver` WebDriver support on macOS is limited; macOS E2E stays manual until verified otherwise.

## Rules for Good Tests

1. **One behavior per test.** Test names describe behavior: `archived_note_excluded_from_active_list`.
2. **No shared mutable state.** Every test gets a fresh in-memory database.
3. **No sleeps.** If you need to wait, you are testing timing, not behavior. Use events or fake clocks.
4. **Fake the clock.** Anything date-dependent (Daily Log, due dates, rollovers) takes an injected clock.
5. **Test the event, not the implementation.** Assert that `NoteCreated` was emitted with correct payload; don't assert internal function calls.
6. **Fast suite.** Full unit + integration suite must run in <60 seconds. Slow tests get fixed or moved.

## What Must Always Be Tested

- Every event type: emitted with the right payload, handled by every listener
- Every database migration: up from the previous schema with real-shaped data
- Every validation rule: valid, boundary, and invalid input
- Every state transition (Task: PLANNED → IN_PROGRESS → COMPLETED / PENDING / CANCELLED)
- Data export → delete → import round-trip produces identical data
- App restart: data written before restart is readable after

## What Not to Test

- Third-party library internals (Tauri, rusqlite, React)
- Pure styling (colors, spacing) — covered by design review
- Generated code

## Coverage Targets by Phase

| Phase | Rust core | Frontend | Notes |
|-------|-----------|----------|-------|
| 0 Foundation | >85% | n/a | Event bus and DB layer must be near-total |
| 1 Notes | >80% | >80% | First public release |
| 2 Browser | >80% | >80% | Extension JS tested separately, >70% |
| 3 Pet | >80% | >70% | Animation frames verified by state, not pixels |
| 4–7 | >80% | >80% | Integrations use recorded fixtures, never live APIs |

Coverage is a floor, not a goal. 80% of meaningless assertions is worse than 60% of real behavior.

## Bug Rule

Every bug fix starts with a failing test that reproduces the bug. No exceptions. The test stays in the suite forever.

---

Next: Read **05-learning-fundamentals.md** before making architectural choices.
