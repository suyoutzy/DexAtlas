const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {build}=require('esbuild');
exports.startDiagnosticServer=async function({fixture}={}){
 const root=path.resolve(__dirname,'..');
 const result=await build({absWorkingDir:root,entryPoints:['src/app.mjs'],bundle:true,format:'esm',target:'es2022',write:false,plugins:[{name:'test-only-diagnostics',setup(b){b.onLoad({filter:/[/\\]src[/\\](app|graph-scene)\.mjs$/},async({path:file})=>{
  let contents=(await fs.readFile(file,'utf8')).replaceAll('\r\n','\n');
  if(file.endsWith('graph-scene.mjs'))contents=contents.replace('  return {\n    update(','  window.__dexGraph=graph;\n  return {\n    update(');
  else contents=contents.replace("scene.setGlow(Number($('#glow').value));","window.__dexScene=scene;scene.setGlow(Number($('#glow').value));")+'\nwindow.__dexReload=load;';
  return {contents,loader:'js'};
 });}}]});
 const server=http.createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!/^(index\.html|styles\.css|favicon\.svg|assets\/[\w.-]+|data\/[\w.-]+)$/.test(name)){res.writeHead(404);res.end();return;}
  const bytes=name==='assets/app.js'?result.outputFiles[0].contents:fixture?.[name]?JSON.stringify(fixture[name]):await fs.readFile(path.join(root,name));
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');res.end(bytes);
 }catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {url:'http://127.0.0.1:'+server.address().port+'/',close:()=>new Promise(resolve=>server.close(resolve))};
};
