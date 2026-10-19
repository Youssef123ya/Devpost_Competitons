<?php

$baseDir = __DIR__ . '/storage/app/laravel-base';
$outputZip = __DIR__ . '/storage/app/laravel-base.zip';

if (!is_dir($baseDir)) {
    echo "ERROR: Base directory $baseDir does not exist\n";
    exit(1);
}

if (file_exists($outputZip)) {
    unlink($outputZip);
    echo "Removed old laravel-base.zip\n";
}

$zip = new ZipArchive();
if ($zip->open($outputZip, ZipArchive::CREATE) !== TRUE) {
    echo "ERROR: Could not create zip file\n";
    exit(1);
}

// Add empty storage folders manually to ensure they exist
$zip->addEmptyDir('storage');
$zip->addEmptyDir('storage/app');
$zip->addEmptyDir('storage/app/public');
$zip->addEmptyDir('storage/framework');
$zip->addEmptyDir('storage/framework/cache');
$zip->addEmptyDir('storage/framework/sessions');
$zip->addEmptyDir('storage/framework/views');
$zip->addEmptyDir('storage/logs');
$zip->addEmptyDir('bootstrap/cache');

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

$count = 0;
foreach ($iterator as $file) {
    $filePath = $file->getRealPath();
    $relativePath = substr($filePath, strlen($baseDir) + 1);
    $relativePath = str_replace('\\', '/', $relativePath);

    if ($file->isDir()) {
        $zip->addEmptyDir($relativePath);
    } else {
        $zip->addFile($filePath, $relativePath);
        $count++;
    }
}

$zip->close();
echo "Done! Created laravel-base.zip with $count files\n";
echo "Output: $outputZip\n";
