/* One project queue for all animated thumbnails and their expanded copies.
   Download up to four compressed sheets within the active project together.
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
    (data.sheetBytes === undefined || (Array.isArray(data.sheetBytes) && data.sheetBytes.length === data.sheets.length &&
      data.sheetBytes.every(size=>Number.isInteger(size) && size>0))) &&
    data.sheets.every(name => /^sheet-\d{3}\.webp$/.test(name)) &&
    data.frames.every(tile => Number.isInteger(tile) && tile >= 0 && tile < data.sheets.length * 16);
  class PreviewLoadQueue {
    constructor() { this.items=new Map(); this.busy=false; this.started=false; this.details=[]; }
    register(url, priority, videoData) {
      const key=url.href;
      if (!this.items.has(key)) this.items.set(key, {url, priority:Number.isFinite(priority)?priority:100,
        position:this.items.size, state:'waiting', blobs:new Map(), listeners:new Set(),
        manifest:deferred(), playable:deferred(), complete:deferred(), available:new Map(), canPlay:false,
        ...(videoData?{kind:'video',data:{...videoData,sheets:[url.pathname.split('/').pop()]}}:{})});
      const item=this.items.get(key);
      if (this.started) this.pump();
      return item;
    }
    registerVideo(url,priority,data) {
      return this.register(url,priority,data);
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
        item.manifest=deferred(); item.playable=deferred(); item.complete=deferred();
        item.available=new Map();item.canPlay=false;
        item.error=null;
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
    sheet(item,index) {
      if (item.blobs.has(index)) return Promise.resolve(item.blobs.get(index));
      if (item.state === 'error') return Promise.reject(item.error);
      if (!item.available.has(index)) item.available.set(index,deferred());
      return item.available.get(index).promise;
    }
    playable(item) {
      if (item.canPlay) return;
      const data=item.data;
      let frames=0;
      while (frames<data.frames.length && item.blobs.has(Math.floor(data.frames[frames]/data.tilesPerSheet))) ++frames;
      const ahead=frames/data.fps;
      if (ahead<Math.min(data.frames.length/data.fps,(data.replayStart || 0)+2.5)) return;
      const downloaded=[...item.blobs.values()].reduce((sum,blob)=>sum+blob.size,0);
      const remaining=data.sheetBytes
        ? data.sheetBytes.reduce((sum,size,index)=>sum+(item.blobs.has(index)?0:size),0)
        : downloaded/item.blobs.size*(data.sheets.length-item.blobs.size);
      const elapsed=Math.max(.05,(Date.now()-item.startedAt)/1000);
      // Begin only after a contiguous prefix and enough measured throughput to
      // finish downloading during this play. A margin absorbs small fluctuations.
      const runway=data.duration-(data.replayStart || 0)-1.5;
      if (remaining && remaining/(downloaded/elapsed)*1.1>runway) return;
      item.canPlay=true;item.playable.resolve(data);this.notify(item,'loading');
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
    async sheets(item) {
      let cursor=0, failure;
      const worker=async () => {
        while (!failure && cursor<item.data.sheets.length) {
          const index=cursor++;
          if (item.blobs.has(index)) continue;
          try {
            const url=new URL(item.data.sheets[index],item.url);
            url.search=item.url.search;
            item.blobs.set(index,await this.fetch(url,'blob'));
            item.available.get(index)?.resolve(item.blobs.get(index));
            this.playable(item);
            this.notify(item,'loading');
          } catch (error) { failure ||= error; }
        }
      };
      // Drain in-flight requests even after a failure. The next project must
      // never compete with unfinished downloads from the current one.
      await Promise.all(Array.from({length:Math.min(4,item.data.sheets.length)},worker));
      if (failure) throw failure;
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
            if (!item.data) {
              const data=await this.fetch(item.url,'json');
              if (!valid(data)) throw new Error('Invalid preview manifest');
              item.data=data;
            }
            item.manifest.resolve(item.data);
            this.notify(item,'loading');
            if (item.kind === 'video') {
              if (!item.blobs.has(0)) item.blobs.set(0,await this.fetch(item.url,'blob'));
              item.objectURL ||= URL.createObjectURL(item.blobs.get(0));
            } else await this.sheets(item);
            item.canPlay=true;item.playable.resolve(item.data);
            this.notify(item,'ready');
            item.complete.resolve(item.data);
          } catch (error) {
            item.error=error;
            this.notify(item,'error');
            item.manifest.reject(error); item.playable.reject(error);item.complete.reject(error);
            for (const pending of item.available.values()) pending.reject(error);
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
