<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Query to group employees by department and count them
    $sql = "SELECT department, COUNT(*) as count 
            FROM employee_records 
            WHERE department IS NOT NULL 
            GROUP BY department 
            ORDER BY count DESC";
      $result = $conn->query($sql);
    
    if ($result) {
        $departments = array();
        while ($row = $result->fetch_assoc()) {
            $departments[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $departments]);
    } else {
        throw new Exception("Error fetching department data: " . $conn->error);
    }
} catch (Exception $e) {
    error_log("Error in get_department_stats.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error fetching department data']);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
