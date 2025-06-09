<?php
require_once '../includes/dbconfig.php';
date_default_timezone_set('Asia/Manila');

try {
    $today = date('Y-m-d');
    $currentTime = date('H:i:s');
    
    // Get total number of employees
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM employees WHERE status = 'Active'");
    $stmt->execute();
    $totalEmployees = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get present employees today
    $stmt = $conn->prepare("
        SELECT COUNT(DISTINCT employee_id) as present 
        FROM attendance_records 
        WHERE DATE(time_in) = :today
    ");
    $stmt->execute(['today' => $today]);
    $presentToday = $stmt->fetch(PDO::FETCH_ASSOC)['present'];

    // Calculate absent employees
    $absentToday = $totalEmployees - $presentToday;
    if ($absentToday < 0) $absentToday = 0;

    // Get late arrivals
    $stmt = $conn->prepare("
        SELECT COUNT(DISTINCT employee_id) as late 
        FROM attendance_records 
        WHERE DATE(time_in) = :today 
        AND TIME(time_in) > '08:00:00'
    ");
    $stmt->execute(['today' => $today]);
    $lateArrivals = $stmt->fetch(PDO::FETCH_ASSOC)['late'];

    // Get pending corrections
    $stmt = $conn->prepare("
        SELECT COUNT(*) as corrections 
        FROM attendance_corrections 
        WHERE status = 'Pending'
    ");
    $stmt->execute();
    $pendingCorrections = $stmt->fetch(PDO::FETCH_ASSOC)['corrections'];

    // Calculate attendance rate
    $attendanceRate = ($totalEmployees > 0) ? round(($presentToday / $totalEmployees) * 100, 1) : 0;

    $response = [
        'status' => 'success',
        'data' => [
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'absent_today' => $absentToday,
            'late_arrivals' => $lateArrivals,
            'pending_corrections' => $pendingCorrections,
            'attendance_rate' => $attendanceRate,
            'last_updated' => date('Y-m-d H:i:s')
        ]
    ];

    header('Content-Type: application/json');
    echo json_encode($response);

} catch (PDOException $e) {
    $response = [
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ];
    
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode($response);
}
?> 