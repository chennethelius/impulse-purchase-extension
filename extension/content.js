// Content script to detect purchase buttons and inject the chatbot popup
let popupInjected = false;
let defeatedItems = new Set(); // Track items where bot was defeated
let currentPrice = 0; // Store detected price
let currentItemInfo = {}; // Store detailed item information

// Enhanced categories with more keywords
const ITEM_CATEGORIES = {
  'Electronics': [
    'phone', 'iphone', 'android', 'samsung', 'laptop', 'computer', 'pc', 'mac', 'macbook',
    'tablet', 'ipad', 'headphones', 'earbuds', 'airpods', 'speaker', 'tv', 'television',
    'camera', 'watch', 'smartwatch', 'gaming', 'console', 'playstation', 'xbox', 'nintendo',
    'monitor', 'keyboard', 'mouse', 'drone', 'gopro', 'alexa', 'echo', 'tech', 'gadget'
  ],
  'Fashion': [
    'clothes', 'clothing', 'shirt', 'tshirt', 't-shirt', 'pants', 'jeans', 'shoes', 'sneakers',
    'dress', 'jacket', 'coat', 'boots', 'sandals', 'heels', 'bag', 'purse', 'handbag',
    'accessories', 'jewelry', 'necklace', 'bracelet', 'earrings', 'ring', 'watch',
    'sunglasses', 'belt', 'hat', 'cap', 'scarf', 'gloves', 'socks', 'underwear', 'bra'
  ],
  'Food & Dining': [
    'food', 'restaurant', 'pizza', 'burger', 'coffee', 'cafe', 'snacks', 'delivery',
    'takeout', 'meal', 'drinks', 'beverage', 'alcohol', 'wine', 'beer', 'grocery',
    'groceries', 'dining', 'lunch', 'dinner', 'breakfast', 'doordash', 'ubereats', 'grubhub'
  ],
  'Entertainment': [
    'movie', 'film', 'cinema', 'game', 'video game', 'subscription', 'netflix', 'spotify',
    'disney', 'hulu', 'concert', 'tickets', 'event', 'streaming', 'music', 'book', 'ebook',
    'kindle', 'audiobook', 'audible', 'theater', 'show', 'entertainment'
  ],
  'Home & Garden': [
    'furniture', 'decor', 'decoration', 'kitchen', 'appliance', 'bedding', 'lamp', 'light',
    'chair', 'table', 'desk', 'couch', 'sofa', 'bed', 'mattress', 'pillow', 'blanket',
    'curtain', 'rug', 'carpet', 'plant', 'garden', 'tools', 'home improvement'
  ],
  'Beauty & Personal Care': [
    'makeup', 'skincare', 'cosmetics', 'perfume', 'cologne', 'fragrance', 'shampoo',
    'conditioner', 'beauty', 'hair', 'nails', 'lotion', 'cream', 'serum', 'moisturizer',
    'cleanser', 'toner', 'lipstick', 'foundation', 'mascara', 'eyeshadow'
  ],
  'Fitness & Sports': [
    'gym', 'workout', 'fitness', 'exercise', 'sports', 'equipment', 'yoga', 'running',
    'bike', 'bicycle', 'weights', 'dumbbell', 'treadmill', 'protein', 'supplement',
    'athletic', 'activewear', 'sportswear', 'training'
  ],
  'Toys & Hobbies': [
    'toy', 'toys', 'lego', 'puzzle', 'board game', 'hobby', 'craft', 'art supplies',
    'paint', 'canvas', 'collectible', 'action figure', 'doll', 'stuffed animal'
  ],
  'Automotive': [
    'car', 'auto', 'vehicle', 'parts', 'tire', 'oil', 'automotive', 'motorcycle', 'bike parts'
  ],
  'Pet Supplies': [
    'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'pet food', 'pet toy', 'leash', 'collar'
  ]
};

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

