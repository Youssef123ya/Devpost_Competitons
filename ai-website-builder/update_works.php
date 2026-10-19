<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = 0;
foreach (App\Models\Work::all() as $work) {
    if (!$work->generated_code) continue;
    $controller = app('App\Http\Controllers\WorkController');
    // Using reflection to call private method generateAiCode or getDefaultCode
    $reflection = new ReflectionClass(get_class($controller));
    $method = $reflection->getMethod('getDefaultCode');
    $method->setAccessible(true);
    $work->generated_code = $method->invokeArgs($controller, [$work]);
    $work->save();
    $count++;
}
echo "Updated $count work sections successfully.\n";
