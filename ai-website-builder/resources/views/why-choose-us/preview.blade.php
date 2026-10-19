<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Why Choose Us Preview Editor</title>
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

        .reason-item-wrapper {
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
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
                            <input type="text" id="sectionTitleInput" value="{{ $whyChooseUs->title }}"
                                class="control-input">
                        </div>
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Subtitle</label>
                            <input type="text" id="sectionSubtitleInput" value="{{ $whyChooseUs->subtitle }}"
                                class="control-input">
                        </div>
                    </div>
                </div>

                <!-- 2. REASON ITEMS -->
                <div class="space-y-4 pt-6 border-t border-slate-100">
                    <div id="reasons-editor" class="space-y-4">
                        @foreach(($whyChooseUs->reasons_data ?? []) as $index => $r)
                            <div class="reason-item-wrapper p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group/item"
                                data-index="{{ $index }}">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason
                                        #{{ $index + 1 }}</span>
                                    <button type="button" onclick="removeReason({{ $index }})"
                                        class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100">
                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                                <div class="space-y-3">
                                    <div>
                                        <label
                                            class="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Title</label>
                                        <input type="text" value="{{ $r['title'] ?? '' }}"
                                            class="reason-title-input control-input text-sm">
                                    </div>
                                    <div>
                                        <label
                                            class="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Icon</label>
                                        <div class="relative group/icon">
                                            <input type="text" value="{{ $r['icon'] ?? 'fa-solid fa-star' }}"
                                                class="reason-icon-input control-input text-sm pl-9 pr-12">
                                            <i
                                                class="{{ $r['icon'] ?? 'fa-solid fa-star' }} absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-[11px] icon-preview"></i>
                                            <button type="button" onclick="openIconPickerForReason({{ $index }})"
                                                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                <i class="fa-solid fa-magnifying-glass text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            class="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Description</label>
                                        <textarea
                                            class="reason-desc-input control-input text-xs min-h-[60px]">{{ $r['description'] ?? '' }}</textarea>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>

                    <button type="button" onclick="addReason()"
                        class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                        <i class="fa-solid fa-plus text-xs"></i>
                        Add Another Reason
                    </button>
                </div>

                <!-- 3. AESTHETICS (Colors) -->
                <div class="space-y-6 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">AESTHETICS</h3>
                    @php $styles = $whyChooseUs->custom_styles ?? []; @endphp
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
                                <input type="color" id="cardBgPicker"
                                    value="{{ $styles['card_bg_color'] ?? '#fefefe' }}"
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
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Icon Color</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="iconColorPicker"
                                    value="{{ $styles['icon_color'] ?? '#ffffff' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Icon BG</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="iconBgColorPicker"
                                    value="{{ $styles['icon_bg_color'] ?? '#6366f1' }}"
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
                    </div>
                </div>

                <!-- 4. SLIDERS & SIZING -->
                <div class="space-y-6 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SLIDERS & SIZING</h3>
                    <div class="space-y-5">
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <label class="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Border
                                    Radius</label>
                                <span class="text-[11px] font-bold text-indigo-500"
                                    id="borderRadiusValue">{{ $styles['border_radius'] ?? 16 }}px</span>
                            </div>
                            <input type="range" id="borderRadiusSlider" min="0" max="100"
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
                    <a href="{{ route('website.preview', $whyChooseUs->hero_id) }}" target="_blank"
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
                    <a href="{{ $whyChooseUs->hero->work ? route('work.generate', $whyChooseUs->hero->work->id) : route('work.create', $whyChooseUs->hero_id) }}"
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

                    <a href="{{ $whyChooseUs->hero->serviceSection ? route('services.generate', $whyChooseUs->hero->serviceSection->id) : route('services.create', $whyChooseUs->hero_id) }}"
                        class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="currentColor" class="w-4 h-4">
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
                    <div id="why-canvas" class="relative z-10 w-full min-h-[500px]">
                        @if(empty($whyChooseUs->generated_code))
                            <div class="flex items-center justify-center p-24 bg-slate-50">
                                <div class="text-center">
                                    <div
                                        class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4">
                                    </div>
                                    <p class="text-slate-500 font-bold">Generating Why Choose Us Section...</p>
                                </div>
                            </div>
                        @else
                            {!! $whyChooseUs->generated_code !!}
                        @endif
                    </div>
                </div>

                <div class="text-center text-xs text-slate-500 mt-6 font-mono z-10" id="size-label">Desktop — 100%</div>
            </div>
        </main>
    </div>

    <!-- Icon Picker Modal -->
    <div id="iconPickerModal" class="fixed inset-0 z-[110] hidden">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onclick="closeIconPicker()"></div>
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 class="font-bold text-slate-900">Select Icon</h3>
                <button onclick="closeIconPicker()" class="text-slate-500 hover:text-slate-900"><i
                        class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-4 bg-white border-b border-slate-100">
                <input type="text" id="iconSearchInput" placeholder="Search icons..."
                    class="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg outline-none">
            </div>
            <div id="iconPickerGrid" class="p-6 overflow-y-auto grid grid-cols-6 gap-4 min-h-[300px] custom-scrollbar">
            </div>
        </div>
    </div>

    <script src="{{ asset('js/font-awesome-icons.js') }}"></script>
    <script>
        const token = document.querySelector('meta[name="csrf-token"]').content;
        const sectionId = {{ $whyChooseUs->id }};
        let reasonTargetIndex = null;

        if (document.readyState !== 'loading') {
            attachEditListeners();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                attachEditListeners();
            });
        }

        function attachEditListeners() {
            const staticIds = ['sectionTitleInput', 'sectionSubtitleInput', 'bgColorPicker', 'cardBgPicker', 'titleColorPicker', 'subtitleColorPicker', 'accentLinePicker', 'iconColorPicker', 'iconBgColorPicker', 'borderRadiusSlider'];
            staticIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => {
                    const valEl = document.getElementById(id.replace('Slider', 'Value'));
                    if (valEl) valEl.textContent = el.value + 'px';
                    syncCanvas();
                });
            });

            document.querySelectorAll('.reason-title-input, .reason-desc-input, .reason-icon-input').forEach(input => {
                input.addEventListener('input', () => syncCanvas());
            });
        }

        function syncCanvas() {
            const canvas = document.getElementById('why-canvas');
            const section = canvas.querySelector('section');
            if (!section) return;

            // Global Styles
            section.style.backgroundColor = document.getElementById('bgColorPicker').value;
            const title = section.querySelector('h1, h2, .section-title');
            if (title) {
                title.textContent = document.getElementById('sectionTitleInput').value;
                title.style.color = document.getElementById('titleColorPicker').value;
            }
            const accent = section.querySelector('.mx-auto.h-1\\.5, [style*="height: 6px"]');
            if (accent) accent.style.background = document.getElementById('accentLinePicker').value;

            const subtitle = section.querySelector('p.text-lg, .section-subtitle');
            if (subtitle) {
                subtitle.textContent = document.getElementById('sectionSubtitleInput').value;
                subtitle.style.color = document.getElementById('subtitleColorPicker').value;
            }

            // Sync Styles & Items
            const reasonItems = Array.from(document.querySelectorAll('.reason-item-wrapper'));
            const iconBgColor = document.getElementById('iconBgColorPicker').value;
            const iconColor = document.getElementById('iconColorPicker').value;
            const cardBg = document.getElementById('cardBgPicker').value;
            const borderRadius = document.getElementById('borderRadiusSlider').value + 'px';

            // Layout 3 (Timeline) specific logic
            const timelineRows = Array.from(section.querySelectorAll('.group.relative.flex'));

            if (timelineRows.length > 0) {
                // We are in Layout 3
                reasonItems.forEach((item, i) => {
                    const row = timelineRows[i];
                    if (!row) return;

                    const card = row.querySelector('.why-card');
                    if (card) {
                        card.style.backgroundColor = cardBg;
                        card.style.borderRadius = borderRadius;
                        const rTitle = card.querySelector('h3');
                        const rDesc = card.querySelector('p');
                        if (rTitle) rTitle.style.color = document.getElementById('titleColorPicker').value;
                        if (rDesc) rDesc.style.color = document.getElementById('subtitleColorPicker').value;

                        if (rTitle) rTitle.textContent = item.querySelector('.reason-title-input').value;
                        if (rDesc) rDesc.textContent = item.querySelector('.reason-desc-input').value;
                    }

                    const iconCont = row.querySelector('.w-14.h-14.rounded-full');
                    if (iconCont) {
                        iconCont.style.backgroundColor = iconBgColor;
                        iconCont.style.boxShadow = `0 0 20px ${iconBgColor}40`;
                        const icon = iconCont.querySelector('i');
                        if (icon) {
                            icon.className = item.querySelector('.reason-icon-input').value;
                            icon.style.color = iconColor;
                        }
                    }
                });
            } else {
                // Layout 1 & 2 logic
                const cards = Array.from(section.querySelectorAll('.why-card'));
                reasonItems.forEach((item, i) => {
                    const card = cards[i];
                    if (!card) return;

                    card.style.backgroundColor = cardBg;
                    card.style.borderRadius = borderRadius;

                    const rTitle = card.querySelector('h3');
                    if (rTitle) {
                        rTitle.textContent = item.querySelector('.reason-title-input').value;
                        rTitle.style.color = document.getElementById('titleColorPicker').value;
                    }

                    const rDesc = card.querySelector('p');
                    if (rDesc) {
                        rDesc.textContent = item.querySelector('.reason-desc-input').value;
                        rDesc.style.color = document.getElementById('subtitleColorPicker').value;
                    }

                    const iconCont = card.querySelector('.w-10, .w-12, .rounded-xl, .rounded-full');
                    if (iconCont) {
                        iconCont.style.backgroundColor = iconBgColor;
                        const icon = iconCont.querySelector('i');
                        if (icon) {
                            icon.className = item.querySelector('.reason-icon-input').value;
                            icon.style.color = iconColor;
                        }
                    }
                });
            }
        }

        function saveChanges() {
            const canvas = document.getElementById('why-canvas');
            const reasons = Array.from(document.querySelectorAll('.reason-item-wrapper')).map(item => ({
                title: item.querySelector('.reason-title-input').value,
                icon: item.querySelector('.reason-icon-input').value,
                description: item.querySelector('.reason-desc-input').value,
            }));

            const styles = {
                bg_color: document.getElementById('bgColorPicker').value,
                card_bg_color: document.getElementById('cardBgPicker').value,
                title_color: document.getElementById('titleColorPicker').value,
                subtitle_color: document.getElementById('subtitleColorPicker').value,
                accent_line_color: document.getElementById('accentLinePicker').value,
                icon_bg_color: document.getElementById('iconBgColorPicker').value,
                icon_color: document.getElementById('iconColorPicker').value,
                border_radius: document.getElementById('borderRadiusSlider').value,
            };

            fetch(`/why-choose-us/${sectionId}/update-design`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify({
                    title: document.getElementById('sectionTitleInput').value,
                    subtitle: document.getElementById('sectionSubtitleInput').value,
                    reasons,
                    styles,
                    html_code: canvas.innerHTML
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Design Saved!', 'success');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                });
        }

        function addReason() {
            const container = document.getElementById('reasons-editor');
            const index = container.querySelectorAll('.reason-item-wrapper').length;
            const html = `
                <div class="reason-item-wrapper p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group/item" data-index="${index}">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason #${index + 1}</span>
                        <button type="button" onclick="removeReason(${index})" class="text-slate-400 hover:text-red-500 transition-colors">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Title</label>
                            <input type="text" value="New Reason" class="reason-title-input control-input text-sm">
                        </div>
                        <div>
                            <label class="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Icon</label>
                            <div class="relative group/icon">
                                <input type="text" value="fa-solid fa-star" class="reason-icon-input control-input text-sm pl-9 pr-12">
                                <i class="fa-solid fa-star absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-[11px] icon-preview"></i>
                                <button type="button" onclick="openIconPickerForReason(${index})" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <i class="fa-solid fa-magnifying-glass text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Description</label>
                            <textarea class="reason-desc-input control-input text-xs min-h-[60px]">Reason description</textarea>
                        </div>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
            const newWrapper = container.lastElementChild;
            newWrapper.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', syncCanvas);
            });
            syncCanvas();
        }

        function removeReason(index) {
            const item = document.querySelector(`.reason-item-wrapper[data-index="${index}"]`);
            if (item) item.remove();
            syncCanvas();
        }

        function openIconPickerForReason(index) {
            reasonTargetIndex = index;
            document.getElementById('iconPickerModal').classList.remove('hidden');
            renderPickerIcons(typeof fontAwesomeIcons !== 'undefined' ? fontAwesomeIcons : []);
        }

        function closeIconPicker() {
            document.getElementById('iconPickerModal').classList.add('hidden');
        }

        function renderPickerIcons(icons) {
            const grid = document.getElementById('iconPickerGrid');
            grid.innerHTML = icons.map(icon => `
                <button onclick="selectPickerIcon('${icon.class}')" class="flex flex-col items-center p-2 hover:bg-indigo-50 rounded-lg">
                    <i class="${icon.class} text-xl mb-1"></i>
                    <span class="text-[8px] truncate w-full">${icon.name}</span>
                </button>
            `).join('');
        }

        function selectPickerIcon(iconClass) {
            const item = document.querySelector(`.reason-item-wrapper[data-index="${reasonTargetIndex}"]`);
            if (item) {
                const input = item.querySelector('.reason-icon-input');
                const preview = item.querySelector('.icon-preview');
                input.value = iconClass;
                preview.className = iconClass + ' absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-[11px] icon-preview';
                syncCanvas();
            }
            closeIconPicker();
        }

        let _responsiveCssEl = null;

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const label = document.getElementById('size-label');
            const btns = document.querySelectorAll('.device-btn');
            const canvas = document.getElementById('why-canvas');

            // Update UI Buttons
            btns.forEach(b => {
                b.classList.remove('active', 'text-indigo-600', 'bg-white');
                b.classList.add('text-slate-400');
            });
            const active = document.getElementById('btn-' + type);
            active.classList.add('active', 'text-indigo-600', 'bg-white');

            // Initialize CSS Injector
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

                // Force responsive layout: 1 col for mobile, 2 for tablet
                _responsiveCssEl.textContent = `
                    #why-canvas [class*="grid"] { 
                        grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important; 
                        gap: 1.5rem !important;
                    }
                    #why-canvas [class*="flex-row"] { 
                        flex-direction: column !important; 
                    }
                    #why-canvas section { 
                        padding-left: 1.5rem !important; 
                        padding-right: 1.5rem !important; 
                        word-break: break-word !important;
                        overflow-wrap: break-word !important;
                    }
                    #why-canvas h1, #why-canvas h2 {
                        font-size: ${type === 'mobile' ? '1.875rem' : '2.25rem'} !important;
                        line-height: 1.2 !important;
                    }
                    #why-canvas h3 {
                        font-size: ${type === 'mobile' ? '1.25rem' : '1.5rem'} !important;
                    }
                    #why-canvas .container {
                        max-width: 100% !important;
                        padding: 0 !important;
                    }
                `;
            } else {
                container.style.width = '100%';
                container.style.borderRadius = '8px';
                container.style.border = '1px solid #e2e8f0';
                label.innerHTML = 'Desktop Mode — 100%';
                _responsiveCssEl.textContent = ''; // Clear overrides
            }

            setTimeout(() => container.classList.remove('transition-all'), 600);
        }

        function showNotification(msg, type) {
            const div = document.createElement('div');
            div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-2xl z-[120] animate-fade-in-up ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
            div.textContent = msg;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }

        function copyCode() {
            const code = document.getElementById('why-canvas').innerHTML;
            navigator.clipboard.writeText(code).then(() => showNotification('HTML Code Copied!', 'success'));
        }
    </script>
    @include('components.code-panel', [
        'generateEndpoint' => route('why-choose-us.generateCode', $whyChooseUs->id),
        'regenerateEndpoint' => route('why-choose-us.generateCode', $whyChooseUs->id),
        'canvasId' => 'why-canvas',
        'needsGeneration' => $needsGeneration,
        'sectionLabel' => 'Why Choose Us'
    ])
</body>
</html>