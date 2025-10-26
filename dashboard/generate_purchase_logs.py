import json
import random
from datetime import datetime, timedelta

# Product catalog for realistic data
products = [
    # Electronics
    {"name": "Wireless Gaming Mouse RGB", "category": "Electronics", "price": 79.99, "domain": "amazon.com"},
    {"name": "Mechanical Keyboard Cherry MX", "category": "Electronics", "price": 159.99, "domain": "newegg.com"},
    {"name": "iPhone 15 Pro Max 256GB", "category": "Electronics", "price": 1199.99, "domain": "apple.com"},
    {"name": "Samsung Galaxy Buds Pro", "category": "Electronics", "price": 149.99, "domain": "samsung.com"},
    {"name": "iPad Air 11-inch", "category": "Electronics", "price": 599.99, "domain": "apple.com"},
    {"name": "Sony WH-1000XM5 Headphones", "category": "Electronics", "price": 349.99, "domain": "bestbuy.com"},
    {"name": "Nintendo Switch OLED", "category": "Electronics", "price": 349.99, "domain": "nintendo.com"},
    {"name": "4K Webcam for Streaming", "category": "Electronics", "price": 129.99, "domain": "amazon.com"},
    {"name": "Portable SSD 2TB", "category": "Electronics", "price": 189.99, "domain": "amazon.com"},
    {"name": "Smart Display 10-inch", "category": "Electronics", "price": 149.99, "domain": "amazon.com"},
    
    # Fashion
    {"name": "Designer Leather Jacket", "category": "Fashion", "price": 449.99, "domain": "nordstrom.com"},
    {"name": "Nike Air Max Sneakers", "category": "Fashion", "price": 129.99, "domain": "nike.com"},
    {"name": "Cashmere Sweater", "category": "Fashion", "price": 189.99, "domain": "jcrew.com"},
    {"name": "Ray-Ban Aviator Sunglasses", "category": "Fashion", "price": 169.99, "domain": "sunglasshut.com"},
    {"name": "Limited Edition Sneakers", "category": "Fashion", "price": 220.00, "domain": "stockx.com"},
    {"name": "Vintage Band T-Shirt", "category": "Fashion", "price": 34.99, "domain": "etsy.com"},
    {"name": "Designer Backpack", "category": "Fashion", "price": 299.99, "domain": "coach.com"},
    {"name": "Silk Scarf", "category": "Fashion", "price": 89.99, "domain": "nordstrom.com"},
    
    # Food & Dining
    {"name": "Gourmet Coffee Subscription", "category": "Food & Dining", "price": 29.99, "domain": "bluebottle.com"},
    {"name": "Domino's Large Pizza Combo", "category": "Food & Dining", "price": 18.99, "domain": "dominos.com"},
    {"name": "Starbucks Gift Card $50", "category": "Food & Dining", "price": 50.00, "domain": "starbucks.com"},
    {"name": "Meal Kit Subscription Box", "category": "Food & Dining", "price": 69.99, "domain": "hellofresh.com"},
    {"name": "Artisan Cheese Collection", "category": "Food & Dining", "price": 45.99, "domain": "murrayscheese.com"},
    {"name": "Organic Tea Sampler", "category": "Food & Dining", "price": 24.99, "domain": "davidstea.com"},
    
    # Entertainment
    {"name": "Netflix Premium 3 Months", "category": "Entertainment", "price": 59.97, "domain": "netflix.com"},
    {"name": "Spotify Premium Year", "category": "Entertainment", "price": 119.88, "domain": "spotify.com"},
    {"name": "PlayStation Plus 12 Months", "category": "Entertainment", "price": 59.99, "domain": "playstation.com"},
    {"name": "Concert Tickets Premium", "category": "Entertainment", "price": 299.00, "domain": "ticketmaster.com"},
    {"name": "Bestselling Novel Set", "category": "Entertainment", "price": 42.99, "domain": "amazon.com"},
    {"name": "Blu-ray Movie Collection", "category": "Entertainment", "price": 79.99, "domain": "amazon.com"},
    
    # Fitness & Sports
    {"name": "Fitness Smartwatch", "category": "Fitness & Sports", "price": 249.99, "domain": "fitbit.com"},
    {"name": "Yoga Mat Premium", "category": "Fitness & Sports", "price": 45.00, "domain": "lululemon.com"},
    {"name": "Running Shoes Trail Edition", "category": "Fitness & Sports", "price": 119.99, "domain": "nike.com"},
    {"name": "Gym Membership 3 Months", "category": "Fitness & Sports", "price": 149.99, "domain": "planetfitness.com"},
    {"name": "Resistance Bands Set", "category": "Fitness & Sports", "price": 29.99, "domain": "amazon.com"},
    {"name": "Protein Powder 5lb", "category": "Fitness & Sports", "price": 59.99, "domain": "bodybuilding.com"},
    
    # Home & Garden
    {"name": "Smart Home LED Strip 16ft", "category": "Home & Garden", "price": 45.99, "domain": "amazon.com"},
    {"name": "Instant Pot Pressure Cooker", "category": "Home & Garden", "price": 89.99, "domain": "target.com"},
    {"name": "Succulent Plant Collection", "category": "Home & Garden", "price": 24.99, "domain": "thesill.com"},
    {"name": "Artisan Cheese Board Set", "category": "Home & Garden", "price": 38.99, "domain": "williams-sonoma.com"},
    {"name": "Robot Vacuum Cleaner", "category": "Home & Garden", "price": 299.99, "domain": "amazon.com"},
    {"name": "Air Purifier HEPA Filter", "category": "Home & Garden", "price": 179.99, "domain": "dyson.com"},
    
    # Beauty & Personal Care
    {"name": "Fenty Beauty Foundation", "category": "Beauty & Personal Care", "price": 38.00, "domain": "sephora.com"},
    {"name": "Luxury Skincare Set", "category": "Beauty & Personal Care", "price": 149.99, "domain": "sephora.com"},
    {"name": "Electric Toothbrush Premium", "category": "Beauty & Personal Care", "price": 129.99, "domain": "oralb.com"},
    {"name": "Perfume Designer Fragrance", "category": "Beauty & Personal Care", "price": 89.99, "domain": "macys.com"},
    {"name": "Hair Styling Tool Set", "category": "Beauty & Personal Care", "price": 199.99, "domain": "dyson.com"},
    
    # Toys & Hobbies
    {"name": "LEGO Star Wars UCS Set", "category": "Toys & Hobbies", "price": 399.99, "domain": "lego.com"},
    {"name": "Board Game Collection", "category": "Toys & Hobbies", "price": 89.99, "domain": "amazon.com"},
    {"name": "Instant Camera Bundle", "category": "Toys & Hobbies", "price": 89.99, "domain": "fujifilm.com"},
    {"name": "Craft Beer Brewing Kit", "category": "Toys & Hobbies", "price": 124.99, "domain": "northernbrewer.com"},
    {"name": "Painting Supplies Set", "category": "Toys & Hobbies", "price": 79.99, "domain": "dickblick.com"},
    
    # Pet Supplies
    {"name": "Dog Food Premium 30lb", "category": "Pet Supplies", "price": 54.99, "domain": "chewy.com"},
    {"name": "Cat Tree Deluxe", "category": "Pet Supplies", "price": 149.99, "domain": "chewy.com"},
    {"name": "Automatic Pet Feeder", "category": "Pet Supplies", "price": 79.99, "domain": "amazon.com"},
    
    # Automotive
    {"name": "Car Dash Cam 4K", "category": "Automotive", "price": 129.99, "domain": "bestbuy.com"},
    {"name": "Ceramic Brake Pads", "category": "Automotive", "price": 65.00, "domain": "rockauto.com"},
    {"name": "Car Detailing Kit Pro", "category": "Automotive", "price": 89.99, "domain": "autozone.com"}
]

