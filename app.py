from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os # Import os module to handle file paths
import platform
import subprocess


app = Flask(__name__)
CORS(app, supports_credentials=True) # supports_credentials=True is needed for sessions

# In a real app, this should be a long, random string loaded from an environment variable
app.secret_key = 'dev-secret-key'

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False) # Store hashed passwords

    def __repr__(self):
        return f'<User {self.email}>'


@app.route('/')
def hello_world():
    return 'Hello, World! This is the backend for Project Vantage.'

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not data or not 'email' in data or not 'password' in data:
        return jsonify({"message": "Email and password are required!"}), 400

    email = data['email']
    password = data['password']

    # Check if user already exists in the database
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User with this email already exists!"}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error during signup: {e}")
        return jsonify({"message": "An error occurred during registration."}), 500

    return jsonify({"message": "User created successfully!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not 'email' in data or not 'password' in data:
        return jsonify({"message": "Email and password are required!"}), 400

    email = data['email']
    password = data['password']

    # Find the user in the database by their email
    user = User.query.filter_by(email=email).first()

    # Check if the user exists and the password is correct
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password"}), 401 # 401 Unauthorized
    
    # Store user_id in the session to remember the user
    session['user_id'] = user.id

    return jsonify({"message": "Login successful!"}), 200

@app.route('/api/ping', methods=['POST'])
def ping_host():
    data = request.get_json()
    if not data or 'host' not in data:
        return jsonify({"error": "Host to ping is required"}), 400

    host = data['host']
    
    # Determine the ping command based on the OS
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', host]

    try:
        # Execute the ping command
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
        
        if result.returncode == 0:
            status = 'online'
            output = result.stdout
        else:
            status = 'offline'
            output = result.stderr

        return jsonify({'host': host, 'status': status, 'output': output}), 200

    except subprocess.TimeoutExpired:
        return jsonify({'host': host, 'status': 'offline', 'error': 'Ping timed out'}), 504
    except Exception as e:
        return jsonify({'host': host, 'status': 'error', 'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "user_id": session['user_id']}), 200
    return jsonify({"logged_in": False}), 401

if __name__ == '__main__':
    app.run(debug=True)
