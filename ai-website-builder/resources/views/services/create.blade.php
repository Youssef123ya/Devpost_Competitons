<x-app-layout>
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-6xl">
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Services Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Showcase what you offer with a beautiful services section.
                </p>
            </div>

            @if ($errors->any())
                <div class="max-w-4xl mx-auto mb-8 p-6 bg-white border border-red-100 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-3 text-red-600 font-bold mb-4">
                        <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg">Submission Errors</h3>
                            <p class="text-xs font-normal text-slate-500">Please correct the following issues to
                                generate your section</p>
                        </div>
                    </div>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-red-500/90 list-none px-2">
                        @foreach ($errors->all() as $error)
                            <li class="flex items-start gap-2">
                                <span class="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                                {{ $error }}
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form action="{{ route('services.store', $hero->id) }}" method="POST" class="space-y-12">
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
                        <!-- Cards (Default) -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="cards" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-white peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 relative p-3 border border-slate-100"
                                    style="background-color: #f1f5f9;">
                                    <div class="grid grid-cols-2 gap-2 w-full h-full">
                                        <div class="bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-start justify-start p-3">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <i class="fa-solid fa-star text-indigo-500 text-[11px]"></i>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-start justify-start p-3">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <i class="fa-solid fa-shield-halved text-indigo-500 text-[11px]"></i>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-start justify-start p-3">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <i class="fa-solid fa-bolt text-indigo-500 text-[11px]"></i>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-start justify-start p-3">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <i class="fa-solid fa-chart-line text-indigo-500 text-[11px]"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Modern Cards</h3>
                                <p class="text-xs text-slate-500">Dark themed cards with hover effects</p>
                            </div>
                        </label>

                        <!-- List -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="list" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-white peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 relative flex flex-col justify-center px-4 gap-3 border border-slate-100"
                                    style="background-color: #f1f5f9;">
                                    <div class="flex flex-col gap-2 w-full h-full justify-center">
                                        <div class="bg-white rounded-lg border border-slate-100 flex items-start gap-2.5 p-2 shadow-sm">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] flex-shrink-0">
                                                <i class="fa-solid fa-server"></i>
                                            </div>
                                            <div class="flex-1 pt-0.5">
                                                <div class="h-1.5 w-2/5 bg-slate-400 rounded-full mb-1"></div>
                                                <div class="h-1 w-full bg-slate-200 rounded-full"></div>
                                                <div class="h-1 w-3/4 bg-slate-200 rounded-full mt-0.5"></div>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-lg border border-slate-100 flex items-start gap-2.5 p-2 shadow-sm">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] flex-shrink-0">
                                                <i class="fa-solid fa-code"></i>
                                            </div>
                                            <div class="flex-1 pt-0.5">
                                                <div class="h-1.5 w-1/3 bg-slate-400 rounded-full mb-1"></div>
                                                <div class="h-1 w-full bg-slate-200 rounded-full"></div>
                                                <div class="h-1 w-4/5 bg-slate-200 rounded-full mt-0.5"></div>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-lg border border-slate-100 flex items-start gap-2.5 p-2 shadow-sm">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] flex-shrink-0">
                                                <i class="fa-solid fa-network-wired"></i>
                                            </div>
                                            <div class="flex-1 pt-0.5">
                                                <div class="h-1.5 w-2/5 bg-slate-400 rounded-full mb-1"></div>
                                                <div class="h-1 w-full bg-slate-200 rounded-full"></div>
                                                <div class="h-1 w-2/3 bg-slate-200 rounded-full mt-0.5"></div>
                                            </div>
                                        </div>
                                        <div class="bg-white rounded-lg border border-slate-100 flex items-start gap-2.5 p-2 shadow-sm">
                                            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] flex-shrink-0">
                                                <i class="fa-solid fa-rocket"></i>
                                            </div>
                                            <div class="flex-1 pt-0.5">
                                                <div class="h-1.5 w-1/3 bg-slate-400 rounded-full mb-1"></div>
                                                <div class="h-1 w-full bg-slate-200 rounded-full"></div>
                                                <div class="h-1 w-3/5 bg-slate-200 rounded-full mt-0.5"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">List View</h3>
                                <p class="text-xs text-slate-500">Clean vertical list layout</p>
                            </div>
                        </label>
                    </div>

                </section>

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <!-- 2. Services Content -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">2</span>
                                Services content
                            </h2>
                            @php $portfolioType = session('portfolio_type', 'Website'); @endphp
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="fillServicesWithAI()" id="ai-fill-btn"
                                    class="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                    </svg>
                                    AI Fill
                                    <span class="text-[10px] text-slate-400">({{ ucfirst($portfolioType) }})</span>
                                </button>
                                <button type="button" onclick="fillServicesWithAI(true)" id="ai-shuffle-btn"
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
                                    <input type="text" name="title" id="title" placeholder="e.g. My Services"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                        value="{{ old('title', $hero->serviceSection->title ?? '') }}">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Section Subtitle</label>
                                    <input type="text" name="subtitle" id="subtitle" placeholder="e.g. What I offer"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                        value="{{ old('subtitle', $hero->serviceSection->subtitle ?? '') }}">
                                </div>
                            </div>

                            <div id="services-container" class="space-y-4">
                                <label class="block text-sm font-medium text-gray-700">Services List</label>

                                <!-- Service Item Template -->
                                <div
                                    class="service-item bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                    <button type="button" onclick="removeService(this)"
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
                                            <label class="block text-xs text-gray-500 mb-1">Service Name</label>
                                            <input type="text" name="services[0][title]"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all"
                                                placeholder="Service Name" required>
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-500 mb-1">Icon <span
                                                    class="text-gray-400">(optional)</span></label>
                                            <div class="relative w-1/2">
                                                <input type="hidden" name="services[0][icon]" value="fa-solid fa-code">
                                                <button type="button" onclick="openIconPicker(this)"
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                                    <i class="fa-solid fa-code text-xl text-indigo-500"></i>
                                                    <span class="text-xs text-gray-500">code</span>
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
                                            <textarea name="services[0][description]" rows="2"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all"
                                                placeholder="Description..." required></textarea>
                                        </div>


                                    </div>
                                </div>
                            </div>

                            <button type="button" onclick="addService()"
                                class="text-sm text-indigo-500 font-medium hover:text-indigo-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4v16m8-8H4" />
                                </svg>
                                Add Another Service
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
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Section Background</label>
                                    <input type="color" name="bg_color" value="#ffffff"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Card Background</label>
                                    <input type="color" name="card_bg_color" value="#f9fafb"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Text & Icon Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Text Color</label>
                                    <input type="color" name="service_text_color" value="#0f172a"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Accent Color</label>
                                    <input type="color" name="accent_color" value="#6366f1"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Icon Color</label>
                                    <input type="color" name="icon_color" value="#6366f1"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Border Radius (px)</label>
                                </div>
                                <input type="number" name="border_radius" value="12" min="0" max="40"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Submit Action -->
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

        <!-- Icon Picker Modal -->
        <div id="iconPickerModal" class="fixed inset-0 z-50 hidden">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="closeIconPicker()"></div>
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h3 class="font-semibold text-gray-900">Select Icon</h3>
                    <button onclick="closeIconPicker()" class="text-gray-500 hover:text-gray-700">
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
            const portfolioType = @json(session("portfolio_type", ""));
            let currentVariantIndexes = {};
            let pastSuggestions = [];

            async function fillServicesWithAI(shuffle = false) {
                const btn = document.getElementById('ai-fill-btn');
                const shuffleBtn = document.getElementById('ai-shuffle-btn');
                const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = `${loadingIcon} Generating...`;
                }

                try {
                    const response = await fetch('{{ route("ai.placeholder") }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        },
                        body: JSON.stringify({
                            section: 'services',
                            portfolio_type: portfolioType,
                            past_suggestions: pastSuggestions
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Server error');
                    }

                    const result = await response.json();

                    if (result.success) {
                        const data = result.data;

                        if (data.title && !pastSuggestions.includes(data.title)) {
                            pastSuggestions.push(data.title);
                        }

                        // Fill section title & subtitle
                        const titleInput = document.getElementById('title');
                        const subtitleInput = document.getElementById('subtitle');

                        if (titleInput && data.title) {
                            titleInput.style.background = '#f0fdf4';
                            titleInput.style.borderColor = '#86efac';
                            titleInput.value = data.title;
                            setTimeout(() => {
                                titleInput.style.background = '';
                                titleInput.style.borderColor = '';
                            }, 1000);
                        }
                        if (subtitleInput && data.subtitle) {
                            subtitleInput.style.background = '#f0fdf4';
                            subtitleInput.style.borderColor = '#86efac';
                            subtitleInput.value = data.subtitle;
                            setTimeout(() => {
                                subtitleInput.style.background = '';
                                subtitleInput.style.borderColor = '';
                            }, 1000);
                        }

                        // Rebuild services container
                        const container = document.getElementById('services-container');
                        const label = container.querySelector('label');
                        container.innerHTML = '';
                        if (label) container.appendChild(label);

                        const services = data.services || [];
                        services.forEach((svc, i) => {
                            const div = document.createElement('div');
                            div.className = 'service-item bg-gray-50 p-4 rounded-xl border border-gray-200 relative group animate-fade-in-up';
                            div.innerHTML = `
                            <button type="button" onclick="removeService(this)" class="absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                            </button>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Service Title</label>
                                    <input type="text" name="services[${i}][title]" value="${svc.title}" class="w-full px-4 py-3 bg-white border border-emerald-300 rounded-lg text-sm text-gray-900 transition-all font-bold" style="background:#f0fdf4;" required>
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Icon</label>
                                    <div class="relative">
                                        <input type="hidden" name="services[${i}][icon]" value="${svc.icon || 'fa-solid fa-star'}">
                                        <button type="button" onclick="openIconPicker(this)" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                            <i class="${svc.icon || 'fa-solid fa-star'} text-xl text-indigo-500"></i>
                                            <span class="text-xs text-gray-500">${(svc.icon || 'star').replace('fa-solid fa-', '')}</span>
                                        </button>
                                        <button type="button" onclick="clearIcon(this)" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs text-gray-500 mb-1">Description</label>
                                    <textarea name="services[${i}][description]" rows="2" class="w-full px-4 py-3 bg-white border border-emerald-300 rounded-lg text-sm text-gray-900 transition-all leading-relaxed" style="background:#f0fdf4;" required>${svc.description}</textarea>
                                </div>
                            </div>
                        `;
                            container.appendChild(div);
                            serviceCount = i + 1;

                            setTimeout(() => {
                                div.querySelectorAll('.border-emerald-300').forEach(el => el.classList.replace('border-emerald-300', 'border-gray-300'));
                                div.querySelectorAll('[style*="background:#f0fdf4"]').forEach(el => el.style.background = '');
                            }, 1000 + i * 150);
                        });

                        if (btn) {
                            btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Filled!`;
                            btn.classList.add('scale-105', 'shadow-emerald-100', 'bg-emerald-600', 'border-emerald-500');
                            btn.classList.remove('bg-slate-900', 'border-slate-700/70', 'hover:bg-slate-700');

                            setTimeout(() => {
                                btn.disabled = false;
                                btn.innerHTML = `<svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" /></svg> AI Fill <span class="text-[10px] text-slate-400">(${portfolioType ? '(' + portfolioType.charAt(0).toUpperCase() + portfolioType.slice(1) + ')' : ''})</span>`;
                                btn.classList.remove('bg-emerald-600', 'border-emerald-500', 'scale-105', 'shadow-emerald-100');
                                btn.classList.add('bg-slate-900', 'border-slate-700/70', 'hover:bg-slate-700');
                                if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                            }, 1000);
                        }
                    } else {
                        throw new Error(result.message || 'Generation failed');
                    }
                } catch (error) {
                    console.error('AI Error:', error);
                    alert('AI Generation Error: ' + error.message);
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fa-solid fa-magic mr-1.5"></i> AI Fill`;
                    }
                }
            }

            let serviceCount = 1;
            let currentIconInput = null;

            function clearIcon(xBtn) {
                const wrapper = xBtn.closest('.relative');
                const hidden = wrapper.querySelector('input[type="hidden"]');
                const pickerBtn = wrapper.querySelector('button[onclick^="openIconPicker"]');
                hidden.value = '';
                pickerBtn.innerHTML = `<span class="text-xs text-gray-400 italic">No icon selected</span>`;
            }

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
                    btn.innerHTML = `<i class="${iconClass} text-xl text-indigo-500"></i><span class="text-xs text-gray-500">${iconClass.replace('fa-solid fa-', '')}</span>`;
                }
                closeIconPicker();
            }

            function renderIcons(icons) {
                const grid = document.getElementById('iconGrid');
                grid.innerHTML = icons.map(icon => `
                <button onclick="selectIcon('${icon.class}')" class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                    <i class="${icon.class} text-2xl text-gray-600 group-hover:text-indigo-600"></i>
                    <span class="text-[10px] text-gray-500 group-hover:text-indigo-500 truncate w-full text-center">${icon.name}</span>
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

            function addService() {
                const container = document.getElementById('services-container');
                const template = `
                <div class="service-item bg-gray-50 p-4 rounded-xl border border-gray-200 relative group animate-fade-in-up">
                    <button type="button" onclick="removeService(this)" class="absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Service Name</label>
                            <input type="text" name="services[${serviceCount}][title]" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all" placeholder="Service Name" required>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Icon <span class="text-gray-400">(optional)</span></label>
                            <div class="relative w-1/2">
                                <input type="hidden" name="services[${serviceCount}][icon]" value="fa-solid fa-code">
                                <button type="button" onclick="openIconPicker(this)" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                    <i class="fa-solid fa-code text-xl text-indigo-500"></i>
                                    <span class="text-xs text-gray-500">code</span>
                                </button>
                                <button type="button" onclick="clearIcon(this)" title="Remove icon"
                                    class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Description</label>
                            <textarea name="services[${serviceCount}][description]" rows="2" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all" placeholder="Description..." required></textarea>
                        </div>


                    </div>
                </div>
            `;
                container.insertAdjacentHTML('beforeend', template);
                serviceCount++;
            }

            function removeService(btn) {
                const items = document.querySelectorAll('.service-item');
                if (items.length > 1) {
                    btn.closest('.service-item').remove();
                } else {
                    alert('You must have at least one service.');
                }
            }

            function randomizeLayout() {
                const layouts = ['cards', 'list'];
                const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];

                // 1. Select Radio
                const radio = document.querySelector(`input[name="layout_style"][value="${randomLayout}"]`);
                if (radio) {
                    radio.checked = true;
                }

                // 2. Randomize Colors
                const colorPalettes = [
                    { bg: '#ffffff', title: '#111827', text: '#374151', card: '#f9fafb' },
                    { bg: '#0f172a', title: '#f8fafc', text: '#94a3b8', card: '#1e293b' },
                    { bg: '#fdf2f8', title: '#831843', text: '#be185d', card: '#fce7f3' },
                    { bg: '#f0fdf4', title: '#14532d', text: '#15803d', card: '#dcfce7' },
                    { bg: '#fffbeb', title: '#78350f', text: '#92400e', card: '#fef3c7' }
                ];
                const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

                if (document.querySelector('input[name="styles[bg_color]"]')) {
                    document.querySelector('input[name="styles[bg_color]"]').value = palette.bg;
                    document.querySelector('input[name="styles[title_color]"]').value = palette.title;
                    document.querySelector('input[name="styles[service_title_color]"]').value = palette.title;
                    document.querySelector('input[name="styles[service_text_color]"]').value = palette.text;
                    if (document.querySelector('input[name="styles[card_bg_color]"]')) {
                        document.querySelector('input[name="styles[card_bg_color]"]').value = palette.card;
                    }
                }

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
        </script>
</x-app-layout>