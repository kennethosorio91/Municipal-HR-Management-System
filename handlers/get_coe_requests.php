<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    $email = $_SESSION['email'];

    // Check if issue_date column exists
    $checkColumnSql = "SHOW COLUMNS FROM coe_requests LIKE 'issue_date'";
    $columnExists = $conn->query($checkColumnSql)->num_rows > 0;
    
    // Get COE requests with conditional column selection
    if ($columnExists) {
    $sql = "
        SELECT id, purpose, request_date, issue_date, status 
        FROM coe_requests 
        WHERE email = ? 
        ORDER BY request_date DESC
    ";
    } else {
        $sql = "
            SELECT id, purpose, request_date, status 
            FROM coe_requests 
            WHERE email = ? 
            ORDER BY request_date DESC
        ";
    }
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $row['remarks'] = ''; // Add default remarks for frontend compatibility
        // If column doesn't exist but code expects it, add a null value
        if (!$columnExists) {
            $row['issue_date'] = null;
        }
        $requests[] = $row;
    }

    echo json_encode([
        'success' => true,
        'requests' => $requests
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