document.addEventListener('DOMContentLoaded', function() {
    const requestTrainingBtn = document.querySelector('.btn-request-training');
    if (requestTrainingBtn) {
        requestTrainingBtn.addEventListener('click', function() {
            alert('Redirecting to training request form...');
        });
    }

    const requestColBtn = document.querySelector('.btn-request-col');
    if (requestColBtn) {
        requestColBtn.addEventListener('click', function() {
            alert('Redirecting to COL request form...');
        });
    }

    const downloadCertBtns = document.querySelectorAll('.btn-download-cert');
    downloadCertBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (btn.style.pointerEvents === 'none') return;
            
            const trainingItem = btn.closest('.training-item');
            const trainingTitle = trainingItem.querySelector('.training-title').textContent;
            alert(`Downloading certificate for: ${trainingTitle}`);
        });
    });
});
