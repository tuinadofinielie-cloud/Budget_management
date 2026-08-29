<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;

class TransactionBalanceService
{
    /**
     * Apply a transaction's effect on its account balance(s).
     */
    public function apply(Transaction $transaction): void
    {
        match ($transaction->type) {
            'expense' => Account::whereKey($transaction->account_id)->decrement('balance', $transaction->amount),
            'income' => Account::whereKey($transaction->account_id)->increment('balance', $transaction->amount),
            'transfer' => $this->applyTransfer($transaction),
            default => null,
        };
    }

    /**
     * Reverse a transaction's previously-applied effect on its account balance(s).
     */
    public function revert(Transaction $transaction): void
    {
        match ($transaction->type) {
            'expense' => Account::whereKey($transaction->account_id)->increment('balance', $transaction->amount),
            'income' => Account::whereKey($transaction->account_id)->decrement('balance', $transaction->amount),
            'transfer' => $this->revertTransfer($transaction),
            default => null,
        };
    }

    private function applyTransfer(Transaction $transaction): void
    {
        Account::whereKey($transaction->account_id)->decrement('balance', $transaction->amount);
        Account::whereKey($transaction->to_account_id)->increment('balance', $transaction->amount);
    }

    private function revertTransfer(Transaction $transaction): void
    {
        Account::whereKey($transaction->account_id)->increment('balance', $transaction->amount);
        Account::whereKey($transaction->to_account_id)->decrement('balance', $transaction->amount);
    }
}
