<?php
session_start();
header('Content-Type: application/json');

require_once '../config/db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to change your password']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['currentPassword']) || !isset($input['newPassword'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$currentPassword = $input['currentPassword'];
$newPassword = $input['newPassword'];
$userId = $_SESSION['id'];
$userEmail = $_SESSION['email'];

try {
    // Verify current password
    $passwordValid = false;
    
    if ($userEmail === 'admin@municipal.gov.ph') {
        $passwordValid = ($currentPassword === 'Admin@123');
    } else {
        $passwordValid = ($currentPassword === 'concepcionlgu');
    }
    
    if (!$passwordValid) {
        if ($userEmail === 'admin@municipal.gov.ph') {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect. Use: concepcionlgu']);
        }
        exit;
    }
    
    // Validate new password
    if (strlen($newPassword) < 8) {
        echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters long']);
        exit;
    }
    
    // Update password
    $updateSql = "UPDATE users SET password = ?, password_reset_required = FALSE WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("si", $newPassword, $userId);
    
    if ($updateStmt->execute()) {
        // Clear the session
        session_destroy();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Password changed successfully. Please login with your new password.',
            'redirect' => '../Landing Page/landing.html'
        ]);
    } else {
        throw new Exception("Error updating password");
    }
    
} catch (Exception $e) {
    error_log("Password change error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while changing your password']);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($updateStmt)) $updateStmt->close();
    if (isset($conn)) $conn->close();
}
?> 