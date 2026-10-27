<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Enquiries are what visitors sent, so admins can only change the status or delete them, never edit the content. */
class EnquiryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => ['nullable', Rule::in(array_keys(Enquiry::STATUSES))]]);

        return response()->json(
            Enquiry::when($request->status, fn ($q, $status) => $q->where('status', $status))->latest()->paginate(25),
        );
    }

    public function update(Request $request, Enquiry $enquiry): JsonResponse
    {
        $enquiry->update($request->validate(['status' => ['required', Rule::in(array_keys(Enquiry::STATUSES))]]));

        return response()->json(['data' => $enquiry]);
    }

    public function destroy(Enquiry $enquiry): JsonResponse
    {
        $enquiry->delete();

        return response()->json(null, 204);
    }
}
