/* Check the maintained gallery code after the builder's subset/lazy transforms. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const runtime=fs.readFileSync(path.join(__dirname,'../build/cn/assets/js/portfolio-runtime.js'),'utf8');
const start=runtime.indexOf('    const hydrateOverlay = '),end=runtime.indexOf('    const closeOpenProject',start);
assert.ok(start>=0 && end>start);
function fixture(ready){
 const waiting=[];
 const queue={afterPreviews(fn){if(ready)fn();else waiting.push(fn)}};
 const make=()=>{
  const img={tagName:'IMG',dataset:{src:'/figure.webp'},removeAttribute(){delete this.dataset.src}};
  const video={tagName:'VIDEO',dataset:{src:'/demo.mp4'},loads:0,pauses:0,removeAttribute(){delete this.dataset.src},load(){this.loads++},pause(){this.pauses++}};
  const attrs={'aria-hidden':'true'};
  return {img,video,card:{classList:{toggle(){}}},trigger:{setAttribute(){}},overlay:{setAttribute:(key,value)=>attrs[key]=value,getAttribute:key=>attrs[key],querySelectorAll:s=>s==='video'?[video]:[img,video].filter(m=>m.dataset.src)}};
 };
 const a=make(),b=make(),context={window:{PortfolioPreviewLoads:queue},projects:[a,b],syncBackdrop(){}};
 vm.runInNewContext(runtime.slice(start,end)+'\nthis.open=project=>setOpen(project,true);this.close=project=>setOpen(project,false);',context);
 return {a,b,open:context.open,close:context.close,flush(){ready=true;waiting.splice(0).forEach(fn=>fn())}};
}
let n=0;
const warm=fixture(true);warm.open(warm.a);assert.equal(warm.a.img.src,'/figure.webp');assert.equal(warm.a.img.loading,'eager');assert.equal(warm.a.video.loads,1);assert.equal(warm.a.video.preload,'metadata');n++;
warm.open(warm.a);assert.equal(warm.a.video.loads,1);assert.equal(warm.b.img.src,undefined);n++;
const cold=fixture(false);cold.open(cold.a);assert.equal(cold.a.img.src,undefined);assert.equal(cold.a.video.loads,0);assert.equal(cold.a.overlay.getAttribute('aria-hidden'),'false');cold.flush();assert.equal(cold.a.img.src,'/figure.webp');assert.equal(cold.a.video.loads,1);n++;
const closed=fixture(false);closed.open(closed.a);closed.close(closed.a);closed.flush();assert.equal(closed.a.img.src,undefined);assert.equal(closed.a.video.loads,0);n++;
const switched=fixture(false);switched.open(switched.a);switched.open(switched.b);switched.flush();assert.equal(switched.a.img.src,undefined);assert.equal(switched.b.img.src,'/figure.webp');n++;
closed.open(closed.a);assert.equal(closed.a.video.loads,1);assert.equal(closed.a.img.src,'/figure.webp');n++;
console.log(JSON.stringify({status:'passed',scenarios:n,checks:'warm cache opening order, cold deferred hydration, no duplicate loads, closed/superseded panel cancellation, metadata-only original videos'}));
