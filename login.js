document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    // This should be the base URL of your deployed backend.
    const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com";
    // For local testing, you would use:
    // const BACKEND_URL = "http://127.0.0.1:5000";

    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // Prevent the default form submission which reloads the page
            event.preventDefault();

            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            // Clear any previous messages
            if (messageDiv) {
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }

            try {
                // Send the login request to the backend
                const response = await fetch(`${BACKEND_URL}/api/login`, {
                    method: 'POST',
                    // This is crucial for sending the session cookie across domains
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
                    // On successful login, show success message and redirect to dashboard
                    if (messageDiv) messageDiv.className = 'message success';
                    window.location.href = 'dashboard.html';
                } else {
                    // On failed login, show error message
                    if (messageDiv) messageDiv.className = 'message error';
                }

            } catch (error) {
                // This catches network errors (e.g., backend is down)
                console.error('Login request error:', error);
                if (messageDiv) {
                    messageDiv.textContent = 'A network error occurred. Please try again.';
                    messageDiv.className = 'message error';
                    messageDiv.style.display = 'block';
                }
            }
        });
    }
});
