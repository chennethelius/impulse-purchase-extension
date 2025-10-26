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

// Timer and evaluation state
let timeRemaining = 120; // 2 minutes in seconds
let timerInterval;
let isTimerRunning = false;
let totalTimeSaved = 0;
let messageHistory = [];
let conversationMessages = []; // Full conversation for AI context
let previousArguments = new Set(); // Track previous arguments to prevent repetition

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
    productText = `Purchasing: "${productInfo.name}" (${productInfo.price})`;
  } else {
    productText = 'Attempting to checkout';
  }
  
  addMessage('system', `${productText}\n\n⏱️ Wait time: 2 minutes\n💡 Good reasoning reduces your wait time!`);
  
  // Start searching for alternatives immediately
  displayAlternatives().catch(err => console.error('Error displaying alternatives:', err));
  
  // Start timer immediately
  startTimer();
  
  // Set up auto-scroll observer
  setupAutoScroll();
  
  // Handle send button
  sendBtn.addEventListener('click', handleSendMessage);
  
  // Handle enter key
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Handle cancel purchase button - close the entire tab
  reconsiderBtn.addEventListener('click', async () => {
    // Update stats - purchase was blocked
    await updateStats(false);
    
    // Send message to background script to close the tab
    try {
      window.parent.postMessage({ action: 'close-tab' }, '*');
      
      // Also try to close the window directly
      if (window.parent && window.parent !== window) {
        window.parent.close();
      }
      
      // If we're in the top window, close it
      window.close();
    } catch (e) {
      console.log('Could not close tab:', e);
      // Fallback: try to remove the overlay
      window.parent.postMessage({ action: 'remove-impulse-overlay' }, '*');
    }
  });
  
  // Handle proceed button
  proceedBtn.addEventListener('click', async () => {
    // Update stats - purchase was allowed
    await updateStats(true);
    
    // Try to remove the iframe from parent window
    try {
      // Send message to parent window to remove iframe
      window.parent.postMessage({ action: 'remove-impulse-overlay' }, '*');
      
      // Also try direct removal if we have access
      if (window.parent && window.parent.document) {
        const iframe = window.parent.document.querySelector('iframe[src*="overlay.html"]');
        if (iframe) {
          iframe.remove();
        }
      }
    } catch (e) {
      // If cross-origin blocks access, at least hide the iframe
      console.log('Could not remove iframe, attempting to hide:', e);
      window.parent.postMessage({ action: 'hide-impulse-overlay' }, '*');
    }
  });
}

function setupAutoScroll() {
  let scrollTimeout;
  
  // Create a MutationObserver to watch for new messages
  const observer = new MutationObserver((mutations) => {
    // Throttle scroll calls to prevent spam
    if (scrollTimeout) return;
    
    scrollTimeout = setTimeout(() => {
      scrollToBottom();
      scrollTimeout = null;
    }, 50); // Only scroll every 50ms max
  });
  
  // Observe the chat messages container
  observer.observe(chatMessages, {
    childList: true,
    subtree: false, // Don't watch deep changes to prevent spam
    characterData: false // Don't watch text changes during typing
  });
}

function startTimer() {
  if (isTimerRunning) return;
  
  isTimerRunning = true;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 0) {
      endWaitingPeriod();
    }
  }, 1000);
}

function updateTimerDisplay(shouldFlash = false) {
  const minutes = Math.floor(Math.max(0, timeRemaining) / 60);
  const seconds = Math.max(0, timeRemaining) % 60;
  
  // Check if elements exist, if not create them
  let timerMain = timerDisplay.querySelector('.timer-main');
  let timeSavedDiv = timerDisplay.querySelector('.time-saved');
  
  if (!timerMain) {
    timerMain = document.createElement('div');
    timerMain.className = 'timer-main';
    timerDisplay.appendChild(timerMain);
  }
  
  // Update timer text
  timerMain.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Only update saved time if it changed
  if (totalTimeSaved > 0) {
    if (!timeSavedDiv) {
      timeSavedDiv = document.createElement('div');
      timeSavedDiv.className = 'time-saved';
      timerDisplay.appendChild(timeSavedDiv);
    }
    timeSavedDiv.textContent = `-${totalTimeSaved}s saved!`;
  }
  
  // Update urgency styling
  if (timeRemaining <= 10 && timeRemaining > 0) {
    timerDisplay.classList.add('urgent');
  } else if (timeRemaining <= 0) {
    timerDisplay.classList.add('complete');
  }
  
  // Flash ONLY the timer-main on time reduction
  if (shouldFlash) {
    timerMain.classList.add('flash-success');
    setTimeout(() => {
      timerMain.classList.remove('flash-success');
    }, 500);
  }
}

