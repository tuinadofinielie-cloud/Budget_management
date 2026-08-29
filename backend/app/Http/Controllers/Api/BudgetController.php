<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budgets\StoreBudgetRequest;
use App\Http\Requests\Budgets\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $budgets = $request->user()->budgets()->orderByDesc('created_at')->get();

        return $this->success(BudgetResource::collection($budgets));
    }

    public function store(StoreBudgetRequest $request)
    {
        $budget = $request->user()->budgets()->create([
            'category_id' => $request->validated('category_id'),
            'amount' => $request->validated('amount'),
            'period' => $request->validated('period', 'monthly'),
        ]);

        return $this->success(new BudgetResource($budget), 'Budget créé avec succès.', 201);
    }

    public function update(UpdateBudgetRequest $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(404);
        }

        $budget->update($request->validated());

        return $this->success(new BudgetResource($budget), 'Budget mis à jour avec succès.');
    }

    public function destroy(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(404);
        }

        $budget->delete();

        return $this->success(null, 'Budget supprimé avec succès.');
    }
}