// Function to categorize item based on description
function categorizeItem(description) {
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(ITEM_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Other';
}

// Function to extract price from the page
function extractPrice() {
  let detectedPrice = 0;
  
  // Priority 1: Look for keywords like "total", "cost", "bill" followed by prices
  const priorityKeywords = ['total', 'subtotal', 'cost', 'price', 'bill', 'amount', 'pay'];
  const bodyText = document.body.innerText;
  
  // Search for keyword + price patterns (e.g., "Total: $99.99" or "Cost $50.00")
  for (const keyword of priorityKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*\\$?\\s*(\\d{1,6}(?:,\\d{3})*(?:\\.\\d{2})?)`, 'gi');
    const matches = [...bodyText.matchAll(regex)];
    
    for (const match of matches) {
      let price = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0 && price < 100000) {
        // Prioritize "total" and "subtotal" matches
        if (keyword === 'total' || keyword === 'subtotal') {
          return price; // Return immediately for total/subtotal
        }
        if (price > detectedPrice) {
          detectedPrice = price;
        }
      }
    }
  }
  
  // If we found a price with keywords, return it
  if (detectedPrice > 0) {
    return detectedPrice;
  }
  
  // Priority 2: Try common price selectors
  const priceSelectors = [
    '[class*="total"]',
    '[id*="total"]',
    '[class*="subtotal"]',
    '[class*="price"]',
    '[id*="price"]',
    '[data-price]',
    '.a-price-whole', // Amazon
    '.product-price',
    '.price-current'
  ];
  
  for (const selector of priceSelectors) {
    const elements = document.querySelectorAll(selector);
    
    for (const element of elements) {
      const text = element.textContent || element.getAttribute('data-price') || '';
      const priceMatch = text.match(/\$?\s*(\d{1,6}(?:[,\.]\d{1,3})?(?:\.\d{2})?)/);
      
      if (priceMatch) {
        let price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (!isNaN(price) && price > detectedPrice && price < 100000) {
          detectedPrice = price;
        }
      }
    }
  }
  
  // Priority 3: If still no price, scan for any dollar amounts
  if (detectedPrice === 0) {
    const matches = bodyText.matchAll(/\$\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/g);
    
    for (const match of matches) {
      let price = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > detectedPrice && price < 100000) {
        detectedPrice = price;
      }
    }
  }
  
  return detectedPrice > 0 ? detectedPrice : 50; // Default to $50 if no price found
}

// Function to extract item description from page
function extractItemDescription() {
  // Priority 1: Product-specific selectors
  const productSelectors = [
    'h1[class*="product"]',
    '[class*="product-title"]',
    '[class*="product-name"]',
    '[id*="product-title"]',
    '[id*="product-name"]',
    '[itemprop="name"]',
    '#productTitle', // Amazon
    '.product-title',
    '.product-name',
    '[data-product-name]',
    '.a-size-large.product-title-word-break', // Amazon specific
    'h1.product_title', // WooCommerce
    '.product-info-main .page-title', // Magento
    '[class*="ProductName"]',
    '[class*="itemTitle"]'
  ];
  
  for (const selector of productSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent || element.getAttribute('data-product-name') || '';
      const cleaned = text.trim().replace(/\s+/g, ' ');
      if (cleaned.length > 0 && cleaned.length < 200) {
        console.log('Found item via selector:', selector, '→', cleaned);
        return cleaned;
      }
    }
  }
  
  // Priority 2: Open Graph meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content')?.trim();
    if (content && content.length < 200) {
      console.log('Found item via og:title →', content);
      return content;
    }
  }
  
  // Priority 3: First h1 on page
  const h1 = document.querySelector('h1');
  if (h1) {
    const text = h1.textContent?.trim().replace(/\s+/g, ' ');
    if (text && text.length > 0 && text.length < 200) {
      console.log('Found item via h1 →', text);
      return text;
    }
  }
  
  // Priority 4: Page title (clean up common suffixes)
  const pageTitle = document.title
    .replace(/\s*[-|]\s*(Amazon|eBay|Shop|Store|Buy|Price).*$/i, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  if (pageTitle && pageTitle.length > 0 && pageTitle.length < 200) {
    console.log('Found item via page title →', pageTitle);
    return pageTitle;
  }
  
  // Fallback: Unknown Item
  console.log('Could not determine item description, using fallback');
  return 'Unknown Item';
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

// Function to inject the popup
function injectPopup(itemIdentifier = null) {
  if (popupInjected) return;
  
  // Don't show popup if we already defeated the bot for this item
  if (itemIdentifier && defeatedItems.has(itemIdentifier)) {
    return;
  }
  
  // Extract price before showing popup
  currentPrice = extractPrice();
  console.log('Detected price:', currentPrice);
  
  // Extract item description
  const currentItemDescription = extractItemDescription();
  console.log('Detected item:', currentItemDescription);
  
  // Categorize the item
  const itemCategory = categorizeItem(currentItemDescription);
  console.log('Categorized as:', itemCategory);
  
  // Create detailed item info with timestamp
  currentItemInfo = {
    description: currentItemDescription,
    category: itemCategory,
    price: currentPrice,
    url: window.location.href,
    timestamp: Date.now(),
    domain: window.location.hostname
  };
  
  // Store the item info for the popup to access
  chrome.storage.local.set({ 
    currentPrice: currentPrice,
    currentItemDescription: currentItemDescription,
    currentItemInfo: currentItemInfo
  });
  
  // Log the impulse purchase attempt to backend
  logImpulsePurchaseAttempt(currentItemInfo);
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'impulse-blocker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0;
  `;
  
  // Create iframe for the popup
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('popup.html');
  iframe.style.cssText = `
    width: 100vw;
    height: 100vh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    margin: 0;
    padding: 0;
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
      
      // Log the outcome
      logPurchaseOutcome(currentItemInfo, event.data.allowPurchase);
      
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

// Log impulse purchase attempt to backend
async function logImpulsePurchaseAttempt(itemInfo) {
  try {
    // Get current stats
    const data = await chrome.storage.local.get(['stats', 'impulsePurchaseLogs']);
    const stats = data.stats || {
      totalBattles: 0,
      victories: 0,
      defeats: 0,
      moneySaved: 0,
      savingsHistory: [],
      recentBattles: []
    };
    
    const logs = data.impulsePurchaseLogs || [];
    
    // Add new log entry
    const logEntry = {
      ...itemInfo,
      attemptTimestamp: Date.now(),
      outcome: 'pending', // Will be updated when battle ends
      sessionId: getSessionId(),
      synced: false // Flag to track if synced to backend
    };
    
    logs.push(logEntry);
    
    // Keep only last 500 logs
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }
    
    // Save logs
    await chrome.storage.local.set({ impulsePurchaseLogs: logs });
    
    // Sync to Flask backend
    try {
      const response = await fetch('http://localhost:5000/api/log-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: itemInfo.description,
          category: itemInfo.category,
          price: itemInfo.price,
          url: itemInfo.url,
          domain: itemInfo.domain,
          outcome: 'pending'
        })
      });
      
      if (response.ok) {
        logEntry.synced = true;
        await chrome.storage.local.set({ impulsePurchaseLogs: logs });
        console.log('✅ Synced to backend:', logEntry);
      }
    } catch (syncError) {
      console.log('⚠️ Backend sync failed (will retry later):', syncError.message);
    }
    
    console.log('✅ Logged impulse purchase attempt:', logEntry);
  } catch (error) {
    console.error('❌ Failed to log impulse purchase attempt:', error);
  }
}

// Log purchase outcome (blocked or allowed)
async function logPurchaseOutcome(itemInfo, allowPurchase) {
  try {
    const data = await chrome.storage.local.get(['impulsePurchaseLogs', 'stats']);
    const logs = data.impulsePurchaseLogs || [];
    const stats = data.stats || {
      totalBattles: 0,
      victories: 0,
      defeats: 0,
      moneySaved: 0,
      savingsHistory: [],
      recentBattles: []
    };
    
    // Find the most recent pending log for this item
    const logIndex = logs.findIndex(log => 
      log.timestamp === itemInfo.timestamp && 
      log.outcome === 'pending'
    );
    
    if (logIndex !== -1) {
      const outcome = allowPurchase ? 'allowed' : 'blocked';
      logs[logIndex].outcome = outcome;
      logs[logIndex].outcomeTimestamp = Date.now();
      logs[logIndex].decisionTime = Date.now() - logs[logIndex].attemptTimestamp;
      
      // Update stats
      stats.totalBattles = (stats.totalBattles || 0) + 1;
      if (allowPurchase) {
        stats.defeats = (stats.defeats || 0) + 1;
      } else {
        stats.victories = (stats.victories || 0) + 1;
        stats.moneySaved = (stats.moneySaved || 0) + itemInfo.price;
      }
      
      await chrome.storage.local.set({ 
        impulsePurchaseLogs: logs,
        stats: stats
      });
      
      // Sync outcome to backend
      try {
        await fetch('http://localhost:5000/api/update-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_name: itemInfo.description,
            price: itemInfo.price,
            category: itemInfo.category,
            outcome: outcome,
            decision_time: logs[logIndex].decisionTime
          })
        });
        console.log(`✅ Synced outcome to backend: ${outcome}`);
      } catch (syncError) {
        console.log('⚠️ Backend outcome sync failed:', syncError.message);
      }
      
      console.log(`✅ Updated purchase outcome: ${outcome}`);
    }
  } catch (error) {
    console.error('❌ Failed to log purchase outcome:', error);
  }
}

// Get or create session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('impulseGuardSessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('impulseGuardSessionId', sessionId);
  }
  return sessionId;
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
