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
