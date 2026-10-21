import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const module=await import('../src/content-validation.mjs').catch(()=>({}));
const read=name=>readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8').then(JSON.parse);
const [glossary,annotations,framework]=await Promise.all(['glossary','annotations','framework'].map(read));

test('formal content has 60–80 reviewed terms and independently traceable typed edges',()=>{
 assert.equal(typeof module.validateContent,'function');
 assert.deepEqual(module.validateContent(glossary,annotations,framework),[]);
 assert.ok(glossary.terms.length>=60&&glossary.terms.length<=80);
 assert.equal(glossary.metadata.version,'1.0.0');
});

test('content validation rejects source collisions, unsupported references and hierarchy cycles',()=>{
 assert.equal(typeof module.validateContent,'function');
 const g=structuredClone(glossary),a=structuredClone(annotations),f=structuredClone(framework);
 f.sources.push(structuredClone(g.sources[0]));
 a.relations[0].evidence[0].source_id='nonexistent_source';
 const first=a.relations[0];a.relations.push({...structuredClone(first),id:'cycle-a',from:g.terms[0].id,to:g.terms[1].id,predicate:'is_a'});
 a.relations.push({...structuredClone(first),id:'cycle-b',from:g.terms[1].id,to:g.terms[0].id,predicate:'is_a'});
 const errors=module.validateContent(g,a,f).join('\n');
 assert.match(errors,/重复来源/);assert.match(errors,/未知来源/);assert.match(errors,/上下位循环/);
});

test('compatibility term links derive only from reviewed explicit concept records',()=>{
 assert.equal(typeof module.deriveRelatedTerms,'function');
 const rows=[{from:'a',to:'b',predicate:'uses',explanation:'明确使用',review:{status:'reviewed'}},{from:'a',to:'c',predicate:'uses',explanation:'尚未核实',review:{status:'pending'}},{from:'d',to:'a',predicate:'uses',explanation:'入边',review:{status:'reviewed'}}];
 assert.deepEqual(module.deriveRelatedTerms('a',rows),[{term_id:'b',relation:'uses',note:'明确使用'}]);
});

test('metadata-only sources cannot substantiate claims, and term groups must exist',()=>{
 const g=structuredClone(glossary),a=structuredClone(annotations),f=structuredClone(framework);
 g.terms[0].claim_evidence.definition[0].source_id='recent_mra';
 g.terms[1].category_id='invented_category';
 const errors=module.validateContent(g,a,f).join('\n');
 assert.match(errors,/仅元数据/);assert.match(errors,/未知导航分组/);
});

test('catalog sources and compatibility vocabulary resolve against the canonical registry',()=>{
 const ids=new Set(glossary.sources.map(s=>s.id));
 for(const category of glossary.categories)for(const id of category.source_ids||[])assert.ok(ids.has(id),category.id+' source '+id);
 assert.ok(glossary.metadata.primary_source_ids?.length,'primary reading sources are explicit content metadata');
 for(const id of glossary.metadata.primary_source_ids)assert.ok(ids.has(id),'primary source '+id);
 for(const r of annotations.relations)assert.ok(glossary.relation_types[r.predicate],'declared predicate '+r.predicate);
 for(const t of glossary.terms)for(const r of t.related_terms)assert.ok(glossary.relation_types[r.relation],'compatibility predicate '+r.relation);
});

test('validator rejects dangling metadata source arrays and missing predicate declarations',()=>{
 const g=structuredClone(glossary),a=structuredClone(annotations),f=structuredClone(framework);
 g.categories[0].source_ids=['unregistered_catalog_source'];
 g.metadata.primary_source_ids=['unregistered_primary_source'];
 delete g.relation_types[a.relations[0].predicate];
 const errors=module.validateContent(g,a,f).join('\n');
 assert.match(errors,/未知来源元数据引用.*unregistered_catalog_source/);
 assert.match(errors,/未知来源元数据引用.*unregistered_primary_source/);
 assert.match(errors,/未声明关系类型/);
});
