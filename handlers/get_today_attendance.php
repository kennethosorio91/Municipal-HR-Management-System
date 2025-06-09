<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Get today's date
    $today = date('Y-m-d');
    
    // Get today's attendance records with employee names
    $query = "SELECT 
        ar.id,
        ar.employee_id,
        e.fullName as employee_name,
        ar.time_in,
        ar.time_out,
        ar.status,
        ar.remarks
    FROM attendance_records ar
    JOIN employees e ON ar.employee_id = e.id
    WHERE DATE(ar.date) = ?
    ORDER BY ar.time_in DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $attendance = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $attendance[] = [
                'id' => $row['id'],
                'employee_id' => $row['employee_id'],
                'employee_name' => $row['employee_name'],
                'time_in' => $row['time_in'],
                'time_out' => $row['time_out'],
                'status' => $row['status'],
                'remarks' => $row['remarks']
            ];
        }
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'attendance' => $attendance
    ]);

} catch (Exception $e) {
    // Log error for debugging
    error_log("Error in get_today_attendance.php: " . $e->getMessage());
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch today\'s attendance'
    ]);
}

// Close database connection
$conn->close(); 