<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Full Website Preview</title>
    @vite('resources/css/app.css')
    <script src="/js/tailwind.js"></script>
</head>
<body class="bg-slate-900">
    <div class="flex flex-col h-screen bg-slate-900">
        <!-- Toolbar -->
        <div class="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 z-10 shrink-0">
            <div class="flex items-center gap-4">
                <a href="{{ route('dashboard') }}" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fa-solid fa-wand-magic-sparkles text-xs"></i> Create with AI
                    </button>
                </form>
                
                <a href="{{ route('dashboard') }}" class="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                    Done
                </a>
            </div>
        </div>

        <!-- Preview Area -->
        <div class="flex-1 overflow-hidden bg-slate-200/50 flex flex-col justify-center py-4 relative">
             <!-- Dotted Pattern Background -->
            <div class="absolute inset-0 z-0 opacity-10" style="background-image: radial-gradient(#64748b 1px, transparent 1px); background-size: 20px 20px;"></div>
            
            <div id="preview-container" class="relative z-10 w-full h-full bg-white transition-all duration-300 ease-out shadow-2xl mx-auto overflow-hidden">
                <iframe 
                    id="preview-frame" 
                    class="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts"
                ></iframe>

                <!-- Resize Handles -->
                <div class="resize-handle resizer-r absolute right-0 top-0 w-3 h-full cursor-ew-resize hover:bg-indigo-500/20 hover:scale-x-150 transition-all z-20" style="cursor: col-resize;"></div>
                <div class="resize-handle resizer-b absolute bottom-0 left-0 w-full h-3 cursor-ns-resize hover:bg-indigo-500/20 hover:scale-y-150 transition-all z-20" style="cursor: row-resize;"></div>
                <div class="resize-handle resizer-rb absolute right-0 bottom-0 w-6 h-6 cursor-nwse-resize hover:bg-indigo-500/20 hover:scale-125 transition-all z-30 flex items-center justify-center" style="cursor: nwse-resize;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none" class="text-slate-400">
                        <path d="M9 1V9H1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                
                <!-- Overlay to catch events when dragging over iframe -->
                <div id="drag-overlay" class="absolute inset-0 z-10 hidden"></div>
            </div>
            
            <div class="text-center text-xs text-slate-500 mt-2 font-mono" id="size-label">
                Desktop - 100%
            </div>
        </div>
    </div>

    <!-- Code Modal -->
    <div id="codeModal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="toggleCodeModal()"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
                <h3 class="text-white font-semibold">Generated Code</h3>
                <button onclick="toggleCodeModal()" class="text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-0 overflow-auto max-h-[600px]">
                <pre class="p-6 text-sm font-mono text-slate-300 bg-slate-900"><code id="generatedCode">{{ $fullWebsite->generated_code }}</code></pre>
            </div>
            <div class="px-6 py-4 border-t border-slate-700 bg-slate-900 flex justify-end">
                <button onclick="copyCodeToClipboard()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                    Copy to Clipboard
                </button>
            </div>
        </div>
    </div>

    <!-- Success/Error Messages -->
    @if(session('success'))
        <div id="toast" class="fixed bottom-4 right-4 px-6 py-3 bg-green-600 text-white rounded-lg shadow-xl z-50 animate-fade-in-up">
            {{ session('success') }}
        </div>
    @endif

    @if(session('error'))
        <div id="toast" class="fixed bottom-4 right-4 px-6 py-3 bg-red-600 text-white rounded-lg shadow-xl z-50 animate-fade-in-up">
            {{ session('error') }}
        </div>
    @endif

    <script>
        // Load generated code into iframe
        const iframe = document.getElementById('preview-frame');
        const code = @json($fullWebsite->generated_code);
        
        iframe.onload = function() {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(code);
            doc.close();
        };
        
        // Trigger initial load
        iframe.src = 'about:blank';

        function copyCode() {
            toggleCodeModal();
        }

        function toggleCodeModal() {
            const modal = document.getElementById('codeModal');
            modal.classList.toggle('hidden');
        }

        function copyCodeToClipboard() {
            const code = document.getElementById('generatedCode').textContent;
            navigator.clipboard.writeText(code).then(() => {
                showNotification('Code copied to clipboard!', 'success');
                toggleCodeModal();
            }).catch(err => {
                showNotification('Failed to copy code', 'error');
            });
        }

        function showNotification(msg, type) {
            const div = document.createElement('div');
            div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white shadow-xl z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
            div.textContent = msg;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }

        // Resizing Logic
        let isResizing = false;
        let currentResizer = null;
        const container = document.getElementById('preview-container');
        const overlay = document.getElementById('drag-overlay');
        const label = document.getElementById('size-label');

        container.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                currentResizer = e.target;
                overlay.classList.remove('hidden');
                container.classList.remove('transition-all', 'duration-300', 'ease-out');
                
                // Clear active device button state
                document.querySelectorAll('.device-btn').forEach(btn => {
                    btn.classList.remove('bg-slate-700', 'text-white');
                    btn.classList.add('text-slate-400');
                });
                
                document.body.style.cursor = window.getComputedStyle(e.target).cursor;
            }
        });

        window.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const rect = container.getBoundingClientRect();
            let newWidth, newHeight;

            if (currentResizer.classList.contains('resizer-r')) {
                newWidth = e.clientX - rect.left;
                container.style.width = `${newWidth}px`;
            } else if (currentResizer.classList.contains('resizer-b')) {
                newHeight = e.clientY - rect.top;
                container.style.height = `${newHeight}px`;
            } else if (currentResizer.classList.contains('resizer-rb')) {
                newWidth = e.clientX - rect.left;
                newHeight = e.clientY - rect.top;
                container.style.width = `${newWidth}px`;
                container.style.height = `${newHeight}px`;
            }

            // Update label
            const w = Math.round(container.offsetWidth);
            const h = Math.round(container.offsetHeight);
            label.textContent = `Custom - ${w}px x ${h}px`;
        });

        window.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                overlay.classList.add('hidden');
                document.body.style.cursor = 'default';
                // Add transitions back after manual resize is done
                setTimeout(() => {
                    container.classList.add('transition-all', 'duration-300', 'ease-out');
                }, 50);
            }
        });

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const label = document.getElementById('size-label');
            const btns = {
                desktop: document.getElementById('btn-desktop'),
                tablet: document.getElementById('btn-tablet'),
                mobile: document.getElementById('btn-mobile')
            };

            // Reset buttons
            Object.values(btns).forEach(btn => {
                btn.classList.remove('bg-slate-700', 'text-white');
                btn.classList.add('text-slate-400');
            });

            // Activate current
            btns[type].classList.add('bg-slate-700', 'text-white');
            btns[type].classList.remove('text-slate-400');

            // Reset height to fill when switching devices
            container.style.height = '100%';

            if (type === 'mobile') {
                container.style.width = '375px';
                container.style.borderRadius = '30px';
                container.style.border = '8px solid #334155';
                label.textContent = 'Mobile - 375px';
            } else if (type === 'tablet') {
                container.style.width = '768px';
                container.style.borderRadius = '12px';
                container.style.border = 'none';
                label.textContent = 'Tablet - 768px';
            } else {
                container.style.width = '100%';
                container.style.borderRadius = '0';
                container.style.border = 'none';
                label.textContent = 'Desktop - 100%';
            }
        }

        // Auto-hide toast messages
        const toast = document.getElementById('toast');
        if (toast) {
            setTimeout(() => toast.remove(), 3000);
        }
    </script>

    <style>
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out;
        }
    </style>
    <script>
        // Inject global CSS into iframe to force navbar background if needed
        // Scoped to #section-navbar only to avoid overriding hero background images and padding
        iframe.addEventListener('load', function() {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const style = doc.createElement('style');
            style.innerHTML = `
                #section-navbar nav, #section-navbar header {
                    background-color: rgba(255, 255, 255, 0.8) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.5) !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                }
            `;
            doc.head.appendChild(style);
        });
    </script>
</body>
</html>
