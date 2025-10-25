// Configuration file for the extension
// Load API key from environment - in development, manually set or use build process
const GEMINI_API_KEY = typeof process !== 'undefined' && process.env 
  ? process.env.GEMINI_API_KEY 
  : 'AIzaSyBklQ3zstHZcNcvsRZPgrfopCs98JOkxoY'; // Fallback for development

const CONFIG = {
  GEMINI_API_KEY: GEMINI_API_KEY,
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  INITIAL_HEALTH: 100,
  MIN_HEALTH_TO_PASS: 0
};
