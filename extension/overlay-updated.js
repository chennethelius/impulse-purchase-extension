// DOM Elements
const modalContainer = document.getElementById('modal-container');
const statusIcon = document.getElementById('status-icon');
const gradeDisplay = document.getElementById('grade-display');
const timerDisplay = document.getElementById('timer-display');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const resultSection = document.getElementById('result-section');
const inputSection = document.getElementById('input-section');
const chatSection = document.getElementById('chat-section');
const statusSection = document.getElementById('status-section');
const finalGrade = document.getElementById('final-grade');
const resultMessage = document.getElementById('result-message');
const proceedBtn = document.getElementById('proceed-btn');
const reconsiderBtn = document.getElementById('reconsider-btn');

// Timer and grading state
let timeRemaining = 60; // 1 minute in seconds
let timerInterval;
let isTimerRunning = false;
let currentGrade = 'F'; // Start with F - earn your grade
let totalScore = 0; // Start at zero - must earn points
let messageCount = 0;
let conversationHistory = [];

// Product information from URL params
let productInfo = {
  name: 'Unknown Product',
  price: 'Price not found',
  category: '',
  url: '',
  domain: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

function initialize() {
  // Extract product info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  productInfo.name = urlParams.get('product') || 'Unknown Product';
  productInfo.price = urlParams.get('price') || 'Price not found';
  productInfo.category = urlParams.get('category') || '';
  productInfo.url = urlParams.get('url') || '';
  productInfo.domain = urlParams.get('domain') || '';
  
  // Add initial system message with product info
  let productText;
  if (productInfo.name !== 'Unknown Product' && productInfo.name !== 'this item') {
    productText = `You're attempting to purchase: "${productInfo.name}" (${productInfo.price})`;
  } else {
    productText = 'You have 1 minute to justify your purchase';
  }
  addMessage('system', `${productText}. Explain why you need this item.`);
  
  // Start timer when user starts typing
  userInput.addEventListener('input', () => {
    if (!isTimerRunning && userInput.value.trim().length > 0) {
      startTimer();
    }
  });

  // Handle send button
  sendBtn.addEventListener('click', handleSendMessage);
  
  // Handle enter key
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Handle reconsider button
  reconsiderBtn.addEventListener('click', () => {
    window.top.document.querySelector('iframe').remove();
  });
  
  // Handle proceed button - always enabled now
  proceedBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage(
      { type: "requestUnlock", domain: window.location.hostname },
      () => {
        window.top.document.querySelector('iframe').remove();
      }
    );
  });
}

function startTimer() {
  if (isTimerRunning) return;
  
  isTimerRunning = true;
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 10) {
      timerDisplay.classList.add('urgent');
    }
    
    if (timeRemaining <= 0) {
      endAssessment();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function flashIcon() {
  statusIcon.classList.add('icon-flash');
  setTimeout(() => {
    statusIcon.classList.remove('icon-flash');
  }, 300);
}

function updateStatusIcon(grade) {
  const icons = {
    warning: document.getElementById('icon-warning'),
    minus: document.getElementById('icon-minus'),
    thumbsUp: document.getElementById('icon-thumbs-up'),
    star: document.getElementById('icon-star'),
    checkmark: document.getElementById('icon-checkmark')
  };
  
  // Hide all icons
  Object.values(icons).forEach(icon => {
    if (icon) icon.style.display = 'none';
  });
  
  // Show appropriate icon based on grade
  statusIcon.className = '';
  
  if (grade === 'A') {
    icons.checkmark.style.display = 'block';
    statusIcon.className = 'excellent';
  } else if (grade === 'B') {
    icons.star.style.display = 'block';
    statusIcon.className = 'good';
  } else if (grade === 'C') {
    icons.thumbsUp.style.display = 'block';
    statusIcon.className = 'satisfactory';
  } else if (grade === 'D') {
    icons.minus.style.display = 'block';
    statusIcon.className = 'poor';
  } else {
    icons.warning.style.display = 'block';
    statusIcon.className = 'warning';
  }
  
  // Update grade display
  gradeDisplay.style.display = 'block';
  gradeDisplay.textContent = grade;
  gradeDisplay.className = `grade-${grade}`;
}

function calculateGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

async function handleSendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;
  
  if (!isTimerRunning) {
    startTimer();
  }
  
  // Disable input while processing
  sendBtn.disabled = true;
  userInput.disabled = true;
  
  // Add user message
  addMessage('user', userText);
  conversationHistory.push({ role: 'user', content: userText });
  messageCount++;
  
  // Flash icon when message sent
  flashIcon();
  
  // Clear input
  userInput.value = '';
  
  try {
    // Get AI response with scoring
    const response = await evaluateArgument(userText);
    
    // Add AI message with typing animation
    await addMessageWithTyping('ai', response.feedback);
    conversationHistory.push({ role: 'assistant', content: response.feedback });
    
    // Update score and grade - can go down!
    totalScore = Math.max(0, Math.min(100, totalScore + response.points));
    currentGrade = calculateGrade(totalScore);
    updateStatusIcon(currentGrade);
    
  } catch (error) {
    console.error('Error evaluating argument:', error);
    await addMessageWithTyping('ai', 'That\'s a fair point. Keep explaining your reasoning.');
  }
  
  // Re-enable input
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
}

