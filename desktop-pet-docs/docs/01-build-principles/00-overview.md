# Build Principles — Overview

> **Status: 🔒 LOCKED** — v1.0, 2026-10-02. Changes require a written amendment at the bottom of this file.

**Loaf is built one small feature at a time. Never ship big features. Ship small, complete, tested, usable pieces.**

This document set provides the operational playbook for building Loaf from foundation through full product.

## Core Philosophy

1. **UI First** — Define every UI component and interaction before touching backend
2. **Tests Early** — Write tests alongside code, not after
3. **Learn Fundamentals** — Understand the system before optimizing it
4. **One Feature at a Time** — Complete, test, and verify before moving to the next
5. **Usable at Every Phase** — The product should work and be useful at each milestone
6. **Local Data First** — All features start with local storage; cloud comes later
7. **Event-Driven Always** — Every feature uses the event system; no polling shortcuts

## What This Means

- **Phase 1** (Notes) should take 2–4 weeks and result in a complete, usable notes app
- **Phase 2** (Browser) should be independently useful; it doesn't depend on Phase 1 being perfect
- **Each phase has UI, backend, tests, and documentation ready before code ships**
- **Code review focuses on: Does this match the UI design? Are tests sufficient? Is it event-driven?**

## How to Use These Documents

1. **Read 00-overview.md** (this file) to understand the approach
2. **Read 01-core-principles.md** for decision-making rules
3. **Read 02-build-order.md** before starting a new phase
4. **Read 03-ui-first.md** before designing any feature
5. **Read 04-testing-strategy.md** before writing code
6. **Read 05-learning-fundamentals.md** when you hit architectural questions
7. **Keep 06-feature-definition.md** open while coding (it's your checklist)
8. **Reference 07-11.md** as needed for specific decisions (08, 10, 11 are ⏸ ON HOLD until Phase 0)

## What Not to Do

- ❌ Build backend without UI definition
- ❌ Write code without tests in place
- ❌ Skip fundamentals to use a library immediately
- ❌ Build multiple features in parallel
- ❌ Leave testing for the end
- ❌ Assume "we'll refactor later"
- ❌ Optimize before measuring
- ❌ Add features to a phase after it starts

## Build Health Checkpoints

Every phase ends with verification:

```
Phase Complete When:
├─ UI is defined and reviewed
├─ All acceptance criteria met
├─ Test coverage >80%
├─ No performance regressions
├─ Documentation is current
├─ Product is usable end-to-end
└─ All technical debt logged with a payoff date (Principle 10)
```

---

Next: Read **01-core-principles.md** for decision-making rules.
