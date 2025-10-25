# Impulse Purchase Blocker - Chrome Extension

A Google Chrome extension that helps users avoid impulse purchases by requiring them to convince an AI chatbot (powered by Google's Gemini) that their purchase is necessary.

## Features

- 🛑 **Purchase Detection**: Automatically detects when you're about to make a purchase on any website
- 🤖 **AI Chatbot Guardian**: Powered by Google's Gemini AI to evaluate your purchase justifications
- ❤️ **Health Bar System**: The bot has 100 health points - convince it by making strong arguments
- 🔒 **Popup Blocking**: Can't close the popup until you either convince the bot or give up
- 📊 **Purchase Statistics**: Tracks how many purchases you've blocked vs allowed

## Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/impulse-purchase-extension.git
   ```

2. **Open Chrome and navigate to Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

4. **Generate Icons (Optional)**
   - Open `create_icons.html` in a browser
   - Right-click each canvas and save as PNG with the specified filename
   - Or use any image editing software to create 16x16, 48x48, and 128x128 PNG icons

## Configuration

The extension uses a Gemini API key that's already configured in `config.js`. If you want to use your own API key:

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Edit `extension/config.js` and replace the API key

## How It Works

1. **Detection**: The extension monitors all websites for purchase-related buttons and checkout pages
2. **Interception**: When you click a purchase button, the extension blocks the action
3. **Conversation**: A popup appears with an AI chatbot that you must convince
4. **Evaluation**: The bot evaluates your arguments and takes "damage" based on their strength
5. **Resolution**: If you reduce the bot's health to 0, you can proceed with the purchase

## Argument Strength Guide

- **Weak (0-5 damage)**: "I just want it" or emotional appeals
- **Moderate (6-15 damage)**: Some practical reasons but not essential
- **Strong (16-25 damage)**: Clear necessity with budget considerations
- **Critical (26-30 damage)**: Essential purchase with no alternatives

## Privacy & Security

- The extension only activates on shopping websites
- Conversations with the AI are not stored permanently
- Your purchase data stays local to your browser
- API calls are made directly to Google's Gemini API

## Troubleshooting

- **Extension not detecting purchases**: Make sure the extension has permission to run on the website
- **API errors**: Check that the API key is valid and has not exceeded quota
- **Popup not appearing**: Refresh the page and try again

## Development

To modify the extension:

1. Edit files in the `extension` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

MIT License - feel free to modify and distribute as needed
