<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddonRequest;
use App\Http\Requests\Admin\PriceRequest;
use App\Models\Addon;
use Illuminate\Http\JsonResponse;

class AddonController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Addon::with('category:id,name')->orderBy('pricing_category_id')->ordered()->get()]);
    }

    public function show(Addon $addon): JsonResponse
    {
        return response()->json(['data' => $addon]);
    }

    public function store(AddonRequest $request): JsonResponse
    {
        return response()->json(['data' => Addon::create($request->validated())], 201);
    }

    public function update(AddonRequest $request, Addon $addon): JsonResponse
    {
        $addon->update($request->validated());

        return response()->json(['data' => $addon]);
    }

    public function price(PriceRequest $request, Addon $addon): JsonResponse
    {
        $addon->update($request->validated());

        return response()->json(['data' => $addon]);
    }

    public function destroy(Addon $addon): JsonResponse
    {
        $addon->delete();

        return response()->json(null, 204);
    }
}
