<?php
// Connect to SQLite
$db = new SQLite3('mydatabase.db');

// Query the database
$result = $db->query('SELECT * FROM users');
while ($row = $result->fetchArray()) {
    echo "User: " . $row['username'] . "<br>";
}
?>
