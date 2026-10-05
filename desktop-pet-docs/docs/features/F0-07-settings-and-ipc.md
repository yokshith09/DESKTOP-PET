# F0-07: Settings and preferences services, IPC, TypeScript types

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As the developer, I want typed settings and a typed bridge to the frontend, so the UI and the core cannot drift apart and a missing key always means a sensible default.

## Phase & Priority
Phase 0 · P0 · 1.5 relative dev-days (plan D7)

## Depends On
F0-05.

## UI
None visible; the Settings screen is F1-25 (a minimal Data section arrives in F0-11).

## Acceptance Criteria
- [ ] Defaults live in Rust; a missing key returns its default (Schema §3.1). Keys and defaults: `general.autostart=false`, `general.theme="system"`, `general.font_size="M"`, `pet.visible=true`, `pet.size="M"`, `pet.opacity=100`, `pet.always_on_top=true`, `shortcuts.*` per UI brief §8, `advanced.log_level="info"`
- [ ] Commands: `settings_get_all`, `setting_set`, `prefs_get`, `prefs_set`; values are validated (type and range) and rejected with `VALIDATION` and the field name
- [ ] `setting_set` writes through the DB writer and publishes `SettingChanged { key, value }` after commit
- [ ] A **UI forwarder** subscribes to the bus and emits events to every webview; on lag it emits `ResyncRequired` and the frontend refetches (TRD §3)
- [ ] TypeScript types are generated from the Rust types with `ts-rs` into `src/ipc/generated/`; CI fails if the committed files are stale. (`tauri-specta`'s v2 line was still pre-release when this was written — [Guessing]; revisit if that has changed)
- [ ] A typed `ipc` client wraps `invoke` so call sites cannot pass the wrong shape
- [ ] A frontend settings store hydrates from `settings_get_all` and patches itself from `SettingChanged`

## Events
Publishes `SettingChanged`. The forwarder listens to all events and emits `ResyncRequired` on lag.

## Data
`settings`, `user_preferences` (existing tables). No migration.

## Performance Budget
Setting round-trip UI → core → UI <100 ms.

## Tests
- Unit: every key's default; invalid type and out-of-range values rejected with the right field
- Integration: `setting_set` → `SettingChanged` observed only after commit
- Integration: forwarder emits `ResyncRequired` for a lagged subscriber
- Frontend (Vitest): store hydrates, then patches on an incoming `SettingChanged`
- CI: generated-types-up-to-date check

## Out of Scope
- The Settings screens (F1-25)
- Pet position persistence (F1-22)
- Shortcut registration (F1-24)

## Open Questions
None.
