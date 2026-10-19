@php
    $step = request('step', 'home');
    $heroId = request('hero_id');

    $steps = [
        'home' => [
            'id' => '01',
            'title' => 'Lets Start with Home',
            'description' => 'The home page introduces you, highlights your main skills, showcases featured work, and guides visitors to explore your portfolio easily.',
            'next_route' => route('hero.create'),
            'label' => 'Home'
        ],
        'skills' => [
            'id' => '02',
            'title' => 'Showcase Your Skills',
            'description' => 'List your technical expertise, tools, and professional capabilities to show visitors what you are best at.',
            'next_route' => $heroId ? route('skills.create', $heroId) : '#',
            'label' => 'Skills'
        ],
        'services' => [
            'id' => '03',
            'title' => 'What You Offer',
            'description' => 'Showcase your services and how you can help your clients with high-quality offerings.',
            'next_route' => $heroId ? route('services.create', $heroId) : '#',
            'label' => 'Services'
        ],
        'why-choose-us' => [
            'id' => '04',
            'title' => 'Build Trust',
            'description' => 'Share your unique strengths and reasons why clients should choose you over others.',
            'next_route' => $heroId ? route('why-choose-us.create', $heroId) : '#',
            'label' => 'Values'
        ],
        'projects' => [
            'id' => '05',
            'title' => 'Display Your Work',
            'description' => 'Showcase your best projects with descriptions, screenshots, and links to live demos or repositories.',
            'next_route' => $heroId ? route('work.create', $heroId) : '#',
            'label' => 'Work'
        ],
        'contact' => [
            'id' => '06',
            'title' => 'Get in Touch',
            'description' => 'Make it easy for potential clients or employers to reach out to you through a professional contact form.',
            'next_route' => $heroId ? route('contact.create', $heroId) : '#',
            'label' => 'Contact'
        ]
    ];

    $current = $steps[$step] ?? $steps['home'];
    $stepKeys = array_keys($steps);
    $currentIndex = array_search($step, $stepKeys);
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Setup Your Portfolio — SiteForge</title>
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

        .card-shadow {
            box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.05);
        }

        @keyframes float-in {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .float-in {
            animation: float-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .float-in-delay-1 {
            animation: float-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        .float-in-delay-2 {
            animation: float-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .scrollbar-none::-webkit-scrollbar {
            display: none;
        }

        .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</head>

<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">

    {{-- Background blobs to match portfolio-type exactly --}}
    <div
        class="fixed top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-100/60 rounded-full blur-[100px] -z-10 pointer-events-none">
    </div>
    <div
        class="fixed bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-purple-100/40 rounded-full blur-[80px] -z-10 pointer-events-none">
    </div>

    <x-navbar />

    {{-- Main Content Section --}}
    <main class="flex-1 flex flex-col items-center justify-center pt-28 pb-12 px-6">

        {{-- Top Title & Page Flow --}}
        <div class="flex flex-col items-center mb-10 text-center float-in-delay-1 w-full max-w-4xl mx-auto">
            {{-- Pill Badge for Sub-header --}}
            <div
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4 shadow-sm">
                <span class="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest">Lets Create Portfolio for
                    you</span>
            </div>

            <h1 class="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                Your website should have <span class="text-indigo-600" style="color: rgb(79 70 229) !important;">these
                    pages</span>
            </h1>

            {{-- Horizontal Progress Bar --}}
            <div class="w-full max-w-3xl mx-auto px-4 overflow-x-auto pb-4 scrollbar-none">
                <div class="flex items-center justify-between min-w-[550px] relative py-2">

                    {{-- Background Line --}}
                    <div class="absolute top-[22px] left-6 right-6 h-[2px] bg-slate-200 -z-10 rounded"></div>

                    {{-- Active/Completed Progress Indicator Line --}}
                    @php
                        $percent = ($currentIndex / (count($stepKeys) - 1)) * 100;
                    @endphp
                    <div class="absolute top-[22px] left-6 h-[2px] bg-indigo-600 -z-10 rounded transition-all duration-500"
                        style="width: calc({{ $percent }}% - 48px)"></div>

                    @foreach($steps as $key => $s)
                        @php
                            $sIndex = array_search($key, $stepKeys);
                            $isCompleted = $sIndex < $currentIndex;
                            $isActive = $sIndex === $currentIndex;
                            $isFuture = $sIndex > $currentIndex;
                        @endphp

                        <div class="flex flex-col items-center flex-1 relative group">
                            {{-- Circle --}}
                            @if($isCompleted)
                                <div
                                    class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 transition-all duration-300 transform group-hover:scale-105">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            @elseif($isActive)
                                <div
                                    class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-indigo-100 shadow-lg shadow-indigo-200/50 transition-all duration-300 transform scale-105">
                                    {{ $s['id'] }}
                                </div>
                            @else
                                <div
                                    class="w-10 h-10 rounded-full border-2 border-slate-200 bg-white text-slate-400 flex items-center justify-center font-bold text-xs transition-all duration-300 group-hover:border-indigo-400 group-hover:text-indigo-500">
                                    {{ $s['id'] }}
                                </div>
                            @endif

                            {{-- Label --}}
                            <span
                                class="mt-2.5 text-[10px] font-black tracking-wide uppercase transition-all duration-300 {{ $isActive ? 'text-indigo-600' : ($isCompleted ? 'text-slate-600' : 'text-slate-400') }}">
                                {{ $s['label'] }}
                            </span>
                        </div>
                    @endforeach

                </div>
            </div>
        </div>

        {{-- Setup Card --}}
        <div
            class="w-full max-w-3xl bg-white/85 backdrop-blur-sm rounded-[2.5rem] py-16 px-8 md:px-12 border border-slate-100 card-shadow flex flex-col items-center text-center float-in-delay-2 relative overflow-hidden">

            {{-- Subtle Card Glows --}}
            <div
                class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-200/10 rounded-full blur-2xl pointer-events-none">
            </div>

            <span class="text-indigo-600 font-bold mb-4 uppercase tracking-widest text-xs">Step
                {{ $current['id'] }}</span>
            <h2 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">{{ $current['title'] }}</h2>
            <p class="text-slate-400 text-sm leading-relaxed max-w-xl mb-8 font-medium">
                {{ $current['description'] }}
            </p>

            <a href="{{ $current['next_route'] }}"
                class="inline-flex items-center gap-2 text-white px-10 py-4 rounded-full text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 bg-indigo-600 hover:bg-indigo-700">
                <span>Continue Setup</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
            </a>
        </div>

    </main>

</body>

</html>