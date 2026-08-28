# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo (Flutter mobile app + Laravel API), the purple Liquid Glass theme and shared component kit, the full navigation shell, and a real end-to-end authentication flow (register/login/logout/forgot-password) with the Flutter app talking to the real Laravel API and caching the session locally in SQLite.

**Architecture:** Laravel exposes `/api/register`, `/api/login`, `/api/logout`, `/api/forgot-password`, `/api/reset-password` behind Sanctum token auth, using SQLite for local dev and a `{data, message}` / `{message, errors}` response envelope. Flutter talks to it via a `dio`-based `ApiClient`, stores the token in `flutter_secure_storage`, caches the logged-in user in a `drift` SQLite table, and exposes auth state to the UI through a hand-written Riverpod `AsyncNotifier`. Navigation uses `go_router` with a `StatefulShellRoute` bottom-nav shell (Home/Statistics/Budget/Profile placeholders + a floating `+` quick-actions sheet), gated by a Splash screen that checks the cached session.

**Tech Stack:** Flutter 3.44 (Dart 3.12) — `flutter_riverpod`, `dio`, `go_router`, `flutter_secure_storage`, `google_fonts`, `drift`+`sqlite3_flutter_libs`, `mocktail` (test). Laravel (latest stable, PHP 8.4) — Sanctum, SQLite dev DB, PHPUnit.

**Spec:** `docs/superpowers/specs/2026-08-28-finance-app-design.md` (technical design) and `MASTER_SPEC.md` (product spec, repo root). Read both — this plan implements §51 Phase 1 of `MASTER_SPEC.md` per the architecture locked in the design doc.

**Pragmatic deviation from the design doc (noted for transparency):** the design doc lists `riverpod_annotation`/`riverpod_generator` and `fl_chart`/`connectivity_plus` as part of the mobile stack. Phase 1 doesn't need code-generated providers (there's only one stateful controller) or charts/connectivity detection (those belong to Phases 4 and 6). This plan adds only the packages Phase 1 actually uses, and defers the rest to the phase that needs them — consistent with the design doc's own YAGNI stance on sync (§6: "not built now").

## Global Constraints

- Primary brand color `#7C5CFF`; never use green as the primary brand color (MASTER_SPEC §4).
- API success responses: `{"data": ..., "message": ...}`; validation failures: `{"message": ..., "errors": {...}}` (MASTER_SPEC §43).
- Local dev database is SQLite on both sides — no MySQL/PostgreSQL server required locally (MASTER_SPEC §38).
- Currency is XOF; amounts are integers, never floats (design doc §5). Not exercised by auth screens, but any numeric field added later must follow this.
- All user-facing UI copy is in French, matching the exact strings given in MASTER_SPEC where specified (e.g. "Se connecter", "Créer un compte", "Mot de passe oublié ?").
- No secrets committed to git; `.env` stays out of version control (MASTER_SPEC §40, §42).
- Do not build any V2/V3 feature (MASTER_SPEC §52/§53) — this plan is Phase 1 only.
- Every list/screen with async state uses the shared `LoadingState`/`ErrorState`/`EmptyState` widgets once they exist (design doc §7) — Phase 1 builds those widgets and the auth screens use inline loading/error states via the same visual language (auth screens are forms, not lists, so they don't use `EmptyState`).

---

## Task 1: Laravel scaffold, SQLite dev DB, API response envelope

**Files:**
- Create: `backend/` (via `composer create-project`)
- Create: `backend/app/Support/ApiResponse.php`
- Modify: `backend/bootstrap/app.php`
- Modify: `backend/.env`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `App\Support\ApiResponse` trait with `protected function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse` and `protected function error(string $message, array $errors = [], int $status = 422): JsonResponse`. Every later controller task uses this trait.

- [ ] **Step 1: Scaffold the Laravel project**

Run from `C:\Budget_app`:
```bash
composer create-project laravel/laravel backend
cd backend
php artisan install:api --no-interaction
```
`install:api` installs Sanctum, publishes its migration, creates `routes/api.php`, and registers it in `bootstrap/app.php`'s `withRouting(...)`. If it prompts interactively despite `--no-interaction`, answer yes to any "install/update" prompt.

- [ ] **Step 2: Verify the SQLite dev database**

```bash
cd backend
cat .env | grep DB_CONNECTION
```
Expected: `DB_CONNECTION=sqlite`. If it isn't, edit `.env` and set `DB_CONNECTION=sqlite` and remove/comment the `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` lines (SQLite needs none of them — Laravel resolves the path to `database/database.sqlite` by default).

```bash
touch database/database.sqlite
php artisan migrate
```
Expected: migration output listing `create_users_table`, `create_cache_table`, `create_jobs_table`, `create_personal_access_tokens_table` (from Sanctum) all migrated, no errors.

- [ ] **Step 3: Confirm MAIL_MAILER is set to `log` for dev**

```bash
cat .env | grep MAIL_MAILER
```
Expected: `MAIL_MAILER=log` (Laravel's default). This makes password-reset emails land in `storage/logs/laravel.log` instead of requiring a real SMTP server — needed later in Task 5. If it's set to something else, change it to `log`.

- [ ] **Step 4: Create the shared API response trait**

```php
<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
        ], $status);
    }

    protected function error(string $message, array $errors = [], int $status = 422): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
```
Save as `backend/app/Support/ApiResponse.php`.

- [ ] **Step 5: Make unauthenticated API requests return JSON, not a redirect**

Laravel's default exception handling redirects unauthenticated requests to a `login` named route, which doesn't exist in an API-only app and would throw a `RouteNotFoundException` instead of a clean 401. Fix this in `backend/bootstrap/app.php` by adding a render callback inside the existing `->withExceptions(...)` closure:

```php
<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Non authentifié.'], 401);
            }
        });
    })->create();
```
Keep whatever `install:api` already generated for `withRouting`/`withMiddleware` — only add the `render` callback inside `withExceptions`. If `api:` is already wired into `withRouting` by `install:api`, don't duplicate it.

- [ ] **Step 6: Verify the scaffold**

```bash
php artisan test
```
Expected: the default example test(s) pass, 0 failures.

```bash
php artisan route:list --path=api
```
Expected: shows at least `GET /api/user` (Sanctum's default). No errors thrown.

- [ ] **Step 7: Commit**

```bash
cd C:\Budget_app
git add backend
git commit -m "chore(backend): scaffold Laravel with Sanctum, SQLite dev DB, and API response envelope"
```

---

## Task 2: User model + `/api/register`

**Files:**
- Modify: `backend/database/migrations/0001_01_01_000000_create_users_table.php`
- Modify: `backend/app/Models/User.php`
- Create: `backend/app/Http/Resources/UserResource.php`
- Create: `backend/app/Http/Requests/Auth/RegisterRequest.php`
- Create: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Auth/RegisterTest.php`

**Interfaces:**
- Consumes: `App\Support\ApiResponse` (Task 1).
- Produces: `POST /api/register` returning `{"data": {"user": {...}, "token": "..."}, "message": "..."}` on success (201) or `{"message": "...", "errors": {...}}` on validation failure (422). `App\Http\Resources\UserResource` shaping `{id, name, email, avatar, currency}`. `User` model has `avatar` (nullable string) and `currency` (string, default `XOF`) columns and the `HasApiTokens` trait — later tasks (login/logout) depend on both.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/Auth/RegisterTest.php`:
```php
<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_registers_a_new_user_and_returns_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jackson',
            'email' => 'jackson@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.email', 'jackson@example.com')
            ->assertJsonPath('data.user.currency', 'XOF')
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'avatar', 'currency'], 'token'], 'message']);

        $this->assertTrue(User::where('email', 'jackson@example.com')->exists());
    }

    public function test_it_rejects_registration_with_a_duplicate_email(): void
    {
        User::factory()->create(['email' => 'jackson@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Jackson',
            'email' => 'jackson@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_it_rejects_registration_when_passwords_do_not_match(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jackson',
            'email' => 'jackson@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('password');
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend
php artisan test --filter=RegisterTest
```
Expected: FAIL — route `/api/register` not found (404), since nothing exists yet.

- [ ] **Step 3: Extend the users migration**

Open `backend/database/migrations/0001_01_01_000000_create_users_table.php` and add two columns to the `users` table right after the `password` line:
```php
$table->string('avatar')->nullable();
$table->string('currency', 3)->default('XOF');
```
So the `up()` method's users block reads:
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->string('avatar')->nullable();
    $table->string('currency', 3)->default('XOF');
    $table->rememberToken();
    $table->timestamps();
});
```

- [ ] **Step 4: Update the User model**

Replace `backend/app/Models/User.php` with:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'currency',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
```
(If `HasApiTokens` was already added by `install:api` in Task 1, this replacement is still correct — it keeps it.)

- [ ] **Step 5: Create the UserResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'currency' => $this->currency,
        ];
    }
}
```
Save as `backend/app/Http/Resources/UserResource.php`.

- [ ] **Step 6: Create the RegisterRequest**

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}
```
Save as `backend/app/Http/Requests/Auth/RegisterRequest.php`.

