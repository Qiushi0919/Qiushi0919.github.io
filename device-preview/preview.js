(() => {
  // The supplied tablet screenshot is 1080 physical px wide. Its unchanged
  // 132px portrait and 20px content inset render at about 220px and 33px,
  // indicating a 648 CSS-px viewport rather than the earlier 820px preset.
  const dimensions = {phone:{width:390,height:844,canvas:980,label:'手机'},tablet:{width:648,height:900,canvas:648,label:'平板'},desktop:{width:1440,height:900,canvas:1440,label:'电脑'}};
  const frame = document.getElementById('deviceFrame');
  const box = document.getElementById('deviceWindow');
  const controls = document.querySelector('.preview-tools');
  const radios = [...document.querySelectorAll('input[name="device"]')];
  const language = document.getElementById('previewLanguage');
  const defaultLanguage = document.documentElement.dataset.defaultLanguage;
  language.value = defaultLanguage;
  let mode = 'phone';
  const size = () => {
    const device = dimensions[mode];
    const availableHeight = Math.max(320,window.innerHeight-controls.getBoundingClientRect().height-66);
    const fit = Math.min(1,(window.innerWidth-28)/device.width,availableHeight/device.height);
    const scale = fit*device.width/device.canvas;
    box.style.width = `${device.width*fit}px`;
    box.style.height = `${device.height*fit}px`;
    frame.style.width = `${device.canvas}px`;
    frame.style.height = `${device.height*device.canvas/device.width}px`;
    frame.style.transform = `scale(${scale})`;
    document.getElementById('deviceDescription').textContent = `${device.label} · ${device.width} × ${device.height}`;
  };
  const show = () => {
    size();
    const prefix = language.value === defaultLanguage ? '/' : language.value === 'zh' ? '/zh/' : '/en/';
    const url = new URL(prefix,location.origin);
    if (mode === 'phone') { url.searchParams.set('preview-device','phone'); url.searchParams.set('preview-width','390'); }
    frame.src = url.href;
    document.getElementById('openPage').href = prefix;
  };
  radios.forEach(radio => radio.addEventListener('change',()=>{if(radio.checked){mode=radio.value;show();}}));
  language.addEventListener('change',show);
  frame.addEventListener('load',()=>{try{const url=new URL(frame.contentWindow.location.href);url.searchParams.delete('preview-device');url.searchParams.delete('preview-width');document.getElementById('openPage').href=url.href;}catch{}});
  window.addEventListener('resize',size,{passive:true});
  show();
})();
