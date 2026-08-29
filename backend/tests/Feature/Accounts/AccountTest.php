<?php

namespace Tests\Feature\Accounts;

use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_only_the_authenticated_users_accounts(): void
    {
        $user = User::factory()->create();
        Account::factory()->for($user)->create(['name' => 'Cash']);
        Account::factory()->create(['name' => 'Someone else']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/accounts');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.name', 'Cash');
    }

    public function test_it_creates_an_account_for_the_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/accounts', [
            'name' => 'Orange Money',
            'type' => 'orange_money',
            'balance' => 10000,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Orange Money')
            ->assertJsonPath('data.balance', 10000);

        $this->assertDatabaseHas('accounts', ['user_id' => $user->id, 'name' => 'Orange Money']);
    }

    public function test_it_rejects_an_invalid_account_type(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/accounts', [
            'name' => 'Compte',
            'type' => 'bitcoin_wallet',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('type');
    }

    public function test_it_updates_an_account_belonging_to_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['name' => 'Cash']);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/accounts/{$account->id}", [
            'name' => 'Cash renommé',
        ]);

        $response->assertStatus(200)->assertJsonPath('data.name', 'Cash renommé');
    }

    public function test_it_rejects_updating_another_users_account(): void
    {
        $user = User::factory()->create();
        $otherAccount = Account::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/accounts/{$otherAccount->id}", [
            'name' => 'Piraté',
        ]);

        $response->assertStatus(404);
    }

    public function test_it_deletes_an_account_with_no_transactions(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/accounts/{$account->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('accounts', ['id' => $account->id]);
    }

    public function test_it_rejects_deleting_an_account_with_transactions(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $account->transactions()->create([
            'user_id' => $user->id,
            'type' => 'expense',
            'amount' => 1000,
            'category_id' => Category::factory()->for($user)->create()->id,
            'date' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/accounts/{$account->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('accounts', ['id' => $account->id]);
    }
}
