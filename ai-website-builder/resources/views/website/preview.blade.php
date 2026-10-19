<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Preview - {{ $hero->title }}</title>
    <script src="/js/tailwind.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }
        
        .floating-back {
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: 48px;
            height: 48px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid #f1f5f9;
            color: #64748b;
            transition: all 0.2s ease;
            z-index: 100;
        }
        
        .floating-back:hover {
            transform: translateX(-4px);
            color: #1e293b;
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }

        .edit-hero-btn {
            position: absolute;
            top: 24px;
            right: 24px;
            background: #a78bfa;
            color: white;
            padding: 8px 20px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
            z-index: 50;
        }

        .edit-hero-btn:hover {
            background: #8b5cf6;
            transform: translateY(-1px);
        }

        .cta-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 40px 24px;
            text-align: center;
            transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            border: 1px solid #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            position: relative;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .cta-card:hover {
            border-color: #6366f1;
            box-shadow: 0 15px 30px -10px rgba(99, 102, 241, 0.15);
            transform: translateY(-6px);
        }

        .cta-icon {
            width: 56px;
            height: 56px;
            background: #f8fafc;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            color: #6366f1;
            transition: all 0.4s ease;
        }

        .cta-card:hover .cta-icon {
            background: #6366f1;
            color: #ffffff;
            transform: scale(1.1);
        }

        .section-label {
            background: #f1f5f9;
            color: #64748b;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
            display: inline-block;
        }

        /* Force Navbar Background Always (Override AI transparent default) */
        #section-navbar nav, #section-navbar header {
            background-color: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border-bottom: 1px solid rgba(226, 232, 240, 0.5) !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
    </style>
