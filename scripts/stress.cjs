const {readFile,mkdir,writeFile}=require('node:fs/promises');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {startDiagnosticServer}=require('../tests/diagnostic-server.cjs');
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const timeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error(label+' timed out')),ms);t.unref();})]);
(async()=>{
 const original={};for(const name of ['glossary','annotations','framework'])original[name]=JSON.parse(await readFile('data/'+name+'.json','utf8'));
 const results=[];
 for(const count of [100,500,1000]){
  const g=structuredClone(original.glossary),a=structuredClone(original.annotations),f=structuredClone(original.framework),base=g.terms[0],relation=a.relations[0],usage=f.usages[0];
  g.terms=Array.from({length:count},(_,i)=>({...structuredClone(base),id:'stress_'+i,name:{zh:'模拟词条 '+i,en:'Synthetic term '+i,abbreviation:'S'+String(i).padStart(4,'0'),aliases:[]},related_terms:[],references:[]}));
  a.relations=g.terms.flatMap((term,i)=>[1,7].map((step,j)=>({...structuredClone(relation),id:'stress_'+i+'_'+j,from:term.id,to:g.terms[(i+step)%count].id,evidence:[]})));
  f.usages=g.terms.map((term,i)=>({...structuredClone(usage),id:'stress_use_'+i,term_id:term.id,stage_id:f.stages[i%f.stages.length].id,evidence:[]}));
  const server=await startDiagnosticServer({fixture:{'data/glossary.json':g,'data/annotations.json':a,'data/framework.json':f}});
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
   const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const started=Date.now();await page.goto(server.url);await page.locator('#graph[data-ready=true]').waitFor();const loaded=Date.now()-started;
   await page.locator('#graph[data-render-state=idle]').waitFor({timeout:25000});const settled=Date.now()-started;
   for(const names of [false,true]){
    const result={terms:count,links:3*count+f.flows.length,names,loadMs:loaded,layoutSettledMs:settled};
    try{
     if(names){await page.locator('#labels-button').click();await timeout(page.waitForTimeout(1000).then(()=>page.evaluate(()=>true)),25000,'label layout');}
     const cdp=await page.context().newCDPSession(page);
     result.snapshot=await timeout(page.evaluate(()=>{const graph=window.__dexGraph;let active=0,hidden=0,hiddenBytes=0;graph.scene().traverse(o=>{if(o.isSprite){if(o.visible)active++;else{hidden++;hiddenBytes+=o.material.map.image.width*o.material.map.image.height*4;}}});return {active,hidden,hiddenBytes,textures:graph.renderer().info.memory.textures,geometries:graph.renderer().info.memory.geometries,renderState:document.querySelector('#graph').dataset.renderState};}),25000,'snapshot');
     const heap=await cdp.send('Runtime.getHeapUsage');result.jsHeapMiB=Math.round(heap.usedSize/1048576);
     const bcdp=await browser.newBrowserCDPSession(),{processInfo}=await bcdp.send('SystemInfo.getProcessInfo');
     const raw=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',`Get-Process -Id ${processInfo.map(p=>Number(p.id)).join(',')} -ErrorAction SilentlyContinue | Select-Object Id,PrivateMemorySize64 | ConvertTo-Json -Compress\nexit 0`],{encoding:'utf8'}));
     const processes=Array.isArray(raw)?raw:[raw];result.browserPrivateMiB=Math.round(processes.reduce((s,p)=>s+p.PrivateMemorySize64,0)/1048576);result.gpuPrivateMiB=Math.round(processes.filter(p=>processInfo.find(i=>Number(i.id)===p.Id)?.type==='GPU').reduce((s,p)=>s+p.PrivateMemorySize64,0)/1048576);
     await timeout(page.mouse.move(40,160).then(()=>page.mouse.down()).then(()=>page.mouse.move(160,235,{steps:24})).then(()=>page.mouse.up()),25000,'orbit');
     await timeout(page.evaluate(names=>window.__dexScene.update({focused:'stress_0',showLabels:names}),names),25000,'focus particles');
     result.frameTimes=await timeout(page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();function tick(now){times.push(now-last);last=now;if(times.length<60)requestAnimationFrame(tick);else resolve(times);}requestAnimationFrame(tick);})),25000,'frame sample');
     result.medianFrameMs=median(result.frameTimes);result.p95FrameMs=[...result.frameTimes].sort((x,y)=>x-y)[Math.floor(result.frameTimes.length*.95)];delete result.frameTimes;
     await page.evaluate(()=>window.__dexScene.update({focused:null}));
     if(names){await timeout(page.locator('#labels-button').click().then(()=>page.waitForTimeout(200)).then(()=>page.evaluate(()=>true)),25000,'hide names');
      result.hiddenAfterClear=await page.evaluate(()=>{let count=0,bytes=0;window.__dexGraph.scene().traverse(o=>{if(o.isSprite&&!o.visible){count++;bytes+=o.material.map.image.width*o.material.map.image.height*4;}});return {count,bytes};});
     }
     result.status='completed';result.errors=errors;
    }catch(error){result.status='capacity-limit';result.error=error.message;}
    results.push(result);console.log(JSON.stringify(result));
    await mkdir('.work/metrics',{recursive:true});await writeFile('.work/metrics/stress.json',JSON.stringify(results,null,2));
    if(result.status!=='completed')break;
   }
  }finally{await browser.close();await server.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
