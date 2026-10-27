<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PricingCategory */
class PricingCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'packages' => PackageResource::collection($this->whenLoaded('packages')),
            'addons' => AddonResource::collection($this->whenLoaded('addons')),
        ];
    }
}
