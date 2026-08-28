# Finance App — Technical Design

**Date:** 2026-08-28
**Status:** Approved
**Source of truth for product/UX/data-model/screens:** `MASTER_SPEC.md` (repo root). This document only covers technical/architectural decisions not already fixed by that spec.

## 1. Purpose

`MASTER_SPEC.md` fully specifies the product (25+ screens, visual identity, data model, API surface, MVP phase order). This document records the engineering decisions needed to start building: repo layout, tech stack, the local-first sync architecture, backend structure, and how work will be delivered across phases.

## 2. Repo layout (monorepo)

```
C:\Budget_app/
├── MASTER_SPEC.md
├── docs/superpowers/specs/        # design docs, implementation plans
├── mobile/                        # Flutter app
└── backend/                       # Laravel API
```
Single git repository. Mobile and backend are versioned together; each has its own dependency manifest (`pubspec.yaml`, `composer.json`) and its own test suite.

## 3. Mobile stack (Flutter)

- **State management / DI:** Riverpod (`flutter_riverpod`, `riverpod_annotation` + `riverpod_generator`). Providers wrap repositories; UI never talks to drift or dio directly.
- **Local persistence:** `drift` (+ `sqflite` as its backend). Reactive, type-safe queries; Riverpod providers `watch()` drift streams so UI updates automatically when local rows change (including after a background sync). Every mutable table carries `sync_state` (`pending` | `synced` | `failed`) and a nullable `server_id`.
- **HTTP:** `dio`, with interceptors for: attaching the bearer token, retry-with-backoff on network failure, and centralized 401 handling (clear token → route to Login).
- **Auth token storage:** `flutter_secure_storage`.
- **Routing:** `go_router`, declarative, one route per screen in §2 of the master spec; some (add expense/income/transfer, quick actions) are `ShowModalBottomSheet`/glass bottom sheets per the spec's own allowance.
- **Charts:** `fl_chart` for donut (spending distribution) and line/bar (spending evolution).
- **Fonts:** `google_fonts` (Inter).
- **Folder structure:** exactly `lib/core`, `lib/features/<feature>`, `lib/shared` as laid out in master spec §35. Each feature folder contains its own `data/` (repository + drift tables), `domain/` (models, business logic e.g. daily-recommendation calculator), and `presentation/` (screens, widgets, providers) sub-folders. No business logic in widgets.

## 4. Backend stack (Laravel)

- **Framework:** latest stable Laravel, PHP 8.4 (already installed).
- **Dev database:** SQLite (`database/database.sqlite`), zero local server setup, per master spec §38.
- **Auth:** Laravel Sanctum, personal access tokens.
- **Request flow:** Route → Form Request (validation) → Controller (thin) → Action/Service class (business rules — allocation suggestion, daily recommendation, "can I afford it" evaluator) → API Resource (response shaping).
- **Response envelope:** `{"data": ..., "message": ...}` on success, `{"message": ..., "errors": {...}}` on validation failure, per master spec §43. Enforced via a base `ApiResponse` trait/helper used by all controllers, not repeated ad hoc.
- **DB portability:** migrations written with Laravel's schema builder only (no raw SQLite-specific SQL), so switching `DB_CONNECTION` to `pgsql`/`mysql` in production (master spec §39) requires no migration changes.
- **Testing:** Laravel's default PHPUnit (feature tests per endpoint: request → response shape → DB state).

## 5. Money representation

XOF has no minor currency unit in everyday use ("50 000 F", never "50 000.00"). All amounts (`transactions.amount`, `budgets.amount`, `savings_goals.target_amount`/`current_amount`) are stored and transmitted as **integers** (whole francs), both in SQLite/drift and in the Laravel DB/API. This avoids float-rounding bugs in budget/statistics aggregation and matches the display format mandated in §44. Display formatting (`125 430 F`, thousands-space-separated) is a pure presentation-layer concern (a `MoneyFormatter` utility in `core/utils`), never baked into stored values.

## 6. Local-first data flow & sync

```
Flutter UI
   ↕ (Riverpod providers)
Repository (per feature)
   ↕
drift (SQLite) — source of truth for the UI, always read/written first
   ↕
SyncService — background, triggered on connectivity-restore + app-resume
   ↕ (dio)
Laravel API
   ↕
DB (SQLite dev / Postgres|MySQL prod) — source of truth for the system
```

- Every write (add/edit/delete expense, income, transfer, budget, savings contribution, etc.) is written to drift **immediately** with `sync_state = pending`, so the UI reflects it instantly regardless of connectivity (master spec §41).
- `SyncService` pushes pending rows to the API in creation order; on success it stamps `server_id` and sets `sync_state = synced`; on failure (4xx validation) it sets `failed` and surfaces a retry affordance (never silently drops data); on network error it stays `pending` and retries later.
- Pulling server state (e.g. after login, or periodically) reconciles by comparing `updated_at`: if the server row is newer than the local row, the local row is overwritten; if the local row is `pending`/newer, the server pull does not clobber it. This is row-level last-write-wins, which satisfies §41's requirement ("resolve conflicts safely, don't silently overwrite") without building a field-level merge engine, which is explicitly out of scope for MVP.
- Full merge/CRDT-style conflict resolution is a V2+ concern if it ever becomes necessary — not built now (YAGNI).

## 7. Error / loading / empty states

Three shared widgets (`LoadingState`, `ErrorState`, `EmptyState` in `shared/widgets`) are built in Phase 1 alongside the theme, and every feature screen from Phase 1 onward uses them — not retrofitted later. `ErrorState` always renders a human-readable message (mapped from exception type, e.g. `DioException.connectionError` → "Impossible de synchroniser vos données. Vérifiez votre connexion Internet.") plus a retry button, never a raw exception string (§50).

## 8. Delivery plan (phase-by-phase, with checkpoints)

Per user decision: build one phase fully, run `flutter analyze` + `flutter test` (mobile) and `php artisan test` (backend), report results, then proceed to the next phase only after that checkpoint. Phases follow master spec §51 exactly:

1. **Foundation** — Flutter scaffold, theme (colors/typography/glass components), go_router shell + bottom nav shell, Splash/Onboarding(x3)/Login/Register/Forgot-password screens; Laravel scaffold, SQLite dev DB, User model/migration, `/api/register`, `/api/login`, `/api/logout` wired end-to-end with Sanctum (real login from the Flutter app hits the real API).
2. **Core finance** — accounts, categories, income, expenses, transactions (list/detail/add), dashboard.
3. **Budget** — monthly budgets, progress bars, daily recommendation, alerts.
4. **Analytics** — statistics screen, donut/line/bar charts, category analysis.
5. **Savings** — savings goals CRUD, contributions, progress visualization.
6. **Sync** — drift sync_state plumbing, SyncService, offline queue, conflict handling (note: basic local-write-first behavior is actually built incrementally per feature in Phases 2-5, since it can't be bolted on after the fact; Phase 6 is where the background push/pull loop, retry, and connectivity-triggered sync are wired end-to-end and tested against real offline scenarios).
7. **Production** — Laravel Cloud prep, env-based DB config, HTTPS, release build.

Each phase gets its own implementation plan (via the writing-plans skill) at the time it starts, rather than one giant plan for all 7 phases up front — later phases may need adjustment based on what Phase 1-N actually produced.

## 9. Explicitly out of scope for MVP (per master spec §52/§53)

"Puis-je me permettre ça ?", recurring expenses/income, smart notifications beyond basic budget-threshold alerts, CSV/PDF export, biometric lock, spending predictions, shared budgets, AI assistant. Not built until MVP (Phases 1-7) is stable.
