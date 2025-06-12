/* Performance Page JavaScript */
document.addEventListener('DOMContentLoaded', function() {
    // Request Training button
    const requestTrainingBtn = document.querySelector('.btn-request-training');
    if (requestTrainingBtn) {
        requestTrainingBtn.addEventListener('click', function() {
            alert('Redirecting to training request form...');
            // Add actual functionality here
        });
    }

    // Request COL button
    const requestColBtn = document.querySelector('.btn-request-col');
    if (requestColBtn) {
        requestColBtn.addEventListener('click', function() {
            alert('Redirecting to COL request form...');
            // Add actual functionality here
        });
    }

    // Download certificate buttons
    const downloadCertBtns = document.querySelectorAll('.btn-download-cert');
    downloadCertBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (btn.style.pointerEvents === 'none') {
                return;
            }
            
            const trainingItem = btn.closest('.training-item');
            const trainingTitle = trainingItem.querySelector('.training-title').textContent;
            alert(`Downloading certificate for: ${trainingTitle}`);
            // Add actual download functionality here
        });
    });
});
