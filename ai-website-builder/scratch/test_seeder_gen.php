<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$heroId = 120; // Change to test with another hero

$seeder = "<?php\n\nnamespace Database\Seeders;\n\nuse Illuminate\Database\Seeder;\nuse Illuminate\Support\Facades\DB;\nuse Illuminate\Support\Facades\Hash;\n\nclass DatabaseSeeder extends Seeder\n{\n    public function run()\n    {\n";
$seeder .= "        DB::table('users')->insert([\n";
$seeder .= "            'name' => 'Admin',\n";
$seeder .= "            'email' => 'admin@admin.com',\n";
$seeder .= "            'password' => Hash::make('password'),\n";
$seeder .= "        ]);\n\n";

$hero = DB::table('heroes')->where('id', $heroId)->first();
if (!$hero) die("Hero not found\n");

// Export Hero
$heroArr = (array) $hero;
$heroArr['id'] = 1;
$heroArr['user_id'] = 1; // Link to new admin
$seeder .= "        DB::table('heroes')->insert(" . var_export($heroArr, true) . ");\n\n";

// Tables that link to hero_id
$tables = [
    'navbars',
    'about_sections',
    'service_sections',
    'why_choose_us',
    'work',
    'skill_sections',
    'contact_sections',
    'footer_sections'
];

foreach ($tables as $table) {
    if (!Schema::hasTable($table)) continue;
    $rows = DB::table($table)->where('hero_id', $heroId)->get();
    foreach ($rows as $row) {
        $rowArr = (array) $row;
        $rowArr['id'] = 1; // Since there is only 1 per table usually, or just remove ID to auto-increment
        unset($rowArr['id']); // Let it auto increment
        $rowArr['hero_id'] = 1;
        $seeder .= "        DB::table('$table')->insert(" . var_export($rowArr, true) . ");\n\n";
    }
}

$seeder .= "    }\n}\n";

file_put_contents(__DIR__ . '/DatabaseSeeder.stub', $seeder);
echo "Done generating DatabaseSeeder.stub\n";
