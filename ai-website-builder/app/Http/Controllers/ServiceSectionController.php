<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use App\Models\ServiceSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ServiceSectionController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::findOrFail($heroId);
        return view('services.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $validated = $request->validate([
            'title'                     => 'nullable|string|max:255',
            'subtitle'                  => 'nullable|string|max:255',
            'layout_style'              => 'nullable|in:grid-3,grid-4,cards,list',
            'services'                  => 'nullable|array',
            'services.*.title'          => 'nullable|string',
            'services.*.description'    => 'nullable|string',
            'services.*.icon'           => 'nullable|string',
            'bg_color'                  => 'nullable|string',
            'card_bg_color'             => 'nullable|string',
            'service_text_color'        => 'nullable|string',
            'accent_color'              => 'nullable|string',
            'icon_color'                => 'nullable|string',
        ]);

        // Build raw services — filter out empty items
        $rawServices = $validated['services'] ?? [];
        $cleanServices = collect($rawServices)
            ->filter(fn($s) => !empty($s['title']) || !empty($s['description']))
            ->values()
            ->toArray();

        // Fallback if user submitted with no services at all
        if (empty($cleanServices)) {
            $cleanServices = [['title' => 'My Service', 'description' => 'Describe your service here.', 'icon' => 'fa-solid fa-star']];
        }

        $colors = [
            'bg_color'            => $validated['bg_color']            ?? '#ffffff',
            'card_bg_color'       => $validated['card_bg_color']       ?? '#f9fafb',
            'title_color'         => $validated['service_text_color']  ?? '#111827',
            'subtitle_color'      => $validated['service_text_color']  ?? '#4b5563',
            'service_title_color' => $validated['service_text_color']  ?? '#111827',
            'service_text_color'  => $validated['service_text_color']  ?? '#4b5563',
            'accent_color'        => $validated['accent_color']        ?? '#6366f1',
            'icon_color'          => $validated['icon_color']          ?? '#6366f1',
            'box_shadow'          => 'none',
        ];

        $serviceSection = ServiceSection::updateOrCreate(
            ['hero_id' => $heroId],
            [
                'title'          => $validated['title']        ?? 'My Services',
                'subtitle'       => $validated['subtitle']     ?? '',
                'layout_style'   => $validated['layout_style'] ?? 'cards',
                'services_data'  => $cleanServices,
                'custom_styles'  => $colors,
                'generated_code' => null,
            ]
        );

        return redirect()->route('services.generate', $serviceSection->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $section = ServiceSection::findOrFail($id);
        $needsGeneration = empty($section->generated_code);
        return view('services.preview', compact('section', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $section = ServiceSection::findOrFail($id);
        if (!empty($section->generated_code)) {
            return response()->json(['success' => true, 'code' => $section->generated_code]);
        }
        $code = $this->generateAiCode($section);
        $section->update(['generated_code' => $code]);
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $code]);
    }

    public function updateDesign(Request $request, $id)
    {
        $section = ServiceSection::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string',
            'subtitle' => 'nullable|string',
            'services' => 'required|array',
            'styles' => 'required|array'
        ]);

        try {
            $currentStyles = $section->custom_styles ?? [];
            $newStyles = array_merge($currentStyles, $validated['styles']);

            $section->update([
                'title' => $validated['title'] ?? '',
                'subtitle' => $validated['subtitle'] ?? '',
                'services_data' => $validated['services'],
                'custom_styles' => $newStyles
            ]);

            // If HTML code is provided, save it directly (bypass AI)
            if ($request->has('html_code')) {
                $code = $request->input('html_code');
                $section->update(['generated_code' => $code]);
            } else {
                // Fallback to AI regeneration if no HTML provided (shouldn't happen with new JS)
                $code = $this->generateAiCode($section);
                $section->update(['generated_code' => $code]);
            }

            return response()->json([
                'success' => true,
                'generated_code' => $code
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating design: ' . $e->getMessage()
            ], 500);
        }
    }

    public function regenerate($id)
    {
        $section = ServiceSection::findOrFail($id);
        $code = $this->generateAiCode($section);
        $section->update(['generated_code' => $code]);
        $this->deductCredits();
        return redirect()->route('services.generate', $id);
    }

    private function generateAiCode($section): string
    {
        $layout = $section->layout_style;

        if ($layout === 'list') {
            return $this->buildListTemplate($section);
        }

        // Default: cards layout
        return $this->buildCardsTemplate($section);
    }

    private function buildCardsTemplate($section): string
    {
        $styles = $section->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $cardBg = $styles['card_bg_color'] ?? '#ffffff';
        $titleColor = $styles['title_color'] ?? '#111827';
        $subtitleColor = $styles['subtitle_color'] ?? '#4b5563';
        $svcTitleColor = $styles['service_title_color'] ?? '#4f46e5';
        $svcTextColor = $styles['service_text_color'] ?? '#4b5563';
        $svcIconColor = $styles['service_icon_color'] ?? '#ffffff';
        $svcIconBg = $styles['service_icon_bg'] ?? '#6366f1';
        $titleAccent = $styles['title_accent_color'] ?? $svcIconBg;
        $iconSize = ($styles['icon_size'] ?? 18) . 'px';
        $borderRadius = ($styles['border_radius'] ?? 16) . 'px';
        $sectionTitle = $section->title ? htmlspecialchars($section->title) : '';
        $sectionSubtitle = $section->subtitle ? htmlspecialchars($section->subtitle) : '';

        $headerHtml = '';
        if ($sectionTitle || $sectionSubtitle) {
            $titleHtml = $sectionTitle ? "<h2 class=\"section-title text-4xl md:text-5xl font-black mb-4\" style=\"color:{$titleColor};\">{$sectionTitle}</h2>" : '';
            $accentHtml = $sectionTitle ? "<div class=\"mx-auto h-1.5 w-16 rounded-full mb-4\" style=\"background:{$titleAccent};\"></div>" : '';
            $subtitleHtml = $sectionSubtitle ? "<p class=\"section-subtitle text-lg opacity-80\" style=\"color:{$subtitleColor};\">{$sectionSubtitle}</p>" : '';

            $headerHtml = <<<HTML
            <div class="text-center mb-16">
                {$titleHtml}
                {$accentHtml}
                {$subtitleHtml}
            </div>
HTML;
        }

        $palettes = [
            ['bg' => '#4f46e5', 'icon' => '#ffffff'],
            ['bg' => '#7c3aed', 'icon' => '#ffffff'],
            ['bg' => '#2563eb', 'icon' => '#ffffff'],
            ['bg' => '#0891b2', 'icon' => '#ffffff'],
            ['bg' => '#059669', 'icon' => '#ffffff'],
            ['bg' => '#db2777', 'icon' => '#ffffff'],
        ];

        $cardsHtml = '';
        foreach ($section->services_data as $index => $service) {
            $title = htmlspecialchars($service['title'] ?? 'Service');
            $desc = htmlspecialchars($service['description'] ?? '');
            $icon = $service['icon'] ?? '';
            $pal = $palettes[$index % count($palettes)];
            $hasIcon = ($icon && $icon !== 'none');
            $iconShowClass = $hasIcon ? '' : 'hidden';

            $iconHtml = '';
            if ($hasIcon) {
                $iconHtml = <<<HTML
                <div class="service-icon-container mb-6 rounded-lg flex items-center justify-center w-12 h-12 shadow-md transition-transform duration-300 group-hover:scale-110" 
                     style="background-color:{$svcIconBg};">
                    <i class="{$icon}" style="color:{$svcIconColor}; font-size:{$iconSize};"></i>
                </div>
HTML;
            }

            $cardsHtml .= <<<HTML
            <div class="service-card w-full min-w-0 flex flex-col items-start text-left p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group border border-slate-100 overflow-hidden" data-service-index="{$index}"
                 style="background-color:{$cardBg}; border-radius:{$borderRadius}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                {$iconHtml}
                <h3 class="service-title text-xl font-bold mb-3 tracking-tight w-full" style="color:{$svcTitleColor}; word-break: break-all;">{$title}</h3>
                <p class="service-description leading-relaxed text-sm opacity-80 mb-6 overflow-hidden w-full" 
                   style="color:{$svcTextColor}; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; line-height: 1.5; max-height: 4.5em; word-break: break-all; transition: all 0.3s ease;">{$desc}</p>
                <div class="mt-auto read-more-wrapper" style="display: none; width: 100%;">
                    <div class="read-more-btn text-sm font-bold flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer" 
                         onclick="toggleReadMore(this)" style="color:{$svcTitleColor};">
                        <span class="btn-text">Read More</span> <i class="fa-solid fa-chevron-right text-[10px] transition-transform"></i>
                    </div>
                </div>
            </div>
HTML;
        }

        return <<<HTML
<section id="services" class="py-24 px-8 relative" style="background-color:{$bgColor}; font-family:'Plus Jakarta Sans',sans-serif;">
    <div class="max-w-6xl mx-auto relative z-10">
        {$headerHtml}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {$cardsHtml}
        </div>
    </div>
    <script>
        function checkReadMore() {
            document.querySelectorAll('.service-card').forEach(card => {
                const desc = card.querySelector('.service-description');
                const wrapper = card.querySelector('.read-more-wrapper');
                if (desc && wrapper) {
                    const isOverflowing = desc.scrollHeight > (desc.clientHeight + 2);
                    wrapper.style.display = isOverflowing ? 'block' : 'none';
                }
            });
        }

        function toggleReadMore(btn) {
            const card = btn.closest('.service-card');
            const desc = card.querySelector('.service-description');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('.btn-text');
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
                if(icon) icon.style.transform = 'rotate(90deg)';
            }
        }

        window.addEventListener('load', checkReadMore);
        window.addEventListener('resize', checkReadMore);
        setTimeout(checkReadMore, 100);
        setTimeout(checkReadMore, 500);
        setTimeout(checkReadMore, 1000);
    </script>
