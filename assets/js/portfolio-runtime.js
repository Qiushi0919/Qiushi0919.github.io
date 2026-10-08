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

/* A modal consumes one Back action; normal page navigation remains unchanged. */
(() => {
  const key='portfolioModal', session=String(Date.now())+'-'+Math.random();
  const dialogs=new Map();
  let current=null, restoring=false, removing=false;
  const state=id=>({...history.state,[key]:{session,id}});
  const owned=value=>value?.[key]?.session===session;
  window.PortfolioModalHistory={
    open(id,close,restore) {
      dialogs.set(id,{close,restore});
      if (current===id) return;
      current=id;
      if (restoring || removing) return;
      if (owned(history.state)) history.replaceState(state(id),'',location.href);
      else history.pushState(state(id),'',location.href);
    },
    close(id) {
      if (current!==id) return;
      current=null;
      if (restoring) return;
      // Switching directly between modals reuses the same history entry.
      queueMicrotask(()=>{
        if (current || removing || !owned(history.state)) return;
        removing=true;history.back();
      });
    }
  };
  window.addEventListener('popstate',event=>{
    if (removing) {
      removing=false;
      if (current) history.pushState(state(current),'',location.href);
      return;
    }
    const next=owned(event.state)?event.state[key].id:null;
    restoring=true;
    try {
      const previous=current;current=null;
      if (previous && previous!==next) dialogs.get(previous)?.close();
      if (next && dialogs.has(next)) {
        current=next;dialogs.get(next).restore();
      }
    } finally { restoring=false; }
  });
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
        window.PortfolioModalHistory?.open(dialog.id, () => dialog.close(), () => open(trigger));
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
        window.PortfolioModalHistory?.close(dialog.id);
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
    const hydrateOverlay = (project, priority = 'low') => window.PortfolioPreviewLoads.afterPreviews(() => {
      if (project.overlay.getAttribute('aria-hidden') !== 'false') return;
      project.overlay.querySelectorAll('[data-src]').forEach(media => {
        const source = media.dataset.src;
        if (!source) return;
        if (media.tagName === 'IMG') { media.loading = 'eager'; media.fetchPriority = priority; }
        media.src = source;
        media.removeAttribute('data-src');
        if (media.tagName === 'VIDEO') {
          media.preload = 'metadata';
          media.load();
        }
      });
    });
    const setOpen = (project, open) => {
      if (open) projects.filter(item => item !== project).forEach(item => setOpen(item, false));
      project.card.classList.toggle('is-open', open);
      project.trigger.setAttribute('aria-expanded', String(open));
      project.overlay.setAttribute('aria-hidden', String(!open));
      if (open) hydrateOverlay(project);
      if (open) window.PortfolioModalHistory?.open(project.overlay.id,
        () => setOpen(project, false), () => setOpen(project, true));
      else window.PortfolioModalHistory?.close(project.overlay.id);
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
          window.PortfolioModalHistory?.open(dialog.id, () => dialog.close(), () => trigger?.click());
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
        window.PortfolioModalHistory?.close(dialog.id);
        document.documentElement.classList.remove('contact-modal-open');
        window.scrollTo(scroll.x,scroll.y);
        trigger?.focus({preventScroll:true});
      });
    })();
  
/* Download final MP4 previews in page order; thumbnails, dialogs and downloads
   share the same completed Blob and object URL. */
