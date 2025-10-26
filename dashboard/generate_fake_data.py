import json
import random
from datetime import datetime, timedelta

# Generate comprehensive fake stats
stats_data = {
    "totalBattles": 156,
    "victories": 98,
    "defeats": 58,
    "moneySaved": 12847.53,
    "savingsHistory": [
        0, 45.99, 89.98, 199.97, 299.96, 449.95, 549.94, 749.93, 899.92, 1149.91,
        1299.90, 1449.89, 1699.88, 1899.87, 2099.86, 2349.85, 2549.84, 2849.83, 3149.82, 3449.81,
        3749.80, 4049.79, 4349.78, 4749.77, 5149.76, 5549.75, 5949.74, 6349.73, 6749.72, 7149.71,
        7549.70, 7949.69, 8349.68, 8749.67, 9149.66, 9549.65, 9949.64, 10349.63, 10749.62, 11149.61,
        11549.60, 11949.59, 12347.53
    ],
    "recentBattles": [
        {
            "timestamp": 1729875600000,
            "item": "Wireless Gaming Mouse RGB",
            "description": "Premium gaming peripheral with customizable buttons",
            "amount": 79.99,
            "result": "victory",
            "aiReason": "You already own 3 gaming mice. This purchase appears to be impulse-driven.",
            "decisionTime": 45000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729862000000,
            "item": "Vintage Band T-Shirt",
            "description": "Limited edition concert merchandise",
            "amount": 34.99,
            "result": "defeat",
            "aiReason": "User insisted it's a collector's item",
            "decisionTime": 180000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729848400000,
            "item": "Smart Home LED Strip 16ft",
            "description": "RGB ambient lighting with app control",
            "amount": 45.99,
            "result": "victory",
            "aiReason": "You have 2 unopened LED strips in your closet. Let's use those first!",
            "decisionTime": 32000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729834800000,
            "item": "Mechanical Keyboard Kit",
            "description": "Custom RGB mechanical keyboard with hot-swap switches",
            "amount": 159.99,
            "result": "victory",
            "aiReason": "Your current keyboard works perfectly. This is a luxury, not a necessity.",
            "decisionTime": 67000,
            "difficulty": "hard"
        },
        {
            "timestamp": 1729821200000,
            "item": "Gourmet Coffee Subscription",
            "description": "Monthly artisan coffee delivery",
            "amount": 29.99,
            "result": "defeat",
            "aiReason": "User presented valid argument about daily caffeine needs",
            "decisionTime": 120000,
            "difficulty": "easy"
        },
        {
            "timestamp": 1729807600000,
            "item": "Bestselling Mystery Novel Set",
            "description": "3-book thriller series bundle",
            "amount": 42.99,
            "result": "victory",
            "aiReason": "Your reading backlog has 12 unread books. Finish those first!",
            "decisionTime": 28000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729794000000,
            "item": "Designer Sunglasses",
            "description": "Polarized UV protection eyewear",
            "amount": 189.99,
            "result": "victory",
            "aiReason": "You own 4 pairs of sunglasses already. This is excessive spending.",
            "decisionTime": 89000,
            "difficulty": "extreme"
        },
        {
            "timestamp": 1729780400000,
            "item": "Fitness Smartwatch",
            "description": "Heart rate, GPS, sleep tracking",
            "amount": 249.99,
            "result": "defeat",
            "aiReason": "User demonstrated health tracking goals and research",
            "decisionTime": 240000,
            "difficulty": "hard"
        },
        {
            "timestamp": 1729766800000,
            "item": "Artisan Cheese Board Set",
            "description": "Bamboo serving board with knife set",
            "amount": 38.99,
            "result": "victory",
            "aiReason": "You rarely host gatherings. This would collect dust.",
            "decisionTime": 41000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729753200000,
            "item": "Limited Edition Sneakers",
            "description": "Exclusive colorway athletic shoes",
            "amount": 220.00,
            "result": "victory",
            "aiReason": "These will just sit in the box. You prefer your current running shoes.",
            "decisionTime": 95000,
            "difficulty": "extreme"
        },
        {
            "timestamp": 1729739600000,
            "item": "Portable Bluetooth Speaker",
            "description": "Waterproof outdoor audio device",
            "amount": 69.99,
            "result": "defeat",
            "aiReason": "User provided evidence of upcoming camping trip",
            "decisionTime": 156000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729726000000,
            "item": "Succulent Plant Collection",
            "description": "5 decorative mini cacti with pots",
            "amount": 24.99,
            "result": "victory",
            "aiReason": "Your last 3 plants didn't survive. Let's work on that first.",
            "decisionTime": 22000,
            "difficulty": "easy"
        },
        {
            "timestamp": 1729712400000,
            "item": "Premium Noise-Cancelling Headphones",
            "description": "Over-ear wireless ANC headphones",
            "amount": 349.99,
            "result": "victory",
            "aiReason": "Your current headphones work fine. This is an upgrade you don't need.",
            "decisionTime": 112000,
            "difficulty": "extreme"
        },
        {
            "timestamp": 1729698800000,
            "item": "Instant Camera Bundle",
            "description": "Polaroid-style camera with film pack",
            "amount": 89.99,
            "result": "defeat",
            "aiReason": "User showed creative project plans",
            "decisionTime": 198000,
            "difficulty": "normal"
        },
        {
            "timestamp": 1729685200000,
            "item": "Craft Beer Brewing Kit",
            "description": "Home brewing starter set",
            "amount": 124.99,
            "result": "victory",
            "aiReason": "You tried homebrewing last year and gave up. Remember that?",
            "decisionTime": 73000,
            "difficulty": "hard"
        }
    ],
    "weeklyStats": {
        "Monday": {"battles": 18, "victories": 11, "defeats": 7, "saved": 1245.87},
        "Tuesday": {"battles": 25, "victories": 16, "defeats": 9, "saved": 1987.43},
        "Wednesday": {"battles": 22, "victories": 14, "defeats": 8, "saved": 1756.29},
        "Thursday": {"battles": 28, "victories": 18, "defeats": 10, "saved": 2234.56},
        "Friday": {"battles": 31, "victories": 19, "defeats": 12, "saved": 2543.78},
        "Saturday": {"battles": 19, "victories": 12, "defeats": 7, "saved": 1634.32},
        "Sunday": {"battles": 13, "victories": 8, "defeats": 5, "saved": 1445.28}
    },
    "categoryStats": {
        "Electronics": {"attempts": 34, "blocked": 21, "spent": 1245.67, "saved": 3456.89},
        "Fashion": {"attempts": 28, "blocked": 18, "spent": 876.54, "saved": 2234.78},
        "Food & Dining": {"attempts": 22, "blocked": 12, "spent": 432.89, "saved": 567.43},
        "Entertainment": {"attempts": 19, "blocked": 13, "spent": 234.56, "saved": 789.23},
        "Fitness & Sports": {"attempts": 15, "blocked": 10, "spent": 345.78, "saved": 1234.56},
        "Home & Garden": {"attempts": 12, "blocked": 8, "spent": 567.89, "saved": 890.45},
        "Beauty & Personal Care": {"attempts": 11, "blocked": 7, "spent": 234.67, "saved": 678.90},
        "Toys & Hobbies": {"attempts": 9, "blocked": 6, "spent": 345.23, "saved": 890.12},
        "Pet Supplies": {"attempts": 6, "blocked": 3, "spent": 123.45, "saved": 345.67}
    },
    "monthlyTrend": [
        {"month": "April", "saved": 1234.56, "battles": 23, "winRate": 65},
        {"month": "May", "saved": 2345.67, "battles": 31, "winRate": 68},
        {"month": "June", "saved": 1987.43, "battles": 27, "winRate": 61},
        {"month": "July", "saved": 2678.90, "battles": 35, "winRate": 71},
        {"month": "August", "saved": 2456.78, "battles": 29, "winRate": 66},
        {"month": "September", "saved": 2144.19, "battles": 25, "winRate": 63}
    ],
    "streaks": {
        "current": 7,
        "longest": 15,
        "currentType": "victory"
    },
    "achievements": [
        {
            "id": "first_victory",
            "name": "First Victory",
            "description": "Won your first battle against impulse",
            "icon": "🏆",
            "unlocked": True,
            "date": 1729685200000
        },
        {
            "id": "save_1k",
            "name": "Thrifty Guardian",
            "description": "Saved $1,000 total",
            "icon": "💰",
            "unlocked": True,
            "date": 1729698800000
        },
        {
            "id": "save_10k",
            "name": "Savings Master",
            "description": "Saved $10,000 total",
            "icon": "💎",
            "unlocked": True,
            "date": 1729807600000
        },
        {
            "id": "streak_10",
            "name": "Unstoppable",
            "description": "10 victories in a row",
            "icon": "🔥",
            "unlocked": True,
            "date": 1729780400000
        },
        {
            "id": "battles_100",
            "name": "Veteran Guardian",
            "description": "Completed 100 battles",
            "icon": "⚔️",
            "unlocked": True,
            "date": 1729821200000
        },
        {
            "id": "save_electronics",
            "name": "Tech Restraint",
            "description": "Blocked 20 electronics purchases",
            "icon": "📱",
            "unlocked": True,
            "date": 1729753200000
        }
    ],
    "aiPerformance": {
        "averageResponseTime": 67.5,
        "totalArgumentsPresented": 432,
        "persuasionSuccessRate": 62.8,
        "mostEffectiveReason": "You already own similar items",
        "commonUserExcuses": [
            "It's on sale!",
            "I need it for work",
            "It's a limited edition",
            "Everyone has one",
            "I deserve a treat"
        ]
    },
    "timePatterns": {
        "mostDangerousHour": "22:00",
        "safestHour": "09:00",
        "weekendRisk": 1.8,
        "lateNightRisk": 2.3
    }
}

# Save stats
with open('stats.json', 'w') as f:
    json.dump(stats_data, f, indent=2)

print("✅ Generated rich stats.json with comprehensive fake data!")
print(f"   - {stats_data['totalBattles']} total battles")
print(f"   - ${stats_data['moneySaved']:.2f} saved")
print(f"   - {stats_data['victories']} victories, {stats_data['defeats']} defeats")
print(f"   - {len(stats_data['recentBattles'])} recent battles")
print(f"   - {len(stats_data['achievements'])} achievements unlocked")
