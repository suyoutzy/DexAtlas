import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const args=process.argv.slice(2),option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const ref=option('--ref','working'),runs=Number(option('--runs',3)),warmup=Number(option('--warmup',12)),samples=Number(option('--samples',30));
const root=process.cwd(),output=option('--output','.work/metrics/'+ref.replaceAll('/','-')+'.json');
const source=async file=>ref==='working'?readFile(path.join(root,file)):execFileSync('git',['show',ref+':'+file],{cwd:root,maxBuffer:20*1024*1024});
const bundle=await build({entryPoints:['src/app.mjs'],bundle:true,format:'esm',target:'es2022',write:false,plugins:[{name:'diagnostic-only',setup(builder){
  builder.onLoad({filter:/[/\\]src[/\\].+\.mjs$/},async({path:file})=>{
    let contents=(await source(path.relative(root,file).replaceAll('\\','/'))).toString().replaceAll('\r\n','\n');
    if(file.endsWith('graph-scene.mjs')){
      const marker='  return {\n    update(';
      if(!contents.includes(marker))throw new Error('Diagnostic scene anchor missing');
      contents=contents.replace(marker,'  window.__dexGraph=graph;\n'+marker);
    }
    return {contents,loader:'js'};
  });
}}]});
const cache=new Map();
const server=createServer(async(req,res)=>{
  try{
    const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
    if(!/^(index\.html|styles\.css|favicon\.svg|assets\/[\w.-]+|data\/[\w.-]+)$/.test(name)){res.writeHead(404);res.end();return;}
    if(!cache.has(name))cache.set(name,name==='assets/app.js'?bundle.outputFiles[0].contents:await source(name));
    res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');res.end(cache.get(name));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const results=[];
try{
  for(let run=0;run<runs;run++){
    const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
    try{
      const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2,reducedMotion:'reduce'});
      await page.goto(url);await page.locator('#graph[data-ready=true]').waitFor();await page.mouse.move(5,5);
      const bcdp=await browser.newBrowserCDPSession(),cdp=await page.context().newCDPSession(page);
      await delay(warmup*1000);
      const readings=[];
      for(let sample=0;sample<samples;sample++){
        const start=performance.now(),{processInfo}=await bcdp.send('SystemInfo.getProcessInfo');
        const ids=processInfo.map(p=>Number(p.id));
        const raw=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',`Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64,PrivateMemorySize64 | ConvertTo-Json -Compress\nexit 0`],{encoding:'utf8'}));
        const processes=(Array.isArray(raw)?raw:[raw]).map(p=>({...p,type:processInfo.find(x=>Number(x.id)===p.Id)?.type}));
        const heap=await cdp.send('Runtime.getHeapUsage');
        const graphics=await page.evaluate(()=>{
          const graph=window.__dexGraph,renderer=graph.renderer(),gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),composer=graph.postProcessingComposer();
          const bloom=composer.passes.find(p=>p.renderTargetBright&&Array.isArray(p.renderTargetsHorizontal));let labelBytes=0;
          graph.scene().traverse(o=>{if(o.isSprite&&o.material?.map?.image){const c=o.material.map.image;labelBytes+=c.width*c.height*4;}});
          return {gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),canvas:[renderer.domElement.width,renderer.domElement.height],composer:[composer.renderTarget1.width,composer.renderTarget1.height],samples:composer.renderTarget1.samples,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,frame:renderer.info.render.frame,bloom:!!bloom?.enabled,bloomSize:bloom?[bloom.renderTargetBright.width,bloom.renderTargetBright.height]:null,labelCanvasBytes:labelBytes};
        });
        readings.push({gpuPrivate:processes.filter(p=>p.type==='GPU').reduce((n,p)=>n+p.PrivateMemorySize64,0),totalPrivate:processes.reduce((n,p)=>n+p.PrivateMemorySize64,0),workingSet:processes.reduce((n,p)=>n+p.WorkingSet64,0),jsHeap:heap.usedSize,graphics});
        if(!readings.at(-1).gpuPrivate||!graphics.bloom)throw new Error('Missing GPU memory or actual default Bloom; invalid benchmark sample');
        if(sample<samples-1)await delay(Math.max(0,1000-(performance.now()-start)));
      }
      const summary=Object.fromEntries(['gpuPrivate','totalPrivate','workingSet','jsHeap'].map(key=>[key,median(readings.map(r=>r[key]))]));
      results.push({run:run+1,chrome:browser.version(),summary,readings});
      console.log(JSON.stringify({ref,run:run+1,medianMiB:Object.fromEntries(Object.entries(summary).map(([k,v])=>[k,Math.round(v/1048576)])),graphics:readings.at(-1).graphics}));
    }finally{await browser.close();}
    await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify({ref,createdAt:new Date().toISOString(),platform:process.platform,viewport:[1920,1080],dpr:2,warmup,samples,results},null,2));
  }
}finally{await new Promise(resolve=>server.close(resolve));}
