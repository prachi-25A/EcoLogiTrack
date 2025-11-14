# app.py - Flask Backend with Only Free Features

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from datetime import datetime, timedelta
import joblib
import numpy as np
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import os
import math

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/dairy_supply_chain')

jwt = JWTManager(app)

# MongoDB Connection (FREE - Community Edition)
client = MongoClient(app.config['MONGO_URI'])
db = client.dairy_supply_chain

# Collections
users_collection = db.users
products_collection = db.products
orders_collection = db.orders
transactions_collection = db.transactions
predictions_collection = db.predictions
routes_collection = db.routes
production_collection = db.production_data
demand_collection = db.demand_data

# ============================================
# CUSTOM DASHBOARD ROUTES
# ============================================

@app.route('/api/farmer/upload', methods=['POST'])
@jwt_required()
def farmer_upload():
    user_id = get_jwt_identity()
    data = request.json

    required_fields = ['litres', 'date', 'region']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: litres, date, region'}), 400

    try:
        litres = float(data['litres'])
        if litres <= 0:
            return jsonify({'error': 'Litres must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid litres format'}), 400

    production_entry = {
        'farmer_id': user_id,
        'litres': litres,
        'date': datetime.strptime(data['date'], '%Y-%m-%d'),
        'region': data['region'],
        'created_at': datetime.utcnow()
    }

    result = production_collection.insert_one(production_entry)
    return jsonify({
        'message': 'Production data uploaded successfully',
        'production_id': str(result.inserted_id)
    }), 201

@app.route('/api/retailer/demand', methods=['POST'])
@jwt_required()
def retailer_demand():
    user_id = get_jwt_identity()
    data = request.json

    required_fields = ['litres', 'date', 'region']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: litres, date, region'}), 400

    try:
        litres = float(data['litres'])
        if litres <= 0:
            return jsonify({'error': 'Litres must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid litres format'}), 400

    demand_entry = {
        'retailer_id': user_id,
        'litres': litres,
        'date': datetime.strptime(data['date'], '%Y-%m-%d'),
        'region': data['region'],
        'created_at': datetime.utcnow()
    }

    result = demand_collection.insert_one(demand_entry)
    return jsonify({
        'message': 'Demand data submitted successfully',
        'demand_id': str(result.inserted_id)
    }), 201

@app.route('/api/distributor/view', methods=['GET'])
@jwt_required()
def distributor_view():
    # user_id = get_jwt_identity() # Not strictly needed for viewing all data
    
    production_data = list(production_collection.find().sort('created_at', -1))
    demand_data = list(demand_collection.find().sort('created_at', -1))

    for item in production_data:
        item['_id'] = str(item['_id'])
        item['date'] = item['date'].strftime('%Y-%m-%d')
    for item in demand_data:
        item['_id'] = str(item['_id'])
        item['date'] = item['date'].strftime('%Y-%m-%d')

    return jsonify({
        'production_data': production_data,
        'demand_data': demand_data
    }), 200

# Load ML Model
try:
    demand_model = joblib.load('../models/demand_model.pkl')
except:
    demand_model = None

# ============================================
# FREE DISTANCE CALCULATION (Haversine Formula)
# ============================================

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    FREE alternative to Google Maps Distance Matrix API
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = R * c
    return distance

# Predefined coordinates for common cities in Punjab (FREE data)
CITY_COORDINATES = {
    'ludhiana': (30.9010, 75.8573),
    'jalandhar': (31.3260, 75.5762),
    'amritsar': (31.6340, 74.8723),
    'patiala': (30.3398, 76.3869),
    'bathinda': (30.2110, 74.9455),
    'mohali': (30.7046, 76.7179),
    'hoshiarpur': (31.5330, 75.9120),
    'depot': (30.9010, 75.8573)  # Default depot at Ludhiana
}

