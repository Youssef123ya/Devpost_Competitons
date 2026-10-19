@extends('layouts.app')

@section('content')
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-5xl">
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Projects Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Build your professional portfolio by showcasing your best work.
                </p>
                <style>
                    input[type="color"]::-webkit-color-swatch-wrapper {
                        padding: 0;
                    }

                    input[type="color"]::-webkit-color-swatch {
                        border: none;
                        border-radius: 2px;
                    }

                    input[type="color"]::-moz-color-swatch {
                        border: none;
                        border-radius: 2px;
                    }
                </style>
            </div>

            <form action="{{ route('work.store', $hero->id) }}" method="POST" class="space-y-12">
                @csrf

                <!-- Step 1: Layout Selection -->
                <section>
                    <h2 class="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                        <span
                            class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">1</span>
                        Choose Layout
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Grid Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="grid" checked class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-3">
                                    <div class="grid grid-cols-3 gap-1.5 h-full">
                                        <div
                                            class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 aspect-square w-full">
                                        </div>
                                        <div
                                            class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 aspect-square w-full">
                                        </div>
                                        <div
                                            class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 aspect-square w-full">
                                        </div>
                                        <div
                                            class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 aspect-square w-full">
                                        </div>
                                        <div
                                            class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 aspect-square w-full">
                                        </div>
                                        <div
                                            class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 aspect-square w-full">
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Grid</h3>
                                <p class="text-xs text-slate-500">Classic organized responsive grid</p>
                            </div>
                        </label>

                        <!-- Masonry Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="masonry" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-100 mb-4 relative p-3">
                                    <div class="flex gap-1.5 h-full">
                                        <div class="w-1/3 flex flex-col gap-1.5">
                                            <div
                                                class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 flex-1">
                                            </div>
                                            <div
                                                class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 h-1/3">
                                            </div>
                                        </div>
                                        <div class="w-1/3 flex flex-col gap-1.5">
                                            <div
                                                class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 h-1/2">
                                            </div>
                                            <div
                                                class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 flex-1">
                                            </div>
                                        </div>
                                        <div class="w-1/3 flex flex-col gap-1.5">
                                            <div
                                                class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 flex-1">
                                            </div>
                                            <div
                                                class="bg-white rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 h-1/4">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Masonry</h3>
                                <p class="text-xs text-slate-500">Dynamic staggered layout</p>
                            </div>
                        </label>
                    </div>
                </section>

                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <!-- Step 2: Section Content -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">2</span>
                                Section Content
                            </h2>
                            @php $portfolioType = session('portfolio_type', 'Website'); @endphp
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="fillWorkWithAI()" id="ai-fill-btn"
                                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                    <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                    </svg>
                                    <span id="ai-btn-text">AI Fill</span>
                                    <span class="text-[10px] text-slate-400">({{ ucfirst($portfolioType) }})</span>
                                </button>
                                <button type="button" onclick="fillWorkWithAI(true)" id="ai-shuffle-btn"
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

                        <div class="space-y-5">
                            <div>
                                <label for="title" class="block text-sm font-medium text-gray-700 mb-2">Section
                                    Title</label>
                                <input type="text" id="title" name="title" placeholder="e.g. My Projects"
                                    value="{{ old('title') }}"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                    required>
                            </div>

                            <div>
                                <label for="subtitle" class="block text-sm font-medium text-gray-700 mb-2">Section
                                    Subtitle</label>
                                <input type="text" id="subtitle" name="subtitle"
                                    placeholder="e.g. A showcase of my latest work"
                                    value="{{ old('subtitle') }}"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Styling Options -->
                    <div class="space-y-6">
                        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">3</span>
                            Styling Options
                        </h2>

                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-8 space-y-8 max-w-2xl shadow-sm">
                            <!-- Background Color Section -->
                            <div class="space-y-3">
                                <label class="block text-base font-medium text-slate-800">Background Color</label>
                                <div class="flex items-center gap-4">
                                    <input type="color" name="bg_color" value="#ffffff"
                                        class="w-12 h-8 bg-white border border-black/20 rounded-sm cursor-pointer p-0">
                                    <span class="text-sm text-slate-500">Main bg</span>
                                </div>
                            </div>

                            <hr class="border-gray-200">

                            <!-- Text Colors Section -->
                            <div class="space-y-5">
                                <div class="flex items-center justify-between">
                                    <label class="text-base font-medium text-slate-800">Title Color</label>
                                    <input type="color" name="title_color" value="#000000"
                                        class="w-12 h-8 bg-white border border-black/20 rounded-sm cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-base font-medium text-slate-800">Subtitle Color</label>
                                    <input type="color" name="subtitle_color" value="#334155"
                                        class="w-12 h-8 bg-white border border-black/20 rounded-sm cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-base font-medium text-slate-800">Accent Color</label>
                                    <input type="color" name="accent_line_color" value="#475569"
                                        class="w-12 h-8 bg-white border border-black/20 rounded-sm cursor-pointer p-0">
                                </div>
                            </div>

                            <hr class="border-gray-200">

                            <!-- Button Section -->
                            <div class="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div class="space-y-3">
                                    <label class="block text-base font-medium text-slate-800">Button Bg</label>
                                    <input type="color" name="btn_bg_color" value="#3b82f6"
                                        class="w-12 h-8 bg-white border border-black/20 rounded-sm cursor-pointer p-0">
                                </div>
                                <div class="space-y-3">
                                    <label class="block text-base font-medium text-slate-800">Button Text</label>
                                    <input type="color" name="btn_text_color" value="#ffffff"
                                        class="w-12 h-8 bg-white border border-black/20 rounded-sm cursor-pointer p-0">
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Step 4: Manage Projects -->
                <section>
                    <div class="flex items-center justify-between gap-4 mb-6">
                        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">4</span>
                            Manage Projects
                        </h2>
                    </div>

                    <div class="space-y-6">
                        <!-- Project Upload Form -->
                        <div class="border border-gray-200 rounded-2xl p-6 bg-gray-50">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <!-- Media Upload (Image or Video) -->
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-3">Project Media (Image or
                                        Video)</label>
                                    <div class="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition bg-slate-50/50"
                                        onclick="document.getElementById('projectMediaInput').click()">
                                        <div id="mediaPreview" class="hidden mb-3 relative group">
                                            <img id="previewImg" src="" alt="Preview"
                                                class="w-full h-40 object-cover rounded-lg shadow-md hidden">
                                            <video id="previewVideo"
                                                class="w-full h-40 object-cover rounded-lg shadow-md hidden" muted loop
                                                playsinline></video>
                                            <div
                                                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <span
                                                    class="text-white text-xs font-bold px-3 py-1 bg-black/20 backdrop-blur-md rounded-full">Change
                                                    Media</span>
                                            </div>
                                        </div>
                                        <div id="uploadPrompt" class="py-4">
                                            <div
                                                class="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
                                                <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p class="text-sm font-medium text-gray-900">Click to upload media</p>
                                            <p class="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">Image
                                                or Video (MP4)</p>
                                        </div>
                                        <input type="file" id="projectMediaInput" accept="image/*,video/mp4,video/quicktime"
                                            class="hidden" onchange="handleMediaUpload(event)">
                                    </div>
                                </div>

                                <!-- Project Title & Description -->
                                <div class="space-y-4">
                                    <div>
                                        <label for="projectTitle"
                                            class="block text-sm font-semibold text-gray-700 mb-2">Project Title</label>
                                        <input type="text" id="projectTitle" placeholder="e.g., Modern Website Design"
                                            class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                    </div>
                                    <div>
                                        <label for="projectDescription"
                                            class="block text-sm font-semibold text-gray-700 mb-2">Project
                                            Description</label>
                                        <textarea id="projectDescription" placeholder="Describe your project briefly..."
                                            rows="2"
                                            class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all resize-none"></textarea>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for="githubLink"
                                                class="block text-sm font-semibold text-gray-700 mb-2">GitHub Link</label>
                                            <input type="url" id="githubLink" placeholder="https://github.com/..."
                                                class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all text-sm">
                                        </div>
                                        <div>
                                            <label for="liveDemoLink"
                                                class="block text-sm font-semibold text-gray-700 mb-2">Live Demo
                                                Link</label>
                                            <input type="url" id="liveDemoLink" placeholder="https://example.com"
                                                class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all text-sm">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Add Project Button -->
                            <button type="button" onclick="addProjectToList()"
                                class="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99]">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Add Project to List
                            </button>
                        </div>

                        <!-- Projects List -->
                        <div class="space-y-4 pt-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-bold text-gray-900">Projects Added</h3>
                                <span class="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                                    id="projectCountDisplay">0</span>
                            </div>
                            <div id="projectsList"
                                class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <div class="md:col-span-2 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
                                    id="emptyState">
                                    <div
                                        class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
                                            </path>
                                        </svg>
                                    </div>
                                    <p class="text-gray-500 font-medium">No projects added yet</p>
                                    <p class="text-sm text-gray-400 mt-1">Use the form above to add your first project</p>
                                </div>
                            </div>

                            <!-- Hidden input to store projects JSON -->
                            <input type="hidden" id="projectsData" name="projects_data" value="[]">
                        </div>
                    </div>
                </section>

                <!-- Ultra-Premium Lightbox UI for Dash (Noir Edition) -->
                <div id="dash-lightbox"
                    class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl hidden justify-center items-center p-4 md:p-12 opacity-0 transition-opacity duration-500 ease-out cursor-zoom-out shadow-2xl"
                    onclick="closeDashLightbox()">
                    <div class="relative max-w-[95%] max-h-[90vh] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] translate-y-12 scale-90 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                        id="dash-lightbox-wrapper" onclick="event.stopPropagation()">
                        <!-- Glassmorphic Close Button -->
                        <button type="button"
                            class="absolute -top-16 right-0 md:-right-16 w-12 h-12 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all group backdrop-blur-xl border border-white/10 shadow-2xl"
                            onclick="closeDashLightbox()">
                            <svg class="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div id="dash-lightbox-media"
                            class="rounded-[2rem] overflow-hidden border border-white/5 ring-1 ring-white/10 bg-black/20">
                        </div>
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-end pt-8 border-t border-gray-100">
                    <button type="submit" style="background-color: #5c67f2;"
                        class="group relative inline-flex items-center gap-2 px-8 py-4 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(92,103,242,0.5)]">
                        <span>Create Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5 transition-transform group-hover:translate-x-1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const portfolioType = '{{ session("portfolio_type", "developer") }}';
        let projectIndex = 0;
        let projects = [];
        let currentImageUrl = '';
        let currentVideoUrl = '';
        let pastSuggestions = [];

        async function fillWorkWithAI(isRegenerate = false) {
            const shuffleBtn = document.getElementById('ai-shuffle-btn');

            if (isRegenerate) {
                pastSuggestions.push(JSON.stringify({ title: document.getElementById('title')?.value }));
            }

            // Open the AI Typing Modal immediately in loading state
            AiTypingModal.show("Generating Work copy...");

            try {
                const result = await safeAiFetch('{{ route("ai.placeholder") }}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
                    body: JSON.stringify({ section: 'work', portfolio_type: portfolioType, past_suggestions: pastSuggestions })
                });

                if (result.success && result.data) {
                    const data = result.data;

                    // Build items array for typewriter modal (title + subtitle)
                    const items = [
                        { label: 'Section Title', text: data.title, targetEl: document.getElementById('title') },
                        { label: 'Section Subtitle', text: data.subtitle, targetEl: document.getElementById('subtitle') },
                    ];

                    // Rebuild project list immediately in DOM
                    projects = [];
                    const list = document.getElementById('projectsList');
                    list.innerHTML = '';

                    (data.projects || []).forEach(item => {
                        projectIndex++;
                        const project = { id: projectIndex, image: item.image, title: item.title, description: item.description, live: item.live || '#' };
                        projects.push(project);
                        renderProjectItem(project);
                    });

                    updateProjectCount();
                    updateProjectsData();

                    // Animate project cards appearing with stagger effect
                    const cards = list.querySelectorAll('[data-project-id]');
                    cards.forEach((card, i) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(16px)';
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, i * 120);
                    });

                    // Trigger typewriter modal animation for title + subtitle
                    await AiTypingModal.typeItems(items, () => {
                        if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                    });
                } else {
                    throw new Error(result.message || 'Generation failed');
                }
            } catch (error) {
                console.error(error);
                AiTypingModal.showError(error.message);
            }
        }

        function handleMediaUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const isVideo = file.type.startsWith('video/');
            const previewContainer = document.getElementById('mediaPreview');
            const previewImg = document.getElementById('previewImg');
            const previewVideo = document.getElementById('previewVideo');
            const uploadPrompt = document.getElementById('uploadPrompt');

            // Global loader show
            const loaderId = 'media-loader';
            let loader = document.getElementById(loaderId);

            // Frontend limit check specifically for 40MB limit from Server
            const maxVideoMb = 40;
            if (isVideo && file.size > maxVideoMb * 1024 * 1024) {
                alert(`فيديو كبير جداً! أقصى مساحة مسموحة للفيديو هي ${maxVideoMb} ميجابايت.`);
                return;
            }
            if (!isVideo && file.size > 8 * 1024 * 1024) {
                alert('صورة كبيرة جداً! أقصى مساحة هي 8 ميجابايت.');
                return;
            }

            if (!loader) {
                loader = document.createElement('div');
                loader.id = loaderId;
                loader.className = 'absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20';
                loader.innerHTML = `<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div><span class="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Processing...</span>`;
                uploadPrompt.parentElement.appendChild(loader);
            }

            currentImageUrl = ''; currentVideoUrl = '';
            previewImg.classList.add('hidden'); previewVideo.classList.add('hidden');

            const reader = new FileReader();
            reader.onload = (e) => {
                if (isVideo) { previewVideo.src = e.target.result; previewVideo.classList.remove('hidden'); previewVideo.play(); }
                else { previewImg.src = e.target.result; previewImg.classList.remove('hidden'); }
                previewContainer.classList.remove('hidden');
                uploadPrompt.classList.add('hidden');
            };
            reader.readAsDataURL(file);

            const formData = new FormData();
            const route = isVideo ? '{{ route("work.uploadVideo") }}' : '{{ route("work.uploadImage") }}';
            formData.append(isVideo ? 'video' : 'image', file);
            formData.append('_token', '{{ csrf_token() }}');

            fetch(route, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            })
                .then(async res => {
                    const contentType = res.headers.get('content-type');
                    if (!res.ok || !contentType || !contentType.includes('application/json')) {
                        const text = await res.text();
                        console.error('Raw error from server:', text);
                        throw new Error('Server returned invalid data or error (check file size)');
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        if (isVideo) currentVideoUrl = data.url; else currentImageUrl = data.url;
                        console.log('Server Media URL:', data.url);
                    } else {
                        throw new Error(data.message || 'Server upload failed');
                    }
                })
                .catch(err => {
                    console.error('Upload error details:', err);
                    alert('❌ Upload failed! Please ensure your file is under 30MB and is a valid image or video. \nDetails: ' + err.message);
                    previewContainer.classList.add('hidden');
                    uploadPrompt.classList.remove('hidden');
                })
                .finally(() => {
                    const l = document.getElementById(loaderId);
                    if (l) l.remove();
                });
        }

        function addProjectToList() {
            const title = document.getElementById('projectTitle').value.trim();
            const desc = document.getElementById('projectDescription').value.trim();
            if (!title || (!currentImageUrl && !currentVideoUrl)) { alert('Media and title required!'); return; }

            projectIndex++;
            const project = { id: projectIndex, image: currentImageUrl, video: currentVideoUrl, title: title, description: desc, github: document.getElementById('githubLink').value.trim(), live: document.getElementById('liveDemoLink').value.trim() };
            projects.push(project);
            renderProjectItem(project);

            // Clear Form
            document.getElementById('projectTitle').value = '';
            document.getElementById('projectDescription').value = '';
            document.getElementById('mediaPreview').classList.add('hidden');
            document.getElementById('uploadPrompt').classList.remove('hidden');
            updateProjectCount();
            updateProjectsData();
        }

        function renderProjectItem(project) {
            const emptyState = document.getElementById('emptyState');
            if (emptyState) emptyState.remove();

            const html = `
                                                            <div class="border border-gray-100 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4 items-start" data-project-id="${project.id}">
                                                                <div class="w-16 h-16 flex-shrink-0 group relative overflow-hidden rounded-lg bg-slate-50 cursor-zoom-in shadow-inner" onclick="openDashLightbox('${project.video || project.image}', ${!!project.video})">
                                                                    ${project.video
                    ? `<video src="${project.video}" class="w-full h-full object-cover" muted loop playsinline></video>`
                    : `<img src="${project.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                }
                                                                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                                                    </div>
                                                                </div>
                                                                <div class="flex-1 min-w-0">
                                                                    <h4 class="font-bold text-gray-900 truncate text-sm mb-1">${project.title}</h4>
                                                                    <p class="text-[11px] text-gray-500 line-clamp-2 mb-2">${project.description || ''}</p>
                                                                    <button type="button" onclick="removeProject(${project.id})" class="text-[10px] text-red-500 font-bold uppercase">Remove</button>
                                                                </div>
                                                            </div>
                                                        `;
            document.getElementById('projectsList').insertAdjacentHTML('beforeend', html);
        }

        function removeProject(id) {
            projects = projects.filter(p => p.id !== id);
            document.querySelector(`[data-project-id="${id}"]`).remove();
            updateProjectCount(); updateProjectsData();
        }

        function updateProjectCount() { document.getElementById('projectCountDisplay').textContent = projects.length; }
        function updateProjectsData() { document.getElementById('projectsData').value = JSON.stringify(projects); }

        // Dash Lightbox (Noir Edition)
        function openDashLightbox(src, isVideo) {
            const lightbox = document.getElementById('dash-lightbox');
            const container = document.getElementById('dash-lightbox-media');
            const wrapper = document.getElementById('dash-lightbox-wrapper');
            container.innerHTML = `<div class="w-[80vw] h-[60vh] flex items-center justify-center bg-black/20"><div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>`;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            setTimeout(() => {
                lightbox.style.opacity = '1';
                wrapper.style.transform = 'translateY(0) scale(1)';
                container.innerHTML = isVideo
                    ? `<video src="${src}" controls autoplay loop class="max-w-full max-h-[85vh] block mx-auto"></video>`
                    : `<img src="${src}" class="max-w-full max-h-[85vh] object-contain block mx-auto animate-fade-in">`;
            }, 20);
            document.body.style.overflow = 'hidden';
        }

        function closeDashLightbox() {
            const lightbox = document.getElementById('dash-lightbox');
            const wrapper = document.getElementById('dash-lightbox-wrapper');
            lightbox.style.opacity = '0';
            wrapper.style.transform = 'translateY(40px) scale(0.95)';
            setTimeout(() => { lightbox.classList.add('hidden'); lightbox.classList.remove('flex'); }, 500);
            document.body.style.overflow = '';
        }

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDashLightbox(); });
    </script>
    <style>
        .cursor-zoom-in {
            cursor: zoom-in;
        }

        .cursor-zoom-out {
            cursor: zoom-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }
    </style>
@endsection