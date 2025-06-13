<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    // Get user's salary grade from employee_records
    $stmt = $conn->prepare("
        SELECT er.salary_grade, sg.basic_salary, sg.pera_allowance 
        FROM employee_records er 
        LEFT JOIN salary_grades sg ON er.salary_grade = sg.grade_level 
        WHERE er.email = ?
    ");
    
    $stmt->bind_param("s", $_SESSION['email']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Employee record not found');
    }

    $data = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);

} catch (Exception $e) {
    error_log("Error getting salary grade: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?> 