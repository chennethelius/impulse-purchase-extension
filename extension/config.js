// Configuration file for the extension
const CONFIG = {
  CEREBRAS_API_KEY: 'csk-jm9pjwe6rtj5khf38xdeext22mv8wtmy4kckmdrpem4fj9j2',
  CEREBRAS_API_URL: 'https://api.cerebras.ai/v1/chat/completions',
  GEMINI_API_KEY: 'AIzaSyBKmsQZdVykukzSNegonlIH7mORUfj_DCc',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  INITIAL_HEALTH: 100,
  MIN_HEALTH_TO_PASS: 0
};

// Make API keys available globally for overlay-final.js
window.CEREBRAS_API_KEY = CONFIG.CEREBRAS_API_KEY;
window.GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
