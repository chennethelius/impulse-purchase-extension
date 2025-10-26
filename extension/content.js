// content.js
const suspiciousPatterns = [
  "checkout",
  "cart",
  "purchase",
  "buy",
  "basket",
  "order",
  "payment",
  "billing",
  "gp/buy",           // Amazon buy now
  "gp/cart",          // Amazon cart
  "/buy/",            // Generic buy
  "/order/",          // Generic order
  "add-to-cart",      // Add to cart
  "addtocart",
  "shopping-cart",
  "shoppingcart",
  "bag",              // Shopping bag
  "proceed"           // Proceed to checkout
];

// Debounce configuration
const DEBOUNCE_TIME_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Log that content script is loaded
console.log('🛡️ Impulse Blocker loaded on:', window.location.href);

// Check if we should block the page
const shouldBlock = suspiciousPatterns.some(p => window.location.href.toLowerCase().includes(p));
console.log('🔍 Checking patterns... Should block?', shouldBlock);

if (shouldBlock) {
  console.log('✅ Suspicious pattern detected! Initiating block...');
  checkAndBlockPage();
} else {
  console.log('⏭️ No suspicious patterns found. Skipping block.');
}

// Function to check debounce before blocking
async function checkAndBlockPage() {
  const currentUrl = window.location.href;
  const currentDomain = window.location.hostname;
  
  const now = Date.now();
  
  // Use ONLY sessionStorage for per-tab tracking
  // This ensures new tabs get fresh start, but same tab stays debounced
  const sessionDebounceKey = `impulse_session_${currentDomain}`;
  const sessionBlocked = sessionStorage.getItem(sessionDebounceKey);
  
  if (sessionBlocked) {
    const sessionTimestamp = parseInt(sessionBlocked, 10);
    if ((now - sessionTimestamp) < DEBOUNCE_TIME_MS) {
      console.log(`⏰ Tab debouncing: Already blocked in this tab ${Math.floor((now - sessionTimestamp) / 1000)}s ago`);
      console.log('💡 Open a new tab to try again, or wait', Math.ceil((DEBOUNCE_TIME_MS - (now - sessionTimestamp)) / 1000), 'more seconds');
      return; // Don't show overlay again in same tab
    }
  }
  
  // No recent block found in this tab, proceed with blocking
  console.log('✅ No recent block found in this tab, showing overlay...');
  
  // Extract product info
  const productInfo = extractProductInfo();
  
  // Store the block timestamp in sessionStorage (per-tab only)
  sessionStorage.setItem(sessionDebounceKey, now.toString());
  
  // Actually block the page
  blockPageWithProductInfo(productInfo);
}