- [ ] **Step 7: Create the AuthController with register()**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
        ]);

        $token = $user->createToken('mobile')->plainTextToken;

        return $this->success([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Compte créé avec succès.', 201);
    }
}
```
Save as `backend/app/Http/Controllers/Api/AuthController.php`.

- [ ] **Step 8: Register the route**

In `backend/routes/api.php`, add (keep whatever `install:api` already put there, e.g. the `/user` route):
```php
use App\Http\Controllers\Api\AuthController;

Route::post('register', [AuthController::class, 'register']);
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
php artisan test --filter=RegisterTest
```
Expected: PASS, 3 tests, 0 failures.

- [ ] **Step 10: Commit**

```bash
cd C:\Budget_app
git add backend
git commit -m "feat(backend): add user registration endpoint"
```

---

## Task 3: `/api/login`

**Files:**
- Create: `backend/app/Http/Requests/Auth/LoginRequest.php`
- Modify: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Auth/LoginTest.php`

**Interfaces:**
- Consumes: `ApiResponse` (Task 1), `UserResource`, `User` model (Task 2).
- Produces: `POST /api/login` returning the same `{"data": {"user", "token"}, "message"}` shape as register (200), or 422 with `errors.email` on invalid credentials.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/Auth/LoginTest.php`:
```php
<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_logs_in_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'jackson@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jackson@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['user', 'token'], 'message']);
    }

    public function test_it_rejects_an_unknown_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_it_rejects_an_incorrect_password(): void
    {
        User::factory()->create([
            'email' => 'jackson@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jackson@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
php artisan test --filter=LoginTest
```
Expected: FAIL — 404, route doesn't exist.

- [ ] **Step 3: Create the LoginRequest**

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
```
Save as `backend/app/Http/Requests/Auth/LoginRequest.php`.

- [ ] **Step 4: Add login() to AuthController**

Add this method inside `backend/app/Http/Controllers/Api/AuthController.php` (add the `use` statements at the top of the file too):
```php
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Validation\ValidationException;
```
```php
public function login(LoginRequest $request)
{
    $user = User::where('email', $request->validated('email'))->first();

    if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['Identifiants invalides.'],
        ]);
    }

    $token = $user->createToken('mobile')->plainTextToken;

    return $this->success([
        'user' => new UserResource($user),
        'token' => $token,
    ], 'Connexion réussie.');
}
```

- [ ] **Step 5: Register the route**

In `backend/routes/api.php`:
```php
Route::post('login', [AuthController::class, 'login']);
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
php artisan test --filter=LoginTest
```
Expected: PASS, 3 tests, 0 failures.

- [ ] **Step 7: Commit**

```bash
cd C:\Budget_app
git add backend
git commit -m "feat(backend): add login endpoint"
```

---

## Task 4: `/api/logout`

**Files:**
- Modify: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Auth/LogoutTest.php`

**Interfaces:**
- Consumes: `ApiResponse` (Task 1), Sanctum `auth:sanctum` middleware (available since Task 1's `install:api`).
- Produces: `POST /api/logout` (requires `Authorization: Bearer <token>`), revokes the token used, returns `{"data": null, "message": "..."}` (200); returns 401 (via Task 1's exception handling) when no/invalid token is supplied.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/Auth/LogoutTest.php`:
```php
<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_logs_out_an_authenticated_user_and_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout');

        $response->assertStatus(200);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_it_rejects_logout_without_a_token(): void
    {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401);
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
php artisan test --filter=LogoutTest
```
Expected: FAIL — 404, route doesn't exist.

- [ ] **Step 3: Add logout() to AuthController**

Add this method (and `use Illuminate\Http\Request;` at the top if not already present):
```php
public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return $this->success(null, 'Déconnexion réussie.');
}
```

- [ ] **Step 4: Register the route behind auth:sanctum**

In `backend/routes/api.php`:
```php
Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
php artisan test --filter=LogoutTest
```
Expected: PASS, 2 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add backend
git commit -m "feat(backend): add logout endpoint"
```

---

## Task 5: `/api/forgot-password` and `/api/reset-password`

**Files:**
- Create: `backend/app/Http/Requests/Auth/ForgotPasswordRequest.php`
- Create: `backend/app/Http/Requests/Auth/ResetPasswordRequest.php`
- Create: `backend/app/Http/Controllers/Api/PasswordResetController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Auth/PasswordResetTest.php`

**Interfaces:**
- Consumes: `ApiResponse` (Task 1), `User` model (Task 2), Laravel's built-in `password_reset_tokens` table (already migrated in Task 1) and `Password` broker.
- Produces: `POST /api/forgot-password` (200, sends a reset-link notification — logged to `storage/logs/laravel.log` in dev since `MAIL_MAILER=log`), `POST /api/reset-password` (200 on success, 422 with `errors.email` on an invalid/expired token).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/Auth/PasswordResetTest.php`:
```php
<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_a_reset_link_for_a_known_email(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'jackson@example.com']);

        $response = $this->postJson('/api/forgot-password', ['email' => 'jackson@example.com']);

        $response->assertStatus(200);
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_it_resets_the_password_with_a_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'jackson@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'jackson@example.com',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }

    public function test_it_rejects_reset_with_an_invalid_token(): void
    {
        User::factory()->create(['email' => 'jackson@example.com']);

        $response = $this->postJson('/api/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'jackson@example.com',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
php artisan test --filter=PasswordResetTest
```
Expected: FAIL — 404, routes don't exist.

- [ ] **Step 3: Create the Form Requests**

`backend/app/Http/Requests/Auth/ForgotPasswordRequest.php`:
```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
```

`backend/app/Http/Requests/Auth/ResetPasswordRequest.php`:
```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}
```

- [ ] **Step 4: Create the PasswordResetController**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    use ApiResponse;

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return $this->success(null, 'Un lien de réinitialisation a été envoyé.');
    }

    public function reset(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return $this->success(null, 'Mot de passe réinitialisé avec succès.');
    }
}
```
Save as `backend/app/Http/Controllers/Api/PasswordResetController.php`.

- [ ] **Step 5: Register the routes**

In `backend/routes/api.php`:
```php
use App\Http\Controllers\Api\PasswordResetController;

Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('reset-password', [PasswordResetController::class, 'reset']);
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
php artisan test --filter=PasswordResetTest
```
Expected: PASS, 3 tests, 0 failures.

- [ ] **Step 7: Run the full backend suite and commit**

```bash
php artisan test
```
Expected: all Auth tests plus the default example test(s) pass, 0 failures.

```bash
cd C:\Budget_app
git add backend
git commit -m "feat(backend): add forgot-password and reset-password endpoints"
```

---

## Task 6: Flutter scaffold + dependencies

**Files:**
- Create: `mobile/` (via `flutter create`)
- Modify: `mobile/pubspec.yaml`
- Delete: `mobile/test/widget_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces: a Flutter project named `finance_app` (imports as `package:finance_app/...`) at `mobile/`, with `flutter_riverpod`, `dio`, `go_router`, `flutter_secure_storage`, `google_fonts`, `drift`, `sqlite3_flutter_libs`, `path_provider`, `path` as dependencies and `build_runner`, `drift_dev`, `mocktail` as dev dependencies, ready for every later task to add files under `lib/`.

- [ ] **Step 1: Scaffold the project**

```bash
cd C:\Budget_app
flutter create --org com.financeapp --project-name finance_app mobile
```

- [ ] **Step 2: Add runtime dependencies**

```bash
cd mobile
flutter pub add flutter_riverpod dio go_router flutter_secure_storage google_fonts drift sqlite3_flutter_libs path_provider path
```

- [ ] **Step 3: Add dev dependencies**

```bash
flutter pub add -d build_runner drift_dev mocktail
```

- [ ] **Step 4: Remove the default counter-app test**

The default `flutter create` output includes `test/widget_test.dart`, which references the counter-app `MyApp` widget that Task 13 will replace. Delete it now so it doesn't fail in the interim:
```bash
rm test/widget_test.dart
```

- [ ] **Step 5: Verify the scaffold**

```bash
flutter pub get
flutter analyze
```
Expected: `No issues found!` (the default template's `lib/main.dart` is still the counter app at this point — that's fine, it gets replaced in Task 13).

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "chore(mobile): scaffold Flutter project with core dependencies"
```

---

## Task 7: Theme system

**Files:**
- Create: `mobile/lib/core/theme/app_colors.dart`
- Create: `mobile/lib/core/theme/app_typography.dart`
- Create: `mobile/lib/core/theme/glass.dart`
- Create: `mobile/lib/core/theme/app_theme.dart`
- Test: `mobile/test/core/theme/app_theme_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces: `AppColors` (constants: `primary`, `primaryDark`, `primaryLight`, `background`, `surface`, `text`, `secondary`, `success`, `warning`, `danger`, `info`), `AppTypography.textTheme`, `GlassDecoration.surface({double radius, double opacity})` and `GlassDecoration.blur`, `AppTheme.light` (a `ThemeData`). Every later UI task uses these.

- [ ] **Step 1: Write the failing test**

Create `mobile/test/core/theme/app_theme_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/core/theme/app_colors.dart';
import 'package:finance_app/core/theme/app_theme.dart';

void main() {
  test('light theme uses the brand primary purple', () {
    final theme = AppTheme.light;
    expect(theme.colorScheme.primary, AppColors.primary);
  });

  test('brand purple matches the spec value and is not green', () {
    expect(AppColors.primary, const Color(0xFF7C5CFF));
  });
}
```
Add `import 'package:flutter/material.dart';` at the top for `Color`.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd mobile
flutter test test/core/theme/app_theme_test.dart
```
Expected: FAIL — `app_colors.dart`/`app_theme.dart` don't exist yet.

- [ ] **Step 3: Create AppColors**

```dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF7C5CFF);
  static const Color primaryDark = Color(0xFF5B3FD4);
  static const Color primaryLight = Color(0xFFA98CFF);

  static const Color background = Color(0xFFF7F5FF);
  static const Color surface = Color(0xFFFFFFFF);

  static const Color text = Color(0xFF17152A);
  static const Color secondary = Color(0xFF77738A);

  static const Color success = Color(0xFF35B77A);
  static const Color warning = Color(0xFFFFB547);
  static const Color danger = Color(0xFFFF5C73);
  static const Color info = Color(0xFF5D8CFF);
}
```
Save as `mobile/lib/core/theme/app_colors.dart`.

- [ ] **Step 4: Create AppTypography**

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTypography {
  AppTypography._();

  static TextTheme get textTheme => GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: AppColors.text,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: AppColors.text,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.text,
        ),
        bodyLarge: GoogleFonts.inter(fontSize: 16, color: AppColors.text),
        bodyMedium: GoogleFonts.inter(fontSize: 14, color: AppColors.text),
        labelSmall: GoogleFonts.inter(fontSize: 12, color: AppColors.secondary),
      );
}
```
Save as `mobile/lib/core/theme/app_typography.dart`.

