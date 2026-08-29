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
