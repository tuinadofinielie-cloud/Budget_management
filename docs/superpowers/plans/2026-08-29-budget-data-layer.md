# Budget Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Budget vertical slice (Laravel migration/model/API + React Native SQLite cache/repository/Zustand store + a pure progress-calculation util) so Home, Statistics, and a future Budget screen can all read/write real budget data — with zero UI work in this plan.

**Architecture:** Mirror the existing `Account` vertical slice exactly on both sides. Backend: migration → model → FormRequests → Resource → Controller → routes → feature tests. React Native: SQLite table/CRUD → shared model → api → repository → Zustand store, plus a new framework-free `budgetProgress` calculator that turns a budget + cached transactions into spent/remaining/percent/status (the one and only place this arithmetic lives, so Home/Statistics/Budget never compute it differently).

**Tech Stack:** Laravel 11 (PHP 8.4, Sanctum, PHPUnit), React Native + Expo + TypeScript, Zustand, expo-sqlite, axios, Jest.

**Spec:** `docs/superpowers/specs/2026-08-29-budget-data-layer-design.md`

## Global Constraints

- `amount` is always a whole-franc integer (XOF) — never a float. Applies to migration column type, model casts, TS types, and every test fixture.
- `period` only ever accepts the literal string `'monthly'` for this MVP — reject anything else server-side.
- `category_id = null` means the global budget; `category_id != null` means a per-category budget. Exactly one budget per `(user_id, category_id)` pair (including the `null` case) — enforced in `StoreBudgetRequest`, not the DB schema.
- `UpdateBudgetRequest` accepts and validates `amount` only — `user_id`, `category_id`, `period` are immutable after creation.
- Backend `BudgetResource` returns only `id`, `category_id`, `amount`, `period`, `created_at` — never `spent`/`remaining`/`percent`/`status`. All progress math lives client-side in `budgetProgress.ts`, computed from cached transactions, so Laravel and React Native never implement the same arithmetic twice.
- Follow the `Account`/`Category`/`Transaction` patterns already in the repo exactly — no new architecture, no new libraries.
- User-facing strings are French, matching existing controllers (e.g. `'Compte créé avec succès.'`).
- **No UI work**: no Budget screen, no navigation entry, no components. This plan only produces backend + data-layer code consumable by a future screen.
- Backend commands run from `backend/`; React Native commands run from `appReact/`.

---

### Task 1: Budget migration, model, and factory (backend)

**Files:**
- Create: `backend/database/migrations/2026_08_29_060000_create_budgets_table.php`
- Create: `backend/app/Models/Budget.php`
- Create: `backend/database/factories/BudgetFactory.php`
- Modify: `backend/app/Models/User.php`

**Interfaces:**
- Produces: `Budget` model with `fillable = ['user_id', 'category_id', 'amount', 'period']`, `belongsTo(User::class)`, `belongsTo(Category::class)`; `User::budgets(): HasMany`; `Budget::factory()` with a sensible default definition.

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('amount');
            $table->string('period')->default('monthly');
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
```

- [ ] **Step 2: Write the model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'amount',
        'period',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
```

- [ ] **Step 3: Add the inverse relation to `User`**

In `backend/app/Models/User.php`, add alongside the existing `accounts()`/`categories()`/`transactions()` methods:

```php
    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }
```

- [ ] **Step 4: Write the factory**

```php
<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BudgetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => null,
            'amount' => fake()->randomElement([20000, 30000, 50000, 75000, 100000]),
            'period' => 'monthly',
        ];
    }
}
```

- [ ] **Step 5: Run the migration and the existing suite to confirm no regressions**

Run: `php artisan migrate` (from `backend/`)
Expected: `2026_08_29_060000_create_budgets_table` migrates successfully, no errors.

Run: `php artisan test --compact`
Expected: all existing tests still pass (Budget has no behavior yet, so nothing new to assert here — this is a regression check).

- [ ] **Step 6: Commit**

```bash
git add backend/database/migrations/2026_08_29_060000_create_budgets_table.php backend/app/Models/Budget.php backend/database/factories/BudgetFactory.php backend/app/Models/User.php
git commit -m "feat(backend): add Budget model, migration, and factory"
```

---

### Task 2: Budget FormRequests with the uniqueness rule