- [ ] **Step 5: Create the glass decoration helper**

```dart
import 'dart:ui';

import 'package:flutter/material.dart';

import 'app_colors.dart';

class GlassDecoration {
  GlassDecoration._();

  static BoxDecoration surface({double radius = 24, double opacity = 0.6}) {
    return BoxDecoration(
      color: AppColors.surface.withValues(alpha: opacity),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
      boxShadow: [
        BoxShadow(
          color: AppColors.primary.withValues(alpha: 0.08),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }

  static const ImageFilter blur = ImageFilter.blur(sigmaX: 20, sigmaY: 20);
}
```
Save as `mobile/lib/core/theme/glass.dart`.

- [ ] **Step 6: Create AppTheme**

```dart
import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        error: AppColors.danger,
        surface: AppColors.surface,
      ),
      textTheme: AppTypography.textTheme,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
```
Save as `mobile/lib/core/theme/app_theme.dart`.

- [ ] **Step 7: Run the test to verify it passes**

```bash
flutter test test/core/theme/app_theme_test.dart
```
Expected: PASS, 2 tests.

- [ ] **Step 8: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add purple Liquid Glass theme system"
```

---

## Task 8: Shared widgets

**Files:**
- Create: `mobile/lib/shared/widgets/glass_card.dart`
- Create: `mobile/lib/shared/widgets/primary_button.dart`
- Create: `mobile/lib/shared/widgets/glass_button.dart`
- Create: `mobile/lib/shared/widgets/app_text_field.dart`
- Create: `mobile/lib/shared/widgets/loading_state.dart`
- Create: `mobile/lib/shared/widgets/error_state.dart`
- Create: `mobile/lib/shared/widgets/empty_state.dart`
- Test: `mobile/test/shared/widgets/shared_widgets_test.dart`

**Interfaces:**
- Consumes: `AppColors`, `GlassDecoration` (Task 7).
- Produces: `GlassCard({child, padding, borderRadius})`, `PrimaryButton({label, onPressed, isLoading})`, `GlassButton({label, icon, onPressed})`, `AppTextField({controller, label, obscureText, keyboardType, validator})`, `LoadingState({message})`, `ErrorState({message, onRetry})`, `EmptyState({title, message, actionLabel, onAction})`. Auth screens (Tasks 15-17) use `AppTextField` and `PrimaryButton` directly.

- [ ] **Step 1: Write the failing tests**

Create `mobile/test/shared/widgets/shared_widgets_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/shared/widgets/empty_state.dart';
import 'package:finance_app/shared/widgets/error_state.dart';
import 'package:finance_app/shared/widgets/glass_card.dart';
import 'package:finance_app/shared/widgets/loading_state.dart';
import 'package:finance_app/shared/widgets/primary_button.dart';

void main() {
  testWidgets('GlassCard renders its child', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: GlassCard(child: Text('hello')))),
    );
    expect(find.text('hello'), findsOneWidget);
  });

  testWidgets('PrimaryButton shows a spinner and hides its label while loading', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PrimaryButton(label: 'Go', isLoading: true, onPressed: () {}),
        ),
      ),
    );
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Go'), findsNothing);
  });

  testWidgets('PrimaryButton is disabled while loading', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PrimaryButton(label: 'Go', isLoading: true, onPressed: () => tapped = true),
        ),
      ),
    );
    await tester.tap(find.byType(ElevatedButton), warnIfMissed: false);
    expect(tapped, isFalse);
  });

  testWidgets('LoadingState shows an optional message', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: LoadingState(message: 'Chargement...'))),
    );
    expect(find.text('Chargement...'), findsOneWidget);
  });

  testWidgets('ErrorState shows the message and calls onRetry when tapped', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: ErrorState(message: 'Oops', onRetry: () => tapped = true)),
      ),
    );
    expect(find.text('Oops'), findsOneWidget);
    await tester.tap(find.text('Réessayer'));
    expect(tapped, isTrue);
  });

  testWidgets('EmptyState shows an action button when provided', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EmptyState(
            title: 'Rien ici',
            message: 'Ajoutez quelque chose',
            actionLabel: 'Ajouter',
            onAction: () {},
          ),
        ),
      ),
    );
    expect(find.text('Rien ici'), findsOneWidget);
    expect(find.text('Ajouter'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd mobile
flutter test test/shared/widgets/shared_widgets_test.dart
```
Expected: FAIL — none of the widget files exist yet.

- [ ] **Step 3: Create GlassCard**

```dart
import 'package:flutter/material.dart';

import '../../core/theme/glass.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 24,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: GlassDecoration.blur,
        child: Container(
          padding: padding,
          decoration: GlassDecoration.surface(radius: borderRadius),
          child: child,
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/glass_card.dart`.

- [ ] **Step 4: Create PrimaryButton**

```dart
import 'package:flutter/material.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            )
          : Text(label),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/primary_button.dart`.

- [ ] **Step 5: Create GlassButton**

```dart
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/glass.dart';

class GlassButton extends StatelessWidget {
  const GlassButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: GlassDecoration.surface(radius: 18, opacity: 0.5),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: AppColors.primary),
                const SizedBox(height: 4),
                Text(label, style: const TextStyle(fontSize: 12, color: AppColors.text)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/glass_button.dart`.

- [ ] **Step 6: Create AppTextField**

```dart
import 'package:flutter/material.dart';

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.controller,
    required this.label,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
  });

  final TextEditingController controller;
  final String label;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(labelText: label),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/app_text_field.dart`.

- [ ] **Step 7: Create LoadingState, ErrorState, EmptyState**

```dart
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class LoadingState extends StatelessWidget {
  const LoadingState({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          if (message != null) ...[
            const SizedBox(height: 12),
            Text(message!, style: const TextStyle(color: AppColors.secondary)),
          ],
        ],
      ),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/loading_state.dart`.

```dart
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 40),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.text)),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              TextButton(onPressed: onRetry, child: const Text('Réessayer')),
            ],
          ],
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/error_state.dart`.

```dart
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inbox_rounded, color: AppColors.secondary, size: 40),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.text),
            ),
            const SizedBox(height: 4),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.secondary)),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/shared/widgets/empty_state.dart`.

- [ ] **Step 8: Run the tests to verify they pass**

```bash
flutter test test/shared/widgets/shared_widgets_test.dart
```
Expected: PASS, 6 tests.

- [ ] **Step 9: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add reusable glass/state widgets"
```

---

## Task 9: Core services — constants, secure storage, API client

