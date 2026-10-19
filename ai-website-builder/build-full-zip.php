<?php
echo "Building full zip (base + vendor) - this may take a few minutes...\n";
$fullZipPath = 'storage/app/laravel-full-base.zip';

// First, make sure laravel-base.zip is up to date
$zip = new ZipArchive();
if ($zip->open($fullZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    die("Cannot open $fullZipPath\n");
}

$dir = new RecursiveDirectoryIterator('.');
$iter = new RecursiveIteratorIterator($dir, RecursiveIteratorIterator::LEAVES_ONLY);

$count = 0;
foreach ($iter as $file) {
    if (!$file->isFile()) continue;

    $path = $file->getPathname();
    $path = str_replace('.\\', '', $path);
    $path = str_replace('./', '', $path);
    
    // Ignore heavy non-essential folders, but KEEP vendor/
    if (preg_match('/^(storage|node_modules|\.git|\.env)/i', $path)) continue;
    // Don't include build scripts
    if ($path === 'build-zip.php' || $path === 'build-full-zip.php') continue;

    $zip->addFile($file->getPathname(), $path);
    $count++;
    if ($count % 1000 === 0) {
        echo "Added $count files...\n";
    }
}

$zip->close();
echo "Done! Total $count files added. Rebuilt laravel-full-base.zip!\n";
