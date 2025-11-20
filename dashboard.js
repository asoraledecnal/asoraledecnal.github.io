document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const checkAuth = async () => {
    try {
      const response = await fetch("https://project-vantage-backend-ih0i.onrender.com/api/check-auth", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        window.location.href = "login.html"
      }
    } catch (error) {
      console.error("Auth check error:", error)
      window.location.href = "login.html"
    }
  }

  // --- Configuration ---
  const BACKEND_URL = "https://project-vantage-backend-ih0i.onrender.com"

  // Function to fetch and display Hero Metrics
  const fetchAndDisplayHeroMetrics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/summary`, {
        method: "GET",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const heroMetrics = data.hero_metrics
      if (heroMetrics) {
        document.querySelector(".metric-card:nth-child(1) .metric-value").textContent = heroMetrics.median_latency || "N/A"
        document.querySelector(".metric-card:nth-child(1) .metric-trend").textContent = heroMetrics.latency_trend || ""
        document.querySelector(".metric-card:nth-child(2) .metric-value").textContent = heroMetrics.active_services || "N/A"
        document.querySelector(".metric-card:nth-child(2) .metric-trend").textContent = `${heroMetrics.monitored_nodes} monitored edge nodes` || ""
        document.querySelector(".metric-card:nth-child(3) .metric-value").textContent = heroMetrics.route_integrity || "N/A"
        document.querySelector(".metric-card:nth-child(3) .metric-trend").textContent = heroMetrics.stability_trend || ""
      }
    } catch (error) {
      console.error("Error fetching hero metrics:", error)
    }
  }

  // Function to fetch and display Overview Grid
  const fetchAndDisplayOverviewGrid = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/summary`, {
        method: "GET",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const overviewGrid = data.overview_grid
      if (overviewGrid) {
        // Signal Quality
        document.querySelector(".overview-card:nth-child(1) h3").textContent = overviewGrid.signal_quality.regions || ""
        document.querySelector(".overview-card:nth-child(1) .pill").textContent = overviewGrid.signal_quality.status || ""
        document.querySelector(".overview-card:nth-child(1) p:not(.pill)").textContent = overviewGrid.signal_quality.details || ""
        // Incidents
        document.querySelector(".overview-card:nth-child(2) h3").textContent = overviewGrid.incidents.count || ""
        document.querySelector(".overview-card:nth-child(2) .pill").textContent = overviewGrid.incidents.status || ""
        const incidentsUl = document.querySelector(".overview-card:nth-child(2) ul")
        if (incidentsUl) {
          incidentsUl.innerHTML = overviewGrid.incidents.list.map(item => `<li>${item}</li>`).join("")
        }
        // Automation
        document.querySelector(".overview-card:nth-child(3) h3").textContent = overviewGrid.automation.resolves || ""
        document.querySelector(".overview-card:nth-child(3) p:not(.pill)").textContent = overviewGrid.automation.details || ""
        // Next Checks
        document.querySelector(".overview-card:nth-child(4) h3").textContent = overviewGrid.next_checks.count || ""
        document.querySelector(".overview-card:nth-child(4) p:not(.pill)").textContent = overviewGrid.next_checks.details || ""
      }
    } catch (error) {
      console.error("Error fetching overview grid data:", error)
    }
  }

  // Function to fetch and display Incident Timeline
  const fetchAndDisplayIncidentTimeline = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/timeline`, {
        method: "GET",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const timelineUl = document.querySelector(".intel-card:nth-child(1) .timeline")
      if (timelineUl) {
        timelineUl.innerHTML = data.timeline.map(item => `
          <li>
            <span>${item.time}</span>
            <div>
              <strong>${item.strong}</strong>
              <p>${item.p}</p>
            </div>
          </li>`).join("")
      }
    } catch (error) {
      console.error("Error fetching incident timeline:", error)
    }
  }

  // Function to fetch and display Signal Watchlist
  const fetchAndDisplaySignalWatchlist = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/watchlist`, {
        method: "GET",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const watchlistUl = document.querySelector(".intel-card:nth-child(2) .watchlist")
      if (watchlistUl) {
        watchlistUl.innerHTML = data.watchlist.map(item => `
          <li>
            <div>
              <p>${item.item}</p>
              <span>${item.metric}</span>
            </div>
            <span class="pill ${item.status_pill}">${item.value}</span>
          </li>`).join("")
      }
    } catch (error) {
      console.error("Error fetching signal watchlist:", error)
    }
  }

  // Main function to load all dashboard dynamic data
  const loadDashboardData = () => {
    fetchAndDisplayHeroMetrics()
    fetchAndDisplayOverviewGrid()
    fetchAndDisplayIncidentTimeline()
    fetchAndDisplaySignalWatchlist()
  }

  checkAuth().then(() => {
    // Only load dashboard data if authentication is successful
    loadDashboardData()
  })

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      try {
        await fetch("https://project-vantage-backend-ih0i.onrender.com/api/logout", {
          method: "POST",
          credentials: "include",
        })
      } catch (error) {
        console.error("Logout error:", error)
      }
      window.location.href = "login.html"
    })
  }

  // Sidebar switching
  const sidebarLinks = document.querySelectorAll(".sidebar-link")
  const toolSections = document.querySelectorAll(".tool-section")

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Remove active class from all sidebar links and tool sections
      sidebarLinks.forEach((sidebarLink) => sidebarLink.classList.remove("active"))
      toolSections.forEach((section) => section.classList.remove("active"))

      // Add active class to clicked sidebar link and corresponding tool section
      link.classList.add("active")
      const toolId = link.getAttribute("data-tool")
      document.getElementById(toolId).classList.add("active")
    })
  })

  // Ping functionality
  const pingForm = document.getElementById("ping-form")
  if (pingForm) {
    pingForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const host = document.getElementById("ping-host").value

      try {
        const response = await fetch("https://project-vantage-backend-ih0i.onrender.com/api/ping", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ host }),
        })

        const result = await response.json()

        if (response.ok) {
          displayPingResults(result)
        } else {
          displayError("Ping failed", result.message)
        }
      } catch (error) {
        console.error("Ping error:", error)
        displayError("Ping Error", "A network error occurred")
      }
    })
  }

  // Port scan functionality
  const portScanForm = document.getElementById("port-scan-form")
  if (portScanForm) {
    portScanForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const host = document.getElementById("scan-host").value
      const port = document.getElementById("scan-port").value

      try {
        const response = await fetch("https://project-vantage-backend-ih0i.onrender.com/api/port-scan", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ host, port }),
        })

        const result = await response.json()

        if (response.ok) {
          displayPortScanResults(result)
        } else {
          displayError("Port Scan failed", result.message)
        }
      } catch (error) {
        console.error("Port scan error:", error)
        displayError("Port Scan Error", "A network error occurred")
      }
    })
  }

  // Traceroute functionality
  const tracerouteForm = document.getElementById("traceroute-form")
  if (tracerouteForm) {
    tracerouteForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const host = document.getElementById("trace-host").value

      try {
        const response = await fetch("https://project-vantage-backend-ih0i.onrender.com/api/traceroute", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ host }),
        })

        const result = await response.json()

        if (response.ok) {
          displayTracerouteResults(result)
        } else {
          displayError("Traceroute failed", result.message)
        }
      } catch (error) {
        console.error("Traceroute error:", error)
        displayError("Traceroute Error", "A network error occurred")
      }
    })
  }

  // Display ping results
  function displayPingResults(data) {
    const summary = document.getElementById("ping-results-summary")
    const raw = document.getElementById("ping-results-raw")
    const details = document.getElementById("ping-details")

    if (data.success) {
      summary.innerHTML = `
        <div class="status">
          <span class="status-dot status-online"></span>
          <strong>Host is reachable</strong>
        </div>
        <div>Minimum: ${data.min}ms | Average: ${data.avg}ms | Maximum: ${data.max}ms</div>
      `
    } else {
      summary.innerHTML = `
        <div class="status">
          <span class="status-dot status-offline"></span>
          <strong>Host is unreachable</strong>
        </div>
      `
    }

    raw.textContent = data.raw || "No output"
    summary.style.display = "block"
    details.style.display = "block"
  }

  // Display port scan results
  function displayPortScanResults(data) {
    const results = document.getElementById("port-scan-results")

    let html = `
      <div class="status">
        <span class="status-dot ${data.open ? "status-open" : "status-closed"}"></span>
        <strong>Port ${data.port} is ${data.open ? "OPEN" : "CLOSED"}</strong>
      </div>
    `

    if (data.service) {
      html += `<div>Service: ${data.service}</div>`
    }

    results.innerHTML = html
    results.style.display = "block"
  }

  // Display traceroute results
  function displayTracerouteResults(data) {
    const results = document.getElementById("traceroute-results")
    results.textContent = data.raw || "No output"
  }

  // Display error
  function displayError(title, message) {
    alert(`${title}: ${message}`)
  }
})
