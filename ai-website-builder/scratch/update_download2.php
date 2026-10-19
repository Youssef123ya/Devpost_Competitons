<?php
$file = 'app/Http/Controllers/HeroController.php';
$content = file_get_contents($file);

$newMethod = <<<'PHP'
    public function downloadProject(\Illuminate\Http\Request $request, $heroId)
    {
        $hero = \App\Models\Hero::with(['navbar', 'skillSection', 'serviceSection', 'whyChooseUs', 'work', 'contactSection', 'footerSection'])->findOrFail($heroId);

        $adminName = $request->input('admin_name', 'Admin');
        $adminEmail = $request->input('admin_email', 'admin@example.com');
        $adminPassword = $request->input('admin_password', '12345678');

        $zipFileName = 'my-portfolio-' . $heroId . '-' . time() . '.zip';
        $zipFilePath = storage_path('app/' . $zipFileName);
        $baseZip = storage_path('app/laravel-base.zip');

        if (file_exists($baseZip)) {
            copy($baseZip, $zipFilePath);
        }

        $zip = new \ZipArchive();
        if (file_exists($zipFilePath)) {
            $result = $zip->open($zipFilePath);
        } else {
            $result = $zip->open($zipFilePath, \ZipArchive::CREATE);
        }
        if ($result !== TRUE) {
            return response()->json(['success' => false, 'message' => 'Could not open zip archive']);
        }

        $zip->addFromString('database/database.sqlite', '');

        $adminSeederContent = <<<CODE
<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => '{$adminEmail}'],
            [
                'name' => '{$adminName}',
                'password' => Hash::make('{$adminPassword}'),
            ]
        );
    }
}
CODE;
        $zip->addFromString('database/seeders/AdminSeeder.php', $adminSeederContent);

        $sectionsCode = "<?php\n\nnamespace Database\Seeders;\n\nuse Illuminate\Database\Seeder;\nuse App\Models\Section;\n\nclass SectionSeeder extends Seeder\n{\n    public function run(): void\n    {\n";
        
        $order = 1;
        $generateSection = function($type, $model, $settingsMap) use (&$sectionsCode, &$order) {
            if (!$model) return;
            
            $html = $model->generated_code ?? '';
            // For hero section, prepend background style if exists
            if ($type === 'hero' && (!empty($model->custom_styles) || !empty($model->background_image))) {
                $hStyles = is_string($model->custom_styles) ? json_decode($model->custom_styles, true) : $model->custom_styles;
                $hBg = $model->background_image;
                $styleBlock = "<style>";
                if(!empty($hStyles['title_color'])) $styleBlock .= ".hero-title.hero-title { color: {$hStyles['title_color']} !important; } ";
                if(!empty($hStyles['subtitle_color'])) $styleBlock .= ".hero-subtitle.hero-subtitle { color: {$hStyles['subtitle_color']} !important; } ";
                if(!empty($hStyles['description_color'])) $styleBlock .= ".hero-description.hero-description { color: {$hStyles['description_color']} !important; } ";
                if(!empty($hStyles['button_bg_color']) || !empty($hStyles['button_text_color'])) {
                    $styleBlock .= ".hero-button.hero-button, .hero-cta-2.hero-cta-2, .hero-cta-3.hero-cta-3 {";
                    if(!empty($hStyles['button_bg_color'])) $styleBlock .= "background-color: {$hStyles['button_bg_color']} !important; ";
                    if(!empty($hStyles['button_text_color'])) $styleBlock .= "color: {$hStyles['button_text_color']} !important; ";
                    $styleBlock .= "} ";
                }
                if(!empty($hStyles['bg_color'])) $styleBlock .= ".hero.hero, .hero-bg.hero-bg { background-color: {$hStyles['bg_color']} !important; } ";
                if($hBg && $model->layout_style !== 'split') {
                    $bgUrl = str_starts_with($hBg, 'http') ? $hBg : '/storage/' . ltrim($hBg, '/');
                    $styleBlock .= ".hero.hero { background-image: url('{$bgUrl}') !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }";
                }
                $styleBlock .= "</style>";
                $html = $styleBlock . "\n" . $html;
            }

            $html = preg_replace('/<button[^>]*class="[^"]*edit-section-btn[^"]*"[^>]*>.*?<\/button>/is', '', $html);
            $html = preg_replace('/<div[^>]*class="[^"]*edit-overlay[^"]*"[^>]*>.*?<\/div>/is', '', $html);
            $html = preg_replace('/<div[^>]*class="[^"]*editor-toolbar[^"]*"[^>]*>.*?<\/div>/is', '', $html);
            
            $settings = [];
            foreach ($settingsMap as $newKey => $oldKey) {
                if (in_array($oldKey, ['projects', 'skills', 'services', 'features', 'social_links', 'footer_links', 'links'])) {
                    $settings[$newKey] = is_string($model->$oldKey) ? json_decode($model->$oldKey, true) : $model->$oldKey;
                } else {
                    $settings[$newKey] = $model->$oldKey ?? '';
                }
            }

            $settingsJson = var_export($settings, true);
            $htmlBase64 = base64_encode($html);

            $sectionsCode .= <<<CODE
        Section::updateOrCreate(
            ['type' => '{$type}'],
            [
                'order' => {$order},
                'settings' => {$settingsJson},
                'html' => base64_decode('{$htmlBase64}')
            ]
        );

CODE;
            $order++;
        };

        $generateSection('navbar', $hero->navbar, ['brand_name' => 'brand_name', 'links' => 'links']);
        $generateSection('hero', $hero, ['title' => 'title', 'subtitle' => 'subtitle', 'description' => 'description', 'cta_text' => 'cta_text', 'cta_url' => 'cta_url', 'bg_color' => 'bg_color', 'title_color' => 'title_color', 'subtitle_color' => 'subtitle_color', 'button_bg_color' => 'button_bg_color']);
        $generateSection('skills', $hero->skillSection, ['title' => 'title', 'skills' => 'skills']);
        $generateSection('services', $hero->serviceSection, ['title' => 'title', 'services' => 'services']);
        $generateSection('why_choose_us', $hero->whyChooseUs, ['title' => 'title', 'subtitle' => 'subtitle', 'features' => 'features']);
        $generateSection('work', $hero->work, ['title' => 'title', 'projects' => 'projects']);
        $generateSection('contact', $hero->contactSection, ['title' => 'title', 'email' => 'email', 'phone' => 'phone', 'location' => 'location', 'socials' => 'social_links']);
        $generateSection('footer', $hero->footerSection, ['brand_name' => 'brand_name', 'tagline' => 'tagline', 'copyright' => 'copyright_text', 'links' => 'footer_links']);

        $sectionsCode .= "    }\n}\n";
        $zip->addFromString('database/seeders/SectionSeeder.php', $sectionsCode);

        $envBase = storage_path('app/laravel-base/.env.example');
        $envContent = file_exists($envBase) ? file_get_contents($envBase) : '';
        $envContent = preg_replace('/SESSION_DRIVER=.*/', 'SESSION_DRIVER=file', $envContent);
        if (!str_contains($envContent, 'SESSION_DRIVER=')) {
            $envContent .= "\nSESSION_DRIVER=file";
        }
        $zip->addFromString('.env', $envContent);

        $readmeContent = <<<README
