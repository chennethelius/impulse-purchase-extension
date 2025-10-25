const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");
const container = document.getElementById("chat-container");

// Initialize Animation Service
const animationService = new AnimationService();
registerPokemonAnimations(animationService);

// Initialize: Play entrance animation and greeting
async function initialize() {
  // Wait for the default slideIn animation to complete first
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Then play entrance with Pokemon showdown effect
  await animationService.playSequence(container, [
    "pokemonEnter",
    "bounce"
  ]);

  // Add initial AI message after entrance
  addMessage("AI", "Before you buy, ask yourself: Is this a genuine need or an impulse?", false);
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

async function handleSendMessage() {
  const userText = input.value.trim();
  if (!userText || animationService.isAnimating()) return;

  addMessage("You", userText, true);
  input.value = "";
  send.disabled = true;

  // Play attack animation while "thinking"
  await animationService.playAnimation(container, "shake");

  // Simulate AI thinking with glow effect
  container.classList.add("animate-glow");
  
  setTimeout(() => {
    container.classList.remove("animate-glow");
    const response = evaluateResponse(userText);
    addMessage("AI", response, false);
    send.disabled = false;
    input.focus();
  }, 800);
}

function evaluateResponse(text) {
  const lowerText = text.toLowerCase();
  
  // Check for genuine need indicators
  const needIndicators = [
    "need", "essential", "necessary", "broke", "damaged", "replaced",
    "emergency", "urgent", "running low", "life", "work", "school"
  ];
  
  const impulseIndicators = [
    "want", "like", "cool", "pretty", "nice", "looks", "trendy", "awesome",
    "everyone has", "on sale", "limited time", "fomo", "fear of missing"
  ];

  const hasNeed = needIndicators.some(word => lowerText.includes(word));
  const hasImpulse = impulseIndicators.some(word => lowerText.includes(word));
  
  let score = 0;
  
  // Scoring logic
  score += text.length > 20 ? 10 : 0;
  score += hasNeed ? 30 : 0;
  score -= hasImpulse ? 20 : 0;
  
  // Multiple sentences suggest thoughtfulness
  score += (text.match(/[.!?]/g) || []).length * 5;
  
  if (score > 35 && !hasImpulse) {
    unlockBtn.disabled = false;
    return "✨ That sounds like a genuine need. You can proceed, but maybe sleep on it first! 😊";
  } else if (score > 20) {
    return "🤔 I'm getting closer... Can you give me a more specific reason? Why *right now*?";
  } else {
    return "😅 Not quite there yet. Be honest with me—is this something you really need?";
  }
}

/**
 * Add message to chat with proper styling
 * @param {string} sender - "You" or "AI"
 * @param {string} text - Message text
 * @param {boolean} isUser - True if user message
 */
function addMessage(sender, text, isUser) {
  const msg = document.createElement("div");
  msg.className = `message ${isUser ? "user" : "ai"}`;
  msg.textContent = text;
  chat.appendChild(msg);
  
  // Auto-scroll to bottom
  chat.scrollTop = chat.scrollHeight;
}
