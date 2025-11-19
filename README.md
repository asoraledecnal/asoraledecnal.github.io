# Project Vantage: A Web-Based Network Monitoring Dashboard

## Project Overview

Project Vantage is a web application designed to provide a user-friendly dashboard for monitoring network hosts. It features a secure user authentication system and a modular, extensible architecture for adding new monitoring tools. The frontend is built with standard HTML, CSS, and JavaScript, while the backend is powered by a Python Flask server with a persistent SQLite database for user data.

## Features

### Frontend
*   **Homepage:** A modern, responsive landing page providing an overview of the project.
*   **User Authentication Pages:** Dedicated and styled pages for user registration (`signup.html`) and login (`login.html`).
*   **Interactive Forms:** Client-side JavaScript handles form submissions asynchronously, providing real-time feedback without page reloads.
*   **Dashboard:** A secure page accessible only after login, designed to host monitoring widgets.
*   **Ping Utility:** The first monitoring widget, allowing users to ping a specified host and view live status and output.
*   **Logout Functionality:** A logout button on the dashboard to end the user session.

### Backend
*   **RESTful API:** A set of API endpoints to handle user authentication and monitoring tasks.
    *   `POST /api/signup`: Handles new user registration with password hashing.
    *   `POST /api/login`: Authenticates users against the database.
    *   `POST /api/ping`: Executes a system-level ping command to a target host and returns the result.
*   **Persistent Database:** Utilizes an SQLite database via the Flask-SQLAlchemy extension to permanently store user credentials.
*   **Password Security:** Passwords are never stored in plain text. They are securely hashed using `werkzeug.security`.
*   **CORS Configuration:** Enabled to allow cross-origin requests from the frontend to the backend server.
*   **Production-Ready Setup:** Includes `gunicorn` in its dependencies, a production-grade WSGI server suitable for deployment.

---

## Technical Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Backend:** Python 3, Flask
*   **Database:** SQLite
*   **Libraries/Extensions:** Flask-Cors, Flask-SQLAlchemy, Werkzeug, Gunicorn

---

## Project Setup and Installation

### Prerequisites
*   Python 3.8+
*   `pip` (Python package installer)

### Installation Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/asoraledecnal/asoraledecnal.github.io.git
    cd asoraledecnal.github.io 
    ```
    *(Note: It is recommended to use a dedicated repository for this project rather than a GitHub Pages user repository, but these instructions will work within the current structure.)*

2.  **Create and Activate a Virtual Environment:**
    It is highly recommended to use a virtual environment to manage project dependencies.
    
    *   **Windows (PowerShell):**
        ```powershell
        # Create the environment
        python -m venv .venv
        # Activate the environment
        .\.venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux (Bash):**
        ```bash
        # Create the environment
        python3 -m venv .venv
        # Activate the environment
        source .venv/bin/activate
        ```

3.  **Install Dependencies:**
    Install all required Python packages from the `requirements.txt` file.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Initialize the Database:**
    Before running the server for the first time, create the database schema.
    
    *   **Windows (PowerShell):**
        ```powershell
        # In a terminal with the virtual environment activated:
        flask shell

        # In the Python shell (>>>), run:
        from app import db
        db.create_all()
        exit()
        ```
    *   **macOS / Linux (Bash):**
        ```bash
        # In a terminal with the virtual environment activated:
        flask shell

        # In the Python shell (>>>), run:
        from app import db
        db.create_all()
        exit()
        ```
    This will create a `database.db` file in the project's root directory.

5.  **Run the Backend Development Server:**
    Start the Flask application.
    ```bash
    flask run --debug
    ```
    The backend will be running on `http://127.0.0.1:5000`. Keep this terminal open.

6.  **Launch the Frontend:**
    Open the `index.html` file in a web browser to view and interact with the application.

---

## Deployment Strategy

This application consists of a separate frontend and backend, which should be deployed independently.

### Backend Deployment (e.g., on Render)
1.  Ensure all code, including `app.py` and `requirements.txt`, is pushed to a GitHub repository.
2.  Create a new "Web Service" on a platform like Render and connect it to the repository.
3.  Use the following configuration settings during setup:
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `gunicorn app:app`
4.  After deployment, Render will provide a public URL for the backend API.

### Frontend Deployment (e.g., on GitHub Pages)
1.  The static files (`.html`, `.css`, `.js`, images) can be served by any static hosting provider.
2.  If using GitHub Pages, these files simply need to be present in the root of the `asoraledecnal.github.io` repository.
3.  **Crucially**, before deploying the final frontend, the `fetch` URLs in `script.js` must be updated from the local `http://127.0.0.1:5000` to the public backend URL provided by the hosting service (e.g., `https://project-vantage.onrender.com`).
