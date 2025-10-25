const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");
const testDefeatBtn = document.getElementById("test-defeat");
const container = document.getElementById("chat-container");
const healthBar = document.getElementById("health-bar");
const healthText = document.getElementById("health-text");

// Initialize Animation Service
const animationService = new AnimationService();
registerPokemonAnimations(animationService);

// Initialize Text Animation
const textAnimation = TextAnimation;

// Health tracking
let currentHealth = CONFIG.INITIAL_HEALTH;
let maxHealth = CONFIG.INITIAL_HEALTH;

// Hide chat container initially
container.style.opacity = "0";
container.style.pointerEvents = "none";

// Initialize: Play entrance animation and greeting
async function initialize() {
  // === POKEMON ENCOUNTER SEQUENCE ===
  // 1. Flash body white
  await animationService.playAnimation(document.body, "whiteFlash");
  
  // 2. Create and animate pixelated spiral overlay
  const spiral = document.createElement("div");
  spiral.id = "pokemon-spiral";
  document.body.appendChild(spiral);
  
  await animationService.playAnimation(spiral, "pixelSpiral");
  
  // 3. Remove spiral overlay
  spiral.remove();
  
  // 4. Show chat container and play entrance animations
  container.style.opacity = "1";
  container.style.pointerEvents = "auto";
  
  await animationService.playSequence(container, [
    "pokemonEnter",
    "bounce"
  ]);

  // 5. Add initial AI message after entrance with typewriter effect
  await addMessage("AI", "🛡️ Before you buy, convince me this isn't an impulse purchase! Defeat me for 5 minutes of shopping freedom!", false);
  
  // 6. Initialize health bar
  updateHealthDisplay();
}

// Delay initialization slightly for better effect
setTimeout(initialize, 200);

// Health management functions
function updateHealthDisplay() {
  const healthPercentage = (currentHealth / maxHealth) * 100;
  healthBar.style.width = `${healthPercentage}%`;
  healthText.textContent = `${currentHealth}/${maxHealth}`;
  
  // Update health bar color based on percentage
  if (healthPercentage <= 30) {
    healthBar.style.background = 'linear-gradient(90deg, #f44336, #ff6b6b)';
  } else if (healthPercentage <= 60) {
    healthBar.style.background = 'linear-gradient(90deg, #FF9800, #FFB74D)';
  } else {
    healthBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
  }
}

async function takeDamage(damage) {
  if (damage <= 0) return;
  
  currentHealth = Math.max(0, currentHealth - damage);
  
  // Show damage number
  showDamageNumber(damage);
  
  // Play damage animation
  if (damage >= 25) {
    await animationService.playAnimation(container, "criticalHit");
  } else if (damage >= 15) {
    await animationService.playAnimation(container, "shake");
  }
  
  // Update health display
  updateHealthDisplay();
  
  // Check if defeated
  if (currentHealth <= 0) {
    await handleDefeat();
  }
}

function showDamageNumber(damage) {
  const damageDiv = document.createElement('div');
  damageDiv.className = 'damage-number';
  damageDiv.textContent = `-${damage}`;
  
  if (damage >= 25) {
    damageDiv.classList.add('critical');
    damageDiv.textContent = `CRITICAL! -${damage}`;
  } else if (damage >= 20) {
    damageDiv.classList.add('high');
  }
  
  const healthContainer = document.getElementById('health-container');
  healthContainer.appendChild(damageDiv);
  
  setTimeout(() => damageDiv.remove(), 1500);
}

async function handleDefeat() {
  unlockBtn.disabled = false;
  
  const victoryMessages = [
    "You've defeated me! 💀 You have 5 minutes to complete your purchase!",
    "GG! You win! 🎮 Shopping unlocked for 5 minutes!",
    "Alright, you convinced me! ✨ 5-minute shopping pass granted!",
    "CRITICAL HIT! I'm defeated... 💥 Quick, you have 5 minutes!"
  ];
  
  const randomMessage = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
  await addMessage("AI", randomMessage, false);
  
  await animationService.playSequence(container, ["spin", "pulse"]);
}

