<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->word(),
            'icon' => '📦',
            'color' => '#7C5CFF',
            'type' => fake()->randomElement(['income', 'expense']),
        ];
    }
}
