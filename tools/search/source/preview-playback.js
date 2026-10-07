/* Competition previews require Play and finish at their cover. The battery
   method starts when fully visible and loops until offscreen or behind a gallery. */
(() => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const english = root.dataset.language === 'en';
  const entries = [...document.querySelectorAll('.preview-media canvas[data-preview-auto]')].map(canvas => {
    const media = canvas.closest('.preview-media');
    return {canvas, media, control:media.querySelector('[data-preview-play]'),
      toggle:media.querySelector('[data-preview-toggle]'), seek:media.querySelector('[data-preview-seek]'),
      time:media.querySelector('[data-preview-time]'), userPaused:false,
      manualOnly:canvas.dataset.previewManual === 'true',
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
  const blocked = entry => document.hidden || root.classList.contains('portfolio-loading') || (entry.popup
    ? entry.popup.getAttribute('aria-hidden') !== 'false'
    : document.body.classList.contains('overlay-active') || root.classList.contains('contact-modal-open'));
  const label = entry => {
    const loading = entry.media.dataset.previewState === 'loading';
    const value = english?'Play':'播放';
    if (entry.control) {
      entry.control.setAttribute('aria-disabled', String(loading));
      entry.control.setAttribute('aria-busy', String(loading));
      entry.control.setAttribute('aria-label', value + (english?' animation':'动画'));
      entry.control.title = value;
      entry.control.querySelector('.preview-play-label').textContent = value;
      entry.control.querySelector('.preview-play-icon').textContent = '▶';
      entry.control.dataset.previewAction = loading ? 'loading' : 'play';
    }
    if (entry.toggle) {
      const playing=entry.player.running && entry.media.dataset.previewState === 'playing';
      entry.toggle.textContent=playing?'❚❚':'▶';
      entry.toggle.setAttribute('aria-label',playing?(english?'Pause animation':'暂停动画'):(english?'Play animation':'播放动画'));
    }
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
      entry.userPaused = false;
      delete entry.canvas.dataset.previewFinished;
      still(entry);
    }
    entry.started = true;
    if (!entry.player.drawn) {
      entry.media.dataset.previewState = 'loading';
      label(entry);
    }
    entry.player.play({skipCover:manual});
    label(entry);
  };
  const pause = entry => {
    entry.player.pause();
    if (!entry.player.drawn && entry.canvas.dataset.previewBuffer === 'ready') {
      entry.media.dataset.previewState='poster';label(entry);
    }
  };
  const sync = () => {
    frame = 0;
    for (const entry of entries) {
      const player = entry.player;
      if (blocked(entry) || (motion.matches && !entry.manual)) { pause(entry); continue; }
      if (entry.manualOnly && !entry.manual) { pause(entry); continue; }
      if (entry.userPaused) continue;
      if (entry.finished || entry.needsManual) continue;
      const box = viewport(entry.popup);
      const rect = entry.canvas.getBoundingClientRect();
      const visible = fraction(rect,box);
      if (!entry.started) {
        const complete = rect.width>0 && rect.height>0 && rect.top>=box.top-.5 && rect.left>=box.left-.5 && rect.bottom<=box.bottom+.5 && rect.right<=box.right+.5;
        if (complete) play(entry);
        else pause(entry);
      } else if (visible < .15) pause(entry);
      else if (!player.running) play(entry);
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
  for (const entry of entries) {
    const canvas = entry.canvas;
    const Player=canvas.dataset.previewVideo?window.PortfolioVideoPlayer:window.PortfolioFramePlayer;
    entry.player = new Player(canvas, canvas.dataset.previewVideo || canvas.dataset.previewSequence, {
      buffering(state,data,canPlay,resource) {
        entry.media.dataset.previewBuffer = state;
        const indicator = entry.media.querySelector('.preview-load-progress');
        indicator?.setAttribute('aria-hidden', String(state === 'ready' || state === 'error'));
        if (indicator) {
          const total=resource?.totalBytes || data?.sheetBytes?.reduce((sum,size)=>sum+size,0) || 0;
          const loaded=resource?.kind === 'video'?resource.loadedBytes:
            [...(resource?.blobs?.values() || [])].reduce((sum,blob)=>sum+blob.size,0);
          const percent=state === 'ready'?100:total?Math.min(99,Math.floor(loaded/total*100)):0;
          indicator.dataset.indeterminate=String(state === 'loading' && !total);
          if (total || state === 'ready') indicator.setAttribute('aria-valuenow',String(percent));
          else indicator.removeAttribute('aria-valuenow');
          indicator.style.setProperty('--load-progress',`${percent}%`);
        }
        if (entry.seek) entry.seek.disabled = state !== 'ready';
        if (entry.toggle) entry.toggle.disabled = !canPlay && (state === 'waiting' || state === 'loading');
        if (data && entry.seek) entry.seek.max=String(data.duration);
        if (state === 'ready' && entry.player && !entry.player.running && !entry.player.drawn) entry.media.dataset.previewState='poster';
        if (entry.player) label(entry);
      },
      time(seconds,duration) {
        if (!entry.seek) return;
        entry.seek.max=String(duration);
        if (!entry.seeking) entry.seek.value=String(seconds);
        const format=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
        entry.time.textContent=`${format(seconds)} / ${format(duration)}`;
        entry.seek.setAttribute('aria-valuetext',entry.time.textContent);
      },
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
    window.PortfolioPreviewDownloads?.attach(entry.media, entry.player.resource);
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
    entry.toggle?.addEventListener('click',event=>{
      event.stopPropagation();
      if (blocked(entry)) return;
      if (entry.player.running && entry.media.dataset.previewState === 'playing') {
        entry.userPaused=true;entry.player.pause({release:false});
      } else {
        entry.userPaused=false;entry.manual=true;
        play(entry,entry.finished || !entry.player.drawn || entry.needsManual);
      }
      label(entry);
    });
    const beginSeek=()=>{
      if (!entry.seeking) entry.resumeAfterSeek=entry.player.running;
      entry.seeking=true;entry.userPaused=true;entry.manual=true;entry.started=true;entry.finished=false;entry.needsManual=false;
      delete canvas.dataset.previewFinished;
      entry.player.pause({release:false});label(entry);
    };
    entry.seek?.addEventListener('pointerdown',beginSeek);
    entry.seek?.addEventListener('input',()=>{
      beginSeek();
      entry.player.seek(entry.seek.value).catch(error=>entry.player.fail(error));
    });
    const finishSeek=()=>{
      entry.seeking=false;
      if (entry.resumeAfterSeek) { entry.userPaused=false;play(entry); }
      label(entry);
    };
    entry.seek?.addEventListener('change',finishSeek);
    entry.seek?.addEventListener('pointercancel',finishSeek);
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
  window.addEventListener('portfolio:ready',schedule);
  motion.addEventListener('change',schedule);
  const mutation = new MutationObserver(schedule);
  mutation.observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  mutation.observe(root,{attributes:true,attributeFilter:['class']});
  schedule();
})();
