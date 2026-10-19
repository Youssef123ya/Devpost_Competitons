<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>About Preview Editor</title>
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
    <div class="flex flex-col h-screen">
        <div class="flex flex-1 overflow-hidden">
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
                    <!-- Section Content -->
                    <div class="space-y-4">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">CONTENT</h3>
                        <div class="space-y-3">
                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Title</label>
                                <input type="text" id="titleInput" value="{{ $about->title }}" class="control-input">
                            </div>

                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Description</label>
                                <textarea id="descriptionInput"
                                    class="control-input min-h-[120px]">{{ $about->description }}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Colors -->
                    <div class="space-y-6 pt-6 border-t border-slate-100">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">COLORS</h3>
                        @php $styles = $about->custom_styles ?? []; @endphp
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="block text-[10px] text-slate-500 font-bold uppercase">Background</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="bgColorPicker"
                                        value="{{ $styles['bg_color'] ?? '#ffffff' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] text-slate-500 font-bold uppercase">Title</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="titleColorPicker"
                                        value="{{ $styles['title_color'] ?? '#111827' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="block text-[10px] text-slate-500 font-bold uppercase">Description</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="textColorPicker"
                                        value="{{ $styles['text_color'] ?? '#4b5563' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] text-slate-500 font-bold uppercase">Accent Line</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="accentColorPicker"
                                        value="{{ $styles['accent_color'] ?? '#6366f1' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Appearance Styles -->
                    <div class="space-y-6 pt-6 border-t border-slate-100">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Typography & Layout</h3>
                        <div class="space-y-5">
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <label class="text-[12px] text-slate-600">Section Padding</label>
                                    <span class="text-[11px] font-bold text-indigo-500"
                                        id="paddingValue">{{ $styles['padding'] ?? 100 }}px</span>
                                </div>
                                <input type="range" id="paddingSlider" min="40" max="200"
                                    value="{{ $styles['padding'] ?? 120 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <label class="text-[12px] text-slate-600">Border Radius</label>
                                    <span class="text-[11px] font-bold text-indigo-500"
                                        id="radiusValue">{{ $styles['border_radius'] ?? 16 }}px</span>
                                </div>
                                <input type="range" id="radiusSlider" min="0" max="100"
                                    value="{{ $styles['border_radius'] ?? 16 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                        </div>
                    </div>

                    <!-- Image Management -->
                    <div class="space-y-4 pt-6 border-t border-slate-100">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">IMAGE</h3>
                        <div
                            class="relative group aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <img src="{{ !empty($about->image) ? ((strpos($about->image, 'http') === 0 || strpos($about->image, '/images/') === 0 || strpos($about->image, '/storage/') === 0) ? $about->image : '/storage/' . ltrim($about->image, '/')) : $defaultImagePath }}"
                                id="sidebar-image-preview" alt="About Image" class="w-full h-full object-cover">
                            <div
                                class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label for="imageUpload"
                                    class="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-xl hover:scale-105 transition-all">
                                    Update Image
                                </label>
                            </div>
                        </div>
                        <input type="file" id="imageUpload" class="hidden" accept="image/*"
                            onchange="handleImageChange(event)">
                        <div id="imageUploadStatus" class="hidden text-center">
                            <div
                                class="flex items-center justify-center gap-2 text-indigo-600 text-[10px] font-bold bg-indigo-50 py-2 rounded-lg border border-indigo-100">
                                <i class="fa-solid fa-circle-notch animate-spin"></i>
                                Uploading...
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
                        <a href="{{ route('website.preview', $about->hero_id) }}" target="_blank"
                            class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200 group transition-all">
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
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 17.25v-1.007c0-.197.105-.377.276-.474l.294-.156a2.013 2.013 0 001.03-1.758l-.002-8.36a2.013 2.013 0 00-1.996-2.012H9.398a2.013 2.013 0 00-1.996 2.012l-.002 8.36a2.013 2.013 0 001.03 1.758l.294.156c.17.097.276.277.276.474z" />
                                </svg>
                            </button>
                            <button onclick="setDevice('tablet')" id="btn-tablet"
                                class="device-btn p-2 text-slate-400 hover:text-indigo-600 rounded-md transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </button>
                            <button onclick="setDevice('mobile')" id="btn-mobile"
                                class="device-btn p-2 text-slate-400 hover:text-indigo-600 rounded-md transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <a href="{{ $about->hero->skillSection ? route('skills.generate', $about->hero->skillSection->id) : route('skills.create', $about->hero_id) }}"
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

                        <a href="{{ $about->hero->navbar ? route('navbar.generate', $about->hero->navbar->id) : route('navbar.create', $about->hero_id) }}"
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
                        <div id="about-canvas-wrapper" class="relative z-10 w-full min-h-[500px]">
                            {!! $about->generated_code !!}
                        </div>

                        <!-- Handles -->
                        <div
                            class="resize-handle resizer-r absolute right-0 top-0 w-3 h-full cursor-ew-resize hover:bg-indigo-500/20 transition-all z-20">
                        </div>
                        <div
                            class="resize-handle resizer-b absolute bottom-0 left-0 w-full h-3 cursor-ns-resize hover:bg-indigo-500/20 transition-all z-20">
                        </div>
                        <div
                            class="resize-handle resizer-rb absolute right-0 bottom-0 w-6 h-6 cursor-nwse-resize hover:bg-indigo-500/20 transition-all z-30 flex items-center justify-center">
                            <svg class="w-3 h-3 text-slate-400" viewBox="0 0 10 10" fill="none">
                                <path d="M9 1V9H1" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <div class="text-center text-xs text-slate-500 mt-6 font-mono z-10" id="size-label">Desktop — 100%
                    </div>
                </div>
            </main>
        </div>

        @include('components.code-panel', [
            'generateEndpoint' => route('about.generateCode', $about->id),
            'regenerateEndpoint' => route('about.generateCode', $about->id),
            'canvasId' => 'about-canvas-wrapper',
            'needsGeneration' => $needsGeneration,
            'sectionLabel' => 'About Us'
        ])

        <script>
            const token = document.querySelector('meta[name="csrf-token"]').content;
            const aboutId = {{ $about->id }};
            window.currentImagePath = '{{ !empty($about->image) ? (strpos($about->image, "http") === 0 ? $about->image : asset("storage/" . $about->image)) : $defaultImagePath }}';

            if (document.readyState !== 'loading') {
                attachListeners();
                syncPreview();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    attachListeners();
                    syncPreview();
                });
            }

            function attachListeners() {
                const inputs = ['titleInput', 'descriptionInput', 'bgColorPicker', 'titleColorPicker', 'accentColorPicker', 'textColorPicker'];
                inputs.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener('input', () => syncPreview());
                });

                const sliders = [
                    { id: 'paddingSlider', valId: 'paddingValue', suffix: 'px' },
                    { id: 'radiusSlider', valId: 'radiusValue', suffix: 'px' }
                ];
                sliders.forEach(s => {
                    const el = document.getElementById(s.id);
                    if (el) el.addEventListener('input', (e) => {
                        document.getElementById(s.valId).textContent = e.target.value + s.suffix;
                        syncPreview();
                    });
                });
            }

            function syncPreview() {
                const canvasWrapper = document.getElementById('about-canvas-wrapper');
                const section = canvasWrapper.querySelector('section');
                if (!section) return;

                // Colors
                section.style.backgroundColor = document.getElementById('bgColorPicker').value;

                const title = section.querySelector('h2');
                if (title) {
                    title.style.color = document.getElementById('titleColorPicker').value;
                    title.textContent = document.getElementById('titleInput').value;
                }

                const description = section.querySelector('.prose p, p.text-lg');
                if (description) {
                    description.style.color = document.getElementById('textColorPicker').value;
                    description.textContent = document.getElementById('descriptionInput').value;
                }

                const accent = section.querySelector('.h-1\\.5.w-16');
                if (accent) {
                    accent.style.backgroundColor = document.getElementById('accentColorPicker').value;
                }

                // Layout & Spacing
                section.style.paddingTop = document.getElementById('paddingSlider').value + 'px';
                section.style.paddingBottom = document.getElementById('paddingSlider').value + 'px';

                const imgContainer = section.querySelector('.relative.group div.overflow-hidden');
                if (imgContainer) {
                    imgContainer.style.borderRadius = document.getElementById('radiusSlider').value + 'px';
                }

                const img = section.querySelector('img');
                if (img) {
                    img.src = window.currentImagePath;
                    img.style.borderRadius = document.getElementById('radiusSlider').value + 'px';
                }
            }

            function saveChanges() {
                const canvasWrapper = document.getElementById('about-canvas-wrapper');
                const htmlCode = canvasWrapper.innerHTML;

                const data = {
                    title: document.getElementById('titleInput').value,
                    description: document.getElementById('descriptionInput').value,
                    html_code: htmlCode,
                    styles: {
                        bg_color: document.getElementById('bgColorPicker').value,
                        title_color: document.getElementById('titleColorPicker').value,
                        accent_color: document.getElementById('accentColorPicker').value,
                        text_color: document.getElementById('textColorPicker').value,
                        padding: document.getElementById('paddingSlider').value,
                        border_radius: document.getElementById('radiusSlider').value
                    }
                };

                fetch(`/about/${aboutId}/update-design`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                    body: JSON.stringify(data)
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            showNotification('About Section Saved!', 'success');
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    });
            }

            async function handleImageChange(event) {
                const file = event.target.files[0];
                if (!file) return;

                const status = document.getElementById('imageUploadStatus');
                status.classList.remove('hidden');

                const formData = new FormData();
                formData.append('image', file);

                try {
                    const response = await fetch(`/about/${aboutId}/upload-image`, {
                        method: 'POST',
                        headers: { 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
                        body: formData
                    });
                    if (!response.ok) {
                        let errText = await response.text();
                        try {
                            const errJson = JSON.parse(errText);
                            errText = errJson.message || errJson.error || errText;
                        } catch (e) {}
                        throw new Error(errText);
                    }
                    const data = await response.json();
                    if (data.success) {
                        window.currentImagePath = data.image_url;
                        document.getElementById('sidebar-image-preview').src = data.image_url;
                        syncPreview();
                        showNotification('Image Updated!', 'success');
                    }
                } catch (e) {
                    showNotification('Upload failed', 'error');
                } finally {
                    status.classList.add('hidden');
                }
            }

            let _responsiveCssEl = null;

            function setDevice(type) {
                const container = document.getElementById('preview-container');
                const label = document.getElementById('size-label');
                const btns = document.querySelectorAll('.device-btn');
                const wrapper = document.getElementById('about-canvas-wrapper');

                // Update UI Buttons
                btns.forEach(b => {
                    b.classList.remove('text-indigo-600', 'bg-white', 'shadow-sm', 'active');
                    b.classList.add('text-slate-400');
                });
                const active = document.getElementById('btn-' + type);
                active.classList.add('text-indigo-600', 'bg-white', 'shadow-sm', 'active');

                // Initialize CSS Injector for responsive forcing
                if (!_responsiveCssEl) {
                    _responsiveCssEl = document.createElement('style');
                    _responsiveCssEl.id = 'responsive-override';
                    document.head.appendChild(_responsiveCssEl);
                }

                container.classList.add('transition-all', 'duration-500');

                if (type === 'mobile' || type === 'tablet') {
                    const w = type === 'mobile' ? '375px' : '768px';
                    container.style.width = w;
                    container.style.borderRadius = type === 'mobile' ? '32px' : '16px';
                    container.style.border = type === 'mobile' ? '12px solid #1e293b' : '8px solid #334155';
                    label.innerHTML = (type === 'mobile' ? 'Mobile' : 'Tablet') + ' Mode — ' + w;

                    // Force responsive layout — Stacked but NOT centered (Left Aligned)
                    _responsiveCssEl.textContent = `
                        /* 1. Force Stack Layout */
                        #about-canvas-wrapper [class*="grid"] { 
                            grid-template-columns: 1fr !important; 
                            gap: 2.5rem !important;
                        }
                        #about-canvas-wrapper [class*="flex"] { 
                            flex-direction: column !important; 
                            gap: 2.5rem !important;
                        }
                        
                        /* 2. Maintain Left Alignment (Removing centering) */
                        #about-canvas-wrapper section {
                            text-align: left !important;
                        }
                        
                        /* 3. Reset Paddings */
                        #about-canvas-wrapper section { 
                            padding-left: 1.5rem !important; 
                            padding-right: 1.5rem !important; 
                        }
                        #about-canvas-wrapper .container {
                            max-width: 100% !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        /* 4. Image Fixes: Keep Left but responsive */
                        #about-canvas-wrapper img {
                            width: 100% !important;
                            max-width: 500px !important;
                            height: auto !important;
                            margin-left: 0 !important;
                            display: block !important;
                        }
                        
                        /* 5. Fix Button Layout (Left Aligned) */
                        #about-canvas-wrapper .flex.gap-4 {
                            justify-content: flex-start !important;
                            align-items: flex-start !important;
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

            function toggleCodeModal() {
                document.getElementById('codeModal').classList.toggle('hidden');
            }

            function copyCode() {
                const code = document.getElementById('generatedCode').textContent;
                navigator.clipboard.writeText(code).then(() => showNotification('Code copied!', 'success'));
            }

            function showNotification(msg, type) {
                const div = document.createElement('div');
                div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-2xl z-50 animate-fade-in-up ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
                div.textContent = msg;
                document.body.appendChild(div);
                setTimeout(() => div.remove(), 3000);
            }
        </script>
</body>

</html>