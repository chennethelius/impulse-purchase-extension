// content.js
const suspiciousPatterns = ["checkout", "cart", "purchase", "buy"];

if (suspiciousPatterns.some(p => window.location.href.includes(p))) {
  blockPage();
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
  console.log('💰 Scanning for prices...');
  
  const prices = [];
  
  // Price patterns - more flexible to catch various formats
  const pricePattern = /\$\s*([\d,]+(?:\.\d{2})?)|€\s*([\d,]+(?:\.\d{2})?)|£\s*([\d,]+(?:\.\d{2})?)|USD\s*([\d,]+(?:\.\d{2})?)/gi;
  
  // 1. Check elements with price-related attributes
  const priceSelectors = [
    '[itemprop="price"]',
    '[data-price]',
    '[class*="price"]:not([class*="shipping"])',
    '[class*="cost"]',
    '[class*="amount"]'
  ];
  
  priceSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      const text = el.textContent.trim();
      const match = text.match(pricePattern);
      if (match) {
        prices.push({ text: match[0], score: 30, element: el });
        console.log(`  💵 Price candidate: ${match[0]} (score: 30)`);
      }
    });
  });
  
  // 2. Scan all text for price patterns
  document.querySelectorAll('span, div, p, strong, b').forEach(el => {
    if (el.children.length === 0) {
      const text = el.textContent.trim();
      const matches = text.match(pricePattern);
      if (matches) {
        matches.forEach(match => {
          const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
          const score = fontSize > 16 ? 20 : 10;
          prices.push({ text: match, score, element: el });
          console.log(`  💵 Price candidate: ${match} (score: ${score})`);
        });
      }
    }
  });
  
  // 3. Check JSON-LD for price
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      const price = extractPriceFromJsonLd(data);
      if (price) {
        prices.push({ text: price, score: 50, element: null });
        console.log(`  💵 JSON-LD price: ${price} (score: 50)`);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  });
  
  // Filter out $0.00 and $0 prices
  const validPrices = prices.filter(p => {
    const amount = p.text.replace(/[^0-9.]/g, '');
    return parseFloat(amount) > 0;
  });
  
  // Sort by score and return best
  validPrices.sort((a, b) => b.score - a.score);
  
  if (validPrices.length > 0) {
    console.log(`  ✨ Best price: ${validPrices[0].text}`);
    return validPrices[0].text;
  }
  
  console.log('  ❌ No price found');
  return '';
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

function blockPage() {
  const productInfo = extractProductInfo();
  
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
      }
    } else if (event.data.action === 'hide-impulse-overlay') {
      const overlayIframe = document.getElementById('impulse-purchase-overlay');
      if (overlayIframe) {
        overlayIframe.style.display = 'none';
      }
    } else if (event.data.action === 'close-tab') {
      // Send message to background script to close the current tab
      chrome.runtime.sendMessage({ action: 'close-current-tab' });
    }
  });
}
