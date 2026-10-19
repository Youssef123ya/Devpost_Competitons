<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FullWebsite;
use App\Http\Controllers\FullWebsiteController;
use Illuminate\Support\Facades\Log;

class PromptController extends Controller
{
    public function showForm()
    {
        return view('create_with_prompt');
    }

    public function submit(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:2000',
        ]);

        $prompt = $request->input('prompt');

        // Create a FullWebsite record (product_image optional)
        $fullWebsite = FullWebsite::create([
            'user_id' => auth()->id() ?? 1,
            'prompt' => $prompt,
            'product_image' => null,
            'generated_code' => null
        ]);

        try {
            // Reuse existing generation logic from FullWebsiteController
            $generator = new FullWebsiteController();
            $generatedCode = $generator->generateWebsiteWithAI($fullWebsite);

            if ($generatedCode) {
                $fullWebsite->update(['generated_code' => $generatedCode]);
                if (auth()->check()) {
                    return redirect()->route('full-website.preview', $fullWebsite->id)
                                     ->with('success', 'Website generated successfully.');
                }

                // Unauthenticated users: return a quick-preview page showing the generated HTML
                return response($generatedCode);
            }
        } catch (\Exception $e) {
            Log::error('PromptController generation error: ' . $e->getMessage());
        }

        // Fallback: show create page with mock preview if generation failed
        $generated = $this->generateFakeAi($prompt);
        return view('create_with_prompt', compact('prompt', 'generated'));
    }

    private function generateFakeAi(string $prompt): string
    {
        $title = strlen($prompt) > 60 ? substr($prompt, 0, 57) . '...' : $prompt;
        $escaped = e($prompt);

        $html = "<section class=\"p-6 bg-white border rounded-lg shadow-sm mt-6\">";
        $html .= "<h2 class=\"text-2xl font-bold mb-3\">Generated Hero: " . e($title) . "</h2>";
        $html .= "<p class=\"text-sm text-slate-600 mb-4\">This is a mock AI-generated hero section based on your prompt.</p>";
        $html .= "<div class=\"p-6 bg-indigo-50 rounded-lg\">";
        $html .= "<h3 class=\"text-xl font-extrabold text-indigo-700\">" . e(ucfirst(strip_tags($title))) . "</h3>";
        $html .= "<p class=\"text-slate-700 mt-2\">" . $escaped . "</p>";
        $html .= "<div class=\"mt-4\"><a href=\"#\" class=\"inline-block px-5 py-3 bg-indigo-600 text-white rounded-full\">Visit Website</a></div>";
        $html .= "</div></section>";

        return $html;
    }
}
