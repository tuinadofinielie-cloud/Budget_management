<?php

namespace App\Http\Requests\Transactions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userAccounts = Rule::exists('accounts', 'id')->where('user_id', $this->user()->id);
        $userCategories = Rule::exists('categories', 'id')->where('user_id', $this->user()->id);

        return [
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'amount' => ['required', 'integer', 'min:1'],
            'account_id' => ['required', 'integer', $userAccounts],
            'category_id' => [
                Rule::requiredIf(in_array($this->input('type'), ['income', 'expense'], true)),
                'nullable',
                'integer',
                $userCategories,
            ],
            'to_account_id' => [
                Rule::requiredIf($this->input('type') === 'transfer'),
                'nullable',
                'integer',
                'different:account_id',
                $userAccounts,
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
        ];
    }
}
