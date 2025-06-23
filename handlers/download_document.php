<?php
session_start();
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    $documentId = $_GET['id'] ?? null;
    $email = $_SESSION['email'];

    if (!$documentId) {
        throw new Exception('Document ID not provided');
    }

    // Get document info from database
    $stmt = $conn->prepare("
        SELECT d.file_path, d.title as file_name
        FROM documents d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.id = ? AND u.email = ?
    ");
    
    $stmt->bind_param("is", $documentId, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Document not found');
    }

    $document = $result->fetch_assoc();
    $filePath = '../uploads/documents/' . $document['file_path'];

    if (!file_exists($filePath)) {
        // If file doesn't exist, create a sample file
        $sampleContent = "This is a sample document for " . $document['file_name'] . "\n";
        $sampleContent .= "Generated on: " . date('Y-m-d H:i:s') . "\n";
        $sampleContent .= "For: " . $email;
        
        file_put_contents($filePath, $sampleContent);
    }

    // Set headers for download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $document['file_name'] . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    
    // Output file
    readfile($filePath);
    exit;

} catch (Exception $e) {
    header('Content-Type: application/json');
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