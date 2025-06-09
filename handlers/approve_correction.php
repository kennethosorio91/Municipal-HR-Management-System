<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['correction_id'])) {
        throw new Exception('Correction ID is required');
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Get correction details
        $query = "SELECT * FROM attendance_corrections WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $input['correction_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception('Correction not found');
        }
        
        $correction = $result->fetch_assoc();
        
        // Update attendance record with corrected times
        $update_attendance = "UPDATE attendance_records 
            SET time_in = ?, 
                time_out = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?";
        
        $stmt = $conn->prepare($update_attendance);
        $stmt->bind_param(
            'ssi',
            $correction['requested_time_in'],
            $correction['requested_time_out'],
            $correction['attendance_record_id']
        );
        $stmt->execute();
        
        // Update correction status
        $update_correction = "UPDATE attendance_corrections 
            SET status = 'Approved',
                reviewed_at = CURRENT_TIMESTAMP,
                reviewer_id = ?
            WHERE id = ?";
        
        $stmt = $conn->prepare($update_correction);
        $reviewer_id = 1; // TODO: Get from session
        $stmt->bind_param('ii', $reviewer_id, $input['correction_id']);
        $stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Correction approved successfully'
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    // Log error for debugging
    error_log("Error in approve_correction.php: " . $e->getMessage());
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Close database connection
$conn->close(); 