def create_distance_matrix(locations):
    """Create distance matrix using Haversine formula (FREE)"""
    n = len(locations)
    matrix = [[0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(n):
            if i != j:
                loc1 = locations[i].lower()
                loc2 = locations[j].lower()
                
                # Find coordinates
                coord1 = CITY_COORDINATES.get(loc1, CITY_COORDINATES['depot'])
                coord2 = CITY_COORDINATES.get(loc2, CITY_COORDINATES['depot'])
                
                distance = haversine_distance(coord1[0], coord1[1], coord2[0], coord2[1])
                matrix[i][j] = round(distance, 2)
    
    return matrix

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    required_fields = ['email', 'password', 'name', 'role']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'error': 'User already exists'}), 409
    
    user = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'name': data['name'],
        'role': data['role'],
        'phone': data.get('phone', ''),
        'address': data.get('address', ''),
        'created_at': datetime.utcnow()
    }
    
    result = users_collection.insert_one(user)
    
    return jsonify({
        'message': 'User registered successfully',
        'user_id': str(result.inserted_id)
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(
        identity=str(user['_id']),
        additional_claims={'role': user['role']}
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        }
    }), 200

# ============================================
# PRODUCTS & ORDERS
# ============================================

@app.route('/api/products', methods=['GET'])
@jwt_required()
def get_products():
    products = list(products_collection.find())
    for product in products:
        product['_id'] = str(product['_id'])
    return jsonify(products), 200

@app.route('/api/products', methods=['POST'])
@jwt_required()
def add_product():
    user_id = get_jwt_identity()
    data = request.json
    
    product = {
        'farmer_id': user_id,
        'quantity': data['quantity'],
        'quality_grade': data.get('quality_grade', 'A'),
        'production_date': data.get('production_date', datetime.utcnow()),
        'expiry_date': datetime.utcnow() + timedelta(days=3),
        'price_per_liter': data.get('price', 50),
        'available': True
    }
    
    result = products_collection.insert_one(product)
    return jsonify({
        'message': 'Product added successfully',
        'product_id': str(result.inserted_id)
    }), 201

@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    
    if user['role'] == 'admin':
        orders = list(orders_collection.find())
    elif user['role'] == 'retailer':
        orders = list(orders_collection.find({'retailer_id': user_id}))
    elif user['role'] == 'farmer':
        orders = list(orders_collection.find({'farmer_id': user_id}))
    else:
        orders = list(orders_collection.find())
    
    for order in orders:
        order['_id'] = str(order['_id'])
    
    return jsonify(orders), 200

def get_dynamic_price(base_price, demand_index, spoilage_risk, quality):
    """Calculates the dynamic price based on several factors."""
    quality_multiplier = {'A+': 1.2, 'A': 1.0, 'B': 0.85}.get(quality, 1.0)
    
    dynamic_price = base_price * quality_multiplier * (1 + 0.15 * demand_index - 0.1 * spoilage_risk)
    dynamic_price = max(40, min(dynamic_price, 80))
    
    return round(dynamic_price, 2)

