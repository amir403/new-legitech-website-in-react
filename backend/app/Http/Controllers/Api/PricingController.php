<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddonResource;
use App\Http\Resources\BundleResource;
use App\Http\Resources\PackageResource;
use App\Http\Resources\PricingCategoryResource;
use App\Models\Addon;
use App\Models\Bundle;
use App\Models\Package;
use App\Models\PricingCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

/** Public pricing. Only active rows are returned. The admin pricing controllers flush CACHE_KEY on every write. */
class PricingController extends Controller
{
    public const CACHE_KEY = 'pricing';

    public function index(Request $request): JsonResponse
    {
        // Cache plain arrays: nested resource objects can't be unserialized by the database/file cache stores.
        $data = Cache::remember(self::CACHE_KEY, 3600, fn () => json_decode(json_encode([
            'categories' => PricingCategoryResource::collection(PricingCategory::ordered()->with([
                'packages' => fn ($q) => $q->active()->ordered()->with('features'),
                'addons' => fn ($q) => $q->active()->ordered(),
            ])->get()),
            'general_addons' => AddonResource::collection(Addon::active()->ordered()->whereNull('pricing_category_id')->get()),
            'bundles' => BundleResource::collection($this->bundleQuery()->get()),
        ], JSON_THROW_ON_ERROR), true));

        return response()->json(['data' => $data]);
    }

    public function packages(Request $request): AnonymousResourceCollection
    {
        return PackageResource::collection(
            $this->inCategory(Package::active()->ordered()->with('features'), $request)->get(),
        );
    }

    public function addons(Request $request): AnonymousResourceCollection
    {
        return AddonResource::collection($this->inCategory(Addon::active()->ordered(), $request)->get());
    }

    public function bundles(Request $request): AnonymousResourceCollection
    {
        return BundleResource::collection($this->inCategory($this->bundleQuery(), $request)->get());
    }

    private function bundleQuery(): Builder
    {
        return Bundle::active()->ordered()->with(['category', 'package', 'addons']);
    }

    /** ?category=<slug> narrows to that category; no parameter returns everything. */
    private function inCategory(Builder $query, Request $request): Builder
    {
        $slug = $request->query('category');

        return is_string($slug) ? $query->whereHas('category', fn ($q) => $q->where('slug', $slug)) : $query;
    }
}
