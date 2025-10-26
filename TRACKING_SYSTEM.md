# 🎯 Impulse Purchase Tracking System

## Overview
The Impulse Guard extension now includes a comprehensive tracking system that monitors, categorizes, and logs all impulse purchase attempts in real-time.

## 🚀 New Features

### 1. **Automatic Item Detection & Categorization**
When the extension activates on a purchase page, it automatically:
- ✅ Scans the page for product information
- ✅ Extracts item name/description
- ✅ Detects price
- ✅ Categorizes the item into one of 10 categories:
  - Electronics
  - Fashion
  - Food & Dining
  - Entertainment
  - Home & Garden
  - Beauty & Personal Care
  - Fitness & Sports
  - Toys & Hobbies
  - Automotive
  - Pet Supplies
  - Other

### 2. **Detailed Logging System**
Each impulse purchase attempt is logged with:
```javascript
{
  description: "Product Name",
  category: "Electronics",
  price: 99.99,
  url: "https://example.com/product",
  timestamp: 1729887600000,
  domain: "example.com",
  attemptTimestamp: 1729887600000,
  outcome: "blocked" | "allowed" | "pending",
  outcomeTimestamp: 1729887605000,
  decisionTime: 5000, // milliseconds
  sessionId: "session_xyz123"
}
```

### 3. **Real-time Sync to Dashboard**
All logged data automatically syncs to the Flask backend:
- Purchase attempts sent to `/api/log-purchase-attempt`
- Stats updated via `/api/update`
- Dashboard displays categorized spending patterns

### 4. **Enhanced Analytics**
New analytics endpoint `/api/analytics` provides:
- Category breakdown (attempts, blocked, allowed, total amount)
- Time-of-day patterns (morning, afternoon, evening, night)
- Top 5 categories by attempt frequency
- Recent activity (last 20 attempts)

## 📊 Dashboard Improvements

### Radar Chart Positioning
- ✅ Moved to the left for better visual balance
- ✅ Centered vertically for optimal viewing
- ✅ Adjusted margins for clearer category labels

### New Data Visualizations
The dashboard now displays:
1. **Category Analysis** - Visual breakdown of spending by category
2. **Time Patterns** - When you're most likely to impulse buy
3. **Decision Metrics** - How long it takes to make purchase decisions
4. **Detailed Purchase Log** - Complete history with timestamps and categories

## 🔧 Technical Implementation

### Content Script (content.js)
- Enhanced item detection with 100+ keywords across categories
- Automatic categorization using keyword matching
- Session tracking for user behavior analysis
- Logs created before popup shows (captures all attempts)

### Background Service (background.js)
- Automatic sync when logs change
- Incremental sync (only sends new logs)
- Maintains sync state to avoid duplicates

### Flask Backend (app.py)
- New `/api/log-purchase-attempt` endpoint for detailed logs
- New `/api/purchase-logs` endpoint to retrieve all logs
- New `/api/analytics` endpoint for advanced insights
- Stores logs in `purchase_logs.json` (last 1000 entries)

### Data Storage
- Chrome Local Storage: `impulsePurchaseLogs` array
- Backend: `purchase_logs.json` file
- Automatic cleanup (keeps last 500 in extension, 1000 in backend)

## 📈 Usage Examples

### Viewing Logs in Console
```javascript
chrome.storage.local.get(['impulsePurchaseLogs'], (data) => {
  console.table(data.impulsePurchaseLogs);
});
```

### Accessing Analytics
```bash
curl http://localhost:5000/api/analytics
```

### Viewing Recent Logs
```bash
curl http://localhost:5000/api/purchase-logs
```

## 🎨 UI Updates

### Radar Chart
- **Before**: Centered with equal margins
- **After**: Left-aligned with more breathing room
- **Margins**: Left: 40px, Right: 140px for better label visibility

### Dashboard Layout
All visualizations now load faster and display categorized data with:
- Color-coded categories
- Icon representations
- Time-based filtering
- Real-time updates

## 🔐 Privacy & Data

### What's Logged
- Item descriptions (product names)
- Prices
- Categories (auto-detected)
- URLs and domains
- Timestamps
- Purchase decisions (blocked/allowed)

### What's NOT Logged
- Personal information
- Payment details
- Account credentials
- Browsing history (only purchase pages)

### Data Retention
- Extension: Last 500 logs
- Backend: Last 1000 logs
- Older logs automatically purged

## 🚀 Future Enhancements

Planned improvements:
- [ ] Machine learning for better categorization
- [ ] Spending predictions and alerts
- [ ] Export logs to CSV/Excel
- [ ] Monthly/yearly spending reports
- [ ] Budget tracking and recommendations
- [ ] Shared family/team dashboards
- [ ] Mobile app for stats viewing

## 📝 API Reference

### POST /api/log-purchase-attempt
Logs a new impulse purchase attempt
```json
{
  "description": "iPhone 15 Pro",
  "category": "Electronics",
  "price": 999.99,
  "timestamp": 1729887600000,
  "url": "https://apple.com/iphone"
}
```

### GET /api/purchase-logs
Returns all logged purchase attempts

### GET /api/analytics
Returns comprehensive analytics including:
- Category breakdown
- Time patterns
- Top categories
- Recent activity

### POST /api/update
Updates main statistics (legacy endpoint)

## 🐛 Troubleshooting

### Logs not showing up?
1. Check if Flask server is running (`python app.py`)
2. Verify Chrome extension is loaded
3. Check browser console for errors
4. Ensure extension has storage permissions

### Categories seem wrong?
- The categorization uses keyword matching
- Categories are assigned based on first match
- You can customize keywords in `content.js` > `ITEM_CATEGORIES`

### Dashboard not updating?
1. Click "Refresh Data" button
2. Check Flask console for sync messages
3. Verify `/api/log-purchase-attempt` endpoint is accessible
4. Clear browser cache

## 📚 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Plotly Documentation](https://plotly.com/javascript/)

---

**Last Updated**: October 25, 2025
**Version**: 2.0.0
**Contributors**: Impulse Guard Development Team
