// Popup script with AI integration and Pokemon battle mechanics
let currentHealth = CONFIG.INITIAL_HEALTH;
let conversationHistory = [];
let isProcessing = false;
let isMuted = false;
let battleStartTime = Date.now(); // Track when battle started
let battleMessages = 0; // Track number of messages sent

// Lightweight Web Audio manager for battle sounds
const soundManager = (() => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return { play: () => undefined, prime: () => undefined, isReady: () => false };
  }

  let ctx = null;
  let masterGain = null;
  let enabled = false;
  const queue = [];

  const ensureContext = () => {
    if (!ctx) {
      ctx = new AudioContextCtor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.25;
      masterGain.connect(ctx.destination);
    }
    return ctx;
  };

  const flushQueue = () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        job();
      } catch (err) {
        console.warn('Sound playback failed:', err);
      }
    }
  };

  const enableContext = () => {
    const context = ensureContext();
    if (enabled || context.state === 'running') {
      enabled = true;
      flushQueue();
      return;
    }

    context.resume()
      .then(() => {
        enabled = true;
        flushQueue();
      })
      .catch(err => {
        console.warn('Audio context resume blocked:', err);
      });
  };

  const schedule = (job) => {
    if (!enabled || isMuted) {
      if (queue.length < 8) {
        queue.push(job);
      }
      return;
    }
    job();
  };

  const playTone = (context, step, baseTime) => {
    const { freq, offset = 0, duration = 0.18, gain = 0.08, type = 'sine' } = step;
    const start = baseTime + offset;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, start);

    const gainNode = context.createGain();
    const attackEnd = start + Math.min(0.02, duration / 3);
    const releaseStart = start + duration;

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(gain, attackEnd);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(start);
    oscillator.stop(releaseStart + 0.08);
  };

  const sequences = {
    attack: [
      { freq: 720, duration: 0.1, gain: 0.08, type: 'triangle' },
      { freq: 1080, offset: 0.05, duration: 0.08, gain: 0.07, type: 'sine' }
    ],
    damage: [
      { freq: 440, duration: 0.15, gain: 0.1, type: 'sawtooth' },
      { freq: 330, offset: 0.08, duration: 0.12, gain: 0.08, type: 'sawtooth' }
    ],
    victory: [
      { freq: 540, duration: 0.22, gain: 0.08, type: 'triangle' },
      { freq: 810, offset: 0.1, duration: 0.2, gain: 0.07, type: 'sine' },
      { freq: 1080, offset: 0.2, duration: 0.18, gain: 0.06, type: 'triangle' }
    ],
    defeat: [
      { freq: 320, duration: 0.24, gain: 0.09, type: 'sawtooth' },
      { freq: 220, offset: 0.3, duration: 0.28, gain: 0.08, type: 'sawtooth' }
    ],
    action: [
      { freq: 500, duration: 0.16, gain: 0.07, type: 'triangle' },
      { freq: 750, offset: 0.08, duration: 0.12, gain: 0.06, type: 'sine' }
    ]
  };

  const play = (type) => {
    if (isMuted) return;
    const pattern = sequences[type];
    if (!pattern) return;

    schedule(() => {
      const context = ensureContext();
      const baseTime = context.currentTime + 0.02;
      pattern.forEach(step => playTone(context, step, baseTime));
    });
  };

  document.addEventListener('pointerdown', enableContext, { once: true, passive: true });
  document.addEventListener('keydown', enableContext, { once: true });

  return {
    play,
    prime: enableContext,
    isReady: () => enabled
  };
})();

