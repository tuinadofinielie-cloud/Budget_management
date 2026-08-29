<?php

namespace App\Http\Requests\Budgets;

use App\Models\Budget;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],
            'amount' => ['required', 'integer', 'min:1'],
            'period' => ['sometimes', Rule::in(['monthly'])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $duplicate = Budget::query()
                ->where('user_id', $this->user()->id)
                ->where('category_id', $this->input('category_id'))
                ->exists();

            if ($duplicate) {
                $validator->errors()->add(
                    'category_id',
                    $this->input('category_id')
                        ? 'Un budget existe déjà pour cette catégorie.'
                        : 'Un budget global existe déjà.'
                );
            }
        });
    }
}
