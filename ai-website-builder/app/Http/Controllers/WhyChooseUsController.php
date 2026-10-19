<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use App\Models\WhyChooseUs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WhyChooseUsController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::findOrFail($heroId);
        return view('why-choose-us.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'layout_style' => 'required|in:cards,numbered,timeline',
            'reasons' => 'required|array|min:1',
            'reasons.*.title' => 'required|string',
            'reasons.*.description' => 'required|string',
            'reasons.*.icon' => 'nullable|string',
            'bg_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'card_bg_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'title_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'subtitle_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'reason_title_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'reason_text_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'icon_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'icon_bg_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_line_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'box_shadow' => 'nullable|in:none,sm,md,lg,xl,2xl',
        ]);

        $colors = [
            'bg_color' => $validated['bg_color'],
            'card_bg_color' => $validated['card_bg_color'] ?? '#f9fafb',
            'title_color' => $validated['title_color'],
            'subtitle_color' => $validated['subtitle_color'] ?? '#4b5563',
            'reason_title_color' => $validated['reason_title_color'],
            'reason_text_color' => $validated['reason_text_color'],
            'icon_color' => $validated['icon_color'] ?? '#ffffff',
            'icon_bg_color' => $validated['icon_bg_color'] ?? '#6366f1',
            'accent_line_color' => $validated['accent_line_color'] ?? '#6366f1',
            'box_shadow' => $validated['box_shadow'] ?? 'md',
        ];

        $whyChooseUs = WhyChooseUs::updateOrCreate(
            ['hero_id' => $heroId],
            [
                'title' => $validated['title'] ?? '',
                'subtitle' => $validated['subtitle'] ?? null,
                'description' => $validated['description'] ?? null,
                'layout_style' => $validated['layout_style'],
                'reasons_data' => $validated['reasons'],
                'custom_styles' => $colors,
                'generated_code' => null // Clear old code so generate() refreshes it with new data
            ]
        );

        return redirect()->route('why-choose-us.generate', $whyChooseUs->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $whyChooseUs = WhyChooseUs::findOrFail($id);
        $needsGeneration = empty($whyChooseUs->generated_code);
        return view('why-choose-us.preview', compact('whyChooseUs', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $whyChooseUs = WhyChooseUs::findOrFail($id);
        if (!empty($whyChooseUs->generated_code)) {
            return response()->json(['success' => true, 'code' => $whyChooseUs->generated_code]);
        }
        $code = $this->getDefaultCode($whyChooseUs);
        $whyChooseUs->update(['generated_code' => $code]);
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $code]);
    }

    public function updateDesign(Request $request, $id)
    {
        $whyChooseUs = WhyChooseUs::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string',
            'subtitle' => 'nullable|string',
            'description' => 'nullable|string',
            'reasons' => 'required|array',
            'styles' => 'required|array',
            'html_code' => 'required|string'
        ]);

        try {
            $currentStyles = $whyChooseUs->custom_styles ?? [];
            $newStyles = array_merge($currentStyles, $validated['styles']);

            $whyChooseUs->update([
                'title' => $validated['title'] ?? '',
                'subtitle' => $validated['subtitle'] ?? null,
                'description' => $validated['description'] ?? null,
                'reasons_data' => $validated['reasons'],
                'custom_styles' => $newStyles,
                'generated_code' => $validated['html_code']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Design updated successfully',
                'code' => $validated['html_code']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating design: ' . $e->getMessage()
            ], 500);
        }
    }

    public function regenerate(Request $request, $id)
    {
        $whyChooseUs = WhyChooseUs::findOrFail($id);

        try {
            $code = $this->generateAiCode($whyChooseUs);
            $whyChooseUs->update(['generated_code' => $code]);
            $this->deductCredits();

            return response()->json([
                'success' => true,
                'message' => 'Code regenerated successfully',
                'code' => $code
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error regenerating code: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generateAiCode($whyChooseUs)
    {
        $prompt = $this->buildPrompt($whyChooseUs);

        try {
            $response = Http::timeout(30)
                ->withHeader('Authorization', 'Bearer ' . config('services.openai.api_key'))
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4-turbo',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an expert web developer. Generate clean, modern, responsive HTML code using Tailwind CSS.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 2000
                ]);

            if ($response->successful()) {
                return $response->json()['choices'][0]['message']['content'];
            }

            return $this->getDefaultCode($whyChooseUs);
        } catch (\Exception $e) {
            \Log::error('OpenAI Error: ' . $e->getMessage());
            return $this->getDefaultCode($whyChooseUs);
        }
    }

    private function buildPrompt($whyChooseUs)
    {
        $reasonsList = '';
        $reasons = $whyChooseUs->reasons_data ?? [];

        foreach ($reasons as $reason) {
            $title = $reason['title'] ?? 'Untitled';
            $description = $reason['description'] ?? 'No description';
            $reasonsList .= "- {$title}: {$description}\n";
        }

        $styles = $whyChooseUs->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $cardBgColor = $styles['card_bg_color'] ?? '#1e293b';
        $titleColor = $styles['title_color'] ?? '#000000';
        $subtitleColor = $styles['subtitle_color'] ?? '#6b7280';
        $reasonTitleColor = $styles['reason_title_color'] ?? '#1f2937';
        $reasonTextColor = $styles['reason_text_color'] ?? '#6b7280';

        return <<<PROMPT
Generate a beautiful "Why Choose Us" section with the following details:

Title: {$whyChooseUs->title}
Subtitle: {$whyChooseUs->subtitle}
Description: {$whyChooseUs->description}
Layout Style: {$whyChooseUs->layout_style}

Reasons:
{$reasonsList}

Colors:
- Background: {$bgColor}
- Card Background: {$cardBgColor}
- Title Color: {$titleColor}
- Subtitle Color: {$subtitleColor}
- Reason Title Color: {$reasonTitleColor}
- Reason Text Color: {$reasonTextColor}

Requirements:
1. Create responsive HTML using Tailwind CSS and inline CSS for the provided dynamic colors.
2. If Layout Style is "numbered", create elegant cards with a small circular badge (01, 02...) next to the title instead of an icon, and include a large, semi-transparent number (opacity 5%) as a background watermark in the card.
3. If Layout Style is "timeline", create a cinematic alternating timeline with a central vertical line. Use icons inside the central glowing circles. Cards alternate left and right.
4. Use modern design principles with subtle hover effects.
3. MANDATORY: The section subtitle should be clean and not italicized, matching the site's modern aesthetic.
4. MANDATORY: Use Font Awesome icons if provided, otherwise use Unicode symbols.
5. MANDATORY: Wrap the entire section exactly in `<section class="py-24 px-8 relative" style="background-color: {Background Color}">` and the inner content in `<div class="max-w-6xl mx-auto relative z-10">` to match other sections.
6. MANDATORY: Include a decorative accent line below the title: `<div class="mx-auto h-1.5 w-16 rounded-full mb-6" style="background: linear-gradient(to right, #6366f1, #a855f7);"></div>`.
7. MANDATORY: For reason descriptions, use CSS to clamp text to 3 lines: `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; line-height: 1.5; max-height: 4.5em; transition: all 0.3s ease;`.
8. MANDATORY: Add a "Read More" button beneath descriptions that only appears when text overflows (handling this via a small script is acceptable, or provide a consistent structure that matches the site's existing components).
9. Return only valid HTML code, no explanations and no markdown wrapping.

Generate the complete, production-ready HTML code:
PROMPT;
    }

    private function getDefaultCode($whyChooseUs)
    {
        $styles = $whyChooseUs->custom_styles ?? [];
        $reasons = $whyChooseUs->reasons_data ?? [];
        $layoutStyle = $whyChooseUs->layout_style ?? 'cards';

        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $cardBgColor = $styles['card_bg_color'] ?? '#f9fafb';
        $titleColor = $styles['title_color'] ?? '#111827';
        $subtitleColor = $styles['subtitle_color'] ?? '#4b5563';
        $reasonTitleColor = $styles['reason_title_color'] ?? '#111827';
        $reasonTextColor = $styles['reason_text_color'] ?? '#4b5563';
        $iconColor = $styles['icon_color'] ?? '#ffffff';
        $iconBgColor = $styles['icon_bg_color'] ?? '#6366f1';
        $accentLineColor = $styles['accent_line_color'] ?? '#6366f1';
        $boxShadow = $styles['box_shadow'] ?? 'md';
        $shadowClass = $boxShadow === 'none' ? '' : "shadow-{$boxShadow}";
        $borderRadius = ($styles['border_radius'] ?? '16') . 'px';

        $reasonsHtml = '';
        foreach ($reasons as $index => $reason) {
            $title = $reason['title'] ?? 'Benefit ' . ($index + 1);
            $description = $reason['description'] ?? '';
            $icon = $reason['icon'] ?? 'fa-solid fa-star';

            $hasIcon = $icon && $icon !== 'none' && !empty(trim($icon));
            $hasDescription = !empty(trim($description));

            $mbClass = $hasDescription ? 'mb-2' : '';

            $descriptionBlock = $hasDescription ? "
                        <p class=\"why-description text-sm opacity-80 leading-relaxed overflow-hidden\" 
                           style=\"color: {$reasonTextColor}; text-transform: none; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; line-height: 1.5; max-height: 4.5em; word-break: break-word; transition: all 0.3s ease;\">
                            {$description}
                        </p>
                        <div class=\"mt-2 why-read-more-wrapper\" style=\"display: none;\">
                            <button type=\"button\" onclick=\"toggleWhyReadMore(this)\" class=\"text-xs font-bold flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity\" style=\"color: {$reasonTitleColor};\">
                                <span class=\"btn-text\">Read More</span> <i class=\"fa-solid fa-chevron-down text-[8px] transition-transform\"></i>
                            </button>
                        </div>" : "";

            if ($layoutStyle === 'numbered') {
                $count = sprintf("%02d", $index + 1);
                $reasonsHtml .= <<<HTML
                <div class="why-card relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden {$shadowClass}" 
                     style="background-color: {$cardBgColor}; border-radius: {$borderRadius}; border: 1px solid rgba(0,0,0,0.03);">
                    <div class="absolute -bottom-6 -right-2 text-8xl font-black opacity-[0.03] select-none pointer-events-none z-0" 
                         style="color: {$reasonTitleColor};">
                        {$count}
                    </div>
                    <div class="relative z-10">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm mt-1" 
                                 style="background-color: {$iconBgColor}; color: {$iconColor};">
                                {$count}
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="text-xl font-bold {$mbClass}" style="color: {$reasonTitleColor}; word-break: break-all;">{$title}</h3>
                                {$descriptionBlock}
                            </div>
                        </div>
                    </div>
                </div>
HTML;
            } else if ($layoutStyle === 'timeline') {
                $alignment = ($index % 2 === 0) ? 'md:flex-row' : 'md:flex-row-reverse';
                $textAlign = ($index % 2 === 0) ? 'md:text-right' : 'md:text-left';
                $line = ($index < count($reasons) - 1) ? "<div class=\"absolute top-12 bottom-[-64px] left-1/2 -translate-x-1/2 w-0.5 bg-gray-200 hidden md:block\"></div>" : "";

                $timelineIconHtml = $hasIcon ? "<i class=\"{$icon}\" style=\"color: {$iconColor}; font-size: 1.25rem;\"></i>" : "";

                $reasonsHtml .= <<<HTML
                <div class="relative flex flex-col {$alignment} items-center gap-8 mb-16 last:mb-0 group">
                    {$line}
                    <div class="flex-1 w-full relative z-10">
                        <div class="why-card p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl {$textAlign} {$shadowClass}" 
                             style="background-color: {$cardBgColor}; border-radius: {$borderRadius}; border: 1px solid rgba(0,0,0,0.05);">
                            <h3 class="text-2xl font-bold {$mbClass}" style="color: {$reasonTitleColor};">{$title}</h3>
                            {$descriptionBlock}
                        </div>
                    </div>
                    <div class="flex-shrink-0 w-14 h-14 rounded-full z-20 flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-125" 
                         style="background-color: {$iconBgColor}; border: 4px solid {$bgColor}; box-shadow: 0 0 20px {$iconBgColor}40;">
                        {$timelineIconHtml}
                    </div>
                    <div class="flex-1 hidden md:block"></div>
                </div>
HTML;
            } else {
                $iconHtml = $hasIcon ? "
                    <div class=\"w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm\" 
                         style=\"background-color: {$iconBgColor};\">
                        <i class=\"{$icon}\" style=\"color: {$iconColor}; font-size: 1.25rem;\"></i>
                    </div>" : "";

                $reasonsHtml .= <<<HTML
                <div class="why-card flex items-start gap-4 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden {$shadowClass}" 
                     style="background-color: {$cardBgColor}; border-radius: {$borderRadius};">
                    {$iconHtml}
                    <div class="flex-1 min-w-0">
                        <h3 class="text-xl font-bold {$mbClass}" style="color: {$reasonTitleColor}; word-break: break-all;">{$title}</h3>
                        {$descriptionBlock}
                    </div>
                </div>
HTML;
            }
        }

        $title = $whyChooseUs->title ?? 'Why Choose Us';
        $subtitle = $whyChooseUs->subtitle ?? 'Discover our benefits';

        $gridCols = count($reasons) > 1 ? 'md:grid-cols-2' : 'max-w-2xl mx-auto';
        $gridClass = "grid grid-cols-1 {$gridCols} gap-6 text-left items-start";
        if ($layoutStyle === 'timeline')
            $gridClass = 'max-w-6xl mx-auto flex flex-col pt-8 relative';

        return <<<HTML
        <section id="why-choose-us" class="py-24 px-8 relative overflow-hidden" style="background-color: {$bgColor}; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div class="max-w-6xl mx-auto relative z-10">
                <div class="text-center mb-16 max-w-3xl mx-auto">
                    <h1 class="text-4xl md:text-5xl font-black mb-6 leading-tight" style="color: {$titleColor};">
                        {$title}
                    </h1>
                    <div class="mx-auto h-1.5 w-16 rounded-full mb-6" style="background-color: {$accentLineColor};"></div>
                    <p class="text-lg leading-relaxed opacity-90" style="color: {$subtitleColor};">
                        {$subtitle}
                    </p>
                </div>
                <div class="{$gridClass}">
                    {$reasonsHtml}
                </div>
            </div>
            <script>
                (function() {
                    function checkWhyOverflow() {
                        document.querySelectorAll('.why-card').forEach(card => {
                            const desc = card.querySelector('.why-description');
                            const wrapper = card.querySelector('.why-read-more-wrapper');
                            if (desc && wrapper) {
                                const isOverflowing = desc.scrollHeight > (desc.clientHeight + 2);
                                wrapper.style.display = isOverflowing ? 'block' : 'none';
                            }
                        });
                    }

                    if (window.toggleWhyReadMore === undefined) {
                        window.toggleWhyReadMore = function(btn) {
                            const container = btn.closest('.why-card');
                            const desc = container.querySelector('.why-description');
                            const text = btn.querySelector('.btn-text');
                            const icon = btn.querySelector('i');
                            const isExpanded = desc.style.webkitLineClamp === 'none';

                            if (isExpanded) {
                                desc.style.webkitLineClamp = '3';
                                desc.style.maxHeight = '4.5em';
                                text.textContent = 'Read More';
                                if(icon) icon.style.transform = 'rotate(0deg)';
                            } else {
                                desc.style.webkitLineClamp = 'none';
                                desc.style.maxHeight = 'none';
                                text.textContent = 'Read Less';
                                if(icon) icon.style.transform = 'rotate(180deg)';
                            }
                        }
                    }

                    checkWhyOverflow();
                    window.addEventListener('resize', checkWhyOverflow);
                    setTimeout(checkWhyOverflow, 100);
                    setTimeout(checkWhyOverflow, 500);
                })();
            </script>
        </section>
HTML;
    }
}
