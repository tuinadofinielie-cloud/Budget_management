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
