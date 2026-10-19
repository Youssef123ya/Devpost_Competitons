<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use App\Models\Navbar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class NavbarController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::with(['navbar'])->findOrFail($heroId);
        return view('navbar.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $validated = $request->validate([
            'layout_style' => 'required|in:centered,left-aligned,right-aligned',
            'links' => 'required|array|min:1',
            'links.*.title' => 'required|string',
            'links.*.url' => 'required|string',
            'logo_image' => 'nullable|image|max:2048',
            'logo_text' => 'nullable|string',
            'buttons' => 'nullable|array|max:3',
            'buttons.*.text' => 'nullable|string',
            'buttons.*.url' => 'nullable|string',
            'buttons.*.is_external' => 'nullable|boolean',
            'bg_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'nav_bg_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'link_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'link_bg_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'btn_bg_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'btn_text_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'link_size' => 'nullable|integer|min:8|max:40',
            'logo_size' => 'nullable|integer|min:10|max:200',
            'padding' => 'nullable|integer|min:0|max:100',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo_image')) {
            $logoPath = $request->file('logo_image')->store('logos', 'public');
        }

        $colors = [
            'bg_color' => $validated['bg_color'],
            'nav_bg_color' => $validated['nav_bg_color'],
            'link_color' => $validated['link_color'],
            'link_bg_color' => $validated['link_bg_color'] ?? 'transparent',
            'btn_bg_color' => $validated['btn_bg_color'],
            'btn_text_color' => $validated['btn_text_color'],
            'link_size' => $validated['link_size'] ?? 14,
            'logo_size' => $validated['logo_size'] ?? 40,
            'padding' => $validated['padding'] ?? 16,
        ];

        $navbar = Navbar::updateOrCreate(
            ['hero_id' => $heroId],
            [
                'layout_style' => $validated['layout_style'],
                'links_data' => $validated['links'],
                'logo_image' => $logoPath,
                'logo_text' => $validated['logo_text'] ?? '',
                'buttons_data' => array_map(function ($btn) {
                    return [
                        'text' => $btn['text'] ?? '',
                        'url' => $btn['url'] ?? '#',
                        'is_external' => isset($btn['is_external'])
                    ];
                }, $request->input('buttons', [])),
                'custom_styles' => $colors,
                'generated_code' => null
            ]
        );

        return redirect()->route('navbar.generate', $navbar->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $navbar = Navbar::with('hero')->findOrFail($id);
        $hero = $navbar->hero;
        $heroContent = $hero ? $hero->generated_code : '';
        $needsGeneration = empty($navbar->generated_code) || str_contains($navbar->generated_code, 'Generating AI Navbar');
        return view('navbar.preview', compact('navbar', 'hero', 'heroContent', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $navbar = Navbar::findOrFail($id);
        if (!empty($navbar->generated_code)) {
            return response()->json(['success' => true, 'code' => $navbar->generated_code]);
        }
        $content = $this->generateAiCode($navbar);
        $navbar->update(['generated_code' => $content]);
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $content]);
    }

    public function regenerate($id)
    {
        $navbar = Navbar::findOrFail($id);
        $navbar->update(['generated_code' => null]);
        return redirect()->route('navbar.generate', $id);
    }

    public function updateDesign(Request $request, $id)
    {
        $navbar = Navbar::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string',
            'styles' => 'nullable|string', // Comes as string in FormData
            'links' => 'nullable|string',  // Comes as string in FormData
            'buttons' => 'nullable|string', // Comes as string in FormData
            'logo_text' => 'nullable|string',
            'logo_image' => 'nullable|image|max:1024'
        ]);

        $navbar->generated_code = $validated['code'];

        if ($request->remove_logo == "1") {
            if ($navbar->logo_image) {
                \Storage::disk('public')->delete($navbar->logo_image);
            }
            $navbar->logo_image = null;
        } elseif ($request->hasFile('logo_image')) {
            $path = $request->file('logo_image')->store('logos', 'public');
            $navbar->logo_image = $path;
        }

        if (isset($validated['logo_text'])) {
            $navbar->logo_text = $validated['logo_text'];
        }

        if (isset($validated['styles'])) {
            $styles = json_decode($validated['styles'], true);
            $navbar->custom_styles = array_merge($navbar->custom_styles ?? [], $styles);
        }

        if (isset($validated['links'])) {
            $navbar->links_data = json_decode($validated['links'], true);
        }

        if (isset($validated['buttons'])) {
            $navbar->buttons_data = json_decode($validated['buttons'], true);
        }

        $navbar->save();

        return response()->json(['success' => true]);
    }

    public function updateLogo(Request $request, $id)
    {
        $navbar = Navbar::findOrFail($id);
        $request->validate(['logo_image' => 'required|image|max:2048']);

        if ($navbar->logo_image)
            Storage::disk('public')->delete($navbar->logo_image);
        $path = $request->file('logo_image')->store('logos', 'public');
        $navbar->update(['logo_image' => $path]);

        return response()->json(['success' => true]);
    }

    private function generateAiCode($navbar)
    {
        $links = '';
        foreach ($navbar->links_data as $link) {
            $links .= "- {$link['title']} ({$link['url']})\n";
        }

        $styles = $navbar->custom_styles;
        $logoUrl = $navbar->logo_image ? asset('storage/' . $navbar->logo_image) : null;
        $logoText = $navbar->logo_text ?? '';

        $buttonsStr = '';
        foreach (($navbar->buttons_data ?? []) as $btn) {
            if (!empty($btn['text'])) {
                $external = ($btn['is_external'] ?? false) ? ' [EXTERNAL - MUST OPEN IN NEW TAB]' : '';
                $buttonsStr .= "- CTA Button: {$btn['text']} ({$btn['url']}){$external}\n";
            }
        }

        $prompt = "Generate an ULTRA-PREMIUM, MODERN navigation bar using HTML and Tailwind CSS. The design should feel like a high-end SaaS or Apple-style interface.
        
        STRICT DATA TO USE:
        - Layout: {$navbar->layout_style} (centered/split)
        - Links (USE ONLY THESE, NO OTHERS):
        {$links}
        " . ($logoUrl ? "- Logo Image URL: {$logoUrl} (IMPORTANT: Display this as an <img> tag with h-9)\n" : ($logoText ? "- Brand Name: {$logoText}\n" : "- Brand/Logo: REMOVE/HIDE COMPLETELY\n")) . "
        " . (!empty($buttonsStr) ? "STRICT BUTTONS TO USE:\n{$buttonsStr}" : "- Main CTA Button: REMOVE/HIDE COMPLETELY\n") . "
        
        Detailed Design Requirements:
        1. Link Hover Effect: Use an 'Elegant Animated Underline'. On hover, a 2px underline should expand smoothly from the CENTER of the link text. The text should also slightly darken/brighten for feedback.
        2. Layout Logic: 
           - If 'centered': Logo on the absolute LEFT, Links in the absolute CENTER, and CTA Button on the absolute RIGHT. Use `justify-between` and `relative` positioning for the center container to ensure pixel-perfect centering.
           - If 'left-aligned': Logo on left, Links and Button on right with a generous gap.
           - If 'right-aligned': Logo on left, all Links and Button pushed to the far right.
        3. Background & Styling: The navbar MUST always have a SLEEK GLASSMORPHISM effect by default: use `bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-md`. Do NOT make it transparent.
        4. Sticky Position: Ensure the navbar is fixed or sticky at the top with `z-50`. No JavaScript scroll listener is needed for the background anymore.
        7. CRITICAL STRUCTURE:
           - The branding/logo container MUST have id='logo-container'.
           - The container for navigation links MUST have id='links-container'.
           - The container for CTA buttons MUST have id='buttons-container'.
           - The mobile/responsive menu container MUST have id='mobile-menu'.
           - Inside 'mobile-menu', there MUST be a <div> that serves as the links container (first child).
        8. Clean Code: Return raw HTML/Tailwind ONLY. Ensure it's self-contained and ready for production. Do NOT include placeholders like 'Home' if they aren't in the provided links.";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENROUTER_API_KEY'),
            ])->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => 'qwen/qwen3-coder:free',
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are an elite frontend developer. You STRICTLY follow user data. NEVER add placeholders.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.1,
                    ]);

            $content = $response->json()['choices'][0]['message']['content'] ?? $this->getDefaultCode($navbar);

            // Clean markdown code blocks if AI included them
            $content = preg_replace('/^```(?:html|css|javascript)?\n?/i', '', $content);
            $content = preg_replace('/\n?```$/', '', $content);

            return $content;
        } catch (\Exception $e) {
            return $this->getDefaultCode($navbar);
        }
    }

    private function getDefaultCode($navbar)
    {
        $styles = $navbar->custom_styles;
        $linksHtml = '';
        foreach ($navbar->links_data as $link) {
            $linksHtml .= "<a href='{$link['url']}' class='nav-item'>{$link['title']}</a>";
        }

        $btnHtml = '';
        foreach (($navbar->buttons_data ?? []) as $btn) {
            if (!empty($btn['text'])) {
                $target = ($btn['is_external'] ?? false) ? "target='_blank' rel='noopener noreferrer'" : "";
                $btnFontSize = ($styles['btn_size'] ?? 14) . 'px';
                $vPad = round(($styles['btn_size'] ?? 14) * 0.75) . 'px';
                $hPad = round(($styles['btn_size'] ?? 14) * 2) . 'px';
                $btnHtml .= "<a href='{$btn['url']}' class='cta-btn' {$target} style='background: {$styles['btn_bg_color']}; color: {$styles['btn_text_color']}; padding: {$vPad} {$hPad}; border-radius: 99px; font-weight: 700; font-size: {$btnFontSize}; text-decoration: none; display: inline-block;'>{$btn['text']}</a>";
            }
        }

        $logoHtml = "";
        if ($navbar->logo_image) {
            $logoUrl = asset('storage/' . $navbar->logo_image);
            $logoHtml = "<img src='{$logoUrl}' alt='Logo' style='height: 40px; width: auto; flex-shrink: 0;'>";
        } elseif ($navbar->logo_text) {
            $logoHtml = "<div style='font-weight: 800; font-size: 1.5rem; flex-shrink: 0; color: {$styles['link_color']};'>{$navbar->logo_text}</div>";
        }

        $layout = $navbar->layout_style;
        $isCentered = $layout === 'centered';
        $flexReverse = $layout === 'right-aligned' ? 'flex-direction: row-reverse;' : '';
        if ($isCentered) {
            return "
            <style>
                .nav-item { 
                    position: relative;
                    color: {$styles['link_color']}; 
                    text-decoration: none; 
                    font-size: " . ($styles['link_size'] ?? 14) . "px; 
                    font-weight: 600; 
                    padding: 4px 0;
                    transition: all 0.3s ease;
                }
                .nav-item::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -2px;
                    left: 50%;
                    background-color: {$styles['link_bg_color']};
                    transition: all 0.3s ease;
                    transform: translateX(-50%);
                }
                .nav-item:hover::after { width: 100%; }
                .nav-item:hover { opacity: 0.8; }
                .cta-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

                #mobile-menu {
                    position: fixed;
                    top: 0;
                    right: -100%;
                    width: 100%;
                    height: 100vh;
                    background: white;
                    z-index: 999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2rem;
                    transition: 0.4s ease-in-out;
                }
                #mobile-menu.active { right: 0; }
                .hamburger { cursor: pointer; display: none; z-index: 1001; }
                
                @media (max-width: 1024px) {
                    .desktop-links, .desktop-cta { display: none !important; }
                    .hamburger { display: block !important; }
                }
            </style>
            <nav id='dynamic-navbar' style='background: transparent; padding: 1.25rem 5%; display: flex; justify-content: space-between; align-items: center; position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);'>
                <div id='logo-container' style='flex: 1; display: flex; justify-content: flex-start;'>
                    {$logoHtml}
                </div>
                <div class='desktop-links' style='flex: 1; display: flex; justify-content: center;'>
                    <div id='links-container' style='display: flex; gap: 1.5rem;'>
                        {$linksHtml}
                    </div>
                </div>
                <div id='buttons-container' class='desktop-cta' style='flex: 1; display: flex; justify-content: flex-end;'>
                    {$btnHtml}
                </div>
                <div class='hamburger' id='hamburger-btn'>
                    <svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='{$styles['link_color']}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                        <line x1='3' y1='12' x2='21' y2='12'></line>
                        <line x1='3' y1='6' x2='21' y2='6'></line>
                        <line x1='3' y1='18' x2='21' y2='18'></line>
                    </svg>
                </div>
            </nav>

            <div id='mobile-menu'>
                <div style='display: flex; flex-direction: column; align-items: center; gap: 2rem;'>
                    {$linksHtml}
                    <div style='margin-top: 1rem;'>
                        {$btnHtml}
                    </div>
                </div>
            </div>

            <script>
                const nav = document.getElementById('dynamic-navbar');
                const hamburger = document.getElementById('hamburger-btn');
                const mobileMenu = document.getElementById('mobile-menu');

                window.addEventListener('scroll', function() {
                    if (window.scrollY > 20) {
                        nav.style.background = '#ffffff';
                        nav.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                        nav.style.padding = '0.8rem 5%';
                    } else {
                        nav.style.background = 'transparent';
                        nav.style.boxShadow = 'none';
                        nav.style.padding = '1.25rem 5%';
                    }
                });

                hamburger.addEventListener('click', () => {
                    mobileMenu.classList.toggle('active');
                    const isOpen = mobileMenu.classList.contains('active');
                    hamburger.innerHTML = isOpen ? 
                        `<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='{$styles['link_color']}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>` :
                        `<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='{$styles['link_color']}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='3' y1='12' x2='21' y2='12'></line><line x1='3' y1='6' x2='21' y2='6'></line><line x1='3' y1='18' x2='21' y2='18'></line></svg>`;
                });
            </script>";
        }

        $flexDirection = $layout === 'right-aligned' ? 'flex-direction: row-reverse;' : '';

        return "
        <style>
            .nav-item { 
                position: relative;
                color: {$styles['link_color']}; 
                text-decoration: none; 
                font-size: " . ($styles['link_size'] ?? 14) . "px; 
                font-weight: 600; 
                padding: 4px 0;
                transition: all 0.3s ease;
            }
            .nav-item::after {
                content: '';
                position: absolute;
                width: 0;
                height: 2px;
                bottom: -2px;
                left: 50%;
                background-color: {$styles['link_bg_color']};
                transition: all 0.3s ease;
                transform: translateX(-50%);
            }
            .nav-item:hover::after { width: 100%; }
            .nav-item:hover { opacity: 0.8; }
            .cta-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

            #mobile-menu {
                position: fixed;
                top: 0;
                right: -100%;
                width: 100%;
                height: 100vh;
                background: white;
                z-index: 999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2rem;
                transition: 0.4s ease-in-out;
            }
            #mobile-menu.active { right: 0; }
            .hamburger { cursor: pointer; display: none; z-index: 1001; }
            
            @media (max-width: 1024px) {
                .desktop-links, .desktop-cta { display: none !important; }
                .hamburger { display: block !important; }
            }
        </style>
        <nav id='dynamic-navbar-side' style='background: transparent; padding: 1.25rem 5%; color: {$styles['link_color']}; display: flex; justify-content: space-between; align-items: center; position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; {$flexDirection} transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);'>
            <div id='logo-container' style='display: flex; align-items: center;'>{$logoHtml}</div>
            <div class='flex items-center gap-6' style='display: flex; align-items: center; gap: 2.5rem; {$flexDirection}'>
                <div id='links-container' class='desktop-links' style='display: flex; gap: 1.5rem; {$flexReverse}'>
                    {$linksHtml}
                </div>
                <div id='buttons-container' class='desktop-cta'>
                    {$btnHtml}
                </div>
            </div>
            <div class='hamburger' id='hamburger-btn-side'>
                <svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='{$styles['link_color']}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                    <line x1='3' y1='12' x2='21' y2='12'></line>
                    <line x1='3' y1='6' x2='21' y2='6'></line>
                    <line x1='3' y1='18' x2='21' y2='18'></line>
                </svg>
            </div>
        </nav>

        <div id='mobile-menu'>
            <div style='display: flex; flex-direction: column; align-items: center; gap: 2rem;'>
                {$linksHtml}
                <div style='margin-top: 1rem;'>
                    {$btnHtml}
                </div>
            </div>
        </div>

        <script>
            const navSide = document.getElementById('dynamic-navbar-side');
            const hamburgerSide = document.getElementById('hamburger-btn-side');
            const mobileMenuSide = document.getElementById('mobile-menu');

            window.addEventListener('scroll', function() {
                if (window.scrollY > 20) {
                    navSide.style.background = '#ffffff';
                    navSide.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    navSide.style.padding = '0.8rem 5%';
                } else {
                    navSide.style.background = 'transparent';
                    navSide.style.boxShadow = 'none';
                    navSide.style.padding = '1.25rem 5%';
                }
            });

            hamburgerSide.addEventListener('click', () => {
                mobileMenuSide.classList.toggle('active');
                const isOpen = mobileMenuSide.classList.contains('active');
                hamburgerSide.innerHTML = isOpen ? 
                    `<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='{$styles['link_color']}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>` :
                    `<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='{$styles['link_color']}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='3' y1='12' x2='21' y2='12'></line><line x1='3' y1='6' x2='21' y2='6'></line><line x1='3' y1='18' x2='21' y2='18'></line></svg>`;
            });
        </script>";
    }
}
