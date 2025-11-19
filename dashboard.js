document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    // This should be the base URL of your deployed backend.
    const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com";
    // For local testing, you would use:
    // const BACKEND_URL = "http://127.0.0.1:5000";

    // --- Dashboard Protection ---
    // Immediately check for a valid session upon loading the dashboard script.
    // This self-executing async function is the "gatekeeper" for the page.
    (async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, {
                method: 'GET',
                // This is crucial for sending the session cookie
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            // If the response is not OK (e.g., 401 Unauthorized),
            // the user is not logged in, so redirect them.
            if (!response.ok) {
                window.location.href = 'login.html';
            }
            // If the response is OK, do nothing. The user is allowed to be here.

        } catch (error) {
            // This catches network errors (e.g., backend is down).
            // If we can't verify the session, we must assume the user is not logged in.
            console.error('Session check network error:', error);
            window.location.href = 'login.html';
        }
    })();


    // --- Ping Utility Logic ---
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
                    // This is crucial for sending the session cookie
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ host }),
                });

                const result = await response.json();
                if (response.ok) {
                    pingResultsDiv.textContent = `Host: ${result.host}\nStatus: ${result.status}\n\n${result.output}`;
                } else {
                    // This handles backend errors, including the "Unauthorized" error
                    // if the session is somehow lost between page load and this action.
                    pingResultsDiv.textContent = `Error: ${result.message || result.error}`;
                }
            } catch (error) {
                console.error('Ping error:', error);
                pingResultsDiv.textContent = 'A network error occurred.';
            }
        });
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                // Inform the backend to clear the session
                await fetch(`${BACKEND_URL}/api/logout`, {
                    method: 'POST',
                    // This is crucial for sending the session cookie
                    credentials: 'include',
                });
            } finally {
                // Always redirect to login page after attempting to log out
                window.location.href = 'login.html';
            }
        });
    }
});
