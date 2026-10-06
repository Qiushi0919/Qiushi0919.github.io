/* Exercise the actual MP4 cache/decoder against delayed network and media events. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=['preview-load-queue.js','preview-video-player.js'].map(n=>fs.readFileSync(path.join(__dirname,'../source',n),'utf8')).join('\n');
const settle=async()=>{for(let i=0;i<80;i++)await Promise.resolve()};
function fixture({loop=false,replayStart=0,extra=0,rejectPlay=false}={}){
 const requests=[],pending=[],videos=[],events=[],draws=[],raf=new Map();let clock=0,id=0,objectURLs=0,failPlay=rejectPlay;
 class Media {
  constructor(){this.listeners=new Map();this.time=0;this.paused=true;this.ended=false;this.readyState=0;this.videoWidth=1280;this.videoHeight=720;this.attrs={}}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn)}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn)}
  emit(type){for(const fn of [...(this.listeners.get(type)||[])])fn()}
  setAttribute(name,value){this.attrs[name]=value}
  load(){queueMicrotask(()=>{this.readyState=2;this.emit('loadeddata')})}
  get currentTime(){return this.time}
  set currentTime(value){this.time=value;this.ended=false;this.seeking=true;queueMicrotask(()=>{this.seeking=false;this.emit('seeked')})}
  play(){if(failPlay)return Promise.reject(new Error('Autoplay blocked'));this.paused=false;return Promise.resolve()}
  pause(){this.paused=true}
 }
 class ObjectURL extends URL {static createObjectURL(){return 'blob:shared-'+(++objectURLs)}}
 const window={};
 vm.runInNewContext(source,{window,document:{baseURI:'https://example.test/',createElement(tag){assert.equal(tag,'video');const video=new Media();videos.push(video);return video}},URL:ObjectURL,
  AbortController,setTimeout,clearTimeout,fetch:url=>new Promise((resolve,reject)=>{
   requests.push(String(url));pending.push({finish(fail){if(fail)reject(new Error('Network failed'));else resolve({ok:true,blob:async()=>new Blob(['mp4'])})}})
  }),requestAnimationFrame:fn=>{raf.set(++id,fn);return id},cancelAnimationFrame:key=>raf.delete(key)});
 const make=(name,priority)=>{
  const canvas={width:640,height:360,dataset:{previewDuration:'2',previewReplayStart:String(replayStart),previewLoop:String(loop),previewLoopIntroExtra:String(extra),previewLoadOrder:String(priority)},getContext:()=>({drawImage:()=>draws.push(name)})};
  const player=new window.PortfolioVideoPlayer(canvas,`/assets/${name}.mp4?v=content`,{playing:()=>events.push('playing:'+name),ended:()=>events.push('ended:'+name),error:()=>events.push('error:'+name),time(){}});
  return {player,canvas};
 };
 return {window,requests,pending,videos,events,draws,make,get objectURLs(){return objectURLs},
  async download(fail=false){assert.ok(pending.length);pending.shift().finish(fail);await settle()},
  async step(delta=34){clock+=delta;for(const video of videos)if(!video.paused){video.time=Math.min(2,video.time+delta/1000);video.ended=video.time>=2;if(video.ended)video.paused=true}const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(clock));await settle()},
  allowPlay(){failPlay=false}};
}
(async()=>{
 let n=0;
 const a=fixture(),c=a.make('c',2),e=a.make('eecs',0),i=a.make('intel',1),copy=a.make('eecs',0);
 assert.equal(a.requests.length,0);assert.equal(a.videos.length,0);n++;
 c.player.play();e.player.play();copy.player.play();await settle();assert.deepEqual(a.requests,['https://example.test/assets/eecs.mp4?v=content']);assert.equal(a.videos.length,0);n++;
 let details=false;a.window.PortfolioPreviewLoads.afterPreviews(()=>details=true);await a.download();await a.step();
 assert.equal(a.requests.length,2);assert.ok(a.requests[1].includes('intel.mp4'));assert.equal(a.objectURLs,1);assert.equal(a.videos.length,2);assert.deepEqual(a.videos.map(v=>v.src),['blob:shared-1','blob:shared-1']);assert.equal(details,false);n++;
 assert.equal(e.canvas.width,1280);assert.equal(e.canvas.height,720);assert.ok(a.events.includes('playing:eecs'));assert.ok(a.videos.every(v=>v.muted && v.playsInline && !v.controls && v.attrs['webkit-playsinline']===''));n++;
 await a.download();assert.equal(details,false);assert.ok(a.requests[2].includes('/c.mp4'));await a.download();assert.equal(details,true);assert.equal(a.requests.length,3);n++;
 await a.step(400);e.player.pause();const elapsed=e.player.elapsed;await a.step(500);assert.equal(e.player.elapsed,elapsed);assert.equal(a.videos[0].paused,true);n++;
 await e.player.seek(1.4);assert.equal(e.canvas.dataset.previewTime,'1.400');assert.equal(e.player.running,false);assert.equal(a.requests.length,3);n++;
 e.player.play();await settle();await a.step(700);assert.ok(a.events.includes('ended:eecs'));assert.equal(e.canvas.dataset.previewTime,'0');assert.equal(e.player.running,false);n++;
 const count=a.requests.length;e.player.play();await settle();await a.step();assert.equal(a.requests.length,count);assert.equal(a.objectURLs,3);n++;
 const replay=fixture({replayStart:1}),r=replay.make('intel',0);r.player.play({skipCover:true});await settle();await replay.download();await replay.step();assert.ok(Number(r.canvas.dataset.previewTime)>=1);assert.equal(replay.requests.length,1);n++;
 r.player.reset();assert.equal(r.canvas.dataset.previewTime,'0');r.player.play({skipCover:true});await settle();await replay.step();assert.ok(Number(r.canvas.dataset.previewTime)>=1);assert.equal(replay.requests.length,1);n++;
 const looping=fixture({loop:true,extra:1.2}),l=looping.make('eecs',0);l.player.play();await settle();await looping.download();await looping.step(2000);assert.equal(l.canvas.dataset.previewLoops,'1');assert.equal(l.player.hold,1.2);assert.equal(l.player.duration(),3.2);n++;
 await looping.step();await looping.step(500);assert.equal(l.canvas.dataset.previewTime,'0.000');assert.equal(looping.videos[0].paused,true);await looping.step(800);assert.equal(looping.videos[0].paused,false);assert.equal(l.player.hold,0);n++;
 l.player.pause();await l.player.seek(.5);assert.equal(l.canvas.dataset.previewTime,'0.000');assert.ok(Math.abs(l.player.hold-.7)<.001);await l.player.seek(2.2);assert.equal(l.canvas.dataset.previewTime,'1.000');assert.equal(l.player.hold,0);assert.equal(looping.requests.length,1);n++;
 l.player.reset();assert.equal(l.canvas.dataset.previewLoops,undefined);assert.equal(l.player.duration(),2);n++;
 const stale=fixture(),s=stale.make('eecs',0);s.player.play();await settle();s.player.pause();await stale.download();await stale.step();assert.equal(s.player.drawn,false);assert.equal(stale.events.length,0);s.player.play();await settle();await stale.step();assert.equal(stale.requests.length,1);assert.equal(stale.events[0],'playing:eecs');n++;
 const fail=fixture(),f=fail.make('eecs',0),later=fail.make('intel',1);f.player.play();await settle();await fail.download(true);assert.equal(fail.events[0],'error:eecs');assert.ok(fail.requests[1].includes('intel'));await fail.download();f.player.play();await settle();await fail.download();await fail.step();assert.equal(fail.requests.length,3);assert.ok(fail.events.includes('playing:eecs'));n++;
 const denied=fixture({rejectPlay:true}),d=denied.make('eecs',0);d.player.play();await settle();await denied.download();assert.equal(denied.events[0],'error:eecs');assert.equal(d.player.running,false);denied.allowPlay();d.player.play();await settle();await denied.step();assert.equal(denied.requests.length,1);assert.ok(denied.events.includes('playing:eecs'));n++;
 const late=fixture(),first=late.make('eecs',0);first.player.play();await settle();await late.download();const registered=late.make('intel',1);await settle();assert.equal(late.requests.length,2);assert.ok(late.requests[1].endsWith('intel.mp4?v=content'));await late.download();registered.player.play();await settle();await late.step();assert.ok(late.events.includes('playing:intel'));n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'ordered one-file MP4 cache, shared Blob URL, detail assets after previews, inline detached decoder, full-resolution Canvas, pause/seek/replay, longer loop intro, failure retry and stale/autoplay handling'}));
})();
