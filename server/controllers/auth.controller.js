const { supabase, isConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabase.service');

async function signup(req, res, next) {
  try {
    const { email, password, name, monthly_income } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    if (isConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: (name && name.trim()) || email.split('@')[0] }
        }
      });
      if (error) return res.status(400).json({ success: false, error: error.message });

      return res.status(201).json({
        success: true,
        user: data.user,
        token: data.session?.access_token || null,
        message: 'Account registered successfully!'
      });
    }

    // Check if account already exists in local store
    const existing = await supabaseService.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in.' });
    }

    // Register user in local storage
    const newUser = await supabaseService.createUser({ email, password, name, monthly_income });
    const token = `token-${newUser.id}`;

    return res.status(201).json({
      success: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token,
      message: `Welcome to FutureVerse, ${newUser.name}!`
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (isConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ success: false, error: error.message });

      return res.json({
        success: true,
        user: data.user,
        token: data.session.access_token,
        message: 'Signed in successfully.'
      });
    }

    // Check local store
    const user = await supabaseService.findUserByEmail(email);
    if (user) {
      if (user.password && user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
      }
      return res.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
        token: `token-${user.id}`,
        message: `Welcome back, ${user.name}!`
      });
    }

    // Default demo user fallback (alex@example.com / demo)
    if (email.toLowerCase().includes('demo') || email.toLowerCase().includes('alex')) {
      return res.json({
        success: true,
        user: { id: 'demo-user-123', email: 'alex@example.com', name: 'Alex Morgan' },
        token: 'demo-token',
        message: 'Signed in with demo account.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Account not found with this email. Click "Create Account" to register.'
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (isConfigured()) {
      await supabase.auth.signOut();
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const profile = await supabaseService.getProfile(req.user.id);
    const finance = await supabaseService.getFinancialProfile(req.user.id);
    res.json({
      success: true,
      user: {
        ...req.user,
        ...profile
      },
      financialProfile: finance
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  logout,
  me
};