**Files:**
- Create: `mobile/lib/core/constants/app_constants.dart`
- Create: `mobile/lib/core/services/secure_storage_service.dart`
- Create: `mobile/lib/core/services/api_client.dart`
- Test: `mobile/test/core/services/secure_storage_service_test.dart`
- Test: `mobile/test/core/services/api_client_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces: `AppConstants.apiBaseUrl`, `AppConstants.secureStorageTokenKey`, `AppConstants.secureStorageOnboardingKey`. `SecureStorageService` with `Future<void> saveToken(String)`, `Future<String?> readToken()`, `Future<void> clearToken()`, `Future<bool> hasCompletedOnboarding()`, `Future<void> markOnboardingComplete()`, constructible as `SecureStorageService({FlutterSecureStorage? storage})`. `ApiClient` with a public `Dio dio` field, constructible as `ApiClient({required SecureStorageService secureStorage, Dio? dio})`.

- [ ] **Step 1: Write the failing tests**

Create `mobile/test/core/services/secure_storage_service_test.dart`:
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService service;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    service = SecureStorageService(storage: mockStorage);
  });

  test('saveToken writes the auth_token key', () async {
    when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});

    await service.saveToken('abc123');

    verify(() => mockStorage.write(key: 'auth_token', value: 'abc123')).called(1);
  });

  test('readToken returns null when nothing is stored', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);

    expect(await service.readToken(), isNull);
  });

  test('hasCompletedOnboarding returns false when the flag is absent', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);

    expect(await service.hasCompletedOnboarding(), isFalse);
  });

  test('hasCompletedOnboarding returns true when the flag is set', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'true');

    expect(await service.hasCompletedOnboarding(), isTrue);
  });
}
```

Create `mobile/test/core/services/api_client_test.dart`:
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/constants/app_constants.dart';
import 'package:finance_app/core/services/api_client.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  test('ApiClient targets the configured base URL and registers an interceptor', () {
    final storage = SecureStorageService(storage: MockFlutterSecureStorage());
    final client = ApiClient(secureStorage: storage);

    expect(client.dio.options.baseUrl, AppConstants.apiBaseUrl);
    expect(client.dio.interceptors, isNotEmpty);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd mobile
flutter test test/core/services/
```
Expected: FAIL — files don't exist yet.

- [ ] **Step 3: Create AppConstants**

```dart
class AppConstants {
  AppConstants._();

  // Android emulator reaches the host machine's localhost via 10.0.2.2.
  // Use http://localhost:8000/api for the iOS simulator, or your LAN IP for a physical device.
  static const String apiBaseUrl = 'http://10.0.2.2:8000/api';

  static const String secureStorageTokenKey = 'auth_token';
  static const String secureStorageOnboardingKey = 'onboarding_complete';
}
```
Save as `mobile/lib/core/constants/app_constants.dart`.

- [ ] **Step 4: Create SecureStorageService**

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<void> saveToken(String token) =>
      _storage.write(key: AppConstants.secureStorageTokenKey, value: token);

  Future<String?> readToken() => _storage.read(key: AppConstants.secureStorageTokenKey);

  Future<void> clearToken() => _storage.delete(key: AppConstants.secureStorageTokenKey);

  Future<bool> hasCompletedOnboarding() async {
    final value = await _storage.read(key: AppConstants.secureStorageOnboardingKey);
    return value == 'true';
  }

  Future<void> markOnboardingComplete() =>
      _storage.write(key: AppConstants.secureStorageOnboardingKey, value: 'true');
}
```
Save as `mobile/lib/core/services/secure_storage_service.dart`.

- [ ] **Step 5: Create ApiClient**

```dart
import 'package:dio/dio.dart';

import '../constants/app_constants.dart';
import 'secure_storage_service.dart';

class ApiClient {
  ApiClient({required SecureStorageService secureStorage, Dio? dio})
      : _secureStorage = secureStorage,
        dio = dio ?? Dio(BaseOptions(baseUrl: AppConstants.apiBaseUrl)) {
    this.dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          options.headers['Accept'] = 'application/json';
          final token = await _secureStorage.readToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _secureStorage.clearToken();
          }
          handler.next(error);
        },
      ),
    );
  }

  final Dio dio;
  final SecureStorageService _secureStorage;
}
```
Save as `mobile/lib/core/services/api_client.dart`.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
flutter test test/core/services/
```
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add secure storage service and API client"
```

---

## Task 10: Local database (drift)

