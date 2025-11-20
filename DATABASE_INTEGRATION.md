# PostgreSQL Database Integration for Project Vantage

This document details the transition from SQLite to PostgreSQL for the backend database of Project Vantage, hosted on Render.com. It covers the new database schema, updated authentication flow, and how diagnostic results are now persistently stored.

## 1. Database Migration Overview

The project's backend (`app.py`) has been refactored to use a PostgreSQL database instead of the previous SQLite setup. This change enables a robust, scalable, and production-ready database solution for the deployed application on Render.com.

## 2. PostgreSQL Database Schema

All data is now stored across five interconnected tables:

### `users` Table
Stores user authentication and profile information.

- `id`: `SERIAL PRIMARY KEY` (Unique user identifier)
- `username`: `VARCHAR(255) UNIQUE NOT NULL` (User's chosen username)
- `email`: `VARCHAR(255) UNIQUE NOT NULL` (User's email address, used for login)
- `password_hash`: `VARCHAR(255) NOT NULL` (Hashed password for security)
- `registration_date`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` (Timestamp of user registration)
- `last_login`: `TIMESTAMP WITH TIME ZONE` (Nullable, last login timestamp)

### `user_settings` Table
Stores user-specific configuration preferences.

- `id`: `SERIAL PRIMARY KEY`
- `user_id`: `INT NOT NULL REFERENCES users(id)` (Foreign Key to `users` table)
- `setting_key`: `VARCHAR(255) NOT NULL` (Name of the setting)
- `setting_value`: `TEXT` (Nullable, value of the setting)
- `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
- `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `ping_results` Table
Stores historical data from network ping diagnostics.

- `id`: `SERIAL PRIMARY KEY`
- `user_id`: `INT NOT NULL REFERENCES users(id)` (User who performed the ping)
- `host`: `VARCHAR(255) NOT NULL` (Target host/IP pinged)
- `min_latency_ms`: `NUMERIC(10, 3)` (Nullable, minimum latency in milliseconds)
- `avg_latency_ms`: `NUMERIC(10, 3)` (Nullable, average latency in milliseconds)
- `max_latency_ms`: `NUMERIC(10, 3)` (Nullable, maximum latency in milliseconds)
- `packet_loss_percent`: `NUMERIC(5, 2)` (Nullable, percentage of packet loss)
- `raw_output`: `TEXT` (Nullable, full raw output from the ping command)
- `timestamp`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` (When the ping was performed)
- `success`: `BOOLEAN NOT NULL` (Whether the ping was successful)

### `port_scan_results` Table
Stores historical data from port scanning diagnostics.

- `id`: `SERIAL PRIMARY KEY`
- `user_id`: `INT NOT NULL REFERENCES users(id)`
- `host`: `VARCHAR(255) NOT NULL`
- `port`: `INT NOT NULL` (The port scanned)
- `is_open`: `BOOLEAN NOT NULL` (Whether the port was open)
- `service_name`: `VARCHAR(255)` (Nullable, detected service like 'http')
- `raw_output`: `TEXT` (Nullable, raw output from the port scan)
- `timestamp`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `traceroute_results` Table
Stores historical data from traceroute diagnostics.

- `id`: `SERIAL PRIMARY KEY`
- `user_id`: `INT NOT NULL REFERENCES users(id)`
- `host`: `VARCHAR(255) NOT NULL`
- `raw_output`: `TEXT` (Nullable, full raw output from the traceroute command)
- `timestamp`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

## 3. Updated Authentication Flow

### Signup
- The `signup.html` form now includes a `username` field in addition to `email` and `password`.
- The `signup.js` script collects these three fields and sends them to the `/api/signup` endpoint.
- The `app.py` endpoint hashes the password, then stores the `username`, `email`, and `password_hash` along with the `registration_date` in the `users` table. Both `username` and `email` are checked for uniqueness.

### Login
- The `login.html` form's primary input field now accepts either an `email` or a `username`.
- The `login.js` script sends this input as a generic `identifier` along with the `password` to the `/api/login` endpoint.
- The `app.py` endpoint attempts to locate a user by matching the `identifier` against both `email` and `username` columns in the `users` table. If found and the password is correct, the user's session is established, and their `last_login` timestamp is updated.

## 4. Diagnostic Data Persistence

All diagnostic operations performed by a logged-in user are now stored in the respective tables, linked to the `user_id` from the session:

- **Ping Utility:** Results (min, avg, max latency, packet loss, success status, and raw output) are saved to the `ping_results` table.
- **Port Scanner:** Results (host, port, open/closed status, detected service, and raw output) are saved to the `port_scan_results` table.
- **Traceroute Utility:** Results (host and raw output) are saved to the `traceroute_results` table.

This ensures a complete history of diagnostic activities for each user.

## 5. Deployment Instructions for Render.com

To ensure your backend correctly connects to the PostgreSQL database on Render, follow these critical steps:

1.  **Create a PostgreSQL Database on Render:**
    - Go to your [Render Dashboard](https://dashboard.render.com/).
    - Create a new PostgreSQL Managed Database.
    - Choose a name, user, and region (ideally matching your backend service's region).

2.  **Retrieve `DATABASE_URL`:**
    - Once the database is created, find and copy its **"External Database URL"** from its detail page in the Render Dashboard.

3.  **Configure Environment Variables for Your `app.py` Service:**
    - Navigate to your `app.py` service in the Render Dashboard.
    - Go to the "Environment" section.
    - Add the following environment variables:
        - `KEY`: `DATABASE_URL`, `VALUE`: (Paste the URL copied in step 2)
        - `KEY`: `SECRET_KEY`, `VALUE`: (Generate a **very long and random string** for session security)

4.  **Redeploy `app.py`:**
    - Trigger a manual redeployment of your `app.py` service on Render.
    - During this initial deployment, the `db.create_all()` command in `app.py` will automatically create all the necessary tables in your newly provisioned PostgreSQL database.