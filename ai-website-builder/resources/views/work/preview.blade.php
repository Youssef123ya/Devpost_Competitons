<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Work Preview Editor</title>
    @vite('resources/css/app.css')
    @vite('resources/js/app.js')
    <script src="/js/tailwind.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .control-input {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            width: 100%;
            transition: all 0.2s;
        }

        .control-input:focus {
            border-color: #6366f1;
            outline: none;
            ring: 1px solid #6366f1;
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }

        #preview-container {
            transform-origin: top center;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .device-btn.active {
            background-color: #6366f1;
            color: white;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
    </style>
</head>

<body class="bg-white overflow-hidden">
    <div class="flex h-screen">
        <!-- Sidebar Controls -->
        <aside class="w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar z-20">
            <div class="p-6 border-b border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 text-indigo-500">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m-4.5 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m-9.75 0h9.75" />
                    </svg>
                    Editor Controls
                </h2>
            </div>

            <div class="flex-1 p-6 space-y-8">
                <!-- 1. SECTION HEADER -->
                <div class="space-y-4">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SECTION HEADER</h3>
                    <div class="space-y-3">
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Title</label>
                            <input type="text" id="sectionTitleInput" value="{{ $work->title }}" class="control-input">
                        </div>
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Subtitle</label>
                            <input type="text" id="sectionSubtitleInput" value="{{ $work->subtitle }}"
                                class="control-input">
                        </div>
                    </div>
                </div>

                <!-- 2. PROJECT ITEMS -->
                <div class="space-y-4 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PROJECT ITEMS</h3>
                    <div id="projects-editor" class="space-y-4">
                        @foreach(($work->items_data ?? []) as $index => $item)
                            <div class="project-item-wrapper p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group/item"
                                data-index="{{ $index }}">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project
                                        #{{ $index + 1 }}</span>
                                    <button type="button" onclick="removeProject({{ $index }})"
                                        class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100">
                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                                <div class="space-y-3">
                                    <div class="flex gap-2">
                                        <div class="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden flex-shrink-0 relative group/img cursor-pointer"
                                            onclick="changeProjectImage(this)">
                                            <img src="{{ $item['image'] ?? '' }}"
                                                class="w-full h-full object-cover project-img-preview {{ !empty($item['video']) ? 'hidden' : '' }}">
                                            <video src="{{ $item['video'] ?? '' }}"
                                                class="w-full h-full object-cover project-video-preview {{ empty($item['video']) ? 'hidden' : '' }}"
                                                muted loop autoplay playsinline></video>

                                            <div id="upload-overlay-{{ $index }}"
                                                class="absolute inset-0 bg-white/80 backdrop-blur-sm hidden flex-col items-center justify-center z-10">
                                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600">
                                                </div>
                                            </div>

                                            <div
                                                class="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                                <i class="fa-solid fa-camera text-[10px]"></i>
                                            </div>
                                            <input type="hidden" class="project-image-input"
                                                value="{{ $item['image'] ?? '' }}">
                                            <input type="hidden" class="project-video-input"
                                                value="{{ $item['video'] ?? '' }}">
                                        </div>
                                        <div class="flex-1 space-y-1">
                                            <input type="text" value="{{ $item['title'] ?? '' }}"
                                                class="project-title-input control-input text-[11px] p-1.5 h-auto font-bold"
                                                placeholder="Project Title">
                                            <input type="text" value="{{ $item['live'] ?? '' }}"
                                                class="project-live-input control-input text-[9px] p-1.2 h-auto text-indigo-500"
                                                placeholder="Live Demo URL (optional)">
                                            <input type="text" value="{{ $item['github'] ?? '' }}"
                                                class="project-github-input control-input text-[9px] p-1.2 h-auto text-slate-400"
                                                placeholder="GitHub URL (optional)">
                                        </div>
                                    </div>
                                    <div>
                                        <textarea
                                            class="project-desc-input control-input text-[10px] min-h-[50px] p-2 leading-tight"
                                            placeholder="Description...">{{ $item['description'] ?? '' }}</textarea>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>

                    <button type="button" onclick="addProject()"
                        class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                        <i class="fa-solid fa-plus text-xs"></i>
                        Add New Project
                    </button>
                </div>

                <!-- 3. AESTHETICS -->
                <div class="space-y-6 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">AESTHETICS</h3>
                    @php $styles = $work->custom_styles ?? []; @endphp
                    <div class="grid grid-cols-2 gap-3 mb-2">
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Main BG</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="bgColorPicker" value="{{ $styles['bg_color'] ?? '#ffffff' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Card BG</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="cardBgPicker" value="{{ $styles['card_bg'] ?? '#fefefe' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Accent</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="accentLinePicker"
                                    value="{{ $styles['accent_line_color'] ?? '#4f46e5' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Live Btn BG</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="btnBgPicker" value="{{ $styles['btn_bg_color'] ?? '#4f46e5' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Title Color</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="titleColorPicker"
                                    value="{{ $styles['title_color'] ?? '#111827' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Sub Color</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="subtitleColorPicker"
                                    value="{{ $styles['subtitle_color'] ?? '#6b7280' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Live Btn Text</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="btnTextColorPicker"
                                    value="{{ $styles['btn_text_color'] ?? '#ffffff' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Git Btn BG</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="githubBtnBgPicker"
                                    value="{{ $styles['github_btn_bg'] ?? '#1e293b' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Git Btn Text</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="githubBtnTextColorPicker"
                                    value="{{ $styles['github_btn_text'] ?? '#ffffff' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. SLIDERS & SIZING -->
                <div class="space-y-6 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SLIDERS & SIZING</h3>
                    <div class="space-y-5">
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <label class="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Project
                                    Gap</label>
                                <span class="text-[11px] font-bold text-indigo-500"
                                    id="gapValue">{{ $styles['gap'] ?? 32 }}px</span>
                            </div>
                            <input type="range" id="gapSlider" min="16" max="64" value="{{ $styles['gap'] ?? 32 }}"
                                class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <label class="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Border
                                    Radius</label>
                                <span class="text-[11px] font-bold text-indigo-500"
                                    id="borderRadiusValue">{{ $styles['border_radius'] ?? 16 }}px</span>
                            </div>
                            <input type="range" id="borderRadiusSlider" min="0" max="48"
                                value="{{ $styles['border_radius'] ?? 16 }}"
                                class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Changes Button -->
            <div class="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
                <button onclick="saveChanges()"
                    class="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 group">
                    <i class="fa-solid fa-check text-sm transition-transform group-hover:scale-110"></i>
                    Save Design
                </button>
            </div>
        </aside>

        <!-- Main Preview Area -->
        <main class="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
            <!-- Toolbar -->
            <div
                class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50 backdrop-blur-sm shrink-0 z-30">
                <div class="flex items-center gap-4">
                    <a href="{{ route('website.preview', $work->hero_id) }}" target="_blank"
                        class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200 group transition-all"
                        title="View Full Website">
                        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span class="text-xs text-slate-900 font-medium">Live Preview</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-3 h-3 text-slate-400 group-hover:text-indigo-600">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>

                    <div class="h-6 w-px bg-slate-200 mx-1"></div>

                    <!-- Device Toggles -->
                    <div class="flex bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button onclick="setDevice('desktop')" id="btn-desktop"
                            class="device-btn p-2 text-indigo-600 bg-white shadow-sm rounded-md transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 17.25v-1.007c0-.197.105-.377.276-.474l.294-.156a2.013 2.013 0 001.03-1.758l-.002-8.36a2.013 2.013 0 00-1.996-2.012H9.398a2.013 2.013 0 00-1.996 2.012l-.002 8.36a2.013 2.013 0 001.03 1.758l.294.156c.17.097.276.277.276.474z" />
                            </svg>
                        </button>
                        <button onclick="setDevice('tablet')" id="btn-tablet"
                            class="device-btn p-2 text-slate-400 hover:text-indigo-600 rounded-md transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </button>
                        <button onclick="setDevice('mobile')" id="btn-mobile"
                            class="device-btn p-2 text-slate-400 hover:text-indigo-600 rounded-md transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <a href="{{ $work->hero->contactSection ? route('contact.generate', $work->hero->contactSection->id) : route('contact.create', $work->hero_id) }}"
                        class="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                        <span>Next Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </a>

                    <button id="code-panel-toggle" onclick="toggleCodePanel()"
                        class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all font-bold">
                        <i class="fa-solid fa-code"></i>
                        <span class="toggle-label">{{ $needsGeneration ? 'Show Code' : 'Hide Code' }}</span>
                        @if($needsGeneration)
                            <div class="badge"></div>
                        @endif
                    </button>

                    <a href="{{ $work->hero->whyChooseUs ? route('why-choose-us.generate', $work->hero->whyChooseUs->id) : route('why-choose-us.create', $work->hero_id) }}"
                        class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="currentColor" class="w-3 h-3 text-slate-400 group-hover:text-indigo-600">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        <span>Back</span>
                    </a>
                </div>
            </div>

            <!-- Preview Canvas -->
            <div class="flex-1 overflow-auto p-12 flex flex-col items-center bg-slate-100 relative">
                <div class="absolute inset-0 pointer-events-none opacity-[0.05]"
                    style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 24px 24px;">
                </div>

                <div id="preview-container"
                    class="w-full max-w-7xl shrink-0 transition-all duration-500 ease-out shadow-2xl bg-white mx-auto overflow-hidden relative border border-slate-200 rounded-lg">
                    <div id="work-canvas" class="relative z-10 w-full min-h-[500px]">
                        <div class="work-preview-content">
                            {!! $work->generated_code !!}
                        </div>
                    </div>
                </div>

                <div class="text-center text-xs text-slate-500 mt-6 font-mono z-10" id="size-label">Desktop — 100%</div>
            </div>
        </main>
    </div>

    <!-- Image & Video Picker Modal -->
    <input type="file" id="globalImageInput" class="hidden"
        accept="image/*,video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo"
        onchange="handleImageSelected(this)">

    @include('components.code-panel', [
        'generateEndpoint' => route('work.generateCode', $work->id),
        'regenerateEndpoint' => route('work.generateCode', $work->id),
        'canvasId' => 'work-canvas',
        'needsGeneration' => $needsGeneration,
        'sectionLabel' => 'Work/Projects'
    ])

    <script src="{{ asset('js/font-awesome-icons.js') }}"></script>
    <script>
        const token = document.querySelector('meta[name="csrf-token"]').content;
        const workId = {{ $work->id }};
        let currentImgTarget = null;

        if (document.readyState !== 'loading') {
            attachEditListeners();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                attachEditListeners();
            });
        }

        function attachEditListeners() {
            const staticIds = ['sectionTitleInput', 'sectionSubtitleInput', 'bgColorPicker', 'cardBgPicker', 'btnBgPicker', 'accentLinePicker', 'titleColorPicker', 'subtitleColorPicker', 'btnTextColorPicker', 'githubBtnBgPicker', 'githubBtnTextColorPicker', 'gapSlider', 'borderRadiusSlider'];
            staticIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => {
                    const valEl = document.getElementById(id.replace('Slider', 'Value'));
                    if (valEl) valEl.textContent = el.value + 'px';
                    syncCanvas(true);
                });
            });

            // Dynamic project items
            document.querySelectorAll('.project-title-input, .project-desc-input, .project-github-input, .project-live-input').forEach(input => {
                input.addEventListener('input', () => syncCanvas(true));
            });
        }

        function applyStylesLocally() {
            const canvas = document.getElementById('work-canvas');
            if (!canvas) return;
            const section = canvas.querySelector('section');
            if (!section) return;

            // 1. Background Color
            const bgColor = document.getElementById('bgColorPicker')?.value;
            if (bgColor) section.style.backgroundColor = bgColor;

            // 2. Title and Subtitle Text/Colors
            const titleEl = section.querySelector('h1, h2, .section-title');
            if (titleEl) {
                titleEl.textContent = document.getElementById('sectionTitleInput')?.value || '';
                const titleColor = document.getElementById('titleColorPicker')?.value;
                if (titleColor) titleEl.style.setProperty('color', titleColor, 'important');
            }

            const subtitleEl = section.querySelector('.section-subtitle') || section.querySelector('p.text-slate-500') || section.querySelector('p.text-gray-500') || section.querySelector('section > div > p');
            if (subtitleEl) {
                subtitleEl.textContent = document.getElementById('sectionSubtitleInput')?.value || '';
                const subtitleColor = document.getElementById('subtitleColorPicker')?.value;
                if (subtitleColor) subtitleEl.style.setProperty('color', subtitleColor, 'important');
            }

            // 3. Accent Line
            const accent = section.querySelector('.mx-auto.h-1\\.5') || section.querySelector('.w-24.h-1') || section.querySelector('.h-1.w-20') || section.querySelector('[style*="height: 6px"]');
            const accentColor = document.getElementById('accentLinePicker')?.value;
            if (accent && accentColor) {
                accent.style.setProperty('background-color', accentColor, 'important');
                accent.style.setProperty('background', accentColor, 'important');
            }

            // 4. Cards (Gap and Border Radius and Card BG)
            const cards = Array.from(section.querySelectorAll('.project-card, .work-card, .group.relative.overflow-hidden'));
            const cardBg = document.getElementById('cardBgPicker')?.value;
            const borderRadius = document.getElementById('borderRadiusSlider')?.value;
            const gap = document.getElementById('gapSlider')?.value;

            cards.forEach(card => {
                if (cardBg) card.style.setProperty('background-color', cardBg, 'important');
                if (borderRadius) card.style.setProperty('border-radius', borderRadius + 'px', 'important');
            });

            // Grid or container gap
            const gridContainer = section.querySelector('.grid') || section.querySelector('[class*="grid"]');
            if (gridContainer && gap) {
                gridContainer.style.setProperty('gap', gap + 'px', 'important');
            }

            // 5. Buttons
            const btnBg = document.getElementById('btnBgPicker')?.value;
            const btnText = document.getElementById('btnTextColorPicker')?.value;
            const gitBg = document.getElementById('githubBtnBgPicker')?.value;
            const gitText = document.getElementById('githubBtnTextColorPicker')?.value;

            section.querySelectorAll('a').forEach(btn => {
                // Determine if it is a GitHub button or a Live demo button
                const isGithub = btn.textContent.toLowerCase().includes('github') || btn.querySelector('.fa-github') || btn.className.includes('github') || btn.className.includes('git');
                if (isGithub) {
                    if (gitBg) btn.style.setProperty('background-color', gitBg, 'important');
                    if (gitText) btn.style.setProperty('color', gitText, 'important');
                } else {
                    // Live Demo button
                    if (btnBg) btn.style.setProperty('background-color', btnBg, 'important');
                    if (btnText) btn.style.setProperty('color', btnText, 'important');
                }
            });
        }

        let debounceTimeout = null;

        function syncCanvas(quiet = false, saveToDb = false) {
            // Apply style changes locally for instant visual feedback!
            applyStylesLocally();

            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            if (saveToDb) {
                performSync(quiet, saveToDb);
                return;
            }

            // Debounce the preview network request
            debounceTimeout = setTimeout(() => {
                performSync(quiet, saveToDb);
            }, 300);
        }

        function performSync(quiet = false, saveToDb = false) {
            const items = [];
            document.querySelectorAll('.project-item-wrapper').forEach(el => {
                items.push({
                    image: el.querySelector('.project-image-input')?.value || '',
                    video: el.querySelector('.project-video-input')?.value || '',
                    title: el.querySelector('.project-title-input')?.value || '',
                    description: el.querySelector('.project-desc-input')?.value || '',
                    github: el.querySelector('.project-github-input')?.value || '',
                    live: el.querySelector('.project-live-input')?.value || '',
                });
            });

            const body = {
                preview_only: !saveToDb,
                items,
                layout_style: '{{ $work->layout_style ?? 'grid' }}',
                title: document.getElementById('sectionTitleInput')?.value || '',
                subtitle: document.getElementById('sectionSubtitleInput')?.value || '',
                styles: {
                    bg_color: document.getElementById('bgColorPicker')?.value || '#ffffff',
                    card_bg: document.getElementById('cardBgPicker')?.value || '#fefefe',
                    btn_bg_color: document.getElementById('btnBgPicker')?.value || '#4f46e5',
                    btn_text_color: document.getElementById('btnTextColorPicker')?.value || '#ffffff',
                    github_btn_bg: document.getElementById('githubBtnBgPicker')?.value || '#1e293b',
                    github_btn_text: document.getElementById('githubBtnTextColorPicker')?.value || '#ffffff',
                    accent_line_color: document.getElementById('accentLinePicker')?.value || '#4f46e5',
                    title_color: document.getElementById('titleColorPicker')?.value || '#111827',
                    subtitle_color: document.getElementById('subtitleColorPicker')?.value || '#6b7280',
                    gap: document.getElementById('gapSlider')?.value || 32,
                    border_radius: document.getElementById('borderRadiusSlider')?.value || 16,
                    padding: 80
                }
            };

            fetch(`/work/${workId}/update-design`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify(body)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Clean up old lightboxes appended to body
                        document.querySelectorAll('body > #work-lightbox').forEach(el => el.remove());
                        
                        document.querySelector('.work-preview-content').innerHTML = data.html;
                        if (!quiet) showNotification(saveToDb ? 'Changes saved permanently!' : 'Preview updated!', 'success');
                    }
                });
        }

        function saveChanges() {
            syncCanvas(false, true);
            setTimeout(() => window.location.reload(), 1000);
        }

        function addProject() {
            const container = document.getElementById('projects-editor');
            const index = container.querySelectorAll('.project-item-wrapper').length;
            const html = `
                <div class="project-item-wrapper p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group/item" data-index="${index}">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project #${index + 1}</span>
                        <button type="button" onclick="removeProject(${index})" class="text-slate-400 hover:text-red-500 transition-colors">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                    <div class="space-y-3">
                        <div class="flex gap-2">
                            <div class="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden flex-shrink-0 relative group/img cursor-pointer" onclick="changeProjectImage(this)">
                                <img src="/placeholder.svg" class="w-full h-full object-cover project-img-preview">
                                <video src="" class="w-full h-full object-cover project-video-preview hidden" muted loop autoplay playsinline></video>
                                <div id="upload-overlay-${index}" class="absolute inset-0 bg-white/80 backdrop-blur-sm hidden flex-col items-center justify-center z-10">
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                </div>
                                <div class="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                    <i class="fa-solid fa-camera text-[10px]"></i>
                                </div>
                                <input type="hidden" class="project-image-input" value="/placeholder.svg">
                                <input type="hidden" class="project-video-input" value="">
                            </div>
                            <div class="flex-1 space-y-1">
                                <input type="text" value="New Project Title" class="project-title-input control-input text-[11px] p-1.5 h-auto font-bold">
                                <input type="text" value="" class="project-live-input control-input text-[9px] p-1.2 h-auto text-indigo-500" placeholder="Live Demo URL">
                                <input type="text" value="" class="project-github-input control-input text-[9px] p-1.2 h-auto text-slate-400" placeholder="GitHub URL">
                            </div>
                        </div>
                        <div>
                            <textarea class="project-desc-input control-input text-[10px] min-h-[50px] p-2 leading-tight">Project description goes here...</textarea>
                        </div>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
            attachEditListeners();
            syncCanvas(true);
        }

        function removeProject(i) {
            document.querySelector(`.project-item-wrapper[data-index="${i}"]`).remove();
            syncCanvas(true);
        }

        function changeProjectImage(btn) {
            currentImgTarget = btn.closest('.group\\/img');
            document.getElementById('globalImageInput').click();
            document.getElementById('globalImageInput').value = '';
        }

        function handleImageSelected(input) {
            if (input.files && input.files[0] && currentImgTarget) {
                const file = input.files[0];
                const isVideo = file.type.startsWith('video/');

                const maxVideoMb = 40;
                if (isVideo && file.size > maxVideoMb * 1024 * 1024) {
                    alert(`فيديو كبير جداً! أقصى مساحة مسموحة للفيديو هي ${maxVideoMb} ميجابايت.`);
                    return;
                }
                if (!isVideo && file.size > 8 * 1024 * 1024) {
                    alert('صورة كبيرة جداً! أقصى مساحة هي 8 ميجابايت.');
                    return;
                }

                const overlay = currentImgTarget.querySelector('[id^="upload-overlay-"]');
                if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('flex'); }

                const formData = new FormData();
                const route = isVideo ? '{{ route("work.uploadVideo") }}' : '{{ route("work.uploadImage") }}';
                formData.append(isVideo ? 'video' : 'image', file);
                formData.append('_token', token);

                fetch(route, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                })
                    .then(async res => {
                        const contentType = res.headers.get('content-type');
                        if (!res.ok || !contentType || !contentType.includes('application/json')) {
                            throw new Error('Server returned invalid data or error');
                        }
                        return res.json();
                    })
                    .then(data => {
                        if (data.success) {
                            const imgEl = currentImgTarget.querySelector('.project-img-preview');
                            const vidEl = currentImgTarget.querySelector('.project-video-preview');
                            const imgIn = currentImgTarget.querySelector('.project-image-input');
                            const vidIn = currentImgTarget.querySelector('.project-video-input');

                            if (isVideo) {
                                vidEl.src = data.url;
                                vidIn.value = data.url;
                                imgIn.value = '';
                                imgEl.classList.add('hidden');
                                vidEl.classList.remove('hidden');
                                vidEl.play();
                            } else {
                                imgEl.src = data.url;
                                imgIn.value = data.url;
                                vidIn.value = '';
                                vidEl.classList.add('hidden');
                                imgEl.classList.remove('hidden');
                            }
                            syncCanvas(true);
                        } else {
                            throw new Error(data.message || 'Server upload failed');
                        }
                    })
                    .catch(err => {
                        console.error('Upload error:', err);
                        alert('❌ Upload failed! \nDetails: ' + err.message);
                    })
                    .finally(() => {
                        if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
                    });
            }
        }

        let _responsiveCssEl = null;

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const label = document.getElementById('size-label');
            const btns = document.querySelectorAll('.device-btn');

            btns.forEach(b => {
                b.classList.remove('active', 'text-indigo-600', 'bg-white');
                b.classList.add('text-slate-400');
            });
            const active = document.getElementById('btn-' + type);
            active.classList.add('active', 'text-indigo-600', 'bg-white');

            if (!_responsiveCssEl) {
                _responsiveCssEl = document.createElement('style');
                _responsiveCssEl.id = 'responsive-override';
                document.head.appendChild(_responsiveCssEl);
            }

            container.classList.add('transition-all', 'duration-500');

            if (type === 'mobile' || type === 'tablet') {
                const w = type === 'mobile' ? '375px' : '768px';
                const cols = type === 'mobile' ? '1' : '2';

                container.style.width = w;
                container.style.borderRadius = type === 'mobile' ? '32px' : '16px';
                container.style.border = type === 'mobile' ? '12px solid #1e293b' : '8px solid #334155';
                label.innerHTML = (type === 'mobile' ? 'Mobile' : 'Tablet') + ' Mode — ' + w;

                _responsiveCssEl.textContent = `
                    #work-canvas [class*="grid"] { grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important; gap: 1.5rem !important; }
                    #work-canvas section { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
                    #work-canvas h1, #work-canvas h2 { font-size: ${type === 'mobile' ? '1.875rem' : '2.25rem'} !important; }
                `;
            } else {
                container.style.width = '100%';
                container.style.borderRadius = '8px';
                container.style.border = '1px solid #e2e8f0';
                label.innerHTML = 'Desktop Mode — 100%';
                _responsiveCssEl.textContent = '';
            }

            setTimeout(() => container.classList.remove('transition-all'), 600);
        }

        function copyCode() {
            navigator.clipboard.writeText(document.querySelector('.work-preview-content').innerHTML)
                .then(() => showNotification('Code copied!', 'success'));
        }

        function showNotification(msg, type) {
            const div = document.createElement('div');
            div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-2xl z-50 animate-fade-in-up ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
            div.textContent = msg;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }
        // Fallback Lightbox HTML for older generated codes
        if (!document.getElementById("work-lightbox")) {
            const lightboxHtml = `
            <div id="work-lightbox" class="fixed inset-0 z-[100] hidden items-center justify-center transition-all duration-500" style="opacity: 0; background-color: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                <div class="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 pointer-events-none"></div>
                <button onclick="closeWorkLightbox()" class="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110 hover:rotate-90 z-[110] shadow-2xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div id="lightbox-media-wrapper" class="relative z-[105] max-w-[90vw] max-h-[85vh] transition-all duration-500 scale-90 opacity-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-slate-900 border border-white/10">
                    <div id="lightbox-media-container" class="relative flex items-center justify-center w-full h-full"></div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', lightboxHtml);
        }

        // Global Lightbox Functions for Preview Canvas Resilience
        window.openWorkLightbox = function(src, isVideo) {
            const lightbox = document.getElementById("work-lightbox");
            const container = document.getElementById("lightbox-media-container");
            const wrapper = document.getElementById("lightbox-media-wrapper");
            if (!lightbox || !container || !wrapper) return;

            // Move to body to escape preview canvas CSS transforms
            if (lightbox.parentNode !== document.body) {
                document.body.appendChild(lightbox);
            }

            container.innerHTML = "";
            lightbox.classList.remove("hidden");
            lightbox.classList.add("flex");
            
            setTimeout(() => {
                lightbox.style.opacity = "1";
                wrapper.classList.remove("scale-90", "opacity-0");
                wrapper.classList.add("scale-100", "opacity-100");
                
                container.innerHTML = isVideo 
                    ? `<video src="${src}" controls autoplay loop style="max-width:80vw; max-height:75vh; display:block; border-radius:2.5rem;"></video>`
                    : `<img src="${src}" style="max-width:80vw; max-height:75vh; object-fit:contain; display:block; border-radius:2.5rem;">`;
            }, 50);
            document.body.style.overflow = "hidden";
        };

        window.closeWorkLightbox = function() {
            const lightbox = document.getElementById("work-lightbox");
            const wrapper = document.getElementById("lightbox-media-wrapper");
            if (!lightbox || !wrapper) return;
            
            lightbox.style.opacity = "0";
            wrapper.classList.add("scale-90", "opacity-0");
            wrapper.classList.remove("scale-100", "opacity-100");
            
            setTimeout(() => {
                lightbox.classList.add("hidden");
                lightbox.classList.remove("flex");
                document.getElementById("lightbox-media-container").innerHTML = "";
                document.body.style.overflow = "";
            }, 500);
        };

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (typeof window.closeWorkLightbox === 'function') {
                    window.closeWorkLightbox();
                }
            }
        });
    </script>
</body>
</html>