// Admin Attendance Page JavaScript

class AdminAttendanceManager {
    constructor() {
        // Get stat card elements
        this.presentCount = document.querySelector('.attendance-card:nth-child(1) .stat-number');
        this.absentCount = document.querySelector('.attendance-card:nth-child(2) .stat-number');
        this.lateCount = document.querySelector('.attendance-card:nth-child(3) .stat-number');
        this.correctionsCount = document.querySelector('.attendance-card:nth-child(4) .stat-number');
        
        // Get list containers
        this.correctionsList = document.querySelector('.corrections-list');
        this.attendanceList = document.querySelector('.attendance-list');
        
        // Initialize
        this.init();
    }
    
    async init() {
        await this.loadDashboardStats();
        await this.loadPendingCorrections();
        await this.loadTodayAttendance();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Handle correction actions
        this.correctionsList.addEventListener('click', async (e) => {
            if (e.target.matches('.approve-btn, .reject-btn')) {
                const correctionItem = e.target.closest('.correction-item');
                const action = e.target.classList.contains('approve-btn') ? 'approve' : 'reject';
                const correctionId = correctionItem.dataset.correctionId;
                await this.handleCorrectionAction(correctionId, action);
            }
        });

        // Handle report generation
        const reportBtn = document.querySelector('.generate-report-btn');
        reportBtn.addEventListener('click', () => this.generateMonthlyReport());
    }
    
    async loadDashboardStats() {
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php?action=get_stats');
            const data = await response.json();
            
            if (data.success) {
                this.presentCount.textContent = data.stats.present_count;
                this.absentCount.textContent = data.stats.absent_count;
                this.lateCount.textContent = data.stats.late_count;
                this.correctionsCount.textContent = data.stats.corrections_count;
            } else {
                console.error('Error loading stats:', data.error);
            }
        } catch (error) {
            console.error('Network error loading stats:', error);
        }
    }
    
    async loadPendingCorrections() {
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php?action=get_corrections');
            const data = await response.json();
            
            if (data.success) {
                this.renderCorrectionsList(data.corrections);
            } else {
                console.error('Error loading corrections:', data.error);
            }
        } catch (error) {
            console.error('Network error loading corrections:', error);
        }
    }
    
    async loadTodayAttendance() {
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php?action=get_today_attendance');
            const data = await response.json();
            
            if (data.success) {
                this.renderAttendanceList(data.attendance);
            } else {
                console.error('Error loading today\'s attendance:', data.error);
            }
        } catch (error) {
            console.error('Network error loading today\'s attendance:', error);
        }
    }
    
    renderCorrectionsList(corrections) {
        if (!corrections.length) {
            this.correctionsList.innerHTML = '<div class="loading-message">No pending corrections</div>';
            return;
        }
        
        this.correctionsList.innerHTML = corrections.map(correction => `
            <div class="correction-item" data-correction-id="${correction.id}">
                <div class="correction-details">
                    <h4>${correction.employee_name}</h4>
                    <p class="correction-reason">${correction.reason}</p>
                </div>
                <div class="correction-date">Date: ${correction.date}</div>
                ${correction.status === 'pending' ? `
                    <div class="correction-actions">
                        <button class="approve-btn">Approve</button>
                        <button class="reject-btn">Reject</button>
                    </div>
                ` : `
                    <div class="status-badge ${correction.status}">${correction.status}</div>
                `}
            </div>
        `).join('');
    }
    
    renderAttendanceList(attendance) {
        if (!attendance.length) {
            this.attendanceList.innerHTML = '<div class="loading-message">No attendance records for today</div>';
            return;
        }
        
        this.attendanceList.innerHTML = attendance.map(record => `
            <div class="attendance-item">
                <div class="employee-details">
                    <h4>${record.employee_name}</h4>
                    <p>In: ${record.time_in || '-'} | Out: ${record.time_out || '-'}</p>
                </div>
                <div class="status-badge ${record.status.toLowerCase()}">${record.status}</div>
            </div>
        `).join('');
    }
    
    async handleCorrectionAction(correctionId, action) {
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'update_correction',
                    correction_id: correctionId,
                    status: action
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Refresh the corrections list and dashboard stats
                await this.loadPendingCorrections();
                await this.loadDashboardStats();
            } else {
                console.error('Error updating correction:', data.error);
            }
        } catch (error) {
            console.error('Network error updating correction:', error);
        }
    }
    
    generateMonthlyReport() {
        const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
        window.location.href = `../handlers/attendance_report.php?month=${currentMonth}`;
    }
}

// Initialize the manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminAttendanceManager();
});
