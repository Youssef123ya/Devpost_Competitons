<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$heroes = App\Models\Hero::all();
foreach ($heroes as $hero) {
    if (!$hero->generated_code) continue;
    $code = $hero->generated_code;
    $code = preg_replace('/<div class="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative group hero-preview-wrapper">.*?<div class="w-full h-full overflow-y-auto custom-scrollbar hero-preview-content">/s', '', $code);
    $code = preg_replace('/<\/div>\s*<\/div>\s*$/s', '', $code);
    $hero->update(['generated_code' => trim($code)]);
}
echo "DB Fixed!\n";
