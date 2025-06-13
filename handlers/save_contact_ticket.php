<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

try {
    // Get the request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['name']) || !isset($data['email']) || !isset($data['message'])) {
        throw new Exception('Name, email, and message are required');
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Prepare and execute the insert statement
    $stmt = $conn->prepare("INSERT INTO contact_tickets (name, email, message) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $data['name'], $data['email'], $data['message']);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Message sent successfully',
            'ticket_id' => $stmt->insert_id
        ]);
    } else {
        throw new Exception('Error saving message');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 