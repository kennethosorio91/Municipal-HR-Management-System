// Mobile Navigation and Responsive Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileNavigation();
});

function initializeMobileNavigation() {
    // Create mobile menu toggle button
    createMobileMenuToggle();
    
    // Create sidebar overlay
    createSidebarOverlay();
    
    // Set up event listeners
    setupMobileEventListeners();
    
    // Handle window resize
    handleWindowResize();
}

function createMobileMenuToggle() {
    // Check if mobile toggle already exists
    if (document.querySelector('.mobile-menu-toggle')) {
        return;
    }
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle navigation menu');
    toggleButton.setAttribute('aria-expanded', 'false');
    
    // Create hamburger icon
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        toggleButton.appendChild(span);
    }
    
    // Insert at the beginning of body
    document.body.insertBefore(toggleButton, document.body.firstChild);
}

function createSidebarOverlay() {
    // Check if overlay already exists
    if (document.querySelector('.sidebar-overlay')) {
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    
    // Insert after mobile toggle
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    if (toggleButton && toggleButton.nextSibling) {
        document.body.insertBefore(overlay, toggleButton.nextSibling);
    } else {
        document.body.appendChild(overlay);
    }
}

function setupMobileEventListeners() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (!toggleButton || !sidebar || !overlay) {
        return;
    }
    
    // Toggle button click
    toggleButton.addEventListener('click', function() {
        toggleMobileMenu();
    });
    
    // Overlay click to close
    overlay.addEventListener('click', function() {
        closeMobileMenu();
    });
    
    // Close menu when clicking sidebar links
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Small delay to allow navigation
            setTimeout(() => {
                closeMobileMenu();
            }, 100);
        });
    });
    
    // ESC key to close menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Prevent body scroll when menu is open
    const preventScroll = function(e) {
        if (sidebar.classList.contains('active')) {
            e.preventDefault();
        }
    };
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    });
    
    function handleSwipeGesture() {
        const swipeThreshold = 100;
        const swipeDirection = touchEndX - touchStartX;
        
        // Swipe right to open menu (from left edge)
        if (swipeDirection > swipeThreshold && touchStartX < 50 && !sidebar.classList.contains('active')) {
            openMobileMenu();
        }
        // Swipe left to close menu
        else if (swipeDirection < -swipeThreshold && sidebar.classList.contains('active')) {
            closeMobileMenu();
        }
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (!sidebar || !overlay || !toggleButton) return;
    
    sidebar.classList.add('active');
    overlay.classList.add('active');
    toggleButton.classList.add('active');
    toggleButton.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Show overlay
    overlay.style.display = 'block';
    
    // Focus management for accessibility
    setTimeout(() => {
        const firstLink = sidebar.querySelector('a');
        if (firstLink) {
            firstLink.focus();
        }
    }, 300);
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (!sidebar || !overlay || !toggleButton) return;
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    toggleButton.classList.remove('active');
    toggleButton.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Hide overlay after transition
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
    
    // Return focus to toggle button
    toggleButton.focus();
}

function handleWindowResize() {
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        // Close mobile menu if window becomes large enough
        if (window.innerWidth > 768 && sidebar && sidebar.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

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
