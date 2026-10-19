<?php

namespace App\Http\Controllers;

use App\Models\Work;
use App\Models\Hero;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WorkController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    public function create($heroId)
    {
        $hero = Hero::findOrFail($heroId);
        return view('work.create', compact('hero'));
    }

    public function store(Request $request, $heroId)
    {
        $hero = Hero::findOrFail($heroId);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'layout_style' => 'required|in:grid,masonry,carousel',
            'projects_data' => 'nullable|json',
        ]);

        // Parse projects data if provided
        $projectsData = [];
        if ($validated['projects_data']) {
            $projectsData = json_decode($validated['projects_data'], true) ?? [];
        }

        $work = new Work();
        $work->hero_id = $hero->id;
        $work->title = $validated['title'] ?? 'Our Work';
        $work->subtitle = $validated['subtitle'] ?? 'Showcase of our projects';
        $work->layout_style = $validated['layout_style'];
        $work->items_data = $projectsData;
        $work->save();

        return redirect()->route('work.generate', $work->id);
    }

    public function generate(\Illuminate\Http\Request $request, $id) {
        $work = Work::findOrFail($id);
        $hero = $work->hero;
        $needsGeneration = empty($work->generated_code);
        return view('work.preview', compact('work', 'hero', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $work = Work::findOrFail($id);
        if (!empty($work->generated_code)) {
            return response()->json(['success' => true, 'code' => $work->generated_code]);
        }
        $code = $this->generateAiCode($work);
        $work->generated_code = $code;
        $work->save();
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $code]);
    }

    public function updateDesign(Request $request, $id)
    {
        $work = Work::findOrFail($id);

        $work->title = $request->input('title');
        $work->subtitle = $request->input('subtitle');
        $work->items_data = $request->input('items', []);
        $work->custom_styles = $request->input('styles', []);

        // Generate the HTML code for the live website based on incoming request data
        $html = $this->getDefaultCode($work);

        // Only save changes to database if it's explicitly NOT a preview-only request
        if (!$request->input('preview_only')) {
            $work->generated_code = $html;
            $work->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Design updated',
            'html' => $html
        ]);
    }

    public function uploadImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:8192', // 8MB
            ]);

            $path = $request->file('image')->store('work_images', 'public');

            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->validator->errors()->all();
            return response()->json([
                'success' => false,
                'message' => implode(', ', $errors),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function uploadVideo(Request $request)
    {
        try {
            if (!$request->hasFile('video')) {
                return response()->json(['success' => false, 'message' => 'No video file found. Please check if the file size is under 40MB.'], 422);
            }

            $request->validate([
                'video' => 'required|file|mimes:mp4,mov,ogg,qt,webm,mkv,avi,wmv,flv,mpeg|max:40000', // 40MB limit
            ]);

            $path = $request->file('video')->store('work_videos', 'public');

            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->validator->errors()->all();
            return response()->json([
                'success' => false,
                'message' => implode(', ', $errors),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function regenerate(Request $request, $id)
    {
        $work = Work::findOrFail($id);
        $work->generated_code = $this->generateAiCode($work);
        $work->save();
        $this->deductCredits();

        return redirect()->back()->with('success', 'Section regenerated successfully!');
    }

    private function buildPrompt(Work $work): string
    {
        $items = $work->items_data ?? [];
        $itemsText = '';

        if (is_array($items) && !empty($items)) {
            foreach ($items as $index => $item) {
                $title = $item['title'] ?? 'Project ' . ($index + 1);
                $description = $item['description'] ?? '';
                $github = $item['github'] ?? '';
                $live = $item['live'] ?? '';
                $image = $item['image'] ?? '';

                $itemsText .= "Project " . ($index + 1) . ":\n";
                $itemsText .= "  Title: $title\n";
                $itemsText .= "  Description: $description\n";
                $itemsText .= "  Image URL: $image\n";
                if ($github)
                    $itemsText .= "  GitHub: $github\n";
                if ($live)
                    $itemsText .= "  Live Demo: $live\n";
            }
        }

        $layoutStyle = $work->layout_style ?? 'grid';

        return "Create a professional portfolio/work section HTML for a website.
STRICT DATA TO USE:
Main Title: {$work->title}
Subtitle: {$work->subtitle}
Layout Style: $layoutStyle

PROJECTS TO RENDER:
" . ($itemsText ?: "NO PROJECTS PROVIDED. DO NOT RENDER ANY PROJECTS.") . "

CRITICAL RULES:
1. ONLY use the projects listed in the 'PROJECTS TO RENDER' section above.
2. DO NOT ADD, INVENT, OR HALLUCINATE ANY EXTRA PROJECTS.
3. IF 'PROJECTS TO RENDER' IS 'NO PROJECTS PROVIDED', RENDER THE SECTION WITH THE TITLE AND SUBTITLE ONLY, AND NO PROJECT CARDS.
4. Each project card must use the EXACT 'Image URL' provided verbatim.
5. Render ALL projects provided in the list.
6. CRITICAL: If there are MORE THAN 3 projects, add a 'hidden extra-project' class to projects from the 4th onwards.
7. CRITICAL: If there are MORE THAN 3 projects, add a 'Show all projects' button at the bottom of the section that is an <a> tag linking to the full project gallery URL.
8. Return ONLY raw HTML within a <section> tag, matching the requested '$layoutStyle' layout style.";
    }

    private function getLightboxHtml(): string
    {
        return "
    <!-- Noir Lightbox Edition - Source of Truth -->
    <div id=\"work-lightbox\" class=\"fixed inset-0 z-[999999] bg-black/95 backdrop-blur-xl hidden justify-center items-center opacity-0 transition-opacity duration-500 ease-in-out cursor-zoom-out\" onclick=\"window.closeWorkLightbox()\">
        
        <button class=\"absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 z-[1000000] border border-white/10\" onclick=\"window.closeWorkLightbox()\">
            <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2.5\" d=\"M6 18L18 6M6 6l12 12\"/>
            </svg>
        </button>

        <div id=\"lightbox-media-wrapper\" class=\"relative flex items-center justify-center transition-all duration-500 ease-out scale-90 opacity-0\" onclick=\"event.stopPropagation()\" style=\"width:auto; height:auto; max-width:85vw; max-height:80vh;\">
            <div id=\"lightbox-media-container\" class=\"rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] bg-black/40\">
                <!-- Content injected here -->
            </div>
        </div>
    </div>

    <script>
        window.openWorkLightbox = function(src, isVideo) {
            const lightbox = document.getElementById(\"work-lightbox\");
            const container = document.getElementById(\"lightbox-media-container\");
            const wrapper = document.getElementById(\"lightbox-media-wrapper\");
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
                
                container.innerHTML = isVideo 
                    ? `<video src=\"\${src}\" controls autoplay loop style=\"max-width:80vw; max-height:75vh; display:block; border-radius:2.5rem;\"></video>`
                    : `<img src=\"\${src}\" style=\"max-width:80vw; max-height:75vh; object-fit:contain; display:block; border-radius:2.5rem;\">`;
            }, 50);
            document.body.style.overflow = \"hidden\";
        };

        window.closeWorkLightbox = function() {
            const lightbox = document.getElementById(\"work-lightbox\");
            const wrapper = document.getElementById(\"lightbox-media-wrapper\");
            if (!lightbox || !wrapper) return;
            
            lightbox.style.opacity = \"0\";
            wrapper.classList.add(\"scale-90\", \"opacity-0\");
            wrapper.classList.remove(\"scale-100\", \"opacity-100\");
            
            setTimeout(() => {
                lightbox.classList.add(\"hidden\");
                lightbox.classList.remove(\"flex\");
                document.getElementById(\"lightbox-media-container\").innerHTML = \"\";
                document.body.style.overflow = \"\";
            }, 500);
        };
    </script>
    <style>
        .cursor-zoom-in { cursor: zoom-in; }
    </style>";
    }

    private function generateAiCode(Work $work): string
    {
        try {
            $apiKey = config('app.openrouter_api_key') ?? env('OPENROUTER_API_KEY');

            if (!$apiKey) {
                return $this->getDefaultCode($work);
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => 'gpt-4-turbo',
                        'messages' => [
                            [
                                'role' => 'user',
                                'content' => $this->buildPrompt($work),
                            ],
                        ],
                        'max_tokens' => 1500,
                    ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                // Clean markdown code blocks if AI included them
                $content = preg_replace('/^```(?:html|css|javascript)?\n?/i', '', $content);
                $content = preg_replace('/\n?```$/', '', $content);

                // Append the Lightbox UI to AI generated code too
                return $content . $this->getLightboxHtml();
            }

            return $this->getDefaultCode($work);
        } catch (\Exception $e) {
            return $this->getDefaultCode($work);
        }
    }

    private function getDefaultCode(Work $work): string
    {
        $title = $work->title ?? 'My Projects';
        $subtitle = $work->subtitle ?? 'Check out some of my recent work';
        $layoutStyle = $work->layout_style ?? 'grid';
        $styles = $work->custom_styles ?? [];
        $bgColor = $styles['bg_color'] ?? '#ffffff';
        $cardBg = $styles['card_bg'] ?? '#ffffff';
        $titleColor = $styles['title_color'] ?? '#0f172a';
        $subtitleColor = $styles['subtitle_color'] ?? '#64748b';
        $projectTitleColor = $styles['project_title_color'] ?? '#0f172a';
        $projectDescColor = $styles['project_desc_color'] ?? '#64748b';
        $btnBgColor = $styles['btn_bg_color'] ?? '#4f46e5';
        $btnTextColor = $styles['btn_text_color'] ?? '#ffffff';
        $githubBtnBg = $styles['github_btn_bg'] ?? '#1e293b';
        $githubBtnText = $styles['github_btn_text'] ?? '#ffffff';
        $accentLineColor = $styles['accent_line_color'] ?? '#4f46e5';
        $boxShadow = $styles['box_shadow'] ?? 'shadow-sm';

        $titleSize = ($styles['title_size'] ?? 48) . 'px';
        $padding = ($styles['padding'] ?? 80) . 'px';
        $gap = ($styles['gap'] ?? 32) . 'px';
        $borderRadius = ($styles['border_radius'] ?? 16) . 'px';

        $items = $work->items_data ?? [];
        $itemsHtml = '';
        $hasMore = count($items) > 3;

        if (is_array($items) && !empty($items)) {
            foreach ($items as $index => $item) {
                $itemTitle = $item['title'] ?? 'Project';
                $itemDesc = $item['description'] ?? '';
                $itemImage = $item['image'] ?? 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800';
                $itemVideo = $item['video'] ?? '';
                $github = $item['github'] ?? '';
                $live = $item['live'] ?? '';

                $isHidden = $index >= 3 ? 'hidden extra-project' : '';

                $linksHtml = '';
                $linksHtml .= '<div class="mt-auto pt-6 flex gap-3 items-center flex-wrap">';
                if ($live) {
                    $linksHtml .= "<a href=\"$live\" target=\"_blank\" style=\"background-color: $btnBgColor; color: $btnTextColor;\" class=\"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold opacity-90 hover:opacity-100 transition-all\">Live Demo</a>";
                }
                if ($github) {
                    $linksHtml .= "<a href=\"$github\" target=\"_blank\" style=\"background-color: $githubBtnBg; color: $githubBtnText;\" class=\"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold opacity-90 hover:opacity-100 transition-all\"><svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'><path d='M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577v-2.234C5.662 21.23 4.967 19.007 4.967 19.007c-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604C6.145 18.74 3.8 17.876 3.8 13.42c0-1.28.457-2.328 1.207-3.15-.121-.297-.523-1.49.115-3.105 0 0 .984-.315 3.225 1.202a11.22 11.22 0 012.94-.396c.997.004 2.002.135 2.94.396 2.24-1.517 3.222-1.202 3.222-1.202.64 1.615.237 2.808.116 3.105.752.822 1.206 1.87 1.206 3.15 0 4.467-2.35 5.315-4.587 5.594.361.311.682.924.682 1.863v2.76c0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z'/></svg> Github</a>";
                }
                $linksHtml .= '</div>';

                $mediaUrl = $itemVideo ?: $itemImage;
                $isVideoFlag = $itemVideo ? 'true' : 'false';

                $itemsHtml .= "
                <div style=\"background-color: $cardBg; border-radius: $borderRadius;\" class=\"overflow-hidden $boxShadow h-full flex flex-col transition-all duration-500 $isHidden animate-fade-in hover:shadow-xl hover:-translate-y-1\">
                    <div class=\"relative overflow-hidden aspect-video bg-slate-100 group/media cursor-zoom-in\" 
                         onclick=\"openWorkLightbox('$mediaUrl', $isVideoFlag)\">
                        " . ($itemVideo ? "
                        <video src=\"$itemVideo\" class=\"absolute inset-0 w-full h-full object-cover\" muted loop autoplay playsinline></video>
                        " : "<img src=\"$itemImage\" alt=\"$itemTitle\" class=\"w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110\">") . "
                        <div class=\"absolute inset-0 bg-black/5 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center\">
                            <div class=\"w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white\">
                                <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\"/></svg>
                            </div>
                        </div>
                    </div>
                    <div class=\"p-7 flex-1 flex flex-col\">
                        <h3 style=\"color: $projectTitleColor;\" class=\"text-lg font-bold mb-2 tracking-tight truncate\">$itemTitle</h3>
                        <p style=\"color: $projectDescColor;\" class=\"text-sm leading-relaxed line-clamp-3 overflow-hidden opacity-80\">$itemDesc</p>
                        $linksHtml
                    </div>
                </div>";
            }
        }

        $gridClass = $layoutStyle === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1';
        $allProjectsUrl = route('work.all-projects', $work->id);
        $showAllBtn = $hasMore ? "
        <div class=\"mt-16 text-center\">
            <a href=\"$allProjectsUrl\" style=\"border: 2px solid $btnBgColor; color: $btnBgColor;\" class=\"inline-flex items-center gap-3 px-10 py-4 rounded-full text-lg font-bold hover:bg-opacity-10 transition-all group\">
                <span>Show all projects</span>
                <svg xmlns='http://www.w3.org/2000/svg' class='w-5 h-5 group-hover:translate-x-1 transition-transform' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='3'>
                    <path stroke-linecap='round' stroke-linejoin='round' d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' />
                </svg>
            </a>
        </div>
        " : "";

        return "
<section id=\"projects\" style=\"background-color: $bgColor; padding-top: $padding; padding-bottom: $padding;\" class=\"relative overflow-hidden font-sans\">
    <div class=\"max-w-7xl mx-auto px-6 relative z-10\">
        
        <div class=\"text-center mb-24\">
            <h2 style=\"color: $titleColor; font-size: $titleSize;\" class=\"font-black tracking-tight mb-6\">$title</h2>
            <div style=\"background-color: $accentLineColor;\" class=\"w-24 h-2 mx-auto rounded-full mb-8\"></div>
            " . ($subtitle ? "<p style='color: $subtitleColor;' class='text-xl max-w-2xl mx-auto font-medium'>$subtitle</p>" : "") . "
        </div>

        <div class=\"grid $gridClass\" style=\"gap: $gap;\">
            $itemsHtml
        </div>

        $showAllBtn

    </div>

    " . $this->getLightboxHtml() . "
</section>";
    }

    public function allProjects($id)
    {
        $work = Work::findOrFail($id);
        $hero = $work->hero;
        return view('work.all', compact('work', 'hero'));
    }
}
