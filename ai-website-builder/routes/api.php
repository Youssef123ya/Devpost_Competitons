

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HeroController;
Route::get('/hero/{id}', [HeroController::class, 'api']);
