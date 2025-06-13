document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const trainingModal = document.getElementById('trainingModal');
    const colModal = document.getElementById('colModal');
    
    // Get button elements
    const requestTrainingBtn = document.querySelector('.btn-request-training');
    const requestColBtn = document.querySelector('.btn-request-col');
    
    // Get close button elements
    const closeTrainingModalBtn = document.getElementById('closeTrainingModal');
    const closeColModalBtn = document.getElementById('closeColModal');
    const cancelTrainingBtn = document.getElementById('cancelTrainingRequest');
    const cancelColBtn = document.getElementById('cancelColRequest');
    
    // Get form elements
    const trainingForm = document.getElementById('trainingRequestForm');
    const colForm = document.getElementById('colRequestForm');
    
    // Open Training Modal
    if (requestTrainingBtn) {
        requestTrainingBtn.addEventListener('click', function() {
            openModal(trainingModal);
        });
    }
    
    // Open COL Modal
    if (requestColBtn) {
        requestColBtn.addEventListener('click', function() {
            openModal(colModal);
        });
    }
    
    // Close Training Modal
    if (closeTrainingModalBtn) {
        closeTrainingModalBtn.addEventListener('click', function() {
            closeModal(trainingModal);
        });
    }
    
    if (cancelTrainingBtn) {
        cancelTrainingBtn.addEventListener('click', function() {
            closeModal(trainingModal);
        });
    }
    
    // Close COL Modal
    if (closeColModalBtn) {
        closeColModalBtn.addEventListener('click', function() {
            closeModal(colModal);
        });
    }
    
    if (cancelColBtn) {
        cancelColBtn.addEventListener('click', function() {
            closeModal(colModal);
        });
    }
    
    // Close modals when clicking outside
    trainingModal?.addEventListener('click', function(e) {
        if (e.target === trainingModal) {
            closeModal(trainingModal);
        }
    });
    
    colModal?.addEventListener('click', function(e) {
        if (e.target === colModal) {
            closeModal(colModal);
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (trainingModal?.classList.contains('active')) {
                closeModal(trainingModal);
            }
            if (colModal?.classList.contains('active')) {
                closeModal(colModal);
            }
        }
    });
    
    // Handle Training Form Submission
    if (trainingForm) {
        trainingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleTrainingFormSubmission();
        });
    }
    
    // Handle COL Form Submission
    if (colForm) {
        colForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleColFormSubmission();
        });
    }
    
    // Modal utility functions
    function openModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            // Reset form if it exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                clearSuccessMessages(modal);
            }
        }
    }
    
    function showSuccessMessage(modal, message) {
        const modalBody = modal.querySelector('.modal-body');
        const existingMessage = modal.querySelector('.success-message');
        
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        modalBody.insertBefore(successDiv, modalBody.firstChild);
    }
    
    function clearSuccessMessages(modal) {
        const successMessage = modal.querySelector('.success-message');
        if (successMessage) {
            successMessage.remove();
        }
    }
    
    function handleTrainingFormSubmission() {
        const formData = new FormData(trainingForm);
        const trainingData = {
            title: formData.get('trainingTitle'),
            provider: formData.get('trainingProvider'),
            date: formData.get('trainingDate'),
            duration: formData.get('trainingDuration'),
            location: formData.get('trainingLocation'),
            cost: formData.get('trainingCost'),
            justification: formData.get('trainingJustification')
        };
        
        // Simulate API call
        console.log('Training Request Data:', trainingData);
        
        // Show success message
        showSuccessMessage(trainingModal, 'Training request submitted successfully! You will receive a confirmation email shortly.');
        
        // Reset form
        trainingForm.reset();
        
        // Auto-close modal after 3 seconds
        setTimeout(() => {
            closeModal(trainingModal);
        }, 3000);
    }
    
    function handleColFormSubmission() {
        const formData = new FormData(colForm);
        const colData = {
            overtimeDate: formData.get('overtimeDate'),
            overtimeHours: formData.get('overtimeHours'),
            colStartDate: formData.get('colStartDate'),
            colEndDate: formData.get('colEndDate'),
            overtimeReason: formData.get('overtimeReason'),
            colReason: formData.get('colReason')
        };
        
        // Validate dates
        const startDate = new Date(colData.colStartDate);
        const endDate = new Date(colData.colEndDate);
        const overtimeDate = new Date(colData.overtimeDate);
        
        if (startDate > endDate) {
            alert('COL end date must be after start date.');
            return;
        }
        
        if (overtimeDate > startDate) {
            alert('COL start date must be after the overtime work date.');
            return;
        }
        
        // Simulate API call
        console.log('COL Request Data:', colData);
        
        // Show success message
        showSuccessMessage(colModal, 'COL request submitted successfully! Your request will be reviewed by HR.');
        
        // Reset form
        colForm.reset();
        
        // Auto-close modal after 3 seconds
        setTimeout(() => {
            closeModal(colModal);
        }, 3000);
    }

    // Handle download certificate buttons
    const downloadCertBtns = document.querySelectorAll('.btn-download-cert');
    downloadCertBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (btn.style.pointerEvents === 'none') return;
            
            const trainingItem = btn.closest('.training-item');
            const trainingTitle = trainingItem.querySelector('.training-title').textContent;
            
            // Create an empty text file
            const blob = new Blob([''], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${trainingTitle.toLowerCase().replace(/\s+/g, '_')}_certificate.txt`;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        });
    });
});
