import os
import platform
import subprocess
import socket
import re
import ipaddress
from datetime import datetime, timezone
from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from pythonping import ping # Import pythonping

# --- Helper function for input validation ---
def is_valid_host(host):
    """
    Validates if the provided host is a valid hostname or IP address.
    Prevents command injection by disallowing special characters.
    """
    if not host or not isinstance(host, str):
        return False
    
    # Disallow characters that could be used for command injection
    if any(char in host for char in ";|&`$()<>"):
        return False
        
    # Check for valid IP address format
    try:
        ipaddress.ip_address(host)
        return True # It's a valid IP address
    except ValueError:
        pass # Not an IP address, check if it's a hostname
        
    # Check for valid hostname format (simple regex)
    # Allows for domain names like 'google.com' or 'sub.domain.co.uk'
    hostname_regex = re.compile(r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$")
    return hostname_regex.match(host) is not None

# --- App Initialization and Configuration ---
app = Flask(__name__)

# This is the crucial configuration for secure, cross-domain sessions.
# In a real production app, the secret key should come from an environment variable.
app.secret_key = os.environ.get('SECRET_KEY', 'a_very_strong_and_long_random_secret_key_for_production')
app.config['SESSION_COOKIE_SECURE'] = True  # Ensures cookies are only sent over HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allows cross-domain cookie sending

# This enables credentials (like cookies) to be sent from your frontend domain.
# Replace 'https://asoraledecnal.github.io' with your actual frontend URL if it's different.
CORS(app, supports_credentials=True, origins=['https://asoraledecnal.github.io', 'http://127.0.0.1:5000'])

# --- Database Configuration ---
# Use PostgreSQL for production, SQLite for local development if DATABASE_URL is not set
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/vantage_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Models ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    registration_date = db.Column(db.TIMESTAMP(timezone=True), default=func.now(), nullable=False)
    last_login = db.Column(db.TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    settings = db.relationship('UserSettings', backref='user', lazy=True)
    ping_results = db.relationship('PingResults', backref='user', lazy=True)
    port_scan_results = db.relationship('PortScanResults', backref='user', lazy=True)
    traceroute_results = db.relationship('TracerouteResults', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class UserSettings(db.Model):
    __tablename__ = 'user_settings'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    setting_key = db.Column(db.String(255), nullable=False)
    setting_value = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), default=func.now(), nullable=False)
    updated_at = db.Column(db.TIMESTAMP(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f'<UserSettings {self.setting_key} for User {self.user_id}>'

class PingResults(db.Model):
    __tablename__ = 'ping_results'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    host = db.Column(db.String(255), nullable=False)
    min_latency_ms = db.Column(db.Numeric(10, 3), nullable=True)
    avg_latency_ms = db.Column(db.Numeric(10, 3), nullable=True)
    max_latency_ms = db.Column(db.Numeric(10, 3), nullable=True)
    packet_loss_percent = db.Column(db.Numeric(5, 2), nullable=True)
    raw_output = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.TIMESTAMP(timezone=True), default=func.now(), nullable=False)
    success = db.Column(db.Boolean, nullable=False)

    def __repr__(self):
        return f'<PingResult {self.host} by User {self.user_id}>'

class PortScanResults(db.Model):
    __tablename__ = 'port_scan_results'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    is_open = db.Column(db.Boolean, nullable=False)
    service_name = db.Column(db.String(255), nullable=True)
    raw_output = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.TIMESTAMP(timezone=True), default=func.now(), nullable=False)

    def __repr__(self):
        return f'<PortScanResult {self.host}:{self.port} by User {self.user_id}>'

class TracerouteResults(db.Model):
    __tablename__ = 'traceroute_results'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    host = db.Column(db.String(255), nullable=False)
    raw_output = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.TIMESTAMP(timezone=True), default=func.now(), nullable=False)

    def __repr__(self):
        return f'<TracerouteResult {self.host} by User {self.user_id}>'

# --- API Endpoints ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Username, email, and password are required!"}), 400

    if User.query.filter((User.username == data['username']) | (User.email == data['email'])).first():
        return jsonify({"message": "User with this username or email already exists!"}), 409

    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('identifier') or not data.get('password'):
        return jsonify({"message": "Email/Username and password are required!"}), 400

    identifier = data['identifier']
    password = data['password']

    # Try to find user by email or username
    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid email/username or password"}), 401
    
    session['user_id'] = user.id
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Login successful!", "user_id": user.id}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear() # This clears the session, logging the user out
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    user_id = session.get('user_id')
    if user_id:
        user = db.session.get(User, user_id)
        if user:
            return jsonify({"logged_in": True, "username": user.username, "email": user.email}), 200
    
    return jsonify({"logged_in": False}), 401

