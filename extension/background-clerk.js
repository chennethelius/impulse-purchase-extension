// Background service worker for Impulse Blocker Extension with Clerk Auth
console.log('background-clerk.js: Service worker starting...');

// Store current user and session token
let currentUser = null;
let sessionToken = null;

// Load stored user data on startup
chrome.storage.local.get(['currentUser', 'sessionToken'], (result) => {
  currentUser = result.currentUser || null;
  sessionToken = result.sessionToken || null;
  console.log('Background: Loaded user from storage:', currentUser?.email || 'none');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Impulse Blocker with Clerk Auth installed!");
});

// Listen for messages from content or overlay scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle unlock requests
  if (message.type === "requestUnlock") {
    // Record that this tab or domain was unlocked
    chrome.storage.local.set({ [message.domain]: true });
    sendResponse({ success: true });
    return;
  }

  if (message.type === "checkUnlock") {
    chrome.storage.local.get(message.domain, (result) => {
      sendResponse({ unlocked: !!result[message.domain] });
    });
    return true; // async response
  }

  // Handle Clerk authentication operations
  if (message.action === "getCurrentUser") {
    handleGetCurrentUser(sendResponse);
    return true;
  }

  if (message.action === "setCurrentUser") {
    handleSetCurrentUser(message, sendResponse);
    return true;
  }

  if (message.action === "clearCurrentUser") {
    handleClearCurrentUser(sendResponse);
    return true;
  }

  if (message.action === "getUserStats") {
    handleGetUserStats(message, sendResponse);
    return true;
  }

  if (message.action === "updateUserStats") {
    handleUpdateUserStats(message, sendResponse);
    return true;
  }

  if (message.action === "logChat") {
    handleLogChat(message, sendResponse);
    return true;
  }

  if (message.action === "addMessageToChat") {
    handleAddMessageToChat(message, sendResponse);
    return true;
  }

  if (message.action === "completeChat") {
    handleCompleteChat(message, sendResponse);
    return true;
  }
});

/**
 * Get current user from storage
 */
function handleGetCurrentUser(sendResponse) {
  console.log('Background: getCurrentUser - returning:', currentUser?.email || 'null');
  sendResponse({ data: currentUser });
}

/**
 * Set current user (called by popup after successful Clerk auth)
 */
function handleSetCurrentUser(message, sendResponse) {
  try {
    currentUser = message.user;
    sessionToken = message.token || null;
    
    console.log('Background: setCurrentUser:', currentUser?.email);
    
    // Store in local storage for persistence
    chrome.storage.local.set(
      { currentUser, sessionToken },
      () => {
        console.log('Background: User stored in local storage');
        sendResponse({ data: { success: true } });
      }
    );
  } catch (error) {
    console.error('Background: setCurrentUser error:', error);
    sendResponse({ error: error.message });
  }
}

/**
 * Clear current user (called on logout)
 */
function handleClearCurrentUser(sendResponse) {
  try {
    currentUser = null;
    sessionToken = null;
    
    console.log('Background: clearCurrentUser');
    
    // Clear from local storage
    chrome.storage.local.remove(['currentUser', 'sessionToken'], () => {
      console.log('Background: User cleared from local storage');
      sendResponse({ data: { success: true } });
    });
  } catch (error) {
    console.error('Background: clearCurrentUser error:', error);
    sendResponse({ error: error.message });
  }
}

/**
 * Get user statistics
 */
function handleGetUserStats(message, sendResponse) {
  console.log('Background: getUserStats for user:', currentUser?.email);
  
  if (!currentUser) {
    sendResponse({ 
      data: {
        blockedAttempts: 0,
        successfulPersuasions: 0,
        totalSaved: 0,
        totalChats: 0
      }
    });
    return;
  }
  
  // Get stats from local storage
  const statsKey = `stats_${currentUser.id}`;
  chrome.storage.local.get(statsKey, (result) => {
    const stats = result[statsKey] || {
      blockedAttempts: 0,
      successfulPersuasions: 0,
      totalSaved: 0,
      totalChats: 0
    };
    sendResponse({ data: stats });
  });
}

