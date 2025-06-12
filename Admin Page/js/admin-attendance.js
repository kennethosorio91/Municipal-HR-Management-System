// Admin Attendance Page JavaScript Functionality

class AdminAttendanceManager {
    constructor() {
        this.correctionsContainer = document.querySelector('.corrections-list');
        this.attendanceContainer = document.querySelector('.attendance-list');
        this.statsCards = document.querySelectorAll('.stat-number');
        
        this.init();
    }
    
    init() {
        this.loadCorrections();
        this.loadAttendanceStats();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Setup delegation for dynamically created buttons
        if (this.correctionsContainer) {
            this.correctionsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('approve-btn')) {
                    const correctionId = e.target.dataset.correctionId;
                    this.handleApproveCorrection(correctionId);
                } else if (e.target.classList.contains('reject-btn')) {
                    const correctionId = e.target.dataset.correctionId;
                    this.handleRejectCorrection(correctionId);
                }
            });
        }
        
        // Generate report button
        const generateReportBtn = document.querySelector('.generate-report-btn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateMonthlyReport());
        }
    }
    
    async loadCorrections() {
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php');
            const result = await response.json();
            
            if (result.success) {
                this.updateCorrectionsDisplay(result.corrections);
                this.updateCorrectionStats(result.corrections.length);
            } else {
                console.error('Failed to load corrections:', result.error);
            }
        } catch (error) {
            console.error('Error loading corrections:', error);
        }
    }
    
    updateCorrectionsDisplay(corrections) {
        if (!this.correctionsContainer) return;
        
        this.correctionsContainer.innerHTML = '';
        
        if (corrections.length === 0) {
            this.correctionsContainer.innerHTML = `
                <div class="no-corrections">
                    <p style="color: #6B7280; text-align: center; padding: 20px;">No pending corrections</p>
                </div>
            `;
            return;
        }
        
        corrections.forEach(correction => {
            const correctionElement = document.createElement('div');
            correctionElement.className = 'correction-item';
            correctionElement.innerHTML = `
                <div class="correction-details">
                    <h4>${correction.full_name || correction.username}</h4>
                    <p class="correction-reason">${correction.reason}</p>
                    <div class="correction-type">${this.formatCorrectionType(correction.correction_type)}</div>
                    ${correction.time_in ? `<div class="correction-time">Time In: ${this.formatTime(correction.time_in)}</div>` : ''}
                    ${correction.time_out ? `<div class="correction-time">Time Out: ${this.formatTime(correction.time_out)}</div>` : ''}
                </div>
                <div class="correction-date">Date: ${this.formatDate(correction.date)}</div>
                <div class="correction-actions">
                    <button class="approve-btn" data-correction-id="${correction.id}">Approve</button>
                    <button class="reject-btn" data-correction-id="${correction.id}">Reject</button>
                </div>
            `;
            this.correctionsContainer.appendChild(correctionElement);
        });
    }
    
    async handleApproveCorrection(correctionId) {
        if (!confirm('Are you sure you want to approve this correction?')) {
            return;
        }
        
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'approve',
                    correction_id: correctionId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Correction approved successfully', 'success');
                this.loadCorrections(); // Reload the list
                this.loadAttendanceStats(); // Update stats
            } else {
                this.showNotification(result.error || 'Failed to approve correction', 'error');
            }
        } catch (error) {
            console.error('Error approving correction:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }
    
    async handleRejectCorrection(correctionId) {
        if (!confirm('Are you sure you want to reject this correction?')) {
            return;
        }
        
        try {
            const response = await fetch('../handlers/admin_attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reject',
                    correction_id: correctionId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Correction rejected successfully', 'success');
                this.loadCorrections(); // Reload the list
                this.loadAttendanceStats(); // Update stats
            } else {
                this.showNotification(result.error || 'Failed to reject correction', 'error');
            }
        } catch (error) {
            console.error('Error rejecting correction:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }
    
    async loadAttendanceStats() {
        try {
            const response = await fetch('../handlers/admin_attendance_stats.php');
            const result = await response.json();
            
            if (result.success) {
                this.updateStatsDisplay(result.stats);
            }
        } catch (error) {
            console.error('Error loading attendance stats:', error);
        }
    }
    
    updateStatsDisplay(stats) {
        // Update the stat cards with real data
        const statCards = document.querySelectorAll('.attendance-card .stat-number');
        if (statCards.length >= 4) {
            statCards[0].textContent = stats.present || '0'; // Present Today
            statCards[1].textContent = stats.absent || '0';  // Absent Today
            statCards[2].textContent = stats.late || '0';    // Late Arrivals
            statCards[3].textContent = stats.corrections || '0'; // To be Corrected
        }
    }
    
    updateCorrectionStats(count) {
        // Update the "To be Corrected" stat
        const correctionStat = document.querySelector('.attendance-card:last-child .stat-number');
        if (correctionStat) {
            correctionStat.textContent = count;
        }
    }
    
    formatCorrectionType(type) {
        const types = {
            'missed_in': 'Missed Time In',
            'missed_out': 'Missed Time Out',
            'system_error': 'System Error'
        };
        return types[type] || type;
    }
    
    formatTime(timeString) {
        if (!timeString) return '';
        const time = new Date(`2000-01-01 ${timeString}`);
        return time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }
    
    async generateMonthlyReport() {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            const response = await fetch(`../handlers/attendance_report.php?month=${currentMonth}`);
            
            if (response.ok) {
                // Create a blob from the response and download it
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `attendance_report_${currentMonth}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Monthly report generated successfully', 'success');
            } else {
                this.showNotification('Failed to generate report', 'error');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add CSS if not exists
        if (!document.querySelector('#admin-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'admin-notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    animation: slideInRight 0.3s ease-out;
                    max-width: 400px;
                }
                .notification.success {
                    background: #10B981;
                    color: white;
                }
                .notification.error {
                    background: #EF4444;
                    color: white;
                }
                .notification.info {
                    background: #3B82F6;
                    color: white;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .notification-icon {
                    font-weight: bold;
                    font-size: 16px;
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize admin attendance manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminAttendanceManager();
});
