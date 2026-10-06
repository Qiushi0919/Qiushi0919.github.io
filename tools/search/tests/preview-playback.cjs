/* Playback state transitions, independent of a browser or specific layout. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../source/preview-playback.js'),'utf8');
function scenario({top=450,bottom=750,popup=false,open=false,reduce=false,deny=false}={}){
 const events={},docEvents={},handlers={},clicks={},attrs={},frames=new Map(),mutations=[];let next=0;
 const rootClasses=new Set(),bodyClasses=new Set();
 const icon={textContent:''},label={textContent:''};
 const control={dataset:{},setAttribute:(k,v)=>attrs[k]=v,querySelector:s=>s.includes('icon')?icon:label,addEventListener:(e,f)=>clicks[e]=f};
 const media={dataset:{previewState:'poster'},querySelector:()=>control};
 const overlay={hidden:!open,getAttribute:()=>overlay.hidden?'true':'false'};
 let rect={top,bottom,left:0,right:400,width:400,height:bottom-top};
 const video={dataset:{src:'demo.mp4'},paused:true,currentTime:0,plays:0,deny,
  closest:s=>s==='.preview-media'?media:(popup?overlay:null),
  getBoundingClientRect:()=>rect,getAttribute:k=>k==='src'?attrs.src:null,
  addEventListener:(e,f)=>handlers[e]=f,pause(){this.paused=true},
  play(){this.plays++;if(this.deny)return Promise.reject(new Error('Denied'));this.paused=false;handlers.playing?.();return Promise.resolve()}};
 Object.defineProperty(video,'src',{set:v=>attrs.src=v});
 const nav={getBoundingClientRect:()=>({top:0,bottom:50}),style:{position:'sticky',top:'0px'}};
 const bar={getBoundingClientRect:()=>({top:50,bottom:90}),style:{position:'sticky',top:'50px'}};
 const motion={matches:reduce,addEventListener:(e,f)=>motion.changed=f};
 const root={dataset:{language:'zh'},classList:{contains:v=>rootClasses.has(v)}};
 const document={hidden:false,documentElement:root,body:{classList:{contains:v=>bodyClasses.has(v)}},
  querySelectorAll:s=>s.startsWith('.preview-media')?[video]:[nav,bar],addEventListener:(e,f)=>docEvents[e]=f};
 const window={visualViewport:{offsetLeft:0,offsetTop:0,width:400,height:600,addEventListener(){}},addEventListener:(e,f)=>events[e]=f};
 const raf=f=>{frames.set(++next,f);return next};
 vm.runInNewContext(source,{document,window,matchMedia:()=>motion,innerWidth:400,innerHeight:600,
  getComputedStyle:e=>e.style,requestAnimationFrame:raf,cancelAnimationFrame:i=>frames.delete(i),
  MutationObserver:class{constructor(f){mutations.push(f)}observe(){}},Number});
 const flush=()=>{while(frames.size){const fs=[...frames.values()];frames.clear();fs.forEach(f=>f())}};
 flush();
 return {video,media,control,rootClasses,bodyClasses,motion,document,overlay,
  move(t,b){rect={...rect,top:t,bottom:b,height:b-t};docEvents.scroll();flush()},
  view(){events['portfolio:workviewchange']();flush()},
  ended(){handlers.ended();flush()},
  click(){let stopped=false;clicks.click({stopPropagation(){stopped=true}});flush();assert.equal(stopped,true)},
  key(key){let stopped=false;clicks.keydown({key,stopPropagation(){stopped=true}});return stopped},
  changed(){mutations.forEach(f=>f());flush()},
  visible(){docEvents.visibilitychange();flush()},
  motionChanged(){motion.changed();flush()}};
}
(async()=>{
 let n=0;
 // The same full-visibility requirement applies without any mobile/view classes.
 const a=scenario();assert.equal(a.video.paused,true);assert.equal(a.video.plays,0);n++;
 a.move(60,360);assert.equal(a.video.plays,0);n++; // Behind sticky bars.
 a.move(90,390);assert.equal(a.video.paused,false);assert.equal(a.video.dataset.previewStarted,'true');assert.equal(a.video.loop,false);n++;
 a.video.currentTime=7;a.move(700,1000);assert.equal(a.video.paused,true);n++;
 a.move(450,750);assert.equal(a.video.paused,false);assert.equal(a.video.currentTime,7);n++;
 a.ended();assert.equal(a.video.currentTime,0);assert.equal(a.media.dataset.previewState,'poster');assert.equal(a.control.dataset.previewAction,'replay');n++;
 const endedPlays=a.video.plays;a.move(100,400);a.view();assert.equal(a.video.plays,endedPlays);assert.equal(a.video.paused,true);n++;
 a.click();assert.equal(a.video.paused,false);assert.equal(a.video.currentTime,0);assert.equal(a.video.dataset.previewFinished,undefined);n++;
 a.ended();a.view();assert.equal(a.media.dataset.previewState,'poster');assert.equal(a.video.paused,true);n++;
 const b=scenario();b.rootClasses.add('work-mobile');b.view();assert.equal(b.video.plays,0);b.move(100,400);assert.equal(b.video.paused,false);n++;
 const manual=scenario();manual.click();assert.equal(manual.video.paused,false);n++; // Explicit play can precede auto qualification.
 assert.equal(manual.key(' '),true);assert.equal(manual.key('Escape'),false);n++; // Space plays; Escape still reaches gallery close.
 const reduced=scenario({top:100,bottom:400,reduce:true});assert.equal(reduced.video.plays,0);reduced.click();assert.equal(reduced.video.paused,false);n++;
 const hidden=scenario({top:100,bottom:400});hidden.document.hidden=true;hidden.visible();assert.equal(hidden.video.paused,true);n++;
 const gallery=scenario({popup:true,top:30,bottom:330});assert.equal(gallery.video.plays,0);gallery.overlay.hidden=false;gallery.changed();assert.equal(gallery.video.paused,false);n++;
 hidden.document.hidden=false;hidden.bodyClasses.add('overlay-active');hidden.changed();assert.equal(hidden.video.paused,true);n++;
 gallery.ended();gallery.overlay.hidden=true;gallery.changed();gallery.overlay.hidden=false;gallery.changed();assert.equal(gallery.video.paused,true);assert.equal(gallery.media.dataset.previewState,'poster');n++;
 const denied=scenario({top:100,bottom:400,deny:true});await Promise.resolve();denied.move(100,400);assert.equal(denied.video.plays,1);denied.video.deny=false;denied.click();assert.equal(denied.video.paused,false);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'all-view full visibility, sticky occlusion, offscreen suspension, finish-to-cover latch, explicit replay, independent control, reduced motion, hidden tabs, expanded gallery and autoplay denial'}));
})();
