/* Fix the background at its existing position while the gallery scrolls.
   Restore only the styles we own and the exact position on close. */
(() => {
  let saved;
  const properties = ['position','top','left','width','overflow'];
  window.portfolioGalleryLock = open => {
    const body = document.body;
    if (open && !saved) {
      saved = {x:window.scrollX,y:window.scrollY,
        styles:properties.map(name=>[name,body.style.getPropertyValue(name),body.style.getPropertyPriority(name)])};
      document.documentElement.classList.add('gallery-locked');
      body.style.setProperty('position','fixed');
      body.style.setProperty('top',`${-saved.y}px`);
      body.style.setProperty('left',`${-saved.x}px`);
      body.style.setProperty('width','100%');
      body.style.setProperty('overflow','hidden');
    } else if (!open && saved) {
      const previous = saved;
      saved = null;
      for (const [name,value,priority] of previous.styles) {
        if (value) body.style.setProperty(name,value,priority);
        else body.style.removeProperty(name);
      }
      document.documentElement.classList.remove('gallery-locked');
      window.scrollTo({left:previous.x,top:previous.y,behavior:'instant'});
    }
  };
})();


    (() => {
      window.addEventListener('portfolio:ready', () => {
        const analytics = document.createElement('script');
        analytics.src = 'https://qiushi0919.cn/analytics/script.js';
        analytics.async = true;
        analytics.dataset.websiteId = '79fcfef2-7cfd-4cbd-93c4-3986ecef05f7';
        analytics.dataset.domains = 'qiushi0919.cn,qiushi0919.github.io';
        document.head.appendChild(analytics);

        const container = document.getElementById('profileViews');
        const output = document.getElementById('totalViews');
        if (!container || !output) return;
        fetch('https://qiushi0919.cn/visit-count.json', {cache:'default'})
          .then(response => {
            if (!response.ok) throw new Error(`View count request failed: ${response.status}`);
            return response.json();
          })
          .then(data => {
            const views = Number(data.views);
            if (!Number.isFinite(views) || views < 0) return;
            output.textContent = new Intl.NumberFormat(document.documentElement.lang).format(views);
            container.hidden = false;
          })
          .catch(() => {});
      }, {once:true});
    })();
  

    (() => {
      const dialog = document.getElementById('contactDialog');
      const image = document.getElementById('contactQrImage');
      const title = document.getElementById('contactDialogTitle');
      const description = document.getElementById('contactDialogDescription');
      const caption = document.getElementById('contactQrCaption');
      const qr = image.closest('figure');
      const preview = document.getElementById('contactLinkPreview');
      const avatar = document.getElementById('contactPreviewAvatar');
      const mark = document.getElementById('contactPreviewMark');
      const name = document.getElementById('contactPreviewName');
      const summary = document.getElementById('contactPreviewSummary');
      const destination = document.getElementById('contactPreviewUrl');
      const cv = document.getElementById('contactCvPreview');
      const cvImage = document.getElementById('contactCvImage');
      const visit = document.getElementById('contactPreviewVisit');
      const dismiss = document.getElementById('contactPreviewDismiss');
      const close = document.getElementById('contactDialogClose');
      const english = document.documentElement.dataset.language === 'en';
      const text = (zh, en) => english ? en : zh;
      let activeTrigger = null;
      let savedScroll = {x:0,y:0};
      const isPhone = () => document.documentElement.classList.contains('portrait-phone') ||
        (Math.min(window.screen.width, window.screen.height) <= 600 &&
         (matchMedia('(pointer:coarse)').matches || matchMedia('(hover:none)').matches));
      const syncPhone = () => {
        const phone = isPhone();
        document.documentElement.classList.toggle('mobile-contact-ui', phone);
        document.querySelectorAll('a.profile-contact-icon').forEach(link => {
          if (phone) {
            link.setAttribute('aria-haspopup', 'dialog');
            link.setAttribute('aria-controls', 'contactDialog');
          } else {
            link.removeAttribute('aria-haspopup');
            link.removeAttribute('aria-controls');
          }
        });
      };
      syncPhone();
      window.addEventListener('resize', syncPhone, {passive:true});
      const open = trigger => {
        if (dialog.open) return;
        document.querySelector('.project-card.is-open .close')?.click();
        activeTrigger = trigger;
        savedScroll = {x:window.scrollX,y:window.scrollY};
        document.documentElement.classList.add('contact-modal-open');
        dialog.showModal();
        close.focus({preventScroll:true});
      };
      document.querySelectorAll('[data-contact-src]').forEach(trigger => {
        trigger.addEventListener('click', () => {
          qr.hidden = false;
          preview.hidden = true;
          title.textContent = trigger.dataset.contactTitle;
          description.textContent = trigger.dataset.contactDescription;
          caption.textContent = trigger.dataset.contactTitle;
          image.src = trigger.dataset.contactSrc;
          image.alt = `${trigger.dataset.contactTitle} ${text('二维码', 'QR code')}`;
          image.loading = 'eager';
          open(trigger);
        });
      });
      document.querySelectorAll('a.profile-contact-icon').forEach(trigger => {
        trigger.addEventListener('click', event => {
          if (!isPhone() || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          const href = trigger.href;
          const url = new URL(href);
          const kind = url.protocol === 'mailto:' ? 'email' : url.hostname === 'github.com' ? 'github' :
            url.hostname === 'scholar.google.com' ? 'scholar' : url.pathname.replace(/\/$/, '') === '/cv' ? 'cv' : 'website';
          qr.hidden = true;
          preview.hidden = false;
          cv.hidden = kind !== 'cv';
          avatar.hidden = true;
          mark.hidden = false;
          mark.replaceChildren();
          const icon = trigger.querySelector('svg,.cv-mark');
          if (icon) mark.append(icon.cloneNode(true));
          const content = {
            github: ['GitHub', text('GitHub 个人主页', 'GitHub profile'), 'Qiushi0919', 'Intelligent Electromagnetic Wave Manipulation · Trustworthy AI · Wireless Communication Systems', text('前往 GitHub', 'Visit GitHub')],
            email: [text('邮箱', 'Email'), text('邮箱联系方式', 'Email contact'), url.pathname, text('科研交流与项目联系', 'Research and project enquiries'), text('写邮件', 'Write an email')],
            scholar: ['Google Scholar', text('学术个人主页', 'Academic profile'), '谢秋实 / Qiushi Xie', text('科研论文与预印本', 'Research papers and preprints'), text('前往学术主页', 'Visit Google Scholar')],
            cv: [text('个人简历', 'Curriculum Vitae'), 'PDF', '谢秋实 / Qiushi Xie', text('教育经历、科研论文与竞赛项目', 'Education, research papers and competition projects'), text('打开简历', 'Open CV')],
            website: [text(url.hostname === 'qiushi0919.cn' ? '中文个人网站' : '英文个人网站', url.hostname === 'qiushi0919.cn' ? 'Chinese website' : 'English website'), text('个人主页', 'Personal homepage'), url.hostname, text('科研论文、竞赛项目与个人作品', 'Research papers, competition projects and personal work'), text('前往网站', 'Visit website')]
          }[kind];
          [title.textContent, description.textContent, name.textContent, summary.textContent, visit.textContent] = content;
          destination.textContent = kind === 'email' ? url.pathname : href;
          visit.href = href;
          visit.target = kind === 'email' ? '_self' : '_blank';
          dismiss.textContent = text('关闭', 'Close');
          if (kind === 'github' || kind === 'website') {
            avatar.src = kind === 'github' ? '/assets/contact/github-avatar.jpg' : '/assets/contact/qiushi-favicon.png';
            avatar.alt = kind === 'github' ? 'Qiushi0919' : text('个人网站图标', 'Website icon');
            avatar.loading = 'eager';
            avatar.hidden = false;
            mark.hidden = true;
          }
          if (kind === 'cv') {
            cvImage.src = new URL('/cv/qiushi-xie-cv.webp', href).href;
            cvImage.loading = 'eager';
          }
          open(trigger);
        });
      });
      avatar.addEventListener('error', () => {avatar.hidden = true;mark.hidden = false;});
      close.addEventListener('click', () => dialog.close());
      dismiss.addEventListener('click', () => dialog.close());
      visit.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('contact-modal-open');
        window.scrollTo(savedScroll.x, savedScroll.y);
        activeTrigger?.focus({preventScroll:true});
      });
      dialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') dialog.close();
      });
      dialog.addEventListener('cancel', event => {
        event.preventDefault();
        dialog.close();
      });
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
    })();
  

    const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const backdrop = document.querySelector('.overlay-backdrop');
    const projects = [
      {
        card: document.getElementById('projectCard'),
        trigger: document.getElementById('coverTrigger'),
        overlay: document.getElementById('featureOverlay'),
        close: document.getElementById('closeOverlay')
      },
      {
        card: document.getElementById('nuedcProjectCard'),
        trigger: document.getElementById('nuedcCoverTrigger'),
        overlay: document.getElementById('nuedcFeatureOverlay'),
        close: document.getElementById('nuedcCloseOverlay')
      },
      {
        card: document.getElementById('vaseProjectCard'),
        trigger: document.getElementById('vaseCoverTrigger'),
        overlay: document.getElementById('vaseFeatureOverlay'),
        close: document.getElementById('vaseCloseOverlay')
      },
      {
        card: document.getElementById('eecsProjectCard'),
        trigger: document.getElementById('eecsCoverTrigger'),
        overlay: document.getElementById('eecsFeatureOverlay'),
        close: document.getElementById('eecsCloseOverlay')
      },
      {
        card: document.getElementById('embeddedProjectCard'),
        trigger: document.getElementById('embeddedCoverTrigger'),
        overlay: document.getElementById('embeddedFeatureOverlay'),
        close: document.getElementById('embeddedCloseOverlay')
      },
      {
        card: document.getElementById('lowcomProjectCard'),
        trigger: document.getElementById('lowcomCoverTrigger'),
        overlay: document.getElementById('lowcomFeatureOverlay'),
        close: document.getElementById('lowcomCloseOverlay')
      },
      {
        card: document.getElementById('codexTidyProjectCard'),
        trigger: document.getElementById('codexTidyCoverTrigger'),
        overlay: document.getElementById('codexTidyFeatureOverlay'),
        close: document.getElementById('codexTidyCloseOverlay')
      },
      {
        card: document.getElementById('sideProjectCard'),
        trigger: document.getElementById('sideProjectCoverTrigger'),
        overlay: document.getElementById('sideProjectFeatureOverlay'),
        close: document.getElementById('sideProjectCloseOverlay')
      },
      {
        card: document.getElementById('altTabProjectCard'),
        trigger: document.getElementById('altTabCoverTrigger'),
        overlay: document.getElementById('altTabFeatureOverlay'),
        close: document.getElementById('altTabCloseOverlay')
      },
      {
        card: document.getElementById('mindMapProjectCard'),
        trigger: document.getElementById('mindMapCoverTrigger'),
        overlay: document.getElementById('mindMapFeatureOverlay'),
        close: document.getElementById('mindMapCloseOverlay')
      }
    ].filter(project => project.card && project.trigger && project.overlay && project.close);
    const anyOpen = () => projects.some(project => project.card.classList.contains('is-open'));
    const syncBackdrop = () => { const open = anyOpen(); document.body.classList.toggle('overlay-active', open); window.portfolioGalleryLock(open); };
    const hydrateOverlay = (project, priority = 'high') => {
      project.overlay.querySelectorAll('[data-src]').forEach(media => {
        const source = media.dataset.src;
        if (!source) return;
        if (media.tagName === 'IMG') { media.loading = 'eager'; media.fetchPriority = priority; }
        media.src = source;
        media.removeAttribute('data-src');
        if (media.tagName === 'VIDEO') {
          media.preload = 'auto';
          media.load();
        }
      });
    };
    const setOpen = (project, open) => {
      if (open) projects.filter(item => item !== project).forEach(item => setOpen(item, false));
      if (open) hydrateOverlay(project);
      project.card.classList.toggle('is-open', open);
      project.trigger.setAttribute('aria-expanded', String(open));
      project.overlay.setAttribute('aria-hidden', String(!open));
      project.overlay.querySelectorAll('video').forEach(video => {
        if (!open) video.pause();
      });
      syncBackdrop();
    };
    const closeOpenProject = () => {
      const openProject = projects.find(project => project.card.classList.contains('is-open'));
      if (!openProject) return;
      setOpen(openProject, false);
      openProject.trigger.focus({preventScroll:true});
    };
    projects.forEach(project => {
      project.overlay.setAttribute('aria-hidden', 'true');
      project.overlay.querySelectorAll('video').forEach(video => video.pause());
      ['pointerenter', 'focusin', 'touchstart'].forEach(eventName => {
        project.trigger.addEventListener(eventName, () => hydrateOverlay(project), {once:true, passive:true});
      });
      project.trigger.addEventListener('click', () => {
        setOpen(project, !project.card.classList.contains('is-open'));
      });
      project.close.addEventListener('click', event => {
        event.stopPropagation();
        closeOpenProject();
      });
    });
    backdrop.addEventListener('click', closeOpenProject);
    document.addEventListener('keydown', event => {
      if (!anyOpen() || (event.key !== 'Escape' && event.key !== ' ')) return;
      if (event.key === ' ' && event.target.closest('button,a,input,summary,video,select,textarea')) return;
      event.preventDefault();
      closeOpenProject();
    });
    if (reduceMotion) document.querySelectorAll('video').forEach(video => video.pause());
  

    (() => {
      const dialog = document.getElementById('citationDialog');
      if (!dialog) return;
      const content = document.getElementById('citationText');
      const paperTitle = document.getElementById('citationPaperTitle');
      const copy = document.getElementById('citationCopy');
      const download = document.getElementById('citationDownload');
      const close = document.getElementById('citationClose');
      const status = document.getElementById('citationStatus');
      const english = document.documentElement.dataset.language === 'en';
      let trigger = null;
      let scroll = {x:0,y:0};
      document.querySelectorAll('[data-citation-key]').forEach(link => {
        link.addEventListener('click', event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
          event.preventDefault();
          if (dialog.open) return;
          document.querySelector('.project-card.is-open .close')?.click();
          trigger = link;
          scroll = {x:window.scrollX,y:window.scrollY};
          content.value = link.dataset.citationText;
          paperTitle.textContent = link.closest('article').querySelector('h2').textContent.trim();
          download.href = link.href;
          download.download = link.download;
          status.textContent = '';
          document.documentElement.classList.add('contact-modal-open');
          dialog.showModal();
          close.focus({preventScroll:true});
        });
      });
      copy.addEventListener('click', async () => {
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(content.value);
          status.textContent = english ? 'BibTeX copied.' : 'BibTeX 已复制。';
        } catch (_) {
          content.focus({preventScroll:true});
          content.select();
          status.textContent = english ? 'Citation selected. Please copy it manually.' : '引用已选中，请手动复制。';
        }
      });
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {event.preventDefault();dialog.close();}
      });
      dialog.addEventListener('cancel', event => {event.preventDefault();dialog.close();});
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const b = dialog.getBoundingClientRect();
        if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
      });
      dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('contact-modal-open');
        window.scrollTo(scroll.x,scroll.y);
        trigger?.focus({preventScroll:true});
      });
    })();
  
