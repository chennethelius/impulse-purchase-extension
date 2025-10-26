# 🚀 Quick Start: Real-Time Dashboard

## Start the Dashboard

1. **Open terminal in dashboard folder:**
   ```bash
   cd dashboard
   python serve.py
   ```

2. **Open browser:**
   - http://localhost:5000

## Test Without Extension

If you want to see the dashboard with sample data before using the extension:

1. **Open the test page:**
   - http://localhost:5000/test_real_data.html

2. **Click "Send Test Data to Server"**

3. **Click "Open Dashboard"**

## Use With Extension

1. **Make sure server is running** (see above)

2. **Reload your extension:**
   - Go to `chrome://extensions/`
   - Toggle extension off/on

3. **Go shopping:**
   - Visit Amazon, Target, etc.
   - Block or allow purchases

4. **Watch the dashboard update** (every 5 seconds)

## Troubleshooting

### Dashboard shows all zeros?
- Extension hasn't sent data yet
- Reload the extension and make a purchase
- Or use the test page to send sample data

### Server not starting?
- Make sure you're in the dashboard folder
- Check if port 5000 is already in use

### Extension not syncing?
- Check browser console for errors
- Make sure background.js is running
- Reload the extension

## Quick Reference

- **Server URL:** http://localhost:5000
- **Test Page:** http://localhost:5000/test_real_data.html
- **Server File:** dashboard/serve.py
- **Dashboard File:** dashboard/index.html
- **Stats File:** dashboard/extension_stats.json (created by extension)

## What You Should See

When working correctly:

**In Browser Console:**
```
📊 Raw extension data: {...}
✅ Transformed data: {...}
✅ Dashboard updated with extension data
```

**In Server Terminal:**
```
✅ Stats updated: 15 battles, $487.45 saved
✅ Loaded stats from extension_stats.json
```

**On Dashboard:**
- Numbers matching your extension popup
- Charts updating with your purchase history
- Category stats showing your blocked purchases

That's it! 🎉
