<?php
header('Content-Type: application/json');
require_once '../config/db_connect.php';

try {
    error_log("Starting salary calculation...");
    
    if (!isset($_GET['salary_grade'])) {
        throw new Exception('Salary grade is required');
    }

    $salary_grade = intval($_GET['salary_grade']);
    error_log("Calculating for salary grade: " . $salary_grade);
    
    if ($salary_grade < 1 || $salary_grade > 33) {
        throw new Exception('Invalid salary grade. Must be between 1 and 33.');
    }

    // Get salary grade details
    $stmt = $conn->prepare("SELECT * FROM salary_grades WHERE grade_level = ?");
    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $salary_grade);
    if (!$stmt->execute()) {
        throw new Exception('Failed to execute query: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    error_log("Query executed, found rows: " . $result->num_rows);
    
    if ($result->num_rows === 0) {
        throw new Exception('Salary grade not found');
    }

    $salary_data = $result->fetch_assoc();
    $basic_salary = floatval($salary_data['basic_salary']);
    $pera = floatval($salary_data['pera_allowance']);
    
    error_log("Basic salary: " . $basic_salary . ", PERA: " . $pera);

    // Calculate monthly deductions
    $gsis = $basic_salary * 0.09; // 9% GSIS contribution
    $philhealth = calculatePhilHealth($basic_salary);
    $pagibig = 100; // Standard Pag-IBIG contribution
    $tax = calculateTax($basic_salary);
    
    error_log("Deductions calculated - GSIS: " . $gsis . ", PhilHealth: " . $philhealth . ", Pag-IBIG: " . $pagibig . ", Tax: " . $tax);

    $monthly = [
        'basic_salary' => $basic_salary,
        'allowance' => $pera,
        'gross_salary' => $basic_salary + $pera,
        'deductions' => [
            'gsis' => $gsis,
            'philhealth' => $philhealth,
            'pagibig' => $pagibig,
            'tax' => $tax,
            'total_deductions' => $gsis + $philhealth + $pagibig + $tax
        ],
        'net_salary' => ($basic_salary + $pera) - ($gsis + $philhealth + $pagibig + $tax)
    ];

    // Calculate quarterly projections
    $quarterly = [
        'gross_salary' => $monthly['gross_salary'] * 3,
        'net_salary' => $monthly['net_salary'] * 3
    ];

    // Calculate annual projections
    $mid_year_bonus = $basic_salary;
    $year_end_bonus = $basic_salary;
    $thirteenth_month = $basic_salary;

    $annual = [
        'gross_salary' => $monthly['gross_salary'] * 12,
        'net_salary' => $monthly['net_salary'] * 12,
        'mid_year_bonus' => $mid_year_bonus,
        'year_end_bonus' => $year_end_bonus,
        'thirteenth_month' => $thirteenth_month,
        'total_compensation' => ($monthly['net_salary'] * 12) + $mid_year_bonus + $year_end_bonus + $thirteenth_month
    ];
    
    error_log("Calculation completed successfully");

    echo json_encode([
        'success' => true,
        'data' => [
            'monthly' => $monthly,
            'quarterly' => $quarterly,
            'annual' => $annual
        ]
    ]);

} catch (Exception $e) {
    error_log("Salary calculation error: " . $e->getMessage());
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

// Helper function to calculate PhilHealth contribution
function calculatePhilHealth($basic_salary) {
    $rate = 0.03; // 3% contribution rate
    $contribution = $basic_salary * $rate;
    return min(max($contribution, 400), 3200); // Min 400, Max 3200
}

// Helper function to calculate withholding tax
function calculateTax($basic_salary) {
    $annual_salary = $basic_salary * 12;
    $tax = 0;

    if ($annual_salary <= 250000) {
        return 0;
    } elseif ($annual_salary <= 400000) {
        $tax = ($annual_salary - 250000) * 0.20;
    } elseif ($annual_salary <= 800000) {
        $tax = 30000 + ($annual_salary - 400000) * 0.25;
    } elseif ($annual_salary <= 2000000) {
        $tax = 130000 + ($annual_salary - 800000) * 0.30;
    } elseif ($annual_salary <= 8000000) {
        $tax = 490000 + ($annual_salary - 2000000) * 0.32;
    } else {
        $tax = 2410000 + ($annual_salary - 8000000) * 0.35;
    }

    return $tax / 12; // Convert annual tax to monthly
}
?> 