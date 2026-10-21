import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const atlas = await import('../src/atlas-model.mjs').catch(()=>({}));
const read = file => readFile(new URL(`../data/${file}`, import.meta.url), 'utf8').then(JSON.parse);
const glossary = await read('glossary.json');
const annotations = await read('annotations.json');
const framework = await read('framework.json').catch(()=>null);

test('one canonical term node is shared by explicitly recorded stage usages', () => {
  assert.equal(typeof atlas.buildGraph,'function','typed scene builder is required');
  const graph = atlas.buildGraph(glossary, annotations, framework);
  assert.equal(graph.nodes.filter(n=>n.kind==='term').length,glossary.terms.length);
  assert.equal(new Set(graph.nodes.map(n=>n.id)).size,graph.nodes.length);
  assert.equal(graph.links.filter(e=>e.kind==='concept').length,annotations.relations.length);
  const policy = graph.nodes.filter(n=>n.id==='policy');
  assert.equal(policy.length,1);
  assert.ok(graph.links.filter(e=>e.kind==='usage' && e.to==='policy').length>=2);
  const original = annotations.relations[0];
  graph.links.find(e=>e.kind==='concept').source = {id: original.from};
  assert.equal(original.source,undefined,'renderer mutation must not reach the canonical data');
});

test('framework flows and usages are typed, cited and never inferred from category or proximity', () => {
  assert.ok(framework,'generic engineering framework is required');
  const graph = atlas.buildGraph(glossary,annotations,framework);
  const ids = new Set(graph.nodes.map(n=>n.id));
  const sources = new Set([...glossary.sources,...annotations.sources,...framework.sources].map(s=>s.id));
  for (const edge of graph.links) {
    assert.ok(ids.has(edge.from)&&ids.has(edge.to),edge.id);
    assert.ok(['flow','usage','concept'].includes(edge.kind));
    assert.ok(edge.label && edge.evidence?.length,edge.id);
    assert.ok(edge.evidence.every(r=>sources.has(r.source_id)&&r.locator),edge.id);
  }
  assert.equal(graph.links.filter(e=>e.kind==='usage').length,framework.usages.length);
  assert.ok(framework.flows.some(e=>e.feedback));
  assert.ok(framework.stages.some(s=>s.id==='complete'));
  assert.ok(framework.stages.some(s=>s.id==='design'));
  assert.ok(framework.stages.some(s=>s.id==='demonstration'));
  assert.ok(framework.stages.some(s=>s.id==='interaction'));
  const unmapped = {...framework,usages:framework.usages.filter(u=>u.term_id!=='force_closure')};
  assert.equal(atlas.buildGraph(glossary,annotations,unmapped).links.filter(e=>e.kind==='usage'&&e.to==='force_closure').length,0);
});

test('node labels include hovered neighbors only when directly connected', () => {
  assert.equal(typeof atlas.nodeTextVisible,'function','shared label rules are required');
  const state = {showLabels:false,focused:'policy',hovered:'imitation_learning'};
  assert.equal(atlas.nodeTextVisible({id:'policy',kind:'term'},state),true);
  assert.equal(atlas.nodeTextVisible({id:'imitation_learning',kind:'term'},state),true);
  assert.equal(atlas.nodeTextVisible({id:'behavior_cloning',kind:'term'},state),false);
  assert.equal(atlas.nodeTextVisible({id:'stage:goal',kind:'stage'},state),true);
  const links=[{from:'imitation_learning',to:'behavior_cloning'},{from:'imitation_learning',to:'policy'}];
  assert.equal(atlas.nodeTextVisible({id:'behavior_cloning',kind:'term'},state,links),true);
  assert.equal(atlas.nodeTextVisible({id:'dataset_aggregation',kind:'term'},state,links),false);
  assert.equal(atlas.nodeTextVisible({id:'behavior_cloning',kind:'term'},{...state,hovered:null},links),false);
  assert.equal(atlas.nodeTextVisible({id:'dataset_aggregation',kind:'term'},{...state,showLabels:true},links),true);
});

test('homepage is overview; legacy term links and stage links resolve without inventing a default focus', () => {
  assert.equal(typeof atlas.parseSceneHash,'function','unified navigation is required');
  assert.deepEqual(atlas.parseSceneHash('',glossary.terms,framework.stages),{kind:'overview',id:null});
  assert.deepEqual(atlas.parseSceneHash('#term=proximal_policy_optimization&view=engineering',glossary.terms,framework.stages),{kind:'term',id:'proximal_policy_optimization'});
  assert.deepEqual(atlas.parseSceneHash('#stage=goal',glossary.terms,framework.stages),{kind:'stage',id:'goal'});
  assert.deepEqual(atlas.parseSceneHash('#term=missing',glossary.terms,framework.stages),{kind:'overview',id:null});
});
