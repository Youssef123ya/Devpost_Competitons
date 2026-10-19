<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Hero Preview</title>
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
            box-shadow: 0 0 0 1px #6366f1;
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
                                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                        Editor Controls
                    </h2>
                </div>

                <div class="flex-1 p-6 space-y-8">
                    <!-- Text Content -->
                    <div class="space-y-4">
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">CONTENT</h3>

                        <div class="space-y-3">
                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Title</label>
                                <input type="text" id="titleInput" value="{{ $hero->title }}" data-target="hero-title"
                                    class="control-input">
                            </div>
                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Subtitle</label>
                                <input type="text" id="subtitleInput" value="{{ $hero->subtitle }}"
                                    data-target="hero-subtitle" class="control-input">
                            </div>
                            <div>
                                <label
                                    class="block text-[11px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Description</label>
                                <textarea id="descriptionInput" data-target="hero-description"
                                    class="control-input min-h-[120px]">{{ $hero->description }}</textarea>
                            </div>

                            <div class="space-y-3 pt-2 border-t border-slate-200 mt-2" id="hero-cta-editor-container">
                                <!-- LINK 1 -->
                                <div
                                    class="link-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-link">
                                    <div class="flex justify-between items-center">
                                        <label
                                            class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">LINK
                                            1 (PRIMARY)</label>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <input type="text" id="ctaTextInput" value="{{ $hero->cta_text }}"
                                            placeholder="Text" data-target="hero-button"
                                            class="control-input bg-white h-9">
                                        <input type="text" id="ctaUrlInput" value="{{ $hero->cta_url ?? '#' }}"
                                            placeholder="URL" class="control-input bg-white h-9">
                                    </div>
                                </div>

                                <!-- LINK 2 -->
                                <div id="preview-cta-2-container"
                                    class="link-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-link {{ empty($hero->cta_2_text) ? 'hidden' : '' }}">
                                    <div class="flex justify-between items-center">
                                        <label
                                            class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">LINK
                                            2</label>
                                        <button type="button" onclick="removePreviewCta(2)"
                                            class="text-slate-300 hover:text-red-500 transition-colors">
                                            <i class="fa-regular fa-trash-can text-[13px]"></i>
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <input type="text" id="cta2TextInput" value="{{ $hero->cta_2_text }}"
                                            placeholder="Text" data-target="hero-cta-2"
                                            class="control-input bg-white h-9">
                                        <input type="text" id="cta2UrlInput" value="{{ $hero->cta_2_url }}"
                                            placeholder="URL" class="control-input bg-white h-9">
                                    </div>
                                </div>

                                <!-- LINK 3 -->
                                <div id="preview-cta-3-container"
                                    class="link-item p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group-link {{ empty($hero->cta_3_text) ? 'hidden' : '' }}">
                                    <div class="flex justify-between items-center">
                                        <label
                                            class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">LINK
                                            3</label>
                                        <button type="button" onclick="removePreviewCta(3)"
                                            class="text-slate-300 hover:text-red-500 transition-colors">
                                            <i class="fa-regular fa-trash-can text-[13px]"></i>
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <input type="text" id="cta3TextInput" value="{{ $hero->cta_3_text }}"
                                            placeholder="Text" data-target="hero-cta-3"
                                            class="control-input bg-white h-9">
                                        <input type="text" id="cta3UrlInput" value="{{ $hero->cta_3_url }}"
                                            placeholder="URL" class="control-input bg-white h-9">
                                    </div>
                                </div>

                                <button type="button" id="preview-add-cta-btn" onclick="addPreviewCta()"
                                    class="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-medium {{ (!empty($hero->cta_2_text) && !empty($hero->cta_3_text)) ? 'hidden' : '' }}">
                                    <i class="fa-solid fa-plus text-xs"></i>
                                    Add CTA Link
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Colors -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Colors</h3>

                        @php
                            $styles = $hero->custom_styles ?? [];
                        @endphp

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Background</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="bgColorPicker"
                                        value="{{ $styles['bg_color'] ?? '#ffffff' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Title</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="titleColorPicker"
                                        value="{{ $styles['title_color'] ?? '#000000' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Subtitle</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="subtitleColorPicker"
                                        value="{{ $styles['subtitle_color'] ?? '#374151' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Description</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="descColorPicker"
                                        value="{{ $styles['description_color'] ?? '#4B5563' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Button Bg</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="buttonColorPicker"
                                        value="{{ $styles['button_bg_color'] ?? '#3B82F6' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Button Text</label>
                                <div
                                    class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                    <input type="color" id="buttonTextColorPicker"
                                        value="{{ $styles['button_text_color'] ?? '#FFFFFF' }}"
                                        class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                    <span class="text-xs text-slate-600 font-mono">HEX</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Typography & Layout -->
                    <div class="space-y-6 pt-6 border-t border-slate-100">
                        <h3 class="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">Typography & Layout
                        </h3>

                        <div class="space-y-4">
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Title Size</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="titleSizeValue">{{ $styles['title_size'] ?? 48 }}px</span>
                                </div>
                                <input type="range" id="titleSizeSlider" min="24" max="96"
                                    value="{{ $styles['title_size'] ?? 48 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Subtitle Size</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="subtitleSizeValue">{{ $styles['subtitle_size'] ?? 24 }}px</span>
                                </div>
                                <input type="range" id="subtitleSizeSlider" min="16" max="48"
                                    value="{{ $styles['subtitle_size'] ?? 24 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Description Size</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="descSizeValue">{{ $styles['description_size'] ?? 18 }}px</span>
                                </div>
                                <input type="range" id="descSizeSlider" min="12" max="32"
                                    value="{{ $styles['description_size'] ?? 18 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <label class="text-sm font-normal text-slate-600">Desc. Spacing</label>
                                    <span class="text-sm font-normal text-indigo-500"
                                        id="descPaddingValue">{{ $styles['description_padding'] ?? 32 }}px</span>
                                </div>
                                <input type="range" id="descPaddingSlider" min="0" max="100"
                                    value="{{ $styles['description_padding'] ?? 32 }}"
                                    class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <label class="text-sm font-normal text-slate-600">Section Padding</label>
                                    <span class="text-sm font-normal text-indigo-500"
                                        id="paddingValue">{{ $styles['padding'] ?? 80 }}px</span>
                                </div>
                                <input type="range" id="paddingSlider" min="40" max="200"
                                    value="{{ $styles['padding'] ?? 80 }}"
                                    class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <label class="text-sm font-normal text-slate-600">Image Size</label>
                                    <span class="text-sm font-normal text-indigo-500"
                                        id="imageSizeValue">{{ $styles['image_size'] ?? 100 }}%</span>
                                </div>
                                <input type="range" id="imageSizeSlider" min="10" max="200"
                                    value="{{ $styles['image_size'] ?? 100 }}"
                                    class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>
                        </div>
                    </div>

                    <!-- Background Image -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Background Image</h3>

                        <div class="space-y-3">
                            @if($hero->background_image)
                                <div class="relative group">
                                    <img src="{{ (str_starts_with($hero->background_image, 'http') || str_starts_with($hero->background_image, '/images/') || str_starts_with($hero->background_image, '/storage/')) ? $hero->background_image : '/storage/' . ltrim($hero->background_image, '/') }}"
                                        alt="Background Preview"
                                        class="w-full h-40 object-cover rounded-lg border border-slate-300">
                                    <div
                                        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center">
                                        <button type="button"
                                            onclick="document.getElementById('backgroundImageInput').click()"
                                            class="opacity-0 group-hover:opacity-100 px-3 py-2 bg-white text-slate-900 rounded text-xs font-semibold transition-opacity">
                                            Change Image
                                        </button>
                                    </div>
                                </div>
                            @else
                                <div class="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                    onclick="document.getElementById('backgroundImageInput').click()">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke-width="1.5" stroke="currentColor"
                                        class="w-8 h-8 mx-auto text-slate-400 mb-2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z" />
                                    </svg>
                                    <p class="text-xs text-slate-600">Click to upload image</p>
                                </div>
                            @endif

                            <input type="file" id="backgroundImageInput" accept="image/*" class="hidden"
                                onchange="handleBackgroundImageChange(event)">

                            <div id="imageUploadStatus" class="text-xs text-slate-600 hidden">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin">
                                    </div>
                                    <span>Uploading image...</span>
                                </div>
                            </div>
                        </div>

                        <!-- Background Effects -->
                        <div class="space-y-4 pt-4 border-t border-slate-200">
                            <h4 class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Background Effects</h4>

                            <!-- Opacity Slider -->
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Opacity</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="bgOpacityValue">{{ $styles['bg_opacity'] ?? 100 }}%</span>
                                </div>
                                <input type="range" id="bgOpacitySlider" min="0" max="100"
                                    value="{{ $styles['bg_opacity'] ?? 100 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <!-- Blur Slider -->
                            <div class="space-y-3">
                                <div class="flex justify-between items-center px-0.5">
                                    <label class="text-[13px] text-slate-600">Blur</label>
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="bgBlurValue">{{ $styles['bg_blur'] ?? 0 }}px</span>
                                </div>
                                <input type="range" id="bgBlurSlider" min="0" max="20"
                                    value="{{ $styles['bg_blur'] ?? 0 }}"
                                    class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            </div>

                            <!-- Overlay Color & Opacity -->
                            <div class="space-y-3 pt-2 border-t border-slate-200">
                                <label class="text-[13px] text-slate-600">Overlay Color</label>
                                <div class="flex items-center gap-2">
                                    <div
                                        class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1 flex-1">
                                        <input type="color" id="overlayColorPicker"
                                            value="{{ $styles['overlay_color'] ?? '#000000' }}"
                                            class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                        <span class="text-xs text-slate-600 font-mono flex-1">Color</span>
                                    </div>
                                    <div class="flex-1">
                                        <input type="range" id="overlayOpacitySlider" min="0" max="100"
                                            value="{{ $styles['overlay_opacity'] ?? 0 }}"
                                            class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="text-[11px] font-medium text-indigo-500"
                                        id="overlayOpacityValue">{{ $styles['overlay_opacity'] ?? 0 }}%</span>
                                </div>
                            </div>

                            <!-- Gradient Overlay -->
                            <div class="space-y-3 pt-2 border-t border-slate-200">
                                <label class="text-[13px] text-slate-600">Gradient Overlay</label>
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <label class="text-xs text-slate-500 w-16">From</label>
                                        <div
                                            class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1 flex-1">
                                            <input type="color" id="gradientFromColorPicker"
                                                value="{{ $styles['gradient_from_color'] ?? '#000000' }}"
                                                class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <label class="text-xs text-slate-500 w-16">To</label>
                                        <div
                                            class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-2 py-1 flex-1">
                                            <input type="color" id="gradientToColorPicker"
                                                value="{{ $styles['gradient_to_color'] ?? '#ffffff' }}"
                                                class="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer">
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <label class="text-xs text-slate-500 w-16">Opacity</label>
                                        <input type="range" id="gradientOpacitySlider" min="0" max="100"
                                            value="{{ $styles['gradient_opacity'] ?? 0 }}"
                                            class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                                        <span class="text-[11px] font-medium text-indigo-500 w-12 text-right"
                                            id="gradientOpacityValue">{{ $styles['gradient_opacity'] ?? 0 }}%</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <label class="text-xs text-slate-500 w-16">Angle</label>
                                        <input type="range" id="gradientAngleSlider" min="0" max="360"
                                            value="{{ $styles['gradient_angle'] ?? 180 }}"
                                            class="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                                        <span class="text-[11px] font-medium text-indigo-500 w-12 text-right"
                                            id="gradientAngleValue">{{ $styles['gradient_angle'] ?? 180 }}°</span>
                                    </div>
                                </div>
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
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 17.25v-1.007c0-.197.105-.377.276-.474l.294-.156a2.013 2.013 0 001.03-1.758l-.002-8.36a2.013 2.013 0 00-1.996-2.012H9.398a2.013 2.013 0 00-1.996 2.012l-.002 8.36a2.013 2.013 0 001.03 1.758l.294.156c.17.097.276.277.276.474z" />
                                </svg>
                            </button>
                            <button onclick="setDevice('tablet')" id="btn-tablet"
                                class="device-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all"
                                title="Tablet (768px)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </button>
                            <button onclick="setDevice('mobile')" id="btn-mobile"
                                class="device-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all"
                                title="Mobile (375px)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <button onclick="saveChanges('{{ $hero->navbar ? route('navbar.generate', $hero->navbar->id) : route('navbar.create', $hero->id) }}')"
                            class="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                            <span>Next Section</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </button>

                        <button onclick="copyCode()"
                            class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all font-bold" id="code-panel-toggle">
                            <i class="fa-solid fa-code"></i>
                            <span class="toggle-label">{{ $needsGeneration ?? false ? 'Hide Code' : 'Show Code' }}</span>
                            @if($needsGeneration ?? false)
                                <div class="badge"></div>
                            @endif
                        </button>

                        <form action="{{ route('hero.regenerate', $hero->id) }}" method="POST" class="inline">
                            @csrf
                            <button type="submit"
                                class="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                Regenerate
                            </button>
                        </form>

                        <a href="{{ route('hero.create') }}"
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
                        <div id="website-canvas" class="relative z-10 w-full">
                            @if(!empty($navbarContent))
                                <div class="navbar-preview-context">{!! $navbarContent !!}</div>
                            @endif

                            <div id="hero-wrapper" class="hero-preview-content">
                                @include('hero.preview-content')
                            </div>

                            @if(!empty($aboutContent))
                                <div class="about-preview-context border-t border-slate-100">{!! $aboutContent !!}</div>
                            @endif

                            @if(!empty($servicesContent))
                                <div class="services-preview-context border-t border-slate-100">{!! $servicesContent !!}
                                </div>
                            @endif

                            @if(!empty($whyUsContent))
                                <div class="why-us-preview-context border-t border-slate-100">{!! $whyUsContent !!}</div>
                            @endif

                            @if(!empty($workContent))
                                <div class="work-preview-context border-t border-slate-100">{!! $workContent !!}</div>
                            @endif

                            @if(!empty($skillsContent))
                                <div class="skills-preview-context border-t border-slate-100">{!! $skillsContent !!}</div>
                            @endif

                            @if(!empty($contactContent))
                                <div class="contact-preview-context border-t border-slate-100">{!! $contactContent !!}</div>
                            @endif

                            @if(!empty($footerContent))
                                <div class="footer-preview-context border-t border-slate-100">{!! $footerContent !!}</div>
                            @endif
                        </div>

                        <!-- Resize Handles -->
                        <div class="resize-handle resizer-r absolute right-0 top-0 w-3 h-full cursor-ew-resize hover:bg-indigo-500/20 hover:scale-x-150 transition-all z-20"
                            style="cursor: col-resize;"></div>
                        <div class="resize-handle resizer-b absolute bottom-0 left-0 w-full h-3 cursor-ns-resize hover:bg-indigo-500/20 hover:scale-y-150 transition-all z-20"
                            style="cursor: row-resize;"></div>
                        <div class="resize-handle resizer-rb absolute right-0 bottom-0 w-6 h-6 cursor-nwse-resize hover:bg-indigo-500/20 hover:scale-125 transition-all z-30 flex items-center justify-center"
                            style="cursor: nwse-resize;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10"
                                fill="none" class="text-slate-400">
                                <path d="M9 1V9H1" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>

                    <!-- Overlay to catch events when dragging -->
                        <div id="drag-overlay" class="absolute inset-0 z-10 hidden"></div>
                    </div>

                    <!-- AI Code Modifier Tool -->
                    <div class="w-full max-w-6xl mx-auto mt-8 relative z-10 mb-8">
                        <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-indigo-100/50 rounded-2xl p-6 flex gap-4 items-start transition-all duration-300 hover:shadow-2xl hover:border-indigo-200/80">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                <i class="fa-solid fa-wand-magic-sparkles text-white text-lg"></i>
                            </div>
                            <div class="flex-1 relative">
                                <h3 class="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    AI Design Assistant
                                    <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider">Free Model</span>
                                </h3>
                                <div class="relative w-full">
                                    <textarea id="ai-modifier-input" rows="2" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-4 pr-24 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all resize-none placeholder-slate-400" placeholder="e.g. Make the text bigger and change the button to red..."></textarea>
                                    <div class="absolute right-3 top-3 flex items-center gap-1.5 z-20">
                                        <!-- Language Toggle -->
                                        <button type="button" id="voice-lang-btn" onclick="toggleVoiceLang()" class="px-2 py-1 text-[10px] font-extrabold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200 uppercase select-none" title="Click to toggle language (Arabic / English)">
                                            AR
                                        </button>
                                        <!-- Mic Button -->
                                        <button type="button" id="ai-voice-btn" onclick="toggleVoiceInput()" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center border border-slate-200" title="Voice Input (Mic)">
                                            <i class="fa-solid fa-microphone text-sm" id="voice-icon"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mt-3 flex justify-between items-center">
                                    <p class="text-xs text-slate-500 font-medium">
                                        <i class="fa-solid fa-circle-info mr-1"></i> Describes what you want to change in the current section's design.
                                    </p>
                                    <button id="ai-modifier-btn" onclick="modifyCodeWithAI()" class="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-slate-200 hover:shadow-indigo-200 flex items-center gap-2 group">
                                        <span class="btn-text" id="ai-modifier-btn-text">Generate Magic</span>
                                        <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" id="ai-modifier-btn-icon"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="text-center text-xs text-slate-500 mt-4 font-mono z-10" id="size-label">
                        Desktop - 100%
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Code Modal (Hidden by default) -->
    <div id="codeModal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" onclick="toggleCodeModal()"></div>
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 class="text-slate-900 font-semibold">Generated Code</h3>
                <button onclick="toggleCodeModal()" class="text-slate-500 hover:text-slate-900">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                        stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-0 overflow-auto max-h-[600px]">
                <pre
                    class="p-6 text-sm font-mono text-slate-800 bg-slate-50"><code id="generatedCode">{{ $hero->generated_code }}</code></pre>
            </div>
        </div>
    </div>

    <script>
        // Initialize state
        let currentStyles = {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            buttonColor: '#3b82f6',
            overlayColor: '#000000',
            titleSize: '48',
            subtitleSize: '24',
            descriptionSize: '18',
            descriptionPadding: '32',
            padding: '80',
            imageSize: '100'
        };

        function runInitialization() {
            // initializeControls();
            addEventListeners();
            // Only apply initial styles if the hero element is already in the DOM
            // (when NEEDS_GENERATION=false i.e. code already exists)
            const heroExists = document.querySelector('.hero-preview-content .hero');
            if (heroExists) {
                const heroWrapper = document.querySelector('.hero-preview-wrapper');
                const bgUrl = heroWrapper?.dataset?.bgUrl;
                if (bgUrl) {
                    applyHeroBackgroundImage(bgUrl);
                }
                applyInitialStyles();
            }
            
            // Explicitly set initial device state to apply correct height constraints
            if (typeof setDevice === 'function') {
                setDevice('desktop');
            }
        }

        if (document.readyState !== 'loading') {
            runInitialization();
        } else {
            document.addEventListener('DOMContentLoaded', runInitialization);
        }

        // Ensure hero-bg and hero-bg-image structure exists,
        // separating the actual background IMAGE from the solid COLOR
        function ensureBackgroundStructure(heroWrapper) {
            let heroBg = heroWrapper.querySelector('.hero-bg');
            const heroEl = heroWrapper.querySelector('.hero');
            
            if (!heroBg) {
                if (!heroEl) return { heroBg: null, bgImage: null };

                heroBg = document.createElement('div');
                heroBg.className = 'hero-bg';
                heroBg.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1;';
                
                heroEl.style.position = 'relative';
                heroEl.insertBefore(heroBg, heroEl.firstChild);

                const heroContent = heroEl.querySelector('.hero-content');
                if (heroContent) {
                    heroContent.style.position = 'relative';
                    heroContent.style.zIndex = '2';
                }
            }

            // Always ensure background is transferred from .hero to .hero-bg
            // (Even if .hero-bg already existed, the image is injected into .hero by backend)
            if (heroEl) {
                if (heroEl.style.background) {
                    heroBg.style.background = heroEl.style.background;
                    heroEl.style.background = '';
                }
                if (heroEl.style.backgroundColor) {
                    heroBg.style.backgroundColor = heroEl.style.backgroundColor;
                    heroEl.style.backgroundColor = '';
                }
                if (heroEl.style.backgroundImage) {
                    heroBg.style.backgroundImage = heroEl.style.backgroundImage;
                    heroEl.style.backgroundImage = '';
                }
                if (heroEl.style.backgroundSize) {
                    heroBg.style.backgroundSize = heroEl.style.backgroundSize;
                    heroEl.style.backgroundSize = '';
                }
            }

            // Separate image from solid color background
            let bgImage = heroBg.querySelector('.hero-bg-image');
            if (!bgImage) {
                bgImage = document.createElement('div');
                bgImage.className = 'hero-bg-image';
                bgImage.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; pointer-events: none;';
                heroBg.appendChild(bgImage);
            }

            const rawBg = heroBg.style.backgroundImage || '';
            const hasImage = rawBg && rawBg !== 'none' && !rawBg.includes('linear-gradient(');

            if (hasImage) {
                const imgCssValue = heroBg.style.backgroundImage;
                bgImage.style.backgroundImage = imgCssValue;
                bgImage.style.backgroundSize = heroBg.style.backgroundSize || 'cover';
                bgImage.style.backgroundPosition = heroBg.style.backgroundPosition || 'center';
                bgImage.style.backgroundRepeat = heroBg.style.backgroundRepeat || 'no-repeat';
                // Store the CSS image value so rebuildBackgroundEffects can use it
                bgImage.dataset.originalBgImage = imgCssValue;
                // Clear image from parent so it only has the bg color
                heroBg.style.backgroundImage = 'none';
                heroBg.style.backgroundSize = '';
                heroBg.style.backgroundPosition = '';
                heroBg.style.backgroundRepeat = '';
            }

            return { heroBg, bgImage };
        }

        function applyInitialStyles() {
            const heroWrapper = document.querySelector('.hero-preview-content');
            if (!heroWrapper) return;

            const { heroBg, bgImage } = ensureBackgroundStructure(heroWrapper);

            // Keep heroBg transparent so .hero-bg-image shows through, but ensure it's absolute
            if (heroBg) {
                heroBg.style.cssText = 'position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: transparent !important; z-index: 0 !important; pointer-events: none;';
            }

            // Apply backgrounds (solid color on .hero, image is in .hero-bg-image layer)
            const bgColor = document.getElementById('bgColorPicker')?.value || '#ffffff';
            heroWrapper.style.setProperty('--hero-bg', bgColor);
            const heroEl = heroWrapper.querySelector('.hero');
            if (heroEl && !heroEl.style.backgroundImage) {
                heroEl.style.backgroundColor = bgColor;
            }
            const heroBgEl = heroWrapper.querySelector('.hero-bg');
            if (heroBgEl) {
                heroBgEl.style.backgroundColor = bgColor;
            }

            // Apply text colors (inline styles to override hardcoded AI colors)
            const titleColor = document.getElementById('titleColorPicker')?.value || '#000000';
            const subtitleColor = document.getElementById('subtitleColorPicker')?.value || '#374151';
            const descColor = document.getElementById('descColorPicker')?.value || '#4B5563';
            const btnBg = document.getElementById('buttonColorPicker')?.value || '#3B82F6';
            const btnText = document.getElementById('buttonTextColorPicker')?.value || '#FFFFFF';

            heroWrapper.style.setProperty('--hero-title', titleColor);
            heroWrapper.style.setProperty('--hero-subtitle', subtitleColor);
            heroWrapper.style.setProperty('--hero-description', descColor);
            heroWrapper.style.setProperty('--hero-btn-bg', btnBg);
            heroWrapper.style.setProperty('--hero-btn-text', btnText);

            const titleEl = heroWrapper.querySelector('.hero-title');
            if (titleEl) titleEl.style.color = titleColor;

            const subtitleEl = heroWrapper.querySelector('.hero-subtitle');
            if (subtitleEl) subtitleEl.style.color = subtitleColor;

            const descEl = heroWrapper.querySelector('.hero-description');
            if (descEl) descEl.style.color = descColor;

            const btnEls = heroWrapper.querySelectorAll('.hero-button, .hero-cta-2, .hero-cta-3');
            btnEls.forEach(el => {
                el.style.backgroundColor = btnBg;
                el.style.color = btnText;
            });

            // Apply sizes and fix line-height
            const titleSize = (document.getElementById('titleSizeSlider')?.value || 48) + 'px';
            heroWrapper.style.setProperty('--hero-title-size', titleSize);
            if (titleEl) {
                titleEl.style.fontSize = titleSize;
                titleEl.style.lineHeight = '1.2';
            }

            const subtitleSize = (document.getElementById('subtitleSizeSlider')?.value || 24) + 'px';
            heroWrapper.style.setProperty('--hero-subtitle-size', subtitleSize);
            if (subtitleEl) {
                subtitleEl.style.fontSize = subtitleSize;
                subtitleEl.style.lineHeight = '1.4';
            }

            const descSize = (document.getElementById('descSizeSlider')?.value || 18) + 'px';
            heroWrapper.style.setProperty('--hero-description-size', descSize);
            if (descEl) {
                descEl.style.fontSize = descSize;
                descEl.style.lineHeight = '1.6';
            }

            const descPadding = (document.getElementById('descPaddingSlider')?.value || 32) + 'px';
            heroWrapper.style.setProperty('--hero-description-padding', descPadding);
            if (descEl) descEl.style.marginBottom = descPadding;

            const imageSizeVal = document.getElementById('imageSizeSlider')?.value || 100;
            const imageSize = parseInt(imageSizeVal) === 100 ? 'cover' : imageSizeVal + '%';
            heroWrapper.style.setProperty('--hero-bg-size', imageSize);

            // Force direct style on hero and hero-right
            const updateBg = (el) => {
                if (el) {
                    el.style.backgroundSize = imageSize;
                    el.style.backgroundRepeat = 'no-repeat';
                    el.style.backgroundPosition = 'center';
                }
            };
            updateBg(heroEl);
            updateBg(heroWrapper.querySelector('.hero-right'));

            // Apply background effects to the image div (.hero-bg-image) only
            if (bgImage) {
                // Also apply the size to bgImage so it matches the slider
                bgImage.style.backgroundSize = imageSize;

                const bgOpacity = document.getElementById('bgOpacitySlider')?.value || 100;
                bgImage.style.opacity = bgOpacity / 100;

                const bgBlur = document.getElementById('bgBlurSlider')?.value || 0;
                if (bgBlur > 0) {
                    bgImage.style.filter = `blur(${bgBlur}px)`;
                } else {
                    bgImage.style.filter = 'none';
                }

                rebuildBackgroundEffects();
            }
        }

        function initializeControls() {
            // Initialize color pickers from computed styles of the preview
            const heroWrapper = document.querySelector('.hero-preview-content');
            if (heroWrapper) {
                // Try to find the actual hero element inside
                const hero = heroWrapper.querySelector('.hero') || heroWrapper;
                const styles = window.getComputedStyle(hero);

                const setPicker = (id, color) => {
                    const el = document.getElementById(id);
                    if (el && color) {
                        const hex = rgb2hex(color);
                        if (hex) el.value = hex;
                    }
                };

                // We might need to look for specific variables if they are set
                setPicker('bgColorPicker', styles.getPropertyValue('--hero-bg') || styles.backgroundColor);
                setPicker('titleColorPicker', styles.getPropertyValue('--hero-title') || styles.color);
                setPicker('subtitleColorPicker', styles.getPropertyValue('--hero-subtitle') || styles.color);
                setPicker('descColorPicker', styles.getPropertyValue('--hero-description') || styles.color);

                // DO NOT overwrite button colors - they are already correctly set from database in the HTML
                // setPicker('buttonColorPicker', styles.getPropertyValue('--hero-btn-bg'));
                // setPicker('buttonTextColorPicker', styles.getPropertyValue('--hero-btn-text'));
            }
        }

        // Helper function to safely attach event listeners
        function safeAttachListener(id, event, handler) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(event, handler);
                return true;
            }
            return false;
        }

        function addEventListeners() {
            const heroWrapper = document.querySelector('.hero-preview-content');

            // Text Inputs
            document.querySelectorAll('.control-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    if (!heroWrapper) return;

                    const value = e.target.value;
                    const id = e.target.id;
                    const targetClass = e.target.dataset.target;

                    // Support for URL updates
                    if (id === 'cta2UrlInput' || id === 'cta3UrlInput' || id === 'ctaUrlInput') {
                        const btnClass = id === 'cta2UrlInput' ? 'hero-cta-2' : (id === 'cta3UrlInput' ? 'hero-cta-3' : 'hero-button');
                        const btnEl = heroWrapper.querySelector(`.${btnClass}`);
                        if (btnEl) btnEl.href = value;
                        return;
                    }

                    if (!targetClass) return;

                    // Find or Create element
                    let targetEl = heroWrapper.querySelector(`.${targetClass}`);

                    if (!targetEl && value.trim() !== '') {
                        // Injection logic if element is missing
                        if (targetClass === 'hero-subtitle') {
                            const title = heroWrapper.querySelector('.hero-title');
                            if (title) {
                                targetEl = document.createElement('p');
                                targetEl.className = 'hero-subtitle';
                                title.after(targetEl);
                            }
                        } else if (targetClass === 'hero-cta-2' || targetClass === 'hero-cta-3') {
                            const actions = heroWrapper.querySelector('.hero-actions');
                            const primaryBtn = heroWrapper.querySelector('.hero-button');
                            const prevBtnClass = targetClass === 'hero-cta-2' ? 'hero-button' : 'hero-cta-2';
                            const prevBtn = heroWrapper.querySelector(`.${prevBtnClass}`);

                            targetEl = document.createElement('a');
                            targetEl.className = targetClass;
                            // Set initial URL from input fields
                            const urlInput = document.getElementById(targetClass === 'hero-cta-2' ? 'cta2UrlInput' : 'cta3UrlInput');
                            targetEl.href = urlInput ? urlInput.value : '#';

                            if (actions) {
                                actions.appendChild(targetEl);
                            } else if (targetClass === 'hero-cta-3' && cta2) {
                                cta2.after(targetEl);
                            } else if (primaryBtn) {
                                primaryBtn.after(targetEl);
                            } else {
                                const desc = heroWrapper.querySelector('.hero-description') || heroWrapper.querySelector('.hero-title');
                                if (desc) {
                                    const wrap = document.createElement('div');
                                    wrap.className = 'hero-actions';
                                    wrap.style.marginTop = '2rem';
                                    wrap.style.display = 'flex';
                                    wrap.style.gap = '1rem';
                                    wrap.style.justifyContent = 'inherit';
                                    desc.after(wrap);
                                    wrap.appendChild(targetEl);
                                }
                            }

                            // Set initial styles from variables to ensure visibility
                            targetEl.style.backgroundColor = 'var(--hero-btn-bg)';
                            targetEl.style.color = 'var(--hero-btn-text)';

                            // Synchronize styling with primary button
                            if (primaryBtn) {
                                const pStyles = window.getComputedStyle(primaryBtn);
                                targetEl.style.padding = pStyles.padding;
                                targetEl.style.borderRadius = pStyles.borderRadius;
                                targetEl.style.transition = pStyles.transition;
                                targetEl.style.fontWeight = pStyles.fontWeight;
                                targetEl.style.display = 'inline-block';
                                targetEl.style.textDecoration = 'none';
                            }
                        }
                    }

                    if (targetEl) {
                        targetEl.textContent = value;

                        // Ensure subtitle is always UNDER the title
                        if (targetClass === 'hero-subtitle' && value.trim() !== '') {
                            const title = heroWrapper.querySelector('.hero-title');
                            if (title && targetEl.previousElementSibling !== title) {
                                title.after(targetEl);
                            }
                        }

                        // Style CTAs
                        if (targetClass.includes('cta') || targetClass === 'hero-button') {
                            targetEl.style.backgroundColor = 'var(--hero-btn-bg)';
                            targetEl.style.color = 'var(--hero-btn-text)';
                            // Old style radius
                            targetEl.style.borderRadius = '0.75rem';
                            targetEl.style.padding = '1rem 2.5rem';
                        }

                        // Handle visibility
                        const optionalClasses = ['hero-subtitle', 'hero-cta-2', 'hero-cta-3'];
                        if (optionalClasses.includes(targetClass)) {
                            targetEl.style.display = value.trim() === '' ? 'none' : 'inline-block';
                        }
                    }
                });
            });

            // Color Pickers
            const updateColor = (variable, value) => {
                if (!heroWrapper) return;
                // Set variable on the wrapper so it cascades down
                heroWrapper.style.setProperty(variable, value);

                // Also try setting on the .hero element directly if it exists, just in case
                const hero = heroWrapper.querySelector('.hero');
                if (hero) hero.style.setProperty(variable, value);

                // CRITICAL: Also apply inline styles directly to override hardcoded colors
                if (variable === '--hero-title') {
                    const el = heroWrapper.querySelector('.hero-title');
                    if (el) el.style.color = value;
                } else if (variable === '--hero-subtitle') {
                    const el = heroWrapper.querySelector('.hero-subtitle');
                    if (el) el.style.color = value;
                } else if (variable === '--hero-description') {
                    const el = heroWrapper.querySelector('.hero-description');
                    if (el) el.style.color = value;
                } else if (variable === '--hero-btn-bg') {
                    const els = heroWrapper.querySelectorAll('.hero-button, .hero-cta-2, .hero-cta-3');
                    els.forEach(el => el.style.backgroundColor = value);
                } else if (variable === '--hero-btn-text') {
                    const els = heroWrapper.querySelectorAll('.hero-button, .hero-cta-2, .hero-cta-3');
                    els.forEach(el => el.style.color = value);
                } else if (variable === '--hero-bg') {
                    if (hero) hero.style.backgroundColor = value;
                    const heroBg = heroWrapper.querySelector('.hero-bg');
                    if (heroBg) heroBg.style.backgroundColor = value;
                }
            };

            safeAttachListener('bgColorPicker', 'input', (e) => updateColor('--hero-bg', e.target.value));
            safeAttachListener('titleColorPicker', 'input', (e) => updateColor('--hero-title', e.target.value));
            safeAttachListener('subtitleColorPicker', 'input', (e) => updateColor('--hero-subtitle', e.target.value));
            safeAttachListener('descColorPicker', 'input', (e) => updateColor('--hero-description', e.target.value));
            safeAttachListener('buttonColorPicker', 'input', (e) => updateColor('--hero-btn-bg', e.target.value));
            safeAttachListener('buttonTextColorPicker', 'input', (e) => updateColor('--hero-btn-text', e.target.value));

            // Sliders
            const updateSize = (variable, value, suffix = 'px') => {
                if (!heroWrapper) return;
                heroWrapper.style.setProperty(variable, value + suffix);

                // Fallback: Direct style manipulation for sizes if variables aren't used
                if (variable === '--hero-title-size') {
                    const el = heroWrapper.querySelector('.hero-title');
                    if (el) el.style.fontSize = value + suffix;
                } else if (variable === '--hero-subtitle-size') {
                    const el = heroWrapper.querySelector('.hero-subtitle');
                    if (el) el.style.fontSize = value + suffix;
                } else if (variable === '--hero-description-size') {
                    const el = heroWrapper.querySelector('.hero-description');
                    if (el) el.style.fontSize = value + suffix;
                } else if (variable === '--hero-description-padding') {
                    const el = heroWrapper.querySelector('.hero-description');
                    if (el) el.style.marginBottom = value + suffix;
                }
            };

            safeAttachListener('titleSizeSlider', 'input', (e) => {
                const val = document.getElementById('titleSizeValue');
                if (val) val.textContent = e.target.value + 'px';
                updateSize('--hero-title-size', e.target.value);
            });

            safeAttachListener('subtitleSizeSlider', 'input', (e) => {
                const val = document.getElementById('subtitleSizeValue');
                if (val) val.textContent = e.target.value + 'px';
                updateSize('--hero-subtitle-size', e.target.value);
            });

            safeAttachListener('descSizeSlider', 'input', (e) => {
                const val = document.getElementById('descSizeValue');
                if (val) val.textContent = e.target.value + 'px';
                updateSize('--hero-description-size', e.target.value);
            });

            safeAttachListener('descPaddingSlider', 'input', (e) => {
                const val = document.getElementById('descPaddingValue');
                if (val) val.textContent = e.target.value + 'px';
                updateSize('--hero-description-padding', e.target.value);
            });

            safeAttachListener('paddingSlider', 'input', (e) => {
                const val = document.getElementById('paddingValue');
                if (val) val.textContent = e.target.value + 'vh';
                const hero = heroWrapper?.querySelector('.hero');
                if (hero) hero.style.setProperty('min-height', `${e.target.value}vh`, 'important');
            });

            safeAttachListener('imageSizeSlider', 'input', (e) => {
                const value = e.target.value;
                const val = document.getElementById('imageSizeValue');
                const parsedVal = parseInt(value);
                const sizeValue = parsedVal === 100 ? 'cover' : value + '%';
                if (val) val.textContent = sizeValue === 'cover' ? 'Cover' : sizeValue;

                if (!heroWrapper) return;

                // 1. Handle Background Image (Centered/Left)
                heroWrapper.style.setProperty('--hero-bg-size', sizeValue);

                const heroEl = heroWrapper.querySelector('.hero');
                if (heroEl) {
                    heroEl.style.backgroundSize = sizeValue;
                }
                
                const heroBgImage = heroWrapper.querySelector('.hero-bg-image');
                if (heroBgImage) {
                    heroBgImage.style.backgroundSize = sizeValue;
                }

                // 2. Handle Split Layout Image (<img> tag)
                const heroImg = heroWrapper.querySelector('.hero-image');
                if (heroImg) {
                    // Map 100% to 500px as a base, so user can go from 50px to 1000px
                    const pixels = (value * 5) + 'px';
                    heroImg.style.maxHeight = pixels;
                    heroImg.style.width = 'auto'; // Maintain aspect ratio
                }
            });

            // Background Effects Event Listeners
            safeAttachListener('bgOpacitySlider', 'input', (e) => {
                const val = document.getElementById('bgOpacityValue');
                if (val) val.textContent = e.target.value + '%';
                const bgImage = heroWrapper?.querySelector('.hero-bg-image');
                if (bgImage) {
                    bgImage.style.opacity = e.target.value / 100;
                }
            });

            safeAttachListener('bgBlurSlider', 'input', (e) => {
                const val = document.getElementById('bgBlurValue');
                if (val) val.textContent = e.target.value + 'px';
                const bgImage = heroWrapper?.querySelector('.hero-bg-image');
                if (bgImage) {
                    if (e.target.value > 0) {
                        bgImage.style.filter = `blur(${e.target.value}px)`;
                    } else {
                        bgImage.style.filter = 'none';
                    }
                }
            });

            // Overlay Color & Opacity
            const updateOverlay = () => {
                rebuildBackgroundEffects();
            };

            safeAttachListener('overlayColorPicker', 'input', updateOverlay);
            safeAttachListener('overlayOpacitySlider', 'input', (e) => {
                const val = document.getElementById('overlayOpacityValue');
                if (val) val.textContent = e.target.value + '%';
                updateOverlay();
            });

            // Gradient Overlay
            const updateGradientOverlay = () => {
                rebuildBackgroundEffects();
            };

            safeAttachListener('gradientFromColorPicker', 'input', updateGradientOverlay);
            safeAttachListener('gradientToColorPicker', 'input', updateGradientOverlay);
            safeAttachListener('gradientOpacitySlider', 'input', (e) => {
                const val = document.getElementById('gradientOpacityValue');
                if (val) val.textContent = e.target.value + '%';
                updateGradientOverlay();
            });
            safeAttachListener('gradientAngleSlider', 'input', (e) => {
                const val = document.getElementById('gradientAngleValue');
                if (val) val.textContent = e.target.value + '°';
                updateGradientOverlay();
            });
        }



        function saveChanges(redirectTo, isSilent = false) {
            // Helper to safely get value or default
            const val = (id, def = '') => {
                const el = document.getElementById(id);
                return el ? el.value : def;
            };

            const updatedHero = {
                title: val('titleInput'),
                subtitle: val('subtitleInput'),
                cta_text: val('ctaTextInput'),
                cta_url: val('ctaUrlInput', '#'),
                description: val('descriptionInput'),
                cta_2_text: val('cta2TextInput'),
                cta_2_url: val('cta2UrlInput', '#'),
                cta_3_text: val('cta3TextInput'),
                cta_3_url: val('cta3UrlInput', '#'),
                styles: {
                    bg_color: val('bgColorPicker', '#ffffff'),
                    title_color: val('titleColorPicker', '#000000'),
                    subtitle_color: val('subtitleColorPicker', '#374151'),
                    description_color: val('descColorPicker', '#4B5563'),
                    button_bg_color: val('buttonColorPicker', '#3B82F6'),
                    button_text_color: val('buttonTextColorPicker', '#FFFFFF'),
                    title_size: val('titleSizeSlider', 48),
                    subtitle_size: val('subtitleSizeSlider', 24),
                    description_size: val('descSizeSlider', 18),
                    description_padding: val('descPaddingSlider', 32),
                    padding: val('paddingSlider', 80),
                    width: 80,
                    image_size: val('imageSizeSlider', 100),
                    bg_opacity: val('bgOpacitySlider', 100),
                    bg_blur: val('bgBlurSlider', 0),
                    overlay_color: val('overlayColorPicker', '#000000'),
                    overlay_opacity: val('overlayOpacitySlider', 0),
                    gradient_from_color: val('gradientFromColorPicker', '#000000'),
                    gradient_to_color: val('gradientToColorPicker', '#ffffff'),
                    gradient_opacity: val('gradientOpacitySlider', 0),
                    gradient_angle: val('gradientAngleSlider', 180)
                },
                generated_code: document.getElementById('hero-canvas-inner') ? document.getElementById('hero-canvas-inner').innerHTML.trim().replace(/&quot;/g, "'") : null
            };

            // Send to server
            fetch(`/hero/{{ $hero->id }}/update-design`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(updatedHero)
            })
                .then(res => res.json())
                .then(data => {
                    console.log('Save response:', data); // Debug

                    if (data.success && data.hero) {
                        // Update external CSS block if returned
                        if (data.css !== undefined) {
                            let styleBlock = document.getElementById('hero-custom-styles');
                            if (styleBlock) {
                                styleBlock.outerHTML = data.css;
                            } else {
                                const wrapper = document.querySelector('.hero-preview-wrapper');
                                if (wrapper) {
                                    wrapper.insertAdjacentHTML('afterbegin', data.css);
                                }
                            }
                        }

                        currentCode = data.hero.generated_code;
                        if (!isSilent) {
                            showNotification('Changes saved!', 'success');

                            // ✅ RELOAD PAGE TO SHOW UPDATED CODE, or redirect if specified
                            setTimeout(() => {
                                if (redirectTo) {
                                    window.location.href = redirectTo;
                                } else {
                                    window.location.reload();
                                }
                            }, 500);
                        } // Small delay to show notification
                    } else {
                        showNotification(data.message || 'Error saving changes', 'error');
                    }
                })
                .catch(err => {
                    console.error('Save error:', err);
                    showNotification('Error saving changes', 'error');
                });
        }

        // Handle background image update
        function handleBackgroundImageChange(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Show loading status
            const statusDiv = document.getElementById('imageUploadStatus');
            statusDiv.classList.remove('hidden');

            const formData = new FormData();
            formData.append('background_image', file);

            fetch(`/hero/{{ $hero->id }}/update-background-image`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: formData
            })
                .then(async res => {
                    if (!res.ok) {
                        let errText = await res.text();
                        try {
                            const errJson = JSON.parse(errText);
                            errText = errJson.message || errJson.error || errText;
                        } catch (e) {}
                        throw new Error(`Upload failed (${res.status}): ${errText}`);
                    }
                    return res.json();
                })
                .then(data => {
                    statusDiv.classList.add('hidden');

                    if (data.success) {
                        const imageUrl = '/storage/' + data.path;
                        const fullImageUrl = imageUrl + '?t=' + Date.now();

                        // ── Update sidebar thumbnail ──
                        const previewImg = document.querySelector('img[alt="Background Preview"]');
                        if (previewImg) {
                            previewImg.src = fullImageUrl;
                        } else {
                            // Thumbnail doesn't exist yet - reload sidebar (but keep preview working below)
                            // We DON'T return here so the preview still gets updated
                        }

                        // ── Apply image to live preview based on layout ──
                        const heroWrapper = document.querySelector('.hero-preview-content');
                        const layoutStyle = '{{ $hero->layout_style }}';

                        if (heroWrapper) {
                            if (layoutStyle === 'split') {
                                // ✅ Split: update real <img class="hero-image"> src
                                let heroImg = heroWrapper.querySelector('img.hero-image');
                                if (heroImg) {
                                    heroImg.src = imageUrl + '?t=' + Date.now();
                                } else {
                                    // Fallback: inject img into .hero-right
                                    const heroRight = heroWrapper.querySelector('.hero-right');
                                    if (heroRight) {
                                        const img = document.createElement('img');
                                        img.src = imageUrl;
                                        img.alt = 'Hero Image';
                                        img.className = 'hero-image';
                                        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                                        heroRight.innerHTML = '';
                                        heroRight.appendChild(img);
                                    }
                                }
                            } else {
                                // ✅ Centered / Left-aligned: set background-image on .hero-bg-image
                                ensureBackgroundStructure(heroWrapper);
                                const bgImage = heroWrapper.querySelector('.hero-bg-image');
                                if (bgImage) {
                                    bgImage.dataset.originalBgImage = imageUrl;
                                    bgImage.style.backgroundImage = `url('${imageUrl}')`;
                                    bgImage.style.backgroundSize = 'cover';
                                    bgImage.style.backgroundPosition = 'center';
                                    bgImage.style.backgroundRepeat = 'no-repeat';
                                    // Re-apply overlay/gradient on top of the new image
                                    rebuildBackgroundEffects();
                                }
                            }
                        }

                        showNotification('Background image updated!', 'success');

                        // Reload after short delay to refresh thumbnail if it was missing
                        if (!previewImg) {
                            setTimeout(() => window.location.reload(), 1500);
                        }

                        // Reset file input
                        event.target.value = '';
                    } else {
                        showNotification(data.message || 'Failed to upload image', 'error');
                        statusDiv.classList.add('hidden');
                    }
                })
                .catch(err => {
                    console.error('Upload error:', err);
                    showNotification(err.message || 'Error uploading image', 'error');
                    statusDiv.classList.add('hidden');
                });
        }



        function copyCode() {
            toggleCodePanel();
        }

        function toggleCodeModal() {
            const modal = document.getElementById('codeModal');
            modal.classList.toggle('hidden');
        }

        function showNotification(msg, type) {
            // Simple notification implementation
            const div = document.createElement('div');
            div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} shadow-xl z-50 animate-fade-in-up`;
            div.textContent = msg;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }

        function rgb2hex(rgb) {
            if (!rgb) return null;
            if (rgb.startsWith('#')) return rgb;
            if (rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)' || rgb.replace(/\s+/g, '') === 'rgba(0,0,0,0)') {
                return null;
            }
            const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
            if (!match) return null;
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
            if (a === 0) return null; // transparent
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        }

        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        }

        function setDevice(type) {
            const container = document.getElementById('preview-container');
            const label = document.getElementById('size-label');
            const btns = {
                desktop: document.getElementById('btn-desktop'),
                tablet: document.getElementById('btn-tablet'),
                mobile: document.getElementById('btn-mobile')
            };

            // Add transition
            container.classList.add('transition-all', 'duration-500', 'ease-in-out');

            // Reset buttons
            Object.values(btns).forEach(btn => {
                btn.classList.remove('bg-indigo-50', 'text-indigo-600', 'shadow-sm');
                btn.classList.add('text-slate-400');
            });

            // Activate current
            btns[type].classList.add('bg-indigo-50', 'text-indigo-600', 'shadow-sm');
            btns[type].classList.remove('text-slate-400');

            // Reset height to fill when switching devices
            container.style.height = 'auto';
            container.style.minHeight = '600px';

            if (type === 'mobile') {
                container.style.width = '375px';
                container.style.borderRadius = '32px';
                container.style.border = '12px solid #1e293b';
                label.innerHTML = '<span class="flex items-center justify-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 110-2 1 1 0 010 2z"></path></svg> Mobile - 375px</span>';
            } else if (type === 'tablet') {
                container.style.width = '768px';
                container.style.borderRadius = '16px';
                container.style.border = '8px solid #334155';
                label.innerHTML = '<span class="flex items-center justify-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a1 1 0 110-2 1 1 0 010 2z"></path></svg> Tablet - 768px</span>';
            } else {
                container.style.width = '100.0%';
                container.style.width = '100%';
                container.style.borderRadius = '8px';
                container.style.border = '1px solid #e2e8f0';
                label.innerHTML = '<span class="flex items-center justify-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.11.34.4.67.12.18.06.03a1 1 0 01-.13 1.93l-.15.01H6.82l-.15-.01a1 1 0 01-.13-1.93l.06-.03.12-.18.4-.67.11-.34H5a2 2 0 01-2-2V5z"></path></svg> Desktop - 100%</span>';
            }

            // Remove transition after it's done to stay snappy during manual resize
            setTimeout(() => {
                container.classList.remove('transition-all', 'duration-500', 'ease-in-out');
            }, 600);
        }

        // Resizing Logic
        let isResizing = false;
        let currentResizer = null;
        const container = document.getElementById('preview-container');
        const overlay = document.getElementById('drag-overlay');
        const label = document.getElementById('size-label');

        container.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                currentResizer = e.target;
                overlay.classList.remove('hidden');
                container.classList.remove('transition-all', 'duration-300', 'ease-out');

                // Clear active device button state
                document.querySelectorAll('.device-btn').forEach(btn => {
                    btn.classList.remove('bg-indigo-50', 'text-indigo-600');
                    btn.classList.add('text-slate-400');
                });

                document.body.style.cursor = window.getComputedStyle(e.target).cursor;
            }
        });

        window.addEventListener('mousemove', function (e) {
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

        window.addEventListener('mouseup', function () {
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
    </script>

    <script>
        // Helper: apply background image to preview based on layout
        function applyHeroBackgroundImage(imagePath) {
            if (!imagePath) return;
            const heroWrapper = document.querySelector('.hero-preview-content');
            if (!heroWrapper) return;

            const layoutStyle = '{{ $hero->layout_style }}';
            if (layoutStyle === 'split') {
                let heroImg = heroWrapper.querySelector('img.hero-image');
                if (heroImg) {
                    if (!heroImg.src || heroImg.src === window.location.href) {
                        heroImg.src = imagePath;
                    }
                } else {
                    const heroRight = heroWrapper.querySelector('.hero-right');
                    if (heroRight) {
                        const img = document.createElement('img');
                        img.src = imagePath;
                        img.alt = 'Hero Image';
                        img.className = 'hero-image';
                        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                        heroRight.innerHTML = '';
                        heroRight.appendChild(img);
                    }
                }
            } else {
                ensureBackgroundStructure(heroWrapper);
                const bgImage = heroWrapper.querySelector('.hero-bg-image');
                if (bgImage) {
                    bgImage.dataset.originalBgImage = imagePath;
                    bgImage.style.backgroundImage = `url('${imagePath}')`;
                    const val = parseInt(document.getElementById('imageSizeSlider')?.value || 100);
                    bgImage.style.backgroundSize = val === 100 ? 'cover' : val + '%';
                    bgImage.style.backgroundPosition = 'center';
                    bgImage.style.backgroundRepeat = 'no-repeat';
                }
            }
        }

        // Rebuild background-image layers from scratch (image + overlay + gradient)
        function rebuildBackgroundEffects() {
            const heroWrapper = document.querySelector('.hero-preview-content');
            if (!heroWrapper) return;
            const bgImage = heroWrapper.querySelector('.hero-bg-image');
            if (!bgImage) return;

            let bgLayers = [];

            // 1. Gradient overlay (top layer)
            const gradientOpacity = document.getElementById('gradientOpacitySlider')?.value || 0;
            if (gradientOpacity > 0) {
                const fromColor = document.getElementById('gradientFromColorPicker')?.value || '#000000';
                const toColor = document.getElementById('gradientToColorPicker')?.value || '#ffffff';
                const angle = document.getElementById('gradientAngleSlider')?.value || 180;
                const fromRgb = hexToRgb(fromColor);
                const toRgb = hexToRgb(toColor);
                const fromGradient = `rgba(${fromRgb.r}, ${fromRgb.g}, ${fromRgb.b}, ${gradientOpacity / 100})`;
                const toGradient = `rgba(${toRgb.r}, ${toRgb.g}, ${toRgb.b}, ${gradientOpacity / 100})`;
                bgLayers.push(`linear-gradient(${angle}deg, ${fromGradient} 0%, ${toGradient} 100%)`);
            }

            // 2. Solid overlay (middle layer)
            const overlayOpacity = document.getElementById('overlayOpacitySlider')?.value || 0;
            if (overlayOpacity > 0) {
                const overlayColor = document.getElementById('overlayColorPicker')?.value || '#000000';
                const rgbColor = hexToRgb(overlayColor);
                const overlayRgba = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${overlayOpacity / 100})`;
                bgLayers.push(`linear-gradient(${overlayRgba}, ${overlayRgba})`);
            }

            // 3. The actual image (bottom layer) — read from data attribute to avoid double-wrapping
            const origImage = bgImage.dataset.originalBgImage;
            if (origImage) {
                // origImage can be a CSS url('...') or a plain path — use as-is
                bgLayers.push(origImage.startsWith('url(') ? origImage : `url('${origImage}')`);
            }

            bgImage.style.backgroundImage = bgLayers.length > 0 ? bgLayers.join(', ') : 'none';
        }

        // Re-apply styles after code panel updates the canvas via AJAX
        document.addEventListener('canvas-updated', function (e) {
            // Sync controls first so they match the HTML we are about to style
            if (e.detail && e.detail.code && typeof window.syncControlsFromHtml === 'function') {
                window.syncControlsFromHtml(e.detail.code);
            }

            // Read latest background image dynamically from the data attribute
            const heroWrapper = document.querySelector('.hero-preview-wrapper');
            const bgUrl = heroWrapper?.dataset?.bgUrl;
            if (bgUrl) {
                applyHeroBackgroundImage(bgUrl);
            }
            
            applyInitialStyles();

            // Auto-save synced styles to database on initial generate or AI edits
            if (e.detail && e.detail.isAiRegeneration && typeof saveChanges === 'function') {
                saveChanges(null, true);
            }
        });

        function removePreviewCta(num) {
            document.getElementById(`preview-cta-${num}-container`).classList.add('hidden');
            const txtInp = document.getElementById(num === 2 ? 'cta2TextInput' : 'cta3TextInput');
            const urlInp = document.getElementById(num === 2 ? 'cta2UrlInput' : 'cta3UrlInput');
            txtInp.value = '';
            urlInp.value = '#';

            // Dispatch input event to trigger preview update logic to remove the element or clear text
            txtInp.dispatchEvent(new Event('input', { bubbles: true }));

            checkAddBtnPreview();
        }

        function addPreviewCta() {
            const cta2 = document.getElementById('preview-cta-2-container');
            const cta3 = document.getElementById('preview-cta-3-container');

            if (cta2.classList.contains('hidden')) {
                cta2.classList.remove('hidden');
            } else if (cta3.classList.contains('hidden')) {
                cta3.classList.remove('hidden');
            }
            checkAddBtnPreview();
        }

        function checkAddBtnPreview() {
            const cta2 = document.getElementById('preview-cta-2-container');
            const cta3 = document.getElementById('preview-cta-3-container');
            const btn = document.getElementById('preview-add-cta-btn');

            if (!cta2.classList.contains('hidden') && !cta3.classList.contains('hidden')) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        }

        // Sync Sidebar Controls when AI modifies the HTML and is accepted
        window.syncControlsFromHtml = function(html) {
            if (!html) return;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Helper to convert rgb or rgba to hex for color pickers
            const rgbToHexStr = (rgbStr) => {
                if (!rgbStr || rgbStr === 'transparent') return null;
                const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
                if (match) {
                    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
                    if (a === 0) return null; // transparent
                    return "#" +
                        ("0" + parseInt(match[1], 10).toString(16)).slice(-2) +
                        ("0" + parseInt(match[2], 10).toString(16)).slice(-2) +
                        ("0" + parseInt(match[3], 10).toString(16)).slice(-2);
                }
                return rgbStr.startsWith('#') ? rgbStr : null;
            };

            // 1. Background color & Height spacing
            const heroEl = doc.querySelector('.hero');
            if (heroEl) {
                if (heroEl.style.backgroundColor) {
                    const hex = rgbToHexStr(heroEl.style.backgroundColor);
                    if (hex && document.getElementById('bgColorPicker')) {
                        document.getElementById('bgColorPicker').value = hex;
                    }
                }
                if (heroEl.style.minHeight) {
                    const heightMatch = heroEl.style.minHeight.match(/^(\d+)vh$/) || heroEl.style.minHeight.match(/^(\d+)px$/);
                    if (heightMatch && document.getElementById('paddingSlider')) {
                        const val = heightMatch[1];
                        document.getElementById('paddingSlider').value = val;
                        const label = document.getElementById('paddingValue');
                        if (label) label.textContent = val + 'vh';
                    }
                }
            }

            // 2. Title Section
            const titleEl = doc.querySelector('.hero-title');
            if (titleEl) {
                const input = document.getElementById('titleInput');
                if (input) input.value = titleEl.textContent.trim();
                
                if (titleEl.style.color) {
                    const hex = rgbToHexStr(titleEl.style.color);
                    if (hex && document.getElementById('titleColorPicker')) {
                        document.getElementById('titleColorPicker').value = hex;
                    }
                }
                if (titleEl.style.fontSize) {
                    const sizeMatch = titleEl.style.fontSize.match(/^(\d+)px$/);
                    if (sizeMatch && document.getElementById('titleSizeSlider')) {
                        const val = sizeMatch[1];
                        document.getElementById('titleSizeSlider').value = val;
                        const label = document.getElementById('titleSizeValue');
                        if (label) label.textContent = val + 'px';
                    }
                }
            }

            // 3. Subtitle Section
            const subtitleEl = doc.querySelector('.hero-subtitle');
            if (subtitleEl) {
                const input = document.getElementById('subtitleInput');
                if (input) input.value = subtitleEl.textContent.trim();
                
                if (subtitleEl.style.color) {
                    const hex = rgbToHexStr(subtitleEl.style.color);
                    if (hex && document.getElementById('subtitleColorPicker')) {
                        document.getElementById('subtitleColorPicker').value = hex;
                    }
                }
                if (subtitleEl.style.fontSize) {
                    const sizeMatch = subtitleEl.style.fontSize.match(/^(\d+)px$/);
                    if (sizeMatch && document.getElementById('subtitleSizeSlider')) {
                        const val = sizeMatch[1];
                        document.getElementById('subtitleSizeSlider').value = val;
                        const label = document.getElementById('subtitleSizeValue');
                        if (label) label.textContent = val + 'px';
                    }
                }
            }

            // 4. Description Section
            const descEl = doc.querySelector('.hero-description');
            if (descEl) {
                const input = document.getElementById('descriptionInput');
                if (input) input.value = descEl.textContent.trim();
                
                if (descEl.style.color) {
                    const hex = rgbToHexStr(descEl.style.color);
                    if (hex && document.getElementById('descColorPicker')) {
                        document.getElementById('descColorPicker').value = hex;
                    }
                }
                if (descEl.style.fontSize) {
                    const sizeMatch = descEl.style.fontSize.match(/^(\d+)px$/);
                    if (sizeMatch && document.getElementById('descSizeSlider')) {
                        const val = sizeMatch[1];
                        document.getElementById('descSizeSlider').value = val;
                        const label = document.getElementById('descSizeValue');
                        if (label) label.textContent = val + 'px';
                    }
                }
                if (descEl.style.marginBottom) {
                    const marginMatch = descEl.style.marginBottom.match(/^(\d+)px$/);
                    if (marginMatch && document.getElementById('descPaddingSlider')) {
                        const val = marginMatch[1];
                        document.getElementById('descPaddingSlider').value = val;
                        const label = document.getElementById('descPaddingValue');
                        if (label) label.textContent = val + 'px';
                    }
                }
            }

            // 5. CTA Links
            const cta1El = doc.querySelector('a.hero-button');
            if (cta1El) {
                const ctaTextInp = document.getElementById('ctaTextInput');
                if (ctaTextInp) ctaTextInp.value = cta1El.textContent.trim();
                
                const ctaUrlInp = document.getElementById('ctaUrlInput');
                if (ctaUrlInp) ctaUrlInp.value = cta1El.getAttribute('href') || '#';
                
                if (cta1El.style.backgroundColor) {
                    const hexBg = rgbToHexStr(cta1El.style.backgroundColor);
                    if (hexBg && document.getElementById('buttonColorPicker')) {
                        document.getElementById('buttonColorPicker').value = hexBg;
                    }
                }
                if (cta1El.style.color) {
                    const hexTxt = rgbToHexStr(cta1El.style.color);
                    if (hexTxt && document.getElementById('buttonTextColorPicker')) {
                        document.getElementById('buttonTextColorPicker').value = hexTxt;
                    }
                }
            }

            const cta2El = doc.querySelector('a.hero-cta-2');
            const cta2Container = document.getElementById('preview-cta-2-container');
            const cta2TextInp = document.getElementById('cta2TextInput');
            const cta2UrlInp = document.getElementById('cta2UrlInput');
            if (cta2El) {
                if (cta2TextInp) cta2TextInp.value = cta2El.textContent.trim();
                if (cta2UrlInp) cta2UrlInp.value = cta2El.getAttribute('href') || '#';
                if (cta2Container) cta2Container.classList.remove('hidden');
            } else {
                if (cta2TextInp) cta2TextInp.value = '';
                if (cta2UrlInp) cta2UrlInp.value = '#';
                if (cta2Container) cta2Container.classList.add('hidden');
            }

            const cta3El = doc.querySelector('a.hero-cta-3');
            const cta3Container = document.getElementById('preview-cta-3-container');
            const cta3TextInp = document.getElementById('cta3TextInput');
            const cta3UrlInp = document.getElementById('cta3UrlInput');
            if (cta3El) {
                if (cta3TextInp) cta3TextInp.value = cta3El.textContent.trim();
                if (cta3UrlInp) cta3UrlInp.value = cta3El.getAttribute('href') || '#';
                if (cta3Container) cta3Container.classList.remove('hidden');
            } else {
                if (cta3TextInp) cta3TextInp.value = '';
                if (cta3UrlInp) cta3UrlInp.value = '#';
                if (cta3Container) cta3Container.classList.add('hidden');
            }
            
            // 6. Background Image & Image Size Slider
            let bgImgUrl = null;
            if (heroEl && heroEl.style.backgroundImage && heroEl.style.backgroundImage !== 'none') {
                const match = heroEl.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) bgImgUrl = match[1];
            }
            const bgImageEl = doc.querySelector('.hero-bg-image');
            if (bgImageEl && bgImageEl.style.backgroundImage && bgImageEl.style.backgroundImage !== 'none') {
                const match = bgImageEl.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) bgImgUrl = match[1];
            }
            const wrapperEl = doc.querySelector('.hero-preview-wrapper');
            if (wrapperEl && wrapperEl.dataset.bgUrl) {
                bgImgUrl = wrapperEl.dataset.bgUrl;
            }
            const splitImgEl = doc.querySelector('img.hero-image');
            if (splitImgEl) {
                bgImgUrl = splitImgEl.getAttribute('src');
            }

            if (bgImgUrl) {
                const previewImg = document.querySelector('img[alt="Background Preview"]');
                if (previewImg) {
                    previewImg.src = bgImgUrl;
                }
                
                let bgSize = null;
                if (heroEl && heroEl.style.backgroundSize) bgSize = heroEl.style.backgroundSize;
                else if (bgImageEl && bgImageEl.style.backgroundSize) bgSize = bgImageEl.style.backgroundSize;
                
                if (bgSize && document.getElementById('imageSizeSlider')) {
                    if (bgSize === 'cover') {
                        document.getElementById('imageSizeSlider').value = 100;
                        const label = document.getElementById('imageSizeValue');
                        if (label) label.textContent = 'Cover';
                    } else {
                        const sizeMatch = bgSize.match(/^(\d+)%$/);
                        if (sizeMatch) {
                            const val = sizeMatch[1];
                            document.getElementById('imageSizeSlider').value = val;
                            const label = document.getElementById('imageSizeValue');
                            if (label) label.textContent = val + '%';
                        }
                    }
                }
            }

            checkAddBtnPreview();
        };

        // Voice Input Functionality
        let voiceLang = 'ar-EG';
        let isListening = false;
        let recognition = null;
        let silenceTimer = null;
        let restartTimeout = null;
        let consecutiveNetworkErrors = 0;
        let lastNetworkWarningTime = 0;
        let audioContext = null;
        let audioStream = null;
        let audioInterval = null;

        window.toggleVoiceLang = function() {
            const btn = document.getElementById('voice-lang-btn');
            if (voiceLang === 'ar-EG') {
                voiceLang = 'en-US';
                if (btn) {
                    btn.textContent = 'EN';
                    btn.classList.remove('bg-slate-100', 'text-slate-600');
                    btn.classList.add('bg-indigo-100', 'text-indigo-700', 'border-indigo-200');
                }
            } else {
                voiceLang = 'ar-EG';
                if (btn) {
                    btn.textContent = 'AR';
                    btn.classList.add('bg-slate-100', 'text-slate-600');
                    btn.classList.remove('bg-indigo-100', 'text-indigo-700', 'border-indigo-200');
                }
            }
            if (isListening && recognition) {
                stopListening();
                setTimeout(() => startListening(), 300);
            }
        };

        window.toggleVoiceInput = function() {
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!window.SpeechRecognition) {
                showNotification('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
                return;
            }

            if (isListening) {
                stopListening();
            } else {
                startListening();
            }
        };

        function startListening() {
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            // Clean up any existing local volume analyzer
            if (audioInterval) {
                clearInterval(audioInterval);
                audioInterval = null;
            }
            if (audioStream) {
                try {
                    audioStream.getTracks().forEach(track => track.stop());
                } catch(e) {}
                audioStream = null;
            }
            if (audioContext) {
                try {
                    if (audioContext.state !== 'closed') {
                        audioContext.close();
                    }
                } catch(e) {}
                audioContext = null;
            }

            // Abort previous instance completely to free microphone resources cleanly
            if (recognition) {
                try {
                    recognition.onend = null;
                    recognition.onerror = null;
                    recognition.onstart = null;
                    recognition.onresult = null;
                    recognition.onsoundstart = null;
                    recognition.onspeechstart = null;
                    recognition.abort();
                } catch(e) {}
                recognition = null;
            }

            // Always create a clean new instance to avoid WebSocket freeze & InvalidState errors in the browser
            recognition = new window.SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = voiceLang;

            let baseText = '';

            const resetSilenceTimer = () => {
                if (silenceTimer) clearTimeout(silenceTimer);
                
                const input = document.getElementById('ai-modifier-input');
                if (input && input.value.trim() === '') {
                    console.log('Textarea is empty, keeping listener active.');
                    return;
                }

                silenceTimer = setTimeout(() => {
                    const currentInput = document.getElementById('ai-modifier-input');
                    if (currentInput && currentInput.value.trim() === '') {
                        console.log('Timeout fired but textarea is empty. Rescheduling...');
                        resetSilenceTimer();
                        return;
                    }
                    console.log('Silence timeout reached (7s). Stopping...');
                    stopListening();
                    showNotification(voiceLang === 'ar-EG' ? 'تم إيقاف الاستماع تلقائياً لعدم التحدث.' : 'Listening stopped due to silence.', 'info');
                }, 7000);
            };

            // Setup real-time local audio amplitude analyzer to reset silence timer on any local voice audio
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        audioStream = stream;
                        
                        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                        if (!AudioContextClass) return;
                        
                        audioContext = new AudioContextClass();
                        const source = audioContext.createMediaStreamSource(stream);
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 512;
                        source.connect(analyser);
                        
                        const bufferLength = analyser.frequencyBinCount;
                        const dataArray = new Uint8Array(bufferLength);
                        
                        audioInterval = setInterval(() => {
                            if (!isListening) return;
                            analyser.getByteFrequencyData(dataArray);
                            let sum = 0;
                            for (let i = 0; i < bufferLength; i++) {
                                sum += dataArray[i];
                            }
                            const average = sum / bufferLength;
                            
                            // High sensitivity to capture soft voices/breath and reset silence timer instantly
                            if (average > 6) {
                                resetSilenceTimer();
                            }
                        }, 100);
                    })
                    .catch(err => {
                        console.warn('Could not start local audio volume analyzer:', err);
                    });
            }

            recognition.onsoundstart = () => {
                resetSilenceTimer();
            };

            recognition.onspeechstart = () => {
                resetSilenceTimer();
            };

            recognition.onstart = () => {
                isListening = true;
                consecutiveNetworkErrors = 0; // Reset network error count on successful connection
                const micBtn = document.getElementById('ai-voice-btn');
                const micIcon = document.getElementById('voice-icon');
                const input = document.getElementById('ai-modifier-input');
                
                if (input) {
                    baseText = input.value.trim();
                    input.placeholder = voiceLang === 'ar-EG' ? 'جاري الاستماع... تحدث الآن' : 'Listening... Speak now';
                    input.classList.add('ring-4', 'ring-red-100', 'border-red-400');
                }
                if (micBtn) {
                    micBtn.classList.remove('bg-slate-100', 'text-slate-500');
                    micBtn.classList.add('bg-red-500', 'text-white', 'animate-pulse', 'border-red-600');
                }
                if (micIcon) {
                    micIcon.className = 'fa-solid fa-microphone-lines text-sm';
                }
                resetSilenceTimer();
            };

            recognition.onresult = (event) => {
                resetSilenceTimer();
                
                let sessionTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    sessionTranscript += event.results[i][0].transcript;
                }
                
                const input = document.getElementById('ai-modifier-input');
                if (input) {
                    input.value = baseText ? baseText + ' ' + sessionTranscript.trim() : sessionTranscript.trim();
                    input.scrollTop = input.scrollHeight;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                if (event.error === 'no-speech') {
                    // Silent ignore, handled by silenceTimer
                    return;
                }
                
                if (event.error === 'not-allowed') {
                    showNotification('Microphone access denied. Please enable permission.', 'error');
                    stopListening();
                } else if (event.error === 'network') {
                    consecutiveNetworkErrors++;
                    // Silently reconnect in onend without displaying annoying popups, preserving the user flow
                    console.log('Network error occurred. Silent reconnect initiated...');
                }
            };

            recognition.onend = () => {
                // Auto-restart with a clean new instance if isListening is still active
                if (isListening) {
                    if (restartTimeout) clearTimeout(restartTimeout);
                    
                    // Instant silent reconnection: wait 100ms on first errors, and up to 1s on repeated errors
                    const delay = consecutiveNetworkErrors > 0 ? Math.min(consecutiveNetworkErrors * 300, 1000) : 50;
                    console.log(`Speech recognition ended. Restarting silently in ${delay}ms...`);
                    
                    restartTimeout = setTimeout(() => {
                        if (isListening) {
                            const input = document.getElementById('ai-modifier-input');
                            if (input) {
                                baseText = input.value.trim();
                            }
                            startListening();
                        }
                    }, delay);
                } else {
                    stopListening();
                }
            };

            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }

        function stopListening() {
            isListening = false;
            consecutiveNetworkErrors = 0; // Reset network error count
            
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
            if (restartTimeout) {
                clearTimeout(restartTimeout);
                restartTimeout = null;
            }
            if (audioInterval) {
                clearInterval(audioInterval);
                audioInterval = null;
            }
            if (audioStream) {
                try {
                    audioStream.getTracks().forEach(track => track.stop());
                } catch(e) {}
                audioStream = null;
            }
            if (audioContext) {
                try {
                    if (audioContext.state !== 'closed') {
                        audioContext.close();
                    }
                } catch(e) {}
                audioContext = null;
            }

            const micBtn = document.getElementById('ai-voice-btn');
            const micIcon = document.getElementById('voice-icon');
            const input = document.getElementById('ai-modifier-input');
            
            if (micBtn) {
                micBtn.classList.add('bg-slate-100', 'text-slate-500');
                micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse', 'border-red-600');
            }
            if (micIcon) {
                micIcon.className = 'fa-solid fa-microphone text-sm';
            }
            if (input) {
                input.placeholder = 'e.g. Make the text bigger and change the button to red...';
                input.classList.remove('ring-4', 'ring-red-100', 'border-red-400');
            }

            if (recognition) {
                try {
                    // Remove listeners to avoid triggering error or end restarts
                    recognition.onend = null;
                    recognition.onerror = null;
                    recognition.onstart = null;
                    recognition.onresult = null;
                    recognition.onsoundstart = null;
                    recognition.onspeechstart = null;
                    recognition.stop();
                } catch(e) {}
                recognition = null;
            }
        }
    </script>

    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>
</body>

</html>
@include('components.code-panel', [
    'generateEndpoint' => route('hero.generateCode', $hero->id),
    'regenerateEndpoint' => route('hero.generateCode', $hero->id),
    'canvasId' => 'hero-canvas-inner',
    'needsGeneration' => $needsGeneration ?? false,
    'sectionLabel' => 'Hero'
])