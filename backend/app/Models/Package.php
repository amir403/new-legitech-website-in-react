<?php

namespace App\Models;

use App\Models\Concerns\FlushesPricingCache;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['pricing_category_id', 'name', 'tier', 'description', 'min_price', 'max_price', 'currency', 'delivery_time', 'revisions', 'support_period', 'monthly_maintenance_min', 'monthly_maintenance_max', 'is_active', 'sort_order'])]
class Package extends Model
{
    use FlushesPricingCache;

    protected function casts(): array
    {
        return [
            'min_price' => 'decimal:2',
            'max_price' => 'decimal:2',
            'monthly_maintenance_min' => 'decimal:2',
            'monthly_maintenance_max' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PricingCategory::class, 'pricing_category_id');
    }

    public function features(): HasMany
    {
        return $this->hasMany(PackageFeature::class)->orderBy('sort_order');
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
