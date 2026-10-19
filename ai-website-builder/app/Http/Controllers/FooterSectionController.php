<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FooterSection;
use App\Models\Hero;
use App\Models\Navbar;

class FooterSectionController extends Controller
{
    use \App\Http\Controllers\Traits\DeductsCredits;
    /**
     * Show the footer creation form.
     */
    public function create($heroId)
    {
        $hero = Hero::findOrFail($heroId);
        $navbar = Navbar::where('hero_id', $heroId)->first();
        $navbarLinks = $navbar && $navbar->links_data ? $navbar->links_data : [];

        // Check if footer already exists to pre-fill
        $footer = FooterSection::where('hero_id', $heroId)->first();

        return view('footer.create', compact('hero', 'navbarLinks', 'footer'));
    }

    /**
     * Store or Update the footer section from the initial form.
     */
    public function store(Request $request, $heroId)
    {
        $hero = Hero::findOrFail($heroId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slogan' => 'nullable|string',
            'links' => 'nullable|array',
            'social_links' => 'nullable|array',
            'styles' => 'nullable|array',
        ]);

        $footer = FooterSection::updateOrCreate(
            ['hero_id' => $heroId],
            [
                'title' => $validated['title'],
                'slogan' => $validated['slogan'] ?? '',
                'links' => $validated['links'] ?? [],
                'social_links' => $validated['social_links'] ?? [],
                'custom_styles' => $validated['styles'] ?? [],
            ]
        );

        // Clear generated code to trigger generation animation
        $footer->generated_code = null;
        $footer->save();

        return redirect()->route('footer.generate', $footer->id)->with('success', 'Footer section created successfully!');
    }

    /**
     * Show the preview and customization interface.
     */
    public function generate(\Illuminate\Http\Request $request, $id) {
        $footer = FooterSection::findOrFail($id);
        $navbar = Navbar::where('hero_id', $footer->hero_id)->first();
        $navbarLinks = $navbar && $navbar->links_data ? $navbar->links_data : [];
        $needsGeneration = empty($footer->generated_code);
        return view('footer.preview', compact('footer', 'navbarLinks', 'needsGeneration'));
    }

    public function generateCode(\Illuminate\Http\Request $request, $id) {
        $footer = FooterSection::findOrFail($id);
        if (!empty($footer->generated_code)) {
            return response()->json(['success' => true, 'code' => $footer->generated_code]);
        }
        $code = $this->renderHtml($footer);
        $footer->generated_code = $code;
        $footer->save();
        $this->deductCredits();
        return response()->json(['success' => true, 'code' => $code]);
    }

    /**
     * AJAX/Real-time update for design changes.
     */
    public function saveChanges(Request $request, $id)
    {
        $footer = FooterSection::findOrFail($id);

        $validated = $request->validate([
            'title'        => 'required|string',
            'slogan'       => 'nullable|string',
            'links'        => 'nullable|array',
            'social_links' => 'nullable|array',
            'styles'       => 'nullable|array',
            'html_code'    => 'nullable|string'
        ]);

        try {
            $currentStyles = $footer->custom_styles ?? [];
            $newStyles = array_merge($currentStyles, $validated['styles'] ?? []);

            $html = $validated['html_code'] ?? $this->renderHtml($footer);

            // Only update the database if preview_only is false or not provided
            if (!$request->input('preview_only')) {
                $footer->update([
                    'title'         => $validated['title'],
                    'slogan'        => $validated['slogan'] ?? $footer->slogan,
                    'links'         => $validated['links'] ?? $footer->links,
                    'social_links'  => $validated['social_links'] ?? $footer->social_links,
                    'custom_styles' => $newStyles,
                    'generated_code' => $html
                ]);
            } else {
                // If preview only, we still need to reflect the new data in the rendered HTML for the response
                $footer->title = $validated['title'];
                $footer->slogan = $validated['slogan'] ?? $footer->slogan;
                $footer->links = $validated['links'] ?? $footer->links;
                $footer->social_links = $validated['social_links'] ?? $footer->social_links;
                $footer->custom_styles = $newStyles;
                $html = $this->renderHtml($footer);
            }

            return response()->json([
                'success' => true,
                'message' => $request->input('preview_only') ? 'Preview updated' : 'Design updated successfully',
                'code'    => $html,
                'preview_html' => view('footer.preview-content', ['footer' => $footer])->render()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating design: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Regenerate via form submission.
     */
    public function regenerate(Request $request, $id)
    {
        $footer = FooterSection::findOrFail($id);
        $footer->generated_code = $this->renderHtml($footer);
        $footer->save();
        $this->deductCredits();

        return redirect()->back()->with('success', 'Section regenerated successfully!');
    }

    /**
     * Internal helper to render the HTML.
     */
    protected function renderHtml($footer)
    {
        return view('footer.preview-content', compact('footer'))->render();
    }
}
