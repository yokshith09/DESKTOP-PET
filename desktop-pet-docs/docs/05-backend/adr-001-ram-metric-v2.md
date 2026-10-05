# ADR-001: V-2 RAM Budget Metric Selection

**Date:** 2026-10-04  
**Status:** Accepted  
**Context:** Phase 2 (Shell) unblocked after Windows memory profiling

## Problem

Loaf targets <100 MB RAM budget. Windows hello-world measurement showed:
- **Private bytes:** 105 MB (exceeds budget)
- **Private working set:** 32 MB (within budget)
- **macOS:** 47.5 MB (within budget)

Which metric gates the V-2 release?

## Decision

**Gate on private working set (32 MB Windows, 47.5 MB macOS).**

Private working set measures memory resident and actively used by the process. It reflects actual performance impact on the system—what users experience as "app weight."

Private bytes conflates:
- OS file cache and memory-mapped I/O
- Loaded DLL overhead (system and third-party libraries)
- GC heap allocations and fragmentation
- Temporary allocations during startup

These are outside app control and don't predict runtime performance.

## Rationale

1. **Desktop shipping reality:** Working set is the metric OS vendors and performance tools report; it's what "feels fast" to users.
2. **macOS alignment:** 47.5 MB working set on macOS—a 15× tighter OS—suggests our core footprint is lean. Private bytes would be meaningless noise.
3. **Tauri baseline:** v2 app shells are ~20–30 MB. 32 MB suggests 2–12 MB app logic and state, credible for a scheduler, database, and UI thread.
4. **Single-focus durability:** Working set stays relevant if we add features; private bytes grows with every external dependency (we don't control).

## Consequences

- ✅ V-2 shell work (F0-07, tray, autostart) unblocked.
- ✅ macOS will ship; Windows won't regress below current working set.
- ⚠️ If working set creeps above 64 MB during Phase 3–4 (UI, pet animation), we revisit: GC tuning, lazy-loading, or feature cuts.

## Testing

Local Windows profiling (user's machine). GitHub Actions CI to build and test both platforms before release.