(() => {
  const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve=yes; reject=no; });
    promise.catch(() => {}); // Background previews may not have a consumer yet.
    return {promise, resolve, reject};
  };
  class PreviewLoadQueue {
    constructor() { this.items=new Map(); this.busy=false; this.started=false; this.details=[]; }
    registerVideo(url, priority, videoData) {
      const key=url.href;
      if (!this.items.has(key)) this.items.set(key, {url, priority:Number.isFinite(priority)?priority:100,
        position:this.items.size, state:'waiting', blobs:new Map(), listeners:new Set(),
        playable:deferred(), complete:deferred(), canPlay:false,
        loadedBytes:0, totalBytes:videoData?.bytes || 0,
        kind:'video',data:{...videoData}});
      const item=this.items.get(key);
      if (this.started) this.pump();
      return item;
    }
    afterPreviews(callback) {
      this.details.push(callback);
      this.started=true;this.pump();
    }
    ordered() { return [...this.items.values()].sort((a,b)=>a.priority-b.priority || a.position-b.position); }
    notify(item, state) {
      item.state=state;
      for (const listener of item.listeners) listener(item);
    }
    subscribe(item, listener) { item.listeners.add(listener); listener(item); }
    request(item) {
      if (item.state === 'error') {
        item.playable=deferred(); item.complete=deferred();
        item.canPlay=false;
        item.error=null;
        item.loadedBytes=0;
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
      return first.playable.promise;
    }
    async fetch(url, type, item) {
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      try {
        const response=await fetch(url,{cache:'force-cache',signal:controller.signal});
        if (!response.ok) throw new Error('Preview download unavailable');
        if (type === 'blob' && item) {
          // Count received bytes, not elapsed time. The build supplies the exact
          // file size when a CDN omits Content-Length. No second request is made.
          const size=Number(response.headers?.get('Content-Length'));
          if (size>0) item.totalBytes=size;
          this.notify(item,'loading');
          if (response.body?.getReader) {
            const reader=response.body.getReader(), chunks=[];
            let lastPercent=-1;
            try {
              for (;;) {
                const {done,value}=await reader.read();
                if (done) break;
                chunks.push(value);item.loadedBytes+=value.byteLength;
                const percent=item.totalBytes?Math.min(99,Math.floor(item.loadedBytes/item.totalBytes*100)):0;
                if (percent!==lastPercent) {lastPercent=percent;this.notify(item,'loading');}
              }
            } finally {reader.releaseLock();}
            return new Blob(chunks,{type:response.headers?.get('Content-Type') || 'video/mp4'});
          }
        }
        return await response[type]();
      } finally { clearTimeout(timeout); }
    }
    async pump() {
      if (!this.started || this.busy) return;
      this.busy=true;
      try {
        let item;
        while ((item=this.ordered().find(record=>record.state === 'waiting'))) {
          item.startedAt=Date.now();
          this.notify(item,'loading');
          try {
            this.notify(item,'loading');
            if (!item.blobs.has(0)) item.blobs.set(0,await this.fetch(item.url,'blob',item));
            item.loadedBytes=item.totalBytes=item.blobs.get(0).size;
            item.objectURL ||= URL.createObjectURL(item.blobs.get(0));

            item.canPlay=true;item.playable.resolve(item.data);
            this.notify(item,'ready');
            item.complete.resolve(item.data);
          } catch (error) {
            item.error=error;
            this.notify(item,'error');
            item.playable.reject(error);item.complete.reject(error);
            // A failed upper preview must not block the remaining projects.
          }
        }
      } finally {
        this.busy=false;
        if (!this.ordered().some(item=>item.state==='waiting' || item.state==='loading')) {
          for (const callback of this.details.splice(0)) callback();
        }
      }
    }
  }
  window.PortfolioPreviewLoads=new PreviewLoadQueue();
})();

/* Decode the smaller MP4 into Canvas. The muted inline decoder behind Canvas has
   no visible native controls or hit area. List/gallery share one cached Blob. */
