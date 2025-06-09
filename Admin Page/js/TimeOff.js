// Function to update dashboard statistics
function updateDashboardStats() {
    fetch('../handlers/get_timeoff_stats.php')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalRequest').textContent = data.total_pending;
            document.getElementById('averageDays').textContent = data.average_days;
            document.getElementById('totalOrders').textContent = data.active_orders;
            document.getElementById('totalApproved').textContent = data.approved_month;
        })
        .catch(error => console.error('Error:', error));
}

// Function to load leave requests
function loadLeaveRequests(searchQuery = '', statusFilter = '') {
    const requestsContainer = document.querySelector('.leave-requests-list');
    
    fetch('../handlers/get_leave_requests.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            search: searchQuery,
            status: statusFilter
        })
    })
    .then(response => response.json())
    .then(data => {
        requestsContainer.innerHTML = '';
        
        data.requests.forEach(request => {
            const requestElement = createLeaveRequestElement(request);
            requestsContainer.appendChild(requestElement);
        });
    })
    .catch(error => console.error('Error:', error));
}

// Function to create leave request element
function createLeaveRequestElement(request) {
    const div = document.createElement('div');
    div.className = 'leave-request-item';
    
    if (request.status === 'Approved') {
        div.innerHTML = `
            <div class="employee-info">
                <div class="employee-name">${request.employee_name}</div>
                <div class="employee-id">${request.employee_id}</div>
            </div>
            <div class="leave-type">
                <div>Leave Type</div>
                <div>${request.leave_type}</div>
            </div>
            <div class="duration">
                <div>Duration</div>
                <div>${request.duration}</div>
            </div>
            <div class="reason">
                <div>Reason</div>
                <div>${request.reason}</div>
            </div>
            <div class="approved-badge">Approved</div>
        `;
    } else {
        div.innerHTML = `
            <div class="employee-info">
                <div class="employee-name">${request.employee_name}</div>
                <div class="employee-id">${request.employee_id}</div>
            </div>
            <div class="leave-type">
                <div>Leave Type</div>
                <div>${request.leave_type}</div>
            </div>
            <div class="duration">
                <div>Duration</div>
                <div>${request.duration}</div>
            </div>
            <div class="reason">
                <div>Reason</div>
                <div>${request.reason}</div>
            </div>
            <div class="action-buttons">
                <button class="approve-btn" data-id="${request.id}">Approve</button>
                <button class="reject-btn" data-id="${request.id}">Reject</button>
            </div>
        `;
    }
    
    return div;
}

// Function to handle leave request action
function handleLeaveAction(requestId, action) {
    fetch('../handlers/process_leave_request.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            request_id: requestId,
            action: action
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Refresh the leave requests list and stats
            updateDashboardStats();
            loadLeaveRequests(
                document.getElementById('searchInput').value,
                document.getElementById('statusFilter').value
            );
        }
    })
    .catch(error => console.error('Error:', error));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initial load
    updateDashboardStats();
    loadLeaveRequests();

    // Search input handler
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadLeaveRequests(
                this.value,
                document.getElementById('statusFilter').value
            );
        }, 300);
    });

    // Status filter handler
    document.getElementById('statusFilter').addEventListener('change', function() {
        loadLeaveRequests(
            document.getElementById('searchInput').value,
            this.value
        );
    });

    // Action button handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('approve-btn')) {
            handleLeaveAction(e.target.dataset.id, 'approve');
        } else if (e.target.classList.contains('reject-btn')) {
            handleLeaveAction(e.target.dataset.id, 'reject');
        }
    });

    // View all button handler
    document.querySelector('.view-all-btn').addEventListener('click', function() {
        window.location.href = 'LeaveRequests.html';
    });

    // Auto-refresh every 5 minutes
    setInterval(updateDashboardStats, 300000);
}); 