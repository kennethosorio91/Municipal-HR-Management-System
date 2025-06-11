console.log('EmployeeRecords.js loaded'); // Test log to verify script loading

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - EmployeeRecords.js'); // Test log for DOM ready
    // Get DOM elements
    const elements = {
        addBtn: document.querySelector('.add-employee-btn'),
        closeBtn: document.querySelector('.close-modal'),
        cancelBtn: document.querySelector('.cancel-btn'),
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
    let filteredEmployees = []; // This variable is assigned but its value is not used beyond re-assignment in applyFilters. It can be localized or removed if applyFilters directly modifies allEmployees or returns a new array.

    // Initialize
    loadEmployees();
    setupEventListeners();
    // setupFilters(); // Called within loadEmployees after data is fetched to ensure dropdowns are populated correctly.

    // Load employees from database
    function loadEmployees() {
        showLoading(true);
        
        fetch('../handlers/get_employees.php')
            .then(response => response.json())
            .then(data => {
                showLoading(false);
                if (data.success && data.data?.length > 0) {
                    allEmployees = data.data;
                    // filteredEmployees = [...allEmployees]; // Redundant, applyFilters will create the filtered list.
                    updateStatCards(allEmployees);
                    populateFilterDropdowns(); // Populate filters after data is loaded
                    applyFilters(); // Apply initial filters (e.g. search term if any, or just display all)
                    // displayEmployees(filteredEmployees); // Called by applyFilters
                } else {
                    allEmployees = [];
                    // filteredEmployees = [];
                    updateStatCards([]);
                    populateFilterDropdowns(); // Still populate, might show "All" options even if no data
                    showNoData();
                }
            })
            .catch(error => {
                console.error('Error loading employees:', error);
                showLoading(false);
                allEmployees = [];
                // filteredEmployees = [];
                updateStatCards([]);
                populateFilterDropdowns();
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
        // populateFilterDropdowns(); // Moved to loadEmployees to ensure it runs after data is fetched

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
        const typeFilterValue = elements.typeFilter?.value || '';
        const departmentFilterValue = elements.departmentFilter?.value || '';
        const statusFilterValue = elements.statusFilter?.value || '';

        let tempFilteredEmployees = allEmployees.filter(emp => {
            const nameMatch = (emp.fullName || emp.name || '').toLowerCase().includes(searchTerm);
            const positionMatch = (emp.position || '').toLowerCase().includes(searchTerm);
            const departmentMatch = (emp.department || '').toLowerCase().includes(searchTerm);
            const idMatch = (emp.id || '').toLowerCase().includes(searchTerm);
            const employmentMatch = (emp.employment || emp.type || '').toLowerCase().includes(searchTerm);
            const statusMatch = (emp.status || '').toLowerCase().includes(searchTerm);

            const searchFilterMatch = !searchTerm || nameMatch || positionMatch || departmentMatch || idMatch || employmentMatch || statusMatch;
            
            const typeDropdownMatch = !typeFilterValue || (emp.employment || emp.type) === typeFilterValue;
            const departmentDropdownMatch = !departmentFilterValue || emp.department === departmentFilterValue;
            const statusDropdownMatch = !statusFilterValue || emp.status === statusFilterValue;

            return searchFilterMatch && typeDropdownMatch && departmentDropdownMatch && statusDropdownMatch;
        });

        displayEmployees(tempFilteredEmployees);
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
                            <button class="employee-action-btn" data-id="${data.id}" data-action="view" title="View">
                                <img src="../assets/viewDetails.png" alt="View">
                            </button>
                            <button class="employee-action-btn" data-id="${data.id}" data-action="edit" title="Edit">
                                <img src="../assets/editEmployee.png" alt="Edit">
                            </button>
                            <button class="employee-action-btn" data-id="${data.id}" data-action="files" title="Files">
                                <img src="../assets/document.png" alt="Files">
                            </button>
                            <button class="employee-action-btn" data-id="${data.id}" data-action="archive" title="Archive">
                                <img src="../assets/archive.png" alt="Archive">
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add click listeners to action buttons
        document.querySelectorAll('.employee-action-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const employeeId = btn.dataset.id;
                
                switch(action) {
                    case 'view':
                        openViewModal(employeeId);
                        break;
                    case 'edit':
                        openEditModal(employeeId);
                        break;
                    case 'files':
                        openFilesModal(employeeId);
                        break;
                    case 'archive':
                        openArchiveModal(employeeId);
                        break;
                }
            };
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Modal controls
        if (elements.addBtn) {
            elements.addBtn.addEventListener('click', () => {
                // elements.modal.style.display = 'flex'; // This was for the old static modal
                openAddEmployeeModal(); // Function to create and open the add employee modal dynamically
            });
        }
        if (elements.closeBtn) {
            // elements.closeBtn.addEventListener('click', closeModal); // This was for the old static modal
            // Dynamic modals have their own close buttons, handled by closeEmployeeModal
        }
        if (elements.cancelBtn) {
            // elements.cancelBtn.addEventListener('click', closeModal); // This was for the old static modal
             // Dynamic modals have their own cancel buttons, handled by closeEmployeeModal or specific logic
        }
        if (elements.form) {
            // elements.form.addEventListener('submit', handleFormSubmit); // This was for the old static modal form
            // The new add employee modal will have its own form and submit handler
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
        const form = e.target; // Get the form that triggered the submit event
        const formData = new FormData(form);
        const employeeData = {
            fullName: formData.get('fullName'),
            position: formData.get('position'),
            gender: formData.get('gender'),
            department: formData.get('department'),
            employment: formData.get('employment'),
            status: formData.get('status'),
            dateHired: formatDateToMMDDYYYY(formData.get('dateHired')),
            birthdate: formatDateToMMDDYYYY(formData.get('birthdate')),
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
                // Show success message with generated email
                alert(`Employee added successfully!\nLogin credentials:\nEmail: ${data.data.email}\nPassword: ${formatDateToMMDDYYYY(employeeData.birthdate)}`);
                // Close modal and reset form
                // closeModal(); // Old static modal close
                const modalOverlay = form.closest('.employee-modal-overlay');
                if (modalOverlay) modalOverlay.remove();
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

    // Helper function to format date to MM/DD/YYYY
    function formatDateToMMDDYYYY(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    // Helper functions
    function showLoading(show) {
        if (elements.loading) elements.loading.style.display = show ? 'block' : 'none';
        if (elements.noData) elements.noData.style.display = 'none';
    }

    function showNoData(message = 'No employee records found.') {
        if (elements.noData) {
            elements.noData.style.display = 'block'; // This should be 'table-row' or similar if it's a table row itself, or handle visibility of a container.
            elements.noData.innerHTML = `<td colspan="7"><p>${message}</p></td>`; // Assuming 7 columns in the table
        }
        if (elements.tableBody) {
            elements.tableBody.innerHTML = ''; // Clear the table body when no data
        }
    }

    function closeModal() { // This function is now largely obsolete due to dynamic modals
        // if (elements.modal) { // elements.modal refers to the old static modal
        //     elements.modal.style.display = 'none';
        //     if (elements.form) elements.form.reset();
        // }
        // For dynamic modals, use modal.remove() as implemented in closeEmployeeModal
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
        direction: 'asc' // Default direction
    };

    // Modal functions
    function openAddEmployeeModal() {
        const modal = createAddEmployeeModal();
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        setupModalCloseHandlers(modal);

        // Attach submit event listener to the new form
        const addForm = modal.querySelector('#addEmployeeForm');
        if (addForm) {
            addForm.addEventListener('submit', handleFormSubmit);
        }
    }

    function createAddEmployeeModal() {
        const modal = document.createElement('div');
        modal.className = 'employee-modal-overlay';
        modal.id = 'addEmployeeModalOverlay'; // Added an ID for easier selection if needed
        modal.innerHTML = `
            <div class="employee-modal edit-modal"> <!-- Using edit-modal for styling, can be a new class -->
                <div class="modal-header">
                    <h2>Add New Employee</h2>
                    <button class="close-modal" onclick="closeEmployeeModal(this)">&times;</button>
                </div>
                <div class="modal-content">
                    <p class="modal-subtitle">Enter the details for the new employee.</p>
                    <form id="addEmployeeForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="fullName">Full Name</label>
                                <input type="text" id="fullName" name="fullName" class="form-field" required>
                            </div>
                            <div class="form-group">
                                <label for="position">Position</label>
                                <input type="text" id="position" name="position" class="form-field" required>
                            </div>
                            <div class="form-group">
                                <label for="gender">Gender</label>
                                <select id="gender" name="gender" class="form-field" required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="department">Department</label>
                                <select id="department" name="department" class="form-field" required>
                                    <option value="">Select Department</option>
                                    <option value="Human Resources">Human Resources</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="General Services">General Services</option>
                                    <option value="Health">Health</option>
                                    <option value="Agriculture">Agriculture</option>
                                    <option value="Legal">Legal</option>
                                    <option value="Planning">Planning</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="employment">Employee Type</label>
                                <select id="employment" name="employment" class="form-field" required>
                                    <option value="">Select Type</option>
                                    <option value="Permanent">Permanent</option>
                                    <option value="Contractual">Contractual</option>
                                    <option value="Job Order">Job Order</option>
                                    <option value="Probationary">Probationary</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="status">Status</label>
                                <select id="status" name="status" class="form-field" required>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="dateHired">Date Hired</label>
                                <input type="date" id="dateHired" name="dateHired" class="form-field" required>
                            </div>
                            <div class="form-group">
                                <label for="birthdate">Birthdate</label>
                                <input type="date" id="birthdate" name="birthdate" class="form-field" required>
                            </div>
                            <div class="form-group">
                                <label for="phone">Phone</label>
                                <input type="tel" id="phone" name="phone" class="form-field">
                            </div>
                            <div class="form-group form-group-full">
                                <label for="address">Address</label>
                                <input type="text" id="address" name="address" class="form-field">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeEmployeeModal(this)">Cancel</button>
                            <button type="submit" class="btn-save">Add Employee</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        return modal;
    }

    function openViewModal(employeeId) {
        const employee = allEmployees.find(emp => emp.id === employeeId);
        if (!employee) {
            alert('Employee not found');
            return;
        }

        const modal = createViewModal(employee);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add click outside to close functionality
        setupModalCloseHandlers(modal);
    }

    function createViewModal(employee) {
        const modal = document.createElement('div');
        modal.className = 'employee-modal-overlay';
        modal.innerHTML = `
            <div class="employee-modal view-modal">
                <div class="modal-header">
                    <h2>Employee Details</h2>
                    <button class="close-modal" onclick="closeEmployeeModal(this)">&times;</button>
                </div>
                <div class="modal-content">
                    <p class="modal-subtitle">View employee information and employee details</p>
                    <div class="employee-details-grid">
                        <div class="detail-item">
                            <label>Employee ID</label>
                            <span>${employee.id || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Full Name</label>
                            <span>${employee.fullName || employee.name || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Position</label>
                            <span>${employee.position || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Department</label>
                            <span>${employee.department || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Employment Type</label>
                            <span>${employee.employment || employee.type || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status</label>
                            <span>${employee.status || 'Active'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Date Hired</label>
                            <span>${employee.dateHired || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email</label>
                            <span>${employee.email || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone</label>
                            <span>${employee.phone || 'N/A'}</span>
                        </div>
                        <div class="detail-item detail-item-full">
                            <label>Address</label>
                            <span>${employee.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    function openEditModal(employeeId) {
        const employee = allEmployees.find(emp => emp.id === employeeId);
        if (!employee) {
            alert('Employee not found');
            return;
        }

        const modal = createEditModal(employee);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add click outside to close functionality
        setupModalCloseHandlers(modal);
    }

    function openFilesModal(employeeId) {
        const employee = allEmployees.find(emp => emp.id === employeeId);
        if (!employee) {
            alert('Employee not found');
            return;
        }

        const modal = createFilesModal(employee);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add click outside to close functionality
        setupModalCloseHandlers(modal);
    }

    function openArchiveModal(employeeId) {
        const employee = allEmployees.find(emp => emp.id === employeeId);
        if (!employee) {
            alert('Employee not found');
            return;
        }

        const modal = createArchiveModal(employee);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add click outside to close functionality
        setupModalCloseHandlers(modal);
    }

    function createEditModal(employee) {
        const modal = document.createElement('div');
        modal.className = 'employee-modal-overlay';
        modal.innerHTML = `
            <div class="employee-modal edit-modal">
                <div class="modal-header">
                    <h2>Employee Details</h2>
                    <button class="close-modal" onclick="closeEmployeeModal(this)">&times;</button>
                </div>
                <div class="modal-content">
                    <p class="modal-subtitle">View employee information and employee details</p>
                    <form class="edit-employee-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="editEmployeeId">Employee ID</label>
                                <div class="form-field-display">${employee.id || 'EMP001'}</div>
                            </div>
                            <div class="form-group">
                                <label for="editFullName">Full Name</label>
                                <input type="text" id="editFullName" name="fullName" value="${employee.fullName || employee.name || ''}" class="form-field">
                            </div>
                            <div class="form-group">
                                <label for="editPosition">Position</label>
                                <div class="form-field-display">${employee.position || 'Administrative Officer III'}</div>
                            </div>
                            <div class="form-group">
                                <label for="editDepartment">Department</label>
                                <select id="editDepartment" name="department" class="form-field">
                                    <option value="Human Resources" ${employee.department === 'Human Resources' ? 'selected' : ''}>Human Resources</option>
                                    <option value="Finance" ${employee.department === 'Finance' ? 'selected' : ''}>Finance</option>
                                    <option value="Engineering" ${employee.department === 'Engineering' ? 'selected' : ''}>Engineering</option>
                                    <option value="General Services" ${employee.department === 'General Services' ? 'selected' : ''}>General Services</option>
                                    <option value="Health" ${employee.department === 'Health' ? 'selected' : ''}>Health</option>
                                    <option value="Agriculture" ${employee.department === 'Agriculture' ? 'selected' : ''}>Agriculture</option>
                                    <option value="Legal" ${employee.department === 'Legal' ? 'selected' : ''}>Legal</option>
                                    <option value="Planning" ${employee.department === 'Planning' ? 'selected' : ''}>Planning</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editEmployeeType">Employee Type</label>
                                <select id="editEmployeeType" name="employment" class="form-field">
                                    <option value="Permanent" ${employee.employment === 'Permanent' ? 'selected' : ''}>Permanent</option>
                                    <option value="Contractual" ${employee.employment === 'Contractual' ? 'selected' : ''}>Contractual</option>
                                    <option value="Job Order" ${employee.employment === 'Job Order' ? 'selected' : ''}>Job Order</option>
                                    <option value="Probationary" ${employee.employment === 'Probationary' ? 'selected' : ''}>Probationary</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editStatus">Status</label>
                                <select id="editStatus" name="status" class="form-field">
                                    <option value="Active" ${employee.status === 'Active' ? 'selected' : ''}>Active</option>
                                    <option value="Inactive" ${employee.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                    <option value="On Leave" ${employee.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
                                    <option value="Terminated" ${employee.status === 'Terminated' ? 'selected' : ''}>Terminated</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editEmail">Email</label>
                                <input type="email" id="editEmail" name="email" value="${employee.email || ''}" class="form-field">
                            </div>
                            <div class="form-group">
                                <label for="editPhone">Phone</label>
                                <input type="tel" id="editPhone" name="phone" value="${employee.phone || ''}" class="form-field">
                            </div>
                            <div class="form-group form-group-full">
                                <label for="editAddress">Address</label>
                                <input type="text" id="editAddress" name="address" value="${employee.address || ''}" class="form-field">
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeEmployeeModal(this)">Cancel</button>
                            <button type="submit" class="btn-save">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        return modal;
    }

    function createFilesModal(employee) {
        const modal = document.createElement('div');
        modal.className = 'employee-modal-overlay';
        modal.innerHTML = `
            <div class="employee-modal files-modal">
                <div class="modal-header">
                    <h2>Document Management - ${employee.fullName || employee.name || 'Employee'}</h2>
                    <button class="close-modal" onclick="closeEmployeeModal(this)">&times;</button>
                </div>
                <div class="modal-content">
                    <p class="modal-subtitle">Manage CSC Forms, Appointment Papers, and Service Records</p>
                    <div class="document-categories">
                        <div class="document-category">
                            <h3>CSC Forms</h3>
                            <div class="document-items">
                                <div class="document-item">
                                    <span class="document-name">PDS (Personal Data Sheet)</span>
                                    <button class="document-view-btn">View</button>
                                </div>
                                <div class="document-item">
                                    <span class="document-name">CS Form 212</span>
                                    <button class="document-view-btn">View</button>
                                </div>
                            </div>
                            <button class="save-changes-btn">Save Changes</button>
                        </div>
                        <div class="document-category">
                            <h3>Appointment Papers</h3>
                            <div class="document-items">
                                <div class="document-item">
                                    <span class="document-name">Original Appointment</span>
                                    <button class="document-view-btn">View</button>
                                </div>
                                <div class="document-item">
                                    <span class="document-name">Promotion Order</span>
                                    <button class="document-view-btn">View</button>
                                </div>
                            </div>
                            <button class="save-changes-btn">Save Changes</button>
                        </div>
                        <div class="document-category">
                            <h3>Service Records</h3>
                            <div class="document-items">
                                <div class="document-item">
                                    <span class="document-name">Service Record 2024</span>
                                    <button class="document-view-btn">View</button>
                                </div>
                                <div class="document-item">
                                    <span class="document-name">Service Record 2023</span>
                                    <button class="document-view-btn">View</button>
                                </div>
                            </div>
                            <button class="save-changes-btn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    function createArchiveModal(employee) {
        const modal = document.createElement('div');
        modal.className = 'employee-modal-overlay';
        modal.innerHTML = `
            <div class="employee-modal archive-modal">
                <div class="modal-header">
                    <h2>Archive Employee</h2>
                    <button class="close-modal" onclick="closeEmployeeModal(this)">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="archive-content">
                        <p class="archive-question">Are you sure you want to archive <strong>${employee.fullName || employee.name || 'this employee'}</strong>? This action will move the employee to the archived list and they will no longer appear in the active employee directory.</p>
                        <div class="archive-actions">
                            <button type="button" class="btn-cancel" onclick="closeEmployeeModal(this)">Cancel</button>
                            <button type="button" class="btn-archive" onclick="confirmArchive('${employee.id}')">Archive Employee</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    // Setup modal close handlers
    function setupModalCloseHandlers(modal) {
        // Close modal when clicking outside the modal content
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Prevent modal from closing when clicking inside the modal content
        const modalContent = modal.querySelector('.employee-modal');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    // Global function to close modals
    window.closeEmployeeModal = function(button) {
        const modal = button.closest('.employee-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // Global function to confirm archive
    window.confirmArchive = function(employeeId) {
        const reason = document.getElementById('archiveReason').value;
        console.log('Archiving employee:', employeeId, 'Reason:', reason);
        
        // Here you would normally send the data to your backend
        alert('Employee archived successfully!\n\nNote: This is a demo. In a real system, the employee would be moved to archived records.');
        
        // Close the modal
        const modal = document.querySelector('.employee-modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        // Optionally refresh the table or remove the employee from view
        // renderEmployeeTable(currentEmployees);
    }
});