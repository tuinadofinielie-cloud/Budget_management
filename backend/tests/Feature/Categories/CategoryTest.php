<?php

namespace Tests\Feature\Categories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_only_the_authenticated_users_categories(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->create(['name' => 'Nourriture', 'type' => 'expense']);
        Category::factory()->create(['name' => 'Autre utilisateur']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/categories');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.name', 'Nourriture');
    }

    public function test_it_filters_categories_by_type(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->create(['type' => 'expense']);
        Category::factory()->for($user)->create(['type' => 'income']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/categories?type=income');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.type', 'income');
    }
}
