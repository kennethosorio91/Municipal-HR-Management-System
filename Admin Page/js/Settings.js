// Settings Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get navigation cards and content sections
    const settingsCards = document.querySelectorAll('.settings-card');
    const contentSections = document.querySelectorAll('.content-section');

    // Show default section (help-desk)
    document.getElementById('help-desk').style.display = 'block';
    settingsCards[0].classList.add('active');

    // Add click event listeners to navigation cards
    settingsCards.forEach(card => {
        card.addEventListener('click', function() {
            const setting = this.dataset.setting;
            
            // Update active card
            settingsCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected content section
            contentSections.forEach(section => {
                section.style.display = section.id === setting ? 'block' : 'none';
            });

            // Load tickets if help-desk section is selected
            if (setting === 'help-desk') {
                loadContactTickets();
            }
        });
    });

    // User Management Form Handler
    const createUserForm = document.querySelector('.create-user-form');
    if (createUserForm) {
        createUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                role: document.getElementById('role').value
            };
            
            // Validate form
            if (!formData.username || !formData.email || !formData.role) {
                alert('Please fill in all fields');
                return;            }
            
            // Here you would typically send data to server
            alert('User created successfully!');
            
            // Reset form
            createUserForm.reset();
        });
    }

    // Work Schedule Form Handler
    const saveScheduleBtn = document.querySelector('.save-schedule-btn');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', function() {
            // Collect schedule data
            const scheduleData = {
                startTime: document.querySelector('.schedule-item:first-child .input-group:first-child input').value,
                endTime: document.querySelector('.schedule-item:first-child .input-group:last-child input').value,
                lunchStart: document.querySelector('.schedule-item:nth-child(2) .input-group:first-child input').value,
                lunchEnd: document.querySelector('.schedule-item:nth-child(2) .input-group:last-child input').value,
                overtimeEnabled: document.querySelector('.overtime-controls input[type="checkbox"]').checked,
                overtimeRate: document.querySelector('.overtime-controls input[type="number"]').value            };
            
            alert('Schedule settings saved successfully!');
        });
    }

    // Add Holiday Button Handler
    const addHolidayBtn = document.querySelector('.add-holiday-btn');
    if (addHolidayBtn) {
        addHolidayBtn.addEventListener('click', function() {
            const holidayName = prompt('Enter holiday name:');
            const holidayDate = prompt('Enter holiday date (YYYY-MM-DD):');
            
            if (holidayName && holidayDate) {
                addHolidayToList(holidayName, holidayDate);
            }
        });
    }

    // Function to add holiday to list
    function addHolidayToList(name, date) {
        const holidaysList = document.querySelector('.holidays-list');
        const holidayItem = document.createElement('div');
        holidayItem.className = 'holiday-item';
        holidayItem.innerHTML = `
            <div class="holiday-info">
                <div class="holiday-name">${name}</div>
                <div class="holiday-date">${formatDate(date)}</div>
            </div>
            <div class="holiday-actions">
                <button class="edit-btn" onclick="editHoliday(this)">Edit</button>
                <button class="delete-btn" onclick="deleteHoliday(this)">Delete</button>
            </div>
        `;
        
        holidaysList.appendChild(holidayItem);
    }

    // Format date function
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Holiday edit and delete functions (global scope)
    window.editHoliday = function(button) {
        const holidayItem = button.closest('.holiday-item');
        const nameElement = holidayItem.querySelector('.holiday-name');
        const dateElement = holidayItem.querySelector('.holiday-date');
        
        const currentName = nameElement.textContent;
        const newName = prompt('Edit holiday name:', currentName);
        
        if (newName && newName !== currentName) {
            nameElement.textContent = newName;
            alert('Holiday updated successfully!');
        }
    };

    window.deleteHoliday = function(button) {
        if (confirm('Are you sure you want to delete this holiday?')) {
            const holidayItem = button.closest('.holiday-item');
            holidayItem.remove();
            alert('Holiday deleted successfully!');
        }
    };

    // Backup System Button Handler
    const backupBtn = document.querySelector('.backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to create a system backup?')) {
                // Show loading state
                const originalText = this.textContent;
                this.textContent = 'Creating Backup...';
                this.disabled = true;
                
                // Simulate backup process
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    alert('System backup completed successfully!');
                }, 3000);
            }
        });
    }

    // Notifications Form Handler
    const saveNotificationsBtn = document.querySelector('.save-notifications-btn');
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.notification-options input[type="checkbox"]');
            const notificationSettings = {};
            
            checkboxes.forEach((checkbox, index) => {
                const label = checkbox.nextElementSibling.textContent;
                notificationSettings[label] = checkbox.checked;            });
            
            alert('Notification settings saved successfully!');
        });
    }

    // Auto-save functionality for form inputs
    const autoSaveInputs = document.querySelectorAll('input[type="time"], input[type="number"]');
    autoSaveInputs.forEach(input => {        input.addEventListener('change', function() {
            // Auto-save indication could be added here
        });
    });

    // Initialize tooltips or help text (if needed)
    initializeHelpers();

    function initializeHelpers() {
        // Add any additional helper functionality here
        // For example, form validation helpers, tooltips, etc.
    }

    // Function to load contact tickets
    function loadContactTickets() {
        fetch('../handlers/contact_tickets_handler.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayTickets(data.tickets);
                } else {
                    console.error('Error loading tickets:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Function to display tickets in the table
    function displayTickets(tickets) {
        const ticketTable = document.getElementById('ticketTable').getElementsByTagName('tbody')[0];
        ticketTable.innerHTML = ''; // Clear existing tickets

        tickets.forEach(ticket => {
            const row = ticketTable.insertRow();
            row.innerHTML = `
                <td>${ticket.name}</td>
                <td>${ticket.email}</td>
                <td>${ticket.message}</td>
                <td>${ticket.created_at}</td>
            `;
        });
    }

    // Search functionality
    document.getElementById('ticketSearch').addEventListener('input', function(e) {
        const searchText = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#ticketTable tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchText) ? '' : 'none';
        });
    });
});