**Files:**
- Create: `mobile/lib/core/database/app_database.dart`
- Generated: `mobile/lib/core/database/app_database.g.dart` (via build_runner)
- Test: `mobile/test/core/database/app_database_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces: `AppDatabase` with `Future<void> cacheUser({required int id, required String name, required String email, required String currency, String? avatar})`, `Future<LocalUser?> get cachedUser`, `Stream<LocalUser?> watchCachedUser()`, `Future<void> clearCachedUser()`, default constructor `AppDatabase()` (real file-backed) and `AppDatabase.forTesting(QueryExecutor executor)` (in-memory, for tests). `LocalUser` is drift-generated with fields `id, name, email, currency, avatar, syncState`.

- [ ] **Step 1: Write the failing test**

Create `mobile/test/core/database/app_database_test.dart`:
```dart
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/core/database/app_database.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());
  });

  tearDown(() => database.close());

  test('cacheUser inserts and cachedUser reads it back', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF');

    final user = await database.cachedUser;

    expect(user, isNotNull);
    expect(user!.name, 'Jackson');
    expect(user.currency, 'XOF');
    expect(user.avatar, isNull);
  });

  test('cacheUser overwrites the previous cached user on conflict', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF');
    await database.cacheUser(id: 1, name: 'Jackson Updated', email: 'a@a.com', currency: 'XOF');

    final user = await database.cachedUser;

    expect(user!.name, 'Jackson Updated');
  });

  test('clearCachedUser removes all rows', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF');
    await database.clearCachedUser();

    expect(await database.cachedUser, isNull);
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd mobile
flutter test test/core/database/app_database_test.dart
```
Expected: FAIL — `app_database.dart` doesn't exist yet.

- [ ] **Step 3: Create the drift database**

```dart
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

class LocalUsers extends Table {
  IntegerColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get email => text()();
  TextColumn get currency => text()();
  TextColumn get avatar => text().nullable()();
  TextColumn get syncState => text().withDefault(const Constant('synced'))();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [LocalUsers])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 1;

  Future<void> cacheUser({
    required int id,
    required String name,
    required String email,
    required String currency,
    String? avatar,
  }) async {
    await into(localUsers).insertOnConflictUpdate(
      LocalUsersCompanion.insert(
        id: id,
        name: name,
        email: email,
        currency: currency,
        avatar: Value(avatar),
      ),
    );
  }

  Future<LocalUser?> get cachedUser => select(localUsers).getSingleOrNull();

  Stream<LocalUser?> watchCachedUser() => select(localUsers).watchSingleOrNull();

  Future<void> clearCachedUser() => delete(localUsers).go();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'finance_app.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
```
Save as `mobile/lib/core/database/app_database.dart`.

- [ ] **Step 4: Generate the drift code**

```bash
dart run build_runner build --delete-conflicting-outputs
```
Expected: completes without errors, creates `mobile/lib/core/database/app_database.g.dart`.

- [ ] **Step 5: Run the test to verify it passes**

```bash
flutter test test/core/database/app_database_test.dart
```
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add local SQLite cache via drift"
```

---

## Task 11: Auth data layer + Riverpod providers

**Files:**
- Create: `mobile/lib/shared/models/app_user.dart`
- Create: `mobile/lib/features/auth/data/auth_api.dart`
- Create: `mobile/lib/features/auth/data/auth_repository.dart`
- Create: `mobile/lib/features/auth/domain/auth_state.dart`
- Create: `mobile/lib/features/auth/providers/auth_providers.dart`
- Test: `mobile/test/features/auth/data/auth_repository_test.dart`

**Interfaces:**
- Consumes: `SecureStorageService`, `ApiClient` (Task 9), `AppDatabase` (Task 10).
- Produces: `AppUser {id, name, email, currency, avatar}` with `fromJson`/`toJson`. `AuthApiException {message, fieldErrors}`. `AuthApi` with `register/login/logout/forgotPassword/resetPassword`. `AuthRepository` with `register/login/logout/forgotPassword/resetPassword/hasValidSession/cachedUser`. `AuthState` sealed hierarchy: `AuthUnknown`, `AuthUnauthenticated`, `AuthAuthenticated(AppUser user)`. Providers: `secureStorageServiceProvider`, `appDatabaseProvider`, `apiClientProvider`, `authApiProvider`, `authRepositoryProvider`, `authControllerProvider` (`AsyncNotifierProvider<AuthController, AuthState>`) with `AuthController.register(...)`, `.login(...)`, `.logout()`. Every screen task (13-17) and the router/shell (Task 12) depend on these.

- [ ] **Step 1: Write the failing test**

Create `mobile/test/features/auth/data/auth_repository_test.dart`:
```dart
import 'package:drift/native.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/database/app_database.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';
import 'package:finance_app/features/auth/data/auth_api.dart';
import 'package:finance_app/features/auth/data/auth_repository.dart';

class MockAuthApi extends Mock implements AuthApi {}

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockAuthApi authApi;
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService secureStorage;
  late AppDatabase database;
  late AuthRepository repository;

  setUp(() {
    authApi = MockAuthApi();
    mockStorage = MockFlutterSecureStorage();
    secureStorage = SecureStorageService(storage: mockStorage);
    database = AppDatabase.forTesting(NativeDatabase.memory());
    repository = AuthRepository(authApi: authApi, secureStorage: secureStorage, database: database);

    when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});
    when(() => mockStorage.delete(key: any(named: 'key'))).thenAnswer((_) async {});
  });

  tearDown(() => database.close());

  test('login persists the token and caches the user locally', () async {
    when(() => authApi.login(email: 'jackson@example.com', password: 'password123'))
        .thenAnswer((_) async => {
              'token': 'token-123',
              'user': {
                'id': 1,
                'name': 'Jackson',
                'email': 'jackson@example.com',
                'currency': 'XOF',
                'avatar': null,
              },
            });

    final user = await repository.login(email: 'jackson@example.com', password: 'password123');

    expect(user.name, 'Jackson');
    verify(() => mockStorage.write(key: 'auth_token', value: 'token-123')).called(1);

    final cached = await database.cachedUser;
    expect(cached, isNotNull);
    expect(cached!.email, 'jackson@example.com');
  });

  test('hasValidSession reflects whether a token is stored', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);
    expect(await repository.hasValidSession(), isFalse);

    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'a-token');
    expect(await repository.hasValidSession(), isTrue);
  });

  test('logout clears the token and the cached user even if the API call fails', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF');
    when(() => authApi.logout()).thenThrow(AuthApiException('network error'));

    await expectLater(repository.logout(), throwsA(isA<AuthApiException>()));

    verify(() => mockStorage.delete(key: 'auth_token')).called(1);
    expect(await database.cachedUser, isNull);
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd mobile
flutter test test/features/auth/data/auth_repository_test.dart
```
Expected: FAIL — none of the auth files exist yet.

- [ ] **Step 3: Create AppUser**

```dart
class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.currency,
    this.avatar,
  });

  final int id;
  final String name;
  final String email;
  final String currency;
  final String? avatar;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      currency: json['currency'] as String,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'email': email, 'currency': currency, 'avatar': avatar};
  }
}
```
Save as `mobile/lib/shared/models/app_user.dart`.

- [ ] **Step 4: Create AuthApi**

```dart
import 'package:dio/dio.dart';

class AuthApiException implements Exception {
  AuthApiException(this.message, {this.fieldErrors = const {}});

  final String message;
  final Map<String, List<String>> fieldErrors;
}

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final response = await _post('/register', {
      'name': name,
      'email': email,
      'password': password,
      'password_confirmation': passwordConfirmation,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login({required String email, required String password}) async {
    final response = await _post('/login', {'email': email, 'password': password});
    return response['data'] as Map<String, dynamic>;
  }

  Future<void> logout() => _post('/logout', const {});

  Future<void> forgotPassword(String email) => _post('/forgot-password', {'email': email});

  Future<void> resetPassword({
    required String token,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) =>
      _post('/reset-password', {
        'token': token,
        'email': email,
        'password': password,
        'password_confirmation': passwordConfirmation,
      });

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: data);
      return response.data ?? const {};
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is Map<String, dynamic>) {
        final errors = body['errors'];
        throw AuthApiException(
          body['message'] as String? ?? 'Une erreur est survenue.',
          fieldErrors: errors is Map
              ? errors.map(
                  (key, value) => MapEntry(
                    key as String,
                    (value as List).map((e) => e.toString()).toList(),
                  ),
                )
              : const {},
        );
      }
      throw AuthApiException('Impossible de contacter le serveur. Vérifiez votre connexion Internet.');
    }
  }
}
```
Save as `mobile/lib/features/auth/data/auth_api.dart`.

- [ ] **Step 5: Create AuthRepository**

```dart
import '../../../core/database/app_database.dart';
import '../../../core/services/secure_storage_service.dart';
import '../../../shared/models/app_user.dart';
import 'auth_api.dart';

class AuthRepository {
  AuthRepository({
    required AuthApi authApi,
    required SecureStorageService secureStorage,
    required AppDatabase database,
  })  : _authApi = authApi,
        _secureStorage = secureStorage,
        _database = database;

  final AuthApi _authApi;
  final SecureStorageService _secureStorage;
  final AppDatabase _database;

  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final result = await _authApi.register(
      name: name,
      email: email,
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
    return _persistSession(result);
  }

  Future<AppUser> login({required String email, required String password}) async {
    final result = await _authApi.login(email: email, password: password);
    return _persistSession(result);
  }

  Future<void> logout() async {
    try {
      await _authApi.logout();
    } finally {
      await _secureStorage.clearToken();
      await _database.clearCachedUser();
    }
  }

  Future<void> forgotPassword(String email) => _authApi.forgotPassword(email);

  Future<void> resetPassword({
    required String token,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) =>
      _authApi.resetPassword(
        token: token,
        email: email,
        password: password,
        passwordConfirmation: passwordConfirmation,
      );

  Future<bool> hasValidSession() async {
    final token = await _secureStorage.readToken();
    return token != null;
  }

  Future<AppUser?> cachedUser() async {
    final local = await _database.cachedUser;
    if (local == null) return null;
    return AppUser(
      id: local.id,
      name: local.name,
      email: local.email,
      currency: local.currency,
      avatar: local.avatar,
    );
  }

  Future<AppUser> _persistSession(Map<String, dynamic> result) async {
    final token = result['token'] as String;
    final user = AppUser.fromJson(result['user'] as Map<String, dynamic>);

    await _secureStorage.saveToken(token);
    await _database.cacheUser(
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      avatar: user.avatar,
    );

    return user;
  }
}
```
Save as `mobile/lib/features/auth/data/auth_repository.dart`.

- [ ] **Step 6: Create AuthState**

```dart
import '../../../shared/models/app_user.dart';

sealed class AuthState {
  const AuthState();
}

class AuthUnknown extends AuthState {
  const AuthUnknown();
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);

  final AppUser user;
}
```
Save as `mobile/lib/features/auth/domain/auth_state.dart`.

- [ ] **Step 7: Create the Riverpod providers and AuthController**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/services/api_client.dart';
import '../../../core/services/secure_storage_service.dart';
import '../data/auth_api.dart';
import '../data/auth_repository.dart';
import '../domain/auth_state.dart';

final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(secureStorage: ref.watch(secureStorageServiceProvider));
});

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(apiClientProvider).dio);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    authApi: ref.watch(authApiProvider),
    secureStorage: ref.watch(secureStorageServiceProvider),
    database: ref.watch(appDatabaseProvider),
  );
});

final authControllerProvider = AsyncNotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final repository = ref.watch(authRepositoryProvider);
    final hasSession = await repository.hasValidSession();
    if (!hasSession) return const AuthUnauthenticated();

    final cached = await repository.cachedUser();
    if (cached == null) return const AuthUnauthenticated();

    return AuthAuthenticated(cached);
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    state = const AsyncLoading();
    final repository = ref.read(authRepositoryProvider);
    state = await AsyncValue.guard(() async {
      final user = await repository.register(
        name: name,
        email: email,
        password: password,
        passwordConfirmation: passwordConfirmation,
      );
      return AuthAuthenticated(user);
    });
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    final repository = ref.read(authRepositoryProvider);
    state = await AsyncValue.guard(() async {
      final user = await repository.login(email: email, password: password);
      return AuthAuthenticated(user);
    });
  }

  Future<void> logout() async {
    final repository = ref.read(authRepositoryProvider);
    await repository.logout();
    state = const AsyncData(AuthUnauthenticated());
  }
}
```
Save as `mobile/lib/features/auth/providers/auth_providers.dart`.

- [ ] **Step 8: Run the test to verify it passes**

```bash
flutter test test/features/auth/data/auth_repository_test.dart
```
Expected: PASS, 3 tests.

- [ ] **Step 9: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add auth data layer and Riverpod state management"
```

---

## Task 12: Router + bottom-nav shell

**Files:**
- Create: `mobile/lib/core/routing/app_router.dart`
- Create: `mobile/lib/features/home/presentation/home_shell.dart`
- Create: `mobile/lib/features/home/presentation/home_tab_placeholder.dart`
- Create: `mobile/lib/features/statistics/presentation/statistics_tab_placeholder.dart`
- Create: `mobile/lib/features/budgets/presentation/budgets_tab_placeholder.dart`
- Create: `mobile/lib/features/profile/presentation/profile_tab_placeholder.dart`
- Test: `mobile/test/core/routing/app_router_test.dart`

**Interfaces:**
- Consumes: `authControllerProvider` (Task 11), `AppColors` (Task 7), `PrimaryButton` (Task 8). References `SplashScreen`, `OnboardingScreen`, `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen` by import path even though those files are created in Tasks 13-17 — this task's `flutter analyze` will show "undefined" errors until those exist, which is expected; the widget files created in later tasks must be saved at exactly the paths this file imports.
- Produces: `GoRouter createAppRouter()` (routes: `/splash`, `/onboarding`, `/login`, `/register`, `/forgot-password`, and a shell with `/home`, `/statistics`, `/budgets`, `/profile` branches). `HomeShell` widget used as the shell branch builder.

