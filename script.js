document.addEventListener('DOMContentLoaded', () => {
    // Backend URL
    const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com";

    // Forms and message containers
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginMessageDiv = loginForm ? loginForm.querySelector('.message') : null;
    const signupMessageDiv = signupForm ? signupForm.querySelector('.message') : null;

    // Utility: Show message in a div
    const showMessage = (div, message, type = 'info') => {
        if (!div) return;
        div.textContent = message;
        div.className = `message ${type}`;
        div.style.display = 'block';
    };

    // Utility: Hide message
    const hideMessage = (div) => {
        if (!div) return;
        div.style.display = 'none';
    };

    // Handle login/signup form submission
    const setupAuthForm = (form, endpoint, messageDiv, onSuccessRedirect) => {
        if (!form) return;
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(messageDiv);

            const emailInput = form.querySelector('input[name="email"]');
            const passwordInput = form.querySelector('input[name="password"]');

            const email = emailInput?.value.trim();
            const password = passwordInput?.value.trim();

            if (!email || !password) {
                showMessage(messageDiv, 'Email and password are required.', 'error');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage(messageDiv, result.message || 'Success!', 'success');
                    form.reset();
                    if (onSuccessRedirect) window.location.href = onSuccessRedirect;
                } else {
                    showMessage(messageDiv, result.message || 'Authentication failed.', 'error');
                }
            } catch (error) {
                console.error(`${endpoint} error:`, error);
                showMessage(messageDiv, 'A network error occurred.', 'error');
            }
        });
    };

    setupAuthForm(loginForm, '/api/login', loginMessageDiv, 'dashboard.html');
    setupAuthForm(signupForm, '/api/signup', signupMessageDiv);

    // Ping Utility
    const pingForm = document.getElementById('ping-form');
    if (pingForm) {
        const pingHostInput = pingForm.querySelector('input[name="host"]');
        const pingResultsDiv = pingForm.querySelector('#ping-results');

        pingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!pingHostInput || !pingResultsDiv) return;

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
                    // Use <pre> formatting for multi-line output
                    pingResultsDiv.innerHTML = `<pre>Host: ${result.host}\nStatus: ${result.status}\n\n${result.output}</pre>`;
                } else {
                    pingResultsDiv.textContent = `Error: ${result.message || result.error || 'Unknown error'}`;
                }
            } catch (error) {
                console.error('Ping error:', error);
                pingResultsDiv.textContent = 'A network error occurred.';
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch(`${BACKEND_URL}/api/logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!response.ok) console.warn('Logout may have failed.');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                window.location.href = 'login.html';
            }
        });
    }

    // Dashboard session check
    if (document.body.id === 'dashboard-page') {
        (async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/check_session`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    window.location.href = 'login.html';
                    return;
                }

                const result = await response.json();
                if (!result.active) {
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Session check failed:', error);
                window.location.href = 'login.html';
            }
        })();
    }
});
