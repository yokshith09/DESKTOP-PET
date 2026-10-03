# F0-05: DB writer thread, read pool, publish-after-commit

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want every write to go through one thread that publishes its event only after the commit, so no listener ever sees data that is not durable (TRD §1.1).

## Phase & Priority
Phase 0 · P0 · 1.5 relative dev-days (plan D7)

## Depends On
F0-03, F0-04.

## UI
None.

## Acceptance Criteria
- [ ] A dedicated OS thread owns the single write connection and consumes `WriteRequest`s; each carries a closure run inside one transaction and a `oneshot` reply channel
- [ ] The events a write produces are published on the bus **after** `COMMIT`; a failed write publishes nothing and returns the error to the caller
- [ ] A read pool of 2 connections serves queries via `spawn_blocking`; reads never block writes (WAL)
- [ ] A debug-only counter exposes the number of committed transactions, for the idle-write budget (09)
- [ ] On `AppShuttingDown` the writer drains pending requests, then stops
- [ ] No timers: the thread blocks on its channel

## Events
Publishes whatever the submitted closure returns. Listens to `AppShuttingDown`.

## Data
No new tables.

## Performance Budget
Write-to-UI-update <100 ms at p95 for a single-row write (09 interaction budget); 0 idle wakeups.

## Tests
- Integration: a subscriber that reads the DB inside its event handler always finds the committed row
- Integration: a write that errors midway publishes no event and leaves no partial rows
- Integration: pending writes complete before shutdown returns
- Integration: transaction counter equals the number of successful writes
- Unit: concurrent readers during a write succeed (WAL)

## Out of Scope
- Any domain repository (notes, tasks, … arrive with their features)
- Batching for high-frequency sources (Phase 2)

## Open Questions
None.
