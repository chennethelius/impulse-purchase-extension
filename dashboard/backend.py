"""
Flask Backend for Impulse Guard Dashboard
Processes real Chrome extension data about impulsive purchases
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import sqlite3

app = Flask(__name__)
CORS(app)

# Database setup
DB_PATH = 'impulse_data.db'

def init_database():
    """Initialize SQLite database for purchase attempts"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create purchase_attempts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS purchase_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            item_description TEXT,
            outcome TEXT,
            url TEXT,
            domain TEXT,
            session_id TEXT,
            decision_time INTEGER
        )
    ''')
    
    # Create daily_stats table for aggregated data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_stats (
            date TEXT PRIMARY KEY,
            total_attempts INTEGER,
            total_blocked INTEGER,
            total_allowed INTEGER,
            money_saved REAL,
            category_breakdown TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

init_database()


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def index():
    """Serve the dashboard HTML"""
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get comprehensive statistics for the dashboard"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get time range (default: last 30 days)
    days = int(request.args.get('days', 30))
    start_timestamp = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
    
    # Get all purchase attempts in time range
    cursor.execute('''
        SELECT * FROM purchase_attempts 
        WHERE timestamp >= ? 
        ORDER BY timestamp DESC
    ''', (start_timestamp,))
    
    attempts = cursor.fetchall()
    
    # Calculate statistics
    total_attempts = len(attempts)
    total_blocked = sum(1 for a in attempts if a['outcome'] == 'blocked')
    total_allowed = sum(1 for a in attempts if a['outcome'] == 'allowed')
    money_saved = sum(a['price'] for a in attempts if a['outcome'] == 'blocked')
    
    # Category breakdown
    category_stats = defaultdict(lambda: {'attempts': 0, 'blocked': 0, 'allowed': 0, 'money_saved': 0})
    
    for attempt in attempts:
        cat = attempt['category']
        category_stats[cat]['attempts'] += 1
        if attempt['outcome'] == 'blocked':
            category_stats[cat]['blocked'] += 1
            category_stats[cat]['money_saved'] += attempt['price']
        elif attempt['outcome'] == 'allowed':
            category_stats[cat]['allowed'] += 1
    
    # Timeline data (daily aggregation)
    timeline = defaultdict(lambda: {'date': '', 'blocked': 0, 'allowed': 0, 'money_saved': 0})
    
    for attempt in attempts:
        date = datetime.fromtimestamp(attempt['timestamp'] / 1000).strftime('%Y-%m-%d')
        timeline[date]['date'] = date
        if attempt['outcome'] == 'blocked':
            timeline[date]['blocked'] += 1
            timeline[date]['money_saved'] += attempt['price']
        elif attempt['outcome'] == 'allowed':
            timeline[date]['allowed'] += 1
    
    # Sort timeline by date
    timeline_list = sorted(timeline.values(), key=lambda x: x['date'])
    
    # Recent purchases (last 10)
    recent_purchases = []
    for attempt in attempts[:10]:
        recent_purchases.append({
            'id': attempt['id'],
            'timestamp': attempt['timestamp'],
            'date': datetime.fromtimestamp(attempt['timestamp'] / 1000).strftime('%Y-%m-%d %H:%M:%S'),
            'category': attempt['category'],
            'price': attempt['price'],
            'item': attempt['item_description'],
            'outcome': attempt['outcome'],
            'domain': attempt['domain']
        })
    
    # Top spending categories
    top_categories = sorted(
        [{'category': cat, **stats} for cat, stats in category_stats.items()],
        key=lambda x: x['money_saved'],
        reverse=True
    )[:5]
    
    # Average decision time
    decision_times = [a['decision_time'] for a in attempts if a['decision_time']]
    avg_decision_time = sum(decision_times) / len(decision_times) if decision_times else 0
    
    conn.close()
    
    return jsonify({
        'total_attempts': total_attempts,
        'total_blocked': total_blocked,
        'total_allowed': total_allowed,
        'money_saved': money_saved,
        'categories': dict(category_stats),
        'timeline': timeline_list,
        'recent_purchases': recent_purchases,
        'top_categories': top_categories,
        'avg_decision_time': avg_decision_time / 1000 if avg_decision_time else 0  # Convert to seconds
    })


@app.route('/api/log-purchase', methods=['POST'])
def log_purchase():
    """Log a purchase attempt from the Chrome extension"""
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO purchase_attempts 
        (timestamp, category, price, item_description, outcome, url, domain, session_id, decision_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('timestamp', int(datetime.now().timestamp() * 1000)),
        data.get('category', 'Other'),
        data.get('price', 0),
        data.get('description', 'Unknown Item'),
        data.get('outcome', 'pending'),
        data.get('url', ''),
        data.get('domain', ''),
        data.get('sessionId', ''),
        data.get('decisionTime', None)
    ))
    
    conn.commit()
    purchase_id = cursor.lastrowid
    conn.close()
    
    print(f"✅ Logged purchase attempt #{purchase_id}: {data.get('category')} - ${data.get('price')}")
    
    return jsonify({'success': True, 'id': purchase_id})


@app.route('/api/update-outcome', methods=['POST'])
def update_outcome():
    """Update the outcome of a purchase attempt"""
    data = request.json
    purchase_id = data.get('id')
    outcome = data.get('outcome')
    decision_time = data.get('decisionTime')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE purchase_attempts 
        SET outcome = ?, decision_time = ?
        WHERE id = ?
    ''', (outcome, decision_time, purchase_id))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Updated purchase #{purchase_id} outcome: {outcome}")
    
    return jsonify({'success': True})


