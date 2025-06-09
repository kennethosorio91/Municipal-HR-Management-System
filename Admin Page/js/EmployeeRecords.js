console.log('EmployeeRecords.js loaded'); // Test log to verify script loading

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - EmployeeRecords.js'); // Test log for DOM ready
    // Get DOM elements
    const elements = {
        modal: document.getElementById('addEmployeeModal'),
        addBtn: document.querySelector('.add-employee-btn'),
        closeBtn: document.querySelector('.close-modal'),
        cancelBtn: document.querySelector('.cancel-btn'),
        form: document.getElementById('addEmployeeForm'),
        tableBody: document.getElementById('employeeTableBody'),
        loading: document.getElementById('tableLoadingState'),
        noData: document.getElementById('noDataMessage'),
        // Stat card elements
        statCards: document.querySelectorAll('.employee-stat-card'),
        searchInput: document.querySelector('.employee-search input'),
        typeFilter: document.querySelector('.employee-search select[title="Employee Type"]'),
        departmentFilter: document.querySelector('.employee-search select[title="Department"]'),
        statusFilter: document.querySelector('.employee-search select[title="Status"]')
    };

    // Store all employee data
    let allEmployees = [];
    let filteredEmployees = [];

    // Initialize
    loadEmployees();
    setupEventListeners();
    setupFilters();

    // Load employees from database
    function loadEmployees() {
        showLoading(true);
        
        fetch('../handlers/get_employees.php')
            .then(response => response.json())
            .then(data => {
                showLoading(false);
                if (data.success && data.data?.length > 0) {
                    allEmployees = data.data;
                    filteredEmployees = [...allEmployees];
                    updateStatCards(allEmployees);
                    displayEmployees(filteredEmployees);
                } else {
                    allEmployees = [];
                    filteredEmployees = [];
                    updateStatCards([]);
                    showNoData();
                }
            })
            .catch(error => {
                console.error('Error loading employees:', error);
                showLoading(false);
                allEmployees = [];
                filteredEmployees = [];
                updateStatCards([]);
                showNoData('Error loading data');
            });
    }

    // Update stat cards based on employee data
    function updateStatCards(employees) {
        // Count employees by type
        const typeCounts = {
            permanent: 0,
            contractual: 0,
            'job-order': 0,
            probation: 0
        };

        employees.forEach(emp => {
            const empType = (emp.employment || emp.type || '').toLowerCase().replace(/\s+/g, '-');
            
            if (empType === 'permanent') {
                typeCounts.permanent++;
            } else if (empType === 'contractual') {
                typeCounts.contractual++;
            } else if (empType === 'job-order') {
                typeCounts['job-order']++;
            } else if (empType === 'probation') {
                typeCounts.probation++;
            }
        });

        // Update stat card values
        const statData = [
            { count: typeCounts.permanent, label: 'Permanent', color: '#3BB77E' },
            { count: typeCounts.contractual, label: 'Contractual', color: '#0099FF' },
            { count: typeCounts['job-order'], label: 'Job Order', color: '#FF4B55' },
            { count: typeCounts.probation, label: 'Probation', color: '#A259FF' }
        ];

        elements.statCards.forEach((card, index) => {
            if (statData[index]) {
                const numberEl = card.querySelector('.employee-stat-number');
                const labelEl = card.querySelector('.employee-stat-label');
                
                if (numberEl && labelEl) {
                    animateNumber(numberEl, parseInt(numberEl.textContent) || 0, statData[index].count);
                    numberEl.style.color = statData[index].color;
                    labelEl.textContent = statData[index].label;
                }
            }
        });
    }

    // Animate number counting
    function animateNumber(element, start, end) {
        const duration = 800;
        const range = end - start;
        const startTime = performance.now();

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(start + (range * easeOutQuart));
            
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }

        requestAnimationFrame(updateNumber);
    }

    // Setup filter functionality
    function setupFilters() {
        // Populate filter dropdowns
        populateFilterDropdowns();

        // Add event listeners for filters
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', applyFilters);
        }
        if (elements.typeFilter) {
            elements.typeFilter.addEventListener('change', applyFilters);
        }
        if (elements.departmentFilter) {
            elements.departmentFilter.addEventListener('change', applyFilters);
        }
        if (elements.statusFilter) {
            elements.statusFilter.addEventListener('change', applyFilters);
        }
    }

    // Populate filter dropdown options
    function populateFilterDropdowns() {
        if (allEmployees.length === 0) return;

        // Get unique values
        const types = [...new Set(allEmployees.map(emp => emp.employment || emp.type).filter(Boolean))];
        const departments = [...new Set(allEmployees.map(emp => emp.department).filter(Boolean))];
        const statuses = [...new Set(allEmployees.map(emp => emp.status).filter(Boolean))];

        // Populate type filter
        if (elements.typeFilter) {
            elements.typeFilter.innerHTML = '<option value="">All Employee Types</option>';
            types.forEach(type => {
                elements.typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
            });
        }

        // Populate department filter
        if (elements.departmentFilter) {
            elements.departmentFilter.innerHTML = '<option value="">All Departments</option>';
            departments.forEach(dept => {
                elements.departmentFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }

        // Populate status filter
        if (elements.statusFilter) {
            elements.statusFilter.innerHTML = '<option value="">All Status</option>';
            statuses.forEach(status => {
                elements.statusFilter.innerHTML += `<option value="${status}">${status}</option>`;
            });
        }
    }

    // Apply filters to employee data
    function applyFilters() {
        const searchTerm = elements.searchInput?.value.toLowerCase() || '';

        filteredEmployees = allEmployees.filter(emp => {
            const searchableFields = [
                emp.fullName || emp.name || '',
                emp.position || '',
                emp.department || '',
                emp.id || '',
                emp.employment || emp.type || '',
                emp.status || ''
            ];

            return !searchTerm || searchableFields.some(field => 
                field.toString().toLowerCase().includes(searchTerm)
            );
        });

        displayEmployees(filteredEmployees);
    }

    // Display employees in table
    function displayEmployees(employees) {
        if (!elements.tableBody) return;
        
        if (employees.length === 0) {
            elements.tableBody.innerHTML = '';
            showNoData('No employees match your search criteria.');
            return;
        }

        // Hide no data message
        if (elements.noData) {
            elements.noData.style.display = 'none';
        }
        
        elements.tableBody.innerHTML = employees.map(emp => {
            const data = {
                id: emp.id || 'N/A',
                name: emp.fullName || emp.name || 'N/A',
                position: emp.position || 'N/A',
                department: emp.department || 'N/A',
                employment: emp.employment || emp.type || 'N/A',
                status: emp.status || 'Active'
            };
            
            const employmentClass = data.employment.toLowerCase().replace(/\s+/g, '-');
            const statusClass = data.status.toLowerCase().replace(/\s+/g, '-');
            
            return `
                <tr>
                    <td style="font-weight: 600; text-align: center;">${data.id}</td>
                    <td>${data.name}</td>
                    <td style="text-align: center;">${data.position}</td>
                    <td style="text-align: center;">${data.department}</td>
                    <td style="text-align: center;">
                        <span class="badge" data-type="${employmentClass}">${data.employment}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="badge ${statusClass}">${data.status}</span>
                    </td>
                    <td style="text-align: center;">
                        <div class="employee-actions">
                            <button class="employee-action-btn" data-id="${data.id}" title="View">👁️</button>
                            <button class="employee-action-btn" data-id="${data.id}" title="Edit">✏️</button>
                            <button class="employee-action-btn" data-id="${data.id}" title="Files">📄</button>
                            <button class="employee-action-btn" data-id="${data.id}" title="Archive">📦</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add click listeners to action buttons
        document.querySelectorAll('.employee-action-btn').forEach(btn => {
            btn.onclick = () => console.log('Action:', btn.title, 'ID:', btn.dataset.id);
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Modal controls
        if (elements.addBtn) {
            elements.addBtn.addEventListener('click', () => elements.modal.style.display = 'flex');
        }
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', closeModal);
        }
        if (elements.cancelBtn) {
            elements.cancelBtn.addEventListener('click', closeModal);
        }
        if (elements.form) {
            elements.form.addEventListener('submit', handleFormSubmit);
        }

        // Add click event listeners to sortable headers
        const sortableHeaders = document.querySelectorAll('th.sortable');
        console.log('Found sortable headers:', sortableHeaders.length); // Debug log
        
        sortableHeaders.forEach(header => {
            console.log('Adding click listener to:', header.textContent); // Debug log
            header.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Header clicked:', this.dataset.sort); // Debug log
                sortTable(this.dataset.sort);
            });
        });
    }

    // Form submission handler
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(elements.form);
        const employeeData = {
            fullName: formData.get('fullName'),
            position: formData.get('position'),
            gender: formData.get('gender'),
            department: formData.get('department'),
            employment: formData.get('employment'),
            status: formData.get('status'),
            dateHired: formData.get('dateHired'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        // Show loading state
        showLoading(true);

        // Send data to server
        fetch('../handlers/add_employee.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        })
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            if (data.success) {
                // Close modal and reset form
                closeModal();
                // Reload employee data
                loadEmployees();
            } else {
                alert(data.message || 'Error adding employee');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showLoading(false);
            alert('Error adding employee. Please try again.');
        });
    }

    // Helper functions
    function showLoading(show) {
        if (elements.loading) elements.loading.style.display = show ? 'block' : 'none';
        if (elements.noData) elements.noData.style.display = 'none';
    }

    function showNoData(message = 'No employee records found.') {
        if (elements.noData) {
            elements.noData.style.display = 'block';
            elements.noData.innerHTML = `<p>${message}</p>`;
        }
    }

    function closeModal() {
        if (elements.modal) {
            elements.modal.style.display = 'none';
            if (elements.form) elements.form.reset();
        }
    }

    // Sort table by column
    function sortTable(column) {
        console.log('Sorting by:', column); // Debug log
        const table = document.querySelector('.employee-table');
        if (!table) {
            console.error('Table not found!');
            return;
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) {
            console.error('Table body not found!');
            return;
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) {
            console.error('No rows found in table!');
            return;
        }

        const headers = table.querySelectorAll('th.sortable');
        console.log('Found headers:', headers.length); // Debug log

        // Remove sort classes from all headers
        headers.forEach(header => {
            header.classList.remove('asc', 'desc');
        });

        // Update sort direction
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        // Add sort class to current header
        const currentHeader = table.querySelector(`th[data-sort="${column}"]`);
        if (currentHeader) {
            currentHeader.classList.add(currentSort.direction);
        }

        // Sort rows
        rows.sort((a, b) => {
            const aValue = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
            const bValue = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();

            if (column === 'id') {
                // Sort numbers for ID column
                return currentSort.direction === 'asc' 
                    ? parseInt(aValue.replace('EMP', '')) - parseInt(bValue.replace('EMP', ''))
                    : parseInt(bValue.replace('EMP', '')) - parseInt(aValue.replace('EMP', ''));
            } else {
                // Sort strings for other columns
                return currentSort.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
        });

        // Reorder rows in the table
        rows.forEach(row => tbody.appendChild(row));
    }

    // Get column index for sorting
    function getColumnIndex(column) {
        const columnMap = {
            'id': 1,
            'name': 2,
            'position': 3,
            'department': 4,
            'type': 5,
            'status': 6
        };
        return columnMap[column];
    }

    // Store current sort state
    let currentSort = {
        column: null,
        direction: 'asc'
    };
});