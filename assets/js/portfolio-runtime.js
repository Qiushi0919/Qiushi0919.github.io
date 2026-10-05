
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
      document.querySelectorAll('[data-contact-src]').forEach(trigger => {
        trigger.addEventListener('click', () => {
          title.textContent = trigger.dataset.contactTitle;
          description.textContent = trigger.dataset.contactDescription;
          caption.textContent = trigger.dataset.contactTitle;
          image.src = trigger.dataset.contactSrc;
          image.alt = `${trigger.dataset.contactTitle}二维码`;
          dialog.showModal();
        });
      });
      document.getElementById('contactDialogClose').addEventListener('click', () => dialog.close());
      dialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') dialog.close();
      });
      dialog.addEventListener('cancel', event => {
        event.preventDefault();
        dialog.close();
      });
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
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
  
requestAnimationFrame(() => { document.documentElement.classList.add('portfolio-ready'); window.dispatchEvent(new Event('portfolio:ready')); if (!matchMedia('(prefers-reduced-motion:reduce)').matches) document.documentElement.classList.add('carousels-running'); });