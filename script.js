document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: Replace this with your deployed backend URL when you go live
    const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com";
    // For local testing, use: const BACKEND_URL = "http://127.0.0.1:5000";

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');

    // Reusable function for login/signup form submissions
    const handleAuthFormSubmit = async (form, endpoint) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            if (messageDiv) messageDiv.style.display = 'none';

            try {
                const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();
                if (messageDiv) {
                    messageDiv.textContent = result.message;
                    messageDiv.style.display = 'block';
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
                console.error('Auth form error:', error);
                if (messageDiv) {
                    messageDiv.textContent = 'A network error occurred.';
                    messageDiv.className = 'message error';
                    messageDiv.style.display = 'block';
                }
            }
        });
    };

    if (loginForm) {
        handleAuthFormSubmit(loginForm, '/api/login');
    }
    if (signupForm) {
        handleAuthFormSubmit(signupForm, '/api/signup');
    }

    // Ping Utility Logic
    const pingForm = document.getElementById('ping-form');
    if (pingForm) {
        pingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const pingHostInput = document.getElementById('ping-host');

            const pingResultsDiv = document.getElementById('ping-results');
            const host = pingHostInput.value.trim();
            if (!host) {
                pingResultsDiv.textContent = 'Please enter a host.';
                return;
            }
            pingResultsDiv.textContent = `Pinging ${host}...`;

            try {
                const response = await fetch(`${BACKEND_URL}/api/ping`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host }),
                });

                const result = await response.json();
                if (response.ok) {
                    pingResultsDiv.textContent = `Host: ${result.host}\nStatus: ${result.status}\n\n${result.output}`;
                } else {
                    pingResultsDiv.textContent = `Error: ${result.message || result.error}`;
                }
            } catch (error) {
                console.error('Ping error:', error);
                pingResultsDiv.textContent = 'A network error occurred.';
            }
        });
    }

    // Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await fetch(`${BACKEND_URL}/api/logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
            } finally {
                window.location.href = 'login.html';
            }
        });
    }

    // Dashboard Protection
    // This self-executing async function checks the user's session when on the dashboard page.
    if (document.body.id === 'dashboard-page') {
        (async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/check_session`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    window.location.href = 'login.html'; // Redirect if not logged in
                }
            } catch (error) {
                console.error('Session check failed:', error);
                window.location.href = 'login.html'; // Redirect on network error
            }
        })();
    }
});
