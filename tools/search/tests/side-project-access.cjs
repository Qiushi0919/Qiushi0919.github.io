// Disposable fixture password; no owner secret appears in tests.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto,pbkdf2Sync,randomBytes}=require('node:crypto');
const code=fs.readFileSync(__dirname+'/../source/side-project-gate.js','utf8');
const sessionCode=fs.readFileSync(__dirname+'/../source/side-project-session.js','utf8');
const name='portfolio.side-project-access.v1',days=180*86400000,password='fixture-only';
const b64=data=>Buffer.from(data).toString('base64');
class Storage{constructor(record){this.data=new Map(record?[[name,JSON.stringify(record)]]:[]);}getItem(k){return this.data.get(k)||null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}}
function element(){return {value:'',type:'password',disabled:false,attrs:{},handlers:{},dataset:{},addEventListener(k,fn){this.handlers[k]=fn;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){},select(){}};}
async function main(){
 const salt=randomBytes(16),nonce=randomBytes(12),raw=pbkdf2Sync(password,salt,240000,32,'sha256');
 const key=await webcrypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
 const content='<html><body>private fixture</body></html>',context='zh:projects';
 const cipher=await webcrypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:new TextEncoder().encode(context)},key,new TextEncoder().encode(content));
 const payload={id:'fixture-v1',salt:b64(salt),nonce:b64(nonce),ciphertext:b64(cipher),context,iterations:240000,days:180};
 function boot(record,lang='zh',blocked=false,altered=payload,loading=false){
  const nodes=Object.fromEntries(['access-form','access-password','access-show','access-message','gate-payload','submit'].map(k=>[k,element()]));
  nodes['gate-payload'].textContent=JSON.stringify(altered);nodes['access-form'].querySelector=()=>nodes.submit;
  const output=[],store=new Storage(record),session=new Storage();
  const docEvents={};
  const document={readyState:loading?'loading':'complete',documentElement:{dataset:{language:lang}},body:{dataset:{}},getElementById:k=>nodes[k],addEventListener(k,fn){docEvents[k]=fn;},open(){},write(v){output.push(v);},close(){}};
  vm.runInNewContext(code,{document,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Date,Number,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),localStorage:blocked?{getItem(){throw Error();},setItem(){throw Error();},removeItem(){}}:store,sessionStorage:session});
  return {nodes,output,store,session,ready(){document.readyState='complete';docEvents.DOMContentLoaded();},async submit(value){nodes['access-password'].value=value;await nodes['access-form'].handlers.submit({preventDefault(){}});},async settle(){await new Promise(r=>setTimeout(r,25));}};
 }
 const first=boot();await first.submit('wrong');assert.equal(first.output.length,0);assert.equal(first.nodes['access-password'].attrs['aria-invalid'],'true');assert.equal(first.store.getItem(name),null);
 await first.submit(password);assert.equal(first.output[0],content);assert.equal(first.nodes['access-password'].value,'');
 const saved=JSON.parse(first.store.getItem(name));assert.equal(saved.key,b64(raw));assert.ok(Math.abs(saved.expires-Date.now()-days)<1500);assert.ok(!JSON.stringify(saved).includes(password));
 const reload=boot(saved);await reload.settle();assert.equal(reload.output[0],content);assert.equal(JSON.parse(reload.store.getItem(name)).expires,saved.expires);
 const parsing=boot(saved,'zh',false,payload,true);await parsing.settle();assert.equal(parsing.output.length,0);parsing.ready();await parsing.settle();assert.equal(parsing.output[0],content);
 for(const record of [{...saved,expires:Date.now()-1},{...saved,id:'old'},{...saved,key:b64(randomBytes(32))},{...saved,expires:Date.now()+days+10000}]){const test=boot(record);await test.settle();assert.equal(test.output.length,0);assert.equal(test.store.getItem(name),null);}
 const english=boot(null,'en');await english.submit('wrong');assert.match(english.nodes['access-message'].textContent,/Incorrect password/);
 const blocked=boot(null,'zh',true);await blocked.submit(password);assert.equal(blocked.output[0],content);assert.ok(blocked.session.getItem(name));
 const tampered=boot(null,'zh',false,{...payload,context:'other-route'});await tampered.submit(password);assert.equal(tampered.output.length,0);
 const events={},live=new Storage(saved);let reloads=0,interval;const window={localStorage:live,sessionStorage:new Storage(),addEventListener:(e,fn)=>events[e]=fn};
 vm.runInNewContext(sessionCode,{window,localStorage:live,sessionStorage:window.sessionStorage,document:{hidden:false,addEventListener:(e,fn)=>events[e]=fn},location:{reload(){reloads++;}},setInterval(fn){interval=fn;},Date,Number});
 events.focus();assert.equal(reloads,0);live.setItem(name,JSON.stringify({...saved,expires:Date.now()-1}));interval();assert.equal(reloads,1);
 console.log(JSON.stringify({status:'passed',checks:['correct/wrong password','authenticated encryption','180-day expiry','reload preserves original expiry','obsolete/corrupt records','English errors','storage fallback','open-page expiry']}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
