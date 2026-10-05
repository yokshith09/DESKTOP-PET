# F0-08: Tray, single instance, close-hides, quit

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As a user, I want Loaf to live in the tray, open once, hide when I close the window, and quit only when I say so (R0-01…R0-03, ADR-013).

## Phase & Priority
Phase 0 · P0 · 1.0 relative dev-days (plan D7)

## Depends On
F0-07.

## UI
Tray menu per App Flow §5 (search item removed, D4-A2): Open Loaf · New Note · New Task · — · Hide/Show Pet · — · Settings… · Quit Loaf. Windows: left-click opens Loaf, right-click shows the menu. macOS: click shows the menu.

## Acceptance Criteria
- [ ] Launching a second instance focuses the existing main window and leaves exactly one Loaf process running (R0-01)
- [ ] Tray/menu-bar icon present on both OSes (R0-02). The menu is built from a registry: **Open Loaf** and **Quit** ship now; **New Note, New Task, Hide/Show Pet and Settings** register themselves when their owning features land (F1-01, F1-24, F1-22, F1-25), because unbuilt actions are hidden, not greyed (PRD R1-84). R0-02 is therefore complete at CP4, and this feature verifies the registry
- [ ] Closing the main window hides it; the process keeps running (R0-03)
- [ ] Quit from the tray (and `Ctrl/Cmd+Q`) publishes `AppShuttingDown`, lets the writer flush, and exits **every** Loaf process, including webview children
- [ ] Reopening the window restores the last view (`ui.last_view`)
- [ ] Tray label text follows `PetVisibilityChanged` once the pet exists

## Events
Publishes `AppStarted`, `AppShuttingDown`. Listens to `SettingChanged` and `PetVisibilityChanged`.

## Data
Reads/writes `user_preferences` keys `window.main.bounds` and `ui.last_view`.

## Performance Budget
Warm show from tray <300 ms (09). 0 idle CPU for the tray.

## Tests
- Unit: menu registry orders items, hides unregistered ones, and drops the right separators
- Integration: shutdown ordering — event, writer flush, exit
- Manual E2E on both OSes: second launch focuses the first; close hides; quit leaves zero Loaf processes (checked with Task Manager / Activity Monitor)

## Out of Scope
- The one-time "Loaf keeps running in the tray" hint (F0-10, needs the toast)
- Global shortcuts (F1-24)
- Autostart (F0-09)

## Open Questions
None.
