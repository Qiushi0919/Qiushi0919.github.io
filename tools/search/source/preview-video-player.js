/* Decode the smaller MP4 into Canvas. The detached, muted inline decoder has
   no visible native controls or hit area. List/gallery share one cached Blob. */
(() => {
  class PreviewVideoPlayer {
    constructor(canvas,url,callbacks) {
      this.canvas=canvas;this.callbacks=callbacks;
      this.context=canvas.getContext('2d',{alpha:false});
      this.running=false;this.drawn=false;this.elapsed=0;this.round=0;
      this.epoch=0;this.raf=0;this.last=null;this.hold=0;
      this.loop=canvas.dataset.previewLoop==='true';
      this.data={duration:Number(canvas.dataset.previewDuration),replayStart:Number(canvas.dataset.previewReplayStart)||0,
        loopIntroExtra:Number(canvas.dataset.previewLoopIntroExtra)||0,width:canvas.width,height:canvas.height,
        bytes:Number(canvas.dataset.previewBytes)||0};
      this.resource=window.PortfolioPreviewLoads.registerVideo(new URL(url,document.baseURI),
        Number(canvas.dataset.previewLoadOrder),this.data);
      window.PortfolioPreviewLoads.subscribe(this.resource,item=>{
        canvas.dataset.previewBuffer=item.state;
        canvas.dataset.previewPlayable=String(item.canPlay);
        callbacks.buffering?.(item.state,item.data,item.canPlay,item);
      });
      callbacks.time?.(0,this.duration());
    }
    async decoder() {
      if (this.video?.readyState>=2) return this.video;
      if (this.loading) return this.loading;
      this.loading=this.resource.complete.promise.then(()=>new Promise((resolve,reject)=>{
        const video=this.video ||= document.createElement('video');
        video.muted=true;video.defaultMuted=true;video.playsInline=true;
        video.controls=false;video.preload='auto';
        video.disablePictureInPicture=true;video.disableRemotePlayback=true;
        video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
        video.setAttribute('controlslist','nodownload nofullscreen noremoteplayback');
        const done=()=>{
          cleanup();
          this.canvas.width=video.videoWidth;this.canvas.height=video.videoHeight;
          resolve(video);
        };
        const error=()=>{cleanup();reject(new Error('Preview decoder unavailable'))};
        const cleanup=()=>{video.removeEventListener('loadeddata',done);video.removeEventListener('error',error)};
        video.addEventListener('loadeddata',done,{once:true});video.addEventListener('error',error,{once:true});
        video.src=this.resource.objectURL;video.load();
        // Some phone browsers defer decoded data until play(), even for a
        // completely cached Blob. Prime the muted inline decoder to avoid a
        // loadeddata/play deadlock; no frame is shown until the Canvas draws.
        video.play().then(()=>{
          if (!this.running) video.pause();
          if (video.readyState>=2) done();
        }).catch(error);
      })).catch(error=>{this.loading=null;throw error});
      return this.loading;
    }
    play({skipCover=false}={}) {
      if (this.running) return;
      this.running=true;this.last=null;
      const epoch=++this.epoch;
      window.PortfolioPreviewLoads.request(this.resource);
      this.decoder().then(async video=>{
        if (!this.running || epoch!==this.epoch) return;
        if (skipCover) { this.hold=0;this.elapsed=this.data.replayStart;await this.position(this.elapsed); }
        if (!this.running || epoch!==this.epoch) return;
        if (!this.hold) await video.play();
        if (this.running && epoch===this.epoch) this.tick();else if (!this.running) video.pause();
      }).catch(error=>{if(this.running && epoch===this.epoch)this.fail(error)});
    }
    position(seconds) {
      const video=this.video;
      if (Math.abs(video.currentTime-seconds)<.001 && !video.seeking) return Promise.resolve();
      return new Promise((resolve,reject)=>{
        const done=()=>{cleanup();resolve()};
        const error=()=>{cleanup();reject(new Error('Preview seek unavailable'))};
        const cleanup=()=>{video.removeEventListener('seeked',done);video.removeEventListener('error',error)};
        video.addEventListener('seeked',done,{once:true});video.addEventListener('error',error,{once:true});
        video.currentTime=seconds;
      });
    }
    draw() {
      const video=this.video;
      if (!video || video.readyState<2 || video.seeking) return;
      this.context.drawImage(video,0,0,this.canvas.width,this.canvas.height);
      this.canvas.dataset.previewTime=video.currentTime.toFixed(3);
      this.canvas.dataset.previewCycleTime=this.elapsed.toFixed(3);
      this.callbacks.time?.(this.elapsed,this.duration());
      if (!this.drawn) {this.drawn=true;this.callbacks.playing()}
    }
    tick() {
      this.raf=requestAnimationFrame(now=>{
        this.raf=0;
        if (!this.running) return;
        const video=this.video;
        if (this.hold>0) {
          this.hold=Math.max(0,this.hold-(this.last===null?0:Math.max(0,(now-this.last)/1000)));
          this.elapsed=this.data.loopIntroExtra-this.hold;
          if (!this.hold) video.play().catch(error=>this.fail(error));
        } else {
          this.elapsed=video.currentTime+(this.loop && this.round?this.data.loopIntroExtra:0);
          if (video.ended) {
            if (!this.loop) {this.reset();this.callbacks.ended();return}
            const epoch=this.epoch;
            ++this.round;this.canvas.dataset.previewLoops=String(this.round);
            this.hold=this.data.loopIntroExtra;this.elapsed=0;this.last=null;
            this.position(0).then(()=>{
              if (!this.running || epoch!==this.epoch) return;
              if (!this.hold) video.play().catch(error=>this.fail(error));
              this.tick();
            }).catch(error=>{if(this.running && epoch===this.epoch)this.fail(error)});
            return;
          }
        }
        this.last=now;this.draw();
        if (this.running) this.tick();
      });
    }
    duration() {return this.data.duration+(this.loop && this.round?this.data.loopIntroExtra:0)}
    async seek(seconds) {
      if (this.resource.state!=='ready') return;
      const epoch=this.epoch,serial=this.seekSerial=(this.seekSerial||0)+1;
      this.elapsed=Math.max(0,Math.min(this.duration()-.001,Number(seconds)||0));
      const extra=this.loop && this.round?this.data.loopIntroExtra:0;
      this.hold=Math.max(0,extra-this.elapsed);this.last=null;
      await this.decoder();await this.position(Math.max(0,this.elapsed-extra));
      if (epoch===this.epoch && serial===this.seekSerial) this.draw();
    }
    pause() {
      this.running=false;++this.epoch;cancelAnimationFrame(this.raf);this.raf=0;this.last=null;
      this.video?.pause();
    }
    reset() {
      this.pause();this.elapsed=0;this.drawn=false;this.round=0;this.hold=0;
      if (this.video) this.video.currentTime=0;
      this.canvas.dataset.previewTime='0';
      delete this.canvas.dataset.previewLoops;delete this.canvas.dataset.previewCycleTime;
      this.callbacks.time?.(0,this.duration());
    }
    fail(error) {this.reset();this.callbacks.error(error)}
  }
  window.PortfolioVideoPlayer=PreviewVideoPlayer;
})();
