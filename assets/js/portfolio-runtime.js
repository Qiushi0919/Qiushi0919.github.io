
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
    const syncBackdrop = () => document.body.classList.toggle('overlay-active', anyOpen());
    const hydrateOverlay = (project, priority = 'high') => {
      project.overlay.querySelectorAll('[data-src]').forEach(media => {
        const source = media.dataset.src;
        if (!source) return;
        if (media.tagName === 'IMG') media.fetchPriority = priority;
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
        if (open && !reduceMotion) video.play().catch(() => {});
        else video.pause();
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
  
requestAnimationFrame(() => { document.documentElement.classList.add('portfolio-ready'); window.dispatchEvent(new Event('portfolio:ready')); if (!matchMedia('(prefers-reduced-motion:reduce)').matches) document.documentElement.classList.add('carousels-running'); });
(() => {
      const videos = [...document.querySelectorAll('video[data-preview-auto]')];
      if (!videos.length) return;
      const motion = matchMedia('(prefers-reduced-motion:reduce)');
      const visible = new Set();
      const sync = video => {
        if (!visible.has(video) || document.hidden || motion.matches) { video.pause(); return; }
        if (!video.getAttribute('src')) { video.src = video.dataset.src; video.preload = 'metadata'; }
        video.muted = true;
        video.play().catch(() => {});
      };
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= .15) visible.add(entry.target);
            else visible.delete(entry.target);
            sync(entry.target);
          });
        }, {threshold:[0,.15]});
        videos.forEach(video => observer.observe(video));
      } else { videos.forEach(video => { visible.add(video); sync(video); }); }
      document.addEventListener('visibilitychange', () => videos.forEach(sync));
      motion.addEventListener('change', () => videos.forEach(sync));
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
