<?php
session_start();
require_once '../config/db_connect.php';

header('Content-Type: application/json');

// Check if user is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

try {
    // Get today's attendance statistics
    $today = date('Y-m-d');
    
    // Present today
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM attendance 
        WHERE DATE(created_at) = ? AND time_in IS NOT NULL
    ");
    $stmt->execute([$today]);
    $present = $stmt->fetch()['count'];
    
    // Absent today (users who should be present but no record)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM users u 
        WHERE u.role = 'employee' 
        AND u.status = 'active'
        AND u.id NOT IN (
            SELECT DISTINCT user_id 
            FROM attendance 
            WHERE DATE(created_at) = ?
        )
    ");
    $stmt->execute([$today]);
    $absent = $stmt->fetch()['count'];
    
    // Late arrivals today
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM attendance 
        WHERE DATE(created_at) = ? AND status = 'late'
    ");
    $stmt->execute([$today]);
    $late = $stmt->fetch()['count'];
    
    // Pending corrections
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM attendance_corrections 
        WHERE status = 'pending'
    ");
    $stmt->execute();
    $corrections = $stmt->fetch()['count'];
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'corrections' => $corrections
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