function extractProductInfo() {
  console.log('🔍 Starting aggressive product extraction...');
  
  // Try to extract product information from common e-commerce patterns
  let productName = '';
  let productPrice = '';
  let productCategory = '';
  
  // Words to filter out (checkout/cart related terms)
  const filterWords = /checkout|cart|shopping|payment|billing|shipping|order|summary|secure|confirm|sign.?in|log.?in|account|register/i;
  
  // Try common selectors for product name
  const nameSelectors = [
    'h1[class*="product"]',
    'h1[class*="title"]',
    '[class*="product-title"]',
    '[class*="product-name"]',
    '[data-testid*="product-title"]',
    '[itemprop="name"]',
    'h1',
    '.product-title',
    '#product-title'
  ];
  
  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      const text = element.textContent.trim();
      // Skip if it's checkout/cart related
      if (!filterWords.test(text) && text.length > 3) {
        productName = text;
        break;
      }
    }
  }
  
  // Try common selectors for price
  const priceSelectors = [
    '[class*="price"]:not([class*="shipping"])',
    '[data-testid*="price"]',
    '[itemprop="price"]',
    '.price',
    '#price',
    'span[class*="amount"]',
    '[class*="total"]'
  ];
  
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.match(/\$|€|£|\d+/)) {
      // Clean up price text - remove extra whitespace and labels
      let priceText = element.textContent.trim();
      priceText = priceText.replace(/\s+/g, ' '); // Replace multiple spaces with single space
      priceText = priceText.replace(/Order total:?/i, '').trim(); // Remove "Order total" label
      priceText = priceText.replace(/Subtotal:?/i, '').trim(); // Remove "Subtotal" label
      priceText = priceText.replace(/Total:?/i, '').trim(); // Remove "Total" label
      
      if (priceText && priceText.match(/\$|€|£|\d+/)) {
        productPrice = priceText;
        break;
      }
    }
  }
  
  // Try to get category from breadcrumbs or meta tags
  const breadcrumb = document.querySelector('[class*="breadcrumb"]');
  if (breadcrumb) {
    productCategory = breadcrumb.textContent.trim();
  }
  
  // Try to get from cart items if on checkout page
  if (!productName || filterWords.test(productName)) {
    // Look for cart items
    const cartItemSelectors = [
      '[class*="cart-item"] [class*="name"]',
      '[class*="cart-item"] [class*="title"]',
      '[class*="order-item"] [class*="name"]',
      '[class*="line-item"] [class*="title"]'
    ];
    
    for (const selector of cartItemSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        if (!filterWords.test(text) && text.length > 3) {
          productName = text;
          break;
        }
      }
    }
  }
  
  // Fallback to page title if no product name found
  if (!productName || filterWords.test(productName)) {
    const title = document.title.split('|')[0].split('-')[0].trim();
    if (!filterWords.test(title) && title.length > 3) {
      productName = title;
    }
  }
  
  // If still no valid product name, try meta tags
  if (!productName || filterWords.test(productName)) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
      const text = ogTitle.content.trim();
      if (!filterWords.test(text) && text.length > 3) {
        productName = text;
      }
    }
  }
  
  // AGGRESSIVE EXTRACTION - Analyze all text on page
  if (!productName || filterWords.test(productName)) {
    console.log('🔎 Using aggressive extraction...');
    productName = aggressiveProductExtraction();
  }
  
  // AGGRESSIVE PRICE EXTRACTION
  if (!productPrice || productPrice === 'Price not found') {
    console.log('💰 Using aggressive price extraction...');
    productPrice = aggressivePriceExtraction();
  }
  
  console.log('✅ Final extraction:', { productName, productPrice });
  
  return {
    name: productName || 'this item',
    price: productPrice || 'Price not found',
    category: productCategory || '',
    url: window.location.href,
    domain: window.location.hostname
  };
}

