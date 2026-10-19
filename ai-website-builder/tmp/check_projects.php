<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Work;
use App\Http\Controllers\WorkController;

$work = Work::find(49);
if ($work) {
    $controller = new WorkController();
    $reflection = new ReflectionClass(WorkController::class);
    $method = $reflection->getMethod('getDefaultCode');
    $method->setAccessible(true);
    
    $html = $method->invoke($controller, $work);
    $work->generated_code = $html;
    $work->save();
    echo "Regenerated code for Work 49.\n";
}
