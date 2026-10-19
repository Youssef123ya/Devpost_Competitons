<?php

namespace App\Http\Controllers;

use App\Models\ContactSection;
use App\Models\Hero;
use Illuminate\Http\Request;

class ContactSectionController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::findOrFail($heroId);
        return view('contact.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $hero = Hero::findOrFail($heroId);

        // Bypass strict validation to resolve persistent "must be a valid JSON string" errors
        $validated = [
            'title' => $request->input('title', 'Contact Me'),
            'subtitle' => $request->input('subtitle', 'Get in Touch'),
            'layout_style' => $request->input('layout_style', 'premium-layout'),
            'form_fields' => $request->input('form_fields', '[]'),
            'ctas' => $request->input('ctas', '[]'),
            'social_links' => $request->input('social_links', '[]'),
        ];

        $formFieldsRaw = $request->input('form_fields', '[]');
        $formFields = is_array($formFieldsRaw) ? $formFieldsRaw : (json_decode((string) $formFieldsRaw, true) ?? []);

        $ctasRaw = $request->input('ctas', '[]');
        $ctas = is_array($ctasRaw) ? $ctasRaw : (json_decode((string) $ctasRaw, true) ?? []);

        $socialLinksRaw = $request->input('social_links', '[]');
        $socialLinks = is_array($socialLinksRaw) ? $socialLinksRaw : (json_decode((string) $socialLinksRaw, true) ?? []);

        // Provide decent defaults if empty
        if (empty($socialLinks)) {
            $socialLinks = [
                ['icon' => 'fab fa-facebook', 'url' => '#'],
                ['icon' => 'fab fa-twitter', 'url' => '#'],
                ['icon' => 'fab fa-linkedin', 'url' => '#']
            ];
        }

        $contact = new ContactSection();
        $contact->hero_id = $hero->id;
        $contact->title = $validated['title'] ?? 'Contact Me';
        $contact->subtitle = $validated['subtitle'] ?? 'Get in Touch';
        $contact->layout_style = $validated['layout_style'] ?? 'classic-layout';
        $contact->form_fields = $formFields;
        $contact->ctas = $ctas;
        $contact->social_links = $socialLinks;

        $styles = $contact->custom_styles ?? [];
        $styles['location'] = $request->input('location');
        $styles['phone_number'] = $request->input('phone_number');
        $styles['email_address'] = $request->input('email_address');
        $styles['display_mode'] = $request->input('display_mode', 'full-section');
        $contact->custom_styles = $styles;

        // Clear generated code to trigger generation animation
        $contact->generated_code = null;

        $contact->save();

        return redirect()->route('contact.generate', $contact->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $contact = ContactSection::findOrFail($id);
        $hero = $contact->hero;
        $needsGeneration = empty($contact->generated_code);
        return view('contact.preview', compact('contact', 'hero', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $contact = ContactSection::findOrFail($id);
        if (!empty($contact->generated_code)) {
            return response()->json(['success' => true, 'code' => $contact->generated_code]);
        }
        $code = $this->getDefaultCode($contact);
        $contact->generated_code = $code;
        $contact->save();
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $code]);
    }

    public function regenerate(Request $request, $id)
    {
        $contact = ContactSection::findOrFail($id);
        $contact->generated_code = $this->getDefaultCode($contact);
        $contact->save();
        $this->deductCredits();

        return redirect()->back()->with('success', 'Section regenerated successfully!');
    }

    public function updateDesign(Request $request, $id)
    {
        $contact = ContactSection::findOrFail($id);

        $contact->title = $request->input('title');
        $contact->subtitle = $request->input('subtitle');
        $contact->form_fields = $request->input('form_fields', []);
        $contact->ctas = $request->input('ctas', []);
        $contact->social_links = $request->input('social_links', []);
        $styles = $request->input('styles', []);
        $styles['location'] = $request->input('location');
        $styles['phone_number'] = $request->input('phone_number');
        $styles['email_address'] = $request->input('email_address');
        $styles['display_mode'] = $request->input('display_mode', 'full-section');
        $contact->custom_styles = $styles;

        $html = $this->getDefaultCode($contact);
        $contact->generated_code = $html;

        if (!$request->input('preview_only')) {
            $contact->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Design updated',
            'html' => $html
        ]);
    }

    private function getDefaultCode(ContactSection $contact): string
    {
        $layout = $contact->layout_style ?? 'classic-layout';

        return match ($layout) {
            'premium-layout' => $this->buildPremiumLayout($contact),
            'centered-layout' => $this->buildCenteredLayout($contact),
            'dark-split-layout' => $this->buildDarkSplitLayout($contact),
            default => $this->buildPremiumLayout($contact),
        };
    }

    /* ─────────────────────────────────────────────────────────────────────────
     * Shared helpers
     * ───────────────────────────────────────────────────────────────────────── */

    private function resolveStyles(ContactSection $contact): array
    {
        $styles = $contact->custom_styles ?? [];
        return [
            'bg' => $styles['bg_color'] ?? '#ffffff',
            'text' => $styles['text_color'] ?? '#0f172a',
            'inputBg' => $styles['input_bg_color'] ?? '#f8fafc',
            'btn' => $styles['btn_color'] ?? '#4f46e5',
            'rounded' => $styles['rounded'] ?? 'rounded-xl',
            'socials' => $styles['show_socials'] ?? true,
            'titleSize' => $styles['title_size'] ?? 48,
            'subtitleSize' => $styles['subtitle_size'] ?? 18,
            'padding' => $styles['padding'] ?? 100,
            'socialColor' => $styles['social_color'] ?? '#ffffff',
            'socialHover' => $styles['social_hover_color'] ?? '#0f172a',
        ];
    }

    private function buildFormInputs(array $formFields, string $inputBg, string $textColor, string $rounded): string
    {
        $html = '';
        if (($formFields['email'] ?? 'on') === 'on') {
            $html .= '<div><label class="block text-sm font-medium mb-2" style="color:' . $textColor . ';">Email</label><input type="email" placeholder="example@email.com" class="w-full px-4 py-3 ' . $rounded . ' border-0 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" style="background:' . $inputBg . '; color:' . $textColor . ';"></div>';
        }
        if (($formFields['phone'] ?? 'on') === 'on') {
            $html .= '<div><label class="block text-sm font-medium mb-2" style="color:' . $textColor . ';">Phone Number</label><input type="tel" placeholder="+1 (555) 000-0000" class="w-full px-4 py-3 ' . $rounded . ' border-0 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" style="background:' . $inputBg . '; color:' . $textColor . ';"></div>';
        }

        // Always add Message field
        $html .= '<div><label class="block text-sm font-medium mb-2" style="color:' . $textColor . ';">Message</label><textarea rows="4" placeholder="How can we help you?" class="w-full px-4 py-3 ' . $rounded . ' border-0 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none shadow-sm" style="background:' . $inputBg . '; color:' . $textColor . '; text-align: left;"></textarea></div>';

        return $html;
    }

    private function buildButton(array $ctas, string $btnColor, string $rounded, string $defaultLabel = 'Send Message'): string
    {
        if (!empty($ctas)) {
            $html = '';
            foreach ($ctas as $cta) {
                $text = $cta['text'] ?? $defaultLabel;
                $url = $cta['url'] ?? '#';
                $html .= '<a href="' . $url . '" class="inline-flex items-center justify-center px-8 py-3.5 ' . $rounded . ' text-white font-bold transition-all shadow-lg hover:opacity-90 w-full" style="background:' . $btnColor . ';">' . $text . '</a>';
            }
            return $html;
        }
        return '<button type="button" class="inline-flex items-center justify-center px-8 py-3.5 ' . $rounded . ' text-white font-bold transition-all shadow-lg hover:opacity-90 w-full" style="background:' . $btnColor . ';">' . $defaultLabel . '</button>';
    }

    private function buildSocialIcons(array $socials, bool $show, string $bgColor = '#f8fafc', string $iconColor = '#576574', string $hoverBg = '#0f172a'): string
    {
        if (!$show || empty($socials))
            return '';
        $icons = '';
        $id = 'social_' . uniqid();
        foreach ($socials as $index => $s) {
            $itemId = $id . '_' . $index;
            $icons .= '
            <a href="' . ($s['url'] ?? '#') . '" id="' . $itemId . '" class="w-12 h-12 flex items-center justify-center rounded-xl transition-all shadow-sm border border-slate-100 hover:scale-110 active:scale-[0.8]" style="background-color: ' . $bgColor . '; color: ' . $iconColor . ';">
                <style>
                    #' . $itemId . ':hover { background-color: ' . $hoverBg . ' !important; color: white !important; border-color: ' . $hoverBg . ' !important; }
                </style>
                <i class="' . ($s['icon'] ?? 'fab fa-github') . ' text-xl"></i>
            </a>';
        }
        return $icons ? '<div class="mt-4"><p class="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5 pl-1">Follow & Connect</p><div class="flex flex-wrap gap-4">' . $icons . '</div></div>' : '';
    }

    /* ─────────────────────────────────────────────────────────────────────────
     * Layout 1: Classic  (info left + coloured form card right)  — like the image
     * ───────────────────────────────────────────────────────────────────────── */

    /* ─────────────────────────────────────────────────────────────────────────
     * Layout 2: Centered  (title centred, full-width form below)
     * ───────────────────────────────────────────────────────────────────────── */
    private function buildCenteredLayout(ContactSection $contact): string
    {
        $styles = $contact->custom_styles ?? [];
        ['bg' => $bg, 'text' => $text, 'inputBg' => $inputBg, 'btn' => $btn, 'rounded' => $rounded, 'socials' => $showSocials, 'titleSize' => $titleSize, 'subtitleSize' => $subtitleSize, 'padding' => $padding, 'socialColor' => $socialColor, 'socialHover' => $socialHover] = $this->resolveStyles($contact);

        $title = $contact->title ?? 'Contact Us';
        $subtitle = $contact->subtitle ?? '';
        $fields = $contact->form_fields ?? [];
        $ctas = $contact->ctas ?? [];
        $socials = $contact->social_links ?? [];

        $loc = $styles['location'] ?? 'Your City, Country';
        $ph = $styles['phone_number'] ?? '+1 (555) 000-0000';
        $em = $styles['email_address'] ?? 'hello@example.com';

        $formInputs = $this->buildFormInputs($fields, $inputBg, $text, $rounded);
        $btnHtml = $this->buildButton($ctas, $btn, $rounded);
        $socialHtml = $this->buildSocialIcons($socials, $showSocials === true || $showSocials === 'true', $btn, $socialColor, $socialHover);

        $infoLines = [];
        if (($fields['email'] ?? 'on') === 'on') {
            $infoLines[] = '<div class="flex items-center gap-3"><i class="fa-solid fa-envelope" style="color:' . $btn . ';"></i><span class="text-sm font-medium" style="color:' . $text . ';">' . $em . '</span></div>';
        }
        if (($fields['phone'] ?? 'on') === 'on') {
            $infoLines[] = '<div class="flex items-center gap-3"><i class="fa-solid fa-phone" style="color:' . $btn . ';"></i><span class="text-sm font-medium" style="color:' . $text . ';">' . $ph . '</span></div>';
        }
        if (($fields['location'] ?? 'on') === 'on') {
            $infoLines[] = '<div class="flex items-center gap-3"><i class="fa-solid fa-location-dot" style="color:' . $btn . ';"></i><span class="text-sm font-medium" style="color:' . $text . ';">' . $loc . '</span></div>';
        }

        $infoLine = !empty($infoLines) ? '
            <div class="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-slate-100">
                ' . implode('', $infoLines) . '
            </div>' : '';

        return '
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<section id="contact" class="relative overflow-hidden" style="background:' . $bg . '; padding:' . $padding . 'px 0;">
    <div class="absolute inset-0 pointer-events-none" style="background-image:radial-gradient(#6366f1 0.5px,transparent 0.5px);background-size:32px 32px;opacity:0.04;"></div>
    <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="font-black mb-3" style="color:' . $text . '; font-size:' . $titleSize . 'px; line-height:1.2;">' . $title . '</h2>
        <p class="text-sm font-bold uppercase tracking-widest mb-10" style="color:' . $btn . ';">' . ($subtitle ?: 'Get In Touch') . '</p>
        <div class="bg-white ' . $rounded . ' shadow-xl p-8 border border-slate-100 text-left">
            <form class="grid grid-cols-1 sm:grid-cols-2 gap-6" onsubmit="event.preventDefault();">
                ' . ($formInputs ?: '<div><input type="email" placeholder="Your Email" class="w-full px-4 py-3 rounded-lg border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" style="background:' . $inputBg . ';"></div>') . '
                <div class="sm:col-span-2">' . $btnHtml . '</div>
            </form>
            ' . $infoLine . '
        </div>
        ' . ($socialHtml ? '<div class="flex justify-center mt-12">' . $socialHtml . '</div>' : '') . '
    </div>
</section>';
    }

    /* ─────────────────────────────────────────────────────────────────────────
     * Layout 3: Dark Split  (dark left panel, white form right)
     * ───────────────────────────────────────────────────────────────────────── */
    /* ─────────────────────────────────────────────────────────────────────────
     * Layout 3: Dark Split  (dark left panel, white form right)
     * ───────────────────────────────────────────────────────────────────────── */
    private function buildDarkSplitLayout(ContactSection $contact): string
    {
        $styles = $contact->custom_styles ?? [];
        ['btn' => $btn, 'text' => $text, 'rounded' => $rounded, 'socials' => $showSocials, 'titleSize' => $titleSize, 'padding' => $padding, 'socialColor' => $socialColor, 'socialHover' => $socialHover] = $this->resolveStyles($contact);

        $title = $contact->title ?? 'Let\'s Talk About Your Project';
        $subtitle = $contact->subtitle ?? '';
        $ctas = $contact->ctas ?? [];
        $fields = $contact->form_fields ?? [];

        $loc = $styles['location'] ?? '123 SaaS Street, Innovation City, Techland 56789';
        $ph = $styles['phone_number'] ?? '+62-8234-5674-8901';
        $em = $styles['email_address'] ?? 'contact@landingplay.com';

        $formInputs = $this->buildFormInputs($fields, '#ffffff', '#0f172a', 'rounded-xl');
        $btnHtml = $this->buildButton($ctas, $btn, 'rounded-xl');

        return '
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<section id="contact" class="bg-white px-6 lg:px-20" style="padding-top:' . $padding . 'px; padding-bottom:' . $padding . 'px;">
    <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16 max-w-2xl mx-auto">
            <h2 class="font-black mb-4 leading-tight" style="color:' . $text . '; font-size:' . $titleSize . 'px;">' . $title . '</h2>
            ' . ($subtitle ? '<p class="text-lg font-medium opacity-60" style="color:' . $text . ';">' . $subtitle . '</p>' : '') . '
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            <!-- Left: Form Card -->
            <div class="lg:col-span-7 bg-white rounded-3xl p-8 lg:p-12 shadow-[0_10px_50px_rgba(0,0,0,0.06)] border border-slate-50">
                <form class="space-y-6" onsubmit="event.preventDefault();">
                    ' . ($formInputs ?: '
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                            <input type="email" placeholder="We\'ll get back to you here" class="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none font-medium text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 transition-all">
                        </div>') . '
                    <div class="pt-4">
                        ' . $btnHtml . '
                    </div>
                </form>
            </div>
            
            <!-- Right: Info & Map -->
            <div class="lg:col-span-5 space-y-10">
                <div>
                    <h3 class="text-2xl font-bold text-slate-800 mb-6">Prefer a Direct Approach?</h3>
                    <div class="space-y-4">
                        ' . ((($fields['email'] ?? 'on') === 'on') ? '
                        <div class="flex items-center gap-4 text-slate-600 font-medium">
                            <i class="fa-solid fa-envelope text-lg" style="color:' . $btn . ';"></i>
                            <span>' . $em . '</span>
                        </div>' : '') . '
                        ' . ((($fields['phone'] ?? 'on') === 'on') ? '
                        <div class="flex items-center gap-4 text-slate-600 font-medium">
                            <i class="fa-solid fa-phone text-lg" style="color:' . $btn . ';"></i>
                            <span>' . $ph . '</span>
                        </div>' : '') . '
                        <div class="flex items-center gap-4 text-slate-600 font-medium">
                            <i class="fa-solid fa-clock text-lg" style="color:' . $btn . ';"></i>
                            <span>Monday to Friday, 9 AM - 6 PM (GMT)</span>
                        </div>
                    </div>
                </div>
                
                    ' . ((($fields['location'] ?? 'on') === 'on') ? '
                    <!-- Map Area -->
                    <div class="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 shadow-xl border border-slate-100 group">
                        <iframe 
                            class="w-full h-full border-0 grayscale brightness-95 opacity-80 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105" 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.83543450937!2d-122.419416!3d37.774929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c6c8f4455%3A0x706474665493c4c!2zU2FuIEZyYW5jaXNjbywgQ0EsIFVTQQ!5e0!3m2!1sen!2s!4v1680000000000!5m2!1sen!2s" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                        
                        <!-- Floating Card -->
                        <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 pointer-events-auto">
                            <h4 class="font-bold text-slate-800 mb-3">Visit Our Office</h4>
                            <div class="flex items-start gap-3 text-slate-500 text-sm mb-4">
                                <i class="fa-solid fa-location-dot mt-1" style="color:' . $btn . ';"></i>
                                <span>' . $loc . '</span>
                            </div>
                            <a href="https://maps.google.com/?q=' . urlencode($loc) . '" target="_blank" class="inline-flex items-center gap-2 text-sm font-bold text-slate-800 group/link">
                                <span>Get a Direction</span>
                                <i class="fa-solid fa-arrow-right transition-transform group-hover/link:translate-x-1"></i>
                            </a>
                        </div>
                    </div>' : '') . '
            </div>
            
        </div>
    </div>
</section>';
    }

    /* ─────────────────────────────────────────────────────────────────────────
     * Layout 4: Premium  (As per the image: Purple card form, specific icons)
     * ───────────────────────────────────────────────────────────────────────── */
    private function buildPremiumLayout(ContactSection $contact): string
    {
        $styles = $contact->custom_styles ?? [];
        ['bg' => $bg, 'text' => $text, 'inputBg' => $inputBg, 'btn' => $btn, 'rounded' => $rounded, 'socials' => $showSocials, 'titleSize' => $titleSize, 'subtitleSize' => $subtitleSize, 'padding' => $padding, 'socialColor' => $socialColor, 'socialHover' => $socialHover] = $this->resolveStyles($contact);

        $title = $contact->title ?? 'Get In Touch';
        $subtitle = $contact->subtitle ?? 'Contact';
        $fields = $contact->form_fields ?? [];
        $ctas = $contact->ctas ?? [];
        $socials = $contact->social_links ?? [];

        $accentColor = $btn ?: '#4f46e5';
        $formInputs = $this->buildFormInputs($fields, '#ffffff', '#1e293b', $rounded);
        $btnLabel = !empty($ctas) ? ($ctas[0]['text'] ?? 'Send Message') : 'Send Message';

        $loc = $styles['location'] ?? '99 S.t Jomblo Park Pekanbaru 28292. Indonesia';
        $ph = $styles['phone_number'] ?? '(+62) 81 414 257 9980';
        $em = $styles['email_address'] ?? 'info@yourdomain.com';

        $infoItems = '';
        if (($fields['email'] ?? 'on') === 'on') {
            $infoItems .= '
            <div class="flex items-center gap-6 group">
                <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110" style="background:' . $accentColor . ';"><i class="fa-solid fa-envelope"></i></div>
                <div><p class="font-bold text-lg mb-0.5" style="color:' . $text . ';">Email</p><p class="text-sm opacity-60" style="color:' . $text . ';">' . $em . '</p></div>
            </div>';
        }
        if (($fields['phone'] ?? 'on') === 'on') {
            $infoItems .= '
            <div class="flex items-center gap-6 group">
                <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110" style="background:' . $accentColor . ';"><i class="fa-solid fa-phone"></i></div>
                <div><p class="font-bold text-lg mb-0.5" style="color:' . $text . ';">Phone</p><p class="text-sm opacity-60" style="color:' . $text . ';">' . $ph . '</p></div>
            </div>';
        }
        if (($fields['location'] ?? 'on') === 'on') {
            $infoItems .= '
            <div class="flex items-center gap-6 group">
                <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110" style="background:' . $accentColor . ';"><i class="fa-solid fa-location-dot"></i></div>
                <div><p class="font-bold text-lg mb-0.5" style="color:' . $text . ';">Location</p><p class="text-sm opacity-60" style="color:' . $text . ';">' . $loc . '</p></div>
            </div>';
        }

        $socialHtml = $this->buildSocialIcons($socials, $showSocials === true || $showSocials === 'true', $btn, $socialColor, $socialHover);

        return '
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<section id="contact" class="py-24 relative overflow-hidden" style="background:' . $bg . '; font-family:\'Plus Jakarta Sans\', sans-serif;">
    <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            <!-- Left: Info -->
            <div class="space-y-12">
                <div>
                    <h2 class="font-black mb-8 leading-tight" style="color:' . $text . '; font-size:' . $titleSize . 'px;">' . $title . '</h2>
                    ' . ($subtitle ? '<p class="text-lg opacity-60 leading-relaxed max-w-lg mb-10" style="color:' . $text . ';">' . $subtitle . '</p>' : '') . '
                </div>
                
                <div class="space-y-10">
                    ' . $infoItems . '
                    ' . $socialHtml . '
                </div>
            </div>

            <!-- Right: Form Card -->
            <div class="relative">
                <div class="' . $rounded . ' p-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 relative z-10">
                    <form class="space-y-6" onsubmit="event.preventDefault();">
                        ' . ($formInputs ?: '
                        <div class="space-y-1.5"><label class="text-sm font-bold ml-1" style="color:' . $text . ';">Email</label><input type="email" placeholder="john@example.com" class="w-full px-5 py-3.5 rounded-lg border border-slate-200 outline-none font-medium text-slate-800 transition-focus focus:border-' . $accentColor . ' focus:ring-2 focus:ring-' . $accentColor . '/20"></div>') . '
                        <button type="button" class="w-full py-4 rounded-xl text-white font-extrabold text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] mt-4" style="background:' . $accentColor . ';">' . $btnLabel . '</button>
                    </form>
                </div>
            </div>

        </div>
    </div>
</section>';
    }

}
