<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    $sql = "SELECT * FROM employee_records ORDER BY id DESC";
    $result = $conn->query($sql);
    
    if ($result) {
        $employees = array();
        while ($row = $result->fetch_assoc()) {
            $employees[] = $row;
        }
        
        // Debug: Log the actual data structure
        error_log("Employee data structure: " . print_r($employees, true));
        
        echo json_encode(['success' => true, 'data' => $employees, 'count' => count($employees)]);
    } else {
        throw new Exception("Error fetching employees: " . $conn->error);
    }
} catch (Exception $e) {
    error_log("Error in get_employees.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error fetching employee data']);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>