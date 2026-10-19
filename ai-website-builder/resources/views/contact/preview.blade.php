<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Contact Preview Editor</title>
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
                <!-- Section Content -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">CONTENT</h3>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Title</label>
                            <input type="text" id="titleInput" value="{{ $contact->title }}" class="control-input">
                        </div>
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Subtitle</label>
                            <input type="text" id="subtitleInput" value="{{ $contact->subtitle }}"
                                class="control-input">
                        </div>
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Location</label>
                            @php $st = $contact->custom_styles ?? []; @endphp
                            <input type="text" id="locationInput" value="{{ $st['location'] ?? '' }}"
                                placeholder="Enter location..." class="control-input">
                        </div>
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Phone</label>
                            <input type="text" id="phoneInput" value="{{ $st['phone_number'] ?? '' }}"
                                placeholder="Enter phone..." class="control-input">
                        </div>
                        <div>
                            <label
                                class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Email</label>
                            <input type="text" id="emailInput" value="{{ $st['email_address'] ?? '' }}"
                                placeholder="Enter email address..." class="control-input">
                        </div>
                    </div>
                </div>

                <!-- CTAs Section -->
                <div class="space-y-4 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">BUTTONS / CTAs</h3>
                    <div id="ctas-editor" class="space-y-3">
                        @foreach(($contact->ctas ?? []) as $index => $cta)
                            <div class="cta-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group"
                                data-index="{{ $index }}">
                                <div class="flex justify-between items-center">
                                    <span class="text-[9px] font-bold text-slate-400 uppercase">Button
                                        {{ $index + 1 }}</span>
                                    <button type="button" onclick="removeCTA({{ $index }})"
                                        class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i
                                            class="fa-solid fa-trash-can text-[10px]"></i></button>
                                </div>
                                <input type="text" value="{{ $cta['text'] ?? '' }}" class="cta-text control-input text-xs"
                                    placeholder="Button Text">
                                <input type="text" value="{{ $cta['url'] ?? '' }}" class="cta-url control-input text-xs"
                                    placeholder="URL">
                            </div>
                        @endforeach
                    </div>
                    <button type="button" onclick="addCTARow()"
                        class="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-xs font-semibold">
                        <i class="fa-solid fa-plus text-[10px]"></i>
                        Add New Button
                    </button>
                </div>

                <!-- Social Links Section -->
                <div class="space-y-4 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SOCIAL LINKS</h3>
                    <div id="socials-editor" class="space-y-3">
                        @foreach(($contact->social_links ?? []) as $index => $social)
                            <div class="social-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group"
                                data-index="{{ $index }}">
                                <div class="flex justify-between items-center">
                                    <span class="text-[9px] font-bold text-slate-400 uppercase">Social
                                        {{ $index + 1 }}</span>
                                    <button type="button" onclick="removeSocial({{ $index }})"
                                        class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i
                                            class="fa-solid fa-trash-can text-[10px]"></i></button>
                                </div>
                                <div class="relative">
                                    <select class="social-icon control-input text-xs pl-8">
                                        <option value="fab fa-facebook" {{ ($social['icon'] ?? '') == 'fab fa-facebook' ? 'selected' : '' }}>Facebook</option>
                                        <option value="fab fa-twitter" {{ ($social['icon'] ?? '') == 'fab fa-twitter' ? 'selected' : '' }}>Twitter</option>
                                        <option value="fab fa-x-twitter" {{ ($social['icon'] ?? '') == 'fab fa-x-twitter' ? 'selected' : '' }}>X (Twitter)</option>
                                        <option value="fab fa-instagram" {{ ($social['icon'] ?? '') == 'fab fa-instagram' ? 'selected' : '' }}>Instagram</option>
                                        <option value="fab fa-threads" {{ ($social['icon'] ?? '') == 'fab fa-threads' ? 'selected' : '' }}>Threads</option>
                                        <option value="fab fa-linkedin" {{ ($social['icon'] ?? '') == 'fab fa-linkedin' ? 'selected' : '' }}>LinkedIn</option>
                                        <option value="fab fa-whatsapp" {{ ($social['icon'] ?? '') == 'fab fa-whatsapp' ? 'selected' : '' }}>WhatsApp</option>
                                        <option value="fab fa-telegram" {{ ($social['icon'] ?? '') == 'fab fa-telegram' ? 'selected' : '' }}>Telegram</option>
                                        <option value="fab fa-tiktok" {{ ($social['icon'] ?? '') == 'fab fa-tiktok' ? 'selected' : '' }}>TikTok</option>
                                        <option value="fab fa-github" {{ ($social['icon'] ?? '') == 'fab fa-github' ? 'selected' : '' }}>GitHub</option>
                                        <option value="fab fa-youtube" {{ ($social['icon'] ?? '') == 'fab fa-youtube' ? 'selected' : '' }}>YouTube</option>
                                    </select>
                                    <i
                                        class="{{ $social['icon'] ?? 'fab fa-facebook' }} absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500 text-xs shadow-sm"></i>
                                </div>
                                <input type="text" value="{{ $social['url'] ?? '' }}"
                                    class="social-url control-input text-xs" placeholder="URL">
                            </div>
                        @endforeach
                    </div>
                    <button type="button" onclick="addSocialRow()"
                        class="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-xs font-semibold">
                        <i class="fa-solid fa-plus text-[10px]"></i>
                        Add New Social Link
                    </button>
                </div>

                <!-- Colors -->
                <div class="space-y-6 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">COLORS</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Main bg</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="bgColorPicker" value="{{ $styles['bg_color'] ?? '#ffffff' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Text Color</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="textColorPicker"
                                    value="{{ $styles['text_color'] ?? '#0f172a' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Input Field</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="inputBgColorPicker"
                                    value="{{ $styles['input_bg_color'] ?? '#f8fafc' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Button Color</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="btnColorPicker" value="{{ $styles['btn_color'] ?? '#4f46e5' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Social Icon</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="socialColorPicker"
                                    value="{{ $styles['social_color'] ?? '#ffffff' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] text-slate-500 font-bold uppercase">Social Hover</label>
                            <div
                                class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                <input type="color" id="socialHoverColorPicker"
                                    value="{{ $styles['social_hover_color'] ?? '#0f172a' }}"
                                    class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Appearance Styles -->
                <div class="space-y-6 pt-6 border-t border-slate-100">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">TYPOGRAPHY & LAYOUT</h3>

                    <div class="space-y-5">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center px-0.5">
                                <label class="text-[12px] text-slate-600">Title Size</label>
                                <span class="text-[11px] font-medium text-indigo-500"
                                    id="titleSizeValue">{{ $styles['title_size'] ?? 48 }}px</span>
                            </div>
                            <input type="range" id="titleSizeSlider" min="24" max="80"
                                value="{{ $styles['title_size'] ?? 48 }}"
                                class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>

                        <div class="space-y-3">
                            <div class="flex justify-between items-center px-0.5">
                                <label class="text-[12px] text-slate-600">Subtitle Size</label>
                                <span class="text-[11px] font-medium text-indigo-500"
                                    id="subtitleSizeValue">{{ $styles['subtitle_size'] ?? 18 }}px</span>
                            </div>
                            <input type="range" id="subtitleSizeSlider" min="14" max="32"
                                value="{{ $styles['subtitle_size'] ?? 18 }}"
                                class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>

                        <div class="space-y-3">
                            <div class="flex justify-between items-center px-0.5">
                                <label class="text-[12px] text-slate-600">Section Padding</label>
                                <span class="text-[11px] font-medium text-indigo-500"
                                    id="paddingValue">{{ $styles['padding'] ?? 100 }}px</span>
                            </div>
                            <input type="range" id="paddingSlider" min="40" max="200"
                                value="{{ $styles['padding'] ?? 100 }}"
                                class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>

                        <div class="pt-2 space-y-3">
                            <div class="flex items-center justify-between w-full">
                                <span class="text-[11px] font-bold text-slate-500">Social Links</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="showSocialsToggle" class="sr-only peer" {{ ($styles['show_socials'] ?? true) === 'false' ? '' : 'checked' }}>
                                    <div
                                        class="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900">
                                    </div>
                                </label>
                            </div>

                            <div class="flex items-center justify-between w-full">
                                <span class="text-[11px] font-bold text-slate-500">Rounded Corners</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="roundedToggle" class="sr-only peer" {{ ($styles['rounded'] ?? 'rounded-xl') === 'rounded-xl' ? 'checked' : '' }}>
                                    <div
                                        class="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900">
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Changes Button -->
            <div class="p-6 border-t border-slate-100 bg-white">
                <button onclick="saveChanges()"
                    class="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 group">
                    <i class="fa-solid fa-check text-sm transition-transform group-hover:scale-110"></i>
                    Save Changes
                </button>
            </div>
        </aside>

        <!-- Main Preview Area -->
        <main class="flex-1 flex flex-col bg-white relative">
            <!-- Toolbar -->
            <div
                class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50 backdrop-blur-sm z-10 shrink-0">
                <div class="flex items-center gap-4">
                    <a href="{{ route('website.preview', $hero->id) }}" target="_blank"
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

                    <!-- Separator -->
                    <div class="h-6 w-px bg-slate-300 mx-2"></div>

                    <!-- Device Toggles -->
                    <div class="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button onclick="setDevice('desktop')" id="btn-desktop"
                            class="device-btn p-2 text-indigo-600 bg-indigo-50 rounded-md transition-all"
                            title="Desktop">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 17.25v-1.007c0-.197.105-.377.276-.474l.294-.156a2.013 2.013 0 001.03-1.758l-.002-8.36a2.013 2.013 0 00-1.996-2.012H9.398a2.013 2.013 0 00-1.996 2.012l-.002 8.36a2.013 2.013 0 001.03 1.758l.294.156c.17.097.276.277.276.474z" />
                            </svg>
                        </button>
                        <button onclick="setDevice('tablet')" id="btn-tablet"
                            class="device-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all"
                            title="Tablet (768px)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </button>
                        <button onclick="setDevice('mobile')" id="btn-mobile"
                            class="device-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all"
                            title="Mobile (375px)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <a href="{{ $hero->footerSection ? route('footer.generate', $hero->footerSection->id) : route('footer.create', $hero->id) }}"
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

                    <a href="{{ $hero->work ? route('work.generate', $hero->work->id) : route('work.create', $hero->id) }}"
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
            <div class="flex-1 overflow-auto relative p-8 flex flex-col items-center bg-slate-100">
                <div class="absolute inset-0 pointer-events-none opacity-5"
                    style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 24px 24px;">
                </div>

                <div id="preview-container"
                    class="w-full max-w-6xl transition-all duration-300 ease-out shadow-2xl bg-white mx-auto overflow-hidden relative">
                    <div class="contact-preview-content">
                        {!! $contact->generated_code !!}
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

                <div class="text-center text-xs text-slate-500 mt-6 font-mono z-10" id="size-label">Desktop - 100%</div>
            </div>
        </main>
    </div>

    @include('components.code-panel', [
        'generateEndpoint' => route('contact.generateCode', $contact->id),
        'regenerateEndpoint' => route('contact.generateCode', $contact->id),
        'canvasId' => 'preview-container',
        'needsGeneration' => $needsGeneration,
        'sectionLabel' => 'Contact'
    ])

    <script src="{{ asset('js/font-awesome-icons.js') }}"></script>
    <script>
        const token = document.querySelector('meta[name="csrf-token"]').content;
        const contactId = {{ $contact->id }};

        let _responsiveCssEl = null;

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const label = document.getElementById('size-label');
            const btns = document.querySelectorAll('.device-btn');
            const canvas = document.querySelector('.contact-preview-content');

            // Update UI Buttons
            btns.forEach(b => {
                b.classList.remove('active', 'text-indigo-600', 'bg-white', 'shadow-sm');
                b.classList.add('text-slate-400');
                b.classList.remove('bg-indigo-50');
            });
            const active = document.getElementById('btn-' + type);
            active.classList.add('active', 'text-indigo-600', 'bg-white', 'shadow-sm');
            active.classList.remove('text-slate-400');

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

                // Force responsive layout
                _responsiveCssEl.textContent = `
                    .contact-preview-content [class*="grid"] { 
                        grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important; 
                        gap: 1.5rem !important;
                    }
                    .contact-preview-content [class*="flex-row"] { 
                        flex-direction: column !important; 
                    }
                    .contact-preview-content section { 
                        padding-left: 1.5rem !important; 
                        padding-right: 1.5rem !important; 
                        word-break: break-word !important;
                        overflow-wrap: break-word !important;
                    }
                    .contact-preview-content h1, .contact-preview-content h2 {
                        font-size: ${type === 'mobile' ? '1.875rem' : '2.25rem'} !important;
                        line-height: 1.2 !important;
                    }
                    .contact-preview-content h3 {
                        font-size: ${type === 'mobile' ? '1.25rem' : '1.5rem'} !important;
                    }
                    .contact-preview-content .container {
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

        function setDisplayMode(mode) {
            document.getElementById('displayModeInput').value = mode;
            const fullBtn = document.getElementById('mode-full');
            const linkBtn = document.getElementById('mode-link');

            if (mode === 'full-section') {
                fullBtn.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
                fullBtn.classList.remove('text-slate-500');
                linkBtn.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
                linkBtn.classList.add('text-slate-500');
            } else {
                linkBtn.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
                linkBtn.classList.remove('text-slate-500');
                fullBtn.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
                fullBtn.classList.add('text-slate-500');
            }
            saveChanges(true);
        }
        let _saveDebounceTimer = null;

        // Apply color/style changes locally for instant visual feedback (zero latency)
        function applyStylesLocally() {
            const canvas = document.querySelector('.contact-preview-content');
            if (!canvas) return;
            const section = canvas.querySelector('section');
            if (!section) return;

            const bg = document.getElementById('bgColorPicker')?.value;
            const text = document.getElementById('textColorPicker')?.value;
            const btn = document.getElementById('btnColorPicker')?.value;
            const inputBg = document.getElementById('inputBgColorPicker')?.value;

            if (bg) section.style.backgroundColor = bg;
            if (text) section.querySelectorAll('h1,h2,h3,p,label,span:not(.sr-only)').forEach(el => el.style.color = text);
            if (btn) section.querySelectorAll('button[type="submit"],a.cta-btn,.btn-primary').forEach(el => el.style.backgroundColor = btn);
            if (inputBg) section.querySelectorAll('input,textarea').forEach(el => el.style.backgroundColor = inputBg);
        }

        function performSave(quiet) {
            const ctas = [];
            document.querySelectorAll('.cta-item').forEach(item => {
                const text = item.querySelector('.cta-text').value;
                const url = item.querySelector('.cta-url').value;
                if (text) ctas.push({ text, url });
            });

            const socials = [];
            document.querySelectorAll('.social-item').forEach(item => {
                const icon = item.querySelector('.social-icon').value;
                const url = item.querySelector('.social-url').value;
                if (url) socials.push({ icon, url });
            });

            const formFields = @json($contact->form_fields ?? ['email' => 'on', 'phone' => 'on', 'location' => 'on']);

            fetch(`/contact/${contactId}/update-design`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify({
                    title: document.getElementById('titleInput').value,
                    subtitle: document.getElementById('subtitleInput').value,
                    location: document.getElementById('locationInput').value,
                    phone_number: document.getElementById('phoneInput').value,
                    email_address: document.getElementById('emailInput').value,
                    form_fields: formFields,
                    ctas: ctas,
                    social_links: socials,
                    preview_only: quiet,
                    styles: {
                        bg_color: document.getElementById('bgColorPicker').value,
                        text_color: document.getElementById('textColorPicker').value,
                        input_bg_color: document.getElementById('inputBgColorPicker').value,
                        btn_color: document.getElementById('btnColorPicker').value,
                        show_socials: document.getElementById('showSocialsToggle').checked ? 'true' : 'false',
                        rounded: document.getElementById('roundedToggle').checked ? 'rounded-xl' : 'rounded-none',
                        title_size: document.getElementById('titleSizeSlider').value,
                        subtitle_size: document.getElementById('subtitleSizeSlider').value,
                        padding: document.getElementById('paddingSlider').value,
                        social_color: document.getElementById('socialColorPicker').value,
                        social_hover_color: document.getElementById('socialHoverColorPicker').value,
                        display_mode: document.getElementById('displayModeInput') ? document.getElementById('displayModeInput').value : 'full-section'
                    }
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.querySelector('.contact-preview-content').innerHTML = data.html;
                        if (!quiet) showNotification('Section updated!', 'success');
                    } else {
                        showNotification(data.message || 'Error saving changes', 'error');
                    }
                });
        }

        function saveChanges(quiet = false) {
            // Apply colors/styles locally for instant visual feedback
            applyStylesLocally();

            if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);

            if (!quiet) {
                // Save button clicked — fire immediately, no debounce
                performSave(false);
                return;
            }

            // Preview-only: debounce 300ms to avoid flooding server with requests
            _saveDebounceTimer = setTimeout(() => {
                performSave(true);
            }, 300);
        }

        function showNotification(msg, type) {
            const div = document.createElement('div');
            div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-2xl z-50 animate-fade-in-up ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
            div.textContent = msg;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }

        function copyCode() {
            const code = document.querySelector('.contact-preview-content').innerHTML;
            navigator.clipboard.writeText(code).then(() => showNotification('Code copied!', 'success'));
        }

        // Auto-save & Slider Labels
        const sliders = [
            { id: 'titleSizeSlider', label: 'titleSizeValue', suffix: 'px' },
            { id: 'subtitleSizeSlider', label: 'subtitleSizeValue', suffix: 'px' },
            { id: 'paddingSlider', label: 'paddingValue', suffix: 'px' }
        ];

        // Slider Labels update and auto-save
        sliders.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) {
                el.addEventListener('input', (e) => {
                    document.getElementById(s.label).textContent = e.target.value + s.suffix;
                    saveChanges(true);
                });
            }
        });

        // Add real-time listeners for all text inputs and color pickers
        const inputs = document.querySelectorAll('.control-input, input[type="color"], input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => saveChanges(true));
        });

        // Dynamic Editors functions
        function addCTARow() {
            const container = document.getElementById('ctas-editor');
            const index = container.querySelectorAll('.cta-item').length;
            const div = document.createElement('div');
            div.className = 'cta-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group';
            div.dataset.index = index;
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Button ${index + 1}</span>
                    <button type="button" onclick="removeCTA(${index})" class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
                <input type="text" class="cta-text control-input text-xs" placeholder="Button Text" oninput="saveChanges(true)">
                <input type="text" class="cta-url control-input text-xs" placeholder="URL" oninput="saveChanges(true)">
            `;
            container.appendChild(div);
            // Scroll to the bottom of the sidebar if needed
        }

        function removeCTA(index) {
            const item = document.querySelector(`.cta-item[data-index="${index}"]`);
            if (item) {
                item.remove();
                saveChanges(true);
            }
        }

        function addSocialRow() {
            const container = document.getElementById('socials-editor');
            const index = container.querySelectorAll('.social-item').length;
            const div = document.createElement('div');
            div.className = 'social-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group';
            div.dataset.index = index;
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Social ${index + 1}</span>
                    <button type="button" onclick="removeSocial(${index})" class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
                <div class="relative">
                    <select class="social-icon control-input text-xs pl-8" onchange="updateSocialIcon(this); saveChanges(true)">
                        <option value="fab fa-facebook">Facebook</option>
                        <option value="fab fa-twitter">Twitter</option>
                        <option value="fab fa-x-twitter">X (Twitter)</option>
                        <option value="fab fa-instagram">Instagram</option>
                        <option value="fab fa-threads">Threads</option>
                        <option value="fab fa-linkedin">LinkedIn</option>
                        <option value="fab fa-whatsapp">WhatsApp</option>
                        <option value="fab fa-telegram">Telegram</option>
                        <option value="fab fa-tiktok">TikTok</option>
                        <option value="fab fa-github">GitHub</option>
                        <option value="fab fa-youtube">YouTube</option>
                    </select>
                    <i class="fab fa-facebook absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500 text-xs shadow-sm"></i>
                </div>
                <input type="text" class="social-url control-input text-xs" placeholder="URL" oninput="saveChanges(true)">
            `;
            container.appendChild(div);
        }

        function removeSocial(index) {
            const item = document.querySelector(`.social-item[data-index="${index}"]`);
            if (item) {
                item.remove();
                saveChanges(true);
            }
        }

        function updateSocialIcon(select) {
            const icon = select.parentElement.querySelector('i');
            icon.className = select.value + ' absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500 text-xs shadow-sm';
        }

        // Simplified Display Mode Toggle Observer
        const modeToggle = document.getElementById('displayModeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', function () {
                document.getElementById('displayModeInput').value = this.checked ? 'full-section' : 'link-only';
            });
        }

        async function fillWithAI() {
            const btn = document.getElementById('ai-btn');
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;

            try {
                const response = await fetch('/ai/placeholder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                    body: JSON.stringify({ section: 'contact', portfolio_type: 'developer' })
                });
                const data = await response.json();
                if (data.success && data.suggestion) {
                    document.getElementById('titleInput').value = data.suggestion.title || '';
                    document.getElementById('subtitleInput').value = data.suggestion.subtitle || '';
                    if (data.suggestion.location) document.getElementById('locationInput').value = data.suggestion.location;
                    if (data.suggestion.phone) document.getElementById('phoneInput').value = data.suggestion.phone;
                    if (data.suggestion.email) document.getElementById('emailInput').value = data.suggestion.email;

                    showNotification('AI content generated! Visualizing...', 'success');
                    saveChanges(true); // Preview only
                }
            } catch (e) {
                showNotification('AI generation failed', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    </script>
</body>

</html>