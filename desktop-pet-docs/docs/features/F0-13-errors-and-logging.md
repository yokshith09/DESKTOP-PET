# F0-13: Error model, tracing logs, panic hook

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want one error type that crosses the IPC boundary, logs that never contain user content, and a crash file when something panics, so failures are diagnosable without telemetry (ADR-012).

## Phase & Priority
Phase 0 · P0 · 1.0 relative dev-days (plan D7)

## Depends On
F0-01.

## UI
None. The error toast and the blocking DB error screen (S-90) are built in F0-10.

## Acceptance Criteria
- [ ] `AppError { code, message, field? }` in `loaf-core`; codes `VALIDATION`, `NOT_FOUND`, `INVALID_TRANSITION`, `CONFLICT`, `DB`, `IO`, `INTERNAL`; serializes to `{ code, message, field? }`
- [ ] Every error `message` is user-readable and follows the tone rules in UI brief §2 (what happened, what is still safe)
- [ ] `tracing` writes to a rolling file in the OS app-data `logs/` directory: **5 files × 2 MB**. `tracing-appender` rotates by time only, so size-based rotation is a small in-house writer (under the dependency rule's 2-hour threshold)
- [ ] No log line at `info` or above contains note, task or meeting content (TRD §6.9); a test enforces it on the logging macros wrapper
- [ ] A panic hook logs the panic and writes `crash-<timestamp>.txt` next to the logs, then attempts a graceful flush; nothing is sent anywhere
- [ ] Log level comes from the `advanced.log_level` setting once F0-07 exists; until then, `info`

## Events
None (errors are returned, not published).

## Data
Writes files under the app-data `logs/` directory only. No database.

## Performance Budget
Logging must not block the UI path; log writes are batched off the calling thread. Log lines are not DB transactions and do not count against the idle-write budget.

## Tests
- Unit: each error code serializes to the documented JSON shape (snapshot)
- Unit: rotation keeps exactly 5 files and never exceeds 2 MB each (temp directory, no sleeps)
- Unit: panic hook produces a crash file containing the panic message and location
- Unit: the content-free-logging guard rejects an attempt to log a note body at `info`

## Out of Scope
- Sending crash reports anywhere (ADR-012: none)
- A log viewer UI
- The S-90 screen (F0-10)

## Open Questions
None.
