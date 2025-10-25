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
