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
