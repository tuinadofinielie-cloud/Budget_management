<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $request->validate([
            'type' => ['sometimes', Rule::in(['income', 'expense'])],
        ]);

        $categories = $request->user()->categories()
            ->when($request->query('type'), fn ($query, $type) => $query->where('type', $type))
            ->orderBy('name')
            ->get();

        return $this->success(CategoryResource::collection($categories));
    }
}
