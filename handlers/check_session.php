<?php
session_start();

header('Content-Type: application/json');

// Check if user is logged in
$loggedIn = isset($_SESSION['email']) && !empty($_SESSION['email']);

echo json_encode([
    'loggedIn' => $loggedIn,
    'role' => isset($_SESSION['role']) ? $_SESSION['role'] : null
]);
?> 