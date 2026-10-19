<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Navbar Preview Editor</title>
    @vite('resources/css/app.css')
    @vite('resources/js/app.js')
    <script src="/js/tailwind.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .control-input {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            width: 100%;
            transition: all 0.2s;
        }

        .control-input:focus {
            border-color: #6366f1;
            outline: none;
            ring: 1px #6366f1;
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

        /* Hide the redundant navbar that comes with the Hero code */
        #hero-context nav,
        #hero-context header nav,
        #hero-context .navbar {
            display: none !important;
        }

        /* === NAVBAR PREVIEW FIXES === */

        /* Force Navbar Background Always (Override AI transparent default) */
        #navbar-wrapper nav, #navbar-wrapper header {
            background-color: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border-bottom: 1px solid rgba(226, 232, 240, 0.5) !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }

        /* Mobile menu — smooth DROPDOWN from top (not side-slide) */
        #navbar-wrapper #mobile-menu {
            display: flex !important;
            flex-direction: column !important;
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            background: white !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
            z-index: 9999 !important;
            padding: 0 2rem !important;
            gap: 0 !important;
            transition: max-height 0.4s ease, opacity 0.35s ease, padding 0.3s ease !important;
            /* Override any fixed/absolute positioning from the AI code */
            right: auto !important;
            left: 0 !important;
        }

        /* Show: dropdown opens smoothly downward */
        #navbar-wrapper #mobile-menu.active {
            max-height: 600px !important;
            opacity: 1 !important;
            pointer-events: all !important;
            padding: 1.5rem 2rem !important;
            gap: 1rem !important;
        }

        /* Ensure nav is relative so dropdown is positioned correctly */
        #navbar-wrapper nav {
            position: relative !important;
        }

        /* Hide hamburger in desktop mode */
        #navbar-wrapper .hamburger,
        #navbar-wrapper [id*="hamburger"] {
            display: none !important;
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
                    <!-- Content Section -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Content</h3>

                        <!-- Logo Controls -->
                        <div class="space-y-3">
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand
                                Branding</label>
                            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                <div>
                                    <label class="block text-[11px] text-slate-500 mb-1.5">Logo Text</label>
                                    <input type="text" id="logoTextInput" value="{{ $navbar->logo_text }}"
                                        class="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Company Name">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="block text-[11px] text-slate-500">Logo Image</label>
                                    <div class="relative group/logo">
                                        <div
                                            class="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white relative min-h-[80px]">
                                            <div id="logoPlaceholder"
                                                class="{{ $navbar->logo_image ? 'hidden' : '' }} text-center">
                                                <i class="fa-solid fa-image text-slate-300 text-xl mb-1 block"></i>
                                                <span class="text-[10px] text-slate-400">Upload SVG/PNG</span>
                                            </div>

                                            <div id="logoActions"
                                                class="{{ $navbar->logo_image ? '' : 'hidden' }} absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px] opacity-0 group-hover/logo:opacity-100 transition-all rounded-lg">
                                                <button type="button" onclick="removeLogoPreview()"
                                                    class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg scale-90 group-hover/logo:scale-100 duration-200">
                                                    <i class="fa-solid fa-trash-can text-sm"></i>
                                                </button>
                                            </div>

                                            <img id="logoPreview"
                                                src="{{ $navbar->logo_image ? asset('storage/' . $navbar->logo_image) : '' }}"
                                                class="{{ $navbar->logo_image ? '' : 'hidden' }} max-h-12 w-auto pointer-events-none">

                                            <input type="file" id="logoUpload" accept="image/*"
                                                class="absolute inset-0 opacity-0 cursor-pointer z-[1] {{ $navbar->logo_image ? 'hidden' : '' }}">
                                        </div>
                                    </div>
                                    <input type="hidden" id="removeLogoFlag" value="0">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2">
                        <div class="flex justify-between items-center mb-3">
                            <label
                                class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation
                                Links</label>
                            <button type="button" onclick="autoFillSections()"
                                class="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Link Sections
                            </button>
                        </div>
                        <div id="links-editor" class="space-y-3">
                            @foreach($navbar->links_data as $index => $link)
                                <div class="link-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-link"
                                    data-index="{{ $index }}">
                                    <div class="flex justify-between items-center">
                                        <label
                                            class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link
                                            {{ $index + 1 }}</label>
                                        <button type="button" onclick="removeLink({{ $index }})"
                                            class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-link:hover:opacity-100">
                                            <i class="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <input type="text" value="{{ $link['title'] }}" data-index="{{ $index }}"
                                            class="link-title-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Text">
                                        <input type="text" value="{{ $link['url'] }}" data-index="{{ $index }}"
                                            class="link-url-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="URL">
                                    </div>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" onclick="addLink()"
                            class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                            <i class="fa-solid fa-plus text-xs"></i>
                            Add Navigation Link
                        </button>
                    </div>

                    <!-- Buttons Section -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">CTA Buttons</h3>

                        <div id="buttons-editor" class="space-y-3">
                            @foreach(($navbar->buttons_data ?? []) as $index => $btn)
                                <div class="button-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-btn"
                                    data-index="{{ $index }}">
                                    <div class="flex justify-between items-center">
                                        <label
                                            class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button
                                            {{ $index + 1 }}</label>
                                        <button type="button" onclick="removeButton({{ $index }})"
                                            class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-btn:hover:opacity-100">
                                            <i class="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <input type="text" value="{{ $btn['text'] }}" data-index="{{ $index }}"
                                            class="btn-text-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Label">
                                        <input type="text" value="{{ $btn['url'] }}" data-index="{{ $index }}"
                                            class="btn-url-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="URL">
                                    </div>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" id="add-btn-trigger" onclick="addButton()"
                            class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                            <i class="fa-solid fa-plus text-xs"></i>
                            Add CTA Button
                        </button>
                    </div>

                    <!-- Colors Section -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Colors</h3>
                        @php $styles = $navbar->custom_styles ?? []; @endphp
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="block text-xs text-slate-600 mb-1">Navbar BG</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="navBgPicker"
                                        value="{{ $styles['nav_bg_color'] ?? '#ffffff' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-xs text-slate-600 mb-1">Link Color</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="linkColorPicker"
                                        value="{{ $styles['link_color'] ?? '#000000' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-xs text-slate-600 mb-1">Hover Color</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="hoverColorPicker"
                                        value="{{ $styles['link_bg_color'] ?? '#6366f1' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-xs text-slate-600 mb-1">Button Bg</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="btnBgPicker"
                                        value="{{ $styles['btn_bg_color'] ?? '#6366f1' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-xs text-slate-600 mb-1">Button Text</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="btnTextPicker"
                                        value="{{ $styles['btn_text_color'] ?? '#ffffff' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-xs text-slate-600 mb-1">Icon Color</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="iconColorPicker"
                                        value="{{ $styles['icon_color'] ?? '#1a1a1a' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Typography & Layout Section -->
                    <div class="space-y-6 pt-6 border-t border-slate-100">
                        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Typography & Layout
                        </h3>
                        <div class="space-y-6">
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Logo Height</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="logoSizeValue">{{ $styles['logo_size'] ?? 40 }}px</span>
                                </div>
                                <input type="range" id="logoSizeSlider" min="20" max="100"
                                    value="{{ $styles['logo_size'] ?? 40 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Vertical Padding</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="paddingValue">{{ $styles['padding'] ?? 16 }}px</span>
                                </div>
                                <input type="range" id="paddingSlider" min="8" max="64"
                                    value="{{ $styles['padding'] ?? 16 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Link Size</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="linkSizeValue">{{ $styles['link_size'] ?? 14 }}px</span>
                                </div>
                                <input type="range" id="linkSizeSlider" min="10" max="32"
                                    value="{{ $styles['link_size'] ?? 14 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Button Size</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="btnSizeValue">{{ $styles['btn_size'] ?? 14 }}px</span>
                                </div>
                                <input type="range" id="btnSizeSlider" min="10" max="24"
                                    value="{{ $styles['btn_size'] ?? 14 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-6 border-t border-slate-100 bg-white">
                    <button onclick="saveChanges()"
                        class="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 group">
                        <i class="fa-solid fa-check text-sm transition-transform group-hover:scale-110"></i>
                        Save Changes
                    </button>
                </div>
            </aside>

            <!-- Main Preview Area -->
            <main class="flex-1 flex flex-col bg-white relative overflow-hidden">
                <!-- Toolbar -->
                <div
                    class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50 shrink-0 z-30">
                    <div class="flex items-center gap-4">
                        <a href="{{ route('website.preview', $navbar->hero_id) }}" target="_blank"
                            class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200 group transition-all">
                            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span class="text-xs text-slate-900 font-medium">Live Preview</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" class="w-3 h-3 text-slate-400 group-hover:text-indigo-600">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </a>

                        <div class="h-6 w-px bg-slate-300 mx-2"></div>

                        <!-- Device Toggles -->
                        <div class="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button onclick="setDevice('desktop')" id="btn-desktop"
                                class="device-btn p-2 text-indigo-600 bg-indigo-50 rounded-md transition-all shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 17.25v-1.007c0-.197.105-.377.276-.474l.294-.156a2.013 2.013 0 001.03-1.758l-.002-8.36a2.013 2.013 0 00-1.996-2.012H9.398a2.013 2.013 0 00-1.996 2.012l-.002 8.36a2.013 2.013 0 001.03 1.758l.294.156c.17.097.276.277.276.474z" />
                                </svg>
                            </button>
                            <button onclick="setDevice('tablet')" id="btn-tablet"
                                class="device-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </button>
                            <button onclick="setDevice('mobile')" id="btn-mobile"
                                class="device-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <a href="{{ $navbar->hero->aboutSection ? route('about.generate', $navbar->hero->aboutSection->id) : route('about.create', $navbar->hero_id) }}"
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

                        <a href="{{ route('navbar.create', $navbar->hero_id) }}"
                            class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            Back
                        </a>
                    </div>
                </div>

                <!-- Preview Canvas -->
                <div class="flex-1 overflow-auto p-12 flex flex-col items-center bg-slate-100 relative">
                    <div class="absolute inset-0 pointer-events-none opacity-[0.05]"
                        style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 24px 24px;">
                    </div>

                    <div id="preview-container"
                        class="w-full max-w-6xl transition-all duration-300 ease-out shadow-2xl bg-white mx-auto overflow-hidden relative"
                        style="transform: translate(0);">
                        <div id="navbar-wrapper" class="relative z-[60] w-full min-h-[60px]">
                            @if(empty($navbar->generated_code) || str_contains($navbar->generated_code, 'Generating AI Navbar'))
                                <div
                                    class="flex items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl m-4">
                                    <div class="text-center">
                                        <div
                                            class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4">
                                        </div>
                                        <p class="text-slate-500 font-bold">Generating AI Navbar...</p>
                                        <p class="text-slate-400 text-sm">This takes about 10-15 seconds.</p>
                                    </div>
                                </div>
                            @else
                                {!! $navbar->generated_code !!}
                            @endif
                        </div>

                        <!-- HERO SECTION CONTEXT -->
                        @php $hStyles = isset($hero) ? ($hero->custom_styles ?? []) : []; $hBg = isset($hero) ? $hero->background_image : null; @endphp
                        @if(!empty($hStyles) || $hBg)
                        <style>
                            @if(!empty($hStyles['title_color'])).hero-title.hero-title { color: {{ $hStyles['title_color'] }} !important; } @endif
                            @if(!empty($hStyles['subtitle_color'])).hero-subtitle.hero-subtitle { color: {{ $hStyles['subtitle_color'] }} !important; } @endif
                            @if(!empty($hStyles['description_color'])).hero-description.hero-description { color: {{ $hStyles['description_color'] }} !important; } @endif
                            @if(!empty($hStyles['button_bg_color']) || !empty($hStyles['button_text_color']))
                            .hero-button.hero-button, .hero-cta-2.hero-cta-2, .hero-cta-3.hero-cta-3 {
                                @if(!empty($hStyles['button_bg_color'])) background-color: {{ $hStyles['button_bg_color'] }} !important; @endif
                                @if(!empty($hStyles['button_text_color'])) color: {{ $hStyles['button_text_color'] }} !important; @endif
                            }
                            @endif
                            @if(!empty($hStyles['bg_color']))
                            .hero.hero{{ (isset($hero) && $hero->background_image) ? '' : ', .hero-bg.hero-bg' }} { background-color: {{ $hStyles['bg_color'] }} !important; }
                            @endif
                            @if($hBg && (isset($hero) && $hero->layout_style !== 'split'))
                            .hero.hero { background-image: url("{{ (str_starts_with($hBg, 'http') || str_starts_with($hBg, '/images/') || str_starts_with($hBg, '/storage/')) ? $hBg : '/storage/' . ltrim($hBg, '/') }}") !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }
                            .hero-bg.hero-bg { background: transparent !important; }
                            @endif
                        </style>
                        @endif
                        <div id="hero-context" class="relative z-[50]">
                            @if(!empty($heroContent))
                                <div class="opacity-100 pointer-events-none origin-top scale-100">
                                    {!! $heroContent !!}
                                </div>
                            @else
                                <div
                                    class="h-[600px] bg-slate-50 flex flex-col items-center justify-center border-t border-slate-100 p-12 gap-4">
                                    <svg class="w-12 h-12 text-slate-200" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div class="text-center">
                                        <p class="text-slate-500 font-bold text-base">No Hero Section Found</p>
                                        <p class="text-slate-400 text-sm italic">Design your hero first to see it here.</p>
                                    </div>
                                </div>
                            @endif
                        </div>
                    </div>
                    <div class="text-center text-xs text-slate-500 mt-4 font-mono z-10" id="size-label">
                        Desktop - 100%
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Injected CSS override tag
        let _responsiveCssEl = null;

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const resLabel = document.getElementById('size-label');
            const btns = document.querySelectorAll('.device-btn');

            btns.forEach(b => {
                b.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
                b.classList.add('text-slate-400');
            });

            const activeBtn = document.getElementById('btn-' + type);
            activeBtn.classList.remove('text-slate-400');
            activeBtn.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');

            // Ensure responsive CSS override element exists
            if (!_responsiveCssEl) {
                _responsiveCssEl = document.createElement('style');
                _responsiveCssEl.id = 'responsive-override';
                document.head.appendChild(_responsiveCssEl);
            }

            if (type === 'mobile' || type === 'tablet') {
                const w = type === 'mobile' ? '375px' : '768px';
                container.style.maxWidth = w;
                container.style.overflow = 'visible';
                resLabel.innerText = (type === 'mobile' ? 'Mobile' : 'Tablet') + ' Mode - ' + w;

                // Force-hide desktop links and show hamburger
                _responsiveCssEl.textContent = `
                    /* Hide desktop nav links */
                    #navbar-wrapper .desktop-links,
                    #navbar-wrapper .desktop-cta { display: none !important; }

                    /* Show hamburger — target by class AND by id pattern */
                    #navbar-wrapper .hamburger,
                    #navbar-wrapper [id*="hamburger"] {
                        display: flex !important;
                        align-items: center;
                        cursor: pointer;
                    }
                `;
            } else {
                container.style.maxWidth = '1152px';
                container.style.overflow = 'hidden';
                resLabel.innerText = 'Desktop Mode - 1152px';
                _responsiveCssEl.textContent = '';
            }
        }

        // Mobile menu toggle — uses .active class like the default navbar code
        document.addEventListener('click', function(e) {
            const wrapper = document.getElementById('navbar-wrapper');
            if (!wrapper) return;

            const hamburger = e.target.closest('#hamburger-btn, #hamburger-btn-side, .hamburger, [id*="hamburger"]');
            if (!hamburger || !wrapper.contains(hamburger)) return;

            e.preventDefault();
            e.stopPropagation();

            const menu = wrapper.querySelector('#mobile-menu');
            if (!menu) return;

            const isOpen = menu.classList.contains('active');
            if (isOpen) {
                menu.classList.remove('active');
                hamburger.innerHTML = `<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='3' y1='6' x2='21' y2='6'></line><line x1='3' y1='12' x2='21' y2='12'></line><line x1='3' y1='18' x2='21' y2='18'></line></svg>`;
            } else {
                menu.classList.add('active');
                hamburger.innerHTML = `<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>`;
            }
        });

        function saveChanges() {
            const wrapper = document.getElementById('navbar-wrapper');
            if (!wrapper) return;

            const code = wrapper.innerHTML;
            if (code.includes('Generating AI Navbar') || code.includes('animate-spin') || wrapper.querySelector('.animate-spin')) {
                showNotification('Please wait until AI generation is complete before saving changes.', 'error');
                return;
            }
            const styles = {
                nav_bg_color: document.getElementById('navBgPicker').value,
                link_color: document.getElementById('linkColorPicker').value,
                link_bg_color: document.getElementById('hoverColorPicker').value,
                btn_bg_color: document.getElementById('btnBgPicker').value,
                btn_text_color: document.getElementById('btnTextPicker').value,
                icon_color: document.getElementById('iconColorPicker').value,
                logo_size: document.getElementById('logoSizeSlider').value,
                padding: document.getElementById('paddingSlider').value,
                link_size: document.getElementById('linkSizeSlider').value,
                btn_size: document.getElementById('btnSizeSlider').value,
            };

            const linkData = Array.from(document.querySelectorAll('.link-item')).map(item => ({
                title: item.querySelector('.link-title-input').value,
                url: item.querySelector('.link-url-input').value
            }));

            const buttonData = Array.from(document.querySelectorAll('.button-item')).map(item => ({
                text: item.querySelector('.btn-text-input').value,
                url: item.querySelector('.btn-url-input').value
            }));

            const formData = new FormData();
            formData.append('code', code);
            formData.append('styles', JSON.stringify(styles));
            formData.append('links', JSON.stringify(linkData));
            formData.append('buttons', JSON.stringify(buttonData));
            formData.append('logo_text', document.getElementById('logoTextInput').value);
            formData.append('remove_logo', document.getElementById('removeLogoFlag').value);

            const logoFile = document.getElementById('logoUpload').files[0];
            if (logoFile) {
                formData.append('logo_image', logoFile);
            }

            fetch(`/navbar/{{ $navbar->id }}/update-design`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 font-bold flex items-center gap-3';
                        toast.innerHTML = `<span class="bg-green-500 rounded-full p-1"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></span> Design Saved Successfully`;
                        document.body.appendChild(toast);
                        setTimeout(() => window.location.reload(), 1200);
                    } else {
                        showNotification(data.message || 'Error saving changes', 'error');
                    }
                })
                .catch(err => {
                    console.error('Save error:', err);
                    showNotification('Error saving changes', 'error');
                });
        }

        const availableSections = @json($sections ?? []);

        function autoFillSections() {
            const container = document.getElementById('links-editor');
            container.innerHTML = '';

            const mapping = {
                'About': '#about',
                'Skills': '#skills',
                'Services': '#services',
                'Choice': '#why-choose-us',
                'Work': '#projects',
                'Contact': '#contact',
                'Footer': '#footer'
            };

            let index = 0;
            for (const [key, value] of Object.entries(availableSections)) {
                if (value) {
                    let title = key;
                    if (key === 'Choice') title = 'Why Us';
                    if (key === 'Work') title = 'Projects';
                    const url = mapping[key] || '#';

                    const div = document.createElement('div');
                    div.className = 'link-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-link';
                    div.dataset.index = index;
                    div.innerHTML = `
                        <div class="flex justify-between items-center">
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link ${index + 1}</label>
                            <button type="button" onclick="removeLink(${index})" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-link:hover:opacity-100">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" value="${title}" data-index="${index}" class="link-title-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all" placeholder="Text">
                            <input type="text" value="${url}" data-index="${index}" class="link-url-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all" placeholder="URL">
                        </div>`;
                    container.appendChild(div);
                    index++;
                }
            }

            if (index === 0) {
                showNotification('No sections found to link! Create some sections first.', 'error');
            } else {
                showNotification(`Successfully linked ${index} sections!`, 'success');
                syncNavbarDOM();
                updateAddLinkBtnVisibility();
            }
        }

        const updateNavbar = () => {
            const wrapper = document.getElementById('navbar-wrapper');
            if (!wrapper) return;

            const nav = wrapper.querySelector('nav') || wrapper.querySelector('div:first-child');
            if (!nav) return;

            // Read all values from controller
            const navBg = document.getElementById('navBgPicker').value;
            const linkColor = document.getElementById('linkColorPicker').value;
            const hoverColor = document.getElementById('hoverColorPicker').value;
            const btnBg = document.getElementById('btnBgPicker').value;
            const btnText = document.getElementById('btnTextPicker').value;
            const iconColor = document.getElementById('iconColorPicker').value;
            const btnSize = document.getElementById('btnSizeSlider').value;
            const linkSize = document.getElementById('linkSizeSlider').value + 'px';
            const logoSize = document.getElementById('logoSizeSlider').value + 'px';
            const vPadding = document.getElementById('paddingSlider').value + 'px';

            // -- Desktop Nav Background and Padding --
            nav.style.setProperty('background-color', navBg, 'important');
            nav.style.setProperty('padding-top', vPadding, 'important');
            nav.style.setProperty('padding-bottom', vPadding, 'important');

            // -- ALL links inside ENTIRE wrapper (desktop + mobile) --
            wrapper.querySelectorAll('a:not(.cta-btn), .nav-item').forEach(l => {
                l.style.setProperty('color', linkColor, 'important');
                l.style.setProperty('font-size', linkSize, 'important');
            });

            // -- ALL buttons inside ENTIRE wrapper (desktop + mobile) --
            wrapper.querySelectorAll('.cta-btn').forEach(btn => {
                btn.style.setProperty('background-color', btnBg, 'important');
                btn.style.setProperty('color', btnText, 'important');
                btn.style.setProperty('font-size', btnSize + 'px', 'important');
                const vPad = Math.round(btnSize * 0.75) + 'px';
                const hPad = Math.round(btnSize * 2) + 'px';
                btn.style.setProperty('padding', `${vPad} ${hPad}`, 'important');
            });

            // -- ALL logos inside ENTIRE wrapper (desktop + mobile) --
            wrapper.querySelectorAll('img, .logo-img').forEach(logo => {
                logo.style.setProperty('height', logoSize, 'important');
                logo.style.width = 'auto';
            });

            // -- Hover color (injected at end of body to beat AI styles) --
            let dynamicStyle = document.getElementById('dynamic-nav-styles');
            if (!dynamicStyle) {
                dynamicStyle = document.createElement('style');
                dynamicStyle.id = 'dynamic-nav-styles';
                document.body.appendChild(dynamicStyle);
            }
            // Minimalistic CSS to change hover color and enforce ONE elegant underline for all states
            dynamicStyle.textContent = `
                #navbar-wrapper nav, #navbar-wrapper #mobile-menu { overflow: visible !important; }
                
                #navbar-wrapper a:not(.cta-btn), #navbar-wrapper .nav-item {
                    position: relative !important;
                    text-decoration: none !important;
                    border-bottom: none !important; /* Disable AI border */
                }

                #navbar-wrapper a:not(.cta-btn):hover, #navbar-wrapper .nav-item:hover,
                #navbar-wrapper a:not(.cta-btn):focus, #navbar-wrapper .nav-item:focus,
                #navbar-wrapper a:not(.cta-btn):active, #navbar-wrapper .nav-item:active {
                    color: ${hoverColor} !important;
                    opacity: 0.9 !important;
                }

                /* Enforce our own perfect 3px animated underline with 100% width */
                #navbar-wrapper a:not(.cta-btn)::after, #navbar-wrapper .nav-item::after {
                    content: "" !important;
                    position: absolute !important;
                    bottom: -4px !important;
                    left: 50% !important;
                    width: 0 !important;
                    height: 3px !important; /* Thicker line as requested */
                    border-radius: 3px !important; /* Smooth edges, absolutely not square */
                    background-color: ${hoverColor} !important;
                    transform: translateX(-50%) !important;
                    transition: width 0.3s ease !important;
                    display: block !important;
                }

                #navbar-wrapper a:not(.cta-btn):hover::after, #navbar-wrapper .nav-item:hover::after,
                #navbar-wrapper a:not(.cta-btn):focus::after, #navbar-wrapper .nav-item:focus::after,
                #navbar-wrapper a:not(.cta-btn):active::after, #navbar-wrapper .nav-item:active::after {
                    width: 100% !important; /* Fits each word perfectly */
                }

                /* Mobile Hamburger Icon Color */
                #navbar-wrapper .hamburger svg, #navbar-wrapper #hamburger-btn svg {
                    stroke: ${iconColor} !important;
                }
                #navbar-wrapper .hamburger svg line, #navbar-wrapper #hamburger-btn svg line {
                    stroke: ${iconColor} !important;
                }
            `;
        };

        ['navBgPicker', 'linkColorPicker', 'hoverColorPicker', 'btnBgPicker', 'btnTextPicker', 'iconColorPicker', 'logoSizeSlider', 'paddingSlider', 'linkSizeSlider', 'btnSizeSlider'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    if (id === 'logoSizeSlider') document.getElementById('logoSizeValue').innerText = el.value + 'px';
                    if (id === 'paddingSlider') document.getElementById('paddingValue').innerText = el.value + 'px';
                    if (id === 'linkSizeSlider') document.getElementById('linkSizeValue').innerText = el.value + 'px';
                    if (id === 'btnSizeSlider') document.getElementById('btnSizeValue').innerText = el.value + 'px';
                    updateNavbar();
                });
            }
        });

        function addLink() {
            const container = document.getElementById('links-editor');
            const index = container.children.length;
            const html = `
                <div class="link-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-link" data-index="${index}">
                    <div class="flex justify-between items-center">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link ${index + 1}</label>
                        <button type="button" onclick="removeLink(${index})" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-link:hover:opacity-100">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" value="New Link" data-index="${index}" class="link-title-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all">
                        <input type="text" value="#" data-index="${index}" class="link-url-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all">
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
            updateAddLinkBtnVisibility();
            attachEditorListeners();
            syncNavbarDOM();
        }

        function updateAddLinkBtnVisibility() {
            const container = document.getElementById('links-editor');
            const btn = document.querySelector('button[onclick="addLink()"]');
            if (container.children.length >= 6) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'flex';
            }
        }

        function addButton() {
            const container = document.getElementById('buttons-editor');
            const index = container.children.length;
            if (index >= 3) return;

            const html = `
                <div class="button-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-btn" data-index="${index}">
                    <div class="flex justify-between items-center">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button ${index + 1}</label>
                        <button type="button" onclick="removeButton(${index})" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-link:hover:opacity-100">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" value="New Button" data-index="${index}" class="btn-text-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all">
                        <input type="text" value="#" data-index="${index}" class="btn-url-input w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-all">
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
            updateAddButtonBtnVisibility();
            attachEditorListeners();
            syncNavbarDOM();
        }

        function updateAddButtonBtnVisibility() {
            const container = document.getElementById('buttons-editor');
            const btn = document.getElementById('add-btn-trigger');
            if (container.children.length >= 3) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'flex';
            }
        }

        function removeLink(index) {
            const container = document.getElementById('links-editor');
            if (container.children.length <= 1) return;
            container.querySelector(`[data-index="${index}"]`).remove();
            Array.from(container.children).forEach((el, i) => {
                el.dataset.index = i;
                el.querySelector('label').innerText = `Link ${i + 1}`;
                el.querySelector('button[onclick^="removeLink"]').setAttribute('onclick', `removeLink(${i})`);
                el.querySelectorAll('input').forEach(inp => inp.dataset.index = i);
            });
            updateAddLinkBtnVisibility();
            syncNavbarDOM();
        }

        function removeButton(index) {
            const container = document.getElementById('buttons-editor');
            container.querySelector(`[data-index="${index}"]`).remove();
            Array.from(container.children).forEach((el, i) => {
                el.dataset.index = i;
                el.querySelector('label').innerText = `Button ${i + 1}`;
                el.querySelector('button[onclick^="removeButton"]').setAttribute('onclick', `removeButton(${i})`);
                el.querySelectorAll('input').forEach(inp => inp.dataset.index = i);
            });
            updateAddButtonBtnVisibility();
            syncNavbarDOM();
        }

        function syncNavbarDOM() {
            const wrapper = document.getElementById('navbar-wrapper');
            if (!wrapper) return;

            const linksContainer = document.getElementById('links-container') ||
                wrapper.querySelector('.desktop-links div') ||
                wrapper.querySelector('.desktop-links') ||
                wrapper.querySelector('nav div:nth-child(2) div') ||
                wrapper.querySelector('nav div:nth-child(2)');

            const buttonsContainer = document.getElementById('buttons-container') ||
                wrapper.querySelector('.desktop-cta') ||
                wrapper.querySelector('nav div:nth-child(3)');

            if (linksContainer) {
                const links = Array.from(document.querySelectorAll('.link-item')).map(item => ({
                    title: item.querySelector('.link-title-input').value,
                    url: item.querySelector('.link-url-input').value
                }));
                linksContainer.innerHTML = links.map(link => `<a href="${link.url}" class="nav-item">${link.title}</a>`).join('');
            }

            if (buttonsContainer) {
                const buttons = Array.from(document.querySelectorAll('.button-item')).map(item => ({
                    text: item.querySelector('.btn-text-input').value,
                    url: item.querySelector('.btn-url-input').value
                }));
                const btnBg = document.getElementById('btnBgPicker').value;
                const btnText = document.getElementById('btnTextPicker').value;

                let btnHtml = `<div class="btn-group flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">`;
                buttons.forEach((btn, idx) => {
                    if (btn.text) {
                        btnHtml += `<a href="${btn.url}" class="cta-btn btn-${idx}" style="background: ${btnBg} !important; color: ${btnText} !important; padding: 0.75rem 2rem; border-radius: 99px; font-weight: 700; text-decoration: none; display: inline-block;">${btn.text}</a>`;
                    }
                });
                btnHtml += `</div>`;
                buttonsContainer.innerHTML = btnHtml;
            }

            updateNavbar();
            attachEditorListeners();
        }

        const observer = new MutationObserver(() => updateNavbar());
        observer.observe(document.getElementById('navbar-wrapper'), { childList: true, subtree: true });

        function attachEditorListeners() {
            document.querySelectorAll('.link-title-input, .link-url-input, .btn-text-input, .btn-url-input').forEach(input => {
                input.removeEventListener('input', syncNavbarDOM);
                input.addEventListener('input', syncNavbarDOM);
            });
        }

        function runNavbarInitialization() {
            attachEditorListeners();
            updateAddLinkBtnVisibility();
            updateAddButtonBtnVisibility();

            // Logo Preview Logic
            const logoUpload = document.getElementById('logoUpload');
            const logoTextInp = document.getElementById('logoTextInput');

            if (logoUpload) {
                logoUpload.addEventListener('change', function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        if (logoTextInp) logoTextInp.value = ''; // Clear text if image added

                        const reader = new FileReader();
                        reader.onload = function (event) {
                            const preview = document.getElementById('logoPreview');
                            const placeholder = document.getElementById('logoPlaceholder');
                            if (preview) {
                                preview.src = event.target.result;
                                preview.classList.remove('hidden');
                            }
                            if (placeholder) placeholder.classList.add('hidden');
                            document.getElementById('logoActions').classList.remove('hidden');
                            document.getElementById('logoUpload').classList.add('hidden');
                            document.getElementById('removeLogoFlag').value = "0";

                            // Update Real Navbar Logo
                            const nav = document.querySelector('#navbar-wrapper nav');
                            if (nav) {
                                let logoContainer = nav.querySelector('div:first-child');
                                if (logoContainer) {
                                    logoContainer.innerHTML = `<img src="${event.target.result}" style="height: ${document.getElementById('logoSizeSlider').value}px; width: auto; max-width: 100%;">`;
                                }
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            // Logo Text Live Update
            if (logoTextInp) {
                logoTextInp.addEventListener('input', function (e) {
                    if (e.target.value) {
                        removeLogoPreview(); // Clear Image if text is typed
                    }
                    const nav = document.querySelector('#navbar-wrapper nav');
                    if (nav) {
                        const logoContainer = nav.querySelector('div:first-child');
                        if (logoContainer && !logoContainer.querySelector('img')) {
                            logoContainer.innerHTML = `<div style="font-weight: 800; font-size: 1.5rem; color: ${document.getElementById('linkColorPicker').value}">${e.target.value}</div>`;
                        }
                    }
                });
            }
        }

        if (document.readyState !== 'loading') {
            runNavbarInitialization();
        } else {
            document.addEventListener('DOMContentLoaded', runNavbarInitialization);
        }

        function removeLogoPreview() {
            document.getElementById('logoPreview').classList.add('hidden');
            document.getElementById('logoPreview').src = '';
            document.getElementById('logoActions').classList.add('hidden');
            document.getElementById('logoPlaceholder').classList.remove('hidden');
            document.getElementById('logoUpload').classList.remove('hidden');
            document.getElementById('logoUpload').value = '';
            document.getElementById('removeLogoFlag').value = "1";

            // Update nav in real-time
            const navLogoContainer = document.querySelector('#navbar-wrapper nav div:first-child');
            if (navLogoContainer) {
                const logoText = document.getElementById('logoTextInput').value;
                navLogoContainer.innerHTML = `<div style="font-weight: 800; font-size: 1.5rem; color: ${document.getElementById('linkColorPicker').value}">${logoText}</div>`;
            }
        }

        function showNotification(msg, type) {
            const div = document.createElement('div');
            div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-2xl z-[120] animate-fade-in-up ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
            div.textContent = msg;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }

        function copyCode() {
            const code = document.querySelector('#navbar-wrapper nav').outerHTML;
            navigator.clipboard.writeText(code).then(() => {
                alert('Code copied to clipboard!');
            });
        }

        window.onload = updateNavbar;
    </script>
    @include('components.code-panel', [
        'generateEndpoint' => route('navbar.generateCode', $navbar->id),
        'regenerateEndpoint' => route('navbar.generateCode', $navbar->id),
        'canvasId' => 'navbar-wrapper',
        'needsGeneration' => $needsGeneration,
        'sectionLabel' => 'Navbar'
    ])
</body>
</html>