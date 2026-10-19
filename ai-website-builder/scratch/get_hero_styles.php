<?php
$link = mysqli_connect('127.0.0.1', 'root', '', 'gen');
if ($link) {
    $res = mysqli_query($link, 'SELECT id, custom_styles, generated_code FROM heroes WHERE id IN (36, 37)');
    while($row = mysqli_fetch_assoc($res)) {
        echo "ID: " . $row['id'] . "\n";
        echo "CUSTOM STYLES:\n";
        print_r(json_decode($row['custom_styles'], true));
        echo "\nGENERATED CODE PREVIEW:\n";
        echo substr($row['generated_code'], 0, 500) . "\n";
        echo "====================================\n";
    }
    mysqli_close($link);
}
