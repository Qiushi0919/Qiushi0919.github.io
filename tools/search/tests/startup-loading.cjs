/* No startup screen or delay; downloads must start even without loader markup. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../source/startup-loading.js'),'utf8');
function fixture({reduce=false,reject=false}={}){
 const classes=new Set(['portfolio-loading']),events=[];let starts=0;
 vm.runInNewContext(source,{document:{documentElement:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}}},
  window:{PortfolioPreviewLoads:{start(){starts++;return reject?Promise.reject(new Error('network')):new Promise(()=>{})}},dispatchEvent:e=>events.push(e.type)},
  Event:class{constructor(type){this.type=type}},matchMedia:()=>({matches:reduce})});
 assert.equal(starts,1);assert.equal(classes.has('portfolio-loading'),false);assert.equal(classes.has('portfolio-ready'),true);assert.deepEqual(events,['portfolio:ready']);
 assert.equal(classes.has('carousels-running'),!reduce);
}
fixture();fixture({reduce:true});fixture({reject:true});
console.log(JSON.stringify({status:'passed',scenarios:3,checks:'immediate content without loader markup, queue starts once, reduced motion and background failure'}));
