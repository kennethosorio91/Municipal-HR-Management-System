// Travel Management Admin JavaScript
class TravelManagementAdmin {
    constructor() {
        this.applications = [];
        this.filteredApplications = [];
        this.currentApplication = null;
        this.init();
    }

    init() {
        this.loadApplications();
        this.setupEventListeners();
        this.updateSummaryCards();
        this.renderApplications();
    }

    setupEventListeners() {
        // Filter buttons
        const applyFiltersBtn = document.getElementById('applyFilters');
        const clearFiltersBtn = document.getElementById('clearFilters');
        const refreshBtn = document.querySelector('.btn-refresh');

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshApplications());
        }

        // Modal handlers
        this.setupModalHandlers();

        // Auto-refresh every 30 seconds
        setInterval(() => this.refreshApplications(), 30000);
    }

    setupModalHandlers() {
        const closeDetailsBtn = document.getElementById('closeDetails');
        const closeDetailsBtnFooter = document.getElementById('closeDetailsBtn');
        const approveBtn = document.getElementById('approveApplication');
        const rejectBtn = document.getElementById('rejectApplication');

        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => this.closeModal('detailsModal'));
        }

        if (closeDetailsBtnFooter) {
            closeDetailsBtnFooter.addEventListener('click', () => this.closeModal('detailsModal'));
        }

        if (approveBtn) {
            approveBtn.addEventListener('click', () => this.approveApplication());
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this.rejectApplication());
        }

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
    }    async loadApplications() {
        try {
            const response = await fetch('../handlers/get_leave_travel_requests.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.applications = result.data.requests || [];
                this.filteredApplications = [...this.applications];
                
                // Update stats from backend
                if (result.data.stats) {
                    this.updateSummaryCardsFromStats(result.data.stats);
                }
            } else {
                console.error('Failed to load applications:', result.message);
                this.applications = [];
                this.filteredApplications = [];
                this.showError('Failed to load leave/travel requests. Please try again.');
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            this.applications = [];
            this.filteredApplications = [];
            this.showError('Network error while loading requests. Please check your connection.');
        }
    }    async refreshApplications() {
        await this.loadApplications();
        this.updateSummaryCards();
        this.renderApplications();
        
        // Show refresh feedback
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<img src="../assets/Icon.png" alt="Refresh"> Refreshed!';
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
            }, 1000);
        }
    }    updateSummaryCards() {
        const pendingCount = this.applications.filter(app => app.status === 'pending').length;
        const approvedCount = this.applications.filter(app => app.status === 'approved').length;
        const activeCount = this.applications.filter(app => 
            app.request_type === 'travel_order' && app.status === 'approved'
        ).length;
        const totalCount = this.applications.length;

        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedCount').textContent = approvedCount;
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('totalCount').textContent = totalCount;
    }

    updateSummaryCardsFromStats(stats) {
        if (stats.pending !== undefined) {
            document.getElementById('pendingCount').textContent = stats.pending;
        }
        if (stats.approved !== undefined) {
            document.getElementById('approvedCount').textContent = stats.approved;
        }
        if (stats.active !== undefined) {
            document.getElementById('activeCount').textContent = stats.active;
        }
        if (stats.total !== undefined) {
            document.getElementById('totalCount').textContent = stats.total;
        }
    }

    renderApplications() {
        const applicationsList = document.getElementById('applicationsList');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!applicationsList) return;

        if (this.filteredApplications.length === 0) {
            applicationsList.innerHTML = `
                <div class="no-applications">
                    <div class="no-applications-icon">📋</div>
                    <h3>No applications found</h3>
                    <p>No leave applications or travel orders match your current filters.</p>
                </div>
            `;
            resultsCount.textContent = 'No applications found';
            return;
        }

        const applicationsHTML = this.filteredApplications.map(app => {
            return this.createApplicationHTML(app);
        }).join('');

        applicationsList.innerHTML = applicationsHTML;
        resultsCount.textContent = `Showing ${this.filteredApplications.length} of ${this.applications.length} applications`;

        // Add click listeners to application items
        this.setupApplicationClickListeners();
    }

    createApplicationHTML(app) {
        const isLeave = app.type === 'leave_application';
        const statusClass = app.status;
        const typeIcon = isLeave ? '../assets/calendar.png' : '../assets/map-pin.png';
        
        return `
            <div class="application-item" data-id="${app.id}">
                <div class="application-header">
                    <div class="application-type-info">
                        <img src="${typeIcon}" alt="${isLeave ? 'Leave' : 'Travel'}">
                        <div>
                            <div class="application-type">${isLeave ? 'Leave Application' : 'Travel Order'}</div>
                            <div class="application-subtype">${isLeave ? this.getLeaveTypeDisplayName(app.leaveType) : app.destination}</div>
                        </div>
                    </div>
                    <div class="status-badge ${statusClass}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</div>
                </div>
                <div class="application-body">
                    <div class="employee-info">
                        <strong>${app.employeeName || 'Unknown Employee'}</strong>
                        <span class="employee-id">${app.employeeId}</span>
                    </div>
                    <div class="application-details">
                        ${isLeave ? this.createLeaveDetailsHTML(app) : this.createTravelDetailsHTML(app)}
                    </div>
                    <div class="application-meta">
                        <span class="application-date">
                            ${isLeave ? 'Applied' : 'Requested'}: ${app.dateApplied || app.dateRequested}
                        </span>
                        <span class="duration">
                            ${isLeave ? `${app.totalDays} day(s)` : app.duration}
                        </span>
                    </div>
                </div>
                <div class="application-actions">
                    <button class="view-details-btn" data-id="${app.id}">View Details</button>
                    ${app.status === 'pending' ? `
                        <button class="quick-approve-btn" data-id="${app.id}">Quick Approve</button>
                        <button class="quick-reject-btn" data-id="${app.id}">Reject</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createLeaveDetailsHTML(app) {
        return `
            <div class="detail-row">
                <span class="detail-label">Period:</span>
                <span class="detail-value">${app.startDate} to ${app.endDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${app.reason}</span>
            </div>
        `;
    }

    createTravelDetailsHTML(app) {
        return `
            <div class="detail-row">
                <span class="detail-label">Purpose:</span>
                <span class="detail-value">${app.description}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Travel Dates:</span>
                <span class="detail-value">${app.startDate} to ${app.endDate}</span>
            </div>
            ${app.estimatedCost ? `
                <div class="detail-row">
                    <span class="detail-label">Estimated Cost:</span>
                    <span class="detail-value">₱${parseFloat(app.estimatedCost).toLocaleString()}</span>
                </div>
            ` : ''}
        `;
    }

    setupApplicationClickListeners() {
        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appId = btn.getAttribute('data-id');
                this.showApplicationDetails(appId);
            });
        });

        // Quick approve buttons
        document.querySelectorAll('.quick-approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appId = btn.getAttribute('data-id');
                this.quickApprove(appId);
            });
        });

        // Quick reject buttons
        document.querySelectorAll('.quick-reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appId = btn.getAttribute('data-id');
                this.quickReject(appId);
            });
        });
    }

    showApplicationDetails(appId) {
        const app = this.applications.find(a => a.id === appId);
        if (!app) return;

        this.currentApplication = app;
        const modal = document.getElementById('detailsModal');
        const title = document.getElementById('detailsTitle');
        const content = document.getElementById('detailsContent');

        if (modal && title && content) {
            title.textContent = `${app.type === 'leave_application' ? 'Leave Application' : 'Travel Order'} Details`;
            content.innerHTML = this.createDetailedViewHTML(app);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    createDetailedViewHTML(app) {
        const isLeave = app.type === 'leave_application';
        
        return `
            <div class="detailed-application">
                <div class="detail-section">
                    <h3>Employee Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">Name:</span>
                            <span class="value">${app.employeeName || 'Unknown Employee'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Employee ID:</span>
                            <span class="value">${app.employeeId}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>${isLeave ? 'Leave' : 'Travel'} Information</h3>
                    <div class="detail-grid">
                        ${isLeave ? this.createLeaveDetailedHTML(app) : this.createTravelDetailedHTML(app)}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Application Status</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">Status:</span>
                            <span class="value status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Date ${isLeave ? 'Applied' : 'Requested'}:</span>
                            <span class="value">${app.dateApplied || app.dateRequested}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createLeaveDetailedHTML(app) {
        return `
            <div class="detail-item">
                <span class="label">Leave Type:</span>
                <span class="value">${this.getLeaveTypeDisplayName(app.leaveType)}</span>
            </div>
            <div class="detail-item">
                <span class="label">Start Date:</span>
                <span class="value">${app.startDate}</span>
            </div>
            <div class="detail-item">
                <span class="label">End Date:</span>
                <span class="value">${app.endDate}</span>
            </div>
            <div class="detail-item">
                <span class="label">Total Days:</span>
                <span class="value">${app.totalDays}</span>
            </div>
            <div class="detail-item full-width">
                <span class="label">Reason:</span>
                <span class="value">${app.reason}</span>
            </div>
            ${app.address ? `
                <div class="detail-item full-width">
                    <span class="label">Address During Leave:</span>
                    <span class="value">${app.address}</span>
                </div>
            ` : ''}
            ${app.contactNumber ? `
                <div class="detail-item">
                    <span class="label">Contact Number:</span>
                    <span class="value">${app.contactNumber}</span>
                </div>
            ` : ''}
        `;
    }

    createTravelDetailedHTML(app) {
        return `
            <div class="detail-item">
                <span class="label">Purpose:</span>
                <span class="value">${app.purpose}</span>
            </div>
            <div class="detail-item full-width">
                <span class="label">Description:</span>
                <span class="value">${app.description}</span>
            </div>
            <div class="detail-item">
                <span class="label">Destination:</span>
                <span class="value">${app.destination}</span>
            </div>
            <div class="detail-item">
                <span class="label">Departure Date:</span>
                <span class="value">${app.startDate}</span>
            </div>
            <div class="detail-item">
                <span class="label">Return Date:</span>
                <span class="value">${app.endDate}</span>
            </div>
            <div class="detail-item">
                <span class="label">Duration:</span>
                <span class="value">${app.duration}</span>
            </div>
            ${app.transportation ? `
                <div class="detail-item">
                    <span class="label">Transportation:</span>
                    <span class="value">${app.transportation.replace('_', ' ').toUpperCase()}</span>
                </div>
            ` : ''}
            ${app.estimatedCost ? `
                <div class="detail-item">
                    <span class="label">Estimated Cost:</span>
                    <span class="value">₱${parseFloat(app.estimatedCost).toLocaleString()}</span>
                </div>
            ` : ''}
            ${app.accommodation ? `
                <div class="detail-item full-width">
                    <span class="label">Accommodation:</span>
                    <span class="value">${app.accommodation}</span>
                </div>
            ` : ''}
        `;
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        this.filteredApplications = this.applications.filter(app => {
            // Status filter
            if (statusFilter !== 'all' && app.status !== statusFilter) {
                return false;
            }

            // Type filter
            if (typeFilter !== 'all' && app.type !== typeFilter) {
                return false;
            }

            // Date filter (simplified - in production would use actual date parsing)
            if (dateFilter !== 'all') {
                const appDate = new Date(app.dateApplied || app.dateRequested);
                const today = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        if (appDate.toDateString() !== today.toDateString()) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (appDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (appDate < monthAgo) return false;
                        break;
                }
            }

            return true;
        });

        this.renderApplications();
    }

    clearFilters() {
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('typeFilter').value = 'all';
        document.getElementById('dateFilter').value = 'all';
        
        this.filteredApplications = [...this.applications];
        this.renderApplications();
    }

    quickApprove(appId) {
        if (confirm('Are you sure you want to approve this application?')) {
            this.updateApplicationStatus(appId, 'approved');
        }
    }

    quickReject(appId) {
        if (confirm('Are you sure you want to reject this application?')) {
            this.updateApplicationStatus(appId, 'rejected');
        }
    }

    approveApplication() {
        if (this.currentApplication && confirm('Are you sure you want to approve this application?')) {
            this.updateApplicationStatus(this.currentApplication.id, 'approved');
            this.closeModal('detailsModal');
        }
    }

    rejectApplication() {
        if (this.currentApplication && confirm('Are you sure you want to reject this application?')) {
            this.updateApplicationStatus(this.currentApplication.id, 'rejected');
            this.closeModal('detailsModal');
        }
    }

    updateApplicationStatus(appId, newStatus) {
        const appIndex = this.applications.findIndex(app => app.id === appId);
        if (appIndex !== -1) {
            this.applications[appIndex].status = newStatus;
            
            // Update localStorage
            localStorage.setItem('pendingApplications', JSON.stringify(this.applications));
            
            // Refresh displays
            this.filteredApplications = [...this.applications];
            this.applyFilters(); // Re-apply current filters
            this.updateSummaryCards();
            
            // Show success message
            alert(`Application ${newStatus} successfully!`);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.travelManagementAdmin = new TravelManagementAdmin();
});
