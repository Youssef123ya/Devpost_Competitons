<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Footer Preview Editor</title>
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


                    <!-- Content Group -->
                    <div class="space-y-4">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">CONTENT</h3>
                        <div class="space-y-3">
                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Footer
                                    Title</label>
                                <input type="text" id="footerTitleInput" value="{{ $footer->title }}"
                                    class="control-input">
                            </div>
                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Slogan
                                    / Tagline</label>
                                <textarea id="footerSloganInput"
                                    class="control-input min-h-[100px]">{{ $footer->slogan }}</textarea>
                            </div>
                        </div>
                    </div>



                    <!-- Colors Group -->
                    <div class="space-y-6 pt-6 border-t border-slate-100">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">COLORS</h3>
                        @php $styles = $footer->custom_styles ?? []; @endphp
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label
                                    class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Background</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="bgColorPicker"
                                        value="{{ $styles['bg_color'] ?? '#ffffff' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <label
                                    class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Title</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="titleColorPicker"
                                        value="{{ $styles['title_color'] ?? '#111827' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <label
                                    class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Slogan</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="sloganColorPicker"
                                        value="{{ $styles['slogan_color'] ?? '#4b5563' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <label
                                    class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Links</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="linkColorPicker"
                                        value="{{ $styles['link_color'] ?? '#6366f1' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                            <div class="space-y-1.5 col-span-2">
                                <label
                                    class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Social
                                    Icons / Icons</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2">
                                    <input type="color" id="iconColorPicker"
                                        value="{{ $styles['icon_color'] ?? '#6366f1' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer rounded">
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">HEX</span>
                                </div>
                            </div>
                        </div>
                    </div>



                    <!-- Links Group -->
                    <div class="space-y-4 pt-6 border-t border-slate-100">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">QUICK LINKS</h3>
                        <div id="links-editor" class="space-y-3">
                            @foreach(($footer->links ?? []) as $index => $link)
                                <div class="link-item group p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link
                                            #{{ $index + 1 }}</span>
                                        <button type="button"
                                            onclick="this.closest('.link-item').remove(); saveChanges(true);"
                                            class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                    <div class="space-y-2">
                                        <input type="text" value="{{ $link['text'] ?? '' }}" placeholder="Text"
                                            class="control-input text-xs link-text">
                                        <input type="text" value="{{ $link['url'] ?? '' }}" placeholder="URL"
                                            class="control-input text-[10px] link-url">
                                    </div>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" onclick="addLink()"
                            class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                            <i class="fa-solid fa-plus text-xs"></i> Add New Link
                        </button>
                    </div>

                    <!-- Socials Group -->
                    <div class="space-y-4 pt-6 border-t border-slate-100 pb-12">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SOCIALS</h3>
                        <div id="socials-editor" class="space-y-3">
                            @foreach(($footer->social_links ?? []) as $index => $social)
                                <div class="social-item group p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social
                                            #{{ $index + 1 }}</span>
                                        <button type="button"
                                            onclick="this.closest('.social-item').remove(); saveChanges(true);"
                                            class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <i class="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                    <div class="space-y-2">
                                        <select class="control-input text-xs social-icon">
                                            <option value="fab fa-facebook" {{ strpos($social['icon'] ?? '', 'facebook') !== false ? 'selected' : '' }}>Facebook</option>
                                            <option value="fab fa-instagram" {{ strpos($social['icon'] ?? '', 'instagram') !== false ? 'selected' : '' }}>Instagram</option>
                                            <option value="fab fa-twitter" {{ strpos($social['icon'] ?? '', 'twitter') !== false ? 'selected' : '' }}>Twitter</option>
                                            <option value="fab fa-linkedin" {{ strpos($social['icon'] ?? '', 'linkedin') !== false ? 'selected' : '' }}>LinkedIn</option>
                                            <option value="fab fa-github" {{ strpos($social['icon'] ?? '', 'github') !== false ? 'selected' : '' }}>GitHub</option>
                                        </select>
                                        <input type="text" value="{{ $social['url'] ?? '' }}" placeholder="Profile URL"
                                            class="control-input text-[10px] social-url">
                                    </div>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" onclick="addSocial()"
                            class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                            <i class="fa-solid fa-plus text-xs"></i> Add New Social
                        </button>
                    </div>
                </div>

                <!-- Save Action -->
                <div class="p-6 border-t border-slate-100 bg-white">
                    <button onclick="saveChanges()"
                        class="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 group">
                        <i class="fa-solid fa-check text-sm transition-transform group-hover:scale-110"></i> Save Design
                    </button>
                </div>
            </aside>

            <!-- Main Preview Area -->
            <main class="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
                <!-- Toolbar -->
                <div
                    class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-30">
                    <div class="flex items-center gap-4">
                        <!-- Live Preview Pill -->
                        <a href="{{ route('website.preview', $footer->hero_id) }}" target="_blank"
                            class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 rounded-full border border-slate-200 group transition-all">
                            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span class="text-xs text-slate-600 font-medium tracking-tight">Live Preview</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor"
                                class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </a>

                        <div class="h-6 w-px bg-slate-200 mx-1"></div>

                        <!-- Device Toggles -->
                        <div class="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button onclick="setDevice('desktop')" id="btn-desktop"
                                class="device-btn p-2 text-indigo-600 bg-indigo-50 rounded-md transition-all">
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
                        <a href="/dashboard"
                            class="flex items-center gap-2 px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 font-medium">
                            <span>Next Section</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </a>

                        <button onclick="copyCode()"
                            class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-4 h-4 text-slate-500">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                            </svg>
                            <span>Copy Code</span>
                        </button>

                        <form action="{{ route('footer.regenerate', $footer->id) }}" method="POST" class="inline">
                            @csrf
                            <button type="submit"
                                class="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                <span>Regenerate</span>
                            </button>
                        </form>

                        <a href="{{ $footer->hero->contactSection ? route('contact.generate', $footer->hero->contactSection->id) : route('contact.create', $footer->hero_id) }}"
                            class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-4 h-4 text-slate-500">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            <span>Back</span>
                        </a>
                    </div>
                </div>

                <!-- Preview Area -->
                <div
                    class="flex-1 overflow-auto p-12 flex flex-col items-center bg-slate-100 relative custom-scrollbar">
                    <div class="absolute inset-0 pointer-events-none opacity-[0.05]"
                        style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 24px 24px;">
                    </div>
                    <div id="preview-container"
                        class="w-full max-w-7xl shrink-0 transition-all duration-500 ease-out shadow-2xl bg-white mx-auto overflow-hidden relative border border-slate-200 rounded-lg">
                        <div class="footer-preview-content relative z-10 w-full min-h-[500px]">
                            @include('footer.preview-content')
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        const token = document.querySelector('meta[name="csrf-token"]').content;
        const footerId = {{ $footer->id }};
        const navbarLinks = @json($navbarLinks ?? []);

        if (document.readyState !== 'loading') {
            attachEditListeners();
        } else {
            document.addEventListener('DOMContentLoaded', attachEditListeners);
        }

        function attachEditListeners() {
            const inputs = ['footerTitleInput', 'footerSloganInput', 'bgColorPicker', 'titleColorPicker', 'sloganColorPicker', 'linkColorPicker', 'iconColorPicker'];
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', (e) => {
                    saveChanges(true);
                });
            });
            document.addEventListener('input', (e) => {
                if (e.target.classList.contains('link-text') || e.target.classList.contains('link-url') || e.target.classList.contains('social-icon') || e.target.classList.contains('social-url')) {
                    saveChanges(true);
                }
            });

            @if($needsGeneration)
                // Automatically generate and save the initial HTML so it isn't null for full previews
                setTimeout(() => saveChanges(true), 500);
            @endif
        }



        function addLink() {
            const container = document.getElementById('links-editor');
            const count = container.querySelectorAll('.link-item').length + 1;
            const div = document.createElement('div');
            div.className = 'link-item group p-3 bg-slate-50 border border-slate-200 rounded-xl';
            div.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link #${count}</span>
                    <button type="button" onclick="this.closest('.link-item').remove(); saveChanges(true);" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    <input type="text" placeholder="Text" class="control-input text-xs link-text">
                    <input type="text" placeholder="URL" class="control-input text-[10px] link-url">
                </div>`;
            container.appendChild(div);
            saveChanges(true);
        }

        function addSocial() {
            const container = document.getElementById('socials-editor');
            const count = container.querySelectorAll('.social-item').length + 1;
            const div = document.createElement('div');
            div.className = 'social-item group p-3 bg-slate-50 border border-slate-200 rounded-xl';
            div.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social #${count}</span>
                    <button type="button" onclick="this.closest('.social-item').remove(); saveChanges(true);" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    <select class="control-input text-xs social-icon"><option value="fab fa-facebook">Facebook</option><option value="fab fa-instagram">Instagram</option><option value="fab fa-twitter">Twitter</option><option value="fab fa-linkedin">LinkedIn</option><option value="fab fa-github">GitHub</option></select>
                    <input type="text" placeholder="Profile URL" class="control-input text-[10px] social-url">
                </div>`;
            container.appendChild(div);
            saveChanges(true);
        }

        function saveChanges(quiet = false) {
            const links = Array.from(document.querySelectorAll('#links-editor > div')).map(el => ({
                text: el.querySelector('.link-text').value,
                url: el.querySelector('.link-url').value
            }));
            const socials = Array.from(document.querySelectorAll('#socials-editor > div')).map(el => ({
                icon: el.querySelector('.social-icon').value,
                url: el.querySelector('.social-url').value
            }));

            const body = {
                title: document.getElementById('footerTitleInput').value,
                slogan: document.getElementById('footerSloganInput').value,
                links,
                social_links: socials,
                preview_only: quiet,
                styles: {
                    bg_color: document.getElementById('bgColorPicker').value,
                    title_color: document.getElementById('titleColorPicker').value,
                    slogan_color: document.getElementById('sloganColorPicker').value,
                    link_color: document.getElementById('linkColorPicker').value,
                    icon_color: document.getElementById('iconColorPicker').value
                }
            };

            fetch(`{{ route('footer.saveChanges', $footer->id) }}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify(body)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (data.preview_html) {
                            document.querySelector('.footer-preview-content').innerHTML = data.preview_html;
                        }
                        if (!quiet) {
                            showNotification('Design Saved!', 'success');
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    }
                });
        }

        let _responsiveCssEl = null;

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const btns = document.querySelectorAll('.device-btn');
            const canvas = document.querySelector('.footer-preview-content');

            // Update UI Buttons
            btns.forEach(b => {
                b.classList.remove('active', 'text-indigo-600', 'bg-indigo-50', 'bg-white', 'shadow-sm');
                b.classList.add('text-slate-400');
            });
            const active = document.getElementById('btn-' + type);
            active.classList.add('active', 'text-indigo-600', 'bg-indigo-50', 'shadow-sm');
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

                // Force responsive layout
                _responsiveCssEl.textContent = `
                    .footer-preview-content [class*="grid"] { 
                        grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important; 
                        gap: 1.5rem !important;
                    }
                    .footer-preview-content [class*="flex-row"] { 
                        flex-direction: column !important; 
                    }
                    .footer-preview-content section { 
                        padding-left: 1.5rem !important; 
                        padding-right: 1.5rem !important; 
                        word-break: break-word !important;
                        overflow-wrap: break-word !important;
                    }
                    .footer-preview-content h1, .footer-preview-content h2 {
                        font-size: ${type === 'mobile' ? '1.875rem' : '2.25rem'} !important;
                        line-height: 1.2 !important;
                    }
                    .footer-preview-content h3 {
                        font-size: ${type === 'mobile' ? '1.25rem' : '1.5rem'} !important;
                    }
                    .footer-preview-content .container {
                        max-width: 100% !important;
                        padding: 0 !important;
                    }
                `;
            } else {
                container.style.width = '100%';
                container.style.borderRadius = '8px';
                container.style.border = '1px solid #e2e8f0';
                _responsiveCssEl.textContent = ''; // Clear overrides
            }

            setTimeout(() => container.classList.remove('transition-all'), 600);
        }

        function showNotification(msg, type) {
            const div = document.createElement('div');
            div.className = `fixed bottom-6 right-6 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-2xl z-50 transition-all ${type === 'success' ? 'bg-indigo-600' : 'bg-red-600'}`;
            div.textContent = msg; document.body.appendChild(div); setTimeout(() => div.remove(), 2500);
        }

        function copyCode() {
            const html = document.querySelector('.footer-preview-content').innerHTML;
            navigator.clipboard.writeText(html.trim()).then(() => showNotification('Code copied!', 'success'));
        }


    </script>
</body>

</html>