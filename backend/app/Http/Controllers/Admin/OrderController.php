<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Orders are payment records: read-only here. Refunds are made in the Stripe Dashboard and arrive via the webhook. */
class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => ['nullable', Rule::in(array_keys(Order::STATUSES))]]);

        return response()->json(
            Order::when($request->status, fn ($q, $status) => $q->where('status', $status))->latest()->paginate(25),
        );
    }
}
