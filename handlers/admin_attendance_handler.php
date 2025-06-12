<?php
session_start();
require_once '../config/db_connect.php';

header('Content-Type: application/json');

// Check if user is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetCorrections();
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['action'])) {
                switch ($input['action']) {
                    case 'approve':
                        handleApproveCorrection($input['correction_id']);
                        break;
                    case 'reject':
                        handleRejectCorrection($input['correction_id']);
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
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function handleGetCorrections() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT ac.*, u.username, u.full_name 
            FROM attendance_corrections ac
            JOIN users u ON ac.user_id = u.id 
            WHERE ac.status = 'pending'
            ORDER BY ac.created_at DESC
        ");
        $stmt->execute();
        $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'corrections' => $corrections
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

function handleApproveCorrection($correctionId) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Get correction details
        $stmt = $pdo->prepare("
            SELECT * FROM attendance_corrections WHERE id = ? AND status = 'pending'
        ");
        $stmt->execute([$correctionId]);
        $correction = $stmt->fetch();
        
        if (!$correction) {
            throw new Exception('Correction not found or already processed');
        }
        
        // Update or insert attendance record
        $stmt = $pdo->prepare("
            SELECT id FROM attendance 
            WHERE user_id = ? AND DATE(created_at) = ?
        ");
        $stmt->execute([$correction['user_id'], $correction['date']]);
        $existingRecord = $stmt->fetch();
        
        if ($existingRecord) {
            // Update existing record
            $stmt = $pdo->prepare("
                UPDATE attendance 
                SET time_in = COALESCE(?, time_in), 
                    time_out = COALESCE(?, time_out),
                    status = 'present'
                WHERE id = ?
            ");
            $stmt->execute([$correction['time_in'], $correction['time_out'], $existingRecord['id']]);
        } else {
            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO attendance (user_id, time_in, time_out, status, created_at) 
                VALUES (?, ?, ?, 'present', ?)
            ");
            $stmt->execute([
                $correction['user_id'], 
                $correction['time_in'], 
                $correction['time_out'], 
                $correction['date']
            ]);
        }
        
        // Update correction status
        $stmt = $pdo->prepare("
            UPDATE attendance_corrections SET status = 'approved' WHERE id = ?
        ");
        $stmt->execute([$correctionId]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Correction approved successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function handleRejectCorrection($correctionId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            UPDATE attendance_corrections SET status = 'rejected' WHERE id = ? AND status = 'pending'
        ");
        $stmt->execute([$correctionId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Correction not found or already processed');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Correction rejected successfully'
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Database error: ' . $e->getMessage());
    }
}
?>
