// Attendance.js - Handles attendance monitoring functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializeDashboard();
    setupEventListeners();
});

// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to update dashboard statistics
async function updateDashboardStats() {
    try {
        const response = await fetch('../handlers/get_dashboard_stats.php');
        const data = await response.json();

        if (data.status === 'success') {
            // Update stat cards with animations
            animateNumber('presentCount', data.data.present_today);
            animateNumber('absentCount', data.data.absent_today);
            animateNumber('lateCount', data.data.late_arrivals);
            animateNumber('correctionCount', data.data.pending_corrections);
        } else {
            console.error('Error fetching dashboard stats:', data.message);
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Function to animate number changes
function animateNumber(elementId, newValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000; // Animation duration in milliseconds
    const steps = 60; // Number of steps in animation
    const stepValue = (newValue - currentValue) / steps;
    let currentStep = 0;

    const animation = setInterval(() => {
        currentStep++;
        const currentNumber = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = formatNumber(currentNumber);

        if (currentStep >= steps) {
            clearInterval(animation);
            element.textContent = formatNumber(newValue); // Ensure final value is exact
        }
    }, duration / steps);
}

// Function to update pending corrections list
async function updatePendingCorrections() {
    try {
        const response = await fetch('../handlers/get_pending_corrections.php');
        const data = await response.json();

        if (data.status === 'success') {
            const correctionsList = document.querySelector('.corrections-list');
            correctionsList.innerHTML = ''; // Clear existing items

            data.corrections.forEach(correction => {
                const correctionItem = document.createElement('div');
                correctionItem.className = 'correction-item';
                correctionItem.innerHTML = `
                    <div class="correction-info">
                        <div class="correction-name">${correction.employee_name}</div>
                        <div class="correction-date">Date: ${correction.date}</div>
                        <div class="correction-reason">${correction.reason}</div>
                    </div>
                    <div class="correction-actions">
                        <button class="btn-approve" data-id="${correction.id}">Approve</button>
                        <button class="btn-reject" data-id="${correction.id}">Reject</button>
                    </div>
                `;
                correctionsList.appendChild(correctionItem);
            });

            // Add event listeners to new buttons
            setupCorrectionButtons();
        }
    } catch (error) {
        console.error('Error updating corrections list:', error);
    }
}

// Function to update today's attendance list
async function updateTodayAttendance() {
    try {
        const response = await fetch('../handlers/get_today_attendance.php');
        const data = await response.json();

        if (data.status === 'success') {
            const attendanceList = document.querySelector('.attendance-list');
            attendanceList.innerHTML = ''; // Clear existing items

            data.attendance.forEach(record => {
                const attendanceItem = document.createElement('div');
                attendanceItem.className = 'attendance-item';
                attendanceItem.innerHTML = `
                    <div class="attendance-info">
                        <div class="attendance-name">${record.employee_name}</div>
                        <div class="attendance-time">
                            In: ${record.time_in || '-'} | Out: ${record.time_out || '-'}
                        </div>
                    </div>
                    <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                `;
                attendanceList.appendChild(attendanceItem);
            });
        }
    } catch (error) {
        console.error('Error updating attendance list:', error);
    }
}

// Function to setup correction approval/rejection buttons
function setupCorrectionButtons() {
    document.querySelectorAll('.btn-approve, .btn-reject').forEach(button => {
        button.addEventListener('click', async function() {
            const correctionId = this.dataset.id;
            const action = this.classList.contains('btn-approve') ? 'approve' : 'reject';
            
            try {
                const response = await fetch('../handlers/process_correction.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        correction_id: correctionId,
                        action: action
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    // Update both the corrections list and dashboard stats
                    updatePendingCorrections();
                    updateDashboardStats();
                }
            } catch (error) {
                console.error('Error processing correction:', error);
            }
        });
    });
}

// Initialize dashboard
function initializeDashboard() {
    // Initial updates
    updateDashboardStats();
    updatePendingCorrections();
    updateTodayAttendance();

    // Set up auto-refresh intervals
    setInterval(updateDashboardStats, 300000); // Every 5 minutes
    setInterval(updatePendingCorrections, 300000);
    setInterval(updateTodayAttendance, 300000);

    // Setup event listeners for the view all buttons
    document.querySelector('.view-all-corrections').addEventListener('click', () => {
        window.location.href = 'corrections.html';
    });

    document.querySelector('.view-all-attendance').addEventListener('click', () => {
        window.location.href = 'attendance_records.html';
    });
}

// Setup event listeners
function setupEventListeners() {
    // Generate report button
    document.querySelector('.generate-report-btn').addEventListener('click', generateMonthlyReport);
    
    // View all buttons
    document.querySelector('.view-all-corrections').addEventListener('click', () => {
        // Implement view all corrections functionality
    });
    
    document.querySelector('.view-all-attendance').addEventListener('click', () => {
        // Implement view all attendance functionality
    });
}

// Generate monthly DTR report
async function generateMonthlyReport() {
    try {
        const response = await fetch('../handlers/generate_monthly_dtr.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            })
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DTR_Report_${formatDate(new Date())}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        showSuccess('Report generated successfully');
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate report');
    }
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showSuccess(message) {
    // Implement success toast notification
    console.log('Success:', message);
}

function showError(message) {
    // Implement error toast notification
    console.error('Error:', message);
} 