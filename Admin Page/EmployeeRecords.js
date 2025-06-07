document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Employee Records - DOM Loaded');
    
    // Get DOM elements with fallback selectors
    const elements = {
        modal: document.getElementById('addEmployeeModal'),
        addBtn: document.getElementById('addEmployeeBtn') || document.querySelector('.add-employee-btn'),
        closeBtn: document.getElementById('closeModalBtn') || document.querySelector('.close-modal'),
        cancelBtn: document.getElementById('cancelBtn') || document.querySelector('.cancel-btn'),
        form: document.getElementById('addEmployeeForm'),
        tableBody: document.getElementById('employeeTableBody'),
        loading: document.getElementById('tableLoadingState'),
        noData: document.getElementById('noDataMessage'),
        // Stat card elements
        statCards: document.querySelectorAll('.employee-stat-card'),
        // Fixed search elements with proper IDs
        searchInput: document.getElementById('searchInput'),
        typeFilter: document.getElementById('typeFilter'),
        departmentFilter: document.getElementById('departmentFilter'),
        statusFilter: document.getElementById('statusFilter')
    };

    // Debug function
    function debugLog(message) {
        console.log(`[DEBUG] ${message}`);
    }

    // Verify elements were found
    debugLog('Checking elements...');
    Object.entries(elements).forEach(([key, element]) => {
        if (!element && key !== 'statCards') {
            console.error(`❌ Element not found: ${key}`);
        } else if (element) {
            debugLog(`✅ Element found: ${key}`);
        }
    });

    // Store all employee data
    let allEmployees = [];
    let filteredEmployees = [];

    // Initialize
    debugLog('Initializing...');
    loadEmployees();
    setupEventListeners();
    setupFilters();

    // Load employees from database
    function loadEmployees() {
        debugLog('Loading employees...');
        showLoading(true);
        
        fetch('../handlers/get_employees.php')
            .then(response => {
                debugLog(`Response status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                debugLog('Received data:');
                console.log(data);
                showLoading(false);
                
                if (data.success && data.data?.length > 0) {
                    allEmployees = data.data;
                    filteredEmployees = [...allEmployees];
                    debugLog(`Loaded ${allEmployees.length} employees`);
                    updateStatCards(allEmployees);
                    displayEmployees(filteredEmployees);
                    populateFilterDropdowns();
                } else {
                    allEmployees = [];
                    filteredEmployees = [];
                    debugLog('No employee data found');
                    updateStatCards([]);
                    showNoData();
                }
            })
            .catch(error => {
                console.error('❌ Error loading employees:', error);
                showLoading(false);
                allEmployees = [];
                filteredEmployees = [];
                updateStatCards([]);
                showNoData('Error loading data');
            });
    }

    // Update stat cards based on employee data
    function updateStatCards(employees) {
        debugLog(`Updating stat cards with ${employees.length} employees`);
        
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
            } else if (empType === 'probationary' || empType === 'probation') {
                typeCounts.probation++;
            }
        });

        debugLog(`Type counts: ${JSON.stringify(typeCounts)}`);

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
                    // Animate number change
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
        
        if (range === 0) {
            element.textContent = end;
            return;
        }
        
        const startTime = performance.now();

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
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
        debugLog('Setting up filters...');
        
        // Add event listeners for filters
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
            debugLog('✅ Search input listener added');
        } else {
            console.error('❌ Search input not found');
        }
        
        if (elements.typeFilter) {
            elements.typeFilter.addEventListener('change', applyFilters);
            debugLog('✅ Type filter listener added');
        } else {
            console.error('❌ Type filter not found');
        }
        
        if (elements.departmentFilter) {
            elements.departmentFilter.addEventListener('change', applyFilters);
            debugLog('✅ Department filter listener added');
        } else {
            console.error('❌ Department filter not found');
        }
        
        if (elements.statusFilter) {
            elements.statusFilter.addEventListener('change', applyFilters);
            debugLog('✅ Status filter listener added');
        } else {
            console.error('❌ Status filter not found');
        }
    }

    // Debounce function for search input
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Populate filter dropdown options
    function populateFilterDropdowns() {
        if (allEmployees.length === 0) return;

        // Get unique values
        const types = [...new Set(allEmployees.map(emp => emp.employment || emp.type).filter(Boolean))];
        const departments = [...new Set(allEmployees.map(emp => emp.department).filter(Boolean))];
        const statuses = [...new Set(allEmployees.map(emp => emp.status).filter(Boolean))];

        debugLog(`Filter options - Types: ${types.length}, Departments: ${departments.length}, Statuses: ${statuses.length}`);

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
        const typeFilter = elements.typeFilter?.value || '';
        const departmentFilter = elements.departmentFilter?.value || '';
        const statusFilter = elements.statusFilter?.value || '';

        debugLog(`Applying filters: search="${searchTerm}", type="${typeFilter}", dept="${departmentFilter}", status="${statusFilter}"`);

        filteredEmployees = allEmployees.filter(emp => {
            const matchesSearch = !searchTerm || 
                (emp.fullName || emp.name || '').toLowerCase().includes(searchTerm) ||
                (emp.position || '').toLowerCase().includes(searchTerm) ||
                (emp.department || '').toLowerCase().includes(searchTerm) ||
                (emp.id || '').toString().includes(searchTerm);

            const matchesType = !typeFilter || (emp.employment || emp.type) === typeFilter;
            const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
            const matchesStatus = !statusFilter || emp.status === statusFilter;

            return matchesSearch && matchesType && matchesDepartment && matchesStatus;
        });

        debugLog(`Filtered to ${filteredEmployees.length} employees`);

        // Update stat cards with filtered data
        updateStatCards(filteredEmployees);
        
        // Display filtered employees
        displayEmployees(filteredEmployees);
    }

    // Display employees in table
    function displayEmployees(employees) {
        if (!elements.tableBody) {
            console.error('❌ Table body not found');
            return;
        }
        
        if (employees.length === 0) {
            elements.tableBody.innerHTML = '';
            showNoData('No employees match your search criteria.');
            return;
        }

        // Hide no data message
        if (elements.noData) {
            elements.noData.style.display = 'none';
        }
        
        debugLog(`Displaying ${employees.length} employees`);
        
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
        debugLog('Setting up event listeners...');
        
        // Add Employee Button
        if (elements.addBtn) {
            elements.addBtn.onclick = () => {
                debugLog('Add employee button clicked');
                elements.modal.style.display = 'flex';
            };
            debugLog('✅ Add button listener added');
        } else {
            console.error('❌ Add button not found');
        }
        
        // Close Modal Button
        if (elements.closeBtn) {
            elements.closeBtn.onclick = closeModal;
            debugLog('✅ Close button listener added');
        } else {
            console.error('❌ Close button not found');
        }
        
        // Cancel Button
        if (elements.cancelBtn) {
            elements.cancelBtn.onclick = closeModal;
            debugLog('✅ Cancel button listener added');
        } else {
            console.error('❌ Cancel button not found');
        }
        
        // Modal background click
        if (elements.modal) {
            elements.modal.onclick = (e) => {
                if (e.target === elements.modal) {
                    debugLog('Modal background clicked');
                    closeModal();
                }
            };
            debugLog('✅ Modal background listener added');
        }
        
        // Form submission
        if (elements.form) {
            elements.form.onsubmit = handleFormSubmit;
            debugLog('✅ Form submit listener added');
        } else {
            console.error('❌ Form not found');
        }
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        debugLog('Form submitted');
        
        // Get form data
        const formData = {
            fullName: document.getElementById('fullName')?.value.trim() || '',
            position: document.getElementById('position')?.value.trim() || '',
            gender: document.getElementById('gender')?.value || '',
            department: document.getElementById('department')?.value || '',
            employment: document.getElementById('employment')?.value || '',
            status: document.getElementById('status')?.value || 'Active',
            dateHired: document.getElementById('dateHired')?.value || '',
            email: document.getElementById('email')?.value.trim() || '',
            phone: document.getElementById('phone')?.value.trim() || '',
            address: document.getElementById('address')?.value.trim() || ''
        };

        debugLog('Form data:');
        console.log(formData);

        // Validate required fields
        const required = ['fullName', 'position', 'gender', 'department', 'employment', 'dateHired', 'email'];
        const missing = required.filter(field => !formData[field]);
        
        if (missing.length > 0) {
            debugLog(`Missing required fields: ${missing.join(', ')}`);
            alert(`Please fill in the following required fields:\n• ${missing.join('\n• ')}`);
            return;
        }

        debugLog('All required fields filled, sending to server...');

        const submitBtn = elements.form.querySelector('.add-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;

        fetch('../handlers/add_employee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => {
            debugLog(`Server response status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            debugLog('Server response:');
            console.log(data);
            
            if (data.success) {
                debugLog('Employee added successfully');
                alert('Employee added successfully!');
                closeModal();
                loadEmployees(); // Reload data to update stats and table
            } else {
                debugLog(`Server error: ${data.message}`);
                alert('Error: ' + (data.message || 'Unknown error occurred'));
            }
        })
        .catch(error => {
            debugLog(`Network error: ${error.message}`);
            console.error('Error:', error);
            alert('Network error occurred. Please check your connection and try again.');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
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
        if (elements.loading) elements.loading.style.display = 'none';
    }

    function closeModal() {
        debugLog('Closing modal');
        if (elements.modal) {
            elements.modal.style.display = 'none';
            if (elements.form) {
                elements.form.reset();
                debugLog('Form reset');
            }
        }
    }

    // Initialize date picker with current date as max
    function initializeDatePicker() {
        const dateInput = document.getElementById('dateHired');
        if (dateInput) {
            // Set max date to today
            const today = new Date().toISOString().split('T')[0];
            dateInput.max = today;
            debugLog('Date picker initialized with max date: ' + today);
        }
    }

    // Call date picker initialization
    initializeDatePicker();
});