async function handleSendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;
  
  // Disable input while processing
  sendBtn.disabled = true;
  userInput.disabled = true;
  
  // Add user message
  addMessage('user', userText);
  
  // Store user message in conversation history
  conversationMessages.push({
    role: 'user',
    content: userText
  });
  
  // Clear input
  userInput.value = '';
  
  try {
    // Evaluate the argument and calculate time reduction
    const evaluation = await evaluateArgumentForTimeReduction(userText);
    
    // Store AI response in conversation history
    conversationMessages.push({
      role: 'assistant',
      content: evaluation.feedback
    });
    
    // Add AI response with typing animation
    if (evaluation.timeReduction > 0) {
      // Good argument - reduce time
      await addTypingMessage('ai', evaluation.feedback, 'time-reduction', evaluation.timeReduction);
      
      // Apply time reduction with animation
      await applyTimeReduction(evaluation.timeReduction);
    } else {
      // Neutral response (0 time) - no penalty, just no reward
      await addTypingMessage('ai', evaluation.feedback, 'neutral', 0);
    }
    
  } catch (error) {
    console.error('Error evaluating argument:', error);
    await addMessageWithAnimation('ai', 'Please provide more specific reasoning.', 'neutral', 0);
  }
  
  // Re-enable input
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
}

async function evaluateArgumentForTimeReduction(userText) {
  const textLower = userText.toLowerCase();
  const wordCount = userText.split(/\s+/).length;
  
  // Anti-cheesing checks - ONLY catch obvious abuse
  const cheatingPatterns = {
    repetitive: checkForRepetition(userText),
    gibberish: checkForGibberish(userText),
    copypaste: checkForCopyPaste(userText),
    spam: wordCount > 300, // Only flag if extremely long
    tooShort: wordCount < 2 // Only flag single words
  };
  
  // Only penalize obvious cheating - but don't subtract time, just give 0
  if (cheatingPatterns.gibberish) {
    const feedback = await getAIPenaltyFeedback('gibberish', userText);
    return { feedback: feedback || "That doesn't make sense. Write a real justification!", timeReduction: 0 };
  }
  
  if (cheatingPatterns.copypaste) {
    return { feedback: "You already said that exact thing. Try a new angle!", timeReduction: 0 };
  }
  
  if (cheatingPatterns.spam) {
    return { feedback: "Way too long. Keep it concise!", timeReduction: 0 };
  }
  
  if (cheatingPatterns.tooShort) {
    return { feedback: "Give me at least a few words to work with.", timeReduction: 0 };
  }
  
  // Allow repetitive arguments - just evaluate them normally
  // People might need to rephrase or expand on previous points
  
  // Try AI evaluation first
  try {
    const aiEval = await callCerebrasForEvaluation(userText);
    if (aiEval) {
      // Store argument for repetition checking
      messageHistory.push({
        text: userText,
        words: new Set(textLower.split(/\s+/)),
        time: Date.now()
      });
      return aiEval;
    }
  } catch (error) {
    console.log('AI evaluation failed, using fallback:', error);
  }
  
  // Fallback to local evaluation if AI fails
  return fallbackEvaluation(userText);
}

