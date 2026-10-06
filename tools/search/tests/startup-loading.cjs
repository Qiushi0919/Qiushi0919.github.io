const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../source/startup-loading.js'),'utf8');
function fixture({ready=false,imagesReady=true,none=false}={}){
 let now=0,next=0;const timers=new Map(),intervals=new Map(),classes=new Set(['portfolio-loading']),events=[];
 const region={setAttribute(k,v){this[k]=v}},title={},subtitle={},timer={},track={setAttribute(k,v){this[k]=v}},progress={style:{}},loader={closest:()=>region,querySelector:s=>s.includes('title')?title:subtitle,setAttribute(k,v){this[k]=v}};
 const image={complete:imagesReady,addEventListener(type,fn){this[type]=fn}};
 let complete;const loading=new Promise(resolve=>complete=resolve);
 const first=none?null:{state:ready?'ready':'loading',data:{sheets:['a','b']},blobs:new Map(ready?[[0,1],[1,1]]:[[0,1]])};
 const elements={portfolioLoader:loader,loaderTimer:timer,loaderTrack:track,loaderProgress:progress};
 const root={dataset:{language:'zh'},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 vm.runInNewContext(source,{document:{documentElement:root,getElementById:id=>elements[id],querySelector:()=>image},
  window:{portfolioLoadStartedAt:0,PortfolioPreviewLoads:{ordered:()=>first?[first]:[],start:()=>ready||none?Promise.resolve():loading},dispatchEvent:e=>events.push(e.type)},
  performance:{now:()=>now},Event:class{constructor(type){this.type=type}},matchMedia:()=>({matches:false}),
  setTimeout:(fn,delay)=>{timers.set(++next,{fn,time:now+delay});return next},clearTimeout:id=>timers.delete(id),
  setInterval:fn=>{intervals.set(++next,fn);return next},clearInterval:id=>intervals.delete(id)});
 const settle=async()=>{for(let k=0;k<20;k++)await Promise.resolve()};
 return {classes,events,loader,timer,progress,track,image,complete,async advance(ms){now+=ms;for(const [id,item] of [...timers])if(item.time<=now){timers.delete(id);item.fn()}for(const fn of intervals.values())fn();await settle()}};
}
(async()=>{
 const slow=fixture();await slow.advance(4999);assert.ok(slow.classes.has('portfolio-loading'));assert.equal(slow.progress.style.width,'50%');await slow.advance(1);assert.ok(!slow.classes.has('portfolio-loading'));assert.equal(slow.loader['aria-hidden'],'true');assert.deepEqual(slow.events,['portfolio:ready']);
 const fast=fixture({ready:true});await fast.advance(239);assert.ok(fast.classes.has('portfolio-loading'));await fast.advance(1);assert.ok(fast.classes.has('portfolio-ready'));assert.equal(fast.progress.style.width,'100%');
 const waitingImage=fixture({ready:true,imagesReady:false});await waitingImage.advance(240);assert.ok(waitingImage.classes.has('portfolio-loading'));waitingImage.image.error();await waitingImage.advance(1);assert.ok(waitingImage.classes.has('portfolio-ready'));
 const empty=fixture({none:true});await empty.advance(240);assert.ok(empty.classes.has('portfolio-ready'));
 console.log(JSON.stringify({status:'passed',scenarios:4,checks:'five-second timeout, early ready after minimum display, key image failure, pages with no animation'}));
})();