async function typeText(element, text, speed = 20) {
  element.textContent = '';
  element.classList.add('typing');
  
  for (let i = 0; i < text.length; i++) {
    element.textContent += text.charAt(i);
    // Auto-scroll during typing
    chatMessages.scrollTop = chatMessages.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, speed));
  }
  
  element.classList.remove('typing');
  // Final scroll after typing complete
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function addMessageWithTyping(type, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  chatMessages.appendChild(messageDiv);
  
  // Smooth scroll to bottom before typing
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
  
  if (type === 'ai') {
    await typeText(messageDiv, text, 20); // Fast typing speed (20ms per character)
  } else {
    messageDiv.textContent = text;
  }
  
  // Final smooth scroll
  setTimeout(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }, 100);
}

function addMessage(type, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  
  // Smooth auto-scroll
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

async function evaluateArgument(userText) {
  // Strict scoring - only relevant arguments count
  const qualityIndicators = {
    // Positive indicators (must be specific and relevant)
    strongNeed: /replace|broken|essential|emergency|medical|safety|work.?requirement/i,
    budgetPlanned: /saved.?for|budgeted|allocated|can.?afford|within.?budget|price.?compared/i,
    specificUse: /will.?use.?for|need.?it.?to|helps.?me|solves|fixes|improves/i,
    research: /researched|compared|reviews|cheapest|best.?value|alternatives/i,
    longTerm: /years|investment|durable|warranty|reliable|last/i,
    
    // Negative indicators (weak arguments)
    vague: /just|maybe|probably|might|could|sometime|eventually/i,
    emotional: /want|desire|wish|dream|love|excited|cool|awesome|amazing/i,
    impulsive: /now|today|immediately|quick|sale.?ends|limited.?time/i,
    irrelevant: /honest|trying|please|come.?on|whatever|fine|okay/i,
    repetitive: /said|already|mentioned|told.?you/i
  };
  
  let points = 0; // No base points - must earn them
  let feedback = '';
  const textLower = userText.toLowerCase();
  const productNameLower = productInfo.name.toLowerCase();
  
  // Check if they mention the actual product (bonus for specificity)
  const hasValidProductName = productInfo.name !== 'Unknown Product' && 
    productInfo.name !== 'this item' && 
    productInfo.name.length > 5;
  
  const mentionsProduct = hasValidProductName && 
    (textLower.includes(productNameLower) || 
     productNameLower.split(' ').some(word => word.length > 3 && textLower.includes(word)));
  
  // Check for specific, relevant arguments only
  let hasRelevantPoint = false;
  
  if (qualityIndicators.strongNeed.test(userText)) {
    points += 20;
    hasRelevantPoint = true;
  }
  if (qualityIndicators.budgetPlanned.test(userText)) {
    points += 15;
    hasRelevantPoint = true;
  }
  if (qualityIndicators.specificUse.test(userText) && userText.length > 30) {
    points += 10;
    hasRelevantPoint = true;
  }
  if (qualityIndicators.research.test(userText)) {
    points += 15;
    hasRelevantPoint = true;
  }
  if (qualityIndicators.longTerm.test(userText)) {
    points += 10;
    hasRelevantPoint = true;
  }
  
  // Bonus for mentioning the specific product
  if (mentionsProduct && hasRelevantPoint) {
    points += 5;
  }
  
  // Penalties for weak/irrelevant arguments
  if (qualityIndicators.vague.test(userText)) points -= 10;
  if (qualityIndicators.emotional.test(userText)) points -= 15;
  if (qualityIndicators.impulsive.test(userText)) points -= 20;
  if (qualityIndicators.irrelevant.test(userText)) points -= 25;
  if (qualityIndicators.repetitive.test(userText)) points -= 15;
  
  // Extra penalty for generic arguments that don't address the specific product
  if (hasRelevantPoint && !mentionsProduct && hasValidProductName) {
    points -= 5; // Generic argument penalty
  }
  
  // No points for just being "honest" or other fluff
  if (textLower.includes('honest') && !hasRelevantPoint) {
    points = -20; // Penalize heavily for using honesty as justification
  }
  
  // Points can go negative (grade can decrease)
  points = Math.max(-30, Math.min(30, points));
  
  // Strict feedback with product context
  const productContext = hasValidProductName ? ` for ${productInfo.name}` : '';
  
  if (points >= 25) {
    feedback = `Strong justification with specific, practical reasons${productContext}.`;
  } else if (points >= 15) {
    feedback = `Decent reasoning, but be more specific about why you need this${hasValidProductName ? ' exact product' : ''}.`;
  } else if (points >= 5) {
    feedback = `Weak argument. How does ${hasValidProductName ? 'this product' : 'this purchase'} solve your problem?`;
  } else if (points >= 0) {
    feedback = `That's not a valid reason${productContext}. Explain the actual problem this solves.`;
  } else {
    feedback = `Poor justification. You're making emotional arguments, not logical ones.`;
  }
  
  // Try Cerebras API if available
  try {
    const aiResponse = await callCerebrasAPI(userText, totalScore);
    if (aiResponse) {
      feedback = aiResponse.feedback;
      points = aiResponse.points;
    }
  } catch (error) {
    console.log('Using local evaluation');
  }
  
  return { feedback, points };
}

async function callCerebrasAPI(userText, currentTotalScore) {
  const hasValidProductName = productInfo.name !== 'Unknown Product' && 
    productInfo.name !== 'this item' && 
    productInfo.name.length > 5;
    
  const productContext = hasValidProductName
    ? `\n\nPRODUCT BEING PURCHASED:\n- Name: ${productInfo.name}\n- Price: ${productInfo.price}\n- Category: ${productInfo.category || 'Unknown'}\n- Site: ${productInfo.domain}` 
    : '';
  
  const systemPrompt = `You are a strict purchase advisor evaluating justifications. Only reward RELEVANT, PRACTICAL arguments.
Current score: ${currentTotalScore}/100
Current grade: ${calculateGrade(currentTotalScore)}${productContext}

USER'S ARGUMENT: "${userText}"

${hasValidProductName 
  ? `Evaluate if their argument is relevant to THIS SPECIFIC PRODUCT. Consider:
- Does the product actually solve the problem they describe?
- Is this product appropriate for their stated need?
- Are they justifying the right product or making generic arguments?
- Does the price match the value they're claiming?`
  : `Evaluate if their argument shows genuine necessity for this purchase. Consider:
- Is there a specific problem being solved?
- Have they demonstrated budget planning?
- Is this a practical need or emotional want?`
}

BE STRICT: Award -30 to +30 points.
POSITIVE points ONLY for: specific need${hasValidProductName ? ' matching this product' : ''}, budget planning, research, practical daily use, solving real problems
NEGATIVE points for: vague statements, emotional appeals, "being honest", impulsiveness, irrelevant comments${hasValidProductName ? ', generic arguments that don\'t address this specific product' : ''}

Do NOT give points for: honesty, trying, wanting, loving, excitement, or other emotional/irrelevant reasons

Respond with:
1. Brief critical feedback (1-2 sentences)${hasValidProductName ? ' addressing how their argument relates to THIS product' : ''}
2. Points awarded (can be negative!)

Format: 
[FEEDBACK]: Your feedback here
[POINTS]: X`;

  const requestBody = {
    model: "llama3.1-8b",
    messages: [
      {
        role: "system",
        content: "You are a strict purchase advisor evaluating if purchases are truly necessary. Only reward practical, specific arguments."
      },
      {
        role: "user",
        content: systemPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 150
  };

  try {
    const response = await fetch(CONFIG.CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse response
    const feedbackMatch = content.match(/\[FEEDBACK\]:\s*(.+?)(?=\[POINTS\]|$)/s);
    const pointsMatch = content.match(/\[POINTS\]:\s*(-?\d+)/); // Handle negative numbers
    
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : content;
    const points = pointsMatch ? Math.max(-30, Math.min(30, parseInt(pointsMatch[1]))) : 0;
    
    return { feedback, points };
  } catch (error) {
    console.error('Cerebras API error:', error);
    return null;
  }
}

function generateAlternatives() {
  // Generate mock alternative products based on the actual product
  const productName = productInfo.name !== 'Unknown Product' ? productInfo.name : 'Similar Item';
  const basePrice = extractNumericPrice(productInfo.price);
  
  const alternatives = [
    {
      price: basePrice > 0 ? Math.floor(basePrice * 0.6) : Math.floor(Math.random() * 50) + 20,
      title: `Refurbished ${productName}`,
      source: "eBay"
    },
    {
      price: basePrice > 0 ? Math.floor(basePrice * 0.7) : Math.floor(Math.random() * 40) + 15,
      title: `Generic Alternative`,
      source: "Amazon"
    },
    {
      price: basePrice > 0 ? Math.floor(basePrice * 0.5) : Math.floor(Math.random() * 30) + 10,
      title: `Previous Year Model`,
      source: "BestBuy"
    }
  ];
  
  return alternatives.sort((a, b) => a.price - b.price);
}

function extractNumericPrice(priceString) {
  const match = priceString.match(/[\d,]+\.?\d*/);  
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

function displayAlternatives() {
  const alternatives = generateAlternatives();
  const boxes = document.querySelectorAll('.alternative-box');
  
  alternatives.forEach((alt, index) => {
    if (boxes[index]) {
      boxes[index].querySelector('.alt-price').textContent = `$${alt.price}`;
      boxes[index].querySelector('.alt-title').textContent = alt.title;
      boxes[index].querySelector('.alt-source').textContent = alt.source;
      
      // Add click handler to search for alternative
      boxes[index].onclick = () => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(alt.title)}`, '_blank');
      };
    }
  });
}

function endAssessment() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  
  // Hide input and chat sections
  inputSection.style.display = 'none';
  chatSection.style.display = 'none';
  statusSection.style.display = 'none';
  
  // Show result section
  resultSection.style.display = 'flex';
  
  // Set final grade
  finalGrade.textContent = currentGrade;
  finalGrade.className = `grade-circle grade-${currentGrade}`;
  
  // Set result message based on grade - all encouraging
  const messages = {
    'A': "Excellent justification! You've clearly thought this through carefully. Your purchase is well-justified.",
    'B': "Good reasoning! You've made solid points about why this purchase makes sense for you.",
    'C': "Fair justification. You've given it some thought. Consider the alternatives below to ensure you're getting the best value.",
    'D': "You've started thinking about this purchase. The alternatives below might offer better value for your needs.",
    'F': "Take a moment to review the alternatives below. Sometimes a different option can better meet your needs."
  };
  
  resultMessage.textContent = messages[currentGrade];
  
  // Display alternatives
  displayAlternatives();
  
  // Proceed button is always enabled now
  proceedBtn.disabled = false;
}