async function callCerebrasForEvaluation(userText) {
  console.log('🔍 Checking for Cerebras API key...');
  console.log('window.CEREBRAS_API_KEY exists?', !!window.CEREBRAS_API_KEY);
  console.log('API key length:', window.CEREBRAS_API_KEY ? window.CEREBRAS_API_KEY.length : 0);
  console.log('API key starts with:', window.CEREBRAS_API_KEY ? window.CEREBRAS_API_KEY.substring(0, 10) + '...' : 'N/A');
  
  if (!window.CEREBRAS_API_KEY) {
    console.log('⚠️ No Cerebras API key found! Add window.CEREBRAS_API_KEY to config.js for AI responses.');
    console.log('Using fallback evaluation instead of AI...');
    return null;
  }
  
  console.log('✅ API key found! Attempting to call Cerebras API...');
  
  const hasValidProductName = productInfo.name !== 'Unknown Product' && 
    productInfo.name !== 'this item' && 
    productInfo.name.length > 5;
  
  const productContext = hasValidProductName
    ? `\nPRODUCT: ${productInfo.name} (${productInfo.price})`
    : '';
  
  const systemPrompt = `You're helping someone think critically about a purchase.${productContext}

USER: "${userText}"

STRICT RULES FOR TIME:

GIVE TIME ONLY IF:
- Something is BROKEN/DAMAGED and needs replacement
- They've SAVED MONEY specifically for this
- They've done RESEARCH (compared prices, read reviews)
- It's for WORK/SCHOOL (required, not optional)
- Give -30 to -60s

GIVE LITTLE TIME IF:
- Vague but mentions practical need
- Give -9 to -15s

GIVE ZERO TIME IF:
- Any mention of feelings (want, like, feel, cool, fun)
- Social reasons (fit in, look good, impress)
- "Because" without practical reason
- Anything emotional or social
- Give 0s - BE STRICT!

Keep it SHORT (1-2 sentences). Quote their words. Be helpful.

YOU MUST USE THIS EXACT FORMAT:
[FEEDBACK]: Your response here
[TIME]: number

EXAMPLES:

Valid (broken):
[FEEDBACK]: "'Laptop broke' - that's a real need. Have you checked refurb prices?"
[TIME]: -45

Weak (vague):
[FEEDBACK]: "'Need it' - okay, but for what specifically? What problem does it solve?"
[TIME]: -15

Emotional (ZERO):
[FEEDBACK]: "'Want to fit in' is a social feeling, not a practical need. What actual function does this serve?"
[TIME]: 0

Feeling (ZERO):
[FEEDBACK]: "Feelings aren't reasons. Does this solve a real problem or is it just emotional?"
[TIME]: 0`;

  try {
    // Build messages array with full conversation history
    const messages = [
      {
        role: "system",
        content: "You help people think critically. MUST use format: [FEEDBACK]: message [TIME]: number. BE STRICT: Only give time for broken/saved/researched/required. Feelings/social/want = 0s ALWAYS. Keep SHORT."
      },
      {
        role: "user",
        content: systemPrompt
      }
    ];
    
    // Add all previous conversation messages for context
    if (conversationMessages.length > 0) {
      // Include conversation history (limit to last 10 exchanges to avoid token limits)
      const recentConversation = conversationMessages.slice(-10);
      messages.push(...recentConversation);
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: `They said: "${userText}"\n\nRespond in format:\n[FEEDBACK]: [your response]\n[TIME]: [number]\n\nAcknowledge validity, ask follow-up, quote their words.`
    });
    
    console.log('📡 Sending request to Cerebras API...');
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: messages,
        temperature: 0.9,
        max_tokens: 80
      })
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received:', data);
    const content = data.choices[0].message.content;
    console.log('💬 AI Response:', content);
    
    // Parse response - handle multiple formats
    let feedback = '';
    let timeReduction = 0;
    
    // Try format 1: [FEEDBACK]: text [TIME]: number (with optional 's')
    const feedbackMatch = content.match(/\[FEEDBACK\]:\s*(.+?)(?=\[TIME\]|$)/s);
    const timeMatch = content.match(/\[TIME\]:\s*(-?\d+)s?/i);
    
    if (feedbackMatch && timeMatch) {
      feedback = feedbackMatch[1].trim();
      const parsedTime = parseInt(timeMatch[1]);
      // If AI explicitly says 0, use 0. Otherwise use absolute value (max 90s)
      timeReduction = parsedTime === 0 ? 0 : Math.max(0, Math.min(90, Math.abs(parsedTime)));
      console.log('✅ Parsed using [FEEDBACK]/[TIME] format:', { parsedTime, timeReduction });
    } else {
      // Try format 2: Text with number at the end (e.g., "message here -15")
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      const numberMatch = lastLine.match(/(-?\d+)s?\s*$/i);
      
      if (numberMatch) {
        // Number found at end, use everything before it as feedback
        const parsedTime = parseInt(numberMatch[1]);
        timeReduction = parsedTime === 0 ? 0 : Math.max(0, Math.min(90, Math.abs(parsedTime)));
        feedback = content.replace(/\s*-?\d+s?\s*$/i, '').trim();
        console.log('✅ Parsed using text+number format:', { parsedTime, timeReduction });
      } else {
        // No number found, use entire response and give default time
        feedback = content.trim();
        timeReduction = 15; // Tripled default
        console.log('⚠️ No time value found, using default 15s');
      }
    }
    
    // Clean up feedback - remove quotes if they wrap the entire thing
    feedback = feedback.replace(/^["'](.+)["']$/, '$1');
    
    console.log('📝 Final parsed:', { feedback, timeReduction });
    return { feedback, timeReduction };
  } catch (error) {
    console.error('Cerebras API error:', error);
    return null;
  }
}

