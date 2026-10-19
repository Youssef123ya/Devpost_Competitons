<?php
$link = mysqli_connect('127.0.0.1', 'root', '', 'gen');
if (!$link) {
    echo "Error connecting to database: " . mysqli_connect_error();
    exit;
}

$result = mysqli_query($link, 'SELECT id, layout_style, background_image FROM heroes WHERE layout_style="split" AND background_image IS NOT NULL ORDER BY id DESC LIMIT 1');
$row = mysqli_fetch_assoc($result);

if ($row) {
    echo json_encode($row, JSON_PRETTY_PRINT);
} else {
    echo "No split layout hero with background image found";
}

mysqli_close($link);
?>
