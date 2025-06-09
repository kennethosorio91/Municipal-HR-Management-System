<?php
require_once '../includes/dbconfig.php';
date_default_timezone_set('Asia/Manila');

try {
    $today = date('Y-m-d');
    $firstDayOfMonth = date('Y-m-01');
    $lastDayOfMonth = date('Y-m-t');
    
    // Get total pending requests
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM leave_requests 
        WHERE status = 'Pending'
    ");
    $stmt->execute();
    $totalPending = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get average leave days
    $stmt = $conn->prepare("
        SELECT ROUND(AVG(DATEDIFF(end_date, start_date) + 1), 1) as avg_days 
        FROM leave_requests 
        WHERE status = 'Approved' 
        AND start_date >= :first_day 
        AND end_date <= :last_day
    ");
    $stmt->execute([
        'first_day' => $firstDayOfMonth,
        'last_day' => $lastDayOfMonth
    ]);
    $averageDays = $stmt->fetch(PDO::FETCH_ASSOC)['avg_days'] ?? 0;

    // Get active travel orders
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM travel_orders 
        WHERE status = 'Active' 
        AND start_date <= :today 
        AND end_date >= :today
    ");
    $stmt->execute(['today' => $today]);
    $activeOrders = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get approved requests this month
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM leave_requests 
        WHERE status = 'Approved' 
        AND approved_date >= :first_day 
        AND approved_date <= :last_day
    ");
    $stmt->execute([
        'first_day' => $firstDayOfMonth,
        'last_day' => $lastDayOfMonth
    ]);
    $approvedMonth = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    echo json_encode([
        'total_pending' => $totalPending,
        'average_days' => $averageDays,
        'active_orders' => $activeOrders,
        'approved_month' => $approvedMonth
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 