async function getAIPenaltyFeedback(type, userText) {
  if (!window.CEREBRAS_API_KEY) {
    return null;
  }
  
  const prompts = {
    repetitive: "The user is repeating themselves. Give them a brief, stern but slightly humorous response telling them to provide new arguments.",
    gibberish: "The user wrote gibberish or keyboard mashing. Give them a brief, direct response calling this out.",
    too_short: "The user's response was too short. Encourage them to elaborate in a friendly way."
  };
  
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [
          {
            role: "system",
            content: "You are a purchase advisor. Respond in 1 short sentence (under 15 words). Be direct and conversational."
          },
          {
            role: "user",
            content: prompts[type]
          }
        ],
        temperature: 0.9,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI penalty feedback error:', error);
    return null;
  }
}

async function getAIPrompt(type) {
  // Quick AI-generated prompts for common scenarios
  return getAIPenaltyFeedback(type, '');
}

function fallbackEvaluation(userText) {
  // Simplified fallback when AI is unavailable
  const textLower = userText.toLowerCase();
  let timeReduction = 0;
  
  // Check for strong points
  const hasNecessity = /need|necessary|essential|broken|replace/i.test(userText);
  const hasBudget = /budget|afford|saved|compared/i.test(userText);
  const hasResearch = /research|reviews|alternative/i.test(userText);
  const hasLongTerm = /years|durable|warranty|quality/i.test(userText);
  
  // Check for weak points
  const hasEmotional = /want|love|excited|cool|awesome/i.test(userText);
  const hasVague = /just|maybe|probably|might/i.test(userText);
  
  // Calculate time reduction - TRIPLED VALUES
  if (hasNecessity) timeReduction += 60;
  if (hasBudget) timeReduction += 45;
  if (hasResearch) timeReduction += 36;
  if (hasLongTerm) timeReduction += 30;
  
  // Give at least 15s for any attempt at reasoning
  if (timeReduction === 0 && userText.length > 10) {
    timeReduction = 15;
  }
  
  // Never go negative - worst case is 0 (max 90s)
  timeReduction = Math.max(0, Math.min(90, timeReduction));
  
  // Generate fun, varied feedback that references their words
  let feedback;
  
  // Extract a key phrase from their argument to reference
  const words = userText.split(' ');
  const keyPhrase = words.slice(0, Math.min(5, words.length)).join(' ');
  
  if (timeReduction >= 20) {
    const responses = [
      `Okay okay, "${keyPhrase}" actually makes sense! ${getSuggestion('good')}`,
      `"${keyPhrase}" - you got me there! ${getSuggestion('good')}`,
      `Fair point with "${keyPhrase}". ${getSuggestion('good')}`,
      `Alright, "${keyPhrase}" is solid thinking. ${getSuggestion('good')}`
    ];
    feedback = responses[Math.floor(Math.random() * responses.length)];
  } else if (timeReduction >= 10) {
    const responses = [
      `"${keyPhrase}" is decent, but... ${getSuggestion('fair')}`,
      `Hmm, "${keyPhrase}" - getting warmer! ${getSuggestion('fair')}`,
      `You said "${keyPhrase}" which is okay. ${getSuggestion('fair')}`
    ];
    feedback = responses[Math.floor(Math.random() * responses.length)];
  } else if (timeReduction >= 5) {
    feedback = `"${keyPhrase}" is... something. ${getSuggestion('fair')}`;
  } else if (hasEmotional) {
    const responses = [
      `LOL, "${keyPhrase}" = I want shiny thing! ${getSuggestion('emotional')}`,
      `"${keyPhrase}" sounds like feelings, not facts. ${getSuggestion('emotional')}`,
      `Really? "${keyPhrase}"? ${getSuggestion('emotional')}`
    ];
    feedback = responses[Math.floor(Math.random() * responses.length)];
  } else {
    feedback = `"${keyPhrase}" isn't cutting it. ${getSuggestion('weak')}`;
  }
  
  // Store argument
  messageHistory.push({
    text: userText,
    words: new Set(textLower.split(/\s+/)),
    time: Date.now()
  });
  
  return { feedback, timeReduction };
}

