<x-app-layout>
    <div class="py-12 bg-gradient-to-br from-slate-50 to-indigo-50/30 min-h-screen">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <!-- Success/Info/Error Flash Alerts -->
            @if(session('success'))
                <div class="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl shadow-sm flex items-center gap-3">
                    <i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>
                    <p class="text-sm font-medium">{{ session('success') }}</p>
                </div>
            @endif

            @if(session('error'))
                <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center gap-3">
                    <i class="fa-solid fa-circle-xmark text-red-500 text-lg"></i>
                    <p class="text-sm font-medium">{{ session('error') }}</p>
                </div>
            @endif

            @if(session('info'))
                <div class="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-r-xl shadow-sm flex items-center gap-3">
                    <i class="fa-solid fa-circle-info text-blue-500 text-lg"></i>
                    <p class="text-sm font-medium">{{ session('info') }}</p>
                </div>
            @endif

            <div class="mb-8">
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Admin: Payment Requests</h1>
                <p class="text-slate-500 mt-1">Review receipts and approve user credit package purchases.</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th class="px-6 py-4">User Details</th>
                                <th class="px-6 py-4">Package</th>
                                <th class="px-6 py-4">Price</th>
                                <th class="px-6 py-4">Credits</th>
                                <th class="px-6 py-4">Receipt Invoice</th>
                                <th class="px-6 py-4">Notes</th>
                                <th class="px-6 py-4">Date</th>
                                <th class="px-6 py-4">Status / Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-sm">
                            @forelse($orders as $order)
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="font-semibold text-slate-900">{{ $order->user->full_name }}</div>
                                        <div class="text-slate-500 text-xs mt-0.5">{{ $order->user->email }}</div>
                                    </td>
                                    <td class="px-6 py-4 font-semibold text-slate-900">{{ $order->plan->name }}</td>
                                    <td class="px-6 py-4 font-bold text-slate-900">${{ number_format($order->amount, 2) }}</td>
                                    <td class="px-6 py-4">
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                            <i class="fa-solid fa-coins animate-pulse"></i> {{ $order->credits }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button onclick="openReceiptModal('{{ $order->receipt_image }}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
                                            <i class="fa-regular fa-image text-slate-500"></i> View Image
                                        </button>
                                    </td>
                                    <td class="px-6 py-4 max-w-xs truncate text-slate-500" title="{{ $order->notes }}">
                                        {{ $order->notes ?? '-' }}
                                    </td>
                                    <td class="px-6 py-4 text-slate-500">{{ $order->created_at->format('M d, Y h:i A') }}</td>
                                    <td class="px-6 py-4">
                                        @if($order->status === 'pending')
                                            <div class="flex items-center gap-2">
                                                <form action="{{ route('admin.orders.approve', $order->id) }}" method="POST" class="inline">
                                                    @csrf
                                                    <button type="submit" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition">
                                                        Approve
                                                    </button>
                                                </form>
                                                <form action="{{ route('admin.orders.reject', $order->id) }}" method="POST" class="inline">
                                                    @csrf
                                                    <button type="submit" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition">
                                                        Reject
                                                    </button>
                                                </form>
                                            </div>
                                        @elseif($order->status === 'approved')
                                            <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                                <i class="fa-solid fa-circle-check"></i> Approved
                                            </span>
                                        @else
                                            <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200">
                                                <i class="fa-solid fa-circle-xmark"></i> Rejected
                                            </span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                                        <div class="flex flex-col items-center justify-center gap-2">
                                            <i class="fa-solid fa-receipt text-3xl text-slate-300"></i>
                                            <p class="text-base font-medium">No requests available for review.</p>
                                        </div>
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>

    <!-- Image Modal Popup -->
    <div id="receiptModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center hidden" onclick="closeReceiptModal()">
        <div class="relative max-w-2xl w-full mx-4" onclick="event.stopPropagation()">
            <div class="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                <div class="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 class="font-bold text-slate-900">Receipt Invoice Preview</h3>
                    <button class="text-slate-400 hover:text-slate-600" onclick="closeReceiptModal()">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                <div class="p-6 flex items-center justify-center bg-slate-50 max-h-[80vh] overflow-y-auto">
                    <img id="modalImage" src="" alt="Full Receipt" class="max-w-full h-auto rounded-xl shadow-md border border-slate-200">
                </div>
                <div class="p-4 border-t border-slate-100 text-right bg-slate-50">
                    <a id="modalImageLink" href="" target="_blank" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition">
                        Open in New Tab
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        function openReceiptModal(src) {
            const modal = document.getElementById('receiptModal');
            const img = document.getElementById('modalImage');
            const link = document.getElementById('modalImageLink');
            if (modal && img && link) {
                img.src = src;
                link.href = src;
                modal.classList.remove('hidden');
            }
        }

        function closeReceiptModal() {
            const modal = document.getElementById('receiptModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    </script>
</x-app-layout>
