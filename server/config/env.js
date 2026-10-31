const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Google Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // CORS / Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  viteApiBaseUrl: process.env.VITE_API_BASE_URL || '/api'
};

module.exports = config;
