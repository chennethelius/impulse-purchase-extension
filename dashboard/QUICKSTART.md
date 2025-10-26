# Quick Start Guide - Python Dashboard

## 🚀 Setup (One-time)

1. **Open PowerShell in the dashboard folder:**
```powershell
cd c:\Users\thisi\OneDrive\Documents\GitHub\impulse-purchase-extension\dashboard
```

2. **Install Python dependencies:**
```powershell
pip install -r requirements.txt
```

3. **Generate test data** (optional, to see the dashboard with sample data):
```powershell
python generate_sample_data.py
```

## 🎯 Running the Dashboard

**Every time you want to use the dashboard:**

1. **Start the Flask server:**
```powershell
cd c:\Users\thisi\OneDrive\Documents\GitHub\impulse-purchase-extension\dashboard
python app.py
```

2. **Open the dashboard:**
   - Click the extension icon → Opens stats popup
   - Click **"📊 VIEW FULL DASHBOARD"** button
   - OR visit `http://localhost:5000` directly in your browser

3. **Complete some battles in the extension**
   - The dashboard will automatically sync and update!

## 🔄 How Auto-Sync Works

```
You complete a battle → Extension updates stats → 
Background worker syncs to Flask API → 
Dashboard updates in real-time!
```

## 📊 What You'll See

- **5 Stat Cards**: Total Battles, Victories, Defeats, Money Saved, Win Rate
- **Beautiful Graph**: Cumulative savings over time (same as stats popup but bigger!)
- **Recent Battles**: Last 10 battles with icons and timestamps
- **Auto-refresh**: Updates every 30 seconds automatically

## 💡 Tips

- **Keep Flask running** while using the extension for live updates
- **Use the Refresh button** on the dashboard to manually update
- **Test with sample data** first using `generate_sample_data.py`
- **Port 5000** must be available (not used by another app)

## ⚠️ Troubleshooting

**Dashboard shows no data?**
- Complete a battle in the extension first
- OR run `python generate_sample_data.py` for test data

**Sync not working?**
- Make sure Flask is running (`python app.py`)
- Check browser console for errors (F12)
- Verify `http://localhost:5000` is accessible

**Port 5000 already in use?**
- Edit `app.py` last line: change `port=5000` to another port (e.g., 5001)
- Update `background.js` fetch URL to match new port
- Update `stats.js` dashboard URL to match new port

## 🎉 You're Ready!

Run `python app.py` and start battling impulse purchases! 💪
