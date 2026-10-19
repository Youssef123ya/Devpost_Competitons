{{--
  Universal Floating Code Panel Component
  Usage: @include('components.code-panel', ['generateEndpoint' => route('...'), 'canvasId' => 'canvas-id', 'needsGeneration' => true/false])
--}}

<!-- Highlight.js for Professional Syntax Highlighting -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<style>
/* ============================
   FLOATING CODE PANEL
============================*/
#code-panel {
    --cp-bg: #1e1e1e;
    --cp-border: #3e3e42;
    --cp-shadow: rgba(0,0,0,0.5);
    --cp-text-main: #e0e0e0;
    --cp-text-muted: #858585;
    --cp-header-border: #3e3e42;
    --cp-btn-bg: #2d2d30;
    --cp-btn-hover: #3e3e42;
    --cp-btn-text: #cccccc;
    --cp-btn-hover-text: #e0e0e0;
    --cp-footer-bg: #252526;
    --cp-scrollbar-track: #1e1e1e;
    --cp-scrollbar-thumb: #424243;
    --cp-code-bg: #1e1e1e;
    --cp-code-text: #d4d4d4;
    
    --cp-syn-tag: #569cd6;
    --cp-syn-attr: #9cdcfe;
    --cp-syn-comment: #6a9955;
    --cp-syn-css: #ce9178;
    --cp-syn-js: #c586c0;

    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 600px;
    max-height: 70vh;
    background: var(--cp-bg);
    border-radius: 8px;
    border: 1px solid var(--cp-border);
    box-shadow: 0 25px 60px -12px var(--cp-shadow), 0 0 0 1px var(--cp-border);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom right;
}

#code-panel.dark-theme {
    --cp-bg: #1e1e1e;
    --cp-border: #3e3e42;
    --cp-shadow: rgba(0,0,0,0.6);
    --cp-text-main: #e0e0e0;
    --cp-text-muted: #858585;
    --cp-header-border: #3e3e42;
    --cp-btn-bg: #2d2d30;
    --cp-btn-hover: #3e3e42;
    --cp-btn-text: #cccccc;
    --cp-btn-hover-text: #e0e0e0;
    --cp-footer-bg: #252526;
    --cp-scrollbar-track: #1e1e1e;
    --cp-scrollbar-thumb: #424243;
    --cp-code-bg: #1e1e1e;
    --cp-code-text: #d4d4d4;
    
    --cp-syn-tag: #569cd6;
    --cp-syn-attr: #9cdcfe;
    --cp-syn-comment: #6a9955;
    --cp-syn-css: #ce9178;
    --cp-syn-js: #c586c0;
}

#code-panel.light-theme {
    --cp-bg: #ffffff;
    --cp-border: #e5e7eb;
    --cp-shadow: rgba(0,0,0,0.1);
    --cp-text-main: #1f2937;
    --cp-text-muted: #6b7280;
    --cp-header-border: #f3f4f6;
    --cp-btn-bg: #f3f4f6;
    --cp-btn-hover: #e5e7eb;
    --cp-btn-text: #374151;
    --cp-btn-hover-text: #1f2937;
    --cp-footer-bg: #f9fafb;
    --cp-scrollbar-track: #f3f4f6;
    --cp-scrollbar-thumb: #d1d5db;
    --cp-code-bg: #f9fafb;
    --cp-code-text: #1f2937;
    
    --cp-syn-tag: #0284c7;
    --cp-syn-attr: #059669;
    --cp-syn-comment: #6b7280;
    --cp-syn-css: #d97706;
    --cp-syn-js: #7c3aed;
}

#code-panel.panel-hidden {
    transform: scale(0.85) translateY(20px);
    opacity: 0;
    pointer-events: none;
}

#code-panel.panel-minimized {
    max-height: 56px !important;
    overflow: hidden !important;
}

#code-panel.panel-maximized {
    top: 24px !important;
    left: 24px !important;
    right: 24px !important;
    bottom: 24px !important;
    width: auto !important;
    max-height: none !important;
    border-radius: 16px;
    transform: none !important;
}

:root {
    --dock-width: max(20vw, 400px);
}

#code-panel.panel-docked {
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: auto !important;
    width: var(--dock-width) !important;
    min-width: 300px;
    max-height: none !important;
    border-radius: 0;
    border-top: none;
    border-bottom: none;
    border-right: none;
    transform: none !important;
}

body.code-docked > div:first-child {
    width: calc(100% - var(--dock-width)) !important;
    transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

body > div:first-child {
    transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cp-header-border);
    flex-shrink: 0;
    user-select: none;
    cursor: move;
    background: linear-gradient(90deg, rgba(30,30,30,0.5) 0%, transparent 100%);
}

#panel-resizer {
    position: absolute;
    top: 0;
    left: -4px;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
    z-index: 100;
    background: transparent;
    transition: background 0.2s;
}

#panel-resizer:hover, #panel-resizer.resizing {
    background: rgba(99,102,241,0.6);
}

.panel-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--cp-text-main);
    font-size: 12px;
    font-weight: 700;
    font-family: 'Fira Code', monospace;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.panel-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
}

.panel-status-dot.generating {
    background: #f59e0b;
    animation: pulse-dot 1s infinite;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
}

.panel-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.panel-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: var(--cp-btn-bg);
    border-radius: 6px;
    color: var(--cp-btn-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 11px;
}

