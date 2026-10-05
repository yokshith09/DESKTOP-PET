# Feature Specs — CP1 Foundation (Phase 0)

Written from the template in `docs/01-build-principles/06-feature-definition.md`. IDs and sizes are authoritative in `docs/06-plan/implementation-plan.md`. Build in this order — each depends only on those above it.

| Order | ID | Feature | Days | Status |
|------:|----|---------|-----:|--------|
| 1 | [F0-01](F0-01-scaffold.md) | Tauri v2 + React/TS/Vite scaffold, V-1 | 1.5 | READY |
| 2 | [F0-02](F0-02-ci-and-v2.md) | CI matrix and preliminary V-2 RAM measurement | 1.5 | DRAFT* |
| 3 | [F0-13](F0-13-errors-and-logging.md) | Error model, tracing logs, panic hook | 1.0 | DRAFT* |
| 4 | [F0-03](F0-03-event-bus.md) | Event enum, broadcast bus, lag handling | 1.5 | DRAFT* |
| 5 | [F0-04](F0-04-db-and-migrations.md) | Database open, PRAGMAs, migration runner, migration 001 | 1.5 | DRAFT* |
| 6 | [F0-05](F0-05-db-writer.md) | DB writer thread, read pool, publish-after-commit | 1.5 | DRAFT* |
| 7 | [F0-06](F0-06-clock-and-rollover.md) | Clock trait and day-rollover scheduler | 2.0 | DRAFT* |
| 8 | [F0-07](F0-07-settings-and-ipc.md) | Settings and preferences services, IPC, TypeScript types | 1.5 | DRAFT* |
| 9 | [F0-08](F0-08-tray-and-lifecycle.md) | Tray, single instance, close-hides, quit | 1.0 | DRAFT* |
| 10 | [F0-09](F0-09-autostart.md) | Autostart with --hidden | 0.5 | DRAFT* |
| 11 | [F0-10](F0-10-frontend-shell.md) | Frontend shell: sidebar, router, tokens, theme, contrast check | 2.0 | DRAFT* |
| 12 | [F0-11](F0-11-data-export-import-delete.md) | Export, import (empty workspace), delete all | 2.5 | DRAFT* |
| 13 | [F0-12](F0-12-perf-harness.md) | Performance harness and final V-2, V-3, V-5 | 2.0 | DRAFT* |

\* **DRAFT** here means the spec is complete against every Definition of Ready item except "dependencies are DONE". Each flips to READY when its dependencies are DONE; no open questions remain in any of them.

CP1 total: 20.0 relative dev-days. Cancelled or changed: V-4 (FTS5 benchmark) withdrawn with search; V-2 gets a preliminary measurement in F0-02 (ADR-018).
