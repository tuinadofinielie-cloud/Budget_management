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
