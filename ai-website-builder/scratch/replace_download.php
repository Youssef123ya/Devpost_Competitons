<?php

$path = __DIR__ . '/../app/Http/Controllers/HeroController.php';
$content = file_get_contents($path);

// We want to replace everything from "public function downloadProject(" to the end of the class.
// Since the class ends with "}", we can use a regex or string manipulation.
$startPos = strpos($content, '    public function downloadProject(');
if ($startPos === false) die("Could not find downloadProject\n");

// Find the last "}" which closes the class
$endPos = strrpos($content, '}');

$newMethod = <<<PHP
    public function downloadProject(\Illuminate\Http\Request \$request, \$heroId)
    {
        \$hero = \App\Models\Hero::findOrFail(\$heroId);

        \$adminName = \$request->input('admin_name', 'Admin');
        \$adminEmail = \$request->input('admin_email', 'admin@example.com');
        \$adminPassword = \$request->input('admin_password', '12345678');

        \$zipFileName = 'my-portfolio-' . \$heroId . '-' . time() . '.zip';
        \$zipFilePath = storage_path('app/' . \$zipFileName);
        \$baseZip = storage_path('app/laravel-base.zip');

        if (file_exists(\$baseZip)) {
            copy(\$baseZip, \$zipFilePath);
        }

        \$zip = new \ZipArchive();
        if (file_exists(\$zipFilePath)) {
            \$result = \$zip->open(\$zipFilePath);
        } else {
            \$result = \$zip->open(\$zipFilePath, \ZipArchive::CREATE);
        }
        if (\$result !== TRUE) {
            return response()->json(['success' => false, 'message' => 'Could not open zip archive']);
        }

        \$zip->addFromString('database/database.sqlite', '');

        \$seeder = "<?php\\n\\nnamespace Database\Seeders;\\n\\nuse Illuminate\Database\Seeder;\\nuse Illuminate\Support\Facades\DB;\\nuse Illuminate\Support\Facades\Hash;\\n\\nclass DatabaseSeeder extends Seeder\\n{\\n    public function run()\\n    {\\n";
        \$seeder .= "        DB::table('users')->insert([\\n";
        \$seeder .= "            'name' => '" . addslashes(\$adminName) . "',\\n";
        \$seeder .= "            'email' => '" . addslashes(\$adminEmail) . "',\\n";
        \$seeder .= "            'password' => Hash::make('" . addslashes(\$adminPassword) . "'),\\n";
        \$seeder .= "        ]);\\n\\n";

        \$heroArr = (array) \$hero->toArray();
        \$heroArr['id'] = 1;
        \$heroArr['user_id'] = 1;
        \$seeder .= "        DB::table('heroes')->insert(" . var_export(\$heroArr, true) . ");\\n\\n";

        \$tables = ['navbars', 'about_sections', 'service_sections', 'why_choose_us', 'work', 'skill_sections', 'contact_sections', 'footer_sections'];

        foreach (\$tables as \$table) {
            if (!\Illuminate\Support\Facades\Schema::hasTable(\$table)) continue;
            \$rows = \Illuminate\Support\Facades\DB::table(\$table)->where('hero_id', \$heroId)->get();
            foreach (\$rows as \$row) {
                \$rowArr = (array) \$row;
                unset(\$rowArr['id']);
                \$rowArr['hero_id'] = 1;
                \$seeder .= "        DB::table('\$table')->insert(" . var_export(\$rowArr, true) . ");\\n\\n";
            }
        }
        \$seeder .= "    }\\n}\\n";

        \$zip->addFromString('database/seeders/DatabaseSeeder.php', \$seeder);

        \$envContent = "APP_NAME=\"My Portfolio\"\\nAPP_ENV=local\\nAPP_KEY=base64:" . base64_encode(random_bytes(32)) . "\\nAPP_DEBUG=true\\nAPP_URL=http://localhost:8000\\n\\nDB_CONNECTION=sqlite\\n\\nSESSION_DRIVER=file\\nSESSION_LIFETIME=120\\n";
        \$zip->addFromString('.env', \$envContent);

        // Override routes/web.php
        \$webPhp = \$zip->getFromName('routes/web.php');
        if (\$webPhp) {
            \$overrideRoute = "\\n\\n// --- EXPORTED PORTFOLIO ROUTE ---\\nRoute::get('/', function () {\\n    \$heroId = 1;\\n    \$hero = \App\Models\Hero::with([\\n        'navbars', 'aboutSections', 'serviceSections',\\n        'whyChooseUs', 'work', 'skills',\\n        'contactSections', 'footerSections'\\n    ])->findOrFail(\$heroId);\\n\\n    return view('full-website.preview', [\\n        'hero' => \$hero,\\n        'fullWebsite' => null,\\n        'navbars' => \$hero->navbars,\\n        'aboutSections' => \$hero->aboutSections,\\n        'servicesSections' => \$hero->serviceSections,\\n        'whyChooseUs' => \$hero->whyChooseUs,\\n        'work' => \$hero->work,\\n        'skills' => \$hero->skills,\\n        'contactSections' => \$hero->contactSections,\\n        'footerSections' => \$hero->footerSections\\n    ]);\\n});\\n";
            \$zip->addFromString('routes/web.php', \$webPhp . \$overrideRoute);
        }

        \$zip->close();

        return response()->json([
            'success' => true,
            'download_url' => url('/storage/' . \$zipFileName)
        ]);
    }
}
PHP;

$newContent = substr($content, 0, $startPos) . $newMethod;

file_put_contents($path, $newContent);
echo "Replaced downloadProject method\n";