function getSuggestion(type) {
  const hasValidProductName = productInfo.name !== 'Unknown Product' && 
    productInfo.name !== 'this item' && 
    productInfo.name.length > 5;
  
  if (!hasValidProductName) {
    const suggestions = {
      good: [
        "But have you checked the used market?",
        "Still, eBay might save you 50%!",
        "Fair enough, but check refurbished first?"
      ],
      fair: [
        "What problem does this REALLY solve?",
        "Dig deeper - why now?",
        "But is this the ONLY solution?"
      ],
      emotional: [
        "Your wallet is judging you right now.",
        "That's what everyone says before regret...",
        "Want ≠ Need, my friend!"
      ],
      vague: [
        "Give me specifics or give me nothing!",
        "That's not a reason, that's a word salad.",
        "Try again with actual details!"
      ],
      weak: [
        "C'mon, you can do better than that!",
        "That's not even trying!",
        "Your future self will thank you for reconsidering."
      ]
    };
    const options = suggestions[type] || suggestions.weak;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  const productLower = productInfo.name.toLowerCase();
  
  // Fun product-specific suggestions
  if (productLower.includes('ipad') || productLower.includes('tablet')) {
    const options = [
      "Kindle = 80% cheaper for reading!",
      "Your laptop already does this...",
      "It's gonna end up as a YouTube machine, isn't it?"
    ];
    return options[Math.floor(Math.random() * options.length)];
  } else if (productLower.includes('laptop') || productLower.includes('macbook')) {
    const options = [
      "Refurb = same laptop, 40% off!",
      "Last year's model is literally fine.",
      "Your current one just needs a cleanup!"
    ];
    return options[Math.floor(Math.random() * options.length)];
  } else if (productLower.includes('phone') || productLower.includes('iphone')) {
    const options = [
      "Battery replacement = $50. New phone = $1000. Math!",
      "Your current phone works, doesn't it?",
      "It's the same phone with a slightly better camera..."
    ];
    return options[Math.floor(Math.random() * options.length)];
  } else if (productLower.includes('headphone') || productLower.includes('airpod')) {
    return "Anker makes the same thing for 1/3 the price!";
  } else if (productLower.includes('watch') || productLower.includes('smartwatch')) {
    return "Your phone already tells time...";
  } else if (productLower.includes('camera')) {
    return "Your phone literally has a professional camera mode.";
  } else {
    const generic = [
      "Check Facebook Marketplace first!",
      "The used version is literally the same.",
      "Black Friday is in like... a month?"
    ];
    return generic[Math.floor(Math.random() * generic.length)];
  }
}

function checkForRepetition(text) {
  if (messageHistory.length === 0) return false;
  
  const currentWords = new Set(text.toLowerCase().split(/\s+/));
  
  // Check if too similar to previous messages
  for (const prev of messageHistory) {
    const intersection = new Set([...currentWords].filter(x => prev.words.has(x)));
    const similarity = intersection.size / Math.max(currentWords.size, prev.words.size);
    
    if (similarity > 0.7) { // 70% similarity threshold
      return true;
    }
  }
  
  return false;
}

function checkForGibberish(text) {
  // Check for keyboard mashing patterns
  const gibberishPatterns = [
    /(.)\1{3,}/,  // Same character repeated 4+ times
    /^[^aeiou]+$/i,  // No vowels at all
    /([a-z])\1{2,}/gi,  // Letters repeated 3+ times
    /asdf|qwer|zxcv|hjkl/i,  // Keyboard patterns
  ];
  
  for (const pattern of gibberishPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Check if words are actual words (basic check)
  const words = text.toLowerCase().split(/\s+/);
  const nonWords = words.filter(w => w.length > 2 && !/[aeiou]/i.test(w));
  
  return nonWords.length > words.length * 0.5; // More than 50% non-words
}

function checkForCopyPaste(text) {
  // Check if exact duplicate
  return messageHistory.some(prev => prev.text.toLowerCase() === text.toLowerCase());
}

async function applyTimeReduction(seconds) {
  // Animate the time reduction
  const reductionSteps = Math.min(seconds, 10); // Animate in steps
  const stepSize = seconds / reductionSteps;
  const stepDelay = 100; // ms between steps
  
  for (let i = 0; i < reductionSteps; i++) {
    timeRemaining -= stepSize;
    totalTimeSaved += stepSize;
    updateTimerDisplay(false); // Don't flash during animation
    await new Promise(resolve => setTimeout(resolve, stepDelay));
  }
  
  // Round to avoid floating point errors
  timeRemaining = Math.round(timeRemaining);
  totalTimeSaved = Math.round(totalTimeSaved);
  
  // Flash success animation ONLY after time reduction
  updateTimerDisplay(true); // Flash on final update
  
  // Check if timer reached zero
  if (timeRemaining <= 0) {
    endWaitingPeriod();
  }
}

async function addTypingMessage(type, text, animationType, value) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  messageDiv.appendChild(contentDiv);
  
  chatMessages.appendChild(messageDiv);
  
  // Force scroll immediately and repeatedly
  const forceScroll = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight + 100;
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  
  forceScroll();
  
  // Type out the message character by character
  let currentText = '';
  const typingSpeed = 15; // milliseconds per character (faster)
  
  for (let i = 0; i < text.length; i++) {
    currentText += text[i];
    contentDiv.textContent = currentText;
    
    // Scroll every 3 characters for better following
    if (i % 3 === 0) {
      forceScroll();
    }
    
    // Wait before next character
    await new Promise(resolve => setTimeout(resolve, typingSpeed));
  }
  
  // Multiple final scrolls to ensure it sticks
  forceScroll();
  setTimeout(forceScroll, 100);
  setTimeout(forceScroll, 300);
  
  // Add time badge after typing is complete (only if one doesn't exist)
  if (type === 'ai' && animationType === 'time-reduction' && value > 0) {
    // Check if badge already exists
    if (!messageDiv.querySelector('.time-badge')) {
      const badge = document.createElement('div');
      badge.className = 'time-badge reduction';
      badge.textContent = `-${value}s ⏱️`;
      messageDiv.appendChild(badge);
    }
  } else if (type === 'ai' && animationType === 'penalty' && value > 0) {
    // Check if badge already exists
    if (!messageDiv.querySelector('.time-badge')) {
      const badge = document.createElement('div');
      badge.className = 'time-badge penalty';
      badge.textContent = `+${value}s ⏱️`;
      messageDiv.appendChild(badge);
    }
  }
  
  // Final scroll
  scrollToBottom();
}

async function addMessageWithAnimation(type, text, animationType, value) {
  // Fallback for non-typing messages
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  // Add time indicator for AI messages
  if (type === 'ai' && animationType === 'time-reduction' && value > 0) {
    messageDiv.innerHTML = `
      <div class="message-content">${text}</div>
      <div class="time-badge reduction">-${value}s ⏱️</div>
    `;
  } else if (type === 'ai' && animationType === 'penalty' && value > 0) {
    messageDiv.innerHTML = `
      <div class="message-content">${text}</div>
      <div class="time-badge penalty">+${value}s ⏱️</div>
    `;
  } else {
    messageDiv.textContent = text;
  }
  
  chatMessages.appendChild(messageDiv);
  
  // Immediate scroll to bottom
  scrollToBottom();
  
  // Keep scrolling to bottom for a moment (in case content is still rendering)
  setTimeout(scrollToBottom, 100);
  setTimeout(scrollToBottom, 300);
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(type, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  
  // Force immediate scroll
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Follow-up scrolls to ensure it worked
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 150);
}

async function endWaitingPeriod() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  
  // Hide input and chat sections
  inputSection.style.display = 'none';
  chatSection.style.display = 'none';
  statusSection.style.display = 'none';
  
  // Show result section
  resultSection.style.display = 'flex';
  
  // Calculate performance
  const timeSavedPercent = Math.round((totalTimeSaved / 120) * 100);
  let grade;
  if (timeSavedPercent >= 80) grade = 'A';
  else if (timeSavedPercent >= 60) grade = 'B';
  else if (timeSavedPercent >= 40) grade = 'C';
  else if (timeSavedPercent >= 20) grade = 'D';
  else grade = 'F';
  
  finalGrade.textContent = grade;
  finalGrade.className = `grade-circle grade-${grade}`;
  
  // Get AI-generated final assessment
  resultMessage.textContent = 'Evaluating your justification...';
  const finalAssessment = await getFinalAssessment(grade, totalTimeSaved);
  resultMessage.textContent = finalAssessment;
  
  // Alternatives are already being displayed from initialization
  // No need to call displayAlternatives() again here
  
  // Proceed button is always enabled
  proceedBtn.disabled = false;
}

