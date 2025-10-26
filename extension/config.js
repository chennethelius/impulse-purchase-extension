// Configuration file for the extension
// Load API key from environment - in development, manually set or use build process
const GEMINI_API_KEY = typeof process !== 'undefined' && process.env 
  ? process.env.GEMINI_API_KEY 
  : 'Insert fallback API'; // Fallback for development

const CONFIG = {
  CEREBRAS_API_KEY: 'API key here',
  CEREBRAS_API_URL: 'https://api.cerebras.ai/v1/chat/completions',
  GEMINI_API_KEY: 'API key here',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
};

// Make API keys available globally for overlay-final.js
window.CEREBRAS_API_KEY = CONFIG.CEREBRAS_API_KEY;
window.GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
