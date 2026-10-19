<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>What type of website? — Laravel</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/js/tailwind.js"></script>
    <style>
        body {
            font-family: 'Outfit', sans-serif;
        }

        .card-hover {
            border: 2px solid transparent;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-hover:hover {
            border-color: #4f46e5 !important;
            transform: translateY(-8px);
            box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.12);
        }

        .card-hover:hover .icon-bounce {
            transform: scale(1.06) translateY(-4px);
        }

        .icon-bounce {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes float-in {
            from {
                opacity: 0;
                transform: translateY(30px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .float-in {
            animation: float-in 0.6s ease-out forwards;
        }

        .float-in-delay-1 {
            animation: float-in 0.6s 0.1s ease-out both;
        }

        .float-in-delay-2 {
            animation: float-in 0.6s 0.2s ease-out both;
        }

        .float-in-delay-3 {
            animation: float-in 0.6s 0.3s ease-out both;
        }
    </style>
</head>

<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">

    {{-- Background blobs to match portfolio-type exactly --}}
    <div
        class="fixed top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-100/60 rounded-full blur-[100px] -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-purple-100/40 rounded-full blur-[80px] -z-10 pointer-events-none">
    </div>

    <x-navbar />

    {{-- Main Container --}}
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-12 mt-20">

        {{-- Title Section matching portfolio-type exactly --}}
        <div class="text-center mb-12 float-in-delay-1">

            <!-- Title -->
            <h1 class="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                What type of your <br> <span class="text-indigo-600"
                    style="color: rgb(79 70 229) !important;">website?</span>
            </h1>

            <!-- Subtitle -->
            <p class="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed font-normal">
                Select your category to start building your personalized experience.
            </p>
        </div>

        {{-- Carousel Container --}}
        <div class="relative w-full flex items-center justify-center gap-8 py-4 max-w-6xl mx-auto float-in-delay-2">

            {{-- Navigation Arrow Left --}}
            <button
                class="flex-shrink-0 w-12 h-12 rounded-full border border-indigo-100 bg-white flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all shadow-sm hover:scale-105 active:scale-95">
                <i class="fa-solid fa-arrow-left text-sm"></i>
            </button>

            {{-- Cards Grid --}}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">

                {{-- Portfolio --}}
                <div
                    class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.015)] card-hover flex flex-col items-center group">
                    <div class="h-44 flex items-center justify-center mb-6 icon-bounce">
                        <svg viewBox="0 0 120 120" class="w-32 h-32 drop-shadow-[0_12px_24px_rgba(79,70,229,0.18)]">
                            <defs>
                                <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#FF5B7F" />
                                    <stop offset="35%" stop-color="#D946EF" />
                                    <stop offset="70%" stop-color="#8B5CF6" />
                                    <stop offset="100%" stop-color="#3B82F6" />
                                </linearGradient>
                                <linearGradient id="star3d" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#FFE259" />
                                    <stop offset="100%" stop-color="#FFA751" />
                                </linearGradient>
                                <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#8B5CF6"
                                        flood-opacity="0.3" />
                                </filter>
                            </defs>
                            <circle cx="60" cy="50" r="35" fill="#8B5CF6" opacity="0.08" filter="blur(6px)" />
                            <path d="M38 18 L82 18 L82 92 L60 74 L38 92 Z" fill="#000000" opacity="0.15"
                                transform="translate(2, 3)" />
                            <path d="M38 18 L82 18 L82 92 L60 74 L38 92 Z" fill="url(#ribbonGrad)" />
                            <path d="M38 18 L46 18 L46 84 L38 90 Z" fill="#FFFFFF" opacity="0.22" />
                            <path d="M74 18 L82 18 L82 92 L74 85 Z" fill="#000000" opacity="0.15" />
                            <path d="M38 92 L60 74 L82 92 L82 90 L60 72 L38 90 Z" fill="#FFFFFF" opacity="0.15" />
                            <g transform="translate(44, 30)" filter="url(#softGlow)">
                                <path
                                    d="M16 2 L20.5 12 L31 13.5 L23 20.5 L25.5 31 L16 25.5 L6.5 31 L9 20.5 L1 13.5 L11.5 12 Z"
                                    fill="#000000" opacity="0.15" transform="translate(1, 2)" />
                                <path
                                    d="M16 2 L20.5 12 L31 13.5 L23 20.5 L25.5 31 L16 25.5 L6.5 31 L9 20.5 L1 13.5 L11.5 12 Z"
                                    fill="url(#star3d)" />
                                <path d="M16 2 L20.5 12 L31 13.5 L23 20.5 L16 25.5 Z" fill="#FFFFFF" opacity="0.28" />
                            </g>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-black mb-4 text-[#2D2D50]">Portfolio</h3>
                    <p class="text-slate-400 text-xs leading-relaxed mb-8 px-4 font-semibold">Showcase your work and
                        achievements in
                        one professional place that highlights your skills.</p>
                    <a href="{{ route('portfolio.type') }}"
                        class="mt-auto w-full py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                        Create
                    </a>
                </div>

                {{-- E-Commerce --}}
                <div
                    class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.015)] card-hover flex flex-col items-center group">
                    <div class="h-44 flex items-center justify-center mb-6 icon-bounce">
                        <svg viewBox="0 0 120 120" class="w-36 h-36 drop-shadow-[0_12px_24px_rgba(124,58,237,0.2)]">
                            <defs>
                                <linearGradient id="bag3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#FF6B8B" />
                                    <stop offset="40%" stop-color="#D946EF" />
                                    <stop offset="80%" stop-color="#6366F1" />
                                    <stop offset="100%" stop-color="#312E81" />
                                </linearGradient>
                                <linearGradient id="handle3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#FFE259" />
                                    <stop offset="50%" stop-color="#FFA751" />
                                    <stop offset="100%" stop-color="#FF5B7F" />
                                </linearGradient>
                            </defs>
                            <circle cx="60" cy="65" r="35" fill="#D946EF" opacity="0.08" filter="blur(6px)" />
                            <path d="M42 38 C42 16, 78 16, 78 38" fill="none" stroke="#000000" stroke-width="6"
                                stroke-linecap="round" opacity="0.12" transform="translate(1, 2)" />
                            <path d="M42 38 C42 16, 78 16, 78 38" fill="none" stroke="url(#handle3dGrad)"
                                stroke-width="6" stroke-linecap="round" />
                            <path d="M42 38 C42 16, 78 16, 78 38" fill="none" stroke="#FFFFFF" stroke-width="2.5"
                                stroke-linecap="round" opacity="0.3" />
                            <path
                                d="M28 38 L92 38 C96 38, 98 41, 97 45 L87 95 C86 99, 82 102, 78 102 L42 102 C38 102, 34 99, 33 95 L23 45 C22 41, 24 38, 28 38 Z"
                                fill="#000000" opacity="0.15" transform="translate(2, 4)" />
                            <path
                                d="M28 38 L92 38 C96 38, 98 41, 97 45 L87 95 C86 99, 82 102, 78 102 L42 102 C38 102, 34 99, 33 95 L23 45 C22 41, 24 38, 28 38 Z"
                                fill="url(#bag3dGrad)" />
                            <path d="M28 38 L92 38 L88 43 L32 43 Z" fill="#FFFFFF" opacity="0.22" />
                            <path d="M28 38 L38 38 L45 95 L37 95 Z" fill="#FFFFFF" opacity="0.15" />
                            <path d="M82 38 L92 38 L87 95 L79 95 Z" fill="#000000" opacity="0.15" />
                        </svg>
                    </div>
                    <h3 class="text-2xl font-black mb-4 text-[#2D2D50]">E- Commerce</h3>
                    <p class="text-slate-400 text-xs leading-relaxed mb-8 px-4 font-semibold">Create an online store to
                        sell your
                        products easily, manage orders, and reach customers anywhere.</p>
                    <a href="{{ route('website.setup') }}"
                        class="mt-auto w-full py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                        Create
                    </a>
                </div>

                {{-- Courses --}}
                <div
                    class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.015)] card-hover flex flex-col items-center group">
                    <div class="h-44 flex items-center justify-center mb-6 icon-bounce">
                        <svg viewBox="0 0 120 120" class="w-36 h-36 drop-shadow-[0_12px_24px_rgba(124,58,237,0.2)]">
                            <defs>
                                <linearGradient id="bookCover3d" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#FF5E62" />
                                    <stop offset="40%" stop-color="#FF9966" />
                                    <stop offset="80%" stop-color="#D946EF" />
                                    <stop offset="100%" stop-color="#6366F1" />
                                </linearGradient>
                            </defs>
                            <circle cx="60" cy="45" r="35" fill="#FF5E62" opacity="0.08" filter="blur(6px)" />
                            <polygon points="25,95 85,95 95,85 35,85" fill="#000000" opacity="0.18"
                                filter="blur(4px)" />
                            <path d="M25 35 L75 15 L95 45 L45 65 Z" fill="url(#bookCover3d)" />
                            <path d="M25 35 L75 15 L78 19 L28 39 Z" fill="#FFFFFF" opacity="0.25" />
                            <polygon points="75 15 75 25 95 55 95 45" fill="#E2E8F0" />
                            <polygon points="75 24 74 26 94 56 95 54" fill="#FFFFFF" />
                            <line x1="75" y1="20" x2="95" y2="50" stroke="#CBD5E1" stroke-width="1.2" />
                            <line x1="75" y1="22" x2="95" y2="52" stroke="#CBD5E1" stroke-width="1.2" />
                            <path d="M25 35 L25 45 L45 75 L45 65 Z" fill="#7C3AED" />
                            <path d="M25 35 L25 45 L28 42 L28 38 Z" fill="#FFFFFF" opacity="0.15" />
                            <path d="M45 65 L45 75 L95 55 L95 45 Z" fill="#E11D48" />
                            <path d="M60 56 L68 86 L73 81 L78 86 L74 50 Z" fill="#FFE259" />
                            <path d="M60 56 L68 86 L70 86 Z" fill="#000000" opacity="0.15" />
                        </svg>
                    </div>
                    <h3 class="text-2xl font-black mb-4 text-[#2D2D50]">Courses</h3>
                    <p class="text-slate-400 text-xs leading-relaxed mb-8 px-4 font-semibold">Build a platform to offer
                        your courses,
                        organize lessons, and help learners grow step by step.</p>
                    <a href="{{ route('website.setup') }}"
                        class="mt-auto w-full py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                        Create
                    </a>
                </div>

            </div>

            {{-- Navigation Arrow Right --}}
            <button
                class="flex-shrink-0 w-12 h-12 rounded-full border border-indigo-100 bg-white flex items-center justify-center text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95">
                <i class="fa-solid fa-arrow-right text-sm"></i>
            </button>

        </div>

        {{-- Dots --}}
        <div class="mt-12 flex gap-3 float-in-delay-3">
            <div class="w-10 h-2 bg-indigo-600 rounded-full shadow-[0_4px_10px_rgba(79,70,229,0.25)]"></div>
            <div class="w-2.5 h-2.5 bg-indigo-100 rounded-full"></div>
        </div>

    </main>

</body>

</html>