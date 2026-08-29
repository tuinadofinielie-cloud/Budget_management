<?php

namespace App\Services;

use App\Models\Category;
use App\Models\User;

class DefaultCategorySeeder
{
    /**
     * @var array<int, array{name: string, icon: string, color: string, type: string}>
     */
    private const CATEGORIES = [
        ['name' => 'Nourriture', 'icon' => '🍚', 'color' => '#FF9F71', 'type' => 'expense'],
        ['name' => 'Essence', 'icon' => '⛽', 'color' => '#FFB547', 'type' => 'expense'],
        ['name' => 'Transport', 'icon' => '🚗', 'color' => '#5D8CFF', 'type' => 'expense'],
        ['name' => 'Logement', 'icon' => '🏠', 'color' => '#7C5CFF', 'type' => 'expense'],
        ['name' => 'Téléphone / Internet', 'icon' => '📱', 'color' => '#A98CFF', 'type' => 'expense'],
        ['name' => 'Études', 'icon' => '📚', 'color' => '#5B3FD4', 'type' => 'expense'],
        ['name' => 'Loisirs', 'icon' => '🎮', 'color' => '#FF6FB1', 'type' => 'expense'],
        ['name' => 'Shopping', 'icon' => '🛍️', 'color' => '#FF5C73', 'type' => 'expense'],
        ['name' => 'Santé', 'icon' => '❤️', 'color' => '#35B77A', 'type' => 'expense'],
        ['name' => 'Imprévus', 'icon' => '🆘', 'color' => '#FF8A5C', 'type' => 'expense'],
        ['name' => 'Autres', 'icon' => '📦', 'color' => '#77738A', 'type' => 'expense'],

        ['name' => 'Stage', 'icon' => '💼', 'color' => '#35B77A', 'type' => 'income'],
        ['name' => 'Projet', 'icon' => '📁', 'color' => '#5D8CFF', 'type' => 'income'],
        ['name' => 'Freelance', 'icon' => '💻', 'color' => '#7C5CFF', 'type' => 'income'],
        ['name' => 'Salaire', 'icon' => '💰', 'color' => '#5B3FD4', 'type' => 'income'],
        ['name' => 'Cadeau', 'icon' => '🎁', 'color' => '#FF6FB1', 'type' => 'income'],
        ['name' => 'Autres', 'icon' => '📦', 'color' => '#77738A', 'type' => 'income'],
    ];

    public function seedFor(User $user): void
    {
        $rows = array_map(
            fn (array $category) => [
                ...$category,
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            self::CATEGORIES,
        );

        Category::insert($rows);
    }
}
