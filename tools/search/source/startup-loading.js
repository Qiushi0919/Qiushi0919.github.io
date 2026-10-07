/* Reveal content immediately; each thumbnail owns its download progress. */
(() => {
  const root=document.documentElement;
  window.PortfolioPreviewLoads.start().catch(()=>{});
  root.classList.remove('portfolio-loading');root.classList.add('portfolio-ready');
  window.dispatchEvent(new Event('portfolio:ready'));
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) root.classList.add('carousels-running');
})();