async function getFinalAssessment(grade, timeSaved) {
  if (!window.CEREBRAS_API_KEY) {
    // Fallback messages
    const messages = {
      'A': `Outstanding! You saved ${timeSaved}s with excellent reasoning. Your purchase is well-justified.`,
      'B': `Well done! You saved ${timeSaved}s with good arguments. You've thought this through.`,
      'C': `Fair effort. You saved ${timeSaved}s. Consider if this purchase aligns with your priorities.`,
      'D': `Minimal justification. Only ${timeSaved}s saved. Think more carefully about this purchase.`,
      'F': `Weak reasoning. You saved only ${timeSaved}s. This seems like an impulse purchase.`
    };
    return messages[grade];
  }
  
  const hasValidProductName = productInfo.name !== 'Unknown Product' && 
    productInfo.name !== 'this item' && 
    productInfo.name.length > 5;
  
  const productContext = hasValidProductName
    ? `Product: ${productInfo.name} (${productInfo.price})`
    : 'A purchase';
  
  const prompt = `Give a final assessment for someone who just justified a purchase.

${productContext}
Grade: ${grade}
Time saved: ${timeSaved} seconds out of 120 seconds (${Math.round((timeSaved/120)*100)}%)

You have the full conversation history below. Reference specific things they said.

Write a 2-3 sentence final assessment that:
- Acknowledges their grade and time saved
- References specific arguments they made (good or bad)
- For A/B: Congratulate them and affirm the purchase seems justified
- For C: Neutral, suggest they consider their priorities
- For D/F: Express concern this may be impulsive, encourage reconsideration

Be conversational, direct, and natural. No bullet points.`;

  try {
    // Build messages with full conversation history
    const messages = [
      {
        role: "system",
        content: "You are a purchase advisor giving a final assessment. Be conversational and concise (2-3 sentences max). Reference specific things from the conversation."
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    // Add conversation history for context
    if (conversationMessages.length > 0) {
      messages.push(...conversationMessages);
    }
    
    // Add final prompt
    messages.push({
      role: "user",
      content: "Now give your final assessment based on everything above."
    });
    
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: messages,
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Final assessment error:', error);
    // Fallback
    const messages = {
      'A': `Outstanding! You saved ${timeSaved}s with excellent reasoning. Your purchase is well-justified.`,
      'B': `Well done! You saved ${timeSaved}s with good arguments. You've thought this through.`,
      'C': `Fair effort. You saved ${timeSaved}s. Consider if this purchase aligns with your priorities.`,
      'D': `Minimal justification. Only ${timeSaved}s saved. Think more carefully about this purchase.`,
      'F': `Weak reasoning. You saved only ${timeSaved}s. This seems like an impulse purchase.`
    };
    return messages[grade];
  }
}

async function findCheaperAlternatives() {
  console.log('🔍 Finding cheaper alternatives with Cerebras...');
  
  if (!window.CEREBRAS_API_KEY) {
    console.log('⚠️ No Cerebras API key found');
    return getFallbackAlternatives();
  }
  
  const productName = productInfo.name !== 'Unknown Product' && productInfo.name !== 'this item' 
    ? productInfo.name 
    : 'this product';
  const currentPrice = extractNumericPrice(productInfo.price);
  
  const prompt = `Product: ${productName}

Task: Find 3 cheaper alternatives. Extract the KEY product type (remove brand names, specific models, extra details).

Example: "Amazon Basics Velvet Suit Hangers 50-Pack" → key terms: "velvet suit hangers"
Example: "Apple iPhone 15 Pro Max 256GB" → key terms: "iphone 15 pro"

Return ONLY this JSON with key terms in URLs:
[
  {"title":"Alternative 1 Name","source":"Amazon","url":"https://www.amazon.com/s?k=key+terms"},
  {"title":"Alternative 2 Name","source":"eBay","url":"https://www.ebay.com/sch/i.html?_nkw=key+terms"},
  {"title":"Alternative 3 Name","source":"Walmart","url":"https://www.walmart.com/search?q=key+terms"}
]`;
  
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cerebras API error:', response.status, errorText);
      return getFallbackAlternatives();
    }
    
    const data = await response.json();
    console.log('📥 Cerebras response:', data);
    
    // Extract content from Cerebras response
    const content = data.choices[0].message.content;
    console.log('📝 Content:', content);
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      const alternatives = JSON.parse(jsonMatch[0]);
      console.log('✅ Found alternatives:', alternatives);
      
      // Ensure all alternatives have required fields
      return alternatives.map(alt => ({
        title: alt.title || 'Alternative Product',
        source: alt.source || 'Online',
        url: alt.url || `https://www.google.com/search?q=${encodeURIComponent(alt.title || productName + ' cheaper')}`
      })).slice(0, 3);
    } else {
      console.error('No JSON found in response');
    }
  } catch (error) {
    console.error('Error fetching alternatives:', error);
  }
  
  return getFallbackAlternatives();
}