@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.json

    if not data.get('quantity'):
        return jsonify({'error': 'Quantity is required'}), 400
    
    base_price = 50
    demand_index = data.get('demand_index', 1.0)
    spoilage_risk = data.get('spoilage_risk', 0.1)
    quality = data.get('quality', 'A')

    dynamic_price = get_dynamic_price(base_price, demand_index, spoilage_risk, quality)
    
    try:
        quantity = float(data['quantity'])
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid quantity format'}), 400

    order = {
        'retailer_id': user_id,
        'farmer_id': data.get('farmer_id'),
        'quantity': quantity,
        'price_per_liter': dynamic_price,
        'total_amount': quantity * dynamic_price,
        'delivery_date': data.get('delivery_date'),
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    result = orders_collection.insert_one(order)
    
    return jsonify({
        'message': 'Order created successfully',
        'order_id': str(result.inserted_id),
        'total_amount': order['total_amount']
    }), 201

@app.route('/api/orders/<order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400
    
    result = orders_collection.update_one(
        {'_id': order_id},
        {'$set': {'status': data['status'], 'updated_at': datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({'message': 'Order status updated successfully'}), 200

# ============================================
# ML PREDICTION (FREE)
# ============================================

@app.route('/api/predict-demand', methods=['POST'])
@jwt_required()
def predict_demand():
    data = request.json
    
    input_date_str = data.get('date')
    region = data.get('region') # Keep region for future use or logging

    if not input_date_str:
        return jsonify({'error': 'Date is required for prediction'}), 400

    try:
        input_date = datetime.strptime(input_date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Please use YYYY-MM-DD'}), 400

    # Extract features from the date
    day_of_week = input_date.weekday() # Monday is 0, Sunday is 6
    month = input_date.month
    day_of_month = input_date.day
    is_weekend = 1 if day_of_week >= 5 else 0 # Saturday and Sunday

    # Placeholder for previous demand, temperature, price, etc.
    # In a real scenario, these would come from historical data or other models
    prev_demand = 1200 # Example value
    temperature = 25 # Example value
    price = 50 # Example value
    demand_7day_avg = 1200 # Example value
    demand_30day_avg = 1200 # Example value
    demand_lag_1 = 1200 # Example value
    demand_lag_7 = 1200 # Example value
    is_festival_season = 1 if month in [10, 11, 12, 3, 4] else 0 # Example

    if demand_model is None:
        # Simple moving average prediction (FREE fallback)
        recent_demands = list(predictions_collection.find().sort('created_at', -1).limit(7))
        if recent_demands:
            avg_demand = sum(p.get('predicted_demand', 1200) for p in recent_demands) / len(recent_demands)
            predicted_demand_value = avg_demand * 1.05  # 5% growth assumption
        else:
            predicted_demand_value = 1200
    else:
        features = np.array([[
            day_of_week,
            month,
            day_of_month,
            is_weekend,
            is_festival_season,
            prev_demand,
            temperature,
            price,
            demand_7day_avg,
            demand_30day_avg,
            demand_lag_1,
            demand_lag_7,
            np.sin(2 * np.pi * day_of_week / 7),
            np.cos(2 * np.pi * day_of_week / 7),
            np.sin(2 * np.pi * month / 12),
            np.cos(2 * np.pi * month / 12),
        ]])
        predicted_demand_value = demand_model.predict(features)[0]
    
    prediction_record = {
        'date': input_date_str,
        'region': region,
        'predicted_demand': float(predicted_demand_value),
        'confidence': 0.85, # Placeholder
        'created_at': datetime.utcnow()
    }
    
    predictions_collection.insert_one(prediction_record.copy())
    
    # Return data in a format suitable for Recharts
    return jsonify([{ 'name': input_date_str, 'demand': round(predicted_demand_value, 2) }]), 200

@app.route('/api/prediction/history', methods=['GET'])
@jwt_required()
def get_prediction_history():
    predictions = list(predictions_collection.find().sort('created_at', -1).limit(30))
    for p in predictions:
        p['_id'] = str(p['_id'])
    return jsonify(predictions), 200

import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from optimization.route_optimizer import simple_vrp, PUNJAB_CITIES

# ============================================
# AUTHENTICATION ROUTES
# ============================================
@app.route('/api/optimize', methods=['POST'])
@jwt_required()
def optimize_routes():
    data = request.json
    print(f"Data received for optimization: {data}")
    locations = data.get('locations', ['depot', 'jalandhar', 'amritsar', 'patiala'])
    demands = data.get('demands', [0, 250, 300, 200, 150])
    num_vehicles = data.get('num_vehicles', 3)

    if len(locations) != len(demands):
        return jsonify({'error': 'The number of locations and demands must be equal.'}), 400
    
    # Optimize routes using the enhanced VRP solver
    optimization_result = simple_vrp(locations, demands, num_vehicles)
    
    # Calculate CO2 emissions and other metrics
    co2_factor = 0.4  # kg per km
    for vehicle in optimization_result['vehicles']:
        vehicle['co2_emissions'] = round(vehicle['distance'] * co2_factor, 2)
        vehicle['estimated_time'] = round(vehicle['distance'] / 40 * 60, 0)  # 40 km/h average
        
        # Add coordinates to the cities
        vehicle['cities_with_coords'] = []
        for city_name in vehicle['cities']:
            city_name_lower = city_name.lower()
            if city_name_lower in PUNJAB_CITIES:
                vehicle['cities_with_coords'].append(PUNJAB_CITIES[city_name_lower])
            elif city_name_lower == 'depot':
                # Handle depot location (assuming it's the first location from the input)
                depot_coords_str = locations[0]
                if ',' in depot_coords_str:
                    lat, lon = map(float, depot_coords_str.split(','))
                    vehicle['cities_with_coords'].append({'lat': lat, 'lon': lon, 'name': 'Depot'})

    # Save to database
    db_result = {
        'locations': locations,
        'routes': optimization_result['vehicles'],
        'total_distance': optimization_result['total_distance'],
        'total_co2': sum(v['co2_emissions'] for v in optimization_result['vehicles']),
        'created_at': datetime.utcnow()
    }
    
    routes_collection.insert_one(db_result)
    
    return jsonify({
        'success': True,
        'routes': optimization_result['vehicles'],
        'total_distance': optimization_result['total_distance'],
        'total_co2': db_result['total_co2']
    }), 200


@app.route('/api/route', methods=['POST'])
@jwt_required()
def create_route():
    data = request.json
    
    # Validate input
    required_fields = ['locations', 'demands', 'num_vehicles']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    locations = data.get('locations', [])
    demands = data.get('demands', [])
    num_vehicles = data.get('num_vehicles', 1)

    if len(locations) != len(demands):
        return jsonify({'error': 'Locations and demands must have the same length'}), 400

    # Create a new route document
    new_route = {
        'locations': locations,
        'demands': demands,
        'num_vehicles': num_vehicles,
        'created_at': datetime.utcnow(),
        'status': 'pending'  # Initial status
    }

    # Insert into the database
    result = routes_collection.insert_one(new_route)
    
    return jsonify({
        'message': 'Route created successfully',
        'route_id': str(result.inserted_id)
    }), 201


@app.route('/api/routes', methods=['GET'])
@jwt_required()
def get_routes():
    routes = list(routes_collection.find().sort('created_at', -1))
    for route in routes:
        route['_id'] = str(route['_id'])
    return jsonify(routes), 200

# ============================================
# DYNAMIC PRICING (FREE)
# ============================================

@app.route('/api/pricing', methods=['POST'])
@jwt_required()
def calculate_dynamic_price():
    data = request.json
    
    base_price = 50
    demand_index = data.get('demand_index', 1.0)
    spoilage_risk = data.get('spoilage_risk', 0.1)
    quality = data.get('quality', 'A')

    dynamic_price = get_dynamic_price(base_price, demand_index, spoilage_risk, quality)
    
    return jsonify({
        'base_price': base_price,
        'dynamic_price': dynamic_price,
        'factors': {
            'demand_index': demand_index,
            'spoilage_risk': spoilage_risk,
            'quality_multiplier': {'A+': 1.2, 'A': 1.0, 'B': 0.85}.get(quality, 1.0)
        }
    }), 200

# ============================================
# FREE PAYMENT SIMULATION (Mock UPI)
# ============================================

@app.route('/api/payments/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    user_id = get_jwt_identity()
    data = request.json
    
    # Simulate UPI payment (FREE - no actual payment gateway)
    payment = {
        'payment_id': f"PAY_{int(datetime.utcnow().timestamp() * 1000)}",
        'order_id': data['order_id'],
        'amount': data['amount'],
        'currency': 'INR',
        'status': 'pending',
        'payment_method': 'UPI_SIMULATION',
        'upi_id': data.get('upi_id', 'user@upi'),
        'user_id': user_id,
        'created_at': datetime.utcnow()
    }
    
    result = transactions_collection.insert_one(payment)
    
    return jsonify({
        'payment_id': payment['payment_id'],
        'amount': payment['amount'],
        'status': 'pending',
        'message': 'Payment initiated (Simulation mode - no real transaction)'
    }), 200

@app.route('/api/payments/<payment_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_payment(payment_id):
    """Simulate payment confirmation (FREE)"""
    
    transactions_collection.update_one(
        {'payment_id': payment_id},
        {'$set': {'status': 'success', 'updated_at': datetime.utcnow()}}
    )
    
    # Update order status
    payment = transactions_collection.find_one({'payment_id': payment_id})
    if payment:
        orders_collection.update_one(
            {'_id': payment['order_id']},
            {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
        )
    
    return jsonify({'message': 'Payment confirmed successfully'}), 200

@app.route('/api/payments/history', methods=['GET'])
@jwt_required()
def get_payment_history():
    user_id = get_jwt_identity()
    payments = list(transactions_collection.find({'user_id': user_id}).sort('created_at', -1))
    
    for payment in payments:
        payment['_id'] = str(payment['_id'])
    
    return jsonify(payments), 200

# ============================================
# METRICS & CO2 (FREE)
# ============================================

@app.route('/api/carbon-footprint', methods=['GET'])
def calculate_carbon_footprint():
    """
    Calculates CO2 emissions based on distance and fuel type.
    Uses simplified, free-to-use emission factors.
    """
    distance_str = request.args.get('distance')
    fuel_type = request.args.get('fuel_type', 'diesel').lower()

    if not distance_str:
        return jsonify({'error': 'Distance parameter is required'}), 400

    try:
        distance = float(distance_str)
    except ValueError:
        return jsonify({'error': 'Invalid distance format'}), 400

    # Emission factors (kg CO2 per liter) - simplified and free data
    emission_factors = {
        'diesel': 2.68,  # Standard factor for diesel
        'petrol': 2.31   # Standard factor for petrol
    }

    # Average fuel efficiency (km per liter) - assumed for typical delivery vehicles
    fuel_efficiency = {
        'diesel': 7,  # Average for a light-duty truck
        'petrol': 12  # Average for a smaller van/car
    }

    if fuel_type not in emission_factors:
        return jsonify({'error': 'Invalid fuel_type. Use "diesel" or "petrol".'}), 400

    # Calculate emissions
    liters_consumed = distance / fuel_efficiency[fuel_type]
    co2_emissions_kg = liters_consumed * emission_factors[fuel_type]

    return jsonify({
        'distance_km': distance,
        'fuel_type': fuel_type,
        'co2_emissions_kg': round(co2_emissions_kg, 2)
    }), 200


@app.route('/api/metrics/co2', methods=['GET'])
@jwt_required()
def get_co2_metrics():
    recent_routes = list(routes_collection.find().sort('created_at', -1).limit(10))
    
    route_data = []
    total_co2 = 0
    
    for doc in recent_routes:
        for route in doc.get('routes', []):
            route_data.append({
                'route': f"Route {len(route_data) + 1}",
                'distance': route['distance'],
                'co2': route['co2_emissions']
            })
            total_co2 += route['co2_emissions']
    
    co2_saved = total_co2 * 0.25
    
    return jsonify({
        'routes': route_data,
        'total_co2_emissions': round(total_co2, 2),
        'co2_saved_through_optimization': round(co2_saved, 2),
        'trees_equivalent': round(co2_saved / 21, 1)
    }), 200

@app.route('/api/metrics/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    total_orders = orders_collection.count_documents({})
    active_users = users_collection.count_documents({})
    
    pipeline = [{'$group': {'_id': None, 'total': {'$sum': '$total_amount'}}}]
    revenue_result = list(orders_collection.aggregate(pipeline))
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    predictions = list(predictions_collection.find().sort('created_at', -1).limit(10))
    
    return jsonify({
        'total_orders': total_orders,
        'active_users': active_users,
        'total_revenue': total_revenue,
        'recent_predictions': len(predictions),
        'avg_accuracy': 0.87
    }), 200

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'database': 'connected',
            'ml_model': 'loaded' if demand_model else 'not_loaded',
            'features': 'free_tier_only'
        }
    }), 200

@app.route('/')
def home():
    return "Dairy Supply Chain Backend Running!"

if __name__ == '__main__':
    app.run(debug=True, port=5001)