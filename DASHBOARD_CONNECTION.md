# Extension ↔ Dashboard Connection Guide

## 🔗 How It's Connected

### Extension Popup
When you click the Chrome extension icon, it opens **stats.html** which displays:
- ⚔️ Battle statistics (wins/losses)
- 💰 Money saved
- 📈 Savings graph
- **📊 OPEN DASHBOARD** button

### Dashboard Button
The "📊 OPEN DASHBOARD" button in the extension popup:
- Location: `extension/stats.html` (line 31)
- Opens a new browser tab to: `http://localhost:5000`
- JavaScript handler: `extension/stats.js` (line 5)

### Dashboard Server
The dashboard runs on `http://localhost:5000` and includes:
- **5 React-powered pages**: Dashboard, Insights, Reports, Motivation, Categories
- **Real-time data**: Automatically loads from Chrome extension storage
- **Auto-sync**: Updates when extension data changes

## 🚀 How to Use

### Step 1: Start the Dashboard Server
```powershell
cd dashboard
python serve.py
```
Server will start on `http://localhost:5000`

### Step 2: Click Extension Icon
- Click the Impulse Guard extension icon in Chrome
- You'll see your battle statistics
- Click "📊 OPEN DASHBOARD" button

### Step 3: Explore the Dashboard
Navigate between 5 detailed pages:
1. **Dashboard** - Overview with charts and stats
2. **Insights** - Deep dive into spending patterns
3. **Reports** - Detailed purchase history table
4. **Motivation** - Achievements and tips
5. **Categories** - Breakdown by purchase type

## 📊 Data Flow

```
Chrome Extension Storage
         ↓
    stats.json
         ↓
   app.js (React)
         ↓
  Dashboard Pages
```

### Data Sources
1. **Primary**: Chrome extension `chrome.storage.local`
   - `stats` object (battles, money saved)
   - `impulsePurchaseLogs` array (detailed purchases)

2. **Fallback**: `stats.json` file
   - Used when Chrome extension storage not available
   - Updated by extension background.js

### Real-time Updates
- Dashboard listens for Chrome storage changes
- Automatically refreshes when new purchases are logged
- No manual refresh needed!

## 🎨 React Components

The dashboard uses React components loaded via CDN:
- **Sidebar** - Navigation between pages
- **DashboardPage** - Main overview with Chart.js
- **InsightsPage** - Doughnut & bar charts
- **ReportsPage** - Purchase history table
- **CommentsPage** - Motivational messages
- **ChannelsPage** - Category breakdown cards

## 📁 Key Files

### Extension Files
- `extension/stats.html` - Popup with dashboard button
- `extension/stats.js` - Dashboard button handler
- `extension/stats.css` - Popup styling
- `extension/background.js` - Data sync logic
- `extension/content.js` - Purchase detection & logging

### Dashboard Files
- `dashboard/index.html` - Main HTML with React setup
- `dashboard/app.js` - All React components (1000+ lines)
- `dashboard/styles.css` - Custom styling
- `dashboard/serve.py` - Python HTTP server
- `dashboard/stats.json` - Data storage

## 🔧 Troubleshooting

### Dashboard button doesn't work?
1. Check if server is running: `http://localhost:5000`
2. Restart server: `cd dashboard && python serve.py`
3. Check for port conflicts

### No data showing?
1. Extension must be installed and active
2. Try making a test purchase to generate data
3. Click extension icon and verify stats show there

### Dashboard not updating?
1. Extension must sync data to storage
2. Check browser console for errors
3. Refresh the dashboard page

## 💡 Tips

- **Keep server running**: Dashboard needs Python server active
- **Use extension first**: Generate data by blocking/allowing purchases
- **Real Chrome extension**: Load as unpacked extension in Chrome
- **Port 5000**: Ensure nothing else uses this port

## 🎮 Testing the Connection

1. Start dashboard server
2. Click extension icon → see stats popup
3. Click "📊 OPEN DASHBOARD" → opens in new tab
4. Navigate through 5 pages
5. Block a test purchase in extension
6. Dashboard auto-updates with new data!

---

**Server Status**: ✅ Running on http://localhost:5000
**Extension**: Ready to connect
**Data Sync**: Automatic
