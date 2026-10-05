# F0-11: Export, import (empty workspace), delete all

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As a user, I want to take all my data out, restore it into a fresh install, and wipe everything, so my data is never trapped and I can always start over (R0-07…R0-09, ADR-012).

## Phase & Priority
Phase 0 · P0 · 2.5 relative dev-days (plan D7)

## Depends On
F0-05, F0-10.

## UI
A minimal Settings › Data section (the rest of Settings is F1-25) with Export, Import and Delete all. S-61 modal: type `DELETE` to confirm, using the copy from UI brief §2. S-62 modal: confirm import into an empty workspace.

## Acceptance Criteria
- [ ] **Export** takes one read snapshot (single read transaction) and streams the JSON in Schema §7 format to a user-chosen path via the OS dialog (R0-07); format has no search section
- [ ] **Import** is allowed only into an empty workspace; it validates `format`, `format_version` and `schema_version ≤ current`, inserts everything in one transaction with foreign keys on, and is all-or-nothing (R0-08). `labels.name_folded` is recomputed from `name`, never trusted from the file
- [ ] **Delete all** requires the exact string `DELETE`; it stops the writer, closes connections, deletes `loaf.db*`, recreates an empty database through the migrations, clears settings and preferences, and returns the app to its first-run state (R0-09)
- [ ] Export → delete → import produces data identical to the original (round trip)
- [ ] `DataExported`, `DataImported`, `AllDataDeleted` are published after the operation succeeds and the UI refreshes fully on the last two
- [ ] Paths come only from the OS dialog; no other file access

## Events
Publishes `DataExported`, `DataImported`, `AllDataDeleted`. Listened to by everything (full refresh).

## Data
Reads and writes every table in migration 001. No schema change.

## Performance Budget
No hard budget; export, import and delete times for the 5000-item fixture are recorded informationally in F0-12. The UI must stay responsive (work off the UI thread).

## Tests
- Integration: export → delete-all → import → table-by-table equality with the original, using a populated fixture
- Integration: import refuses a non-empty workspace
- Integration: import rejects `schema_version` greater than current and a wrong `format`
- Integration: a file with one bad row in the middle imports nothing
- Integration: delete-all rejects anything but the exact `DELETE`, then succeeds and leaves a working empty database
- Integration: a non-ASCII label pair in an edited export cannot create a duplicate (folded name recomputed)
- Vitest: S-61 and S-62 flows

## Out of Scope
- Merge-import (PRD D-5: restore only)
- Encryption (PRD D-6)
- Exporting a single day's log as Markdown (F1-16)
- The first-run screen S-00 itself (F1-26) — delete-all lands on a placeholder until then

## Open Questions
None.
