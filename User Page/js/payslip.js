/* Payslip Page JavaScript */
document.addEventListener('DOMContentLoaded', function() {
    // Download current payslip button
    const downloadCurrentBtn = document.querySelector('.btn-download-payslip');
    if (downloadCurrentBtn) {
        downloadCurrentBtn.addEventListener('click', function() {
            alert('Downloading current payslip...');
            // Add actual download functionality here
        });
    }

    // History download buttons
    const historyDownloadBtns = document.querySelectorAll('.btn-download');
    historyDownloadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const historyItem = btn.closest('.history-item');
            const period = historyItem.querySelector('h3').textContent;
            alert(`Downloading payslip for ${period}...`);
            // Add actual download functionality here
        });
    });

    // History view buttons
    const historyViewBtns = document.querySelectorAll('.btn-view');
    historyViewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const historyItem = btn.closest('.history-item');
            const period = historyItem.querySelector('h3').textContent;
            alert(`Viewing payslip for ${period}...`);
            // Add actual view functionality here
        });
    });

    // Payslip filter
    const payslipFilter = document.getElementById('payslipFilter');
    if (payslipFilter) {
        payslipFilter.addEventListener('change', function() {
            const selectedPeriod = this.value;
            console.log('Filter changed to:', selectedPeriod);
            // Add filtering functionality here
        });
    }
});
