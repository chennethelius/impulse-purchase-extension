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
let currentGrade = 'F';
let totalScore = 0;
let messageCount = 0;
let conversationHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

function initialize() {
  // Add initial system message
  addMessage('system', 'You have 1 minute to justify your purchase. Explain why you need this item.');
  
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

function updateStatusIcon(grade) {
  const icons = {
    warning: document.getElementById('icon-warning'),
    thinking: document.getElementById('icon-thinking'),
    thumbsUp: document.getElementById('icon-thumbs-up'),
    checkmark: document.getElementById('icon-checkmark')
  };
  
  // Hide all icons
  Object.values(icons).forEach(icon => icon.style.display = 'none');
  
  // Show appropriate icon based on grade
  statusIcon.className = '';
  
  if (grade === 'A' || grade === 'B') {
    icons.checkmark.style.display = 'block';
    statusIcon.className = 'excellent';
  } else if (grade === 'C') {
    icons.thumbsUp.style.display = 'block';
    statusIcon.className = 'good';
  } else if (grade === 'D') {
    icons.thinking.style.display = 'block';
    statusIcon.className = 'thinking';
  } else {
    icons.warning.style.display = 'block';
    statusIcon.className = 'warning';
  }
  
  // Update grade display
  if (messageCount > 0) {
    gradeDisplay.style.display = 'block';
    gradeDisplay.textContent = grade;
    gradeDisplay.className = `grade-${grade}`;
  }
}

function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
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
  
  // Clear input
  userInput.value = '';
  
  try {
    // Get AI response with scoring
    const response = await evaluateArgument(userText);
    
    // Add AI message
    addMessage('ai', response.feedback);
    conversationHistory.push({ role: 'assistant', content: response.feedback });
    
    // Update score and grade
    totalScore = Math.min(100, totalScore + response.points);
    currentGrade = calculateGrade(totalScore);
    updateStatusIcon(currentGrade);
    
  } catch (error) {
    console.error('Error evaluating argument:', error);
    addMessage('ai', 'Please continue explaining your reasoning.');
  }
  
  // Re-enable input
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
}

async function evaluateArgument(userText) {
  // Check for argument quality indicators
  const qualityIndicators = {
    needBased: /need|necessary|essential|required|important/i,
    budgetAware: /budget|afford|save|money|cost|price|expense/i,
    practical: /use|useful|practical|daily|regularly|often/i,
    research: /compare|research|review|alternative|option/i,
    longTerm: /long.?term|investment|years|durable|quality/i,
    emotional: /want|desire|wish|dream|love|excited/i,
    impulsive: /now|immediately|today|quick|fast|hurry/i
  };
  
  let points = 0;
  let feedback = '';
  
  // Analyze argument quality
  if (qualityIndicators.needBased.test(userText)) points += 15;
  if (qualityIndicators.budgetAware.test(userText)) points += 20;
  if (qualityIndicators.practical.test(userText)) points += 15;
  if (qualityIndicators.research.test(userText)) points += 20;
  if (qualityIndicators.longTerm.test(userText)) points += 15;
  
  // Deduct for emotional/impulsive language
  if (qualityIndicators.emotional.test(userText)) points -= 5;
  if (qualityIndicators.impulsive.test(userText)) points -= 10;
  
  // Ensure minimum points for effort
  if (userText.length > 50) points += 5;
  if (userText.length > 100) points += 5;
  
  // Cap points per message
  points = Math.max(0, Math.min(30, points));
  
  // Generate appropriate feedback based on score
  if (points >= 25) {
    feedback = "Excellent reasoning! You've made strong points about necessity and value.";
  } else if (points >= 20) {
    feedback = "Good argument. You're considering important factors.";
  } else if (points >= 15) {
    feedback = "That's a fair point. Can you elaborate on the practical benefits?";
  } else if (points >= 10) {
    feedback = "I see your point, but consider: Is this solving a real problem or creating one?";
  } else if (points >= 5) {
    feedback = "Think deeper: How will this purchase improve your life in 6 months?";
  } else {
    feedback = "That sounds more like a 'want' than a 'need'. What problem does this solve?";
  }
  
  // Use Cerebras API if available
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
  const systemPrompt = `You are evaluating a user's justification for a purchase. 
Current score: ${currentTotalScore}/100
Current grade: ${calculateGrade(currentTotalScore)}

USER'S ARGUMENT: "${userText}"

Evaluate the quality of their reasoning and assign points (0-30).
Consider: necessity, budget awareness, research, practical use, long-term value.
Deduct points for: emotional reasoning, impulsiveness, weak justification.

Respond with:
1. Brief feedback (1-2 sentences, be constructive but firm)
2. Points awarded

Format: 
[FEEDBACK]: Your feedback here
[POINTS]: X`;

  const requestBody = {
    model: "llama3.1-8b",
    messages: [
      {
        role: "system",
        content: "You are a financial advisor helping users make better purchase decisions."
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
    const pointsMatch = content.match(/\[POINTS\]:\s*(\d+)/);
    
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : content;
    const points = pointsMatch ? Math.min(30, parseInt(pointsMatch[1])) : 10;
    
    return { feedback, points };
  } catch (error) {
    console.error('Cerebras API error:', error);
    return null;
  }
}

function addMessage(type, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
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
  
  // Set result message based on grade
  const messages = {
    'A': "Excellent justification! You've demonstrated clear necessity and financial responsibility. You may proceed with this purchase.",
    'B': "Good reasoning! You've made valid points about this purchase. Consider if it aligns with your priorities before proceeding.",
    'C': "Fair attempt. Your justification has merit but lacks strong necessity. Take 24 hours to think it over.",
    'D': "Weak justification. This seems more like a want than a need. Consider saving for more important purchases.",
    'F': "Insufficient justification. This appears to be an impulse purchase. Step back and reconsider your priorities."
  };
  
  resultMessage.textContent = messages[currentGrade];
  
  // Enable proceed button only for grades A and B
  if (currentGrade === 'A' || currentGrade === 'B') {
    proceedBtn.disabled = false;
    proceedBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage(
        { type: "requestUnlock", domain: window.location.hostname },
        () => {
          window.top.document.querySelector('iframe').remove();
        }
      );
    });
  }
}
