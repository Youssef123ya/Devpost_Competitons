<x-app-layout>
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-6xl">
            <!-- Section Header -->
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Navbar Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Choose a layout and customize your links to generate a
                    stunning navigation bar.</p>
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

            <form action="{{ route('navbar.store', $hero->id) }}" method="POST" enctype="multipart/form-data"
                class="space-y-12" id="navbarForm"
                onsubmit="this.querySelector('button[type=submit]').disabled = true; this.querySelector('button[type=submit]').innerHTML = 'Generating...';">
                @csrf
                <!-- Layout Selection -->
                <section>
                    <h2 class="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                        <span
                            class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">1</span>
                        Choose Layout
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Layout 1: Centered Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="centered" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="w-full overflow-hidden rounded-lg mb-4 relative flex flex-col pt-2 px-2"
                                    style="height: 140px; background-color: #f8fafc;">
                                    <div class="w-full h-8 rounded-md flex items-center justify-between px-3"
                                        style="background-color: #f3efff;">
                                        <!-- Logo (Left) -->
                                        <div class="w-12 h-2.5 rounded-full flex-shrink-0"
                                            style="background-color: #818cf8;"></div>
                                        <!-- Links (Centered) -->
                                        <div class="flex gap-3 flex-shrink-0">
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                        </div>
                                        <!-- Button (Right) -->
                                        <div class="w-12 h-2.5 rounded-full flex-shrink-0"
                                            style="background-color: #818cf8;"></div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Centered Layout</h3>
                                <p class="text-sm text-gray-500">Content centered in background</p>
                            </div>
                        </label>

                        <!-- Layout 2: Left Aligned -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="left-aligned" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="w-full overflow-hidden rounded-lg mb-4 relative flex flex-col pt-2 px-2"
                                    style="height: 140px; background-color: #f8fafc;">
                                    <div class="w-full h-8 rounded-md flex items-center justify-between px-3"
                                        style="background-color: #f3efff;">
                                        <!-- Left Group (Links Only) -->
                                        <div class="flex items-center gap-3 flex-shrink-0">
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                        </div>
                                        <!-- Right Group (Button) -->
                                        <div class="w-12 h-2.5 rounded-full flex-shrink-0"
                                            style="background-color: #818cf8;"></div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Left Aligned</h3>
                                <p class="text-sm text-gray-500">Content aligned to left</p>
                            </div>
                        </label>

                        <!-- Layout 3: Right Aligned -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="right-aligned" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="w-full overflow-hidden rounded-lg mb-4 relative flex flex-col pt-2 px-2"
                                    style="height: 140px; background-color: #f8fafc;">
                                    <div class="w-full h-8 rounded-md flex items-center justify-between px-3"
                                        style="background-color: #f3efff;">
                                        <!-- Left Group (Logo) -->
                                        <div class="w-12 h-2.5 rounded-full flex-shrink-0"
                                            style="background-color: #818cf8;"></div>
                                        <!-- Right Group (Links Only) -->
                                        <div class="flex items-center gap-3 flex-shrink-0">
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                            <div class="w-6 h-2 rounded-full flex-shrink-0"
                                                style="background-color: #c7d2fe;"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Right Aligned</h3>
                                <p class="text-sm text-gray-500">Content and image iin two colums</p>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    <!-- 2. Nav content -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">2</span>
                                Nav content
                            </h2>
                            <div class="flex items-center gap-2">
                                <button type="button" id="ai-fill-btn" onclick="fillWithMySections()"
                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-all">
                                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                    </svg>
                                    <span id="ai-btn-text">Fill with My Sections</span>
                                </button>
                                <button type="button" id="ai-shuffle-btn" onclick="fillWithMySections(true)"
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
                            <!-- Navigation Links -->
                            <div class="space-y-4">
                                <div id="links-container" class="space-y-4">
                                    <div class="link-row">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                            <div>
                                                <label
                                                    class="block text-sm font-medium text-gray-700 mb-2">Link1</label>
                                                <input type="text" name="links[0][title]" id="link_title_0"
                                                    placeholder="e.g"
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                                    value="Home">
                                            </div>
                                            <div class="relative">
                                                <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                                <div class="flex items-center gap-3">
                                                    <input type="text" name="links[0][url]" id="link_url_0"
                                                        placeholder="https://..."
                                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                                        value="/">
                                                    <button type="button" id="add-link-btn"
                                                        class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap">+
                                                        Add</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="mt-2 flex items-center gap-2">
                                            <input type="checkbox" name="links[0][is_external]" id="external_0"
                                                value="1"
                                                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                                            <label for="external_0" class="text-xs text-indigo-500">Click check box if
                                                you want to link this to an external link</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Logo Image & Text -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="logo_image" class="block text-sm font-medium text-gray-700 mb-2">Logo
                                        Image</label>
                                    <input type="file" name="logo_image" id="logo_image"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                        accept="image/*">
                                </div>
                                <div>
                                    <label for="logo_text" class="block text-sm font-medium text-gray-700 mb-2">Logo
                                        Text</label>
                                    <input type="text" name="logo_text" id="logo_text" placeholder="e.g Brand Name"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                        value="{{ old('logo_text') }}">
                                </div>
                            </div>

                            <!-- Primary CTA -->
                            <div id="buttons-container" class="space-y-4 pt-4 border-t border-slate-100">
                                <div class="button-row">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div>
                                            <label for="button_text_0"
                                                class="block text-sm font-medium text-gray-700 mb-2">Nav Button
                                                Text</label>
                                            <input type="text" name="buttons[0][text]" id="button_text_0"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                                                placeholder="e.g Contact us">
                                        </div>
                                        <div class="relative">
                                            <label for="button_url_0"
                                                class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                            <div class="flex items-center gap-3">
                                                <input type="text" name="buttons[0][url]" id="button_url_0"
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                                                    placeholder="https://...">
                                                <button type="button" id="add-button-btn"
                                                    class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap">+
                                                    Add</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-2 flex items-center gap-2">
                                        <input type="checkbox" name="buttons[0][is_external]" id="btn_external_0"
                                            value="1"
                                            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                                        <label for="btn_external_0" class="text-xs text-indigo-500">Click check box if
                                            you want to link this to an external link</label>
                                    </div>
                                </div>
                            </div>
                            <!-- Notes -->
                            <div class="space-y-1 mt-4">
                                <p class="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    Only one Button is recommended
                                </p>
                                <p class="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    You can add 3 buttons only
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
                            <!-- Canvas Background -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Canvas Area
                                    Background</label>
                                <div class="flex items-center gap-3">
                                    <input type="color" name="bg_color" value="#ffffff"
                                        class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    <span class="text-xs text-gray-500">Outer area color</span>
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Navbar Specific Styling -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Navbar Background</label>
                                    <input type="color" name="nav_bg_color" value="#ffffff"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Link Text Color</label>
                                    <input type="color" name="link_color" value="#1a1a1a"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Link Accent/Active</label>
                                    <input type="color" name="link_bg_color" value="#6366f1"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Button Colors -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Button
                                        Background</label>
                                    <div class="flex items-center gap-3">
                                        <input type="color" name="btn_bg_color" value="#6366f1"
                                            class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Text
                                        Color</label>
                                    <div class="flex items-center gap-3">
                                        <input type="color" name="btn_text_color" value="#ffffff"
                                            class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                </div>
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
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const addLinkBtn = document.getElementById('add-link-btn');
                const linksContainer = document.getElementById('links-container');
                const aiFillBtn = document.getElementById('ai-fill-btn');

                function updateAddBtnVisibility() {
                    const currentRows = linksContainer.querySelectorAll('.link-row');
                    if (currentRows.length >= 6) {
                        addLinkBtn.style.display = 'none';
                    } else {
                        addLinkBtn.style.display = 'block';
                    }
                }

                if (addLinkBtn && linksContainer) {
                    addLinkBtn.addEventListener('click', () => {
                        const currentRows = linksContainer.querySelectorAll('.link-row');
                        if (currentRows.length >= 6) return;

                        const nextIndex = currentRows.length;
                        const div = document.createElement('div');
                        div.className = 'link-row mt-6 animate-in fade-in slide-in-from-top-1 duration-300';
                        div.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-t border-gray-100 pt-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Link${nextIndex + 1}</label>
                                <input type="text" name="links[${nextIndex}][title]" id="link_title_${nextIndex}" placeholder="Link Title" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                <div class="flex items-center gap-3">
                                    <input type="text" name="links[${nextIndex}][url]" id="link_url_${nextIndex}" placeholder="#section-id" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 transition-all">
                                    <button type="button" onclick="this.closest('.link-row').remove(); window.updateAddBtnVisibility();" class="text-xs font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">Remove</button>
                                </div>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center gap-2">
                            <input type="checkbox" name="links[${nextIndex}][is_external]" id="external_${nextIndex}" value="1"
                                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                            <label for="external_${nextIndex}" class="text-xs text-indigo-500">Click check box if
                                you want to link this to an external link</label>
                        </div>
                    `;
                        linksContainer.appendChild(div);
                        updateAddBtnVisibility();
                    });
                }

                if (aiFillBtn && linksContainer) {
                    const sections = [
                        { title: 'Home', url: '#home' },
                        { title: 'About', url: '#about' },
                        { title: 'Skills', url: '#skills' },
                        { title: 'Services', url: '#services' },
                        { title: 'Review', url: '#review' },
                        { title: 'Projects', url: '#projects' },
                        { title: 'Contact', url: '#contact' },
                    ];


                    aiFillBtn.addEventListener('click', function () {
                        const originalHtml = aiFillBtn.innerHTML;
                        const originalClasses = [...aiFillBtn.classList];

                        // Clear all but first
                        const rows = linksContainer.querySelectorAll('.link-row');
                        for (let i = 1; i < rows.length; i++) rows[i].remove();

                        sections.forEach((section, index) => {
                            if (index === 0) {
                                const firstRow = linksContainer.querySelector('.link-row');
                                const titleInput = document.getElementById('link_title_0');
                                const urlInput = document.getElementById('link_url_0');
                                if (titleInput) {
                                    titleInput.value = section.title;
                                    titleInput.style.background = '#f0fdf4';
                                    titleInput.classList.add('border-emerald-300');
                                    setTimeout(() => {
                                        titleInput.style.background = '';
                                        titleInput.classList.remove('border-emerald-300');
                                    }, 1500);
                                }
                                if (urlInput) {
                                    urlInput.value = section.url;
                                    urlInput.style.background = '#f0fdf4';
                                    urlInput.classList.add('border-emerald-300');
                                    setTimeout(() => {
                                        urlInput.style.background = '';
                                        urlInput.classList.remove('border-emerald-300');
                                    }, 1500);
                                }
                            } else if (index < 7) {
                                const div = document.createElement('div');
                                div.className = 'link-row mt-6 animate-in fade-in slide-in-from-top-1 duration-300';
                                div.innerHTML = `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-t border-gray-100 pt-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Link${index + 1}</label>
                                        <input type="text" name="links[${index}][title]" id="link_title_${index}" value="${section.title.replace(/"/g, '&quot;')}" class="w-full px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 transition-all font-bold">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                        <div class="flex items-center gap-3">
                                            <input type="text" name="links[${index}][url]" id="link_url_${index}" value="${section.url}" class="w-full px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 transition-all">
                                            <button type="button" onclick="this.closest('.link-row').remove(); window.updateAddBtnVisibility();" class="text-xs font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">Remove</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-2 flex items-center gap-2">
                                    <input type="checkbox" name="links[${index}][is_external]" id="external_${index}" value="1"
                                        class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                                    <label for="external_${index}" class="text-xs text-indigo-500">Click check box if
                                        you want to link this to an external link</label>
                                </div>
                            `;
                                linksContainer.appendChild(div);

                                // Revert colors after a delay
                                const newInputs = div.querySelectorAll('input');
                                setTimeout(() => {
                                    newInputs.forEach(input => {
                                        input.style.background = '';
                                        input.classList.remove('bg-emerald-50', 'border-emerald-300', 'font-bold');
                                        input.classList.add('bg-white', 'border-gray-300');
                                    });
                                }, 1500 + (index * 100));
                            }
                        });

                        // Button Fill Logic
                        const btnText0 = document.getElementById('button_text_0');
                        const btnUrl0 = document.getElementById('button_url_0');
                        if (btnText0 && (!btnText0.value || btnText0.value === 'New Button')) {
                            btnText0.value = 'Contact Me';
                            btnText0.style.background = '#f0fdf4';
                            btnText0.classList.add('border-emerald-300');
                            setTimeout(() => {
                                btnText0.style.background = '';
                                btnText0.classList.remove('border-emerald-300');
                            }, 1500);
                        }
                        if (btnUrl0 && (!btnUrl0.value || btnUrl0.value === '#')) {
                            btnUrl0.value = '#contact';
                            btnUrl0.style.background = '#f0fdf4';
                            btnUrl0.classList.add('border-emerald-300');
                            setTimeout(() => {
                                btnUrl0.style.background = '';
                                btnUrl0.classList.remove('border-emerald-300');
                            }, 1500);
                        }

                        // Button feedback
                        aiFillBtn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Filled!`;
                        aiFillBtn.classList.add('scale-105', 'shadow-emerald-100', 'bg-emerald-600', 'border-emerald-500');
                        aiFillBtn.classList.remove('bg-slate-900', 'border-slate-700/70', 'hover:bg-slate-700');

                        setTimeout(() => {
                            aiFillBtn.innerHTML = `<svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" /></svg> <span id="ai-btn-text">Fill with My Sections</span>`;
                            aiFillBtn.classList.remove('bg-emerald-600', 'border-emerald-500', 'scale-105', 'shadow-emerald-100');
                            aiFillBtn.classList.add('bg-slate-900', 'border-slate-700/70', 'hover:bg-slate-700');
                            const shuffleBtn = document.getElementById('ai-shuffle-btn');
                            if (shuffleBtn) {
                                shuffleBtn.classList.remove('hidden');
                                shuffleBtn.onclick = () => aiFillBtn.click();
                            }
                        }, 1000);

                        updateAddBtnVisibility();
                    });

                }

                window.updateAddBtnVisibility = updateAddBtnVisibility;

                // Buttons Logic
                const addButtonBtn = document.getElementById('add-button-btn');
                const buttonsContainer = document.getElementById('buttons-container');

                function updateAddButtonBtnVisibility() {
                    const currentRows = buttonsContainer.querySelectorAll('.button-row');
                    if (addButtonBtn) {
                        addButtonBtn.style.display = currentRows.length >= 3 ? 'none' : 'block';
                    }
                }

                if (addButtonBtn && buttonsContainer) {
                    addButtonBtn.addEventListener('click', () => {
                        const currentRows = buttonsContainer.querySelectorAll('.button-row');
                        if (currentRows.length >= 3) return;

                        const nextIndex = currentRows.length;
                        const div = document.createElement('div');
                        div.className = 'button-row mt-6 animate-in fade-in slide-in-from-top-1 duration-300';
                        div.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-t border-gray-100 pt-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nav Button Text ${nextIndex + 1}</label>
                                <input type="text" name="buttons[${nextIndex}][text]" id="button_text_${nextIndex}" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 transition-all" placeholder="e.g Contact us">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                <div class="flex items-center gap-3">
                                    <input type="text" name="buttons[${nextIndex}][url]" id="button_url_${nextIndex}" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 transition-all" placeholder="https://...">
                                    <button type="button" onclick="this.closest('.button-row').remove(); window.updateAddButtonBtnVisibility();" class="text-xs font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">Remove</button>
                                </div>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center gap-2">
                            <input type="checkbox" name="buttons[${nextIndex}][is_external]" id="btn_external_${nextIndex}" value="1" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                            <label for="btn_external_${nextIndex}" class="text-xs text-indigo-500">Click check box if you want to link this to an external link</label>
                        </div>
                    `;
                        buttonsContainer.appendChild(div);
                        updateAddButtonBtnVisibility();
                    });
                }
                window.updateAddButtonBtnVisibility = updateAddButtonBtnVisibility;
                // Exclusive Logo Logic
                const logoImg = document.getElementById('logo_image');
                const logoTxt = document.getElementById('logo_text');

                if (logoImg && logoTxt) {
                    logoImg.addEventListener('change', () => {
                        if (logoImg.value) logoTxt.value = '';
                    });
                    logoTxt.addEventListener('input', () => {
                        if (logoTxt.value) logoImg.value = '';
                    });
                }
            });
        </script>
    </div>
</x-app-layout>