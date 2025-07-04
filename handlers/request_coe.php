<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    $email = $_SESSION['email'];
    
    // Read JSON from the request body
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    $purpose = $data['purpose'] ?? '';
    $requestDate = date('Y-m-d');

    // Insert COE request
    $sql = "
        INSERT INTO coe_requests (email, purpose, request_date, status) 
        VALUES (?, ?, ?, 'Active')
    ";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("sss", $email, $purpose, $requestDate);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'COE request submitted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
} 