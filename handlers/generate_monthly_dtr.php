<?php
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="DTR_Report.xlsx"');
require_once '../config/db_connect.php';
require_once '../vendor/autoload.php'; // For PhpSpreadsheet

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    $month = $input['month'] ?? date('m');
    $year = $input['year'] ?? date('Y');
    
    // Get monthly attendance records
    $query = "SELECT 
        e.fullName as employee_name,
        e.position,
        e.department,
        ar.date,
        ar.time_in,
        ar.time_out,
        ar.status,
        TIMEDIFF(ar.time_out, ar.time_in) as hours_worked
    FROM attendance_records ar
    JOIN employees e ON ar.employee_id = e.id
    WHERE MONTH(ar.date) = ? AND YEAR(ar.date) = ?
    ORDER BY e.fullName, ar.date";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $month, $year);
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Create new Spreadsheet
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Set document properties
    $spreadsheet->getProperties()
        ->setCreator('Municipality of Concepcion HR System')
        ->setLastModifiedBy('HR Department')
        ->setTitle('Monthly DTR Report - ' . date('F Y', strtotime("$year-$month-01")));
    
    // Title
    $sheet->mergeCells('A1:H1');
    $sheet->mergeCells('A2:H2');
    $sheet->setCellValue('A1', 'Municipality of Concepcion');
    $sheet->setCellValue('A2', 'Daily Time Record Report - ' . date('F Y', strtotime("$year-$month-01")));
    
    // Style the title
    $sheet->getStyle('A1:A2')->applyFromArray([
        'font' => [
            'bold' => true,
            'size' => 14
        ],
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_CENTER
        ]
    ]);
    
    // Headers
    $headers = ['Employee Name', 'Position', 'Department', 'Date', 'Time In', 'Time Out', 'Hours', 'Status'];
    $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    foreach ($columns as $index => $column) {
        $sheet->setCellValue($column . '4', $headers[$index]);
        $sheet->getColumnDimension($column)->setAutoSize(true);
    }
    
    // Style the headers
    $sheet->getStyle('A4:H4')->applyFromArray([
        'font' => [
            'bold' => true
        ],
        'fill' => [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => [
                'rgb' => 'F0F0F0'
            ]
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN
            ]
        ]
    ]);
    
    // Data
    $row = 5;
    $currentEmployee = '';
    
    while ($data = $result->fetch_assoc()) {
        // Add a blank row between employees
        if ($currentEmployee != $data['employee_name'] && $currentEmployee != '') {
            $row++;
        }
        
        $currentEmployee = $data['employee_name'];
        
        $sheet->setCellValue('A' . $row, $data['employee_name']);
        $sheet->setCellValue('B' . $row, $data['position']);
        $sheet->setCellValue('C' . $row, $data['department']);
        $sheet->setCellValue('D' . $row, date('m/d/Y', strtotime($data['date'])));
        $sheet->setCellValue('E' . $row, $data['time_in']);
        $sheet->setCellValue('F' . $row, $data['time_out']);
        $sheet->setCellValue('G' . $row, $data['hours_worked']);
        $sheet->setCellValue('H' . $row, $data['status']);
        
        // Style the data row
        $sheet->getStyle('A' . $row . ':H' . $row)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN
                ]
            ]
        ]);
        
        // Color code the status
        switch (strtolower($data['status'])) {
            case 'present':
                $color = '3BB77E'; // Green
                break;
            case 'absent':
                $color = 'FF4B55'; // Red
                break;
            case 'late':
                $color = 'FF974A'; // Orange
                break;
            default:
                $color = '000000'; // Black
        }
        
        $sheet->getStyle('H' . $row)->applyFromArray([
            'font' => [
                'color' => [
                    'rgb' => $color
                ]
            ]
        ]);
        
        $row++;
    }
    
    // Add summary at the bottom
    $row += 2;
    $sheet->mergeCells('A' . $row . ':C' . $row);
    $sheet->setCellValue('A' . $row, 'Summary for ' . date('F Y', strtotime("$year-$month-01")));
    $sheet->getStyle('A' . $row)->applyFromArray([
        'font' => [
            'bold' => true
        ]
    ]);
    
    // Add summary statistics
    $summaryQuery = "SELECT 
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'Late' THEN 1 END) as late_count
    FROM attendance_records
    WHERE MONTH(date) = ? AND YEAR(date) = ?";
    
    $stmt = $conn->prepare($summaryQuery);
    $stmt->bind_param('ii', $month, $year);
    $stmt->execute();
    $summary = $stmt->get_result()->fetch_assoc();
    
    $row++;
    $sheet->setCellValue('A' . $row, 'Present: ' . $summary['present_count']);
    $row++;
    $sheet->setCellValue('A' . $row, 'Absent: ' . $summary['absent_count']);
    $row++;
    $sheet->setCellValue('A' . $row, 'Late: ' . $summary['late_count']);
    
    // Create Excel file
    $writer = new Xlsx($spreadsheet);
    
    // Save to PHP output
    ob_end_clean(); // Clean output buffer
    $writer->save('php://output');
    
} catch (Exception $e) {
    // Log error for debugging
    error_log("Error in generate_monthly_dtr.php: " . $e->getMessage());
    
    // Return error response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Failed to generate DTR report'
    ]);
}

// Close database connection
$conn->close(); 