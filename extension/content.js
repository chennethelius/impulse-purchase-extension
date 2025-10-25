// Content script to detect purchase buttons and inject the chatbot popup
let popupInjected = false;
let defeatedItems = new Set(); // Track items where bot was defeated

// Patterns to detect purchase-related buttons and pages
const purchasePatterns = [
  'buy now', 'add to cart', 'checkout', 'place order', 'complete purchase',
  'proceed to checkout', 'confirm order', 'submit order', 'purchase', 'buy',
  'add to bag', 'add to basket', 'complete order', 'pay now', 'place your order'
];

// URL patterns that indicate checkout pages
const checkoutUrlPatterns = [
  'checkout', 'cart', 'basket', 'payment', 'order', 'buy', 'purchase'
];

// Function to check if element is a purchase button
function isPurchaseButton(element) {
  const text = element.textContent.toLowerCase().trim();
  const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
  const value = element.value?.toLowerCase() || '';
  
  return purchasePatterns.some(pattern => 
    text.includes(pattern) || 
    ariaLabel.includes(pattern) || 
    value.includes(pattern)
  );
}

// Function to inject the popup
function injectPopup(itemIdentifier = null) {
  if (popupInjected) return;
  
  // Don't show popup if we already defeated the bot for this item
  if (itemIdentifier && defeatedItems.has(itemIdentifier)) {
    return;
  }
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'impulse-blocker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // Create iframe for the popup
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('popup.html');
  iframe.style.cssText = `
    width: 500px;
    height: 700px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;
  
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  popupInjected = true;
  
  // Prevent scrolling on the main page
  document.body.style.overflow = 'hidden';
  
  // Store current item identifier
  window.currentItemIdentifier = itemIdentifier;
  
  // Listen for messages from the popup
  window.addEventListener('message', (event) => {
    if (event.data.type === 'CLOSE_POPUP' && event.data.success) {
      overlay.remove();
      popupInjected = false;
      document.body.style.overflow = '';
      
      // If user convinced the bot, allow the action
      if (event.data.allowPurchase) {
        // Mark this item as defeated so popup won't show again
        if (window.currentItemIdentifier) {
          defeatedItems.add(window.currentItemIdentifier);
        }
        
        if (window.pendingClickTarget) {
          window.pendingClickTarget.click();
          window.pendingClickTarget = null;
        }
      }
    }
  });
}

// Intercept clicks on purchase buttons
document.addEventListener('click', function(event) {
  const target = event.target;
  
  // Check if clicked element or its parents are purchase buttons
  let purchaseElement = null;
  let currentElement = target;
  
  for (let i = 0; i < 5; i++) {
    if (!currentElement) break;
    
    if ((currentElement.tagName === 'BUTTON' || 
         currentElement.tagName === 'A' || 
         currentElement.tagName === 'INPUT') && 
        isPurchaseButton(currentElement)) {
      purchaseElement = currentElement;
      break;
    }
    currentElement = currentElement.parentElement;
  }
  
  if (purchaseElement) {
    event.preventDefault();
    event.stopPropagation();
    window.pendingClickTarget = purchaseElement;
    
    // Create a unique identifier for this button/item
    const itemIdentifier = purchaseElement.textContent + purchaseElement.href + window.location.pathname;
    
    injectPopup(itemIdentifier);
    return false;
  }
}, true);

// Also check for checkout page URLs
if (checkoutUrlPatterns.some(pattern => window.location.href.toLowerCase().includes(pattern))) {
  // Give the page a moment to load, then inject popup
  setTimeout(() => {
    injectPopup();
  }, 1000);
}
