<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

class ContactTicketHandler {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Save new ticket
    public function saveTicket($data) {
        try {
            // Validate required fields
            if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
                throw new Exception('Name, email, and message are required');
            }

            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }

            // Prepare and execute the insert statement
            $stmt = $this->conn->prepare("INSERT INTO contact_tickets (name, email, message) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $data['name'], $data['email'], $data['message']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'ticket_id' => $stmt->insert_id
                ];
            } else {
                throw new Exception('Error saving message');
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }

    // Get all tickets
    public function getTickets() {
        try {
            $query = "SELECT id, name, email, message, DATE_FORMAT(created_at, '%M %d, %Y %h:%i %p') as created_at 
                     FROM contact_tickets 
                     ORDER BY created_at DESC";
            
            $result = $this->conn->query($query);
            
            if ($result) {
                $tickets = array();
                while ($row = $result->fetch_assoc()) {
                    $tickets[] = $row;
                }
                return [
                    'success' => true,
                    'tickets' => $tickets
                ];
            } else {
                throw new Exception("Error fetching tickets");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}

// Handle the request
try {
    $handler = new ContactTicketHandler($conn);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle ticket submission
        $data = json_decode(file_get_contents('php://input'), true);
        $response = $handler->saveTicket($data);
    } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle ticket retrieval
        $response = $handler->getTickets();
    } else {
        $response = [
            'success' => false,
            'message' => 'Invalid request method'
        ];
    }
    
    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 