# This is an example of a protected API endpoint
@app.route('/api/dashboard_data', methods=['GET'])
def get_dashboard_data():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
    
    return jsonify({"message": f"Welcome to your dashboard, user #{session['user_id']}!"})

@app.route('/api/ping', methods=['POST'])
def ping_host():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    host = data.get('host')

    if not is_valid_host(host):
        return jsonify({"error": "Invalid or malicious host provided"}), 400
    
    min_lat = None
    avg_lat = None
    max_lat = None
    packet_loss = None
    ping_success = False
    raw_output_text = "No output"

    try:
        # Use pythonping
        result = ping(host, count=4, timeout=2) # 4 packets, 2 second timeout for more realistic stats
        
        raw_output_text = "\n".join(
            r.success_message if r.success else r.error_message
            for r in result.all_responses
        )


        if result.success:
            ping_success = True
            min_lat = result.rtt_min_ms
            avg_lat = result.rtt_avg_ms
            max_lat = result.rtt_max_ms
            packet_loss = result.packet_loss
        
        new_ping_result = PingResults(
            user_id=user_id,
            host=host,
            min_latency_ms=min_lat,
            avg_latency_ms=avg_lat,
            max_latency_ms=max_lat,
            packet_loss_percent=packet_loss,
            raw_output=raw_output_text,
            success=ping_success
        )
        db.session.add(new_ping_result)
        db.session.commit()
        
        return jsonify({
            'host': host,
            'status': 'online' if ping_success else 'offline',
            'min': min_lat,
            'avg': avg_lat,
            'max': max_lat,
            'packet_loss': packet_loss,
            'raw_output': raw_output_text,
            'success': ping_success
        }), 200

    except Exception as e:
        error_output = f"Ping command failed: {str(e)}"
        new_ping_result = PingResults(
            user_id=user_id,
            host=host,
            raw_output=error_output,
            success=False
        )
        db.session.add(new_ping_result)
        db.session.commit()
        return jsonify({'host': host, 'status': 'error', 'error': error_output, 'raw_output': raw_output_text}), 500

@app.route('/api/port-scan', methods=['POST'])
def port_scan():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    host = data.get('host')
    port_str = data.get('port')

    if not is_valid_host(host):
        return jsonify({"error": "Invalid or malicious host provided"}), 400

    try:
        port = int(port_str)
        if not 1 <= port <= 65535:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Port must be a valid integer between 1 and 65535"}), 400

    is_port_open = False
    raw_output_text = ""
    service_detected = None

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1) # 1-second timeout
            result = s.connect_ex((host, port))
            if result == 0:
                is_port_open = True
                raw_output_text = f"Port {port} is open on {host}"
                try:
                    service_detected = socket.getservbyport(port)
                except OSError:
                    service_detected = "unknown"
            else:
                raw_output_text = f"Port {port} is closed or filtered on {host}"

        new_port_scan_result = PortScanResults(
            user_id=user_id,
            host=host,
            port=port,
            is_open=is_port_open,
            service_name=service_detected,
            raw_output=raw_output_text
        )
        db.session.add(new_port_scan_result)
        db.session.commit()

        return jsonify({'host': host, 'port': port, 'open': is_port_open, 'service': service_detected, 'raw_output': raw_output_text}), 200

    except socket.gaierror:
        error_output = 'Hostname could not be resolved'
        new_port_scan_result = PortScanResults(
            user_id=user_id,
            host=host,
            port=port,
            is_open=False,
            raw_output=error_output
        )
        db.session.add(new_port_scan_result)
        db.session.commit()
        return jsonify({'host': host, 'port': port, 'open': False, 'error': error_output, 'raw_output': raw_output_text}), 400
    except Exception as e:
        error_output = f"Port scan failed: {str(e)}"
        new_port_scan_result = PortScanResults(
            user_id=user_id,
            host=host,
            port=port,
            is_open=False,
            raw_output=error_output
        )
        db.session.add(new_port_scan_result)
        db.session.commit()
        return jsonify({'host': host, 'port': port, 'open': False, 'error': error_output, 'raw_output': raw_output_text}), 500

