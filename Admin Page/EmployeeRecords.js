document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('addEmployeeModal');
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const addEmployeeForm = document.getElementById('addEmployeeForm');

    // Open modal
    addEmployeeBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    });

    // Close modal functions
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        addEmployeeForm.reset(); // Reset form when closing
    }

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    addEmployeeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Collect form data
        const formData = {
            fullName: document.getElementById('fullName').value,
            position: document.getElementById('position').value,
            department: document.getElementById('department').value,
            employmentType: document.getElementById('employmentType').value,
            status: document.getElementById('status').value,
            dateHired: document.getElementById('dateHired').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };

        // TODO: Send data to backend when connected
        console.log('Form submitted:', formData);
        
        // Close modal after submission
        closeModal();
    });
}); 