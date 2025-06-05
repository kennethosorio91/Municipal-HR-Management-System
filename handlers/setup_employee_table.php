<?php
require_once 'db_connection.php';

try {
    // Create the employee_records table with all necessary fields
    $sql = "CREATE TABLE IF NOT EXISTS employee_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(10) NOT NULL UNIQUE,
        FullName VARCHAR(100) NOT NULL,
        Position VARCHAR(100) NOT NULL,
        Department VARCHAR(50) NOT NULL,
        employment_type ENUM('Permanent', 'Contractual', 'Job Order', 'Probationary') NOT NULL,
        Status ENUM('Active', 'Inactive', 'On Leave', 'Terminated') NOT NULL,
        DateHired DATE NOT NULL,
        Email VARCHAR(100) NOT NULL UNIQUE,
        Phone VARCHAR(20),
        Address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";

    if ($conn->query($sql)) {
        echo "Table employee_records created successfully or already exists<br>";
    } else {
        throw new Exception("Error creating table: " . $conn->error);
    }

    // Create a trigger for auto-generating employee_id
    $trigger_sql = "
    CREATE TRIGGER IF NOT EXISTS before_employee_insert 
    BEFORE INSERT ON employee_records 
    FOR EACH ROW 
    BEGIN 
        DECLARE next_id INT;
        SET next_id = (SELECT IFNULL(MAX(CAST(SUBSTRING(employee_id, 2) AS UNSIGNED)), 0) + 1 FROM employee_records);
        SET NEW.employee_id = CONCAT('E', LPAD(next_id, 4, '0'));
    END;
    ";

    if ($conn->multi_query($trigger_sql)) {
        echo "Trigger for auto-generating employee_id created successfully<br>";
    } else {
        throw new Exception("Error creating trigger: " . $conn->error);
    }

    echo "Database setup completed successfully!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
} finally {
    $conn->close();
}
?> 