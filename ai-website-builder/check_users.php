<?php
$link = mysqli_connect('127.0.0.1', 'root', '', 'gen');
if (!$link) {
    echo "Error connecting to database: " . mysqli_connect_error();
    exit;
}

$result = mysqli_query($link, 'SELECT id, email FROM users LIMIT 5');

while ($row = mysqli_fetch_assoc($result)) {
    echo "ID: " . $row['id'] . " | Email: " . $row['email'] . "\n";
}

mysqli_close($link);
?>