.panel-btn:hover {
    background: var(--cp-btn-hover);
    color: var(--cp-btn-hover-text);
}

.panel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.panel-body::-webkit-scrollbar { width: 6px; height: 6px; }
.panel-body::-webkit-scrollbar-track { background: var(--cp-scrollbar-track); }
.panel-body::-webkit-scrollbar-thumb { background: var(--cp-scrollbar-thumb); border-radius: 4px; }
.panel-body::-webkit-scrollbar-corner { background: var(--cp-scrollbar-track); }

#edit-mode-container {
    position: relative;
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 300px;
    background: var(--cp-code-bg);
}

#edit-mode-container.hidden {
    display: none !important;
}

#editor-highlight {
    margin: 0 !important;
    padding: 16px !important;
    width: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;
    overflow: auto !important; /* Match code-editor overflow for perfect alignment */
    pointer-events: none !important;
    background: transparent !important;
    border: none !important;
    position: absolute !important;
    top: 0;
    left: 0;
    z-index: 1;
}

/* 
 * CRITICAL FIX FOR CURSOR ALIGNMENT:
 * We must force all syntax-highlighted tokens to have normal font-weight and font-style.
 * Highlight.js themes often make keywords bold or italic, which changes the character width.
 * This breaks horizontal alignment between the visual code and the transparent textarea.
 */
#editor-highlight code *, #editor-highlight code {
    font-weight: normal !important;
    font-style: normal !important;
    letter-spacing: normal !important;
}

#editor-highlight code {
    font-family: 'Fira Code', 'Cascadia Code', 'Monaco', 'Courier New', monospace !important;
    font-size: 13px !important;
    line-height: 1.7 !important;
    tab-size: 2 !important;
    white-space: pre !important;
    word-wrap: normal !important;
    word-break: normal !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    overflow: visible !important;
    border: none !important;
}

#code-editor {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 16px !important;
    box-sizing: border-box !important;
    background: transparent !important;
    color: transparent !important; /* hide the text, let caret show */
    caret-color: var(--cp-code-text) !important;
    border: none !important;
    outline: none !important;
    resize: none !important;
    overflow: auto !important;
    z-index: 2;
    font-family: 'Fira Code', 'Cascadia Code', 'Monaco', 'Courier New', monospace !important;
    font-size: 13px !important;
    line-height: 1.7 !important;
    tab-size: 2 !important;
    white-space: pre !important;
    word-wrap: normal !important;
    word-break: normal !important;
}

#code-editor::selection {
    background: rgba(99,102,241,0.3);
    color: transparent;
}

#code-editor::-webkit-scrollbar { height: 12px; width: 8px; }
#code-editor::-webkit-scrollbar-track { background: transparent; }
#code-editor::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, rgba(99,102,241,0.22), rgba(79,70,229,0.28));
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: padding-box;
}
#code-editor::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(90deg, rgba(99,102,241,0.35), rgba(79,70,229,0.4));
}

#editor-highlight::-webkit-scrollbar { height: 12px; width: 8px; }
#editor-highlight::-webkit-scrollbar-track { background: transparent; }
#editor-highlight::-webkit-scrollbar-thumb { background: transparent; }

/* Token colors for code highlighting effect */
#code-display {
    display: flex !important;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 100%; /* Force full height so scrollbar is at the bottom */
    min-height: 0; /* allow proper flex shrinking inside panel-body */
    padding: 16px;
    font-family: 'Fira Code', 'Cascadia Code', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.7;
    color: var(--cp-code-text);
    white-space: pre;
    word-wrap: normal;
    word-break: normal;
    overflow-wrap: normal;
    box-sizing: border-box;
    position: relative;
    background: var(--cp-code-bg);
    overflow-x: auto;
    overflow-y: auto;
    padding-bottom: 14px; /* room for horizontal scrollbar so it sits visually at the bottom */
    scrollbar-gutter: stable both-edges;
    overscroll-behavior: contain;
}

/* Custom scrollbar styling for the code area (WebKit + Firefox) */
#code-display {
    scrollbar-width: thin;
    scrollbar-color: rgba(99,102,241,0.35) transparent;
}
#code-display::-webkit-scrollbar { height: 12px; width: 8px; }
#code-display::-webkit-scrollbar-track { background: transparent; }
#code-display::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, rgba(99,102,241,0.22), rgba(79,70,229,0.28));
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: padding-box;
}
#code-display::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(90deg, rgba(99,102,241,0.35), rgba(79,70,229,0.4));
}

#code-display pre {
    margin: 0;
    padding: 0;
    background: transparent;
    display: block;
    width: 100%;
    flex: none; /* prevent pre from growing and creating extra bottom space */
    overflow: visible !important;
}

#code-display code {
    display: block;
    background: transparent;
    padding: 0;
    width: 100%;
    overflow: visible !important;
}

#code-display.hidden {
    display: none !important;
}

#code-display.editing-mode {
    border: 2px solid var(--cp-syn-tag);
    border-radius: 6px;
    cursor: text;
    outline: none;
}

#code-display.editing-mode:focus {
    border-color: var(--cp-syn-js);
    box-shadow: 0 0 0 3px rgba(197, 134, 192, 0.1);
}

#code-display.editing-mode ::selection {
    background: var(--cp-syn-tag);
    color: var(--cp-bg);
}

