/* First full appearance starts playback. Competition previews finish at their
   cover; the battery method loops until paused offscreen or behind a gallery. */
(() => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const english = root.dataset.language === 'en';
  const entries = [...document.querySelectorAll('.preview-media canvas[data-preview-auto]')].map(canvas => {
    const media = canvas.closest('.preview-media');
    return {canvas, media, control:media.querySelector('[data-preview-play]'),
      popup:canvas.closest('.feature-overlay'), started:false, hasPlayed:false,
      finished:false, needsManual:false, manual:false};
  });
  if (!entries.length) return;
  let frame = 0;
  const viewport = (popup=false) => {
    const visual = window.visualViewport;
    const box = {left:visual?.offsetLeft || 0, top:visual?.offsetTop || 0,
      right:(visual?.offsetLeft || 0)+(visual?.width || innerWidth),
      bottom:(visual?.offsetTop || 0)+(visual?.height || innerHeight)};
    if (popup) {
      const panel = popup.getBoundingClientRect();
      const header = popup.querySelector('.overlay-head')?.getBoundingClientRect();
      box.left=Math.max(box.left,panel.left);box.right=Math.min(box.right,panel.right);
      box.top=Math.max(box.top,panel.top,header?.bottom || panel.top);
      box.bottom=Math.min(box.bottom,panel.bottom);
      return box;
    }
    const top = box.top;
    for (const bar of document.querySelectorAll('.site-toolbar, .work-readingbar')) {
      const rect = bar.getBoundingClientRect();
      const style = getComputedStyle(bar);
      if ((style.position === 'sticky' || style.position === 'fixed') && rect.top <= top+Number.parseFloat(style.top || 0)+1 && rect.bottom > box.top) {
        box.top = Math.max(box.top, rect.bottom);
      }
    }
    return box;
  };
  const fraction = (rect, box) => {
    const width = Math.max(0,Math.min(rect.right,box.right)-Math.max(rect.left,box.left));
    const height = Math.max(0,Math.min(rect.bottom,box.bottom)-Math.max(rect.top,box.top));
    return rect.width && rect.height ? width*height/(rect.width*rect.height) : 0;
  };
  const blocked = entry => document.hidden || (entry.popup
    ? entry.popup.getAttribute('aria-hidden') !== 'false'
    : document.body.classList.contains('overlay-active') || root.classList.contains('contact-modal-open'));
  const label = entry => {
    if (!entry.control) return;
    const loading = entry.media.dataset.previewState === 'loading';
    const replay = entry.hasPlayed;
    const value = loading ? (english?'Loading':'加载中') : replay ? (english?'Replay':'重播') : (english?'Play':'播放');
    entry.control.setAttribute('aria-disabled', String(loading));
    entry.control.setAttribute('aria-busy', String(loading));
    entry.control.setAttribute('aria-label', loading ? (english?'Loading animation':'正在加载动画') : value + (english?' animation':'动画'));
    entry.control.title = value;
    entry.control.querySelector('.preview-play-label').textContent = value;
    entry.control.querySelector('.preview-play-icon').textContent = loading ? '…' : replay ? '↻' : '▶';
    entry.control.dataset.previewAction = loading ? 'loading' : replay ? 'replay' : 'play';
  };
  const still = entry => {
    entry.player.reset();
    entry.media.dataset.previewState = 'poster';
    label(entry);
  };
  const play = (entry, manual=false) => {
    if (blocked(entry) || entry.player.running) return;
    if (manual) {
      entry.manual = true;
      entry.finished = false;
      entry.needsManual = false;
      delete entry.canvas.dataset.previewFinished;
      still(entry);
    }
    entry.started = true;
    if (!entry.player.drawn) {
      entry.media.dataset.previewState = 'loading';
      label(entry);
    }
    entry.player.play({skipCover:manual});
  };
  const sync = () => {
    frame = 0;
    for (const entry of entries) {
      const player = entry.player;
      if (blocked(entry) || (motion.matches && !entry.manual)) { player.pause(); continue; }
      if (entry.finished || entry.needsManual) continue;
      const box = viewport(entry.popup);
      const rect = entry.canvas.getBoundingClientRect();
      const visible = fraction(rect,box);
      if (!entry.started) {
        const complete = rect.width>0 && rect.height>0 && rect.top>=box.top-.5 && rect.left>=box.left-.5 && rect.bottom<=box.bottom+.5 && rect.right<=box.right+.5;
        if (complete) play(entry);
        else player.pause();
      } else if (visible < .15) player.pause();
      else if (!player.running) play(entry);
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
  for (const entry of entries) {
    const canvas = entry.canvas;
    entry.player = new window.PortfolioFramePlayer(canvas, canvas.dataset.previewSequence, {
      playing() {
        if (blocked(entry) || entry.finished) { entry.player.pause(); return; }
        entry.hasPlayed = true;
        canvas.dataset.previewStarted = 'true';
        entry.media.dataset.previewState = 'playing';
        label(entry);
      },
      ended() {
        entry.finished = true;
        canvas.dataset.previewFinished = 'true';
        still(entry);
      },
      error() {
        entry.needsManual = true;
        entry.media.dataset.previewState = 'poster';
        label(entry);
      }
    });
    label(entry);
    entry.control?.addEventListener('click', event => {
      event.stopPropagation();
      play(entry,true);
    });
    // The original gallery treats Space as a close shortcut. Preserve native
    // button activation here, while allowing Escape to keep closing the gallery.
    entry.control?.addEventListener('keydown', event => {
      if (event.key === ' ') event.stopPropagation();
    });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(schedule,{threshold:[0,.15,1]});
    entries.forEach(entry=>observer.observe(entry.canvas));
  }
  document.addEventListener('scroll',schedule,{passive:true,capture:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('portfolio:workviewchange', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(()=>{frame=requestAnimationFrame(sync);});
  });
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',schedule);
  const mutation = new MutationObserver(schedule);
  mutation.observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  mutation.observe(root,{attributes:true,attributeFilter:['class']});
  schedule();
})();
