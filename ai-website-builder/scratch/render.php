<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$html = view('hero.preview', ['hero' => App\Models\Hero::find(15), 'needsGeneration' => false])->render();
file_put_contents('scratch/rendered.html', $html);
echo "Rendered\n";