#code-display.hljs {
    background: transparent;
    padding: 16px;
    border: none;
}

#code-display pre {
    margin: 0;
    background: transparent;
    padding: 0;
}

/* Highlight.js Overrides */
#code-display .hljs {
    background: transparent;
    color: var(--cp-code-text);
    padding: 0;
}

#code-display .hljs-tag { color: #569cd6; }
#code-display .hljs-attr { color: #9cdcfe; }
#code-display .hljs-string { color: #ce9178; }
#code-display .hljs-literal { color: #569cd6; }
#code-display .hljs-number { color: #b5cea8; }
#code-display .hljs-comment { color: #6a9955; opacity: 0.8; }
#code-display .hljs-keyword { color: #569cd6; }
#code-display .hljs-built_in { color: #9cdcfe; }
#code-display .hljs-name { color: #9cdcfe; }
#code-display .hljs-attr-name { color: #9cdcfe; }
#code-display .hljs-type { color: #4ec9b0; }

/* Light theme syntax highlighting overrides */
#code-panel.light-theme #code-display .hljs-tag { color: #0284c7; }
#code-panel.light-theme #code-display .hljs-attr { color: #059669; }
#code-panel.light-theme #code-display .hljs-string { color: #d97706; }
#code-panel.light-theme #code-display .hljs-literal { color: #0284c7; }
#code-panel.light-theme #code-display .hljs-number { color: #7c3aed; }
#code-panel.light-theme #code-display .hljs-comment { color: #9ca3af; }
#code-panel.light-theme #code-display .hljs-keyword { color: #0284c7; }
#code-panel.light-theme #code-display .hljs-built_in { color: #059669; }
#code-panel.light-theme #code-display .hljs-name { color: #059669; }
#code-panel.light-theme #code-display .hljs-attr-name { color: #059669; }
#code-panel.light-theme #code-display .hljs-type { color: #0891b2; }
#code-panel.light-theme #code-display .hljs { background: transparent; }

/* Light theme textarea styling */
#code-panel.light-theme #code-editor {
    background: linear-gradient(90deg, rgba(0,0,0,0.01) 0%, transparent 50px) !important;
    color: #1f2937;
}

.code-line {
    display: block;
    animation: fadeInLine 0.2s ease-out forwards;
    opacity: 0;
    padding-left: 4px;
    border-left: 2px solid transparent;
    transition: border-color 0.2s;
}

.code-line:hover {
    border-left-color: rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.05);
}

.code-line.line-changed {
    background: rgba(34, 197, 94, 0.15) !important;
    border-left-color: #22c55e !important;
}
#code-panel.light-theme .code-line.line-changed {
    background: rgba(34, 197, 94, 0.25) !important;
}

@keyframes fadeInLine {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}

.panel-footer {
    padding: 12px 14px;
    border-top: 1px solid var(--cp-header-border);
    background: var(--cp-footer-bg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 8px;
    background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 100%);
}

.panel-footer-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Fira Code', monospace;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.btn-apply {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    flex: 1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.btn-apply:hover { 
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-copy {
    background: rgba(255, 255, 255, 0.08);
    color: var(--cp-btn-text);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-copy:hover { 
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--cp-btn-hover-text);
}

.btn-regen {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.2);
}
.btn-regen:hover { 
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.4);
}

/* Toggle Button in Toolbar */
#code-panel-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #0f172a;
    color: #e2e8f0;
    border: 1px solid rgba(99,102,241,0.4);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
}

#code-panel-toggle:hover {
    background: #1e293b;
    border-color: rgba(99,102,241,0.8);
}

#code-panel-toggle .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    background: #f59e0b;
    border-radius: 50%;
    animation: pulse-dot 1.5s infinite;
}

/* Generating overlay for canvas */
#generating-overlay {
    position: absolute;
    inset: 0;
    background: rgba(248,250,252,0.97);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 10;
    border-radius: inherit;
    transition: opacity 0.5s ease;
}

#generating-overlay.fade-out {
    opacity: 0;
    pointer-events: none;
}

.gen-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>


