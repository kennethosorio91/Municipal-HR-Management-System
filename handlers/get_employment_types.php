<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    // Query to group employees by employment type and count them
    $sql = "SELECT employment AS type, COUNT(*) as count 
            FROM employee_records 
            WHERE employment IS NOT NULL 
            GROUP BY employment 
            ORDER BY count DESC";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $types = array();
        while ($row = $result->fetch_assoc()) {
            $types[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $types]);
    } else {
        throw new Exception("Error fetching employment type data: " . $conn->error);
    }
} catch (Exception $e) {
    error_log("Error in get_employment_types.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error fetching employment type data']);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
