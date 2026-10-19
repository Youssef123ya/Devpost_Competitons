<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiContentController extends Controller
{
    /**
     * Generate content via OpenRouter for various sections.
     */
    public function generatePlaceholder(Request $request)
    {
        // Prevent PHP timeout from killing the request before we can return JSON
        set_time_limit(180);
        \Log::warning("🚨 AI FILL BUTTON WAS CLICKED! REACHED BACKEND!");
        $section = $request->input('section', 'hero');
        $portfolioType = $request->input('portfolio_type');
        if (empty($portfolioType)) {
            $portfolioType = 'developer';
        }

        $pastSuggestions = $request->input('past_suggestions', []);

        $prompt = $this->buildPrompt($section, $portfolioType, $pastSuggestions);

        Log::info("AI Generation Started", [
            'section' => $section,
            'portfolio_type' => $portfolioType,
            'has_history' => count($pastSuggestions) > 0,
            'prompt_length' => strlen($prompt)
        ]);

        try {
            $apiKey = config('services.openrouter.key');
            
            $modelsToTry = [
                'qwen/qwen3-coder:free',
                'google/gemma-4-31b-it:free',
                'meta-llama/llama-3.3-70b-instruct:free',
                'openai/gpt-oss-120b:free',
                'nvidia/nemotron-3-super-120b-a12b:free'
            ];

            // Deduplicate configured model if it matches one of our fallback targets
            $modelsToTry = array_unique($modelsToTry);

            $lastException = null;
            $response = null;
            $content = null;

            foreach ($modelsToTry as $currentModel) {
                try {
                    Log::warning("AI Request attempt with model: " . $currentModel);
                    
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'HTTP-Referer' => 'http://localhost:8000',
                        'X-Title' => 'Laravel AI Builder',
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(60) // reduced timeout so it fails faster if stuck
                    ->connectTimeout(10)
                    ->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => $currentModel,
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are a professional website copywriter. You must output ONLY valid JSON. No explanations, no markdown blocks.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'max_tokens' => 1500,
                        'temperature' => 0.7,
                        'response_format' => ['type' => 'json_object']
                    ]);

                    if ($response->failed()) {
                        $body = $response->body();
                        $status = $response->status();
                        Log::error("API Model Failed: {$currentModel}", ['status' => $status, 'body' => $body]);
                        throw new \Exception("Model {$currentModel} failed with status {$status}: {$body}");
                    }

                    $json = $response->json();
                    $content = $json['choices'][0]['message']['content'] ?? null;
                    
                    if (empty($content)) {
                        throw new \Exception("Model {$currentModel} returned empty content.");
                    }

                    // Success: break the loop
                    Log::info("AI Generation Succeeded with model: " . $currentModel);
                    break;

                } catch (\Exception $e) {
                    Log::warning("AI Request failed with model: {$currentModel}. Error: " . $e->getMessage());
                    $lastException = $e;
                    
                    // Wait a short moment before trying next model
                    usleep(600000); // 0.6 seconds
                }
            }

            if (empty($content)) {
                Log::error("All AI models failed. Using hardcoded fallback data. Last Error: " . ($lastException ? $lastException->getMessage() : 'Unknown'));
                
                // ULTIMATE FALLBACK: Never break the user experience
                $fallbackData = $this->getFallbackData($section, $portfolioType);
                
                return response()->json([
                    'success' => true,
                    'data' => $fallbackData,
                    'is_fallback' => true // flag to frontend if needed
                ]);
            }

            // Extract JSON using regex
            if (preg_match('/\{[\s\S]*\}/', $content, $matches)) {
                $content = $matches[0];
                
                // Common fixes for incomplete JSON from free models
                if (!str_ends_with(trim($content), '}')) {
                    $content .= '}';
                }
            } else {
                $content = trim($content);
            }

            $data = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
                Log::error("JSON Decode Failed or Empty", [
                    'error' => json_last_error_msg(),
                    'content' => $content
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to parse AI response. The model output was incomplete, busy, or invalid.'
                ], 500);
            }

            // ── AI Image Refinement (Text Only) ─────────────────
            // Remove any hallucinated image URLs from the AI text model response
            $removeImagesRecursively = function (&$array) use (&$removeImagesRecursively) {
                foreach ($array as $key => &$value) {
                    if (is_array($value)) {
                        $removeImagesRecursively($value);
                    } else if (is_string($value)) {
                        $lowerKey = strtolower($key);
                        if (str_contains($lowerKey, 'image') || str_contains($lowerKey, 'img') || str_contains($lowerKey, 'pic') || str_contains($lowerKey, 'photo') || str_contains($lowerKey, 'bg_')) {
                            if (!filter_var($value, FILTER_VALIDATE_URL)) {
                                unset($array[$key]);
                            }
                        }
                    }
                }
            };
            $removeImagesRecursively($data);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('AI Connection Timeout: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'AI request timed out. Please try again.'
            ], 504);
        } catch (\Exception $e) {
            Log::error('AI Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate content: ' . $e->getMessage()
            ], 500);
        }
    }

    private function buildPrompt($section, $portfolioType, $pastSuggestions = [])
    {
        $randomSeed = rand(1, 10000);

        $pastText = "";
        if (!empty($pastSuggestions)) {
            $pastList = implode(" | ", array_slice(array_map('trim', array_filter($pastSuggestions)), 0, 10));
            $pastText = "\n\n        CRITICAL AVOIDANCE RULE:\n        Do NOT repeat, rephrase, or closely resemble any of these previous ideas:\n        [ {$pastList} ]\n        You must generate something COMPLETELY DIFFERENT and UNIQUE.";
        }

        $basePrompt = "You are an expert website copywriter. 
        THE USER'S PROFESSION IS: $portfolioType.
        
        CRITICAL RULES:
        1. Use EXCLUSIVELY terminology relevant to $portfolioType.
        2. DO NOT use technical jargon if the profession is not tech-related.
        3. Variation Seed: $randomSeed.
        4. Return ONLY a valid JSON object. No markdown.{$pastText}";

        switch ($section) {
            case 'hero':
                return "$basePrompt
                Generate HERO section content.
                Structure: {
                    \"title\": \"A powerful headline matching the $portfolioType\",
                    \"subtitle\": \"A professional subtitle matching the job\",
                    \"description\": \"A very attractive bio (2 sentences max)\",
                    \"cta_text\": \"Primary button text\",
                    \"cta_2_text\": \"Secondary button text\",
                    \"image\": \"https://loremflickr.com/1200/800/word\"
                }
                IMPORTANT: The 'image' field MUST contain a valid loremflickr url replacing 'word' with a single word related to $portfolioType (e.g. laptop, camera, business).
                Return ONLY the JSON object.";

            case 'about':
                return "$basePrompt
                Generate ABOUT section.
                Structure: {
                    \"title\": \"Section Heading\",
                    \"subtitle\": \"Credentials or motto\",
                    \"description\": \"Detailed story (150-200 words)\",
                    \"image\": \"https://loremflickr.com/1200/800/word\"
                }
                IMPORTANT: The 'image' field MUST contain a valid loremflickr url replacing 'word' with a single word describing the profession. Return ONLY the JSON object.";

            case 'services':
                return "$basePrompt
                Generate exactly 4 professional services.
                Structure: {
                    \"title\": \"Main Section Title\",
                    \"subtitle\": \"Catchy Section Subtitle\",
                    \"services\": [
                        { \"title\": \"Specialized Service Name\", \"icon\": \"fa-solid fa-[icon-name]\", \"description\": \"Concise benefit-focused description (10-15 words).\" }
                    ]
                }";

            case 'skills':
                return "$basePrompt
                Generate exactly 6 key professional skills.
                Structure: {
                    \"title\": \"Main Section Title\",
                    \"subtitle\": \"Catchy Section Subtitle\",
                    \"skills\": [
                        { \"name\": \"Professional Skill Name\", \"icon\": \"fa-solid fa-[icon-name]\", \"description\": \"Brief explanation of proficiency or impact (5-8 words).\" }
                    ]
                }";

            case 'work':
                return "$basePrompt
                Generate exactly 3 industry-specific portfolio projects. 
                Structure: {
                    \"title\": \"Main Section Title\",
                    \"subtitle\": \"Catchy Section Subtitle\",
                    \"description\": \"Overarching portfolio overview description.\",
                    \"projects\": [
                        { \"title\": \"Project Name\", \"description\": \"Clear outcome-based result description (15 words).\", \"image\": \"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800\", \"live\": \"#\", \"github\": \"#\" }
                    ]
                }";

            case 'why-choose-us':
                return "$basePrompt
                Generate exactly 4 strong value propositions.
                Structure: {
                    \"title\": \"Main Section Title\",
                    \"subtitle\": \"Catchy Section Subtitle\",
                    \"reasons\": [
                        { \"title\": \"Unique Selling Point\", \"description\": \"Compelling reasoning (15 words).\", \"icon\": \"fa-solid fa-[icon-name]\" }
                    ]
                }";

            case 'footer':
                return "$basePrompt
                Generate FOOTER content.
                Structure: {
                    \"title\": \"Creative Portfolio Name or Brand Name\",
                    \"slogan\": \"A powerful tagline like 'Code Your Future: Build, Innovate, and Transform'\",
                    \"links\": [ \"Services\", \"Work\", \"Skills\", \"About\" ],
                    \"button_text\": \"Contact Me\"
                }
                Return ONLY the JSON object.";

            case 'contact':
                return "$basePrompt
                Generate contact strategy fields.
                Structure: {
                    \"title\": \"Get in Touch\",
                    \"subtitle\": \"Let's work together\",
                    \"ctas\": [ { \"text\": \"Primary Action Label\", \"url\": \"#\" } ],
                    \"socials\": [ { \"icon\": \"fab fa-[brand-name]\", \"url\": \"#\" }, { \"icon\": \"fab fa-[brand-name]\", \"url\": \"#\" } ]
                }";

            default:
                return "Generate JSON for $section of a $portfolioType website.";
        }
    }
    public function generateCreativeDesign(Request $request)
    {
        $section = $request->input('section', 'hero');
        $data = $request->input('data', []);
        $colors = $request->input('colors', []);

        $prompt = "Act as a world-class UI designer. Create a COMPLETELY UNIQUE, BREATHTAKING, AND NON-STANDARD '{$section}' section. 
        DO NOT use simple grids or standard layouts. Think outside the box. Use experimental CSS like glassmorphism, floating layers, diagonal splits, or unique typography.
        
        Content Data: " . json_encode($data) . "
        Preferred Colors: " . json_encode($colors) . "
        
        Requirements:
        1. Use Tailwind CSS + Custom Inline CSS for maximum impact.
        2. Wrap exactly in `<section class='py-24 px-8 relative overflow-hidden {$section}-creative-preview' style='background-color: " . ($colors['bg_color'] ?? '#ffffff') . ";'>`.
        3. Ensure all content from the data is included and beautifully presented.
        4. Return ONLY valid HTML, no markdown wrapping.";

        try {
            $apiKey = config('services.openrouter.key');
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'HTTP-Referer' => 'http://localhost:8000',
                'X-Title' => 'Laravel AI Builder',
            ])->timeout(90)->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => 'qwen/qwen3-coder:free',
                        'messages' => [['role' => 'user', 'content' => $prompt]],
                        'temperature' => 0.8,
                    ]);

            if ($response->successful()) {
                $code = $response->json()['choices'][0]['message']['content'];
                $code = preg_replace('/^```html\n?|```$/i', '', trim($code));
                return response()->json(['success' => true, 'html' => $code]);
            }
        } catch (\Exception $e) {
            \Log::error('Creative Design Error: ' . $e->getMessage());
        }

        return response()->json(['success' => false, 'message' => 'Failed to generate design'], 500);
    }

    /**
     * Modify the existing HTML code based on user prompt.
     */
    public function modifyCode(Request $request)
    {
        // Prevent PHP timeout
        set_time_limit(300);
        
        $code = $request->input('current_code');
        $instruction = $request->input('prompt');
        $section = $request->input('section', 'hero');

        if (empty($code) || empty($instruction)) {
            return response()->json(['success' => false, 'message' => 'Code and prompt are required'], 400);
        }

        \Log::info('modifyCode called', ['section' => $section, 'instruction' => $instruction, 'code_length' => strlen($code)]);

        $prompt = "You are a precise, surgical code editor.
The user wants to make a VERY SPECIFIC modification to the following HTML code for a '$section' section based on this instruction:
\"$instruction\"

CURRENT HTML CODE:
```html
$code
```

STRICT INSTRUCTIONS:
1. Understand the user's request (translate it mentally if it's in Arabic).
2. Apply ONLY the requested changes. DO NOT touch anything else.
3. CRITICAL: Return the EXACT same code with only the surgical changes applied. Do NOT rewrite, refactor, or 'clean up' the code. 
4. CRITICAL: Preserve all existing text, images, tags, structural classes, inline styles, and formatting that were not explicitly mentioned in the user's instruction.
5. STYLING RULES:
   - If an element already has inline styles (a style='...' attribute), and you need to modify its styles (like color, font-size, background, padding, margins, alignment, etc.), you MUST modify/update the styling property directly inside that style='...' attribute rather than adding a Tailwind class. Inline styles take absolute priority in the browser and will override/negate Tailwind classes.
   - If the element does not have a style='...' attribute, you may use Tailwind CSS utility classes to apply styling changes.
