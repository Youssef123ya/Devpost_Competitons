<x-app-layout>
    <div class="bg-slate-50">
        <div class="container mx-auto px-4 py-12 max-w-6xl">
            <div class="mb-10 flex justify-end">
                <a href="{{ $hero->serviceSection ? route('services.generate', $hero->serviceSection->id) : route('services.create', $hero->id) }}"
                    class="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
                    Skip this section
                </a>
            </div>

            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Skills Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">Choose a layout and customize your skills to generate a
                    stunning skills section.</p>
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

            <form action="{{ route('skills.store', $hero->id) }}" method="POST" class="space-y-12" id="skillsForm"
                onsubmit="this.querySelector('button[type=submit]').disabled = true; this.querySelector('button[type=submit]').innerHTML = 'Generating...';">
                @csrf
                <!-- Layout Selection -->
                <!-- Layout Selection -->
                <!-- Layout Selection -->
                <section>
                    <h2 class="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                        <span
                            class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 text-sm">1</span>
                        Choose Layout
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Layout 1: Grid -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="grid-layout" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 grid grid-cols-2 gap-2 border border-slate-100 p-2"
                                    style="background-color: #f1f5f9;">
                                    <!-- Card 1 -->
                                    <div
                                        class="bg-white rounded-lg border border-slate-200/50 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                        <div
                                            class="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] mb-1">
                                            <i class="fa-solid fa-star"></i>
                                        </div>
                                        <div class="space-y-0.5 w-full">
                                            <div class="h-1 w-2/3 bg-slate-400 rounded-full mx-auto"></div>
                                            <div class="h-0.5 w-5/6 bg-slate-200 rounded-full mx-auto"></div>
                                        </div>
                                    </div>
                                    <!-- Card 2 -->
                                    <div
                                        class="bg-white rounded-lg border border-slate-200/50 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                        <div
                                            class="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] mb-1">
                                            <i class="fa-solid fa-shield-halved"></i>
                                        </div>
                                        <div class="space-y-0.5 w-full">
                                            <div class="h-1 w-2/3 bg-slate-400 rounded-full mx-auto"></div>
                                            <div class="h-0.5 w-5/6 bg-slate-200 rounded-full mx-auto"></div>
                                        </div>
                                    </div>
                                    <!-- Card 3 -->
                                    <div
                                        class="bg-white rounded-lg border border-slate-200/50 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                        <div
                                            class="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] mb-1">
                                            <i class="fa-solid fa-bolt"></i>
                                        </div>
                                        <div class="space-y-0.5 w-full">
                                            <div class="h-1 w-2/3 bg-slate-400 rounded-full mx-auto"></div>
                                            <div class="h-0.5 w-5/6 bg-slate-200 rounded-full mx-auto"></div>
                                        </div>
                                    </div>
                                    <!-- Card 4 -->
                                    <div
                                        class="bg-white rounded-lg border border-slate-200/50 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                        <div
                                            class="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] mb-1">
                                            <i class="fa-solid fa-chart-line"></i>
                                        </div>
                                        <div class="space-y-0.5 w-full">
                                            <div class="h-1 w-2/3 bg-slate-400 rounded-full mx-auto"></div>
                                            <div class="h-0.5 w-5/6 bg-slate-200 rounded-full mx-auto"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Grid Layout</h3>
                                <p class="text-sm text-gray-500">Skills displayed in equal cards</p>
                            </div>
                        </label>

                        <!-- Layout 2: Icon + Text Layout -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="icon-text-layout" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 flex flex-col justify-center px-4 gap-3 border border-slate-100"
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
                                <h3 class="font-semibold text-gray-900 mb-1">Icon + Text</h3>
                                <p class="text-sm text-gray-500">Skill with icon and short description</p>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    <!-- 2. Skills content -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold shadow-sm">2</span>
                                Skills content
                            </h2>
                            @php $portfolioType = session('portfolio_type', 'Website'); @endphp
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="fillSkillsWithAI()" id="ai-fill-btn"
                                    class="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                    </svg>
                                    AI Fill
                                    <span class="text-[10px] text-slate-400">({{ ucfirst($portfolioType) }})</span>
                                </button>
                                <button type="button" onclick="fillSkillsWithAI(true)" id="ai-shuffle-btn"
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
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Section Title <span
                                            class="text-red-500">*</span></label>
                                    <input type="text" name="section_title" placeholder="e.g. My Skills"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                        value="{{ old('section_title', $hero->skillSection->section_title ?? '') }}"
                                        required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Section Subtitle</label>
                                    <input type="text" name="section_subtitle" placeholder="e.g. Technologies I use"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                        value="{{ old('section_subtitle', $hero->skillSection->section_subtitle ?? '') }}">
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div id="skills-container" class="space-y-6">
                                    @php
                                        $existingSkills = old('skills', $hero->skillSection->skills_data ?? [['name' => '', 'icon' => 'fa-solid fa-star', 'description' => '']]);
                                    @endphp

                                    @foreach($existingSkills as $index => $skill)
                                        <div
                                            class="skill-row bg-gray-50 p-4 rounded-xl border border-gray-200 relative group transition-all mb-4">
                                            @if($index > 0)
                                                <button type="button"
                                                    class="remove-skill-btn absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                                        fill="currentColor">
                                                        <path fill-rule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clip-rule="evenodd" />
                                                    </svg>
                                                </button>
                                            @endif

                                            <div class="space-y-4 mt-2">
                                                <div>
                                                    <label class="block text-xs text-gray-500 mb-1">Skill Name</label>
                                                    <input type="text" name="skills[{{ $index }}][name]"
                                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all"
                                                        placeholder="e.g. UI/UX Design" value="{{ $skill['name'] }}">
                                                </div>

                                                <div>
                                                    <label class="block text-xs text-gray-500 mb-1">Icon <span
                                                            class="text-gray-400">(optional)</span></label>
                                                    <div class="relative w-1/2">
                                                        <input type="hidden" name="skills[{{ $index }}][icon]"
                                                            class="icon-input-field"
                                                            value="{{ $skill['icon'] ?? 'fa-solid fa-star' }}">
                                                        <button type="button" onclick="openIconPicker(this)"
                                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                                            <i
                                                                class="{{ $skill['icon'] ?? 'fa-solid fa-star' }} text-xl text-indigo-500{{ empty($skill['icon']) ? ' hidden' : '' }}"></i>
                                                            <span class="icon-name text-xs text-gray-500">
                                                                {{ !empty($skill['icon']) ? str_replace(['fa-solid fa-', 'fa-brands fa-', 'fa-regular fa-'], '', $skill['icon']) : 'None' }}
                                                            </span>
                                                        </button>
                                                        <button type="button" onclick="clearSkillIcon(this)"
                                                            title="Remove icon"
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
                                                    <textarea name="skills[{{ $index }}][description]" rows="3"
                                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all resize-none"
                                                        placeholder="Describe this skill briefly...">{{ $skill['description'] ?? '' }}</textarea>
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>

                                <button type="button" id="add-skill-btn"
                                    class="text-sm text-indigo-500 font-medium hover:text-indigo-600 flex items-center gap-1 mt-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Another Skill
                                </button>

                                <div class="space-y-1 mt-4">
                                    <p class="text-xs text-gray-500 px-1">
                                        You can add up to 8 skills
                                    </p>
                                </div>
                            </div>
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
                                    <input type="color" name="card_bg_color" value="#f8fafc"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Text & Icon Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Text Color</label>
                                    <input type="color" name="skill_text_color" value="#0f172a"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Progress Bar / Accent Color</label>
                                    <input type="color" name="progress_bg_color" value="#8b5cf6"
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
                                <input type="number" name="border_radius" value="10" min="0" max="40"
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
        // ── Portfolio AI Skills Data ──────────────────────────────────
        const portfolioType = '{{ session("portfolio_type", "") }}';
        let currentVariantIndexes = {};

        const aiSkillsContent = {
            developer: [
                {
                    title: 'My Tech Stack', subtitle: 'Tools & technologies I work with every day',
                    skills: [
                        { name: 'HTML & CSS', icon: 'fa-solid fa-code', description: 'Crafting semantic, accessible, and responsive web interfaces with pixel-perfect precision.' },
                        { name: 'JavaScript', icon: 'fa-brands fa-js', description: 'Building interactive and dynamic user experiences with modern ES6+ features.' },
                        { name: 'React / Vue', icon: 'fa-brands fa-react', description: 'Developing scalable single-page applications with component-based frameworks.' },
                        { name: 'Node.js', icon: 'fa-brands fa-node-js', description: 'Creating fast, scalable server-side applications and REST APIs.' },
                        { name: 'Database Design', icon: 'fa-solid fa-database', description: 'Structuring efficient relational and NoSQL databases for optimal performance.' },
                        { name: 'Git & DevOps', icon: 'fa-brands fa-git-alt', description: 'Version control, CI/CD pipelines, and cloud deployment workflows.' },
                    ]
                },
                {
                    title: 'Core Competencies', subtitle: 'Languages and frameworks I specialize in',
                    skills: [
                        { name: 'Frontend Architecture', icon: 'fa-solid fa-layer-group', description: 'Designing scalable and maintainable client-side applications.' },
                        { name: 'TypeScript', icon: 'fa-solid fa-file-code', description: 'Writing strongly typed, reliable code that minimizes runtime errors.' },
                        { name: 'Backend Systems', icon: 'fa-solid fa-server', description: 'Building robust microservices and server logic with clean architecture.' },
                        { name: 'Cloud Infrastructure', icon: 'fa-solid fa-cloud', description: 'Deploying and managing applications on AWS, Azure, and Vercel.' },
                        { name: 'API Integration', icon: 'fa-solid fa-plug', description: 'Seamlessly integrating third-party services and payment gateways.' },
                        { name: 'Performance Tuning', icon: 'fa-solid fa-gauge-high', description: 'Optimizing web vitals and minimizing load times for better UX.' },
                    ]
                }
            ],
            designer: [
                {
                    title: 'My Design Skills', subtitle: 'The tools & methods behind every great design',
                    skills: [
                        { name: 'UI Design', icon: 'fa-solid fa-pen-ruler', description: 'Creating beautiful, intuitive user interfaces with strong visual hierarchy and balance.' },
                        { name: 'UX Research', icon: 'fa-solid fa-magnifying-glass', description: 'Understanding user needs through interviews, testing, and data-driven insights.' },
                        { name: 'Figma', icon: 'fa-solid fa-vector-square', description: 'Designing and prototyping complete design systems and interactive mockups.' },
                        { name: 'Brand Identity', icon: 'fa-solid fa-star', description: 'Building cohesive brand identities: logos, color palettes, typography, and guidelines.' },
                        { name: 'Motion Design', icon: 'fa-solid fa-film', description: 'Adding life to interfaces with purposeful micro-animations and transitions.' },
                        { name: 'Illustration', icon: 'fa-solid fa-paintbrush', description: 'Custom digital illustrations that bring personality to products and brands.' },
                    ]
                },
                {
                    title: 'Creative Toolkit', subtitle: 'Software and processes I use to shape experiences',
                    skills: [
                        { name: 'Wireframing', icon: 'fa-solid fa-object-group', description: 'Translating concepts into structural flows and low-fidelity screens.' },
                        { name: 'Prototyping', icon: 'fa-solid fa-mobile-screen', description: 'Building interactive prototypes to validate ideas before development begins.' },
                        { name: 'Design Systems', icon: 'fa-solid fa-cubes', description: 'Creating and maintaining reusable UI libraries for design consistency.' },
                        { name: 'Typography', icon: 'fa-solid fa-font', description: 'Expertise in pairing fonts and creating readable, aesthetically pleasing layouts.' },
                        { name: 'Adobe Creative Suite', icon: 'fa-solid fa-palette', description: 'Advanced proficiency in Photoshop, Illustrator, and InDesign for visual assets.' },
                        { name: 'Usability Testing', icon: 'fa-solid fa-flask', description: 'Conducting sessions to gather feedback and iterate on product designs.' },
                    ]
                }
            ],
            photographer: [
                {
                    title: 'My Expertise', subtitle: 'Specialities that define my photographic style',
                    skills: [
                        { name: 'Portrait Photography', icon: 'fa-solid fa-user', description: 'Capturing authentic personalities and emotions through compelling portraiture.' },
                        { name: 'Commercial Shoots', icon: 'fa-solid fa-briefcase', description: 'High-quality product and brand photography for marketing and advertising.' },
                        { name: 'Photo Editing', icon: 'fa-solid fa-sliders', description: 'Professional retouching and color grading using Lightroom and Photoshop.' },
                        { name: 'Event Coverage', icon: 'fa-solid fa-calendar-days', description: 'Documenting weddings, corporate events, and special occasions with a storytelling eye.' },
                        { name: 'Studio Lighting', icon: 'fa-solid fa-lightbulb', description: 'Mastery of natural and artificial lighting setups for any mood or environment.' },
                        { name: 'Landscape & Travel', icon: 'fa-solid fa-mountain-sun', description: 'Exploring and capturing the beauty of the world through landscape photography.' },
                    ]
                },
                {
                    title: 'Photography Arsenal', subtitle: 'Skills that ensure every shot is perfect',
                    skills: [
                        { name: 'Creative Direction', icon: 'fa-solid fa-compass', description: 'Conceptualizing shoots and directing talent to bring a unified vision to life.' },
                        { name: 'Fashion & Beauty', icon: 'fa-solid fa-gem', description: 'Specialized techniques for highlighting apparel, makeup, and editorial styling.' },
                        { name: 'Color Grading', icon: 'fa-solid fa-fill-drip', description: 'Creating distinct visual moods by manipulating colors in post-production.' },
                        { name: 'Product Styling', icon: 'fa-solid fa-box-open', description: 'Arranging props and lighting to make e-commerce products stand out.' },
                        { name: 'Action & Sports', icon: 'fa-solid fa-person-running', description: 'Freezing fast-paced motion perfectly with high-speed shutter techniques.' },
                        { name: 'Aerial Photography', icon: 'fa-solid fa-helicopter', description: 'Capturing unique vantage points from above using professional drones.' },
                    ]
                }
            ],
            videographer: [
                {
                    title: 'My Production Skills', subtitle: 'From pre-production to final delivery',
                    skills: [
                        { name: 'Cinematography', icon: 'fa-solid fa-video', description: 'Composing visually stunning shots with expert camera moves and lighting.' },
                        { name: 'Video Editing', icon: 'fa-solid fa-film', description: 'Cutting compelling narratives together in Premiere Pro and DaVinci Resolve.' },
                        { name: 'Color Grading', icon: 'fa-solid fa-palette', description: 'Crafting distinctive visual moods with professional color science techniques.' },
                        { name: 'Motion Graphics', icon: 'fa-solid fa-wand-magic-sparkles', description: 'Designing animated titles, lower thirds, and visual effects in After Effects.' },
                        { name: 'Drone Filming', icon: 'fa-solid fa-helicopter', description: 'Capturing breathtaking aerial footage with licensed drone operation.' },
                        { name: 'Sound Design', icon: 'fa-solid fa-music', description: 'Mixing and mastering audio tracks to create immersive sound experiences.' },
                    ]
                },
                {
                    title: 'Filmmaking Abilities', subtitle: 'Technical skills applied to storytelling',
                    skills: [
                        { name: 'Storyboarding', icon: 'fa-solid fa-clipboard-list', description: 'Planning sequences shot-by-shot before the cameras even start rolling.' },
                        { name: 'Directing', icon: 'fa-solid fa-bullseye', description: 'Guiding talent and crew to ensure the emotional core of the scene lands perfectly.' },
                        { name: 'Audio Mixing', icon: 'fa-solid fa-headphones', description: 'Cleaning dialogue and balancing multi-track audio for broadcast-ready sound.' },
                        { name: 'Animation', icon: 'fa-solid fa-shapes', description: 'Integrating 2D kinematics and 3D elements into live-action footage.' },
                        { name: 'Live Broadcasting', icon: 'fa-solid fa-tower-broadcast', description: 'Managing multi-cam live streams for corporate events and performances.' },
                        { name: 'Format Optimization', icon: 'fa-solid fa-mobile-button', description: 'Encoding and delivering assets specifically tailored for various social media platforms.' },
                    ]
                }
            ],
            writer: [
                {
                    title: 'My Writing Skills', subtitle: 'Crafting words that resonate and convert',
                    skills: [
                        { name: 'Copywriting', icon: 'fa-solid fa-feather-pointed', description: 'Writing persuasive copy that drives action: ads, landing pages, and sales emails.' },
                        { name: 'Content Strategy', icon: 'fa-solid fa-chart-line', description: 'Planning content that builds authority, grows traffic, and nurtures audiences.' },
                        { name: 'SEO Writing', icon: 'fa-solid fa-magnifying-glass', description: 'Optimizing content to rank on search engines while remaining reader-friendly.' },
                        { name: 'Storytelling', icon: 'fa-solid fa-book-open', description: 'Weaving compelling narratives that captivate readers and build emotional connection.' },
                        { name: 'Brand Voice', icon: 'fa-solid fa-bullhorn', description: 'Developing consistent, distinctive brand voices across all communication channels.' },
                        { name: 'Editing & Proofreading', icon: 'fa-solid fa-spell-check', description: 'Refining content for clarity, cohesion, grammar, and style.' },
                    ]
                },
                {
                    title: 'Content Expertise', subtitle: 'Formats and disciplines I excel in',
                    skills: [
                        { name: 'Technical Writing', icon: 'fa-solid fa-laptop-code', description: 'Translating complex tech concepts into clear manuals and documentation.' },
                        { name: 'UX Writing', icon: 'fa-solid fa-comment-dots', description: 'Crafting microcopy that guides users seamlessly through digital products.' },
                        { name: 'Blogging', icon: 'fa-solid fa-blog', description: 'Writing deeply researched, long-form articles that establish thought leadership.' },
                        { name: 'Scriptwriting', icon: 'fa-solid fa-video', description: 'Creating engaging scripts for YouTube channels, podcasts, and corporate videos.' },
                        { name: 'Email Sequences', icon: 'fa-solid fa-envelope-open-text', description: 'Designing nurture flows that increase open rates and drive sales.' },
                        { name: 'Ghostwriting', icon: 'fa-solid fa-user-secret', description: 'Adopting the voice of executives and founders to write books or op-eds.' },
                    ]
                }
            ],
            marketer: [
                {
                    title: 'My Marketing Skills', subtitle: 'Strategies that turn attention into growth',
                    skills: [
                        { name: 'Social Media Marketing', icon: 'fa-solid fa-hashtag', description: 'Growing engaged communities and driving brand awareness on key platforms.' },
                        { name: 'Paid Advertising', icon: 'fa-solid fa-bullseye', description: 'Running profitable campaigns on Google Ads, Meta, and LinkedIn with precision targeting.' },
                        { name: 'Email Marketing', icon: 'fa-solid fa-envelope', description: 'Designing email sequences that nurture leads and convert subscribers.' },
                        { name: 'SEO & Analytics', icon: 'fa-solid fa-chart-bar', description: 'Driving organic traffic and measuring performance with data-driven insights.' },
                        { name: 'Content Marketing', icon: 'fa-solid fa-newspaper', description: 'Creating valuable content that attracts, educates, and converts target audiences.' },
                        { name: 'Growth Hacking', icon: 'fa-solid fa-rocket', description: 'Rapid experimentation and creative strategies to accelerate user acquisition and retention.' },
                    ]
                },
                {
                    title: 'Digital Proficiencies', subtitle: 'Tools of the trade for modern growth',
                    skills: [
                        { name: 'Data Analysis', icon: 'fa-solid fa-magnifying-glass-chart', description: 'Parsing complex data sets in GA4 to find actionable business insights.' },
                        { name: 'CRO', icon: 'fa-solid fa-arrow-trend-up', description: 'A/B testing and optimizing landing pages to maximize Conversion Rate Optimization.' },
                        { name: 'Influencer Marketing', icon: 'fa-solid fa-users', description: 'Identifying and negotiating with creators to scale brand reach organically.' },
                        { name: 'Marketing Automation', icon: 'fa-solid fa-robot', description: 'Setting up Hubspot or Klaviyo workflows to nurture leads automatically.' },
                        { name: 'Copywriting', icon: 'fa-solid fa-pen-nib', description: 'Drafting ad copy and headlines that capture attention and force clicks.' },
                        { name: 'Community Building', icon: 'fa-solid fa-comments', description: 'Fostering active engagement in Facebook Groups and Discord servers.' },
                    ]
                }
            ],
            architect: [
                {
                    title: 'My Design Expertise', subtitle: 'Where creativity meets technical precision',
                    skills: [
                        { name: 'Architectural Design', icon: 'fa-solid fa-building-columns', description: 'Designing innovative structures that balance aesthetic beauty with functional needs.' },
                        { name: 'Interior Design', icon: 'fa-solid fa-couch', description: 'Creating harmonious interiors that reflect the client\'s personality and lifestyle.' },
                        { name: '3D Modeling & BIM', icon: 'fa-solid fa-cube', description: 'Building precise 3D models and BIM workflows using Revit, SketchUp, and Rhino.' },
                        { name: 'Urban Planning', icon: 'fa-solid fa-city', description: 'Designing sustainable, human-centered urban spaces and community environments.' },
                        { name: 'Technical Documentation', icon: 'fa-solid fa-drafting-compass', description: 'Product detailed construction drawings and specifications meeting all standards.' },
                        { name: 'Sustainable Design', icon: 'fa-solid fa-leaf', description: 'Integrating eco-friendly principles and green technologies into every project.' },
                    ]
                },
                {
                    title: 'Architectural Abilities', subtitle: 'From initial sketch to final construction',
                    skills: [
                        { name: 'Concept Development', icon: 'fa-solid fa-lightbulb', description: 'Transforming abstract ideas and client briefs into viable architectural concepts.' },
                        { name: 'Parametric Design', icon: 'fa-solid fa-network-wired', description: 'Using Grasshopper to generate complex, data-driven geometric structures.' },
                        { name: 'Material Selection', icon: 'fa-solid fa-layer-group', description: 'Curating palettes of textures and finishes that elevate the spatial experience.' },
                        { name: 'Project Management', icon: 'fa-solid fa-list-check', description: 'Coordinating with engineers, contractors, and city officials to deliver on time.' },
                        { name: 'Landscape Architecture', icon: 'fa-solid fa-tree', description: 'Integrating natural elements and outdoor spaces seamlessly with built forms.' },
                        { name: 'Restoration', icon: 'fa-solid fa-hammer', description: 'Sensitively updating and preserving historic structures for modern usage.' },
                    ]
                }
            ],
        };

        function fillSkillsWithAI(shuffle = false) {
            const type = portfolioType.toLowerCase();
            const list = aiSkillsContent[type] || aiSkillsContent['developer'];

            // Pool all arrays
            const titles = list.map(item => item.title);
            const subtitles = list.map(item => item.subtitle);
            const allSkills = list.flatMap(item => item.skills);

            const getRandom = (arr, num) => {
                const shuffled = [...arr].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, Math.min(num, shuffled.length));
            };

            const data = {
                title: getRandom(titles, 1)[0],
                subtitle: getRandom(subtitles, 1)[0],
                skills: getRandom(allSkills, 6)
            };

            // Fill title & subtitle
            const titleInput = document.querySelector('input[name="section_title"]');
            const subtitleInput = document.querySelector('input[name="section_subtitle"]');
            if (titleInput) { titleInput.style.background = '#f0fdf4'; titleInput.value = data.title; setTimeout(() => titleInput.style.background = '', 800); }
            if (subtitleInput) { subtitleInput.style.background = '#f0fdf4'; subtitleInput.value = data.subtitle; setTimeout(() => subtitleInput.style.background = '', 800); }

            // Clear existing skills and rebuild
            const container = document.getElementById('skills-container');
            if (!container) return;

            container.innerHTML = '';
            data.skills.forEach((skill, i) => {
                const html = `
                    <div class="skill-row bg-gray-50 p-4 rounded-xl border border-gray-200 relative group transition-all mb-4">
                        ${i > 0 ? `
                        <button type="button" class="remove-skill-btn absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>` : ''}

                        <div class="space-y-4 mt-2">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Skill Name</label>
                                <input type="text" name="skills[${i}][name]" value="${skill.name}"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="e.g. UI/UX Design">
                            </div>

                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Icon <span class="text-gray-400">(optional)</span></label>
                                <div class="relative w-1/2">
                                    <input type="hidden" name="skills[${i}][icon]" class="icon-input-field" value="${skill.icon || ''}">
                                    <button type="button" onclick="openIconPicker(this)"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                        <i class="${skill.icon || ''} text-xl text-indigo-500${!skill.icon ? ' hidden' : ''}"></i>
                                        <span class="icon-name text-xs text-gray-500">
                                            ${skill.icon ? skill.icon.replace(/fa-solid fa-|fa-brands fa-|fa-regular fa-/, '') : 'None'}
                                        </span>
                                    </button>
                                    <button type="button" onclick="clearSkillIcon(this)" title="Remove icon" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Description</label>
                                <textarea name="skills[${i}][description]" rows="3"
                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all resize-none"
                                    placeholder="Describe this skill briefly...">${skill.description}</textarea>
                            </div>
                        </div>
                    </div>`;
                container.insertAdjacentHTML('beforeend', html);

                const row = container.lastElementChild;
                const removeBtn = row.querySelector('.remove-skill-btn');
                if (removeBtn) removeBtn.addEventListener('click', () => { row.remove(); updateSkillNumbers(); });

                setTimeout(() => {
                    row.querySelectorAll('input, textarea').forEach(el => {
                        el.style.background = '';
                        el.classList.remove('border-emerald-300');
                        if (!el.classList.contains('icon-input-field')) el.classList.add('border-slate-200');
                    });
                }, 1200 + i * 100);
            });

            // Button feedback
            const btn = document.getElementById('ai-fill-btn');
            const shuffleBtn = document.getElementById('ai-shuffle-btn');

            if (btn) {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Filled!`;
                btn.classList.add('scale-105', 'shadow-emerald-100');
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('scale-105', 'shadow-emerald-100');
                    if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                }, 1000);
            }
        }

        let currentIconInputGroup = null;

        function openIconPicker(btn) {
            currentIconInputGroup = btn.closest('.relative');
            const modal = document.getElementById('iconPickerModal');
            const grid = document.getElementById('iconGrid');

            if (grid.children.length === 0) renderIcons(fontAwesomeIcons);
            modal.classList.remove('hidden');
            document.getElementById('iconSearch').value = '';
            document.getElementById('iconSearch').focus();
        }

        function closeIconPicker() {
            document.getElementById('iconPickerModal').classList.add('hidden');
            currentIconInputGroup = null;
        }

        function selectIcon(iconClass) {
            if (currentIconInputGroup) {
                const input = currentIconInputGroup.querySelector('input[type="hidden"]');
                const iTag = currentIconInputGroup.querySelector('i');
                const nameTag = currentIconInputGroup.querySelector('.icon-name');
                if (input) input.value = iconClass;
                if (iTag) {
                    iTag.className = iconClass + ' text-xl text-indigo-500';
                    iTag.classList.remove('hidden');
                }
                if (nameTag) nameTag.textContent = iconClass.replace(/fa-solid fa-|fa-brands fa-|fa-regular fa-/, '');
            }
            closeIconPicker();
        }

        function clearSkillIcon(btn) {
            const group = btn.closest('.relative');
            const input = group.querySelector('input[type="hidden"]');
            const iTag = group.querySelector('i');
            const nameTag = group.querySelector('.icon-name');
            if (input) input.value = '';
            if (iTag) iTag.className = 'hidden';
            if (nameTag) nameTag.textContent = 'None';
        }

        function renderIcons(icons) {
            const grid = document.getElementById('iconGrid');
            grid.innerHTML = icons.map(icon => `
                <button type="button" onclick="selectIcon('${icon.class}')" class="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                    <i class="${icon.class} text-xl text-slate-400 group-hover:text-indigo-600"></i>
                    <span class="text-[9px] font-bold text-slate-400 group-hover:text-indigo-500 uppercase tracking-tighter">${icon.name}</span>
                </button>
            `).join('');
        }

        document.getElementById('iconSearch').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = fontAwesomeIcons.filter(icon => icon.name.toLowerCase().includes(term) || icon.class.includes(term));
            renderIcons(filtered);
        });

        function updateSkillNumbers() {
            const rows = document.querySelectorAll('.skill-row');
            rows.forEach((row, i) => {

                // Update input names for proper array indices
                row.querySelectorAll('input, textarea').forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) input.setAttribute('name', name.replace(/skills\[\d+\]/, `skills[${i}]`));
                });
            });
        }

        document.addEventListener('DOMContentLoaded', function () {
            const addSkillBtn = document.getElementById('add-skill-btn');
            const skillsContainer = document.getElementById('skills-container');

            if (addSkillBtn && skillsContainer) {
                addSkillBtn.addEventListener('click', () => {
                    const i = skillsContainer.querySelectorAll('.skill-row').length;
                    if (i >= 8) return;

                    const html = `
                        <div class="skill-row bg-gray-50 p-4 rounded-xl border border-gray-200 relative group transition-all mb-4">
                            <button type="button" class="remove-skill-btn absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>

                            <div class="space-y-4 mt-2">
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Skill Name</label>
                                    <input type="text" name="skills[${i}][name]" placeholder="e.g. Figma"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all">
                                </div>

                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Icon <span class="text-gray-400">(optional)</span></label>
                                    <div class="relative w-1/2">
                                        <input type="hidden" name="skills[${i}][icon]" class="icon-input-field" value="fa-solid fa-star">
                                        <button type="button" onclick="openIconPicker(this)"
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                            <i class="fa-solid fa-star text-xl text-indigo-500"></i>
                                            <span class="icon-name text-xs text-gray-500">star</span>
                                        </button>
                                        <button type="button" onclick="clearSkillIcon(this)" title="Remove icon" class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Description</label>
                                    <textarea name="skills[${i}][description]" rows="3" placeholder="Describe this skill briefly..."
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all resize-none"></textarea>
                                </div>
                            </div>
                        </div>`;
                    skillsContainer.insertAdjacentHTML('beforeend', html);

                    const newRow = skillsContainer.lastElementChild;
                    newRow.querySelector('.remove-skill-btn').addEventListener('click', () => {
                        newRow.remove();
                        updateSkillNumbers();
                        addSkillBtn.style.display = 'flex';
                    });

                    updateSkillNumbers();
                    if (skillsContainer.querySelectorAll('.skill-row').length >= 8) addSkillBtn.style.display = 'none';
                });

                // Attach removal for existing items
                document.querySelectorAll('.remove-skill-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        btn.closest('.skill-row').remove();
                        updateSkillNumbers();
                        addSkillBtn.style.display = 'flex';
                    });
                });
            }
        });
    </script>
</x-app-layout>