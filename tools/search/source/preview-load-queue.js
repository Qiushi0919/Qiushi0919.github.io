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
