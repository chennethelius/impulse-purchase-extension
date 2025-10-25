# 🎮 Impulse Purchase Blocker - Pokemon Battle Edition

Stop impulse buying by defeating an AI chatbot in a Pokemon-style battle! Every time you try to make a purchase, you'll face the **IMPULSE GUARDIAN** and must convince it that your purchase is necessary.

## ✨ Features

- 🎯 **Pokemon Battle Interface**: Full-screen Pokemon encounter animation with battle mechanics
- 🤖 **AI-Powered Guardian**: Powered by Google's Gemini AI to challenge your purchase decisions
- ⚔️ **Health Bar System**: Deal damage with good arguments to defeat the guardian
- 💰 **Price Threshold**: Set a minimum price that triggers the battle
- 📊 **Stats Tracking**: See how many purchases you've blocked vs. allowed
- 🎨 **Authentic Pokemon Aesthetic**: Complete with damage numbers, critical hits, and battle animations

## 🚀 Installation

1. **Download the Extension**
   - Download all files in the `impulse-blocker-extension` folder

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `impulse-blocker-extension` folder

3. **Configure Settings**
   - Click the extension icon in your toolbar
   - Set your price threshold (default: $50)
   - Enable/disable the extension as needed

## 🎮 How to Play

1. **Browse shopping websites** as normal
2. **Click a purchase button** (like "Add to Cart" or "Buy Now")
3. **Pokemon encounter animation** plays with screen flashes
4. **Battle the IMPULSE GUARDIAN** by typing arguments
5. **Deal damage** with convincing arguments:
   - 💚 Weak arguments: 0-8 damage
   - 💛 Good reasoning: 12-16 damage
   - 🧡 Strong arguments: 17-22 damage
   - ❤️ Perfect arguments: 23+ damage (CRITICAL HIT!)
6. **Defeat the guardian** to unlock your purchase
7. **Or give up** to save your money

## 💡 Tips for Dealing Maximum Damage

The AI guardian evaluates your arguments based on:

- **Necessity**: Do you actually need this item?
- **Urgency**: Why do you need it RIGHT NOW?
- **Budget**: Have you considered your financial situation?
- **Alternatives**: Have you looked for cheaper options?
- **Long-term value**: Will this benefit you long-term?

### Example Arguments

❌ **Weak** (0-5 damage):
- "I want it"
- "It looks cool"
- "Why not?"

✅ **Strong** (20+ damage):
- "My laptop charger broke and I need one for work tomorrow. I've compared prices and this is the cheapest option that ships overnight."
- "This winter coat is 50% off, I need a new one since mine is torn, and winter starts next week."

## ⚙️ Configuration

### Price Threshold
Set the minimum purchase amount that triggers the battle. Purchases below this amount will go through without challenge.

- **Default**: $50
- **Range**: $0 - $999+
- **Usage**: Great for allowing small purchases while catching big impulse buys

### Enable/Disable
Toggle the extension on or off without uninstalling it.

## 📁 File Structure

```
impulse-blocker-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Purchase detection & popup injection
├── popup.html            # Battle interface HTML
├── popup.css             # Pokemon-themed styling
├── popup.js              # Battle mechanics & AI integration
├── config.js             # API configuration
├── settings.html         # Settings page
├── settings.js           # Settings functionality
└── assets/
    ├── pokemon-pokemon-encounter.gif  # Battle background
    ├── icon16.png        # Extension icon (16x16)
    ├── icon48.png        # Extension icon (48x48)
    └── icon128.png       # Extension icon (128x128)
```

## 🔧 Technical Details

- **AI Model**: Google Gemini 1.5 Flash
- **Manifest Version**: 3
- **Permissions**: storage, tabs, scripting, activeTab, notifications
- **Browser**: Chrome/Chromium-based browsers

## 🎨 Customization

### Change AI Personality
Edit `popup.js` and modify the `systemPrompt` variable to change how the guardian responds.

### Adjust Difficulty
In `config.js`, change:
- `INITIAL_HEALTH`: Guardian's starting HP (default: 100)
- `MIN_HEALTH_TO_PASS`: HP needed to win (default: 0)

### Price Detection
The extension automatically detects prices on pages. To improve detection for specific sites, edit the `extractPrice()` function in `content.js`.

## 🐛 Troubleshooting

**Extension not activating?**
- Check that the extension is enabled in settings
- Make sure the price is above your threshold
- Try refreshing the page

**Guardian not responding?**
- Check your internet connection (needs API access)
- The API key in `config.js` must be valid
- Check browser console for error messages

**Background not showing?**
- Make sure `pokemon-pokemon-encounter.gif` is in the `assets/` folder
- Check browser console for loading errors

## 🔒 Privacy

- All purchase detection happens locally in your browser
- Only your arguments are sent to the AI (via Gemini API)
- No purchase data or browsing history is stored or transmitted
- Stats are stored locally in your browser

## 📝 License

This is a personal project. Use and modify as you wish!

## 🎉 Credits

- Pokemon battle aesthetic inspired by Pokemon game series
- AI powered by Google Gemini
- Created to help people make better financial decisions (and have fun doing it!)

---

**Remember**: The goal isn't to never buy anything, but to make sure every purchase is intentional! 💪✨