@app.route('/api/sync-extension-data', methods=['POST'])
def sync_extension_data():
    """
    Sync data from Chrome extension stats.json format
    This endpoint handles the old stats.json format and converts it
    """
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Process recentBattles from extension
    if 'recentBattles' in data:
        for battle in data['recentBattles']:
            # Check if this timestamp already exists
            cursor.execute('SELECT id FROM purchase_attempts WHERE timestamp = ?', (battle['timestamp'],))
            if cursor.fetchone():
                continue  # Skip duplicates
            
            # Categorize based on item description
            category = categorize_item(battle.get('item', 'Unknown Item'))
            
            cursor.execute('''
                INSERT INTO purchase_attempts 
                (timestamp, category, price, item_description, outcome, url, domain, session_id, decision_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                battle['timestamp'],
                category,
                battle['amount'],
                battle['item'],
                battle['result'],  # 'defeat' or 'victory'
                '',
                '',
                '',
                None
            ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Synced {len(data.get('recentBattles', []))} battles from extension")
    
    return jsonify({'success': True})


def categorize_item(description):
    """Categorize item based on description"""
    ITEM_CATEGORIES = {
        'Electronics': ['phone', 'iphone', 'laptop', 'computer', 'tablet', 'headphones', 'camera', 'watch', 'gaming', 'tech'],
        'Fashion': ['clothes', 'shirt', 'pants', 'jeans', 'shoes', 'dress', 'jacket', 'bag', 'jewelry'],
        'Food & Dining': ['food', 'restaurant', 'pizza', 'burger', 'coffee', 'meal', 'drinks'],
        'Entertainment': ['movie', 'game', 'subscription', 'netflix', 'spotify', 'concert', 'tickets'],
        'Home & Garden': ['furniture', 'decor', 'kitchen', 'appliance', 'bedding', 'lamp'],
        'Beauty & Personal Care': ['makeup', 'skincare', 'perfume', 'shampoo', 'beauty'],
        'Fitness & Sports': ['gym', 'workout', 'fitness', 'sports', 'yoga', 'running'],
        'Toys & Hobbies': ['toy', 'lego', 'puzzle', 'game', 'hobby', 'craft'],
        'Automotive': ['car', 'auto', 'vehicle', 'tire', 'parts'],
        'Pet Supplies': ['pet', 'dog', 'cat', 'animal']
    }
    
    desc_lower = description.lower()
    for category, keywords in ITEM_CATEGORIES.items():
        if any(keyword in desc_lower for keyword in keywords):
            return category
    
    return 'Other'


@app.route('/api/category-trends', methods=['GET'])
def get_category_trends():
    """Get trending categories over time"""
    days = int(request.args.get('days', 7))
    start_timestamp = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT category, COUNT(*) as count, SUM(price) as total_value
        FROM purchase_attempts
        WHERE timestamp >= ? AND outcome = 'blocked'
        GROUP BY category
        ORDER BY count DESC
    ''', (start_timestamp,))
    
    trends = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(trends)


@app.route('/api/import-stats-json', methods=['POST'])
def import_stats_json():
    """Import data from the existing stats.json file"""
    try:
        with open('stats.json', 'r') as f:
            data = json.load(f)
        
        # Use the sync endpoint
        result = sync_extension_data()
        
        return jsonify({'success': True, 'message': 'Stats imported successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting Impulse Guard Dashboard Backend")
    print("📊 Dashboard: http://localhost:5000")
    print("🔗 API Endpoint: http://localhost:5000/api/stats")
    print("\n💡 Extension should sync data to this backend automatically")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
