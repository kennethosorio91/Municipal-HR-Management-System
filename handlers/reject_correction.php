<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['correction_id'])) {
        throw new Exception('Correction ID is required');
    }
    
    // Update correction status
    $query = "UPDATE attendance_corrections 
        SET status = 'Rejected',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewer_id = ?,
            review_remarks = ?
        WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $reviewer_id = 1; // TODO: Get from session
    $remarks = $input['remarks'] ?? 'Correction request rejected';
    
    $stmt->bind_param('isi', $reviewer_id, $remarks, $input['correction_id']);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        throw new Exception('Correction not found or already processed');
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Correction rejected successfully'
    ]);
    
} catch (Exception $e) {
    // Log error for debugging
    error_log("Error in reject_correction.php: " . $e->getMessage());
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Close database connection
$conn->close(); 