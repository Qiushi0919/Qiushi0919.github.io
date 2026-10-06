/* Preview-only playback. Large view earns playback once the complete thumbnail
   clears the sticky navigation/reading bar. Overview never opens that gate. */
(() => {
  const videos = [...document.querySelectorAll('article > button video[data-preview-auto]')];
  if (!videos.length) return;
  const collection = document.querySelector('.work-collection');
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const qualified = new WeakSet();
  const root = document.documentElement;
  let frame = 0;
  const large = () => root.classList.contains('work-mobile') && collection?.dataset.workView === 'large';
  const clip = () => {
    const viewport = window.visualViewport;
    const box = {left:viewport?.offsetLeft || 0, top:viewport?.offsetTop || 0,
      right:(viewport?.offsetLeft || 0)+(viewport?.width || innerWidth),
      bottom:(viewport?.offsetTop || 0)+(viewport?.height || innerHeight)};
    const viewportTop = box.top;
    for (const bar of document.querySelectorAll('.site-toolbar, .work-readingbar')) {
      const rect = bar.getBoundingClientRect();
      const style = getComputedStyle(bar);
      if ((style.position === 'sticky' || style.position === 'fixed') && rect.top <= viewportTop+Number.parseFloat(style.top || 0)+1 && rect.bottom > box.top) {
        box.top = Math.max(box.top, rect.bottom);
      }
    }
    return box;
  };
  const visibleFraction = (rect, box) => {
    const width = Math.max(0, Math.min(rect.right,box.right)-Math.max(rect.left,box.left));
    const height = Math.max(0, Math.min(rect.bottom,box.bottom)-Math.max(rect.top,box.top));
    return rect.width && rect.height ? width*height/(rect.width*rect.height) : 0;
  };
  const poster = video => { video.parentElement.dataset.previewState = 'poster'; };
  const sync = () => {
    frame = 0;
    const gated = large();
    const box = clip();
    const blocked = document.hidden || root.classList.contains('overlay-active') || document.body.classList.contains('overlay-active');
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      const fraction = visibleFraction(rect,box);
      if (gated && !qualified.has(video)) {
        poster(video);
        const complete = rect.width > 0 && rect.height > 0 && rect.top >= box.top-.5 && rect.left >= box.left-.5 && rect.bottom <= box.bottom+.5 && rect.right <= box.right+.5;
        if (complete && !blocked && !motion.matches) {
          video.pause();
          if (video.currentTime > 0) { try { video.currentTime = 0; } catch {} }
          qualified.add(video);
          video.dataset.largeStarted = 'true';
        } else {
          video.pause();
          if (video.currentTime > 0) { try { video.currentTime = 0; } catch {} }
          continue;
        }
      }
      if (blocked || motion.matches || fraction < .15) {
        video.pause();
        if (motion.matches) poster(video);
        continue;
      }
      if (!video.getAttribute('src')) { video.src = video.dataset.src; video.preload = 'metadata'; }
      video.muted = true;
      if (video.paused) video.play().catch(() => { poster(video); });
      else video.parentElement.dataset.previewState = 'playing';
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
  videos.forEach(video => {
    video.addEventListener('playing', () => {
      if ((!large() || qualified.has(video)) && !motion.matches) video.parentElement.dataset.previewState = 'playing';
    });
    video.addEventListener('loadedmetadata', schedule);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(schedule, {threshold:[0,.15,1]});
    videos.forEach(video => observer.observe(video));
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('portfolio:workviewchange', () => {
    // Wait for the reading view's same-project scroll restoration to finish.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(sync); });
  });
  window.visualViewport?.addEventListener('resize', schedule, {passive:true});
  window.visualViewport?.addEventListener('scroll', schedule, {passive:true});
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(document.body, {attributes:true,attributeFilter:['class']});
  schedule();
})();
