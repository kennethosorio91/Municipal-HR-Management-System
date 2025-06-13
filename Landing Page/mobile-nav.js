// Mobile Navigation for Landing Page
document.addEventListener('DOMContentLoaded', function() {
    // Create mobile menu elements
    createMobileNavigation();
    
    // Initialize mobile navigation functionality
    initializeMobileNav();
    
    // Handle window resize
    handleWindowResize();
});

function createMobileNavigation() {
    // Create mobile menu button (hamburger)
    const nav = document.querySelector('nav');
    const rightSide = document.querySelector('.right-side');
    
    // Create hamburger menu button
    const hamburger = document.createElement('div');
    hamburger.className = 'mobile-hamburger';
    hamburger.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    // Insert hamburger before nav-links
    rightSide.insertBefore(hamburger, rightSide.firstChild);
    
    // Create mobile overlay
    const mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-nav-overlay';
    document.body.appendChild(mobileOverlay);
    
    // Create mobile sidebar
    const mobileSidebar = document.createElement('div');
    mobileSidebar.className = 'mobile-nav-sidebar';
    
    // Clone navigation links for mobile sidebar
    const navLinks = document.querySelector('.nav-links');
    const mobileNavLinks = navLinks.cloneNode(true);
    mobileNavLinks.className = 'mobile-nav-links';
    
    // Add close button to mobile sidebar
    const closeButton = document.createElement('div');
    closeButton.className = 'mobile-nav-close';
    closeButton.innerHTML = '×';
    
    // Assemble mobile sidebar
    mobileSidebar.appendChild(closeButton);
    mobileSidebar.appendChild(mobileNavLinks);
    
    // Add mobile sidebar to body
    document.body.appendChild(mobileSidebar);
}

function initializeMobileNav() {
    const hamburger = document.querySelector('.mobile-hamburger');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const sidebar = document.querySelector('.mobile-nav-sidebar');
    const closeButton = document.querySelector('.mobile-nav-close');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    
    // Open mobile navigation
    hamburger.addEventListener('click', function() {
        openMobileNav();
    });
    
    // Close mobile navigation when clicking overlay
    overlay.addEventListener('click', function() {
        closeMobileNav();
    });
    
    // Close mobile navigation when clicking close button
    closeButton.addEventListener('click', function() {
        closeMobileNav();
    });
    
    // Close mobile navigation when clicking nav links
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            closeMobileNav();
        });
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeMobileNav();
        }
    });
}

function openMobileNav() {
    const hamburger = document.querySelector('.mobile-hamburger');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const sidebar = document.querySelector('.mobile-nav-sidebar');
    
    hamburger.classList.add('active');
    overlay.classList.add('active');
    sidebar.classList.add('active');
    
    // Prevent body scroll when mobile nav is open
    document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
    const hamburger = document.querySelector('.mobile-hamburger');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const sidebar = document.querySelector('.mobile-nav-sidebar');
    
    hamburger.classList.remove('active');
    overlay.classList.remove('active');
    sidebar.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

function handleWindowResize() {
    window.addEventListener('resize', function() {
        // Close mobile nav when resizing to desktop
        if (window.innerWidth > 768) {
            closeMobileNav();
        }
        
        // Update mobile navigation visibility
        updateMobileNavVisibility();
    });
    
    // Initial check
    updateMobileNavVisibility();
}

function updateMobileNavVisibility() {
    const hamburger = document.querySelector('.mobile-hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (window.innerWidth <= 768) {
        // Mobile view
        hamburger.style.display = 'flex';
        navLinks.style.display = 'none';
    } else {
        // Desktop view
        hamburger.style.display = 'none';
        navLinks.style.display = 'flex';
        closeMobileNav(); // Ensure mobile nav is closed
    }
}

// Smooth scroll for mobile navigation links
function smoothScrollToSection(targetId) {
    const target = document.querySelector(targetId);
    if (target) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Export functions for external use if needed
window.LandingMobileNav = {
    open: openMobileNav,
    close: closeMobileNav,
    toggle: function() {
        const sidebar = document.querySelector('.mobile-nav-sidebar');
        if (sidebar.classList.contains('active')) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    }
};
