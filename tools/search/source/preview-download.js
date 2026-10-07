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
