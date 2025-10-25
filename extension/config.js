// Configuration file for the extension
// Load API key from environment - in development, manually set or use build process
const GEMINI_API_KEY = typeof process !== 'undefined' && process.env 
  ? process.env.GEMINI_API_KEY 
  : 'AIzaSyBklQ3zstHZcNcvsRZPgrfopCs98JOkxoY'; // Fallback for development

const CONFIG = {
  CEREBRAS_API_KEY: 'csk-jm9pjwe6rtj5khf38xdeext22mv8wtmy4kckmdrpem4fj9j2',
  CEREBRAS_API_URL: 'https://api.cerebras.ai/v1/chat/completions',
  INITIAL_HEALTH: 100,
  MIN_HEALTH_TO_PASS: 0
};
