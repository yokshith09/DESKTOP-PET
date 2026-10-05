# F0-10: Frontend shell: sidebar, router, tokens, theme, contrast check

## Status
DRAFT — complete against the Definition of Ready except that its dependencies are not yet DONE; flips to READY when they are

## User Story
As a user, I want the app to look and behave like one calm, consistent window in light or dark, so every later screen slots into a finished frame (UI brief §3–§4, §9).

## Phase & Priority
Phase 0 · P0 · 2.0 relative dev-days (plan D7)

## Depends On
F0-07.

## UI
UI brief §3 layout: sidebar 232 px · list/view · detail panel, minimum window 800×600, detail panel full-width under 1000 px. Sidebar order from App Flow §7: Today · Tasks · Notes · Meetings · Daily Logs · — · Archive · Settings (no search box, D5-A2). Every view is a placeholder with its empty-state copy from UI brief §7.

## Acceptance Criteria
- [ ] In-house router keyed by a `view` value (TRD §8) with Back behaviour for the detail panel; no router dependency
- [ ] Design tokens from UI brief §4 as CSS custom properties on `:root[data-theme]`; system font stack, no bundled fonts
- [ ] Theme Light / Dark / System applies instantly to the main window now and to the pet window later, driven by `SettingChanged` (R0-11); font size S/M/L scales the root 0.9 / 1.0 / 1.15
- [ ] `prefers-reduced-motion` sets transitions to 0 ms; the focus ring is 2 px accent, always visible on keyboard focus
- [ ] **Automated contrast test** computes the WCAG ratio for every text/background token pair in both themes. UI brief §4.1 marks the palette as unverified; any pair below 4.5:1 body / 3:1 large-and-UI is adjusted and the brief amended
- [ ] Toast primitive (info, success, error, with an Undo action) and the one-time "Loaf keeps running in the tray" hint on first close, remembered in `ui.close_hint_shown`
- [ ] S-90 blocking screen for a failed database check
- [ ] Sidebar and views are fully keyboard-operable; icon buttons have accessible names

## Events
Listens to `SettingChanged`, `ResyncRequired`.

## Data
Reads settings; writes `user_preferences.ui.close_hint_shown`.

## Performance Budget
View switch <150 ms; first paint contributes to cold startup <2 s; no animated backgrounds, blur or heavy shadows (UI brief principle 5).

## Tests
- Vitest + RTL: router navigation and Back; sidebar keyboard navigation; theme switch updates `data-theme`; reduced-motion removes transitions
- Unit: contrast function against known reference ratios, then against every token pair
- Vitest: S-90 renders on a DB-error result; toast Undo calls its handler once
- Manual: both OSes in light and dark, at 800×600 and 1200×800

## Out of Scope
- Real content for any view (CP2 onward)
- Settings screens (F1-25)
- First-run screen S-00 (F1-26)

## Open Questions
None.
