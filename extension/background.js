// Background service worker for the extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Impulse Purchase Blocker installed!');
    
    // Set default settings
    chrome.storage.local.set({
        enabled: true,
        totalPurchasesBlocked: 0,
        totalPurchasesAllowed: 0
    });
});

// Sync stats to Python dashboard
async function syncStatsToDashboard() {
    try {
        const data = await chrome.storage.local.get(['stats', 'impulsePurchaseLogs']);
        const stats = data.stats || {
            totalBattles: 0,
            victories: 0,
            defeats: 0,
            moneySaved: 0,
            savingsHistory: [],
            recentBattles: []
        };
        
        // Send detailed purchase logs to new backend
        const logs = data.impulsePurchaseLogs || [];
        if (logs.length > 0) {
            for (const log of logs) {
                // Only sync logs that haven't been synced yet
                if (!log.synced && log.outcome !== 'pending') {
                    try {
                        const response = await fetch('http://localhost:5000/api/log-purchase', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                item_name: log.description,
                                category: log.category,
                                price: log.price,
                                url: log.url,
                                domain: log.domain,
                                outcome: log.outcome,
                                timestamp: log.timestamp || log.attemptTimestamp
                            })
                        });
                        
                        if (response.ok) {
                            // Mark as synced
                            log.synced = true;
                            console.log('✅ Synced log to backend:', log.description);
                        }
                    } catch (error) {
                        console.log('⚠️ Failed to sync log:', error.message);
                    }
                }
            }
            
            // Update storage with synced flags
            await chrome.storage.local.set({ impulsePurchaseLogs: logs });
        }
        
        console.log('✅ Stats and logs synced to dashboard backend');
    } catch (error) {
        console.log('⚠️ Dashboard sync failed (is Flask backend running?):', error.message);
    }
}

// Listen for storage changes and sync to dashboard
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.stats || changes.impulsePurchaseLogs)) {
        syncStatsToDashboard();
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PURCHASE_BLOCKED') {
        // Increment blocked purchases counter
        chrome.storage.local.get(['totalPurchasesBlocked'], (result) => {
            const newCount = (result.totalPurchasesBlocked || 0) + 1;
            chrome.storage.local.set({ totalPurchasesBlocked: newCount });
        });
    } else if (request.type === 'PURCHASE_ALLOWED') {
        // Increment allowed purchases counter
        chrome.storage.local.get(['totalPurchasesAllowed'], (result) => {
            const newCount = (result.totalPurchasesAllowed || 0) + 1;
            chrome.storage.local.set({ totalPurchasesAllowed: newCount });
        });
    } else if (request.type === 'SYNC_DASHBOARD') {
        // Manual sync request
        syncStatsToDashboard();
        sendResponse({ success: true });
        return true;
    }
    
    sendResponse({ success: true });
    return true;
});

// Handle extension icon click (optional - could show stats)
chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get(['totalPurchasesBlocked', 'totalPurchasesAllowed'], (result) => {
        const blocked = result.totalPurchasesBlocked || 0;
        const allowed = result.totalPurchasesAllowed || 0;
        
        // Show stats as a notification
        chrome.notifications.create({
            type: 'basic',
            title: 'Impulse Purchase Blocker Stats',
            message: `Purchases blocked: ${blocked}\nPurchases allowed: ${allowed}`,
            priority: 1
        });
    });
});
