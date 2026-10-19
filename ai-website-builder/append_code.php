<?php

$code = <<<EOT

    public function fullPreview(\$heroId)
    {
        \$hero = Hero::with(['navbar', 'skillSection', 'serviceSection', 'whyChooseUs', 'work'])->findOrFail(\$heroId);
        return view('website.preview', compact('hero'));
    }

    // Export loading page
    public function exportLoading(\$heroId)
    {
        \$hero = Hero::findOrFail(\$heroId);
        return view('website.export-loading', compact('hero'));
    }

    // Download Laravel project
    public function downloadProject(\$heroId)
    {
        \$hero = Hero::with(['navbar', 'skillSection', 'serviceSection', 'whyChooseUs', 'work', 'contactSection', 'footerSection'])->findOrFail(\$heroId);
        
        \$html = view('website.preview', compact('hero'))->render();
        
        // Remove builder-specific UI elements from the exported HTML
        \$html = preg_replace('/<!-- Back Button -->.*?<\/a>/s', '', \$html);
        \$html = preg_replace('/<!-- Download Laravel Project Button -->.*?<\/a>/s', '', \$html);
        \$html = preg_replace('/<!-- "Ready to add more\?" Section -->.*?(?=<\/body>)/s', '', \$html);

        \$zipFileName = 'laravel-project-' . \$heroId . '-' . time() . '.zip';
        \$zipFilePath = storage_path('app/' . \$zipFileName);
        
        \$zip = new \ZipArchive();
        if (\$zip->open(\$zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            \$zip->addFromString('routes/web.php', "<?php\n\nuse Illuminate\Support\Facades\Route;\n\nRoute::get('/', function () {\n    return view('welcome');\n});\n");
            \$zip->addFromString('resources/views/welcome.blade.php', \$html);
            \$zip->addFromString('README.md', "# Laravel Export\n\nThis is a minimal export of your AI-generated website as a Laravel project.\n\n1. Replace your `resources/views/welcome.blade.php` with the one provided.\n2. Ensure you have Tailwind CSS included in your project if it's not already using CDN.\n");
            \$zip->close();
            
            return response()->download(\$zipFilePath)->deleteFileAfterSend(true);
        }
        
        return response()->json(['success' => false, 'message' => 'Could not create zip archive']);
    }

    // Contact page
    public function contactPage(\$heroId)
    {
        \$hero = Hero::with(['contactSection', 'footerSection', 'navbar'])->findOrFail(\$heroId);
        return view('website.contact', compact('hero'));
    }
}
EOT;

file_put_contents('app/Http/Controllers/HeroController.php', $code, FILE_APPEND);