{{-- Floating Code Panel --}}
<div id="code-panel" class="{{ $needsGeneration ? '' : 'panel-hidden' }} panel-docked">
    <div id="panel-resizer"></div>
    <div class="panel-header" id="panel-drag-handle">
        <div class="panel-title">
            <div class="panel-status-dot {{ $needsGeneration ? 'generating' : '' }}" id="panel-status-dot"></div>
            <span id="panel-title-text">
                {{ $needsGeneration ? 'Generating ' . ($sectionLabel ?? 'Section') . '...' : ($sectionLabel ?? 'Section') . ' Code' }}
            </span>
        </div>
        <div class="panel-actions">
            <button class="panel-btn" onclick="toggleTheme()" title="Toggle Theme" id="theme-btn">
                <i class="fa-solid fa-moon"></i>
            </button>
            <button class="panel-btn" onclick="toggleDock()" title="Dock Right" id="dock-btn">
                <i class="fa-solid fa-columns"></i>
            </button>
            <button class="panel-btn" onclick="toggleMaximize()" title="Fullscreen" id="max-btn">
                <i class="fa-solid fa-expand"></i>
            </button>
            <button class="panel-btn" onclick="copyPanelCode()" title="Copy">
                <i class="fa-regular fa-copy"></i>
            </button>
            <button class="panel-btn" onclick="toggleMinimize()" title="Minimize" id="minimize-btn">
                <i class="fa-solid fa-minus"></i>
            </button>
            <button class="panel-btn" onclick="toggleCodePanel()" title="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    </div>
    <div class="panel-body" id="panel-body">
        <div id="code-display"></div>
        <div id="edit-mode-container" class="hidden">
            <pre id="editor-highlight" aria-hidden="true"><code class="language-html"></code></pre>
            <textarea id="code-editor" spellcheck="false" oninput="syncEditorContent(this.value)"></textarea>
        </div>
        <div id="ai-review-banner" style="display: none; padding: 10px 14px; background: rgba(99, 102, 241, 0.1); border-top: 1px solid rgba(99,102,241,0.2); align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-sparkles" style="color: #6366f1;"></i>
                <span style="font-size: 12px; font-weight: 600; color: #6366f1;">AI Modification Complete</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="rejectAiChanges()" style="padding: 6px 12px; border-radius: 6px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); font-size: 11px; font-weight: bold; cursor: pointer; transition: all 0.2s;">Reject</button>
                <button onclick="acceptAiChanges()" style="padding: 6px 12px; border-radius: 6px; background: #6366f1; color: white; border: none; font-size: 11px; font-weight: bold; cursor: pointer; transition: all 0.2s;">Accept</button>
            </div>
        </div>
    </div>
    <div class="panel-footer">
        <button class="panel-footer-btn btn-copy" onclick="toggleEditMode()">
            <i class="fa-solid fa-pen" id="edit-icon"></i>
            <span id="edit-label">Edit Code</span>
        </button>
        @if(!$needsGeneration)
        <button class="panel-footer-btn btn-regen" onclick="regenerateSection()">
            <i class="fa-solid fa-rotate-right"></i>
            Regenerate
        </button>
        @endif
        <button class="panel-footer-btn btn-apply" onclick="applyAndClose()">
            <i class="fa-solid fa-check"></i>
            Apply & Close
        </button>
    </div>
</div>


