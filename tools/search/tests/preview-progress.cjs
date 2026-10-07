/* Stream actual bytes through the shared queue; do not invent timer progress. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../source/preview-load-queue.js'),'utf8');
const settle=async()=>{for(let i=0;i<50;i++)await Promise.resolve()};
function fixture({header=10,bytes=10,stream=true,two=true}={}) {
 const requests=[],pending=[],window={};let urls=0;
 class ObjectURL extends URL {static createObjectURL(){return 'blob:'+ ++urls}}
 vm.runInNewContext(source,{window,URL:ObjectURL,Blob,AbortController,setTimeout,clearTimeout,
  fetch:async url=>{
   requests.push(String(url));
   let receive;const input={released:false,push:(size)=>receive({done:false,value:new Uint8Array(size)}),end:()=>receive({done:true}),fail:()=>receive(Promise.reject(new Error('disconnected')))};
   pending.push(input);
   return {ok:true,headers:{get:name=>name==='Content-Length'?String(header||''):'video/mp4'},
    body:stream?{getReader:()=>({read:()=>new Promise(resolve=>receive=resolve),releaseLock(){input.released=true}})}:null,
    blob:async()=>new Blob([new Uint8Array(10)],{type:'video/mp4'})};
  }});
 const q=window.PortfolioPreviewLoads,first=q.registerVideo(new URL('https://test/eecs.mp4'),0,{duration:2,bytes}),
  second=two?q.registerVideo(new URL('https://test/intel.mp4'),1,{duration:2,bytes}):null;
 const observed=[];q.subscribe(first,item=>observed.push({state:item.state,loaded:item.loadedBytes,total:item.totalBytes}));
 return {q,first,second,requests,pending,observed,get urls(){return urls}};
}
(async()=>{
 let n=0;
 const a=fixture();let details=false;a.q.afterPreviews(()=>details=true);await settle();
 assert.equal(a.requests.length,1);assert.equal(a.first.totalBytes,10);assert.equal(a.first.canPlay,false);n++;
 a.pending[0].push(3);await settle();assert.equal(a.first.loadedBytes,3);assert.equal(a.first.state,'loading');assert.equal(a.first.blobs.size,0);assert.equal(a.requests.length,1);n++;
 a.pending[0].push(4);await settle();assert.equal(a.first.loadedBytes,7);assert.ok(a.observed.some(x=>x.loaded===3));assert.ok(a.observed.some(x=>x.loaded===7));n++;
 a.pending[0].push(3);await settle();assert.equal(a.first.state,'loading');assert.equal(details,false);a.pending[0].end();await settle();
 assert.equal(a.first.state,'ready');assert.equal(a.first.blobs.get(0).size,10);assert.equal(a.first.blobs.get(0).type,'video/mp4');assert.equal(a.pending[0].released,true);assert.equal(a.requests.length,2);assert.equal(details,false);n++;
 a.pending[1].push(10);await settle();a.pending[1].end();await settle();assert.equal(details,true);assert.equal(a.urls,2);n++;
 const copy=a.q.registerVideo(new URL('https://test/eecs.mp4'),0,{duration:2,bytes:10});a.q.request(copy);await settle();assert.equal(copy,a.first);assert.equal(copy.loadedBytes,10);assert.equal(a.requests.length,2);n++;
 const noHeader=fixture({header:0,bytes:20,two:false});noHeader.q.start();await settle();noHeader.pending[0].push(5);await settle();assert.equal(noHeader.first.totalBytes,20);assert.equal(noHeader.first.loadedBytes,5);noHeader.pending[0].end();await settle();n++;
 const unknown=fixture({header:0,bytes:0,two:false});unknown.q.start();await settle();assert.equal(unknown.first.totalBytes,0);unknown.pending[0].push(5);await settle();assert.equal(unknown.first.loadedBytes,5);unknown.pending[0].end();await settle();assert.equal(unknown.first.totalBytes,5);n++;
 const fallback=fixture({stream:false});fallback.q.start();await settle();assert.equal(fallback.first.state,'ready');assert.equal(fallback.first.loadedBytes,10);assert.equal(fallback.requests.length,2);n++;
 const failure=fixture();failure.q.start();await settle();failure.pending[0].push(4);await settle();failure.pending[0].fail();await settle();assert.equal(failure.first.state,'error');assert.equal(failure.first.blobs.size,0);assert.equal(failure.pending[0].released,true);assert.equal(failure.requests.length,2);failure.pending[1].push(10);await settle();failure.pending[1].end();await settle();n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'real byte progress, ordering, content-length/build size/unknown fallback, shared complete cache, no detail race, unsupported streams and partial failure'}));
})();
