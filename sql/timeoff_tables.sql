-- Leave Types Table
CREATE TABLE leave_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    default_credits DECIMAL(5,1) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Credits Table
CREATE TABLE leave_credits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    available_credits DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_credits DECIMAL(5,1) NOT NULL DEFAULT 0,
    year INT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    UNIQUE KEY unique_employee_leave_year (employee_id, leave_type_id, year)
);

-- Leave Requests Table
CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    attachment_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    processed_at TIMESTAMP NULL,
    approved_date DATE NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (processed_by) REFERENCES employees(id)
);

-- Travel Orders Table
CREATE TABLE travel_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    purpose TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Pending', 'Active', 'Completed', 'Cancelled') DEFAULT 'Pending',
    transportation_mode VARCHAR(50),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id)
);

-- Audit Trail Table
CREATE TABLE audit_trail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action_by INT NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    FOREIGN KEY (action_by) REFERENCES employees(id)
);

-- Insert default leave types
INSERT INTO leave_types (name, description, default_credits) VALUES
('Vacation Leave', 'Regular vacation leave credits', 15),
('Sick Leave', 'Medical-related leave credits', 15),
('Emergency Leave', 'For urgent personal matters', 3),
('Maternity Leave', 'For female employees giving birth', 105),
('Paternity Leave', 'For male employees with newborn child', 7),
('Special Leave', 'For special circumstances', 3);

-- Create trigger for yearly leave credit reset
DELIMITER //
CREATE TRIGGER reset_leave_credits_yearly
AFTER INSERT ON leave_credits
FOR EACH ROW
BEGIN
    -- Check if it's a new year
    IF NEW.year > (SELECT MAX(year) FROM leave_credits WHERE employee_id = NEW.employee_id) THEN
        -- Get default credits from leave type
        SET @default_credits = (SELECT default_credits FROM leave_types WHERE id = NEW.leave_type_id);
        
        -- Update the new record with default credits
        UPDATE leave_credits 
        SET available_credits = @default_credits,
            used_credits = 0
        WHERE id = NEW.id;
    END IF;
END //
DELIMITER ; 