const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

let supabase = null;
let supabaseAdmin = null;
let isConfigured = false;

if (config.supabaseUrl && config.supabaseAnonKey && config.supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    
    if (config.supabaseServiceKey) {
      supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey);
    } else {
      supabaseAdmin = supabase;
    }
    
    isConfigured = true;
    console.log('✓ Supabase client initialized successfully.');
  } catch (err) {
    console.warn('⚠ Could not initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ Supabase credentials not set in .env. Running with local persistent memory store.');
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured: () => isConfigured
};
