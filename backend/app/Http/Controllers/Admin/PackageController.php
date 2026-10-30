<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PackageRequest;
use App\Http\Requests\Admin\PriceRequest;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Admin CRUD for packages. Features come with the package and are replaced as a whole, in the order sent. */
class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Package::with(['features', 'category:id,name'])->orderBy('pricing_category_id')->ordered()->get()]);
    }

    public function show(Package $package): JsonResponse
    {
        return response()->json(['data' => $package->load('features')]);
    }

    public function store(PackageRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->save(new Package, $request->validated())], 201);
    }

    public function update(PackageRequest $request, Package $package): JsonResponse
    {
        return response()->json(['data' => $this->save($package, $request->validated())]);
    }

    public function price(PriceRequest $request, Package $package): JsonResponse
    {
        $package->update($request->validated());

        return response()->json(['data' => $package]);
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json(null, 204);
    }

    private function save(Package $package, array $data): Package
    {
        return DB::transaction(function () use ($package, $data) {
            $package->fill(collect($data)->except('features')->all())->save();
            $package->features()->delete();
            foreach (array_values($data['features']) as $i => $feature) {
                $package->features()->create([...$feature, 'sort_order' => $i + 1]);
            }

            return $package->load('features');
        });
    }
}
