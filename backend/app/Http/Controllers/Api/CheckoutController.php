<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Notifications\OrderPaid;
use App\Services\StripeCheckout;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Throwable;
use UnexpectedValueException;

/**
 * Online payment through Stripe Checkout. The amount always comes from the database (the item's "from" price),
 * never from the browser, and an order only becomes paid when Stripe's signed webhook says so.
 */
class CheckoutController extends Controller
{
    public function __construct(private StripeCheckout $stripe) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_type' => ['required', Rule::in(array_keys(Order::ITEMS))],
            'item_id' => ['required', 'integer'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:254'],
            'company' => ['nullable', 'string', 'max:160'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'accept_terms' => ['accepted'],
            // Honeypot: hidden in the form, so only bots fill it in.
            'website' => ['prohibited'],
        ]);

        if (! $this->stripe->enabled()) {
            return response()->json(['message' => 'Online payment is not available yet. Please get in touch and we will send you a payment link.'], 503);
        }

        $item = Order::ITEMS[$data['item_type']]::active()->find($data['item_id']);
        if (! $item) {
            throw ValidationException::withMessages(['item_id' => 'This item is no longer available.']);
        }

        $order = Order::create([
            'item_type' => $data['item_type'],
            'item_id' => $item->id,
            'item_name' => $data['item_type'] === 'package' ? "{$item->name} package" : $item->name,
            'amount' => $item->min_price,
            'customer_name' => $data['name'],
            'customer_email' => $data['email'],
            'company' => $data['company'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        try {
            $session = $this->stripe->createSession($order);
        } catch (ApiErrorException $e) {
            report($e);
            $order->update(['status' => 'failed']);

            return response()->json(['message' => 'We could not start the payment. Please try again in a moment.'], 502);
        }

        $order->update(['stripe_session_id' => $session['id']]);

        return response()->json(['url' => $session['url']], 201);
    }

    /** For the success page. The Checkout Session id is unguessable, and only non-personal fields are returned. */
    public function show(string $sessionId): JsonResponse
    {
        $order = Order::where('stripe_session_id', $sessionId)->firstOrFail();

        return response()->json(['data' => [
            'reference' => $order->reference,
            'item_name' => $order->item_name,
            'amount' => (float) $order->amount,
            'status' => $order->status,
        ]]);
    }

    public function webhook(Request $request): JsonResponse
    {
        try {
            $event = $this->stripe->verifyWebhook($request->getContent(), (string) $request->header('Stripe-Signature'));
        } catch (SignatureVerificationException|UnexpectedValueException) {
            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $object = $event->data->object;

        match ($event->type) {
            // Cards and Klarna are usually paid at completion; slower methods report later via async_payment_*.
            'checkout.session.completed' => $object->payment_status === 'paid' ? $this->markPaid($object) : null,
            'checkout.session.async_payment_succeeded' => $this->markPaid($object),
            'checkout.session.async_payment_failed' => $this->orderFor($object)->where('status', 'pending')->update(['status' => 'failed']),
            'checkout.session.expired' => $this->orderFor($object)->where('status', 'pending')->update(['status' => 'expired']),
            'charge.refunded' => $object->refunded
                ? Order::where('stripe_payment_intent', $object->payment_intent)->update(['status' => 'refunded'])
                : null,
            default => null,
        };

        // Always 200 for a verified event, so Stripe stops retrying ones we don't act on.
        return response()->json(['received' => true]);
    }

    private function orderFor(object $session): Builder
    {
        return Order::where('stripe_session_id', $session->id);
    }

    /** Stripe retries webhooks, so this must be safe to run twice: only a pending order is updated and emailed. */
    private function markPaid(object $session): void
    {
        $order = Order::where('stripe_session_id', $session->id)->where('status', 'pending')->first();
        if (! $order) {
            return;
        }

        $order->update(['status' => 'paid', 'paid_at' => now(), 'stripe_payment_intent' => $session->payment_intent]);

        // The payment is already recorded and visible in /admin, so a mail outage must not fail the webhook.
        try {
            Notification::route('mail', config('mail.enquiries_to'))->notify(new OrderPaid($order, forCustomer: false));
            Notification::route('mail', [$order->customer_email => $order->customer_name])->notify(new OrderPaid($order, forCustomer: true));
        } catch (Throwable $e) {
            report($e);
        }
    }
}
