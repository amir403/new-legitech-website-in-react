<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('icon', 8);
            $table->string('name');
            $table->text('summary');
            $table->string('hero_title');
            $table->string('heading');
            $table->text('body');
            $table->json('features');
            $table->json('deliverables');
            $table->json('related_slugs');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('insights', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category');
            $table->unsignedTinyInteger('read_minutes');
            $table->string('title');
            $table->text('intro');
            $table->string('teaser_art')->nullable();
            $table->json('sections');
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('work_concepts', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('tags');
            $table->string('title');
            $table->text('summary');
            $table->text('opportunity');
            $table->json('includes');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('industries', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('summary');
            $table->string('service_slug')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('industries');
        Schema::dropIfExists('work_concepts');
        Schema::dropIfExists('insights');
        Schema::dropIfExists('services');
    }
};
