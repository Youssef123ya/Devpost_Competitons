<x-app-layout>
    <div class="py-16 bg-gradient-to-br from-slate-50 to-indigo-50/30 min-h-screen text-slate-800 flex items-center justify-center font-sans relative overflow-hidden">
        <!-- Background Decorative Blobs -->
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] -z-10"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-[80px] -z-10"></div>

        <div class="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div class="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-8 md:p-12">
                <!-- Back Button -->
                <div class="mb-8">
                    <a href="{{ route('plans.index') }}" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition">
                        <i class="fa-solid fa-arrow-left text-xs"></i> Back to Plans
                    </a>
                </div>

                <!-- Page Header -->
                <div class="text-center mb-10">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full">Checkout</span>
                    <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-3">Complete Your Order</h1>
                    <p class="text-slate-500 text-sm mt-2">You are subscribing to: <strong class="text-indigo-600 font-extrabold">{{ $plan->name }}</strong></p>
                </div>

                @if ($errors->any())
                    <div class="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-xl text-sm">
                        <ul class="list-disc pl-4 space-y-1">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form action="{{ route('plans.store-payment', $plan->slug) }}" method="POST" enctype="multipart/form-data" class="space-y-8">
                    @csrf
                    
                    <div class="grid md:grid-cols-2 gap-8 items-stretch">
                        
                        <!-- Left Side: Order Summary & Payment Info -->
                        <div class="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Summary</h3>
                                <div class="bg-white rounded-xl py-5 px-6 border border-slate-200/60 mb-6 text-center shadow-sm">
                                    <span class="text-3xl font-black text-slate-900">${{ number_format($plan->price, 2) }}</span>
                                    <span class="text-slate-500 block text-xs mt-1">Includes {{ $plan->credits }} credits</span>
                                </div>

                                <div class="space-y-5">
                                    <div>
                                        <h4 class="text-sm font-bold text-slate-800 mb-2">Payment Details:</h4>
                                        <div class="bg-white rounded-xl p-4 border border-slate-200/60 flex items-center justify-between shadow-sm">
                                            <div>
                                                <span class="text-[10px] text-slate-400 font-bold uppercase block">Vodafone Cash</span>
                                                <span class="text-base font-black text-indigo-600 select-all tracking-wide">01032210758</span>
                                            </div>
                                            <button type="button" onclick="navigator.clipboard.writeText('01032210758'); alert('Copied to clipboard!');" class="text-xs text-slate-400 hover:text-indigo-600 transition p-1">
                                                <i class="fa-regular fa-copy text-sm"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 class="text-sm font-bold text-slate-800 mb-1">Pay with Other Methods:</h4>
                                        <p class="text-xs text-slate-500 leading-relaxed mb-4">
                                            If you wish to pay using credit/debit card or other online payment options, please use the button below.
                                        </p>
                                        <a href="https://www.easykash.net/Binexel/pay" target="_blank" class="w-full py-3 px-4 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold text-center block transition shadow-sm bg-white flex items-center justify-center gap-2">
                                            <i class="fa-solid fa-credit-card text-sm"></i>
                                            Pay with Other Methods
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Side: Instructions & Upload Form -->
                        <div class="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between">
                            <div class="space-y-6">
                                <div>
                                    <h4 class="text-sm font-bold text-slate-800 mb-2">Instructions:</h4>
                                    <ol class="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                                        <li>Transfer the total amount to the Vodafone Cash number.</li>
                                        <li>Take a screenshot/receipt of the successful transaction.</li>
                                        <li>Upload the transaction receipt below and submit your request.</li>
                                    </ol>
                                </div>

                                <div>
                                    <h4 class="text-sm font-bold text-slate-800 mb-2">Upload Receipt:</h4>
                                    <div class="relative">
                                        <input type="file" name="receipt_image" id="receipt_image" accept="image/*" class="sr-only" onchange="previewImage(event)" required>
                                        <label for="receipt_image" id="upload-label" class="w-full py-4 px-4 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-white text-slate-500 text-xs font-bold text-center block cursor-pointer transition flex items-center justify-center gap-2 shadow-sm">
                                            <i class="fa-solid fa-cloud-arrow-up text-indigo-500 text-sm"></i>
                                            <span id="upload-text">Choose receipt image</span>
                                        </label>
                                    </div>
                                    <div id="image-preview-container" class="mt-3 hidden">
                                        <img id="image-preview" src="#" alt="Receipt Preview" class="w-32 h-auto rounded-lg border border-slate-200 object-cover mx-auto shadow-sm">
                                    </div>
                                </div>

                                <div>
                                    <h4 class="text-sm font-bold text-slate-800 mb-2">Additional Notes (Optional):</h4>
                                    <textarea name="notes" rows="3" class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none shadow-sm" placeholder="Add any details, transaction ID, or notes..."></textarea>
                                </div>
                            </div>

                            <div class="mt-6">
                                <a href="https://wa.me/201032210758" target="_blank" class="w-full py-3.5 px-4 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs text-center flex items-center justify-center gap-2 transition border border-indigo-100">
                                    <i class="fa-brands fa-whatsapp text-sm"></i>
                                    Chat with Support
                                </a>
                            </div>
                        </div>

                    </div>

                    <!-- Submit Button -->
                    <div class="pt-6 border-t border-slate-100">
                        <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl transition shadow-lg shadow-indigo-600/20">
                            Confirm & Submit Receipt
                        </button>
                    </div>

                </form>

            </div>
        </div>
    </div>

    <script>
        function previewImage(event) {
            const input = event.target;
            const labelText = document.getElementById('upload-text');
            const previewContainer = document.getElementById('image-preview-container');
            const preview = document.getElementById('image-preview');
            
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                    labelText.textContent = input.files[0].name;
                }
                reader.readAsDataURL(input.files[0]);
            }
        }
    </script>
</x-app-layout>
