<?php

namespace Tests\Feature;

use App\Models\Addon;
use App\Models\Bundle;
use App\Models\Order;
use App\Models\Package;
use App\Models\User;
use App\Notifications\OrderPaid;
use App\Services\StripeCheckout;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Mockery\MockInterface;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private const WEBHOOK_SECRET = 'whsec_test_secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.stripe.secret' => 'sk_test_fake', 'services.stripe.webhook_secret' => self::WEBHOOK_SECRET]);
    }

    /** Swap the Stripe API call for a fake session; webhook verification keeps using the real Stripe code. */
    private function fakeStripeSession(): void
    {
        $this->partialMock(StripeCheckout::class, function (MockInterface $mock) {
            $mock->shouldReceive('createSession')->andReturnUsing(fn (Order $o) => ['id' => 'cs_test_'.$o->id, 'url' => 'https://checkout.stripe.com/c/pay/cs_test_'.$o->id]);
        });
    }

    private function checkout(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/checkout', [
            'item_type' => 'package',
            'item_id' => Package::where('name', 'Standard')->value('id'),
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'company' => 'Analytical Ltd',
            'notes' => 'We need a booking page.',
            'accept_terms' => true,
            ...$overrides,
        ]);
    }

    /** Sends a webhook signed the way Stripe signs it. */
    private function webhook(string $type, array $object, ?string $secret = null): \Illuminate\Testing\TestResponse
    {
        $payload = json_encode(['id' => 'evt_test', 'object' => 'event', 'type' => $type, 'data' => ['object' => $object]]);
        $t = time();
        $signature = "t=$t,v1=".hash_hmac('sha256', "$t.$payload", $secret ?? self::WEBHOOK_SECRET);

        return $this->call('POST', '/api/stripe/webhook', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'], $payload);
    }

    private function pendingOrder(): Order
    {
        $this->fakeStripeSession();
        $this->checkout()->assertCreated();

        return Order::latest('id')->first();
    }

    public function test_checkout_charges_the_from_price_from_the_database(): void
    {
        $this->fakeStripeSession();

        $this->checkout(['amount' => 1])
            ->assertCreated()
            ->assertJsonPath('url', fn ($url) => str_starts_with($url, 'https://checkout.stripe.com/'));

        $order = Order::sole();
        $this->assertSame('pending', $order->status);
        $this->assertEquals(1200, $order->amount);
        $this->assertSame('Standard package', $order->item_name);
        $this->assertSame('cs_test_'.$order->id, $order->stripe_session_id);
        $this->assertMatchesRegularExpression('/^LT-\d{6}-[A-Z0-9]{5}$/', $order->reference);
    }

    public function test_bundles_and_addons_can_be_bought(): void
    {
        $this->fakeStripeSession();

        $this->checkout(['item_type' => 'bundle', 'item_id' => Bundle::where('name', 'Brand Starter Bundle')->value('id')])->assertCreated();
        $this->checkout(['item_type' => 'addon', 'item_id' => Addon::where('name', 'Logo design')->value('id')])->assertCreated();

        $this->assertEquals([250, 120], Order::orderBy('id')->pluck('amount')->map(fn ($a) => (float) $a)->all());
    }

    public function test_checkout_is_off_without_stripe_keys(): void
    {
        config(['services.stripe.secret' => null]);

        $this->checkout()->assertStatus(503);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_inactive_items_and_missing_terms_are_rejected(): void
    {
        $this->fakeStripeSession();
        $package = Package::where('name', 'Premium')->first();
        $package->update(['is_active' => false]);

        $this->checkout(['item_id' => $package->id])->assertUnprocessable()->assertJsonValidationErrors('item_id');
        $this->checkout(['accept_terms' => false])->assertUnprocessable()->assertJsonValidationErrors('accept_terms');
        $this->checkout(['item_type' => 'service'])->assertUnprocessable()->assertJsonValidationErrors('item_type');
        $this->checkout(['website' => 'spam.example'])->assertUnprocessable()->assertJsonValidationErrors('website');
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_webhook_rejects_bad_signatures(): void
    {
        $order = $this->pendingOrder();

        $this->webhook('checkout.session.completed', ['id' => $order->stripe_session_id, 'payment_status' => 'paid', 'payment_intent' => 'pi_1'], 'whsec_wrong')
            ->assertStatus(400);
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_paid_webhook_marks_the_order_paid_once_and_emails_both_sides(): void
    {
        Notification::fake();
        $order = $this->pendingOrder();
        $object = ['id' => $order->stripe_session_id, 'payment_status' => 'paid', 'payment_intent' => 'pi_123'];

        $this->webhook('checkout.session.completed', $object)->assertOk();
        // Stripe retries deliveries; a repeat must not email twice.
        $this->webhook('checkout.session.completed', $object)->assertOk();

        $order->refresh();
        $this->assertSame('paid', $order->status);
        $this->assertSame('pi_123', $order->stripe_payment_intent);
        $this->assertNotNull($order->paid_at);
        Notification::assertSentTimes(OrderPaid::class, 2);
        Notification::assertSentTo(new AnonymousNotifiable, OrderPaid::class, fn (OrderPaid $n, $channels, $notifiable) => $n->forCustomer && $notifiable->routes['mail'] === ['ada@example.com' => 'Ada Lovelace']);
    }

    public function test_unpaid_completion_waits_for_the_async_result(): void
    {
        $order = $this->pendingOrder();

        $this->webhook('checkout.session.completed', ['id' => $order->stripe_session_id, 'payment_status' => 'unpaid', 'payment_intent' => 'pi_2'])->assertOk();
        $this->assertSame('pending', $order->fresh()->status);

        $this->webhook('checkout.session.async_payment_failed', ['id' => $order->stripe_session_id])->assertOk();
        $this->assertSame('failed', $order->fresh()->status);
    }

    public function test_expired_and_refunded_orders(): void
    {
        $expired = $this->pendingOrder();
        $this->webhook('checkout.session.expired', ['id' => $expired->stripe_session_id])->assertOk();
        $this->assertSame('expired', $expired->fresh()->status);

        $paid = $this->pendingOrder();
        $this->webhook('checkout.session.completed', ['id' => $paid->stripe_session_id, 'payment_status' => 'paid', 'payment_intent' => 'pi_9'])->assertOk();
        // A partial refund leaves the order paid; a full refund marks it refunded.
        $this->webhook('charge.refunded', ['id' => 'ch_1', 'payment_intent' => 'pi_9', 'refunded' => false])->assertOk();
        $this->assertSame('paid', $paid->fresh()->status);
        $this->webhook('charge.refunded', ['id' => 'ch_1', 'payment_intent' => 'pi_9', 'refunded' => true])->assertOk();
        $this->assertSame('refunded', $paid->fresh()->status);
    }

    public function test_success_page_status_reveals_no_personal_data(): void
    {
        $order = $this->pendingOrder();

        $this->getJson("/api/checkout/{$order->stripe_session_id}")
            ->assertOk()
            ->assertExactJson(['data' => ['reference' => $order->reference, 'item_name' => 'Standard package', 'amount' => 1200, 'status' => 'pending']]);
        $this->getJson('/api/checkout/cs_unknown')->assertNotFound();
    }

    public function test_admin_order_list_requires_login(): void
    {
        $this->pendingOrder();

        $this->getJson('/api/admin/orders')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/admin/orders?status=pending')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.customer_email', 'ada@example.com');
    }
}
