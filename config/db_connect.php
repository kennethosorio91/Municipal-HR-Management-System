<?php
// Load configuration
$config = require_once __DIR__ . '/db_config.php';

try {
    $conn = new mysqli(
        $config['host'],
        $config['username'],
        $config['password'],
        $config['dbname']
    );

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Set charset
    if (!$conn->set_charset($config['charset'])) {
        throw new Exception("Error setting charset: " . $conn->error);
    }

} catch (Exception $e) {
    // Log error safely without exposing sensitive information
    error_log("Database connection error: " . $e->getMessage());
    die("Sorry, there was an error connecting to the database. Please try again later.");
}
?> 