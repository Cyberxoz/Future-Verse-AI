const { GoogleGenAI } = require('@google/genai');
const config = require('./env');

let aiClient = null;
let isConfigured = false;

if (config.geminiApiKey && config.geminiApiKey.trim() !== '' && config.geminiApiKey !== 'your-gemini-api-key') {
  try {
    aiClient = new GoogleGenAI({ apiKey: config.geminiApiKey.trim() });
    isConfigured = true;
    console.log('✓ Google Gemini SDK (@google/genai) initialized.');
  } catch (err) {
    console.warn('⚠ Could not initialize Gemini SDK:', err.message);
  }
} else {
  console.log('ℹ Gemini API key not set in .env. AI Coach will prompt user to supply GEMINI_API_KEY.');
}

module.exports = {
  getAiClient: () => aiClient,
  isConfigured: () => isConfigured
};
