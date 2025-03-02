from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import functools
import jwt
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

# Mock user database (in a real app, this would be in a database)
users_db = {
    'admin@example.com': {
        'password': generate_password_hash('admin123'),
        'name': 'Admin User',
        'role': 'admin'
    },
    'user@example.com': {
        'password': generate_password_hash('user123'),
        'name': 'Regular User',
        'role': 'user'
    }
}

# JWT Config
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')  # Use environment variable in production
JWT_EXPIRATION = 3600  # 1 hour


# Helper function to generate JWT token
def generate_token(user_id, role):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXPIRATION),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id,
        'role': role
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')


# Decorator for requiring authentication
def login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Check for token in request headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        # Check for token in session
        elif 'token' in session:
            token = session['token']
        
        if not token:
            return jsonify({'message': 'Authentication required'}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            # Add user info to request
            request.user = {'email': payload['sub'], 'role': payload['role']}
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    
    return decorated_function


# Login route
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
    
    user_email = data.get('email')
    
    if user_email not in users_db:
        return jsonify({'message': 'User not found'}), 404
    
    # Check password
    if check_password_hash(users_db[user_email]['password'], data.get('password')):
        # Generate token
        token = generate_token(user_email, users_db[user_email]['role'])
        
        # Set token in session
        session['token'] = token
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'email': user_email,
                'name': users_db[user_email]['name'],
                'role': users_db[user_email]['role']
            }
        }), 200
    
    return jsonify({'message': 'Invalid password'}), 401


# Logout route
@auth_bp.route('/logout')
def logout():
    session.pop('token', None)
    return jsonify({'message': 'Logout successful'}), 200


# Register route (simplified, would need email verification in production)
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')
    
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    user_email = data.get('email')
    
    if user_email in users_db:
        return jsonify({'message': 'User already exists'}), 409
    
    # Create new user
    users_db[user_email] = {
        'password': generate_password_hash(data.get('password')),
        'name': data.get('name'),
        'role': 'user'  # Default role
    }
    
    return jsonify({'message': 'Registration successful'}), 201


# Protected route example
@auth_bp.route('/protected')
@login_required
def protected():
    return jsonify({
        'message': 'This is a protected route',
        'user': request.user
    }), 200