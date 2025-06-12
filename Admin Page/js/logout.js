/* Shared Logout Functionality */
document.addEventListener('DOMContentLoaded', function() {
    // Logout functionality - support both ID formats
    const logoutModal = document.getElementById('logout-modal');
    const logoutBtn = document.getElementById('logout-btn') || document.getElementById('logoutBtn');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    const confirmLogoutBtn = document.getElementById('confirm-logout');

    if (logoutBtn && logoutModal) {
        // Logout modal handlers
        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', () => {
                logoutModal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', () => {
                // Send logout request to server
                fetch('../handlers/logout.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Redirect to login page
                        window.location.href = '../index.html';
                    } else {
                        alert('Logout failed. Please try again.');
                        logoutModal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    // Redirect anyway for security
                    window.location.href = '../index.html';
                });
            });
        }

        // Close logout modal when clicking outside
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});
