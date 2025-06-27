<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
session_start();

// Include database connection
require_once '../config/db_connect.php';

// Check if database connection exists
if (!isset($conn) || $conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . ($conn ? $conn->connect_error : 'Connection not established')
    ]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    
    // First, check if the user exists in employees table
    $sql = "SELECT id, gender FROM employees WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $userId);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $employee = $result->fetch_assoc();
    $stmt->close();

    if (!$employee) {
        // Return default values if employee not found
        $defaultCredits = [
            [
                'type' => 'vacation_leave',
                'name' => 'Vacation Leave',
                'days' => 15
            ],
            [
                'type' => 'sick_leave',
                'name' => 'Sick Leave',
                'days' => 15
            ],
            [
                'type' => 'emergency_leave',
                'name' => 'Emergency Leave',
                'days' => 3
            ],
            [
                'type' => 'study_leave',
                'name' => 'Study Leave',
                'days' => 5
            ]
        ];

        echo json_encode([
            'success' => true,
            'data' => $defaultCredits,
            'message' => 'Using default credits (employee record not found)'
        ]);
        exit;
    }

    // Now get leave credits
    $sql = "SELECT * FROM leave_credits WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $userId);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $credits = $result->fetch_assoc();
    $stmt->close();
    
    if ($credits) {
        // Format the leave credits for display
        $leaveCredits = [
            [
                'type' => 'vacation_leave',
                'name' => 'Vacation Leave',
                'days' => (int)$credits['vacation_leave']
            ],
            [
                'type' => 'sick_leave',
                'name' => 'Sick Leave',
                'days' => (int)$credits['sick_leave']
            ],
            [
                'type' => 'emergency_leave',
                'name' => 'Emergency Leave',
                'days' => (int)$credits['emergency_leave']
            ],
            [
                'type' => 'study_leave',
                'name' => 'Study Leave',
                'days' => (int)$credits['study_leave']
            ]
        ];

        // Add gender-specific leave
        if ($employee['gender'] === 'F' && isset($credits['maternity_leave'])) {
            $leaveCredits[] = [
                'type' => 'maternity_leave',
                'name' => 'Maternity Leave',
                'days' => (int)$credits['maternity_leave']
            ];
        } else if ($employee['gender'] === 'M' && isset($credits['paternity_leave'])) {
            $leaveCredits[] = [
                'type' => 'paternity_leave',
                'name' => 'Paternity Leave',
                'days' => (int)$credits['paternity_leave']
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $leaveCredits
        ]);
    } else {
        // Return default values based on gender
        $defaultCredits = [
            [
                'type' => 'vacation_leave',
                'name' => 'Vacation Leave',
                'days' => 15
            ],
            [
                'type' => 'sick_leave',
                'name' => 'Sick Leave',
                'days' => 15
            ],
            [
                'type' => 'emergency_leave',
                'name' => 'Emergency Leave',
                'days' => 3
            ],
            [
                'type' => 'study_leave',
                'name' => 'Study Leave',
                'days' => 5
            ]
        ];

        // Add gender-specific leave
        if ($employee['gender'] === 'F') {
            $defaultCredits[] = [
                'type' => 'maternity_leave',
                'name' => 'Maternity Leave',
                'days' => 105
            ];
        } else if ($employee['gender'] === 'M') {
            $defaultCredits[] = [
                'type' => 'paternity_leave',
                'name' => 'Paternity Leave',
                'days' => 7
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $defaultCredits,
            'message' => 'Using default credits (no credits found)'
        ]);
    }
} catch (Exception $e) {
    error_log("Error in fetch_leave_credits.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?> 