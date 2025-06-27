<?php
session_start();
date_default_timezone_set('Asia/Manila');
require_once '../config/db_connect.php';

// Initialize PDO connection if it doesn't exist
if (!isset($pdo)) {
    try {
        $config_file = __DIR__ . '/../config/db_config.php';
        $config = require_once $config_file;
        
        $pdo = new PDO(
            "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}",
            $config['username'],
            $config['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
    } catch (PDOException $e) {
        // Log error safely without exposing sensitive information
        error_log("PDO connection error: " . $e->getMessage());
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Database connection error']);
        exit;
    }
}

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

// Check if user is an admin - admins should not access employee attendance
if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin users do not have employee attendance records']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$user_id = $_SESSION['user_id'];

try {
    switch ($method) {
        case 'GET':
            handleGetAttendance();
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['action'])) {
                switch ($input['action']) {
                    case 'time_in':
                        handleTimeIn();
                        break;
                    case 'time_out':
                        handleTimeOut();
                        break;
                    default:
                        http_response_code(400);
                        echo json_encode(['error' => 'Invalid action']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'No action specified']);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log("Attendance handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function handleGetAttendance() {
    global $pdo, $user_id;
    
    $month = $_GET['month'] ?? date('Y-m');
    
    try {
        // Get attendance records for the specified month
        $stmt = $pdo->prepare("
            SELECT DATE(created_at) as date, time_in, time_out, status, 
                   TIMESTAMPDIFF(MINUTE, time_in, time_out) as total_minutes
            FROM attendance 
            WHERE user_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
            ORDER BY date DESC
        ");
        $stmt->execute([$user_id, $month]);
        $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get today's attendance
        $stmt = $pdo->prepare("
            SELECT time_in, time_out, status 
            FROM attendance 
            WHERE user_id = ? AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$user_id]);
        $today = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format the data
        $formattedAttendance = [];
        foreach ($attendance as $record) {
            $totalHours = $record['total_minutes'] ? 
                sprintf('%d:%02d', floor($record['total_minutes'] / 60), $record['total_minutes'] % 60) : 
                '0:00';
            
            $formattedAttendance[] = [
                'date' => $record['date'],
                'time_in' => $record['time_in'] ? date('h:i A', strtotime($record['time_in'])) : '-',
                'time_out' => $record['time_out'] ? date('h:i A', strtotime($record['time_out'])) : '-',
                'total_hours' => $totalHours,
                'status' => $record['status']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'today' => $today,
            'attendance' => $formattedAttendance
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

function handleTimeIn() {
    global $pdo, $user_id;
    
    try {
        // Check if user already timed in today
        $stmt = $pdo->prepare("
            SELECT id FROM attendance 
            WHERE user_id = ? AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$user_id]);
        
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'You have already timed in today']);
            return;
        }
        
        $timeIn = date('H:i:s');
        $createdAt = date('Y-m-d H:i:s');
        $status = (strtotime($timeIn) > strtotime('08:00:00')) ? 'late' : 'present';
        
        $stmt = $pdo->prepare("
            INSERT INTO attendance (user_id, time_in, status, created_at) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$user_id, $timeIn, $status, $createdAt]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Time in recorded successfully',
            'time_in' => date('h:i A', strtotime($timeIn)),
            'status' => $status
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

function handleTimeOut() {
    global $pdo, $user_id;
    
    try {
        // Check if user has timed in today and not timed out yet
        $stmt = $pdo->prepare("
            SELECT id, status FROM attendance 
            WHERE user_id = ? AND DATE(created_at) = CURDATE() AND time_out IS NULL
        ");
        $stmt->execute([$user_id]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$record) {
            http_response_code(400);
            echo json_encode(['error' => 'No active time-in record found for today.']);
            return;
        }
        
        $timeOut = date('H:i:s');
        $status = $record['status']; // Keep original status (present or late)

        // Check for undertime, but only if they weren't already late
        if (strtotime($timeOut) < strtotime('17:00:00') && $status === 'present') {
            $status = 'undertime';
        }
        
        $stmt = $pdo->prepare("
            UPDATE attendance SET time_out = ?, status = ? WHERE id = ?
        ");
        $stmt->execute([$timeOut, $status, $record['id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Time out recorded successfully',
            'time_out' => date('h:i A', strtotime($timeOut)),
            'status' => $status
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Database error: ' . $e->getMessage());
    }
}
?>
