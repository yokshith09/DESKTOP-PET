# F0-12: Performance harness and final V-2, V-3, V-5

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want repeatable measurements so every performance budget is checked against numbers, not feelings (09).

## Phase & Priority
Phase 0 · P0 · 2.0 relative dev-days (plan D7)

## Depends On
F0-11.

## UI
None. Dev-only diagnostics panel behind a build flag (`diagnostics_snapshot`) exposing the DB transaction counter.

## Acceptance Criteria
- [ ] Deterministic 5000-item fixture generator: 3000 notes, 1500 tasks, 300 meetings, 200 daily logs; same seed → identical database
- [ ] `criterion` benchmarks for the Phase 1 hot paths available at this point: create/update note, list notes, task queries, daily-log read; baselines recorded
- [ ] Idle-profile scripts for Windows (perfmon counters) and macOS (`top`/Activity Monitor equivalents): launch → 2 min settle → 10 min record → average and max, summed across **all** Loaf processes
- [ ] **Final V-2** on the real app, both OSes, appended to `07` and `09` (the preliminary result from F0-02 is quoted next to it)
- [ ] **V-3** idle CPU/GPU with a transparent static window: measured with a throwaway spike under `spikes/` that is never merged to `main` (05 learning rule); result recorded
- [ ] **V-5** event-bus burst: 10,000 events/s synthetic burst, assert no loss, and record UI frame time with the Performance API
- [ ] Startup is instrumented: core logs a timestamp at process start and the frontend signals ready (`app_ready`); median of 10 cold launches recorded
- [ ] Results go into `09-performance-budgets.md`'s baseline table; if any global budget fails, the CP1 decision point stops work and an ADR is written before CP2

## Events
Publishes and consumes synthetic events for V-5. `AppReady { startup_ms }` is recorded.

## Data
Reads the fixture database. No schema change.

## Performance Budget
This feature measures every global budget in 09; it adds no runtime cost to the shipped app (dev-only flag).

## Tests
- Unit: the generator is deterministic (same seed, same content hash)
- Integration: V-5 asserts zero dropped events at the stated burst
- The measurements themselves are the acceptance evidence; their raw output is attached to the PR

## Out of Scope
- V-4 — withdrawn with search (ADR-017)
- Writing `08`, `10` and `11` — CP1 exit-gate work, done once these baselines exist
- Performance gates in CI (`11-quality-gates.md`)

## Open Questions
None.
