/* Playback state transitions, independent of a browser or specific layout. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../source/preview-playback.js'),'utf8');
function scenario({top=450,bottom=750,popup=false,open=false,reduce=false,deny=false,defer=false,noControl=false,transport=false}={}){
 const events={},docEvents={},handlers={},clicks={},attrs={},frames=new Map(),mutations=[];let next=0;
 const rootClasses=new Set(),bodyClasses=new Set();
 const icon={textContent:''},label={textContent:''};
 const control={dataset:{},setAttribute:(k,v)=>attrs[k]=v,querySelector:s=>s.includes('icon')?icon:label,addEventListener:(e,f)=>clicks[e]=f};
 const transportEvents={},toggleEvents={};
 const range={value:'0',setAttribute(){},addEventListener:(e,f)=>transportEvents[e]=f},toggle={setAttribute(){},addEventListener:(e,f)=>toggleEvents[e]=f},time={};
 const media={dataset:{previewState:'poster'},querySelector:s=>s==='[data-preview-play]'&&!noControl?control:transport?({'[data-preview-toggle]':toggle,'[data-preview-seek]':range,'[data-preview-time]':time}[s]||null):null};
 const overlay={hidden:!open,getAttribute:()=>overlay.hidden?'true':'false',
  getBoundingClientRect:()=>({top:20,bottom:580,left:0,right:400}),
  querySelector:()=>({getBoundingClientRect:()=>({top:20,bottom:60})})};
 let rect={top,bottom,left:0,right:400,width:400,height:bottom-top};
 const canvas={dataset:{previewSequence:'demo.json'},closest:s=>s==='.preview-media'?media:(popup?overlay:null),getBoundingClientRect:()=>rect};
 let player;
 class FakePlayer {
  constructor(c,url,callbacks){player=this;this.canvas=c;this.callbacks=callbacks;this.running=false;this.currentTime=0;this.plays=0;this.deny=deny}
  pause(){this.running=false}
  reset(){this.pause();this.currentTime=0}
  play(options){this.skipCover=options?.skipCover;this.plays++;if(this.deny){this.callbacks.error();return}this.running=true;if(!defer){this.drawn=true;this.callbacks.playing()}}
  async seek(value){this.currentTime=Number(value);this.callbacks.time(this.currentTime,12);this.drawn=true;this.callbacks.playing()}
 }
 const nav={getBoundingClientRect:()=>({top:0,bottom:50}),style:{position:'sticky',top:'0px'}};
 const bar={getBoundingClientRect:()=>({top:50,bottom:90}),style:{position:'sticky',top:'50px'}};
 const motion={matches:reduce,addEventListener:(e,f)=>motion.changed=f};
 const root={dataset:{language:'zh'},classList:{contains:v=>rootClasses.has(v)}};
 const document={hidden:false,documentElement:root,body:{classList:{contains:v=>bodyClasses.has(v)}},
  querySelectorAll:s=>s.startsWith('.preview-media')?[canvas]:[nav,bar],addEventListener:(e,f)=>docEvents[e]=f};
 const window={PortfolioFramePlayer:FakePlayer,visualViewport:{offsetLeft:0,offsetTop:0,width:400,height:600,addEventListener(){}},addEventListener:(e,f)=>events[e]=f};
 const raf=f=>{frames.set(++next,f);return next};
 vm.runInNewContext(source,{document,window,matchMedia:()=>motion,innerWidth:400,innerHeight:600,
  getComputedStyle:e=>e.style,requestAnimationFrame:raf,cancelAnimationFrame:i=>frames.delete(i),
  MutationObserver:class{constructor(f){mutations.push(f)}observe(){}},Number});
 const flush=()=>{while(frames.size){const fs=[...frames.values()];frames.clear();fs.forEach(f=>f())}};
 flush();
 return {canvas,player,media,control,attrs,label,rootClasses,bodyClasses,motion,document,overlay,toggle,time,
  toggle(){toggleEvents.click({stopPropagation(){}});flush()},
  seek(value){transportEvents.pointerdown();range.value=String(value);transportEvents.input();transportEvents.change();flush()},
  move(t,b){rect={...rect,top:t,bottom:b,height:b-t};docEvents.scroll();flush()},
  view(){events['portfolio:workviewchange']();flush()},
  ended(){player.callbacks.ended();flush()},
  click(){let stopped=false;clicks.click({stopPropagation(){stopped=true}});flush();assert.equal(stopped,true)},
  key(key){let stopped=false;clicks.keydown({key,stopPropagation(){stopped=true}});return stopped},
  changed(){mutations.forEach(f=>f());flush()},
  visible(){docEvents.visibilitychange();flush()},
  motionChanged(){motion.changed();flush()}};
}
(async()=>{
 let n=0;
 // The same full-visibility requirement applies without any mobile/view classes.
 const a=scenario();assert.equal(a.player.running,false);assert.equal(a.player.plays,0);n++;
 a.move(60,360);assert.equal(a.player.plays,0);n++; // Behind sticky bars.
 a.move(90,390);assert.equal(a.player.running,true);assert.equal(a.canvas.dataset.previewStarted,'true');n++;
 a.player.currentTime=7;a.move(700,1000);assert.equal(a.player.running,false);n++;
 a.move(450,750);assert.equal(a.player.running,true);assert.equal(a.player.currentTime,7);n++;
 a.ended();assert.equal(a.player.currentTime,0);assert.equal(a.media.dataset.previewState,'poster');assert.equal(a.control.dataset.previewAction,'replay');n++;
 const endedPlays=a.player.plays;a.move(100,400);a.view();assert.equal(a.player.plays,endedPlays);assert.equal(a.player.running,false);n++;
 a.click();assert.equal(a.player.running,true);assert.equal(a.player.currentTime,0);assert.equal(a.canvas.dataset.previewFinished,undefined);n++;
 a.ended();a.view();assert.equal(a.media.dataset.previewState,'poster');assert.equal(a.player.running,false);n++;
 const b=scenario();b.rootClasses.add('work-mobile');b.view();assert.equal(b.player.plays,0);b.move(100,400);assert.equal(b.player.running,true);n++;
 const manual=scenario();manual.click();assert.equal(manual.player.running,true);n++; // Explicit play can precede auto qualification.
 assert.equal(manual.key(' '),true);assert.equal(manual.key('Escape'),false);n++; // Space plays; Escape still reaches gallery close.
 const reduced=scenario({top:100,bottom:400,reduce:true});assert.equal(reduced.player.plays,0);reduced.click();assert.equal(reduced.player.running,true);n++;
 const hidden=scenario({top:100,bottom:400});hidden.document.hidden=true;hidden.visible();assert.equal(hidden.player.running,false);n++;
 const gallery=scenario({popup:true,top:30,bottom:330});assert.equal(gallery.player.plays,0);gallery.overlay.hidden=false;gallery.changed();assert.equal(gallery.player.running,false);gallery.move(60,330);assert.equal(gallery.player.running,true);n++;
 hidden.document.hidden=false;hidden.bodyClasses.add('overlay-active');hidden.changed();assert.equal(hidden.player.running,false);n++;
 gallery.ended();gallery.overlay.hidden=true;gallery.changed();gallery.overlay.hidden=false;gallery.changed();assert.equal(gallery.player.running,false);assert.equal(gallery.media.dataset.previewState,'poster');n++;
 const denied=scenario({top:100,bottom:400,deny:true});await Promise.resolve();denied.move(100,400);assert.equal(denied.player.plays,1);denied.player.deny=false;denied.click();assert.equal(denied.player.running,true);n++;
 const slow=scenario({defer:true});slow.click();assert.equal(slow.media.dataset.previewState,'loading');assert.equal(slow.label.textContent,'加载中');assert.equal(slow.attrs['aria-busy'],'true');assert.equal(slow.player.skipCover,true);const starts=slow.player.plays;slow.click();slow.click();assert.equal(slow.player.plays,starts);slow.player.callbacks.playing();assert.equal(slow.media.dataset.previewState,'playing');assert.equal(slow.attrs['aria-busy'],'false');n++;
 const automaticOnly=scenario({top:100,bottom:400,noControl:true});assert.equal(automaticOnly.player.running,true);automaticOnly.ended();automaticOnly.move(100,400);assert.equal(automaticOnly.media.dataset.previewState,'poster');assert.equal(automaticOnly.player.plays,1);n++;
 const clipped=scenario({popup:true,open:true,top:100,bottom:590});assert.equal(clipped.player.plays,0);clipped.move(100,570);assert.equal(clipped.player.plays,1);n++;
 const controls=scenario({popup:true,open:true,top:100,bottom:400,transport:true,noControl:true});controls.toggle();assert.equal(controls.player.running,false);controls.seek(6);await Promise.resolve();assert.equal(controls.player.currentTime,6);assert.equal(controls.player.running,false);controls.changed();assert.equal(controls.player.running,false);controls.toggle();assert.equal(controls.player.running,true);assert.equal(controls.player.currentTime,6);n++;
 controls.seek(9);await Promise.resolve();assert.equal(controls.player.currentTime,9);assert.equal(controls.player.running,true);assert.equal(controls.time.textContent,'0:09 / 0:12');n++;
 const boot=scenario({top:100,bottom:400});boot.rootClasses.add('portfolio-loading');boot.changed();assert.equal(boot.player.running,false);boot.rootClasses.delete('portfolio-loading');boot.changed();assert.equal(boot.player.running,true);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'all-view full visibility, sticky occlusion, offscreen suspension, finish-to-cover latch, explicit replay, independent control, reduced motion, hidden tabs, expanded gallery and frame loading failure'}));
})();
