# Performance Budgets — Ceilings, Measurement, Enforcement

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Budgets are ceilings, not measurements. Measured baselines are appended per phase; budgets change only by amendment.

A budget is the **maximum cost a feature is allowed to add**. If you can't measure it, it isn't met.

## Global Budgets (Every Phase, Both OSes)

| Metric | Budget | Measured as |
|--------|--------|-------------|
| Idle CPU | <1% average | 10-minute window, app idle in tray, main window closed, pet visible |
| RAM (total) | <100 MB | **Sum of all Loaf processes** (core + every webview process + native messaging host) |
| Disk writes when idle | ≤1 per minute | Count of DB transactions committed during idle window |
| GPU | No sustained load | No WebGL/shaders; GPU usage indistinguishable from baseline when pet is still |
| Cold startup | <2 s | Launch → main window interactive |
| Warm show (from tray) | <300 ms | Tray click → window visible |
| Binary/installer size | <30 MB | Release installer per OS |
| Database size | <100 MB | After simulated 1 year of typical use |

⚠ [Likely] The RAM budget is the riskiest number in this file. On Windows, WebView2 spawns several processes that together can approach or exceed 100 MB on their own. Phase 0 task **V-2** (07-architecture-decisions.md) decides whether this budget holds as written. Until V-2 passes, no Phase 1 feature may assume headroom.

## Interaction Budgets

| Interaction | Budget (p95) |
|-------------|--------------|
| Create / edit / delete note or task | <100 ms to UI update |
| Pin, archive, label, color change | <100 ms |
| Open note / task / meeting | <150 ms |
| Search (5000 items, all types) | <500 ms |
| Search keystroke → results (debounced 300 ms) | <800 ms total |
| Daily Log view render | <300 ms |
| Dashboard render (Phase 2) | <300 ms |
| Close tab from dashboard → tab gone | <500 ms |
| Pet reaction after triggering event | <200 ms |
| Pet animation | 30 FPS steady; 0 FPS when hidden/sleeping |

## Per-Phase Budget Allocation

Each phase may only add to idle cost within its allocation. Unused allocation does **not** roll over.

| Phase | Idle CPU added | RAM added | Notes |
|-------|----------------|-----------|-------|
| 0 Foundation | ≤0.3% | ≤60 MB | Includes webview baseline — the expensive part |
| 1 Notes + minimal pet | ≤0.1% | ≤10 MB | Static pet sprite must cost ~0 CPU |
| 2 Browser | ≤0.2% | ≤8 MB | Extensions fire on events only; buffered writes |
| 3 Pet animations | ≤0.2% while animating, 0 while sleeping | ≤8 MB | Sprite sheets loaded once |
| 4 Developer | ≤0.1% | ≤4 MB | Watchers on `.git` refs only, not whole trees |
| 5 MCP | ≤0.1% | ≤5 MB | Refresh per ADR-009 exceptions; also carries the MCP client + OAuth scaffold |
| 6 Voice | 0 when not activated | ≤5 MB | No mic capture outside activation |
| 7 Characters | 0 | ≤5 MB resident | Only the active character's assets in memory |
| **Total** | **<1%** | **<100 MB** | |

If Phase 0 measures a higher baseline, later allocations shrink — the total never grows.

## How to Measure

### Idle CPU & RAM
- **Windows:** Performance Monitor (`perfmon`) counters for `% Processor Time` and `Private Bytes` on every Loaf process, or a scripted collector using the same counters. Task Manager is for spot-checks only.
- **macOS:** `top -l` / Activity Monitor with all Loaf processes, or Instruments (Time Profiler, Allocations) for investigation.
- Procedure: launch → wait 2 minutes for startup settle → record 10 minutes → report average and max.

### Startup
- Instrument the core: log a timestamp at process start and when the frontend signals "ready." Report median of 10 cold launches (after reboot or cache clear).

### Interactions
- Rust benchmarks (`criterion`) for DB operations and search.
- Frontend: Performance API marks around user action → render complete.
- Seed fixture: 5000 mixed items (3000 notes, 1500 tasks, 300 meetings, 200 daily logs) generated deterministically.

### Disk writes
- Count transactions in the DB writer task (debug counter exposed in a dev-only diagnostics panel).

## Enforcement

| When | What runs | Fails if |
|------|-----------|----------|
| Every PR touching core or DB | `criterion` benchmarks for affected paths | >10% regression vs main |
| Every feature marked DONE | Interaction budget check for that feature | Over budget |
| Every phase release | Full idle profile on both OSes + startup + RAM | Any global budget exceeded |

**Regression rule:** A PR that exceeds a budget is not merged. The fix is to optimize, defer the feature, or propose a budget amendment with measured justification — never to "fix it later" silently.

## Budget Amendment Process

1. Measure on both OSes, record numbers
2. Explain why the budget cannot be met and what users gain
3. Propose the new number and which other phase allocation shrinks to compensate
4. Append as an amendment below with date

## Measured Baselines

*(Appended at the end of each phase. Empty until Phase 0 completes.)*

| Phase | Date | OS | Idle CPU | RAM (sum) | Startup | Search p95 |
|-------|------|----|----------|-----------|---------|-----------|
| — | — | — | — | — | — | — |

## Amendments

### Amendment A-1 (2026-10-03)
Per-phase allocation rows for Phases 4–6 reordered to follow the owner's phase order (ADR-015): Developer 4, MCP 5, Voice 6. Each phase keeps its own numbers; the totals (<1% CPU, <100 MB) are unchanged. Phase 5 now also hosts the MCP client and OAuth scaffold that previously sat in the Voice phase — it keeps the ≤5 MB allocation, so the start-of-phase re-estimate must show it fits.

---

Next: **10-team-coordination.md** (⏸ on hold) · **11-quality-gates.md** (⏸ on hold)
