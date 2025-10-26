from flask import Flask, render_template, jsonify, request
import json
import os
import plotly
import plotly.graph_objs as go
from collections import Counter

app = Flask(__name__)

# Path to stats file - can be updated by Chrome extension
STATS_FILE = os.path.join(os.path.dirname(__file__), 'stats.json')

# Purchase categories for classification
CATEGORIES = {
    'electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker', 'tv', 'camera', 'watch', 'ipad', 'airpods', 'gaming', 'console'],
    'fashion': ['clothes', 'shirt', 'pants', 'shoes', 'dress', 'jacket', 'sneakers', 'boots', 'bag', 'accessories', 'jewelry', 'watch'],
    'food': ['food', 'restaurant', 'pizza', 'burger', 'coffee', 'snacks', 'delivery', 'takeout', 'meal', 'drinks'],
    'entertainment': ['movie', 'game', 'subscription', 'netflix', 'spotify', 'concert', 'tickets', 'streaming', 'music', 'book'],
    'home': ['furniture', 'decor', 'kitchen', 'appliance', 'bedding', 'lamp', 'chair', 'table', 'couch', 'sofa'],
    'beauty': ['makeup', 'skincare', 'cosmetics', 'perfume', 'shampoo', 'beauty', 'hair', 'nails'],
    'fitness': ['gym', 'workout', 'fitness', 'sports', 'equipment', 'yoga', 'running', 'bike'],
    'other': []
}

def categorize_purchase(description):
    """Categorize a purchase based on description"""
    if not description:
        return 'other'
    
    description_lower = description.lower()
    for category, keywords in CATEGORIES.items():
        if category == 'other':
            continue
        for keyword in keywords:
            if keyword in description_lower:
                return category
    return 'other'

def get_stats():
    """Read stats from JSON file (updated by Chrome extension)"""
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, 'r') as f:
            return json.load(f)
    return {
        'totalBattles': 0,
        'victories': 0,
        'defeats': 0,
        'moneySaved': 0,
        'savingsHistory': [],
        'recentBattles': []
    }

def save_stats(stats):
    """Save stats to JSON file"""
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f, indent=2)

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/stats')
def api_stats():
    """API endpoint to get statistics"""
    stats = get_stats()
    
    # Calculate additional metrics
    win_rate = 0
    if stats['totalBattles'] > 0:
        # Defeats = user gave up = money saved = "win" for the guardian
        win_rate = (stats['defeats'] / stats['totalBattles']) * 100
    
    stats['winRate'] = round(win_rate, 1)
    
    return jsonify(stats)

@app.route('/api/category-chart')
def category_chart():
    """API endpoint to get Plotly radar chart data for purchase categories"""
    stats = get_stats()
    
    # Categorize all purchases
    category_counts = Counter()
    category_amounts = Counter()
    
    for battle in stats.get('recentBattles', []):
        # Get description from battle data (if available), otherwise use generic
        description = battle.get('description', battle.get('item', ''))
        category = categorize_purchase(description)
        
        category_counts[category] += 1
        if battle['result'] == 'victory':  # Purchases made
            category_amounts[category] += battle.get('amount', 0)
    
    # Ensure all categories are present
    all_categories = ['Electronics', 'Fashion', 'Food', 'Entertainment', 'Home', 'Beauty', 'Fitness', 'Other']
    category_keys = ['electronics', 'fashion', 'food', 'entertainment', 'home', 'beauty', 'fitness', 'other']
    
    counts = [category_counts.get(key, 0) for key in category_keys]
    amounts = [category_amounts.get(key, 0) for key in category_keys]
    
    # Create radar chart
    fig = go.Figure()
    
    # Add purchase frequency trace
    fig.add_trace(go.Scatterpolar(
        r=counts,
        theta=all_categories,
        fill='toself',
        name='Purchase Frequency',
        line=dict(color='#00d4ff', width=2),
        fillcolor='rgba(0, 212, 255, 0.3)'
    ))
    
    # Add spending amount trace (normalized to 0-max scale)
    max_amount = max(amounts) if amounts and max(amounts) > 0 else 1
    normalized_amounts = [a / max_amount * max(counts) if max(counts) > 0 else 0 for a in amounts]
    
    fig.add_trace(go.Scatterpolar(
        r=normalized_amounts,
        theta=all_categories,
        fill='toself',
        name='Spending Amount',
        line=dict(color='#ed8936', width=2),
        fillcolor='rgba(237, 137, 54, 0.3)'
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, max(counts + normalized_amounts) * 1.1] if counts or normalized_amounts else [0, 10],
                tickfont=dict(family='Tahoma', size=10),
                gridcolor='#e2e8f0'
            ),
            angularaxis=dict(
                tickfont=dict(family='Tahoma', size=11, color='#4a5568'),
                gridcolor='#e2e8f0'
            ),
            bgcolor='rgba(255,255,255,0)',
            domain=dict(x=[0.05, 0.95], y=[0.05, 0.95])  # Center the polar plot
        ),
        showlegend=True,
        legend=dict(
            font=dict(family='Tahoma', size=11),
            orientation='h',
            yanchor='bottom',
            y=-0.15,
            xanchor='center',
            x=0.5
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family='Tahoma', size=12),
        height=500,
        margin=dict(l=80, r=80, t=40, b=80),
        autosize=True
    )
    
    return jsonify(plotly.io.to_json(fig))

@app.route('/api/category-stats')
def category_stats():
    """API endpoint to get category breakdown statistics"""
    stats = get_stats()
    
    # Categorize all purchases
    category_data = {}
    
    for category_key in ['electronics', 'fashion', 'food', 'entertainment', 'home', 'beauty', 'fitness', 'other']:
        category_data[category_key] = {
            'total': 0,
            'purchased': 0,
            'resisted': 0,
            'amount_spent': 0,
            'amount_saved': 0
        }
    
    for battle in stats.get('recentBattles', []):
        description = battle.get('description', battle.get('item', ''))
        category = categorize_purchase(description)
        amount = battle.get('amount', 0)
        
        category_data[category]['total'] += 1
        
        if battle['result'] == 'victory':  # Purchase made
            category_data[category]['purchased'] += 1
            category_data[category]['amount_spent'] += amount
        else:  # Resisted
            category_data[category]['resisted'] += 1
            category_data[category]['amount_saved'] += amount
    
    return jsonify(category_data)

@app.route('/api/update', methods=['POST'])
def update_stats():
    """API endpoint to update statistics from Chrome extension"""
    try:
        new_stats = request.get_json()
        save_stats(new_stats)
        return jsonify({'success': True, 'message': 'Stats updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    # Create stats file if it doesn't exist
    if not os.path.exists(STATS_FILE):
        save_stats(get_stats())
    
    print("🚀 Dashboard starting on http://localhost:5000")
    print("📊 Open your browser to view the dashboard!")
    print("🔗 Link this dashboard from your Chrome extension stats page")
    app.run(debug=True, host='0.0.0.0', port=5000)
