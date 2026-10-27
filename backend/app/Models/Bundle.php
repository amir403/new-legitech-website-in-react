<?php

namespace App\Models;

use App\Models\Concerns\FlushesPricingCache;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['pricing_category_id', 'package_id', 'name', 'description', 'min_price', 'max_price', 'is_active', 'sort_order'])]
class Bundle extends Model
{
    use FlushesPricingCache;

    protected function casts(): array
    {
        return ['min_price' => 'decimal:2', 'max_price' => 'decimal:2', 'is_active' => 'boolean'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PricingCategory::class, 'pricing_category_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function addons(): BelongsToMany
    {
        return $this->belongsToMany(Addon::class)->orderBy('sort_order');
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query->orderBy('sort_order');
    }
}
