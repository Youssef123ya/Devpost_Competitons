<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - {{ $hero->title }}</title>
    <script src="/js/tailwind.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }

        .contact-page-wrapper {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .main-contact-content {
            flex: 1;
            min-height: 50vh;
        }
    </style>
</head>

<body>
    <div class="contact-page-wrapper">
        <!-- Site Header Navigation -->
        @if($hero->navbar && !empty($hero->navbar->generated_code))
            @php
                $navStyles = $hero->navbar->custom_styles ?? [];
                $navBg = $navStyles['nav_bg_color'] ?? '#ffffff';
                $linkColor = $navStyles['link_color'] ?? '#000000';
                $hoverColor = $navStyles['link_bg_color'] ?? '#6366f1';
                $btnBg = $navStyles['btn_bg_color'] ?? '#6366f1';
                $btnText = $navStyles['btn_text_color'] ?? '#ffffff';
                $iconColor = $navStyles['icon_color'] ?? '#1a1a1a';
                $btnSize = $navStyles['btn_size'] ?? 14;
                $linkSize = ($navStyles['link_size'] ?? 14) . 'px';
                $logoSize = ($navStyles['logo_size'] ?? 36) . 'px';
                $vPadding = ($navStyles['padding'] ?? 16) . 'px';

                $btnVPad = round($btnSize * 0.75) . 'px';
                $btnHPad = round($btnSize * 2) . 'px';
            @endphp
            <style>
                /* Dynamic Navbar Styles applied from Editor */
                #standalone-nav nav,
                #standalone-nav>div:first-child {
                    /* Background color intentionally omitted to preserve AI transparent-to-solid scroll effect */
                    padding-top:
                        {{ $vPadding }}
                        !important;
                    padding-bottom:
                        {{ $vPadding }}
                        !important;
                }

                #standalone-nav img,
                #standalone-nav .logo-img {
                    height:
                        {{ $logoSize }}
                        !important;
                    width: auto !important;
                }

                #standalone-nav a:not(.cta-btn), #standalone-nav .nav-item {
                    color: {{ $linkColor }} !important;
                    font-size: {{ $linkSize }} !important;
                    position: relative !important;
                    text-decoration: none !important;
                    border-bottom: none !important; /* Disable any AI native borders */
                    transition: color 0.3s ease !important;
                }
                #standalone-nav a:not(.cta-btn):hover, #standalone-nav .nav-item:hover,
                #standalone-nav a:not(.cta-btn):focus, #standalone-nav .nav-item:focus,
                #standalone-nav a:not(.cta-btn):active, #standalone-nav .nav-item:active {
                    color: {{ $hoverColor }} !important;
                    opacity: 0.9 !important;
                }
                /* Enforce our own perfect 3px animated underline with 100% width */
                #standalone-nav a:not(.cta-btn)::after, #standalone-nav .nav-item::after {
                    content: "" !important;
                    position: absolute !important;
                    bottom: -4px !important;
                    left: 50% !important;
                    width: 0 !important;
                    height: 3px !important;
                    border-radius: 3px !important;
                    background-color: {{ $hoverColor }} !important;
                    transform: translateX(-50%) !important;
                    transition: width 0.3s ease !important;
                    display: block !important;
                }
                #standalone-nav a:not(.cta-btn):hover::after, #standalone-nav .nav-item:hover::after,
                #standalone-nav a:not(.cta-btn):focus::after, #standalone-nav .nav-item:focus::after,
                #standalone-nav a:not(.cta-btn):active::after, #standalone-nav .nav-item:active::after {
                    width: 100% !important; /* Fits each word perfectly */
                }

                #standalone-nav .cta-btn,
                #standalone-nav .btn-group a {
                    background-color:
                        {{ $btnBg }}
                        !important;
                    color:
                        {{ $btnText }}
                        !important;
                    font-size:
                        {{ $btnSize }}
                        px !important;
                    padding:
                        {{ $btnVPad }}
                        {{ $btnHPad }}
                        !important;
                    border-radius: 99px !important;
                    text-decoration: none !important;
                    display: inline-block !important;
                    font-weight: 700 !important;
                    transition: all 0.3s ease !important;
                }

                #standalone-nav .cta-btn:hover,
                #standalone-nav .btn-group a:hover {
                    filter: brightness(1.1) !important;
                    transform: translateY(-1px) !important;
                }

                /* Mobile Hamburger Icon Color */
                #standalone-nav .hamburger svg, #standalone-nav #hamburger-btn svg {
                    stroke: {{ $iconColor }} !important;
                }
                #standalone-nav .hamburger svg line, #standalone-nav #hamburger-btn svg line {
                    stroke: {{ $iconColor }} !important;
                }

                #standalone-nav nav,
                #standalone-nav #mobile-menu {
                    overflow: visible !important;
                }
            </style>
            <div id="standalone-nav">
                {!! $hero->navbar->generated_code !!}
            </div>
        @endif

        <!-- Single Contact Design Rendering -->
        <main class="main-contact-content shadow-inner">
            @if($hero->contactSection && !empty($hero->contactSection->generated_code))
                {!! str_replace('id="contact"', 'id="contact-standalone"', $hero->contactSection->generated_code) !!}
            @else
                <div class="py-40 text-center">
                    <h1 class="text-4xl font-extrabold text-[#111] mb-4">Contact Us</h1>
                    <p class="text-slate-500">Design not yet generated.</p>
                </div>
            @endif
        </main>

        <!-- Site Footer Navigation -->
        @if($hero->footerSection && !empty($hero->footerSection->generated_code))
            <div id="standalone-footer">
                {!! $hero->footerSection->generated_code !!}
            </div>
        @endif
    </div>

    <!-- Script to fix navigation links back to homepage sections -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const homeUrl = "{{ route('website.preview', $hero->id) }}";
            document.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                // All hash links except the current contact ID should go back home
                if (href && href.startsWith('#') && href !== '#contact-standalone' && href !== '#site-nav') {
                    link.setAttribute('href', homeUrl + href);
                }
            });
        });
    </script>
</body>

</html>