<x-app-layout>
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-6xl">
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Hero Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Choose a layout and customize your content to generate a
                    stunning hero section.</p>
            </div>

            <!-- Messages -->
            @if(session('error'))
                <div class="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
                    <div class="flex items-center gap-3">
                        <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-sm font-medium">{{ session('error') }}</p>
                    </div>
                </div>
            @endif

            @if(session('success'))
                <div class="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl shadow-sm">
                    <div class="flex items-center gap-3">
                        <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-sm font-medium">{{ session('success') }}</p>
                    </div>
                </div>
            @endif

            <form action="{{ route('hero.store') }}" method="POST" enctype="multipart/form-data" class="space-y-12"
                onsubmit="this.querySelector('button[type=submit]').disabled = true; this.querySelector('button[type=submit]').innerHTML = 'Generating...';">
                @csrf
                <!-- Layout Selection -->
                <section>
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">1</span>
                            Choose Layout
                        </h2>

                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Layout 1 -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="centered" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative">
                                    <!-- Placeholder for Centered Layout Visual -->
                                    <div class="absolute inset-0 flex items-center justify-center">
                                        <div
                                            class="w-3/4 h-1/2 bg-gray-200 rounded flex flex-col items-center justify-center gap-2">
                                            <div class="w-1/2 h-2 bg-gray-300 rounded"></div>
                                            <div class="w-1/3 h-2 bg-gray-300 rounded"></div>
                                            <div class="w-1/4 h-6 bg-indigo-500/50 rounded mt-2"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Centered Layout</h3>
                                <p class="text-sm text-gray-500">Content centered on background</p>
                                <div
                                    class="absolute top-4 right-4 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </label>

                        <!-- Layout 2 -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="left-aligned" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative">
                                    <!-- Placeholder for Left Aligned Layout Visual -->
                                    <div class="absolute inset-0 flex items-center">
                                        <div class="w-full h-full flex">
                                            <div class="w-1/2 h-full flex flex-col justify-center pl-4 gap-2">
                                                <div class="w-3/4 h-2 bg-gray-300 rounded"></div>
                                                <div class="w-1/2 h-2 bg-gray-300 rounded"></div>
                                                <div class="w-1/3 h-6 bg-indigo-500/50 rounded mt-2"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Left Aligned</h3>
                                <p class="text-sm text-gray-500">Content aligned to the left</p>
                                <div
                                    class="absolute top-4 right-4 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </label>

                        <!-- Layout 3 -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="split" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative">
                                    <!-- Placeholder for Split Layout Visual -->
                                    <div class="absolute inset-0 flex">
                                        <div class="w-1/2 h-full flex flex-col justify-center pl-2 gap-2">
                                            <div class="w-3/4 h-2 bg-gray-300 rounded"></div>
                                            <div class="w-1/2 h-2 bg-gray-300 rounded"></div>
                                            <div class="w-1/3 h-4 bg-indigo-500/50 rounded mt-1"></div>
                                        </div>
                                        <div class="w-1/2 h-full bg-gray-200"></div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Split Layout</h3>
                                <p class="text-sm text-gray-500">Content and image in two columns</p>
                                <div
                                    class="absolute top-4 right-4 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    <!-- 2. Content Details -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">2</span>
                                Content Details
                            </h2>
                            @php $portfolioType = session('portfolio_type', 'Website'); @endphp
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="fillWithAI()" id="ai-fill-btn"
                                    class="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                    </svg>
                                    AI Fill
                                    <span class="text-[10px] text-slate-400">({{ ucfirst($portfolioType) }})</span>
                                </button>
                                <button type="button" onclick="fillWithAI(true)" id="ai-shuffle-btn"
                                    class="hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-colors group">
                                    <svg class="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Regenerate
                                </button>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="title"
                                        class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                    <input type="text" name="title" id="title"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                        placeholder="e.g. Build Faster with AI" required>
                                </div>
                                <div>
                                    <label for="subtitle"
                                        class="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                                    <input type="text" name="subtitle" id="subtitle"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                        placeholder="e.g. THE ULTIMATE BUILDER">
                                </div>
                            </div>

                            <div>
                                <label for="description"
                                    class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea name="description" id="description" rows="4"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="Brief description of your product or service..."></textarea>
                            </div>

                            <div>
                                <label for="background_image"
                                    class="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                                <div>
                                    <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Generate Background with AI (Free)
                                    </label>
                                    <div class="flex gap-2">
                                        <input type="text" id="ai_image_prompt" class="flex-1 px-4 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-indigo-300 transition-all" placeholder="e.g. A futuristic neon glowing city background...">
                                        <button type="button" id="btn-generate-img" onclick="generateCustomImage()" class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors text-sm whitespace-nowrap flex items-center gap-2">
                                            Generate
                                        </button>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-1.5 mb-4">Leave empty for a random background based on your profession.</p>
                                </div>

                                <div class="space-y-4 relative">
                                    <div class="absolute -left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 uppercase rotate-[-90deg] origin-center tracking-widest">OR</div>
                                    <input type="hidden" name="background_image_url" id="background_image_url" value="{{ old('background_image_url') }}">
                                    <div id="ai-image-preview" class="{{ old('background_image_url') ? '' : 'hidden' }}">
                                        <div class="flex items-center justify-between mb-2">
                                            <p class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                <i class="fa-solid fa-check-circle"></i> AI Generated Image Ready
                                            </p>
                                            <button type="button" onclick="clearAiImage()"
                                                class="text-sm font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">
                                                Remove
                                            </button>
                                        </div>
                                        <div
                                            class="relative group w-full max-w-[200px] aspect-video rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm transition-all hover:shadow-md">
                                            <img src="{{ old('background_image_url') }}" id="ai-img-src" alt="AI Image" class="w-full h-full object-cover">
                                        </div>
                                    </div>
                                    <input type="file" name="background_image" id="file_input"
                                        onchange="document.getElementById('ai-image-preview').classList.add('hidden'); document.getElementById('background_image_url').value = '';"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                        accept="image/*">
                                </div>
                            </div>

                            <!-- CTAs -->
                            <div class="space-y-4">
                                <div id="cta-1-container" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label for="cta_text" class="block text-sm font-medium text-gray-700 mb-2">CTA 1
                                            Text</label>
                                        <input type="text" name="cta_text" id="cta_text"
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                            placeholder="e.g. Get Started">
                                    </div>
                                    <div class="relative">
                                        <label for="cta_url" class="block text-sm font-medium text-gray-700 mb-2">CTA 1
                                            URL</label>
                                        <div class="flex items-center gap-3">
                                            <input type="url" name="cta_url" id="cta_url"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                                placeholder="https://...">
                                            <div id="add-btn-container-1">
                                                <button type="button" id="add-cta-master-btn"
                                                    class="text-sm font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap">
                                                    + Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="cta-2-container"
                                    class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end hidden">
                                    <div>
                                        <label for="cta_2_text" class="block text-sm font-medium text-gray-700 mb-2">CTA
                                            2 Text</label>
                                        <input type="text" name="cta_2_text" id="cta_2_text"
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                            placeholder="e.g. Learn More">
                                    </div>
                                    <div class="relative">
                                        <label for="cta_2_url" class="block text-sm font-medium text-gray-700 mb-2">CTA
                                            2 URL</label>
                                        <div class="flex items-center gap-3">
                                            <input type="url" name="cta_2_url" id="cta_2_url"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                                placeholder="https://...">
                                            <button type="button" onclick="removeCta(2)"
                                                class="text-sm font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div id="cta-3-container"
                                    class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end hidden">
                                    <div>
                                        <label for="cta_3_text" class="block text-sm font-medium text-gray-700 mb-2">CTA
                                            3 Text</label>
                                        <input type="text" name="cta_3_text" id="cta_3_text"
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                            placeholder="e.g. Contact Us">
                                    </div>
                                    <div class="relative">
                                        <label for="cta_3_url" class="block text-sm font-medium text-gray-700 mb-2">CTA
                                            3 URL</label>
                                        <div class="flex items-center gap-3">
                                            <input type="url" name="cta_3_url" id="cta_3_url"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                                placeholder="https://...">
                                            <button type="button" onclick="removeCta(3)"
                                                class="text-sm font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Styling Options -->
                    <div class="space-y-6">
                        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">3</span>
                            Styling Options
                        </h2>

                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-6">
                            <!-- Background Color -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                                <div class="flex items-center gap-3">
                                    <input type="color" name="bg_color" value="#ffffff"
                                        class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    <span class="text-xs text-gray-500">Main bg</span>
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Text Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Title Color</label>
                                    <input type="color" name="title_color" value="#000000"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Subtitle Color</label>
                                    <input type="color" name="subtitle_color" value="#374151"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Description Color</label>
                                    <input type="color" name="description_color" value="#4B5563"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Button Colors -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Bg</label>
                                    <div class="flex items-center gap-3">
                                        <input type="color" name="button_bg_color" value="#3B82F6"
                                            class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                                    <div class="flex items-center gap-3">
                                        <input type="color" name="button_text_color" value="#FFFFFF"
                                            class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="flex justify-end pt-6 border-t border-gray-200">
                    <button type="submit" style="background-color: #5c67f2;"
                        class="group relative inline-flex items-center gap-2 px-8 py-4 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(92,103,242,0.5)]">
                        <span>Create Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5 transition-transform group-hover:translate-x-1">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
        <script>
            // ── Portfolio AI Content Data ────────────────────────────────
            let portfolioType = @json(session("portfolio_type", ""));
            if (!portfolioType) {
                portfolioType = 'developer';
            }

            let currentVariantIndexes = {};
            let pastSuggestions = [];

            async function fillWithAI(shuffle = false) {
                const shuffleBtn = document.getElementById('ai-shuffle-btn');

                // Open the AI Typing Modal immediately in loading state
                AiTypingModal.show("Generating Hero copy...");

                try {
                    const result = await safeAiFetch('{{ route("ai.placeholder") }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        },
                        body: JSON.stringify({
                            section: 'hero',
                            portfolio_type: portfolioType,
                            past_suggestions: pastSuggestions
                        })
                    });

                    if (result.success && result.data) {
                        const data = result.data;

                        if (data.title && !pastSuggestions.includes(data.title)) {
                            pastSuggestions.push(data.title);
                        }

                        // Prepare items for typewriter modal
                        const items = [
                            { label: 'Title', text: data.title, targetEl: document.getElementById('title') },
                            { label: 'Subtitle', text: data.subtitle, targetEl: document.getElementById('subtitle') },
                            { label: 'Description', text: data.description, targetEl: document.getElementById('description') },
                            { label: 'CTA 1 Text', text: data.cta_text, targetEl: document.getElementById('cta_text') },
                        ];

                        if (data.cta_2_text) {
                            const cta2Container = document.getElementById('cta-2-container');
                            if (cta2Container && cta2Container.classList.contains('hidden')) {
                                cta2Container.classList.remove('hidden');
                            }
                            items.push({ label: 'CTA 2 Text', text: data.cta_2_text, targetEl: document.getElementById('cta_2_text') });
                        }



                        // Trigger typewriter modal animation
                        await AiTypingModal.typeItems(items, () => {
                            if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                        });
                    } else {
                        throw new Error(result.message || 'Generation failed');
                    }
                } catch (error) {
                    console.error('AI Error:', error);
                    AiTypingModal.showError(error.message);
                }
            }

            document.addEventListener('DOMContentLoaded', function () {
                const layoutInputs = document.querySelectorAll('input[name="layout_style"]');
                const bgImageLabel = document.querySelector('label[for="background_image"]');

                function updateImageLabel(layout) {
                    if (layout === 'split') {
                        bgImageLabel.textContent = 'Right Column Image';
                    } else {
                        bgImageLabel.textContent = 'Background Image';
                    }
                }

                const checkedInput = document.querySelector('input[name="layout_style"]:checked');
                if (checkedInput) {
                    updateImageLabel(checkedInput.value);
                }

                layoutInputs.forEach(input => {
                    input.addEventListener('change', (e) => {
                        updateImageLabel(e.target.value);
                    });
                });

                // Initialize visible states for Add buttons
                updateCtaAddButtons();

                document.getElementById('add-cta-master-btn').addEventListener('click', () => {
                    const cta2 = document.getElementById('cta-2-container');
                    const cta3 = document.getElementById('cta-3-container');
                    if (cta2.classList.contains('hidden')) {
                        showCta(2);
                    } else if (cta3.classList.contains('hidden')) {
                        showCta(3);
                    }
                });
            });

            function updateCtaAddButtons() {
                const cta2Vis = !document.getElementById('cta-2-container').classList.contains('hidden');
                const cta3Vis = !document.getElementById('cta-3-container').classList.contains('hidden');

                // Hide if max CTAs (3) are visible
                document.getElementById('add-btn-container-1').style.display = (cta2Vis && cta3Vis) ? 'none' : 'block';
            }

            function showCta(id) {
                document.getElementById('cta-' + id + '-container').classList.remove('hidden');
                updateCtaAddButtons();
            }

            function removeCta(id) {
                document.getElementById('cta_' + id + '_text').value = '';
                document.getElementById('cta_' + id + '_url').value = '';
                document.getElementById('cta-' + id + '-container').classList.add('hidden');

                // Shift data up if removing CTA 2 and CTA 3 is active
                if (id === 2 && !document.getElementById('cta-3-container').classList.contains('hidden')) {
                    document.getElementById('cta_2_text').value = document.getElementById('cta_3_text').value;
                    document.getElementById('cta_2_url').value = document.getElementById('cta_3_url').value;

                    document.getElementById('cta_3_text').value = '';
                    document.getElementById('cta_3_url').value = '';
                    document.getElementById('cta-3-container').classList.add('hidden');
                }

                updateCtaAddButtons();
            }

            function clearAiImage() {
                document.getElementById('background_image_url').value = '';
                document.getElementById('ai-image-preview').classList.add('hidden');
            }

            async function generateCustomImage() {
                const promptInput = document.getElementById('ai_image_prompt');
                let promptText = promptInput.value.trim();
                
                if (!promptText) {
                    promptText = "A beautiful abstract professional background, " + (portfolioType || 'website');
                }

                const btn = document.getElementById('btn-generate-img');
                const originalHtml = btn.innerHTML;
                
                // Loading state
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;

                try {
                    const response = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        },
                        body: JSON.stringify({ prompt: promptText })
                    });

                    if (!response.ok) throw new Error('Generation failed');

                    const result = await response.json();
                    
                    if (result.success && result.image_url) {
                        const aiImgInput = document.getElementById('background_image_url');
                        const aiPreview = document.getElementById('ai-image-preview');
                        const aiSrc = document.getElementById('ai-img-src');
                        
                        aiImgInput.value = result.image_url;
                        aiSrc.src = result.image_url;
                        aiPreview.classList.remove('hidden');
                        document.getElementById('file_input').value = '';

                        // Success state
                        btn.innerHTML = `<i class="fa-solid fa-check"></i> Done`;
                        btn.classList.replace('bg-indigo-50', 'bg-emerald-50');
                        btn.classList.replace('text-indigo-700', 'text-emerald-700');
                        btn.classList.replace('border-indigo-200', 'border-emerald-200');
                        
                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                            btn.disabled = false;
                            btn.classList.replace('bg-emerald-50', 'bg-indigo-50');
                            btn.classList.replace('text-emerald-700', 'text-indigo-700');
                            btn.classList.replace('border-emerald-200', 'border-indigo-200');
                        }, 2000);
                    }
                } catch (error) {
                    alert('Error generating image: ' + error.message);
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                }
            }
        </script>
    </div>
</x-app-layout>