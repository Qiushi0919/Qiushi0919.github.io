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
