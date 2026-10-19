<?php
$zip = new ZipArchive();
$zip->open('storage/app/laravel-base.zip', ZipArchive::CREATE | ZipArchive::OVERWRITE);
$dir = new RecursiveDirectoryIterator('.');
$iter = new RecursiveIteratorIterator($dir);
foreach ($iter as $file) {
    $path = $file->getPathname();
    $path = str_replace('.\\', '', $path);
    $path = str_replace('./', '', $path);
    if (preg_match('/^(storage|vendor|node_modules|\.git|\.env)/i', $path)) continue;
    if ($file->isFile() && $file->getFilename() !== 'build-zip.php') {
        $zip->addFile($file->getPathname(), $path);
    }
}
$zip->close();
echo "Rebuilt laravel-base.zip!\n";