**Files:**
- Create: `backend/app/Http/Requests/Budgets/StoreBudgetRequest.php`
- Create: `backend/app/Http/Requests/Budgets/UpdateBudgetRequest.php`

**Interfaces:**
- Consumes: `App\Models\Budget` (Task 1).
- Produces: `StoreBudgetRequest::rules()`/`withValidator()`, `UpdateBudgetRequest::rules()`, both used by `BudgetController` in Task 3.

- [ ] **Step 1: Write `StoreBudgetRequest`**

```php
<?php

namespace App\Http\Requests\Budgets;

use App\Models\Budget;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],
            'amount' => ['required', 'integer', 'min:1'],
            'period' => ['sometimes', Rule::in(['monthly'])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $duplicate = Budget::query()
                ->where('user_id', $this->user()->id)
                ->where('category_id', $this->input('category_id'))
                ->exists();

            if ($duplicate) {
                $validator->errors()->add(
                    'category_id',
                    $this->input('category_id')
                        ? 'Un budget existe déjà pour cette catégorie.'
                        : 'Un budget global existe déjà.'
                );
            }
        });
    }
}
```

`where('category_id', null)` — Laravel's query builder automatically rewrites a `where($column, null)` call into `whereNull($column)`, so this correctly matches existing global budgets too, not just category ones.

- [ ] **Step 2: Write `UpdateBudgetRequest`**

```php
<?php

namespace App\Http\Requests\Budgets;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:1'],
        ];
    }
}
```

Only `amount` has a rule, so `$request->validated()` can never contain `user_id`, `category_id`, or `period` even if a client sends them.

- [ ] **Step 3: Verify the project still boots cleanly**

Run: `php artisan route:list --path=api` (from `backend/`)
Expected: unchanged — these are plain FormRequest classes, not wired to routes yet (Task 3 does that). This step just confirms no syntax error broke Artisan's bootstrap.

- [ ] **Step 4: Commit**

```bash
git add backend/app/Http/Requests/Budgets/StoreBudgetRequest.php backend/app/Http/Requests/Budgets/UpdateBudgetRequest.php
git commit -m "feat(backend): add Budget FormRequests with uniqueness validation"
```

---

### Task 3: BudgetResource, BudgetController, and routes

**Files:**
- Create: `backend/app/Http/Resources/BudgetResource.php`
- Create: `backend/app/Http/Controllers/Api/BudgetController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `Budget` model (Task 1), `StoreBudgetRequest`/`UpdateBudgetRequest` (Task 2), `App\Support\ApiResponse` trait (existing).
- Produces: `GET/POST /api/budgets`, `PUT/DELETE /api/budgets/{budget}`, all under `auth:sanctum`, consumed by Task 4's tests and, later, the RN `budgetsApi.ts` (Task 6).

- [ ] **Step 1: Write `BudgetResource`**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'amount' => $this->amount,
            'period' => $this->period,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 2: Write `BudgetController`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budgets\StoreBudgetRequest;
use App\Http\Requests\Budgets\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $budgets = $request->user()->budgets()->orderByDesc('created_at')->get();

        return $this->success(BudgetResource::collection($budgets));
    }

    public function store(StoreBudgetRequest $request)
    {
        $budget = $request->user()->budgets()->create([
            'category_id' => $request->validated('category_id'),
            'amount' => $request->validated('amount'),
            'period' => $request->validated('period', 'monthly'),
        ]);

        return $this->success(new BudgetResource($budget), 'Budget créé avec succès.', 201);
    }

    public function update(UpdateBudgetRequest $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(404);
        }

        $budget->update($request->validated());

        return $this->success(new BudgetResource($budget), 'Budget mis à jour avec succès.');
    }

    public function destroy(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(404);
        }

        $budget->delete();

        return $this->success(null, 'Budget supprimé avec succès.');
    }
}
```

- [ ] **Step 3: Wire the routes**

In `backend/routes/api.php`, add the import next to the other controller imports:

```php
use App\Http\Controllers\Api\BudgetController;
```

And inside the existing `Route::middleware('auth:sanctum')->group(function () { ... })` block, alongside `accounts`/`categories`/`transactions`:

```php
    Route::apiResource('budgets', BudgetController::class)->except(['show']);
```

- [ ] **Step 4: Verify the routes are registered**