# AI reasons for blocking
victory_reasons = [
    "You already own similar items. This is duplicate spending.",
    "Your current version works perfectly fine. No need to upgrade.",
    "You have {count} unopened items in this category. Use those first!",
    "This purchase doesn't align with your stated financial goals.",
    "You tried this hobby before and didn't stick with it. Remember?",
    "Your wishlist shows this has been there for 3 days. That's impulse territory.",
    "You rarely use items like this. It would collect dust.",
    "This is a luxury purchase that can wait until your next milestone.",
    "The reviews show buyers regret this purchase often.",
    "You can achieve the same result with what you already have.",
    "This is 40% more than your usual spending in this category.",
    "Your budget shows you're close to your monthly limit.",
    "Research shows 70% of buyers don't use this after one month.",
    "You browsed this for only 2 minutes. That's not enough research time.",
    "This item has been on sale 5 times in the last 3 months. Wait for a better deal."
]

defeat_reasons = [
    "User presented detailed research and comparison",
    "User demonstrated genuine need with evidence",
    "Purchase aligns with user's stated health goals",
    "User showed this would replace broken/worn item",
    "Gift for family member with specific needs shown",
    "User provided budget justification and savings plan",
    "Limited time offer validated as genuine",
    "Work requirement documented with proof",
    "User successfully argued necessity over want",
    "Purchase would save money long-term with calculations shown"
]

# Generate 120 purchase logs spanning last 6 months
logs = []
base_time = datetime.now()
session_id = 0

for i in range(120):
    # Random time in last 6 months
    days_ago = random.randint(0, 180)
    hours_ago = random.randint(0, 23)
    minutes_ago = random.randint(0, 59)
    
    timestamp = base_time - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    timestamp_ms = int(timestamp.timestamp() * 1000)
    
    # Random product
    product = random.choice(products)
    
    # Decision time (10 seconds to 5 minutes)
    decision_time = random.randint(10000, 300000)
    
    # Outcome - 62% victory rate
    outcome = "blocked" if random.random() < 0.62 else "allowed"
    
    log = {
        "description": product["name"],
        "category": product["category"],
        "price": product["price"],
        "url": f"https://{product['domain']}/product/{i}",
        "timestamp": timestamp_ms,
        "domain": product["domain"],
        "attemptTimestamp": timestamp_ms,
        "outcome": outcome,
        "outcomeTimestamp": timestamp_ms + decision_time,
        "decisionTime": decision_time,
        "sessionId": f"session_{session_id}",
        "aiReason": random.choice(victory_reasons if outcome == "blocked" else defeat_reasons),
        "difficulty": random.choice(["easy", "normal", "normal", "hard", "extreme"])
    }
    
    logs.append(log)
    
    # New session every 5-10 purchases
    if i % random.randint(5, 10) == 0:
        session_id += 1

# Sort by timestamp (newest first)
logs.sort(key=lambda x: x["timestamp"], reverse=True)

# Save logs
with open('purchase_logs.json', 'w') as f:
    json.dump(logs, f, indent=2)

print("✅ Generated rich purchase_logs.json with comprehensive fake data!")
print(f"   - {len(logs)} purchase attempts")
print(f"   - {sum(1 for l in logs if l['outcome'] == 'blocked')} blocked")
print(f"   - {sum(1 for l in logs if l['outcome'] == 'allowed')} allowed")
print(f"   - {len(set(l['category'] for l in logs))} categories")
print(f"   - {len(set(l['domain'] for l in logs))} unique domains")
print(f"   - Spanning {days_ago} days of history")
