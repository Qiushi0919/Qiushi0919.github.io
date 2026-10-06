(() => {
  const collection = document.querySelector('.work-collection');
  if (!collection) return;
  const root = document.documentElement;
  const toolbar = collection.querySelector('.work-readingbar');
  const nav = document.querySelector('.site-toolbar');
  const radios = [...collection.querySelectorAll('input[name="work-view"]')];
  const hint = collection.querySelector('.work-view-hint');
  const cards = [...collection.querySelectorAll('article[data-work-category]')];
  const key = 'portfolio.work-view.v1';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(key) || '{}'); } catch { return {}; } };
  const write = state => { try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {} };
  const saved = read();
  let view = saved.view === 'large' ? 'large' : 'overview';
  let used = saved.used === true;
  let generation = 0;
  const phone = () => root.classList.contains('portrait-phone') ||
    window.innerWidth <= 700 ||
    (Math.min(screen.width, screen.height) <= 600 &&
     (matchMedia('(pointer:coarse)').matches || matchMedia('(hover:none)').matches));
  const geometry = () => {
    root.classList.toggle('work-mobile', phone());
    // This baseline is set once by the existing phone-canvas bootstrap. Pinching
    // changes visualViewport.scale, which is deliberately not used here.
    const initial = Number(getComputedStyle(root).getPropertyValue('--portrait-ui-scale'));
    collection.style.setProperty('--work-ui-scale', root.classList.contains('portrait-phone') && initial > 0 ? initial : 1);
    const safeTop = nav && getComputedStyle(nav).position === 'sticky' ? nav.getBoundingClientRect().height : 0;
    collection.style.setProperty('--work-nav-offset', `${safeTop}px`);
    collection.style.setProperty('--work-bar-height', `${toolbar.getBoundingClientRect().height}px`);
  };
  const apply = () => {
    collection.dataset.workView = view;
    radios.forEach(radio => { radio.checked = radio.value === view; });
    hint.hidden = used;
    geometry();
  };
  const currentCard = () => {
    const line = Math.max(0, toolbar.getBoundingClientRect().bottom) + 1;
    const index = cards.findIndex(card => card.getBoundingClientRect().bottom > line);
    if (index < 0) return cards.at(-1);
    const candidate = cards[index];
    const rect = candidate.getBoundingClientRect();
    const scale = Number(collection.style.getPropertyValue('--work-ui-scale')) || 1;
    // A trailing strip of the previous card is not the project being read.
    if (rect.top < line && rect.bottom - line < 44 / scale && cards[index+1]) return cards[index+1];
    return candidate;
  };
  radios.forEach(radio => radio.addEventListener('change', () => {
    if (!radio.checked || radio.value === view) return;
    const anchor = currentCard();
    const token = ++generation;
    view = radio.value;
    used = true;
    write({view, used});
    apply();
    requestAnimationFrame(() => {
      if (token !== generation || !anchor?.isConnected) return;
      geometry();
      // Stable card IDs and reserved media dimensions keep both directions on
      // the same project. Native radio focus remains on the chosen control.
      const top = parseFloat(getComputedStyle(collection).getPropertyValue('--work-nav-offset')) + toolbar.getBoundingClientRect().height + 8;
      window.scrollBy({top:anchor.getBoundingClientRect().top - top, behavior:'instant'});
    });
  }));
  let resizeFrame;
  const resized = () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(geometry); };
  window.addEventListener('resize', resized, {passive:true});
  window.addEventListener('orientationchange', resized, {passive:true});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resized);
    if (nav) observer.observe(nav);
    observer.observe(toolbar);
  }
  apply();
})();
