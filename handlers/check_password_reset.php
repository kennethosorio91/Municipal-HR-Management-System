<?php
session_start();
require_once '../config/db_connect.php';

header('Content-Type: application/json');

// Check if database connection exists
if (!isset($conn)) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

// Check if this is a forgot password request
if (isset($_GET['forgot']) && $_GET['forgot'] === 'true') {
    if (isset($_GET['email'])) {
        $email = $_GET['email'];
          // Check if email exists in the database
        $stmt = $conn->prepare("SELECT id, password_reset_required FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            // Set session for password reset
            $_SESSION['reset_user_id'] = $row['id'];
            $_SESSION['reset_email'] = $email;
            
            // Set password reset required to true
            $updateStmt = $conn->prepare("UPDATE users SET password_reset_required = 1 WHERE id = ?");
            $updateStmt->bind_param("i", $row['id']);
            $updateStmt->execute();
            $updateStmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Password reset initiated',
                'password_reset_required' => true
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Email not found',
                'password_reset_required' => false
            ]);
        }
        $stmt->close();
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Email not provided',
            'password_reset_required' => false
        ]);
    }
} 
// Regular password reset check for logged in users
else if (isset($_SESSION['id'])) {
    try {
        $stmt = $conn->prepare("SELECT password_reset_required FROM users WHERE id = ?");
        $stmt->bind_param("i", $_SESSION['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success' => true,
                'password_reset_required' => (bool)$row['password_reset_required']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'User not found',
                'password_reset_required' => false
            ]);
        }
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error',
            'password_reset_required' => false
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated',
        'password_reset_required' => false
    ]);
}

$conn->close();
?> 