6. Return ONLY the fully updated HTML code. 
7. DO NOT wrap the response in markdown blocks (like ```html). Return the raw HTML directly.
8. DO NOT include any explanations, apologies, or conversational text.
9. DO NOT use <think> tags or reasoning blocks. Output ONLY the final HTML.";

        try {
            $apiKey = config('services.openrouter.key');
            
            $modelsToTry = [
                'google/gemma-4-31b-it:free',
                'openai/gpt-oss-120b:free',
                'meta-llama/llama-3.3-70b-instruct:free',
                'nvidia/nemotron-3-super-120b-a12b:free',
                'nousresearch/hermes-3-llama-3.1-405b:free',
                'qwen/qwen3-coder:free',
            ];

            $lastException = null;
            $modifiedCode = null;

            foreach ($modelsToTry as $currentModel) {
                try {
                    \Log::info("modifyCode: Trying model {$currentModel}...");
                    
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'HTTP-Referer' => 'http://localhost:8000',
                        'X-Title' => 'Laravel AI Builder',
                    ])->timeout(120)->connectTimeout(15)->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => $currentModel,
                        'messages' => [['role' => 'user', 'content' => $prompt]],
                        'temperature' => 0.1,
                        'max_tokens' => 16000,
                    ]);

                    if ($response->successful()) {
                        $content = $response->json()['choices'][0]['message']['content'] ?? '';
                        
                        \Log::info("modifyCode: Model {$currentModel} returned content", ['length' => strlen($content), 'preview' => substr($content, 0, 200)]);
                        
                        // Strip <think>...</think> blocks from thinking models (e.g. Qwen3)
                        $content = preg_replace('/<think>[\s\S]*?<\/think>/i', '', $content);
                        $content = trim($content);
                        
                        // Extract HTML if wrapped in markdown code blocks
                        if (preg_match('/```(?:html)?\s*([\s\S]*?)```/i', $content, $matches)) {
                            $modifiedCode = trim($matches[1]);
                        } else {
                            $modifiedCode = trim($content);
                        }

                        if (!empty($modifiedCode)) {
                            // Relaxed validation: accept any response that looks like HTML
                            $hasHtmlTag = preg_match('/<(section|div|nav|header|footer|main|article|style|a |span|p |h[1-6]|ul|ol|img|button|form|input|table)/i', $modifiedCode);
                            
                            if (!$hasHtmlTag) {
                                \Log::warning("modifyCode: Model {$currentModel} returned non-HTML", ['preview' => substr($modifiedCode, 0, 200)]);
                                throw new \Exception("Model {$currentModel} returned non-HTML: " . substr($modifiedCode, 0, 100));
                            }
                            
                            \Log::info("modifyCode: SUCCESS with model {$currentModel}", ['output_length' => strlen($modifiedCode)]);
                            break; // Success
                        }
                    } else {
                        $errorBody = substr($response->body(), 0, 300);
                        \Log::warning("modifyCode: Model {$currentModel} HTTP error", ['status' => $response->status(), 'body' => $errorBody]);
                        throw new \Exception("Model {$currentModel} failed ({$response->status()}): {$errorBody}");
                    }
                } catch (\Exception $e) {
                    \Log::warning("modifyCode: Model {$currentModel} exception: " . $e->getMessage());
                    $lastException = $e;
                    usleep(500000); // Wait 0.5s before fallback
                }
            }

            if (empty($modifiedCode)) {
                throw new \Exception("All AI models failed. Last Error: " . ($lastException ? $lastException->getMessage() : 'Unknown'));
            }

            $modifiedCode = $this->formatHtml($modifiedCode);

            return response()->json([
                'success' => true, 
                'html' => $modifiedCode
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Modify Code Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to modify code. The AI might be busy.'], 500);
        }
    }

    /**
     * Ultimate fallback mechanism to ensure the user NEVER sees an error.
     * Returns pre-written professional templates based on the section.
     */
    private function getFallbackData($section, $portfolioType)
    {
        $profession = ucfirst($portfolioType);
        $seed = rand(1, 100);
        $img = "https://picsum.photos/seed/{$profession}{$seed}/1200/800";

        switch ($section) {
            case 'hero':
                return [
                    'title' => "Elevating the Standard of {$profession} Excellence",
                    'subtitle' => "Professional {$profession} Services",
                    'description' => "Delivering high-quality, innovative solutions tailored to your unique needs. With years of dedicated experience, we transform complex challenges into seamless results.",
                    'cta_text' => 'Get Started',
                    'cta_2_text' => 'Learn More',
                    'image' => $img
                ];
            case 'about':
                return [
                    'title' => "About Me: A Dedicated {$profession}",
                    'subtitle' => 'Committed to innovation and excellence',
                    'description' => "I am a passionate {$profession} with a strong track record of delivering exceptional results. My approach combines technical expertise with creative problem-solving to build solutions that truly matter. I believe in continuous learning and adapting to the latest industry standards to ensure the best possible outcomes for every project I undertake.",
                    'image' => $img
                ];
            case 'services':
                return [
                    'title' => 'Professional Services',
                    'subtitle' => 'What we offer',
                    'services' => [
                        ['title' => 'Strategic Consulting', 'icon' => 'fa-solid fa-lightbulb', 'description' => 'Expert guidance to navigate complex industry challenges.'],
                        ['title' => 'Custom Solutions', 'icon' => 'fa-solid fa-layer-group', 'description' => 'Tailored implementations designed specifically for your goals.'],
                        ['title' => 'Performance Optimization', 'icon' => 'fa-solid fa-gauge-high', 'description' => 'Enhancing efficiency and maximizing your operational output.'],
                        ['title' => 'Ongoing Support', 'icon' => 'fa-solid fa-headset', 'description' => 'Dedicated assistance to ensure long-term sustained success.']
                    ]
                ];
            case 'skills':
                return [
                    'title' => 'Core Competencies',
                    'subtitle' => 'Skills and expertise',
                    'skills' => [
                        ['name' => 'Problem Solving', 'icon' => 'fa-solid fa-puzzle-piece', 'description' => 'Analytical approach to complex issues.'],
                        ['name' => 'Project Management', 'icon' => 'fa-solid fa-tasks', 'description' => 'Delivering on time and within budget.'],
                        ['name' => 'Innovation', 'icon' => 'fa-solid fa-rocket', 'description' => 'Forward-thinking and modern strategies.'],
                        ['name' => 'Communication', 'icon' => 'fa-solid fa-comments', 'description' => 'Clear and transparent client collaboration.'],
                        ['name' => 'Quality Assurance', 'icon' => 'fa-solid fa-check-double', 'description' => 'Rigorous standards for all deliverables.'],
                        ['name' => 'Adaptability', 'icon' => 'fa-solid fa-arrows-spin', 'description' => 'Quickly adjusting to new requirements.']
                    ]
                ];
            case 'work':
                return [
                    'title' => 'Featured Projects',
                    'subtitle' => 'Our recent success stories',
                    'description' => 'A showcase of our most impactful work, highlighting our commitment to quality and innovation in every deliverable.',
                    'projects' => [
                        ['title' => 'Enterprise Transformation', 'description' => 'A complete overhaul of core systems leading to a 40% increase in efficiency.', 'image' => $img, 'live' => '#', 'github' => '#'],
                        ['title' => 'Global Expansion Strategy', 'description' => 'Successfully launched new initiatives across three international markets.', 'image' => $img, 'live' => '#', 'github' => '#'],
                        ['title' => 'Digital Optimization', 'description' => 'Streamlined digital workflows saving the client over 100 hours monthly.', 'image' => $img, 'live' => '#', 'github' => '#']
                    ]
                ];
            case 'why-choose-us':
                return [
                    'title' => 'Why Choose Us',
                    'subtitle' => 'The advantage we bring',
                    'reasons' => [
                        ['title' => 'Proven Track Record', 'description' => 'Years of consistent, high-quality results.', 'icon' => 'fa-solid fa-medal'],
                        ['title' => 'Client-Centric Approach', 'description' => 'Your goals are our primary focus.', 'icon' => 'fa-solid fa-users'],
                        ['title' => 'Innovative Solutions', 'description' => 'We leverage the latest industry trends.', 'icon' => 'fa-solid fa-lightbulb'],
                        ['title' => 'Dedicated Support', 'description' => 'We are here for you 24/7.', 'icon' => 'fa-solid fa-headset']
                    ]
                ];
            case 'footer':
                return [
                    'title' => "{$profession} Portfolio",
                    'slogan' => 'Building the future, today.',
                    'links' => ['Services', 'About', 'Work', 'Contact'],
                    'button_text' => 'Get in Touch'
                ];
            case 'contact':
                return [
                    'title' => 'Get in Touch',
                    'subtitle' => "Let's discuss your next big idea.",
                    'ctas' => [['text' => 'Send Message', 'url' => '#']],
                    'socials' => [['icon' => 'fab fa-twitter', 'url' => '#'], ['icon' => 'fab fa-linkedin', 'url' => '#']]
                ];
            default:
                return ['title' => 'Generated Content', 'subtitle' => 'Please try generating again.'];
        }
    }

    /**
     * Basic HTML formatter to make AI generated one-line code readable
     */
    private function formatHtml($html)
    {
        $html = preg_replace('/>\s*</', ">\n<", $html);
        $lines = explode("\n", $html);
        $indent = 0;
        $formatted = [];
        $voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (preg_match('/^<\/[a-zA-Z0-9\-]+>$/', $line)) {
                $indent = max(0, $indent - 1);
            }

            $formatted[] = str_repeat('    ', $indent) . $line;

            if (preg_match('/^<([a-zA-Z0-9\-]+)[^>]*>.*<\/\1>$/', $line)) {
                // Self-contained tag, do nothing
            } elseif (preg_match('/^<([a-zA-Z0-9\-]+)[^>]*>$/', $line)) {
                preg_match('/^<([a-zA-Z0-9\-]+)/', $line, $matches);
                if (!empty($matches[1]) && !in_array(strtolower($matches[1]), $voidElements) && !str_ends_with($line, '/>')) {
                    $indent++;
                }
            }
        }
        return implode("\n", $formatted);
    }
}