function extractKeyTerms(productName) {
  // Remove common brand names and extra details
  let keyTerms = productName
    .replace(/\b(Amazon|Apple|Samsung|Sony|Microsoft|Google|Nike|Adidas|etc)\b/gi, '')
    .replace(/\b(Basics|Essentials|Premium|Pro|Plus|Max|Ultra)\b/gi, '')
    .replace(/\b\d+[-\s]?(pack|count|piece|set|gb|tb|oz|lb)\b/gi, '') // Remove quantities
    .replace(/\b\d{2,4}GB\b/gi, '') // Remove storage sizes
    .replace(/\b(black|white|blue|red|gray|silver|gold)\b/gi, '') // Remove colors
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Take first 3-4 meaningful words
  const words = keyTerms.split(' ').filter(w => w.length > 2);
  return words.slice(0, 4).join(' ').toLowerCase();
}

function getFallbackAlternatives() {
  const productName = productInfo.name !== 'Unknown Product' ? productInfo.name : 'Similar Item';
  const keyTerms = extractKeyTerms(productName);
  
  const alternatives = [
    {
      title: `Refurbished ${keyTerms}`,
      source: "eBay",
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyTerms + ' refurbished')}`
    },
    {
      title: `Generic ${keyTerms}`,
      source: "Amazon",
      url: `https://www.amazon.com/s?k=${encodeURIComponent(keyTerms)}`
    },
    {
      title: `Used ${keyTerms}`,
      source: "Walmart",
      url: `https://www.walmart.com/search?q=${encodeURIComponent(keyTerms)}`
    }
  ];
  
  return alternatives;
}

