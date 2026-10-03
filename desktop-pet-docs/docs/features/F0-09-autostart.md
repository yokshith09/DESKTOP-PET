# F0-09: Autostart with --hidden

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As a user, I want Loaf to start at login quietly in the tray, if I turn that on (R0-04).

## Phase & Priority
Phase 0 · P0 · 0.5 relative dev-days (plan D7)

## Depends On
F0-08.

## UI
A single toggle in Settings › General is added by F1-25; until then the setting is changed through the IPC command.

## Acceptance Criteria
- [ ] `general.autostart` on registers a login item (Windows Run key, macOS login item) that launches Loaf with `--hidden`
- [ ] A `--hidden` launch does not show the main window; the process and tray are up
- [ ] `general.autostart` off removes the login item
- [ ] At startup the OS state is reconciled with the setting, so a login item removed by the user or by an uninstall does not leave the setting lying
- [ ] Default is off

## Events
Listens to `SettingChanged`.

## Data
Reads `settings.general.autostart`.

## Performance Budget
Autostart adds no steady-state cost; startup time with `--hidden` is recorded in F0-12.

## Tests
- Unit: `--hidden` argument parsing
- Unit: reconciliation chooses the correct action for each of the four setting/OS state combinations
- Manual E2E on both OSes: enable, log out and in, confirm hidden start; disable, confirm it no longer starts

## Out of Scope
- The pet appearing on hidden start (F1-22)
- Settings UI toggle (F1-25)

## Open Questions
None.
