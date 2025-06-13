<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

try {
    // Prepare and execute query
    $query = "SELECT id, name, email, message, DATE_FORMAT(created_at, '%M %d, %Y %h:%i %p') as formatted_time 
              FROM contact_tickets 
              ORDER BY created_at DESC";
    
    $result = $conn->query($query);
    
    if ($result) {
        $tickets = array();
        while ($row = $result->fetch_assoc()) {
            // Truncate message for preview if longer than 100 characters
            $row['message_preview'] = strlen($row['message']) > 100 ? 
                                    substr($row['message'], 0, 100) . '...' : 
                                    $row['message'];
            $tickets[] = $row;
        }
        echo json_encode(['success' => true, 'tickets' => $tickets]);
    } else {
        throw new Exception("Error fetching tickets: " . $conn->error);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?> 