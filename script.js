document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');

    // Reusable function to handle form submissions for login and signup
    const handleFormSubmit = async (form, endpoint) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;

            if (messageDiv) {
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }

            try {
                const response = await fetch(`https://project-vantage-backend-ih0i.onrender.com${endpoint}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();
                
                if (messageDiv) {
                    messageDiv.style.display = 'block';
                    messageDiv.textContent = result.message;
                }

                if (response.ok) {
                    if (messageDiv) messageDiv.className = 'message success';
                    if (endpoint === '/api/login') {
                        window.location.href = 'dashboard.html';
                    }
                    form.reset();
                } else {
                    if (messageDiv) messageDiv.className = 'message error';
                }
            } catch (error) {
                console.error('Error:', error);
                if (messageDiv) {
                    messageDiv.style.display = 'block';
                    messageDiv.textContent = 'An unexpected network error occurred.';
                    messageDiv.className = 'message error';
                }
            }
        });
    };

    // Attach listeners to forms if they exist on the current page
    if (loginForm) {
        handleFormSubmit(loginForm, '/api/login');
    }

    if (signupForm) {
        handleFormSubmit(signupForm, '/api/signup');
    }

    // --- Ping Utility Logic ---
    const pingForm = document.getElementById('ping-form');
    if (pingForm) {
        pingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const pingHostInput = document.getElementById('ping-host');
            const pingResultsDiv = document.getElementById('ping-results');
            const host = pingHostInput.value.trim();

            if (!host) {
                pingResultsDiv.textContent = 'Please enter a host to ping.';
                return;
            }

            pingResultsDiv.textContent = 'Pinging...';

            try {
                const response = await fetch('https://project-vantage-backend-ih0i.onrender.com/api/ping', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ host }),
                });

                const result = await response.json();

                if (response.ok) {
                    pingResultsDiv.textContent = `Host: ${result.host}\nStatus: ${result.status}\nOutput:\n${result.output}`;
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
                await fetch('https://project-vantage-backend-ih0i.onrender.com/api/logout', {
                    method: 'POST',
                    credentials: 'include',
                });
            } catch (error) {
                console.error('Logout request failed, redirecting anyway.', error);
            } finally {
                window.location.href = 'login.html';
            }
        });
    }

    // --- Dashboard Protection ---
    // This self-executing async function checks the user's session when on the dashboard page.
    if (window.location.pathname.endsWith('dashboard.html')) {
        (async () => {
            try {
                const response = await fetch('https://project-vantage-backend-ih0i.onrender.com/api/check_session', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Session check failed, redirecting to login.', error);
                window.location.href = 'login.html';
            }
        })();
    }

});