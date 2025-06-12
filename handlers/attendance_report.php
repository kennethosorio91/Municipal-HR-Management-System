<?php
session_start();
require_once '../config/db_connect.php';

// Check if user is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo 'Access denied';
    exit;
}

$month = $_GET['month'] ?? date('Y-m');

try {
    // Get attendance data for the specified month
    $stmt = $pdo->prepare("
        SELECT 
            u.full_name,
            u.username,
            DATE(a.created_at) as date,
            a.time_in,
            a.time_out,
            a.status,
            TIMESTAMPDIFF(MINUTE, a.time_in, a.time_out) as total_minutes
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE DATE_FORMAT(a.created_at, '%Y-%m') = ?
        ORDER BY u.full_name, a.created_at
    ");
    $stmt->execute([$month]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="attendance_report_' . $month . '.csv"');
    header('Cache-Control: max-age=0');
    
    // Open output stream
    $output = fopen('php://output', 'w');
    
    // Write CSV header
    fputcsv($output, [
        'Employee Name',
        'Username', 
        'Date',
        'Time In',
        'Time Out',
        'Total Hours',
        'Status'
    ]);
    
    // Write data rows
    foreach ($records as $record) {
        $totalHours = $record['total_minutes'] ? 
            sprintf('%d:%02d', floor($record['total_minutes'] / 60), $record['total_minutes'] % 60) : 
            '0:00';
            
        fputcsv($output, [
            $record['full_name'],
            $record['username'],
            $record['date'],
            $record['time_in'] ?: '-',
            $record['time_out'] ?: '-',
            $totalHours,
            ucfirst($record['status'])
        ]);
    }
    
    fclose($output);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo 'Database error: ' . $e->getMessage();
} catch (Exception $e) {
    http_response_code(500);
    echo 'Server error: ' . $e->getMessage();
}
?>
