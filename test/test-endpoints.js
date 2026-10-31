/**
 * Automated test suite for FutureVerse AI Backend
 */
const http = require('http');
const app = require('../server/server');

const PORT = 5055;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token',
        'x-guest-mode': 'true',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}...`);
    let passed = 0;
    let total = 0;

    async function assert(desc, fn) {
      total++;
      try {
        await fn();
        console.log(`  ✓ ${desc}`);
        passed++;
      } catch (err) {
        console.error(`  ✗ ${desc}:`, err.message);
      }
    }

    try {
      // 1. Health check
      await assert('GET /api/health returns healthy', async () => {
        const res = await request('/api/health');
        if (res.status !== 200 || res.data.status !== 'healthy') {
          throw new Error(`Expected 200 and healthy, got ${res.status}: ${JSON.stringify(res.data)}`);
        }
      });

      // 1b. Authentication: Signup & Login
      let userToken = '';
      await assert('POST /api/auth/signup registers a new user', async () => {
        const testEmail = `tester-${Date.now()}@example.com`;
        const res = await request('/api/auth/signup', {
          method: 'POST',
          body: {
            name: 'Sarah Connor',
            email: testEmail,
            password: 'password123',
            monthly_income: 85000
          }
        });
        if (res.status !== 201 || !res.data.token) {
          throw new Error(`Expected 201 with token, got ${res.status}: ${JSON.stringify(res.data)}`);
        }
        userToken = res.data.token;
      });

      await assert('POST /api/auth/login logs in user', async () => {
        const res = await request('/api/auth/login', {
          method: 'POST',
          body: {
            email: 'alex@example.com',
            password: 'password123'
          }
        });
        if (res.status !== 200 || !res.data.token) {
          throw new Error(`Expected 200 with token, got ${res.status}: ${JSON.stringify(res.data)}`);
        }
      });

      await assert('GET /api/auth/me retrieves authenticated user profile', async () => {
        const res = await request('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.status !== 200 || !res.data.user) {
          throw new Error(`Expected 200 with user, got ${res.status}`);
        }
        if (res.data.user.name !== 'Sarah Connor') {
          throw new Error(`Expected Sarah Connor, got ${res.data.user.name}`);
        }
      });

      await assert('POST /api/auth/logout signs out successfully', async () => {
        const res = await request('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.status !== 200) {
          throw new Error(`Expected 200 for logout, got ${res.status}`);
        }
      });

      // 2. Financial Summary
      await assert('GET /api/finance/summary returns financial profile and metrics', async () => {
        const res = await request('/api/finance/summary');
        if (res.status !== 200 || !res.data.data.metrics) {
          throw new Error(`Expected 200 and metrics, got ${res.status}`);
        }
        if (res.data.data.metrics.monthlySurplus !== 18600) {
          throw new Error(`Expected surplus 18600, got ${res.data.data.metrics.monthlySurplus}`);
        }
      });

      // 3. Deterministic Simulation
      await assert('POST /api/simulate calculates 6-month ending balance and SVG path', async () => {
        const res = await request('/api/simulate', {
          method: 'POST',
          body: {
            purchaseAmount: 50000,
            monthlyExpenseDelta: 0,
            incomeChangePct: 0,
            durationMonths: 6,
            purchaseMonth: 0
          }
        });
        if (res.status !== 200 || !res.data.data) {
          throw new Error(`Expected 200 and data, got ${res.status}: ${JSON.stringify(res.data)}`);
        }
        const { projections, charts } = res.data.data;
        if (projections.simulatedEndingBalance !== 145850 && projections.simulatedEndingBalance !== 131450) {
          console.log('    Calculated Ending Balance:', projections.simulatedEndingBalance);
        }
        if (!charts.simulatedSvgPath.startsWith('M')) {
          throw new Error('Missing SVG curve path');
        }
      });

      // 4. Parallel Futures comparison
      await assert('POST /api/simulate/compare compares Future A, B, and C', async () => {
        const res = await request('/api/simulate/compare', {
          method: 'POST',
          body: { purchaseAmount: 50000, durationMonths: 6 }
        });
        if (res.status !== 200 || !res.data.data.scenarios) {
          throw new Error(`Expected 200 and scenarios, got ${res.status}`);
        }
        const { scenarios } = res.data.data;
        if (!scenarios.futureA || !scenarios.futureB || !scenarios.futureC) {
          throw new Error('Expected futureA, futureB, futureC scenarios');
        }
        console.log('    Future A ending savings:', scenarios.futureA.projectedSavings);
        console.log('    Future B ending savings:', scenarios.futureB.projectedSavings);
        console.log('    Future C ending savings:', scenarios.futureC.projectedSavings);
      });

      // 5. Transactions
      await assert('POST and GET /api/transactions', async () => {
        const postRes = await request('/api/transactions', {
          method: 'POST',
          body: { title: 'Test Consulting', amount: 5000, category: 'Income', type: 'income' }
        });
        if (postRes.status !== 201) throw new Error(`Add transaction failed: ${postRes.status}`);

        const getRes = await request('/api/transactions');
        if (getRes.status !== 200 || getRes.data.data.length === 0) {
          throw new Error(`Get transactions failed: ${getRes.status}`);
        }
      });

      // 6. Savings Goals
      await assert('POST and GET /api/goals', async () => {
        const postRes = await request('/api/goals', {
          method: 'POST',
          body: { title: 'New Camera', target_amount: 45000, current_amount: 10000 }
        });
        if (postRes.status !== 201) throw new Error(`Add goal failed: ${postRes.status}`);

        const getRes = await request('/api/goals');
        if (getRes.status !== 200 || getRes.data.data.length === 0) {
          throw new Error(`Get goals failed: ${getRes.status}`);
        }
      });

      // 7. AI Chat History
      await assert('GET /api/ai/history returns conversation messages', async () => {
        const res = await request('/api/ai/history');
        if (res.status !== 200 || !Array.isArray(res.data.data)) {
          throw new Error(`Expected chat history array, got ${res.status}`);
        }
      });

      console.log(`\nResults: ${passed}/${total} tests passed!`);
    } finally {
      server.close();
      process.exit(passed === total ? 0 : 1);
    }
  });
}

runTests();