/* One network queue for all animated thumbnails and their expanded copies.
   Retain compressed blobs; players keep only a few decoded sprite sheets. */
(() => {
  const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve=yes; reject=no; });
    promise.catch(() => {}); // Background previews may not have a consumer yet.
    return {promise, resolve, reject};
  };
  const valid = data => data.duration > 0 && data.duration < 300 && data.fps > 0 && data.fps <= 30 &&
    data.width > 0 && data.width <= 1280 && data.height > 0 && data.height <= 1280 &&
    (data.replayStart === undefined || (Number.isFinite(data.replayStart) && data.replayStart >= 0 && data.replayStart < data.duration)) &&
    (data.loopIntroExtra === undefined || (Number.isFinite(data.loopIntroExtra) && data.loopIntroExtra >= 0 && data.loopIntroExtra <= 10)) &&
    data.columns === 4 && data.tilesPerSheet === 16 && data.frames?.length && data.sheets?.length &&
    data.sheets.every(name => /^sheet-\d{3}\.webp$/.test(name)) &&
    data.frames.every(tile => Number.isInteger(tile) && tile >= 0 && tile < data.sheets.length * 16);
  class PreviewLoadQueue {
    constructor() { this.items=new Map(); this.busy=false; this.started=false; }
    register(url, priority) {
      const key=url.href;
      if (!this.items.has(key)) this.items.set(key, {url, priority:Number.isFinite(priority)?priority:100,
        position:this.items.size, state:'waiting', blobs:new Map(), listeners:new Set(),
        manifest:deferred(), complete:deferred()});
      const item=this.items.get(key);
      if (this.started) this.pump();
      return item;
    }
    ordered() { return [...this.items.values()].sort((a,b)=>a.priority-b.priority || a.position-b.position); }
    notify(item, state) {
      item.state=state;
      for (const listener of item.listeners) listener(item);
    }
    subscribe(item, listener) { item.listeners.add(listener); listener(item); }
    request(item) {
      if (item.state === 'error') {
        item.manifest=deferred(); item.complete=deferred();
        this.notify(item,'waiting'); // Explicit retry reuses successful blobs.
      }
      this.started=true;
      this.pump();
      return item;
    }
    start() {
      const first=this.ordered()[0];
      if (!first) return Promise.resolve();
      this.request(first);
      return first.complete.promise;
    }
    async fetch(url, type) {
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      try {
        const response=await fetch(url,{cache:'force-cache',signal:controller.signal});
        if (!response.ok) throw new Error('Preview download unavailable');
        return await response[type]();
      } finally { clearTimeout(timeout); }
    }
    async pump() {
      if (!this.started || this.busy) return;
      this.busy=true;
      try {
        let item;
        while ((item=this.ordered().find(record=>record.state === 'waiting'))) {
          this.notify(item,'loading');
          try {
            if (!item.data) {
              const data=await this.fetch(item.url,'json');
              if (!valid(data)) throw new Error('Invalid preview manifest');
              item.data=data;
            }
            item.manifest.resolve(item.data);
            this.notify(item,'loading');
            for (let index=0;index<item.data.sheets.length;index++) {
              if (!item.blobs.has(index)) {
                const url=new URL(item.data.sheets[index],item.url);
                url.search=item.url.search;
                item.blobs.set(index,await this.fetch(url,'blob'));
                this.notify(item,'loading');
              }
            }
            this.notify(item,'ready');
            item.complete.resolve(item.data);
          } catch (error) {
            this.notify(item,'error');
            item.manifest.reject(error); item.complete.reject(error);
            // A failed upper preview must not block the remaining projects.
          }
        }
      } finally { this.busy=false; }
    }
  }
  window.PortfolioPreviewLoads=new PreviewLoadQueue();
})();

