<x-app-layout>
    <div class="py-12 bg-gradient-to-br from-slate-50 to-indigo-50/30 min-h-screen">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <!-- Success/Info Alerts -->
            @if(session('success'))
                <div class="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl shadow-sm flex items-center gap-3">
                    <i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>
                    <p class="text-sm font-medium">{{ session('success') }}</p>
                </div>
            @endif

            <div class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tight">My Payment Requests</h1>
                    <p class="text-slate-500 mt-1">Track the status of your credit purchase requests.</p>
                </div>
                <a href="{{ route('plans.index') }}" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition">
                    + New Request
                </a>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th class="px-6 py-4">Request ID</th>
                                <th class="px-6 py-4">Plan Name</th>
                                <th class="px-6 py-4">Price</th>
                                <th class="px-6 py-4">Credits</th>
                                <th class="px-6 py-4">Receipt</th>
                                <th class="px-6 py-4">Date</th>
                                <th class="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-sm">
                            @forelse($orders as $order)
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="px-6 py-4 font-mono font-bold text-slate-600">#{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</td>
                                    <td class="px-6 py-4 font-semibold text-slate-950">{{ $order->plan->name }}</td>
                                    <td class="px-6 py-4 text-slate-900 font-bold">${{ number_format($order->amount, 2) }}</td>
                                    <td class="px-6 py-4">
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                            <i class="fa-solid fa-coins"></i> {{ $order->credits }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <a href="{{ $order->receipt_image }}" target="_blank" class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold">
                                            <i class="fa-regular fa-image"></i> View Receipt
                                        </a>
                                    </td>
                                    <td class="px-6 py-4 text-slate-500">{{ $order->created_at->format('M d, Y h:i A') }}</td>
                                    <td class="px-6 py-4">
                                        @if($order->status === 'pending')
                                            <span class="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                                                <span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Pending Review
                                            </span>
                                        @elseif($order->status === 'approved')
                                            <span class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved & Credited
                                            </span>
                                        @else
                                            <span class="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200">
                                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Rejected
                                            </span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                                        <div class="flex flex-col items-center justify-center gap-2">
                                            <i class="fa-solid fa-receipt text-3xl text-slate-300"></i>
                                            <p class="text-base font-medium">No payment requests found.</p>
                                        </div>
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="text-center mt-10">
                <a href="{{ route('dashboard') }}" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center justify-center gap-1">
                    <i class="fa-solid fa-arrow-left text-xs"></i> Back to Dashboard
                </a>
            </div>

        </div>
    </div>
</x-app-layout>
