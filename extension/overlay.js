const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");
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
  await addMessage("AI", "Before you buy, ask yourself: Is this a genuine need or an impulse?", false);
  
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
    "You've defeated me! Your argument was too strong... 💀",
    "GG! You win this round. Go make your purchase! 🎮",
    "Alright, you convinced me. This purchase seems justified! ✨",
    "CRITICAL HIT! I'm defeated... Proceed with your purchase! 💥"
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

  // Send unlock message to background script
  chrome.runtime.sendMessage(
    { type: "requestUnlock", domain: window.location.hostname },
    () => {
      // Remove the iframe overlay with fade effect
      animationService.playAnimation(container, "fadeOut").then(() => {
        window.top.document.querySelector("iframe").remove();
      });
    }
  );
});

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
  const systemPrompt = `You are a sassy AI guardian blocking impulse purchases. Current HP: ${currentHealth}/${maxHealth}

USER'S ARGUMENT: "${userMessage}"

PREVIOUS ARGUMENTS: ${conversationHistory.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(', ') || 'none'}

RESPOND WITH EXACTLY 3 SHORT BULLET POINTS (max 10 words each):
• Point 1: React to their argument
• Point 2: Challenge or question them  
• Point 3: Taunt or encourage

DAMAGE RULES - How much HP I lose based on their argument:
${isRepetitive ? '- REPETITIVE ARGUMENT = 0 damage (call them out for repeating!)' : ''}
- Completely irrelevant/joke/nonsense = 0-5 damage
- Somewhat reasonable but weak = 15-18 damage (MINIMUM for any relevant point!)
- Good reasoning with budget/need mentioned = 19-24 damage
- Excellent compelling argument = 25-30 damage (MAX DAMAGE!)

IMPORTANT: If their argument is AT ALL reasonable or mentions a real need, give AT LEAST 15 damage!
If they repeat the same point, give 0 damage and call them out!

End with: [DAMAGE: X]

Example responses:
• Nice try with the "I need it" excuse 🙄
• But WHY do you need it RIGHT NOW?
• Come on, give me something better than that!
[DAMAGE: 5]

• Okay, that's actually a decent point... 😤
• You mentioned your budget, I'll give you that
• But I'm still not fully convinced!
[DAMAGE: 18]`;
  
  const requestBody = {
    model: "llama3.1-8b",
    messages: [
      {
        role: "system",
        content: "You are a sassy AI guardian that blocks impulse purchases. Respond with exactly 3 short bullet points and end with [DAMAGE: X] where X is 0-30."
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
      "• Hmm, interesting point you're making there... 🤔\n• But have you considered your budget?\n• Try harder to convince me!\n[DAMAGE: 8]",
      "• That's one way to justify it... �\n• What about saving for emergencies?\n• You'll need better reasoning than that!\n[DAMAGE: 10]",
      "• I see what you're trying to do... 😏\n• But is it REALLY necessary?\n• Keep trying, you're not there yet!\n[DAMAGE: 7]"
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
