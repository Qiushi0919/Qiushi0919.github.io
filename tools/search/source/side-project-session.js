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
  try { window.portfolioAccessHadRecord = Boolean(localStorage.getItem(name) || sessionStorage.getItem(name)); } catch (_) {}
  window.addEventListener('pageshow', check);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(check, 60_000);
})();
