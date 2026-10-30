<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

#[Fillable(['item_type', 'item_id', 'item_name', 'amount', 'currency', 'customer_name', 'customer_email', 'company', 'notes', 'status', 'stripe_session_id', 'stripe_payment_intent', 'paid_at'])]
class Order extends Model
{
    public const STATUSES = ['pending' => 'Awaiting payment', 'paid' => 'Paid', 'failed' => 'Failed', 'expired' => 'Expired', 'refunded' => 'Refunded'];

    /** What can be bought online: item_type => model. The price charged is the item's "from" price (min_price). */
    public const ITEMS = ['package' => Package::class, 'bundle' => Bundle::class, 'addon' => Addon::class];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'paid_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        // Short, readable and unguessable enough to quote in emails, e.g. LT-261030-7KQ2M.
        static::creating(fn (Order $order) => $order->reference ??= 'LT-'.now()->format('ymd').'-'.Str::upper(Str::random(5)));
    }
}
