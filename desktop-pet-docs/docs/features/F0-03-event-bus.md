# F0-03: Event enum, broadcast bus, lag handling

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want a typed event bus so every state change flows through one mechanism with zero idle cost (ADR-004).

## Phase & Priority
Phase 0 · P0 · 1.5 relative dev-days (plan D7)

## Depends On
F0-13.

## UI
None.

## Acceptance Criteria
- [ ] One `Event` enum in `loaf-core/events`, past-tense names, `serde`-serializable, every variant carrying `at: i64` (ms UTC); only the variants Phase 0 needs exist now (app lifecycle, settings, pet visibility/position, data export/import/delete, day rollover) — later features add their own variants
- [ ] `EventBus` wraps `tokio::sync::broadcast`: `publish`, `subscribe`; publishing with no subscribers is not an error
- [ ] A subscriber helper converts `RecvError::Lagged(n)` into an explicit `Resync { missed: n }` result after logging a warning — lag is never silently ignored (ADR-004)
- [ ] Subscribers park when idle; no interval loops anywhere in the module
- [ ] Event names and payload shapes match TRD §3

## Events
Defines the enum. Publishers/subscribers arrive with the features that own them.

## Data
None.

## Performance Budget
Publish-to-receive latency negligible at human rates; the 10,000 events/s burst is verified in F0-12 (V-5).

## Tests
- Unit: subscribers receive events in publish order; two subscribers each get every event
- Unit: a deliberately slow subscriber on a tiny-capacity bus receives `Resync` with the right missed count
- Unit: every variant round-trips through `serde_json` and its serialized tag is past tense (checked against the allow-list in the test)
- Unit: publish with zero subscribers returns Ok

## Out of Scope
- The UI forwarder (F0-07)
- Persistence of events
- Throughput measurement (F0-12)

## Open Questions
None.
