<?php
header('Content-Type: application/json');
session_start();
require_once '../config/db_connect.php';

try {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("User not logged in");
    }

    $user_id = $_SESSION['user_id'];
    
    // Check if requesting download
    if (isset($_GET['download']) && $_GET['download'] === 'true') {
        // For now, return error as PDF generation is not implemented
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'PDF download not implemented yet']);
        exit;
    }
    
    // Check if requesting history
    if (isset($_GET['history']) && $_GET['history'] === 'true') {
        // Return sample payslip history
        $history = [
            [
                'pay_period' => '2024-11',
                'basic_salary' => 25000.00,
                'pera_allowance' => 2000.00,
                'other_allowances' => 3000.00,
                'gsis_contribution' => 2500.00,
                'philhealth_contribution' => 875.00,
                'pagibig_contribution' => 200.00,
                'tax_withheld' => 2535.00,
                'total_deductions' => 6110.00,
                'net_pay' => 23890.00
            ],
            [
                'pay_period' => '2024-10',
                'basic_salary' => 25000.00,
                'pera_allowance' => 2000.00,
                'other_allowances' => 3850.00,
                'gsis_contribution' => 2500.00,
                'philhealth_contribution' => 875.00,
                'pagibig_contribution' => 200.00,
                'tax_withheld' => 2425.00,
                'total_deductions' => 6000.00,
                'net_pay' => 24850.00
            ],
            [
                'pay_period' => '2024-09',
                'basic_salary' => 25000.00,
                'pera_allowance' => 2000.00,
                'other_allowances' => 3828.00,
                'gsis_contribution' => 2500.00,
                'philhealth_contribution' => 875.00,
                'pagibig_contribution' => 200.00,
                'tax_withheld' => 2425.00,
                'total_deductions' => 6000.00,
                'net_pay' => 24828.00
            ],
            [
                'pay_period' => '2024-08',
                'basic_salary' => 25000.00,
                'pera_allowance' => 2000.00,
                'other_allowances' => 3100.00,
                'gsis_contribution' => 2500.00,
                'philhealth_contribution' => 875.00,
                'pagibig_contribution' => 200.00,
                'tax_withheld' => 2425.00,
                'total_deductions' => 6000.00,
                'net_pay' => 24100.00
            ]
        ];
        
        echo json_encode(['success' => true, 'data' => $history]);
        exit;
    }
    
    // Check if requesting specific pay period
    if (isset($_GET['pay_period'])) {
        $pay_period = $_GET['pay_period'];
        // For now, return the same current payslip data
        // In real implementation, this would fetch from database based on pay_period
    }
    
    // Return current payslip (sample data)
    $currentPayslip = [
        'pay_period' => '2024-12',
        'basic_salary' => 25000.00,
        'pera_allowance' => 2000.00,
        'other_allowances' => 4500.00,
        'gsis_contribution' => 2500.00,
        'philhealth_contribution' => 875.00,
        'pagibig_contribution' => 200.00,
        'tax_withheld' => 3100.00,
        'total_deductions' => 6675.00,
        'net_pay' => 24825.00
    ];
    
    echo json_encode(['success' => true, 'data' => $currentPayslip]);
    
} catch (Exception $e) {
    error_log("Error in fetch_payslip.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error fetching payslip data: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
