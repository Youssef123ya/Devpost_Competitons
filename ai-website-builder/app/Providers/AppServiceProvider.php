<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Disable SSL verification for all HTTP client requests (fixes cURL error 60 on local environments)
        \Illuminate\Support\Facades\Http::globalOptions([
            'verify' => false,
        ]);
    }
}
