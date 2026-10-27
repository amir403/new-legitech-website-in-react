<?php

namespace App\Http\Resources;

use App\Support\Price;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Package */
class PackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'tier' => $this->tier,
            'description' => $this->description,
            'min_price' => (float) $this->min_price,
            'max_price' => (float) $this->max_price,
            'currency' => $this->currency,
            'price_display' => Price::range($this->min_price, $this->max_price),
            'delivery_time' => $this->delivery_time,
            'revisions' => $this->revisions,
            'support_period' => $this->support_period,
            'monthly_maintenance_min' => $this->monthly_maintenance_min === null ? null : (float) $this->monthly_maintenance_min,
            'monthly_maintenance_max' => $this->monthly_maintenance_max === null ? null : (float) $this->monthly_maintenance_max,
            'monthly_maintenance_display' => Price::range($this->monthly_maintenance_min, $this->monthly_maintenance_max),
            'features' => $this->whenLoaded('features', fn () => $this->features->map->only(['label', 'value'])),
        ];
    }
}
