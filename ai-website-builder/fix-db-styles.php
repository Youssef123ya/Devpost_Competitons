<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$heroes = App\Models\Hero::all();
foreach($heroes as $h) {
    if ($h->generated_code) {
        $code = $h->generated_code;
        // Clean up the style block and any trailing '>' or '&gt;'
        $code = preg_replace('/<style\s+id="hero-custom-styles">.*?<\/style>\s*&gt;/is', '', $code);
        $code = preg_replace('/<style\s+id="hero-custom-styles">.*?<\/style>\s*>/is', '', $code);
        $code = preg_replace('/<style\s+id="hero-custom-styles">.*?<\/style>\s*/is', '', $code);
        $code = preg_replace('/(<\s*section[^>]*hero[^>]*>)\s*>/i', '$1', $code);
        $code = str_replace('&gt;', '', $code);
        $h->update(['generated_code' => $code]);
        echo "Cleaned hero " . $h->id . "\n";
    }
}
