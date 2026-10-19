<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckCredits
{
    const COST_PER_GENERATION = 10;

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->credits < self::COST_PER_GENERATION) {
            $msg = 'Not enough credits. <a href="' . route('plans.index') . '" class="underline">Upgrade your plan</a>';
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                    'credits_remaining' => $user ? $user->credits : 0,
                    'redirect' => route('plans.index'),
                ], 402);
            }
            return redirect()->route('plans.index')->with('error', 'Not enough credits. Upgrade your plan.');
        }

        $response = $next($request);

        if ($response->isSuccessful() || $response->getStatusCode() < 400) {
            $user->decrement('credits', self::COST_PER_GENERATION);
        }

        return $response;
    }
}