// Background music manager for ambient battle music
const musicManager = (() => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return { start: () => undefined, stop: () => undefined };
  }

  let ctx = null;
  let masterGain = null;
  let isPlaying = false;
  let oscillators = [];

  const ensureContext = () => {
    if (!ctx) {
      ctx = new AudioContextCtor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.08; // Lower volume for background music
      masterGain.connect(ctx.destination);
    }
    return ctx;
  };

  const createTone = (freq, type = 'sine') => {
    const context = ensureContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    return { osc, gain };
  };

  const start = () => {
    if (isPlaying || isMuted) return;
    
    try {
      const context = ensureContext();
      if (context.state === 'suspended') {
        context.resume();
      }

      isPlaying = true;
      oscillators = [];

      // Create a simple ambient battle theme using multiple tones
      // Using pentatonic scale for a battle-like atmosphere
      const bass = createTone(110, 'triangle'); // A2
      const harmony1 = createTone(220, 'sine'); // A3
      const harmony2 = createTone(330, 'sine'); // E4
      const harmony3 = createTone(440, 'sine'); // A4

      oscillators.push(bass, harmony1, harmony2, harmony3);

      // Start all oscillators
      const now = context.currentTime;
      oscillators.forEach(({ osc, gain }, i) => {
        osc.start(now);
        // Fade in
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15 - (i * 0.03), now + 2);
      });

      // Add subtle pulsing effect
      const pulse = () => {
        if (!isPlaying) return;
        
        const now = context.currentTime;
        oscillators.forEach(({ gain }, i) => {
          const baseGain = 0.15 - (i * 0.03);
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(baseGain * 0.7, now + 2);
          gain.gain.linearRampToValueAtTime(baseGain, now + 4);
        });

        setTimeout(pulse, 4000);
      };

      setTimeout(pulse, 2000);
    } catch (err) {
      console.warn('Background music failed to start:', err);
    }
  };

  const stop = () => {
    if (!isPlaying) return;
    
    isPlaying = false;
    const context = ensureContext();
    const now = context.currentTime;

    // Fade out
    oscillators.forEach(({ osc, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 1);
      osc.stop(now + 1.1);
    });

    oscillators = [];
  };

  return { start, stop };
})();

// Product information from URL params
const productInfo = {
  name: 'Unknown Product',
  price: 'Price not found',
  category: '',
  url: '',
  domain: ''
};

// Extract product info from URL parameters
const urlParams = new URLSearchParams(window.location.search);
productInfo.name = urlParams.get('product') || 'Unknown Product';
productInfo.price = urlParams.get('price') || 'Price not found';
productInfo.category = urlParams.get('category') || '';
productInfo.url = urlParams.get('url') || '';
productInfo.domain = urlParams.get('domain') || '';

// DOM elements
const healthBar = document.getElementById('healthBar');
const healthText = document.getElementById('healthText');
const dialogueContent = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const giveUpButton = document.getElementById('giveUpButton');
const muteButton = document.getElementById('muteButton');
const robotGif = document.querySelector('.robot-gif');

// Initialize
updateHealthDisplay();
setupEventListeners();

// Add initial message with product info
setTimeout(() => {
    let productText;
    if (productInfo.name !== 'Unknown Product' && productInfo.name !== 'this item') {
        productText = `🛒 Attempting to purchase: "${productInfo.name}" (${productInfo.price})`;
    } else {
        productText = '🛒 Attempting to checkout';
    }
    
    const initialMessage = `${productText}\n\n🛡️ The IMPULSE GUARDIAN blocks your path!\n\n💪 Convince me this purchase is necessary to proceed!`;
    addMessage(initialMessage, 'bot');
}, 100);

