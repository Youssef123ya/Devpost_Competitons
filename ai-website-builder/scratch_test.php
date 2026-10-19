<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$request = new \Illuminate\Http\Request(['admin_name' => 'Test', 'admin_email' => 'test@test.com', 'admin_password' => '12345678']);
$controller = new \App\Http\Controllers\HeroController();

$userRow = DB::table('users')->first();
if (!$userRow) {
	echo json_encode(['success' => false, 'message' => 'No users in DB for scratch test']);
	exit(1);
}

$user = \App\Models\User::find($userRow->id);
auth()->setUser($user);

$hero = DB::table('heroes')->where('user_id', $userRow->id)->first();
if (!$hero) {
	echo json_encode(['success' => false, 'message' => 'No hero records in DB for scratch test for this user']);
	exit(1);
}

$response = $controller->downloadProject($request, $hero->id);
echo $response->getContent();
