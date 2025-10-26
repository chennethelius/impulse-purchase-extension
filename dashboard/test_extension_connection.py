#!/usr/bin/env python3
"""
Test script to simulate Chrome extension sending data to the Flask backend.
This simulates what happens when the extension logs purchase attempts.
"""

import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = 'http://localhost:5000'

# Sample data that mimics what the Chrome extension sends
SAMPLE_PURCHASES = [
    {
        'item_name': 'iPhone 15 Pro Max',
        'category': 'Electronics',
        'price': 1199.99,
        'url': 'https://www.apple.com/shop/buy-iphone/iphone-15-pro',
        'domain': 'apple.com',
        'outcome': 'blocked'
    },
    {
        'item_name': 'Nike Air Jordan 1 Retro High',
        'category': 'Fashion',
        'price': 179.99,
        'url': 'https://www.nike.com/t/air-jordan-1-retro-high',
        'domain': 'nike.com',
        'outcome': 'blocked'
    },
    {
        'item_name': 'Sony PlayStation 5',
        'category': 'Electronics',
        'price': 499.99,
        'url': 'https://direct.playstation.com/en-us/consoles/console/playstation5',
        'domain': 'playstation.com',
        'outcome': 'allowed'
    },
    {
        'item_name': 'Lululemon Align Leggings',
        'category': 'Fashion',
        'price': 98.00,
        'url': 'https://shop.lululemon.com/p/women-pants/Align-Pant-2',
        'domain': 'lululemon.com',
        'outcome': 'blocked'
    },
    {
        'item_name': 'Uber Eats - Thai Food Delivery',
        'category': 'Food & Dining',
        'price': 45.50,
        'url': 'https://www.ubereats.com/checkout',
        'domain': 'ubereats.com',
        'outcome': 'allowed'
    },
    {
        'item_name': 'MacBook Pro 14-inch M3',
        'category': 'Electronics',
        'price': 1999.00,
        'url': 'https://www.apple.com/shop/buy-mac/macbook-pro',
        'domain': 'apple.com',
        'outcome': 'blocked'
    },
    {
        'item_name': 'Starbucks Coffee - Venti Latte',
        'category': 'Food & Dining',
        'price': 6.45,
        'url': 'https://www.starbucks.com/menu',
        'domain': 'starbucks.com',
        'outcome': 'blocked'
    },
    {
        'item_name': 'Netflix Premium Subscription',
        'category': 'Entertainment',
        'price': 22.99,
        'url': 'https://www.netflix.com/signup/planform',
        'domain': 'netflix.com',
        'outcome': 'allowed'
    },
    {
        'item_name': 'Amazon Echo Dot (5th Gen)',
        'category': 'Electronics',
        'price': 49.99,
        'url': 'https://www.amazon.com/dp/B09B8V1LZ3',
        'domain': 'amazon.com',
        'outcome': 'blocked'
    },
    {
        'item_name': 'Sephora Ultra Glow Serum',
        'category': 'Beauty & Personal Care',
        'price': 68.00,
        'url': 'https://www.sephora.com/product/ultra-glow-serum',
        'domain': 'sephora.com',
        'outcome': 'blocked'
    }
]

def test_log_purchase(purchase_data):
    """Test logging a purchase to the backend"""
    try:
        response = requests.post(
            f'{BASE_URL}/api/log-purchase',
            json=purchase_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            print(f"✅ Logged: {purchase_data['item_name']} (${purchase_data['price']}) - {purchase_data['outcome']}")
            return True
        else:
            print(f"❌ Failed to log: {purchase_data['item_name']} - Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error logging purchase: {str(e)}")
        return False

def test_get_stats():
    """Test retrieving stats from the backend"""
    try:
        response = requests.get(f'{BASE_URL}/api/stats')
        
        if response.status_code == 200:
            stats = response.json()
            print("\n📊 Current Stats:")
            print(f"   Total Purchases: {stats.get('total_purchases', 0)}")
            print(f"   Blocked: {stats.get('blocked', 0)}")
            print(f"   Allowed: {stats.get('allowed', 0)}")
            print(f"   Money Saved: ${stats.get('money_saved', 0):.2f}")
            print(f"   Block Rate: {stats.get('block_rate', 0):.1f}%")
            return True
        else:
            print(f"❌ Failed to get stats - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting stats: {str(e)}")
        return False

def test_get_purchases():
    """Test retrieving purchase history"""
    try:
        response = requests.get(f'{BASE_URL}/api/purchases')
        
        if response.status_code == 200:
            purchases = response.json()
            print(f"\n📋 Purchase History ({len(purchases)} items):")
            for p in purchases[:5]:  # Show first 5
                print(f"   • {p['item_name']} (${p['price']}) - {p['category']} - {p['outcome']}")
            if len(purchases) > 5:
                print(f"   ... and {len(purchases) - 5} more")
            return True
        else:
            print(f"❌ Failed to get purchases - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting purchases: {str(e)}")
        return False

def test_get_categories():
    """Test retrieving category breakdown"""
    try:
        response = requests.get(f'{BASE_URL}/api/categories')
        
        if response.status_code == 200:
            categories = response.json()
            print(f"\n🏷️ Category Breakdown:")
            for cat in categories[:5]:  # Show top 5
                print(f"   • {cat['category']}: {cat['count']} items (${cat['total_price']:.2f})")
            return True
        else:
            print(f"❌ Failed to get categories - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting categories: {str(e)}")
        return False

def main():
    print("🧪 Testing Chrome Extension ↔ Dashboard Connection\n")
    print("=" * 60)
    
    # Test 1: Log sample purchases
    print("\n1️⃣ Testing Purchase Logging...")
    print("-" * 60)
    success_count = 0
    for purchase in SAMPLE_PURCHASES:
        if test_log_purchase(purchase):
            success_count += 1
    
    print(f"\n   Result: {success_count}/{len(SAMPLE_PURCHASES)} purchases logged successfully")
    
    # Test 2: Get stats
    print("\n2️⃣ Testing Stats API...")
    print("-" * 60)
    test_get_stats()
    
    # Test 3: Get purchases
    print("\n3️⃣ Testing Purchases API...")
    print("-" * 60)
    test_get_purchases()
    
    # Test 4: Get categories
    print("\n4️⃣ Testing Categories API...")
    print("-" * 60)
    test_get_categories()
    
    print("\n" + "=" * 60)
    print("✅ Connection test complete!")
    print("\n💡 Tips:")
    print("   • Chrome extension will send similar data when you try to make a purchase")
    print("   • Dashboard at http://localhost:5000 should now show this test data")
    print("   • Extension background.js syncs data automatically when storage changes")

if __name__ == '__main__':
    main()