/* Raster frames only: thumbnail playback never creates an HTML video player. */
(() => {
  class PreviewFramePlayer {
    constructor(canvas, url, callbacks) {
      this.canvas = canvas;
      this.url = new URL(url, document.baseURI);
      this.callbacks = callbacks;
      this.context = canvas.getContext('2d', {alpha:false});
      this.images = new Map();
      this.pending = new Map();
      this.elapsed = 0;
      this.running = false;
      this.epoch = 0;
      this.raf = 0;
      this.last = null;
      this.tile = -1;
      this.drawn = false;
      this.loop = canvas.dataset.previewLoop === 'true';
      this.round = 0;
      this.resource = window.PortfolioPreviewLoads.register(this.url, Number(canvas.dataset.previewLoadOrder));
      window.PortfolioPreviewLoads.subscribe(this.resource, item => {
        canvas.dataset.previewBuffer = item.state;
        canvas.dataset.previewLoadedSheets = String(item.blobs.size);
        canvas.dataset.previewTotalSheets = String(item.data?.sheets.length || 0);
        callbacks.buffering?.(item.state, item.data);
      });
    }
    async manifest() {
      if (this.data) return this.data;
      if (!this.loading) this.loading = window.PortfolioPreviewLoads.request(this.resource).manifest.promise.then(data => {
        this.canvas.width = data.width;
        this.canvas.height = data.height;
        this.data = data;
        this.callbacks.time?.(this.elapsed, this.duration());
        return data;
      }).catch(error => { this.loading = null; throw error; });
      return this.loading;
    }
    sheet(index) {
      if (this.images.has(index)) return Promise.resolve(this.images.get(index));
      if (this.pending.has(index)) return this.pending.get(index);
      const epoch = this.epoch;
      const url = URL.createObjectURL(this.resource.blobs.get(index));
      const image = new Image();
      image.decoding = 'async';
      const pending = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Preview frame unavailable'));
        image.src = url;
      }).then(async image => {
        if (typeof image.decode === 'function') await image.decode();
        // A paused/closed gallery must not retain decoded offscreen atlases.
        if (this.running && epoch === this.epoch) this.images.set(index, image);
        return image;
      }).finally(() => {
        URL.revokeObjectURL(url);
        if (this.pending.get(index) === pending) this.pending.delete(index);
      });
      this.pending.set(index, pending);
      return pending;
    }
    play({skipCover=false}={}) {
      if (this.running) return;
      this.running = true;
      const epoch = ++this.epoch;
      this.last = null;
      window.PortfolioPreviewLoads.request(this.resource);
      Promise.all([this.manifest(), this.resource.complete.promise]).then(([data]) => {
        if (this.running && epoch === this.epoch) {
          if (skipCover) this.elapsed = data.replayStart || 0;
          this.tick();
        }
      }).catch(error => {
        if (this.running && epoch === this.epoch) this.fail(error);
      });
    }
    tick() {
      this.raf = requestAnimationFrame(now => {
        this.raf = 0;
        if (!this.running) return;
        const data = this.data;
        // Buffering and pauses do not consume the demonstration's timeline.
        let elapsed = this.elapsed + (this.last === null ? 0 : Math.max(0, (now-this.last)/1000));
        this.last = now;
        if (elapsed >= data.duration) {
          if (!this.loop) {
            this.reset();
            this.callbacks.ended();
            return;
          }
          let cycleDuration = data.duration + (this.round ? data.loopIntroExtra || 0 : 0);
          while (elapsed >= cycleDuration) {
            elapsed -= cycleDuration;
            ++this.round;
            cycleDuration = data.duration + (data.loopIntroExtra || 0);
          }
          this.canvas.dataset.previewLoops = String(this.round);
          this.elapsed = elapsed;
        }
        const frameTime = Math.max(0, elapsed - (this.loop && this.round ? data.loopIntroExtra || 0 : 0));
        const frame = Math.min(data.frames.length-1, Math.floor(frameTime * data.fps));
        const tile = data.frames[frame];
        const sheet = Math.floor(tile / data.tilesPerSheet);
        const image = this.images.get(sheet);
        if (image) {
          this.elapsed = elapsed;
          if (tile !== this.tile || !this.drawn) {
            const offset = tile % data.tilesPerSheet;
            this.context.drawImage(image, (offset % data.columns)*data.width,
              Math.floor(offset/data.columns)*data.height, data.width, data.height,
              0, 0, data.width, data.height);
            this.tile = tile;
          }
          this.canvas.dataset.previewFrame = String(frame);
          this.canvas.dataset.previewTime = frameTime.toFixed(3);
          this.canvas.dataset.previewCycleTime = this.elapsed.toFixed(3);
          this.callbacks.time?.(this.elapsed, this.duration());
          if (!this.drawn) { this.drawn = true; this.callbacks.playing(); }
          // At 30fps one atlas lasts only about half a second. Decode two
          // upcoming atlases in advance, including frame zero near a loop.
          const upcoming = data.frames.slice(frame+1, frame+1+Math.ceil(data.fps*1.5));
          if (this.loop && frame+upcoming.length+1 >= data.frames.length) upcoming.push(...data.frames.slice(0,32));
          const keep = new Set([sheet]);
          const ahead = this.loop ? 2 : 1;
          for (const tile of upcoming) {
            const index = Math.floor(tile/data.tilesPerSheet);
            if (!keep.has(index)) keep.add(index);
            if (keep.size === ahead+1) break;
          }
          for (const key of this.images.keys()) {
            if (!keep.has(key)) this.images.delete(key);
          }
          for (const index of keep) if (!this.images.has(index)) this.loadSheet(index);
        } else {
          this.last = null;
          this.loadSheet(sheet);
        }
        if (this.running) this.tick();
      });
    }
    loadSheet(sheet) {
      const epoch = this.epoch;
      this.sheet(sheet).catch(error => {
        if (this.running && epoch === this.epoch) this.fail(error);
      });
    }
    duration() { return this.data ? this.data.duration + (this.loop && this.round ? this.data.loopIntroExtra || 0 : 0) : 0; }
    async seek(seconds) {
      if (!this.data || this.resource.state !== 'ready') return;
      this.elapsed = Math.max(0,Math.min(this.duration()-.001,Number(seconds)||0));
      this.last = null;
      const epoch=this.epoch;
      const serial=this.seekSerial=(this.seekSerial||0)+1;
      const frameTime=Math.max(0,this.elapsed-(this.loop && this.round ? this.data.loopIntroExtra || 0 : 0));
      const frame=Math.min(this.data.frames.length-1,Math.floor(frameTime*this.data.fps));
      const tile=this.data.frames[frame];
      this.callbacks.time?.(this.elapsed,this.duration());
      const image=await this.sheet(Math.floor(tile/this.data.tilesPerSheet));
      if (this.epoch !== epoch || this.seekSerial !== serial) return;
      const offset=tile%this.data.tilesPerSheet,data=this.data;
      this.context.drawImage(image,(offset%data.columns)*data.width,Math.floor(offset/data.columns)*data.height,
        data.width,data.height,0,0,data.width,data.height);
      this.tile=tile;
      this.canvas.dataset.previewFrame=String(frame);
      this.canvas.dataset.previewTime=frameTime.toFixed(3);
      this.canvas.dataset.previewCycleTime=this.elapsed.toFixed(3);
      if (!this.drawn) { this.drawn=true;this.callbacks.playing(); }
    }
    pause({release=true}={}) {
      this.running = false;
      ++this.epoch;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.last = null;
      if (release) { this.images.clear();this.pending.clear(); }
    }
    reset() {
      this.pause();
      this.elapsed = 0;
      this.tile = -1;
      this.drawn = false;
      this.round = 0;
      this.canvas.dataset.previewTime = '0';
      delete this.canvas.dataset.previewFrame;
      delete this.canvas.dataset.previewLoops;
      delete this.canvas.dataset.previewCycleTime;
      this.callbacks.time?.(0,this.duration());
    }
    fail(error) {
      this.reset();
      this.callbacks.error(error);
    }
  }
  window.PortfolioFramePlayer = PreviewFramePlayer;
})();

