const chat = document.getElementById("chat");
const input = document.getElementById("user-input");
const send = document.getElementById("send");
const unlockBtn = document.getElementById("unlock");

function submitPrompt() {
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("You", userText);
  input.value = "";

  const score = userText.length + (userText.includes("need") ? 10 : 0);

  if (score > 40) {
    addMessage("AI", "Alright, that sounds reasonable. Go ahead!");
    unlockBtn.disabled = false;
  } else {
    addMessage("AI", "Hmm... that doesn't sound convincing. Try again.");
  }
}

send.addEventListener("click", submitPrompt);

// Prevent Enter from creating new line and submit instead
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submitPrompt();
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