- [ ] **Step 1: Write the failing test**

Create `mobile/test/core/routing/app_router_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/core/routing/app_router.dart';

void main() {
  test('createAppRouter starts at the splash route', () {
    final router = createAppRouter();
    expect(router.routeInformationProvider.value.uri.path, '/splash');
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd mobile
flutter test test/core/routing/app_router_test.dart
```
Expected: FAIL — `app_router.dart` doesn't exist yet.

- [ ] **Step 3: Create the placeholder tab screens**

```dart
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class HomeTabPlaceholder extends StatelessWidget {
  const HomeTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Text('Le tableau de bord arrive en Phase 2.', style: TextStyle(color: AppColors.secondary)),
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/features/home/presentation/home_tab_placeholder.dart`.

```dart
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class StatisticsTabPlaceholder extends StatelessWidget {
  const StatisticsTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Text('Les statistiques arrivent en Phase 4.', style: TextStyle(color: AppColors.secondary)),
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/features/statistics/presentation/statistics_tab_placeholder.dart`.

```dart
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class BudgetsTabPlaceholder extends StatelessWidget {
  const BudgetsTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Text('Les budgets arrivent en Phase 3.', style: TextStyle(color: AppColors.secondary)),
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/features/budgets/presentation/budgets_tab_placeholder.dart`.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../auth/providers/auth_providers.dart';

class ProfileTabPlaceholder extends ConsumerWidget {
  const ProfileTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Le profil complet arrive dans une prochaine phase.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.secondary),
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Se déconnecter',
                onPressed: () => ref.read(authControllerProvider.notifier).logout(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/features/profile/presentation/profile_tab_placeholder.dart`.

- [ ] **Step 4: Create HomeShell**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/domain/auth_state.dart';
import '../../auth/providers/auth_providers.dart';

class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(authControllerProvider, (previous, next) {
      final wasAuthenticated = previous?.value is AuthAuthenticated;
      final isUnauthenticated = next.value is AuthUnauthenticated;
      if (wasAuthenticated && isUnauthenticated) {
        context.go('/login');
      }
    });

    return Scaffold(
      body: navigationShell,
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => _showQuickActions(context),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _NavItem(
              icon: Icons.home_rounded,
              label: 'Home',
              isSelected: navigationShell.currentIndex == 0,
              onTap: () => navigationShell.goBranch(0),
            ),
            _NavItem(
              icon: Icons.bar_chart_rounded,
              label: 'Stats',
              isSelected: navigationShell.currentIndex == 1,
              onTap: () => navigationShell.goBranch(1),
            ),
            const SizedBox(width: 48),
            _NavItem(
              icon: Icons.pie_chart_rounded,
              label: 'Budget',
              isSelected: navigationShell.currentIndex == 2,
              onTap: () => navigationShell.goBranch(2),
            ),
            _NavItem(
              icon: Icons.person_rounded,
              label: 'Profile',
              isSelected: navigationShell.currentIndex == 3,
              onTap: () => navigationShell.goBranch(3),
            ),
          ],
        ),
      ),
    );
  }

  void _showQuickActions(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => const _QuickActionsSheet(),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? AppColors.primary : AppColors.secondary;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color),
            Text(label, style: TextStyle(color: color, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _QuickActionsSheet extends StatelessWidget {
  const _QuickActionsSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.remove_circle_outline, color: AppColors.danger),
            title: const Text('Dépense'),
            onTap: () => _notAvailableYet(context),
          ),
          ListTile(
            leading: const Icon(Icons.add_circle_outline, color: AppColors.success),
            title: const Text('Revenu'),
            onTap: () => _notAvailableYet(context),
          ),
          ListTile(
            leading: const Icon(Icons.swap_horiz, color: AppColors.info),
            title: const Text('Transfert'),
            onTap: () => _notAvailableYet(context),
          ),
        ],
      ),
    );
  }

  void _notAvailableYet(BuildContext context) {
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Disponible dans une prochaine phase.')),
    );
  }
}
```
Save as `mobile/lib/features/home/presentation/home_shell.dart`.

- [ ] **Step 5: Create the router**

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/budgets/presentation/budgets_tab_placeholder.dart';
import '../../features/home/presentation/home_shell.dart';
import '../../features/home/presentation/home_tab_placeholder.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/onboarding/presentation/splash_screen.dart';
import '../../features/profile/presentation/profile_tab_placeholder.dart';
import '../../features/statistics/presentation/statistics_tab_placeholder.dart';

GoRouter createAppRouter() {
  final rootNavigatorKey = GlobalKey<NavigatorState>();
  final shellNavigatorKey = GlobalKey<NavigatorState>();

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => HomeShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: shellNavigatorKey,
            routes: [GoRoute(path: '/home', builder: (context, state) => const HomeTabPlaceholder())],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/statistics', builder: (context, state) => const StatisticsTabPlaceholder()),
            ],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/budgets', builder: (context, state) => const BudgetsTabPlaceholder())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/profile', builder: (context, state) => const ProfileTabPlaceholder())],
          ),
        ],
      ),
    ],
  );
}
```
Save as `mobile/lib/core/routing/app_router.dart`.

- [ ] **Step 6: Run the test to verify it passes**

```bash
flutter test test/core/routing/app_router_test.dart
```
Expected: PASS, 1 test. (`flutter analyze` will still report undefined-name errors for `SplashScreen`/`OnboardingScreen`/`LoginScreen`/`RegisterScreen`/`ForgotPasswordScreen` until Tasks 13-17 create them — that's expected at this point in the plan and gets resolved by Task 17's checkpoint.)

- [ ] **Step 7: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add go_router shell with bottom navigation and quick actions"
```

---

## Task 13: Splash screen + app entry point

**Files:**
- Create: `mobile/lib/features/onboarding/presentation/splash_screen.dart`
- Modify: `mobile/lib/main.dart`

**Interfaces:**
- Consumes: `authControllerProvider`, `secureStorageServiceProvider` (Task 11), `createAppRouter()` (Task 12), `AppTheme.light` (Task 7).
- Produces: `SplashScreen` widget (route `/splash`), and the app entry point (`FinanceApp`) wired with `ProviderScope` + `MaterialApp.router`.

