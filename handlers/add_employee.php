<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/db_connect.php';

// Log function for debugging
function debugLog($message) {
    error_log("[ADD_EMPLOYEE] " . $message);
}

try {
    debugLog("=== STARTING ADD EMPLOYEE ===");
    debugLog("Request method: " . $_SERVER['REQUEST_METHOD']);
    debugLog("Content type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
    }

    // Get raw input and log it
    $raw_input = file_get_contents('php://input');
    debugLog("Raw input length: " . strlen($raw_input));
    debugLog("Raw input: " . substr($raw_input, 0, 500)); // Log first 500 chars
    
    // Get JSON input
    $input = json_decode($raw_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON: " . json_last_error_msg());
    }
    
    debugLog("Decoded input: " . print_r($input, true));
    
    // Validate required fields
    $required_fields = ['fullName', 'position', 'gender', 'department', 'employment', 'dateHired', 'email'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        throw new Exception("Missing required fields: " . implode(', ', $missing_fields));
    }

    // Test database connection
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    debugLog("Database connection successful");

    // Prepare values with defaults
    $fullName = trim($input['fullName']);
    $position = trim($input['position']);
    $gender = $input['gender'];
    $department = $input['department'];
    $employment = $input['employment'];
    $status = $input['status'] ?? 'Active';
    $dateHired = $input['dateHired'];
    $email = trim($input['email']);
    $phone = trim($input['phone'] ?? '');
    $address = trim($input['address'] ?? '');

    debugLog("Prepared values: fullName=$fullName, position=$position, gender=$gender, department=$department, employment=$employment, status=$status, dateHired=$dateHired, email=$email, phone=$phone, address=$address");

    // FIXED: Remove created_at from SQL query since it doesn't exist in your table
    $sql = "INSERT INTO employee_records (fullName, position, gender, department, employment, status, dateHired, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    debugLog("SQL: " . $sql);
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // Bind parameters
    $stmt->bind_param("ssssssssss", 
        $fullName,
        $position,
        $gender,
        $department,
        $employment,
        $status,
        $dateHired,
        $email,
        $phone,
        $address
    );

    debugLog("Parameters bound successfully");

    // Execute the statement
    if ($stmt->execute()) {
        $employee_id = $conn->insert_id;
        debugLog("Employee added successfully with ID: " . $employee_id);
        
        // Return success response
        $response = [
            'success' => true, 
            'message' => 'Employee added successfully',
            'employee_id' => $employee_id,
            'data' => [
                'id' => $employee_id,
                'fullName' => $fullName,
                'position' => $position,
                'department' => $department,
                'employment' => $employment,
                'status' => $status
            ]
        ];
        
        debugLog("Response: " . json_encode($response));
        echo json_encode($response);
        
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }

} catch (Exception $e) {
    debugLog("ERROR: " . $e->getMessage());
    
    http_response_code(400);
    $error_response = [
        'success' => false, 
        'message' => $e->getMessage(),
        'debug_info' => [
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'unknown',
            'raw_input_length' => strlen($raw_input ?? ''),
            'json_error' => json_last_error_msg()
        ]
    ];
    
    debugLog("Error response: " . json_encode($error_response));
    echo json_encode($error_response);
    
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
    debugLog("=== ENDING ADD EMPLOYEE ===");
}
?>