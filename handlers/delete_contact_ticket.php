<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

try {
    // Get the ticket ID from the POST request
    $data = json_decode(file_get_contents('php://input'), true);
    $ticketId = isset($data['id']) ? intval($data['id']) : 0;

    if ($ticketId <= 0) {
        throw new Exception("Invalid ticket ID");
    }

    // Prepare and execute delete query
    $query = "DELETE FROM contact_tickets WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $ticketId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Ticket deleted successfully']);
        } else {
            throw new Exception("Ticket not found");
        }
    } else {
        throw new Exception("Error deleting ticket: " . $conn->error);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?> 