- [ ] **Step 1: Create the Splash screen**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/domain/auth_state.dart';
import '../../auth/providers/auth_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _redirect());
  }

  Future<void> _redirect() async {
    final authState = await ref.read(authControllerProvider.future);
    if (!mounted) return;

    if (authState is AuthAuthenticated) {
      context.go('/home');
      return;
    }

    final storage = ref.read(secureStorageServiceProvider);
    final hasSeenOnboarding = await storage.hasCompletedOnboarding();
    if (!mounted) return;

    context.go(hasSeenOnboarding ? '/login' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 64),
            SizedBox(height: 16),
            Text(
              'Finance App',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/features/onboarding/presentation/splash_screen.dart`.

- [ ] **Step 2: Rewrite main.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: FinanceApp()));
}

class FinanceApp extends StatelessWidget {
  const FinanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Finance App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: createAppRouter(),
    );
  }
}
```
Save as `mobile/lib/main.dart` (replacing the default counter app).

- [ ] **Step 3: Write the integration test for the redirect behavior**

Create `mobile/test/features/onboarding/presentation/splash_redirect_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/routing/app_router.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';
import 'package:finance_app/features/auth/domain/auth_state.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';
import 'package:finance_app/shared/models/app_user.dart';

class _MockSecureStorage extends Mock implements FlutterSecureStorage {}

class _FakeAuthenticatedController extends AuthController {
  @override
  Future<AuthState> build() async => const AuthAuthenticated(
        AppUser(id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF'),
      );
}

class _FakeUnauthenticatedController extends AuthController {
  @override
  Future<AuthState> build() async => const AuthUnauthenticated();
}

void main() {
  testWidgets('redirects to login when unauthenticated and onboarding is already done', (tester) async {
    final mockStorage = _MockSecureStorage();
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'true');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_FakeUnauthenticatedController.new),
          secureStorageServiceProvider.overrideWithValue(SecureStorageService(storage: mockStorage)),
        ],
        child: MaterialApp.router(routerConfig: createAppRouter()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Bon retour'), findsOneWidget);
  });

  testWidgets('redirects straight to the home shell when already authenticated', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authControllerProvider.overrideWith(_FakeAuthenticatedController.new)],
        child: MaterialApp.router(routerConfig: createAppRouter()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.add), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
  });
}
```
This test will not compile until `LoginScreen` (Task 15) exists, since `createAppRouter()` imports it — that's expected; run it again as part of Task 15's checkpoint if it fails here for that reason alone.

- [ ] **Step 4: Run the test**

```bash
cd mobile
flutter test test/features/onboarding/presentation/splash_redirect_test.dart
```
Expected at this point: FAIL to compile, because `login_screen.dart` (Task 15), `register_screen.dart` (Task 16) and `forgot_password_screen.dart` (Task 17) don't exist yet — `app_router.dart` imports them. This is expected; re-run this exact test at the end of Task 17 and expect PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add splash screen and wire app entry point to the router"
```

---

## Task 14: Onboarding screens

**Files:**
- Create: `mobile/lib/features/onboarding/presentation/onboarding_screen.dart`
- Test: `mobile/test/features/onboarding/presentation/onboarding_screen_test.dart`

**Interfaces:**
- Consumes: `secureStorageServiceProvider` (Task 11), `AppColors` (Task 7).
- Produces: `OnboardingScreen` widget (route `/onboarding`), calls `markOnboardingComplete()` then navigates to `/login` on "Passer" or "Commencer".

- [ ] **Step 1: Write the failing tests**

Create `mobile/test/features/onboarding/presentation/onboarding_screen_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';
import 'package:finance_app/features/onboarding/presentation/onboarding_screen.dart';

class _MockSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  testWidgets('shows the three onboarding titles when swiping through', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: OnboardingScreen())),
    );

    expect(find.text('Prenez le contrôle de votre argent'), findsOneWidget);

    await tester.drag(find.byType(PageView), const Offset(-400, 0));
    await tester.pumpAndSettle();
    expect(find.text('Comprenez où va votre argent'), findsOneWidget);

    await tester.drag(find.byType(PageView), const Offset(-400, 0));
    await tester.pumpAndSettle();
    expect(find.text('Atteignez vos objectifs'), findsOneWidget);
    expect(find.text('Commencer'), findsOneWidget);
  });

  testWidgets('tapping Passer marks onboarding complete and navigates to login', (tester) async {
    final mockStorage = _MockSecureStorage();
    when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});

    final router = GoRouter(
      initialLocation: '/onboarding',
      routes: [
        GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
        GoRoute(path: '/login', builder: (context, state) => const Scaffold(body: Text('Login page'))),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          secureStorageServiceProvider.overrideWithValue(SecureStorageService(storage: mockStorage)),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    await tester.tap(find.text('Passer'));
    await tester.pumpAndSettle();

    expect(find.text('Login page'), findsOneWidget);
    verify(() => mockStorage.write(key: 'onboarding_complete', value: 'true')).called(1);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd mobile
flutter test test/features/onboarding/presentation/onboarding_screen_test.dart
```
Expected: FAIL — `onboarding_screen.dart` doesn't exist yet.

- [ ] **Step 3: Create the Onboarding screen**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_providers.dart';

class _OnboardingPageData {
  const _OnboardingPageData({required this.icon, required this.title, required this.subtitle});

  final IconData icon;
  final String title;
  final String subtitle;
}

const _pages = [
  _OnboardingPageData(
    icon: Icons.account_balance_wallet_rounded,
    title: 'Prenez le contrôle de votre argent',
    subtitle: 'Suivez facilement vos revenus et vos dépenses.',
  ),
  _OnboardingPageData(
    icon: Icons.donut_large_rounded,
    title: 'Comprenez où va votre argent',
    subtitle: 'Visualisez vos habitudes de dépenses grâce à des statistiques simples.',
  ),
  _OnboardingPageData(
    icon: Icons.flag_rounded,
    title: 'Atteignez vos objectifs',
    subtitle: "Épargnez intelligemment et gardez toujours une longueur d'avance.",
  ),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  Future<void> _finish() async {
    await ref.read(secureStorageServiceProvider).markOnboardingComplete();
    if (!mounted) return;
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _index == _pages.length - 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(onPressed: _finish, child: const Text('Passer')),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (value) => setState(() => _index = value),
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(page.icon, size: 96, color: AppColors.primary),
                        const SizedBox(height: 32),
                        Text(
                          page.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.text,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          page.subtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 15, color: AppColors.secondary),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (isLast) {
                      _finish();
                    } else {
                      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
                    }
                  },
                  child: Text(isLast ? 'Commencer' : 'Continuer'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```
Save as `mobile/lib/features/onboarding/presentation/onboarding_screen.dart`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
flutter test test/features/onboarding/presentation/onboarding_screen_test.dart
```
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add onboarding screens"
```

---

## Task 15: Login screen

**Files:**
- Create: `mobile/lib/features/auth/presentation/login_screen.dart`
- Test: `mobile/test/features/auth/presentation/login_screen_test.dart`

**Interfaces:**
- Consumes: `authControllerProvider` (`.login(...)`), `AuthApiException` (Task 11), `AppTextField`, `PrimaryButton` (Task 8).
- Produces: `LoginScreen` widget (route `/login`), showing "Bon retour" title and a "Se connecter" button, navigating to `/home` on success.

- [ ] **Step 1: Write the failing test**

Create `mobile/test/features/auth/presentation/login_screen_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/features/auth/presentation/login_screen.dart';

void main() {
  testWidgets('shows validation errors for an invalid email and a short password', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: LoginScreen())));

    await tester.enterText(find.byType(TextFormField).at(0), 'not-an-email');
    await tester.enterText(find.byType(TextFormField).at(1), 'short');
    await tester.tap(find.text('Se connecter'));
    await tester.pump();

    expect(find.text('Email invalide'), findsOneWidget);
    expect(find.text('Minimum 8 caractères'), findsOneWidget);
  });

  testWidgets('has links to register and forgot password', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: LoginScreen())));

    expect(find.text('Créer un compte'), findsOneWidget);
    expect(find.text('Mot de passe oublié ?'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd mobile
flutter test test/features/auth/presentation/login_screen_test.dart
```
Expected: FAIL — `login_screen.dart` doesn't exist yet.

- [ ] **Step 3: Create the Login screen**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/auth_api.dart';
import '../domain/auth_state.dart';
import '../providers/auth_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authControllerProvider.notifier).login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
    final state = ref.read(authControllerProvider);
    if (state.hasValue && state.value is AuthAuthenticated) {
      if (!mounted) return;
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;
    final error = authState.hasError ? _errorMessage(authState.error) : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                const Text(
                  'Bon retour',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.text),
                ),
                const SizedBox(height: 24),
                AppTextField(
                  controller: _emailController,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) => (value == null || !value.contains('@')) ? 'Email invalide' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _passwordController,
                  label: 'Mot de passe',
                  obscureText: true,
                  validator: (value) =>
                      (value == null || value.length < 8) ? 'Minimum 8 caractères' : null,
                ),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(error, style: const TextStyle(color: AppColors.danger)),
                ],
                const SizedBox(height: 24),
                PrimaryButton(label: 'Se connecter', isLoading: isLoading, onPressed: _submit),
                TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  child: const Text('Mot de passe oublié ?'),
                ),
                TextButton(
                  onPressed: () => context.push('/register'),
                  child: const Text('Créer un compte'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _errorMessage(Object? error) {
    if (error is AuthApiException) return error.message;
    return 'Une erreur est survenue. Réessayez.';
  }
}
```
Save as `mobile/lib/features/auth/presentation/login_screen.dart`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
flutter test test/features/auth/presentation/login_screen_test.dart
```
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add login screen wired to the auth controller"
```

---

## Task 16: Register screen

**Files:**
- Create: `mobile/lib/features/auth/presentation/register_screen.dart`
- Test: `mobile/test/features/auth/presentation/register_screen_test.dart`

**Interfaces:**
- Consumes: `authControllerProvider` (`.register(...)`), `AuthApiException` (Task 11), `AppTextField`, `PrimaryButton` (Task 8).
- Produces: `RegisterScreen` widget (route `/register`), navigating to `/home` on success.

- [ ] **Step 1: Write the failing test**

Create `mobile/test/features/auth/presentation/register_screen_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/features/auth/presentation/register_screen.dart';

void main() {
  testWidgets('shows a validation error when passwords do not match', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: RegisterScreen())));

    await tester.enterText(find.byType(TextFormField).at(0), 'Jackson');
    await tester.enterText(find.byType(TextFormField).at(1), 'jackson@example.com');
    await tester.enterText(find.byType(TextFormField).at(2), 'password123');
    await tester.enterText(find.byType(TextFormField).at(3), 'different');
    await tester.tap(find.text('Créer mon compte'));
    await tester.pump();

    expect(find.text('Les mots de passe ne correspondent pas'), findsOneWidget);
  });

  testWidgets('requires a non-empty name', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: RegisterScreen())));

    await tester.tap(find.text('Créer mon compte'));
    await tester.pump();

    expect(find.text('Nom requis'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd mobile
flutter test test/features/auth/presentation/register_screen_test.dart
```
Expected: FAIL — `register_screen.dart` doesn't exist yet.

- [ ] **Step 3: Create the Register screen**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/auth_api.dart';
import '../domain/auth_state.dart';
import '../providers/auth_providers.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authControllerProvider.notifier).register(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          passwordConfirmation: _confirmController.text,
        );
    final state = ref.read(authControllerProvider);
    if (state.hasValue && state.value is AuthAuthenticated) {
      if (!mounted) return;
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;
    final error = authState.hasError ? _errorMessage(authState.error) : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Créer un compte',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.text),
                ),
                const SizedBox(height: 24),
                AppTextField(
                  controller: _nameController,
                  label: 'Nom',
                  validator: (value) => (value == null || value.trim().isEmpty) ? 'Nom requis' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _emailController,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) => (value == null || !value.contains('@')) ? 'Email invalide' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _passwordController,
                  label: 'Mot de passe',
                  obscureText: true,
                  validator: (value) =>
                      (value == null || value.length < 8) ? 'Minimum 8 caractères' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _confirmController,
                  label: 'Confirmer le mot de passe',
                  obscureText: true,
                  validator: (value) => value != _passwordController.text
                      ? 'Les mots de passe ne correspondent pas'
                      : null,
                ),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(error, style: const TextStyle(color: AppColors.danger)),
                ],
                const SizedBox(height: 24),
                PrimaryButton(label: 'Créer mon compte', isLoading: isLoading, onPressed: _submit),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _errorMessage(Object? error) {
    if (error is AuthApiException) return error.message;
    return 'Une erreur est survenue. Réessayez.';
  }
}
```
Save as `mobile/lib/features/auth/presentation/register_screen.dart`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
flutter test test/features/auth/presentation/register_screen_test.dart
```
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add register screen wired to the auth controller"
```

---

## Task 17: Forgot password screen

**Files:**
- Create: `mobile/lib/features/auth/presentation/forgot_password_screen.dart`
- Test: `mobile/test/features/auth/presentation/forgot_password_screen_test.dart`

**Interfaces:**
- Consumes: `authRepositoryProvider` (`.forgotPassword(...)`), `AuthApiException` (Task 11), `AppTextField`, `PrimaryButton` (Task 8).
- Produces: `ForgotPasswordScreen` widget (route `/forgot-password`).

- [ ] **Step 1: Write the failing test**

Create `mobile/test/features/auth/presentation/forgot_password_screen_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/database/app_database.dart';
import 'package:finance_app/core/services/api_client.dart';
import 'package:finance_app/features/auth/data/auth_repository.dart';
import 'package:finance_app/features/auth/presentation/forgot_password_screen.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  testWidgets('shows an email validation error before calling the repository', (tester) async {
    final repository = MockAuthRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const MaterialApp(home: ForgotPasswordScreen()),
      ),
    );

    await tester.tap(find.text('Envoyer le lien'));
    await tester.pump();

    expect(find.text('Email invalide'), findsOneWidget);
    verifyNever(() => repository.forgotPassword(any()));
  });

  testWidgets('shows a confirmation after a successful submission', (tester) async {
    final repository = MockAuthRepository();
    when(() => repository.forgotPassword('jackson@example.com')).thenAnswer((_) async {});

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const MaterialApp(home: ForgotPasswordScreen()),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, 'jackson@example.com');
    await tester.tap(find.text('Envoyer le lien'));
    await tester.pumpAndSettle();

    expect(find.text('Un lien de réinitialisation a été envoyé.'), findsOneWidget);
  });
}
```
Note: this test imports `AppDatabase`/`ApiClient` only if needed by the mock setup above — in this case `MockAuthRepository` fully replaces `AuthRepository`, so those two imports are unused and should be removed before running (see Step 2).

- [ ] **Step 2: Remove the unused imports and run the test to verify it fails**

Delete the `core/database/app_database.dart` and `core/services/api_client.dart` imports from the test file (they're not needed — `MockAuthRepository` doesn't touch them), then:
```bash
cd mobile
flutter test test/features/auth/presentation/forgot_password_screen_test.dart
```
Expected: FAIL — `forgot_password_screen.dart` doesn't exist yet.

- [ ] **Step 3: Create the Forgot Password screen**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/auth_api.dart';
import '../providers/auth_providers.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).forgotPassword(_emailController.text.trim());
      if (!mounted) return;
      setState(() => _sent = true);
    } on AuthApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _sent ? _buildSuccess() : _buildForm(),
        ),
      ),
    );
  }

  Widget _buildSuccess() {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.mark_email_read_rounded, size: 64, color: AppColors.success),
        SizedBox(height: 16),
        Text(
          'Un lien de réinitialisation a été envoyé.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: AppColors.text),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Mot de passe oublié',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.text),
          ),
          const SizedBox(height: 8),
          const Text(
            'Entrez votre email pour recevoir un lien de réinitialisation.',
            style: TextStyle(color: AppColors.secondary),
          ),
          const SizedBox(height: 24),
          AppTextField(
            controller: _emailController,
            label: 'Email',
            keyboardType: TextInputType.emailAddress,
            validator: (value) => (value == null || !value.contains('@')) ? 'Email invalide' : null,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
          ],
          const SizedBox(height: 24),
          PrimaryButton(label: 'Envoyer le lien', isLoading: _isLoading, onPressed: _submit),
        ],
      ),
    );
  }
}
```
Save as `mobile/lib/features/auth/presentation/forgot_password_screen.dart`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
flutter test test/features/auth/presentation/forgot_password_screen_test.dart
```
Expected: PASS, 2 tests.