Run: `php artisan route:list --path=api/budgets` (from `backend/`)
Expected: four rows — `GET|HEAD api/budgets`, `POST api/budgets`, `PUT|PATCH api/budgets/{budget}`, `DELETE api/budgets/{budget}` — each pointing at `BudgetController`.

- [ ] **Step 5: Run Pint since PHP files were modified**

Run: `vendor/bin/pint --dirty --format agent` (from `backend/`)
Expected: no remaining style issues (auto-fixes applied if any).

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Resources/BudgetResource.php backend/app/Http/Controllers/Api/BudgetController.php backend/routes/api.php
git commit -m "feat(backend): add Budget resource, controller, and routes"
```

---

### Task 4: Backend feature tests for Budget

**Files:**
- Create: `backend/tests/Feature/Budgets/BudgetTest.php`

**Interfaces:**
- Consumes: everything from Tasks 1–3 (`Budget`, `BudgetFactory`, `/api/budgets` routes).
- Produces: a green `BudgetTest` suite — the contract the RN `budgetsApi`/`budgetsRepository` (Task 6) are written against.

- [ ] **Step 1: Write the full test file**

```php
<?php

namespace Tests\Feature\Budgets;

use App\Models\Budget;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_only_the_authenticated_users_budgets(): void
    {
        $user = User::factory()->create();
        Budget::factory()->for($user)->create(['amount' => 50000]);
        Budget::factory()->create(['amount' => 99999]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/budgets');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.amount', 50000);
    }

    public function test_it_creates_a_global_budget(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'amount' => 50000,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.category_id', null)
            ->assertJsonPath('data.amount', 50000)
            ->assertJsonPath('data.period', 'monthly');

        $this->assertDatabaseHas('budgets', [
            'user_id' => $user->id,
            'category_id' => null,
            'amount' => 50000,
        ]);
    }

    public function test_it_creates_a_category_budget(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 20000,
        ]);

        $response->assertStatus(201)->assertJsonPath('data.category_id', $category->id);

        $this->assertDatabaseHas('budgets', [
            'user_id' => $user->id,
            'category_id' => $category->id,
            'amount' => 20000,
        ]);
    }

    public function test_it_rejects_a_duplicate_global_budget(): void
    {
        $user = User::factory()->create();
        Budget::factory()->for($user)->create(['category_id' => null, 'amount' => 50000]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'amount' => 60000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_it_rejects_a_duplicate_category_budget(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->create();
        Budget::factory()->for($user)->create(['category_id' => $category->id, 'amount' => 20000]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'category_id' => $category->id,
            'amount' => 25000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_it_updates_a_budgets_amount(): void
    {
        $user = User::factory()->create();
        $budget = Budget::factory()->for($user)->create(['amount' => 50000]);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/budgets/{$budget->id}", [
            'amount' => 65000,
        ]);

        $response->assertStatus(200)->assertJsonPath('data.amount', 65000);
        $this->assertDatabaseHas('budgets', ['id' => $budget->id, 'amount' => 65000]);
    }

    public function test_it_deletes_a_budget(): void
    {
        $user = User::factory()->create();
        $budget = Budget::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/budgets/{$budget->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('budgets', ['id' => $budget->id]);
    }

    public function test_it_rejects_updating_another_users_budget(): void
    {
        $user = User::factory()->create();
        $otherBudget = Budget::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/budgets/{$otherBudget->id}", [
            'amount' => 1000,
        ]);

        $response->assertStatus(404);
    }

    public function test_it_rejects_deleting_another_users_budget(): void
    {
        $user = User::factory()->create();
        $otherBudget = Budget::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/budgets/{$otherBudget->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('budgets', ['id' => $otherBudget->id]);
    }

    public function test_it_rejects_creating_a_budget_with_another_users_category(): void
    {
        $user = User::factory()->create();
        $otherCategory = Category::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'category_id' => $otherCategory->id,
            'amount' => 20000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_it_validates_the_amount(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'amount' => 0,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('amount');
    }

    public function test_it_only_accepts_the_monthly_period(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/budgets', [
            'amount' => 20000,
            'period' => 'weekly',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('period');
    }

    public function test_it_requires_authentication(): void
    {
        $response = $this->getJson('/api/budgets');

        $response->assertStatus(401);
    }
}
```

- [ ] **Step 2: Run the suite and fix anything red**

Run: `php artisan test tests/Feature/Budgets/BudgetTest.php --compact` (from `backend/`)
Expected: all 13 tests pass. If any fail, the likely culprits are: the `where('category_id', ...)` null-handling in `StoreBudgetRequest` (Task 2, Step 1), or a missing `abort(404)` ownership check in `BudgetController` (Task 3, Step 2) — fix the referenced file, don't change the test.

- [ ] **Step 3: Run the full backend suite to confirm no regressions**

Run: `php artisan test --compact` (from `backend/`)
Expected: all tests pass, including the new Budget ones.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/Feature/Budgets/BudgetTest.php
git commit -m "test(backend): add Budget feature test suite"
```

---

### Task 5: SQLite cache for budgets (React Native)

**Files:**
- Modify: `appReact/src/core/database/appDatabase.ts`
- Modify: `appReact/src/core/database/__tests__/appDatabase.test.ts`

**Interfaces:**
- Produces: `CachedBudget { id: number; category_id: number | null; amount: number; period: string }`, and `AppDatabase.replaceBudgets(budgets: CachedBudget[]): Promise<void>`, `.upsertBudget(budget: CachedBudget): Promise<void>`, `.deleteBudget(id: number): Promise<void>`, `.getCachedBudgets(): Promise<CachedBudget[]>` — consumed by `budgetsRepository.ts` in Task 6.

- [ ] **Step 1: Write the failing tests**

In `appReact/src/core/database/__tests__/appDatabase.test.ts`, first register `local_budgets` in the in-memory fake so it exists as a table (in the `InMemorySqliteExecutor` class near the top of the file):

```ts
  private tables: Record<string, Map<number, any>> = {
    local_users: new Map(),
    local_accounts: new Map(),
    local_categories: new Map(),
    local_transactions: new Map(),
    local_budgets: new Map(),
  };

  private static COLUMNS: Record<string, string[]> = {
    local_users: ['id', 'name', 'email', 'currency', 'avatar'],
    local_accounts: ['id', 'name', 'type', 'balance', 'currency'],
    local_categories: ['id', 'name', 'icon', 'color', 'type'],
    local_transactions: ['id', 'type', 'amount', 'category_id', 'account_id', 'to_account_id', 'description', 'date'],
    local_budgets: ['id', 'category_id', 'amount', 'period'],
  };
```

Then append this new `describe` block at the end of the file:

```ts
describe('AppDatabase — budgets', () => {
  it('replaceBudgets clears and repopulates the local cache', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.replaceBudgets([{ id: 1, category_id: null, amount: 50000, period: 'monthly' }]);
    await database.replaceBudgets([{ id: 2, category_id: 3, amount: 20000, period: 'monthly' }]);

    const budgets = await database.getCachedBudgets();
    expect(budgets).toHaveLength(1);
    expect(budgets[0].category_id).toBe(3);
  });

  it('upsertBudget adds a single budget without clearing the rest', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.replaceBudgets([{ id: 1, category_id: null, amount: 50000, period: 'monthly' }]);

    await database.upsertBudget({ id: 2, category_id: 3, amount: 20000, period: 'monthly' });

    expect(await database.getCachedBudgets()).toHaveLength(2);
  });

  it('deleteBudget removes a single budget', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.replaceBudgets([{ id: 1, category_id: null, amount: 50000, period: 'monthly' }]);

    await database.deleteBudget(1);

    expect(await database.getCachedBudgets()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest appDatabase --watchAll=false` (from `appReact/`)
Expected: FAIL — `database.replaceBudgets is not a function`.

- [ ] **Step 3: Implement the cache methods**

In `appReact/src/core/database/appDatabase.ts`, add the interface next to `CachedTransaction`:

```ts
export interface CachedBudget {
  id: number;
  category_id: number | null;
  amount: number;
  period: string;
}
```

Add the table to `CREATE_TABLES_SQL`, after `local_transactions`:

```sql
CREATE TABLE IF NOT EXISTS local_budgets (
  id INTEGER PRIMARY KEY,
  category_id INTEGER,
  amount INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  sync_state TEXT NOT NULL DEFAULT 'synced'
);
```

Add the methods at the end of the `AppDatabase` class, right before its closing brace:

```ts
  async replaceBudgets(budgets: CachedBudget[]): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_budgets;`);
    for (const budget of budgets) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO local_budgets (id, category_id, amount, period, sync_state) VALUES (?, ?, ?, ?, 'synced');`,
        [budget.id, budget.category_id, budget.amount, budget.period]
      );
    }
  }

  async upsertBudget(budget: CachedBudget): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO local_budgets (id, category_id, amount, period, sync_state) VALUES (?, ?, ?, ?, 'synced');`,
      [budget.id, budget.category_id, budget.amount, budget.period]
    );
  }

  async deleteBudget(id: number): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_budgets WHERE id = ?;`, [id]);
  }

  async getCachedBudgets(): Promise<CachedBudget[]> {
    await this.ready;
    return this.db.getAllAsync<CachedBudget>(
      `SELECT id, category_id, amount, period FROM local_budgets ORDER BY id;`
    );
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest appDatabase --watchAll=false` (from `appReact/`)
Expected: PASS, all `AppDatabase — budgets` tests green, and every pre-existing test in the file still passes.

