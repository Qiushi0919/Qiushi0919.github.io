/* Check the actual image player, including clocks, buffering and stale loads. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../source/preview-frame-player.js'),'utf8');
function fixture({fail=false,defer=false,invalid=false,replayStart=0,loop=false,loopIntroExtra=0}={}){
 const frames=new Map(),images=[],draws=[],events=[];let next=0,time=0,fetches=0;
 const data={duration:2,replayStart,loopIntroExtra,fps:12,width:640,height:480,columns:4,tilesPerSheet:16,
  frames:Array.from({length:24},(_,i)=>i),sheets:invalid?['../bad.webp']:['sheet-000.webp','sheet-001.webp']};
 const canvas={dataset:{previewLoop:String(loop)},getContext:()=>({drawImage:(...args)=>draws.push(args)})};
 const window={};
 class Image {
  set src(value){this.url=value;images.push(this);if(!defer)queueMicrotask(()=>this.onload())}
 }
 vm.runInNewContext(source,{window,document:{baseURI:'https://example.test/competitions/'},URL,Image,
  Map,Number,Error,Promise,fetch:async()=>{fetches++;return {ok:!fail,json:async()=>data}},
  requestAnimationFrame:f=>{frames.set(++next,f);return next},cancelAnimationFrame:id=>frames.delete(id)});
 const player=new window.PortfolioFramePlayer(canvas,'/assets/preview/sequence.json?v=release',
  {playing:()=>events.push('playing'),ended:()=>events.push('ended'),error:()=>events.push('error')});
 const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
 return {player,canvas,draws,events,images,get fetches(){return fetches},data,
  async ready(){player.play();await settle()},
  async step(milliseconds=84){time+=milliseconds;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(time));await settle()},
  async load(){images.forEach(image=>image.onload());await settle()}};
}
(async()=>{
 let n=0;
 const a=fixture();assert.equal(a.fetches,0);n++;
 await a.ready();await a.step();await a.step();assert.equal(a.events.join(','),'playing');assert.equal(a.draws.length,1);assert.equal(a.player.elapsed,0);n++;
 assert.equal(a.images[0].url,'https://example.test/assets/preview/sheet-000.webp?v=release');n++;
 await a.step();assert.ok(a.player.elapsed>0);assert.equal(a.draws[1][1],640);assert.equal(a.draws[1][2],0);n++;
 a.player.pause();const elapsed=a.player.elapsed;await a.step(5000);assert.equal(a.player.elapsed,elapsed);assert.equal(a.player.images.size,0);n++;
 await a.ready();await a.step();await a.step();assert.equal(a.player.elapsed,elapsed);n++;
 for(let i=0;i<35;i++)await a.step();assert.equal(a.events.at(-1),'ended');assert.equal(a.player.running,false);assert.equal(a.canvas.dataset.previewTime,'0');assert.equal(a.canvas.dataset.previewFrame,undefined);n++;
 await a.ready();await a.step();await a.step();assert.equal(a.player.elapsed,0);assert.equal(a.events.at(-1),'playing');assert.equal(a.fetches,1);n++;
 const slow=fixture({defer:true});await slow.ready();await slow.step(5000);await slow.step(5000);assert.equal(slow.player.elapsed,0);assert.equal(slow.events.length,0);n++;
 slow.player.pause();await slow.load();assert.equal(slow.player.images.size,0);assert.equal(slow.events.length,0);n++;
 await slow.ready();await slow.step();await slow.load();await slow.step();assert.equal(slow.events[0],'playing');assert.equal(slow.player.elapsed,0);n++;
 const invalid=fixture({invalid:true});await invalid.ready();assert.equal(invalid.events[0],'error');assert.equal(invalid.images.length,0);assert.equal(invalid.player.running,false);n++;
 const failure=fixture({fail:true});await failure.ready();assert.equal(failure.events[0],'error');assert.equal(failure.canvas.dataset.previewTime,'0');n++;
 const replay=fixture({replayStart:1,defer:true});replay.player.play({skipCover:true});await Promise.resolve();await replay.step(5000);await replay.step(5000);assert.equal(replay.player.elapsed,1);await replay.load();await replay.step();assert.equal(replay.canvas.dataset.previewFrame,'12');assert.equal(replay.events[0],'playing');n++;
 const badStart=fixture({replayStart:3});await badStart.ready();assert.equal(badStart.events[0],'error');n++;
 const looping=fixture({loop:true});await looping.ready();for(let i=0;i<70;i++)await looping.step();assert.ok(Number(looping.canvas.dataset.previewLoops)>=2);assert.equal(looping.player.running,true);assert.deepEqual(looping.events,['playing']);assert.ok(looping.player.images.size<=3);n++;
 looping.player.pause();const loopTime=looping.player.elapsed;await looping.step(5000);assert.equal(looping.player.elapsed,loopTime);assert.equal(looping.player.images.size,0);await looping.ready();await looping.step();await looping.step();assert.equal(looping.player.elapsed,loopTime);assert.deepEqual(looping.events,['playing']);n++;
 looping.player.reset();assert.equal(looping.canvas.dataset.previewLoops,undefined);assert.equal(looping.canvas.dataset.previewFrame,undefined);n++;
 const longerIntro=fixture({loop:true,loopIntroExtra:1.2});await longerIntro.ready();await longerIntro.step();await longerIntro.step();await longerIntro.step(1000);await longerIntro.step(1000);assert.equal(longerIntro.canvas.dataset.previewLoops,'1');await longerIntro.step(600);await longerIntro.step(500);assert.equal(longerIntro.canvas.dataset.previewTime,'0.000');assert.equal(longerIntro.player.round,1);await longerIntro.step(200);assert.equal(longerIntro.canvas.dataset.previewTime,'0.100');assert.equal(longerIntro.events.includes('ended'),false);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'lazy loading, sprite cropping, versioned URLs, paused clock, buffering, completion reset, replay, bounded decoded images, stale loads and failure-to-cover'}));
})();
