<?php
require_once '../includes/dbconfig.php';
date_default_timezone_set('Asia/Manila');

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    $search = $data['search'] ?? '';
    $status = $data['status'] ?? '';

    // Build query
    $query = "
        SELECT 
            lr.*,
            e.name as employee_name,
            e.employee_id,
            lt.name as leave_type,
            CONCAT(
                DATE_FORMAT(lr.start_date, '%M %d-%d, %Y'), 
                ' (', 
                DATEDIFF(lr.end_date, lr.start_date) + 1,
                ' Days)'
            ) as duration
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE 1=1
    ";
    
    $params = [];

    // Add search condition
    if ($search) {
        $query .= " AND (e.name LIKE :search OR e.employee_id LIKE :search)";
        $params['search'] = "%$search%";
    }

    // Add status filter
    if ($status) {
        $query .= " AND lr.status = :status";
        $params['status'] = $status;
    }

    // Order by most recent first
    $query .= " ORDER BY lr.created_at DESC LIMIT 50";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get leave credits for each employee
    foreach ($requests as &$request) {
        $stmt = $conn->prepare("
            SELECT available_credits 
            FROM leave_credits 
            WHERE employee_id = :employee_id 
            AND leave_type_id = :leave_type_id
        ");
        $stmt->execute([
            'employee_id' => $request['employee_id'],
            'leave_type_id' => $request['leave_type_id']
        ]);
        $credits = $stmt->fetch(PDO::FETCH_ASSOC);
        $request['available_credits'] = $credits['available_credits'] ?? 0;
    }

    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 