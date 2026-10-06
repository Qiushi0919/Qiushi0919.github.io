/* Delayed real requests prove that projects cannot download in parallel. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const queue=fs.readFileSync(path.join(__dirname,'../source/preview-load-queue.js'),'utf8');
const player=fs.readFileSync(path.join(__dirname,'../source/preview-frame-player.js'),'utf8');
const data={duration:2,fps:12,width:640,height:480,columns:4,tilesPerSheet:16,frames:Array.from({length:24},(_,i)=>i),sheets:['sheet-000.webp','sheet-001.webp']};
async function settle(){for(let i=0;i<60;i++)await Promise.resolve()}
function fixture({sheets=2,slow=false}={}){
 const media=sheets===2?data:{...data,duration:sheets*16/30,fps:30,
  frames:Array.from({length:sheets*16},(_,i)=>i),sheets:Array.from({length:sheets},(_,i)=>`sheet-${String(i).padStart(3,'0')}.webp`),sheetBytes:Array(sheets).fill(1024)};
 const requests=[],pending=[],frames=new Map(),events=[],images=[];let active=0,max=0,next=0,now=0,timeline=0;
 const window={};
 class Image {set src(value){images.push(this);queueMicrotask(()=>this.onload())}decode(){return Promise.resolve()}}
 const context={window,document:{baseURI:'https://example.test/'},URL,Image,AbortController,setTimeout,clearTimeout,Date:{now:()=>now},
  fetch:url=>new Promise((resolve,reject)=>{
   const name=String(url);requests.push(name);active++;max=Math.max(active,max);
   pending.push({name,finish(fail=false){active--;if(fail)reject(new Error('network failed'));else resolve({ok:true,json:async()=>media,blob:async()=>new Blob([new Uint8Array(1024)])})}});
  }),requestAnimationFrame:f=>{frames.set(++next,f);return next},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(queue+'\n'+player,context);
 const make=(name,priority)=>new window.PortfolioFramePlayer({dataset:{previewLoadOrder:String(priority)},getContext:()=>({drawImage(){}})},`/assets/preview-frames/${name}/sequence.json?v=release`,{playing:()=>events.push(name),ended(){},error:()=>events.push('error:'+name)});
 return {window,requests,pending,events,images,make,get active(){return active},get max(){return max},
  async download(fail=false,slot=0){assert.ok(pending.length);now+=slow?2000:500;pending.splice(slot,1)[0].finish(fail);await settle()},
  async step(delta=34){timeline+=delta;const batch=[...frames.values()];frames.clear();batch.forEach(f=>f(timeline));await settle()}};
}
(async()=>{
 let n=0;
 const a=fixture();
 const c=a.make('c-topic',2),e=a.make('battery-method',0),i=a.make('intel-cup',1),copy=a.make('battery-method',0);
 assert.equal(a.requests.length,0);n++;
 c.play();e.play();i.play();copy.play();await settle();
 assert.equal(a.requests.length,1);assert.ok(a.requests[0].includes('battery-method/sequence'));assert.equal(a.max,1);n++;
 await a.download();await a.step();assert.equal(a.images.length,0);assert.ok(a.pending[0].name.includes('battery-method/sheet-000'));n++;
 await a.download();await a.step();assert.equal(a.images.length,0);assert.ok(a.pending[0].name.includes('battery-method/sheet-001'));n++;
 await a.download();await a.step();await a.step();assert.equal(a.events.filter(x=>x==='battery-method').length,2);assert.ok(a.pending[0].name.includes('intel-cup/sequence'));n++;
 for(let k=0;k<6;k++)await a.download();
 assert.equal(a.max,2);assert.equal(a.active,0);assert.equal(a.requests.length,9);assert.deepEqual(a.requests.map(x=>x.split('/')[5]),['battery-method','battery-method','battery-method','intel-cup','intel-cup','intel-cup','c-topic','c-topic','c-topic']);n++;
 const count=a.requests.length;e.reset();copy.reset();e.play();copy.play();await settle();await a.step();await a.step();assert.equal(a.requests.length,count);n++;
 const failed=fixture();const first=failed.make('battery-method',0),second=failed.make('intel-cup',1);first.play();second.play();await settle();
 await failed.download();await failed.download();await failed.download(true);
 assert.ok(failed.events.includes('error:battery-method'));assert.ok(failed.pending[0].name.includes('intel-cup/sequence'));n++;
 for(let k=0;k<3;k++)await failed.download();first.play();await settle();assert.equal(failed.pending.length,1);assert.ok(failed.pending[0].name.includes('battery-method/sheet-001'));await failed.download();assert.equal(failed.max,2);n++;
 const paused=fixture();const p=paused.make('battery-method',0);p.play();await settle();p.pause();for(let k=0;k<3;k++)await paused.download();await paused.step();assert.equal(paused.images.length,0);assert.equal(paused.events.length,0);p.play();await settle();await paused.step();await paused.step();assert.deepEqual(paused.events,['battery-method']);assert.equal(paused.requests.length,3);n++;
 const long=fixture({sheets:25});const early=long.make('battery-method',0),later=long.make('intel-cup',1),expanded=long.make('battery-method',0);
 early.play();later.play();expanded.play();await settle();await long.download();assert.equal(long.pending.length,4);assert.equal(long.max,4);n++;
 // Completing later files first cannot start playback without frame zero.
 await long.download(false,3);await long.download(false,2);await long.download(false,1);await long.step();assert.equal(long.images.length,0);assert.equal(early.resource.canPlay,false);n++;
 while (!early.resource.canPlay) {await long.download();assert.ok(long.requests.every(url=>url.includes('battery-method')))}
 await long.step();await long.step();assert.equal(early.resource.state,'loading');assert.ok(early.resource.blobs.size<25);assert.equal(long.events.filter(x=>x==='battery-method').length,2);n++;
 const outstanding=long.window.PortfolioPreviewLoads.sheet(early.resource,24);let arrived=false;outstanding.then(()=>arrived=true);await settle();assert.equal(arrived,false);n++;
 while (early.resource.state!=='ready') await long.download();assert.equal(arrived,true);assert.ok(long.pending[0].name.includes('intel-cup/sequence'));n++;
 while (long.pending.length) await long.download();assert.equal(long.active,0);assert.equal(long.max,4);n++;
 const cold=fixture({sheets:25,slow:true});const slow=cold.make('battery-method',0);slow.play();await settle();await cold.download();for(let k=0;k<8;k++)await cold.download();assert.equal(slow.resource.canPlay,false);assert.equal(cold.images.length,0);n++;
 while (cold.pending.length)await cold.download();await cold.step();await cold.step();assert.equal(slow.resource.state,'ready');assert.ok(cold.events.includes('battery-method'));n++;
 const drain=fixture({sheets:25});const broken=drain.make('battery-method',0),following=drain.make('intel-cup',1);broken.play();following.play();await settle();await drain.download();await drain.download(true);assert.equal(drain.active,3);assert.ok(drain.requests.every(url=>url.includes('battery-method')));n++;
 for(let k=0;k<3;k++)await drain.download();assert.equal(broken.resource.state,'error');assert.ok(drain.pending[0].name.includes('intel-cup/sequence'));while(drain.pending.length)await drain.download();broken.play();await settle();assert.equal(drain.pending.length,4);assert.ok(drain.pending.every(r=>!r.name.includes('sheet-001')&&!r.name.includes('sheet-002')&&!r.name.includes('sheet-003')));while(drain.pending.length)await drain.download();assert.equal(broken.resource.state,'ready');assert.equal(drain.max,4);n++;
 const late=fixture({sheets:25});const active=late.make('battery-method',0);active.play();await settle();while(!active.resource.canPlay)await late.download();await late.step();await late.step();assert.ok(late.events.includes('battery-method'));await late.download(true);while(late.pending.length)await late.download();assert.equal(active.resource.state,'error');await assert.rejects(late.window.PortfolioPreviewLoads.sheet(active.resource,24));for(let k=0;k<170;k++)await late.step();assert.ok(late.events.includes('error:battery-method'));assert.equal(active.running,false);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'four concurrent files inside one ordered project, adaptive startup, contiguous prefix, conservative slow-network buffer, shared popup/replay cache, wait for missing frames, failure drain and partial retry'}));
})();
