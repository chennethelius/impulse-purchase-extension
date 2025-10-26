# Impulse Guardian Dashboard

A Python Flask-based dashboard with **Plotly visualizations** for tracking your impulse purchase patterns. This dynamic dashboard is linked directly from the Chrome extension's statistics popup.

## Features

- 📊 **Cumulative Savings Graph** - Beautiful Chart.js visualization showing money saved over time
- 🎯 **Interactive Radar Chart** - Plotly-powered category analysis showing your spending patterns across:
  - Electronics (phones, laptops, gadgets)
  - Fashion (clothes, shoes, accessories)
  - Food (restaurants, delivery, snacks)
  - Entertainment (subscriptions, games, concerts)
  - Home (furniture, décor, appliances)
  - Beauty (makeup, skincare, cosmetics)
  - Fitness (gym, equipment, sports gear)
  - Other (miscellaneous purchases)
- 💰 **Advanced Analytics** - Current streak, biggest save, success rate, daily averages
- 🔍 **Purchase Log** - Review recent purchases with categories and amounts
- 🔄 **Real-time Updates** - Auto-refreshes every 30 seconds + syncs from extension automatically
- � **Professional Theme** - Clean Tahoma font, pastel gradients, cyan accents

## Installation

1. **Install Python 3.8 or higher**

2. **Install dependencies:**
```bash
cd dashboard
pip install -r requirements.txt
```

This includes:
- Flask 3.0.0
- Plotly 5.18.0
- Pandas 2.1.4

## Running the Dashboard

1. **Navigate to the dashboard directory:**
```bash
cd dashboard
```

2. **Start the Flask server:**
```bash
python app.py
```

3. **Open your browser to:**
```
http://localhost:5000
```

4. **Click the dashboard button in your extension's stats popup** - It will open this Python dashboard automatically!

## How It Works

### Auto-Sync from Chrome Extension

The Chrome extension automatically syncs your battle statistics to the dashboard via a Flask API endpoint:

1. When you complete a battle (victory or defeat), the extension updates Chrome's local storage
2. The background service worker detects the change
3. It sends a POST request to `http://localhost:5000/api/update` with your stats
4. The dashboard immediately updates with your new data

### Data Flow

```
Chrome Extension (popup.js)
    ↓ (updates stats)
Chrome Storage
    ↓ (triggers sync)
Background Worker (background.js)
    ↓ (POST /api/update)
Flask API (app.py)
    ↓ (writes to)
stats.json
    ↓ (reads from)
Dashboard (dashboard.html)
```

## Stats Tracked

- **Total Battles**: Number of times you encountered the Impulse Guardian
- **Victories**: Times you convinced the guardian (made a purchase)
- **Defeats**: Times you gave up and saved money! 🎉
- **Money Saved**: Total cumulative savings from all defeats
- **Savings History**: Array tracking cumulative savings after each battle
- **Recent Battles**: Last 50 battles with timestamps and amounts

## Testing with Sample Data

Generate realistic test data to see the dashboard in action:

```bash
python generate_sample_data.py
```

This creates 15 sample battles with realistic savings data.

## API Endpoints

- `GET /` - Main dashboard page
- `GET /api/stats` - Returns current statistics as JSON
- `POST /api/update` - Updates statistics (called by Chrome extension)

## Troubleshooting

**Dashboard not updating?**
- Make sure Flask is running on `http://localhost:5000`
- Check the browser console for sync errors
- Ensure the extension has the `http://localhost:5000` permission

**Want to change the port?**
- Update `app.py` port in the last line
- Update `background.js` API URL to match
- Update `stats.js` dashboard URL

## Development Stack

- **Backend**: Flask (Python web framework)
- **Frontend**: Vanilla JavaScript + Chart.js
- **Styling**: Custom CSS with retro pixel-art aesthetic
- **Data Storage**: JSON file (`stats.json`)

## Future Enhancements

- 📈 Export statistics to CSV/Excel
- 📅 Weekly/Monthly savings reports
- 🎯 Goal setting and achievements system
- 🏆 Leaderboard (compare with friends)
- 📊 Advanced analytics (spending patterns, time analysis)
- 🌙 Dark mode toggle
- 📱 Mobile-responsive design improvements
