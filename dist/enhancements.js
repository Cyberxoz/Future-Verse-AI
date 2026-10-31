/**
 * FutureVerse AI — Frontend Application Controller & Backend Connector
 * Connects the UI to Express Backend, Supabase, Calculation Engine & Gemini AI Coach
 */

(() => {
  // Global Toast Notification Helper
  const toast = (message) => {
    let t = document.querySelector('.app-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'app-toast';
      document.body.append(t);
    }
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(window.__moneyverseToast);
    window.__moneyverseToast = setTimeout(() => t.classList.remove('show'), 3000);
  };
  window.toast = toast;

  // Cached state
  let currentProfile = null;
  let currentSimAmount = 50000;
  let chatHistoryCache = [];

  // Format currency in Indian numbering (INR)
  function formatINR(num) {
    const val = Number(num) || 0;
    return '₹' + Math.round(val).toLocaleString('en-IN');
  }

  // Parse string like "₹ 50,000" into number 50000
  function parseMoney(str) {
    if (typeof str === 'number') return str;
    return Number(String(str).replace(/[^\d.-]/g, '')) || 0;
  }

  // --- AI Financial Coach Screen Template ---
  screenData.coach = {
    tag: 'Personal, Plain-Language Support',
    title: 'AI Financial Coach',
    sub: 'Powered by Google Gemini · Grounded in your real financial data & simulations',
    body: `
      <div class="chat-container">
        <div class="chat-header-bar">
          <div class="chat-header-info">
            <span class="chat-status-dot"></span>
            <div>
              <b style="font-size:12px; color:#2c2842;">FutureVerse Coach</b>
              <small style="display:block; font-size:10px; color:#847fa2;">Active Twin Model · Gemini Flash</small>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-pill-btn" id="newChatBtn"><span>+</span> New Chat</button>
            <button class="chat-pill-btn" id="clearHistoryBtn" style="color:#b91c1c; border-color:#fecaca;">Clear History</button>
          </div>
        </div>

        <div class="chat-messages-area" id="chatMessagesArea">
          <div class="ai-loading-indicator" id="chatLoadingIndicator" style="display:none;">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <span>FutureVerse AI is analyzing your data & simulating outcomes…</span>
          </div>
        </div>

        <div id="chatErrorBanner" style="display:none;" class="chat-error-banner">
          <span id="chatErrorMsg">Failed to connect to AI Coach.</span>
          <button id="chatRetryBtn">Retry</button>
        </div>

        <div class="chat-suggestions-wrap">
          <div class="chat-suggestions-title">✦ Suggested Questions</div>
          <div class="chat-suggestions-list" id="chatSuggestionsList">
            <button class="suggestion-chip" data-q="Can I afford a ₹50,000 laptop?">Can I afford a ₹50,000 laptop?</button>
            <button class="suggestion-chip" data-q="How much can I save in six months?">How much can I save in six months?</button>
            <button class="suggestion-chip" data-q="What happens if I increase my monthly expenses?">What happens if I increase my monthly expenses?</button>
            <button class="suggestion-chip" data-q="How can I improve my monthly surplus?">How can I improve my monthly surplus?</button>
            <button class="suggestion-chip" data-q="Should I purchase something now or wait?">Should I purchase something now or wait?</button>
            <button class="suggestion-chip" data-q="How can I reach my savings goal faster?">How can I reach my savings goal faster?</button>
          </div>
        </div>

        <div class="chat-input-bar">
          <input type="text" class="chat-input-field" id="coachInputField" placeholder="Ask your Financial Coach anything (e.g. Can I afford a phone for ₹30,000?)…" />
          <button class="chat-send-btn" id="coachSendBtn">Send <span>↑</span></button>
        </div>
      </div>
    `
  };

  // --- Reports Screen Template with live bars ---
  screenData.reports.body = `
    <div class="app-grid two report-layout">
      <section class="panel report-chart">
        <div class="report-chart-head">
          <div><b>Income vs. expenses</b><small>Monthly comparison · Last 6 months</small></div>
          <div class="report-legend"><span><i></i> Income</span><span><i></i> Expenses</span></div>
        </div>
        <div class="report-chart-body">
          <div class="y-axis"><span>₹80k</span><span>₹60k</span><span>₹40k</span><span>₹20k</span><span>₹0</span></div>
          <div class="report-plot"><i></i><i></i><i></i><i></i><i></i>
            <div class="bar-pair"><b style="height:72%"></b><em style="height:51%"></em><small>May</small></div>
            <div class="bar-pair"><b style="height:80%"></b><em style="height:58%"></em><small>Jun</small></div>
            <div class="bar-pair"><b style="height:76%"></b><em style="height:55%"></em><small>Jul</small></div>
            <div class="bar-pair"><b style="height:92%"></b><em style="height:61%"></em><small>Aug</small></div>
            <div class="bar-pair"><b style="height:83%"></b><em style="height:57%"></em><small>Sep</small></div>
            <div class="bar-pair current"><b style="height:100%"></b><em style="height:64%"></em><small>Oct</small></div>
          </div>
        </div>
        <div class="report-insight">↗ Income has grown <b>11%</b> while spending remains steady.</div>
      </section>
      <section class="panel savings-card">
        <div><b>Savings trend</b><small>Current monthly rate</small></div>
        <div class="ring"><span id="reportSavingsRate">26%<small>rate</small></span></div>
        <p id="reportSavingsCopy">Your savings rate is <b>4% above</b> the target you set.</p>
        <button data-screen="goals">View goal runway →</button>
      </section>
    </div>
    <div class="app-grid three">
      <section class="panel metric"><small>AVERAGE MONTHLY INCOME</small><b id="repAvgInc">₹72,000</b><em>↗ On track</em></section>
      <section class="panel metric"><small>AVERAGE MONTHLY SPEND</small><b id="repAvgExp">₹53,400</b><em>Within plan</em></section>
      <section class="panel metric"><small>NET SAVINGS ADDED</small><b id="repNetSav">₹1,11,600</b><em>Last 6 months</em></section>
    </div>
  `;

  // --- Attach AI Coach Handlers ---
  function initAiCoachScreen() {
    const area = document.getElementById('chatMessagesArea');
    const input = document.getElementById('coachInputField');
    const sendBtn = document.getElementById('coachSendBtn');
    const loading = document.getElementById('chatLoadingIndicator');
    const errBanner = document.getElementById('chatErrorBanner');
    const errMsg = document.getElementById('chatErrorMsg');
    const retryBtn = document.getElementById('chatRetryBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearBtn = document.getElementById('clearHistoryBtn');
    const suggestions = document.getElementById('chatSuggestionsList');

    if (!area || !input || !sendBtn) return;

    let lastSentMessage = '';

    // Render message bubble
    function appendBubble(role, content, actions = [], isPrepend = false) {
      const bubble = document.createElement('div');
      bubble.className = `bubble ${role === 'user' ? 'user' : 'ai'}`;

      if (role === 'assistant' || role === 'ai') {
        let formatted = (content || '')
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n- /g, '<br>• ');

        let actionsHtml = '';
        if (actions && actions.length > 0) {
          actionsHtml = '<div class="bubble-actions">';
          actions.forEach(act => {
            if (act.type === 'simulate') {
              actionsHtml += `<button class="bubble-action-btn" data-act="simulate" data-amt="${act.amount}">⌁ ${act.label} →</button>`;
            } else if (act.type === 'compare') {
              actionsHtml += `<button class="bubble-action-btn secondary" data-act="compare" data-amt="${act.amount || 50000}">⇄ Compare My Futures →</button>`;
            } else if (act.type === 'simulator') {
              actionsHtml += `<button class="bubble-action-btn" data-act="open-sim">⌁ Open Future Simulator →</button>`;
            } else if (act.type === 'goals') {
              actionsHtml += `<button class="bubble-action-btn secondary" data-act="open-goals">◎ View Savings Goals →</button>`;
            }
          });
          actionsHtml += '</div>';
        }

        bubble.innerHTML = `
          <div class="ai-header"><span>✦</span> FutureVerse AI Coach</div>
          <div class="ai-content">${formatted}</div>
          ${actionsHtml}
        `;
      } else {
        bubble.innerHTML = `<p>${content}</p>`;
      }

      if (isPrepend) {
        area.insertBefore(bubble, loading);
      } else {
        area.insertBefore(bubble, loading);
        area.scrollTop = area.scrollHeight;
      }
    }

    // Attach click listeners to dynamic bubble action buttons
    area.addEventListener('click', (e) => {
      const btn = e.target.closest('.bubble-action-btn');
      if (!btn) return;
      const act = btn.dataset.act;
      const amt = Number(btn.dataset.amt) || 50000;

      if (act === 'simulate') {
        currentSimAmount = amt;
        window.showScreen('simulator');
        setTimeout(() => {
          const inp = host.querySelector('.sim-layout input');
          if (inp) {
            inp.value = `₹ ${amt.toLocaleString('en-IN')}`;
            host.querySelector('.sim-run')?.click();
          }
        }, 150);
      } else if (act === 'compare') {
        currentSimAmount = amt;
        window.showScreen('futures');
      } else if (act === 'open-sim') {
        window.showScreen('simulator');
      } else if (act === 'open-goals') {
        window.showScreen('goals');
      }
    });

    // Load conversation history from backend
    async function loadChatHistory() {
      try {
        loading.style.display = 'flex';
        const res = await window.FutureVerseAPI.getChatHistory();
        loading.style.display = 'none';

        if (res.data && res.data.length > 0) {
          // Clear default placeholder bubbles except loading
          const existing = area.querySelectorAll('.bubble');
          existing.forEach(b => b.remove());

          res.data.forEach(msg => {
            const meta = msg.metadata_json || {};
            appendBubble(msg.role, msg.content, meta.actions || []);
          });
        } else {
          // Initial greeting
          appendBubble('assistant', "Hi Alex! I'm your FutureVerse AI Financial Coach. Grounded in your live financial data, I can evaluate purchases, project savings runway, and simulate multiple futures. How can I help you shape your financial tomorrow?");
        }
      } catch (err) {
        loading.style.display = 'none';
        console.warn('Could not load chat history:', err.message);
        appendBubble('assistant', "Hi Alex! Ready to explore your financial possibilities. Ask me anything about your budget, upcoming purchases, or savings goals.");
      }
    }

    // Send user message
    async function sendMessage(text) {
      const msg = (text || input.value || '').trim();
      if (!msg) return;

      lastSentMessage = msg;
      input.value = '';
      errBanner.style.display = 'none';

      // Append user bubble
      appendBubble('user', msg);

      // Show AI loading state
      loading.style.display = 'flex';
      sendBtn.disabled = true;
      area.scrollTop = area.scrollHeight;

      try {
        const res = await window.FutureVerseAPI.sendChatMessage(msg);
        loading.style.display = 'none';
        sendBtn.disabled = false;

        if (res.reply) {
          appendBubble('assistant', res.reply, res.actions || []);
        } else if (res.error) {
          errBanner.style.display = 'flex';
          errMsg.textContent = res.error === 'MISSING_API_KEY'
            ? 'Gemini API key is not configured. Please add GEMINI_API_KEY to your backend .env file.'
            : (res.error || 'AI Coach request failed.');
        }
      } catch (err) {
        loading.style.display = 'none';
        sendBtn.disabled = false;
        errBanner.style.display = 'flex';
        errMsg.textContent = err.message || 'Network error connecting to AI Coach.';
      }
    }

    sendBtn.onclick = () => sendMessage();
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    retryBtn.onclick = () => {
      if (lastSentMessage) sendMessage(lastSentMessage);
    };

    // Suggested Questions Click Handler
    suggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.suggestion-chip');
      if (chip && chip.dataset.q) {
        sendMessage(chip.dataset.q);
      }
    });

    // New Chat Button
    newChatBtn.onclick = () => {
      input.value = '';
      input.focus();
      toast('Starting a fresh topic. Type your question below!');
    };

    // Clear History Button
    clearBtn.onclick = async () => {
      if (confirm('Clear your conversation history with FutureVerse AI Coach?')) {
        try {
          await window.FutureVerseAPI.clearChatHistory();
          const existing = area.querySelectorAll('.bubble');
          existing.forEach(b => b.remove());
          appendBubble('assistant', "Conversation refreshed. How can I help you with your finances today?");
          toast('Chat history cleared.');
        } catch (err) {
          toast('Failed to clear chat history: ' + err.message);
        }
      }
    };

    // Load initial history
    loadChatHistory();
  }

  // --- Attach Future Simulator Handlers ---
  function initSimulatorScreen() {
    const pInput = host.querySelector('.controls label:nth-child(2) input');
    const eInput = host.querySelector('.controls label:nth-child(3) input');
    const iInput = host.querySelector('.controls label:nth-child(4) input');
    const dSelect = host.querySelector('.controls label:nth-child(5) select');
    const runBtn = host.querySelector('.sim-run');

    if (!pInput || !runBtn) return;

    // Pre-populate if currentSimAmount was set by AI Coach
    if (currentSimAmount && (!pInput.value || pInput.value === '₹ 50,000')) {
      pInput.value = `₹ ${currentSimAmount.toLocaleString('en-IN')}`;
    }

    async function triggerSimulation() {
      const purchaseAmount = parseMoney(pInput.value);
      const monthlyExpenseDelta = parseMoney(eInput?.value || 0);
      const incomeChangePct = parseMoney(iInput?.value || 0);
      const durationMonths = parseInt(dSelect?.value || '6', 10) || 6;

      runBtn.textContent = 'Calculating…';
      runBtn.disabled = true;

      try {
        const res = await window.FutureVerseAPI.runSimulation({
          purchaseAmount,
          monthlyExpenseDelta,
          incomeChangePct,
          durationMonths
        });

        runBtn.textContent = 'Simulation updated ✓';
        runBtn.disabled = false;

        if (res.data) {
          const { projections, charts, insight } = res.data;

          // Update ending balance
          const resEl = host.querySelector('.sim-result');
          if (resEl) resEl.textContent = formatINR(projections.simulatedEndingBalance);

          // Update SVG curves
          const svg = host.querySelector('.graph-panel svg');
          if (svg && charts) {
            const paths = svg.querySelectorAll('path');
            if (paths[0] && charts.baselineSvgPath) {
              paths[0].setAttribute('d', charts.baselineSvgPath);
            }
            if (paths[1] && charts.simulatedSvgPath) {
              paths[1].setAttribute('d', charts.simulatedSvgPath);
            }
          }

          // Update Twin Insight
          const insightPanel = host.querySelector('.highlight p');
          if (insightPanel && insight?.message) {
            insightPanel.textContent = insight.message;
          }

          // Add interactive buttons if not already present
          let quickLinks = host.querySelector('.sim-quick-actions');
          if (!quickLinks) {
            quickLinks = document.createElement('div');
            quickLinks.className = 'sim-quick-actions';
            quickLinks.style.cssText = 'display:flex; gap:10px; margin-top:14px;';
            quickLinks.innerHTML = `
              <button class="chat-pill-btn" id="askAiSimBtn">✦ Ask AI About This Result</button>
              <button class="chat-pill-btn" id="compareSimBtn">⇄ Compare My Futures</button>
            `;
            host.querySelector('.highlight')?.append(quickLinks);

            document.getElementById('askAiSimBtn')?.addEventListener('click', () => {
              window.showScreen('coach');
              setTimeout(() => {
                const cInput = document.getElementById('coachInputField');
                if (cInput) {
                  cInput.value = `Explain the impact of buying this for ₹${purchaseAmount.toLocaleString('en-IN')}. Is my ending balance of ${formatINR(projections.simulatedEndingBalance)} safe?`;
                  document.getElementById('coachSendBtn')?.click();
                }
              }, 150);
            });

            document.getElementById('compareSimBtn')?.addEventListener('click', () => {
              currentSimAmount = purchaseAmount;
              window.showScreen('futures');
            });
          }
        }
      } catch (err) {
        runBtn.textContent = 'Run simulation →';
        runBtn.disabled = false;
        toast('Simulation error: ' + err.message);
      }
    }

    runBtn.onclick = (e) => {
      e.preventDefault();
      triggerSimulation();
    };

    // Auto-run once to sync real calculations
    triggerSimulation();
  }

  // --- Attach Parallel Futures Handlers ---
  function initFuturesScreen() {
    const cards = host.querySelectorAll('.future-cards article');
    if (!cards || cards.length < 3) return;

    async function loadParallelFutures() {
      try {
        const res = await window.FutureVerseAPI.compareParallelFutures({
          purchaseAmount: currentSimAmount || 50000,
          durationMonths: 6
        });

        if (res.data && res.data.scenarios) {
          const { scenarios, comparisonChart } = res.data;

          // Update Future A (Buy immediately)
          const cA = cards[0];
          cA.querySelector('b').textContent = formatINR(scenarios.futureA.projectedSavings);
          cA.querySelector('p').textContent = `Projected savings in 6 months (${scenarios.futureA.tag})`;
          cA.querySelector('span').textContent = `• ${scenarios.futureA.tradeoff}`;

          // Update Future B (Wait 3 months)
          const cB = cards[1];
          cB.querySelector('b').textContent = formatINR(scenarios.futureB.projectedSavings);
          cB.querySelector('p').textContent = `Projected savings in 6 months (${scenarios.futureB.tag})`;
          cB.querySelector('span').textContent = `• ${scenarios.futureB.tradeoff}`;

          // Update Future C (Save 6 months)
          const cC = cards[2];
          cC.querySelector('b').textContent = formatINR(scenarios.futureC.projectedSavings);
          cC.querySelector('p').textContent = `Projected savings in 6 months (${scenarios.futureC.tag})`;
          cC.querySelector('span').textContent = `• ${scenarios.futureC.tradeoff}`;

          // Update comparison chart lines
          const svg = host.querySelector('.graph-panel svg');
          if (svg && comparisonChart) {
            const paths = svg.querySelectorAll('path');
            if (paths[0] && comparisonChart.pathA) paths[0].setAttribute('d', comparisonChart.pathA);
            if (paths[1] && comparisonChart.pathB) paths[1].setAttribute('d', comparisonChart.pathB);
            if (paths[2] && comparisonChart.pathC) paths[2].setAttribute('d', comparisonChart.pathC);
          }

          // Wire card action buttons to AI Coach
          cA.querySelector('button').onclick = () => {
            window.showScreen('coach');
            setTimeout(() => {
              const inp = document.getElementById('coachInputField');
              if (inp) {
                inp.value = `Can you explain Future A (buying immediately for ₹${res.data.purchaseAmount.toLocaleString('en-IN')}) vs waiting?`;
                document.getElementById('coachSendBtn')?.click();
              }
            }, 150);
          };

          cB.querySelector('button').onclick = () => {
            window.showScreen('coach');
            setTimeout(() => {
              const inp = document.getElementById('coachInputField');
              if (inp) {
                inp.value = `Why is Future B (waiting 3 months) considered the balanced approach?`;
                document.getElementById('coachSendBtn')?.click();
              }
            }, 150);
          };

          cC.querySelector('button').onclick = () => {
            window.showScreen('coach');
            setTimeout(() => {
              const inp = document.getElementById('coachInputField');
              if (inp) {
                inp.value = `How much extra buffer does Future C (saving for 6 months) give me?`;
                document.getElementById('coachSendBtn')?.click();
              }
            }, 150);
          };
        }
      } catch (err) {
        console.warn('Parallel futures load error:', err.message);
      }
    }

    loadParallelFutures();
  }

  // --- Attach Overview Screen Live Data ---
  async function initOverviewScreen() {
    try {
      const summaryRes = await window.FutureVerseAPI.getSummary();
      if (summaryRes.data) {
        const { metrics, profile } = summaryRes.data;
        currentProfile = profile;

        // Update top hero metrics in dashboard
        const statBoxes = host.querySelectorAll('.stat-row > div b');
        if (statBoxes[0]) statBoxes[0].textContent = formatINR(metrics.startingSavings);
        if (statBoxes[1]) statBoxes[1].textContent = formatINR(metrics.monthlyIncome);
        if (statBoxes[2]) statBoxes[2].textContent = formatINR(metrics.monthlyExpenses);
        if (statBoxes[3]) statBoxes[3].textContent = formatINR(metrics.monthlySurplus);

        // Update landing preview values
        const dSav = document.getElementById('dashSavings');
        const dInc = document.getElementById('dashIncome');
        const dSur = document.getElementById('dashSurplus');
        const dRate = document.getElementById('dashSavingsRate');
        if (dSav) dSav.textContent = formatINR(metrics.startingSavings);
        if (dInc) dInc.textContent = formatINR(metrics.monthlyIncome);
        if (dSur) dSur.textContent = formatINR(metrics.monthlySurplus);
        if (dRate) dRate.textContent = `${metrics.savingsRate}% saving rate`;
      }
    } catch (err) {
      console.warn('Overview summary load failed:', err.message);
    }
  }

  // --- Attach Goals Screen Live Data ---
  async function initGoalsScreen() {
    try {
      const res = await window.FutureVerseAPI.getGoals();
      if (res.data && res.data.length > 0) {
        const container = host.querySelector('.goal-cards');
        if (container) {
          container.innerHTML = res.data.map(g => {
            const current = Number(g.current_amount || 0);
            const target = Number(g.target_amount || 1);
            const pct = Math.min(100, Math.round((current / target) * 100));
            return `
              <article>
                <span>${g.icon || '◎'}</span>
                <small>${(g.category || 'GOAL').toUpperCase()}</small>
                <h3>${formatINR(current)} <em>/ ${formatINR(target)}</em></h3>
                <i style="width:${pct}%"></i>
                <p>${pct}% complete · ${g.target_date || 'Target ongoing'}</p>
              </article>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.warn('Goals load failed:', err.message);
    }
  }

  // --- Attach Transactions Screen Live Data ---
  async function initTransactionsScreen() {
    try {
      const res = await window.FutureVerseAPI.getTransactions();
      if (res.data && res.data.length > 0) {
        const table = host.querySelector('.table');
        if (table) {
          table.innerHTML = res.data.map(tx => `
            <p>
              <span>${tx.type === 'income' ? '▣' : '⌂'} ${tx.title}</span>
              <small>${tx.category} · ${tx.date}</small>
              <b class="${tx.type === 'income' ? 'positive' : ''}">${tx.type === 'income' ? '+' : '−'}${formatINR(tx.amount)}</b>
            </p>
          `).join('');
        }
      }
    } catch (err) {
      console.warn('Transactions load failed:', err.message);
    }
  }

  // --- Attach Settings Screen Handlers ---
  async function initSettingsScreen() {
    const inputs = host.querySelectorAll('.settings input');
    const saveBtn = host.querySelector('.settings .primary');

    if (currentProfile && inputs.length >= 2) {
      inputs[0].value = currentProfile.name || 'Alex Morgan';
      inputs[1].value = currentProfile.email || 'alex@example.com';
    }

    if (saveBtn) {
      saveBtn.onclick = async () => {
        saveBtn.textContent = 'Saving…';
        try {
          await window.FutureVerseAPI.updateProfile({
            planning_style: host.querySelector('.settings select')?.value || 'Balanced & steady'
          });
          saveBtn.textContent = 'Save changes';
          toast('Settings saved successfully.');
        } catch (err) {
          saveBtn.textContent = 'Save changes';
          toast('Failed to save settings: ' + err.message);
        }
      };
    }
  }

  // --- Hook Screen Navigation & Data Fetching ---
  const originalShowScreen = window.showScreen;
  window.showScreen = function(name) {
    originalShowScreen(name);
    history.replaceState(null, '', `#app-${name}`);

    // Update screen-head button
    const action = host.querySelector('.screen-head > .primary');
    if (action) {
      if (name === 'simulator') {
        action.textContent = 'Run simulation →';
        action.onclick = () => host.querySelector('.sim-run')?.click();
      } else if (name === 'goals') {
        action.textContent = '+ New goal';
        action.onclick = () => document.getElementById('goalModal')?.classList.remove('hidden');
      } else if (name === 'transactions') {
        action.textContent = '+ Add transaction';
        action.onclick = () => document.getElementById('txModal')?.classList.remove('hidden');
      } else if (name === 'coach') {
        action.textContent = '+ New question';
        action.onclick = () => document.getElementById('coachInputField')?.focus();
      } else if (name === 'settings') {
        action.textContent = 'Save preferences';
        action.onclick = () => host.querySelector('.settings .primary')?.click();
      } else {
        action.textContent = 'Explore insights →';
        action.onclick = () => window.showScreen('coach');
      }
    }

    // Initialize screen-specific dynamic data
    if (name === 'coach') initAiCoachScreen();
    else if (name === 'simulator') initSimulatorScreen();
    else if (name === 'futures') initFuturesScreen();
    else if (name === 'overview') initOverviewScreen();
    else if (name === 'goals') initGoalsScreen();
    else if (name === 'transactions') initTransactionsScreen();
    else if (name === 'settings') initSettingsScreen();
  };

  // --- Modal Forms Integration ---
  // 1. Transaction Modal
  const txModal = document.getElementById('txModal');
  const txForm = document.getElementById('txForm');
  const closeTx = document.getElementById('closeTxModal');
  if (closeTx) closeTx.onclick = () => txModal.classList.add('hidden');

  document.querySelectorAll('.dash-add-tx').forEach(b => {
    b.onclick = () => txModal.classList.remove('hidden');
  });

  if (txForm) {
    txForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('txTitle').value;
      const amount = Number(document.getElementById('txAmount').value);
      const type = document.getElementById('txType').value;
      const category = document.getElementById('txCategory').value || 'General';

      try {
        await window.FutureVerseAPI.addTransaction({ title, amount, type, category });
        txModal.classList.add('hidden');
        txForm.reset();
        toast(`Recorded ${type}: ${title} (${formatINR(amount)})`);
        window.showScreen('transactions');
      } catch (err) {
        toast('Error recording transaction: ' + err.message);
      }
    };
  }

  // 2. Goal Modal
  const goalModal = document.getElementById('goalModal');
  const goalForm = document.getElementById('goalForm');
  const closeGoal = document.getElementById('closeGoalModal');
  if (closeGoal) closeGoal.onclick = () => goalModal.classList.add('hidden');

  if (goalForm) {
    goalForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('goalTitle').value;
      const target_amount = Number(document.getElementById('goalTarget').value);
      const current_amount = Number(document.getElementById('goalCurrent').value) || 0;
      const target_date = document.getElementById('goalDate').value || 'Dec 2027';

      try {
        await window.FutureVerseAPI.addGoal({ title, target_amount, current_amount, target_date });
        goalModal.classList.add('hidden');
        goalForm.reset();
        toast(`Savings goal "${title}" created!`);
        window.showScreen('goals');
      } catch (err) {
        toast('Error creating goal: ' + err.message);
      }
    };
  }

  // 3. Onboarding Form
  const continueBtn = document.getElementById('continue');
  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      const name = document.getElementById('onboardName')?.value || 'Alex';
      const inc = Number(document.getElementById('onboardIncome')?.value) || 72000;
      try {
        await window.FutureVerseAPI.updateProfile({ monthly_income: inc });
      } catch (e) {}
    });
  }

  // --- Authentication System Integration ---
  function updateUserUI(user) {
    const navContainer = document.getElementById('navAuthContainer');
    const sideName = document.getElementById('sidebarUserName');
    const sideEmail = document.getElementById('sidebarUserEmail');
    const sideAvatar = document.getElementById('sidebarUserAvatar');
    const topAvatar = document.getElementById('appHeaderAvatar');
    const greetingNames = document.querySelectorAll('.user-greeting-name');

    if (user && user.name) {
      const initial = (user.name || 'A').charAt(0).toUpperCase();
      if (sideName) sideName.textContent = user.name;
      if (sideEmail) sideEmail.textContent = user.email || 'alex@example.com';
      if (sideAvatar) sideAvatar.textContent = initial;
      if (topAvatar) topAvatar.textContent = initial;
      greetingNames.forEach(el => el.textContent = user.name.split(' ')[0]);

      if (navContainer) {
        navContainer.innerHTML = `
          <div class="nav-user-badge">
            <span class="avatar-sm">${initial}</span>
            <b>${user.name}</b>
            <button class="sign-out-btn" id="navSignOutBtn">Sign out</button>
          </div>
        `;
        document.getElementById('navSignOutBtn')?.addEventListener('click', handleLogout);
      }
    } else {
      if (sideName) sideName.textContent = 'Alex Morgan';
      if (sideEmail) sideEmail.textContent = 'demo workspace';
      if (sideAvatar) sideAvatar.textContent = 'A';
      if (topAvatar) topAvatar.textContent = 'A';
      greetingNames.forEach(el => el.textContent = 'Alex');

      if (navContainer) {
        navContainer.innerHTML = `
          <button class="text-btn" id="signIn">Sign in</button>
          <button class="primary small" id="signUpBtn">Create account <span>↗</span></button>
        `;
        bindAuthModalTriggers();
      }
    }
  }

  async function handleLogout() {
    try {
      await window.FutureVerseAPI.logout();
      updateUserUI(null);
      toast('Signed out successfully.');
      window.showScreen('overview');
    } catch (err) {
      toast('Logout error: ' + err.message);
    }
  }

  function bindAuthModalTriggers() {
    const authModal = document.getElementById('authModal');
    const btnSignIn = document.getElementById('signIn');
    const btnSignUp = document.getElementById('signUpBtn');
    const tabSignIn = document.getElementById('authTabSignIn');
    const tabSignUp = document.getElementById('authTabSignUp');
    const formSignIn = document.getElementById('signInForm');
    const formSignUp = document.getElementById('signUpForm');
    const errLogin = document.getElementById('loginErrorMsg');
    const errSignup = document.getElementById('signupErrorMsg');
    const closeBtn = document.getElementById('closeAuthModal');

    function openAuth(mode = 'signin') {
      authModal?.classList.remove('hidden');
      if (mode === 'signup') {
        tabSignUp?.classList.add('active');
        tabSignIn?.classList.remove('active');
        formSignUp?.classList.remove('hidden');
        formSignIn?.classList.add('hidden');
        const title = document.getElementById('authModalTitle');
        if (title) title.textContent = 'Create your account';
      } else {
        tabSignIn?.classList.add('active');
        tabSignUp?.classList.remove('active');
        formSignIn?.classList.remove('hidden');
        formSignUp?.classList.add('hidden');
        const title = document.getElementById('authModalTitle');
        if (title) title.textContent = 'Welcome to FutureVerse';
      }
      if (errLogin) errLogin.style.display = 'none';
      if (errSignup) errSignup.style.display = 'none';
    }

    if (btnSignIn) btnSignIn.onclick = (e) => { e.preventDefault(); openAuth('signin'); };
    if (btnSignUp) btnSignUp.onclick = (e) => { e.preventDefault(); openAuth('signup'); };
    if (closeBtn) closeBtn.onclick = () => authModal?.classList.add('hidden');

    if (tabSignIn) tabSignIn.onclick = () => openAuth('signin');
    if (tabSignUp) tabSignUp.onclick = () => openAuth('signup');
  }

  function initAuthUI() {
    const authModal = document.getElementById('authModal');
    const formSignIn = document.getElementById('signInForm');
    const formSignUp = document.getElementById('signUpForm');
    const errLogin = document.getElementById('loginErrorMsg');
    const errSignup = document.getElementById('signupErrorMsg');
    const demoFill = document.getElementById('fillDemoBtn');
    const sidebarLogout = document.getElementById('sidebarLogoutBtn');

    bindAuthModalTriggers();

    if (demoFill) {
      demoFill.onclick = () => {
        const emailInp = document.getElementById('loginEmail');
        const passInp = document.getElementById('loginPassword');
        if (emailInp) emailInp.value = 'alex@example.com';
        if (passInp) passInp.value = 'password123';
        toast('Demo credentials populated.');
      };
    }

    if (sidebarLogout) {
      sidebarLogout.onclick = handleLogout;
    }

    if (formSignIn) {
      formSignIn.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';
        if (errLogin) errLogin.style.display = 'none';

        try {
          const res = await window.FutureVerseAPI.login(email, password);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In →';
          authModal?.classList.add('hidden');
          updateUserUI(res.user);
          toast(`Welcome back, ${res.user.name || 'Alex'}!`);
          window.showScreen('overview');
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In →';
          if (errLogin) {
            errLogin.textContent = err.message || 'Login failed.';
            errLogin.style.display = 'block';
          }
        }
      };
    }

    if (formSignUp) {
      formSignUp.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const income = Number(document.getElementById('signupIncome').value) || 72000;
        const submitBtn = document.getElementById('signupSubmitBtn');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account…';
        if (errSignup) errSignup.style.display = 'none';

        try {
          const res = await window.FutureVerseAPI.signup(email, password, name, income);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account & Twin →';
          authModal?.classList.add('hidden');
          updateUserUI(res.user);
          toast(`Account created! Welcome, ${res.user.name}!`);
          window.showScreen('overview');
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account & Twin →';
          if (errSignup) {
            errSignup.textContent = err.message || 'Signup failed.';
            errSignup.style.display = 'block';
          }
        }
      };
    }

    // Check existing session
    const existingUser = window.FutureVerseAPI.getUser();
    if (existingUser) {
      updateUserUI(existingUser);
    } else {
      window.FutureVerseAPI.getMe().then(res => {
        if (res.user) updateUserUI(res.user);
      }).catch(() => {});
    }
  }

  // Initialize Authentication UI
  initAuthUI();

  console.log('✓ FutureVerse AI Frontend connected to backend REST APIs & Gemini Coach.');
})();
