<?php
$z = new ZipArchive();
$path = __DIR__ . '/storage/app/laravel-base.zip';
if ($z->open($path) === TRUE) {
    echo "OPEN_OK\n";
    for ($i = 0; $i < $z->numFiles; $i++) {
        echo $z->getNameIndex($i) . "\n";
    }
    $z->close();
} else {
    echo "OPEN_FAIL\n";
}
