const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");

send.addEventListener("click", () => {
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("You", userText);
  input.value = "";

  const score = userText.length + (userText.includes("need") ? 10 : 0);

  if (score > 40) {
    addMessage("AI", "Alright, that sounds reasonable. Go ahead!");
    unlockBtn.disabled = false;
  } else {
    addMessage("AI", "Hmm... that doesn’t sound convincing. Try again.");
  }
});

unlockBtn.addEventListener("click", () => {
  window.top.document.querySelector("iframe").remove();
});

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.textContent = `${sender}: ${text}`;
  chat.appendChild(msg);
}
