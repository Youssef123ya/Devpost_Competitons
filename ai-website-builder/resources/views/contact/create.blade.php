<x-app-layout>

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Create Contact Page</title>
        <!-- Tailwind CSS -->
        <script src="/js/tailwind.js"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }

        /* Custom Toggle Switch */
        .toggle-checkbox:checked+.toggle-label {
            background-color: #e5e7eb;
        }

        .toggle-checkbox:checked+.toggle-label:after {
            transform: translateX(20px);
            background-color: #000;
            /* Black knob when active matching design */
        }

        .toggle-label {
            width: 44px;
            height: 24px;
            background-color: #e5e7eb;
            border-radius: 9999px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .toggle-label:after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background-color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            border-radius: 50%;
            transition: transform 0.3s ease, background-color 0.3s ease;
        }

        /* Thin borders for empty inputs across all sections */
        .thin-input {
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            color: #374151;
            /* Dark gray text */
        }

        .thin-input::placeholder {
            color: #A3A3A3;
            /* Match placeholder gray from image */
        }

        .thin-input:focus {
            outline: none;
            border-color: #6A6DF0;
        }

        .gray-box {
            background-color: #E8E8E8;
            color: #9CA3AF;
            border: none;
            border-radius: 6px;
            transition: opacity 0.3s ease;
        }

        .step-circle {
            background-color: #E0E7FF;
            color: #6A6DF0;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
    </style>

    <div class="bg-slate-50 min-h-screen text-gray-900">

        <!-- Main Content -->
        <div class="max-w-[1240px] mx-auto px-6 py-10 pb-32">
            <!-- Section Header -->
            <!-- Section Header -->
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Contact Section</h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto">
                    Customize your contact details and generate a premium contact section for your portfolio.
                </p>
            </div>

            @if ($errors->any())
                <div class="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <ul class="list-disc list-inside text-sm text-red-600">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form action="{{ route('contact.store', $hero->id ?? 1) }}" method="POST" id="contactForm">
                @csrf

                <!-- Hidden Backend Logic -->
                <input type="hidden" name="form_fields" id="form_fields_json" value="[]">
                <input type="hidden" name="ctas" id="ctas_json" value="[]">
                <input type="hidden" name="social_links" id="social_links_json" value="[]">

                <!-- SIMPLE: Display Mode Toggle -->
                <section class="mb-10 pt-4">
                    <div
                        class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl max-w-md shadow-sm">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <i class="fa-solid fa-house-signal"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-sm text-gray-900">Show on homepage</h3>
                                <p class="text-[11px] text-slate-400">If off, it will be a hidden link point only.</p>
                            </div>
                        </div>
                        <div class="relative inline-block w-11 h-6 select-none">
                            <input type="checkbox" name="display_mode" id="display_mode_toggle" value="full-section"
                                class="peer sr-only" checked>
                            <label for="display_mode_toggle"
                                class="block h-6 rounded-full bg-slate-200 peer-checked:bg-indigo-600 transition-colors cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></label>
                        </div>
                    </div>
                    <input type="hidden" name="display_mode" id="actual_display_mode" value="full-section">
                </section>

                <script>
                    document.getElementById('display_mode_toggle').addEventListener('change', function () {
                        document.getElementById('actual_display_mode').value = this.checked ? 'full-section' : 'link-only';
                    });
                </script>

                <!-- Layout Selection -->
                <section class="mb-10">
                    <h2 class="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                        <span
                            class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">1</span>
                        Choose Layout
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <!-- Layout Premium: Image Match -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="premium-layout" class="peer sr-only" checked>
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 relative p-2.5 border border-slate-100 shadow-inner"
                                    style="background-color: #f8fafc; background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%);">
                                    <div class="absolute inset-0 flex p-2.5 gap-2">
                                        <!-- Left: contact info -->
                                        <div class="w-1/2 h-full flex flex-col justify-center gap-1">
                                            <div>
                                                <div class="text-[9px] font-bold text-slate-800 tracking-tight leading-none">Get in Touch</div>
                                                <div class="text-[5px] text-slate-400 leading-tight mt-0.5 truncate max-w-[70px]">Let's build together</div>
                                            </div>
                                            
                                            <div class="space-y-1 mt-1">
                                                <div class="flex items-center gap-1.5">
                                                    <div class="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                                                        <i class="fa-regular fa-envelope text-[6.5px]"></i>
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="text-[4px] text-slate-400 leading-none">Email</div>
                                                        <div class="text-[5px] text-slate-800 font-semibold leading-none truncate max-w-[52px]">alsharkaweymenna@gmail.com</div>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <div class="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                                                        <i class="fa-solid fa-phone text-[6.5px]"></i>
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="text-[4px] text-slate-400 leading-none">Phone</div>
                                                        <div class="text-[5px] text-slate-800 font-semibold leading-none">+20106816739</div>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <div class="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                                                        <i class="fa-solid fa-location-dot text-[6.5px]"></i>
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="text-[4px] text-slate-400 leading-none">Location</div>
                                                        <div class="text-[5px] text-slate-800 font-semibold leading-none truncate max-w-[52px]">bani suef</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <!-- Socials row -->
                                            <div class="flex gap-1 mt-1">
                                                <div class="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm flex items-center justify-center text-white text-[5.5px] transition-transform duration-300 hover:scale-110"><i class="fab fa-github"></i></div>
                                                <div class="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm flex items-center justify-center text-white text-[5.5px] transition-transform duration-300 hover:scale-110"><i class="fab fa-linkedin"></i></div>
                                                <div class="w-3.5 h-3.5 rounded-full bg-slate-900 shadow-sm flex items-center justify-center text-white text-[5.5px] transition-transform duration-300 hover:scale-110"><i class="fab fa-facebook"></i></div>
                                            </div>
                                        </div>
                                        <!-- Right: form card -->
                                        <div class="w-1/2 h-full flex items-center justify-center">
                                            <div class="w-full h-full bg-white rounded-xl border border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-2 flex flex-col justify-between">
                                                <div class="space-y-1">
                                                    <div>
                                                        <div class="text-[4.5px] font-semibold text-slate-500 mb-0.5 leading-none">Email</div>
                                                        <div class="h-3 px-1.5 bg-slate-50/50 border border-slate-100 rounded text-[5px] text-slate-400 flex items-center leading-none">example@email.com</div>
                                                    </div>
                                                    <div>
                                                        <div class="text-[4.5px] font-semibold text-slate-500 mb-0.5 leading-none">Phone Number</div>
                                                        <div class="h-3 px-1.5 bg-slate-50/50 border border-slate-100 rounded text-[5px] text-slate-400 flex items-center leading-none">+1 (555) 000-0000</div>
                                                    </div>
                                                    <div>
                                                        <div class="text-[4.5px] font-semibold text-slate-500 mb-0.5 leading-none">Message</div>
                                                        <div class="h-5 px-1.5 py-0.5 bg-slate-50/50 border border-slate-100 rounded text-[5px] text-slate-400 flex items-start leading-none">How can we help you?</div>
                                                    </div>
                                                </div>
                                                <div class="h-3.5 bg-indigo-600 rounded flex items-center justify-center w-full shadow-sm text-[5.5px] font-bold text-white tracking-wide">
                                                    View My Portfolio
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Split Layout</h3>
                                <p class="text-xs text-slate-500">Contact info left, form card right</p>
                                <div
                                    class="absolute top-4 right-4 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </label>


                        <!-- Layout 2: Centered -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="centered-layout" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 relative p-2.5 border border-slate-100 shadow-inner"
                                    style="background-color: #f8fafc; background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%);">
                                    <div class="absolute inset-0 flex flex-col items-center justify-between p-2">
                                        <div class="text-center space-y-0.5 mt-0.5 w-full">
                                            <div class="text-[9px] font-bold text-slate-800 tracking-tight leading-none text-center">Get in Touch</div>
                                            <div class="text-[5px] text-slate-400 leading-tight mt-0.5 text-center truncate">Let's build together</div>
                                        </div>
                                        <div class="w-full bg-white rounded-xl border border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-2 space-y-1">
                                            <div class="grid grid-cols-2 gap-1">
                                                <div>
                                                    <div class="text-[4px] font-semibold text-slate-500 mb-0.5 leading-none">Email</div>
                                                    <div class="h-3 px-1.5 bg-slate-50/50 border border-slate-100 rounded text-[4.5px] text-slate-400 flex items-center leading-none">example@email.com</div>
                                                </div>
                                                <div>
                                                    <div class="text-[4px] font-semibold text-slate-500 mb-0.5 leading-none">Phone Number</div>
                                                    <div class="h-3 px-1.5 bg-slate-50/50 border border-slate-100 rounded text-[4.5px] text-slate-400 flex items-center leading-none">+1 (555) 000-0000</div>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="text-[4px] font-semibold text-slate-500 mb-0.5 leading-none">Message</div>
                                                <div class="h-4 px-1.5 py-0.5 bg-slate-50/50 border border-slate-100 rounded text-[4.5px] text-slate-400 flex items-start leading-none w-full">How can we help you?</div>
                                            </div>
                                            <div class="h-3.5 bg-indigo-600 rounded flex items-center justify-center w-1/2 mx-auto shadow-sm text-[5.5px] font-bold text-white tracking-wide">
                                                View My Portfolio
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Centered Layout</h3>
                                <p class="text-xs text-slate-500">Title centered, full-width form below</p>
                                <div
                                    class="absolute top-4 right-4 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </label>

                        <!-- Layout 3: Dark Split -->
                        <label class="group relative cursor-pointer">
                            <input type="radio" name="layout_style" value="dark-split-layout" class="peer sr-only">
                            <div
                                class="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500/50 hover:bg-gray-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:ring-1 peer-checked:ring-indigo-500">
                                <div class="aspect-video w-full overflow-hidden rounded-lg mb-4 relative border border-slate-100 shadow-inner">
                                    <div class="absolute inset-0 flex">
                                        <!-- Left: form panel -->
                                        <div class="w-1/2 h-full bg-white flex flex-col justify-between p-2.5 border-r border-slate-100">
                                            <div class="space-y-1">
                                                <div>
                                                    <div class="text-[4.5px] font-semibold text-slate-500 mb-0.5 leading-none">Email</div>
                                                    <div class="h-3 px-1.5 bg-slate-50/50 border border-slate-100 rounded text-[5px] text-slate-400 flex items-center leading-none">example@email.com</div>
                                                </div>
                                                <div>
                                                    <div class="text-[4.5px] font-semibold text-slate-500 mb-0.5 leading-none">Phone Number</div>
                                                    <div class="h-3 px-1.5 bg-slate-50/50 border border-slate-100 rounded text-[5px] text-slate-400 flex items-center leading-none">+1 (555) 000-0000</div>
                                                </div>
                                                <div>
                                                    <div class="text-[4.5px] font-semibold text-slate-500 mb-0.5 leading-none">Message</div>
                                                    <div class="h-5 px-1.5 py-0.5 bg-slate-50/50 border border-slate-100 rounded text-[5px] text-slate-400 flex items-start leading-none">How can we help you?</div>
                                                </div>
                                            </div>
                                            <div class="h-3.5 bg-indigo-600 rounded flex items-center justify-center w-full shadow-[0_2px_8px_rgba(99,102,241,0.25)] text-[5.5px] font-bold text-white tracking-wide">
                                                Hire Me
                                            </div>
                                        </div>
                                        
                                        <!-- Right: direct contact & map panel -->
                                        <div class="w-1/2 h-full flex flex-col justify-between p-2.5" style="background-color: #f8fafc; background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%);">
                                            <div>
                                                <div class="text-[8px] font-extrabold text-slate-800 tracking-tight leading-none mb-1">Prefer a Direct Approach?</div>
                                                <div class="space-y-0.5">
                                                    <div class="flex items-center gap-1.5">
                                                        <div class="w-4 h-4 rounded bg-indigo-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                                            <i class="fa-regular fa-envelope text-[6px]"></i>
                                                        </div>
                                                        <div class="text-[4.5px] text-slate-600 font-semibold truncate max-w-[50px]">contact@landingplay.com</div>
                                                    </div>
                                                    <div class="flex items-center gap-1.5">
                                                        <div class="w-4 h-4 rounded bg-indigo-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                                            <i class="fa-solid fa-phone text-[6px]"></i>
                                                        </div>
                                                        <div class="text-[4.5px] text-slate-600 font-semibold truncate max-w-[50px]">+62-8234-5674-8901</div>
                                                    </div>
                                                    <div class="flex items-center gap-1.5">
                                                        <div class="w-4 h-4 rounded bg-indigo-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                                            <i class="fa-regular fa-clock text-[6px]"></i>
                                                        </div>
                                                        <div class="text-[4.5px] text-slate-600 font-semibold truncate max-w-[50px]">Mon - Fri, 9 AM - 6 PM</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Mini Map Mockup -->
                                            <div class="mt-1 rounded-lg border border-slate-200 overflow-hidden relative shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-[35px] bg-slate-50 w-full bg-[linear-gradient(rgba(203,213,225,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.25)_1px,transparent_1px)] bg-[size:7px_7px]">
                                                <!-- Red pin & pulse -->
                                                <div class="w-2 h-2 rounded-full bg-rose-500 border border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 shadow-[0_2px_4px_rgba(244,63,94,0.3)]">
                                                    <i class="fa-solid fa-location-dot text-[3.5px] text-white"></i>
                                                </div>
                                                <div class="w-4.5 h-4.5 rounded-full bg-rose-400/30 animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>
                                                <!-- Address card -->
                                                <div class="absolute bottom-0.5 left-0.5 right-0.5 bg-white/95 rounded p-0.5 flex items-center gap-1 shadow-sm border border-slate-100">
                                                    <div class="w-3 h-3 rounded bg-indigo-50 flex items-center justify-center"><i class="fa-solid fa-compass text-indigo-600 text-[5px]"></i></div>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="text-[3px] font-bold text-slate-800 leading-none">Visit Our Office</div>
                                                        <div class="text-[2.5px] text-slate-500 leading-none truncate mt-0.5">123 SaaS Street, Innovation City</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 class="font-semibold text-gray-900 mb-1">Split Map Layout</h3>
                                <p class="text-xs text-slate-500">Form on left, details & map on right</p>
                                <div
                                    class="absolute top-4 right-4 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </label>

                    </div>
                </section>


                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mt-10">


                    <!-- LEFT COLUMN -->
                    <div class="lg:col-span-7 space-y-20 relative">

                        <!-- 2. Contact Content -->
                        <div>
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <span
                                        class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">2</span>
                                    Contact Content
                                </h2>
                                <div class="flex items-center gap-2">
                                    @php $portfolioType = session('portfolio_type', 'Website'); @endphp
                                    <button type="button" onclick="fillContactWithAI()" id="ai-fill-btn"
                                        class="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                        </svg>
                                        AI Fill
                                        <span class="text-[10px] text-slate-400">({{ ucfirst($portfolioType) }})</span>
                                    </button>
                                    <button type="button" onclick="fillContactWithAI(true)" id="ai-shuffle-btn"
                                        class="hidden inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-500 rounded-lg">
                                        Regenerate
                                    </button>
                                </div>
                            </div>

                            <div class="ml-11">
                                <!-- Section Title & Subtitle -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Section Title <span
                                                class="text-red-500">*</span></label>
                                        <input type="text" name="title" id="title" placeholder="e.g. Get in Touch"
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                            value="{{ old('title', '') }}" required>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Section
                                            Subtitle</label>
                                        <input type="text" name="subtitle" id="subtitle"
                                            placeholder="e.g. Leave a message"
                                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all"
                                            value="{{ old('subtitle', '') }}">
                                    </div>
                                </div>

                                <!-- Input type Section -->

                                <h3 class="text-[12px] font-bold mb-4">Input type</h3>

                                <div class="space-y-6">

                                    <!-- Email Box -->
                                    <div class="flex items-center justify-between max-w-[420px]">
                                        <div class="w-[280px]" id="display_email_container">
                                            <h4 class="text-[12px] font-bold mb-1.5 pl-0.5" id="display_email_label">
                                                Email</h4>
                                            <input type="text" id="display_email" name="email_address"
                                                class="gray-box w-[280px] h-[36px] px-3.5 text-[13px] outline-none"
                                                placeholder="eg.ahmed@gmail.com">
                                        </div>
                                        <div class="relative inline-block w-11 mr-2 align-middle select-none mt-6">
                                            <input type="checkbox" id="field_email" name="toggle2"
                                                class="hidden toggle-checkbox" checked
                                                onchange="const cont = document.getElementById('display_email_container'); cont.style.opacity = this.checked ? '1' : '0.4'; cont.querySelector('input').readOnly = !this.checked;" />
                                            <label for="field_email" class="toggle-label block"></label>
                                        </div>
                                    </div>

                                    <!-- Phone Box -->
                                    <div class="flex items-center justify-between max-w-[420px]">
                                        <div class="w-[280px]" id="display_phone_container">
                                            <h4 class="text-[12px] font-bold mb-1.5 pl-0.5" id="display_phone_label">
                                                Phone Number</h4>
                                            <input type="text" id="display_phone" name="phone_number"
                                                class="gray-box w-[280px] h-[36px] px-3.5 text-[13px] outline-none"
                                                placeholder="eg. +1 234 567 890">
                                        </div>
                                        <div class="relative inline-block w-11 mr-2 align-middle select-none mt-6">
                                            <input type="checkbox" id="field_phone" name="toggle3"
                                                class="hidden toggle-checkbox" checked
                                                onchange="const cont = document.getElementById('display_phone_container'); cont.style.opacity = this.checked ? '1' : '0.4'; cont.querySelector('input').readOnly = !this.checked;" />
                                            <label for="field_phone" class="toggle-label block"></label>
                                        </div>
                                    </div>

                                    <!-- Location Box -->
                                    <div class="flex items-center justify-between max-w-[420px]">
                                        <div class="w-[280px]" id="display_location_container">
                                            <h4 class="text-[12px] font-bold mb-1.5 pl-0.5">Location / Address</h4>
                                            <input type="text" id="display_location" name="location"
                                                class="gray-box w-[280px] h-[36px] px-3.5 text-[13px] outline-none"
                                                placeholder="99 S.t Jomblo Park Pekanbaru">
                                        </div>
                                        <div class="relative inline-block w-11 mr-2 align-middle select-none mt-6">
                                            <input type="checkbox" id="field_location" name="toggle4"
                                                class="hidden toggle-checkbox" checked
                                                onchange="const cont = document.getElementById('display_location_container'); cont.style.opacity = this.checked ? '1' : '0.4'; cont.querySelector('input').readOnly = !this.checked;" />
                                            <label for="field_location" class="toggle-label block"></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. Call to actions buttons -->
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">3</span>
                                Call to actions buttons
                            </h2>

                            <div class="ml-11" id="ctas-container">
                                <div class="cta-row">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Button 1</label>
                                            <input type="text" name="ctas[0][text]" placeholder="e.g Send message"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                            <div class="flex items-center gap-3">
                                                <input type="text" name="ctas[0][url]" placeholder="https://..."
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                                <button type="button" id="add-cta-btn"
                                                    class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap">+
                                                    Add</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 4. Social media links -->
                        <div class="pb-10" id="step3_container">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">4</span>
                                Social media links
                            </h2>

                            <div class="ml-11" id="socials-container">
                                <div class="social-row">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Social 1</label>
                                            <select name="social_links[0][icon]"
                                                onchange="this.closest('.social-row').querySelector('.social-icon-preview').className = 'social-icon-preview ' + this.value + ' text-gray-400 mr-2'"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700 appearance-none transition-all">
                                                <option value="fab fa-facebook">Facebook</option>
                                                <option value="fab fa-twitter">Twitter</option>
                                                <option value="fab fa-x-twitter">X (Twitter)</option>
                                                <option value="fab fa-instagram">Instagram</option>
                                                <option value="fab fa-threads">Threads</option>
                                                <option value="fab fa-linkedin">LinkedIn</option>
                                                <option value="fab fa-whatsapp">WhatsApp</option>
                                                <option value="fab fa-telegram">Telegram</option>
                                                <option value="fab fa-tiktok">TikTok</option>
                                                <option value="fab fa-snapchat">Snapchat</option>
                                                <option value="fab fa-behance">Behance</option>
                                                <option value="fab fa-dribbble">Dribbble</option>
                                                <option value="fab fa-github">GitHub</option>
                                                <option value="fab fa-youtube">YouTube</option>
                                                <option value="fab fa-discord">Discord</option>
                                                <option value="fab fa-medium">Medium</option>
                                                <option value="fab fa-slack">Slack</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                            <div class="flex items-center gap-3">
                                                <input type="text" name="social_links[0][url]" placeholder="https://..."
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                                <button type="button" id="add-social-btn"
                                                    class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap">+
                                                    Add</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- RIGHT COLUMN -->
                    <div class="lg:col-span-5 relative mt-4 lg:mt-0">

                        <!-- 5. Styling Options -->
                        <div class="space-y-6">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm">5</span>
                                Styling Options
                            </h2>

                            <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-6">
                                <!-- Background Colors -->
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-700">Section Background</label>
                                        <input type="color" name="bg_color" value="#ffffff"
                                            class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-700">Card Background</label>
                                        <input type="color" name="card_bg_color" value="#f9fafb"
                                            class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                </div>

                                <div class="border-t border-gray-200"></div>

                                <!-- Text & Icon Colors -->
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-700">Text Color</label>
                                        <input type="color" name="text_color" value="#0f172a"
                                            class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-700">Accent Color</label>
                                        <input type="color" name="accent_color" value="#6366f1"
                                            class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-700">Icon Color</label>
                                        <input type="color" name="input_color" value="#6366f1"
                                            class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                    </div>
                                </div>

                                <div class="border-t border-gray-200"></div>

                                <!-- Border Radius -->
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-700">Border Radius (px)</label>
                                    </div>
                                    <input type="number" name="border_radius" value="12" min="0" max="40"
                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                </div>

                                <div class="border-t border-gray-200"></div>

                                <!-- Social Links Toggle -->
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Show Social Links</label>
                                    <div class="relative inline-block w-11 align-middle select-none">
                                        <input type="checkbox" name="show_social_links" id="opt_socials"
                                            class="hidden toggle-checkbox" checked
                                            onchange="const cont = document.getElementById('step3_container'); cont.style.opacity = this.checked ? '1' : '0.4'; cont.querySelectorAll('input, select, button').forEach(i => i.disabled = !this.checked);" />
                                        <label for="opt_socials" class="toggle-label block cursor-pointer"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Submit Action (Matched with other sections) -->
                <div class="flex justify-end pt-12 mt-12 border-t border-gray-100">
                    <button type="submit" style="background-color: #5c67f2;"
                        class="group relative inline-flex items-center gap-2 px-8 py-4 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(92,103,242,0.5)]">
                        <span>Create Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5 transition-transform group-hover:translate-x-1">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Logic -->
    <script>
        const portfolioType = "{{ session('portfolio_type', 'developer') }}";
        let pastSuggestions = [];

        async function fillContactWithAI(shuffle = false) {
            const btn = document.getElementById('ai-fill-btn');
            const shuffleBtn = document.getElementById('ai-shuffle-btn');
            const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            const originalHtml = btn ? btn.innerHTML : '';

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `${loadingIcon} Generating...`;
            }

            try {
                const response = await fetch('{{ route("ai.placeholder") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({
                        section: 'contact',
                        portfolio_type: portfolioType,
                        past_suggestions: pastSuggestions
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Server error');
                }

                const result = await response.json();

                if (result.success) {
                    const data = result.data;

                    if (data.title && !pastSuggestions.includes(data.title)) {
                        pastSuggestions.push(data.title);
                    }

                    // Fill text fields
                    const hTitle = document.getElementById('title');
                    const hSub = document.getElementById('subtitle');

                    if (hTitle && data.title) {
                        hTitle.style.background = '#f0fdf4';
                        hTitle.style.borderColor = '#86efac';
                        hTitle.value = data.title;
                        setTimeout(() => { hTitle.style.background = ''; hTitle.style.borderColor = ''; }, 1000);
                    }
                    if (hSub && data.subtitle) {
                        hSub.style.background = '#f0fdf4';
                        hSub.style.borderColor = '#86efac';
                        hSub.value = data.subtitle;
                        setTimeout(() => { hSub.style.background = ''; hSub.style.borderColor = ''; }, 1000);
                    }

                    // 1. CTAs (Smart Fill)
                    const ctaContainer = document.getElementById('ctas-container');
                    if (ctaContainer && data.ctas) {
                        const rows = ctaContainer.querySelectorAll('.cta-row');
                        data.ctas.forEach((cta, i) => {
                            let targetRow = rows[i];
                            if (!targetRow) {
                                const addBtn = document.getElementById('add-cta-btn');
                                if (addBtn) { addBtn.click(); targetRow = ctaContainer.lastElementChild; }
                            }
                            if (targetRow) {
                                const textInp = targetRow.querySelector('input[name*="[text]"]');
                                const urlInp = targetRow.querySelector('input[name*="[url]"]');
                                if (textInp) {
                                    textInp.value = cta.text;
                                    textInp.style.background = '#f0fdf4';
                                    setTimeout(() => textInp.style.background = '', 1000);
                                }
                                if (urlInp) {
                                    urlInp.value = cta.url;
                                    urlInp.style.background = '#f0fdf4';
                                    setTimeout(() => urlInp.style.background = '', 1000);
                                }
                            }
                        });
                    }

                    // 2. Social Links (Smart Fill)
                    const socialsContainer = document.getElementById('socials-container');
                    if (socialsContainer && data.socials) {
                        const rows = socialsContainer.querySelectorAll('.social-row');
                        data.socials.forEach((social, i) => {
                            let targetRow = rows[i];
                            if (!targetRow) {
                                const addBtn = document.getElementById('add-social-btn');
                                if (addBtn) { addBtn.click(); targetRow = socialsContainer.lastElementChild; }
                            }
                            if (targetRow) {
                                const selectInp = targetRow.querySelector('select[name*="[icon]"]');
                                const urlInp = targetRow.querySelector('input[name*="[url]"]');
                                if (selectInp) {
                                    selectInp.value = social.icon;
                                    selectInp.dispatchEvent(new Event('change'));
                                    selectInp.style.background = '#f0fdf4';
                                    setTimeout(() => selectInp.style.background = '', 1000);
                                }
                                if (urlInp) {
                                    urlInp.value = social.url;
                                    urlInp.style.background = '#f0fdf4';
                                    setTimeout(() => urlInp.style.background = '', 1000);
                                }
                            }
                        });
                    }

                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalHtml;
                        if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                        showNotification('AI Content Generated!', 'success');
                    }
                } else {
                    throw new Error(result.message || 'Generation failed');
                }
            } catch (error) {
                console.error('AI Error:', error);
                showNotification('AI Error: ' + error.message, 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        }

        document.addEventListener('DOMContentLoaded', function () {
            function setupDynamicAdd(containerId, btnId, rowClass, generateHtml) {
                const container = document.getElementById(containerId);
                const addBtn = document.getElementById(btnId);
                if (!addBtn || !container) return;
                addBtn.addEventListener('click', () => {
                    const currentRows = container.querySelectorAll(`.${rowClass}`);
                    const nextIndex = currentRows.length;
                    const div = document.createElement('div');
                    div.className = `${rowClass} mt-6 animate-fade-in`;
                    div.innerHTML = generateHtml(nextIndex);
                    container.appendChild(div);
                });
            }

            setupDynamicAdd('custom-fields-container', 'add-custom-field-btn', 'custom-field-row', (index) => `
                <div class="flex items-end gap-5 max-w-[420px] pt-4 border-t border-gray-100">
                    <div class="flex-1">
                        <label class="block text-[12px] font-bold mb-2 pl-0.5">Field Name</label>
                        <input type="text" name="custom_fields[${index}][name]" class="thin-input w-full h-[36px] px-3 text-[13px] bg-white">
                    </div>
                    <div class="flex-1 flex items-end gap-3">
                        <div class="flex-1">
                            <label class="block text-[12px] font-bold mb-2 pl-0.5">URL</label>
                            <input type="text" name="custom_fields[${index}][url]" class="thin-input w-full h-[36px] px-3 text-[13px] bg-white text-gray-600 outline-none" placeholder="Enter URL">
                        </div>
                        <button type="button" onclick="this.closest('.custom-field-row').remove()" class="inline-flex items-center gap-1 text-[11px] font-bold whitespace-nowrap mb-2 text-red-500 hover:text-red-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Remove
                        </button>
                    </div>
                </div>
            `);

            setupDynamicAdd('ctas-container', 'add-cta-btn', 'cta-row', (index) => `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-t border-gray-100 pt-6 mt-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Button ${index + 1}</label>
                        <input type="text" name="ctas[${index}][text]" placeholder="e.g Send message"
                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                        <div class="flex items-center gap-3">
                            <input type="text" name="ctas[${index}][url]" placeholder="https://..."
                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                            <button type="button" onclick="this.closest('.cta-row').remove()"
                                class="text-xs font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">Remove</button>
                        </div>
                    </div>
                </div>
            `);

            setupDynamicAdd('socials-container', 'add-social-btn', 'social-row', (index) => `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-t border-gray-100 pt-6 mt-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Social ${index + 1}</label>
                        <select name="social_links[${index}][icon]"
                            class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700 appearance-none transition-all">
                            <option value="fab fa-facebook">Facebook</option>
                            <option value="fab fa-twitter">Twitter</option>
                            <option value="fab fa-x-twitter">X (Twitter)</option>
                            <option value="fab fa-instagram">Instagram</option>
                            <option value="fab fa-threads">Threads</option>
                            <option value="fab fa-linkedin">LinkedIn</option>
                            <option value="fab fa-whatsapp">WhatsApp</option>
                            <option value="fab fa-telegram">Telegram</option>
                            <option value="fab fa-tiktok">TikTok</option>
                            <option value="fab fa-snapchat">Snapchat</option>
                            <option value="fab fa-behance">Behance</option>
                            <option value="fab fa-dribbble">Dribbble</option>
                            <option value="fab fa-github">GitHub</option>
                            <option value="fab fa-youtube">YouTube</option>
                            <option value="fab fa-discord">Discord</option>
                            <option value="fab fa-medium">Medium</option>
                            <option value="fab fa-slack">Slack</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                        <div class="flex items-center gap-3">
                            <input type="text" name="social_links[${index}][url]" placeholder="https://..."
                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                            <button type="button" onclick="this.closest('.social-row').remove()"
                                class="text-xs font-semibold text-red-500 hover:text-red-600 whitespace-nowrap">Remove</button>
                        </div>
                    </div>
                </div>
            `);

        });

        function updateHiddenFields() {
            // Safe get value helper
            const check = (id) => document.getElementById(id)?.checked ?? false;

            // Form Fields
            const fieldsJson = {
                email: check('field_email') ? 'on' : 'off',
                phone: check('field_phone') ? 'on' : 'off',
                location: check('field_location') ? 'on' : 'off',
                show_social_links: check('opt_socials') ? 'on' : 'off',
                make_rounded: check('opt_rounded') ? 'on' : 'off',
            };
            const target = document.getElementById('form_fields_json');
            if (target) target.value = JSON.stringify(fieldsJson);

            // CTAs
            const ctas = [];
            document.querySelectorAll('.cta-row').forEach(row => {
                const textInp = row.querySelector('input[name*="[text]"]');
                const urlInp = row.querySelector('input[name*="[url]"]');
                if (textInp && textInp.value) {
                    ctas.push({ text: textInp.value, url: urlInp ? urlInp.value : '#' });
                }
            });
            const ctasTarget = document.getElementById('ctas_json');
            if (ctasTarget) ctasTarget.value = JSON.stringify(ctas);

            // Social links
            const socials = [];
            document.querySelectorAll('.social-row').forEach(row => {
                const iconSel = row.querySelector('select[name*="[icon]"]');
                const urlInp = row.querySelector('input[name*="[url]"]');
                if (urlInp && urlInp.value) {
                    socials.push({ icon: iconSel ? iconSel.value : 'fab fa-facebook', url: urlInp.value });
                }
            });
            const socialsTarget = document.getElementById('social_links_json');
            if (socialsTarget) socialsTarget.value = JSON.stringify(socials);
        }

        function prepareSubmit(e) {
            updateHiddenFields();
            // Get the submit button from the form
            const btn = e.target.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generating...`;
            }
        }

        // Auto-update on any change
        document.addEventListener('input', updateHiddenFields);
        document.addEventListener('change', updateHiddenFields);

        // Initial build on load
        document.addEventListener('DOMContentLoaded', updateHiddenFields);

        function showLoading(e) {
            try { updateHiddenFields(); } catch (e) { }
            const btn = e.target.querySelector('button[type="submit"]');
            if (btn) {
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Fast Redirecting...`;
            }
        }

        // Final fallback initialization
        updateHiddenFields();
    </script>
</x-app-layout>