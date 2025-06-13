<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    $email = $_SESSION['email'];

    // Get user documents
    $stmt = $conn->prepare("
        SELECT id, document_title, file_name, status, upload_date 
        FROM user_documents 
        WHERE email = ? 
        ORDER BY upload_date DESC
    ");
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $documents = [];
    while ($row = $result->fetch_assoc()) {
        $documents[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data' => $documents
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