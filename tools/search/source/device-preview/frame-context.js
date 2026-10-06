(() => {
  if (window.parent === window) return;
  const query = new URLSearchParams(location.search);
  if (query.get('preview-device') !== 'phone') return;
  document.addEventListener('click',event => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href,location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/assets/')) return;
    url.searchParams.set('preview-device','phone');
    url.searchParams.set('preview-width',query.get('preview-width') || '390');
    link.href = url.href;
  },{capture:true});
})();