- [ ] **Step 5: Run the full mobile analyzer and test suite**

```bash
flutter analyze
flutter test
```
Expected: `flutter analyze` reports `No issues found!` (the undefined-name errors noted in Task 12/13 are now resolved since all five auth/onboarding screens exist). `flutter test` passes with 0 failures across every test file created in Tasks 7-17, including the Task 13 `splash_redirect_test.dart` which should now compile and pass.

- [ ] **Step 6: Commit**

```bash
cd C:\Budget_app
git add mobile
git commit -m "feat(mobile): add forgot password screen"
```

---

## Task 18: End-to-end verification

**Files:** none created — this task runs both apps together and confirms the full loop works, then does a final full-repo test pass.

**Interfaces:**
- Consumes: everything from Tasks 1-17.
- Produces: a verified working Phase 1 (register → login → home shell → logout → login again), and confirmation that both test suites are green together.

- [ ] **Step 1: Start the Laravel API**

```bash
cd C:\Budget_app\backend
php artisan serve --host=0.0.0.0 --port=8000
```
Leave this running in its own terminal/background process.

- [ ] **Step 2: Run the Flutter app on an Android emulator**

```bash
cd C:\Budget_app\mobile
flutter emulators --launch <emulator_id>
flutter run
```
(List available emulators first with `flutter emulators` if `<emulator_id>` is unknown.) `AppConstants.apiBaseUrl` (`http://10.0.2.2:8000/api`) assumes an Android emulator talking to the host's `localhost:8000` — this is already correct for that setup. If testing on the iOS simulator instead, temporarily change `apiBaseUrl` to `http://localhost:8000/api` for this manual check (don't commit that change — Phase 7 introduces a proper environment-based config).

- [ ] **Step 3: Walk the golden path manually**

1. App opens on Splash, then Onboarding (three swipeable pages, purple Liquid Glass icons and copy match §9 of `MASTER_SPEC.md`).
2. Tap "Commencer" → lands on Login.
3. Tap "Créer un compte" → fill in a real name/email/password/confirm → tap "Créer mon compte".
4. Expected: a network request hits the running `php artisan serve` (visible in its terminal output as `POST /api/register`), the app navigates to the Home tab shell with the bottom nav (Home/Stats/Budget/Profile) and centered `+` FAB.
5. Tap `+` → bottom sheet shows Dépense/Revenu/Transfert → tapping any of them shows the "Disponible dans une prochaine phase." snackbar and closes the sheet.
6. Tap the Profile tab → tap "Se déconnecter" → app navigates back to Login.
7. Log back in with the same email/password used in step 3 → confirm it succeeds and lands on Home again (proves the backend persisted the user and the login endpoint works, independent of the register flow).
8. Stop the app, relaunch it (`flutter run` again, or hot-restart) → confirm it goes straight to Home without showing Login (proves the cached token + drift-cached user + Splash redirect logic work across a cold start).

If any step fails, fix the root cause in the relevant task's files (don't patch around it here) and re-run the affected task's tests before continuing.

- [ ] **Step 4: Run both full test suites**

```bash
cd C:\Budget_app\backend
php artisan test
```
Expected: all Auth feature tests + default example tests pass, 0 failures.

```bash
cd C:\Budget_app\mobile
flutter analyze
flutter test
```
Expected: `No issues found!` and all tests pass, 0 failures.

- [ ] **Step 5: Final commit**

```bash
cd C:\Budget_app
git status
git add -A
git commit -m "chore: verify Phase 1 end-to-end (register/login/logout, cold-start session restore)"
```
(If `git status` shows nothing to commit because every task already committed its own changes, skip this — that's fine, it means the history is already clean.)

---

## What's next

Phase 1 is done when Task 18 passes. Phase 2 (Core finance — accounts, categories, income, expenses, transactions, dashboard) gets its own implementation plan at that point, written against whatever Phase 1 actually produced (per design doc §8) rather than planned blind right now.
