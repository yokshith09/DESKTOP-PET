# F0-06: Clock trait and day-rollover scheduler

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want a testable clock and a scheduler that wakes exactly at local midnight, after sleep and after a timezone change, so the daily log can be frozen reliably (TRD §6.1, §6.2).

## Phase & Priority
Phase 0 · P0 · 2.0 relative dev-days (plan D7)

## Depends On
F0-03.

## UI
None.

## Acceptance Criteria
- [ ] `Clock` trait (`now_ms`, `local_date`, `tz`) with `SystemClock` and `FakeClock`; every date-dependent function takes `&dyn Clock`
- [ ] Scheduler arms **one** `sleep_until(next_local_midnight)`; it re-arms on OS resume and on timezone change through a small `rearm()` input, so the core logic stays platform-free
- [ ] Platform shims deliver the re-arm signal: Windows power-broadcast and time-change messages, macOS wake and time-zone-change notifications. Whether Tauri/tao exposes them or a small shim is needed is settled in this feature and recorded in the PR (TRD §6.2 marked this "verify in CP1")
- [ ] On fire: read `prefs.last_seen_date`; publish one `DayRolledOver { ended_date, new_date }` per day from the day after it up to yesterday, in order; then set `last_seen_date` to today. Building the snapshot itself is F1-15's subscriber
- [ ] Idempotent: firing twice for the same day publishes once
- [ ] First launch with no `last_seen_date` publishes nothing and records today

## Events
Publishes `DayRolledOver`.

## Data
Reads/writes `user_preferences.last_seen_date`. No schema change.

## Performance Budget
Exactly one pending timer while idle; 0% CPU between wakeups.

## Tests
- Unit with `FakeClock` + tokio paused time (no real sleeps): normal midnight
- Unit: app closed for 3 days publishes 3 ordered events
- Unit: sleep across midnight (resume signal after the deadline) publishes once
- Unit: DST spring-forward and fall-back days in two zones (a 23 h and a 25 h day) roll over on the right local date
- Unit: timezone change mid-day re-arms to the new zone's midnight
- Unit: double fire is idempotent; first launch publishes nothing
- Manual: put each OS to sleep across midnight and confirm the rollover event in the log

## Out of Scope
- Building or freezing the daily-log snapshot (F1-15)
- Any UI

## Open Questions
None.
