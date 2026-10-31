(() => {
  const landingEntry = document.querySelector('.section-copy a[href="#futures"]');
  if (landingEntry) { landingEntry.href = '#app'; landingEntry.addEventListener('click', () => showScreen('overview')); }

  const toast = (message) => {
    let t = document.querySelector('.app-toast');
    if (!t) { t = document.createElement('div'); t.className = 'app-toast'; document.body.append(t); }
    t.textContent = message; t.classList.add('show'); clearTimeout(window.__moneyverseToast); window.__moneyverseToast = setTimeout(() => t.classList.remove('show'), 2600);
  };

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
  }));
  document.querySelector('.mobile-menu')?.addEventListener('click', () => document.body.classList.toggle('nav-open'));

  document.querySelectorAll('.app-nav').forEach(button => button.onclick = () => {
    window.showScreen(button.dataset.screen);
    document.querySelector('#app').scrollIntoView({behavior:'smooth'});
  });
  const fromHash = location.hash.match(/^#app-([a-z]+)/)?.[1];
  if (fromHash && screenData[fromHash]) showScreen(fromHash); else showScreen('overview');
})();
