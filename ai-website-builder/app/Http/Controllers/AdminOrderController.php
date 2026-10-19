<?php

namespace App\Http\Controllers;

use App\Models\PaymentOrder;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    private function checkAdmin()
    {
        if (!auth()->user() || !auth()->user()->is_admin) {
            abort(403, 'Unauthorized access. Admins only.');
        }
    }

    public function index()
    {
        $this->checkAdmin();

        // Load pending orders first, then completed ones
        $orders = PaymentOrder::with(['user', 'plan'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->get();

        return view('admin.orders', compact('orders'));
    }

    public function approve(PaymentOrder $order)
    {
        $this->checkAdmin();

        if ($order->status !== 'pending') {
            return redirect()->back()->with('error', 'This order has already been processed.');
        }

        $order->status = 'approved';
        $order->save();

        // Grant credits to the user
        $order->user->increment('credits', $order->credits);

        return redirect()->back()->with('success', 'Payment approved successfully! Credits have been added to the user account.');
    }

    public function reject(PaymentOrder $order)
    {
        $this->checkAdmin();

        if ($order->status !== 'pending') {
            return redirect()->back()->with('error', 'This order has already been processed.');
        }

        $order->status = 'rejected';
        $order->save();

        return redirect()->back()->with('info', 'Payment request rejected.');
    }
}
