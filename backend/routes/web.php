<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

// Reached through the site's domain: Vite proxies it in dev, and the web server must route it to Laravel like /api.
Route::get('sitemap.xml', SitemapController::class);

Route::get('/', function () {
    return view('welcome');
});
