/**
 * FutureVerse AI — Frontend API Client
 * Connects the UI to Express Backend REST APIs & Supabase Auth
 */

(() => {
  const API_BASE = window.VITE_API_BASE_URL || '/api';

  function getToken() {
    return localStorage.getItem('fv_token') || 'demo-token';
  }

  function setToken(token) {
    if (token) localStorage.setItem('fv_token', token);
    else localStorage.removeItem('fv_token');
  }

  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      'x-guest-mode': 'true',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
      }

      return data;
    } catch (err) {
      console.warn(`[API] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  window.FutureVerseAPI = {
    // Health Check
    async getHealth() {
      return request('/health');
    },

    // Auth
    async login(email, password) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.token) setToken(res.token);
      if (res.user) localStorage.setItem('fv_user', JSON.stringify(res.user));
      return res;
    },

    async signup(email, password, name, monthly_income) {
      const res = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, monthly_income })
      });
      if (res.token) setToken(res.token);
      if (res.user) localStorage.setItem('fv_user', JSON.stringify(res.user));
      return res;
    },

    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setToken(null);
        localStorage.removeItem('fv_user');
      }
    },

    getUser() {
      try {
        return JSON.parse(localStorage.getItem('fv_user')) || null;
      } catch (e) {
        return null;
      }
    },

    async getMe() {
      const res = await request('/auth/me');
      if (res.user) localStorage.setItem('fv_user', JSON.stringify(res.user));
      return res;
    },

    // Financial Profile & Summary
    async getSummary() {
      return request('/finance/summary');
    },

    async updateProfile(profileData) {
      return request('/finance/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    },

    // Transactions
    async getTransactions() {
      return request('/transactions');
    },

    async addTransaction(tx) {
      return request('/transactions', {
        method: 'POST',
        body: JSON.stringify(tx)
      });
    },

    async deleteTransaction(id) {
      return request(`/transactions/${id}`, {
        method: 'DELETE'
      });
    },

    // Savings Goals
    async getGoals() {
      return request('/goals');
    },

    async addGoal(goal) {
      return request('/goals', {
        method: 'POST',
        body: JSON.stringify(goal)
      });
    },

    async updateGoal(id, goalData) {
      return request(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(goalData)
      });
    },

    async deleteGoal(id) {
      return request(`/goals/${id}`, {
        method: 'DELETE'
      });
    },

    // Simulation Engine
    async runSimulation(params) {
      return request('/simulate', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },

    async compareParallelFutures(params) {
      return request('/simulate/compare', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },

    // Gemini AI Financial Coach
    async sendChatMessage(message) {
      return request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },

    async getChatHistory() {
      return request('/ai/history');
    },

    async clearChatHistory() {
      return request('/ai/clear', {
        method: 'POST'
      });
    }
  };
})();
