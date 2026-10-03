# Code Organization — Folder Structure & Module Rules

> **Status: ⏸ ON HOLD** — to be written during Phase 0, from the real scaffold.

## Why It's on Hold
Folder structure written before the Tauri scaffold exists would be guesswork. The structure will be documented from what Phase 0 actually produces, then locked.

## Unlock Trigger
Phase 0 features F0-01 (scaffold) and F0-03 (event bus) are DONE.

## Will Cover
- Repository layout (`src-tauri/`, `src/`, `extensions/`, `docs/`, `spikes/`)
- Rust module boundaries (events, db, commands, os-integration, pet-engine)
- Frontend structure (features, shared components, IPC client)
- Naming conventions (files, events, commands, tables)
- Where tests live for each layer
- Import/dependency direction rules (core never imports from UI concerns)

## Already Decided Elsewhere (Inputs)
- Rust core owns state (07 · ADR-002)
- One `Event` enum, past-tense names (07 · ADR-004)
- Single DB writer task (07 · ADR-005)
- Separate pet window entry point (07 · ADR-008)
- Spikes live in `/spikes` and are never merged (05)
- Feature specs live in `/docs/features/` (06)