(() => {
  class PreviewVideoPlayer {
    constructor(canvas,url,callbacks) {
      this.canvas=canvas;this.callbacks=callbacks;
      this.context=canvas.getContext('2d',{alpha:false});
      this.running=false;this.drawn=false;this.elapsed=0;this.round=0;
      this.epoch=0;this.raf=0;this.last=null;this.hold=0;
      this.loop=canvas.dataset.previewLoop==='true';
      this.data={duration:Number(canvas.dataset.previewDuration),replayStart:Number(canvas.dataset.previewReplayStart)||0,
        loopIntroExtra:Number(canvas.dataset.previewLoopIntroExtra)||0,width:canvas.width,height:canvas.height,
        bytes:Number(canvas.dataset.previewBytes)||0};
      this.resource=window.PortfolioPreviewLoads.registerVideo(new URL(url,document.baseURI),
        Number(canvas.dataset.previewLoadOrder),this.data);
      window.PortfolioPreviewLoads.subscribe(this.resource,item=>{
        canvas.dataset.previewBuffer=item.state;
        canvas.dataset.previewPlayable=String(item.canPlay);
        callbacks.buffering?.(item.state,item.data,item.canPlay,item);
      });
      callbacks.time?.(0,this.duration());
    }
    async decoder() {
      const video=this.video ||= document.createElement('video');
      video.muted=true;video.defaultMuted=true;video.playsInline=true;
      video.controls=false;video.preload='auto';
      video.disablePictureInPicture=true;video.disableRemotePlayback=true;
      video.className='preview-native-decoder';
      video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
      video.setAttribute('muted','');video.setAttribute('aria-hidden','true');
      video.setAttribute('controlslist','nodownload nofullscreen noremoteplayback');
      if (!video.parentNode) this.canvas.parentNode.insertBefore(video,this.canvas);
      if (this.resource.objectURL && video.getAttribute('src')!==this.resource.objectURL) {
        video.src=this.resource.objectURL;video.load();
      }
      if (this.video?.readyState>=2) return this.video;
      if (this.loading) return this.loading;
      this.loading=this.resource.complete.promise.then(()=>new Promise((resolve,reject)=>{
        const done=()=>{
          cleanup();
          this.canvas.width=video.videoWidth;this.canvas.height=video.videoHeight;
          resolve(video);
        };
        const error=()=>{cleanup();reject(new Error('Preview decoder unavailable'))};
        const cleanup=()=>{video.removeEventListener('loadeddata',done);video.removeEventListener('error',error)};
        video.addEventListener('loadeddata',done,{once:true});video.addEventListener('error',error,{once:true});
        if (video.getAttribute('src')!==this.resource.objectURL) {
          video.src=this.resource.objectURL;video.load();
        }
        // Some phone browsers defer decoded data until play(), even for a
        // completely cached Blob. Prime the muted inline decoder to avoid a
        // loadeddata/play deadlock; no frame is shown until the Canvas draws.
        video.play().then(()=>{
          if (!this.running) video.pause();
          if (video.readyState>=2) done();
        }).catch(cause=>{cleanup();reject(cause)});
      })).catch(error=>{this.loading=null;throw error});
      return this.loading;
    }
    play({skipCover=false,userGesture=false}={}) {
      if (this.running) return;
      this.running=true;this.last=null;
      const epoch=++this.epoch;
      window.PortfolioPreviewLoads.request(this.resource);
      const decoded=this.decoder();
      // Call play within the tap/key event when a phone previously refused it.
      const activated=userGesture && this.video?.src ? this.video.play() : null;
      activated?.catch(()=>{});
      decoded.then(async video=>{
        if (activated) await activated;
        if (!this.running || epoch!==this.epoch) return;
        if (skipCover) { this.hold=0;this.elapsed=this.data.replayStart;await this.position(this.elapsed); }
        if (!this.running || epoch!==this.epoch) return;
        if (!this.hold) await video.play();
        if (this.running && epoch===this.epoch) this.tick();else if (!this.running) video.pause();
      }).catch(error=>{if(this.running && epoch===this.epoch)this.fail(error)});
    }
    position(seconds) {
      const video=this.video;
      if (Math.abs(video.currentTime-seconds)<.001 && !video.seeking) return Promise.resolve();
      return new Promise((resolve,reject)=>{
        const done=()=>{cleanup();resolve()};
        const error=()=>{cleanup();reject(new Error('Preview seek unavailable'))};
        const cleanup=()=>{video.removeEventListener('seeked',done);video.removeEventListener('error',error)};
        video.addEventListener('seeked',done,{once:true});video.addEventListener('error',error,{once:true});
        video.currentTime=seconds;
      });
    }
    draw() {
      const video=this.video;
      if (!video || video.readyState<2 || video.seeking) return;
      this.context.drawImage(video,0,0,this.canvas.width,this.canvas.height);
      this.canvas.dataset.previewTime=video.currentTime.toFixed(3);
      this.canvas.dataset.previewCycleTime=this.elapsed.toFixed(3);
      this.callbacks.time?.(this.elapsed,this.duration());
      if (!this.drawn) {this.drawn=true;this.callbacks.playing()}
    }
    tick() {
      this.raf=requestAnimationFrame(now=>{
        this.raf=0;
        if (!this.running) return;
        const video=this.video;
        if (this.hold>0) {
          this.hold=Math.max(0,this.hold-(this.last===null?0:Math.max(0,(now-this.last)/1000)));
          this.elapsed=this.data.loopIntroExtra-this.hold;
          if (!this.hold) video.play().catch(error=>this.fail(error));
        } else {
          this.elapsed=video.currentTime+(this.loop && this.round?this.data.loopIntroExtra:0);
          if (video.ended) {
            if (!this.loop) {this.reset();this.callbacks.ended();return}
            const epoch=this.epoch;
            ++this.round;this.canvas.dataset.previewLoops=String(this.round);
            this.hold=this.data.loopIntroExtra;this.elapsed=0;this.last=null;
            this.position(0).then(()=>{
              if (!this.running || epoch!==this.epoch) return;
              if (!this.hold) video.play().catch(error=>this.fail(error));
              this.tick();
            }).catch(error=>{if(this.running && epoch===this.epoch)this.fail(error)});
            return;
          }
        }
        this.last=now;this.draw();
        if (this.running) this.tick();
      });
    }
    duration() {return this.data.duration+(this.loop && this.round?this.data.loopIntroExtra:0)}
    async seek(seconds) {
      if (this.resource.state!=='ready') return;
      const epoch=this.epoch,serial=this.seekSerial=(this.seekSerial||0)+1;
      this.elapsed=Math.max(0,Math.min(this.duration()-.001,Number(seconds)||0));
      const extra=this.loop && this.round?this.data.loopIntroExtra:0;
      this.hold=Math.max(0,extra-this.elapsed);this.last=null;
      await this.decoder();await this.position(Math.max(0,this.elapsed-extra));
      if (epoch===this.epoch && serial===this.seekSerial) this.draw();
    }
    pause() {
      this.running=false;++this.epoch;cancelAnimationFrame(this.raf);this.raf=0;this.last=null;
      this.video?.pause();
    }
    reset() {
      this.pause();this.elapsed=0;this.drawn=false;this.round=0;this.hold=0;
      if (this.video) this.video.currentTime=0;
      this.canvas.dataset.previewTime='0';
      delete this.canvas.dataset.previewLoops;delete this.canvas.dataset.previewCycleTime;
      this.callbacks.time?.(0,this.duration());
    }
    fail(error) {this.reset();this.callbacks.error(error)}
  }
  window.PortfolioVideoPlayer=PreviewVideoPlayer;
})();