// Remove encounter overlay after animation
setTimeout(() => {
    const overlay = document.getElementById('encounterOverlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Start background music after encounter animation
    setTimeout(() => {
        musicManager.start();
    }, 500);
}, 1500);

// Start background music on first user interaction
document.addEventListener('pointerdown', () => {
    musicManager.start();
}, { once: true, passive: true });

document.addEventListener('keydown', () => {
    musicManager.start();
}, { once: true });

function setupEventListeners() {
    // Enter key submits message (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button
    sendButton.addEventListener('click', () => {
        sendMessage();
    });
    
    // Give up button
    giveUpButton.addEventListener('click', () => {
        handleDefeat();
    });
    
    // Mute button - controls sound effects and background music
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? '🔇 UNMUTE' : '🔊 MUTE';
        muteButton.classList.toggle('muted', isMuted);
        
        if (isMuted) {
            // Stop background music when muted
            musicManager.stop();
        } else {
            // Play a test sound when unmuting
            soundManager.prime();
            soundManager.play('action');
            // Restart background music
            musicManager.start();
        }
    });
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isProcessing) return;
    
    isProcessing = true;
    sendButton.disabled = true;
    
    // Track battle progress
    battleMessages++;
    
    // Play attack sound
    soundManager.prime();
    soundManager.play('attack');
    
    // Add user message to chat (no typing for user messages)
    addMessage(message, 'user');
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call AI API
        const response = await callAIAPI(message);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response with typing animation
        await addMessageWithTyping(response.text, 'bot');
        
        // Update health based on response
        if (response.damage > 0) {
            takeDamage(response.damage);
        }
        
    } catch (error) {
        console.error('Error calling AI:', error);
        removeTypingIndicator();
        await addMessageWithTyping('💢 Nice try, but my systems are too strong! Try a different argument!', 'bot');
    }
    
    isProcessing = false;
    sendButton.disabled = false;
    userInput.focus();
}

async function callAIAPI(userMessage) {
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: userMessage });
    
    // Check for repetitive arguments
    const recentArgs = conversationHistory.filter(m => m.role === 'user').slice(-3).map(m => m.content.toLowerCase());
    const isRepetitive = recentArgs.length > 1 && recentArgs.some((arg, i) => 
        i > 0 && (arg.includes(recentArgs[0]) || recentArgs[0].includes(arg))
    );
    
    // Include product info in the prompt if available
    const hasValidProductName = productInfo.name !== 'Unknown Product' && 
        productInfo.name !== 'this item' && 
        productInfo.name.length > 5;
    
    const productContext = hasValidProductName
        ? `\n\nTHEY WANT TO BUY: ${productInfo.name} (${productInfo.price})`
        : '';
    
    // Prepare the Pokemon-themed prompt
    const systemPrompt = `You are the IMPULSE GUARDIAN, a sassy AI Pokemon protecting users from impulse purchases. HP: ${currentHealth}/${CONFIG.INITIAL_HEALTH}${productContext}

USER'S ARGUMENT: "${userMessage}"

PREVIOUS ARGUMENTS: ${conversationHistory.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(', ') || 'none'}

RESPOND AS THE IMPULSE GUARDIAN with EXACTLY 2-3 SHORT bullet points (max 12 words each):
• React to their argument (sassy/funny)
• Challenge them with a tough question
• (Optional) Taunt or encourage them

DAMAGE RULES (how much HP you lose):
${isRepetitive ? '• REPETITIVE ARGUMENT = 0 damage (call them out on repeating!)' : ''}
• Completely irrelevant/joke/insult = 0-9 damage
• Vague "I want it" = 12-24 damage
• Mentions need but weak reasoning = 36-48 damage
• Good reasoning with budget consideration = 51-66 damage
• Excellent argument with urgency + budget = 69-84 damage
• PERFECT argument (necessity + urgency + budget + alternatives considered) = 87-105 damage

End with: [DAMAGE: X]

Keep it fun, sassy, and Pokemon-battle themed! Use emojis occasionally. (don't mention the word Pokemon though)

Example responses:

For weak argument:
"• That's not very effective! 😏
• Why do you NEED it right NOW?
• My defenses are still strong!
[DAMAGE: 18]"

For good argument:
"• Oof! That actually makes sense... 💪
• But have you checked if it's on sale?
• You're starting to wear me down!
[DAMAGE: 54]"

For repetitive:
"• Wait, didn't you just say that? 🤨
• Repeating yourself won't work!
• Try a NEW argument!
[DAMAGE: 0]"`;
    
    try {
        console.log('🔍 Calling Cerebras API...');
        
        // Use Cerebras API (same as classic mode)
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.CEREBRAS_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3.1-8b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.8,
                max_tokens: 256
            })
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response received');
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
        console.error('AI API Error:', apiError);
        
        // Provide a fallback response instead of error message
        const fallbackResponses = [
            "• Hmm, interesting point you're making there... 🤔\n• But have you considered your budget?\n• Try harder to convince me!\n[DAMAGE: 24]",
            "• That's one way to justify it... 💭\n• What about saving for emergencies?\n• You'll need better reasoning than that!\n[DAMAGE: 30]",
            "• I see what you're trying to do... 😏\n• But is it REALLY necessary?\n• Keep trying, you're not there yet!\n[DAMAGE: 21]"
        ];
        
        const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        const damageMatch = fallback.match(/\[DAMAGE:\s*(\d+)\]/i);
        const damage = damageMatch ? parseInt(damageMatch[1]) : 24;
        const cleanResponse = fallback.replace(/\[DAMAGE:\s*\d+\]/i, '').trim();
        
        conversationHistory.push({ role: 'assistant', content: cleanResponse });
        
        return {
            text: cleanResponse,
            damage: damage
        };
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'dialogue-text';
    
    // Add prefix for sender
    const prefix = sender === 'user' ? '▶ YOU: ' : '▶ GUARDIAN: ';
    
    // Color code messages
    if (sender === 'user') {
        messageDiv.style.color = '#0066cc';
        messageDiv.textContent = prefix + text;
    } else {
        // For bot messages, we'll add the prefix first, then animate the text
        messageDiv.textContent = prefix;
    }
    
    dialogueContent.appendChild(messageDiv);
    dialogueContent.scrollTop = dialogueContent.scrollHeight;
    
    return messageDiv; // Return for typing animation
}

