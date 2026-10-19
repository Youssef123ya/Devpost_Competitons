<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use App\Models\AboutSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AboutSectionController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::findOrFail($heroId);
        return view('about.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|max:5120',
            'ai_image_url' => 'nullable|string',
            'layout_style' => 'required|in:image_left,image_right',
            'bg_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'title_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
            'text_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
        ]);

        $colors = [
            'bg_color' => $validated['bg_color'],
            'title_color' => $validated['title_color'],
            'accent_color' => $validated['accent_color'] ?? '#6366f1',
            'text_color' => $validated['text_color'],
        ];

        $about = AboutSection::updateOrCreate(
            ['hero_id' => $heroId],
            [
                'title' => $validated['title'] ?? null,
                'subtitle' => null,
                'description' => $validated['description'],
                'layout_style' => $validated['layout_style'],
                'custom_styles' => $colors,
                'generated_code' => null // clear to regenerate
            ]
        );

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('about_images', 'public');
            $about->update(['image' => $path]);
        } elseif ($request->filled('ai_image_url')) {
            $about->update(['image' => $request->ai_image_url]);
        }

        return redirect()->route('about.generate', $about->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $about = AboutSection::findOrFail($id);
        $defaultImagePath = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop';
        $needsGeneration = empty($about->generated_code);
        return view('about.preview', compact('about', 'defaultImagePath', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $about = AboutSection::findOrFail($id);
        if (!empty($about->generated_code)) {
            return response()->json(['success' => true, 'code' => $about->generated_code]);
        }
        $code = $this->getDefaultCode($about);
        $about->update(['generated_code' => $code]);
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $code]);
    }

    public function updateDesign(Request $request, $id)
    {
        $about = AboutSection::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'styles' => 'required|array',
            'html_code' => 'required|string'
        ]);

        try {
            $currentStyles = $about->custom_styles ?? [];
            $newStyles = array_merge($currentStyles, $validated['styles']);

            $about->update([
                'title' => $validated['title'],
                'subtitle' => null,
                'description' => $validated['description'],
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

    public function uploadImage(Request $request, $id)
    {
        $about = AboutSection::findOrFail($id);

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
        ]);

        if ($request->hasFile('image')) {
            if ($about->image) {
                Storage::disk('public')->delete($about->image);
            }

            $path = $request->file('image')->store('about_images', 'public');
            $about->update(['image' => $path]);

            $code = $this->getDefaultCode($about);
            $about->update(['generated_code' => $code]);

            return response()->json([
                'success' => true,
                'image_url' => asset('storage/' . $path),
                'code' => $code
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No image uploaded.'], 400);
    }

    public function regenerate(Request $request, $id)
    {
        $about = AboutSection::findOrFail($id);

        try {
            $code = $this->generateAiCode($about);
            $about->update(['generated_code' => $code]);
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

    private function generateAiCode($about)
    {
        $prompt = $this->buildPrompt($about);

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

            return $this->getDefaultCode($about);
        } catch (\Exception $e) {
            \Log::error('OpenAI Error: ' . $e->getMessage());
            return $this->getDefaultCode($about);
        }
    }

    private function buildPrompt($about)
    {
        $styles = $about->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $titleColor = $styles['title_color'] ?? '#111827';
        $accentColor = $styles['accent_color'] ?? '#6366f1';
        $textColor = $styles['text_color'] ?? '#94a3b8';

        $imagePath = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop';
        if ($about->image) {
            if (strpos($about->image, 'http') === 0 || strpos($about->image, '/images/') === 0 || strpos($about->image, '/storage/') === 0) {
                $imagePath = $about->image;
            } else {
                $imagePath = asset('storage/' . ltrim($about->image, '/'));
            }
        }
        $layout = $about->layout_style; // image_left or image_right

        return <<<PROMPT
Generate a beautiful, responsive "About" section.

Title: {$about->title}
Description: {$about->description}
Layout: {$layout} (If image_left, image on left, text on right. If image_right, text on left, image on right)
Image URL: {$imagePath}

Colors:
- Background: {$bgColor}
- Title: {$titleColor}
- Accent Line: {$accentColor}
- Text: {$textColor}

Requirements:
1. Wrap exactly in `<section class="py-24 px-8 relative" style="background-color: {$bgColor};">`.
2. Wrap content in `<div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">` (adjust flex-direction based on layout).
3. The image should be beautifully presented (e.g. rounded, subtle shadows, fully responsive).
4. The title should use modern typography. 
5. Add a small decorative accent line (width 12-16, height 1.5, rounded) below the title using the Accent Line color.
6. Description handles multiple paragraphs gracefully.
7. Return only valid HTML, no markdown wrapping.
PROMPT;
    }

    private function getDefaultCode($about)
    {
        $styles = $about->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $titleColor = $styles['title_color'] ?? '#111827';
        $accentColor = $styles['accent_color'] ?? '#6366f1';
        $textColor = $styles['text_color'] ?? '#94a3b8';

        $imagePath = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop';
        if ($about->image) {
            if (strpos($about->image, 'http') === 0 || strpos($about->image, '/images/') === 0 || strpos($about->image, '/storage/') === 0) {
                $imagePath = $about->image;
            } else {
                $imagePath = asset('storage/' . ltrim($about->image, '/'));
            }
        }
        $layout = $about->layout_style ?? 'image_left';

        // Prepare Description (paragraphs)
        $paragraphs = array_filter(explode("\n", str_replace("\r", "", $about->description)));
        $descHtml = "";
        foreach ($paragraphs as $p) {
            $descHtml .= "<p class=\"text-lg leading-relaxed mb-6 last:mb-0 opacity-90\" style=\"color: {$textColor};\">{$p}</p>";
        }

        $flexDir = $layout === 'image_right' ? 'md:flex-row-reverse' : 'md:flex-row';

        return <<<HTML
        <section id="about" class="py-24 px-8 relative overflow-hidden" style="background-color: {$bgColor}; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div class="max-w-6xl mx-auto flex flex-col {$flexDir} items-center gap-16">
                <!-- Image Column -->
                <div class="w-full md:w-1/2">
                    <div class="relative group">
                        <img src="{$imagePath}" alt="About Image" class="w-full h-auto object-cover rounded-2xl shadow-xl transition-transform duration-500 group-hover:scale-[1.02]">
                    </div>
                </div>
                
                <!-- Text Column -->
                <div class="w-full md:w-1/2 flex flex-col justify-center">
                    <h2 class="text-5xl font-black mb-4 leading-tight" style="color: {$titleColor};">
                        {$about->title}
                    </h2>
                    <div class="h-1.5 w-16 rounded-full mb-8" style="background-color: {$accentColor};"></div>
                    <div class="prose prose-lg max-w-none">
                        {$descHtml}
                    </div>
                </div>
            </div>
        </section>
HTML;
    }
}
