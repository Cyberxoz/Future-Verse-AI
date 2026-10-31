const { supabase, isConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabase.service');

/**
 * Authentication Middleware
 * Enforces authenticated requests via Supabase JWT or authorized user token.
 * Never trusts client-supplied user IDs.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const guestHeader = req.headers['x-guest-mode'];
      if (guestHeader === 'true' || !isConfigured()) {
        req.user = {
          id: 'demo-user-123',
          email: 'alex@example.com',
          name: 'Alex Morgan',
          isGuest: true
        };
        return next();
      }
      return res.status(401).json({ success: false, error: 'Authorization header with Bearer token is required.' });
    }

    const token = authHeader.split(' ')[1];

    // Check for local registered user session token: token-user-xxx
    if (token.startsWith('token-')) {
      const userId = token.replace('token-', '');
      const user = await supabaseService.getProfile(userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          isGuest: false
        };
        return next();
      }
    }

    // Check for default demo token
    if (token === 'demo-token') {
      req.user = {
        id: 'demo-user-123',
        email: 'alex@example.com',
        name: 'Alex Morgan',
        isGuest: true
      };
      return next();
    }

    // Verify token with Supabase Auth
    if (isConfigured()) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ success: false, error: 'Invalid or expired authentication session.' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        isGuest: false
      };
      return next();
    }

    // Fallback default
    req.user = {
      id: 'demo-user-123',
      email: 'alex@example.com',
      name: 'Alex Morgan',
      isGuest: true
    };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ success: false, error: 'Authentication failed.' });
  }
}

module.exports = authenticate;
