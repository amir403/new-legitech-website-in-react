<?php

namespace App\Http\Resources;

use App\Support\Price;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Addon */
class AddonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'min_price' => (float) $this->min_price,
            'max_price' => (float) $this->max_price,
            'price_display' => Price::range($this->min_price, $this->max_price),
        ];
    }
}
