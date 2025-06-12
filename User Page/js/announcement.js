/* Announcement Page JavaScript */
document.addEventListener('DOMContentLoaded', function() {
    // Announcement filter functionality
    const announcementFilter = document.getElementById('announcementFilter');
    if (announcementFilter) {
        announcementFilter.addEventListener('change', function() {
            const selectedFilter = this.value;
            const announcementItems = document.querySelectorAll('.announcement-item');
            
            announcementItems.forEach(item => {
                if (selectedFilter === 'all') {
                    item.style.display = 'block';
                } else {
                    if (item.classList.contains(selectedFilter)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    }

    // Announcement item click handlers
    const announcementItems = document.querySelectorAll('.announcement-item');
    announcementItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.announcement-title').textContent;
            const content = this.querySelector('.announcement-content-text').textContent;
            alert(`${title}\n\n${content}`);
            // Add modal or detailed view functionality here
        });
    });

    // Event item click handlers
    const eventItems = document.querySelectorAll('.event-item');
    eventItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.event-title').textContent;
            const details = this.querySelector('.event-details').textContent;
            const location = this.querySelector('.event-location').textContent;
            alert(`${title}\n${details}\n${location}`);
            // Add event details functionality here
        });
    });

    // Birthday item click handlers
    const birthdayItems = document.querySelectorAll('.birthday-item');
    birthdayItems.forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('.birthday-name').textContent;
            const position = this.querySelector('.birthday-position').textContent;
            const date = this.querySelector('.birthday-date').textContent;
            alert(`${name}\n${position}\nBirthday: ${date}`);
            // Add birthday greeting functionality here
        });
    });
});
