<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\StoreAccountRequest;
use App\Http\Requests\Accounts\UpdateAccountRequest;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $accounts = $request->user()->accounts()->orderBy('name')->get();

        return $this->success(AccountResource::collection($accounts));
    }

    public function store(StoreAccountRequest $request)
    {
        $account = $request->user()->accounts()->create([
            'name' => $request->validated('name'),
            'type' => $request->validated('type'),
            'balance' => $request->validated('balance', 0),
            'currency' => $request->validated('currency') ?? $request->user()->currency ?? 'XOF',
        ]);

        return $this->success(new AccountResource($account), 'Compte créé avec succès.', 201);
    }

    public function update(UpdateAccountRequest $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            abort(404);
        }

        $account->update($request->validated());

        return $this->success(new AccountResource($account), 'Compte mis à jour avec succès.');
    }

    public function destroy(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            abort(404);
        }

        if ($account->transactions()->exists() || $account->incomingTransfers()->exists()) {
            return $this->error(
                'Ce compte a des transactions associées et ne peut pas être supprimé.',
                ['account' => ['Ce compte a des transactions associées et ne peut pas être supprimé.']],
            );
        }

        $account->delete();

        return $this->success(null, 'Compte supprimé avec succès.');
    }
}
