"""
Import existing stats.json data into the new backend database
"""

import json
import sqlite3
from datetime import datetime

# Load stats.json
with open('stats.json', 'r') as f:
    data = json.load(f)

# Connect to database
conn = sqlite3.connect('impulse_data.db')
cursor = conn.cursor()

# Category mapping
def categorize_item(description):
    """Categorize item based on description"""
    ITEM_CATEGORIES = {
        'Electronics': ['phone', 'iphone', 'laptop', 'computer', 'tablet', 'headphones', 'camera', 'watch', 'gaming', 'tech', 'checkout'],
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
    
    return 'Shopping'

# Import recent battles
imported_count = 0
if 'recentBattles' in data:
    for battle in data['recentBattles']:
        # Check if already exists
        cursor.execute('SELECT id FROM purchase_attempts WHERE timestamp = ?', (battle['timestamp'],))
        if cursor.fetchone():
            print(f"⏭️  Skipping duplicate: {battle['timestamp']}")
            continue
        
        category = categorize_item(battle.get('item', 'Unknown Item'))
        outcome = 'blocked' if battle['result'] == 'defeat' else 'allowed'
        
        cursor.execute('''
            INSERT INTO purchase_attempts 
            (timestamp, category, price, item_description, outcome, url, domain, session_id, decision_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            battle['timestamp'],
            category,
            battle['amount'],
            battle.get('item', 'Unknown Item'),
            outcome,
            '',
            '',
            '',
            None
        ))
        
        imported_count += 1
        print(f"✅ Imported: {category} - ${battle['amount']} ({outcome})")

conn.commit()
conn.close()

print(f"\n🎉 Successfully imported {imported_count} purchase attempts!")
print(f"💰 Total money saved: ${data.get('moneySaved', 0):.2f}")
print(f"🛡️ Total defeats: {data.get('defeats', 0)}")
print(f"📊 View dashboard at: http://localhost:5000")
