document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-container form');
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: this.querySelector('.name').value,
            email: this.querySelector('.email').value,
            message: this.querySelector('.message').value
        };

        try {
            const response = await fetch('../handlers/contact_tickets_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Thank you! Your message has been sent successfully.');
                this.reset();
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}); 