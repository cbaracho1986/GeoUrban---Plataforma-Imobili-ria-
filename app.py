from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import os
from auth import auth_bp, login_required
from datetime import timedelta
import json

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')  # Use environment variable in production
app.permanent_session_lifetime = timedelta(days=1)

# Register the auth blueprint
app.register_blueprint(auth_bp)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('index.html')

@app.route('/api/buildings', methods=['GET'])
@login_required
def get_buildings():
    # This would be replaced with actual data from a database
    sample_buildings = [
        {
            'id': 1,
            'name': 'Tower A',
            'position': {'x': 0, 'y': 0, 'z': 0},
            'dimensions': {'width': 20, 'length': 30, 'height': 50},
            'style': 'modern',
            'floors': 12,
            'roofType': 'flat',
            'hasSubVolumes': True
        },
        {
            'id': 2,
            'name': 'Office Building',
            'position': {'x': 50, 'y': 0, 'z': 50},
            'dimensions': {'width': 40, 'length': 40, 'height': 30},
            'style': 'corporate',
            'floors': 8,
            'roofType': 'flat',
            'hasSubVolumes': False
        },
        {
            'id': 3,
            'name': 'Residential Complex',
            'position': {'x': -50, 'y': 0, 'z': -30},
            'dimensions': {'width': 25, 'length': 35, 'height': 20},
            'style': 'residential',
            'floors': 6,
            'roofType': 'pitched',
            'hasSubVolumes': True
        },
        {
            'id': 4,
            'name': 'Shopping Center',
            'position': {'x': -30, 'y': 0, 'z': 40},
            'dimensions': {'width': 50, 'length': 60, 'height': 15},
            'style': 'modern',
            'floors': 3,
            'roofType': 'flat',
            'hasSubVolumes': True
        }
    ]
    return jsonify(sample_buildings)

@app.route('/api/buildings', methods=['POST'])
@login_required
def create_building():
    data = request.json
    # Add the user info to the building data
    data['user_id'] = request.user['email']
    
    # In a real app, you would save this to a database
    # and return the created object with an ID
    return jsonify({'status': 'success', 'data': data})

@app.route('/api/user')
@login_required
def get_user():
    return jsonify({
        'email': request.user['email'],
        'role': request.user['role']
    })

@app.route('/api/projects')
@login_required
def get_projects():
    # This would be replaced with actual data from a database
    sample_projects = [
        {
            'id': 1,
            'name': 'Downtown Development',
            'created_at': '2023-01-15',
            'updated_at': '2023-03-20',
            'building_count': 5
        },
        {
            'id': 2,
            'name': 'Residential Complex',
            'created_at': '2023-02-10',
            'updated_at': '2023-03-18',
            'building_count': 12
        }
    ]
    return jsonify(sample_projects)

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)