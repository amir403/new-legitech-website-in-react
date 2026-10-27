<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pricing_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('tier', ['starter', 'standard', 'premium']);
            $table->string('description', 500)->nullable();
            $table->decimal('min_price', 10, 2);
            $table->decimal('max_price', 10, 2);
            $table->string('currency', 3)->default('GBP');
            $table->string('delivery_time');
            $table->string('revisions');
            $table->string('support_period');
            // Null max = open-ended ("£150+").
            $table->decimal('monthly_maintenance_min', 10, 2)->nullable();
            $table->decimal('monthly_maintenance_max', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('package_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('value');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['package_id', 'sort_order']);
        });

        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            // Null = a general add-on shown for every category.
            $table->foreignId('pricing_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('description', 500)->nullable();
            $table->decimal('min_price', 10, 2);
            $table->decimal('max_price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pricing_category_id')->nullable()->constrained()->nullOnDelete();
            // A bundle can include one package (e.g. Brand + Store includes the Starter Store).
            $table->foreignId('package_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('description', 500)->nullable();
            $table->decimal('min_price', 10, 2);
            $table->decimal('max_price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('addon_bundle', function (Blueprint $table) {
            $table->foreignId('bundle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('addon_id')->constrained()->cascadeOnDelete();
            $table->primary(['bundle_id', 'addon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addon_bundle');
        Schema::dropIfExists('bundles');
        Schema::dropIfExists('addons');
        Schema::dropIfExists('package_features');
        Schema::dropIfExists('packages');
        Schema::dropIfExists('pricing_categories');
    }
};
