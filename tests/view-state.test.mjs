import test from 'node:test';
import assert from 'node:assert/strict';
const model=await import('../src/atlas-model.mjs');
const view=await import('../src/graph-view.mjs').catch(()=>({}));

test('focus and hover retain the union of both direct neighborhoods',()=>{
  assert.equal(typeof model.deriveHighlights,'function');
  const links=[{id:'a',from:'focus',to:'a'},{id:'b',from:'hover',to:'b'},{id:'c',from:'a',to:'remote'}];
  const state={focused:'focus',hovered:'hover',showLabels:false};
  const result=model.deriveHighlights(links,state);
  assert.deepEqual([...result.nodes].sort(),['a','b','focus','hover']);
  assert.deepEqual([...result.links].sort(),['a','b']);
  assert.equal(model.nodeTextVisible({id:'a',kind:'term'},state,links),true);
  assert.equal(model.nodeTextVisible({id:'remote',kind:'term'},state,links),false);
  const retained=model.deriveHighlights(links,{...state,hovered:null});
  assert.deepEqual([...retained.links],['a'],'leaving another node keeps the focused neighborhood active');
});

test('overview frames node bounds in portrait and landscape from the current viewing direction',()=>{
  assert.equal(typeof view.overviewFrame,'function');
  for(const aspect of [1.5,.38])for(const position of [{x:0,y:0,z:600},{x:600,y:0,z:0}]){
    const nodes=[{x:-300,y:100,z:90},{x:450,y:-180,z:-90}];
    const frame=view.overviewFrame(nodes,{position,target:{x:0,y:0,z:0},up:{x:0,y:1,z:0},fov:50,aspect});
    assert.ok(frame.distance>0&&Number.isFinite(frame.distance));
    assert.deepEqual(frame.center,{x:75,y:-40,z:0});
    for(const node of nodes){
      // Projecting into the returned basis tests real framing, independent of renderer labels.
      const delta={x:node.x-frame.center.x,y:node.y-frame.center.y,z:node.z-frame.center.z};
      const dot=v=>delta.x*v.x+delta.y*v.y+delta.z*v.z;
      const depth=frame.distance-dot(frame.front),half=depth*Math.tan(25*Math.PI/180);
      assert.ok(Math.abs(dot(frame.right))<half*aspect*.8);
      assert.ok(Math.abs(dot(frame.up))<half*.8);
    }
  }
});

test('terms and engineering stages exit only on manual outward zoom past 60 percent',()=>{
  assert.equal(typeof view.shouldExitFocus,'function');
  const state={manual:true,flight:false,focusedKind:'term',previous:299,current:301,overviewDistance:500};
  assert.equal(view.shouldExitFocus(state),true);
  assert.equal(view.shouldExitFocus({...state,focusedKind:'stage'}),true);
  for(const patch of [{manual:false},{flight:true},{focusedKind:undefined},{previous:302},{previous:301},{current:299},{overviewDistance:600}])assert.equal(view.shouldExitFocus({...state,...patch}),false,JSON.stringify(patch));
});

test('front overview ignores the prior camera angle and frames the canonical front direction',()=>{
  const nodes=[{x:-310,y:0,z:0},{x:445,y:0,z:0},{x:75,y:150,z:15}];
  const frame=view.overviewFrame(nodes,{position:{x:600,y:200,z:200},target:{x:0,y:0,z:0},up:{x:0,y:1,z:0},fov:50,aspect:1.5,frontView:true});
  assert.deepEqual(frame.front,{x:0,y:0,z:1});
  assert.equal(frame.position.x,frame.center.x);assert.equal(frame.position.y,frame.center.y);
});