send.addEventListener("click", handleSendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

unlockBtn.addEventListener("click", async () => {
  // Victory sequence
  await animationService.playSequence(container, [
    "spin",
    "pulse"
  ]);

  // Send unlock message to parent window
  window.parent.postMessage({ type: 'UNLOCK_PURCHASE' }, '*');
  
  // Send unlock message to background script
  chrome.runtime.sendMessage(
    { type: "requestUnlock", domain: window.location.hostname },
    () => {
      // Remove the iframe overlay with fade effect
      animationService.playAnimation(container, "fadeOut").then(() => {
        const iframe = window.parent.document.getElementById('impulse-blocker-iframe');
        if (iframe) {
          iframe.remove();
        }
      });
    }
  );
});

// Test button - instantly defeat the bot
testDefeatBtn.addEventListener("click", async () => {
  currentHealth = 0;
  updateHealthDisplay();
  await handleDefeat();
});

// Conversation history - resets on each new popup (no data shared between sessions)
let conversationHistory = [];

async function handleSendMessage() {
  const userText = input.value.trim();
  if (!userText || animationService.isAnimating()) return;

  await addMessage("You", userText, true);
  input.value = "";
  send.disabled = true;

  // Play attack animation while "thinking"
  await animationService.playAnimation(container, "shake");

  // Simulate AI thinking with glow effect
  container.classList.add("animate-glow");
  
  setTimeout(async () => {
    container.classList.remove("animate-glow");
    try {
      const response = await callCerebrasAPI(userText);
      await addMessage("AI", response.text, false);
      
      // Apply damage to AI health
      if (response.damage > 0) {
        await takeDamage(response.damage);
      }
    } catch (error) {
      console.error('Error calling Cerebras:', error);
      await addMessage("AI", "Sorry, I had trouble processing that. Try again!", false);
    }
    send.disabled = false;
    input.focus();
  }, 800);
}

async function callCerebrasAPI(userMessage) {
  // Add to conversation history
  conversationHistory.push({ role: 'user', content: userMessage });
  
  // Check for repetitive arguments
  const recentArgs = conversationHistory
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content.toLowerCase());
  const isRepetitive = recentArgs.length > 1 && recentArgs.some((arg, i) => 
    i > 0 && (arg.includes(recentArgs[0]) || recentArgs[0].includes(arg))
  );
  
  // Prepare the prompt with better instructions
  const systemPrompt = `You are a skeptical but fair AI guardian blocking impulse purchases. Current HP: ${currentHealth}/${maxHealth}

USER'S ARGUMENT: "${userMessage}"

PREVIOUS ARGUMENTS: ${conversationHistory.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(', ') || 'none'}

RESPOND WITH EXACTLY 2 SHORT BULLET POINTS (max 8 words each):
• Point 1: React to their argument (be POSITIVE if it's valid!)
• Point 2: Challenge them OR admit they're winning

TONE RULES:
- If argument is WEAK (0-10 damage): Be skeptical but not mean
- If argument is DECENT (15-25 damage): Be impressed and acknowledge it! 👍
- If argument is STRONG (26-45 damage): Be very impressed, compliment them! 🎯

DAMAGE RULES - How much HP I lose based on their argument:
${isRepetitive ? '- REPETITIVE ARGUMENT = 0 damage (call them out for repeating!)' : ''}
- Completely irrelevant/joke/nonsense = 0-8 damage
- Vague or weak reasoning = 12-18 damage
- Decent point with some logic = 22-30 damage
- Strong reasoning with need/budget = 35-42 damage
- Excellent compelling argument = 45-55 damage (MAX DAMAGE!)

IMPORTANT: 
- Be STRICT! Only give high damage (30+) if they mention SPECIFIC needs, budget, or urgency!
- Generic "I want it" or "I need it" = 12-18 damage MAX
- If they make a SPECIFIC, DETAILED point, PRAISE them and give 30+ damage!
- If they repeat the same point, give 0 damage and call them out!

End with: [DAMAGE: X]

Example responses:

WEAK argument:
• That's pretty vague... 🤔
• Be more specific!
[DAMAGE: 8]

DECENT argument (BE POSITIVE!):
• Okay, that's a solid point! 👍
• You're making progress here!
[DAMAGE: 25]

STRONG argument (BE VERY POSITIVE!):
• Wow, that's really compelling! 😮
• Critical hit! Almost there!
[DAMAGE: 40]`;
  
  const requestBody = {
    model: "llama3.1-8b",
    messages: [
      {
        role: "system",
        content: "You are a skeptical but fair AI guardian that blocks impulse purchases. Be POSITIVE when users make valid points! Respond with exactly 2 short bullet points (max 8 words each) and end with [DAMAGE: X] where X is 0-55."
      },
      {
        role: "user",
        content: systemPrompt
      }
    ],
    temperature: 0.8,
    max_tokens: 256,
    top_p: 0.95
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
      console.error('API Response not OK:', response.status);
      const errorData = await response.json();
      console.error('Error details:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response structure');
    }
    
    const botResponse = data.choices[0].message.content;
    
    // Extract damage from response
    const damageMatch = botResponse.match(/\[DAMAGE:\s*(\d+)\]/i);
    const damage = damageMatch ? parseInt(damageMatch[1]) : 0;
    const cleanResponse = botResponse.replace(/\[DAMAGE:\s*\d+\]/i, '').trim();
    
    // Add to conversation history
    conversationHistory.push({ role: 'assistant', content: cleanResponse });
    
    return {
      text: cleanResponse,
      damage: damage
    };
  } catch (apiError) {
    console.error('Cerebras API Error:', apiError);
    
    // Provide a fallback response instead of error message
    const fallbackResponses = [
      "• That's a fair point! 👍\n• Keep going!\n[DAMAGE: 25]",
      "• I respect that reasoning! 💭\n• You're making progress!\n[DAMAGE: 28]",
      "• Solid argument! 😊\n• You're wearing me down!\n[DAMAGE: 30]"
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const damageMatch = fallback.match(/\[DAMAGE:\s*(\d+)\]/i);
    const damage = damageMatch ? parseInt(damageMatch[1]) : 8;
    const cleanResponse = fallback.replace(/\[DAMAGE:\s*\d+\]/i, '').trim();
    
    conversationHistory.push({ role: 'assistant', content: cleanResponse });
    
    return {
      text: cleanResponse,
      damage: damage
    };
  }
}

/**
 * Add message to chat with proper styling and animation
 * @param {string} sender - "You" or "AI"
 * @param {string} text - Message text
 * @param {boolean} isUser - True if user message
 * @returns {Promise} Resolves when message animation completes
 */
async function addMessage(sender, text, isUser) {
  const msg = document.createElement("div");
  msg.className = `message ${isUser ? "user" : "ai"}`;
  chat.appendChild(msg);
  
  // Auto-scroll to bottom
  chat.scrollTop = chat.scrollHeight;
  
  // Animate text for AI messages with typewriter effect
  if (!isUser) {
    await textAnimation.typewriter(msg, text, 50);
  } else {
    // User messages appear instantly
    msg.textContent = text;
  }
  
  // Auto-scroll to bottom again after animation
  chat.scrollTop = chat.scrollHeight;
}
