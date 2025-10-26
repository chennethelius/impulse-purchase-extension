// Content script to detect purchase buttons and inject the Pokemon battle popup
let popupInjected = false;
let defeatedItems = new Set(); // Track items where bot was defeated

// Patterns to detect purchase-related buttons and pages
const purchasePatterns = [
  'buy now', 'add to cart', 'checkout', 'place order', 'complete purchase',
  'proceed to checkout', 'confirm order', 'submit order', 'purchase', 'buy',
  'add to bag', 'add to basket', 'complete order', 'pay now', 'place your order',
  'continue to payment', 'review order', 'confirm and pay'
];

// URL patterns that indicate checkout pages
const checkoutUrlPatterns = [
  'checkout', 'cart', 'basket', 'payment', 'order', 'buy', 'purchase'
];

// Function to extract price from the page
function extractPrice() {
  // Common price selectors
  const priceSelectors = [
    '[class*="price"]',
    '[id*="price"]',
    '[class*="total"]',
    '[id*="total"]',
    '[class*="amount"]',
    '[data-test*="price"]',
    '.product-price',
    '#product-price',
    '.checkout-total',
    '.order-total'
  ];
  
  let maxPrice = 0;
  
  for (const selector of priceSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent;
      // Match prices like $123.45, €123,45, £123.45, 123.45, etc.
      const priceMatch = text.match(/[\$€£¥]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/[,\s]/g, ''));
        if (price > maxPrice) {
          maxPrice = price;
        }
      }
    });
  }
  
  return maxPrice;
}

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

// Function to inject the Pokemon battle popup
async function injectPopup(itemIdentifier = null) {
  if (popupInjected) return;
  
  // Don't show popup if we already defeated the bot for this item
  if (itemIdentifier && defeatedItems.has(itemIdentifier)) {
    return;
  }
  
  // Check price threshold
  const result = await chrome.storage.local.get(['priceThreshold', 'enabled']);
  const priceThreshold = result.priceThreshold || 0;
  const enabled = result.enabled !== false;
  
  if (!enabled) {
    return;
  }
  
  const currentPrice = extractPrice();
  if (currentPrice < priceThreshold) {
    console.log(`Price $${currentPrice} is below threshold $${priceThreshold}, allowing purchase`);
    return;
  }
  
  // Create overlay container with Pokemon encounter animation
  const overlay = document.createElement('div');
  overlay.id = 'impulse-blocker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: pokemonFlash 0.8s;
  `;
  
  // Add flash animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pokemonFlash {
      0%, 100% { opacity: 1; }
      10%, 30%, 50%, 70% { opacity: 0; }
      20%, 40%, 60%, 80% { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Create iframe for the popup (will load after flash animation)
  setTimeout(() => {
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('popup.html');
    iframe.style.cssText = `
      width: 100vw;
      height: 100vh;
      border: none;
      animation: slideIn 0.5s ease-out;
    `;
    
    overlay.appendChild(iframe);
  }, 800); // Wait for flash animation to complete
  
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
        
        // Notify background script
        chrome.runtime.sendMessage({ type: 'PURCHASE_ALLOWED' });
        
        if (window.pendingClickTarget) {
          window.pendingClickTarget.click();
          window.pendingClickTarget = null;
        }
      } else {
        // User gave up
        chrome.runtime.sendMessage({ type: 'PURCHASE_BLOCKED' });
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
    injectPopup('checkout-page');
  }, 1500);
}
