<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use App\Models\SkillSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SkillSectionController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::with('skillSection')->findOrFail($heroId);
        return view('skills.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $validated = $request->validate([
            'layout_style' => 'required|string',
            'section_title' => 'nullable|string',
            'section_subtitle' => 'nullable|string',
            'skills' => 'required|array|min:1',
            'skills.*.name' => 'required|string',
            'skills.*.level' => 'nullable|integer|min:0|max:100',
            'skills.*.icon' => 'nullable|string',
            'skills.*.description' => 'nullable|string',
            'bg_color' => 'nullable|string',
            'card_bg_color' => 'nullable|string',
            'skill_text_color' => 'nullable|string',
            'skill_desc_color' => 'nullable|string',
            'progress_bg_color' => 'nullable|string',
            'icon_color' => 'nullable|string',
            'icon_bg_color' => 'nullable|string',
            'icon_size' => 'nullable|integer',
            'circle_size' => 'nullable|integer',
            'border_radius' => 'nullable|integer',
            'desc_size' => 'nullable|integer',
        ]);

        $styles = [
            'bg_color' => $request->bg_color ?? '#f8fafc',
            'card_bg_color' => $request->card_bg_color ?? '#ffffff',
            'skill_text_color' => $request->skill_text_color ?? '#0f172a',
            'skill_desc_color' => $request->skill_desc_color ?? '#64748b',
            'progress_bg_color' => $request->progress_bg_color ?? '#6366f1',
            'icon_color' => $request->icon_color ?? '#6366f1',
            'icon_bg_color' => $request->icon_bg_color ?? '#eff6ff',
            'icon_size' => $request->icon_size ?? 22,
            'circle_size' => $request->circle_size ?? 54,
            'border_radius' => $request->border_radius ?? 20,
            'desc_size' => $request->desc_size ?? 14,
        ];

        $skillsWithDefaults = array_map(function ($skill) {
            $skill['level'] = $skill['level'] ?? 100;
            return $skill;
        }, $validated['skills']);

        $skillSection = SkillSection::updateOrCreate(
            ['hero_id' => $heroId],
            [
                'layout_style' => $validated['layout_style'],
                'section_title' => $validated['section_title'],
                'section_subtitle' => $validated['section_subtitle'],
                'skills_data' => $skillsWithDefaults,
                'custom_styles' => $styles,
                'generated_code' => null
            ]
        );

        return redirect()->route('skills.generate', $skillSection->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $skillSection = SkillSection::findOrFail($id);
        $needsGeneration = empty($skillSection->generated_code);
        $content = $skillSection->generated_code ?? '';
        return view('skills.preview', compact('skillSection', 'content', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $skillSection = SkillSection::findOrFail($id);
        if (!empty($skillSection->generated_code)) {
            if ($request->wantsJson()) {
                return response()->json(['success' => true, 'code' => $skillSection->generated_code]);
            }
            return redirect()->route('skills.generate', $id);
        }
        
        $content = $this->generateAiCode($skillSection);
        $skillSection->update(['generated_code' => $content]);
        $this->deductCredits();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'code' => $content]);
        }

        return redirect()->route('skills.generate', $id);
    }

    public function updateDesign(Request $request, $id)
    {
        $skillSection = SkillSection::findOrFail($id);

        $validated = $request->validate([
            'section_title' => 'nullable|string',
            'section_subtitle' => 'nullable|string',
            'skills' => 'required|array',
            'styles' => 'required|array'
        ]);

        try {
            $currentStyles = $skillSection->custom_styles ?? [];
            $newStyles = array_merge($currentStyles, $validated['styles']);

            $skillSection->update([
                'section_title' => $validated['section_title'] ?? '',
                'section_subtitle' => $validated['section_subtitle'] ?? '',
                'skills_data' => $validated['skills'],
                'custom_styles' => $newStyles
            ]);

            // Use generateAiCode which acts as the deterministic builder for Skills (it does NOT call an external API)
            $code = $this->generateAiCode($skillSection);
            $skillSection->update(['generated_code' => $code]);

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

    private function generateAiCode($skillSection)
    {
        $layout = $skillSection->layout_style;

        if ($layout === 'grid-layout') {
            return $this->buildGridTemplate($skillSection) . $this->getLightboxHtml();
        }

        if ($layout === 'progress-bar-layout') {
            return $this->buildProgressBarTemplate($skillSection) . $this->getLightboxHtml();
        }

        if ($layout === 'icon-text-layout') {
            return $this->buildIconTextTemplate($skillSection) . $this->getLightboxHtml();
        }

        return $this->buildGridTemplate($skillSection) . $this->getLightboxHtml();
    }

    private function buildProgressBarTemplate($skillSection): string
    {
        $styles = $skillSection->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#f8fafc';
        $textColor = $styles['skill_text_color'] ?? '#0f172a';
        $progColor = $styles['progress_bg_color'] ?? '#3b82f6';
        $radius = ($styles['border_radius'] ?? 10) . 'px';
        $title = !empty($skillSection->section_title) ? htmlspecialchars($skillSection->section_title) : '';
        $subtitle = !empty($skillSection->section_subtitle) ? htmlspecialchars($skillSection->section_subtitle) : '';
        $descColor = $styles['skill_desc_color'] ?? '#64748b';
        $titleAccent = $styles['title_accent_color'] ?? $progColor;

        $headerHtml = "";
        if (!empty($title) || !empty($subtitle)) {
            $titleHtml = !empty($title) ? "<h2 class=\"section-title text-4xl font-extrabold tracking-tight mb-4\" style=\"color:{$textColor};\">{$title}</h2>" : "";
            $accentHtml = !empty($title) ? "<div class=\"mx-auto h-1.5 w-20 rounded-full mb-4\" style=\"background:{$titleAccent};\"></div>" : "";
            $subtitleHtml = !empty($subtitle) ? "<p class=\"text-lg opacity-80\" style=\"color:{$descColor};\">{$subtitle}</p>" : "";
            $headerHtml = <<<HTML
            <div class="text-center mb-16">
                {$titleHtml}
                {$accentHtml}
                {$subtitleHtml}
            </div>
HTML;
        }

        $rowsHtml = '';
        foreach ($skillSection->skills_data as $index => $skill) {
            $name = htmlspecialchars($skill['name'] ?? 'Skill');
            $level = (int) ($skill['level'] ?? 70);

            $rowsHtml .= <<<HTML
            <div class="skill-row mb-8 cursor-zoom-in group/row" onclick="openSkillsLightbox('{$name}', false, true)">
                <div class="flex items-center justify-between mb-2 px-1">
                    <span class="skill-name text-lg font-bold tracking-tight transition-colors group-hover/row:text-indigo-500" style="color:{$textColor};">{$name}</span>
                </div>
                <div class="w-full bg-slate-200/80 rounded-full h-7 overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" style="border-radius:{$radius};">
                    <div class="skill-level-bar h-full transition-all duration-1000 ease-out group-hover/row:brightness-110" 
                         style="width:{$level}%; background-color:{$progColor}; border-radius:{$radius}; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.15);">
                    </div>
                </div>
            </div>
HTML;
        }

        return <<<HTML
<section class="py-24 px-8" style="background-color:{$bgColor}; font-family:'Plus Jakarta Sans',sans-serif;">
    <div class="max-w-3xl mx-auto">
        {$headerHtml}
        <div class="space-y-2">
            {$rowsHtml}
        </div>
    </div>
</section>
HTML;
    }

    private function buildGridTemplate($skillSection): string
    {
        $styles = $skillSection->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#f8fafc';
        $cardBg = $styles['card_bg_color'] ?? '#ffffff';
        $textColor = $styles['skill_text_color'] ?? '#0f172a';
        $accent = $styles['progress_bg_color'] ?? '#6366f1';
        $radius = ($styles['border_radius'] ?? 20) . 'px';
        $iconColorSetting = $styles['icon_color'] ?? '#6366f1';
        $iconBgSetting = $styles['icon_bg_color'] ?? '#eff6ff';
        $descColor = $styles['skill_desc_color'] ?? '#64748b';
        $iconSize = ($styles['icon_size'] ?? 22) . 'px';
        $circleSize = ($styles['circle_size'] ?? 54) . 'px';
        $descSize = ($styles['desc_size'] ?? 14) . 'px';
        $title = !empty($skillSection->section_title) ? htmlspecialchars($skillSection->section_title) : '';
        $subtitle = !empty($skillSection->section_subtitle) ? htmlspecialchars($skillSection->section_subtitle) : '';
        $titleAccent = $styles['title_accent_color'] ?? $accent;

        $headerHtml = "";
        if (!empty($title) || !empty($subtitle)) {
            $accentHtml = !empty($title) ? "<div class=\"mx-auto h-1.5 w-16 rounded-full mb-4\" style=\"background:{$titleAccent};\"></div>" : "";
            $subtitleHtml = !empty($subtitle) ? "<p class=\"text-lg opacity-80\" style=\"color:{$descColor};\">{$subtitle}</p>" : "";
            $headerHtml = <<<HTML
            <div class="text-center mb-16">
                <h2 class="section-title text-4xl md:text-5xl font-black mb-4" style="color:{$textColor};">{$title}</h2>
                {$accentHtml}
                {$subtitleHtml}
            </div>
HTML;
        }

        $cardsHtml = '';
        foreach ($skillSection->skills_data as $index => $skill) {
            $name = htmlspecialchars($skill['name'] ?? 'Skill Name');
            $icon = $skill['icon'] ?? '';

            $finalIconColor = $iconColorSetting;
            $finalIconBg = $iconBgSetting;

            $descHtml = !empty($skill['description']) ? "<p class=\"skill-desc leading-relaxed\" style=\"color:{$descColor}; font-size:{$descSize}; opacity:0.9;\">" . htmlspecialchars($skill['description']) . "</p>" : "";

            $iconHtml = !empty($icon) ? <<<HTML
                <div class="skill-icon-container mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" 
                     style="background:{$finalIconBg}; width:{$circleSize}; height:{$circleSize};">
                    <i class="{$icon}" style="color:{$finalIconColor}; font-size:{$iconSize};"></i>
                </div>
HTML : '';

            $cardsHtml .= <<<HTML
            <div class="skill-card flex flex-col items-center text-center p-8 bg-white border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group cursor-zoom-in" 
                  style="background-color:{$cardBg}; border-radius:{$radius}; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);"
                  onclick="openSkillsLightbox('{$icon}', false, true)">
                {$iconHtml}
                <h3 class="skill-name text-xl font-bold mb-3 tracking-tight" style="color:{$textColor};">{$name}</h3>
                {$descHtml}
            </div>
HTML;
        }

        return <<<HTML
<section class="py-24 px-8 relative" style="background-color:{$bgColor}; font-family:'Plus Jakarta Sans',sans-serif;">
    <div class="max-w-6xl mx-auto relative z-10">
        {$headerHtml}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {$cardsHtml}
        </div>
    </div>
</section>
HTML;
    }

    private function buildIconTextTemplate($skillSection): string
    {
        $styles = $skillSection->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#f8fafc';
        $cardBg = $styles['card_bg_color'] ?? '#ffffff';
        $textColor = $styles['skill_text_color'] ?? '#0f172a';
        $radius = ($styles['border_radius'] ?? 20) . 'px';
        $iconColorSetting = $styles['icon_color'] ?? '#6366f1';
        $iconBgSetting = $styles['icon_bg_color'] ?? '#eff6ff';
        $descColor = $styles['skill_desc_color'] ?? '#64748b';
        $iconSize = ($styles['icon_size'] ?? 22) . 'px';
        $circleSize = ($styles['circle_size'] ?? 54) . 'px';
        $descSize = ($styles['desc_size'] ?? 14) . 'px';
        $accent = $styles['progress_bg_color'] ?? '#6366f1';
        $title = !empty($skillSection->section_title) ? htmlspecialchars($skillSection->section_title) : '';
        $subtitle = !empty($skillSection->section_subtitle) ? htmlspecialchars($skillSection->section_subtitle) : '';
        $titleAccent = $styles['title_accent_color'] ?? $accent;

        $headerHtml = "";
        if (!empty($title) || !empty($subtitle)) {
            $accentHtml = !empty($title) ? "<div class=\"mx-auto h-1.5 w-16 rounded-full mb-4\" style=\"background:{$titleAccent};\"></div>" : "";
            $subtitleHtml = !empty($subtitle) ? "<p class=\"text-lg opacity-80\" style=\"color:{$descColor};\">{$subtitle}</p>" : "";
            $headerHtml = <<<HTML
            <div class="text-center mb-16">
                <h2 class="section-title text-4xl md:text-5xl font-black mb-4" style="color:{$textColor};">{$title}</h2>
                {$accentHtml}
                {$subtitleHtml}
            </div>
HTML;
        }

        $itemsHtml = '';
        $skills = $skillSection->skills_data;
        $total = count($skills);

        foreach ($skills as $index => $skill) {
            $name = htmlspecialchars($skill['name'] ?? 'Skill Name');
            $icon = $skill['icon'] ?? 'fa-solid fa-star';

            $finalIconColor = $iconColorSetting;
            $finalIconBg = $iconBgSetting;

            $connectorLine = ($index < $total - 1) ? '<div class="absolute top-12 bottom-0 w-0.5 bg-white/20"></div>' : '';

            $descHtml = !empty($skill['description']) ? "<p class=\"skill-desc leading-relaxed\" style=\"color:{$descColor}; font-size:{$descSize}; opacity:0.8;\">" . htmlspecialchars($skill['description']) . "</p>" : "";

            $itemsHtml .= <<<HTML
            <div class="skill-timeline-item flex gap-6 relative group/item cursor-zoom-in" onclick="openSkillsLightbox('{$icon}', false, true)">
                <div class="flex flex-col items-center flex-shrink-0 relative">
                    {$connectorLine}
                    <div class="skill-icon-circle rounded-full flex items-center justify-center z-10 shadow-lg transition-transform duration-500 group-hover/item:scale-110" 
                         style="background-color:{$finalIconBg}; color:{$finalIconColor}; width:{$circleSize}; height:{$circleSize};">
                        <i class="{$icon}" style="font-size:{$iconSize};"></i>
                    </div>
                </div>

                <div class="flex-1 pb-10">
                    <div class="skill-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1" 
                         style="background-color:{$cardBg}; border-radius:{$radius};">
                        <h3 class="skill-name text-xl font-bold mb-2" style="color:{$textColor};">{$name}</h3>
                        {$descHtml}
                    </div>
                </div>
            </div>
HTML;
        }

        return <<<HTML
<section class="py-24 px-8 relative overflow-hidden" style="background-color:{$bgColor}; font-family:'Plus Jakarta Sans',sans-serif;">
    <div class="max-w-3xl mx-auto">
        {$headerHtml}
        <div class="space-y-0">
            {$itemsHtml}
        </div>
    </div>
</section>
HTML;
    }

    private function getLightboxHtml(): string
    {
        return "
    <!-- Noir Lightbox Edition (Skills) - Source of Truth -->
    <div id=\"skills-lightbox\" class=\"fixed inset-0 z-[999999] bg-black/95 backdrop-blur-xl hidden justify-center items-center opacity-0 transition-opacity duration-500 ease-in-out cursor-zoom-out\" onclick=\"window.closeSkillsLightbox()\">
        
        <button class=\"absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 z-[1000000] border border-white/10\" onclick=\"window.closeSkillsLightbox()\">
            <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2.5\" d=\"M6 18L18 6M6 6l12 12\"/>
            </svg>
        </button>

        <div id=\"skills-lightbox-wrapper\" class=\"relative flex items-center justify-center transition-all duration-500 ease-out scale-90 opacity-0\" onclick=\"event.stopPropagation()\" style=\"width:auto; height:auto; max-width:85vw; max-height:80vh;\">
            <div id=\"skills-lightbox-media-container\" class=\"rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] bg-black/40\">
                <!-- Content injected here -->
            </div>
        </div>
    </div>

    <script>
        window.openSkillsLightbox = function(src, isVideo, isIcon = false) {
            const lightbox = document.getElementById(\"skills-lightbox\");
            const container = document.getElementById(\"skills-lightbox-media-container\");
            const wrapper = document.getElementById(\"skills-lightbox-wrapper\");
            if (!lightbox || !container || !wrapper) return;

            // CRITICAL FIX: Move to body to escape preview canvas CSS transforms
            if (lightbox.parentNode !== document.body) {
                document.body.appendChild(lightbox);
            }

            container.innerHTML = \"\";
            lightbox.classList.remove(\"hidden\");
            lightbox.classList.add(\"flex\");
            
            setTimeout(() => {
                lightbox.style.opacity = \"1\";
                wrapper.classList.remove(\"scale-90\", \"opacity-0\");
                wrapper.classList.add(\"scale-100\", \"opacity-100\");
                
                if (isIcon) {
                    container.innerHTML = `<div class=\"p-20 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center justify-center\"><i class=\"\${src} text-8xl text-white\"></i></div>`;
                } else {
                    container.innerHTML = isVideo 
                        ? `<video src=\"\${src}\" controls autoplay loop style=\"max-width:80vw; max-height:75vh; display:block; border-radius:2.5rem;\"></video>`
                        : `<img src=\"\${src}\" style=\"max-width:80vw; max-height:75vh; object-fit:contain; display:block; border-radius:2.5rem;\">`;
                }
            }, 50);
            document.body.style.overflow = \"hidden\";
        };

        window.closeSkillsLightbox = function() {
            const lightbox = document.getElementById(\"skills-lightbox\");
            const wrapper = document.getElementById(\"skills-lightbox-wrapper\");
            if (!lightbox || !wrapper) return;
            
            lightbox.style.opacity = \"0\";
            wrapper.classList.add(\"scale-90\", \"opacity-0\");
            wrapper.classList.remove(\"scale-100\", \"opacity-100\");
            
            setTimeout(() => {
                lightbox.classList.add(\"hidden\");
                lightbox.classList.remove(\"flex\");
                document.getElementById(\"skills-lightbox-media-container\").innerHTML = \"\";
                document.body.style.overflow = \"\";
            }, 500);
        };
    </script>
    <style>
        .cursor-zoom-in { cursor: zoom-in; }
    </style>";
    }
}
