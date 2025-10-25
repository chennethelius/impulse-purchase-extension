// content.js
const suspiciousPatterns = ["checkout", "cart", "purchase", "buy"];

// Use sessionStorage to track unlock across domain for this tab session
// This persists across page navigations but clears when tab closes
const UNLOCK_KEY = 'impulse_blocker_unlocked_' + window.location.hostname;
const unlockTime = sessionStorage.getItem(UNLOCK_KEY);

// Check if unlock is still valid (5 minutes timeout)
const isUnlocked = unlockTime && (Date.now() - parseInt(unlockTime)) < 5 * 60 * 1000;

// Only block if user hasn't defeated the bot yet and page matches patterns
if (suspiciousPatterns.some(p => window.location.href.toLowerCase().includes(p)) && !isUnlocked) {
  // Check if popup already exists
  if (!document.getElementById('impulse-blocker-iframe')) {
    blockPage();
  }
}

function blockPage() {
  const iframe = document.createElement("iframe");
  iframe.id = "impulse-blocker-iframe";
  iframe.src = chrome.runtime.getURL("overlay.html");
  iframe.style.position = "fixed";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100vw";
  iframe.style.height = "100vh";
  iframe.style.border = "none";
  iframe.style.zIndex = 999999;
  iframe.style.backgroundColor = "rgba(0,0,0,0.8)";
  document.body.appendChild(iframe);
  
  // Listen for unlock message
  window.addEventListener('message', (event) => {
    if (event.data.type === 'UNLOCK_PURCHASE') {
      // Store unlock time for this domain (5 minute window)
      sessionStorage.setItem(UNLOCK_KEY, Date.now().toString());
      
      // Remove the iframe
      const existingIframe = document.getElementById('impulse-blocker-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }
    }
  });
}
