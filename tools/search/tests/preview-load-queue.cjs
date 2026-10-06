/* Delayed real requests prove that projects cannot download in parallel. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const queue=fs.readFileSync(path.join(__dirname,'../source/preview-load-queue.js'),'utf8');
const player=fs.readFileSync(path.join(__dirname,'../source/preview-frame-player.js'),'utf8');
const data={duration:2,fps:12,width:640,height:480,columns:4,tilesPerSheet:16,frames:Array.from({length:24},(_,i)=>i),sheets:['sheet-000.webp','sheet-001.webp']};
async function settle(){for(let i=0;i<60;i++)await Promise.resolve()}
function fixture(){
 const requests=[],pending=[],frames=new Map(),events=[],images=[];let active=0,max=0,next=0;
 const window={};
 class Image {set src(value){images.push(this);queueMicrotask(()=>this.onload())}decode(){return Promise.resolve()}}
 const context={window,document:{baseURI:'https://example.test/'},URL,Image,AbortController,setTimeout,clearTimeout,
  fetch:url=>new Promise((resolve,reject)=>{
   const name=String(url);requests.push(name);active++;max=Math.max(active,max);
   pending.push({name,finish(fail=false){active--;if(fail)reject(new Error('network failed'));else resolve({ok:true,json:async()=>data,blob:async()=>new Blob(['frame'])})}});
  }),requestAnimationFrame:f=>{frames.set(++next,f);return next},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(queue+'\n'+player,context);
 const make=(name,priority)=>new window.PortfolioFramePlayer({dataset:{previewLoadOrder:String(priority)},getContext:()=>({drawImage(){}})},`/assets/preview-frames/${name}/sequence.json?v=release`,{playing:()=>events.push(name),ended(){},error:()=>events.push('error:'+name)});
 return {window,requests,pending,events,images,make,get active(){return active},get max(){return max},
  async download(fail=false){assert.ok(pending.length);pending.shift().finish(fail);await settle()},
  async step(){const batch=[...frames.values()];frames.clear();batch.forEach(f=>f(0));await settle()}};
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
 assert.equal(a.max,1);assert.equal(a.active,0);assert.equal(a.requests.length,9);assert.deepEqual(a.requests.map(x=>x.split('/')[5]),['battery-method','battery-method','battery-method','intel-cup','intel-cup','intel-cup','c-topic','c-topic','c-topic']);n++;
 const count=a.requests.length;e.reset();copy.reset();e.play();copy.play();await settle();await a.step();await a.step();assert.equal(a.requests.length,count);n++;
 const failed=fixture();const first=failed.make('battery-method',0),second=failed.make('intel-cup',1);first.play();second.play();await settle();
 await failed.download();await failed.download();await failed.download(true);
 assert.ok(failed.events.includes('error:battery-method'));assert.ok(failed.pending[0].name.includes('intel-cup/sequence'));n++;
 for(let k=0;k<3;k++)await failed.download();first.play();await settle();assert.equal(failed.pending.length,1);assert.ok(failed.pending[0].name.includes('battery-method/sheet-001'));await failed.download();assert.equal(failed.max,1);n++;
 const paused=fixture();const p=paused.make('battery-method',0);p.play();await settle();p.pause();for(let k=0;k<3;k++)await paused.download();await paused.step();assert.equal(paused.images.length,0);assert.equal(paused.events.length,0);p.play();await settle();await paused.step();await paused.step();assert.deepEqual(paused.events,['battery-method']);assert.equal(paused.requests.length,3);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'one request at a time, ordered full-sequence buffering, no early playback, shared popup cache, cached replay, failure advancement/retry, pause during download'}));
})();
