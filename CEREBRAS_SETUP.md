# 🤖 Setting Up Cerebras API for Fun AI Responses

The extension uses the **Cerebras API** to generate fun, witty, varied responses. Without it, you'll get basic fallback responses.

## Quick Setup (2 minutes)

### 1. Get Your API Key
1. Go to [https://cloud.cerebras.ai/](https://cloud.cerebras.ai/)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy the key

### 2. Add Key to Extension
1. Copy `config.example.js` to `config.js`:
   ```bash
   cp extension/config.example.js extension/config.js
   ```

2. Edit `extension/config.js` and add your key:
   ```javascript
   window.CEREBRAS_API_KEY = 'your-actual-api-key-here';
   ```

3. Reload the extension in Chrome

## What You Get With AI

### ✅ With Cerebras API:
- **Fun, varied responses** that never repeat
- **Product-specific humor** ("Another YouTube machine?" for iPads)
- **Witty quotes** of your exact words
- **Personality mixing** (sarcastic, supportive, shocked, playful)
- **Smart alternatives** based on what you're buying
- **Conversation memory** that references what you said earlier

**Examples:**
- "LOL 'I want it' isn't a reason, it's a confession!"
- "Okay okay, 'my laptop exploded' - fair enough! Still, refurbs are 40% cheaper..."
- "'Need it for work'? Can't argue with paychecks! Check the used ones though?"

### ❌ Without API (Fallback):
- Basic pattern matching
- Repetitive responses
- Generic suggestions
- Still works, but less fun!

## Test It's Working

1. Open Chrome DevTools Console
2. Try to buy something
3. Enter a justification
4. You should see varied, fun responses quoting your words!

If you see: `⚠️ No Cerebras API key found!` in console, check your config.js

## Troubleshooting

**Not seeing AI responses?**
- Check `extension/config.js` exists (not just config.example.js)
- Verify your API key is correct
- Make sure config.js has: `window.CEREBRAS_API_KEY = 'your-key';`
- Reload the extension in Chrome

**Getting errors?**
- Check your API key is valid at https://cloud.cerebras.ai/
- Make sure you have credits/usage remaining
- Check console for specific error messages

## API Costs

Cerebras offers generous free tier:
- Fast responses (Llama 3.1 8B model)
- Thousands of free requests
- Perfect for this extension!

---

**Remember:** The extension works without the API, but it's SO much more fun with it! 🎉
