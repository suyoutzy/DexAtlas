import {readFile} from 'node:fs/promises';
import {validateContent} from '../src/content-validation.mjs';
const data=await Promise.all(['glossary','annotations','framework'].map(name=>readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8').then(JSON.parse)));
const errors=validateContent(...data);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`PASS: ${data[0].terms.length} terms, ${data[1].relations.length} concept relations, ${data[2].usages.length} explicit usages; source and compatibility checks passed. Semantic truth still requires source review.`);
