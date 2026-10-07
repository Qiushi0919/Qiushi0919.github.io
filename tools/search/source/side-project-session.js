/* Expire an open unlocked page too; cached access never extends its own term. */
(() => {
  const name = 'portfolio.side-project-access.v1';
  const check = () => {
    for (const kind of ['localStorage', 'sessionStorage']) {
      try {
        const record = JSON.parse(window[kind].getItem(name));
        if (record && Number.isFinite(record.expires) && record.expires > Date.now()) return;
      } catch (_) {}
    }
    // Storage-disabled browsers may view this document, but cannot remember it.
    if (window.portfolioAccessHadRecord) location.reload();
  };
  window.portfolioAccessHadRecord = ['localStorage', 'sessionStorage'].some(kind => {
    try { return Boolean(window[kind].getItem(name)); } catch (_) { return false; }
  });
  window.addEventListener('pageshow', check);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(check, 60_000);
})();
