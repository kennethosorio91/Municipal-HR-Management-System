<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    if (!isset($_FILES['docFile'])) {
        throw new Exception('No file uploaded');
    }

    $email = $_SESSION['email'];
    
    // Get user_id from users table
    $userStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    if ($userStmt === false) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $userStmt->bind_param("s", $email);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    
    if ($userResult->num_rows === 0) {
        throw new Exception('User not found');
    }
    
    $user = $userResult->fetch_assoc();
    $userId = $user['id'];

    $file = $_FILES['docFile'];
    $fileName = $file['name'];
    $documentTitle = $_POST['docTitle'] ?? $fileName;
    $documentType = $_POST['docType'] ?? 'Other';

    // Validate file upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload failed with error code: ' . $file['error']);
    }

    // Create uploads directory if it doesn't exist
    $uploadDir = '../uploads/documents/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate unique filename
    $uniqueFileName = uniqid() . '_' . $fileName;
    $uploadPath = $uploadDir . $uniqueFileName;

    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        // Store document info in database
        $sql = "
            INSERT INTO documents (user_id, title, type, file_path, status, upload_date) 
            VALUES (?, ?, ?, ?, 'Pending', NOW())
        ";
        
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            throw new Exception('Database prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param("isss", $userId, $documentTitle, $documentType, $uniqueFileName);
        $stmt->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Document uploaded successfully'
        ]);
    } else {
        throw new Exception('Failed to move uploaded file');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    if (isset($userStmt)) {
        $userStmt->close();
    }
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
} 