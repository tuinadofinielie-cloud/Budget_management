<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transactions\StoreTransactionRequest;
use App\Http\Requests\Transactions\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\TransactionBalanceService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $request->validate([
            'type' => ['sometimes', Rule::in(['income', 'expense', 'transfer'])],
            'category_id' => ['sometimes', 'integer'],
            'account_id' => ['sometimes', 'integer'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'search' => ['sometimes', 'string'],
        ]);

        $paginator = $request->user()->transactions()
            ->when($request->query('type'), fn ($query, $type) => $query->where('type', $type))
            ->when($request->query('category_id'), fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->query('account_id'), fn ($query, $id) => $query->where(
                fn ($sub) => $sub->where('account_id', $id)->orWhere('to_account_id', $id)
            ))
            ->when($request->query('date_from'), fn ($query, $date) => $query->whereDate('date', '>=', $date))
            ->when($request->query('date_to'), fn ($query, $date) => $query->whereDate('date', '<=', $date))
            ->when($request->query('search'), fn ($query, $search) => $query->where('description', 'like', "%{$search}%"))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(30);

        return $this->success([
            'transactions' => TransactionResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(StoreTransactionRequest $request, TransactionBalanceService $balances)
    {
        $transaction = DB::transaction(function () use ($request, $balances) {
            $transaction = $request->user()->transactions()->create($request->validated());
            $balances->apply($transaction);

            return $transaction;
        });

        return $this->success(new TransactionResource($transaction), 'Transaction ajoutée avec succès.', 201);
    }

    public function show(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) {
            abort(404);
        }

        return $this->success(new TransactionResource($transaction));
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction, TransactionBalanceService $balances)
    {
        if ($transaction->user_id !== $request->user()->id) {
            abort(404);
        }

        DB::transaction(function () use ($request, $transaction, $balances) {
            $balances->revert($transaction);
            $transaction->update($request->validated());
            $balances->apply($transaction);
        });

        return $this->success(new TransactionResource($transaction->fresh()), 'Transaction mise à jour avec succès.');
    }

    public function destroy(Request $request, Transaction $transaction, TransactionBalanceService $balances)
    {
        if ($transaction->user_id !== $request->user()->id) {
            abort(404);
        }

        DB::transaction(function () use ($transaction, $balances) {
            $balances->revert($transaction);
            $transaction->delete();
        });

        return $this->success(null, 'Transaction supprimée avec succès.');
    }
}
