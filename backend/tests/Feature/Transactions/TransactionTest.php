<?php

namespace Tests\Feature\Transactions;

use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_expense_decreases_the_account_balance(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->create(['type' => 'expense']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 2500,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now()->toDateString(),
            'description' => 'Déjeuner',
        ]);

        $response->assertStatus(201);
        $this->assertSame(7500, $account->fresh()->balance);
    }

    public function test_creating_an_income_increases_the_account_balance(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->create(['type' => 'income']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'income',
            'amount' => 50000,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertSame(60000, $account->fresh()->balance);
    }

    public function test_creating_a_transfer_moves_money_between_two_accounts(): void
    {
        $user = User::factory()->create();
        $from = Account::factory()->for($user)->create(['balance' => 10000]);
        $to = Account::factory()->for($user)->create(['balance' => 0]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'transfer',
            'amount' => 4000,
            'account_id' => $from->id,
            'to_account_id' => $to->id,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertSame(6000, $from->fresh()->balance);
        $this->assertSame(4000, $to->fresh()->balance);
    }

    public function test_a_transfer_requires_a_different_destination_account(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'transfer',
            'amount' => 1000,
            'account_id' => $account->id,
            'to_account_id' => $account->id,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('to_account_id');
    }

    public function test_an_expense_requires_a_category(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 1000,
            'account_id' => $account->id,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_it_rejects_an_account_belonging_to_another_user(): void
    {
        $user = User::factory()->create();
        $otherAccount = Account::factory()->create();
        $category = Category::factory()->for($user)->create(['type' => 'expense']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 1000,
            'account_id' => $otherAccount->id,
            'category_id' => $category->id,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('account_id');
    }

    public function test_updating_a_transaction_reverts_the_old_effect_and_applies_the_new_one(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->create(['type' => 'expense']);

        $create = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 2000,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now()->toDateString(),
        ]);
        $transactionId = $create->json('data.id');
        $this->assertSame(8000, $account->fresh()->balance);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/transactions/{$transactionId}", [
            'type' => 'expense',
            'amount' => 5000,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(200);
        $this->assertSame(5000, $account->fresh()->balance);
    }

    public function test_deleting_a_transaction_reverts_its_effect_on_the_account_balance(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $category = Category::factory()->for($user)->create(['type' => 'expense']);

        $create = $this->actingAs($user, 'sanctum')->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 2500,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => now()->toDateString(),
        ]);
        $transactionId = $create->json('data.id');
        $this->assertSame(7500, $account->fresh()->balance);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/transactions/{$transactionId}");

        $response->assertStatus(200);
        $this->assertSame(10000, $account->fresh()->balance);
        $this->assertDatabaseMissing('transactions', ['id' => $transactionId]);
    }

    public function test_it_filters_transactions_by_type(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $expenseCategory = Category::factory()->for($user)->create(['type' => 'expense']);
        $incomeCategory = Category::factory()->for($user)->create(['type' => 'income']);

        $account->transactions()->create([
            'user_id' => $user->id, 'type' => 'expense', 'amount' => 1000,
            'category_id' => $expenseCategory->id, 'date' => now(),
        ]);
        $account->transactions()->create([
            'user_id' => $user->id, 'type' => 'income', 'amount' => 5000,
            'category_id' => $incomeCategory->id, 'date' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/transactions?type=income');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.transactions'));
        $response->assertJsonPath('data.transactions.0.type', 'income');
    }

    public function test_it_only_lists_the_authenticated_users_transactions(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherAccount = Account::factory()->for($otherUser)->create();
        $otherCategory = Category::factory()->for($otherUser)->create(['type' => 'expense']);
        $otherAccount->transactions()->create([
            'user_id' => $otherUser->id, 'type' => 'expense', 'amount' => 1000,
            'category_id' => $otherCategory->id, 'date' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/transactions');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data.transactions'));
    }
}
