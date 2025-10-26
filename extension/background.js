// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Impulse Blocker installed!");
  
  // Initialize stats if they don't exist
  chrome.storage.local.get('stats', (result) => {
    if (!result.stats) {
      chrome.storage.local.set({
        stats: {
          totalBattles: 0,
          victories: 0,
          defeats: 0,
          moneySaved: 0,
          savingsHistory: [],
          recentBattles: []
        }
      });
    }
  });
});

// Listen for messages from content or overlay scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "requestUnlock") {
    // Record that this tab or domain was unlocked
    chrome.storage.local.set({ [message.domain]: true });
    sendResponse({ success: true });
  }

  if (message.type === "checkUnlock") {
    chrome.storage.local.get(message.domain, (result) => {
      sendResponse({ unlocked: !!result[message.domain] });
    });
    // must return true for async sendResponse
    return true;
  }

  if (message.action === "close-current-tab") {
    // Close the tab that sent this message
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);
      sendResponse({ success: true });
    }
  }
  
  if (message.action === "get-stats") {
    // Return current stats to dashboard
    chrome.storage.local.get('stats', (result) => {
      sendResponse({ stats: result.stats || {} });
    });
    return true;
  }
});

// Listen for storage changes and export stats to dashboard
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.stats) {
    console.log('📊 Stats updated:', changes.stats.newValue);
    
    // Export stats to dashboard
    exportStatsToDashboard(changes.stats.newValue);
  }
});

// Export stats to dashboard folder
async function exportStatsToDashboard(stats) {
  try {
    // Send message to notify dashboard is available
    const response = await fetch('http://localhost:5000/api/update-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stats)
    });
    
    if (response.ok) {
      console.log('✅ Stats exported to dashboard successfully');
    }
  } catch (error) {
    // Dashboard might not be running, that's okay
    console.log('ℹ️ Dashboard not available:', error.message);
  }
}

// Export stats on extension startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('stats', (result) => {
    if (result.stats) {
      exportStatsToDashboard(result.stats);
    }
  });
});
