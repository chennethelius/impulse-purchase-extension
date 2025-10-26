// background.js
// Import IndexedDB wrapper
importScripts('stats-db.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log("Impulse Blocker installed!");
  // Initialize IndexedDB
  statsDB.init().catch(err => console.error('Failed to initialize IndexedDB:', err));
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

  // Handle stats update from overlay
  if (message.type === "updateStats") {
    console.log('Background received updateStats message:', message.data);
    handleStatsUpdate(message.data).then((result) => {
      console.log('Stats update successful, sending response:', result);
      sendResponse({ success: true, stats: result });
    }).catch((error) => {
      console.error('Error updating stats:', error);
      sendResponse({ success: false, error: error.message });
    });
    // must return true for async sendResponse
    return true;
  }
});

// Function to handle stats updates
async function handleStatsUpdate(data) {
  try {
    console.log('Updating stats with data:', data);
    
    // Use IndexedDB to update stats
    const updatedStats = await statsDB.updateStats((stats) => {
      // Update totals
      stats.totalBattles = (stats.totalBattles || 0) + 1;
      
      if (data.purchaseAllowed) {
        // User proceeded with purchase
        stats.defeats = (stats.defeats || 0) + 1;
      } else {
        // User cancelled purchase (saved money)
        stats.victories = (stats.victories || 0) + 1;
        stats.moneySaved = (stats.moneySaved || 0) + data.price;
        
        // Initialize savingsHistory if it doesn't exist
        if (!stats.savingsHistory) stats.savingsHistory = [];
        stats.savingsHistory.push(stats.moneySaved);
      }
      
      // Update category stats
      if (!data.purchaseAllowed) {
        if (!stats.categoryStats) stats.categoryStats = {};
        stats.categoryStats[data.category] = (stats.categoryStats[data.category] || 0) + 1;
      }
      
      // Add to purchase history
      if (!stats.purchaseHistory) stats.purchaseHistory = [];
      stats.purchaseHistory.push({
        timestamp: data.timestamp,
        product: data.productName,
        amount: data.price,
        category: data.category,
        saved: !data.purchaseAllowed
      });
      
      return stats;
    });
    
    console.log('Stats updated in IndexedDB:', updatedStats);
    return updatedStats;
  } catch (error) {
    console.error('Failed to update stats in background:', error);
    throw error;
  }
}
