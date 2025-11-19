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
                messageDiv.style.display = 'block';

                            if (response.ok) {
                                messageDiv.textContent = result.message;
                                messageDiv.className = 'message success';
                                if (endpoint === '/api/login') {
                                    window.location.href = 'dashboard.html';
                                }
                                form.reset();
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

    if (loginForm) {
        handleFormSubmit(loginForm, '/api/login');
    }

    if (signupForm) {
        handleFormSubmit(signupForm, '/api/signup');
    }

    const pingForm = document.getElementById('ping-form');
    const pingHostInput = document.getElementById('ping-host');
    const pingResultsDiv = document.getElementById('ping-results');

    if (pingForm) {
        pingForm.addEventListener('submit', async (event) => {
            event.preventDefault();

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

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch('https://project-vantage-backend-ih0i.onrender.com/api/logout', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (response.ok) {
                    window.location.href = 'login.html';
                } else {
                    console.error('Logout failed on server');
                }
            } catch (error) {
                console.error('Network error during logout:', error);
            }
        });
    }

    // Check if we are on the dashboard page
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
                console.error('Session check failed:', error);
                window.location.href = 'login.html';
            }
        })();
    }

});
