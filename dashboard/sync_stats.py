"""
Sync script to update dashboard stats from Chrome extension storage.
This script reads from Chrome's local storage and writes to stats.json.
"""

import json
import os
import sys

# Path to stats file
STATS_FILE = os.path.join(os.path.dirname(__file__), 'stats.json')

def sync_from_extension_data(extension_stats):
    """
    Update stats.json with data from Chrome extension
    
    Expected format:
    {
        'totalBattles': int,
        'victories': int,
        'defeats': int,
        'moneySaved': float,
        'savingsHistory': list,
        'recentBattles': list
    }
    """
    try:
        # Read current stats
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE, 'r') as f:
                current_stats = json.load(f)
        else:
            current_stats = {
                'totalBattles': 0,
                'victories': 0,
                'defeats': 0,
                'moneySaved': 0,
                'savingsHistory': [],
                'recentBattles': []
            }
        
        # Merge with new data
        current_stats.update(extension_stats)
        
        # Write back to file
        with open(STATS_FILE, 'w') as f:
            json.dump(current_stats, f, indent=2)
        
        print(f"✅ Stats synced successfully!")
        print(f"📊 Total Battles: {current_stats['totalBattles']}")
        print(f"💰 Money Saved: ${current_stats['moneySaved']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error syncing stats: {e}")
        return False

def read_stats():
    """Read and return current stats"""
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, 'r') as f:
            return json.load(f)
    return None

if __name__ == '__main__':
    # Example usage
    if len(sys.argv) > 1:
        # Read stats from command line argument (JSON string)
        stats_json = sys.argv[1]
        stats = json.loads(stats_json)
        sync_from_extension_data(stats)
    else:
        # Just display current stats
        stats = read_stats()
        if stats:
            print("📊 Current Dashboard Stats:")
            print(json.dumps(stats, indent=2))
        else:
            print("No stats file found. Run a battle first!")
