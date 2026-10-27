<?php

namespace App\Models\Concerns;

use App\Http\Controllers\Api\PricingController;
use Illuminate\Support\Facades\Cache;

/** Any saved or deleted pricing row clears the cached GET /api/pricing response. */
trait FlushesPricingCache
{
    protected static function bootFlushesPricingCache(): void
    {
        $flush = fn () => Cache::forget(PricingController::CACHE_KEY);
        static::saved($flush);
        static::deleted($flush);
    }
}
