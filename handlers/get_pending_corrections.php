<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Get pending corrections from view
    $query = "SELECT * FROM pending_corrections_view LIMIT 10";
    $result = $conn->query($query);
    
    $corrections = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $corrections[] = [
                'id' => $row['correction_id'],
                'employee_id' => $row['employee_id'],
                'employee_name' => $row['employee_name'],
                'record_date' => $row['record_date'],
                'original_time_in' => $row['original_time_in'],
                'original_time_out' => $row['original_time_out'],
                'requested_time_in' => $row['requested_time_in'],
                'requested_time_out' => $row['requested_time_out'],
                'reason' => $row['reason'],
                'requested_at' => $row['requested_at']
            ];
        }
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'corrections' => $corrections
    ]);

} catch (Exception $e) {
    // Log error for debugging
    error_log("Error in get_pending_corrections.php: " . $e->getMessage());
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch pending corrections'
    ]);
}

// Close database connection
$conn->close(); 