</head>
<body>

    @php
        $exportSections = [
            'Navbar' => $hero->navbar,
            'About' => $hero->aboutSection,
            'Skills' => $hero->skillSection,
            'Services' => $hero->serviceSection,
            'Why Choose Us' => $hero->whyChooseUs,
            'Portfolio' => $hero->work,
            'Contact' => $hero->contactSection,
            'Footer' => $hero->footerSection,
        ];
        $missingExportSections = array_keys(array_filter($exportSections, fn ($section) => ! $section));
        $exportFullyReady = count($missingExportSections) === 0;
    @endphp

    <!-- Back Button -->
    @if(Route::has('dashboard'))
    <a href="{{ route('dashboard') }}" class="floating-back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    </a>
    @endif

    @if(Route::has('website.export-loading'))
        <!-- Download Laravel Project Button -->
        <a href="{{ route('website.export-loading', $hero->id) }}" class="fixed bottom-[30px] right-[30px] z-[100] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Laravel Backend
        </a>
    @endif



    <!-- Render Website Sections -->
    <div class="relative">
    <!-- Render Website Sections -->
    <div class="relative">
        <!-- Navbar Section -->
        @if($hero->navbar && !empty($hero->navbar->generated_code))
            @php 
                $nStyles = is_string($hero->navbar->custom_styles) ? json_decode($hero->navbar->custom_styles, true) : ($hero->navbar->custom_styles ?? []); 
            @endphp
            @if(!empty($nStyles))
            <style>
                @if(!empty($nStyles['padding']))
                #section-navbar nav { padding-top: {{ $nStyles['padding'] }}px !important; padding-bottom: {{ $nStyles['padding'] }}px !important; }
                @endif
                
                @if(!empty($nStyles['nav_bg_color']))
                #section-navbar nav { background-color: {{ $nStyles['nav_bg_color'] }} !important; }
                @endif
                
                @if(!empty($nStyles['link_color']))
                #section-navbar a:not(.cta-btn), #section-navbar .nav-item { color: {{ $nStyles['link_color'] }} !important; }
                @endif
                
                @if(!empty($nStyles['link_size']))
                #section-navbar a:not(.cta-btn), #section-navbar .nav-item { font-size: {{ $nStyles['link_size'] }}px !important; }
                @endif
                
                @if(!empty($nStyles['btn_bg_color']))
                #section-navbar .cta-btn { background-color: {{ $nStyles['btn_bg_color'] }} !important; }
                @endif
                
                @if(!empty($nStyles['btn_text_color']))
                #section-navbar .cta-btn { color: {{ $nStyles['btn_text_color'] }} !important; }
                @endif
                
                @if(!empty($nStyles['btn_size']))
                #section-navbar .cta-btn { 
                    font-size: {{ $nStyles['btn_size'] }}px !important; 
                    padding: {{ round(intval($nStyles['btn_size']) * 0.75) }}px {{ round(intval($nStyles['btn_size']) * 2) }}px !important;
                }
                @endif
                
                @if(!empty($nStyles['logo_size']))
                #section-navbar img, #section-navbar .logo-img { height: {{ $nStyles['logo_size'] }}px !important; width: auto !important; }
                @endif
                
                @if(!empty($nStyles['link_bg_color']))
                #section-navbar a:not(.cta-btn), #section-navbar .nav-item { position: relative !important; text-decoration: none !important; border-bottom: none !important; }
                #section-navbar a:not(.cta-btn):hover, #section-navbar .nav-item:hover, #section-navbar a:not(.cta-btn):focus, #section-navbar .nav-item:focus { color: {{ $nStyles['link_bg_color'] }} !important; opacity: 0.9 !important; }
                #section-navbar a:not(.cta-btn)::after, #section-navbar .nav-item::after { content: "" !important; position: absolute !important; bottom: -4px !important; left: 50% !important; width: 0 !important; height: 3px !important; border-radius: 3px !important; background-color: {{ $nStyles['link_bg_color'] }} !important; transform: translateX(-50%) !important; transition: width 0.3s ease !important; display: block !important; }
                #section-navbar a:not(.cta-btn):hover::after, #section-navbar .nav-item:hover::after { width: 100% !important; }
                @endif
                
                @if(!empty($nStyles['icon_color']))
                #section-navbar .hamburger svg, #section-navbar #hamburger-btn svg { stroke: {{ $nStyles['icon_color'] }} !important; }
                #section-navbar .hamburger svg line, #section-navbar #hamburger-btn svg line { stroke: {{ $nStyles['icon_color'] }} !important; }
                @endif
            </style>
            @endif
            <div id="section-navbar" class="relative z-[100]">
                {!! $hero->navbar->generated_code !!}
            </div>
        @endif

        <!-- Hero Section -->
        <div id="home">
            @php $hStyles = $hero->custom_styles ?? []; $hBg = $hero->background_image; @endphp
            @if(!empty($hStyles) || $hBg)
            @php
                $hPadding = isset($hStyles['padding']) ? (int)$hStyles['padding'] : 80;
                $hasNavbar = $hero->navbar && !empty($hero->navbar->generated_code);
                /* In full preview the navbar is likely position:fixed (~80px tall), so add it to top padding */
                $hPaddingTop = $hasNavbar ? ($hPadding + 80) : $hPadding;
            @endphp
            <style>
                @if(!empty($hStyles['title_color'])).hero-title.hero-title { color: {{ $hStyles['title_color'] }} !important; } @endif
                @if(!empty($hStyles['subtitle_color'])).hero-subtitle.hero-subtitle { color: {{ $hStyles['subtitle_color'] }} !important; } @endif
                @if(!empty($hStyles['description_color'])).hero-description.hero-description { color: {{ $hStyles['description_color'] }} !important; } @endif
                @if(!empty($hStyles['button_bg_color']) || !empty($hStyles['button_text_color']))
                .hero-button.hero-button, .hero-cta-2.hero-cta-2, .hero-cta-3.hero-cta-3 {
                    @if(!empty($hStyles['button_bg_color'])) background-color: {{ $hStyles['button_bg_color'] }} !important; @endif
                    @if(!empty($hStyles['button_text_color'])) color: {{ $hStyles['button_text_color'] }} !important; @endif
                }
                @endif
                @if(!empty($hStyles['bg_color']))
                .hero.hero{{ !$hBg ? ', .hero-bg.hero-bg' : '' }} { background-color: {{ $hStyles['bg_color'] }} !important; }
                @endif
                /* Apply section padding + navbar offset */
                .hero.hero { padding-top: {{ $hPaddingTop }}px !important; padding-bottom: {{ $hPadding }}px !important; }
                @if($hBg && $hero->layout_style !== 'split')
                @php
                    if (str_starts_with($hBg, 'http')) {
                        $hBgUrl = $hBg;
                    } elseif (str_starts_with($hBg, '/images/')) {
                        $hBgUrl = url($hBg);
                    } elseif (str_starts_with($hBg, '/storage/')) {
                        $hBgUrl = url($hBg);
                    } else {
                        $hBgUrl = url('/storage/' . ltrim($hBg, '/'));
                    }
                    $hBgOpacity = isset($hStyles['bg_opacity']) ? ((int)$hStyles['bg_opacity'] / 100) : 1;
                    $hBgBlur = isset($hStyles['bg_blur']) ? (int)$hStyles['bg_blur'] : 0;
                    $hOverlayColor = $hStyles['overlay_color'] ?? '#000000';
                    $hOverlayOpacity = isset($hStyles['overlay_opacity']) ? ((int)$hStyles['overlay_opacity'] / 100) : 0;
                    $hGradOpacity = isset($hStyles['gradient_opacity']) ? ((int)$hStyles['gradient_opacity'] / 100) : 0;
                    $hGradAngle = $hStyles['gradient_angle'] ?? 180;
                    $hGradFrom = $hStyles['gradient_from_color'] ?? '#000000';
                    $hGradTo = $hStyles['gradient_to_color'] ?? '#ffffff';
                @endphp
                .hero.hero { background-image: url("{{ $hBgUrl }}") !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; position: relative !important; }
                .hero-bg.hero-bg { background: transparent !important; }
                .hero.hero > *:not(.hero-bg) { position: relative; z-index: 10; }
                @if($hBgOpacity < 1)
                .hero.hero::before { content: ""; position: absolute; inset: 0; background-color: white !important; opacity: {{ 1 - $hBgOpacity }} !important; pointer-events: none; z-index: 1; @if($hBgBlur > 0) backdrop-filter: blur({{ $hBgBlur }}px); -webkit-backdrop-filter: blur({{ $hBgBlur }}px); @endif }
                @elseif($hBgBlur > 0)
                .hero.hero::before { content: ""; position: absolute; inset: 0; background-color: transparent !important; pointer-events: none; z-index: 1; backdrop-filter: blur({{ $hBgBlur }}px); -webkit-backdrop-filter: blur({{ $hBgBlur }}px); }
                @elseif($hOverlayOpacity > 0)
                .hero.hero::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: {{ $hOverlayColor }} !important; opacity: {{ $hOverlayOpacity }} !important; pointer-events: none; z-index: 1; }
                @endif
                @if($hGradOpacity > 0)
                .hero.hero::after { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient({{ $hGradAngle }}deg, {{ $hGradFrom }}, {{ $hGradTo }}) !important; opacity: {{ $hGradOpacity }} !important; pointer-events: none; z-index: 2; }
                @endif
                @endif
            </style>
            @endif
            {!! $hero->generated_code !!}
        </div>

        <!-- About Section -->
        @if($hero->aboutSection && !empty($hero->aboutSection->generated_code))
            <div id="about">
                {!! $hero->aboutSection->generated_code !!}
            </div>
        @endif

        <!-- Skills Section -->
        @if($hero->skillSection && !empty($hero->skillSection->generated_code))
            <div id="skills">
                {!! $hero->skillSection->generated_code !!}
            </div>
        @endif

        <!-- Services Section or Placeholder -->
        @if($hero->serviceSection && !empty($hero->serviceSection->generated_code))
            <div id="services">
                {!! $hero->serviceSection->generated_code !!}
            </div>
        @endif

        <!-- Why Choose Us Section or Placeholder -->
        @if($hero->whyChooseUs && !empty($hero->whyChooseUs->generated_code))
            <div id="why-choose-us">
                {!! $hero->whyChooseUs->generated_code !!}
            </div>
        @endif

        <!-- Work Section or Placeholder -->
        @if($hero->work && !empty($hero->work->generated_code))
            <div id="projects">
                {!! $hero->work->generated_code !!}
            </div>
        @endif

        <!-- Contact Section -->
        @if($hero->contactSection && !empty($hero->contactSection->generated_code))
            <div id="contact">
                {!! $hero->contactSection->generated_code !!}
            </div>
        @endif

        <!-- Footer Section -->
        @if($hero->footerSection && !empty($hero->footerSection->generated_code))
            <div id="footer">
                {!! $hero->footerSection->generated_code !!}
            </div>
        @endif

        @if(Route::has('hero.generate'))
        <!-- "Ready to add more?" Section -->
        <div class="py-24 px-6 max-w-7xl mx-auto">
            <div class="text-center mb-16">
                <span class="section-label">Website Builder</span>
                <h2 class="text-4xl font-extrabold text-[#111] mb-3">Ready to add more?</h2>
                <p class="text-slate-500 text-sm">Your website is taking shape. Tap a section below to continue.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Hero Card -->
                <a href="{{ route('hero.generate', $hero->id) }}" class="cta-card group border-emerald-100 bg-emerald-50/20">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Hero Section</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Customize your main banner and first impression.</p>
                    <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                </a>
                <!-- Navbar Card -->
                <a href="{{ $hero->navbar ? route('navbar.generate', $hero->navbar->id) : route('navbar.create', $hero->id) }}" class="cta-card group {{ $hero->navbar ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Navbar</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Create your site navigation and logo area.</p>
                    @if($hero->navbar)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- Skills Card -->
                <a href="{{ $hero->skillSection ? route('skills.generate', $hero->skillSection->id) : route('skills.create', $hero->id) }}" class="cta-card group {{ $hero->skillSection ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Skills</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Showcase your technical skills and expertise levels.</p>
                    @if($hero->skillSection)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- Services Card -->
                <a href="{{ $hero->serviceSection ? route('services.generate', $hero->serviceSection->id) : route('services.create', $hero->id) }}" class="cta-card group {{ $hero->serviceSection ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m8 4L4 7m0 0v10l8 4" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Services</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Highlight your key offerings and features.</p>
                    @if($hero->serviceSection)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- Why Choose Us Card -->
                <a href="{{ $hero->whyChooseUs ? route('why-choose-us.generate', $hero->whyChooseUs->id) : route('why-choose-us.create', $hero->id) }}" class="cta-card group {{ $hero->whyChooseUs ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Why Choose Us</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Build trust by sharing your unique strengths.</p>
                    @if($hero->whyChooseUs)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- Portfolio Card -->
                <a href="{{ $hero->work ? route('work.generate', $hero->work->id) : route('work.create', $hero->id) }}" class="cta-card group {{ $hero->work ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Portfolio</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Display your best works and projects.</p>
                    @if($hero->work)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- About Card -->
                <a href="{{ $hero->aboutSection ? route('about.generate', $hero->aboutSection->id) : route('about.create', $hero->id) }}" class="cta-card group {{ $hero->aboutSection ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">About</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Tell your story and introduce yourself.</p>
                    @if($hero->aboutSection)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- Contact Card -->
                <a href="{{ $hero->contactSection ? route('contact.generate', $hero->contactSection->id) : route('contact.create', $hero->id) }}" class="cta-card group {{ $hero->contactSection ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Contact</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Let visitors get in touch with you.</p>
                    @if($hero->contactSection)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>

                <!-- Footer Card -->
                <a href="{{ $hero->footerSection ? route('footer.generate', $hero->footerSection->id) : route('footer.create', $hero->id) }}" class="cta-card group {{ $hero->footerSection ? 'border-emerald-100 bg-emerald-50/20' : '' }}">
                    <div class="cta-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2">Footer</h3>
                    <p class="text-xs text-slate-400 leading-relaxed max-w-[200px]">Bottom navigation and social links.</p>
                    @if($hero->footerSection)
                        <span class="absolute top-4 right-4 text-[10px] font-black text-emerald-500">COMPLETE</span>
                    @endif
                </a>
            </div>

            @if(Route::has('website.export-loading'))
            <!-- Full Download Section -->
            <div class="mt-20 text-center bg-indigo-50 rounded-3xl p-10 border border-indigo-100">
                @if($exportFullyReady)
                <h3 class="text-2xl font-bold text-indigo-900 mb-4">Your Laravel Project is Ready!</h3>
                <p class="text-indigo-700 mb-8 max-w-2xl mx-auto">Download the complete source code including the frontend design and the backend dashboard to manage your portfolio sections.</p>
                @else
                <h3 class="text-2xl font-bold text-indigo-900 mb-4">Download Your Website Project</h3>
                <p class="text-indigo-700 mb-4 max-w-2xl mx-auto">You can export your site now. Complete the remaining sections below to include them in the download.</p>
                <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 max-w-2xl mx-auto">
                    Missing sections: {{ implode(', ', $missingExportSections) }}
                </p>
                @endif
                
                <a href="{{ route('website.export-loading', $hero->id) }}" 
                   class="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-indigo-500/40 transition-all hover:-translate-y-1 hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download Full Laravel Project
                </a>
            </div>
            @endif

        </div>
        @endif
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (window.gsap && window.ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);
                // AI generated code often relies on these being initialized
            }
        });
    </script>
</body>
</html>
