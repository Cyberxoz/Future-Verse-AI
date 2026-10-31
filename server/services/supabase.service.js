const { supabase, supabaseAdmin, isConfigured } = require('../config/supabase');

// Default initial demo state for seamless local/demo mode
const localDataStore = {
  users: {
    'demo-user-123': {
      id: 'demo-user-123',
      email: 'samaira7269@gmail.com',
      name: 'Samaira'
    }
  },
  financialProfiles: {
    'demo-user-123': {
      user_id: 'demo-user-123',
      monthly_income: 72000,
      monthly_expenses: 53400,
      starting_savings: 84250,
      emergency_buffer: 60000,
      currency: 'INR',
      planning_style: 'Balanced & steady'
    }
  },
  transactions: {
    'demo-user-123': [
      { id: 'tx-1', user_id: 'demo-user-123', title: 'Freelance payment', amount: 18000, category: 'Income', type: 'income', date: '2026-10-30' },
      { id: 'tx-2', user_id: 'demo-user-123', title: 'Apartment rent', amount: 18000, category: 'Housing', type: 'expense', date: '2026-10-29' },
      { id: 'tx-3', user_id: 'demo-user-123', title: 'Blue Tokai Coffee', amount: 420, category: 'Food', type: 'expense', date: '2026-10-28' },
      { id: 'tx-4', user_id: 'demo-user-123', title: 'Metro recharge', amount: 1500, category: 'Transport', type: 'expense', date: '2026-10-27' }
    ]
  },
  goals: {
    'demo-user-123': [
      { id: 'g-1', user_id: 'demo-user-123', title: 'Emergency Fund', target_amount: 60000, current_amount: 42000, target_date: 'Mar 2027', category: 'Safety', icon: '◉' },
      { id: 'g-2', user_id: 'demo-user-123', title: 'New Laptop', target_amount: 50000, current_amount: 37000, target_date: 'Jan 2027', category: 'Tech', icon: '▱' },
      { id: 'g-3', user_id: 'demo-user-123', title: 'Vacation', target_amount: 25000, current_amount: 8500, target_date: 'Jun 2027', category: 'Travel', icon: '☀' }
    ]
  },
  simulations: {
    'demo-user-123': []
  },
  messages: {
    'demo-user-123': [
      {
        id: 'msg-init-1',
        user_id: 'demo-user-123',
        role: 'assistant',
        content: "Hi Samaira! I'm your FutureVerse AI Financial Coach. I can analyze your income, savings, upcoming expenses, and simulate real purchase decisions before you commit. How can I help you shape your financial future today?",
        metadata_json: {},
        created_at: new Date().toISOString()
      }
    ]
  }
};

