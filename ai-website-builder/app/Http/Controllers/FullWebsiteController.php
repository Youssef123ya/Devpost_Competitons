<?php

namespace App\Http\Controllers;

use App\Models\FullWebsite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FullWebsiteController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create()
    {
        return view('full-website.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'prompt' => 'required|string|min:10',
            'product_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240'
        ]);

        // Upload product image
        $path = null;
        if ($request->hasFile('product_image')) {
            $path = $request->file('product_image')->store('full-websites', 'public');
        }

        // Create initial record
        $fullWebsite = FullWebsite::create([
            'user_id' => auth()->id() ?? 1,
            'prompt' => $validated['prompt'],
            'product_image' => $path,
            'generated_code' => null
        ]);

        // Redirect to generate route (Synchronous Flow)
        return redirect()->route('full-website.generate', $fullWebsite->id)
                       ->with('message', 'Analyzing requirements and generating website...');
    }

    public function generate($id)
    {
        $fullWebsite = FullWebsite::findOrFail($id);
        
        // Disable time limit for the long generation process
        set_time_limit(600); // 10 minutes

        // If code already exists, just show preview
        if (!empty($fullWebsite->generated_code)) {
             return redirect()->route('full-website.preview', $fullWebsite->id);
        }

        try {
            // Generate Code
            $generatedCode = $this->generateWebsiteWithAI($fullWebsite);

            if ($generatedCode) {
                 // Clean up markdown
                $generatedCode = preg_replace('/```html\s*/i', '', $generatedCode);
                $generatedCode = preg_replace('/```\s*$/i', '', $generatedCode);
                $generatedCode = trim($generatedCode);
                
                $fullWebsite->update(['generated_code' => $generatedCode]);
                $this->deductCredits();

                return redirect()->route('full-website.preview', $fullWebsite->id)
                               ->with('success', 'Website generated successfully!');
            } else {
                 return redirect()->back()->with('error', 'Failed to generate content. Please try again.');
            }

        } catch (\Exception $e) {
            \Log::error('Generation Failed', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'An unexpected error occurred: ' . $e->getMessage());
        }
    }

    public function preview($id)
    {
        $fullWebsite = FullWebsite::findOrFail($id);
        return view('full-website.preview', compact('fullWebsite'));
    }

    public function regenerate($id)
    {
        $fullWebsite = FullWebsite::findOrFail($id);
        // Clear existing code to force regeneration
        $fullWebsite->update(['generated_code' => null]);
        
        return redirect()->route('full-website.generate', $fullWebsite->id)
                       ->with('message', 'Regenerating website...');
    }

    public function generateWebsiteWithAI($fullWebsite)
    {
        $model = 'deepseek/deepseek-chat'; // Correct DeepSeek V3 model ID
        $userContent = [];
        
        // Prepare image URL if exists
        $imageInstruction = "";
        if ($fullWebsite->product_image) {
            $imageInstruction = "
            CRITICAL IMAGE INSTRUCTION:
            - You MUST use the placeholder `__PRODUCT_IMAGE__` for the main Hero image src.
            - Example: <img src=\"__PRODUCT_IMAGE__\" class=\"hero-image\" alt=\"Product\">
            - Do NOT typically use it as a background image unless it's a large photography shot. A side-by-side layout (Text Left, Image Right) is preferred for products.
            ";
        }
        
        $promptText = "
        You are a Senior Frontend Architect & Creative UI Engineer. You do not create generic or template websites. You build premium, structured, high-end product landing pages with perfect hierarchy and spacing comparable to Apple, Tesla, Stripe, and Linear.

        Create a COMPLETE, SINGLE-PAGE PRODUCT LANDING PAGE.

        Product Description: {$fullWebsite->prompt}
        Image Instructions: {$imageInstruction}

        IMAGE RULE (MANDATORY): All images must preserve original aspect ratio with zero distortion. Use responsive containers, center images, apply object-fit: contain for product clarity and cover for aesthetic sections. Maintain consistent max-height per section. Do not crop essential product details.

        TECH STACK (MANDATORY): Tailwind CSS, GSAP, Swiper.js, Fancybox, Vanilla JavaScript only (NO frameworks).

        LAYOUT SYSTEM (STRICT): All content inside a global .container (max-width:1280px, padding:0 24px). Every section uses .section with padding:96px 0. Use CSS Grid only: grid-2 (minmax 320px, gap 64px), grid-3 (minmax 280px, gap 48px). No absolute positioning for layout. No overlapping elements. Mobile-first, stack under 768px.

        DESIGN STYLE: Clean, minimalist, high-end. Background #F5F5F7, text #1D1D1F, accent (Royal Blue or Deep Purple) used sparingly. White cards, 20px radius, soft shadow (0 20px 40px rgba(0,0,0,0.05)), subtle hover lift. Large clear headings, readable body text.

        SECTIONS (IN ORDER):
        1) Floating glassmorphism Navbar, logo left, links right, sticky, GSAP entrance.
        2) Hero section with split or centered layout, strong H1, subtitle, two buttons (primary filled, secondary outline), product image (__PRODUCT_IMAGE__ or premium placeholder), GSAP fade/slide.
        3) Features section with 3–4 cards (icon, title, description), grid layout, hover lift, GSAP stagger.
        4) Product showcase with alternating text/image layouts, Fancybox-enabled images, scroll-based GSAP animations.
        5) Testimonials using Swiper.js or clean 3-column layout (photo, name, role, review).
        6) FAQ section with simple accordion or list, clean and readable.
        7) CTA section with strong contrasting background, bold headline, centered CTA button.
        8) Footer with 4 columns: logo/description, links, social, newsletter.

        BUTTON STYLE: padding 16px 32px, border-radius 9999px, font-weight 600.

        TECH RULES: Semantic HTML, Tailwind utilities only (no inline styles), clean GSAP timelines, proper Swiper & Fancybox initialization, fully responsive, performance-aware.

        OUTPUT: Return ONLY raw HTML. Include the Tailwind CSS Play CDN (<script src=\"https://cdn.tailwindcss.com\"></script>), GSAP, Swiper.js, and Fancybox CDNs. All JS in one <script> at bottom. No explanations, no markdown, no extra text.
        ";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENROUTER_API_KEY'),
                'HTTP-Referer' => 'http://localhost:8000',
                'X-Title' => 'Laravel AI Builder',
                'Content-Type' => 'application/json',
            ])->timeout(600)->retry(1, 1000)->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a world-class web designer. Output only production-ready HTML with embedded CSS.'],
                    ['role' => 'user', 'content' => $promptText], 
                ],
                'max_tokens' => 2000,
                'temperature' => 0.7,
            ]);

            if ($response->failed()) {
                \Log::error('AI request failed', ['response' => $response->body()]);
                return null;
            }

            $content = $response->json()['choices'][0]['message']['content'] ?? null;

            if (empty($content)) {
                return null;
            }
            
            // Post-processing: Inject Image
            if ($fullWebsite->product_image) {
                $imageUrl = asset('storage/' . $fullWebsite->product_image);
                $content = str_replace('__PRODUCT_IMAGE__', $imageUrl, $content);
            }

            return $content;

        } catch (\Exception $e) {
            \Log::error('AI generation error', ['error' => $e->getMessage()]);
            return null;
        }
    }
}

