// Attendance Page JavaScript Functionality

class AttendanceManager {    constructor() {
        this.modal = document.getElementById('correctionModal');
        this.correctionForm = document.getElementById('correctionForm');
        this.monthFilter = document.getElementById('monthFilter');
        this.attendanceTable = document.querySelector('.attendance-table tbody');
        this.timeInBtn = document.querySelector('.time-in');
        this.timeOutBtn = document.querySelector('.time-out');
        
        // Get time value elements more specifically
        const timeCards = document.querySelectorAll('.time-card');
        this.todayTimeIn = timeCards[0]?.querySelector('.time-value'); // First card - Time In
        this.todayStatus = timeCards[1]?.querySelector('.status-badge'); // Second card - Status
        this.todayTimeOut = timeCards[2]?.querySelector('.time-value'); // Third card - Time Out
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMonthFilter();
        this.loadTodayAttendance();
        this.loadAttendanceHistory();
    }    setupEventListeners() {
        // Modal controls
        const openModalBtn = document.querySelector('.request-correction-btn');
        const closeModalBtn = document.querySelector('.close-modal');
        
        openModalBtn.addEventListener('click', () => this.openModal());
        closeModalBtn.addEventListener('click', () => this.closeModal());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Form submission
        this.correctionForm.addEventListener('submit', (e) => this.handleCorrectionSubmit(e));
        
        // Month filter
        this.monthFilter.addEventListener('change', () => this.loadAttendanceHistory());
        
        // Time in/out buttons
        this.timeInBtn.addEventListener('click', () => this.handleTimeIn());
        this.timeOutBtn.addEventListener('click', () => this.handleTimeOut());
    }    setupMonthFilter() {
        // Clear existing options
        this.monthFilter.innerHTML = '';
        
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Current month
        const currentOption = document.createElement('option');
        currentOption.value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        currentOption.textContent = `${this.getMonthName(currentMonth)} ${currentYear}`;
        currentOption.selected = true;
        this.monthFilter.appendChild(currentOption);
        
        // Last month
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastOption = document.createElement('option');
        lastOption.value = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}`;
        lastOption.textContent = `${this.getMonthName(lastMonth)} ${lastMonthYear}`;
        this.monthFilter.appendChild(lastOption);
        
        // Previous month
        const prevMonth = lastMonth === 0 ? 11 : lastMonth - 1;
        const prevMonthYear = lastMonth === 0 ? lastMonthYear - 1 : lastMonthYear;
        const prevOption = document.createElement('option');
        prevOption.value = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        prevOption.textContent = `${this.getMonthName(prevMonth)} ${prevMonthYear}`;
        this.monthFilter.appendChild(prevOption);
    }
    
    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }
    
    openModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('correctionDate').value = today;
    }
    
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.correctionForm.reset();
    }
    
    async handleCorrectionSubmit(e) {
        e.preventDefault();
        
        const formData = {
            date: document.getElementById('correctionDate').value,
            correction_type: document.getElementById('correctionType').value,
            time_in: document.getElementById('correctTimeIn').value,
            time_out: document.getElementById('correctTimeOut').value,
            reason: document.getElementById('reason').value
        };
        
        try {
            const response = await fetch('../handlers/attendance_correction_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Correction request submitted successfully!');
                this.closeModal();
            } else {
                this.showError(result.error || 'Failed to submit correction request');
            }
        } catch (error) {
            console.error('Error submitting correction:', error);
            this.showError('Network error. Please try again.');
        }
    }      async loadTodayAttendance() {
        // Try to reinitialize elements if they weren't found initially
        this.reinitializeElements();
        
        try {
            const response = await fetch('../handlers/attendance_handler.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
              const result = await response.json();
            
            console.log('Backend response:', result); // Debug: Log the entire response
            
            if (result.success) {
                const today = result.today;
                
                console.log('Today\'s data:', today); // Debug: Log today's attendance data
                
                // Debug: Check if elements exist
                console.log('Time elements found:', {
                    timeIn: !!this.todayTimeIn,
                    timeOut: !!this.todayTimeOut,
                    status: !!this.todayStatus,
                    timeInBtn: !!this.timeInBtn,
                    timeOutBtn: !!this.timeOutBtn
                });
                
                if (today) {
                    console.log('Time in value:', today.time_in); // Debug: Log time_in value
                    console.log('Time out value:', today.time_out); // Debug: Log time_out value
                    console.log('Status value:', today.status); // Debug: Log status value
                    
                    // Update time in display
                    if (today.time_in) {
                        const formattedTimeIn = this.formatTime(today.time_in);
                        console.log('Formatted time in:', formattedTimeIn); // Debug: Log formatted time
                        if (this.todayTimeIn) {
                            this.todayTimeIn.textContent = formattedTimeIn;
                        }
                        if (this.timeInBtn) {
                            this.timeInBtn.disabled = true;
                            this.timeInBtn.textContent = 'Already Timed In';
                            this.timeInBtn.style.backgroundColor = '#6B7280';
                        }
                    } else {
                        if (this.todayTimeIn) {
                            this.todayTimeIn.textContent = '--:--';
                        }
                        if (this.timeInBtn) {
                            this.timeInBtn.disabled = false;
                            this.timeInBtn.textContent = 'Time In';
                            this.timeInBtn.style.backgroundColor = '#2C6159';
                        }
                    }
                    
                    // Update time out display
                    if (today.time_out) {
                        const formattedTimeOut = this.formatTime(today.time_out);
                        console.log('Formatted time out:', formattedTimeOut); // Debug: Log formatted time
                        if (this.todayTimeOut) {
                            this.todayTimeOut.textContent = formattedTimeOut;
                        }
                        if (this.timeOutBtn) {
                            this.timeOutBtn.disabled = true;
                            this.timeOutBtn.textContent = 'Already Timed Out';
                            this.timeOutBtn.style.backgroundColor = '#6B7280';
                        }
                    } else {
                        if (this.todayTimeOut) {
                            this.todayTimeOut.textContent = '--:--';
                        }
                        if (this.timeOutBtn) {
                            this.timeOutBtn.disabled = !today.time_in;
                            if (today.time_in) {
                                this.timeOutBtn.textContent = 'Time Out';
                                this.timeOutBtn.style.backgroundColor = '#2C6159';
                            } else {
                                this.timeOutBtn.textContent = 'Time Out';
                                this.timeOutBtn.style.backgroundColor = '#6B7280';
                            }
                        }
                    }
                    
                    // Update status
                    if (this.todayStatus) {
                        if (today.status) {
                            this.todayStatus.textContent = this.getStatusText(today.status);
                            this.todayStatus.className = `status-badge ${this.getStatusClass(today.status)}`;
                        } else {
                            this.todayStatus.textContent = 'No Record';
                            this.todayStatus.className = 'status-badge absent';
                        }
                    }
                } else {
                    console.log('No attendance record for today'); // Debug: Log when no record
                    // No attendance record for today
                    if (this.todayTimeIn) {
                        this.todayTimeIn.textContent = '--:--';
                    }
                    if (this.todayTimeOut) {
                        this.todayTimeOut.textContent = '--:--';
                    }
                    if (this.todayStatus) {
                        this.todayStatus.textContent = 'Not Checked In';
                        this.todayStatus.className = 'status-badge absent';
                    }
                    
                    if (this.timeInBtn) {
                        this.timeInBtn.disabled = false;
                        this.timeInBtn.textContent = 'Time In';
                        this.timeInBtn.style.backgroundColor = '#2C6159';
                    }
                    
                    if (this.timeOutBtn) {
                        this.timeOutBtn.disabled = true;
                        this.timeOutBtn.textContent = 'Time Out';
                        this.timeOutBtn.style.backgroundColor = '#6B7280';
                    }
                }
            } else {
                console.error('Server error:', result);
                this.showError(result.error || 'Failed to load today\'s attendance');
            }
        } catch (error) {
            console.error('Error loading today\'s attendance:', error);
            this.showError('Error loading today\'s attendance. Please refresh the page.');
        }
    }
      formatTime(timeString) {
        console.log('formatTime input:', timeString); // Debug: Log input
        
        if (!timeString) {
            console.log('No time string provided');
            return '--:--';
        }
        
        try {
            let time;
            
            // Handle different time formats
            if (timeString.includes(' ')) {
                // Full datetime format: "2024-12-15 08:30:00"
                time = new Date(timeString);
            } else if (timeString.includes(':')) {
                // Time only format: "08:30:00" or "08:30"
                time = new Date(`2000-01-01 ${timeString}`);
            } else {
                console.log('Unknown time format:', timeString);
                return timeString;
            }
            
            if (isNaN(time.getTime())) {
                console.log('Invalid date created from:', timeString);
                return timeString;
            }
            
            const formatted = time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            console.log('formatTime output:', formatted); // Debug: Log output
            return formatted;
        } catch (error) {
            console.error('Error formatting time:', error, 'Input:', timeString);
            return timeString;
        }
    }
      async loadAttendanceHistory() {
        const selectedMonth = this.monthFilter.value;
        
        // Show loading state
        this.attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading attendance records...</td></tr>';
        
        try {
            const response = await fetch(`../handlers/attendance_handler.php?month=${selectedMonth}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
              if (result.success) {
                this.updateAttendanceTable(result.attendance);
                
                // Update page title to show current employee and month
                const monthName = this.getMonthName(parseInt(selectedMonth.split('-')[1]) - 1);
                const year = selectedMonth.split('-')[0];
                document.querySelector('.page-title h1').textContent = `My Attendance - ${monthName} ${year}`;
                
            } else {
                console.error('Error from server:', result);
                this.showError(result.error || 'Failed to load attendance history');
                this.attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #EF4444; padding: 20px;">Error loading attendance records</td></tr>';
            }
        } catch (error) {
            console.error('Network error loading attendance history:', error);
            this.showError('Network error. Please check your connection and try again.');
            this.attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #EF4444; padding: 20px;">Network error loading records</td></tr>';
        }
    }
      updateAttendanceTable(attendanceData) {
        this.attendanceTable.innerHTML = '';
        
        if (!attendanceData || attendanceData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="text-align: center; color: #6B7280; padding: 40px;">No attendance records found for this month</td>';
            this.attendanceTable.appendChild(row);
            return;
        }
        
        attendanceData.forEach(record => {
            const row = document.createElement('tr');
            
            // Format status badge with proper classes
            const statusClass = this.getStatusClass(record.status);
            const statusText = this.getStatusText(record.status);
            
            row.innerHTML = `
                <td>${this.formatDate(record.date)}</td>
                <td>${record.time_in || '-'}</td>
                <td>${record.time_out || '-'}</td>
                <td>${record.total_hours || '0:00'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            this.attendanceTable.appendChild(row);
        });
    }
    
    getStatusClass(status) {
        switch(status) {
            case 'present': return 'present';
            case 'late': return 'late';
            case 'absent': return 'absent';
            default: return 'present';
        }
    }
    
    getStatusText(status) {
        switch(status) {
            case 'present': return 'Present';
            case 'late': return 'Late';
            case 'absent': return 'Absent';
            default: return 'Present';
        }
    }    async handleTimeIn() {        
        try {
            const response = await fetch('../handlers/attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'time_in' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                // Add small delay to ensure backend processing is complete
                setTimeout(() => {
                    this.loadTodayAttendance();
                    this.loadAttendanceHistory();
                }, 500);
            } else {
                this.showError(result.error || 'Failed to record time in');
            }
        } catch (error) {
            console.error('Error recording time in:', error);
            this.showError('Network error. Please try again.');
        }
    }
    
    async handleTimeOut() {        
        try {
            const response = await fetch('../handlers/attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'time_out' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                // Add small delay to ensure backend processing is complete
                setTimeout(() => {
                    this.loadTodayAttendance();
                    this.loadAttendanceHistory();
                }, 500);
            } else {
                this.showError(result.error || 'Failed to record time out');
            }
        } catch (error) {
            console.error('Error recording time out:', error);
            this.showError('Network error. Please try again.');
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    showSuccess(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add CSS if not exists
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                }
                .notification.success {
                    background: #10B981;
                    color: white;
                }
                .notification.error {
                    background: #EF4444;
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
                @keyframes slideIn {
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
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showError(message) {
        // Create and show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✕</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    // Method to reinitialize DOM elements if they weren't found initially
    reinitializeElements() {
        if (!this.todayTimeIn || !this.todayTimeOut || !this.todayStatus) {
            console.log('Reinitializing DOM elements...');
            const timeCards = document.querySelectorAll('.time-card');
            
            if (timeCards.length >= 3) {
                this.todayTimeIn = timeCards[0]?.querySelector('.time-value');
                this.todayStatus = timeCards[1]?.querySelector('.status-badge');
                this.todayTimeOut = timeCards[2]?.querySelector('.time-value');
                
                console.log('Reinitialized elements:', {
                    timeIn: !!this.todayTimeIn,
                    timeOut: !!this.todayTimeOut,
                    status: !!this.todayStatus
                });
            }
        }
        
        if (!this.timeInBtn) {
            this.timeInBtn = document.querySelector('.time-in');
        }
        
        if (!this.timeOutBtn) {
            this.timeOutBtn = document.querySelector('.time-out');
        }
    }
}

// Initialize attendance manager when DOM is loaded
let attendanceManager;

document.addEventListener('DOMContentLoaded', () => {    attendanceManager = new AttendanceManager();
});
