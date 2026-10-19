<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HeroController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    // Show preview page for a hero. If generated_code exists, load it; otherwise indicate generation needed.
    public function generate(Request $request, $id)
    {
        $hero = Hero::findOrFail($id);

        if (!empty($hero->generated_code)) {
            Log::info('Loading existing code for hero', ['id' => $id]);
            $content = $hero->generated_code;
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json(['success' => true, 'code' => $content]);
            }
            return view('hero.preview', compact('hero', 'content'));
        }

        $content = null;
        $needsGeneration = true;
        return view('hero.preview', compact('hero', 'content', 'needsGeneration'));
    }

    // Show the create form / index for heroes
    public function index()
    {
        return view('hero.create');
    }

    // Store a new Hero created from the form
    public function store(Request $request)
    {
        $validated = $request->validate([
            'layout_style' => 'nullable|string|max:50',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'background_image' => 'nullable|image|mimes:jpeg,png,gif,webp|max:5120',
            'background_image_url' => 'nullable|string',
            'cta_text' => 'nullable|string|max:120',
            'cta_url' => 'nullable|url',
            'cta_2_text' => 'nullable|string|max:120',
            'cta_2_url' => 'nullable|url',
            'cta_3_text' => 'nullable|string|max:120',
            'cta_3_url' => 'nullable|url',
            'bg_color' => 'nullable|string',
            'title_color' => 'nullable|string',
            'subtitle_color' => 'nullable|string',
            'description_color' => 'nullable|string',
            'button_bg_color' => 'nullable|string',
            'button_text_color' => 'nullable|string',
        ]);

        $path = null;
        if ($request->filled('background_image_url') && empty($request->file('background_image'))) {
            // Use AI-suggested image URL (will be downloaded later or treated as remote)
            $path = $request->input('background_image_url');
        } elseif ($request->hasFile('background_image')) {
            $file = $request->file('background_image');
            $filename = \Illuminate\Support\Str::random(40) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('images/heroes'), $filename);
            $path = '/images/heroes/' . $filename;
        }

        $custom = [
            'bg_color' => $validated['bg_color'] ?? null,
            'title_color' => $validated['title_color'] ?? null,
            'subtitle_color' => $validated['subtitle_color'] ?? null,
            'description_color' => $validated['description_color'] ?? null,
            'button_bg_color' => $validated['button_bg_color'] ?? null,
            'button_text_color' => $validated['button_text_color'] ?? null,
        ];

        $hero = Hero::create([
            'user_id' => auth()->id(),
            'layout_style' => $validated['layout_style'] ?? 'centered',
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'description' => $validated['description'] ?? null,
            'background_image' => $path,
            'cta_text' => $validated['cta_text'] ?? null,
            'cta_url' => $validated['cta_url'] ?? null,
            'cta_2_text' => $validated['cta_2_text'] ?? null,
            'cta_2_url' => $validated['cta_2_url'] ?? null,
            'cta_3_text' => $validated['cta_3_text'] ?? null,
            'cta_3_url' => $validated['cta_3_url'] ?? null,
            'custom_styles' => array_filter($custom, function ($v) { return $v !== null && $v !== ''; }),
        ]);

        return redirect()->route('hero.generate', $hero->id);
    }

    // Receive live preview edits and persist them
    public function updateDesign(Request $request, $id)
    {
        $hero = Hero::findOrFail($id);

        $data = $request->all();

        // Basic sanitization and mapping
        $update = [];
        if (isset($data['title'])) $update['title'] = $data['title'];
        if (isset($data['subtitle'])) $update['subtitle'] = $data['subtitle'];
        if (isset($data['description'])) $update['description'] = $data['description'];
        if (isset($data['cta_text'])) $update['cta_text'] = $data['cta_text'];
        if (isset($data['cta_url'])) $update['cta_url'] = $data['cta_url'];
        if (isset($data['cta_2_text'])) $update['cta_2_text'] = $data['cta_2_text'];
        if (isset($data['cta_2_url'])) $update['cta_2_url'] = $data['cta_2_url'];
        if (isset($data['cta_3_text'])) $update['cta_3_text'] = $data['cta_3_text'];
        if (isset($data['cta_3_url'])) $update['cta_3_url'] = $data['cta_3_url'];

        if (isset($data['styles']) && is_array($data['styles'])) {
            // Merge existing custom styles with provided ones
            $existing = $hero->custom_styles ?? [];
            $merged = array_merge($existing, $data['styles']);
            $update['custom_styles'] = $merged;

            // Inject custom styles as !important CSS into generated_code
            // so the hero looks correct on ALL pages (navbar preview, website preview, etc.)
            $codeToUpdate = (isset($data['generated_code']) && !empty($data['generated_code'])) ? $data['generated_code'] : $hero->generated_code;
            
            if ($codeToUpdate) {
                $code = $codeToUpdate;

                // Determine background image URL for centered/left layout
                if ($hero->background_image && $hero->layout_style !== 'split') {
                    if (str_starts_with($hero->background_image, 'http')) {
                        $bgUrl = $hero->background_image;
                    } elseif (str_starts_with($hero->background_image, '/images/') || str_starts_with($hero->background_image, '/storage/')) {
                        $bgUrl = url($hero->background_image);
                    } else {
                        $bgUrl = url('/storage/' . ltrim($hero->background_image, '/'));
                    }
                }
                // Build combined CSS: colors + background image
                $stylesCss = $this->buildStylesCss($merged, $bgUrl);

                // Remove any existing hero-custom-styles block
                $cleaned = preg_replace('/<style id="hero-custom-styles">.*?<\/style>\s*/s', '', $code);
                if ($cleaned !== null) $code = $cleaned;
                $injectedFlag = false;
                // We no longer inject styles into the generated_code.
                // The style block will be rendered dynamically in the view instead.

                // For split layout, ensure the <img> tag exists in hero-right
                if ($hero->background_image && $hero->layout_style === 'split' && strpos($code, '<img') === false) {
                    if (str_starts_with($hero->background_image, 'http')) {
                        $imageUrl = $hero->background_image;
                    } elseif (str_starts_with($hero->background_image, '/images/') || str_starts_with($hero->background_image, '/storage/')) {
                        $imageUrl = url($hero->background_image);
                    } else {
                        $imageUrl = url('/storage/' . ltrim($hero->background_image, '/'));
                    }
                    $injected = preg_replace(
                        '/(<div[^>]*class=["\'][^"\']*hero-right[^"\']*["\'][^>]*>).*?(<\/div>)/is',
                        '$1<img src="' . $imageUrl . '" alt="Hero Image" class="hero-image" style="width:100%;height:100%;object-fit:cover;">$2',
                        $code,
                        1
                    );
                    if ($injected !== null) $code = $injected;
                }

                $update['generated_code'] = $code;
            }
        }

        if (!empty($update)) {
            $hero->update($update);
        }

        return response()->json(['success' => true, 'hero' => $hero, 'css' => $stylesCss ?? '']);
    }

    public function regenerate(Request $request, $id)
    {
        $hero = Hero::findOrFail($id);
        $hero->update(['generated_code' => null]);
        return redirect()->route('hero.generate', $id)->with('success', 'Section regenerated successfully!');
    }

    // AJAX endpoint to generate hero code via AI (with fallback)
    public function generateCode(Request $request, $id)
    {
        set_time_limit(180);
        try {
            $hero = Hero::findOrFail($id);

            if (!empty($hero->generated_code) && strpos($hero->generated_code, 'id="hero-custom-styles"') === false) {
                // No longer modifying the DB to inject custom styles here.
            }

            if (!empty($hero->generated_code)) {
                return response()->json(['success' => true, 'code' => $hero->generated_code]);
            }

            Log::info('Generating new code for hero (generateCode)', ['id' => $id]);

            $colors = $hero->custom_styles ?? [];
            if (!is_array($colors)) {
                Log::warning('custom_styles not array, using defaults', ['id' => $id]);
                $colors = [];
            }

            $layoutInstructions = $this->getLayoutInstructions($hero->layout_style ?? 'centered');

            $bgColor = $colors['bg_color'] ?? '#ffffff';
            $titleColor = $colors['title_color'] ?? '#000000';
            $subtitleColor = $colors['subtitle_color'] ?? '#374151';
            $descColor = $colors['description_color'] ?? '#4b5563';
            $btnBgColor = $colors['button_bg_color'] ?? '#3b82f6';
            $btnTextColor = $colors['button_text_color'] ?? '#ffffff';

            $prompt = "Create a modern, responsive hero section (HTML + CSS). Follow the layout and color instructions exactly.\n";
            $prompt .= "Layout: {$hero->layout_style}\n" . $layoutInstructions . "\n";
            $prompt .= "Content: Title: {$hero->title} | Subtitle: {$hero->subtitle} | Description: {$hero->description} | Button: {$hero->cta_text} | Button URL: {$hero->cta_url}\n";
            $prompt .= "Colors (apply these strictly as inline styles where applicable):\n";
            $prompt .= "- Section Background color: {$bgColor}\n";
            $prompt .= "- Title text color: {$titleColor}\n";
            $prompt .= "- Subtitle text color: {$subtitleColor}\n";
            $prompt .= "- Description text color: {$descColor}\n";
            $prompt .= "- Button background color: {$btnBgColor}\n";
            $prompt .= "- Button text color: {$btnTextColor}\n";
            $prompt .= "Styling instructions: Use exactly `min-height: 65vh;` in the style attribute of the main `.hero` section container to ensure proper layout proportion.\n";

            try {
                $systemMessage = "You are a strict code generator. Return only HTML and CSS, no markdown fences.";

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . config('services.openrouter.key', env('OPENROUTER_API_KEY')),
                ])->timeout(120)->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'qwen/qwen3-coder:free',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemMessage],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 4000,
                    'temperature' => 0.1,
                ]);

                if ($response->failed()) {
                    Log::warning('AI request failed for hero', ['hero_id' => $id, 'status' => $response->status()]);
                    $content = $this->generateBaseCode($hero, $colors);
                } else {
                    $content = $response->json()['choices'][0]['message']['content'] ?? null;
                    if (empty($content)) {
                        $content = $this->generateBaseCode($hero, $colors);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Hero generation error: ' . $e->getMessage());
                $content = $this->generateBaseCode($hero, $colors);
            }

            $content = $this->injectRequiredClasses($content);

            $imageUrl = null;
            if ($hero->background_image) {
                if (str_starts_with($hero->background_image, 'http')) {
                    $imageUrl = $hero->background_image;
                } elseif (str_starts_with($hero->background_image, '/images/') || str_starts_with($hero->background_image, '/storage/')) {
                    $imageUrl = url($hero->background_image);
                } else {
                    $imageUrl = url('/storage/' . ltrim($hero->background_image, '/'));
                }
            } elseif ($hero->background_image_url) {
                $imageUrl = $hero->background_image_url;
            }

            if ($imageUrl) {
                if ($hero->layout_style === 'split') {
                    $content = preg_replace('/(<div[^>]*class=["\'][^"\']*hero-right[^"\']*["\'][^>]*>).*?(<\/div>)/is', '$1<img src="' . $imageUrl . '" alt="Hero Image" class="hero-image">$2', $content);
                } else {
                    // Ensure the background-image is set inline on the section/header/div
                    $content = preg_replace_callback('/(<(?:section|header|div)[^>]*class=["\'][^"\']*\bhero\b[^"\']*["\'][^>]*)>/i', function($matches) use ($imageUrl) {
                        $tag = $matches[1];
                        if (preg_match('/background-image:\s*url\([^)]+\)/i', $tag)) {
                            return preg_replace('/background-image:\s*url\([^)]+\)/i', 'background-image: url(\'' . $imageUrl . '\')', $tag) . '>';
                        } elseif (strpos($tag, 'style="') !== false) {
                            return preg_replace('/(style=")/i', '$1background-image: url(\'' . $imageUrl . '\'); background-size: cover; background-position: center; ', $tag) . '>';
                        } else {
                            return $tag . ' style="background-image: url(\'' . $imageUrl . '\'); background-size: cover; background-position: center; position: relative;">';
                        }
                    }, $content, 1);
                }
            } else {
                // If AI hallucinated images but user didn't upload one, replace broken local/fake URLs with a reliable placeholder
                $placeholder = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';
                
                $content = preg_replace_callback('/background-image:\s*url\([\'"]?([^\'")]+)[\'"]?\)/i', function($matches) use ($placeholder) {
                    $url = $matches[1];
                    if (str_starts_with($url, 'data:') || str_contains($url, 'unsplash.com') || str_contains($url, 'placeholder.com')) return $matches[0];
                    return "background-image: url('{$placeholder}')";
                }, $content);
                
                $content = preg_replace_callback('/bg-\[url\([\'"]?([^\'")\]]+)[\'"]?\)\]/i', function($matches) use ($placeholder) {
                    $url = $matches[1];
                    if (str_starts_with($url, 'data:') || str_contains($url, 'unsplash.com') || str_contains($url, 'placeholder.com')) return $matches[0];
                    return "bg-[url('{$placeholder}')]";
                }, $content);
                
                $content = preg_replace_callback('/<img[^>]+src=[\'"]([^\'"]+)[\'"]/i', function($matches) use ($placeholder) {
                    $url = $matches[1];
                    if (str_starts_with($url, 'data:') || str_contains($url, 'unsplash.com') || str_contains($url, 'placeholder.com')) return $matches[0];
                    return str_replace($url, $placeholder, $matches[0]);
                }, $content);
            }

            // Custom CSS block is now rendered dynamically in the view (preview-content.blade.php)
            // We no longer inject it directly into the generated HTML.
            $bgUrlForCss = ($hero->layout_style !== 'split' && $hero->background_image) ? $imageUrl : null;
            // $css = $this->buildStylesCss($colors, $bgUrlForCss);

            $hero->update(['generated_code' => $content]);
            $this->deductCredits();

            return response()->json(['success' => true, 'code' => $content]);
        } catch (\Exception $e) {
            Log::error('Hero generateCode fatal error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Inject required CSS classes for JS event listeners to work
    private function injectRequiredClasses($html)
    {
        // 1. Ensure the root element has the "hero" class
        $html = preg_replace_callback('/<(section|header|div)\b([^>]*)>/i', function($matches) {
            static $done = false;
            if ($done) return $matches[0];
            $done = true; // only modify the first wrapper tag

            $attributes = $matches[2];
            if (strpos($attributes, 'class=') !== false) {
                // If it already has classes, check if 'hero' is missing, then inject it
                if (!preg_match('/\bclass=["\'][^"\']*\bhero\b[^"\']*["\']/i', $matches[0])) {
                    return preg_replace('/(class=["\'])([^"\']*["\'])/i', '$1hero $2', $matches[0]);
                }
            } else {
                // No class attribute, add it
                return '<' . $matches[1] . ' class="hero" ' . $attributes . '>';
            }
            return $matches[0];
        }, $html, 1);

        // Find first h1, h2 or h3 and add hero-title class if not already there
        $html = preg_replace_callback('/<h[1-3]\b([^>]*)>/i', function($matches) {
            if (strpos($matches[0], 'hero-title') === false) {
                if (strpos($matches[1], 'class=') !== false) {
                    return preg_replace('/(class="[^"]*)(")/', '$1 hero-title$2', $matches[0]);
                } else {
                    return preg_replace('/<(h[1-3])(\b)/', '<$1 class="hero-title"$2', $matches[0]);
                }
            }
            return $matches[0];
        }, $html, 1);

        // Find p tags and add hero-subtitle/hero-description classes
        $pCount = 0;
        $html = preg_replace_callback('/<p\b([^>]*)>/i', function($matches) use (&$pCount) {
            $pCount++;
            if (strpos($matches[0], 'hero-subtitle') === false && strpos($matches[0], 'hero-description') === false) {
                $class = ($pCount === 1) ? 'hero-subtitle' : 'hero-description';
                if (strpos($matches[1], 'class=') !== false) {
                    return preg_replace('/(class="[^"]*)(")/', '$1 ' . $class . '$2', $matches[0]);
                } else {
                    return '<p class="' . $class . '"' . $matches[1] . '>';
                }
            }
            return $matches[0];
        }, $html);

        // Add hero-button, hero-cta-2, hero-cta-3 classes to anchor tags
        $aCount = 0;
        $html = preg_replace_callback('/<a\b([^>]*)\bhref=[^>]*>/i', function($matches) use (&$aCount) {
            $aCount++;
            if ($aCount > 3) return $matches[0];
            
            $class = ['hero-button', 'hero-cta-2', 'hero-cta-3'][$aCount - 1];
            if (strpos($matches[0], $class) === false && strpos($matches[0], 'hero-') === false) {
                if (strpos($matches[1], 'class=') !== false) {
                    return preg_replace('/(class="[^"]*)(")/', '$1 ' . $class . '$2', $matches[0]);
                } else {
                    return str_replace('<a', '<a class="' . $class . '"', $matches[0]);
                }
            }
            return $matches[0];
        }, $html);

        return $html;
    }

    // Simple API to fetch hero JSON
    public function api($id)
    {
        $hero = Hero::findOrFail($id);
        return response()->json($hero);
    }

    // Handle background image upload and update hero record
    public function updateBackgroundImage(Request $request, $id)
    {
        $hero = Hero::findOrFail($id);
        $validated = $request->validate(['background_image' => 'required|image|mimes:jpeg,png,gif,webp|max:5120']);

        if ($hero->background_image && Storage::disk('public')->exists($hero->background_image)) {
            Storage::disk('public')->delete($hero->background_image);
        }
        $path = $request->file('background_image')->store('heroes', 'public');
        $hero->update(['background_image' => $path]);

        // Try to update generated_code to reference the image if present
        $imageUrl = '/storage/' . ltrim($path, '/');
        if ($hero->generated_code) {
            if ($hero->layout_style === 'split') {
                $updated = preg_replace('/(<div[^>]*class=["\'][^"\']*hero-right[^"\']*["\'][^>]*>).*?(<\/div>)/is', '$1<img src="' . $imageUrl . '" alt="Hero Image" class="hero-image">$2', $hero->generated_code);
            } else {
                // Ensure the background-image is set inline on the section/header/div
                $updated = preg_replace_callback('/(<(?:section|header|div)[^>]*class=["\'][^"\']*\bhero\b[^"\']*["\'][^>]*)>/i', function($matches) use ($imageUrl) {
                    $tag = $matches[1];
                    if (preg_match('/background-image:\s*url\([^)]+\)/i', $tag)) {
                        return preg_replace('/background-image:\s*url\([^)]+\)/i', 'background-image: url(\'' . $imageUrl . '\')', $tag) . '>';
                    } elseif (strpos($tag, 'style="') !== false) {
                        return preg_replace('/(style=")/i', '$1background-image: url(\'' . $imageUrl . '\'); background-size: cover; background-position: center; ', $tag) . '>';
                    } else {
                        return $tag . ' style="background-image: url(\'' . $imageUrl . '\'); background-size: cover; background-position: center; position: relative;">';
                    }
                }, $hero->generated_code, 1);
                if ($updated === null) { $updated = $hero->generated_code; }
            }
            $hero->update(['generated_code' => $updated]);
        }

        return response()->json(['success' => true, 'path' => $path, 'url' => $imageUrl]);
    }

    // Provide short layout hints for the AI prompt
    private function getLayoutInstructions($layoutStyle)
    {
        $map = [
            'centered' => "Centered content, headline + subtitle + CTAs centered horizontally. Include responsive stacking for mobile.",
            'left-aligned' => "Left aligned content with large heading on the left and optional image on the right on wide screens.",
            'split' => "Two-column split layout: text on left, image on right (stacks vertically on mobile).",
        ];
        return $map[$layoutStyle] ?? $map['centered'];
    }

    // Build !important CSS rules from custom styles array to embed in generated_code.
    // $bgImageUrl: optional storage path to the hero's background image.
    private function buildStylesCss($styles, $bgImageUrl = null)
    {
        $rules = [];

        if (!empty($styles['title_color']))
            $rules[] = '.hero-title.hero-title { color: ' . $styles['title_color'] . '; }';

        if (!empty($styles['subtitle_color']))
            $rules[] = '.hero-subtitle.hero-subtitle { color: ' . $styles['subtitle_color'] . '; }';

        if (!empty($styles['description_color']))
            $rules[] = '.hero-description.hero-description { color: ' . $styles['description_color'] . '; }';

        $btnStyles = '';
        if (!empty($styles['button_bg_color']))
            $btnStyles .= 'background-color: ' . $styles['button_bg_color'] . '; ';
        if (!empty($styles['button_text_color']))
            $btnStyles .= 'color: ' . $styles['button_text_color'] . '; ';
        if ($btnStyles)
            $rules[] = '.hero-button.hero-button, .hero-cta-2.hero-cta-2, .hero-cta-3.hero-cta-3 { ' . $btnStyles . '}';

        if (!empty($styles['bg_color']))
            $rules[] = '.hero.hero, .hero-bg.hero-bg { background-color: ' . $styles['bg_color'] . '; }';

        // Hide hallucinated AI overlays
        $rules[] = '.hero-bg-overlay, [class*="bg-overlay"], .hero-overlay { display: none !important; }';

            // Background image overlays (centered / left-aligned layout only)
            if ($bgImageUrl) {
                // Make .hero-bg transparent — the image sits directly on .hero (injected inline)
                // Do NOT hide .hero-bg because it may be needed for overlays
                $rules[] = '.hero-bg.hero-bg { background: transparent !important; }';

                $escaped = '"' . $bgImageUrl . '"';
                $rules[] = '.hero.hero { background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; position: relative !important; }';

            // Bring content to the front — exclude .hero-bg so it stays position:absolute
            $rules[] = '.hero.hero > *:not(.hero-bg) { position: relative; z-index: 10; }';
            
            // Basic solid overlay
            $overlayColor = $styles['overlay_color'] ?? '#000000';
            $overlayOpacity = isset($styles['overlay_opacity']) ? ((int)$styles['overlay_opacity'] / 100) : 0;
            
            $bgBlur = isset($styles['bg_blur']) ? (int)$styles['bg_blur'] : 0;
            $blurRule = $bgBlur > 0 ? " backdrop-filter: blur({$bgBlur}px); -webkit-backdrop-filter: blur({$bgBlur}px);" : "";

            if ($overlayOpacity > 0 || $bgBlur > 0) {
                $rules[] = '.hero.hero::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: ' . $overlayColor . ' !important; opacity: ' . ($overlayOpacity > 0 ? $overlayOpacity : 1) . ' !important; pointer-events: none; z-index: 1;' . $blurRule . ' }';
                if ($overlayOpacity == 0 && $bgBlur > 0) {
                    $rules[] = '.hero.hero::before { background-color: transparent !important; }';
                }
            }
            
            // Gradient overlay
            $gradOpacity = isset($styles['gradient_opacity']) ? ((int)$styles['gradient_opacity'] / 100) : 0;
            if ($gradOpacity > 0) {
                $gradAngle = $styles['gradient_angle'] ?? 180;
                $gradFrom = $styles['gradient_from_color'] ?? '#000000';
                $gradTo = $styles['gradient_to_color'] ?? '#ffffff';
                $rules[] = '.hero.hero::after { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(' . $gradAngle . 'deg, ' . $gradFrom . ', ' . $gradTo . ') !important; opacity: ' . $gradOpacity . ' !important; pointer-events: none; z-index: 2; }';
            }
        }

        if (empty($rules)) return '';

        return '<style id="hero-custom-styles">' . "\n" . implode("\n", $rules) . "\n" . '</style>';
    }

    // Fallback hero HTML when AI is unavailable
    private function generateBaseCode($hero, $colors = [])
    {
        $bg = $colors['bg_color'] ?? '#f9fafb';
        $titleColor = $colors['title_color'] ?? '#111827';
        $subtitleColor = $colors['subtitle_color'] ?? '#6b7280';
        $btnBg = $colors['button_bg_color'] ?? '#3b82f6';
        $btnText = $colors['button_text_color'] ?? '#ffffff';

        $title = htmlspecialchars($hero->title ?? '');
        $subtitle = htmlspecialchars($hero->subtitle ?? '');
        $desc = htmlspecialchars($hero->description ?? '');
        $cta = htmlspecialchars($hero->cta_text ?? 'Get started');
        $ctaUrl = $hero->cta_url ?? '#';

        return "<section class=\"hero\" style=\"position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 65vh; padding: 2rem 5%;\">\n" .
               "  <div class=\"hero-bg\" style=\"position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: {$bg}; z-index: 1;\"></div>\n" .
               "  <div class=\"hero-content\" style=\"max-width:900px;margin:0 auto;text-align:center; position: relative; z-index: 2;\">\n" .
               "    <h1 class=\"hero-title\" style=\"color: {$titleColor}; font-size: clamp(2rem,5vw,3rem); margin-bottom:0.5rem;\">{$title}</h1>\n" .
               ( $subtitle ? "    <p class=\"hero-subtitle\" style=\"color: {$subtitleColor}; margin-bottom:1rem; font-size:1.125rem;\">{$subtitle}</p>\n" : "" ) .
               ( $desc ? "    <p class=\"hero-description\" style=\"color: {$subtitleColor}; margin-bottom:1.5rem;\">{$desc}</p>\n" : "" ) .
               "    <a href=\"{$ctaUrl}\" class=\"hero-button\" style=\"background: {$btnBg}; color: {$btnText}; padding: 12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;\">{$cta}</a>\n" .
                "  </div>\n" .
                "</section>";
    }

    // Full website preview — renders all sections
    
    public function fullPreview($heroId)
    {
        $hero = Hero::with([
            'navbar', 
            'aboutSection',
            'skillSection', 
            'serviceSection', 
            'whyChooseUs', 
            'work',
            'contactSection',
            'footerSection'
        ])->findOrFail($heroId);
        return view('website.preview', compact('hero'));
    }

    // Export loading page
    public function exportLoading($heroId)
    {
        $hero = Hero::where('user_id', auth()->id())->findOrFail($heroId);
        return view('website.export-loading', compact('hero'));
    }

    // Download Laravel project

    public function downloadProject(\Illuminate\Http\Request $request, $heroId)
    {
        set_time_limit(600); // 10 minutes for large vendor compression
        $hero = \App\Models\Hero::where('user_id', auth()->id())->findOrFail($heroId);

        $adminName     = $request->input('admin_name', 'Admin');
        $adminEmail    = $request->input('admin_email', 'admin@example.com');
        $adminPassword = $request->input('admin_password', '12345678');

        // Delete old generated zips to free disk space
        foreach (glob(storage_path('app/public/portfolio-*.zip')) as $f) @unlink($f);

        // Create a clean filename from portfolio title or use hero ID
        $portfolioName = preg_replace('/[^a-zA-Z0-9\-]/', '', str_replace(' ', '-', $hero->title ?? 'My-Portfolio'));
        $portfolioName = $portfolioName ?: 'My-Portfolio';
        $zipFileName = 'portfolio-' . $portfolioName . '.zip';
        $zipFilePath = base_path('storage' . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $zipFileName);
        
        // Delete existing file if it exists to avoid conflicts
        if (file_exists($zipFilePath)) {
            @unlink($zipFilePath);
        }
        
        // Use base stripped template (clean without old platform data)
        $candidates = [
            storage_path('app/laravel-base.zip'),
            base_path('storage/app/laravel-base.zip'),
            base_path('storage' . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'laravel-base.zip'),
            base_path('storage' . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'laravel-base.zip'),
            storage_path('app/public/laravel-base.zip'),
            __DIR__ . '/../../../../storage/app/laravel-base.zip'
        ];

        $baseZip = null;
        $tried = [];
        foreach ($candidates as $p) {
            $real = realpath($p) ?: $p;
            $tried[] = $real;
            if (file_exists($real)) {
                $baseZip = $real;
                break;
            }
        }

        if (!$baseZip) {
            return response()->json(['success' => false, 'message' => 'Base project template not found.', 'tried' => $tried]);
        }

        if (!@copy($baseZip, $zipFilePath)) {
            return response()->json(['success' => false, 'message' => 'Failed to copy base template.', 'source' => $baseZip]);
        }

        $zip = new \ZipArchive();
        $result = $zip->open($zipFilePath);
        if ($result !== TRUE) {
            return response()->json(['success' => false, 'message' => 'Could not open zip archive for customization']);
        }

        // Build DatabaseSeeder with user data
        $now = date('Y-m-d H:i:s');
        $nameParts = explode(' ', $adminName, 2);
        $firstName = addslashes($nameParts[0]);
        $lastName  = isset($nameParts[1]) ? addslashes($nameParts[1]) : '';

        $seeder  = "<?php\n\nnamespace Database\Seeders;\n\nuse Illuminate\Database\Seeder;\nuse Illuminate\Support\Facades\DB;\nuse Illuminate\Support\Facades\Hash;\n\nclass DatabaseSeeder extends Seeder\n{\n    public function run()\n    {\n";
        $seeder .= "        DB::table('users')->insert([\n";
        $seeder .= "            'first_name' => '$firstName',\n";
        $seeder .= "            'last_name'  => '$lastName',\n";
        $seeder .= "            'email'      => '" . addslashes($adminEmail) . "',\n";
        $seeder .= "            'password'   => Hash::make('" . addslashes($adminPassword) . "'),\n";
        $seeder .= "            'created_at' => '$now',\n";
        $seeder .= "            'updated_at' => '$now',\n";
        $seeder .= "        ]);\n\n";

        // Map AI Builder tables to standard exported Sections table
        $sectionMapping = [
            'navbars'          => 'navbar',
            'heroes'           => 'hero',
            'skill_sections'   => 'skills',
            'service_sections' => 'services',
            'why_choose_us'    => 'why_choose_us',
            'work'             => 'work',
            'contact_sections' => 'contact',
            'footer_sections'  => 'footer'
        ];
        
        $order = 1;
        foreach ($sectionMapping as $table => $type) {
            if (!\Illuminate\Support\Facades\Schema::hasTable($table)) continue;
            
            $query = \Illuminate\Support\Facades\DB::table($table);
            $row = ($table === 'heroes') ? $query->where('id', $heroId)->orderBy('id', 'desc')->first() : $query->where('hero_id', $heroId)->orderBy('id', 'desc')->first();
            
            if ($row) {
                $rowArr = (array) $row;
                $html = $this->normalizeExportAssetUrls($rowArr['generated_code'] ?? '');
                
                // Decode JSON fields properly for dashboard editing
                $jsonFields = ['skills_data', 'services_data', 'reasons_data', 'items_data', 'social_links', 'links', 'links_data', 'buttons_data', 'form_fields', 'ctas', 'custom_styles'];
                foreach ($jsonFields as $field) {
                    if (isset($rowArr[$field]) && is_string($rowArr[$field])) {
                        $rowArr[$field] = json_decode($rowArr[$field], true) ?? [];
                    }
                }
                
                // Rename keys to match Dashboard controller list fields
                if (isset($rowArr['skills_data'])) { $rowArr['skills'] = $rowArr['skills_data']; unset($rowArr['skills_data']); }
                if (isset($rowArr['services_data'])) { $rowArr['services'] = $rowArr['services_data']; unset($rowArr['services_data']); }
                if (isset($rowArr['reasons_data'])) { $rowArr['features'] = $rowArr['reasons_data']; unset($rowArr['reasons_data']); }
                if (isset($rowArr['items_data'])) { $rowArr['projects'] = $rowArr['items_data']; unset($rowArr['items_data']); }
                if (isset($rowArr['social_links'])) { $rowArr['socials'] = $rowArr['social_links']; unset($rowArr['social_links']); }
                if (isset($rowArr['links_data'])) { $rowArr['links'] = $rowArr['links_data']; unset($rowArr['links_data']); }
                
                // Inject custom CSS styles for navbar and hero into HTML
                if ($type === 'navbar' && !empty($rowArr['custom_styles'])) {
                    $nStyles = $rowArr['custom_styles'];
                    $styleStr = "<style>\n";
                    if(!empty($nStyles['padding'])) $styleStr .= "#section-navbar nav { padding-top: {$nStyles['padding']}px !important; padding-bottom: {$nStyles['padding']}px !important; }\n";
                    if(!empty($nStyles['nav_bg_color'])) $styleStr .= "#section-navbar nav { background-color: {$nStyles['nav_bg_color']} !important; }\n";
                    if(!empty($nStyles['link_color'])) $styleStr .= "#section-navbar a:not(.cta-btn), #section-navbar .nav-item { color: {$nStyles['link_color']} !important; }\n";
                    if(!empty($nStyles['link_size'])) $styleStr .= "#section-navbar a:not(.cta-btn), #section-navbar .nav-item { font-size: {$nStyles['link_size']}px !important; }\n";
                    if(!empty($nStyles['btn_bg_color'])) $styleStr .= "#section-navbar .cta-btn { background-color: {$nStyles['btn_bg_color']} !important; }\n";
                    if(!empty($nStyles['btn_text_color'])) $styleStr .= "#section-navbar .cta-btn { color: {$nStyles['btn_text_color']} !important; }\n";
                    if(!empty($nStyles['btn_size'])) {
                        $pt = round(intval($nStyles['btn_size']) * 0.75); $pr = round(intval($nStyles['btn_size']) * 2);
                        $styleStr .= "#section-navbar .cta-btn { font-size: {$nStyles['btn_size']}px !important; padding: {$pt}px {$pr}px !important; }\n";
                    }
                    if(!empty($nStyles['logo_size'])) $styleStr .= "#section-navbar img, #section-navbar .logo-img { height: {$nStyles['logo_size']}px !important; width: auto !important; }\n";
                    if(!empty($nStyles['link_bg_color'])) {
                        $styleStr .= "#section-navbar a:not(.cta-btn), #section-navbar .nav-item { position: relative !important; text-decoration: none !important; border-bottom: none !important; }\n";
                        $styleStr .= "#section-navbar a:not(.cta-btn):hover, #section-navbar .nav-item:hover, #section-navbar a:not(.cta-btn):focus, #section-navbar .nav-item:focus { color: {$nStyles['link_bg_color']} !important; opacity: 0.9 !important; }\n";
                        $styleStr .= "#section-navbar a:not(.cta-btn)::after, #section-navbar .nav-item::after { content: \"\" !important; position: absolute !important; bottom: -4px !important; left: 50% !important; width: 0 !important; height: 3px !important; border-radius: 3px !important; background-color: {$nStyles['link_bg_color']} !important; transform: translateX(-50%) !important; transition: width 0.3s ease !important; display: block !important; }\n";
                        $styleStr .= "#section-navbar a:not(.cta-btn):hover::after, #section-navbar .nav-item:hover::after { width: 100% !important; }\n";
                    }
                    if(!empty($nStyles['icon_color'])) $styleStr .= "#section-navbar .hamburger svg, #section-navbar #hamburger-btn svg, #section-navbar .hamburger svg line, #section-navbar #hamburger-btn svg line { stroke: {$nStyles['icon_color']} !important; }\n";
                    $styleStr .= "</style>\n";
                    $html = $styleStr . '<div id="section-navbar" class="relative z-[100]">' . $html . '</div>';
                }
                
                if ($type === 'hero') {
                    $hStyles = $rowArr['custom_styles'] ?? [];
                    $hBg = $rowArr['background_image'] ?? null;
                    if (!empty($hStyles) || $hBg) {
                        $styleStr = "<style>\n";
                        if(!empty($hStyles['title_color'])) $styleStr .= ".hero-title.hero-title { color: {$hStyles['title_color']} !important; }\n";
                        if(!empty($hStyles['subtitle_color'])) $styleStr .= ".hero-subtitle.hero-subtitle { color: {$hStyles['subtitle_color']} !important; }\n";
                        if(!empty($hStyles['description_color'])) $styleStr .= ".hero-description.hero-description { color: {$hStyles['description_color']} !important; }\n";
                        if(!empty($hStyles['button_bg_color']) || !empty($hStyles['button_text_color'])) {
                            $styleStr .= ".hero-button.hero-button, .hero-cta-2.hero-cta-2, .hero-cta-3.hero-cta-3 { ";
                            if(!empty($hStyles['button_bg_color'])) $styleStr .= "background-color: {$hStyles['button_bg_color']} !important; ";
                            if(!empty($hStyles['button_text_color'])) $styleStr .= "color: {$hStyles['button_text_color']} !important; ";
                            $styleStr .= "}\n";
                        }
                        if(!empty($hStyles['bg_color'])) {
                            $bgTarget = $hBg ? '.hero.hero' : '.hero.hero, .hero-bg.hero-bg';
                            $styleStr .= "{$bgTarget} { background-color: {$hStyles['bg_color']} !important; }\n";
                        }
                        if($hBg && ($rowArr['layout_style'] ?? '') !== 'split') {
                            $bgUrl = (str_starts_with($hBg, 'http') || str_starts_with($hBg, '/images/') || str_starts_with($hBg, '/storage/')) ? $hBg : '/storage/' . ltrim($hBg, '/');
                              $styleStr .= ".hero.hero { background-image: url(\"{$bgUrl}\") !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }\n";
                        }
                        $styleStr .= "</style>\n";
                        $html = $styleStr . $html;
                    }
                }
                
                unset($rowArr['id'], $rowArr['user_id'], $rowArr['hero_id'], $rowArr['generated_code'], $rowArr['created_at'], $rowArr['updated_at']);
                
                $sectionData = [
                    'type'       => $type,
                    'settings'   => json_encode($rowArr),
                    'html'       => $html,
                    'order'      => $order++,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $seeder .= "        DB::table('sections')->insert(" . var_export($sectionData, true) . ");\n\n";
            }
        }
        $seeder .= "    }\n}\n";

        $zip->addFromString('database/seeders/DatabaseSeeder.php', $seeder);

        // Empty SQLite database file
        $zip->addFromString('database/database.sqlite', '');

        // Ensure storage/framework directories exist (prevents "valid cache path" error)
        $zip->addFromString('storage/framework/cache/.gitkeep', '');
        $zip->addFromString('storage/framework/sessions/.gitkeep', '');
        $zip->addFromString('storage/framework/views/.gitkeep', '');
        $zip->addFromString('storage/framework/cache/data/.gitkeep', '');
        $zip->addFromString('storage/logs/.gitkeep', '');
        $zip->addFromString('storage/app/public/.gitkeep', '');
        $zip->addFromString('bootstrap/cache/.gitkeep', '');

        // .env file
        $envContent  = "APP_NAME=\"My Portfolio\"\n";
        $envContent .= "APP_ENV=local\n";
        $envContent .= "APP_KEY=base64:" . base64_encode(random_bytes(32)) . "\n";
        $envContent .= "APP_DEBUG=true\n";
        $envContent .= "APP_URL=http://localhost:8000\n\n";
        $envContent .= "DB_CONNECTION=sqlite\n\n";
        $envContent .= "SESSION_DRIVER=file\nSESSION_LIFETIME=120\n";
        $envContent .= "CACHE_STORE=file\nQUEUE_CONNECTION=sync\nMAIL_MAILER=log\n";
        $zip->addFromString('.env', $envContent);

        // We do not inject website/preview.blade.php anymore because the base template index.blade.php handles it.

        // We do not inject Eloquent models from the platform because the exported project only needs the Section model.

        // Copy public storage files (images) into the zip
        $publicStorage = storage_path('app/public');
        $foldersToCopy = ['about_images', 'footer-logos', 'full-websites', 'heroes', 'logos', 'work_images', 'work_videos'];
        foreach ($foldersToCopy as $folder) {
            $this->copyDirectoryIntoZip($zip, $publicStorage . DIRECTORY_SEPARATOR . $folder, 'storage/app/public/' . $folder);
        }

        // Copy public/images (hero uploads, AI-generated images, etc.)
        $this->copyDirectoryIntoZip($zip, public_path('images'), 'public/images');

        // Ensure exported project can serve /storage/* on Windows (php artisan serve junction 403)
        $this->patchExportStorageRoute($zip);

        // Removed overriding '/' route because the clean template natively loads sections!

        // README
        $readme  = "# My Portfolio - Laravel Project\n\n";
        $readme .= "## 🎉 Welcome!\n\n";
        $readme .= "Your portfolio website is ready to launch! Follow these simple steps:\n\n";
        
        $readme .= "### ⚡ Quick Start (Recommended)\n\n";
        $readme .= "**Windows Users:**\n";
        $readme .= "1. Double-click `setup.bat` - this will install everything automatically\n";
        $readme .= "2. Once done, the server will start automatically\n";
        $readme .= "3. Visit http://localhost:8000 in your browser\n\n";
        
        $readme .= "**Mac/Linux Users:**\n";
        $readme .= "1. Open Terminal in this folder\n";
        $readme .= "2. Run: `bash setup.sh`\n";
        $readme .= "3. Once done, the server will start automatically\n";
        $readme .= "4. Visit http://localhost:8000 in your browser\n\n";
        
        $readme .= "### 📚 Manual Setup (If script doesn't work)\n\n";
        $readme .= "```bash\n";
        $readme .= "# Step 1: Install PHP dependencies\n";
        $readme .= "composer install\n\n";
        $readme .= "# Step 2: Install Node dependencies (for assets)\n";
        $readme .= "npm install\n\n";
        $readme .= "# Step 3: Setup database\n";
        $readme .= "php artisan migrate:fresh --seed\n\n";
        $readme .= "# Step 4: Create storage link\n";
        $readme .= "php artisan storage:link\n\n";
        $readme .= "# Step 5: Build assets\n";
        $readme .= "npm run build\n\n";
        $readme .= "# Step 6: Start the server\n";
        $readme .= "php artisan serve\n";
        $readme .= "```\n\n";
        
        $readme .= "### 🔐 Admin Login\n\n";
        $readme .= "- **URL:** http://localhost:8000/login\n";
        $readme .= "- **Email:** " . $adminEmail . "\n";
        $readme .= "- **Password:** " . $adminPassword . "\n\n";
        
        $readme .= "### 🛠️ What's Next?\n\n";
        $readme .= "1. Login to the admin panel\n";
        $readme .= "2. Edit your portfolio sections\n";
        $readme .= "3. Customize colors, text, and images\n";
        $readme .= "4. Deploy to production when ready\n\n";
        
        $readme .= "### 📝 Important Notes\n\n";
        $readme .= "- `database/database.sqlite` is your database file. Don't delete unless you want to reset\n";
        $readme .= "- The portfolio loads at `/` (home page)\n";
        $readme .= "- Admin panel is at `/login`\n";
        $readme .= "- All your data is stored locally\n\n";
        
        $readme .= "### ❓ Troubleshooting\n\n";
        $readme .= "**Port 8000 already in use?**\n";
        $readme .= "```bash\n";
        $readme .= "php artisan serve --port=8001\n";
        $readme .= "```\n\n";
        
        $readme .= "**Getting 'command not found' errors?**\n";
        $readme .= "- Make sure PHP and Composer are installed globally\n";
        $readme .= "- Check that Node.js and npm are installed\n";
        $readme .= "- Run `composer install` and `npm install` manually\n\n";
        
        $readme .= "### 🚀 Ready to Deploy?\n\n";
        $readme .= "Check our deployment guide for hosting this on:\n";
        $readme .= "- Vercel\n";
        $readme .= "- Heroku\n";
        $readme .= "- AWS\n";
        $readme .= "- Any PHP hosting provider\n\n";
        
        $readme .= "---\n";
        $readme .= "Created with ❤️ by AI Website Builder\n";
        $zip->addFromString('README.md', $readme);

        // Auto-setup batch file for Windows
        $setupBat  = "@echo off\n";
        $setupBat .= "cd /d \"%~dp0\"\n";
        $setupBat .= "echo.\n";
        $setupBat .= "echo ╔════════════════════════════════════════╗\n";
        $setupBat .= "echo ║   My Portfolio - Auto Setup            ║\n";
        $setupBat .= "echo ║   Setting up your Laravel project...   ║\n";
        $setupBat .= "echo ╚════════════════════════════════════════╝\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "REM Check if composer is installed\n";
        $setupBat .= "where composer >nul 2>nul\n";
        $setupBat .= "if errorlevel 1 (\n";
        $setupBat .= "    echo ❌ Composer is not installed!\n";
        $setupBat .= "    echo Please install Composer from: https://getcomposer.org/download/\n";
        $setupBat .= "    pause\n";
        $setupBat .= "    exit /b 1\n";
        $setupBat .= ")\n\n";
        
        $setupBat .= "REM Delete old database\n";
        $setupBat .= "if exist database\\database.sqlite (\n";
        $setupBat .= "    del /f /q database\\database.sqlite\n";
        $setupBat .= "    echo ✓ Cleaned up old database\n";
        $setupBat .= ")\n\n";
        
        $setupBat .= "echo [1/5] Installing PHP dependencies with Composer...\n";
        $setupBat .= "call composer install --no-interaction --prefer-dist\n";
        $setupBat .= "if errorlevel 1 (\n";
        $setupBat .= "    echo ❌ Composer install failed!\n";
        $setupBat .= "    pause\n";
        $setupBat .= "    exit /b 1\n";
        $setupBat .= ")\n";
        $setupBat .= "echo ✓ PHP dependencies installed\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "echo [2/5] Installing Node.js dependencies...\n";
        $setupBat .= "where npm >nul 2>nul\n";
        $setupBat .= "if not errorlevel 1 (\n";
        $setupBat .= "    call npm install\n";
        $setupBat .= "    echo ✓ Node dependencies installed\n";
        $setupBat .= ") else (\n";
        $setupBat .= "    echo ⚠️  npm not found - skipping Node dependencies\n";
        $setupBat .= ")\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "echo [3/5] Running database migrations and seeding...\n";
        $setupBat .= "call php artisan migrate:fresh --seed --force\n";
        $setupBat .= "if errorlevel 1 (\n";
        $setupBat .= "    echo ❌ Migration failed!\n";
        $setupBat .= "    pause\n";
        $setupBat .= "    exit /b 1\n";
        $setupBat .= ")\n";
        $setupBat .= "echo ✓ Database setup complete\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "echo [4/5] Creating storage link...\n";
        $setupBat .= "call php artisan storage:link --force\n";
        $setupBat .= "echo ✓ Storage link created\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "echo [5/5] Building assets...\n";
        $setupBat .= "where npm >nul 2>nul\n";
        $setupBat .= "if not errorlevel 1 (\n";
        $setupBat .= "    call npm run build\n";
        $setupBat .= "    echo ✓ Assets built\n";
        $setupBat .= ") else (\n";
        $setupBat .= "    echo ⚠️  npm not found - skipping asset build\n";
        $setupBat .= ")\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "echo ╔════════════════════════════════════════╗\n";
        $setupBat .= "echo ║   ✓ Setup Complete!                   ║\n";
        $setupBat .= "echo ║                                        ║\n";
        $setupBat .= "echo ║   Server starting in 2 seconds...      ║\n";
        $setupBat .= "echo ║   Visit: http://localhost:8000        ║\n";
        $setupBat .= "echo ║   Admin: " . str_pad($adminEmail, 30) . "║\n";
        $setupBat .= "echo ╚════════════════════════════════════════╝\n";
        $setupBat .= "echo.\n\n";
        
        $setupBat .= "timeout /t 2 /nobreak\n";
        $setupBat .= "cls\n";
        $setupBat .= "call php artisan serve\n";
        
        $zip->addFromString('setup.bat', $setupBat);

        // Auto-setup shell script for Mac/Linux
        $setupSh  = "#!/bin/bash\n\n";
        $setupSh .= "set -e\n\n";
        
        $setupSh .= "# Colors for output\n";
        $setupSh .= "GREEN='\\033[0;32m'\n";
        $setupSh .= "YELLOW='\\033[1;33m'\n";
        $setupSh .= "RED='\\033[0;31m'\n";
        $setupSh .= "NC='\\033[0m'\n\n";
        
        $setupSh .= "echo \"\"\n";
        $setupSh .= "echo \"\${GREEN}╔════════════════════════════════════════╗\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║   My Portfolio - Auto Setup            ║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║   Setting up your Laravel project...   ║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}╚════════════════════════════════════════╝\${NC}\"\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "# Check if Composer is installed\n";
        $setupSh .= "if ! command -v composer &> /dev/null; then\n";
        $setupSh .= "    echo \"\${RED}❌ Composer is not installed!\${NC}\"\n";
        $setupSh .= "    echo \"Install from: https://getcomposer.org/download/\"\n";
        $setupSh .= "    exit 1\n";
        $setupSh .= "fi\n\n";
        
        $setupSh .= "# Remove old database\n";
        $setupSh .= "if [ -f database/database.sqlite ]; then\n";
        $setupSh .= "    rm -f database/database.sqlite\n";
        $setupSh .= "    echo \"\${GREEN}✓\${NC} Cleaned up old database\"\n";
        $setupSh .= "fi\n\n";
        
        $setupSh .= "echo \"[1/5] Installing PHP dependencies with Composer...\"\n";
        $setupSh .= "composer install --no-interaction --prefer-dist\n";
        $setupSh .= "echo \"\${GREEN}✓\${NC} PHP dependencies installed\"\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "echo \"[2/5] Installing Node.js dependencies...\"\n";
        $setupSh .= "if command -v npm &> /dev/null; then\n";
        $setupSh .= "    npm install\n";
        $setupSh .= "    echo \"\${GREEN}✓\${NC} Node dependencies installed\"\n";
        $setupSh .= "else\n";
        $setupSh .= "    echo \"\${YELLOW}⚠️  npm not found - skipping Node dependencies\${NC}\"\n";
        $setupSh .= "fi\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "echo \"[3/5] Running database migrations and seeding...\"\n";
        $setupSh .= "php artisan migrate:fresh --seed --force\n";
        $setupSh .= "echo \"\${GREEN}✓\${NC} Database setup complete\"\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "echo \"[4/5] Creating storage link...\"\n";
        $setupSh .= "php artisan storage:link --force\n";
        $setupSh .= "echo \"\${GREEN}✓\${NC} Storage link created\"\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "echo \"[5/5] Building assets...\"\n";
        $setupSh .= "if command -v npm &> /dev/null; then\n";
        $setupSh .= "    npm run build\n";
        $setupSh .= "    echo \"\${GREEN}✓\${NC} Assets built\"\n";
        $setupSh .= "else\n";
        $setupSh .= "    echo \"\${YELLOW}⚠️  npm not found - skipping asset build\${NC}\"\n";
        $setupSh .= "fi\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "echo \"\${GREEN}╔════════════════════════════════════════╗\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║   ✓ Setup Complete!                   ║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║                                        ║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║   Server starting in 2 seconds...      ║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║   Visit: http://localhost:8000        ║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}║   Admin: " . str_pad($adminEmail, 30) . "║\${NC}\"\n";
        $setupSh .= "echo \"\${GREEN}╚════════════════════════════════════════╝\${NC}\"\n";
        $setupSh .= "echo \"\"\n\n";
        
        $setupSh .= "sleep 2\n";
        $setupSh .= "clear\n";
        $setupSh .= "php artisan serve\n";
        
        $zip->addFromString('setup.sh', $setupSh);

        // Help file with quick start guide
        $help  = "📚 QUICK START GUIDE\n";
        $help .= "===================\n\n";
        
        $help .= "WINDOWS USERS:\n";
        $help .= "1. Double-click setup.bat\n";
        $help .= "2. Wait for completion\n";
        $help .= "3. Server will start automatically\n";
        $help .= "4. Visit http://localhost:8000\n\n";
        
        $help .= "MAC/LINUX USERS:\n";
        $help .= "1. Open Terminal here\n";
        $help .= "2. Run: chmod +x setup.sh && ./setup.sh\n";
        $help .= "3. Visit http://localhost:8000\n\n";
        
        $help .= "MANUAL SETUP:\n";
        $help .= "1. composer install\n";
        $help .= "2. npm install\n";
        $help .= "3. php artisan migrate:fresh --seed\n";
        $help .= "4. php artisan storage:link\n";
        $help .= "5. npm run build\n";
        $help .= "6. php artisan serve\n\n";
        
        $help .= "ADMIN LOGIN:\n";
        $help .= "Email: " . $adminEmail . "\n";
        $help .= "Password: " . $adminPassword . "\n";
        $help .= "URL: http://localhost:8000/login\n\n";
        
        $help .= "TROUBLESHOOTING:\n";
        $help .= "- Port 8000 in use? Use: php artisan serve --port=8001\n";
        $help .= "- Missing composer? Download from getcomposer.org\n";
        $help .= "- Missing Node.js? Download from nodejs.org\n";
        $help .= "- More help? See README.md\n";
        
        $zip->addFromString('HELP.txt', $help);

        $zip->close();

        // Return JSON with download URL instead of direct response
        if (file_exists($zipFilePath)) {
            return response()->json([
                'success' => true, 
                'message' => 'Project ready for download',
                'filename' => $zipFileName
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Failed to create project file'], 500);
    }

    // Direct download endpoint for generated projects
    public function downloadFile($filename)
    {
        $filePath = base_path('storage' . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $filename);
        
        // Security: Only allow downloading files for authenticated users
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Security: Only allow .zip files
        if (substr($filename, -4) !== '.zip') {
            return response()->json(['error' => 'Invalid file type'], 400);
        }
        
        // Check if file exists
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }
        
        // Return the file for download
        return response()->download($filePath, basename($filePath), [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="' . basename($filePath) . '"'
        ]);
    }

    /**
     * Convert platform absolute asset URLs to relative paths for exported sites.
     */
    private function normalizeExportAssetUrls(string $html): string
    {
        if ($html === '') {
            return $html;
        }

        $appUrl = rtrim((string) config('app.url'), '/');
        if ($appUrl !== '') {
            $html = str_replace($appUrl . '/storage/', '/storage/', $html);
            $html = str_replace($appUrl . '/images/', '/images/', $html);
        }

        $html = preg_replace('#https?://127\.0\.0\.1:\d+/(storage|images)/#', '/$1/', $html);
        $html = preg_replace('#https?://localhost:\d+/(storage|images)/#', '/$1/', $html);

        return $html;
    }

    /**
     * Recursively add a local directory into the export zip.
     */
    private function copyDirectoryIntoZip(\ZipArchive $zip, string $localDir, string $zipPrefix): void
    {
        if (!is_dir($localDir)) {
            return;
        }

        $zipPrefix = rtrim(str_replace('\\', '/', $zipPrefix), '/');
        $localDir = rtrim($localDir, DIRECTORY_SEPARATOR);

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($localDir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($files as $name => $file) {
            $relativePath = str_replace('\\', '/', substr($name, strlen($localDir) + 1));
            $entryPath = $zipPrefix . '/' . $relativePath;

            if ($file->isDir()) {
                $zip->addEmptyDir($entryPath);
            } else {
                $zip->addFile($file->getRealPath(), $entryPath);
            }
        }
    }

    /**
     * Inject storage file route into exported Laravel project (Windows 403 fix).
     */
    private function patchExportStorageRoute(\ZipArchive $zip): void
    {
        $routes = $zip->getFromName('routes/web.php');
        if ($routes === false || str_contains($routes, "Route::get('/storage/{path}'")) {
            return;
        }

        $storageBlock = <<<'PHP'

// Fix for Windows php artisan serve: serve storage files directly via PHP
// This bypasses the Junction symlink 403 issue
Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);
    if (!file_exists($fullPath)) {
        abort(404);
    }
    $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
    return response()->file($fullPath, ['Content-Type' => $mimeType]);
})->where('path', '.*');

PHP;

        $insertPos = strpos($routes, '// Public website');
        if ($insertPos === false) {
            $insertPos = strpos($routes, 'Route::');
        }

        if ($insertPos !== false) {
            $routes = substr($routes, 0, $insertPos) . $storageBlock . "\n" . substr($routes, $insertPos);
        } else {
            $routes .= $storageBlock;
        }

        $zip->addFromString('routes/web.php', $routes);
    }

    // Delete a single website
    public function destroy($id)
    {
        $hero = \App\Models\Hero::where('user_id', auth()->id())->findOrFail($id);
        $hero->delete();
        return redirect()->route('dashboard')->with('success', 'Website deleted successfully.');
    }

    // Delete all websites for the current user
    public function destroyAll()
    {
        \App\Models\Hero::where('user_id', auth()->id())->delete();
        return redirect()->route('dashboard')->with('success', 'All your websites have been deleted.');
    }
}