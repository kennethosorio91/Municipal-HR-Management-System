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

// Helper function to format date to MySQL format
function formatDate($date) {
    if (empty($date)) return null;
    $formatted = date('Y-m-d', strtotime($date));
    return $formatted !== '1970-01-01' ? $formatted : null;
}


$dateHired = date('Y-m-d', strtotime($input['dateHired']));
$birthdate = date('Y-m-d', strtotime($input['birthdate']));


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
    $required_fields = ['fullName', 'position', 'gender', 'department', 'employment', 'dateHired', 'birthdate'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        throw new Exception("Missing required fields: " . implode(', ', $missing_fields));
    }

    // Validate employment type
    $valid_employment_types = ['Permanent', 'Contractual', 'Job Order', 'Probationary'];
    if (!in_array($input['employment'], $valid_employment_types)) {
        throw new Exception("Invalid employment type. Must be one of: " . implode(', ', $valid_employment_types));
    }

    // Test database connection
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    debugLog("Database connection successful");

    // Generate municipal email
    $fullName = trim($input['fullName']);
    $nameParts = explode(' ', strtolower($fullName));
    $firstName = $nameParts[0];
    $lastName = end($nameParts);
    $email = $firstName . '.' . $lastName . '@municipal.gov.ph';
    
    // Prepare values with defaults
    $position = trim($input['position']);
    $gender = $input['gender'];
    $department = $input['department'];
    $employment = $input['employment'];
    $status = $input['status'] ?? 'Active';
    $phone = trim($input['phone'] ?? '');
    $address = trim($input['address'] ?? '');
    
    // Format dates properly
    $dateHired = date('Y-m-d', strtotime($input['dateHired']));
    $birthdate = date('Y-m-d', strtotime($input['birthdate']));

    // Validate dates
    if ($dateHired === '1970-01-01' || !$dateHired) {
        throw new Exception("Invalid date hired format. Please use YYYY-MM-DD format.");
    }
    if ($birthdate === '1970-01-01' || !$birthdate) {
        throw new Exception("Invalid birthdate format. Please use YYYY-MM-DD format.");
    }

    debugLog("Prepared values: fullName=$fullName, position=$position, gender=$gender, department=$department, employment=$employment, status=$status, dateHired=$dateHired, birthdate=$birthdate, email=$email, phone=$phone, address=$address");

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert employee record
        $sql = "INSERT INTO employee_records (fullName, position, gender, department, employment, status, dateHired, birthdate, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        debugLog("SQL: " . $sql);
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        // Bind parameters
        $stmt->bind_param("sssssssssss", 
            $fullName,
            $position,
            $gender,
            $department,
            $employment,
            $status,
            $dateHired,
            $birthdate,
            $email,
            $phone,
            $address
        );

        $stmt->execute();
        $employee_id = $conn->insert_id;

        // Create user account with default password
        $sql_user = "INSERT INTO users (email, password, role, created_at) VALUES (?, ?, 'employee', NOW())";
        $stmt_user = $conn->prepare($sql_user);
        if (!$stmt_user) {
            throw new Exception("Prepare user insert failed: " . $conn->error);
        }

        // Use the default password 'concepcionlgu'
        $default_password = 'concepcionlgu';
        $stmt_user->bind_param("ss", $email, $default_password);
        $stmt_user->execute();

        // Commit transaction
        $conn->commit();

        // Return success response
        $response = [
            'success' => true, 
            'message' => 'Employee added successfully. The employee can login using their email (' . $email . ') with the temporary password: concepcionlgu',
            'employee_id' => $employee_id,
            'data' => [
                'id' => $employee_id,
                'fullName' => $fullName,
                'position' => $position,
                'department' => $department,
                'employment' => $employment,
                'status' => $status,
                'email' => $email,
                'temporary_password' => 'concepcionlgu'
            ]
        ];
        
        debugLog("Response: " . json_encode($response));
        echo json_encode($response);

    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        throw $e;
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