- [ ] **Step 5: Commit**

```bash
git add appReact/src/core/database/appDatabase.ts appReact/src/core/database/__tests__/appDatabase.test.ts
git commit -m "feat(appReact): add local_budgets table to the SQLite cache"
```

---

### Task 6: Budget shared model, API client, and repository (React Native)

**Files:**
- Create: `appReact/src/shared/models/appBudget.ts`
- Create: `appReact/src/features/budgets/data/budgetsApi.ts`
- Create: `appReact/src/features/budgets/data/budgetsRepository.ts`

**Interfaces:**
- Consumes: `AppDatabase.{replaceBudgets,upsertBudget,deleteBudget,getCachedBudgets}` (Task 5), `toApiError` (`core/services/apiError.ts`, existing).
- Produces: `AppBudget { id: number; categoryId: number | null; amount: number; period: string }`, `appBudgetFromJson(json: any): AppBudget`, `BudgetParams { categoryId?: number | null; amount: number; period?: string }`, `BudgetsApi.{list,create,update,remove}`, `BudgetsRepository.{getCached,refresh,create,update,remove}` — consumed by `budgetsStore.ts` in Task 7.

Note: this codebase does not unit-test the thin `*Api`/`*Repository` classes directly for accounts/categories/transactions either (only the SQLite layer and the Zustand stores that wrap them get test files) — this task follows that same convention, so there is no new test file here. Verification is via type-checking, linting, and the Task 7 store tests that exercise a mocked `BudgetsRepository`.