/* First full appearance starts playback. Competition previews finish at their
   cover; the battery method loops until paused offscreen or behind a gallery. */
(() => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const english = root.dataset.language === 'en';
  const entries = [...document.querySelectorAll('.preview-media canvas[data-preview-auto]')].map(canvas => {
    const media = canvas.closest('.preview-media');
    return {canvas, media, control:media.querySelector('[data-preview-play]'),
      toggle:media.querySelector('[data-preview-toggle]'), seek:media.querySelector('[data-preview-seek]'),
      time:media.querySelector('[data-preview-time]'), userPaused:false,
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
    const replay = entry.hasPlayed;
    const value = loading ? (english?'Loading':'加载中') : replay ? (english?'Replay':'重播') : (english?'Play':'播放');
    if (entry.control) {
      entry.control.setAttribute('aria-disabled', String(loading));
      entry.control.setAttribute('aria-busy', String(loading));
      entry.control.setAttribute('aria-label', loading ? (english?'Loading animation':'正在加载动画') : value + (english?' animation':'动画'));
      entry.control.title = value;
      entry.control.querySelector('.preview-play-label').textContent = value;
      entry.control.querySelector('.preview-play-icon').textContent = loading ? '…' : replay ? '↻' : '▶';
      entry.control.dataset.previewAction = loading ? 'loading' : replay ? 'replay' : 'play';
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
  const sync = () => {
    frame = 0;
    for (const entry of entries) {
      const player = entry.player;
      if (blocked(entry) || (motion.matches && !entry.manual)) { player.pause(); continue; }
      if (entry.userPaused) continue;
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
      buffering(state,data) {
        entry.media.dataset.previewBuffer = state;
        const indicator = entry.media.querySelector('.preview-loading-indicator');
        indicator?.setAttribute('aria-hidden', String(state === 'ready' || state === 'error'));
        if (entry.seek) entry.seek.disabled = state !== 'ready';
        if (entry.toggle) entry.toggle.disabled = state === 'waiting' || state === 'loading';
        if (data && entry.seek) entry.seek.max=String(data.duration);
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

/* Give the first animation a bounded startup window; later downloads continue
   in order while their thumbnails keep the static cover and loading indicator. */
(() => {
  const root=document.documentElement;
  const loader=document.getElementById('portfolioLoader');
  if (!loader) {
    root.classList.remove('portfolio-loading');root.classList.add('portfolio-ready');
    window.dispatchEvent(new Event('portfolio:ready'));
    return;
  }
  const region=loader.closest('.work-loading-region');
  region?.setAttribute('aria-busy','true');
  const english=root.dataset.language === 'en';
  const timer=document.getElementById('loaderTimer');
  const track=document.getElementById('loaderTrack');
  const progress=document.getElementById('loaderProgress');
  const started=window.portfolioLoadStartedAt || performance.now();
  const maximumWaitMs=5000;
  loader.querySelector('.loader-title').textContent=english?'Loading portfolio':'正在加载作品集';
  loader.querySelector('.loader-subtitle').textContent=english?'Preparing the first animation':'正在准备首个动画';
  loader.setAttribute('aria-label',english?'Loading portfolio':'正在加载作品集');
  track.setAttribute('aria-label',english?'First animation loading progress':'首个动画加载进度');
  const first=window.PortfolioPreviewLoads.ordered()[0];
  const update=() => {
    const elapsed=Math.min(maximumWaitMs,performance.now()-started);
    const remaining=Math.max(0,(maximumWaitMs-elapsed)/1000).toFixed(1);
    timer.textContent=english?`Up to 5 seconds · ${remaining}s remaining`:`最多等待 5 秒 · 剩余 ${remaining}s`;
    const fraction=first?.state === 'ready'?1:first?.data?first.blobs.size/first.data.sheets.length:0;
    const value=Math.round(fraction*100);
    progress.style.width=`${value}%`;track.setAttribute('aria-valuenow',String(value));
  };
  const reveal=() => {
    clearInterval(interval);
    root.classList.remove('portfolio-loading');root.classList.add('portfolio-ready');
    loader.setAttribute('aria-hidden','true');
    region?.setAttribute('aria-busy','false');
    window.dispatchEvent(new Event('portfolio:ready'));
    if (!matchMedia('(prefers-reduced-motion:reduce)').matches) root.classList.add('carousels-running');
  };
  update();
  const interval=setInterval(update,100);
  const firstReady=window.PortfolioPreviewLoads.start().catch(()=>{});
  const images=[...new Set([document.querySelector('.profile-photo'),document.querySelector('.preview-poster')].filter(Boolean))];
  const imagesReady=Promise.all(images.map(image=>new Promise(resolve=>{
    if (image.complete) { resolve();return; }
    image.loading='eager';
    image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});
  })));
  const deadline=new Promise(resolve=>setTimeout(resolve,Math.max(0,maximumWaitMs-(performance.now()-started))));
  const minimum=new Promise(resolve=>setTimeout(resolve,Math.max(0,240-(performance.now()-started))));
  Promise.all([Promise.race([Promise.all([firstReady,imagesReady]),deadline]),minimum]).then(reveal);
})();

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
    window.dispatchEvent(new Event('portfolio:workviewchange'));
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
  let inputAnchor, restoredAnchor;
  // Focusing a radio inside a sticky bar can scroll its original flow box into
  // view before change fires. Capture the reading position before that focus.
  toolbar.addEventListener('pointerdown', event => {
    const option = event.target.closest('.work-view-option');
    if (!option) return;
    inputAnchor = {card:currentCard(), time:performance.now()};
    event.preventDefault();
    option.querySelector('input')?.focus({preventScroll:true});
  });
  toolbar.addEventListener('keydown', event => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) {
      inputAnchor = {card:currentCard(), time:performance.now()};
    }
  });
  radios.forEach(radio => radio.addEventListener('change', () => {
    if (!radio.checked || radio.value === view) return;
    // A short Overview list may reach the page bottom before the selected card
    // can align with the bar. Keep that card for a return switch until scrolling.
    const anchor = restoredAnchor && Math.abs(window.scrollY-restoredAnchor.y) < 2 ? restoredAnchor.card :
      inputAnchor && performance.now()-inputAnchor.time < 2000 ? inputAnchor.card : currentCard();
    inputAnchor = null;
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
      restoredAnchor = {card:anchor, y:window.scrollY};
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
