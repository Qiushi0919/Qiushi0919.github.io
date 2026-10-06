/* Raster frames only: thumbnail playback never creates an HTML video player. */
(() => {
  class PreviewFramePlayer {
    constructor(canvas, url, callbacks) {
      this.canvas = canvas;
      this.url = new URL(url, document.baseURI);
      this.callbacks = callbacks;
      this.context = canvas.getContext('2d', {alpha:false});
      this.images = new Map();
      this.pending = new Map();
      this.elapsed = 0;
      this.running = false;
      this.epoch = 0;
      this.raf = 0;
      this.last = null;
      this.tile = -1;
      this.drawn = false;
    }
    async manifest() {
      if (this.data) return this.data;
      if (!this.loading) this.loading = fetch(this.url).then(response => {
        if (!response.ok) throw new Error('Preview manifest unavailable');
        return response.json();
      }).then(data => {
        if (!(data.duration > 0 && data.duration < 300 && data.fps > 0 && data.fps <= 30 &&
              data.width > 0 && data.width <= 1280 && data.height > 0 && data.height <= 1280 &&
              (data.replayStart === undefined || (Number.isFinite(data.replayStart) && data.replayStart >= 0 && data.replayStart < data.duration)) &&
              data.columns === 4 && data.tilesPerSheet === 16 && data.frames?.length && data.sheets?.length &&
              data.sheets.every(name => /^sheet-\d{3}\.webp$/.test(name)) &&
              data.frames.every(tile => Number.isInteger(tile) && tile >= 0 && tile < data.sheets.length * 16))) {
          throw new Error('Invalid preview manifest');
        }
        this.canvas.width = data.width;
        this.canvas.height = data.height;
        this.data = data;
        return data;
      }).catch(error => { this.loading = null; throw error; });
      return this.loading;
    }
    sheet(index) {
      if (this.images.has(index)) return Promise.resolve(this.images.get(index));
      if (this.pending.has(index)) return this.pending.get(index);
      const epoch = this.epoch;
      const url = new URL(this.data.sheets[index], this.url);
      url.search = this.url.search;
      const image = new Image();
      image.decoding = 'async';
      const pending = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Preview frame unavailable'));
        image.src = url.href;
      }).then(image => {
        // A paused/closed gallery must not retain decoded offscreen atlases.
        if (this.running && epoch === this.epoch) this.images.set(index, image);
        return image;
      }).finally(() => {
        if (this.pending.get(index) === pending) this.pending.delete(index);
      });
      this.pending.set(index, pending);
      return pending;
    }
    play({skipCover=false}={}) {
      if (this.running) return;
      this.running = true;
      const epoch = ++this.epoch;
      this.last = null;
      this.manifest().then(data => {
        if (this.running && epoch === this.epoch) {
          if (skipCover) this.elapsed = data.replayStart || 0;
          this.tick();
        }
      }).catch(error => {
        if (this.running && epoch === this.epoch) this.fail(error);
      });
    }
    tick() {
      this.raf = requestAnimationFrame(now => {
        this.raf = 0;
        if (!this.running) return;
        const data = this.data;
        // Buffering and pauses do not consume the demonstration's timeline.
        const elapsed = this.elapsed + (this.last === null ? 0 : Math.max(0, (now-this.last)/1000));
        this.last = now;
        if (elapsed >= data.duration) {
          this.reset();
          this.callbacks.ended();
          return;
        }
        const frame = Math.min(data.frames.length-1, Math.floor(elapsed * data.fps));
        const tile = data.frames[frame];
        const sheet = Math.floor(tile / data.tilesPerSheet);
        const image = this.images.get(sheet);
        if (image) {
          this.elapsed = elapsed;
          if (tile !== this.tile || !this.drawn) {
            const offset = tile % data.tilesPerSheet;
            this.context.drawImage(image, (offset % data.columns)*data.width,
              Math.floor(offset/data.columns)*data.height, data.width, data.height,
              0, 0, data.width, data.height);
            this.tile = tile;
          }
          this.canvas.dataset.previewFrame = String(frame);
          this.canvas.dataset.previewTime = this.elapsed.toFixed(3);
          if (!this.drawn) { this.drawn = true; this.callbacks.playing(); }
          const nextTile = data.frames.slice(frame+1,frame+17).find(tile => Math.floor(tile/data.tilesPerSheet) !== sheet);
          const nextSheet = nextTile === undefined ? sheet : Math.floor(nextTile/data.tilesPerSheet);
          for (const key of this.images.keys()) {
            if (key !== sheet && key !== nextSheet) this.images.delete(key);
          }
          if (nextSheet !== sheet && !this.images.has(nextSheet)) this.loadSheet(nextSheet);
        } else {
          this.last = null;
          this.loadSheet(sheet);
        }
        if (this.running) this.tick();
      });
    }
    loadSheet(sheet) {
      const epoch = this.epoch;
      this.sheet(sheet).catch(error => {
        if (this.running && epoch === this.epoch) this.fail(error);
      });
    }
    pause() {
      this.running = false;
      ++this.epoch;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.last = null;
      this.images.clear();
      this.pending.clear();
    }
    reset() {
      this.pause();
      this.elapsed = 0;
      this.tile = -1;
      this.drawn = false;
      this.canvas.dataset.previewTime = '0';
      delete this.canvas.dataset.previewFrame;
    }
    fail(error) {
      this.reset();
      this.callbacks.error(error);
    }
  }
  window.PortfolioFramePlayer = PreviewFramePlayer;
})();