function extractNumericPrice(priceString) {
  const match = priceString.match(/[\d,]+\.?\d*/);  
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

async function displayAlternatives() {
  const boxes = document.querySelectorAll('.alternative-box');
  
  // Show loading state
  boxes.forEach(box => {
    box.querySelector('.alt-price').textContent = '';
    box.querySelector('.alt-title').textContent = 'Searching...';
    box.querySelector('.alt-source').textContent = 'Finding deals';
    box.style.cursor = 'wait';
  });
  
  // Fetch real alternatives
  const alternatives = await findCheaperAlternatives();
  
  // Display the alternatives
  alternatives.forEach((alt, index) => {
    if (boxes[index]) {
      const box = boxes[index];
      box.querySelector('.alt-price').textContent = ''; // Hide price
      box.querySelector('.alt-title').textContent = alt.title;
      box.querySelector('.alt-source').textContent = alt.source;
      box.style.cursor = 'pointer';
      
      // Make the entire box clickable and open the product URL
      box.onclick = () => {
        window.open(alt.url, '_blank');
      };
      
      // Add hover effect hint
      box.title = `Click to view on ${alt.source}`;
    }
  });
}

// Stats tracking functions
async function updateStats(purchaseAllowed) {
  try {
    // Extract price as number
    const priceNum = extractNumericPrice(productInfo.price);
    const category = productInfo.category || 'General';
    
    // Prepare stats update data
    const statsUpdate = {
      purchaseAllowed: purchaseAllowed,
      price: priceNum,
      category: category,
      productName: productInfo.name,
      timestamp: new Date().toISOString()
    };
    
    console.log('Updating stats:', statsUpdate);
    
    // Send message to parent window (content script will catch it)
    window.parent.postMessage({
      action: 'update-stats',
      data: statsUpdate
    }, '*');
    
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}
