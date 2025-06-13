<?php
session_start();
require_once '../config/db_connect.php';

header('Content-Type: application/json');

// Check if user is admin
if (!isset($_SESSION['email']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // Check database connection
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? 'Connection not established'));
    }

    // Check if required tables exist
    $tables = ['attendance', 'attendance_corrections', 'users'];
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if (!$result || $result->num_rows === 0) {
            throw new Exception("Required table '$table' does not exist");
        }
    }

    switch ($method) {
        case 'GET':
            switch ($action) {
                case 'get_stats':
                    getAttendanceStats($conn);
                    break;
                case 'get_corrections':
                    getPendingCorrections($conn);
                    break;
                case 'get_today_attendance':
                    getTodayAttendance($conn);
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if ($input && isset($input['action']) && $input['action'] === 'update_correction') {
                updateCorrection($conn, $input);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log("Admin attendance error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

function getAttendanceStats($conn) {
    // Get today's date
    $today = date('Y-m-d');
    
    try {
        // Get present count
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE DATE(created_at) = ? AND status = 'present'
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("s", $today);
        $stmt->execute();
        $result = $stmt->get_result();
        $presentCount = $result->fetch_assoc()['count'];
        
        // Get late count
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE DATE(created_at) = ? AND status = 'late'
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("s", $today);
        $stmt->execute();
        $result = $stmt->get_result();
        $lateCount = $result->fetch_assoc()['count'];
        
        // Get total employee count for absent calculation
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employee'");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $totalEmployees = $result->fetch_assoc()['count'];
        
        // Calculate absent count
        $absentCount = $totalEmployees - ($presentCount + $lateCount);
        
        // Get pending corrections count
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM attendance_corrections 
            WHERE status = 'pending'
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $correctionsCount = $result->fetch_assoc()['count'];
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'present_count' => (int)$presentCount,
                'absent_count' => max(0, (int)$absentCount),
                'late_count' => (int)$lateCount,
                'corrections_count' => (int)$correctionsCount
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error getting attendance stats: " . $e->getMessage());
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

function getPendingCorrections($conn) {
    try {
        $stmt = $conn->prepare("
            SELECT 
                ac.id,
                u.fullName as employee_name,
                ac.date,
                ac.correction_type,
                ac.reason,
                ac.status,
                ac.time_in,
                ac.time_out,
                ac.created_at
            FROM attendance_corrections ac
            JOIN users u ON ac.user_id = u.id
            WHERE ac.status = 'pending'
            ORDER BY ac.created_at DESC
            LIMIT 10
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $corrections = $result->fetch_all(MYSQLI_ASSOC);
        
        // Format dates and times
        foreach ($corrections as &$correction) {
            $correction['date'] = date('Y-m-d', strtotime($correction['date']));
            $correction['time_in'] = $correction['time_in'] ? date('h:i A', strtotime($correction['time_in'])) : null;
            $correction['time_out'] = $correction['time_out'] ? date('h:i A', strtotime($correction['time_out'])) : null;
            $correction['created_at'] = date('Y-m-d h:i A', strtotime($correction['created_at']));
        }
        
        echo json_encode([
            'success' => true,
            'corrections' => $corrections
        ]);
        
    } catch (Exception $e) {
        error_log("Error getting pending corrections: " . $e->getMessage());
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

function getTodayAttendance($conn) {
    $today = date('Y-m-d');
    
    try {
        $stmt = $conn->prepare("
            SELECT 
                u.fullName as employee_name,
                a.time_in,
                a.time_out,
                a.status,
                a.created_at
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE DATE(a.created_at) = ?
            ORDER BY a.created_at DESC
            LIMIT 10
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("s", $today);
        $stmt->execute();
        $result = $stmt->get_result();
        $attendance = $result->fetch_all(MYSQLI_ASSOC);
        
        // Format times
        foreach ($attendance as &$record) {
            $record['time_in'] = $record['time_in'] ? date('h:i A', strtotime($record['time_in'])) : null;
            $record['time_out'] = $record['time_out'] ? date('h:i A', strtotime($record['time_out'])) : null;
            $record['created_at'] = date('Y-m-d h:i A', strtotime($record['created_at']));
        }
        
        echo json_encode([
            'success' => true,
            'attendance' => $attendance
        ]);
        
    } catch (Exception $e) {
        error_log("Error getting today's attendance: " . $e->getMessage());
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

function updateCorrection($conn, $input) {
    if (!isset($input['correction_id']) || !isset($input['status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    try {
        // Start transaction
        $conn->begin_transaction();
        
        // Get correction details
        $stmt = $conn->prepare("
            SELECT * FROM attendance_corrections 
            WHERE id = ? AND status = 'pending'
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("i", $input['correction_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $correction = $result->fetch_assoc();
        
        if (!$correction) {
            throw new Exception('Correction not found or already processed');
        }
        
        // Update correction status
        $stmt = $conn->prepare("
            UPDATE attendance_corrections 
            SET status = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("si", $input['status'], $input['correction_id']);
        $stmt->execute();
        
        // If approved, update the attendance record
        if ($input['status'] === 'approved') {
            $stmt = $conn->prepare("
                UPDATE attendance 
                SET time_in = COALESCE(?, time_in),
                    time_out = COALESCE(?, time_out),
                    updated_at = NOW()
                WHERE user_id = ? AND DATE(created_at) = ?
            ");
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param("ssis", 
                $correction['time_in'],
                $correction['time_out'],
                $correction['user_id'],
                $correction['date']
            );
            $stmt->execute();
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Correction ' . ($input['status'] === 'approved' ? 'approved' : 'rejected') . ' successfully'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error updating correction: " . $e->getMessage());
        throw new Exception('Failed to update correction: ' . $e->getMessage());
    }
}
?> 