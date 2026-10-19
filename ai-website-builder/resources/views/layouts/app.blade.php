<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
        
        <!-- FontAwesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

        <!-- Scripts -->
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            <script src="/js/tailwind.js"></script>
        @endif
    </head>
    <body class="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <!-- Navbar -->
        <x-navbar />

        <!-- Page Content with Top Padding -->
        <main class="pt-24">
            {{ $slot ?? '' }}
            @yield('content')
        </main>

        <!-- AI Typing Overlay Modal — Site-Themed Light Design -->
        <style>
            #ai-typing-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 99999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background-color: rgba(15, 23, 42, 0.55) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
                scale: 1.5;
            }
            .ai-modal-card {
                box-shadow: 0 25px 60px -12px rgba(99, 102, 241, 0.18), 0 8px 24px -8px rgba(0,0,0,0.12) !important;
            }
            .ai-custom-scrollbar::-webkit-scrollbar { width: 5px; }
            .ai-custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
            .ai-custom-scrollbar::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 8px; }
            .ai-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #818cf8; }
            @keyframes ai-bar-anim {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(200%); }
                100% { transform: translateX(-100%); }
            }
            .ai-bar-running { animation: ai-bar-anim 1.8s infinite ease-in-out; }
            @keyframes ai-shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
            }
            .ai-label-shimmer {
                background: linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #6366f1 100%);
                background-size: 200% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: ai-shimmer 2s linear infinite;
            }
            @keyframes ai-dot-bounce {
                0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                40% { transform: translateY(-6px); opacity: 1; }
            }
            .ai-dot-1 { animation: ai-dot-bounce 1.2s ease-in-out infinite; }
            .ai-dot-2 { animation: ai-dot-bounce 1.2s ease-in-out 0.2s infinite; }
            .ai-dot-3 { animation: ai-dot-bounce 1.2s ease-in-out 0.4s infinite; }
        </style>
        <div id="ai-typing-modal" class="opacity-0 pointer-events-none">
            <div class="relative w-full max-w-xl mx-4 bg-white border border-slate-200 rounded-2xl overflow-hidden transform scale-95 transition-all duration-300 ai-modal-card">

                <!-- Gradient Header Strip matching the site's indigo/purple palette -->
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center gap-3">
                    <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white">
                        <i class="fa-solid fa-wand-magic-sparkles text-base animate-pulse"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            AI Assistant
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/20 text-white/90">FREE</span>
                        </h3>
                        <p id="ai-typing-status" class="text-xs text-indigo-100 font-medium flex items-center gap-1.5 mt-0.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                            Initializing...
                        </p>
                    </div>
                    <!-- Animated dots on header -->
                    <div class="flex items-center gap-1.5 pr-1">
                        <span class="w-2 h-2 rounded-full bg-white/40 ai-dot-1"></span>
                        <span class="w-2 h-2 rounded-full bg-white/40 ai-dot-2"></span>
                        <span class="w-2 h-2 rounded-full bg-white/40 ai-dot-3"></span>
                    </div>
                </div>

                <!-- Content Area — matches form card style -->
                <div class="px-6 pt-5 pb-2">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[220px] max-h-[320px] overflow-y-auto ai-custom-scrollbar">
                        <!-- Typewriter output / loading output -->
                        <div id="ai-typing-output" class="space-y-3 text-sm leading-relaxed">
                            <!-- Content gets loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Footer / Action -->
                <div class="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                    <p class="text-[11px] text-slate-400 font-medium">Powered by OpenRouter AI</p>
                    <div class="flex gap-2">
                        <button id="ai-typing-cancel" class="hidden px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            /**
             * Safe AI fetch — always returns a JSON-compatible object even if the
             * server crashes and returns an HTML error page (PHP timeout, 500, etc.)
             */
            async function safeAiFetch(url, options = {}) {
                const response = await fetch(url, options);
                const contentType = response.headers.get('content-type') || '';

                // Server returned HTML (error page / timeout crash)
                if (!contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Server returned non-JSON:', text.slice(0, 300));

                    if (response.status === 504 || response.status === 0 || !response.ok) {
                        return { success: false, message: 'Request timed out — the AI is busy. Please try again in a few seconds.' };
                    }
                    return { success: false, message: `Server error (${response.status}). Please try again.` };
                }

                return response.json();
            }

            const AiTypingModal = {
                modal: null,
                statusEl: null,
                outputEl: null,
                skipBtn: null,
                applyBtn: null,
                isTyping: false,
                skipRequested: false,
                activeTimers: [],

                init() {
                    this.modal = document.getElementById('ai-typing-modal');
                    this.statusEl = document.getElementById('ai-typing-status');
                    this.outputEl = document.getElementById('ai-typing-output');
                    this.cancelBtn = document.getElementById('ai-typing-cancel');

                    if (this.cancelBtn) {
                        this.cancelBtn.addEventListener('click', () => this.cancel());
                    }
                },

                show(status = "Generating copy...") {
                    if (!this.modal) this.init();
                    if (!this.modal) return;

                    this.statusEl.innerHTML = `<span class="relative flex h-2 w-2 mr-1"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span> ${status}`;
                    this.outputEl.innerHTML = '';
                    if (this.cancelBtn) this.cancelBtn.classList.add('hidden');
                    this.isTyping = true;
                    this.cancelRequested = false;
                    this.clearTimers();

                    this.modal.classList.remove('opacity-0', 'pointer-events-none');
                    this.modal.classList.add('opacity-100', 'pointer-events-auto');
                    this.modal.firstElementChild.classList.remove('scale-95');
                    this.modal.firstElementChild.classList.add('scale-100');

                    // Show loader immediately
                    this.showTerminalLoading();
                },

                hide() {
                    if (!this.modal) return;
                    this.modal.classList.remove('opacity-100', 'pointer-events-auto');
                    this.modal.classList.add('opacity-0', 'pointer-events-none');
                    this.modal.firstElementChild.classList.remove('scale-100');
                    this.modal.firstElementChild.classList.add('scale-95');
                    this.isTyping = false;
                    this.clearTimers();
                },

                clearTimers() {
                    this.activeTimers.forEach(t => clearTimeout(t));
                    this.activeTimers = [];
                },

                cancel() {
                    this.cancelRequested = true;
                    this.clearTimers();
                    this.hide();
                },

                showTerminalLoading() {
                    this.outputEl.innerHTML = `
                        <div class="space-y-3" id="ai-terminal-loader">
                            <div class="flex items-center gap-2.5 py-2 px-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                <span class="text-xs font-semibold text-indigo-600">Connected to AI — generating content...</span>
                            </div>
                            <div class="flex items-center gap-3 py-3 px-3 bg-white border border-slate-200 rounded-lg">
                                <svg class="animate-spin h-4 w-4 text-indigo-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span class="text-xs text-slate-500 font-medium">Synthesizing professional copy for your section...</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-1 overflow-hidden relative">
                                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full ai-bar-running absolute top-0 left-0 w-1/3"></div>
                            </div>
                        </div>
                    `;
                },

                showError(message) {
                    this.statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Failed — please try again`;
                    this.outputEl.innerHTML = `
                        <div class="space-y-3">
                            <div class="flex items-center gap-2 py-2 px-3 bg-rose-50 border border-rose-200 rounded-lg">
                                <svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span class="text-xs font-semibold text-rose-600">AI generation failed</span>
                            </div>
                            <p class="text-xs text-slate-500 leading-relaxed px-1">${message}</p>
                        </div>
                    `;
                    if (this.cancelBtn) this.cancelBtn.classList.add('hidden');
                    
                    // After error, let the user manually close it.
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = 'Close';
                    closeBtn.className = 'px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-all ml-auto';
                    closeBtn.onclick = () => this.hide();
                    
                    this.cancelBtn.parentElement.appendChild(closeBtn);
                    
                    // We remove it on next show
                    const oldClose = this.cancelBtn.parentElement.querySelectorAll('button:not(#ai-typing-cancel)');
                    oldClose.forEach((btn, i) => { if (i < oldClose.length - 1) btn.remove(); });
                },

                typeString(element, text, speed = 15) {
                    return new Promise((resolve) => {
                        let i = 0;
                        const type = () => {
                            if (this.cancelRequested) {
                                resolve();
                                return;
                            }
                            if (i < text.length) {
                                element.textContent += text.charAt(i);
                                i++;
                                const t = setTimeout(type, speed);
                                this.activeTimers.push(t);
                            } else {
                                resolve();
                            }
                        };
                        type();
                    });
                },

                async typeItems(items, onFinishedCallback) {
                    this.show("Writing content...");
                    
                    // Clear the loader first
                    this.outputEl.innerHTML = '';
                    if (this.cancelBtn) this.cancelBtn.classList.remove('hidden');
                    
                    for (const item of items) {
                        if (!item.text || this.cancelRequested) continue;

                        const sectionDiv = document.createElement('div');
                        sectionDiv.className = 'bg-white border border-slate-200 rounded-lg overflow-hidden';

                        const labelDiv = document.createElement('div');
                        labelDiv.className = 'px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5';
                        labelDiv.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span><span class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">${item.label}</span>`;
                        sectionDiv.appendChild(labelDiv);

                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'px-3 py-2.5 text-slate-700 text-xs leading-relaxed min-h-[2em] font-medium';
                        sectionDiv.appendChild(contentDiv);

                        this.outputEl.appendChild(sectionDiv);
                        this.outputEl.scrollTop = this.outputEl.scrollHeight;

                        if (this.cancelRequested) {
                            break;
                        } else {
                            sectionDiv.style.borderColor = '#a5b4fc'; // indigo-300 active
                            await this.typeString(contentDiv, item.text);
                            sectionDiv.style.borderColor = ''; // reset

                            // Fill instantly to background form field
                            if (item.targetEl && !this.cancelRequested) {
                                item.targetEl.value = item.text;
                                this.triggerInputHighlight(item.targetEl);
                            }
                        }
                    }

                    if (!this.cancelRequested) {
                        this.statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Done — content ready!`;
                        if (this.cancelBtn) this.cancelBtn.classList.add('hidden');

                        const applyAction = () => {
                            if (onFinishedCallback) onFinishedCallback();
                            this.hide();
                        };

                        // Automatically auto-apply and close after 1.2 seconds 
                        const autoApplyTimer = setTimeout(applyAction, 1200);
                        this.activeTimers.push(autoApplyTimer);
                    }
                },

                triggerInputHighlight(el) {
                    el.style.transition = 'background 0.3s, border-color 0.3s';
                    el.style.background = '#f0fdf4';
                    el.style.borderColor = '#86efac';
                    setTimeout(() => {
                        el.style.background = '';
                        el.style.borderColor = '';
                    }, 1000);
                }
            };
        </script>
    </body>
</html>
