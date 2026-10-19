<x-app-layout>
    <div class="bg-slate-50 min-h-screen">
        <div class="container mx-auto px-4 py-12 max-w-4xl">
            <!-- Header -->
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1 class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Generate Full Website with AI</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">
                    Upload your product image and describe your vision. Our AI will create a complete, professional website for you.
                </p>
            </div>

            <!-- Form -->
            <form action="{{ route('full-website.store') }}" method="POST" enctype="multipart/form-data" class="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                @csrf

                @if(session('error'))
                    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {{ session('error') }}
                    </div>
                @endif

                <!-- Product Image Upload -->
                <div class="mb-8">
                    <label class="block text-lg font-semibold text-slate-900 mb-3">
                        Product Image
                        <span class="text-red-500">*</span>
                    </label>
                    <p class="text-sm text-slate-600 mb-4">
                        Upload a clear image of your product. The AI will analyze it to understand your brand and create relevant content.
                    </p>
                    
                    <div class="relative">
                        <input 
                            type="file" 
                            name="product_image" 
                            id="product_image" 
                            accept="image/*"
                            required
                            class="hidden"
                            onchange="previewImage(event)"
                        >
                        
                        <label for="product_image" class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all group">
                            <div id="upload-placeholder" class="flex flex-col items-center justify-center text-center p-6">
                                <svg class="w-16 h-16 text-slate-400 group-hover:text-purple-500 mb-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                <p class="text-slate-700 font-medium mb-1">Click to upload product image</p>
                                <p class="text-sm text-slate-500">PNG, JPG, WEBP up to 10MB</p>
                            </div>
                            
                            <div id="image-preview" class="hidden w-full h-full">
                                <img id="preview-img" src="" alt="Preview" class="w-full h-full object-contain rounded-xl">
                            </div>
                        </label>
                    </div>
                    
                    @error('product_image')
                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Website Description/Prompt -->
                <div class="mb-8">
                    <label for="prompt" class="block text-lg font-semibold text-slate-900 mb-3">
                        Website Description
                        <span class="text-red-500">*</span>
                    </label>
                    <p class="text-sm text-slate-600 mb-4">
                        Describe what you want your website to communicate. Be specific about your product, target audience, and key features.
                    </p>
                    
                    <textarea 
                        name="prompt" 
                        id="prompt" 
                        rows="8" 
                        required
                        placeholder="Example: Create a modern landing page for my organic skincare product. Target audience is health-conscious women aged 25-45. Emphasize natural ingredients, eco-friendly packaging, and dermatologist-tested formulas. Include sections for product benefits, ingredients, testimonials, and a strong call-to-action to buy now."
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all resize-none"
                    ></textarea>
                    
                    <div class="mt-2 flex items-center justify-between">
                        <p class="text-xs text-slate-500">Minimum 10 characters</p>
                        <p id="char-count" class="text-xs text-slate-500">0 characters</p>
                    </div>
                    
                    @error('prompt')
                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Tips -->
                <div class="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-xl">
                    <h3 class="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                        </svg>
                        Tips for Best Results
                    </h3>
                    <ul class="space-y-2 text-sm text-purple-800">
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Use a high-quality, well-lit product image with clear branding</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Mention your target audience and key selling points</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Specify the tone (professional, friendly, luxurious, etc.)</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Include any specific features or sections you want</span>
                        </li>
                    </ul>
                </div>

                <div class="flex items-center justify-end">
                    <button type="submit" class="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                        <span>Generate Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 transition-transform group-hover:translate-x-1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Image preview
        function previewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('upload-placeholder').classList.add('hidden');
                    document.getElementById('image-preview').classList.remove('hidden');
                    document.getElementById('preview-img').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        }

        // Character counter
        const promptTextarea = document.getElementById('prompt');
        const charCount = document.getElementById('char-count');
        
        promptTextarea.addEventListener('input', function() {
            charCount.textContent = this.value.length + ' characters';
        });

        // Form Submission Loading State
        const form = document.querySelector('form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnContent = submitBtn.innerHTML;

        // Reset button on page load (fix for back button caching)
        window.addEventListener('pageshow', function(event) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            submitBtn.innerHTML = originalBtnContent;
        });

        form.addEventListener('submit', function(e) {
            // Only show loading if form is valid
            if (!form.checkValidity()) {
                return;
            }

            // Disable button and show loading state
            // Uses setTimeout to ensure the submit event propagates first
            setTimeout(() => {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
                submitBtn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                `;
            }, 0);
        });
    </script>
</x-app-layout>
