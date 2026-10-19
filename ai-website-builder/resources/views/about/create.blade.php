<x-app-layout>
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-5xl">
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create About Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Tell your story. Add an image and some text to let people
                    know more about you.</p>
            </div>

            <form action="{{ route('about.store', $hero->id) }}" method="POST" enctype="multipart/form-data"
                class="space-y-12">
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
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                        <!-- Image Left -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="image_left" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div
                                    class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-2">
                                    <div class="flex gap-2 h-full items-center justify-center">
                                        <div
                                            class="bg-indigo-200 rounded flex-1 shadow-sm h-full flex flex-col p-1 border border-indigo-300">
                                            <div class="w-full h-full bg-indigo-300 rounded-sm"></div>
                                        </div>
                                        <div
                                            class="bg-white rounded flex-1 shadow-sm h-full flex flex-col p-2 border border-gray-200 justify-center">
                                            <div class="h-1.5 w-1/2 bg-gray-400 rounded mb-2"></div>
                                            <div class="h-2 w-3/4 bg-gray-800 rounded mb-2"></div>
                                            <div class="h-1 w-full bg-gray-300 rounded mb-1"></div>
                                            <div class="h-1 w-full bg-gray-300 rounded mb-1"></div>
                                            <div class="h-1 w-5/6 bg-gray-300 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Image Left</h3>
                                <p class="text-xs text-slate-500">Image on the left, text on the right</p>
                            </div>
                        </label>

                        <!-- Image Right -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="image_right" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div
                                    class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-2">
                                    <div class="flex gap-2 h-full items-center justify-center">
                                        <div
                                            class="bg-white rounded flex-1 shadow-sm h-full flex flex-col p-2 border border-gray-200 justify-center">
                                            <div class="h-1.5 w-1/2 bg-gray-400 rounded mb-2"></div>
                                            <div class="h-2 w-3/4 bg-gray-800 rounded mb-2"></div>
                                            <div class="h-1 w-full bg-gray-300 rounded mb-1"></div>
                                            <div class="h-1 w-full bg-gray-300 rounded mb-1"></div>
                                            <div class="h-1 w-5/6 bg-gray-300 rounded"></div>
                                        </div>
                                        <div
                                            class="bg-indigo-200 rounded flex-1 shadow-sm h-full flex flex-col p-1 border border-indigo-300">
                                            <div class="w-full h-full bg-indigo-300 rounded-sm"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Image Right</h3>
                                <p class="text-xs text-slate-500">Text on the left, image on the right</p>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    <!-- 2. Content Details -->
                    <div class="space-y-6">
                        <div>
                            <div class="flex items-center justify-between gap-4 mb-8">
                                <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <span
                                        class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm font-bold">2</span>
                                    Content Details
                                </h2>
                                <div class="flex items-center gap-2">
                                    @php $portfolioType = session('portfolio_type', ''); @endphp
                                    <button type="button" id="ai-fill-btn" onclick="fillAboutWithAI()"
                                        class="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                        </svg>
                                        AI Fill
                                        <span
                                            class="text-[10px] text-slate-400">({{ ucfirst($portfolioType ?: 'Designer') }})</span>
                                    </button>
                                    <button type="button" id="ai-shuffle-btn" onclick="fillAboutWithAI(true)"
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

                            <div class="space-y-8">
                                <div class="grid grid-cols-1 gap-4">
                                    <div>
                                        <label for="title"
                                            class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                        <input type="text" name="title" id="title" placeholder="e.g. About Me" value=""
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all">
                                    </div>
                                </div>

                                <div>
                                    <label for="description"
                                        class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea name="description" id="description" rows="5"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                                        placeholder="Tell your story here... Enter multiple paragraphs if needed."
                                        required></textarea>
                                </div>

                                <div>
                                <div>
                                    <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Generate Image with AI (Free)
                                    </label>
                                    <div class="flex gap-2">
                                        <input type="text" id="ai_image_prompt" class="flex-1 px-4 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-indigo-300 transition-all" placeholder="e.g. A professional portrait of a software engineer...">
                                        <button type="button" id="btn-generate-img" onclick="generateCustomImage()" class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors text-sm whitespace-nowrap flex items-center gap-2">
                                            Generate
                                        </button>
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-1.5 mb-4">Leave empty for a random profile image based on your profession.</p>
                                </div>

                                <div class="space-y-4 relative">
                                    <div class="absolute -left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 uppercase rotate-[-90deg] origin-center tracking-widest">OR</div>
                                    <input type="hidden" name="ai_image_url" id="ai_image_url" value="{{ old('ai_image_url') }}">
                                    <div id="ai-image-preview" class="{{ old('ai_image_url') ? '' : 'hidden' }}">
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
                                            <img src="{{ old('ai_image_url') }}" id="ai-img-src" alt="AI Image" class="w-full h-full object-cover">
                                        </div>
                                    </div>
                                    <input type="file" name="image" id="file_input" accept="image/*"
                                        onchange="document.getElementById('ai-image-preview').classList.add('hidden'); document.getElementById('ai_image_url').value = '';"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all">
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
                                    <span class="text-xs text-gray-500 font-mono">#ffffff</span>
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Text Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Title Color</label>
                                    <input type="color" name="title_color" value="#111827"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>

                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Accent Line Color</label>
                                    <input type="color" name="accent_color" value="#6366f1"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>

                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Text Color</label>
                                    <input type="color" name="text_color" value="#4b5563"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Submit Button -->
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
    </div>

    <!-- AI Generator Script -->
    <script>
        let portfolioType = "{{ session('portfolio_type', '') }}";
        if (!portfolioType) {
            portfolioType = 'developer';
        }
        let currentVariantIndexes = {};
        let pastSuggestions = [];

        async function fillAboutWithAI(shuffle = false) {
            const shuffleBtn = document.getElementById('ai-shuffle-btn');

            // Open the AI Typing Modal immediately in loading state
            AiTypingModal.show("Generating About copy...");

            try {
                const result = await safeAiFetch('{{ route("ai.placeholder") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({
                        section: 'about',
                        portfolio_type: portfolioType,
                        past_suggestions: pastSuggestions
                    })
                });

                if (result.success && result.data) {
                    const data = result.data;

                    if (data.title && !pastSuggestions.includes(data.title)) {
                        pastSuggestions.push(data.title);
                    }

                    // Prepare items for typewriter modal (About form only has Title and Description)
                    const items = [
                        { label: 'Title', text: data.title, targetEl: document.getElementById('title') },
                        { label: 'Description', text: data.description, targetEl: document.getElementById('description') },
                    ];


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

        function clearAiImage() {
            document.getElementById('ai_image_url').value = '';
            document.getElementById('ai-image-preview').classList.add('hidden');
        }

        function randomizeLayout() {
            const layouts = ['image_left', 'image_right'];
            const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];

            // 1. Select Radio
            const radio = document.querySelector(`input[name="layout_style"][value="${randomLayout}"]`);
            if (radio) {
                radio.checked = true;
            }

            // 2. Randomize Colors
            const colorPalettes = [
                { bg: '#ffffff', title: '#111827', text: '#374151' },
                { bg: '#0f172a', title: '#f8fafc', text: '#94a3b8' },
                { bg: '#fdf2f8', title: '#831843', text: '#be185d' },
                { bg: '#f0fdf4', title: '#14532d', text: '#15803d' },
                { bg: '#fffbeb', title: '#78350f', text: '#92400e' }
            ];
            const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

            document.querySelector('input[name="bg_color"]').value = palette.bg;
            document.querySelector('input[name="title_color"]').value = palette.title;
            document.querySelector('input[name="text_color"]').value = palette.text;

            // 3. UI Feedback
            const btn = document.getElementById('ai-layout-btn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Applied!`;
            btn.classList.replace('bg-slate-900', 'bg-emerald-600');

            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.replace('bg-emerald-600', 'bg-slate-900');
            }, 2000);
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
                    const aiImgInput = document.getElementById('ai_image_url');
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
</x-app-layout>