document.addEventListener('DOMContentLoaded', function() {
    const announcementFilter = document.getElementById('announcementFilter');
    if (announcementFilter) {
        announcementFilter.addEventListener('change', function() {
            const selectedFilter = this.value;
            const announcementItems = document.querySelectorAll('.announcement-item');
            
            announcementItems.forEach(item => {
                const shouldShow = selectedFilter === 'all' || item.classList.contains(selectedFilter);
                item.style.display = shouldShow ? 'block' : 'none';
            });
        });
    }

    const announcementItems = document.querySelectorAll('.announcement-item');
    announcementItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.announcement-title').textContent;
            const content = this.querySelector('.announcement-content-text').textContent;
            alert(`${title}\n\n${content}`);
        });
    });

    const eventItems = document.querySelectorAll('.event-item');
    eventItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.event-title').textContent;
            const details = this.querySelector('.event-details').textContent;
            const location = this.querySelector('.event-location').textContent;
            alert(`${title}\n${details}\n${location}`);
        });
    });

    const birthdayItems = document.querySelectorAll('.birthday-item');
    birthdayItems.forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('.birthday-name').textContent;
            const position = this.querySelector('.birthday-position').textContent;
            const date = this.querySelector('.birthday-date').textContent;
            alert(`${name}\n${position}\nBirthday: ${date}`);
        });
    });
});
