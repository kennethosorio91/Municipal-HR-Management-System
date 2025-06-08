<?php
// Prevent any unwanted output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Load configuration
$config_file = __DIR__ . '/db_config.php';

if (!file_exists($config_file)) {
    error_log("Database configuration file not found");
    die("Database configuration error");
}

$config = require_once $config_file;

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
    
    // If this is an AJAX request, return JSON error
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
        header('Content-Type: application/json');
        die(json_encode(['success' => false, 'message' => 'Database connection error']));
    }
    
    die("Sorry, there was an error connecting to the database. Please try again later.");
}
error_log("Database connection successful to: " . $config['dbname']);
?>