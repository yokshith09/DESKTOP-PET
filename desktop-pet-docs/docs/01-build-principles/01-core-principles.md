# Core Principles — Decision-Making Rules

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Changes require a written amendment at the bottom of this file.

Use these principles to decide what to build, how to build it, and when to say "not yet."

## Principle 1: Event-Driven, Always

**Rule:** Every state change flows through an event. No polling. No fixed-interval checking loops. No background tasks except event listeners.

**Clarification:** A *one-shot scheduled wakeup* (e.g., midnight rollover for the Daily Log) is an event, not polling, and is allowed. The only permitted interval-based checks are the documented exceptions in **07-architecture-decisions.md** (ADR-009).

**Apply when:**
- Creating features (does it need polling? Refactor.)
- Choosing between two architectures (event-based wins)
- Optimizing performance (event-driven is already optimized)

**Example: Wrong Way**
```rust
// ❌ Timer checking notes every second
loop {
    sleep(1s)
    if notes_changed() {
        update_ui()
    }
}
```

**Example: Right Way**
```rust
// ✅ Event on note change
on_event(NoteCreated) → update_ui()
on_event(NoteEdited) → update_ui()
```

## Principle 2: Lightweight Always

**Rule:** If a feature adds measurable CPU, RAM, or battery drain when idle, it doesn't belong in v1.

**Resource budgets:**
- Idle CPU: <1%
- RAM footprint: <100 MB
- Disk writes: <1 per minute when idle
- GPU: None (CPU rendering only)

**Apply when:**
- Choosing between voice-always-on vs. activation-based (activation wins)
- Deciding on refresh rate (30 FPS not 60)
- Caching strategy (lazy-load not preload)

**Test:** Launch Loaf, let it sit idle for 1 hour. Check Activity Monitor / Task Manager. If idle CPU is >1%, investigate.

## Principle 3: Local-First Data

**Rule:** User data lives in SQLite on their machine. Cloud or sync comes only after the local product is complete.

**Apply when:**
- Choosing storage (SQLite wins over cloud API)
- Designing features (can they work offline? They should)
- Planning integrations (local caching + async sync, not real-time cloud)

**Test:** Disconnect network. Core features should work. (Integrations can fail gracefully.)

## Principle 4: One Feature at a Time

**Rule:** Don't start Phase 2 until Phase 1 is shippable. Don't add new features to a phase after it starts.

**Apply when:**
- Someone says "let's also add X while we're building Y" (no)
- You're mid-phase and discover a missing piece (scope it for the next phase)
- Tests discover a bug in Phase 1 while building Phase 2 (fix Phase 1 first)

**Test:** At any point in time, the main branch should be buildable and testable. Feature branches can be incomplete; main should not be.

## Principle 5: UI First, Always

**Rule:** Every feature starts with a detailed UI spec. No backend code before UI is locked down.

**Apply when:**
- Starting a new feature (design UI first)
- Discovering a UX problem mid-code (pause, redesign, then continue)
- Someone says "backend API is ready, UI will follow" (wrong order)

**Example workflow:**
```
1. Design UI (Figma, wireframe, or detailed description)
2. Write acceptance criteria (what does it look like, what does it do)
3. Write UI tests (what should render, what should happen on click)
4. Build backend (data model, API, logic)
5. Wire backend to UI
6. End-to-end test
7. Ship
```

## Principle 6: Tests Early, Always

**Rule:** Tests are written before or alongside code, never after. Test coverage must be >80% before shipping.

**Apply when:**
- Starting a new feature (write tests for the happy path first)
- Building backend (tests define the contract)
- Refactoring (tests protect against breaking changes)

**What counts as a test:**
- Unit tests (single function, all paths)
- Integration tests (feature end-to-end)
- UI tests (component renders, responds to input)
- Acceptance tests (matches the spec)

**What doesn't count:**
- Manual testing (necessary, but not in the 80% calculation)
- "I ran it and it worked" (not a test)

## Principle 7: Learn Fundamentals First

**Rule:** Understand the system before optimizing. Know why you're using a library before reaching for it.

**Apply when:**
- Choosing a dependency (can we build this in 2 hours? Do it. Do we need a crate? Pick the boring one.)
- Hitting a performance problem (measure first, optimize second)
- Deciding on architecture (understand the trade-offs)

**Example: Right Way**
```
1. Build the simple thing (SQLite, no caching)
2. Measure (does it work? Fast enough?)
3. If slow, understand why (query count? Disk I/O? Rust overhead?)
4. Optimize the bottleneck (add caching, optimize query, etc.)
5. Re-measure
```

**Example: Wrong Way**
```
1. "Let's use Redis for caching"
2. "Let's use a distributed database"
3. "Let's use async everywhere"
(Build it first, then optimize if needed.)
```

## Principle 8: Usable at Every Phase

**Rule:** At the end of each phase, the product should be usable, even if it's incomplete.

**Apply when:**
- Defining a phase (will someone actually use this?)
- Deciding what goes in a phase (cut features that don't add end-to-end value)
- Shipping (if it's not usable, it's not done)

**Example: Phase 1 (Notes)**
- User can create, edit, delete notes → Usable
- User can search notes → Usable
- User can't customize categories → Not necessary for usability

**Example: Phase 2 (Browser)**
- User can see which websites they visited → Usable
- User can close tabs from dashboard → Usable
- User can't export browser history as CSV → Not necessary for usability

## Principle 9: No Premature Optimization

**Rule:** Make it work. Make it right. Make it fast. In that order.

**Apply when:**
- Someone says "but what if there are 1 million notes?" (Build for 10,000, optimize if you hit 100k)
- Choosing between two approaches (pick the readable one first)
- Reviewing code (don't block on micro-optimizations)

**Example: Right Way**
```
1. Implement search with simple SQLite LIKE query
2. Test with 5000 notes (fast? Done. Slow? Measure.)
3. If slow, add FTS5 index
4. Re-measure (faster? Done. Still slow? Investigate.)
```

## Principle 10: Technical Debt is a Debt

**Rule:** Every shortcut you take must be explicitly documented and have a payoff date.

**Apply when:**
- Someone says "let's just hardcode this" (document it, create a task to fix it)
- You're under time pressure (take the debt, but pay it back soon)
- Choosing between "right" and "quick" (pick quick, but document the right way)

**Example:**
```
// Technical debt: hardcoded category mapping
// TODO: Move to database table by end of Phase 2
const CATEGORY_MAP = { ... }
```

---

## Decision Tree

**When in doubt, follow this:**

```
Does the feature require polling?
  → Yes? Redesign it as event-driven
  → No? Continue

Will it add idle CPU/battery drain?
  → Yes? Cut it from this phase
  → No? Continue

Can we build it without a new dependency?
  → Yes? Build it
  → No? Do we understand the dependency? 
      → No? Learn it first
      → Yes? Use it

Is the UI defined?
  → No? Design it first
  → Yes? Continue

Are tests written?
  → No? Write them first
  → Yes? Continue

Is this the only thing we're building this phase?
  → No? Scope it for next phase
  → Yes? Build it
```

---

## Review Checklist

Every pull request must pass:

- [ ] Is this feature complete (not waiting for another feature)?
- [ ] Does it match the UI spec?
- [ ] Are tests written and passing (>80% coverage)?
- [ ] Does it use the event system (no polling)?
- [ ] Will it measurably impact idle resources? (If yes, investigate)
- [ ] Is it documented?
- [ ] Can a user actually use this feature end-to-end?
- [ ] Is any technical debt documented with a payoff date?

---

Next: Read **02-build-order.md** for the phase-by-phase breakdown.
