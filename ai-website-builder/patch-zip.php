<?php
// Patch HeroController.php inside the existing laravel-full-base.zip
// instead of rebuilding the entire zip

$fullZip = 'storage/app/laravel-full-base.zip';

if (!file_exists($fullZip)) {
    die("laravel-full-base.zip not found! Please run build-full-zip.php first.\n");
}

$zip = new ZipArchive();
if ($zip->open($fullZip) !== TRUE) {
    die("Cannot open $fullZip\n");
}

// Read the current HeroController from the live filesystem (the correct version)
$heroControllerPath = 'app\\Http\\Controllers\\HeroController.php';
$liveContent = file_get_contents($heroControllerPath);

if (!$liveContent) {
    die("Cannot read $heroControllerPath from disk\n");
}

// Update the file inside the zip
$zip->addFromString($heroControllerPath, $liveContent);
$zip->close();

echo "Patched HeroController.php inside laravel-full-base.zip successfully!\n";

// Verify
$zip2 = new ZipArchive();
$zip2->open($fullZip);
$content = $zip2->getFromName($heroControllerPath);
$zip2->close();

if (strpos($content, 'destroyAll') !== false && strpos($content, "auth()->id())->delete()") !== false) {
    echo "Verification PASSED: destroyAll() is complete and correct in the zip.\n";
} else {
    echo "WARNING: Verification failed - destroyAll may still be broken in the zip!\n";
    $lines = explode("\n", $content);
    $lastLines = array_slice($lines, -10);
    echo implode("\n", $lastLines);
}
