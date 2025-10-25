// Popup script with Gemini AI integration and Pokemon battle mechanics
let currentHealth = CONFIG.INITIAL_HEALTH;
let conversationHistory = [];
let isProcessing = false;

// DOM elements
const healthBar = document.getElementById('healthBar');
const healthText = document.getElementById('healthText');
const dialogueContent = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const giveUpButton = document.getElementById('giveUpButton');
const battleMusic = document.getElementById('battleMusic');
const muteButton = document.getElementById('muteButton');
const robotGif = document.querySelector('.robot-gif');

// Initialize
updateHealthDisplay();
setupEventListeners();

// Start battle music early (right when popup loads, before black bars)
setTimeout(() => {
    if (battleMusic) {
        battleMusic.volume = 0.2; // Set volume to 20% (softer)
        battleMusic.play().catch(err => {
            console.log('Audio autoplay blocked:', err);
            // Try to play on first user interaction
            const playOnInteraction = () => {
                battleMusic.play().catch(e => console.log('Could not play audio:', e));
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('keydown', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
            document.addEventListener('keydown', playOnInteraction);
        });
    }
}, 100); // Start music very early (100ms after popup loads)

// Remove encounter overlay after animation
setTimeout(() => {
    const overlay = document.getElementById('encounterOverlay');
    if (overlay) {
        overlay.remove();
    }
}, 1500);

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
    
    // Mute button
    let isMuted = false;
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        battleMusic.muted = isMuted;
        muteButton.textContent = isMuted ? '🔇 UNMUTE' : '🔊 MUTE';
        muteButton.classList.toggle('muted', isMuted);
    });
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isProcessing) return;
    
    isProcessing = true;
    sendButton.disabled = true;
    
    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call Gemini API
        const response = await callGeminiAPI(message);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response
        addMessage(response.text, 'bot');
        
        // Update health based on response
        if (response.damage > 0) {
            takeDamage(response.damage);
        }
        
    } catch (error) {
        console.error('Error calling Gemini:', error);
        removeTypingIndicator();
        addMessage('💢 Nice try, but my systems are too strong! Try a different argument!', 'bot');
    }
    
    isProcessing = false;
    sendButton.disabled = false;
    userInput.focus();
}

