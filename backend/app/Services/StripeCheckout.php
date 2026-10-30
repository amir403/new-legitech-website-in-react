<?php

namespace App\Services;

use App\Models\Order;
use Stripe\Event;
use Stripe\StripeClient;
use Stripe\Webhook;

/** The only place that talks to Stripe, so tests can swap it out. */
class StripeCheckout
{
    public function enabled(): bool
    {
        return filled(config('services.stripe.secret')) && filled(config('services.stripe.webhook_secret'));
    }

    /**
     * Hosted Stripe Checkout for one order. Payment methods are not listed here on purpose: Checkout shows whatever
     * is switched on in the Stripe Dashboard (cards, Apple/Google Pay, Klarna) that suits the amount and customer.
     *
     * @return array{id: string, url: string}
     */
    public function createSession(Order $order): array
    {
        $site = config('services.stripe.site_url');
        $session = (new StripeClient(config('services.stripe.secret')))->checkout->sessions->create([
            'mode' => 'payment',
            'customer_email' => $order->customer_email,
            'client_reference_id' => $order->reference,
            'metadata' => ['order_id' => $order->id, 'reference' => $order->reference],
            'payment_intent_data' => ['metadata' => ['order_id' => $order->id, 'reference' => $order->reference]],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($order->currency),
                    // Stripe takes the smallest currency unit (pence).
                    'unit_amount' => (int) round($order->amount * 100),
                    'product_data' => ['name' => $order->item_name],
                ],
            ]],
            'success_url' => $site.'/checkout/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $site.'/checkout/cancelled',
        ], ['idempotency_key' => 'order-'.$order->reference]);

        return ['id' => $session->id, 'url' => $session->url];
    }

    /** Throws \Stripe\Exception\SignatureVerificationException or \UnexpectedValueException when the request isn't from Stripe. */
    public function verifyWebhook(string $payload, string $signature): Event
    {
        return Webhook::constructEvent($payload, $signature, config('services.stripe.webhook_secret'));
    }
}
