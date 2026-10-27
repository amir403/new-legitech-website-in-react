<?php

use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\PricingController;
use Illuminate\Support\Facades\Route;

Route::controller(ContentController::class)->group(function () {
    Route::get('services', 'services');
    Route::get('services/{slug}', 'service');
    Route::get('insights', 'insights');
    Route::get('insights/{slug}', 'insight');
    Route::get('work-concepts', 'workConcepts');
    Route::get('industries', 'industries');
});

Route::controller(PricingController::class)->prefix('pricing')->group(function () {
    Route::get('/', 'index');
    Route::get('packages', 'packages');
    Route::get('addons', 'addons');
    Route::get('bundles', 'bundles');
});

Route::get('enquiry-options', [EnquiryController::class, 'options']);
Route::post('enquiries', [EnquiryController::class, 'store'])->middleware('throttle:5,1');
