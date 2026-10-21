import {readFile,writeFile} from 'node:fs/promises';
import {deriveRelatedTerms} from '../src/content-validation.mjs';
const root=new URL('../data/',import.meta.url);
const [g,a]=await Promise.all(['glossary','annotations'].map(async name=>JSON.parse(await readFile(new URL(name+'.json',root),'utf8'))));
for(const t of g.terms)t.related_terms=deriveRelatedTerms(t.id,a.relations);
await writeFile(new URL('glossary.json',root),JSON.stringify(g,null,2)+'\n');
console.log('Compatibility related_terms synchronized from reviewed concept relations.');
