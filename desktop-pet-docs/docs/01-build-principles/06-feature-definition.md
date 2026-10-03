# Feature Definition — What a Feature Is Before Code Exists

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Changes require a written amendment at the bottom of this file.

A feature is not "notes." A feature is **one user-visible capability, small enough to design, test, build, and verify in 1–3 days**. This file is the checklist you keep open while working.

## What Counts as One Feature

| ✅ One feature | ❌ Not one feature |
|---------------|-------------------|
| Create a note with title + body | Notes system |
| Pin / unpin a note | Note management |
| Search notes by text | Search across everything with filters |
| Mark task complete | Task system |
| Convert meeting action item → task | Meetings |

**Sizing rule:** If it takes more than 3 days, split it. If you can't split it, the UI spec is too vague.

## Feature Spec Template

Every feature gets a file at `/docs/features/<phase>-<nn>-<slug>.md` using this template:

```markdown
# F1-03: Pin / Unpin Note

## Status
DRAFT | READY | IN PROGRESS | IN REVIEW | DONE

## User Story
As a user, I want to pin a note so that it stays at the top of my notes home.

## Phase & Priority
Phase 1 · P0

## Depends On
F1-01 (Create note), F1-02 (Notes home list)

## UI
- Wireframe: (link or ASCII)
- Interaction spec: (what happens on click / shortcut)
- Empty state / error state

## Acceptance Criteria
- [ ] Pin icon visible on note card hover
- [ ] Clicking pin moves note to Pinned section instantly (<100 ms)
- [ ] Pinned state survives restart
- [ ] Shortcut Ctrl/Cmd+Shift+P toggles pin on selected note

## Events
- Emits: NotePinned { id, pinned_at } / NoteUnpinned { id }
- Listens: none

## Data
- Table/columns touched: notes.pinned, notes.updated_at
- Migration needed: no

## Performance Budget
- Interaction latency: <100 ms
- Idle impact: none (no new listeners that run without user action)

## Tests
- Unit: toggle_pin flips state, updates timestamp
- Integration: pin → restart → still pinned
- UI: clicking pin icon moves card to Pinned section
- Manual: script steps 1–4

## Out of Scope
- Pin ordering (drag to reorder) → future
- Pinning tasks or meetings → future

## Open Questions
- (must be empty before status = READY)
```

## Definition of Ready (before code starts)

A feature moves from DRAFT → READY only when:

- [ ] User story written
- [ ] UI wireframe + interaction spec done (03-ui-first.md)
- [ ] Acceptance criteria are testable (each one can become a test)
- [ ] Events emitted/listened are named
- [ ] Data changes identified (and migration noted)
- [ ] Performance budget stated
- [ ] Out-of-scope list written
- [ ] Dependencies are DONE (not "almost done")
- [ ] Open questions = zero
- [ ] Estimated ≤3 days

## Definition of Done

A feature moves to DONE only when:

- [ ] All acceptance criteria pass
- [ ] Tests written first and passing (04-testing-strategy.md)
- [ ] Coverage target met for touched modules
- [ ] No idle CPU / RAM regression (09-performance-budgets.md)
- [ ] Works on Windows **and** macOS
- [ ] Manual E2E script passed
- [ ] Merged to main; main still builds
- [ ] Feature spec status updated; any tech debt logged with a payoff date

## Feature Numbering

`F<phase>-<nn>` — e.g. `F0-04`, `F1-12`, `F2-03`. Numbers are never reused. Cancelled features keep their number with status CANCELLED.

## Scope Change Rule

- New idea mid-feature → write it in **Out of Scope**, create a new DRAFT feature. Do not expand the current one.
- Acceptance criterion turns out wrong → stop, update the spec, re-review, then continue.
- A feature needs another feature that doesn't exist → current feature is blocked; build the dependency first as its own feature.

## Prioritization Within a Phase

1. **Foundation-of-phase first** — the feature everything else depends on (e.g., Create note before Pin note)
2. **Core loop next** — what makes the phase usable end-to-end
3. **Quality-of-life last** — shortcuts, colors, polish
4. **If the phase is late, cut from the bottom of this list, never the top**

## Example: Phase 1 Feature Breakdown (Starting List)

| ID | Feature | Depends on |
|----|---------|-----------|
| F1-01 | Create note (title + body) | Phase 0 |
| F1-02 | Notes home list | F1-01 |
| F1-03 | Edit note | F1-01 |
| F1-04 | Delete note | F1-01 |
| F1-05 | Pin / unpin | F1-02 |
| F1-06 | Archive / unarchive + archive view | F1-02 |
| F1-07 | Labels (add, remove, filter) | F1-02 |
| F1-08 | Note color | F1-03 |
| F1-09 | Markdown rendering | F1-03 |
| F1-10 | Create task | Phase 0 |
| F1-11 | Task status transitions | F1-10 |
| F1-12 | Task dates (planned, due) + priority | F1-10 |
| F1-13 | Task work updates | F1-11 |
| F1-14 | Daily Work Log generation | F1-11, F1-13 |
| F1-15 | Daily Log view + history | F1-14 |
| F1-16 | Create meeting note | Phase 0 |
| F1-17 | Meeting decisions + action items | F1-16 |
| F1-18 | Action item → task conversion | F1-17, F1-10 |
| F1-19 | FTS5 search across notes/tasks/meetings/logs | F1-01, F1-10, F1-16 |
| F1-20 | Search filters (type, date, label, status) | F1-19 |
| F1-21 | Minimal pet window (static sprite, drag, hide/show) | Phase 0 |
| F1-22 | Keyboard shortcuts | F1-01..F1-20 |
| F1-23 | Theme (light/dark) | Phase 0 |

This list was a starting point. **Superseded by the final numbering in `docs/06-plan/implementation-plan.md`.**

---

Next: Read **07-architecture-decisions.md** for the locked technical decisions.
