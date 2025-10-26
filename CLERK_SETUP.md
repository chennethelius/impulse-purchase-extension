# Clerk Authentication Setup Guide

## Overview
This extension now uses Clerk for authentication instead of Firebase/Google OAuth. Clerk provides a modern, secure authentication solution with built-in user management.

## Setup Instructions

### 1. Create a Clerk Account
1. Go to [https://clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application in your Clerk Dashboard
3. Give your application a name like "Impulse Blocker Extension"

### 2. Configure Clerk Application
1. In your Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Frontend API** URL (format: `your-app.clerk.accounts.dev`)

### 3. Enable Authentication Methods
1. In Clerk Dashboard, go to **User & Authentication** → **Email, Phone, Username**
2. Enable the authentication methods you want:
   - Email address (recommended)
   - Google OAuth
   - GitHub OAuth
   - Other social providers

### 4. Update Extension Configuration
1. Open `/extension/config.js`
2. Replace the placeholder values with your actual Clerk credentials:
```javascript
const CONFIG = {
  // ... other config
  
  // Clerk Configuration
  CLERK_PUBLISHABLE_KEY: 'pk_test_YOUR_ACTUAL_KEY_HERE',
  CLERK_FRONTEND_API: 'your-app.clerk.accounts.dev',
  
  // ... rest of config
};
```

### 5. Optional: Configure .env File
If you prefer using environment variables:
1. Open `/.env`
2. Update with your Clerk credentials:
```
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
CLERK_FRONTEND_API=your-app.clerk.accounts.dev
```

### 6. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `/extension` folder from this project
5. The extension should now appear in your extensions list

### 7. Test the Authentication
1. Click on the extension icon in Chrome
2. Click "Sign in with Clerk"
3. Complete the authentication process
4. You should see your dashboard with user information

## Features

### Authentication
- **Sign In/Sign Up**: Users can create accounts or sign in
- **Social Login**: Support for Google, GitHub, and other OAuth providers
- **Session Management**: Secure session handling with automatic refresh
- **Profile Management**: Users can update their profile information

### User Dashboard
- **Profile Display**: Shows user name, email, and profile picture
- **Statistics Tracking**: 
  - Impulses blocked
  - Money saved
  - Successful purchases after AI conversation
- **Quick Actions**: Access to settings, history, and detailed statistics

### Security Features
- **Secure Token Storage**: Session tokens are securely stored
- **Automatic Session Refresh**: Tokens are automatically refreshed
- **Logout**: Complete session cleanup on logout

## Troubleshooting

### Extension Not Loading
- Make sure you've loaded the unpacked extension from the `/extension` folder
- Check that all files are present in the extension directory
- Look for errors in `chrome://extensions/`

### Authentication Not Working
1. Verify your Clerk credentials in `config.js`
2. Check the browser console for errors (right-click popup → Inspect)
3. Ensure you're using the correct Publishable Key (not the Secret Key)
4. Make sure your Clerk application is active

### "Missing Clerk Configuration" Error
- This means the CLERK_PUBLISHABLE_KEY is not set or still contains placeholder text
- Update `/extension/config.js` with your actual Clerk credentials

### User Data Not Persisting
- Check that Chrome storage permissions are enabled
- Try signing out and signing back in
- Clear extension storage: Chrome Settings → Privacy → Clear browsing data → Cached images and files

## Development Tips

### Testing Different Users
1. Use Clerk's test email addresses for development
2. Format: `test+{number}@example.com`
3. These emails don't require verification in development mode

### Debugging
- Open popup and right-click → Inspect to see console logs
- Check background script logs: chrome://extensions/ → Service Worker "Inspect"
- Clerk Dashboard provides detailed logs of authentication attempts

### Customizing the UI
- Modify `/extension/popup-styles-modern.css` for styling changes
- Update `/extension/popup-clerk.js` for functionality changes
- The UI uses a modern gradient design with purple accent colors

## API Integration

If you want to connect the extension to a backend API:

1. Use the session token for API authentication:
```javascript
const token = await authService.getSessionToken();
fetch('your-api-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

2. Verify tokens on your backend using Clerk's SDK
3. Store user-specific data using the Clerk user ID

## Support

For Clerk-specific issues:
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Discord Community](https://discord.com/invite/b5rXHjAg7A)

For extension issues:
- Check the GitHub repository issues
- Review the console logs for error messages