function aggressiveProductExtraction() {
  console.log('🧠 Analyzing entire page structure...');
  
  const filterWords = /checkout|cart|shopping|payment|billing|shipping|order|summary|secure|confirm|sign.?in|log.?in|account|register|continue|proceed|total|subtotal|tax|free|delivery/i;
  
  // Collect all potential product names with scoring
  const candidates = [];
  
  // 1. Check all headings (h1-h3)
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    const text = el.textContent.trim();
    if (text && text.length > 3 && text.length < 200 && !filterWords.test(text)) {
      const score = calculateProductScore(el, text);
      candidates.push({ text, score, source: 'heading' });
      console.log(`  📌 Heading candidate: "${text}" (score: ${score})`);
    }
  });
  
  // 2. Check elements with product-related attributes
  const productSelectors = [
    '[itemprop="name"]',
    '[data-product-name]',
    '[data-product-title]',
    '[data-item-name]',
    '[class*="product"][class*="name"]',
    '[class*="product"][class*="title"]',
    '[class*="item"][class*="name"]',
    '[class*="item"][class*="title"]'
  ];
  
  productSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length > 3 && text.length < 200 && !filterWords.test(text)) {
        const score = calculateProductScore(el, text) + 20; // Bonus for semantic markup
        candidates.push({ text, score, source: 'semantic' });
        console.log(`  🏷️ Semantic candidate: "${text}" (score: ${score})`);
      }
    });
  });
  
  // 3. Check largest text elements (likely product names)
  document.querySelectorAll('div, span, p, a').forEach(el => {
    // Only check elements with substantial text
    if (el.children.length === 0) { // Leaf nodes only
      const text = el.textContent.trim();
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      
      if (text && text.length > 5 && text.length < 150 && fontSize > 16 && !filterWords.test(text)) {
        const score = calculateProductScore(el, text) + (fontSize - 16) * 2;
        if (score > 10) {
          candidates.push({ text, score, source: 'text' });
          console.log(`  📝 Text candidate: "${text}" (score: ${score})`);
        }
      }
    }
  });
  
  // 4. Check meta tags
  const metaTags = [
    'og:title',
    'twitter:title',
    'og:product:title',
    'product:title'
  ];
  
  metaTags.forEach(tag => {
    const meta = document.querySelector(`meta[property="${tag}"], meta[name="${tag}"]`);
    if (meta && meta.content) {
      const text = meta.content.trim();
      if (!filterWords.test(text)) {
        candidates.push({ text, score: 30, source: 'meta' });
        console.log(`  🏷️ Meta candidate: "${text}" (score: 30)`);
      }
    }
  });
  
  // 5. Check JSON-LD structured data
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      const name = extractFromJsonLd(data);
      if (name && !filterWords.test(name)) {
        candidates.push({ text: name, score: 50, source: 'json-ld' });
        console.log(`  📊 JSON-LD candidate: "${name}" (score: 50)`);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  });
  
  // Sort by score and return best candidate
  candidates.sort((a, b) => b.score - a.score);
  
  if (candidates.length > 0) {
    console.log(`  ✨ Best candidate: "${candidates[0].text}" from ${candidates[0].source}`);
    return candidates[0].text;
  }
  
  console.log('  ❌ No candidates found');
  return '';
}

function calculateProductScore(element, text) {
  let score = 0;
  
  // Check element classes and IDs
  const className = element.className.toLowerCase();
  const id = element.id.toLowerCase();
  
  if (className.includes('product') || id.includes('product')) score += 15;
  if (className.includes('title') || id.includes('title')) score += 10;
  if (className.includes('name') || id.includes('name')) score += 10;
  if (className.includes('item') || id.includes('item')) score += 8;
  
  // Check parent elements
  let parent = element.parentElement;
  for (let i = 0; i < 3 && parent; i++) {
    const parentClass = parent.className.toLowerCase();
    if (parentClass.includes('product')) score += 5;
    if (parentClass.includes('item')) score += 3;
    parent = parent.parentElement;
  }
  
  // Text characteristics
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 2 && wordCount <= 10) score += 10; // Good length
  if (wordCount > 10) score -= 5; // Too long
  
  // Check if text looks like a product name (has capital letters, brand names, etc.)
  if (/[A-Z]/.test(text)) score += 5;
  if (/\d+/.test(text) && !/^\d+$/.test(text)) score += 3; // Has numbers but not only numbers
  
  return score;
}

function extractFromJsonLd(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const name = extractFromJsonLd(item);
      if (name) return name;
    }
  } else if (typeof data === 'object' && data !== null) {
    // Check for Product schema
    if (data['@type'] === 'Product' && data.name) {
      return data.name;
    }
    // Recursively check nested objects
    for (const key in data) {
      if (key === 'name' && typeof data[key] === 'string') {
        return data[key];
      }
      if (typeof data[key] === 'object') {
        const name = extractFromJsonLd(data[key]);
        if (name) return name;
      }
    }
  }
  return null;
}