<script>
// =====================================================
//  UNIVERSAL FLOATING CODE PANEL ENGINE
// =====================================================
(function() {
    const GENERATE_ENDPOINT = '{{ $generateEndpoint ?? '' }}';
    const REGENERATE_ENDPOINT = '{{ $regenerateEndpoint ?? '' }}';
    const CANVAS_ID = '{{ $canvasId ?? 'preview-canvas' }}';
    const NEEDS_GENERATION = {{ $needsGeneration ? 'true' : 'false' }};
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content || '';

    let currentCode = '';
    let isMinimized = false;
    let isMaximized = false;
    let isDocked = true;
    let isEditMode = false;
    let isPanelVisible = NEEDS_GENERATION;
    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    let __codeDisplayInputHandler = null;  // Store handler ref for removal
    let originalCodeBeforeAI = null;

    const panel = document.getElementById('code-panel');
    const codeDisplay = document.getElementById('code-display');
    const codeEditor = document.getElementById('code-editor');
    const statusDot = document.getElementById('panel-status-dot');
    const titleText = document.getElementById('panel-title-text');
    let toggleBtn = document.getElementById('code-panel-toggle');

    // ——— Draggable Panel ———
    const handle = document.getElementById('panel-drag-handle');
    if (handle) {
        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.panel-btn')) return;
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            panel.style.transition = 'none';
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        });
    }

    function onDrag(e) {
        if (!isDragging || isMaximized || isDocked) return;
        const x = e.clientX - dragOffsetX;
        const y = e.clientY - dragOffsetY;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left = Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth)) + 'px';
        panel.style.top = Math.max(0, Math.min(y, window.innerHeight - 60)) + 'px';
    }

    function stopDrag() {
        isDragging = false;
        panel.style.transition = '';
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // ——— Resizable Panel ———
    const resizer = document.getElementById('panel-resizer');
    let isResizing = false;
    let initialWidth = 0;
    let initialMouseX = 0;

    if (resizer) {
        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            initialWidth = panel.offsetWidth;
            initialMouseX = e.clientX;
            resizer.classList.add('resizing');
            
            const mainWrapper = document.body.firstElementChild;
            if (isDocked && mainWrapper) {
                mainWrapper.style.transition = 'none';
            }
            panel.style.transition = 'none';
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });
    }

    function handleResize(e) {
        if (!isResizing) return;
        const diff = initialMouseX - e.clientX;
        let newWidth = initialWidth + diff;
        
        if (newWidth < 300) newWidth = 300;
        if (newWidth > window.innerWidth * 0.8) newWidth = window.innerWidth * 0.8;
        
        if (isDocked) {
            document.documentElement.style.setProperty('--dock-width', newWidth + 'px');
        } else {
            panel.style.width = newWidth + 'px';
        }
    }

    function stopResize() {
        isResizing = false;
        resizer.classList.remove('resizing');
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        
        panel.style.transition = '';
        const mainWrapper = document.body.firstElementChild;
        if (isDocked && mainWrapper) {
            mainWrapper.style.transition = 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }

    // ——— Generation Flow ———
    if (NEEDS_GENERATION) {
        startGeneration();
    } else {
        // Load existing code into panel
        const canvas = document.getElementById(CANVAS_ID);
        if (canvas) {
            currentCode = canvas.innerHTML.trim().replace(/&quot;/g, "'");
            renderCodeAnimated(currentCode, false);
        }
    }

    async function startGeneration() {
        setStatus('generating', 'Generating...');
        showOverlay();

        try {
            const resp = await fetch(GENERATE_ENDPOINT, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
            });
            
            if (resp.ok) {
                const data = await resp.json();

                if (data.success && data.code) {
                    currentCode = data.code;
                    await renderCodeAnimated(currentCode, true);
                    // Apply to canvas
                    applyCodeToCanvas(currentCode, true);
                    hideOverlay();
                    setStatus('ready', '{{ $sectionLabel ?? "Section" }} Code Ready');
                    // Update the badge
                    if (toggleBtn) toggleBtn.querySelector('.badge')?.remove();
                    
                    // Deduct visual credits
                    const creditsDisplay = document.getElementById('nav-credits-display');
                    if (creditsDisplay) {
                        let current = parseInt(creditsDisplay.innerText);
                        if (!isNaN(current) && current >= 10) {
                            creditsDisplay.innerText = current - 10;
                        }
                    }
                } else {
                    setStatus('error', 'Generation failed');
                    hideOverlay();
                }
            } else if (resp.status === 402) {
                const data = await resp.json();
                hideOverlay();
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    alert('Not enough credits to generate this section.');
                }
            } else {
                setStatus('error', 'Generation failed - server returned error');
                hideOverlay();
                try {
                    const raw = await resp.text();
                    console.error('Raw response (first 500 chars):', raw.substring(0, 500));
                } catch (_) {}
            }
        } catch (e) {
            console.error('Generation error:', e);
            setStatus('error', 'Error generating');
            hideOverlay();
        }
    }

    async function renderCodeAnimated(code, animate) {
        codeDisplay.innerHTML = '';
        codeEditor.value = code;

        const lines = code.split('\n');
        const BATCH = animate ? 3 : lines.length;
        
        const normalizeForDiff = (str) => str.replace(/\s+/g, '').toLowerCase();
        const rawOldLines = originalCodeBeforeAI ? originalCodeBeforeAI.split('\n').map(normalizeForDiff) : [];
        const rawNewLines = lines.map(normalizeForDiff);

        for (let i = 0; i < lines.length; i += BATCH) {
            const batch = lines.slice(i, i + BATCH);
            for (let j = 0; j < batch.length; j++) {
                const lineIndex = i + j;
                const span = document.createElement('span');
                span.className = 'code-line';
                span.textContent = batch[j] + '\n';
                colorize(span);
                
                // Highlight changed/added lines if AI modification is under review
                if (originalCodeBeforeAI) {
                    const cleanRaw = rawNewLines[lineIndex];
                    if (cleanRaw !== '' && !rawOldLines.includes(cleanRaw)) {
                        span.classList.add('line-changed');
                    }
                }
                
                codeDisplay.appendChild(span);
            }

            if (animate) {
                await sleep(18);
                const body = document.getElementById('panel-body');
                if (body) body.scrollTop = body.scrollHeight;
            }
        }
    }

    function colorize(span) {
        const text = span.textContent;
        
        // Use Highlight.js for professional syntax highlighting
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        
        try {
            // Try to detect language based on content
            let language = 'html';
            if (text.includes('function') || text.includes('=>') || text.includes('const ')) {
                language = 'javascript';
            } else if (text.includes('class=') || text.includes('style=')) {
                language = 'html';
            } else if (text.includes('{') && (text.includes(':') || text.includes(';'))) {
                language = 'css';
            }
            
            tempDiv.className = `language-${language}`;
            hljs.highlightElement(tempDiv);
            
            // Replace span with highlighted content
            span.innerHTML = tempDiv.innerHTML;
            span.style.color = 'inherit'; // Let hljs colors take over
        } catch (e) {
            // Fallback to simple coloring if highlighting fails
            if (text.trim().startsWith('<') || text.trim().startsWith('</') || text.trim().startsWith('/>')) {
                span.style.color = 'var(--cp-syn-tag)'; 
            } else if (text.includes('class=') || text.includes('style=') || text.includes('id=')) {
                span.style.color = 'var(--cp-syn-attr)';
            } else if (text.trim().startsWith('//') || text.trim().startsWith('/*') || text.trim().startsWith('*')) {
                span.style.color = 'var(--cp-syn-comment)';
            } else if (text.includes('{') || text.includes('}') || text.trim().startsWith('.') || text.trim().startsWith('#')) {
                span.style.color = 'var(--cp-syn-css)';
            } else if (text.trim().startsWith('function') || text.includes('=>') || text.includes('const ') || text.includes('let ') || text.includes('var ')) {
                span.style.color = 'var(--cp-syn-js)';
            }
        }
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ——— Canvas Updates ———
    function applyCodeToCanvas(code, isAiRegeneration = false) {
        const canvas = document.getElementById(CANVAS_ID);
        if (!canvas) return;
        
        console.log('Applying code to canvas:', code.substring(0, 100));
        
        // Clean up orphaned lightboxes
        document.querySelectorAll('body > #work-lightbox').forEach(el => el.remove());
        
        // Remove ALL old styles from canvas (both <style> tags and inline styles)
        canvas.querySelectorAll('*').forEach(el => {
            el.removeAttribute('style'); // Clear inline styles
        });
        canvas.querySelectorAll('style').forEach(el => el.remove());
        
        // Set the new HTML content (this includes any <style> and <script> tags)
        canvas.innerHTML = code;
        
        // Force CSS repaint by triggering a reflow
        canvas.offsetHeight;
        
        // Re-execute all scripts in the canvas so JS functions work
        canvas.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            // Copy all attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            // Copy script content
            newScript.textContent = oldScript.textContent;
            oldScript.replaceWith(newScript);
        });
        
        // Trigger a style recalculation
        window.getComputedStyle(canvas).display;
        
        // Notify page that canvas updated
        document.dispatchEvent(new CustomEvent('canvas-updated', { detail: { code, isAiRegeneration } }));
        
        console.log('Code applied successfully to canvas');
    }

    // ——— Panel Controls ———
    window.toggleCodePanel = function() {
        if (!panel) return;
        
        isPanelVisible = !isPanelVisible;
        
        if (isPanelVisible) {
            panel.classList.remove('panel-hidden');
            document.body.classList.add('code-docked');
            if (toggleBtn) {
                const label = toggleBtn.querySelector('.toggle-label');
                if (label) label.textContent = 'Hide Code';
            }
            
            // Sync with canvas so sidebar changes are reflected in the code editor
            const canvas = document.getElementById(CANVAS_ID);
            if (canvas) {
                currentCode = canvas.innerHTML.trim().replace(/&quot;/g, "'");
                if (isEditMode) {
                    codeEditor.value = currentCode;
                } else {
                    renderCodeAnimated(currentCode, false);
                }
            }
        } else {
            panel.classList.add('panel-hidden');
            document.body.classList.remove('code-docked');
            const label = toggleBtn.querySelector('.toggle-label');
            if (label) label.textContent = isPanelVisible ? 'Hide Code' : 'Show Code';
        }
    };

    window.toggleTheme = function() {
        panel.classList.toggle('dark-theme');
        const isDark = panel.classList.contains('dark-theme');
        document.getElementById('theme-btn').innerHTML = isDark 
            ? '<i class="fa-regular fa-sun"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
    };

    window.toggleMinimize = function() {
        isMinimized = !isMinimized;
        panel.classList.toggle('panel-minimized', isMinimized);
        
        // If docked, temporarily remove the docked classes so it behaves as a floating widget
        if (isDocked) {
            if (isMinimized) {
                document.body.classList.remove('code-docked');
                panel.classList.remove('panel-docked');
                // Give it a default floating position so it doesn't jump to the top
                if (!panel.style.top && !panel.style.bottom) {
                    panel.style.bottom = '24px';
                    panel.style.right = '24px';
                }
            } else {
                document.body.classList.add('code-docked');
                panel.classList.add('panel-docked');
                // Clean up inline positioning for docked mode
                panel.style.bottom = '';
                panel.style.right = '';
            }
        }

        const btn = document.getElementById('minimize-btn');
        if (btn) btn.innerHTML = isMinimized
            ? '<i class="fa-solid fa-window-restore text-[10px]"></i>'
            : '<i class="fa-solid fa-minus"></i>';
    };

    window.toggleMaximize = function() {
        isMaximized = !isMaximized;
        if (isMaximized) {
            isDocked = false;
            panel.classList.remove('panel-docked');
            document.body.classList.remove('code-docked');
            panel.classList.add('panel-maximized');
            document.getElementById('dock-btn').innerHTML = '<i class="fa-solid fa-columns"></i>';
            document.getElementById('max-btn').innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            panel.classList.remove('panel-maximized');
            document.getElementById('max-btn').innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
        // reset inline position styles
        panel.style.top = '';
        panel.style.left = '';
        panel.style.right = '';
        panel.style.bottom = '';
        panel.style.width = '';
    };

    let currentTheme = localStorage.getItem('code-panel-theme') || 'dark-theme';

    // Initialize theme on load
    panel.classList.add(currentTheme);
    updateThemeButton();

    function updateThemeButton() {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            if (currentTheme === 'dark-theme') {
                themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
                themeBtn.title = 'Light Mode';
            } else {
                themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
                themeBtn.title = 'Dark Mode';
            }
        }
    }

    window.toggleTheme = function() {
        panel.classList.remove(currentTheme);
        currentTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
        panel.classList.add(currentTheme);
        localStorage.setItem('code-panel-theme', currentTheme);
        updateThemeButton();
    };

    window.toggleDock = function() {
        isDocked = !isDocked;
        if (isDocked) {
            isMaximized = false;
            panel.classList.remove('panel-maximized');
            panel.classList.add('panel-docked');
            document.body.classList.add('code-docked');
            document.getElementById('max-btn').innerHTML = '<i class="fa-solid fa-expand"></i>';
            document.getElementById('dock-btn').innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>';
        } else {
            panel.classList.remove('panel-docked');
            document.body.classList.remove('code-docked');
            document.getElementById('dock-btn').innerHTML = '<i class="fa-solid fa-columns"></i>';
        }
        // reset inline position styles
        panel.style.top = '';
        panel.style.left = '';
        panel.style.right = '';
        panel.style.bottom = '';
        if (!isDocked) {
            panel.style.width = ''; // Let css set default width when undocked
            document.documentElement.style.removeProperty('--dock-width');
        }
    };

    window.toggleEditMode = function() {
        isEditMode = !isEditMode;
        const label = document.getElementById('edit-label');
        const icon = document.getElementById('edit-icon');
        
        if (isEditMode) {
            // Enter Edit Mode - show textarea, hide display
            // Grab latest HTML from canvas to include sidebar color updates
            const canvas = document.getElementById(CANVAS_ID);
            if (canvas) {
                currentCode = canvas.innerHTML.trim().replace(/&quot;/g, "'");
            }

            codeDisplay.classList.add('hidden');
            document.getElementById('edit-mode-container').classList.remove('hidden');
            codeEditor.value = currentCode;
            if (typeof syncEditorContent === 'function') syncEditorContent(currentCode);
            codeEditor.focus();
            
            if (label) label.textContent = 'Preview';
            if (icon) icon.className = 'fa-solid fa-eye';
        } else {
            // Exit Edit Mode - hide textarea, show display
            document.getElementById('edit-mode-container').classList.add('hidden');
            codeDisplay.classList.remove('hidden');
            
            // Update current code from textarea
            currentCode = codeEditor.value;
            // Re-render content with syntax highlighting now that editing finished
            renderCodeAnimated(currentCode, false);
            
            if (label) label.textContent = 'Edit Code';
            if (icon) icon.className = 'fa-solid fa-pen';
        }
    };

    window.applyEditorCode = function(code) {
        currentCode = code;
        applyCodeToCanvas(code);
    };

    window.syncEditorContent = function(val) {
        applyEditorCode(val);
        const codeEl = document.querySelector('#editor-highlight code');
        if (codeEl) {
            // Fix trailing newline issue where browser collapses the last empty line
            let text = val;
            if (text.length > 0 && text[text.length - 1] === '\n') {
                text += ' ';
            }
            codeEl.textContent = text;
            if (typeof hljs !== 'undefined') {
                codeEl.removeAttribute('data-highlighted');
                hljs.highlightElement(codeEl);
            }
        }
    };

    // Attach scroll sync after DOM load
    document.addEventListener('DOMContentLoaded', () => {
        // Re-assign toggleBtn in case it wasn't available when IIFE ran
        if (!toggleBtn) toggleBtn = document.getElementById('code-panel-toggle');
        
        if (toggleBtn) {
            const label = toggleBtn.querySelector('.toggle-label');
            if (label) label.textContent = isPanelVisible ? 'Hide Code' : 'Show Code';
        }

        const editor = document.getElementById('code-editor');
        const highlightPre = document.getElementById('editor-highlight');
        if (editor && highlightPre) {
            editor.addEventListener('scroll', () => {
                highlightPre.scrollTop = editor.scrollTop;
                highlightPre.scrollLeft = editor.scrollLeft;
            });
        }
    });

    window.applyAndClose = function() {
        console.log('Apply & Close clicked, isEditMode:', isEditMode);
        
        let codeToApply = isEditMode ? codeEditor.value : currentCode;
        
        console.log('Code to apply (first 200 chars):', codeToApply.substring(0, 200));
        
        if (!codeToApply.trim()) {
            console.warn('No code to apply');
            alert('No code to apply');
            return;
        }
        
        // Update currentCode
        currentCode = codeToApply;
        
        // Apply the code to canvas immediately
        applyCodeToCanvas(currentCode);
        
        // Close the panel
        isPanelVisible = false;
        panel.classList.add('panel-hidden');
        document.body.classList.remove('code-docked');
        if (toggleBtn) {
            const label = toggleBtn.querySelector('.toggle-label');
            if (label) label.textContent = 'Show Code';
        }
        
        console.log('Apply & Close completed successfully');
    };

    window.copyPanelCode = function() {
        const code = isEditMode ? codeEditor.value : currentCode;
        navigator.clipboard.writeText(code).then(() => {
            showToast('Code copied!', 'success');
        });
    };

    window.regenerateSection = async function() {
        if (!REGENERATE_ENDPOINT) return;
        setStatus('generating', 'Regenerating...');
        showOverlay();
        codeDisplay.innerHTML = '';

        try {
            const resp = await fetch(REGENERATE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': CSRF
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.success && data.code) {
                    currentCode = data.code;
                    await renderCodeAnimated(currentCode, true);
                    applyCodeToCanvas(currentCode, true);
                    hideOverlay();
                    setStatus('ready', '{{ $sectionLabel ?? "Section" }} Code Ready');
                    
                    // Deduct visual credits
                    const creditsDisplay = document.getElementById('nav-credits-display');
                    if (creditsDisplay) {
                        let current = parseInt(creditsDisplay.innerText);
                        if (!isNaN(current) && current >= 10) {
                            creditsDisplay.innerText = current - 10;
                        }
                    }
                } else {
                    setStatus('error', 'Regeneration failed');
                    hideOverlay();
                }
            } else if (resp.status === 402) {
                const data = await resp.json();
                hideOverlay();
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    alert('Not enough credits to regenerate this section.');
                }
            } else {
                setStatus('error', 'Regeneration failed');
                hideOverlay();
                try { const raw = await resp.text(); console.error('Raw response:', raw.substring(0,500)); } catch(_){}
            }
        } catch (e) {
            console.error('Regeneration error:', e);
            setStatus('error', 'Regeneration failed');
            hideOverlay();
        }
    };

    window.modifyCodeWithAI = async function() {
        const input = document.getElementById('ai-modifier-input');
        const btnText = document.getElementById('ai-modifier-btn-text');
        const btnIcon = document.getElementById('ai-modifier-btn-icon');
        const prompt = input ? input.value.trim() : '';
        
        if (!prompt) return;

        const canvas = document.getElementById(CANVAS_ID);
        let codeToModify = currentCode;
        if (canvas) {
            codeToModify = canvas.innerHTML.trim();
            // Fix double quotes in URLs getting encoded as &quot; by the browser's innerHTML
            codeToModify = codeToModify.replace(/&quot;/g, "'");
        }

        if(input) input.disabled = true;
        if(btnText) btnText.textContent = 'Generating...';
        if(btnIcon) btnIcon.className = 'fa-solid fa-spinner fa-spin';
        setStatus('generating', 'AI is modifying design...');
        showOverlay();

        // Store exactly what we send to the AI for accurate diffing and rejecting
        originalCodeBeforeAI = codeToModify;

        try {
            const resp = await fetch('/api/modify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': CSRF
                },
                body: JSON.stringify({
                    current_code: codeToModify,
                    prompt: prompt,
                    section: '{{ $sectionLabel ?? "Section" }}'
                })
            });

            const data = await resp.json();
            
            if (resp.ok && data.success && data.html) {
                currentCode = data.html;
                if (isEditMode) {
                    codeEditor.value = currentCode;
                    if(typeof syncEditorContent === 'function') syncEditorContent(currentCode);
                } else {
                    renderCodeAnimated(currentCode, false);
                }
                applyCodeToCanvas(currentCode, false);
                
                if(input) input.value = '';
                setStatus('ready', 'Please review AI changes');
                
                // Show review banner
                const banner = document.getElementById('ai-review-banner');
                if (banner) banner.style.display = 'flex';
                
            } else {
                throw new Error(data.message || 'Failed to modify code');
            }
        } catch (err) {
            console.error('AI Mod error:', err);
            setStatus('error', err.message);
            alert('AI Modification Failed: ' + err.message);
        } finally {
            if(input) input.disabled = false;
            if(btnText) btnText.textContent = 'Generate Magic';
            if(btnIcon) btnIcon.className = 'fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform';
            hideOverlay();
        }
    };

    function setStatus(state, text) {
        if (statusDot) {
            statusDot.className = 'panel-status-dot' + (state === 'generating' ? ' generating' : '');
            statusDot.style.background = state === 'error' ? '#ef4444' : (state === 'generating' ? '#f59e0b' : '#22c55e');
        }
        if (titleText) titleText.textContent = text;
    }

    // ——— Overlay ———
    function showOverlay() {
        const canvas = document.getElementById(CANVAS_ID);
        if (!canvas) return;
        let overlay = document.getElementById('generating-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'generating-overlay';
            overlay.innerHTML = `
                <div class="gen-spinner"></div>
                <p style="color:#6366f1;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;">
                    Generating {{ $sectionLabel ?? 'Section' }}...
                </p>
                <p style="color:#94a3b8;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;">
                    Watch the code build live in the panel →
                </p>
            `;
            const parent = canvas.parentElement;
            if (parent) {
                parent.style.position = 'relative';
                parent.appendChild(overlay);
            }
        }
        overlay.classList.remove('fade-out');
    }

    function hideOverlay() {
        const overlay = document.getElementById('generating-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }
    }

    // ——— AI Review State ———

    window.rejectAiChanges = function() {
        if (originalCodeBeforeAI) {
            currentCode = originalCodeBeforeAI;
            if (isEditMode) {
                codeEditor.value = currentCode;
                if(typeof syncEditorContent === 'function') syncEditorContent(currentCode);
            } else {
                renderCodeAnimated(currentCode, false);
            }
            applyCodeToCanvas(currentCode, false);
            originalCodeBeforeAI = null;
        }
        const banner = document.getElementById('ai-review-banner');
        if (banner) banner.style.display = 'none';
        setStatus('ready', 'AI changes rejected');
    };

    window.acceptAiChanges = function() {
        originalCodeBeforeAI = null;
        const banner = document.getElementById('ai-review-banner');
        if (banner) banner.style.display = 'none';
        setStatus('ready', 'AI changes accepted!');
        
        // Trigger global sync if exists
        if (typeof window.syncControlsFromHtml === 'function') {
            window.syncControlsFromHtml(currentCode);
        }
    };

    // ——— Toast ———
    function showToast(msg, type) {
        const div = document.createElement('div');
        div.style.cssText = `position:fixed;bottom:100px;right:24px;padding:10px 18px;border-radius:10px;color:white;font-weight:700;font-size:13px;z-index:99999;font-family:'Plus Jakarta Sans',sans-serif;background:${type==='success'?'#22c55e':'#ef4444'};box-shadow:0 10px 25px rgba(0,0,0,0.3)`;
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2500);
    }

    window.__codePanelShowToast = showToast;

    // ——— Initialization ———
    // If it starts visible and docked, apply body class
    if (isDocked && isPanelVisible) {
        document.body.classList.add('code-docked');
    }
    // Set proper dock button icon
    const dockBtn = document.getElementById('dock-btn');
    if (dockBtn && isDocked) {
        dockBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>';
    }
})();
</script>

