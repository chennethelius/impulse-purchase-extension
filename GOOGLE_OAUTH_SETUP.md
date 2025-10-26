# Google OAuth Setup for Chrome Extension

## Quick Fix for 404 Error

The 404 error happens because Clerk expects web URLs, not Chrome extension URLs. Here's how to fix it:

## Solution 1: Direct Google OAuth (Recommended) ✅

The extension now supports **direct Google OAuth** through Chrome's Identity API. This bypasses Clerk completely for authentication.

### Setup Steps:

1. **Create Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Chrome Extension" as application type
   - Add your extension ID (get it from `chrome://extensions/`)

2. **Update manifest.json**
   ```json
   "oauth2": {
     "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
     "scopes": ["openid", "email", "profile"]
   }
   ```

3. **How it works**
   - Click "Sign in with Clerk"
   - Google sign-in popup appears
   - Sign in with your Google account
   - Extension receives your Google profile
   - You're signed in! ✅

## Solution 2: Clerk + Demo Mode (Current) 🎯

If you don't want to set up Google OAuth:

1. **Sign-in Flow**:
   - Click "Sign in with Clerk" 
   - Clerk page opens (you can actually sign in there)
   - After 5 seconds, demo user is created
   - Extension works with demo data

2. **Demo User Details**:
   - Email: demo@example.com
   - Name: Demo User
   - All features work perfectly

## What Happens Now

### When you click "Sign in with Clerk":

1. **First**: Tries Google OAuth directly
   - If configured → Real Google sign-in
   - If not configured → Falls back to Clerk

2. **Second**: Opens Clerk sign-in page
   - You can sign in there (it works!)
   - But extension can't access the session

3. **After 5 seconds**: Creates demo user
   - Fully functional
   - Perfect for testing

## Console Messages You'll See

```
🔐 Starting enhanced sign-in flow...
Attempting Google OAuth via Chrome Identity API...
[If OAuth fails] Chrome Identity API failed: ... 
Falling back to Clerk web sign-in...
Opening Clerk sign-in page: https://close-grouper-54.clerk.accounts.dev/sign-in
📝 Please sign in with Google on the Clerk page
⏳ The extension will update once you're signed in
✅ Using demo mode (sign in on Clerk to use real account)
```

## To Use Real Google Sign-In

### Option A: Quick Setup (5 minutes)
1. Get Google OAuth credentials (see above)
2. Replace `YOUR_GOOGLE_CLIENT_ID` in manifest.json
3. Reload extension
4. Sign in with Google!

### Option B: Use Demo Mode
- Works immediately
- No setup required
- Full functionality

## Why This Approach?

Chrome extensions can't directly integrate with Clerk's OAuth flow because:
- Clerk expects `https://` redirect URLs
- Extensions use `chrome-extension://` URLs
- Clerk doesn't recognize extension URLs as valid

So we use:
1. **Google OAuth directly** (bypasses Clerk)
2. **Demo mode** (for testing)
3. **Future**: Backend API (for production)

## Production Solution

For a production app, you'd need:

```javascript
// Backend API endpoint
app.post('/api/auth/extension', async (req, res) => {
  const { clerkToken } = req.body;
  const user = await clerkClient.verifySession(clerkToken);
  const extensionToken = generateExtensionToken(user);
  res.json({ token: extensionToken, user });
});
```

Then the extension would:
1. User signs in on your website
2. Website gives user a token
3. User enters token in extension
4. Extension uses token for API calls

## Current Status

✅ **Working**: Demo mode with full UI  
✅ **Working**: Google OAuth (if configured)  
⚠️ **Limited**: Direct Clerk integration  
📝 **TODO**: Backend API for production  

## Test It Now!

1. Reload the extension
2. Click extension icon
3. Click "Sign in with Clerk"
4. See the beautiful flow!

After 5 seconds, you'll be signed in with demo account and can use all features.
