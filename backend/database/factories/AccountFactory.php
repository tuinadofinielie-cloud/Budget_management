<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Cash', 'Orange Money', 'Compte principal']),
            'type' => fake()->randomElement(['cash', 'orange_money', 'moov_money', 'bank', 'card', 'other']),
            'balance' => 0,
            'currency' => 'XOF',
        ];
    }
}
