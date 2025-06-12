<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session first
session_start();

// Then set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost'); // Replace with your actual domain
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Debug logging function
function debug_log($message, $data = null) {
    $log_message = "[GET_USER_PROFILE] " . $message;
    if ($data !== null) {
        $log_message .= "\nData: " . print_r($data, true);
    }
    error_log($log_message);
}

require_once '../config/db_connect.php';

try {
    debug_log("Session data:", $_SESSION);
    
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in - no email in session');
    }

    $email = $_SESSION['email'];
    debug_log("Looking up user with email: " . $email);
    
    // Query to get user information from employee_records table
    $sql = "SELECT er.* 
            FROM employee_records er 
            WHERE er.email = ?";
            
    debug_log("SQL Query: " . $sql);
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        debug_log("Prepare failed: " . $conn->error);
        throw new Exception("Database error: " . $conn->error);
    }

    $stmt->bind_param("s", $email);
    
    if (!$stmt->execute()) {
        debug_log("Execute failed: " . $stmt->error);
        throw new Exception("Database error: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    debug_log("Query executed, found rows: " . $result->num_rows);
    
    if ($result->num_rows === 0) {
        throw new Exception('No employee record found for email: ' . $email);
    }

    $user_data = $result->fetch_assoc();
    debug_log("User data retrieved:", $user_data);
    
    // Calculate years of service
    if (!empty($user_data['dateHired'])) {
        $date_hired = new DateTime($user_data['dateHired']);
        $now = new DateTime();
        $years_of_service = $date_hired->diff($now)->y;
    } else {
        $years_of_service = 0;
    }
    
    $response = [
        'success' => true,
        'data' => [
            'fullName' => $user_data['fullName'],
            'position' => $user_data['position'],
            'department' => $user_data['department'],
            'employment' => $user_data['employment'],
            'email' => $user_data['email'],
            'phone' => $user_data['phone'],
            'address' => $user_data['address'],
            'status' => $user_data['status'],
            'dateHired' => $user_data['dateHired'],
            'yearsOfService' => $years_of_service
        ]
    ];
    
    debug_log("Sending response:", $response);
    echo json_encode($response);

} catch (Exception $e) {
    debug_log("Error occurred: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug_info' => [
            'session_exists' => isset($_SESSION),
            'session_data' => $_SESSION
        ]
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