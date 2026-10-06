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
