<?php

namespace App\Http\Controllers\Traits;

trait DeductsCredits
{
    protected function deductCredits($cost = 10)
    {
        $user = auth()->user();
        if ($user && $user->is_admin) {
            return true; // Admin has unlimited credits and no deduction
        }
        if ($user && $user->credits >= $cost) {
            $user->decrement('credits', $cost);
            return true;
        }
        return false;
    }
}
