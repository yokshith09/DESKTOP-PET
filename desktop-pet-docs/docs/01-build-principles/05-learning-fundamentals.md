# Learning Fundamentals — Understand Before You Build

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02 · **amended A-1 (2026-10-03)**. Changes require a written amendment at the bottom of this file.

Loaf's constraints (event-driven, <1% idle CPU, <100 MB RAM, local-first) cannot be met by copying patterns you don't understand. This file defines **what you must understand before building each layer**, and how to learn it without stalling the build.

## The Rule

**Learn exactly what the next feature needs — deeply — then build. Never learn "everything first."**

A fundamentals gap is discovered in one of three ways:
1. You can't explain why your code works
2. You can't predict what a change will do to CPU/RAM
3. A bug "fixes itself" and you don't know why

Any of these = stop, learn the concept, write it down, continue.

## Required Fundamentals by Phase

### Before Phase 0 (Foundation)

| Concept | Why Loaf needs it | You understand it when you can… |
|---------|-------------------|--------------------------------|
| Rust ownership & borrowing | Every core module | Explain why a value moved and fix it without `.clone()` everywhere |
| `Arc`, `Mutex`, `RwLock` | Shared state across event handlers | Say when a `Mutex` will deadlock |
| Async vs threads in Rust (Tokio) | Event bus, IPC, file I/O | Explain why a blocking call inside an async task freezes other tasks |
| Channels (`mpsc`, `broadcast`) | The event bus itself | Explain what happens when a slow subscriber lags |
| Tauri process model | Core vs webview, commands vs events | Draw which process owns which memory |
| Tauri IPC (commands + events) | Every UI ↔ core interaction | Explain the serialization cost of a large payload |
| SQLite basics | All storage | Write a schema, index, and migration by hand |
| SQLite WAL mode & transactions | Batched writes, crash safety | Explain why 100 inserts in one transaction beat 100 single inserts |
| OS app data paths | Storage location per OS | Name the path on both OSes without looking it up |

### Before Phase 1 (Notes)

| Concept | Why | Done when you can… |
|---------|-----|--------------------|
| SQLite FTS5 | Search <500 ms on 5000 items | Build an FTS5 table, keep it in sync **from the repository layer inside the write transaction** (ADR-014), rank results with `bm25` |
| React state & rendering | Notes UI | Explain what triggers a re-render and prevent unnecessary ones |
| Controlled inputs + debouncing | Search, editors | Implement a 300 ms debounce without a library |
| Keyboard event handling | Shortcuts | Handle Ctrl/Cmd differences across OSes |
| Date/time & timezones | Daily Log, due dates | Explain why you store UTC and render local |
| Schema migrations | Data survives upgrades | Write a forward migration and test it against old data |

### Before Phase 2 (Browser Intelligence)

| Concept | Why | Done when you can… |
|---------|-----|--------------------|
| Browser extension model (MV3) | Tab tracking | Explain service-worker lifecycle and why it sleeps |
| `tabs` / `windows` APIs | Open/close/focus events | List which events fire on tab switch vs window switch |
| Native Messaging | Extension ↔ Loaf bridge | Register a native host on Windows (registry) and macOS (manifest path) |
| Safari Web Extensions | macOS Safari support | Explain why Safari requires an Xcode-wrapped app extension |
| OS foreground-window events | App time tracking | Use `SetWinEventHook` (Windows) / `NSWorkspace` notifications (macOS) — event-based, no polling |

### Before Phase 3 (Pet)

| Concept | Why | Done when you can… |
|---------|-----|--------------------|
| Transparent, frameless windows | Pet window | Create one on both OSes and explain click-through behavior |
| Sprite sheets & frame timing | 30 FPS animation | Animate from a sprite sheet with frame timing driven by state |
| `requestAnimationFrame` vs timers | CPU budget | Explain why rAF pauses when hidden and how to stop it fully when the pet sleeps |
| State machines | Pet behavior engine | Model idle → reacting → sleeping as explicit states and transitions |

### Before Phases 4–7

| Concept | Phase | Done when you can… |
|---------|-------|--------------------|
| File-system watchers | 4 | Watch `.git` without recursive overload (`notify` crate) |
| Secure credential storage | 5 | Store tokens in OS keychain / Credential Manager, never in SQLite |
| OAuth 2.0 + PKCE for desktop apps | 5 | Explain loopback redirect and why desktop apps can't hold a client secret |
| MCP protocol (client side) | 5 | Connect to an MCP server, list tools, call one |
| Audio capture & permissions | 6 | Request mic permission on both OSes, capture only on activation |
| Intent parsing basics | 6 | Map an utterance to a structured intent with confidence + fallback |
| Asset packaging & lazy loading | 7 | Load a character pack only when selected |

## How to Learn (Without Stalling)

```
1. Time-box: max 1 day per concept before building with it
2. Build a throwaway spike (in /spikes, never merged to main)
3. Measure the spike (CPU, RAM, latency) — see 09-performance-budgets.md
4. Write a 5-line note in /docs/learning/<concept>.md:
     - What it is
     - Why Loaf uses it
     - The one gotcha that would have bitten you
     - Measured numbers from the spike
     - Link to the best source you used
5. Delete the spike. Build the real thing with tests.
```

## Source Priority

1. Official docs (Rust Book, Tokio tutorial, Tauri v2 docs, SQLite docs, MDN, Apple/Microsoft developer docs)
2. Source code of the crate/library itself
3. Well-maintained example repos
4. Blog posts / videos — only to orient, never as the final answer

## Dependency Rule

Before adding any crate or npm package, answer in the PR:

- [ ] What problem does it solve?
- [ ] Could we build it in <2 hours? (If yes, build it.)
- [ ] Do I understand what it does internally at a high level?
- [ ] What does it cost in binary size, RAM, and idle CPU?
- [ ] Is it maintained (release in the last 12 months)?
- [ ] Does it work on Windows **and** macOS?

## Anti-Patterns

- ❌ Copying a Stack Overflow fix without understanding it
- ❌ Adding `async` everywhere "for performance"
- ❌ Wrapping everything in `Arc<Mutex<>>` to silence the borrow checker
- ❌ Choosing a library because it's popular, not because it fits the constraints
- ❌ Learning a whole framework before writing line one
- ❌ Optimizing code you haven't measured

---

## Amendments

### Amendment A-3 (2026-10-03)
Secure credential storage moves from Phases 4, 5 to Phase 5 only: Phase 4 is offline and holds no credentials (ADR-016).

### Amendment A-2 (2026-10-03)
Phase column and row order of the "Before Phases 4–7" table follow the owner's phase order (ADR-015): Developer 4, MCP 5, Voice 6, Characters 7.

### Amendment A-1 (2026-10-03)
The Phase 1 FTS5 row said to keep the index in sync "with triggers", echoing
the original wording of ADR-006. ADR-014 supersedes that: the index is
maintained by the repository layer inside the source write's transaction.
The learning requirement is unchanged in substance — you must still be able
to build an FTS5 table and rank results — but the mechanism to understand is
transactional reindexing, not trigger authoring.

---

Next: Read **06-feature-definition.md** before starting any feature.
