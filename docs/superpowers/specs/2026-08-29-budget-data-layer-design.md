# Budget — Data Layer Design

**Date:** 2026-08-29
**Status:** Approved
**Scope:** Backend + local cache + repository/store plumbing for Budget only. No UI screen, no navigation, no components. The dedicated Budget screen is a separate future sub-project that will consume this layer directly.

## 1. Purpose

Accounts, categories, and transactions already have a full vertical slice (migration → model → FormRequests → Resource → Controller → routes → tests on the backend; SQLite cache → api → repository → Zustand store on React Native). Budget needs the same treatment so that Home, Statistics, and the future Budget screen can all read/write real budget data instead of hardcoded values.

This sub-project follows the existing `Account`/`Category`/`Transaction` patterns exactly — no new architecture is introduced.

## 2. Business concept

- **Account** — where the user's real money sits (Cash, Orange Money, Bank, ...).
- **Transaction** — a manual movement of money (income/expense/transfer).
- **Budget** — a manually-defined spending envelope/limit. Not tied to an account. Optionally tied to a category (`category_id = null` means the global monthly budget).

Example:
```
Budget global: 50 000 F
Transactions: -5 000 (Essence), -8 000 (Nourriture), -2 500 (Transport)
→ Dépensé: 15 500 F, Restant: 34 500 F, Utilisation: 31 %
```

A budget is a **permanent envelope**, not a per-month record: there is one active budget per `(user_id, category_id)`. It recalculates automatically against the current calendar month's transactions rather than being recreated every month. Editing a budget only ever changes its `amount`.

## 3. Backend (Laravel)

### Migration — `budgets` table

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users, cascade delete | |
| category_id | FK → categories, nullable | `null` = global budget |
| amount | integer | XOF, whole francs, > 0 |
| period | string, default `monthly` | only `monthly` accepted for MVP |
| created_at/updated_at | timestamps | |

Index on `user_id`.

### Uniqueness rule

One active budget per `(user_id, category_id)`, **including** the global case (`category_id = null`). A standard SQL `UNIQUE` index does not enforce this correctly for repeated `NULL`s (Postgres/MySQL/SQLite all treat `NULL <> NULL` in unique indexes), so this is enforced as an **application-level validation rule** inside `StoreBudgetRequest` (query for an existing budget matching the same user and same `category_id`, including the `whereNull` case, and fail validation if found).

### Model — `Budget`

- `belongsTo(User::class)`
- `belongsTo(Category::class)` (nullable)
- `fillable`: `user_id`, `category_id`, `amount`, `period`
- casts: `amount` → integer

### FormRequests

- **StoreBudgetRequest**: `category_id` nullable, must belong to the authenticated user when present; `amount` required integer `min:1`; `period` must be `monthly` (defaulted if absent); custom rule rejecting a duplicate `(user_id, category_id)` pair.
- **UpdateBudgetRequest**: only `amount` is accepted/validated (required integer `min:1`). `user_id`, `category_id`, and `period` are immutable after creation for the MVP.

### Resource — `BudgetResource`

Returns `id`, `category_id`, `amount`, `period`, `created_at` only. **No** `spent`/`remaining`/`percent`/`status` — see §5.

### Controller — `BudgetController`

`index`, `store`, `update`, `destroy` (no `show`), mirroring `AccountController`: ownership check (`abort(404)` on mismatch), `ApiResponse` trait for consistent envelopes, French user-facing messages.

### Routes

```php
Route::apiResource('budgets', BudgetController::class)->except(['show']);
```
Inside the existing `auth:sanctum` group, alongside accounts/categories/transactions.

### Factory & tests

`BudgetFactory` with states for a global budget and a category budget, realistic XOF amounts, `period = 'monthly'`.

`tests/Feature/Budgets/BudgetTest.php`, mirroring `AccountTest.php`'s structure, covering:
1. list budgets (scoped to the authenticated user)
2. create a global budget
3. create a category budget
4. reject a duplicate global budget
5. reject a duplicate category budget
6. update the amount
7. delete
8. cross-user isolation (cannot read/update/delete another user's budget)
9. cannot create a budget against another user's category
10. amount validation (required, integer, > 0)
11. period validation (only `monthly` accepted)
12. authentication required on every endpoint

All tests green before moving to the React Native side.

## 4. React Native

Mirrors the `accounts` feature exactly.

### SQLite cache (`core/database/appDatabase.ts`)

- New `local_budgets` table: `id`, `category_id` (nullable), `amount`, `period`, `sync_state`.
- `CachedBudget` interface.
- `replaceBudgets`, `upsertBudget`, `deleteBudget`, `getCachedBudgets`.

### Shared model (`shared/models/appBudget.ts`)

`AppBudget { id, categoryId: number | null, amount, period }` + `appBudgetFromJson`.

### Data layer (`features/budgets/data/`)

- `budgetsApi.ts` — `list`, `create`, `update`, `remove` (axios + `toApiError`), mirroring `accountsApi.ts`.
- `budgetsRepository.ts` — `getCached`, `refresh`, `create`, `update`, `remove`, mirroring `accountsRepository.ts`.

### State layer (`features/budgets/state/`)

- `budgetsStore.ts` — Zustand store: `budgets`, `isLoading`, `isSubmitting`, `error`, `loadCached`, `refresh`, `create`, `update`, `remove`, `clearError`. Mirrors `accountsStore.ts`.
- `budgetsStoreInstance.ts` — wiring (shared `secureStorageService`/api client/db), mirrors `accountsStoreInstance.ts`.

### Domain calculation (`features/budgets/domain/budgetProgress.ts`)

A pure, framework-free function, the single source of truth for turning a budget + the already-cached transactions into display numbers — reused later by Home, Statistics, and the Budget screen so calculation logic never diverges between screens:

```ts
function computeBudgetProgress(
  budget: AppBudget,
  transactions: AppTransaction[],
  referenceDate: Date
): { spent: number; remaining: number; percent: number; status: 'normal' | 'attention' | 'depassement' }
```

- Considers only `type === 'expense'` transactions whose `date` falls within the calendar month of `referenceDate`.
- Global budget (`categoryId === null`): sums all matching expense transactions regardless of category.
- Category budget: sums only expense transactions with a matching `categoryId`.
- `remaining = amount - spent` (can go negative).
- `percent = round(spent / amount * 100)`.
- `status`: `normal` (< 80%), `attention` (80–100%), `depassement` (> 100%).

### Tests

- `budgetsRepository`/`budgetsStore` tests mirroring the accounts equivalents (cache, refresh, create/update/remove, error surfacing).
- `budgetProgress` unit tests: global budget, category budget, under/at/over threshold boundaries, transactions outside the current month excluded, transfer/income transactions excluded.

## 5. Why no `spent`/`remaining` in the API

The single source of truth for money movements is `Transaction`. Statistics, Home, and Budget must all derive their numbers from the same transaction set using the same logic. Computing spent/remaining server-side would create a second implementation of the same arithmetic (Laravel PHP vs. the RN `budgetProgress` util) that could silently drift apart. The backend therefore only ever stores the envelope definition (`amount`, `category_id`, `period`); every screen computes progress locally from cached transactions via `computeBudgetProgress`.

## 6. Out of scope (explicitly deferred)

- Budget screen UI, navigation entry, and components.
- Home/Statistics wiring to budgets (separate sub-projects, come first).
- Weekly/yearly budget periods.
- Cross-validation between category budgets and the global budget total.
