<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BundleRequest;
use App\Http\Requests\Admin\PriceRequest;
use App\Models\Bundle;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Admin CRUD for bundles. addon_ids replaces the bundle's add-ons. */
class BundleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Bundle::with('addons:id,name')->ordered()->get()]);
    }

    public function show(Bundle $bundle): JsonResponse
    {
        return response()->json(['data' => $bundle->load('addons:id,name')]);
    }

    public function store(BundleRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->save(new Bundle, $request->validated())], 201);
    }

    public function update(BundleRequest $request, Bundle $bundle): JsonResponse
    {
        return response()->json(['data' => $this->save($bundle, $request->validated())]);
    }

    public function price(PriceRequest $request, Bundle $bundle): JsonResponse
    {
        $bundle->update($request->validated());

        return response()->json(['data' => $bundle]);
    }

    public function destroy(Bundle $bundle): JsonResponse
    {
        $bundle->delete();

        return response()->json(null, 204);
    }

    private function save(Bundle $bundle, array $data): Bundle
    {
        return DB::transaction(function () use ($bundle, $data) {
            $bundle->fill(collect($data)->except('addon_ids')->all())->save();
            $bundle->addons()->sync($data['addon_ids']);

            return $bundle->load('addons:id,name');
        });
    }
}
