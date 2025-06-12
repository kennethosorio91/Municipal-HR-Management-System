<?php
session_start();
require_once '../config/db_connect.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$user_id = $_SESSION['user_id'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

try {
    // Validate input
    if (!isset($input['date']) || !isset($input['correction_type']) || !isset($input['reason'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }
    
    $date = $input['date'];
    $correctionType = $input['correction_type'];
    $reason = $input['reason'];
    $timeIn = $input['time_in'] ?? null;
    $timeOut = $input['time_out'] ?? null;
    
    // Insert correction request
    $stmt = $pdo->prepare("
        INSERT INTO attendance_corrections 
        (user_id, date, correction_type, time_in, time_out, reason, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");
    
    $stmt->execute([$user_id, $date, $correctionType, $timeIn, $timeOut, $reason]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Correction request submitted successfully'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
