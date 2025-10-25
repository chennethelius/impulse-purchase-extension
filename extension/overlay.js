const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");
const battleMusic = document.getElementById('battle-music');

send.addEventListener("click", () => {
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("You", userText);
  input.value = "";

  const score = userText.length + (userText.includes("need") ? 10 : 0);

  if (score > 40) {
    addMessage("AI", "Alright, that sounds reasonable. Go ahead!");
    unlockBtn.disabled = false;
    // stop music when unlocking
    try{ if(battleMusic){ battleMusic.pause(); battleMusic.currentTime = 0; } }catch(e){}
  } else {
    addMessage("AI", "Hmm... that doesn’t sound convincing. Try again.");
  }
});

unlockBtn.addEventListener("click", () => {
  try{
    // stop music on unlock
    if(battleMusic){ battleMusic.pause(); battleMusic.currentTime = 0; }
  }catch(e){}
  try{ window.top.document.querySelector("iframe").remove(); }catch(e){ /* ignore */ }
});

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.textContent = `${sender}: ${text}`;
  chat.appendChild(msg);
}

// Try to play the battle music when the overlay loads; if autoplay is blocked, start on first user gesture.
function tryPlayMusic(){
  if(!battleMusic) return;
  battleMusic.loop = true;
  battleMusic.volume = 0.7;
  const p = battleMusic.play();
  if(p && typeof p.then === 'function'){
    p.catch(()=>{
      const startOnInteraction = ()=>{
        battleMusic.play().catch(()=>{});
        window.removeEventListener('click', startOnInteraction);
        window.removeEventListener('keydown', startOnInteraction);
      };
      window.addEventListener('click', startOnInteraction, {once:true});
      window.addEventListener('keydown', startOnInteraction, {once:true});
    });
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  tryPlayMusic();
});