async function callGeminiAPI(userMessage) {
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: userMessage });
    
    // Check for repetitive arguments
    const recentArgs = conversationHistory.filter(m => m.role === 'user').slice(-3).map(m => m.content.toLowerCase());
    const isRepetitive = recentArgs.length > 1 && recentArgs.some((arg, i) => 
        i > 0 && (arg.includes(recentArgs[0]) || recentArgs[0].includes(arg))
    );
    
    // Prepare the Pokemon-themed prompt
    const systemPrompt = `You are the IMPULSE GUARDIAN, a sassy AI Pokemon protecting users from impulse purchases. HP: ${currentHealth}/${CONFIG.INITIAL_HEALTH}

USER'S ARGUMENT: "${userMessage}"

PREVIOUS ARGUMENTS: ${conversationHistory.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(', ') || 'none'}

RESPOND AS THE IMPULSE GUARDIAN with EXACTLY 2-3 SHORT bullet points (max 12 words each):
• React to their argument (sassy/funny)
• Challenge them with a tough question
• (Optional) Taunt or encourage them

DAMAGE RULES (how much HP you lose):
${isRepetitive ? '• REPETITIVE ARGUMENT = 0 damage (call them out on repeating!)' : ''}
• Completely irrelevant/joke/insult = 0-3 damage
• Vague "I want it" = 4-8 damage
• Mentions need but weak reasoning = 12-16 damage
• Good reasoning with budget consideration = 17-22 damage
• Excellent argument with urgency + budget = 23-28 damage
• PERFECT argument (necessity + urgency + budget + alternatives considered) = 29-35 damage

End with: [DAMAGE: X]

Keep it fun, sassy, and Pokemon-battle themed! Use emojis occasionally.

Example responses:

For weak argument:
"• That's not very effective! 😏
• Why do you NEED it right NOW?
• My defenses are still strong!
[DAMAGE: 6]"

For good argument:
"• Oof! That actually makes sense... �
• But have you checked if it's on sale?
• You're starting to wear me down!
[DAMAGE: 18]"

For repetitive:
"• Wait, didn't you just say that? 🤨
• Repeating yourself won't work!
• Try a NEW argument!
[DAMAGE: 0]"`;
    
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: systemPrompt + "\n\n" + userMessage
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 256,
            topP: 0.95
        }
    };
    
    try {
        const apiUrl = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            console.error('API Response not OK:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
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
        console.error('Cerebras API Error:', apiError);
        
        // Provide a fallback response instead of error message
        const fallbackResponses = [
            "• Hmm, interesting point you're making there... 🤔\n• But have you considered your budget?\n• Try harder to convince me!\n[DAMAGE: 8]",
            "• That's one way to justify it... 💭\n• What about saving for emergencies?\n• You'll need better reasoning than that!\n[DAMAGE: 10]",
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

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'dialogue-text';
    
    // Add prefix for sender
    const prefix = sender === 'user' ? '▶ YOU: ' : '▶ GUARDIAN: ';
    messageDiv.textContent = prefix + text;
    
    // Color code messages
    if (sender === 'user') {
        messageDiv.style.color = '#0066cc';
    }
    
    dialogueContent.appendChild(messageDiv);
    dialogueContent.scrollTop = dialogueContent.scrollHeight;
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
    if (damage >= 23) {
        // Critical hit animation
        container.style.animation = 'criticalHit 0.8s';
        document.body.style.animation = 'screenFlash 0.3s';
        
        console.log('💥 CRITICAL HIT!');
    } else if (damage >= 16) {
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
    // Update statistics - user won the battle (defeated the bot)
    updateStats('victory');
    
    // Add victory message with random celebration
    const victoryMessages = [
        "GG WP! You've defeated me! Your wallet is now unlocked! 💸",
        "FATALITY! You win! Fine, buy your thing. 💀",
        "Achievement Unlocked: WALLET WARRIOR! 🏆",
        "Critical hit to my defenses! Victory is yours! 💥"
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
        victoryBanner.textContent = '★ BOSS DEFEATED! PURCHASE UNLOCKED! ★';
        dialogueContent.appendChild(victoryBanner);
        
        // Allow purchase to proceed
        window.parent.postMessage({
            type: 'CLOSE_POPUP',
            success: true,
            allowPurchase: true
        }, '*');
    }, 500);
}

function handleDefeat() {
    // Update statistics - user gave up (bot won)
    updateStats('defeat');
    
    // User gave up
    const defeatMessages = [
        "🎉 Wise choice! The GUARDIAN is proud!\n\nYou've saved your money for something better! 💰",
        "🛡️ The GUARDIAN protects your wallet!\n\nYour future self thanks you! 🙏",
        "✨ Victory for financial responsibility!\n\nMaybe you didn't need it after all! 💪",
        "🏆 The GUARDIAN prevails!\n\nYour savings account is grateful! 📈"
    ];
    
    const randomMessage = defeatMessages[Math.floor(Math.random() * defeatMessages.length)];
    addMessage(randomMessage, 'bot');
    
    // Disable input
    userInput.disabled = true;
    sendButton.disabled = true;
    giveUpButton.disabled = true;
    
    // Close popup after 2 seconds
    setTimeout(() => {
        window.parent.postMessage({
            type: 'CLOSE_POPUP',
            success: true,
            allowPurchase: false
        }, '*');
    }, 2000);
}

// Update statistics
async function updateStats(result) {
    try {
        const data = await chrome.storage.local.get(['stats', 'currentPrice']);
        const stats = data.stats || {
            totalBattles: 0,
            victories: 0,
            defeats: 0,
            moneySaved: 0,
            savingsHistory: [],
            recentBattles: []
        };
        
        stats.totalBattles += 1;
        const detectedPrice = data.currentPrice || 50;
        
        if (result === 'victory') {
            stats.victories += 1;
            // Add current cumulative savings to history (no change)
            stats.savingsHistory.push(stats.moneySaved);
            
            // Track recent battle
            stats.recentBattles.push({
                result: 'victory',
                amount: 0,
                timestamp: Date.now()
            });
        } else if (result === 'defeat') {
            stats.defeats += 1;
            // Use the actual detected price from content script
            stats.moneySaved += detectedPrice;
            // Add new cumulative savings to history
            stats.savingsHistory.push(stats.moneySaved);
            
            // Track recent battle
            stats.recentBattles.push({
                result: 'defeat',
                amount: detectedPrice,
                timestamp: Date.now()
            });
            
            console.log('Added to money saved:', detectedPrice);
        }
        
        // Keep only last 50 battles
        if (stats.recentBattles.length > 50) {
            stats.recentBattles = stats.recentBattles.slice(-50);
        }
        
        await chrome.storage.local.set({ stats });
    } catch (error) {
        console.error('Error updating stats:', error);
    }
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
