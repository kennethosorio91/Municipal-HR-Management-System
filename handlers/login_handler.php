<?php
// Start session first
session_start();

// Then set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost'); // Replace with your actual domain
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/db_connect.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['govmail']) || !isset($input['password'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$email = $input['govmail'];
$password = $input['password'];

try {
    // Get user details
    $sql = "SELECT * FROM users WHERE email = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows !== 1) {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    // Password verification logic
    $passwordValid = false;
    
    if ($user['password_reset_required']) {
        // Check temporary passwords if password hasn't been reset
        if ($email === 'admin@municipal.gov.ph') {
            $passwordValid = ($password === 'concepcionlgu');
        } else {
            $passwordValid = ($password === 'concepcionlgu');
        }
    } else {
        // Check against stored password if it has been changed
        $passwordValid = ($password === $user['password']);
    }
    
    if (!$passwordValid) {
        if ($user['password_reset_required']) {
            if ($email === 'admin@municipal.gov.ph') {
                echo json_encode(['success' => false, 'message' => 'Invalid admin password']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid password. Please use the temporary password: concepcionlgu']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
        }
        exit;
    }
    
    // Set session variables
    $_SESSION['id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    
    // For employee users, set user_id for attendance system compatibility
    if ($user['role'] === 'employee') {
        // Get employee ID from employee_records table
        $empStmt = $conn->prepare("SELECT id FROM employee_records WHERE email = ?");
        $empStmt->bind_param("s", $user['email']);
        $empStmt->execute();
        $empResult = $empStmt->get_result();
        
        if ($empResult->num_rows === 1) {
            $employee = $empResult->fetch_assoc();
            $_SESSION['user_id'] = $employee['id'];
        } else {
            echo json_encode(['success' => false, 'message' => 'Employee record not found']);
            exit;
        }
        
        $empStmt->close();
    } else {
        // For admin, user_id is the same as id
        $_SESSION['user_id'] = $user['id'];
    }
    
    // Update last login
    $updateSql = "UPDATE users SET last_login = NOW() WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("i", $user['id']);
    $updateStmt->execute();
    
    // Check if password reset is required
    if ($user['password_reset_required']) {
        echo json_encode([
            'success' => true,
            'redirect' => '../User Page/change_password.html',
            'message' => 'Please change your password'
        ]);
    } else {
        // Redirect based on role
        $redirect = ($user['role'] === 'admin') ? '../Admin Page/Dashboard.html' : '../User Page/Profile.html';
        echo json_encode([
            'success' => true,
            'redirect' => $redirect,
            'message' => 'Login successful'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred during login']);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($updateStmt)) $updateStmt->close();
    if (isset($conn)) $conn->close();
}
?> 