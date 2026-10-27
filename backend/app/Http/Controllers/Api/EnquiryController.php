<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Notifications\NewEnquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Throwable;

class EnquiryController extends Controller
{
    public function options(): JsonResponse
    {
        return response()->json(['data' => [
            'services' => Enquiry::serviceOptions(),
            'budgets' => Enquiry::BUDGETS,
            'timelines' => Enquiry::TIMELINES,
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:254'],
            'company' => ['nullable', 'string', 'max:160'],
            'service' => ['required', Rule::in(Enquiry::serviceOptions())],
            'budget' => ['required', Rule::in(Enquiry::BUDGETS)],
            'timeline' => ['required', Rule::in(Enquiry::TIMELINES)],
            'idea' => ['required', 'string', 'min:10', 'max:5000'],
            // Honeypot: hidden in the form, so only bots fill it in.
            'website' => ['prohibited'],
        ]);

        $enquiry = Enquiry::create($data);

        // The enquiry is already saved and visible in /admin, so a mail outage must not fail the request.
        try {
            Notification::route('mail', config('mail.enquiries_to'))->notify(new NewEnquiry($enquiry));
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json(['message' => 'Thanks, your enquiry has been sent.'], 201);
    }
}
