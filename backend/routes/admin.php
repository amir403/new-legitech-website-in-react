<?php

use App\Http\Controllers\Admin\AddonController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BundleController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\EnquiryController;
use App\Http\Controllers\Admin\PackageController;
use Illuminate\Support\Facades\Route;

// Loaded in bootstrap/app.php with the `web` middleware (session + CSRF) under /api/admin.

Route::get('me', [AuthController::class, 'me']);
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('enquiries', [EnquiryController::class, 'index']);
    Route::patch('enquiries/{enquiry}', [EnquiryController::class, 'update']);
    Route::delete('enquiries/{enquiry}', [EnquiryController::class, 'destroy']);

    Route::prefix('pricing')->group(function () {
        Route::apiResource('packages', PackageController::class);
        Route::apiResource('addons', AddonController::class);
        Route::apiResource('bundles', BundleController::class);
        Route::patch('packages/{package}/price', [PackageController::class, 'price']);
        Route::patch('addons/{addon}/price', [AddonController::class, 'price']);
        Route::patch('bundles/{bundle}/price', [BundleController::class, 'price']);
    });

    Route::controller(ContentController::class)->where(['type' => 'services|insights|work-concepts|industries', 'id' => '[0-9]+'])->group(function () {
        Route::get('{type}', 'index');
        Route::post('{type}', 'store');
        Route::get('{type}/{id}', 'show');
        Route::put('{type}/{id}', 'update');
        Route::delete('{type}/{id}', 'destroy');
    });
});
