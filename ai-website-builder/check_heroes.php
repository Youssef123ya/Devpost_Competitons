<?php
$link = mysqli_connect('127.0.0.1', 'root', '', 'gen');
if (!$link) {
    echo "Error connecting to database: " . mysqli_connect_error();
    exit;
}

$result = mysqli_query($link, 'SELECT id, layout_style, background_image, generated_code FROM heroes WHERE layout_style="split" AND background_image IS NOT NULL ORDER BY id DESC LIMIT 5');

while ($row = mysqli_fetch_assoc($result)) {
    echo "ID: " . $row['id'] . " | Layout: " . $row['layout_style'] . " | Code Length: " . strlen($row['generated_code'] ?? '') . "\n";
}

mysqli_close($link);
?>