class SupabaseService {
  // --- User Management (Local & Supabase) ---
  async findUserByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();
    for (const id in localDataStore.users) {
      if ((localDataStore.users[id].email || '').toLowerCase() === normalized) {
        return localDataStore.users[id];
      }
    }
    return null;
  }

  async createUser({ email, password, name, monthly_income = 72000 }) {
    const id = `user-${Date.now()}`;
    const newUser = {
      id,
      email: email.trim(),
      name: (name && name.trim()) || email.split('@')[0],
      password: password || 'password',
      created_at: new Date().toISOString()
    };

    localDataStore.users[id] = newUser;
    localDataStore.financialProfiles[id] = {
      user_id: id,
      monthly_income: Number(monthly_income) || 72000,
      monthly_expenses: Math.round((Number(monthly_income) || 72000) * 0.74),
      starting_savings: Math.round((Number(monthly_income) || 72000) * 1.2),
      emergency_buffer: Math.round((Number(monthly_income) || 72000) * 0.8),
      currency: 'INR',
      planning_style: 'Balanced & steady'
    };

    localDataStore.transactions[id] = [
      { id: `tx-${Date.now()}-1`, user_id: id, title: 'Primary Income', amount: Number(monthly_income) || 72000, category: 'Income', type: 'income', date: new Date().toISOString().split('T')[0] },
      { id: `tx-${Date.now()}-2`, user_id: id, title: 'Housing & Utilities', amount: Math.round((Number(monthly_income) || 72000) * 0.35), category: 'Housing', type: 'expense', date: new Date().toISOString().split('T')[0] }
    ];

    localDataStore.goals[id] = [
      { id: `g-${Date.now()}-1`, user_id: id, title: 'Emergency Fund', target_amount: 60000, current_amount: 25000, target_date: 'Dec 2027', category: 'Safety', icon: '◉' },
      { id: `g-${Date.now()}-2`, user_id: id, title: 'New Tech Setup', target_amount: 50000, current_amount: 15000, target_date: 'Jun 2027', category: 'Tech', icon: '▱' }
    ];

    localDataStore.simulations[id] = [];
    localDataStore.messages[id] = [
      {
        id: `msg-${Date.now()}`,
        user_id: id,
        role: 'assistant',
        content: `Welcome to FutureVerse AI, ${newUser.name}! I'm your personal Financial Coach and Digital Twin model. How can I help you simulate and plan your financial future today?`,
        metadata_json: {},
        created_at: new Date().toISOString()
      }
    ];

    return newUser;
  }

  // --- Profile ---
  async getProfile(userId) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) return data;
    }
    return localDataStore.users[userId] || { id: userId, name: 'Samaira', email: 'samaira7269@gmail.com' };
  }

  // --- Financial Profile ---
  async getFinancialProfile(userId) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('financial_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (!error && data) return data;
    }
    return localDataStore.financialProfiles[userId] || {
      user_id: userId,
      monthly_income: 72000,
      monthly_expenses: 53400,
      starting_savings: 84250,
      emergency_buffer: 60000,
      currency: 'INR',
      planning_style: 'Balanced & steady'
    };
  }

  async updateFinancialProfile(userId, profileData) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('financial_profiles')
        .upsert({ user_id: userId, ...profileData, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const current = await this.getFinancialProfile(userId);
    localDataStore.financialProfiles[userId] = { ...current, ...profileData };
    return localDataStore.financialProfiles[userId];
  }

  // --- Transactions ---
  async getTransactions(userId) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (!error && data) return data;
    }
    return localDataStore.transactions[userId] || [];
  }

  async addTransaction(userId, tx) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({ user_id: userId, ...tx })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const newTx = { id: `tx-${Date.now()}`, user_id: userId, ...tx, created_at: new Date().toISOString() };
    if (!localDataStore.transactions[userId]) localDataStore.transactions[userId] = [];
    localDataStore.transactions[userId].unshift(newTx);
    return newTx;
  }

  async deleteTransaction(userId, txId) {
    if (isConfigured()) {
      const { error } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('id', txId)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    }
    if (localDataStore.transactions[userId]) {
      localDataStore.transactions[userId] = localDataStore.transactions[userId].filter(t => t.id !== txId);
    }
    return true;
  }

  // --- Goals ---
  async getGoals(userId) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return localDataStore.goals[userId] || [];
  }

  async addGoal(userId, goal) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('savings_goals')
        .insert({ user_id: userId, ...goal })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const newGoal = { id: `g-${Date.now()}`, user_id: userId, ...goal, created_at: new Date().toISOString() };
    if (!localDataStore.goals[userId]) localDataStore.goals[userId] = [];
    localDataStore.goals[userId].push(newGoal);
    return newGoal;
  }

  async updateGoal(userId, goalId, updateData) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('savings_goals')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const userGoals = localDataStore.goals[userId] || [];
    const index = userGoals.findIndex(g => g.id === goalId);
    if (index >= 0) {
      userGoals[index] = { ...userGoals[index], ...updateData };
      return userGoals[index];
    }
    return null;
  }

  async deleteGoal(userId, goalId) {
    if (isConfigured()) {
      const { error } = await supabaseAdmin
        .from('savings_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    }
    if (localDataStore.goals[userId]) {
      localDataStore.goals[userId] = localDataStore.goals[userId].filter(g => g.id !== goalId);
    }
    return true;
  }

  // --- Simulations ---
  async saveSimulation(userId, simRecord) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('simulations')
        .insert({ user_id: userId, ...simRecord })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const saved = { id: `sim-${Date.now()}`, user_id: userId, ...simRecord, created_at: new Date().toISOString() };
    if (!localDataStore.simulations[userId]) localDataStore.simulations[userId] = [];
    localDataStore.simulations[userId].unshift(saved);
    return saved;
  }

  async getSimulations(userId) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return localDataStore.simulations[userId] || [];
  }

  // --- Chat & Messages ---
  async getChatMessages(userId) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return localDataStore.messages[userId] || [];
  }

  async saveChatMessage(userId, role, content, metadata = {}) {
    if (isConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          user_id: userId,
          role,
          content,
          metadata_json: metadata
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      role,
      content,
      metadata_json: metadata,
      created_at: new Date().toISOString()
    };
    if (!localDataStore.messages[userId]) localDataStore.messages[userId] = [];
    localDataStore.messages[userId].push(msg);
    return msg;
  }

  async clearChatMessages(userId) {
    if (isConfigured()) {
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);
    }
    localDataStore.messages[userId] = [
      {
        id: `msg-reset-${Date.now()}`,
        user_id: userId,
        role: 'assistant',
        content: "I've refreshed our conversation. How can I help you analyze your finances today?",
        metadata_json: {},
        created_at: new Date().toISOString()
      }
    ];
    return true;
  }
}

module.exports = new SupabaseService();
