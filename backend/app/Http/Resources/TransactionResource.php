<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'amount' => $this->amount,
            'category_id' => $this->category_id,
            'account_id' => $this->account_id,
            'to_account_id' => $this->to_account_id,
            'description' => $this->description,
            'date' => $this->date->toDateString(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