async function addMessageWithTyping(text, sender) {
    const messageDiv = addMessage(text, sender);
    
    // Only animate bot messages
    if (sender === 'bot') {
        const prefix = '▶ GUARDIAN: ';
        messageDiv.textContent = prefix;
        
        // Type out the message character by character
        let currentText = '';
        const typingSpeed = 20; // milliseconds per character
        
        for (let i = 0; i < text.length; i++) {
            currentText += text[i];
            messageDiv.textContent = prefix + currentText;
            
            // Scroll every few characters
            if (i % 3 === 0) {
                dialogueContent.scrollTop = dialogueContent.scrollHeight;
            }
            
            // Wait before next character
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
        
        // Final scroll
        dialogueContent.scrollTop = dialogueContent.scrollHeight;
    }
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'dialogue-text';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '▶ GUARDIAN: <span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    dialogueContent.appendChild(typingDiv);
    dialogueContent.scrollTop = dialogueContent.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function takeDamage(damage) {
    currentHealth = Math.max(0, currentHealth - damage);
    updateHealthDisplay();
    
    // Play damage sound
    if (damage > 0) {
        soundManager.play('damage');
    }
    
    // Show damage number floating up
    showDamageNumber(damage);
    
    // Flash robot red when damaged
    if (robotGif) {
        robotGif.classList.remove('damaged');
        void robotGif.offsetWidth; // Force reflow
        robotGif.classList.add('damaged');
        
        setTimeout(() => {
            robotGif.classList.remove('damaged');
        }, 600);
    }
    
    // Show damage effect animation on robot
    const damageEffect = document.getElementById('damageEffect');
    if (damageEffect) {
        damageEffect.classList.remove('show');
        void damageEffect.offsetWidth; // Force reflow
        damageEffect.classList.add('show');
        
        setTimeout(() => {
            damageEffect.classList.remove('show');
        }, 800);
    }
    
    // Add visual feedback based on damage amount
    const container = document.querySelector('.health-bar-container');
    if (damage >= 69) { // Updated for 3x damage (was 23)
        // Critical hit animation
        container.style.animation = 'criticalHit 0.8s';
        document.body.style.animation = 'screenFlash 0.3s';
        
        console.log('💥 CRITICAL HIT!');
    } else if (damage >= 48) { // Updated for 3x damage (was 16)
        container.style.animation = 'bigShake 0.6s';
    } else if (damage > 0) {
        container.style.animation = 'shake 0.5s';
    }
    
    setTimeout(() => {
        container.style.animation = '';
        document.body.style.animation = '';
    }, 800);
    
    // Check if bot is defeated
    if (currentHealth <= CONFIG.MIN_HEALTH_TO_PASS) {
        handleVictory();
    }
}

function showDamageNumber(damage) {
    const damageDiv = document.createElement('div');
    damageDiv.className = 'damage-number';
    damageDiv.textContent = `-${damage}`;
    
    // Style based on damage amount
    if (damage >= 23) {
        damageDiv.classList.add('critical');
        damageDiv.textContent = `CRIT! -${damage}`;
    } else if (damage >= 16) {
        damageDiv.classList.add('high');
    }
    
    document.querySelector('.health-bar-container').appendChild(damageDiv);
    
    // Remove after animation
    setTimeout(() => damageDiv.remove(), 1500);
}

function updateHealthDisplay() {
    const healthPercentage = (currentHealth / CONFIG.INITIAL_HEALTH) * 100;
    healthBar.style.width = `${healthPercentage}%`;
    healthText.textContent = `${currentHealth}/${CONFIG.INITIAL_HEALTH}`;
    
    // Update health bar color based on percentage
    if (healthPercentage <= 30) {
        healthBar.className = 'health-bar low';
    } else if (healthPercentage <= 60) {
        healthBar.className = 'health-bar medium';
    } else {
        healthBar.className = 'health-bar';
    }
}

function handleVictory() {
    // Stop background music and play victory sound
    musicManager.stop();
    soundManager.play('victory');
    
    // Calculate battle duration and performance
    const battleDuration = Math.floor((Date.now() - battleStartTime) / 1000); // in seconds
    
    // Update statistics - user won the battle (defeated the bot) - purchase was allowed
    updateStats(true);
    
    // Add victory message with random celebration
    const victoryMessages = [
        "💸 GG WP! You've defeated me! Your wallet is now unlocked!",
        "💀 FATALITY! You win! Fine, buy your thing.",
        "🏆 Achievement Unlocked: WALLET WARRIOR!",
        "💥 Critical hit to my defenses! Victory is yours!"
    ];
    
    setTimeout(() => {
        const randomMessage = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
        addMessage(randomMessage, 'bot');
        
        // Show victory banner in dialogue
        const victoryBanner = document.createElement('div');
        victoryBanner.className = 'dialogue-text';
        victoryBanner.style.color = '#00a800';
        victoryBanner.style.fontWeight = 'bold';
        victoryBanner.style.textAlign = 'center';
        victoryBanner.textContent = '★ BOSS DEFEATED! LOADING PURCHASE REVIEW... ★';
        dialogueContent.appendChild(victoryBanner);
        dialogueContent.scrollTop = dialogueContent.scrollHeight;
        
        // Disable input
        userInput.disabled = true;
        sendButton.disabled = true;
        giveUpButton.disabled = true;
        
        // Switch to result screen after victory - show alternatives and final decision
        setTimeout(() => {
            try {
                // Send message with battle stats
                window.parent.postMessage({ 
                    action: 'switch-to-result-screen',
                    productInfo: productInfo,
                    battleStats: {
                        duration: battleDuration,
                        messages: battleMessages,
                        victory: true
                    }
                }, '*');
            } catch (e) {
                console.error('Could not switch to result screen:', e);
                // Fallback: just remove overlay and allow purchase
                window.parent.postMessage({ action: 'remove-impulse-overlay' }, '*');
            }
        }, 2000);
    }, 500);
}

async function handleDefeat() {
    // Stop background music and play defeat sound
    musicManager.stop();
    soundManager.play('defeat');
    
    // Update statistics - user gave up (bot won) - purchase was blocked
    updateStats(false);
    
    // User gave up - show transition message
    const defeatMessages = [
        "🎉 Wise choice! The GUARDIAN is proud!\n\nYou've saved your money for something better! 💰",
        "🛡️ The GUARDIAN protects your wallet!\n\nYour future self thanks you! 🙏",
        "✨ Victory for financial responsibility!\n\nMaybe you didn't need it after all! 💪",
        "🏆 The GUARDIAN prevails!\n\nYour savings account is grateful! 📈"
    ];
    
    const randomMessage = defeatMessages[Math.floor(Math.random() * defeatMessages.length)];
    
    // Show the message without typing animation for immediate feedback
    addMessage(randomMessage, 'bot');
    
    // Show transition banner
    const transitionBanner = document.createElement('div');
    transitionBanner.className = 'dialogue-text';
    transitionBanner.style.color = '#00a800';
    transitionBanner.style.fontWeight = 'bold';
    transitionBanner.style.textAlign = 'center';
    transitionBanner.textContent = '✨ Loading purchase review... ✨';
    dialogueContent.appendChild(transitionBanner);
    dialogueContent.scrollTop = dialogueContent.scrollHeight;
    
    // Disable input
    userInput.disabled = true;
    sendButton.disabled = true;
    giveUpButton.disabled = true;
    
    // Switch to the non-gamified result screen after a short delay
    setTimeout(() => {
        try {
            // Send message to parent window to switch to result screen
            window.parent.postMessage({ 
                action: 'switch-to-result-screen',
                productInfo: productInfo
            }, '*');
        } catch (e) {
            console.error('Could not switch to result screen:', e);
            // Fallback: just close tab
            window.parent.postMessage({ action: 'close-tab' }, '*');
        }
    }, 2000);
}

// Update statistics
async function updateStats(purchaseAllowed) {
    try {
        // Extract price as number
        const priceNum = extractNumericPrice(productInfo.price);
        
        // Use AI to categorize the product (or use simple fallback)
        const category = await categorizeProduct(productInfo.name);
        
        // Prepare stats update data
        const statsUpdate = {
            purchaseAllowed: purchaseAllowed,
            price: priceNum,
            category: category,
            productName: productInfo.name,
            timestamp: new Date().toISOString()
        };
        
        console.log('🎮 Game Mode - Updating stats:', statsUpdate);
        
        // Send message to parent window (content script will catch it)
        window.parent.postMessage({
            action: 'update-stats',
            data: statsUpdate
        }, '*');
        
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

// Extract numeric price from price string
function extractNumericPrice(priceStr) {
    if (!priceStr || priceStr === 'Price not found') return 50; // Default fallback
    
    // Remove currency symbols and extract number
    const match = priceStr.match(/[\d,]+\.?\d*/);
    if (match) {
        const numStr = match[0].replace(/,/g, '');
        return parseFloat(numStr) || 50;
    }
    return 50;
}

// Simple product categorization
async function categorizeProduct(productName) {
    if (!productName || productName === 'Unknown Product') return 'Other';
    
    const nameLower = productName.toLowerCase();
    
    // Simple keyword-based categorization
    if (nameLower.match(/\b(laptop|phone|tablet|computer|monitor|keyboard|mouse|headphone|camera|tv|console|gaming)\b/)) {
        return 'Electronics';
    } else if (nameLower.match(/\b(shirt|shoes|pants|dress|jacket|clothing|fashion|watch|bag|accessory)\b/)) {
        return 'Clothing';
    } else if (nameLower.match(/\b(fitness|gym|exercise|yoga|running|sports|workout)\b/)) {
        return 'Fitness';
    } else if (nameLower.match(/\b(furniture|decor|home|kitchen|bedding|lamp|table|chair)\b/)) {
        return 'Home';
    } else if (nameLower.match(/\b(vitamin|supplement|health|wellness|medicine|skincare|beauty)\b/)) {
        return 'Health';
    } else if (nameLower.match(/\b(book|magazine|novel|education|course|learning)\b/)) {
        return 'Education';
    } else if (nameLower.match(/\b(toy|game|puzzle|entertainment|hobby)\b/)) {
        return 'Entertainment';
    } else if (nameLower.match(/\b(food|snack|drink|meal|grocery)\b/)) {
        return 'Food';
    }
    
    return 'Other';
}

// Add shake animation for health bar
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); }
        50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5); }
    }
    
    @keyframes victoryPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);
