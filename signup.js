document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    // This should be the base URL of your deployed backend.
    const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com";
    // For local testing, you would use:
    // const BACKEND_URL = "http://127.0.0.1:5000";

    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            // Prevent the default form submission which reloads the page
            event.preventDefault();

            const email = signupForm.querySelector('#email').value;
            const password = signupForm.querySelector('#password').value;

            // Clear any previous messages
            if (messageDiv) {
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }

            try {
                // Send the signup request to the backend
                const response = await fetch(`${BACKEND_URL}/api/signup`, {
                    method: 'POST',
                    // This is crucial for sending cookies across domains,
                    // though not strictly required for signup, it's good practice to include
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (messageDiv) {
                    messageDiv.textContent = result.message;
                    messageDiv.style.display = 'block';
                }

                if (response.ok) {
                    // On successful signup, show success message
                    if (messageDiv) messageDiv.className = 'message success';
                    signupForm.reset();
                    // Optionally, you could redirect to the login page after a delay
                    // setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                } else {
                    // On failed signup (e.g., user exists), show error message
                    if (messageDiv) messageDiv.className = 'message error';
                }

            } catch (error) {
                // This catches network errors (e.g., backend is down)
                console.error('Signup request error:', error);
                if (messageDiv) {
                    messageDiv.textContent = 'A network error occurred. Please try again.';
                    messageDiv.className = 'message error';
                    messageDiv.style.display = 'block';
                }
            }
        });
    }
});
