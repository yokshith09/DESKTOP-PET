# F0-04: Database open, PRAGMAs, migration runner, migration 001

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want a database that opens safely, migrates forward with a backup, and refuses to run on a corrupt file, so user data survives every upgrade (ADR-005, ADR-007).

## Phase & Priority
Phase 0 · P0 · 1.5 relative dev-days (plan D7)

## Depends On
F0-13.

## UI
None. A failed integrity check returns an error the S-90 screen (F0-10) will display.

## Acceptance Criteria
- [ ] Opens `loaf.db` at the OS app-data path (`%APPDATA%\Loaf\loaf.db`, `~/Library/Application Support/Loaf/loaf.db`); the path is a parameter to `loaf-core` so tests use temp files
- [ ] Every connection sets `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=NORMAL`, `busy_timeout=5000`
- [ ] Startup runs `PRAGMA quick_check`; on failure the DB is not opened for writing and the error carries the latest backup's path (Schema §1)
- [ ] Migration files are embedded with `include_str!`. **The runner owns the transaction and `PRAGMA user_version`**; it applies each file in its own transaction and sets the version only after the file applies cleanly
- [ ] Lint test rejects a migration containing standalone transaction control or a `user_version` write, using the anchored regex from Schema §5; the test also proves it does not reject `CREATE TRIGGER … BEGIN … END`
- [ ] Before applying any migration to an existing database, `loaf.db.bak-<from_version>` is written and only the newest 3 are kept
- [ ] A migration that fails halfway leaves the original database untouched and `user_version` unchanged (test)
- [ ] Migration 001 produces `user_version = 1` and exactly the 13 tables in Schema v1.2 — there are no search tables (ADR-017)
- [ ] Constraint tests exist for: label uniqueness via `name_folded` including a non-ASCII pair, the `task_events` append-only trigger, the `daily_logs` immutability and no-delete triggers, the `completed_at` consistency CHECK, and rejection of a `task_events.kind` of `DELETED`

## Events
None (the writer in F0-05 publishes).

## Data
Creates every table in `migrations/001_initial.sql`. Migration needed: yes — this feature ships 001.

## Performance Budget
Opening and migrating an empty database must not noticeably affect startup; the figure is recorded in F0-12 and the <2 s startup budget applies.

## Tests
- Integration: fresh DB → `user_version = 1`, table list equals the expected set
- Integration: previous-version fixture → migrate → data intact (the fixture mechanism ships now even though 001 is the only migration, per the testing strategy)
- Integration: injected failing migration → original file and version unchanged
- Unit: backup rotation keeps the newest 3
- Unit: the schema constraint tests listed above, each its own test

## Out of Scope
- The writer thread and read pool (F0-05)
- Restore-from-backup UI
- Phase 2 tables (`migration 002` is not created until Phase 2)

## Open Questions
None.
