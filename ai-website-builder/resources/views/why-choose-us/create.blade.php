<x-app-layout>
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-6xl">

            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Why Choose Us Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Showcase the key reasons why clients should choose your
                    business.</p>
            </div>

            <form action="{{ route('why-choose-us.store', $hero->id) }}" method="POST" class="space-y-12">
                @csrf


                <!-- Layout Selection -->
                <section>
                    <h2 class="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                        <span
                            class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">1</span>
                        Choose Layout
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                        <!-- Cards Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="cards" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div
                                    class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-2">
                                    <div class="flex flex-col gap-2 h-full justify-center">
                                        <div
                                            class="bg-white rounded shadow-sm flex items-start p-1.5 border border-gray-200">
                                            <div class="w-4 h-4 rounded bg-indigo-500 mr-2 flex-shrink-0"></div>
                                            <div class="flex-1 mt-0.5">
                                                <div class="h-1.5 w-3/4 bg-gray-800 rounded mb-1"></div>
                                                <div class="h-1 w-full bg-gray-300 rounded"></div>
                                            </div>
                                        </div>
                                        <div
                                            class="bg-white rounded shadow-sm flex items-start p-1.5 border border-gray-200">
                                            <div class="w-4 h-4 rounded bg-indigo-500 mr-2 flex-shrink-0"></div>
                                            <div class="flex-1 mt-0.5">
                                                <div class="h-1.5 w-2/3 bg-gray-800 rounded mb-1"></div>
                                                <div class="h-1 w-full bg-gray-300 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Cards</h3>
                                <p class="text-xs text-slate-500">Elegant card layout</p>
                            </div>
                        </label>

                        <!-- Numbered Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="numbered" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div
                                    class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-2">
                                    <div class="flex gap-2 h-full items-center">
                                        <div
                                            class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            1</div>
                                        <div class="flex-1 flex flex-col gap-1">
                                            <div class="h-2 w-3/4 bg-gray-800 rounded"></div>
                                            <div class="h-2 w-full bg-gray-800 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Numbered</h3>
                                <p class="text-xs text-slate-500">Numbered list layout</p>
                            </div>
                        </label>

                        <!-- Timeline Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="timeline" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div
                                    class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-2 flex flex-col justify-center">
                                    <div class="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-0.5 bg-gray-300">
                                    </div>
                                    <div class="flex items-center w-full mb-2 relative">
                                        <div class="w-1/2 pr-2 flex justify-end">
                                            <div
                                                class="bg-white rounded shadow-sm p-1 border border-gray-200 w-full text-right">
                                                <div class="h-1.5 w-3/4 bg-gray-800 rounded ml-auto"></div>
                                            </div>
                                        </div>
                                        <div
                                            class="w-3 h-3 bg-indigo-600 rounded-full absolute left-1/2 -translate-x-1/2 ring-2 ring-white shadow-sm flex items-center justify-center">
                                            <div class="w-1 h-1 bg-white rounded-full"></div>
                                        </div>
                                        <div class="w-1/2 pl-2"></div>
                                    </div>
                                    <div class="flex items-center w-full relative">
                                        <div class="w-1/2 pr-2"></div>
                                        <div
                                            class="w-3 h-3 bg-indigo-600 rounded-full absolute left-1/2 -translate-x-1/2 ring-2 ring-white shadow-sm flex items-center justify-center">
                                            <div class="w-1 h-1 bg-white rounded-full"></div>
                                        </div>
                                        <div class="w-1/2 pl-2 flex justify-start">
                                            <div class="bg-white rounded shadow-sm p-1 border border-gray-200 w-full">
                                                <div class="h-1.5 w-3/4 bg-gray-800 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Timeline</h3>
                                <p class="text-xs text-slate-500">Vertical timeline</p>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

                    <div class="space-y-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">2</span>
                                Reasons Content
                            </h2>
                            @php $portfolioType = session('portfolio_type', 'Website'); @endphp
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="fillWhyChooseUsWithAI()" id="ai-fill-btn"
                                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                    <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                    </svg>
                                    AI Fill
                                    <span class="text-[10px] text-slate-400">({{ ucfirst($portfolioType) }})</span>
                                </button>
                                <button type="button" onclick="fillWhyChooseUsWithAI(true)" id="ai-shuffle-btn"
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

                        <div class="space-y-6">
                            <!-- Section Title & Subtitle -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                                    <input type="text" name="title" id="title" placeholder="e.g. Why Choose Us"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 @error('title') border-red-500 @enderror rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all font-bold"
                                        value="{{ old('title', $hero->whyChooseUs?->title ?? '') }}">
                                    @error('title') <p class="text-xs text-red-500 mt-1 font-medium">{{ $message }}</p>
                                    @enderror
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Section Subtitle</label>
                                    <input type="text" name="subtitle" id="subtitle"
                                        placeholder="e.g. Our values and mission"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 @error('subtitle') border-red-500 @enderror rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                        value="{{ old('subtitle', $hero->whyChooseUs?->subtitle ?? '') }}">
                                    @error('subtitle') <p class="text-xs text-red-500 mt-1 font-medium">{{ $message }}
                                    </p> @enderror
                                </div>
                            </div>
                            <div id="reasonsContainer" class="space-y-4">
                                <label class="block text-sm font-medium text-gray-700">Reasons List</label>

                                <!-- Reason Item Template -->
                                <div
                                    class="reason-item bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                    <button type="button" onclick="removeReason(this)"
                                        class="absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                            fill="currentColor">
                                            <path fill-rule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                    <div class="grid grid-cols-1 gap-4">
                                        <div>
                                            <label class="block text-xs text-gray-500 mb-1">Reason Title</label>
                                            <input type="text" name="reasons[0][title]"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all font-bold"
                                                placeholder="e.g. Expert Support" required>
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-500 mb-1">Icon <span
                                                    class="text-gray-400">(optional)</span></label>
                                            <div class="relative w-1/2">
                                                <input type="hidden" name="reasons[0][icon]" value="fa-solid fa-star">
                                                <button type="button" onclick="openIconPicker(this)"
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                                    <i class="fa-solid fa-star text-xl text-indigo-500"></i>
                                                    <span class="text-xs text-gray-500">star</span>
                                                </button>
                                                <button type="button" onclick="clearIcon(this)" title="Remove icon"
                                                    class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3"
                                                        viewBox="0 0 20 20" fill="currentColor">
                                                        <path fill-rule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clip-rule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-500 mb-1">Description</label>
                                            <textarea name="reasons[0][description]" rows="2"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all font-medium"
                                                placeholder="Describe this reason..." required></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="button" onclick="addReason()"
                                class="text-sm text-indigo-500 font-medium hover:text-indigo-600 flex items-center gap-1 mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4v16m8-8H4" />
                                </svg>
                                Add Another Reason
                            </button>
                        </div>
                    </div>

                    <!-- 3. Styling Options -->
                    <div class="space-y-6">
                        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">3</span>
                            Styling Options
                        </h2>

                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-6">
                            <!-- Background Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Section Background</label>
                                    <input type="color" name="bg_color" value="#ffffff"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Card Background</label>
                                    <input type="color" name="card_bg_color" value="#f9fafb"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Text & Icon Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Title Color</label>
                                    <input type="color" name="title_color" value="#111827"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Subtitle Color</label>
                                    <input type="color" name="subtitle_color" value="#4b5563"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Icon Color</label>
                                    <input type="color" name="icon_color"
                                        value="{{ old('icon_color', $hero->whyChooseUs->custom_styles['icon_color'] ?? '#ffffff') }}"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Icon BG / Accent</label>
                                    <input type="color" name="icon_bg_color"
                                        value="{{ old('icon_bg_color', $hero->whyChooseUs?->custom_styles['icon_bg_color'] ?? '#6366f1') }}"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="border-t border-gray-200 my-4"></div>
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Reason Title Color</label>
                                    <input type="color" name="reason_title_color"
                                        value="{{ old('reason_title_color', $hero->whyChooseUs?->custom_styles['reason_title_color'] ?? '#111827') }}"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between group">
                                    <label class="text-sm font-medium text-gray-700">Reason Text Color</label>
                                    <input type="color" name="reason_text_color"
                                        value="{{ old('reason_text_color', $hero->whyChooseUs?->custom_styles['reason_text_color'] ?? '#4b5563') }}"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium text-gray-700">Border Radius (px)</label>
                                <input type="number" name="border_radius" value="12" min="0" max="40"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all font-medium">
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Submit Button -->
                <div class="flex justify-end pt-6 border-t border-gray-200">
                    <button type="submit" style="background-color: #5c67f2;"
                        class="group relative inline-flex items-center gap-2 px-8 py-4 bg-[#5c67f2] hover:bg-[#4b55e1] text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(92,103,242,0.5)]">
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

    <!-- Icon Picker Modal -->
    <div id="iconPickerModal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="closeIconPicker()"></div>
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 class="font-semibold text-gray-900">Select Icon</h3>
                <button type="button" onclick="closeIconPicker()" class="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="p-4 border-b border-gray-200 bg-white">
                <input type="text" id="iconSearch" placeholder="Search icons..."
                    class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
            </div>
            <div class="p-4 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2" id="iconGrid">
                <!-- Icons will be populated here -->
            </div>
        </div>
    </div>

    <script src="{{ asset('js/font-awesome-icons.js') }}"></script>
    <script>
        const portfolioType = '{{ session("portfolio_type", "developer") }}';
        let currentVariantIndexes = {};
        let currentIconInput = null;
        let reasonCount = 1;
        let pastSuggestions = [];

        function openIconPicker(btn) {
            currentIconInput = btn.parentElement.querySelector('input[type="hidden"]');
            const modal = document.getElementById('iconPickerModal');
            const grid = document.getElementById('iconGrid');

            if (grid.children.length === 0) {
                renderIcons(fontAwesomeIcons);
            }

            modal.classList.remove('hidden');
            document.getElementById('iconSearch').value = '';
            document.getElementById('iconSearch').focus();
        }

        function closeIconPicker() {
            document.getElementById('iconPickerModal').classList.add('hidden');
            currentIconInput = null;
        }

        function selectIcon(iconClass) {
            if (currentIconInput) {
                currentIconInput.value = iconClass;
                const btn = currentIconInput.parentElement.querySelector('button');
                btn.innerHTML = `<i class="${iconClass} text-lg text-indigo-500"></i><span class="text-gray-900 ml-1 text-sm">${iconClass.replace('fa-solid fa-', '')}</span>`;
            }
            closeIconPicker();
        }

        function renderIcons(icons) {
            const grid = document.getElementById('iconGrid');
            grid.innerHTML = icons.map(icon => `
                <button type="button" onclick="selectIcon('${icon.class}')" class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                    <i class="${icon.class} text-xl text-gray-500 group-hover:text-indigo-600"></i>
                    <span class="text-[10px] text-gray-400 group-hover:text-indigo-500 truncate w-full text-center">${icon.name}</span>
                </button>
            `).join('');
        }

        document.getElementById('iconSearch').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = fontAwesomeIcons.filter(icon =>
                icon.name.toLowerCase().includes(term) ||
                icon.class.includes(term)
            );
            renderIcons(filtered);
        });


        async function fillWhyChooseUsWithAI(shuffle = false) {
            const shuffleBtn = document.getElementById('ai-shuffle-btn');

            // Open the AI Typing Modal immediately in loading state
            AiTypingModal.show("Generating Why Choose Us copy...");

            try {
                const result = await safeAiFetch('{{ route("ai.placeholder") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({
                        section: 'why-choose-us',
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
                        { label: 'Section Title', text: data.title, targetEl: document.getElementById('title') },
                        { label: 'Section Subtitle', text: data.subtitle, targetEl: document.getElementById('subtitle') },
                    ];

                    // Rebuild reasons container in the DOM immediately
                    const container = document.getElementById('reasonsContainer');
                    container.innerHTML = '';

                    const reasons = data.reasons || [];
                    reasons.forEach((rsn, i) => {
                        const template = `
                            <div class="reason-item bg-gray-50 p-4 rounded-xl border border-gray-200 relative group transition-all animate-fade-in-up">
                                <button type="button" onclick="removeReason(this)" class="absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                </button>
                                <div class="grid grid-cols-1 gap-4">
                                    <div>
                                        <label class="block text-xs text-gray-500 mb-1">Reason Title</label>
                                        <input type="text" name="reasons[${i}][title]" value="" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 transition-all font-bold" required>
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-500 mb-1">Icon <span class="text-gray-400">(optional)</span></label>
                                        <div class="relative w-1/2">
                                            <input type="hidden" name="reasons[${i}][icon]" value="${rsn.icon || 'fa-solid fa-star'}">
                                            <button type="button" onclick="openIconPicker(this)" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                                <i class="${rsn.icon || 'fa-solid fa-star'} text-lg text-indigo-500"></i>
                                                <span class="text-xs text-gray-500">${(rsn.icon || 'star').replace('fa-solid fa-', '').replace('fa-brands fa-', '')}</span>
                                            </button>
                                            <button type="button" onclick="clearIcon(this)" title="Remove icon" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-500 mb-1">Description</label>
                                        <textarea name="reasons[${i}][description]" rows="2" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 transition-all font-medium leading-relaxed" required></textarea>
                                    </div>
                                </div>
                            </div>
                        `;
                        container.insertAdjacentHTML('beforeend', template);
                        reasonCount = i + 1;

                        const rTitleInp = container.children[i].querySelector(`input[name="reasons[${i}][title]"]`);
                        const rDescTextarea = container.children[i].querySelector(`textarea[name="reasons[${i}][description]"]`);

                        items.push({ label: `Reason ${i+1} Title`, text: rsn.title, targetEl: rTitleInp });
                        items.push({ label: `Reason ${i+1} Description`, text: rsn.description, targetEl: rDescTextarea });
                    });

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


        function addReason() {
            const container = document.getElementById('reasonsContainer');
            const template = `
            <div class="reason-item bg-gray-50 p-4 rounded-xl border border-gray-200 relative group animate-fade-in-up">
                <button type="button" onclick="removeReason(this)" class="absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Reason Title</label>
                        <input type="text" name="reasons[${reasonCount}][title]" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all font-bold" placeholder="Reason title..." required>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Icon <span class="text-gray-400">(optional)</span></label>
                        <div class="relative w-1/2">
                            <input type="hidden" name="reasons[${reasonCount}][icon]" value="fa-solid fa-star">
                            <button type="button" onclick="openIconPicker(this)" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                <i class="fa-solid fa-star text-xl text-indigo-500"></i>
                                <span class="text-xs text-gray-500">star</span>
                            </button>
                            <button type="button" onclick="clearIcon(this)" title="Remove icon" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Description</label>
                        <textarea name="reasons[${reasonCount}][description]" rows="2" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all font-medium" placeholder="Description..." required></textarea>
                    </div>
                </div>
            </div>
            `;
            container.insertAdjacentHTML('beforeend', template);
            reasonCount++;
        }

        function clearIcon(btn) {
            const wrapper = btn.parentElement;
            const input = wrapper.querySelector('input[type="hidden"]');
            const icon = wrapper.querySelector('i');
            const span = wrapper.querySelector('span');

            input.value = '';
            icon.className = 'fa-solid fa-plus text-xl text-gray-300';
            span.textContent = 'None';
        }

        function removeReason(btn) {
            const items = document.querySelectorAll('.reason-item');
            if (items.length > 1) {
                btn.closest('.reason-item').remove();
            } else {
                alert('You must have at least one reason.');
            }
        }
    </script>
</x-app-layout>