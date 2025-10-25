const chat = document.getElementById('chat');
const input = document.getElementById('user-input');
const send = document.getElementById('send');
const unlockBtn = document.getElementById('unlock');
const battleMusic = document.getElementById('battle-music');

send.addEventListener('click', () => {
  const userText = input.value.trim();
  if (!userText || animationService.isAnimating()) return;

  addMessage('You', userText);
  input.value = '';

  const score = userText.length + (userText.includes('need') ? 10 : 0);

  if (score > 40) {
    addMessage('AI', 'Alright, that sounds reasonable. Go ahead!');
    unlockBtn.disabled = false;
    // stop music when unlocking
    try {
      if (battleMusic) {
        battleMusic.pause();
        battleMusic.currentTime = 0;
      }
    } catch (e) {}
  } else {
    addMessage('AI', 'Hmm... that doesn’t sound convincing. Try again.');
  }
});

unlockBtn.addEventListener('click', () => {
  try {
    // stop music on unlock
    if (battleMusic) {
      battleMusic.pause();
      battleMusic.currentTime = 0;
    }
  } catch (e) {}
  try {
    window.top.document.querySelector('iframe').remove();
  } catch (e) {
    /* ignore */
  }
});

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.textContent = `${sender}: ${text}`;
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

// Try to play the battle music when the overlay loads; if autoplay is blocked, start on first user gesture.
function tryPlayMusic() {
  if (!battleMusic) return;
  battleMusic.loop = true;
  battleMusic.volume = 0.7;
  const p = battleMusic.play();
  if (p && typeof p.then === 'function') {
    p.catch(() => {
      const startOnInteraction = () => {
        battleMusic.play().catch(() => {});
        window.removeEventListener('click', startOnInteraction);
        window.removeEventListener('keydown', startOnInteraction);
      };
      window.addEventListener('click', startOnInteraction, { once: true });
      window.addEventListener('keydown', startOnInteraction, { once: true });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  tryPlayMusic();
});

function makeSenderLabel(name) {
  const sp = document.createElement('span');
  sp.className = 'sender';
  sp.textContent = name;
  return sp;
}

function makeTextNode(text) {
  const t = document.createElement('div');
  t.className = 'text';
  // preserve newlines
  t.textContent = text;
  return t;
}

function addFormattedMessage(sender, text, role = 'user') {
  const msg = document.createElement('div');
  msg.className = 'msg ' + (role === 'ai' ? 'ai' : role === 'system' ? 'system' : 'user');
  const label = makeSenderLabel(sender + ': ');
  const body = makeTextNode(text);
  msg.appendChild(label);
  msg.appendChild(body);
  chat.appendChild(msg);
  // auto-scroll
  chat.scrollTop = chat.scrollHeight;
}

function submitUserMessage() {
  const raw = input.value;
  const userText = raw.trim();
  if (!userText) return;
  addFormattedMessage('You', userText, 'user');
  input.value = '';

  // simple persuasion score
  const score =
    userText.length +
    (userText.match(/\b(need|must|because|important|value)\b/gi) || []).length * 8 +
    (/[0-9]+/.test(userText) ? 8 : 0);

  if (score > 40) {
    addFormattedMessage('Debate Bot', 'Alright, that sounds reasonable. Go ahead!', 'ai');
    unlockBtn.disabled = false;
    try {
      if (battleMusic) {
        battleMusic.pause();
        battleMusic.currentTime = 0;
      }
    } catch (e) {}
  } else {
    addFormattedMessage('Debate Bot', "Hmm... that doesn't sound convincing. Try again.", 'ai');
  }
}

// Enter key submits (Enter) while Shift+Enter inserts newline
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitUserMessage();
  }
});
