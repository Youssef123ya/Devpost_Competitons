<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projects — {{ $work->title }}</title>
    <script src="/js/tailwind.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #ffffff;
            color: #1a1a1a;
        }

        .project-item:hover img {
            transform: scale(1.03);
        }

        .quiet-link {
            opacity: 0.5;
            transition: opacity 0.3s;
        }

        .quiet-link:hover {
            opacity: 1;
        }
    </style>
</head>

<body class="antialiased min-h-screen flex flex-col">

    {{-- Minimal Navigation --}}
    {{-- Navigation Removed for cleaner header --}}
    <div class="h-10"></div> @php
        $styles = $work->custom_styles ?? [];
        $cardBg = $styles['card_bg'] ?? '#ffffff';
        $projectTitleColor = $styles['project_title_color'] ?? '#0f172a';
        $projectDescColor = $styles['project_desc_color'] ?? '#64748b';
        $btnBgColor = $styles['btn_bg_color'] ?? '#4f46e5';
        $btnTextColor = $styles['btn_text_color'] ?? '#ffffff';
        $boxShadow = $styles['box_shadow'] ?? 'shadow-sm';
    @endphp

    <main class="flex-1 w-full max-w-7xl mx-auto px-8 pt-24 pb-32">

        <div class="mb-24 text-left max-w-3xl">
            <h2 class="text-4xl font-extrabold tracking-tighter mb-4 text-slate-900">{{ $work->title }}</h2>
            <p class="text-slate-400 font-medium text-base">
                {{ $work->subtitle ?? 'Complete exhibition of creative projects.' }}
            </p>
        </div>

        @if(!empty($work->items_data))
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                @foreach($work->items_data as $index => $item)
                    @php
                        $itemTitle = $item['title'] ?? 'Project';
                        $itemDesc = $item['description'] ?? '';
                        $itemImage = $item['image'] ?? 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800';
                        $itemVideo = $item['video'] ?? '';
                    @endphp
                    <div style="background-color: {{ $cardBg }};"
                        class="rounded-2xl overflow-hidden {{ $boxShadow }} h-full flex flex-col transition-all duration-500 animate-fade-in hover:shadow-xl hover:-translate-y-1">
                        <div class="relative overflow-hidden aspect-video bg-slate-50 group/media cursor-zoom-in"
                            onclick="openWorkLightbox('{{ $itemVideo ?: $itemImage }}', {{ $itemVideo ? 'true' : 'false' }})">
                            @if($itemVideo)
                                <video src="{{ $itemVideo }}" class="absolute inset-0 w-full h-full object-cover" muted loop
                                    autoplay playsinline></video>
                            @else
                                <img src="{{ $itemImage }}" alt="{{ $itemTitle }}"
                                    class="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110">
                            @endif
                            <div
                                class="absolute inset-0 bg-black/10 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                <div
                                    class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="p-7 flex-1 flex flex-col">
                            <h3 style="color: {{ $projectTitleColor }};" class="text-lg font-bold mb-2 tracking-tight truncate">
                                {{ $itemTitle }}
                            </h3>
                            <p style="color: {{ $projectDescColor }};"
                                class="text-sm font-medium leading-relaxed line-clamp-3 overflow-hidden opacity-80">
                                {{ $itemDesc }}
                            </p>

                            <div class="mt-auto pt-6 flex gap-3 items-center flex-wrap">
                                @if(!empty($item['live']))
                                    <a href="{{ $item['live'] }}" target="_blank"
                                        style="background-color: {{ $btnBgColor }}; color: {{ $btnTextColor }};"
                                        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold opacity-90 hover:opacity-100 transition-all shadow-sm">
                                        Live Demo
                                    </a>
                                @endif
                                @if(!empty($item['github']))
                                    <a href="{{ $item['github'] }}" target="_blank"
                                        class="inline-flex items-center gap-2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl text-sm font-bold opacity-90 hover:opacity-100 transition-all shadow-sm">
                                        <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' viewBox='0 0 24 24'
                                            fill='currentColor'>
                                            <path
                                                d='M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577v-2.234C5.662 21.23 4.967 19.007 4.967 19.007c-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604C6.145 18.74 3.8 17.876 3.8 13.42c0-1.28.457-2.328 1.207-3.15-.121-.297-.523-1.49.115-3.105 0 0 .984-.315 3.225 1.202a11.22 11.22 0 012.94-.396c.997.004 2.002.135 2.94.396 2.24-1.517 3.222-1.202 3.222-1.202.64 1.615.237 2.808.116 3.105.752.822 1.206 1.87 1.206 3.15 0 4.467-2.35 5.315-4.587 5.594.361.311.682.924.682 1.863v2.76c0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z' />
                                        </svg>
                                        Github
                                    </a>
                                @endif
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @else
            <div class="py-20 border-t border-slate-100 italic text-slate-300">
                The project collection is currently empty.
            </div>
        @endif
    </main>

    <footer class="py-24 w-full max-w-7xl mx-auto px-8 border-t border-slate-50">
        <div class="flex flex-col items-start gap-12">
            <nav class="flex items-center gap-12 text-sm font-black uppercase tracking-widest">
                <a href="{{ route('website.preview', $work->hero_id) }}"
                    class="text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <i class="fa-solid fa-arrow-left text-[10px]"></i> Back
                </a>
                <div class="w-px h-6 bg-slate-100"></div>
                <a href="{{ route('website.preview', $work->hero_id) }}#about"
                    class="text-indigo-600 hover:text-indigo-800 transition-colors">About</a>
                <a href="{{ route('website.preview', $work->hero_id) }}#contact"
                    class="text-indigo-600 hover:text-indigo-800 transition-colors">Contact</a>
            </nav>
            <div class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">
                &copy; {{ date('Y') }} Minimalist Portfolio Archive
            </div>
        </div>
    </footer>

    <!-- Premium Lightbox UI -->
    <div id="work-lightbox"
        class="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-3xl hidden justify-center items-center p-4 md:p-12 opacity-0 transition-opacity duration-500 ease-out cursor-zoom-out"
        onclick="closeWorkLightbox()">
        <div class="relative max-w-[95%] max-h-[90vh] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] translate-y-12 scale-90"
            id="lightbox-wrapper" onclick="event.stopPropagation()">
            <!-- Glassmorphic Close Button -->
            <button
                class="absolute -top-16 right-0 md:-right-16 w-12 h-12 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all group backdrop-blur-xl border border-white/10 shadow-2xl"
                onclick="closeWorkLightbox()">
                <svg class="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div id="lightbox-media-container"
                class="rounded-[2rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 ring-1 ring-white/10 bg-black/20">
                <!-- Media will be injected here -->
            </div>
        </div>
    </div>

    <script>
        function openWorkLightbox(src, isVideo) {
            const lightbox = document.getElementById('work-lightbox');
            const container = document.getElementById('lightbox-media-container');
            const wrapper = document.getElementById('lightbox-wrapper');

            // Show loading placeholder or clear previous
            container.innerHTML = `<div class="w-[80vw] h-[60vh] flex items-center justify-center bg-black/20"><div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>`;

            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');

            // Small delay to ensure display:flex is applied before animations
            setTimeout(() => {
                lightbox.style.opacity = '1';
                wrapper.style.transform = 'translateY(0) scale(1)';

                // Inject real media
                container.innerHTML = isVideo
                    ? `<video src="${src}" controls autoplay loop class="max-w-full max-h-[85vh] block mx-auto"></video>`
                    : `<img src="${src}" class="max-w-full max-h-[85vh] object-contain block mx-auto animate-fade-in" style="animation-duration: 1s">`;
            }, 20);

            document.body.style.overflow = 'hidden';
        }

        function closeWorkLightbox() {
            const lightbox = document.getElementById('work-lightbox');
            const wrapper = document.getElementById('lightbox-wrapper');

            lightbox.style.opacity = '0';
            wrapper.style.transform = 'translateY(40px) scale(0.95)';

            setTimeout(() => {
                lightbox.classList.add('hidden');
                document.getElementById('lightbox-media-container').innerHTML = '';
            }, 500);

            document.body.style.overflow = '';
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeWorkLightbox();
        });
    </script>

    <style>
        .cursor-zoom-in {
            cursor: zoom-in;
        }

        .cursor-zoom-out {
            cursor: zoom-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }
    </style>
</body>

</html>