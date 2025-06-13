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

// Check if user is authenticated
if (!isset($_SESSION['user_id']) && !isset($_SESSION['reset_user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);
$newPassword = $data['newPassword'];

// Get user ID (either from regular session or reset session)
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : $_SESSION['reset_user_id'];

try {
    // Get user information
    $stmt = $conn->prepare("SELECT password_reset_required, password FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        exit;
    }

    // For first-time login (password_reset_required = 1)
    if ($user['password_reset_required'] == 1) {
        // For first-time users, just update the password
        $updateStmt = $conn->prepare("UPDATE users SET password = ?, password_reset_required = 0 WHERE id = ?");
        $updateStmt->bind_param("si", $newPassword, $userId);
        
        if ($updateStmt->execute()) {
            // Clear session
            session_destroy();
            
            echo json_encode([
                'success' => true,
                'message' => 'Password changed successfully. Please login with your new password.',
                'redirect' => '../Landing Page/landing.html#login'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update password'
            ]);
        }
        $updateStmt->close();
    } 
    // For regular password change
    else {
        $currentPassword = $data['currentPassword'];
        
        // Verify current password (plain text comparison)
        if ($currentPassword !== $user['password']) {
            echo json_encode([
                'success' => false,
                'message' => 'Current password is incorrect'
            ]);
            exit;
        }
        
        // Update password
        $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $updateStmt->bind_param("si", $newPassword, $userId);
        
        if ($updateStmt->execute()) {
            // Clear session
            session_destroy();
            
            echo json_encode([
                'success' => true,
                'message' => 'Password changed successfully. Please login with your new password.',
                'redirect' => '../Landing Page/landing.html#login'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update password'
            ]);
        }
        $updateStmt->close();
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 