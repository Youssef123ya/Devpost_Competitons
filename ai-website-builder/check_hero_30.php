<?php
$link = mysqli_connect('127.0.0.1', 'root', '', 'gen');
if (!$link) {
    echo "Error connecting to database: " . mysqli_connect_error();
    exit;
}

$result = mysqli_query($link, 'SELECT id, layout_style, background_image, generated_code FROM heroes WHERE id=30 LIMIT 1');
$row = mysqli_fetch_assoc($result);

if ($row) {
    echo "ID: " . $row['id'] . "\n";
    echo "Layout: " . $row['layout_style'] . "\n";
    echo "Background Image: " . $row['background_image'] . "\n";
    echo "Generated Code Length: " . strlen($row['generated_code'] ?? '') . "\n";
    echo "---\n";
    if (strlen($row['generated_code']) > 0) {
        echo substr($row['generated_code'], 0, 700);
    }
} else {
    echo "No hero found";
}

mysqli_close($link);
?>
