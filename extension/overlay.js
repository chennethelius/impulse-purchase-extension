// UI elements
const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");
const forcePoint = document.getElementById("force-point");
const aiIcon = document.getElementById("ai-icon");
const aiHealthFill = document.getElementById("ai-health-fill");
const intro = document.getElementById("intro-overlay");
const battleMusic = document.getElementById('battle-music');

let aiHealth = 100;
const POINT_DAMAGE = 25; // how much health is lost per convincing argument
const PERSUADE_THRESHOLD = 40; // score threshold to count as a convincing argument

function showIntroThenStart(){
  // show intro animation then hide
  intro.classList.remove('hidden');
  setTimeout(()=>{intro.classList.add('hidden')}, 2200);
  // attempt to start music when overlay appears; browsers may block autoplay, so handle promise
  tryPlayMusic();
}

function clamp(v,min,max){return Math.max(min,Math.min(max,v))}

function updateHealth(){
  aiHealth = clamp(aiHealth,0,100);
  aiHealthFill.style.width = aiHealth + "%";
  if(aiHealth <= 0){
    addMessage('SYSTEM','You have defeated the Debate Bot — purchase unlocked.');
    unlockBtn.disabled = false;
    aiIcon.style.filter = 'grayscale(80%)';
  }
}

function addMessage(sender, text, who='user'){
  const msg = document.createElement('div');
  msg.className = 'msg ' + (who==='ai'?'ai':'user');
  const name = document.createElement('strong');
  name.textContent = sender + ': ';
  name.style.marginRight = '6px';
  const txt = document.createElement('span');
  txt.textContent = text;
  msg.appendChild(name);
  msg.appendChild(txt);
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function aiRespond(text){
  // switch to response animation
  const idle = aiIcon.getAttribute('data-idle') || 'assets/ryu3.gif';
  const resp = aiIcon.getAttribute('data-response') || 'assets/agcnla7ehef41.gif';
  aiIcon.src = resp;
  addMessage('Debate Bot', text, 'ai');
  setTimeout(()=>{ aiIcon.src = idle; }, 1200);
}

function tryPlayMusic(){
  if(!battleMusic) return;
  battleMusic.loop = true;
  battleMusic.volume = 0.65;
  // Attempt to play; if blocked, we'll start on first user gesture
  const p = battleMusic.play();
  if(p && typeof p.then === 'function'){
    p.catch(()=>{
      // autoplay blocked; attach to first user interaction
      const startOnUser = ()=>{
        battleMusic.play().catch(()=>{});
        window.removeEventListener('click', startOnUser);
        window.removeEventListener('keydown', startOnUser);
      };
      window.addEventListener('click', startOnUser, {once:true});
      window.addEventListener('keydown', startOnUser, {once:true});
    });
  }
}

function stopMusic(){
  if(!battleMusic) return;
  try{battleMusic.pause(); battleMusic.currentTime = 0;}catch(e){}
}

send.addEventListener('click', ()=>{
  const userText = input.value.trim();
  if(!userText) return;
  addMessage('You', userText, 'user');
  input.value = '';

  // simple persuasion score
  let score = userText.length + (userText.match(/\b(need|must|because|important|value)\b/gi)||[]).length*8;
  if(/[0-9]+/.test(userText)) score += 8; // mentioning price or numbers helps

  if(score >= PERSUADE_THRESHOLD){
    // player lands a hit on AI
    aiHealth -= POINT_DAMAGE;
    updateHealth();
    aiRespond("I see your point... but I still have doubts.");
  } else {
    aiRespond("That isn't convincing yet. Elaborate or consider why this purchase matters.");
  }
});

forcePoint.addEventListener('click', ()=>{
  aiHealth -= POINT_DAMAGE;
  updateHealth();
});

unlockBtn.addEventListener('click', ()=>{
  // remove overlay from parent window
  try{ // host page injection may wrap this overlay in an iframe
    const topFrame = window.top.document.querySelector('iframe');
    if(topFrame) topFrame.remove();
  }catch(e){
    // fallback: just hide
    document.body.innerHTML = '';
  }
});

// set data attributes for icons (files placed under assets/)
aiIcon.setAttribute('data-idle','assets/ryu3.gif');
aiIcon.setAttribute('data-response','assets/agcnla7ehef41.gif');

// show intro animation (mewtwo) when overlay loads
document.addEventListener('DOMContentLoaded', ()=>{
  showIntroThenStart();
  updateHealth();
});
