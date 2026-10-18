import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
const result=await build({entryPoints:['src/app.mjs'],bundle:true,format:'esm',target:['es2022'],outdir:'assets',entryNames:'app',minify:true,legalComments:'linked',sourcemap:false,metafile:true});
const packages=[...new Set(Object.keys(result.metafile.inputs).map(file=>file.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1]).filter(Boolean))].sort();
const licenses=[];
for(const name of packages) {
  const directory='node_modules/'+name+'/';
  const pkg=JSON.parse(await readFile(directory+'package.json','utf8'));
  let license;
  for(const file of ['LICENSE','LICENSE.md','LICENSE.txt','LICENSE-MIT','COPYING']) {
    try {license=await readFile(directory+file,'utf8');break;}catch(error){if(error.code!=='ENOENT')throw error;}
  }
  if(!license)throw new Error('Missing license text for bundled dependency: '+name);
  licenses.push(name+' '+pkg.version+' ('+pkg.license+')\n'+license.trim());
}
await writeFile('assets/THIRD_PARTY_LICENSES.txt',licenses.join('\n\n--------------------\n\n')+'\n');
console.log('DexAtlas: local JavaScript and CSS assets built.');
