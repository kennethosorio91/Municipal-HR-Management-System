document.addEventListener('DOMContentLoaded', function() {
    const logoutModal = document.getElementById('logoutModal');
    const logoutBtn = document.getElementById('logoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

    if (logoutBtn && logoutModal) {
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
                        window.location.href = '../index.html';
                    } else {
                        alert('Logout failed. Please try again.');
                        logoutModal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    window.location.href = '../index.html';
                });
            });
        }

        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});
