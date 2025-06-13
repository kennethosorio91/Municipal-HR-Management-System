<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    if (!isset($_FILES['document'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['document'];
    $fileName = $file['name'];
    $fileType = $file['type'];
    $documentTitle = $_POST['title'] ?? $fileName;
    $email = $_SESSION['email'];

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
        $stmt = $conn->prepare("
            INSERT INTO user_documents (email, document_title, file_name, file_path, status) 
            VALUES (?, ?, ?, ?, 'Pending')
        ");
        
        $stmt->bind_param("ssss", $email, $documentTitle, $fileName, $uniqueFileName);
        $stmt->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Document uploaded successfully'
        ]);
    } else {
        throw new Exception('Failed to upload file');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
} 