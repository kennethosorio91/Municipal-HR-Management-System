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

        // Mock data
        this.mockData = {
            stats: {
                present_count: 20,
                absent_count: 2,
                late_count: 3,
                corrections_count: 3
            },
            corrections: [
                {
                    id: 1,
                    employee_name: 'Juan Dela Cruz',
                    reason: 'Forgot to clock out on June 24, 2025.',
                    date: '2025-06-24',
                    status: 'pending'
                },
                {
                    id: 2,
                    employee_name: 'Maria Clara',
                    reason: 'System error during clock-in.',
                    date: '2025-06-25',
                    status: 'pending'
                },
                {
                    id: 3,
                    employee_name: 'Lyza Gean',
                    reason: 'Attended an off-site meeting.',
                    date: '2025-06-25',
                    status: 'pending'
                }
            ],
            attendance: [
                { employee_name: 'Juan Dela Cruz', time_in: '08:05', time_out: '17:02', status: 'Late' },
                { employee_name: 'Maria Clara', time_in: '07:58', time_out: '17:00', status: 'Present' },
                { employee_name: 'Crisostomo Ibarra', time_in: '08:15', time_out: '17:10', status: 'Late' },
                { employee_name: 'Lyza Gean', time_in: '07:59', time_out: '17:01', status: 'Present' },
            ]
        };
        
        // Initialize
        this.init();
    }
    
    async init() {
        this.loadDashboardStats();
        this.loadPendingCorrections();
        this.loadTodayAttendance();
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
    
    loadDashboardStats() {
        const data = this.mockData;
        this.presentCount.textContent = data.stats.present_count;
        this.absentCount.textContent = data.stats.absent_count;
        this.lateCount.textContent = data.stats.late_count;
        this.correctionsCount.textContent = data.stats.corrections_count;
    }
    
    loadPendingCorrections() {
        const pendingCorrections = this.mockData.corrections.filter(c => c.status === 'pending');
        this.renderCorrectionsList(pendingCorrections);
    }
    
    loadTodayAttendance() {
        this.renderAttendanceList(this.mockData.attendance);
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
    
    handleCorrectionAction(correctionId, action) {
        const correction = this.mockData.corrections.find(c => c.id == correctionId);
        if (correction) {
            correction.status = action === 'approve' ? 'approved' : 'rejected';
            this.loadPendingCorrections(); // Re-render the list of pending corrections
            
            // Update the count
            const pendingCount = this.mockData.corrections.filter(c => c.status === 'pending').length;
            this.correctionsCount.textContent = pendingCount;
        }
    }
    
    generateMonthlyReport() {
        const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const employees = [
            'Juan Dela Cruz', 'Maria Clara', 'Crisostomo Ibarra', 'Lyza Gean', 'Simoun', 'Elias',
            'Padre Damaso', 'Kapitan Tiago', 'Sisa', 'Basilio', 'Crispin', 'Donya Victorina',
            'Tiburcio de Espadaña', 'Alfonso Linares', 'Tasyo the Sage', 'Don Rafael Ibarra',
            'Gobernador-Heneral', 'Padre Salvi', 'Padre Sibyla', 'Tandang Selo', 'Kabesang Tales', 'Juli'
        ]; // 22 employees

        let reportData = [['Employee Name', 'Date', 'Time In', 'Time Out', 'Status']];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            // Skip weekends for simplicity
            if (date.getDay() === 0 || date.getDay() === 6) {
                continue;
            }

            for (const employee of employees) {
                const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                let status, time_in, time_out;

                const random = Math.random();
                if (random < 0.05) { // 5% chance of being absent
                    status = 'Absent';
                    time_in = '';
                    time_out = '';
                } else if (random < 0.15) { // 10% chance of being late
                    status = 'Late';
                    const hour = String(Math.floor(Math.random() * 2) + 8).padStart(2, '0'); // 08-09
                    const minute = String(Math.floor(Math.random() * 59) + 1).padStart(2, '0'); // 01-59
                    time_in = `${hour}:${minute}`;
                    time_out = `17:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
                } else { // 85% chance of being present
                    status = 'Present';
                    time_in = `07:${String(Math.floor(Math.random() * 30) + 30).padStart(2, '0')}`; // 07:30-07:59
                    time_out = `17:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
                }
                reportData.push([employee, dateStr, time_in, time_out, status]);
            }
        }

        const csvContent = reportData.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Monthly_Attendance_Report_${currentMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminAttendanceManager();
});
