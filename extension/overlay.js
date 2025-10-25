const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");
const container = document.getElementById("chat-container");

// Initialize Animation Service
const animationService = new AnimationService();
registerPokemonAnimations(animationService);

// Initialize Text Animation
const textAnimation = TextAnimation;

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
}

// Delay initialization slightly for better effect
setTimeout(initialize, 200);

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
      const response = await callGeminiAPI(userText);
      await addMessage("AI", response.text, false);
      
      // Check if user won based on damage dealt to AI
      if (response.damage <= 0) {
        unlockBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error calling Gemini:', error);
      await addMessage("AI", "Sorry, I had trouble processing that. Try again!", false);
    }
    send.disabled = false;
    input.focus();
  }, 800);
}

async function callGeminiAPI(userMessage) {
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
  const systemPrompt = `You are a sassy AI guardian blocking impulse purchases.
USER'S ARGUMENT: "${userMessage}"

PREVIOUS ARGUMENTS: ${conversationHistory.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(', ') || 'none'}

RESPOND WITH EXACTLY 3 SHORT BULLET POINTS (max 10 words each):
• Point 1: React to their argument
• Point 2: Challenge or question them  
• Point 3: Taunt or encourage

DAMAGE RULES (how convincing their argument is):
${isRepetitive ? '- REPETITIVE ARGUMENT = 0 damage (call them out!)' : ''}
- Irrelevant/joke = 0-5 damage
- Mentions need but weak = 15-18 damage (minimum for relevant points!)
- Good reasoning + budget = 19-23 damage
- Excellent + urgent need = 24-30 damage

End with: [DAMAGE: X]

Example response:
• Nice try with the "I need it" excuse 🙄
• But WHY do you need it RIGHT NOW?
• Come on, give me something better than that!
[DAMAGE: 5]`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: systemPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 256,
    }
  };
  
  try {
    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error('API Response not OK:', response.status);
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response structure');
    }
    
    const botResponse = data.candidates[0].content.parts[0].text;
    
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
    console.error('Gemini API Error:', apiError);
    
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
