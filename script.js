document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');

    // Function to handle form submission (for login/signup)
    const handleFormSubmit = async (form, endpoint) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent page reload

            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;

            // Clear previous messages and hide the div
            messageDiv.textContent = '';
            messageDiv.style.display = 'none';

            try {
                const response = await fetch(`https://project-vantage-backend-ih0i.onrender.com${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();
                messageDiv.style.display = 'block'; // Show the message div

                            if (response.ok) {
                                messageDiv.textContent = result.message;
                                messageDiv.className = 'message success';
                                if (endpoint === '/api/login') {
                                    window.location.href = 'dashboard.html'; // Redirect to a dashboard page
                                }
                                form.reset(); // Clear the form fields after successful submission
                            } else {                    messageDiv.textContent = result.message;
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                console.error('Error:', error);
                messageDiv.style.display = 'block';
                messageDiv.textContent = 'An unexpected network error occurred.';
                messageDiv.className = 'message error';
            }
        });
    };

    // Attach the event listener to the correct form based on the page
    if (loginForm) {
        handleFormSubmit(loginForm, '/api/login');
    }

    if (signupForm) {
        handleFormSubmit(signupForm, '/api/signup');
    }

    // --- Ping Utility Logic ---
    const pingForm = document.getElementById('ping-form');
    const pingHostInput = document.getElementById('ping-host');
    const pingResultsDiv = document.getElementById('ping-results');

    if (pingForm) {
        pingForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent page reload

            const host = pingHostInput.value.trim();
            if (!host) {
                pingResultsDiv.textContent = 'Please enter a host to ping.';
                return;
            }

            pingResultsDiv.textContent = 'Pinging...';

            try {
                const response = await fetch('https://project-vantage-backend-ih0i.onrender.com/api/ping', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ host }),
                });

                const result = await response.json();

                if (response.ok) {
                    pingResultsDiv.textContent = `Host: ${result.host}\nStatus: ${result.status}\nOutput:\n${result.output}`;
                    // Add styling based on status if needed
                    // if (result.status === 'online') { ... }
                } else {
                    pingResultsDiv.textContent = `Error: ${result.error || 'Unknown error'}`;
                }
            } catch (error) {
                console.error('Ping request failed:', error);
                pingResultsDiv.textContent = 'An error occurred while trying to ping.';
            }
        });
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('https://project-vantage-backend-ih0i.onrender.com/api/logout', {
                    method: 'POST',
                });
                if (response.ok) {
                    window.location.href = 'login.html'; // Redirect only after successful logout
                } else {
                    console.error('Logout failed on server');
                    // Optionally display an error message to the user
                }
            } catch (error) {
                console.error('Network error during logout:', error);
                // Optionally display a network error message
            }
        });
    }

    // --- Dashboard Protection ---
    // Check if we are on the dashboard page
    if (window.location.pathname.endsWith('dashboard.html')) {
        (async () => {
            try {
                const response = await fetch('https://project-vantage-backend-ih0i.onrender.com/api/check_session', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // If the response is not OK (e.g., 401 Unauthorized), redirect to login
                    window.location.href = 'login.html';
                }
                // If response is OK, do nothing and let the user stay on the dashboard.
            } catch (error) {
                console.error('Session check failed:', error);
                // If the request fails for any reason (e.g., network error), redirect to login
                window.location.href = 'login.html';
            }
        })();
    }

});