/**
 * Update user statistics
 */
function handleUpdateUserStats(message, sendResponse) {
  if (!currentUser) {
    sendResponse({ error: 'No user logged in' });
    return;
  }
  
  const statsKey = `stats_${currentUser.id}`;
  chrome.storage.local.get(statsKey, (result) => {
    const currentStats = result[statsKey] || {
      blockedAttempts: 0,
      successfulPersuasions: 0,
      totalSaved: 0,
      totalChats: 0
    };
    
    // Update stats with provided values
    const updatedStats = {
      ...currentStats,
      ...message.stats,
      lastUpdated: new Date().toISOString()
    };
    
    chrome.storage.local.set({ [statsKey]: updatedStats }, () => {
      console.log('Background: Stats updated:', updatedStats);
      sendResponse({ data: updatedStats });
    });
  });
}

/**
 * Log a new chat session
 */
function handleLogChat(message, sendResponse) {
  console.log('Background: logChat called', message);
  
  if (!currentUser) {
    sendResponse({ error: 'No user logged in' });
    return;
  }
  
  // Generate chat ID
  const chatId = `chat_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store chat metadata
  const chatsKey = `chats_${currentUser.id}`;
  chrome.storage.local.get(chatsKey, (result) => {
    const chats = result[chatsKey] || {};
    chats[chatId] = {
      userId: currentUser.id,
      ...message.chatData,
      createdAt: new Date().toISOString()
    };
    
    chrome.storage.local.set({ [chatsKey]: chats }, () => {
      // Update chat count in stats
      handleUpdateUserStats({
        stats: { totalChats: Object.keys(chats).length }
      }, () => {});
      
      sendResponse({ chatId });
    });
  });
}

/**
 * Add a message to a chat
 */
function handleAddMessageToChat(message, sendResponse) {
  console.log('Background: addMessageToChat called', message);
  
  if (!currentUser) {
    sendResponse({ error: 'No user logged in' });
    return;
  }
  
  const messagesKey = `messages_${currentUser.id}`;
  chrome.storage.local.get(messagesKey, (result) => {
    const messages = result[messagesKey] || {};
    if (!messages[message.chatId]) {
      messages[message.chatId] = [];
    }
    messages[message.chatId].push({
      ...message.messageData,
      timestamp: new Date().toISOString()
    });
    
    chrome.storage.local.set({ [messagesKey]: messages }, () => {
      sendResponse({ success: true });
    });
  });
}

/**
 * Complete a chat session
 */
function handleCompleteChat(message, sendResponse) {
  console.log('Background: completeChat called', message);
  
  if (!currentUser) {
    sendResponse({ error: 'No user logged in' });
    return;
  }
  
  const chatsKey = `chats_${currentUser.id}`;
  chrome.storage.local.get(chatsKey, (result) => {
    const chats = result[chatsKey] || {};
    if (chats[message.chatId]) {
      chats[message.chatId] = {
        ...chats[message.chatId],
        ...message.completionData,
        completedAt: new Date().toISOString()
      };
      
      // Update stats based on completion data
      if (message.completionData.purchaseBlocked) {
        handleUpdateUserStats({
          stats: { 
            blockedAttempts: 1,
            totalSaved: message.completionData.amountSaved || 0
          }
        }, () => {});
      } else if (message.completionData.purchaseAllowed) {
        handleUpdateUserStats({
          stats: { successfulPersuasions: 1 }
        }, () => {});
      }
      
      chrome.storage.local.set({ [chatsKey]: chats }, () => {
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false, error: 'Chat not found' });
    }
  });
}

// Helper function to check if user is authenticated
async function isUserAuthenticated() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['currentUser', 'sessionToken'], (result) => {
      resolve(!!result.currentUser && !!result.sessionToken);
    });
  });
}

// Export function to check authentication from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkAuth") {
    isUserAuthenticated().then(isAuth => {
      sendResponse({ authenticated: isAuth, user: currentUser });
    });
    return true;
  }
});
