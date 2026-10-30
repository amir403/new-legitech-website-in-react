<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            // What was bought, copied at purchase time so later price or name edits don't rewrite history.
            $table->enum('item_type', ['package', 'bundle', 'addon']);
            $table->unsignedBigInteger('item_id');
            $table->string('item_name');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('GBP');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('company')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'paid', 'failed', 'expired', 'refunded'])->default('pending')->index();
            $table->string('stripe_session_id')->nullable()->unique();
            $table->string('stripe_payment_intent')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
