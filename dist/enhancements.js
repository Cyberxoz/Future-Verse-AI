(() => {
  const landingEntry = document.querySelector('.section-copy a[href="#futures"]');
  if (landingEntry) { landingEntry.href = '#app'; landingEntry.addEventListener('click', () => showScreen('overview')); }

  const toast = (message) => {
    let t = document.querySelector('.app-toast');
    if (!t) { t = document.createElement('div'); t.className = 'app-toast'; document.body.append(t); }
    t.textContent = message; t.classList.add('show'); clearTimeout(window.__moneyverseToast); window.__moneyverseToast = setTimeout(() => t.classList.remove('show'), 2600);
  };

  screenData.reports.body = `<div class="app-grid two report-layout"><section class="panel report-chart"><div class="report-chart-head"><div><b>Income vs. expenses</b><small>Monthly comparison · Last 6 months</small></div><div class="report-legend"><span><i></i> Income</span><span><i></i> Expenses</span></div></div><div class="report-chart-body"><div class="y-axis"><span>₹80k</span><span>₹60k</span><span>₹40k</span><span>₹20k</span><span>₹0</span></div><div class="report-plot"><i></i><i></i><i></i><i></i><i></i><div class="bar-pair"><b style="height:72%"></b><em style="height:51%"></em><small>May</small></div><div class="bar-pair"><b style="height:80%"></b><em style="height:58%"></em><small>Jun</small></div><div class="bar-pair"><b style="height:76%"></b><em style="height:55%"></em><small>Jul</small></div><div class="bar-pair"><b style="height:92%"></b><em style="height:61%"></em><small>Aug</small></div><div class="bar-pair"><b style="height:83%"></b><em style="height:57%"></em><small>Sep</small></div><div class="bar-pair current"><b style="height:100%"></b><em style="height:64%"></em><small>Oct</small></div></div></div><div class="report-insight">↗ Income has grown <b>11%</b> while spending remains steady.</div></section><section class="panel savings-card"><div><b>Savings trend</b><small>Current monthly rate</small></div><div class="ring"><span>26%<small>rate</small></span></div><p>Your savings rate is <b>4% above</b> the target you set.</p><button data-screen="goals">View goal runway →</button></section></div><div class="app-grid three"><section class="panel metric"><small>AVERAGE MONTHLY INCOME</small><b>₹69,200</b><em>↗ 5.2% this period</em></section><section class="panel metric"><small>AVERAGE MONTHLY SPEND</small><b>₹51,860</b><em>Within plan</em></section><section class="panel metric"><small>NET SAVINGS ADDED</small><b>₹1,04,040</b><em>Last 6 months</em></section></div>`;
  const originalShowScreen = showScreen;
  window.showScreen = function(name) {
    originalShowScreen(name);
    history.replaceState(null, '', `#app-${name}`);
    const action = host.querySelector('.screen-head > .primary');
    if (action) {
      action.textContent = name === 'simulator' ? 'Run simulation →' : name === 'goals' ? '+ New goal' : name === 'transactions' ? '+ Add transaction' : name === 'settings' ? 'Save preferences' : 'Explore insights →';
      action.onclick = () => {
        if (name === 'simulator') { host.querySelector('.sim-run')?.click(); toast('Your projection has been refreshed.'); }
        else if (name === 'settings') toast('Preferences saved for this demo.');
        else if (name === 'transactions') toast('Transaction form is ready for the next connected data source.');
        else toast('This prototype uses illustrative demo data.');
      };
    }
    host.querySelector('.settings .primary')?.addEventListener('click', () => toast('Profile preferences saved.'));
    host.querySelector('.chat-input')?.addEventListener('click', () => toast('AI chat will connect when the backend is added.'));
  };

  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    form.classList.remove('hidden'); success.classList.add('hidden');
  }));
  document.querySelectorAll('.close').forEach(button => button.addEventListener('click', () => {
    form.classList.remove('hidden'); success.classList.add('hidden');
    document.querySelector('.modal-card').classList.remove('twin-ready');
  }));
  document.querySelector('#continue').addEventListener('click', () => document.querySelector('.modal-card').classList.add('twin-ready'));
  document.querySelector('.open-dashboard').addEventListener('click', () => {
    modal.classList.add('hidden');
    document.querySelector('.modal-card').classList.remove('twin-ready');
    form.classList.remove('hidden'); success.classList.add('hidden');
    showScreen('overview');
    document.querySelector('#app').scrollIntoView({behavior:'smooth', block:'start'});
  });
  document.querySelector('.mobile-menu')?.addEventListener('click', () => document.body.classList.toggle('nav-open'));

  document.querySelectorAll('.app-nav').forEach(button => button.onclick = () => {
    window.showScreen(button.dataset.screen);
    document.querySelector('#app').scrollIntoView({behavior:'smooth'});
  });
  const fromHash = location.hash.match(/^#app-([a-z]+)/)?.[1];
  if (fromHash && screenData[fromHash]) showScreen(fromHash); else showScreen('overview');
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-view]');
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showScreen('overview');
    document.querySelector('#app').scrollIntoView({behavior:'smooth', block:'start'});
  }, true);
})();
