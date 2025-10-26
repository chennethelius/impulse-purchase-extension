import json
import random
from datetime import datetime, timedelta

# Sample purchase descriptions by category
SAMPLE_ITEMS = {
    'electronics': ['New iPhone 15', 'Gaming headphones', 'Laptop upgrade', 'Smart watch', 'Wireless earbuds', 'iPad Pro', 'Gaming console'],
    'fashion': ['Designer sneakers', 'Leather jacket', 'New jeans', 'Designer bag', 'Summer dress', 'Running shoes', 'Casual shirt'],
    'food': ['Uber Eats order', 'Late night pizza', 'Coffee subscription', 'Restaurant dinner', 'DoorDash snacks', 'Gourmet meal'],
    'entertainment': ['Netflix subscription', 'Concert tickets', 'New video game', 'Movie tickets', 'Spotify Premium', 'Book collection'],
    'home': ['New couch', 'Kitchen appliance', 'Decorative lamp', 'Throw pillows', 'Coffee table', 'Wall art'],
    'beauty': ['Makeup palette', 'Skincare set', 'Hair products', 'Perfume', 'Nail polish set'],
    'fitness': ['Gym membership', 'Yoga mat', 'Fitness tracker', 'Running shoes', 'Workout clothes'],
}

def generate_recent_battles(total_battles, victories, defeats, money_saved):
    """Generate recent battles with categories"""
    battles = []
    
    # Calculate average amounts
    avg_saved = money_saved / defeats if defeats > 0 else 50
    
    # Generate battles
    base_time = datetime.now()
    
    for i in range(total_battles):
        # Randomly decide if victory or defeat
        is_victory = i < victories
        
        # Pick a random category and item
        category = random.choice(list(SAMPLE_ITEMS.keys()))
        item = random.choice(SAMPLE_ITEMS[category])
        
        # Generate amount
        if is_victory:
            amount = 0  # Purchased items don't add to savings
        else:
            amount = random.uniform(avg_saved * 0.5, avg_saved * 1.5)
        
        battle = {
            'result': 'victory' if is_victory else 'defeat',
            'amount': round(amount, 2),
            'timestamp': int((base_time - timedelta(days=total_battles - i)).timestamp() * 1000),
            'description': item,
            'item': item
        }
        
        battles.append(battle)
    
    return battles

# Load current stats
with open('stats.json', 'r') as f:
    stats = json.load(f)

# Add recentBattles with categories
stats['recentBattles'] = generate_recent_battles(
    stats['totalBattles'],
    stats['victories'],
    stats['defeats'],
    stats['moneySaved']
)

# Save updated stats
with open('stats.json', 'w') as f:
    json.dump(stats, f, indent=2)

print(f"✅ Added {len(stats['recentBattles'])} purchases with categories!")
print(f"📊 Categories distribution:")
from collections import Counter
categories = [battle.get('description', '').split()[0] for battle in stats['recentBattles']]
for cat, count in Counter(categories).most_common():
    print(f"   {cat}: {count}")
