<x-app-layout>
    <div class="bg-[#1e1e1e] min-h-screen text-green-500 font-mono p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="mb-6 flex items-center justify-between border-b border-green-800 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="ml-4 text-green-400 opacity-75">AI_GENERATOR --v2.0 --live</span>
                </div>
                <div class="text-xs text-green-600 animate-pulse">
                    PROCESSING_REQUEST...
                </div>
            </div>

            <!-- Terminal Window -->
            <div class="bg-black/50 rounded-lg backdrop-blur-sm border border-green-900/50 shadow-2xl overflow-hidden h-[80vh] flex flex-col relative">
                
                <!-- Status Bar -->
                <div class="bg-green-900/10 p-2 border-b border-green-900/30 text-xs flex justify-between items-center px-4">
                    <span>STATUS: <span id="status-text" class="text-yellow-400">CONNECTING...</span></span>
                    <span>TARGET: <span class="text-blue-400">{{ $fullWebsite->prompt }}</span></span>
                </div>

                <!-- Code Output Area -->
                <div id="terminal-content" class="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap outline-none selection:bg-green-500/30">
                    <span class="text-gray-500">Wait... initializing connection to neural network...</span><br>
                </div>
                
                <!-- Loading Cursor -->
                <div class="absolute bottom-6 right-6">
                    <span class="inline-block w-3 h-5 bg-green-500 animate-pulse"></span>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const terminal = document.getElementById('terminal-content');
            const statusText = document.getElementById('status-text');
            const streamUrl = "{{ route('full-website.stream', $fullWebsite->id) }}";
            let fullCode = '';

            statusText.innerText = 'GENERATING CODE STREAM...';
            statusText.classList.remove('text-yellow-400');
            statusText.classList.add('text-green-400');

            // Start streaming
            fetch(streamUrl).then(response => {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                function readStream() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            statusText.innerText = 'COMPLETED. REDIRECTING...';
                            terminal.innerHTML += '\n\n<span class="text-blue-400">>> GENERATION COMPLETE. LAUNCHING PREVIEW...</span>';
                            // Scroll to bottom
                            terminal.scrollTop = terminal.scrollHeight;
                            
                            // Redirect to preview after short delay
                            setTimeout(() => {
                                window.location.href = "{{ route('full-website.preview', $fullWebsite->id) }}";
                            }, 1500);
                            return;
                        }

                        // Decode chunk
                        const chunk = decoder.decode(value, { stream: true });
                        
                        // Check for errors sent from server
                        if (chunk.includes('ERROR:')) {
                            statusText.innerText = 'FAILED.';
                            statusText.classList.add('text-red-500');
                            terminal.innerHTML += `\n<span class="text-red-500">${chunk}</span>`;
                            return;
                        }
                        
                        // Append to terminal
                        // We use a safe append to avoid XSS if we were rendering HTML, but here we just want text content visible
                        // For the visual effect, we append text node content
                        const textNode = document.createTextNode(chunk);
                        terminal.appendChild(textNode);
                        
                        // Auto scroll
                        terminal.scrollTop = terminal.scrollHeight;

                        // Continue reading
                        readStream();
                    });
                }

                readStream();
            }).catch(error => {
                statusText.innerText = 'CONNECTION ERROR';
                statusText.classList.add('text-red-500');
                terminal.innerHTML += `\n<span class="text-red-500">>> SYSTEM ERROR: ${error.message}</span>`;
            });
        });
    </script>
</x-app-layout>
