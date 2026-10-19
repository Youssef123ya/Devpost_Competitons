<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SiteForge — AI Website Builder</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
    <script src="/js/tailwind.js"></script>

    <style>
        body {
            font-family: 'Instrument Sans', sans-serif;
        }

        .reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease-out;
        }

        .reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }

        @keyframes float {

            0%,
            100% {
                transform: translateY(0) rotate(0);
            }

            50% {
                transform: translateY(-30px) rotate(5deg) scale(1.05);
            }
        }

        .float {
            animation: float 4s ease-in-out infinite;
        }

        /* Premium Centering Wrapper */
        .main-wrapper {
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            width: 100%;
        }

        /* Premium Box Glow Effect */
        .premium-box {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid transparent;
        }

        .premium-box:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.2);
            border-color: rgba(99, 102, 241, 0.1);
        }

        .premium-box:active {
            transform: translateY(2px) scale(0.98);
            box-shadow: 0 0 50px 10px rgba(168, 85, 247, 0.4),
                0 10px 20px -5px rgba(168, 85, 247, 0.3);
            border-color: rgba(168, 85, 247, 0.5);
            background-color: white !important;
        }
    </style>
</head>

<body class="bg-white text-slate-900 antialiased overflow-x-hidden relative">
    {{-- Background Blobs from Figma --}}
    <div class="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] -z-10">
    </div>
    <div class="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[80px] -z-10">
    </div>
    <div class="absolute top-[50%] right-[-10%] w-[350px] h-[350px] bg-indigo-50/60 rounded-full blur-[90px] -z-10">
    </div>

    <x-navbar />

    {{-- Start of Centered Content --}}
    <div class="main-wrapper">
        {{-- ═══════════════ HERO ═══════════════ --}}
        <section class="pt-32 pb-20 px-6 text-center">
            <div class="max-w-4xl mx-auto">
                <h1 class="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                    Build Your <br /> <span class="text-indigo-600">website Now</span>
                </h1>
                <p class="text-base text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
                    Create professional, responsive, and high-converting hero sections for your website using our
                    advanced AI builder. No coding required.
                </p>
                <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                    <a href="{{ route('website.type') }}"
                        class="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black transition-all transform hover:scale-105 shadow-2xl shadow-indigo-200/50 flex items-center gap-3">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        Create Now
                    </a>
                    <!-- <a href="{{ route('prompt.create') }}"
                        class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black transition-all transform hover:scale-105 shadow-md flex items-center gap-3">
                        Create with prompt
                    </a> -->
                    <button
                        class="px-10 py-5 bg-slate-100 text-slate-500 font-black hover:bg-slate-200 rounded-full transition-all">Learn
                        More</button>
                </div>

                {{-- Compact Figma Featured Grid with Container Background --}}
                <div class="max-w-4xl mx-auto p-6 bg-indigo-50/30 rounded-[4rem] mb-12">
                    <div class="grid grid-cols-12 gap-4">
                        {{-- Row 1: 7 col / 5 col --}}
                        <div class="col-span-7 h-44 bg-indigo-100/40 rounded-[2.5rem]"></div>
                        <div class="col-span-5 h-44 bg-indigo-100/40 rounded-[2.5rem]"></div>

                        {{-- Row 2: 5 col / 7 col --}}
                        <div class="col-span-5 h-44 bg-indigo-100/40 rounded-[2.5rem]"></div>
                        <div class="col-span-7 h-44 bg-indigo-100/40 rounded-[2.5rem]"></div>
                    </div>
                </div>
            </div>
        </section>

        {{-- ═══════════════ HOW IT WORKS ═══════════════ --}}
        <section id="how-it-works" class="pt-12 pb-12 bg-white">
            <div class="max-w-4xl mx-auto px-6">
                <h2 class="text-4xl font-extrabold text-center mb-24">How It <span class="text-indigo-600">Works</span>
                </h2>

                <div class="space-y-16">
                    {{-- Step 1 --}}
                    <div class="reveal flex flex-col md:flex-row items-stretch gap-8">
                        <div
                            class="flex-1 p-6 bg-indigo-50/50 rounded-[2rem] flex flex-col justify-center order-2 md:order-1 cursor-pointer premium-box">
                            <h4 class="text-indigo-600 font-black text-xl mb-3">Step1: Start with Your Idea</h4>
                            <ul class="text-slate-500 space-y-3 text-xs leading-relaxed list-disc list-outside ml-5">
                                <li>On the Hero Section, the user enters their website idea or selects a ready-made
                                    template.</li>
                                <li>The AI instantly suggests a preliminary layout.</li>
                                <li>Feature: Every element in the Hero Section is fully editable (text, images,
                                    buttons).</li>
                            </ul>
                        </div>
                        <div
                            class="flex-1 p-6 rounded-[2rem] flex items-center justify-center bg-white/40 backdrop-blur-sm border-[1.5px] border-indigo-200 order-1 md:order-2 relative overflow-visible min-h-[220px] cursor-pointer premium-box">
                            {{-- Elegant Halo Glow --}}
                            <div class="absolute w-48 h-48 bg-indigo-300/10 blur-[60px] rounded-full"></div>

                            <svg viewBox="0 0 100 100"
                                class="w-48 h-48 float relative z-50 scale-[1.8] transform translate-x-8 -translate-y-8 drop-shadow-[0_40px_60px_rgba(0,0,0,0.2)]">
                                <defs>
                                    <radialGradient id="glass-silver" cx="30%" cy="30%" r="80%">
                                        <stop offset="0%" stop-color="#ffffff" />
                                        <stop offset="45%" stop-color="#f8fafc" />
                                        <stop offset="100%" stop-color="#cbd5e1" />
                                    </radialGradient>
                                </defs>
                                {{-- Bulb Body --}}
                                <path
                                    d="M50 15 C35 15 25 25 25 42 C25 55 35 60 40 70 L60 70 C65 60 75 55 75 42 C75 25 65 15 50 15Z"
                                    fill="url(#glass-silver)" opacity="0.95" />
                                {{-- Reflection --}}
                                <ellipse cx="40" cy="30" rx="6" ry="10" fill="white" opacity="0.6"
                                    transform="rotate(-15 40 30)" />
                                {{-- Base --}}
                                <rect x="42" y="72" width="16" height="4" rx="2" fill="#94a3b8" />
                                <rect x="44" y="78" width="12" height="4" rx="2" fill="#64748b" />
                            </svg>
                        </div>
                    </div>

                    {{-- Step 2 --}}
                    <div class="reveal flex flex-col md:flex-row items-stretch gap-8">
                        <div
                            class="flex-1 p-6 rounded-[2rem] flex items-center justify-center bg-white/40 backdrop-blur-sm border-[1.5px] border-indigo-200 relative overflow-visible min-h-[220px] cursor-pointer premium-box">
                            <div class="absolute w-48 h-48 bg-indigo-300/10 blur-[60px] rounded-full"></div>
                            <svg viewBox="0 0 100 100"
                                class="w-48 h-48 float relative z-50 scale-[1.8] transform -translate-x-8 -translate-y-8 drop-shadow-[0_40px_60px_rgba(0,0,0,0.2)]"
                                style="animation-delay: 0.5s">
                                {{-- Elegant Pointer --}}
                                <path d="M30 20 L80 45 L50 50 L45 80 Z" fill="url(#glass-silver)" />
                                <path d="M50 50 L80 45 L45 80 Z" fill="#94a3b8" opacity="0.3" />
                                {{-- Shine --}}
                                <path d="M35 28 L45 35" stroke="white" stroke-width="2" opacity="0.5"
                                    stroke-linecap="round" />
                            </svg>
                        </div>
                        <div
                            class="flex-1 p-6 bg-indigo-50/50 rounded-[2rem] flex flex-col justify-center cursor-pointer premium-box">
                            <h4 class="text-indigo-600 font-bold text-lg mb-3">Step 2: Generate & Customize Each Section
                            </h4>
                            <ul class="text-slate-500 space-y-3 text-xs leading-relaxed list-disc list-outside ml-5">
                                <li>The user moves section by section: About, Features, Services, Testimonials, etc.
                                </li>
                                <li>For each section, AI generates content and design automatically.</li>
                                <li>The user has Full Control: Edit text and images, change colors, fonts, and layouts,
                                    or remove elements.</li>
                                <li>Extra: Live preview for every section before moving to the next.</li>
                            </ul>
                        </div>
                    </div>

                    {{-- Step 3 --}}
                    <div class="reveal flex flex-col md:flex-row items-stretch gap-8">
                        <div
                            class="flex-1 p-6 bg-indigo-50/50 rounded-[2rem] flex flex-col justify-center order-2 md:order-1 cursor-pointer premium-box">
                            <h4 class="text-indigo-600 font-bold text-lg mb-3">Step 3: Access the Code Instantly</h4>
                            <ul class="text-slate-500 space-y-3 text-xs leading-relaxed list-disc list-outside ml-5">
                                <li>Once your website is generated, you get instant access to clean, well-structured
                                    code. Download or preview the full project files--including HTML, CSS, and
                                    JavaScript -ready for deployment or customization.</li>
                                <li>No waiting, no technical setup all in one point.</li>
                            </ul>
                        </div>
                        <div
                            class="flex-1 p-6 rounded-[2rem] flex items-center justify-center bg-white/40 backdrop-blur-sm border-[1.5px] border-indigo-200 order-1 md:order-2 relative overflow-visible min-h-[220px] cursor-pointer premium-box">
                            <div class="absolute w-48 h-48 bg-indigo-300/10 blur-[60px] rounded-full"></div>
                            <svg viewBox="0 0 100 100"
                                class="w-48 h-48 float relative z-50 scale-[1.8] transform translate-x-8 -translate-y-8 drop-shadow-[0_40px_60px_rgba(0,0,0,0.2)]"
                                style="animation-delay: 1s">
                                {{-- Glassy Code Card --}}
                                <rect x="25" y="20" width="50" height="60" rx="6" fill="#f1f5f9" stroke="#cbd5e1"
                                    stroke-width="0.5" />
                                <rect x="30" y="25" width="40" height="50" rx="4" fill="url(#glass-silver)" />
                                <line x1="38" y1="42" x2="62" y2="42" stroke="#94a3b8" stroke-width="2" opacity="0.4"
                                    rx="1" />
                                <line x1="38" y1="50" x2="55" y2="50" stroke="#94a3b8" stroke-width="2" opacity="0.3"
                                    rx="1" />
                            </svg>
                        </div>
                    </div>

                    {{-- Step 4 --}}
                    <div class="reveal flex flex-col md:flex-row items-stretch gap-8">
                        <div
                            class="flex-1 p-6 rounded-[2rem] flex items-center justify-center bg-white/40 backdrop-blur-sm border-[1.5px] border-indigo-200 relative overflow-visible min-h-[220px] cursor-pointer premium-box">
                            <div class="absolute w-48 h-48 bg-indigo-300/10 blur-[60px] rounded-full"></div>
                            <svg viewBox="0 0 100 100"
                                class="w-48 h-48 float relative z-50 scale-[1.8] transform -translate-x-8 -translate-y-8 drop-shadow-[0_40px_60px_rgba(0,0,0,0.2)]"
                                style="animation-delay: 1.5s">
                                {{-- Elegant Spark/Launch --}}
                                <path d="M50 15 L58 42 L85 50 L58 58 L50 85 L42 58 L15 50 L42 42 Z"
                                    fill="url(#glass-silver)" />
                                <circle cx="50" cy="50" r="10" fill="#818cf8" opacity="0.1" />
                                {{-- Inner shine --}}
                                <path d="M45 45 L50 50" stroke="white" stroke-width="2" opacity="0.5"
                                    stroke-linecap="round" />
                            </svg>
                        </div>
                        <div
                            class="flex-1 p-6 bg-indigo-50/50 rounded-[2rem] flex flex-col justify-center cursor-pointer premium-box">
                            <h4 class="text-indigo-600 font-bold text-lg mb-3">Step 4: Final Review & Launch</h4>
                            <ul class="text-slate-500 space-y-3 text-xs leading-relaxed list-disc list-outside ml-5">
                                <li>Once all sections are done: AI provides a full website preview.</li>
                                <li>Users can add extra sections or tweak any existing section.</li>
                                <li>When satisfied, they click Publish / Export to launch their site.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {{-- ═══════════════ SHOWCASES ═══════════════ --}}
        <section id="showcases" class="pt-0 pb-32 bg-white">
            <div class="max-w-4xl mx-auto px-6 text-center">
                <h2 class="text-4xl font-extrabold text-indigo-600">Showcases</h2>
                <p class="text-black mb-16">See the latest websites created</p>

                <div class="flex items-center justify-center gap-8">
                    <button class="text-slate-300 hover:text-indigo-600 transition-colors">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div class="flex gap-4">
                        @foreach([1, 2, 3] as $num)
                            <div
                                class="w-32 h-20 md:w-48 md:h-32 rounded-[2rem] bg-indigo-100 flex items-center justify-center shadow-sm">
                                <span class="text-3xl font-black text-indigo-400 opacity-50">{{ $num }}</span>
                            </div>
                        @endforeach
                    </div>
                    <button class="text-slate-300 hover:text-indigo-600 transition-colors">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>

        {{-- ═══════════════ REVIEWS ═══════════════ --}}
        <section id="reviews" class="pt-0 pb-32 bg-white">
            <div class="max-w-3xl mx-auto px-6 text-center">
                <h2 class="text-4xl font-extrabold text-indigo-600 mb-4">Reviews</h2>
                <p class="text-black mb-16">See our clients reviews after using it</p>

                <div class="space-y-4">
                    @php
                        $reviews = [
                            ['name' => 'Ahmed Mansur', 'role' => 'Designer · Joined 3 yrs ago', 'text' => 'Absolutely incredible tool. Built a complete landing page in under 5 minutes.'],
                            ['name' => 'Lori Felix', 'role' => 'Developer · 2 yrs member', 'text' => 'This replaced hours of coding. The generated HTML is clean and semantic.'],
                            ['name' => 'Lori Felix', 'role' => 'Marketing · 1 yr member', 'text' => 'Finally a no-code tool that produces great code. The live preview is amazing.'],
                        ];
                    @endphp
                    @foreach($reviews as $r)
                        <div
                            class="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-left reveal">
                            <div class="w-12 h-12 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name={{ urlencode($r['name']) }}&background=6366f1&color=fff"
                                    alt="">
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-start mb-1">
                                    <div>
                                        <h5 class="font-bold text-slate-800">{{ $r['name'] }}</h5>
                                        <p class="text-xs text-slate-400">{{ $r['role'] }}</p>
                                    </div>
                                    <div class="flex gap-0.5 text-xs text-indigo-500">★★★★★</div>
                                </div>
                                <p class="text-sm text-slate-500 leading-relaxed">{{ $r['text'] }}</p>
                            </div>
                            <button class="text-slate-300 hover:text-red-500 transition-colors px-2">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>

        {{-- ═══════════════ FOOTER ═══════════════ --}}
        <footer class="py-20 border-t border-slate-100">
            <div class="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
                <div class="col-span-1">
                    <div class="mb-8">
                        <a href="/"
                            class="flex items-center gap-2 text-indigo-600 font-bold text-3xl hover:text-indigo-500 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"
                                class="w-8 h-8">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Builder
                        </a>
                    </div>
                    <div class="flex gap-5 text-slate-700">
                        <a href="#" class="hover:text-indigo-600 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="#" class="hover:text-indigo-600 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </a>
                        <a href="#" class="hover:text-indigo-600 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </a>
                        <a href="#" class="hover:text-indigo-600 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                        </a>
                    </div>
                </div>

                @php
                    $footerSections = [
                        'Use cases' => ['UI design', 'UX design', 'Wireframing', 'Diagramming', 'Brainstorming', 'Online whiteboard', 'Team collaboration'],
                        'Explore' => ['Design', 'Prototyping', 'Development features', 'Design systems', 'Collaboration features', 'Design process', 'FigJam'],
                        'Resources' => ['Blog', 'Best practices', 'Colors', 'Color wheel', 'Support', 'Developers', 'Resource library']
                    ];
                @endphp

                @foreach($footerSections as $title => $links)
                    <div>
                        <h6 class="font-bold text-sm text-slate-900 mb-6">{{ $title }}</h6>
                        <ul class="space-y-3">
                            @foreach($links as $link)
                                <li><a href="#"
                                        class="text-sm text-slate-500 hover:text-indigo-600 transition-colors">{{ $link }}</a>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                @endforeach
            </div>
        </footer>
    </div> {{-- End of main-wrapper --}}

    <script>
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    </script>
</body>

</html>