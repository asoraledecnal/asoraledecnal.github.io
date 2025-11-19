document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com";
    // For local testing: const BACKEND_URL = "http://127.0.0.1:5000";

    // --- Dashboard Protection ---
    (async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) { window.location.href = 'login.html'; }
        } catch (error) {
            console.error('Session check network error:', error);
            window.location.href = 'login.html';
        }
    })();

    // --- Tabbed Interface Logic ---
    const tabs = document.querySelector('.tabs');
    if (tabs) {
        tabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-link')) {
                document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.tab).classList.add('active');
            }
        });
    }

    // --- Ping Utility Logic ---
    const pingForm = document.getElementById('ping-form');
    if (pingForm) {
        pingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const hostInput = document.getElementById('ping-host');
            const summaryDiv = document.getElementById('ping-results-summary');
            const details = document.getElementById('ping-details');
            const rawResultsPre = document.getElementById('ping-results-raw');
            
            const host = hostInput.value.trim();
            summaryDiv.style.display = 'block';
            details.style.display = 'none';

            if (!host) {
                summaryDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span> Please enter a host.`;
                return;
            }
            summaryDiv.innerHTML = `<span class="status"><span class="status-dot"></span></span> Pinging ${host}...`;

            try {
                const response = await fetch(`${BACKEND_URL}/api/ping`, {
                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host }),
                });
                const result = await response.json();
                
                if (response.ok) {
                    if (result.status === 'online') {
                        summaryDiv.innerHTML = `<span class="status"><span class="status-dot status-online"></span></span><strong>Status:</strong> Online<br>
                                                <strong>Host:</strong> ${result.host}<br>
                                                <strong>Response Time:</strong> ${result.time || 'N/A'}`;
                    } else {
                        summaryDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span><strong>Status:</strong> Offline<br>
                                                <strong>Host:</strong> ${result.host}`;
                    }
                    rawResultsPre.textContent = result.raw_output;
                    details.style.display = 'block';
                } else {
                    summaryDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span> Error: ${result.message || result.error}`;
                }
            } catch (error) {
                console.error('Ping error:', error);
                summaryDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span> A network error occurred.`;
            }
        });
    }

    // --- Port Scan Utility Logic ---
    const portScanForm = document.getElementById('port-scan-form');
    if (portScanForm) {
        portScanForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const hostInput = document.getElementById('scan-host');
            const portInput = document.getElementById('scan-port');
            const resultsDiv = document.getElementById('port-scan-results');
            
            const host = hostInput.value.trim();
            const port = portInput.value.trim();
            resultsDiv.style.display = 'block';

            if (!host || !port) {
                resultsDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span> Please enter both a host and a port.`;
                return;
            }
            resultsDiv.innerHTML = `<span class="status"><span class="status-dot"></span></span> Scanning port ${port} on ${host}...`;

            try {
                const response = await fetch(`${BACKEND_URL}/api/port_scan`, {
                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host, port }),
                });
                const result = await response.json();

                if (response.ok) {
                    const statusClass = result.status === 'open' ? 'status-online' : 'status-offline';
                    resultsDiv.innerHTML = `<span class="status"><span class="status-dot ${statusClass}"></span></span><strong>Status:</strong> ${result.status.toUpperCase()}<br>
                                            <strong>Host:</strong> ${result.host}<br>
                                            <strong>Port:</strong> ${result.port}`;
                } else {
                    resultsDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span> Error: ${result.error}`;
                }
            } catch (error) {
                console.error('Port scan error:', error);
                resultsDiv.innerHTML = `<span class="status"><span class="status-dot status-offline"></span></span> A network error occurred.`;
            }
        });
    }

    // --- Traceroute Utility Logic ---
    const tracerouteForm = document.getElementById('traceroute-form');
    if (tracerouteForm) {
        tracerouteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const hostInput = document.getElementById('trace-host');
            const resultsDiv = document.getElementById('traceroute-results');
            const host = hostInput.value.trim();

            if (!host) {
                resultsDiv.textContent = 'Please enter a host to trace.';
                return;
            }
            resultsDiv.textContent = `Running traceroute to ${host}... (This may take up to 30 seconds)`;

            try {
                const response = await fetch(`${BACKEND_URL}/api/traceroute`, {
                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host }),
                });
                const result = await response.json();
                
                if (response.ok) {
                    resultsDiv.textContent = result.output;
                } else {
                    resultsDiv.textContent = `Error: ${result.error || result.output}`;
                }
            } catch (error) {
                console.error('Traceroute error:', error);
                resultsDiv.textContent = 'A network error occurred.';
            }
        });
    }

    // --- Logout Logic ---
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
});