- [ ] **Step 1: Write the shared model**

```ts
export type BudgetPeriod = 'monthly';

export interface AppBudget {
  id: number;
  categoryId: number | null;
  amount: number;
  period: BudgetPeriod;
}

export function appBudgetFromJson(json: any): AppBudget {
  return {
    id: json.id,
    categoryId: json.category_id,
    amount: json.amount,
    period: json.period,
  };
}
```

- [ ] **Step 2: Write the API client**

```ts
import { AxiosInstance } from 'axios';
import { toApiError } from '../../../core/services/apiError';

export interface BudgetParams {
  categoryId?: number | null;
  amount: number;
  period?: 'monthly';
}

function toPayload(params: BudgetParams) {
  return {
    category_id: params.categoryId ?? null,
    amount: params.amount,
    period: params.period ?? 'monthly',
  };
}

export class BudgetsApi {
  constructor(private http: AxiosInstance) {}

  async list(): Promise<any[]> {
    try {
      const response = await this.http.get('/budgets');
      return response.data?.data ?? [];
    } catch (err) {
      throw toApiError(err);
    }
  }

  async create(params: BudgetParams): Promise<any> {
    try {
      const response = await this.http.post('/budgets', toPayload(params));
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async update(id: number, amount: number): Promise<any> {
    try {
      const response = await this.http.put(`/budgets/${id}`, { amount });
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.http.delete(`/budgets/${id}`);
    } catch (err) {
      throw toApiError(err);
    }
  }
}
```

- [ ] **Step 3: Write the repository**

