const express = require('express');
const router = express.Router();
const { isConfigured: isSupabaseConfigured } = require('../config/supabase');
const { isConfigured: isGeminiConfigured } = require('../config/gemini');

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FutureVerse AI Backend API',
    version: '1.0.0',
    integrations: {
      supabase: isSupabaseConfigured() ? 'connected' : 'local_fallback_active',
      gemini: isGeminiConfigured() ? 'ready' : 'needs_api_key'
    }
  });
});

module.exports = router;
