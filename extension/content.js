// content.js
const suspiciousPatterns = ["checkout", "cart", "purchase", "buy"];

if (suspiciousPatterns.some(p => window.location.href.includes(p))) {
  blockPage();
}

function blockPage() {
  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("overlay.html");
  iframe.style.position = "fixed";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100vw";
  iframe.style.height = "100vh";
  iframe.style.border = "none";
  iframe.style.zIndex = 999999;
  iframe.style.backgroundColor = "rgba(0,0,0,0.8)";
  document.body.appendChild(iframe);
}