```ts
import { AppDatabase } from '../../../core/database/appDatabase';
import { AppBudget, BudgetPeriod, appBudgetFromJson } from '../../../shared/models/appBudget';
import { BudgetsApi, BudgetParams } from './budgetsApi';

export class BudgetsRepository {
  constructor(
    private api: BudgetsApi,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async getCached(): Promise<AppBudget[]> {
    const database = await this.getDatabase();
    const rows = await database.getCachedBudgets();
    return rows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      amount: row.amount,
      period: row.period as BudgetPeriod,
    }));
  }

  async refresh(): Promise<AppBudget[]> {
    const raw = await this.api.list();
    const budgets = raw.map(appBudgetFromJson);
    const database = await this.getDatabase();
    await database.replaceBudgets(
      budgets.map((budget) => ({ id: budget.id, category_id: budget.categoryId, amount: budget.amount, period: budget.period }))
    );
    return budgets;
  }

  async create(params: BudgetParams): Promise<AppBudget> {
    const raw = await this.api.create(params);
    const budget = appBudgetFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertBudget({ id: budget.id, category_id: budget.categoryId, amount: budget.amount, period: budget.period });
    return budget;
  }

  async update(id: number, amount: number): Promise<AppBudget> {
    const raw = await this.api.update(id, amount);
    const budget = appBudgetFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertBudget({ id: budget.id, category_id: budget.categoryId, amount: budget.amount, period: budget.period });
    return budget;
  }

  async remove(id: number): Promise<void> {
    await this.api.remove(id);
    const database = await this.getDatabase();
    await database.deleteBudget(id);
  }
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit` (from `appReact/`)
Expected: no errors.

Run: `npx eslint src/features/budgets src/shared/models/appBudget.ts` (from `appReact/`)
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add appReact/src/shared/models/appBudget.ts appReact/src/features/budgets/data
git commit -m "feat(appReact): add Budget shared model, API client, and repository"
```

---

### Task 7: Budget Zustand store (React Native)

**Files:**
- Create: `appReact/src/features/budgets/state/budgetsStore.ts`
- Create: `appReact/src/features/budgets/state/budgetsStoreInstance.ts`
- Create: `appReact/src/features/budgets/state/__tests__/budgetsStore.test.ts`

**Interfaces:**
- Consumes: `BudgetsRepository` (Task 6), `AppBudget`/`BudgetParams` (Task 6), `secureStorageService` + `createApiClient` + `openAppDatabase` (existing, same wiring as `accountsStoreInstance.ts`).
- Produces: `useBudgetsStore` hook with state `{ budgets: AppBudget[]; isLoading: boolean; isSubmitting: boolean; error: string | null }` and actions `loadCached()`, `refresh()`, `create(params)`, `update(id, amount)`, `remove(id)`, `clearError()` — this is what a future Budget screen and Home/Statistics will import.

- [ ] **Step 1: Write the failing test**

```ts
import { createBudgetsStore } from '../budgetsStore';
import { BudgetsRepository } from '../../data/budgetsRepository';
import { AppBudget } from '../../../../shared/models/appBudget';

function makeRepository(overrides: Partial<BudgetsRepository> = {}): BudgetsRepository {
  return {
    getCached: jest.fn().mockResolvedValue([]),
    refresh: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as BudgetsRepository;
}

const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };

