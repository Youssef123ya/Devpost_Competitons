<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PaymentOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $plans = Plan::where('is_active', true)->orderBy('sort_order')->get();
        // Since we transitioned to credit bundles, current plan is represented by user remaining credits.
        return view('plans.index', compact('plans', 'user'));
    }

    public function pay(Plan $plan)
    {
        return view('plans.pay', compact('plan'));
    }

    public function storePayment(Request $request, Plan $plan)
    {
        $request->validate([
            'receipt_image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $path = null;
        if ($request->hasFile('receipt_image')) {
            $file = $request->file('receipt_image');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            // Create uploads directory if it does not exist
            $destDir = public_path('uploads/receipts');
            if (!file_exists($destDir)) {
                mkdir($destDir, 0755, true);
            }
            
            $file->move($destDir, $filename);
            $path = '/uploads/receipts/' . $filename;
        }

        PaymentOrder::create([
            'user_id' => auth()->id(),
            'plan_id' => $plan->id,
            'amount' => $plan->price,
            'credits' => $plan->credits,
            'status' => 'pending',
            'receipt_image' => $path,
            'notes' => $request->input('notes'),
        ]);

        return redirect()->route('plans.orders')->with('success', 'Payment request submitted successfully! Admin will review and activate your credits shortly.');
    }

    public function orders()
    {
        $orders = auth()->user()->paymentOrders()->with('plan')->latest()->get();
        return view('plans.orders', compact('orders'));
    }
}
