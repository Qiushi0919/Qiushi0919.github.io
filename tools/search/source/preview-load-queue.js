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