describe('budgetsStore', () => {
  it('loadCached populates budgets from the repository cache', async () => {
    const repository = makeRepository({ getCached: jest.fn().mockResolvedValue([budget]) });
    const store = createBudgetsStore(repository);

    await store.getState().loadCached();

    expect(store.getState().budgets).toEqual([budget]);
  });

  it('refresh replaces budgets on success', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockResolvedValue([budget]) });
    const store = createBudgetsStore(repository);

    await store.getState().refresh();

    expect(store.getState().budgets).toEqual([budget]);
    expect(store.getState().isLoading).toBe(false);
  });

  it('refresh surfaces an error on failure', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockRejectedValue(new Error('Hors ligne.')) });
    const store = createBudgetsStore(repository);

    await expect(store.getState().refresh()).rejects.toThrow();

    expect(store.getState().error).toBe('Hors ligne.');
    expect(store.getState().isLoading).toBe(false);
  });

  it('create appends the new budget', async () => {
    const repository = makeRepository({ create: jest.fn().mockResolvedValue(budget) });
    const store = createBudgetsStore(repository);

    await store.getState().create({ amount: 50000 });

    expect(store.getState().budgets).toEqual([budget]);
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('update replaces the matching budget', async () => {
    const updated: AppBudget = { ...budget, amount: 65000 };
    const repository = makeRepository({
      getCached: jest.fn().mockResolvedValue([budget]),
      update: jest.fn().mockResolvedValue(updated),
    });
    const store = createBudgetsStore(repository);
    await store.getState().loadCached();

    await store.getState().update(budget.id, 65000);

    expect(store.getState().budgets).toEqual([updated]);
  });

  it('remove drops the budget from state', async () => {
    const repository = makeRepository({
      getCached: jest.fn().mockResolvedValue([budget]),
      remove: jest.fn().mockResolvedValue(undefined),
    });
    const store = createBudgetsStore(repository);
    await store.getState().loadCached();

    await store.getState().remove(budget.id);

    expect(store.getState().budgets).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest budgetsStore --watchAll=false` (from `appReact/`)
Expected: FAIL — `Cannot find module '../budgetsStore'`.

- [ ] **Step 3: Write the store**

```ts
import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppBudget } from '../../../shared/models/appBudget';
import { BudgetsRepository } from '../data/budgetsRepository';
import { BudgetParams } from '../data/budgetsApi';

export interface BudgetsState {
  budgets: AppBudget[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadCached: () => Promise<void>;
  refresh: () => Promise<void>;
  create: (params: BudgetParams) => Promise<void>;
  update: (id: number, amount: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export function createBudgetsStore(repository: BudgetsRepository): UseBoundStore<StoreApi<BudgetsState>> {
  return create<BudgetsState>((set, get) => ({
    budgets: [],
    isLoading: false,
    isSubmitting: false,
    error: null,

    loadCached: async () => {
      const budgets = await repository.getCached();
      set({ budgets });
    },

    refresh: async () => {
      set({ isLoading: true, error: null });
      try {
        const budgets = await repository.refresh();
        set({ budgets, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    create: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const budget = await repository.create(params);
        set({ budgets: [...get().budgets, budget], isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    update: async (id, amount) => {
      set({ isSubmitting: true, error: null });
      try {
        const budget = await repository.update(id, amount);
        set({
          budgets: get().budgets.map((existing) => (existing.id === id ? budget : existing)),
          isSubmitting: false,
        });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    remove: async (id) => {
      set({ isSubmitting: true, error: null });
      try {
        await repository.remove(id);
        set({ budgets: get().budgets.filter((existing) => existing.id !== id), isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest budgetsStore --watchAll=false` (from `appReact/`)
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Write the store instance wiring**

```ts
import { createApiClient } from '../../../core/services/apiClient';
import { secureStorageService } from '../../auth/state/authStoreInstance';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { BudgetsApi } from '../data/budgetsApi';
import { BudgetsRepository } from '../data/budgetsRepository';
import { createBudgetsStore } from './budgetsStore';

const apiClient = createApiClient(secureStorageService);
const budgetsApi = new BudgetsApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const budgetsRepository = new BudgetsRepository(budgetsApi, getDatabase);

export const useBudgetsStore = createBudgetsStore(budgetsRepository);
```

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit` (from `appReact/`)
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add appReact/src/features/budgets/state
git commit -m "feat(appReact): add Zustand store for budgets"
```

---

### Task 8: Budget progress calculator (React Native)

**Files:**
- Create: `appReact/src/features/budgets/domain/budgetProgress.ts`
- Create: `appReact/src/features/budgets/domain/__tests__/budgetProgress.test.ts`

**Interfaces:**
- Consumes: `AppBudget` (Task 6), `AppTransaction` (existing, `shared/models/appTransaction.ts`).
- Produces: `computeBudgetProgress(budget: AppBudget, transactions: AppTransaction[], referenceDate: Date): BudgetProgress` where `BudgetProgress = { spent: number; remaining: number; percent: number; status: 'normal' | 'attention' | 'depassement' }` — the function a future Home/Statistics/Budget screen will call directly; no other task in this plan consumes it, but it must be exported and fully covered.

- [ ] **Step 1: Write the failing tests**

```ts
import { computeBudgetProgress } from '../budgetProgress';
import { AppBudget } from '../../../../shared/models/appBudget';
import { AppTransaction } from '../../../../shared/models/appTransaction';

const referenceDate = new Date('2026-08-29T00:00:00Z');

function makeTransaction(overrides: Partial<AppTransaction>): AppTransaction {
  return {
    id: 1,
    type: 'expense',
    amount: 1000,
    categoryId: null,
    accountId: 1,
    toAccountId: null,
    description: null,
    date: '2026-08-15',
    ...overrides,
  };
}

describe('computeBudgetProgress', () => {
  it('sums all expense transactions in the current month for a global budget', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000, categoryId: 1 }),
      makeTransaction({ id: 2, amount: 8000, categoryId: 2 }),
      makeTransaction({ id: 3, amount: 2500, categoryId: 3 }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(15500);
    expect(progress.remaining).toBe(34500);
    expect(progress.percent).toBe(31);
    expect(progress.status).toBe('normal');
  });

  it('only sums transactions matching the category for a category budget', () => {
    const budget: AppBudget = { id: 2, categoryId: 5, amount: 20000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 12500, categoryId: 5 }),
      makeTransaction({ id: 2, amount: 9000, categoryId: 6 }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(12500);
    expect(progress.remaining).toBe(7500);
    expect(progress.percent).toBe(63);
  });

  it('excludes transactions from other months', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000, date: '2026-08-15' }),
      makeTransaction({ id: 2, amount: 9000, date: '2026-07-31' }),
      makeTransaction({ id: 3, amount: 1000, date: '2026-09-01' }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(5000);
  });

  it('excludes income and transfer transactions', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000, type: 'expense' }),
      makeTransaction({ id: 2, amount: 50000, type: 'income' }),
      makeTransaction({ id: 3, amount: 20000, type: 'transfer' }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(5000);
  });

  it('reports attention status between 80% and 100% usage', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
    const transactions = [makeTransaction({ id: 1, amount: 8500 })];

    expect(computeBudgetProgress(budget, transactions, referenceDate).status).toBe('attention');
  });

  it('reports depassement status and a negative remaining amount when over budget', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
    const transactions = [makeTransaction({ id: 1, amount: 12000 })];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.status).toBe('depassement');
    expect(progress.remaining).toBe(-2000);
    expect(progress.percent).toBe(120);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest budgetProgress --watchAll=false` (from `appReact/`)
Expected: FAIL — `Cannot find module '../budgetProgress'`.

- [ ] **Step 3: Implement `computeBudgetProgress`**

```ts
import { AppBudget } from '../../../shared/models/appBudget';
import { AppTransaction } from '../../../shared/models/appTransaction';

export type BudgetStatus = 'normal' | 'attention' | 'depassement';

export interface BudgetProgress {
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

function isSameMonth(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso);
  return date.getUTCFullYear() === reference.getUTCFullYear() && date.getUTCMonth() === reference.getUTCMonth();
}

function statusFor(percent: number): BudgetStatus {
  if (percent > 100) {
    return 'depassement';
  }
  if (percent >= 80) {
    return 'attention';
  }
  return 'normal';
}

export function computeBudgetProgress(
  budget: AppBudget,
  transactions: AppTransaction[],
  referenceDate: Date
): BudgetProgress {
  const spent = transactions
    .filter((transaction) => transaction.type === 'expense')
    .filter((transaction) => isSameMonth(transaction.date, referenceDate))
    .filter((transaction) => budget.categoryId === null || transaction.categoryId === budget.categoryId)
    .reduce((total, transaction) => total + transaction.amount, 0);

  const remaining = budget.amount - spent;
  const percent = Math.round((spent / budget.amount) * 100);

  return { spent, remaining, percent, status: statusFor(percent) };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest budgetProgress --watchAll=false` (from `appReact/`)
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Run the full React Native test suite and type-check**

Run: `npx jest --watchAll=false` (from `appReact/`)
Expected: every test suite passes (existing + new Budget ones).

Run: `npx tsc --noEmit` (from `appReact/`)
Expected: no errors.

Run: `npx eslint src/features/budgets` (from `appReact/`)
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add appReact/src/features/budgets/domain
git commit -m "feat(appReact): add budgetProgress calculator"
```

---

## Definition of done for this plan

- `php artisan test --compact` is fully green in `backend/`.
- `npx jest --watchAll=false` is fully green in `appReact/`.
- `npx tsc --noEmit` and `npx eslint` are clean in `appReact/`.
- No file under `appReact/app/` (screens/navigation) was touched.
- A future Budget screen can be built using only: `useBudgetsStore` (Task 7), `computeBudgetProgress` (Task 8), and the existing `useTransactionsStore`/`useCategoriesStore` — no further data-layer work required.
