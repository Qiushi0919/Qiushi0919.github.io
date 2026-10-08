/* System Back, close controls and Forward use the same modal lifecycle. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../source/modal-history.js'),'utf8');
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function fixture(){
 const entries=[{url:'https://previous.test/',state:null},{url:'https://site.test/#all-work',state:{view:'all'}}];
 let index=1;const listeners={},visible=new Set(),closed=[],restored=[],location={href:entries[index].url};
 const window={addEventListener:(name,fn)=>listeners[name]=fn};
 const move=delta=>{const next=index+delta;if(next<0||next>=entries.length)return;index=next;location.href=entries[index].url;queueMicrotask(()=>listeners.popstate({state:entries[index].state}))};
 const history={get state(){return entries[index].state},pushState(state,title,url){entries.splice(index+1);entries.push({url,state:structuredClone(state)});index++;location.href=url},replaceState(state,title,url){entries[index]={url,state:structuredClone(state)}},back(){move(-1)},forward(){move(1)}};
 vm.runInNewContext(source,{window,history,location,queueMicrotask,Date,Math});
 const open=id=>{visible.add(id);window.PortfolioModalHistory.open(id,()=>{closed.push(id);close(id)},()=>{restored.push(id);open(id)})};
 const close=id=>{visible.delete(id);window.PortfolioModalHistory.close(id)};
 return {entries,visible,closed,restored,history,location,open,close,get index(){return index}};
}
(async()=>{
 let n=0;
 const gallery=fixture();gallery.open('gallery');assert.equal(gallery.index,2);assert.equal(gallery.history.state.view,'all');gallery.history.back();await settle();assert.equal(gallery.index,1);assert.equal(gallery.visible.size,0);assert.equal(gallery.location.href,'https://site.test/#all-work');n++;
 gallery.history.forward();await settle();assert.ok(gallery.visible.has('gallery'));assert.equal(gallery.entries.length,3);assert.deepEqual(gallery.restored,['gallery']);gallery.history.back();await settle();gallery.history.back();await settle();assert.equal(gallery.location.href,'https://previous.test/');n++;
 for(const id of ['gallery','contact','citation']){const f=fixture();f.open(id);f.close(id);await settle();assert.equal(f.index,1);assert.equal(f.visible.size,0);f.history.back();await settle();assert.equal(f.location.href,'https://previous.test/');n++}
 const duplicate=fixture();duplicate.open('contact');duplicate.open('contact');assert.equal(duplicate.entries.length,3);duplicate.history.back();await settle();assert.equal(duplicate.visible.size,0);n++;
 const switcher=fixture();switcher.open('gallery');switcher.close('gallery');switcher.open('citation');await settle();assert.equal(switcher.entries.length,3);assert.equal(switcher.history.state.portfolioModal.id,'citation');switcher.history.back();await settle();assert.equal(switcher.visible.size,0);assert.equal(switcher.index,1);n++;
 const rapid=fixture();rapid.open('gallery');rapid.close('gallery');await Promise.resolve();rapid.open('contact');await settle();assert.equal(rapid.index,2);assert.equal(rapid.entries.length,3);assert.ok(rapid.visible.has('contact'));rapid.history.back();await settle();assert.equal(rapid.visible.size,0);assert.equal(rapid.index,1);n++;
 const unknown=fixture();unknown.open('gallery');unknown.history.pushState({view:'paper'},'',unknown.location.href);unknown.history.back();await settle();assert.ok(unknown.visible.has('gallery'));unknown.history.back();await settle();assert.equal(unknown.visible.size,0);n++;
 console.log(JSON.stringify({status:'passed',scenarios:n,checks:'Back closes gallery/contact/citation, controls consume transient entry, normal Back exits, Forward restores, repeated opens, modal switching, rapid close/open and existing state preservation'}));
})();
