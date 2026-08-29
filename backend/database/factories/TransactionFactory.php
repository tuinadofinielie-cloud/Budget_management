<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'expense',
            'amount' => fake()->numberBetween(500, 50000),
            'category_id' => Category::factory(),
            'account_id' => Account::factory(),
            'to_account_id' => null,
            'description' => fake()->sentence(3),
            'date' => fake()->date(),
        ];
    }
}
