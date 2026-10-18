import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildGraph} from '../src/atlas-model.mjs';
const layout=await import('../src/layout.mjs').catch(()=>({}));
const labelLayout=await import('../src/label-layout.mjs').catch(()=>({}));
const read=async file=>JSON.parse(await readFile(new URL('../data/'+file,import.meta.url),'utf8'));
const glossary=await read('glossary.json'),annotations=await read('annotations.json'),framework=await read('framework.json');

test('engineering stages keep a left-to-right backbone with parallel method branches',()=>{
  assert.equal(typeof layout.applyEngineeringLayout,'function','the renderer needs a separate constrained layout');
  const graph=buildGraph(glossary,annotations,framework);
  layout.applyEngineeringLayout(graph);
  const get=id=>graph.nodes.find(n=>n.id==='stage:'+id);
  const main=['goal','system','method','deployment','evaluation','complete'].map(get);
  for(let i=1;i<main.length;i++)assert.ok(main[i].x>main[i-1].x,'engineering order is independent of the force simulation');
  assert.ok(Math.max(...main.map(n=>n.x))-Math.min(...main.map(n=>n.x))<800,'the backbone is compact rather than spanning the old 1070-unit line');
  assert.ok(new Set(main.map(n=>n.y)).size>=3,'the main route folds through several heights');
  assert.ok(main.every(n=>n.z===0));
  for(const id of ['design','demonstration','interaction']) {
    const node=get(id);
    assert.ok(node.x>get('method').x&&node.x<get('deployment').x);
    assert.equal(node.x,get('design').x,'composable method entrances occupy the same column');
  }
  assert.equal(new Set(['design','demonstration','interaction'].map(id=>get(id).y)).size,3);
  for(const n of graph.nodes.filter(n=>n.kind==='stage'))assert.deepEqual([n.fx,n.fy,n.fz],[n.x,n.y,n.z]);
  for(const n of graph.nodes.filter(n=>n.kind==='term'))assert.equal(n.fx,undefined,'terms remain free to move');
  assert.equal(graph.links.length,74,'layout cannot create or remove relationships');
  assert.equal(framework.stages.some(s=>'x' in s||'fx' in s),false,'coordinates stay outside academic content');
});

test('attempting to drag a stage cannot change its anchor; dragging a term is not clamped',()=>{
  assert.equal(typeof layout.restoreEngineeringPosition,'function','stage drag must restore its constrained position');
  const graph=buildGraph(glossary,annotations,framework);
  layout.applyEngineeringLayout(graph);
  const method=graph.nodes.find(n=>n.id==='stage:method');
  const original=[method.x,method.y,method.z];
  Object.assign(method,{x:999,y:888,z:777,fx:999,fy:888,fz:777});
  layout.restoreEngineeringPosition(method);
  assert.deepEqual([method.x,method.y,method.z],original);
  assert.deepEqual([method.fx,method.fy,method.fz],original);
  const term=graph.nodes.find(n=>n.id==='policy');
  term.x=999;layout.restoreEngineeringPosition(term);
  assert.equal(term.x,999);
  assert.equal(term.fx,undefined);
});

test('screen label placement avoids existing engineering labels and viewport edges',()=>{
  assert.equal(typeof labelLayout.placeScreenLabel,'function','HTML and sprite labels need a shared reading space');
  const occupied=[{left:110,top:120,width:90,height:30}];
  const box=labelLayout.placeScreenLabel({x:155,y:164},120,24,occupied,{width:390,height:844,rightMargin:72});
  assert.ok(box.left+box.width<=110||box.left>=200||box.top+box.height<=120||box.top>=150,'the term label must not be covered by the engineering badge');
  const nearEdge=labelLayout.placeScreenLabel({x:385,y:5},120,24,[...occupied,box],{width:390,height:844,rightMargin:72});
  assert.ok(nearEdge.left>=0&&nearEdge.left+nearEdge.width<=318);
  assert.ok(nearEdge.top>=0&&nearEdge.top+nearEdge.height<=844);
});

test('crowded labels search the whole viewport and report no room instead of overlapping',()=>{
  const occupied=[{left:0,top:50,width:248,height:700}];
  const box=labelLayout.placeScreenLabel({x:160,y:422},120,24,occupied,{width:320,height:844,rightMargin:72});
  assert.ok(box&&box.top+box.height+6<=50||box&&box.top>=756,'free space above or below the local search range must be used');
  assert.equal(labelLayout.placeScreenLabel({x:160,y:422},120,24,[{left:0,top:0,width:320,height:844}],{width:320,height:844,rightMargin:72}),null,'no room must not silently produce an overlapping label');
});