</section>
HTML;
    }

    private function buildListTemplate($section): string
    {
        $styles = $section->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $cardBg = $styles['card_bg_color'] ?? '#f9fafb';
        $titleColor = $styles['title_color'] ?? '#111827';
        $subtitleColor = $styles['subtitle_color'] ?? '#4b5563';
        $svcTitleColor = $styles['service_title_color'] ?? '#111827';
        $svcTextColor = $styles['service_text_color'] ?? '#4b5563';
        $svcIconColor = $styles['service_icon_color'] ?? '#ffffff';
        $svcIconBg = $styles['service_icon_bg'] ?? '#6366f1';
        $titleAccent = $styles['title_accent_color'] ?? $svcIconBg;
        $iconSize = ($styles['icon_size'] ?? 18) . 'px';
        $borderRadius = ($styles['border_radius'] ?? 16) . 'px';
        $sectionTitle = $section->title ? htmlspecialchars($section->title) : '';
        $sectionSubtitle = $section->subtitle ? htmlspecialchars($section->subtitle) : '';

        $headerHtml = '';
        if ($sectionTitle || $sectionSubtitle) {
            $titleHtml = $sectionTitle ? "<h2 class=\"section-title text-4xl md:text-5xl font-black mb-4\" style=\"color:{$titleColor};\">{$sectionTitle}</h2>" : '';
            $accentHtml = $sectionTitle ? "<div class=\"mx-auto h-1.5 w-16 rounded-full mb-4\" style=\"background:{$titleAccent};\"></div>" : '';
            $subtitleHtml = $sectionSubtitle ? "<p class=\"section-subtitle text-lg opacity-80\" style=\"color:{$subtitleColor};\">{$sectionSubtitle}</p>" : '';

            $headerHtml = <<<HTML
            <div class="text-center mb-16">
                {$titleHtml}
                {$accentHtml}
                {$subtitleHtml}
            </div>
HTML;
        }

        $palettes = [
            ['bg' => '#eff6ff', 'icon' => '#3b82f6'],
            ['bg' => '#f5f3ff', 'icon' => '#8b5cf6'],
            ['bg' => '#fdf2f8', 'icon' => '#ec4899'],
            ['bg' => '#ecfdf5', 'icon' => '#10b981'],
            ['bg' => '#fff7ed', 'icon' => '#f97316'],
            ['bg' => '#fef2f2', 'icon' => '#ef4444'],
        ];

        $itemsHtml = '';
        foreach ($section->services_data as $index => $service) {
            $title = htmlspecialchars($service['title'] ?? 'Service');
            $desc = htmlspecialchars($service['description'] ?? '');
            $icon = $service['icon'] ?? '';
            $pal = $palettes[$index % count($palettes)];

            $hasIcon = ($icon && $icon !== 'none' && trim($icon) !== '');
            $iconHtml = '';
            $gapClass = 'gap-0';

            if ($hasIcon) {
                $iconHtml = <<<HTML
                <div class="service-icon-container flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style="background:{$svcIconBg};">
                    <i class="{$icon}" style="color:{$svcIconColor}; font-size:{$iconSize};"></i>
                </div>
HTML;
                $gapClass = 'gap-6';
            }

            $itemsHtml .= <<<HTML
            <div class="service-card flex {$gapClass} items-start p-6 transition-all duration-300 hover:shadow-md group" data-service-index="{$index}"
                 style="background-color:{$cardBg}; border-radius:{$borderRadius}; border:1px solid rgba(0,0,0,0.04); box-shadow:0 2px 4px -1px rgba(0,0,0,0.04);">
                {$iconHtml}
                <div class="flex-1 overflow-hidden min-w-0">
                    <h3 class="service-title text-lg font-bold mb-1" style="color:{$svcTitleColor}; word-break: break-all;">{$title}</h3>
                    <p class="service-description text-sm leading-relaxed overflow-hidden" 
                       style="color:{$svcTextColor}; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; line-height: 1.5; max-height: 4.5em; word-break: break-all; transition: all 0.3s ease;">{$desc}</p>
                    <div class="mt-2 read-more-wrapper" style="display: none;">
                        <div class="read-more-btn text-sm font-bold flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer" 
                             onclick="toggleReadMore(this)" style="color:{$svcTitleColor};">
                            <span class="btn-text">Read More</span> <i class="fa-solid fa-chevron-right text-[10px] transition-transform"></i>
                        </div>
                    </div>
                </div>
            </div>
HTML;
        }

        return <<<HTML
<section id="services" class="py-24 px-8 relative" style="background-color:{$bgColor}; font-family:'Plus Jakarta Sans',sans-serif;">
    <div class="max-w-3xl mx-auto">
        {$headerHtml}
        <div class="space-y-4">
            {$itemsHtml}
        </div>
    </div>
    <script>
        function checkReadMore() {
            document.querySelectorAll('.service-card').forEach(card => {
                const desc = card.querySelector('.service-description');
                const wrapper = card.querySelector('.read-more-wrapper');
                if (desc && wrapper) {
                    const isOverflowing = desc.scrollHeight > (desc.clientHeight + 2);
                    wrapper.style.display = isOverflowing ? 'block' : 'none';
                }
            });
        }

        function toggleReadMore(btn) {
            const card = btn.closest('.service-card');
            const desc = card.querySelector('.service-description');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('.btn-text');
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
                if(icon) icon.style.transform = 'rotate(90deg)';
            }
        }

        window.addEventListener('load', checkReadMore);
        window.addEventListener('resize', checkReadMore);
        setTimeout(checkReadMore, 100);
        setTimeout(checkReadMore, 500);
    </script>
</section>
HTML;
    }
}
