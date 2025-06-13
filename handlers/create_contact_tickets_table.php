<?php
require_once 'db_connection.php';

try {
    // Create contact_tickets table
    $sql = "CREATE TABLE IF NOT EXISTS contact_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        sent_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";

    if ($conn->query($sql) === TRUE) {
        echo "Contact tickets table created successfully";
    } else {
        echo "Error creating table: " . $conn->error;
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}

$conn->close();
?> 