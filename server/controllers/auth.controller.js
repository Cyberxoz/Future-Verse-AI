const { supabase, isConfigured } = require('../config/supabase');
const supabaseService = require('../services/supabase.service');

async function signup(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (isConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split('@')[0] }
        }
      });
      if (error) return res.status(400).json({ success: false, error: error.message });

      return res.status(201).json({
        success: true,
        user: data.user,
        session: data.session,
        message: 'Signup successful.'
      });
    }

    // Demo Mode signup
    const demoUser = {
      id: `demo-${Date.now()}`,
      email,
      name: name || email.split('@')[0]
    };
    return res.status(201).json({
      success: true,
      user: demoUser,
      token: 'demo-token',
      message: 'Demo account registered successfully.'
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
        session: data.session
      });
    }

    // Demo Mode login
    return res.json({
      success: true,
      user: {
        id: 'demo-user-123',
        email,
        name: 'Alex Morgan'
      },
      token: 'demo-token',
      message: 'Logged in under demo mode.'
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