# My Full-Stack AI Portfolio

## How to run

1. Make sure you have **PHP 8.2+** installed.
2. Open terminal inside this folder.
3. Install dependencies (if vendor folder is not present):
   \`\`\`
   composer install
   \`\`\`
4. Generate the app key:
   \`\`\`
   php artisan key:generate
   \`\`\`
5. Migrate and Seed the database:
   \`\`\`
   php artisan migrate --seed
   \`\`\`
6. Start the development server:
   \`\`\`
   php artisan serve
   \`\`\`
7. Open your browser at: http://localhost:8000
8. To access the admin dashboard, go to http://localhost:8000/login and use your created credentials.

Your portfolio is ready! 🚀
README;
        $zip->addFromString('README.md', $readmeContent);

        $zip->close();

        return response()->download($zipFilePath, 'my-portfolio.zip')->deleteFileAfterSend(true);
    }
PHP;

$pattern = '/\s*public function downloadProject\([^\)]*\)\s*\{.*?\n    \}\n/s';
$content = preg_replace($pattern, "\n\n" . $newMethod . "\n\n", $content, 1, $count);

if ($count > 0) {
    file_put_contents($file, $content);
    echo "Successfully updated downloadProject method.\n";
} else {
    echo "Failed to replace method. Length of file: " . strlen($content) . "\n";
}
