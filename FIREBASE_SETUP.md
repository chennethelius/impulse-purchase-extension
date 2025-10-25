# Firebase Database Setup Guide

## Overview
This guide walks through setting up Firebase Firestore for the Impulse Purchase Tracker extension.

## Files Created

1. **firebase-config.js** - Firebase initialization and configuration
2. **firebase-auth.js** - Google Sign-In and authentication
3. **firebase-service.js** - Firestore database service and queries
4. **firestore.rules** - Security rules for database access

## Setup Steps

### 1. Firebase Project Setup
Your Firebase project is already created:
- Project ID: `impulse-purchase-tracker`
- Authentication: Google Sign-In enabled
- Hosting: Firebase Hosting configured

### 2. Install Dependencies
```bash
npm install firebase
```

### 3. Set Firestore Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `impulse-purchase-tracker`
3. Go to **Firestore Database** > **Rules** tab
4. Replace the rules with the contents of `firestore.rules`
5. Click **Publish**

### 4. Enable Firestore Indexes (if needed)
When you first run the dashboard, Firestore will prompt you to create indexes for queries. Click the link and accept the index creation.

## Data Structure

```
users/{uid}
├── profile/
│   ├── email
│   ├── displayName
│   ├── photoURL
│   ├── createdAt
│   └── lastLogin
│
├── stats/
│   ├── totalChatsWithAI
│   ├── totalPurchasesCompleted
│   ├── totalPurchasesPrevented
│   ├── moneySpentOnPurchases
│   ├── estimatedMoneySaved
│   └── lastUpdated
│
├── chats/{chatId}
│   ├── timestamp
│   ├── domain
│   ├── itemName
│   ├── itemPrice
│   ├── outcome (purchased|prevented|abandoned)
│   ├── aiHealth
│   ├── duration
│   └── messages/{messageId}
│       ├── role (user|ai)
│       ├── content
│       ├── timestamp
│       └── damage
│
├── purchases/{purchaseId}
│   ├── timestamp
│   ├── domain
│   ├── itemName
│   ├── itemPrice
│   ├── outcome (completed|prevented)
│   ├── chatId
│   └── ...
│
└── preferences/
    ├── enableNotifications
    ├── enableAnalytics
    ├── blockedDomains
    ├── allowedDomains
    └── theme
```

## API Reference

### Authentication
```javascript
import { signInWithGoogle, signOutUser, getCurrentUser } from './firebase-auth.js';

// Sign in
const user = await signInWithGoogle();

// Sign out
await signOutUser();

// Get current user
const user = getCurrentUser();
```

### Database Operations
```javascript
import * as firebaseService from './firebase-service.js';

// Initialize user on first login
await firebaseService.initializeUserDocument(uid, userData);

// Log a chat session
const chatId = await firebaseService.logChat(uid, {
  domain: 'amazon.com',
  itemName: 'Widget',
  itemPrice: 29.99,
  itemURL: 'https://...'
});

// Add message to chat
await firebaseService.addMessageToChat(uid, chatId, {
  role: 'user',
  content: 'I need this widget',
  damage: 0
});

// Complete chat
await firebaseService.completChat(uid, chatId, {
  type: 'prevented', // 'purchased' | 'prevented' | 'abandoned'
  userConvinced: false
});

// Log purchase
await firebaseService.logPurchase(uid, {
  domain: 'amazon.com',
  itemName: 'Widget',
  itemPrice: 29.99,
  outcome: 'completed' // 'completed' | 'prevented'
});

// Get user data
const userData = await firebaseService.getUserData(uid);

// Get user chats
const chats = await firebaseService.getUserChats(uid);

// Get purchases
const purchases = await firebaseService.getUserPurchases(uid, 'completed');
```

## Environment Variables

Create a `.env.local` file if you need to override the Firebase config:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Next Steps

1. **Integrate with Extension**
   - Update `extension/overlay.js` to call `logChat()` and `addMessageToChat()`
   - Update `extension/background.js` to log purchases

2. **Build Dashboard**
   - Create React dashboard to display stats, chats, and purchases
   - Real-time data sync with Firestore listeners

3. **Deploy**
   - Deploy to Firebase Hosting or Vercel
   - Use `firebase deploy` command

## Troubleshooting

### "Permission denied" errors
- Check that you're signed in (firebase-auth.js)
- Verify Firestore rules are published
- Ensure user document exists (initializeUserDocument called)

### Missing indexes
- Firestore will automatically suggest indexes when needed
- Accept the index creation from the Firebase Console link

### Offline data not syncing
- Ensure `enableIndexedDbPersistence` is called (firebase-config.js)
- Browser must support IndexedDB
- Data will sync automatically when online

## Support

For Firebase documentation:
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
