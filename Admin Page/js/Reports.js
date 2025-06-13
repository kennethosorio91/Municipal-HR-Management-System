// Reports & Compliance Management JavaScript - Simplified Version

class ReportsManager {
    constructor() {
        this.customizeBtn = document.querySelector('.btn-primary');
        this.exportAllBtn = document.querySelector('.btn-secondary');
        this.generateBtns = document.querySelectorAll('.generate-btn');
        this.viewHistoryBtns = document.querySelectorAll('.view-history-btn');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModalCloseHandlers();
    }

    setupEventListeners() {
        // Main action buttons
        if (this.customizeBtn) {
            this.customizeBtn.addEventListener('click', () => this.openCustomizeModal());
        }

        if (this.exportAllBtn) {
            this.exportAllBtn.addEventListener('click', () => this.exportAllReports());
        }

        // Compliance report buttons
        this.generateBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => this.generateReport(index));
        });        this.viewHistoryBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => this.showHistory(index));
        });

        // Setup dynamic date filter
        this.setupDateFilterHandler();
    }    setupDateFilterHandler() {
        const dateFilter = document.getElementById('date-filter');
        const customDateInputs = document.querySelector('.custom-date-inputs');
        
        if (dateFilter && customDateInputs) {
            dateFilter.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customDateInputs.classList.add('active');
                } else {
                    customDateInputs.classList.remove('active');
                }
                // Auto-apply filters when date range changes
                this.applyHistoryFilters();
            });
        }
    }

    openCustomizeModal() {
        const modal = document.getElementById('customize-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }    exportAllReports() {
        const reports = [
            'attendance_sample.csv',
            'payroll_sample.csv', 
            'employee_sample.csv',
            'compliance_sample.csv'
        ];
        
        reports.forEach((filename, index) => {
            setTimeout(() => {
                this.downloadSampleFile(filename);
            }, index * 300);
        });
        
        alert('All sample reports downloaded successfully!');
    }    generateReport(index) {
        const reportTypes = ['CSC Plantilla', 'GSIS Contributions', 'BIR 1604CF', 'PhilHealth MDR'];
        const reportName = reportTypes[index];
        
        // Download sample file instead of generating
        const filename = `${reportName.toLowerCase().replace(/\s+/g, '_')}_sample.csv`;
        this.downloadSampleFile(filename);
        
        // Update status badge
        const items = document.querySelectorAll('.compliance-item');
        if (items[index]) {
            const badge = items[index].querySelector('.status-badge');
            if (badge) {
                badge.textContent = 'Generated';
                badge.className = 'status-badge generated';
            }
        }
        
        alert(`${reportName} sample downloaded successfully!`);
    }showHistory(index) {
        const reportTypes = ['CSC Plantilla', 'GSIS Contributions', 'BIR 1604CF', 'PhilHealth MDR'];
        const reportKeys = ['csc', 'gsis', 'bir', 'philhealth'];
        
        // Store the current report type for filtering
        this.currentReportType = reportKeys[index];
        this.currentReportName = reportTypes[index];
        
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Update the filter section title
            const filterTitle = document.getElementById('filter-report-type');
            if (filterTitle) {
                filterTitle.textContent = `${reportTypes[index]} History`;
            }
            
            // Load the specific report history
            this.loadReportHistory(this.currentReportType);
        }
    }    downloadSampleFile(filename) {
        // Create simple sample CSV content
        const sampleContent = `Employee Name,Department,Position,Date,Status
Juan Cruz,IT,Developer,2024-12-15,Active
Maria Santos,HR,Manager,2024-12-15,Active
Jose Garcia,Finance,Analyst,2024-12-15,Active
Ana Rodriguez,Admin,Assistant,2024-12-15,Active`;

        const blob = new Blob([sampleContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
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

        // Close buttons for each modal
        const closeButtons = [
            { id: 'close-customize', modal: 'customize-modal' },
            { id: 'close-export-all', modal: 'export-all-modal' },
            { id: 'close-history', modal: 'history-modal' },
            { id: 'close-logout', modal: 'logout-modal' },
            { id: 'cancel-customize', modal: 'customize-modal' },
            { id: 'cancel-export-all', modal: 'export-all-modal' },
            { id: 'close-history-btn', modal: 'history-modal' },
            { id: 'cancel-logout', modal: 'logout-modal' }
        ];

        closeButtons.forEach(({ id, modal }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => this.closeModal(modal));
            }
        });

        // Setup filter functionality
        this.setupFilterHandlers();
    }    setupFilterHandlers() {
        const applyFiltersBtn = document.querySelector('.apply-filters-btn');
        const clearFiltersBtn = document.querySelector('.clear-filters-btn');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyHistoryFilters());
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Auto-apply filters when changed
        const filterSelects = document.querySelectorAll('#date-filter, #status-filter, #start-date-filter, #end-date-filter');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => this.applyHistoryFilters());
        });
    }

    closeActiveModal() {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }    applyHistoryFilters() {
        if (!this.currentReportType) return;
        
        const dateRange = document.getElementById('date-filter')?.value || 'all';
        const status = document.getElementById('status-filter')?.value || 'all';
        const startDate = document.getElementById('start-date-filter')?.value;
        const endDate = document.getElementById('end-date-filter')?.value;

        // Show loading state
        const historyList = document.querySelector('.history-list');
        if (historyList) {
            historyList.innerHTML = '<div class="loading-state">Applying filters...</div>';
            
            // Simulate filter processing
            setTimeout(() => {
                this.updateHistoryList(this.currentReportType, dateRange, status, startDate, endDate);
            }, 300);
        }
    }

    loadReportHistory(reportType) {
        const historyList = document.querySelector('.history-list');
        if (historyList) {
            historyList.innerHTML = '<div class="loading-state">Loading report history...</div>';
            
            // Simulate loading
            setTimeout(() => {
                this.updateHistoryList(reportType, 'all', 'all');
            }, 500);
        }
    }    updateHistoryList(reportType, dateRange, status, startDate = null, endDate = null) {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        // Get filtered data for the specific report type
        const sampleData = this.getFilteredHistoryData(reportType, dateRange, status, startDate, endDate);
        
        if (sampleData.length === 0) {
            historyList.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">📄</div>
                    <h3>No reports found</h3>
                    <p>No ${this.currentReportName} reports match your current filters.</p>
                </div>
            `;
            this.updateResultsCount(0);
            return;
        }
        
        historyList.innerHTML = sampleData.map(item => `
            <div class="history-item" data-status="${item.status}">
                <div class="history-info">
                    <div class="history-title">${item.title}</div>
                    <div class="history-meta">
                        <span class="history-date">📅 ${item.date}</span>
                        <span class="history-size">📊 ${item.size}</span>
                        <span class="status-badge ${item.status}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="download-btn" onclick="window.reportsManager.downloadHistoryItem('${item.id}')">
                        📥 Download
                    </button>
                    <button class="view-btn" onclick="window.reportsManager.viewHistoryItem('${item.id}')">
                        👁️ View
                    </button>
                </div>
            </div>
        `).join('');
        
        this.updateResultsCount(sampleData.length);
    }

    updateResultsCount(count) {
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            const reportName = this.currentReportName || 'reports';
            resultsCount.textContent = `Showing ${count} ${reportName.toLowerCase()} ${count === 1 ? 'report' : 'reports'}`;
        }
    }    getFilteredHistoryData(reportType, dateRange, status, startDate = null, endDate = null) {
        // Sample data for each report type - in real implementation, this would come from the backend
        const allReportData = {
            csc: [
                { id: 'csc_1', title: 'CSC Plantilla Report - Q4 2024', date: 'December 15, 2024', size: '2.3 MB', type: 'csc', status: 'generated' },
                { id: 'csc_2', title: 'CSC Employee Performance Report', date: 'November 30, 2024', size: '1.8 MB', type: 'csc', status: 'submitted' },
                { id: 'csc_3', title: 'CSC Monthly Plantilla Report', date: 'November 15, 2024', size: '2.1 MB', type: 'csc', status: 'generated' },
                { id: 'csc_4', title: 'CSC Quarterly Position Report', date: 'October 15, 2024', size: '1.9 MB', type: 'csc', status: 'archived' },
                { id: 'csc_5', title: 'CSC Annual Plantilla Summary', date: 'September 30, 2024', size: '3.2 MB', type: 'csc', status: 'submitted' }
            ],
            gsis: [
                { id: 'gsis_1', title: 'GSIS Monthly Contributions - December 2024', date: 'December 10, 2024', size: '1.8 MB', type: 'gsis', status: 'pending' },
                { id: 'gsis_2', title: 'GSIS Premium Payments Report', date: 'November 25, 2024', size: '1.5 MB', type: 'gsis', status: 'generated' },
                { id: 'gsis_3', title: 'GSIS Quarterly Summary Report', date: 'October 30, 2024', size: '2.1 MB', type: 'gsis', status: 'submitted' },
                { id: 'gsis_4', title: 'GSIS Employee Coverage Report', date: 'October 15, 2024', size: '1.7 MB', type: 'gsis', status: 'generated' },
                { id: 'gsis_5', title: 'GSIS Annual Contribution Summary', date: 'September 20, 2024', size: '2.8 MB', type: 'gsis', status: 'archived' }
            ],
            bir: [
                { id: 'bir_1', title: 'BIR 1604CF - December 2024', date: 'December 20, 2024', size: '1.2 MB', type: 'bir', status: 'generated' },
                { id: 'bir_2', title: 'BIR Monthly Tax Withholding', date: 'November 20, 2024', size: '1.1 MB', type: 'bir', status: 'submitted' },
                { id: 'bir_3', title: 'BIR Quarterly Tax Report', date: 'October 25, 2024', size: '1.4 MB', type: 'bir', status: 'generated' },
                { id: 'bir_4', title: 'BIR Annual Tax Summary', date: 'September 15, 2024', size: '2.2 MB', type: 'bir', status: 'archived' },
                { id: 'bir_5', title: 'BIR Employee Tax Report', date: 'August 30, 2024', size: '1.3 MB', type: 'bir', status: 'generated' }
            ],
            philhealth: [
                { id: 'ph_1', title: 'PhilHealth MDR - December 2024', date: 'December 12, 2024', size: '980 KB', type: 'philhealth', status: 'pending' },
                { id: 'ph_2', title: 'PhilHealth Premium Contributions', date: 'November 28, 2024', size: '890 KB', type: 'philhealth', status: 'generated' },
                { id: 'ph_3', title: 'PhilHealth Quarterly Report', date: 'October 20, 2024', size: '1.1 MB', type: 'philhealth', status: 'submitted' },
                { id: 'ph_4', title: 'PhilHealth Annual Coverage Report', date: 'September 25, 2024', size: '1.5 MB', type: 'philhealth', status: 'generated' },
                { id: 'ph_5', title: 'PhilHealth Employee Enrollment', date: 'August 15, 2024', size: '1.2 MB', type: 'philhealth', status: 'archived' }
            ]
        };

        let data = allReportData[reportType] || [];

        // Apply status filter
        if (status !== 'all') {
            data = data.filter(item => item.status === status);
        }

        // Apply date range filter (simplified - in real implementation would parse dates)
        if (dateRange !== 'all') {
            // For demo purposes, showing different subsets based on range
            switch (dateRange) {
                case 'week':
                    data = data.slice(0, 1);
                    break;
                case 'month':
                    data = data.slice(0, 2);
                    break;
                case 'quarter':
                    data = data.slice(0, 3);
                    break;
                case 'year':
                    data = data.slice(0, 4);
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        // In real implementation, would filter by actual date range
                        data = data.slice(0, 2);
                    }
                    break;
            }
        }

        return data;
    }    downloadHistoryItem(itemId) {
        // Download sample file
        this.downloadSampleFile(`${itemId}_sample.csv`);
    }

    viewHistoryItem(itemId) {
        // Simulate view with sample content
        alert(`Viewing report ${itemId}...\n\nThis would open a preview of the sample report.`);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    clearFilters() {
        // Reset all filter inputs
        const dateFilter = document.getElementById('date-filter');
        const statusFilter = document.getElementById('status-filter');
        const startDateFilter = document.getElementById('start-date-filter');
        const endDateFilter = document.getElementById('end-date-filter');
        const customDateInputs = document.querySelector('.custom-date-inputs');

        if (dateFilter) dateFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        if (startDateFilter) startDateFilter.value = '';
        if (endDateFilter) endDateFilter.value = '';
        if (customDateInputs) customDateInputs.classList.remove('active');

        // Reload the history with cleared filters
        if (this.currentReportType) {
            this.loadReportHistory(this.currentReportType);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new ReportsManager();
});
