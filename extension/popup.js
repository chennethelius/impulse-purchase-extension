// Popup script with Gemini AI integration
let currentHealth = CONFIG.INITIAL_HEALTH;
let conversationHistory = [];
let isProcessing = false;

// DOM elements
const healthBar = document.getElementById('healthBar');
const healthText = document.getElementById('healthText');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const proceedButton = document.getElementById('proceedButton');
const giveUpButton = document.getElementById('giveUpButton');

// Initialize
updateHealthDisplay();
setupEventListeners();

// Prevent closing the popup
window.addEventListener('beforeunload', (e) => {
    if (currentHealth > CONFIG.MIN_HEALTH_TO_PASS) {
        e.preventDefault();
        e.returnValue = 'You must convince the bot before leaving!';
    }
});

function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    giveUpButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to give up on this purchase?')) {
            window.parent.postMessage({
                type: 'CLOSE_POPUP',
                success: true,
                allowPurchase: false
            }, '*');
        }
    });
    
    proceedButton.addEventListener('click', () => {
        window.parent.postMessage({
            type: 'CLOSE_POPUP',
            success: true,
            allowPurchase: true
        }, '*');
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
        addMessage('Sorry, I had trouble processing that. Try again!', 'bot');
    }
    
    isProcessing = false;
    sendButton.disabled = false;
}

async function callGeminiAPI(userMessage) {
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: userMessage });
    
    // Check for repetitive arguments
    const recentArgs = conversationHistory.filter(m => m.role === 'user').slice(-3).map(m => m.content.toLowerCase());
    const isRepetitive = recentArgs.length > 1 && recentArgs.some((arg, i) => 
        i > 0 && (arg.includes(recentArgs[0]) || recentArgs[0].includes(arg))
    );
    
    // Prepare the prompt with better instructions
    const systemPrompt = `You are a sassy AI guardian blocking impulse purchases. HP: ${currentHealth}/${CONFIG.INITIAL_HEALTH}

USER'S ARGUMENT: "${userMessage}"

PREVIOUS ARGUMENTS: ${conversationHistory.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(', ') || 'none'}

RESPOND WITH EXACTLY 3 SHORT BULLET POINTS (max 10 words each):
• Point 1: React to their argument
• Point 2: Challenge or question them  
• Point 3: Taunt or encourage

DAMAGE RULES:
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
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    // Vary bot avatar based on health
    let botAvatar = '🤖';
    if (sender === 'bot') {
        if (currentHealth <= 30) botAvatar = '😰';
        else if (currentHealth <= 60) botAvatar = '😤';
        else botAvatar = '😎';
    }
    
    avatar.textContent = sender === 'user' ? '👤' : botAvatar;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Format bullet points for better display
    if (sender === 'bot' && text.includes('•')) {
        content.innerHTML = text.split('\n').map(line => 
            line.trim().startsWith('•') ? `<div style="margin: 2px 0;">${line}</div>` : line
        ).join('');
    } else {
        content.textContent = text;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content typing-indicator';
    content.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
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
    
    // Add visual feedback based on damage amount
    if (damage >= 23) {
        // Critical hit animation
        healthBar.style.animation = 'criticalHit 0.8s';
        document.body.style.animation = 'screenFlash 0.3s';
    } else if (damage >= 16) {
        healthBar.style.animation = 'bigShake 0.6s';
    } else if (damage > 0) {
        healthBar.style.animation = 'shake 0.5s';
    }
    
    setTimeout(() => {
        healthBar.style.animation = '';
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
    
    document.querySelector('.health-container').appendChild(damageDiv);
    
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
    proceedButton.disabled = false;
    proceedButton.textContent = '🎮 VICTORY! Claim Your Loot!';
    proceedButton.style.animation = 'pulse 1s infinite';
    
    // Add victory message with random celebration
    const victoryMessages = [
        "GG WP! 🎮 You've defeated me! Your wallet is now unlocked! Don't spend it all in one place! 💸",
        "FATALITY! 💀 You win! Fine, buy your thing. But I'll be back for the next impulse! 👻",
        "Achievement Unlocked: WALLET WARRIOR! 🏆 You've bested me... this time! 😤",
        "Critical hit to my defenses! 💥 Victory is yours, champion! Spend responsibly! 🛍️"
    ];
    
    setTimeout(() => {
        const randomMessage = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
        addMessage(randomMessage, 'bot');
    }, 500);
    
    // Update warning text with victory animation
    const warningText = document.getElementById('warningText');
    warningText.innerHTML = '🎊 <strong>BOSS DEFEATED!</strong> Purchase unlocked! 🎊';
    warningText.style.background = 'linear-gradient(135deg, #4CAF50, #8BC34A)';
    warningText.style.color = 'white';
    warningText.style.animation = 'victoryPulse 1s infinite';
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
