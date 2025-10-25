// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Impulse Blocker installed!");
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
});
