"""
Generate sample data for testing the dashboard
"""

import json
import random
from datetime import datetime, timedelta

def generate_sample_data():
    """Generate realistic sample battle data"""
    
    total_battles = 15
    defeats = 10  # Times user gave up and saved money
    victories = 5  # Times user purchased
    
    # Generate cumulative savings history
    savings_history = []
    current_savings = 0
    
    for i in range(total_battles):
        # Random whether this battle was a defeat (saved money)
        is_defeat = i < defeats
        
        if is_defeat:
            # Add random amount saved (between $20 and $150)
            amount_saved = random.uniform(20, 150)
            current_savings += amount_saved
        
        savings_history.append(round(current_savings, 2))
    
    # Generate recent battles with timestamps
    recent_battles = []
    base_time = datetime.now()
    
    for i in range(total_battles):
        is_victory = i % 3 == 0  # Every 3rd battle is a victory
        
        if is_victory:
            battle = {
                'result': 'victory',
                'amount': 0,
                'timestamp': int((base_time - timedelta(hours=total_battles - i)).timestamp() * 1000)
            }
        else:
            amount = random.uniform(20, 150)
            battle = {
                'result': 'defeat',
                'amount': round(amount, 2),
                'timestamp': int((base_time - timedelta(hours=total_battles - i)).timestamp() * 1000)
            }
        
        recent_battles.append(battle)
    
    stats = {
        'totalBattles': total_battles,
        'victories': victories,
        'defeats': defeats,
        'moneySaved': round(current_savings, 2),
        'savingsHistory': savings_history,
        'recentBattles': recent_battles
    }
    
    return stats

if __name__ == '__main__':
    import os
    
    # Generate sample data
    sample_stats = generate_sample_data()
    
    # Write to stats.json
    stats_file = os.path.join(os.path.dirname(__file__), 'stats.json')
    with open(stats_file, 'w') as f:
        json.dump(sample_stats, f, indent=2)
    
    print("✅ Sample data generated!")
    print(f"📊 Total Battles: {sample_stats['totalBattles']}")
    print(f"🏆 Victories: {sample_stats['victories']}")
    print(f"🛡️ Defeats: {sample_stats['defeats']}")
    print(f"💰 Money Saved: ${sample_stats['moneySaved']:.2f}")
    print(f"\nRun 'python app.py' to view the dashboard!")
