import os
import platform
import subprocess
import socket
import re # For parsing ping output

from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# --- App Initialization and Configuration ---
app = Flask(__name__)

# This is the crucial configuration for secure, cross-domain sessions.
# In a real production app, the secret key should come from an environment variable.
app.secret_key = 'a_very_strong_and_long_random_secret_key_for_production'
app.config['SESSION_COOKIE_SECURE'] = True  # Ensures cookies are only sent over HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allows cross-domain cookie sending

# This enables credentials (like cookies) to be sent from your frontend domain.
# Replace 'https://asoraledecnal.github.io' with your actual frontend URL if it's different.
CORS(app, supports_credentials=True, origins=['https://asoraledecnal.github.io', 'http://127.0.0.1:5000'])

# --- Database Configuration ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# --- Database Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f'<User {self.email}>'

# --- Utility Functions ---
def parse_ping_output(output):
    """Parses ping output to find key metrics."""
    # For Windows: Reply from 142.250.187.228: bytes=32 time=23ms TTL=116
    match = re.search(r"Reply from (.*?):.*?time(?:<|_)?=?(\d+ms)", output)
    if match:
        return {"ip": match.group(1), "time": match.group(2)}
    
    # For Linux/macOS: 64 bytes from lhr48s01-in-f14.1e100.net (142.250.204.46): icmp_seq=1 ttl=116 time=22.3 ms
    match = re.search(r"from (.*?):.*?time=([\d\.]+\s?ms)", output)
    if match:
        return {"ip": match.group(1), "time": match.group(2)}
    
    return {}

# --- API Endpoints ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required!"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "User with this email already exists!"}), 409

    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully!"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required!"}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"message": "Invalid email or password"}), 401
    
    session['user_id'] = user.id
    return jsonify({"message": "Login successful!", "user_id": user.id}), 200


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route('/api/check_session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if user_id:
        user = db.session.get(User, user_id)
        if user:
            return jsonify({"logged_in": True, "email": user.email}), 200
    
    return jsonify({"logged_in": False}), 401


@app.route('/api/dashboard_data', methods=['GET'])
def get_dashboard_data():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401
    
    return jsonify({"message": f"Welcome to your dashboard, user #{session['user_id']}!"})


@app.route('/api/ping', methods=['POST'])
def ping_host():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or 'host' not in data:
        return jsonify({"error": "Host to ping is required"}), 400

    host = data['host']
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', host]

    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=5)
        
        if result.returncode == 0:
            status = 'online'
            parsed_data = parse_ping_output(result.stdout)
            return jsonify({
                'host': host, 
                'status': status, 
                'ip': parsed_data.get('ip'),
                'time': parsed_data.get('time'),
                'raw_output': result.stdout
            }), 200
        else:
            return jsonify({'host': host, 'status': 'offline', 'raw_output': result.stderr}), 200
            
    except subprocess.TimeoutExpired:
        return jsonify({'host': host, 'status': 'offline', 'error': 'Ping timed out'}), 504
    except Exception as e:
        return jsonify({'host': host, 'status': 'error', 'error': str(e)}), 500


@app.route('/api/port_scan', methods=['POST'])
def port_scan():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or 'host' not in data or 'port' not in data:
        return jsonify({"error": "Host and port are required"}), 400

    host = data['host']
    try:
        port = int(data['port'])
        if not 1 <= port <= 65535:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Port must be a valid integer between 1 and 65535"}), 400

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result_code = sock.connect_ex((host, port))
        sock.close()
        
        status = 'open' if result_code == 0 else 'closed'
        return jsonify({'host': host, 'port': port, 'status': status}), 200

    except socket.gaierror:
        return jsonify({'host': host, 'port': port, 'status': 'error', 'error': 'Hostname could not be resolved'}), 400
    except Exception as e:
        return jsonify({'host': host, 'port': port, 'status': 'error', 'error': str(e)}), 500


@app.route('/api/traceroute', methods=['POST'])
def traceroute_host():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or 'host' not in data:
        return jsonify({"error": "Host to trace is required"}), 400

    host = data['host']
    command = ['tracert' if platform.system().lower() == 'windows' else 'traceroute', host]

    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return jsonify({'host': host, 'status': 'complete', 'output': result.stdout}), 200
        else:
            return jsonify({'host': host, 'status': 'failed', 'output': result.stderr}), 200
            
    except subprocess.TimeoutExpired:
        return jsonify({'host': host, 'status': 'failed', 'error': 'Traceroute timed out'}), 504
    except Exception as e:
        return jsonify({'host': host, 'status': 'error', 'error': str(e)}), 500


if __name__ == '__main__':
    # When running locally, Flask's development server doesn't support HTTPS,
    # so the secure cookie won't work. We use this for local testing only.
    app.config['SESSION_COOKIE_SECURE'] = False
    app.run(debug=True)