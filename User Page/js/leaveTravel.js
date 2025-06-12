document.addEventListener('DOMContentLoaded', function() {
    const applyLeaveBtn = document.querySelector('.btn-apply-leave');
    const requestTravelBtn = document.querySelector('.btn-travel-order');

    if (applyLeaveBtn) {
        applyLeaveBtn.addEventListener('click', function() {
            alert('Leave application form will be implemented here');
        });
    }

    if (requestTravelBtn) {
        requestTravelBtn.addEventListener('click', function() {
            alert('Travel order request form will be implemented here');
        });
    }    const applicationItems = document.querySelectorAll('.application-item, .travel-order-item');
    applicationItems.forEach(item => {
        item.addEventListener('click', function() {
            // Add your logic here for handling the click
        });
    });
});
