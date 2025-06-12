// Leave & Travel Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Apply Leave button functionality
    const applyLeaveBtn = document.querySelector('.btn-apply-leave');
    const requestTravelBtn = document.querySelector('.btn-travel-order');

    if (applyLeaveBtn) {
        applyLeaveBtn.addEventListener('click', function() {
            // TODO: Implement leave application modal/form
            alert('Leave application form will be implemented here');
        });
    }

    if (requestTravelBtn) {
        requestTravelBtn.addEventListener('click', function() {
            // TODO: Implement travel order request modal/form
            alert('Travel order request form will be implemented here');
        });
    }

    // Add hover effects for better UX
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        badge.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        badge.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Add click effects for application items
    const applicationItems = document.querySelectorAll('.application-item, .travel-order-item');
    applicationItems.forEach(item => {
        item.addEventListener('click', function() {
            // TODO: Implement detailed view modal
            console.log('Application/Order details clicked');
        });
        
        // Add visual feedback on hover
        item.style.cursor = 'pointer';
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
    });
});
