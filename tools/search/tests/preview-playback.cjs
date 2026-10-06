/* Meaningful playback policy regression scenarios; no browser automation here. */
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname,'../source/preview-playback.js'),'utf8');
function scenario({large=true,mobile=true,top=450,bottom=750,time=0}={}) {
  const events = {}, docEvents = {}, handlers = {}, attrs = {'data-src':'demo.mp4'};
  const frames = new Map(); let next=0;
  const classes = new Set(mobile?['work-mobile']:[]);
  const collection={dataset:{workView:large?'large':'overview'}};
  const bodyClasses=new Set();
  const button={dataset:{previewState:'poster'}};
  let rect={top,bottom,left:0,right:400,width:400,height:bottom-top};
  const video={parentElement:button,dataset:{src:'demo.mp4'},paused:true,currentTime:time,plays:0,
    getBoundingClientRect:()=>rect,getAttribute:name=>attrs[name]||null,
    addEventListener:(event,fn)=>handlers[event]=fn,
    pause(){this.paused=true},play(){this.paused=false;this.plays++;handlers.playing?.();return Promise.resolve()}};
  Object.defineProperty(video,'src',{set:value=>attrs.src=value});
  const nav={getBoundingClientRect:()=>({top:0,bottom:50}),style:{position:'sticky',top:'0px'}};
  const bar={getBoundingClientRect:()=>({top:50,bottom:90}),style:{position:'sticky',top:'50px'}};
  const motion={matches:false,addEventListener:(event,fn)=>motion.changed=fn};
  const document={hidden:false,documentElement:{classList:{contains:value=>classes.has(value)}},body:{classList:{contains:value=>bodyClasses.has(value)}},
    querySelectorAll:selector=>selector.startsWith('article')?[video]:[nav,bar],querySelector:()=>collection,
    addEventListener:(event,fn)=>docEvents[event]=fn};
  const window={visualViewport:{offsetLeft:0,offsetTop:0,width:400,height:600,addEventListener(){}},addEventListener:(event,fn)=>events[event]=fn};
  const requestAnimationFrame=fn=>{frames.set(++next,fn);return next};
  const context={document,window,matchMedia:()=>motion,innerWidth:400,innerHeight:600,
    getComputedStyle:el=>el.style,requestAnimationFrame,cancelAnimationFrame:id=>frames.delete(id),
    MutationObserver:class {constructor(fn){this.fn=fn}observe(){}},Number,WeakSet};
  vm.runInNewContext(source,context);
  const flush=()=>{while(frames.size){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn())}};
  flush();
  return {video,button,collection,classes,bodyClasses,motion,document,
    move(top,bottom){rect={...rect,top,bottom,height:bottom-top};events.scroll();flush()},
    change(view){collection.dataset.workView=view;events['portfolio:workviewchange']();flush()},
    motionChanged(){motion.changed();flush()},visibilityChanged(){docEvents.visibilitychange();flush()}};
}
let checked=0;
const first=scenario();
assert.equal(first.video.paused,true);assert.equal(first.video.currentTime,0);assert.equal(first.button.dataset.previewState,'poster');checked++;
first.move(60,360); // Entire image inside viewport, but top is behind sticky bars.
assert.equal(first.video.paused,true);assert.equal(first.video.dataset.largeStarted,undefined);checked++;
first.move(90,390);assert.equal(first.video.paused,false);assert.equal(first.video.dataset.largeStarted,'true');checked++;
first.video.currentTime=7;first.move(700,1000);assert.equal(first.video.paused,true);checked++;
first.move(450,750);assert.equal(first.video.paused,false);assert.equal(first.video.currentTime,7);checked++;
const switched=scenario({large:false,time:8});assert.equal(switched.video.paused,false);assert.equal(switched.video.dataset.largeStarted,undefined);checked++;
switched.change('large');assert.equal(switched.video.paused,true);assert.equal(switched.video.currentTime,0);assert.equal(switched.button.dataset.previewState,'poster');checked++;
switched.move(100,400);assert.equal(switched.video.paused,false);assert.equal(switched.video.currentTime,0);checked++;
switched.video.currentTime=9;switched.change('overview');switched.change('large');assert.equal(switched.video.currentTime,9);checked++;
const desktop=scenario({mobile:false});assert.equal(desktop.video.paused,false);assert.equal(desktop.video.dataset.largeStarted,undefined);checked++;
desktop.motion.matches=true;desktop.motionChanged();assert.equal(desktop.video.paused,true);assert.equal(desktop.button.dataset.previewState,'poster');checked++;
first.document.hidden=true;first.visibilityChanged();assert.equal(first.video.paused,true);checked++;
console.log(JSON.stringify({status:'passed',scenarios:checked,checks:'partial appearance, sticky occlusion, first full appearance, offscreen pause, latched resumption, Overview-to-Large reset, desktop autoplay, reduced motion, hidden tab'}));
