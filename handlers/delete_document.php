<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    if (!isset($_SESSION['email'])) {
        throw new Exception('User not logged in');
    }

    // Check if it's a DELETE request or using query parameter
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Parse the request body if needed
        parse_str(file_get_contents('php://input'), $data);
        $documentId = $data['id'] ?? null;
    } else {
        // Fallback to GET parameter
        $documentId = $_GET['id'] ?? null;
    }

    if (!$documentId) {
        throw new Exception('Document ID not provided');
    }

    $email = $_SESSION['email'];

    // First check if the document exists and belongs to the user
    $stmt = $conn->prepare("
        SELECT file_path 
        FROM user_documents 
        WHERE id = ? AND email = ?
    ");
    
    $stmt->bind_param("is", $documentId, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Document not found or you do not have permission to delete it');
    }

    $document = $result->fetch_assoc();
    $filePath = '../uploads/documents/' . $document['file_path'];

    // Delete document record
    $stmt = $conn->prepare("DELETE FROM user_documents WHERE id = ? AND email = ?");
    $stmt->bind_param("is", $documentId, $email);
    $success = $stmt->execute();

    if ($success) {
        // Also try to delete the physical file (if it exists)
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Document deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete document');
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
