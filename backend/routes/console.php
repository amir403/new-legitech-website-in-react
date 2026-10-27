<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('admin:create {email} {name}', function (string $email, string $name) {
    $password = $this->secret('Password (min 12 characters)');
    $validator = Validator::make(['email' => $email, 'password' => $password], [
        'email' => ['required', 'email', 'unique:users,email'],
        'password' => ['required', 'string', 'min:12'],
    ]);
    if ($validator->fails()) {
        $this->error($validator->errors()->first());

        return 1;
    }
    User::create(['name' => $name, 'email' => $email, 'password' => $password]);
    $this->info("Admin {$email} created. Sign in at /admin.");
})->purpose('Create an admin login for the React admin panel');