/* Right-click saves the MP4 already shared by the thumbnail and gallery.
   Keep this menu outside the media layout and never fetch a second copy. */
(() => {
  const english = document.documentElement.dataset.language === 'en';
  const pending = new Set();
  let menu, button, current, opener;
  const close = (restoreFocus = false) => {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    current = null;
    if (restoreFocus) opener?.focus({preventScroll:true});
  };
  const label = () => {
    const busy = pending.has(current);
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
    button.textContent = busy ? (english ? 'Preparing download…' : '准备下载…')
      : (english ? '↓ Download video' : '↓ 下载视频');
  };
  const save = resource => {
    const link = document.createElement('a');
    link.href = resource.objectURL;
    link.download = resource.url.pathname.split('/').slice(-2).join('-');
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
  };
  const create = () => {
    menu = document.createElement('div');
    menu.className = 'preview-download-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', english ? 'Video options' : '视频选项');
    menu.hidden = true;
    button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    menu.append(button);
    document.body.append(menu);
    button.addEventListener('click', async event => {
      event.stopPropagation();
      const resource = current;
      if (!resource || pending.has(resource)) return;
      pending.add(resource);
      label();
      try {
        // A click before readiness joins the existing ordered queue. Request
        // also resets an earlier failed transfer, without creating a new URL.
        window.PortfolioPreviewLoads.request(resource);
        await resource.complete.promise;
        save(resource);
        if (current === resource) close(true);
      } catch (error) {
        if (current === resource) {
          button.textContent = english ? 'Download failed · Retry' : '下载失败 · 点击重试';
        }
      } finally {
        pending.delete(resource);
        if (current === resource) {
          button.disabled = false;
          button.setAttribute('aria-busy', 'false');
        }
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!menu.contains(event.target)) close();
    }, true);
    document.addEventListener('keydown', event => {
      if (menu.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation(); // Dismiss this menu before the gallery.
        close(true);
      } else if (event.key === 'Tab') close();
    }, true);
    menu.addEventListener('keydown', event => {
      if (event.key === ' ') event.stopPropagation();
    });
    document.addEventListener('scroll', () => close(), {passive:true,capture:true});
    window.addEventListener('resize', () => close(), {passive:true});
    window.visualViewport?.addEventListener('resize', () => close(), {passive:true});
    document.addEventListener('visibilitychange', () => { if (document.hidden) close(); });
  };
  const open = (event, target, resource, keyboard = false) => {
    event.preventDefault();
    event.stopPropagation();
    if (!menu) create();
    current = resource;
    opener = target;
    label();
    menu.hidden = false;
    const bounds = target.getBoundingClientRect();
    const visual = window.visualViewport;
    const left = visual?.offsetLeft || 0, top = visual?.offsetTop || 0;
    const right = left + (visual?.width || innerWidth);
    const bottom = top + (visual?.height || innerHeight);
    const rect = menu.getBoundingClientRect();
    const x = keyboard || !(event.clientX || event.clientY) ? bounds.left : event.clientX;
    const y = keyboard || !(event.clientX || event.clientY) ? bounds.top : event.clientY;
    menu.style.left = `${Math.max(left, Math.min(x, right - rect.width))}px`;
    menu.style.top = `${Math.max(top, Math.min(y, bottom - rect.height))}px`;
    button.focus({preventScroll:true});
  };
  window.PortfolioPreviewDownloads = {
    attach(media, resource) {
      if (resource?.kind !== 'video') return;
      const target = media.querySelector('.preview-open');
      if (!target) return;
      target.addEventListener('contextmenu', event => open(event, target, resource));
      target.addEventListener('keydown', event => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
          open(event, target, resource, true);
        }
      });
    }
  };
})();

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
    entry.player.play({skipCover:manual,userGesture:manual});
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
    const Player=window.PortfolioVideoPlayer;
    entry.player = new Player(canvas, canvas.dataset.previewVideo, {
      buffering(state,data,canPlay,resource) {
        entry.media.dataset.previewBuffer = state;
        const indicator = entry.media.querySelector('.preview-load-progress');
        indicator?.setAttribute('aria-hidden', String(state === 'ready' || state === 'error'));
        if (indicator) {
          const total=resource?.totalBytes || 0;
          const loaded=resource?.loadedBytes || 0;
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
        if (state === 'ready') schedule();
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
      error(error) {
        entry.needsManual = true;
        entry.autoplayBlocked = !entry.manualOnly && error?.name === 'NotAllowedError';
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
  // A cached automatic preview must not remain permanently stopped after a
  // browser policy rejection. Retry inside the next actual user interaction.
  const retryAutoplay=()=>{
    if (motion.matches) return;
    for (const entry of entries) {
      if (!entry.autoplayBlocked || blocked(entry) || entry.canvas.dataset.previewBuffer!=='ready') continue;
      if (fraction(entry.canvas.getBoundingClientRect(),viewport(entry.popup))<.15) continue;
      entry.autoplayBlocked=false;entry.needsManual=false;entry.userPaused=false;
      entry.player.play({userGesture:true});label(entry);
    }
  };
  for (const type of ['pointerup','touchend','keydown']) document.addEventListener(type,retryAutoplay,{capture:true,passive:true});
  motion.addEventListener('change',schedule);
  const mutation = new MutationObserver(schedule);
  mutation.observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  mutation.observe(root,{attributes:true,attributeFilter:['class']});
  schedule();
})();

/* Reveal content immediately; each thumbnail owns its download progress. */
(() => {
  const root=document.documentElement;
  window.PortfolioPreviewLoads.start().catch(()=>{});
  root.classList.remove('portfolio-loading');root.classList.add('portfolio-ready');
  window.dispatchEvent(new Event('portfolio:ready'));
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) root.classList.add('carousels-running');
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