function aggressivePriceExtraction() {
  console.log('💰 Starting AGGRESSIVE price extraction...');
  console.log('📄 Page URL:', window.location.href);
  
  const prices = [];
  
  // Simple and flexible price pattern
  const pricePattern = /[\$€£]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$€£]?/g;
  
  // Keywords in priority order
  const keywords = [
    'order total:',
    'order total',
    'grand total:',
    'grand total',
    'total:',
    'total cost:',
    'total amount:',
    'amount due:',
    'subtotal:',
    'subtotal',
    'total'
  ];
  
  console.log('🔍 Searching page text for keywords...');
  
  // Get ALL text content from the page
  const allText = document.body.innerText || document.body.textContent;
  const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log(`📝 Found ${lines.length} lines of text on page`);
  
  // Search each line for keywords
  lines.forEach((line, index) => {
    const lineLower = line.toLowerCase();
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      
      if (lineLower.includes(keyword)) {
        console.log(`✅ FOUND KEYWORD "${keyword}" in line ${index}:`, line);
        
        // Extract ALL numbers that look like prices from this line
        const matches = line.matchAll(/[\$€£]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$€£]|(\d{1,3}(?:,\d{3})*\.\d{2})/g);
        
        for (const match of matches) {
          const priceText = match[0];
          const numericValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
          
          if (numericValue > 0) {
            const score = 300 - (i * 10); // Higher score for better keywords
            console.log(`   💰 Extracted price: ${priceText} (${numericValue}) - Score: ${score}`);
            
            prices.push({
              text: priceText,
              value: numericValue,
              score: score,
              keyword: keyword,
              line: line,
              lineIndex: index
            });
          }
        }
        
        // Also check the NEXT line (price might be on separate line)
        if (index + 1 < lines.length) {
          const nextLine = lines[index + 1];
          console.log(`   📋 Checking next line:`, nextLine);
          
          const nextMatches = nextLine.matchAll(/[\$€£]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$€£]|(\d{1,3}(?:,\d{3})*\.\d{2})/g);
          
          for (const match of nextMatches) {
            const priceText = match[0];
            const numericValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            
            if (numericValue > 0) {
              const score = 290 - (i * 10); // Slightly lower for next line
              console.log(`   💰 Price on next line: ${priceText} (${numericValue}) - Score: ${score}`);
              
              prices.push({
                text: priceText,
                value: numericValue,
                score: score,
                keyword: keyword + ' (next line)',
                line: nextLine,
                lineIndex: index + 1
              });
            }
          }
        }
        
        break; // Found keyword, stop checking other keywords for this line
      }
    }
  });
  
  // Fallback: Check for elements with specific classes/IDs
  console.log('� Checking DOM elements with total/order classes...');
  
  const selectors = [
    '[class*="total"][class*="price"]',
    '[class*="order-total"]',
    '[class*="ordertotal"]',
    '[class*="grand-total"]',
    '[class*="grandtotal"]',
    '[id*="total"]',
    '[id*="order-total"]',
    '[data-total]',
    '.total',
    '#total',
    '.order-total',
    '#order-total'
  ];
  
  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        const text = el.textContent.trim();
        const matches = text.matchAll(/[\$€£]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$€£]|(\d{1,3}(?:,\d{3})*\.\d{2})/g);
        
        for (const match of matches) {
          const priceText = match[0];
          const numericValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
          
          if (numericValue > 0) {
            console.log(`   � DOM element (${selector}): ${priceText} (${numericValue})`);
            
            prices.push({
              text: priceText,
              value: numericValue,
              score: 100,
              keyword: `DOM:${selector}`,
              line: text,
              element: el
            });
          }
        }
      });
    } catch (e) {
      // Skip invalid selectors
    }
  });
  
  // Filter and sort
  console.log(`\n📊 Total prices found: ${prices.length}`);
  
  if (prices.length === 0) {
    console.log('❌ NO PRICES FOUND - Dumping all page text:');
    console.log(allText.substring(0, 1000)); // First 1000 chars
    return '';
  }
  
  // Remove duplicates, keep highest score
  const uniquePrices = new Map();
  prices.forEach(p => {
    const key = p.value.toFixed(2);
    if (!uniquePrices.has(key) || uniquePrices.get(key).score < p.score) {
      uniquePrices.set(key, p);
    }
  });
  
  const finalPrices = Array.from(uniquePrices.values());
  finalPrices.sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 TOP 5 PRICE CANDIDATES:');
  finalPrices.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.text} - Score: ${p.score} - Keyword: "${p.keyword}"`);
    console.log(`   Line: "${p.line}"`);
  });
  
  const bestPrice = finalPrices[0];
  console.log(`\n✨ SELECTED BEST PRICE: ${bestPrice.text} (Score: ${bestPrice.score})`);
  console.log(`   Found with keyword: "${bestPrice.keyword}"`);
  console.log(`   Full line: "${bestPrice.line}"`);
  
  // Format the price nicely
  return `$${bestPrice.value.toFixed(2)}`;
}

function extractPriceFromJsonLd(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const price = extractPriceFromJsonLd(item);
      if (price) return price;
    }
  } else if (typeof data === 'object' && data !== null) {
    if (data['@type'] === 'Product' && data.offers) {
      const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      if (offers.price) {
        return `$${offers.price}`;
      }
    }
    if (data.price) {
      return typeof data.price === 'string' ? data.price : `$${data.price}`;
    }
    for (const key in data) {
      if (typeof data[key] === 'object') {
        const price = extractPriceFromJsonLd(data[key]);
        if (price) return price;
      }
    }
  }
  return null;
}

function blockPageWithProductInfo(productInfo) {
  
  // Pass product info via URL parameters
  const params = new URLSearchParams({
    product: productInfo.name,
    price: productInfo.price,
    category: productInfo.category,
    url: productInfo.url,
    domain: productInfo.domain
  });
  
  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("overlay.html") + '?' + params.toString();
  iframe.style.position = "fixed";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100vw";
  iframe.style.height = "100vh";
  iframe.style.border = "none";
  iframe.style.zIndex = 999999;
  iframe.style.backgroundColor = "rgba(0,0,0,0.8)";
  iframe.id = "impulse-purchase-overlay";
  document.body.appendChild(iframe);
  
  // Listen for messages from the iframe to remove it
  window.addEventListener('message', (event) => {
    if (event.data.action === 'remove-impulse-overlay') {
      const overlayIframe = document.getElementById('impulse-purchase-overlay');
      if (overlayIframe) {
        overlayIframe.remove();
        // DON'T clear debounce when proceeding - we want to prevent popup on next checkout step
      }
    } else if (event.data.action === 'hide-impulse-overlay') {
      const overlayIframe = document.getElementById('impulse-purchase-overlay');
      if (overlayIframe) {
        overlayIframe.style.display = 'none';
      }
    } else if (event.data.action === 'close-tab') {
      // Clear debounce when user cancels purchase (closes tab)
      clearDebounceForProduct(productInfo);
      // Send message to background script to close the current tab
      chrome.runtime.sendMessage({ action: 'close-current-tab' });
    }
  });
}

// Keep original blockPage function for compatibility
function blockPage() {
  checkAndBlockPage();
}

// Clear debounce for this tab
async function clearDebounceForProduct(productInfo) {
  try {
    const currentDomain = window.location.hostname;
    
    // Clear from sessionStorage (per-tab)
    sessionStorage.removeItem(`impulse_session_${currentDomain}`);
    
    console.log('🔓 Tab debounce cleared for:', productInfo.name);
  } catch (error) {
    console.error('Error clearing debounce:', error);
  }
}

// Watch for URL changes (for single-page apps like modern e-commerce sites)
let lastUrl = window.location.href;

function checkUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    console.log('🔄 URL changed to:', currentUrl);
    lastUrl = currentUrl;
    
    // Check if new URL matches suspicious patterns
    const shouldBlock = suspiciousPatterns.some(p => currentUrl.toLowerCase().includes(p));
    if (shouldBlock) {
      console.log('✅ New URL matches pattern! Checking block...');
      checkAndBlockPage();
    }
  }
}

// Monitor URL changes (for SPAs)
setInterval(checkUrlChange, 1000);

// Also watch for history changes
window.addEventListener('popstate', () => {
  console.log('📍 History state changed');
  checkUrlChange();
});

// Watch for pushState/replaceState (used by SPAs)
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
  originalPushState.apply(this, arguments);
  console.log('📍 pushState detected');
  checkUrlChange();
};

history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  console.log('📍 replaceState detected');
  checkUrlChange();
};

console.log('🛡️ Impulse Blocker: All watchers active');
