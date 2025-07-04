// Leave & Travel Application JavaScript
class LeaveApplicationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.loadLeaveCredits();
        this.loadApplications();
    }

    setupEventListeners() {
        // Apply Leave button
    const applyLeaveBtn = document.querySelector('.btn-apply-leave');
    if (applyLeaveBtn) {
            applyLeaveBtn.addEventListener('click', () => this.openApplyLeaveModal());
        }

        // Request Travel Order button
        const travelOrderBtn = document.querySelector('.btn-travel-order');
        if (travelOrderBtn) {
            travelOrderBtn.addEventListener('click', () => this.openTravelOrderModal());
        }

        // Modal close buttons
        this.setupModalCloseHandlers();

        // Form submissions
        this.setupFormSubmissions();

        // Date change handlers for automatic calculations
        this.setupDateCalculations();
    }

    setupModalCloseHandlers() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeActiveModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }
        });

        // Close buttons
        const closeButtons = [
            { id: 'closeApplyLeave', modal: 'applyLeaveModal' },
            { id: 'closeTravelOrder', modal: 'travelOrderModal' },
            { id: 'closeSuccess', modal: 'successModal' },
            { id: 'cancelLeaveApplication', modal: 'applyLeaveModal' },
            { id: 'cancelTravelOrder', modal: 'travelOrderModal' }
        ];

        closeButtons.forEach(({ id, modal }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => this.closeModal(modal));
            }
        });
    }

    setupFormSubmissions() {
        // Leave application form
        const leaveForm = document.getElementById('applyLeaveForm');
        if (leaveForm) {
            leaveForm.addEventListener('submit', (e) => this.handleLeaveSubmission(e));
        }

        // Travel order form
        const travelForm = document.getElementById('travelOrderForm');
        if (travelForm) {
            travelForm.addEventListener('submit', (e) => this.handleTravelSubmission(e));
        }
    }

    setupDateCalculations() {
        // Leave date calculation
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const totalDays = document.getElementById('totalDays');

        if (startDate && endDate && totalDays) {
            [startDate, endDate].forEach(input => {
                input.addEventListener('change', () => {
                    this.calculateLeaveDays(startDate.value, endDate.value, totalDays);
                });
            });
        }

        // Travel duration calculation
        const travelStartDate = document.getElementById('travelStartDate');
        const travelEndDate = document.getElementById('travelEndDate');
        const travelDuration = document.getElementById('travelDuration');

        if (travelStartDate && travelEndDate && travelDuration) {
            [travelStartDate, travelEndDate].forEach(input => {
                input.addEventListener('change', () => {
                    this.calculateTravelDuration(travelStartDate.value, travelEndDate.value, travelDuration);
                });
            });
        }
    }

    setupFormValidation() {
        // Set minimum date to today for all date inputs
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.min = today;
        });
    }

    openApplyLeaveModal() {
        const modal = document.getElementById('applyLeaveModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset form
            const form = document.getElementById('applyLeaveForm');
            if (form) form.reset();
            
            // Clear calculated fields
            const totalDays = document.getElementById('totalDays');
            if (totalDays) totalDays.value = '';
        }
    }

    openTravelOrderModal() {
        const modal = document.getElementById('travelOrderModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset form
            const form = document.getElementById('travelOrderForm');
            if (form) form.reset();
            
            // Clear calculated fields
            const duration = document.getElementById('travelDuration');
            if (duration) duration.value = '';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeActiveModal() {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    calculateLeaveDays(startDateValue, endDateValue, totalDaysInput) {
        if (startDateValue && endDateValue) {
            const start = new Date(startDateValue);
            const end = new Date(endDateValue);
            
            if (end >= start) {
                const timeDiff = end.getTime() - start.getTime();
                const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date
                totalDaysInput.value = dayDiff;
            } else {
                totalDaysInput.value = '';
                alert('End date must be after or equal to start date.');
            }
        }
    }

    calculateTravelDuration(startDateValue, endDateValue, durationInput) {
        if (startDateValue && endDateValue) {
            const start = new Date(startDateValue);
            const end = new Date(endDateValue);
            
            if (end >= start) {
                const timeDiff = end.getTime() - start.getTime();
                const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                
                if (dayDiff === 1) {
                    durationInput.value = '1 day';
                } else {
                    durationInput.value = `${dayDiff} days`;
                }
            } else {
                durationInput.value = '';
                alert('Return date must be after or equal to departure date.');
            }
        }
    }

    async handleLeaveSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leaveData = {
            request_type: 'leave',
            leave_type: formData.get('leaveType'),
            start_date: formData.get('startDate'),
            end_date: formData.get('endDate'),
            purpose: formData.get('leaveReason')
        };

        try {
            await this.submitApplication(leaveData);
            this.closeModal('applyLeaveModal');
            this.showSuccessModal('Leave Application Submitted', 
                'Your leave application has been submitted successfully and is now pending approval.');
        } catch (error) {
            console.error('Error submitting leave application:', error);
            alert('Error submitting application: ' + error.message);
        }
    }

    async handleTravelSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const travelData = {
            request_type: 'travel',
            start_date: formData.get('travelStartDate'),
            end_date: formData.get('travelEndDate'),
            destination: formData.get('destination'),
            purpose: formData.get('travelDescription')
        };

        try {
            await this.submitApplication(travelData);
            this.closeModal('travelOrderModal');
            this.showSuccessModal('Travel Order Requested', 
                'Your travel order request has been submitted successfully and is now pending approval.');
        } catch (error) {
            console.error('Error submitting travel order:', error);
            alert('Error submitting request: ' + error.message);
        }
    }

    async submitApplication(data) {
        const response = await fetch('../handlers/submit_leave_travel_request.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to submit application');
        }
        
        return result;
    }

    showSuccessModal(title, message) {
        const successModal = document.getElementById('successModal');
        const successTitle = document.getElementById('successTitle');
        const successMessage = document.getElementById('successMessage');
        
        if (successModal && successTitle && successMessage) {
            successTitle.textContent = title;
            successMessage.textContent = message;
            successModal.classList.add('active');
        }
    }

    updateLeaveApplicationsList(leaveData) {
        // Add the new application to the UI
        const applicationsSection = document.querySelector('.applications-section');
        if (applicationsSection) {
            const newApplication = this.createLeaveApplicationElement(leaveData);
            const firstChild = applicationsSection.children[1]; // After the header
            if (firstChild) {
                applicationsSection.insertBefore(newApplication, firstChild);
            } else {
                applicationsSection.appendChild(newApplication);
            }
        }
    }

    updateTravelOrdersList(travelData) {
        // Add the new travel order to the UI
        const travelSection = document.querySelector('.travel-orders-section');
        if (travelSection) {
            const newOrder = this.createTravelOrderElement(travelData);
            const firstChild = travelSection.children[1]; // After the header
            if (firstChild) {
                travelSection.insertBefore(newOrder, firstChild);
            } else {
                travelSection.appendChild(newOrder);
            }
        }
    }

    createLeaveApplicationElement(data) {
        const div = document.createElement('div');
        div.className = 'application-item';
        div.innerHTML = `
            <div class="application-info">
                <div class="application-type">${this.getLeaveTypeDisplayName(data.leaveType)}</div>
                <div class="application-details">
                    <div class="detail-item">
                        <span class="detail-label">Duration:</span>
                        ${data.startDate} to ${data.endDate}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Reason:</span>
                        ${data.reason}
                    </div>
                </div>
                <div class="application-date">Date Applied: ${data.dateApplied}</div>
            </div>
            <div class="status-badge ${data.status}">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</div>
        `;
        return div;
    }

    createTravelOrderElement(data) {
        const div = document.createElement('div');
        div.className = 'travel-order-item';
        div.innerHTML = `
            <div class="travel-order-info">
                <div class="travel-order-type">${data.destination}</div>
                <div class="travel-order-details">
                    <div class="detail-item">
                        <span class="detail-label">Purpose:</span>
                        ${data.description}
                    </div>
                </div>
                <div class="travel-order-date">Travel Dates: ${data.startDate} to ${data.endDate}</div>
            </div>
            <div class="status-badge ${data.status}">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</div>
        `;
        return div;
    }

    getLeaveTypeDisplayName(type) {
        const types = {
            'vacation': 'Vacation Leave',
            'sick': 'Sick Leave',
            'emergency': 'Emergency Leave',
            'maternity': 'Maternity Leave',
            'study': 'Study Leave'
        };
        return types[type] || type;
    }

    getCurrentEmployeeId() {
        // In a real application, this would come from session/authentication
        return 'EMP_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    getCurrentEmployeeName() {
        // In a real application, this would come from session/authentication
        return 'Current Employee'; // This should be replaced with actual employee name
    }

    async loadLeaveCredits() {
        try {
            const response = await fetch('../handlers/fetch_leave_credits.php');
            const result = await response.json();

            if (result.success) {
                this.renderLeaveCredits(result.data);
                // Update leave type options in the form
                this.updateLeaveTypeOptions(result.data);
            } else {
                console.error('Failed to load leave credits:', result.message);
                this.showEmptyLeaveCredits();
            }
        } catch (error) {
            console.error('Error loading leave credits:', error);
            this.showEmptyLeaveCredits();
        }
    }

    renderLeaveCredits(credits) {
        const grid = document.getElementById('leaveCreditsGrid');
        if (!grid) return;

        grid.innerHTML = credits.map(credit => `
            <div class="leave-credit-card">
                <div class="leave-credit-type">${credit.name}</div>
                <div class="leave-credit-days">${credit.days}</div>
                <div class="leave-credit-label">days available</div>
            </div>
        `).join('');
    }

    showEmptyLeaveCredits() {
        const grid = document.getElementById('leaveCreditsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="no-credits">
                <p>No leave credits available. Please contact HR.</p>
            </div>
        `;
    }

    updateLeaveTypeOptions(credits) {
        const leaveTypeSelect = document.getElementById('leaveType');
        if (!leaveTypeSelect) return;

        leaveTypeSelect.innerHTML = `
            <option value="">Select Leave Type</option>
            ${credits.map(credit => `
                <option value="${credit.type}">${credit.name} (${credit.days} days available)</option>
            `).join('')}
        `;
    }

    async loadApplications() {
        try {
            const response = await fetch('../handlers/get_leave_travel_requests.php');
            const result = await response.json();

            if (result.success) {
                this.renderLeaveApplications(result.data.leave_applications || []);
                this.renderTravelOrders(result.data.travel_orders || []);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            this.showEmptyApplications();
        }
    }

    renderLeaveApplications(applications) {
        const container = document.getElementById('leaveApplicationsList');
        if (!container) return;

        if (applications.length === 0) {
            container.innerHTML = `
                <div class="no-applications">
                    <p>No leave applications found. Click "Apply Leave" to submit a new application.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = applications.map(app => `
            <div class="application-item">
                <div class="application-info">
                    <div class="application-type">${this.getLeaveTypeDisplayName(app.leave_type)}</div>
                    <div class="application-details">
                        <div class="detail-item">
                            <span class="detail-label">Duration:</span>
                            ${app.start_date} to ${app.end_date}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Reason:</span>
                            ${app.reason}
                        </div>
                    </div>
                    <div class="application-date">Date Applied: ${app.date_applied}</div>
                </div>
                <div class="status-badge ${app.status.toLowerCase()}">${app.status}</div>
            </div>
        `).join('');
    }

    renderTravelOrders(orders) {
        const container = document.getElementById('travelOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-applications">
                    <p>No travel orders found. Click "Request Travel Order" to submit a new request.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="travel-order-item">
                <div class="travel-order-info">
                    <div class="travel-order-type">${order.destination}</div>
                    <div class="travel-order-details">
                        <div class="detail-item">
                            <span class="detail-label">Purpose:</span>
                            ${order.purpose}
                        </div>
                    </div>
                    <div class="travel-order-date">Travel Dates: ${order.start_date} to ${order.end_date}</div>
                </div>
                <div class="status-badge ${order.status.toLowerCase()}">${order.status}</div>
            </div>
        `).join('');
    }

    showEmptyApplications() {
        const leaveContainer = document.getElementById('leaveApplicationsList');
        const travelContainer = document.getElementById('travelOrdersList');

        if (leaveContainer) {
            leaveContainer.innerHTML = `
                <div class="no-applications">
                    <p>Unable to load leave applications. Please try again later.</p>
                </div>
            `;
        }

        if (travelContainer) {
            travelContainer.innerHTML = `
                <div class="no-applications">
                    <p>Unable to load travel orders. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaveApplicationManager = new LeaveApplicationManager();
});