@app.route('/api/traceroute', methods=['POST'])
def traceroute_host():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    host = data.get('host')

    if not is_valid_host(host):
        return jsonify({"error": "Invalid or malicious host provided"}), 400

    command = ['tracert' if platform.system().lower() == 'windows' else 'traceroute', host]
    raw_output_text = ""

    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        raw_output_text = result.stdout if result.returncode == 0 else result.stderr
        
        new_traceroute_result = TracerouteResults(
            user_id=user_id,
            host=host,
            raw_output=raw_output_text
        )
        db.session.add(new_traceroute_result)
        db.session.commit()

        if result.returncode == 0:
            return jsonify({'host': host, 'status': 'complete', 'output': raw_output_text}), 200
        else:
            return jsonify({'host': host, 'status': 'failed', 'output': raw_output_text}), 200
            
    except subprocess.TimeoutExpired:
        error_output = 'Traceroute timed out'
        new_traceroute_result = TracerouteResults(
            user_id=user_id,
            host=host,
            raw_output=error_output
        )
        db.session.add(new_traceroute_result)
        db.session.commit()
        return jsonify({'host': host, 'status': 'failed', 'error': error_output, 'output': raw_output_text}), 504
    except Exception as e:
        error_output = f"Traceroute failed: {str(e)}"
        new_traceroute_result = TracerouteResults(
            user_id=user_id,
            host=host,
            raw_output=error_output
        )
        db.session.add(new_traceroute_result)
        db.session.commit()
        return jsonify({'host': host, 'status': 'error', 'error': error_output, 'output': raw_output_text}), 500

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch data for Hero Metrics
    # Median Latency (Average of last 10 pings for the user)
    last_pings = PingResults.query.filter_by(user_id=user_id, success=True).order_by(PingResults.timestamp.desc()).limit(10).all()
    avg_latency = sum([float(p.avg_latency_ms) for p in last_pings if p.avg_latency_ms is not None]) / len(last_pings) if last_pings else "N/A"
    
    # Placeholder for trend calculation - would need more historical data
    latency_trend = "-4% vs last hour" 

    # Active Services (Mock data)
    active_services = 128 
    monitored_nodes = 12

    # Route Integrity (Mock data)
    route_integrity = "99.3%"
    stability_trend = "+0.8% stability"

    # Fetch data for Overview Grid (Mock data for now)
    signal_quality_regions = "54 regions online"
    signal_quality_status = "Optimal"
    signal_quality_details = "Edge sensors report normal behavior with minor variance in APAC."

    incidents_count = "3 narratives"
    incidents_status = "Watching"
    incidents_list = [
        "Packet loss — Singapore IX",
        "Flapping route — Paris edge",
        "Auth retries — Dallas"
    ]

    automation_resolves = "18 auto-resolves today"
    automation_details = "Latest: throttled noisy tenant traffic in under 14 seconds."

    next_checks_count = "5 scheduled sweeps"
    next_checks_details = "Nightly deep traceroute and critical API heartbeat verification."

    return jsonify({
        "hero_metrics": {
            "median_latency": f"{avg_latency:.0f} ms" if isinstance(avg_latency, float) else avg_latency,
            "latency_trend": latency_trend,
            "active_services": active_services,
            "monitored_nodes": monitored_nodes,
            "route_integrity": route_integrity,
            "stability_trend": stability_trend
        },
        "overview_grid": {
            "signal_quality": {"regions": signal_quality_regions, "status": signal_quality_status, "details": signal_quality_details},
            "incidents": {"count": incidents_count, "status": incidents_status, "list": incidents_list},
            "automation": {"resolves": automation_resolves, "details": automation_details},
            "next_checks": {"count": next_checks_count, "details": next_checks_details}
        }
    }), 200

@app.route('/api/dashboard/timeline', methods=['GET'])
def get_incident_timeline():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Mock data for incident timeline
    timeline_data = [
        {"time": "12:45", "strong": "Route recalculated", "p": "Automatic reroute around packet loss detected on SEA-IX."},
        {"time": "11:12", "strong": "Port 443 anomaly", "p": "High handshake latency noted on EU perimeter. Monitoring."},
        {"time": "09:55", "strong": "Traceroute sweep", "p": "Benchmark run completed for 15 core services."}
    ]
    return jsonify({"timeline": timeline_data}), 200

@app.route('/api/dashboard/watchlist', methods=['GET'])
def get_signal_watchlist():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Mock data for signal watchlist
    watchlist_data = [
        {"item": "apac-auth.edge", "metric": "Latency", "value": "52 ms", "status_pill": "pill-warn"},
        {"item": "eu-core-routing", "metric": "Route changes", "value": "Stable", "status_pill": "pill-good"},
        {"item": "us-south-load", "metric": "Throughput", "value": "71%", "status_pill": ""} # No specific pill class for default
    ]
    return jsonify({"watchlist": watchlist_data}), 200

if __name__ == '__main__':
    # When running locally, Flask's development server doesn't support HTTPS,
    # so the secure cookie won't work. We use this for local testing only.
    app.config['SESSION_COOKIE_SECURE'] = False
    with app.app_context():
        db.create_all() # Create database tables for newly defined models
    app.run(debug=True)

