<?php

use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\EnquiryController;
use Illuminate\Support\Facades\Route;

Route::controller(ContentController::class)->group(function () {
    Route::get('services', 'services');
    Route::get('services/{slug}', 'service');
    Route::get('insights', 'insights');
    Route::get('insights/{slug}', 'insight');
    Route::get('work-concepts', 'workConcepts');
    Route::get('industries', 'industries');
});

Route::get('enquiry-options', [EnquiryController::class, 'options']);
Route::post('enquiries', [EnquiryController::class, 'store'])->middleware('throttle:5,1');
