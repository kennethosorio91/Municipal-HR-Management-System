<?php
require_once '../includes/dbconfig.php';
date_default_timezone_set('Asia/Manila');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $requestId = $data['request_id'];
    $action = $data['action'];
    $currentTime = date('Y-m-d H:i:s');
    
    // Start transaction
    $conn->beginTransaction();
    
    // Get request details first
    $stmt = $conn->prepare("
        SELECT lr.*, e.name as employee_name, lt.name as leave_type
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.id = :request_id
    ");
    $stmt->execute(['request_id' => $requestId]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$request) {
        throw new Exception('Leave request not found');
    }
    
    // Update request status
    $newStatus = $action === 'approve' ? 'Approved' : 'Rejected';
    $stmt = $conn->prepare("
        UPDATE leave_requests 
        SET status = :status,
            processed_by = :processed_by,
            processed_at = :processed_at,
            approved_date = CASE WHEN :status = 'Approved' THEN :approved_date ELSE NULL END
        WHERE id = :request_id
    ");
    $stmt->execute([
        'status' => $newStatus,
        'processed_by' => $_SESSION['user_id'] ?? 1, // Replace with actual admin ID
        'processed_at' => $currentTime,
        'approved_date' => $currentTime,
        'request_id' => $requestId
    ]);

    // If approved, update leave credits
    if ($action === 'approve') {
        $leaveDays = (strtotime($request['end_date']) - strtotime($request['start_date'])) / (60 * 60 * 24) + 1;
        
        $stmt = $conn->prepare("
            UPDATE leave_credits 
            SET 
                available_credits = available_credits - :leave_days,
                last_updated = :last_updated
            WHERE employee_id = :employee_id 
            AND leave_type_id = :leave_type_id
        ");
        $stmt->execute([
            'leave_days' => $leaveDays,
            'last_updated' => $currentTime,
            'employee_id' => $request['employee_id'],
            'leave_type_id' => $request['leave_type_id']
        ]);
    }

    // Add audit trail
    $stmt = $conn->prepare("
        INSERT INTO audit_trail (
            action_type,
            table_name,
            record_id,
            action_by,
            action_date,
            old_value,
            new_value,
            details
        ) VALUES (
            :action_type,
            'leave_requests',
            :record_id,
            :action_by,
            :action_date,
            :old_value,
            :new_value,
            :details
        )
    ");
    
    $auditDetails = sprintf(
        'Leave request %s for %s (%s) from %s to %s',
        strtolower($newStatus),
        $request['employee_name'],
        $request['leave_type'],
        $request['start_date'],
        $request['end_date']
    );
    
    $stmt->execute([
        'action_type' => $action,
        'record_id' => $requestId,
        'action_by' => $_SESSION['user_id'] ?? 1, // Replace with actual admin ID
        'action_date' => $currentTime,
        'old_value' => 'Pending',
        'new_value' => $newStatus,
        'details' => $auditDetails
    ]);

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => "Leave request successfully " . strtolower($newStatus)
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 