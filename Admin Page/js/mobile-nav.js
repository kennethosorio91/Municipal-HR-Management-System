// Mobile Navigation and Responsive Functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('mobile-menu-button');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-nav-overlay');

    // Toggle menu on button click
    menuButton.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        menuButton.classList.toggle('active');
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        menuButton.classList.remove('active');
    });

    // Close menu when clicking a nav link (for mobile)
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                menuButton.classList.remove('active');
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            menuButton.classList.remove('active');
        }
    });
});

// Utility function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Function to handle orientation change
function handleOrientationChange() {
    window.addEventListener('orientationchange', function() {
        // Small delay to allow orientation change to complete
        setTimeout(() => {
            if (!isMobileDevice()) {
                closeMobileMenu();
            }
        }, 100);
    });
}

// Initialize orientation change handler
handleOrientationChange();

// Export functions for external use if needed
window.MobileNav = {
    toggle: toggleMobileMenu,
    open: openMobileMenu,
    close: closeMobileMenu,
    isMobile: isMobileDevice
};
