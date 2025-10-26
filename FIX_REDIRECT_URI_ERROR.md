# Fix: redirect_uri_mismatch Error

## The Problem
You're seeing: **Error 400: redirect_uri_mismatch**

This means Google doesn't recognize the redirect URI from your Chrome extension.

## Quick Fix (2 minutes)

### Step 1: Get Your Extension ID
1. Open Chrome and go to `chrome://extensions/`
2. Find "Impulse Blocker" extension
3. Copy the **Extension ID** (long string like `abcdefghijklmnopqrstuvwxyz123456`)

### Step 2: Add Redirect URI to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=project-546051675035)
2. Click on your OAuth 2.0 Client ID (`546051675035-pifqiplscjhk3r3e2bsvc0mv9esa4l8g`)
3. Under **Authorized redirect URIs**, click **+ ADD URI**
4. Add this exact URI (replace with YOUR extension ID):
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
   Example: `https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/`

5. Click **SAVE**

### Step 3: Test Again
1. Reload your extension in Chrome
2. Click extension icon
3. Click "Sign in with Clerk"
4. Google sign-in should work now! ✅

## Find Your Extension ID Easily

**Method 1: From Chrome**
- Go to `chrome://extensions/`
- Look under the extension name
- Copy the ID

**Method 2: From Console**
1. Click extension icon
2. Open browser console (F12)
3. Look for the log message:
   ```
   Extension ID: abcdefghijklmnopqrstuvwxyz123456
   Redirect URI: https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/
   ```
4. Copy the redirect URI shown

## What to Add in Google Cloud Console

You need to add **exactly** this format:
```
https://[YOUR_EXTENSION_ID].chromiumapp.org/
```

### Example:
If your extension ID is `mkjhgfdsapoiuytrewqlkjhgfdsazxcv`, add:
```
https://mkjhgfdsapoiuytrewqlkjhgfdsazxcv.chromiumapp.org/
```

## Common Mistakes to Avoid

❌ **Wrong**: `chrome-extension://[ID]/`  
✅ **Right**: `https://[ID].chromiumapp.org/`

❌ **Wrong**: Missing the trailing `/`  
✅ **Right**: Must end with `/`

❌ **Wrong**: Using `http://` instead of `https://`  
✅ **Right**: Must use `https://`

## Still Not Working?

### Check These:

1. **Extension ID Changed?**
   - Unpacking/repacking changes the ID
   - Update the redirect URI with new ID

2. **Saved Changes?**
   - Make sure you clicked SAVE in Google Console
   - Wait 1-2 minutes for changes to propagate

3. **Correct Project?**
   - Make sure you're editing project `project-546051675035`
   - Using the right OAuth client ID

4. **Extension Reloaded?**
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension

## Alternative: Use Demo Mode

If you don't want to set up Google OAuth right now:

1. The extension will automatically fall back to demo mode
2. After clicking "Sign in", wait 5 seconds
3. Demo user will be created
4. All features work perfectly!

## Visual Guide

### Where to Find Extension ID:
```
chrome://extensions/
├── Developer mode: ON
└── Impulse Blocker
    ├── Details | Remove | Errors
    └── ID: abcdefghijklmnopqrstuvwxyz123456  ← Copy this!
```

### Where to Add Redirect URI:
```
Google Cloud Console
├── APIs & Services
├── Credentials
└── OAuth 2.0 Client IDs
    └── [Your Client ID]
        ├── Authorized JavaScript origins
        └── Authorized redirect URIs
            └── + ADD URI  ← Click here
                └── https://[EXTENSION_ID].chromiumapp.org/
```

## Need Help?

1. **Check Console Logs**:
   - Click extension icon
   - Press F12 to open DevTools
   - Look for the redirect URI in console

2. **Verify Setup**:
   - Extension ID matches in redirect URI
   - Redirect URI saved in Google Console
   - Extension reloaded after changes

3. **Use Demo Mode**:
   - Works immediately
   - No OAuth setup needed
   - Perfect for testing

## Success!

Once configured, you'll see:
```
✅ Google OAuth successful, fetching user info...
✅ Sign-in successful: your.email@gmail.com
```

And your real Google profile will appear in the extension! 🎉
