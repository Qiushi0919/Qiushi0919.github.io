/* Exercise the real download queue: saving must never fetch another MP4. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=['preview-load-queue.js','preview-download.js'].map(name=>fs.readFileSync(path.join(__dirname,'../source',name),'utf8')).join('\n');
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
function fixture(language='zh') {
 const downloads=[],requests=[],pending=[],documentEvents={},windowEvents={};
 let objectURLs=0;
 class Element {
  constructor(tag){this.tag=tag;this.events={};this.children=[];this.style={};this.attrs={};this.hidden=false;this.rect={left:10,top:100,width:180,height:44};}
  append(element){this.children.push(element);element.parent=this;}
  remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
  addEventListener(name,fn){this.events[name]=fn;}
  setAttribute(name,value){this.attrs[name]=value;}
  getBoundingClientRect(){return this.rect;}
  focus(options){this.focused=options;}
  contains(element){return this===element || this.children.some(child=>child.contains(element));}
  click(){if(this.tag==='a')downloads.push({href:this.href,name:this.download});else return this.events.click?.(event());}
 }
 class ObjectURL extends URL {static createObjectURL(){return 'blob:shared-'+(++objectURLs)}}
 const document={documentElement:{dataset:{language}},body:new Element('body'),hidden:false,
  createElement:tag=>new Element(tag),addEventListener:(name,fn)=>documentEvents[name]=fn};
 const window={addEventListener:(name,fn)=>windowEvents[name]=fn};
 vm.runInNewContext(source,{window,document,innerWidth:800,innerHeight:600,URL:ObjectURL,
  AbortController,setTimeout,clearTimeout,fetch:url=>new Promise((resolve,reject)=>{
   requests.push(String(url));pending.push(fail=>fail?reject(new Error('Network failed')):resolve({ok:true,blob:async()=>new Blob(['mp4'])}));
  })});
 const resource=(name,priority)=>window.PortfolioPreviewLoads.registerVideo(new ObjectURL('https://example.test/assets/'+name+'/preview.mp4?v=stable'),priority,{duration:2,bytes:3});
 const attach=resource=>{
  const target=new Element('button');
  window.PortfolioPreviewDownloads.attach({querySelector:()=>target},resource);
  return target;
 };
 return {window,document,documentEvents,windowEvents,downloads,requests,resource,attach,
  get menu(){return document.body.children.find(child=>child.attrs.role==='menu')},
  get button(){return this.menu.children[0]},get objectURLs(){return objectURLs},
  open(target,x=50,y=120){const e=event({clientX:x,clientY:y});target.events.contextmenu(e);assert.equal(e.prevented,true);assert.equal(e.stopped,true);},
  async complete(fail=false){assert.ok(pending.length);pending.shift()(fail);await settle()}};
}
function event(extra={}){return {...extra,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}}}
(async()=>{
 let n=0;
 const a=fixture(),eecs=a.resource('eecs',0),intel=a.resource('intel',1),c=a.resource('c',2);
 const target=a.attach(c),copy=a.attach(c);
 assert.equal(a.menu,undefined);assert.equal(a.requests.length,0);n++;
 a.open(target,790,590);assert.equal(a.menu.hidden,false);assert.equal(a.menu.style.left,'620px');assert.equal(a.menu.style.top,'556px');assert.equal(a.button.textContent,'↓ 下载视频');assert.equal(a.requests.length,0);n++;
 const download=a.button.click();await settle();assert.equal(a.button.disabled,true);assert.equal(a.button.attrs['aria-busy'],'true');assert.ok(a.requests[0].includes('/eecs/'));assert.equal(a.downloads.length,0);n++;
 await a.button.click();assert.equal(a.requests.length,1);n++;
 await a.complete();assert.ok(a.requests[1].includes('/intel/'));assert.equal(a.downloads.length,0);await a.complete();assert.ok(a.requests[2].includes('/c/'));await a.complete();await download;
 assert.deepEqual(a.downloads,[{href:'blob:shared-3',name:'c-preview.mp4'}]);assert.equal(a.menu.hidden,true);assert.equal(a.document.body.children.length,1);assert.equal(target.focused.preventScroll,true);n++;
 a.open(copy);await a.button.click();a.open(target);await a.button.click();assert.equal(a.requests.length,3);assert.equal(a.objectURLs,3);assert.equal(a.downloads.length,3);assert.ok(a.downloads.every(record=>record.href===c.objectURL));n++;
 a.open(target);const escape=event({key:'Escape'});a.documentEvents.keydown(escape);assert.equal(a.menu.hidden,true);assert.equal(escape.prevented,true);assert.equal(escape.stopped,true);n++;
 const keyboard=event({key:'F10',shiftKey:true});target.events.keydown(keyboard);assert.equal(a.menu.hidden,false);assert.equal(a.menu.style.left,'10px');assert.equal(a.menu.style.top,'100px');n++;
 const space=event({key:' '});a.menu.events.keydown(space);assert.equal(space.stopped,true);assert.equal(space.prevented,undefined);n++;
 a.documentEvents.pointerdown({target:a.button});assert.equal(a.menu.hidden,false);a.documentEvents.pointerdown({target:a.document.body});assert.equal(a.menu.hidden,true);n++;
 a.open(target);a.documentEvents.scroll();assert.equal(a.menu.hidden,true);a.open(target);a.document.hidden=true;a.documentEvents.visibilitychange();assert.equal(a.menu.hidden,true);n++;
 a.open(target);a.documentEvents.keydown(event({key:'Tab'}));assert.equal(a.menu.hidden,true);a.open(target);a.windowEvents.resize();assert.equal(a.menu.hidden,true);n++;
 const b=fixture('en'),failed=b.resource('intel',0),retryTarget=b.attach(failed);b.open(retryTarget);assert.equal(b.button.textContent,'↓ Download video');const failure=b.button.click();await settle();await b.complete(true);await failure;assert.equal(b.downloads.length,0);assert.equal(b.button.disabled,false);assert.equal(b.button.textContent,'Download failed · Retry');n++;
 const retry=b.button.click();await settle();assert.equal(b.requests.length,2);await b.complete();await retry;assert.equal(b.downloads[0].href,failed.objectURL);assert.equal(b.objectURLs,1);n++;
 const legacy=b.attach({kind:'frames'});assert.equal(legacy.events.contextmenu,undefined);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'real ordered queue, shared Blob saves without extra requests, gallery/repeated saves, retry, dismissal, viewport clamping, localized keyboard menu and no layout row'}));
})().catch(error=>{console.error(error);process.exitCode=1});
