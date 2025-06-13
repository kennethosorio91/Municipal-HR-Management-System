<?php
header('Content-Type: application/json');
session_start();
require_once '../config/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['user_id'];
$year = isset($_GET['year']) ? $_GET['year'] : date('Y');

try {
    // For now, return sample benefits data
    // In a real implementation, this would query the benefits table
    $benefits = [
        [
            'benefit_type' => '13th Month Pay',
            'amount' => 25000.00,
            'date_granted' => '2024-12-15',
            'status' => 'Paid'
        ],
        [
            'benefit_type' => 'Year-End Bonus',
            'amount' => 15000.00,
            'date_granted' => '2024-12-20',
            'status' => 'Pending'
        ],
        [
            'benefit_type' => 'PERA',
            'amount' => 2000.00,
            'date_granted' => '2024-12-01',
            'status' => 'Monthly'
        ],
        [
            'benefit_type' => 'Clothing Allowance',
            'amount' => 6000.00,
            'date_granted' => '2024-08-15',
            'status' => 'Paid'
        ]
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $benefits
    ]);
    
} catch (Exception $e) {
    error_log("Error in fetch_benefits.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 