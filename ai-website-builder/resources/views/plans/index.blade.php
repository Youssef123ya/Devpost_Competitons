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

            @if(session('info'))
                <div class="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-r-xl shadow-sm flex items-center gap-3">
                    <i class="fa-solid fa-circle-info text-blue-500 text-lg"></i>
                    <p class="text-sm font-medium">{{ session('info') }}</p>
                </div>
            @endif

            @if(session('error'))
                <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center gap-3">
                    <i class="fa-solid fa-circle-xmark text-red-500 text-lg"></i>
                    <p class="text-sm font-medium">{{ session('error') }}</p>
                </div>
            @endif

            <div class="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                <div class="text-center md:text-left">
                    <h1 class="text-4xl font-black text-slate-900 tracking-tight">Purchase Credits</h1>
                    <p class="text-slate-500 mt-2 text-base">You have <strong class="text-indigo-600">{{ $user->is_admin ? 'Unlimited' : $user->credits }}</strong> credits remaining</p>
                </div>
                <div class="flex gap-3">
                    <a href="{{ route('plans.orders') }}" class="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2">
                        <i class="fa-solid fa-history text-slate-400"></i> My Requests
                    </a>
                </div>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                @forelse($plans as $plan)
                    <div class="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col hover:shadow-md transition-shadow">
                        <div class="mb-6">
                            <h3 class="text-xl font-bold text-slate-900">{{ $plan->name }}</h3>
                            <p class="text-slate-500 text-sm mt-2 min-h-[40px]">{{ $plan->description }}</p>
                        </div>

                        <div class="mb-6">
                            <span class="text-4xl font-black text-slate-900">${{ number_format($plan->price, 2) }}</span>
                            <span class="text-slate-400 text-xs block mt-1">One-time payment</span>
                        </div>

                        <ul class="space-y-3 mb-8 flex-1">
                            <li class="flex items-start gap-2 text-sm text-slate-600">
                                <svg class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span class="font-bold text-slate-800">{{ $plan->credits }} credits</span>
                            </li>
                            <li class="flex items-start gap-2 text-sm text-slate-600">
                                <svg class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span>AI section generation</span>
                            </li>
                            <li class="flex items-start gap-2 text-sm text-slate-600">
                                <svg class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span>Unlimited full-website exports</span>
                            </li>
                        </ul>

                        <a href="{{ route('plans.pay', $plan->slug) }}"
                           class="w-full text-center block py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl hover:shadow-lg shadow-indigo-200 transition-all">
                            Buy Now
                        </a>
                    </div>
                @empty
                    <div class="col-span-full text-center py-12 text-slate-500">
                        <p class="text-lg">No packages available yet.</p>
                    </div>
                @endforelse
            </div>

            <div class="text-center mt-10">
                <a href="{{ route('dashboard') }}" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center justify-center gap-1">
                    <i class="fa-solid fa-arrow-left text-xs"></i> Back to Dashboard
                </a>
            </div>
        </div>
    </div>
</x-app-layout>
