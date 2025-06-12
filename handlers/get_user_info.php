<?php
session_start();
require_once '../config/db_connect.php';

header('Content-Type: application/json');

// Function to get user by email and link with employee data
function getUserByEmail($email) {
    global $pdo;
    
    try {
        // First get user info
        $stmt = $pdo->prepare("SELECT id, email, role FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Get employee details
            $stmt = $pdo->prepare("SELECT * FROM employee_records WHERE email = ?");
            $stmt->execute([$email]);
            $employee = $stmt->fetch();
            
            return [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'employee' => $employee
            ];
        }
        
        return null;
    } catch (PDOException $e) {
        error_log("Error getting user by email: " . $e->getMessage());
        return null;
    }
}

// Get all users with their employee data for testing
try {
    $stmt = $pdo->prepare("
        SELECT u.id as user_id, u.email, u.role, 
               e.fullName, e.position, e.department, e.employment, e.status
        FROM users u 
        LEFT JOIN employee_records e ON u.email = e.email 
        ORDER BY u.id
    ");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'current_session' => [
            'user_id' => $_SESSION['user_id'] ?? null,
            'email' => $_SESSION['email'] ?? null
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
