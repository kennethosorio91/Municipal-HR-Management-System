<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../config/db_connect.php';

session_start();

try {
    if (!isset($_SESSION['user_email'])) {
        throw new Exception('User not logged in');
    }

    $email = $_SESSION['user_email'];
    
    // Query to get user information from both users and employee_records tables
    $sql = "SELECT er.* 
            FROM employee_records er 
            WHERE er.email = ?";
            
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('User not found');
    }

    $user_data = $result->fetch_assoc();
    
    // Calculate years of service
    $date_hired = new DateTime($user_data['dateHired']);
    $now = new DateTime();
    $years_of_service = $date_hired->diff($now)->y;
    
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
    
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
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