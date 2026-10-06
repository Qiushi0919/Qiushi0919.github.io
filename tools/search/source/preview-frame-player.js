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
      this.loop = canvas.dataset.previewLoop === 'true';
      this.round = 0;
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
              (data.loopIntroExtra === undefined || (Number.isFinite(data.loopIntroExtra) && data.loopIntroExtra >= 0 && data.loopIntroExtra <= 10)) &&
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
      }).then(async image => {
        if (typeof image.decode === 'function') await image.decode();
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
        let elapsed = this.elapsed + (this.last === null ? 0 : Math.max(0, (now-this.last)/1000));
        this.last = now;
        if (elapsed >= data.duration) {
          if (!this.loop) {
            this.reset();
            this.callbacks.ended();
            return;
          }
          let cycleDuration = data.duration + (this.round ? data.loopIntroExtra || 0 : 0);
          while (elapsed >= cycleDuration) {
            elapsed -= cycleDuration;
            ++this.round;
            cycleDuration = data.duration + (data.loopIntroExtra || 0);
          }
          this.canvas.dataset.previewLoops = String(this.round);
          this.elapsed = elapsed;
        }
        const frameTime = Math.max(0, elapsed - (this.loop && this.round ? data.loopIntroExtra || 0 : 0));
        const frame = Math.min(data.frames.length-1, Math.floor(frameTime * data.fps));
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
          this.canvas.dataset.previewTime = frameTime.toFixed(3);
          this.canvas.dataset.previewCycleTime = this.elapsed.toFixed(3);
          if (!this.drawn) { this.drawn = true; this.callbacks.playing(); }
          // At 30fps one atlas lasts only about half a second. Decode two
          // upcoming atlases in advance, including frame zero near a loop.
          const upcoming = data.frames.slice(frame+1, frame+1+Math.ceil(data.fps*1.5));
          if (this.loop && frame+upcoming.length+1 >= data.frames.length) upcoming.push(...data.frames.slice(0,32));
          const keep = new Set([sheet]);
          const ahead = this.loop ? 2 : 1;
          for (const tile of upcoming) {
            const index = Math.floor(tile/data.tilesPerSheet);
            if (!keep.has(index)) keep.add(index);
            if (keep.size === ahead+1) break;
          }
          for (const key of this.images.keys()) {
            if (!keep.has(key)) this.images.delete(key);
          }
          for (const index of keep) if (!this.images.has(index)) this.loadSheet(index);
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
      this.round = 0;
      this.canvas.dataset.previewTime = '0';
      delete this.canvas.dataset.previewFrame;
      delete this.canvas.dataset.previewLoops;
      delete this.canvas.dataset.previewCycleTime;
    }
    fail(error) {
      this.reset();
      this.callbacks.error(error);
    }
  }
  window.PortfolioFramePlayer = PreviewFramePlayer;
})();
