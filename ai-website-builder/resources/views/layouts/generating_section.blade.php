<x-app-layout>
    <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        
        <div class="w-full max-w-4xl">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4 shadow-inner">
                    <i class="fa-solid fa-wand-magic-sparkles text-2xl text-indigo-600 animate-pulse"></i>
                </div>
                <h1 class="text-2xl font-bold text-slate-800">Generating {{ $sectionName }} Section</h1>
                <p class="text-slate-500 mt-2 flex items-center justify-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span id="status-text">Connecting to AI model...</span>
                </p>
            </div>

            <!-- Code Window -->
            <div class="bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden border border-slate-800 transform transition-all duration-500">
                <!-- Mac-like Header -->
                <div class="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-rose-500"></div>
                        <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div class="text-xs text-slate-500 font-mono flex items-center gap-2">
                        <i class="fa-solid fa-code"></i> generated_code.html
                    </div>
                    <div class="w-16"></div> <!-- Spacer for balance -->
                </div>

                <!-- Terminal Content -->
                <div class="relative h-[60vh] max-h-[600px] overflow-y-auto p-6 font-mono text-sm leading-relaxed text-indigo-200">
                    <pre><code id="code-output" class="whitespace-pre-wrap break-all"></code></pre>
                    <!-- Blinking Cursor -->
                    <span id="typing-cursor" class="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle"></span>
                </div>
            </div>
        </div>

    </div>

    <style>
        @keyframes fadeUpWord {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .ai-word {
            display: inline-block;
            opacity: 0;
            animation: fadeUpWord 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const statusText = document.getElementById('status-text');
            const codeOutput = document.getElementById('code-output');
            const typingCursor = document.getElementById('typing-cursor');
            
            try {
                // Step 1: Fetch the code from the server
                statusText.textContent = "AI is thinking and generating code...";
                
                const response = await fetch("{{ $apiEndpoint }}", {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();

                if (!data.success || !data.code) {
                    throw new Error(data.error || data.message || "Failed to generate code");
                }

                statusText.textContent = "Writing code...";
                statusText.previousElementSibling.classList.replace('bg-emerald-500', 'bg-indigo-500');

                // Step 2: Escape HTML for safe display
                const escapeHTML = (str) => {
                    return str.replace(/[&<>'"]/g, 
                        tag => ({
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            "'": '&#39;',
                            '"': '&quot;'
                        }[tag] || tag)
                    );
                };

                const rawCode = data.code;
                const escapedCode = escapeHTML(rawCode);
                
                // Step 3: Split into tokens (words and spaces/newlines) to preserve formatting exactly
                const tokens = escapedCode.split(/(\s+)/);
                
                let delay = 0;
                const container = document.getElementById('code-output');
                
                // We will append chunks in batches to avoid locking the UI, 
                // but use CSS animations to give that "fade up by words" feel.
                
                const typeTokens = async () => {
                    for (let i = 0; i < tokens.length; i++) {
                        const token = tokens[i];
                        if (!token) continue;
                        
                        if (/^\s+$/.test(token)) {
                            // It's whitespace (space, newline), just append text node directly
                            container.appendChild(document.createTextNode(token));
                        } else {
                            // It's a word/symbol, wrap in span for animation
                            const span = document.createElement('span');
                            span.className = 'ai-word';
                            span.innerHTML = token;
                            container.appendChild(span);
                            
                            // Await a tiny fraction to simulate typing speed
                            if (i % 3 === 0) {
                                await new Promise(r => setTimeout(r, 10)); // 10ms delay every 3 tokens
                                // Scroll to bottom
                                container.parentElement.parentElement.scrollTop = container.parentElement.parentElement.scrollHeight;
                            }
                        }
                    }
                };

                await typeTokens();

                // Finish
                typingCursor.classList.remove('animate-pulse');
                typingCursor.style.display = 'none';
                statusText.textContent = "Generation complete! Redirecting to preview...";
                statusText.previousElementSibling.classList.replace('bg-indigo-500', 'bg-emerald-500');

                setTimeout(() => {
                    window.location.href = "{{ $previewEndpoint }}";
                }, 1000);

            } catch (error) {
                console.error(error);
                statusText.textContent = "Error: " + error.message;
                statusText.classList.add('text-rose-500');
                statusText.previousElementSibling.classList.replace('bg-emerald-500', 'bg-rose-500');
                typingCursor.style.display = 'none';
            }
        });
    </script>
</x-app-layout>
