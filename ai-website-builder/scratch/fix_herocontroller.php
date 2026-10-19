<?php
$path = __DIR__ . '/../app/Http/Controllers/HeroController.php';
$content = file_get_contents($path);

// Find the first occurrence of the method
$pos = strpos($content, '    // Download Laravel project');
if ($pos === false) die("Could not find method\n");

// Take everything before the method
$before = substr($content, 0, $pos);

// Ensure the class was closed before $pos (look for the comment in proper code)
// New method:
$method = <<<'PHP'
    // Download Laravel project

    public function downloadProject(\Illuminate\Http\Request $request, $heroId)
    {
        $hero = \App\Models\Hero::findOrFail($heroId);

        $adminName     = $request->input('admin_name', 'Admin');
        $adminEmail    = $request->input('admin_email', 'admin@example.com');
        $adminPassword = $request->input('admin_password', '12345678');

        // Delete old generated zips to free disk space
        foreach (glob(storage_path('app/my-portfolio-*.zip')) as $f) @unlink($f);
        foreach (glob(storage_path('app/public/my-portfolio-*.zip')) as $f) @unlink($f);

        // Write directly to public storage so it's accessible via URL
        $zipFileName = 'my-portfolio-' . $heroId . '-' . time() . '.zip';
        $zipFilePath = storage_path('app/public/' . $zipFileName);
        $baseZip     = storage_path('app/laravel-base.zip');

        if (file_exists($baseZip)) copy($baseZip, $zipFilePath);

        $zip = new \ZipArchive();
        $result = file_exists($zipFilePath) ? $zip->open($zipFilePath) : $zip->open($zipFilePath, \ZipArchive::CREATE);
        if ($result !== TRUE) {
            return response()->json(['success' => false, 'message' => 'Could not open zip archive']);
        }

        // Empty SQLite database file
        $zip->addFromString('database/database.sqlite', '');

        // Build DatabaseSeeder with user data
        $now = date('Y-m-d H:i:s');
        $seeder  = "<?php\n\nnamespace Database\Seeders;\n\nuse Illuminate\Database\Seeder;\nuse Illuminate\Support\Facades\DB;\nuse Illuminate\Support\Facades\Hash;\n\nclass DatabaseSeeder extends Seeder\n{\n    public function run()\n    {\n";
        $seeder .= "        DB::table('users')->insert([\n";
        $seeder .= "            'name'       => '" . addslashes($adminName) . "',\n";
        $seeder .= "            'email'      => '" . addslashes($adminEmail) . "',\n";
        $seeder .= "            'password'   => Hash::make('" . addslashes($adminPassword) . "'),\n";
        $seeder .= "            'created_at' => '$now',\n";
        $seeder .= "            'updated_at' => '$now',\n";
        $seeder .= "        ]);\n\n";

        // Hero record
        $heroArr = \Illuminate\Support\Facades\DB::table('heroes')->where('id', $heroId)->first();
        if ($heroArr) {
            $heroArr = (array) $heroArr;
            $heroArr['id'] = 1;
            $heroArr['user_id'] = 1;
            $seeder .= "        DB::table('heroes')->insert(" . var_export($heroArr, true) . ");\n\n";
        }

        // All section tables
        $tables = ['navbars', 'about_sections', 'service_sections', 'why_choose_us', 'work', 'skill_sections', 'contact_sections', 'footer_sections'];
        foreach ($tables as $table) {
            if (!\Illuminate\Support\Facades\Schema::hasTable($table)) continue;
            $rows = \Illuminate\Support\Facades\DB::table($table)->where('hero_id', $heroId)->get();
            foreach ($rows as $row) {
                $rowArr = (array) $row;
                unset($rowArr['id']);
                $rowArr['hero_id'] = 1;
                $seeder .= "        DB::table('$table')->insert(" . var_export($rowArr, true) . ");\n\n";
            }
        }
        $seeder .= "    }\n}\n";

        $zip->addFromString('database/seeders/DatabaseSeeder.php', $seeder);

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

        // Override '/' route to show portfolio
        $webPhp = $zip->getFromName('routes/web.php');
        if ($webPhp) {
            $portfolioRoute  = "\n\n// --- PORTFOLIO HOMEPAGE (exported) ---\n";
            $portfolioRoute .= "Route::get('/', function () {\n";
            $portfolioRoute .= "    \$hero = \\App\\Models\\Hero::with(['navbar', 'skillSection', 'serviceSection', 'whyChooseUs', 'work', 'contactSection', 'footerSection'])->firstOrFail();\n";
            $portfolioRoute .= "    return view('website.preview', compact('hero'));\n";
            $portfolioRoute .= "})->name('home');\n";

            $webPhp = preg_replace("/Route::get\('\/'\s*,\s*function\s*\(\)\s*\{[^}]*return\s+view\('welcome'\);[^}]*\}\);/s", '', $webPhp);
            $zip->addFromString('routes/web.php', $webPhp . $portfolioRoute);
        }

        // README
        $readme  = "# My Portfolio - Laravel Project\n\n## Quick Setup\n\n";
        $readme .= "1. Install: `composer install`\n";
        $readme .= "2. Migrate & seed: `php artisan migrate --seed`\n";
        $readme .= "3. Storage: `php artisan storage:link`\n";
        $readme .= "4. Serve: `php artisan serve`\n";
        $readme .= "5. Visit: http://localhost:8000\n\n";
        $readme .= "**Admin:** http://localhost:8000/login  |  " . $adminEmail . " / " . $adminPassword . "\n";
        $zip->addFromString('README.md', $readme);

        $zip->close();

        return response()->json([
            'success'      => true,
            'download_url' => asset('storage/' . $zipFileName)
        ]);
    }
}
PHP;

$newContent = $before . $method . "\n";
file_put_contents($path, $newContent);
echo "Done! File rewritten successfully.\n";
echo "Lines: " . count(file($path)) . "\n";

