<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Get today's date
    $today = date('Y-m-d');
    
    // Get counts from daily_attendance_summary view
    $query = "SELECT 
        COALESCE(present_count, 0) as present_count,
        COALESCE(absent_count, 0) as absent_count,
        COALESCE(late_count, 0) as late_count,
        COALESCE(corrections_count, 0) as correction_count
    FROM daily_attendance_summary 
    WHERE record_date = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $stats = $result->fetch_assoc();
    } else {
        // If no records for today, return all zeros
        $stats = [
            'present_count' => 0,
            'absent_count' => 0,
            'late_count' => 0,
            'correction_count' => 0
        ];
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);

} catch (Exception $e) {
    // Log error for debugging
    error_log("Error in get_attendance_dashboard.php: " . $e->getMessage());
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch dashboard statistics'
    ]);
}

// Close database connection
$conn->close(); 