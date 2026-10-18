import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Plane,Ray} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as view from '../src/graph-view.mjs';

// Real OrbitControls with the small DOM surface needed for public input events.
class Canvas extends EventTarget {
  style={};ownerDocument=new EventTarget();clientWidth=1200;clientHeight=800;
  getRootNode(){return this.ownerDocument;}
  getBoundingClientRect(){return {left:0,top:0,width:1200,height:800};}
  setPointerCapture(){}releasePointerCapture(){}
}
const event=(type,props)=>Object.assign(new Event(type,{cancelable:true}),props);
function setup(){
  const camera=new PerspectiveCamera(50,1.5,.1,10000);camera.position.set(0,0,900);
  const canvas=new Canvas(),controls=new OrbitControls(camera,canvas);
  return {camera,canvas,controls,wheel:(x,y,delta)=>canvas.dispatchEvent(event('wheel',{clientX:x,clientY:y,deltaY:delta,deltaMode:0,ctrlKey:false}))};
}

test('global wheel zoom preserves the point under the cursor and moves the screen-center orbit pivot',()=>{
  assert.equal(typeof view.configureOrbitNavigation,'function');
  const {camera,canvas,controls,wheel}=setup();
  try{
    view.configureOrbitNavigation(controls,null);camera.updateMatrixWorld();
    const ndc=new Vector3(-.55,.3,.5),ray=new Ray(camera.position.clone(),ndc.clone().unproject(camera).sub(camera.position).normalize());
    const anchor=ray.intersectPlane(new Plane(new Vector3(0,0,1),0),new Vector3()),originalTarget=controls.target.clone();
    wheel((ndc.x+1)*600,(1-ndc.y)*400,-320);camera.updateMatrixWorld();
    const projected=anchor.clone().project(camera);
    assert.ok(Math.hypot(projected.x-ndc.x,projected.y-ndc.y)<1e-7,'the cursor world point remains under the pointer');
    assert.ok(controls.target.distanceTo(originalTarget)>20,'the pivot follows the new composition rather than staying at the old graph center');
    const pivot=controls.target.clone(),screen=pivot.clone().project(camera);assert.ok(Math.hypot(screen.x,screen.y)<1e-7);
    canvas.dispatchEvent(event('pointerdown',{pointerId:1,pointerType:'mouse',button:0,clientX:600,clientY:400}));
    canvas.ownerDocument.dispatchEvent(event('pointermove',{pointerId:1,pointerType:'mouse',button:0,clientX:690,clientY:430}));
    canvas.ownerDocument.dispatchEvent(event('pointerup',{pointerId:1,pointerType:'mouse',button:0,clientX:690,clientY:430}));
    camera.updateMatrixWorld();assert.ok(controls.target.distanceTo(pivot)<1e-7);
    const rotated=pivot.clone().project(camera);assert.ok(Math.hypot(rotated.x,rotated.y)<1e-7,'rotation keeps the new viewport center fixed');
  }finally{controls.dispose();}
});

test('focused zoom retains the selected pivot; returning to global mode enables cursor zoom again',()=>{
  assert.equal(typeof view.configureOrbitNavigation,'function');
  const {camera,controls,wheel}=setup();
  try{
    controls.target.set(45,20,0);controls.update();view.configureOrbitNavigation(controls,'policy');
    const selected=controls.target.clone();wheel(250,300,-200);
    assert.ok(controls.target.distanceTo(selected)<1e-7,'focus mode keeps the selected node as pivot');
    view.configureOrbitNavigation(controls,null);wheel(250,300,-200);camera.updateMatrixWorld();
    assert.ok(controls.target.distanceTo(selected)>10);
    const center=controls.target.clone().project(camera);assert.ok(Math.hypot(center.x,center.y)<1e-7);
  }finally{controls.dispose();}
});

test('middle-button drag pans camera and pivot together without rotating',()=>{
  const {camera,canvas,controls}=setup();
  try{
    view.configureOrbitNavigation(controls,null);const before=camera.position.clone(),target=controls.target.clone(),rotation=camera.quaternion.clone();
    canvas.dispatchEvent(event('pointerdown',{pointerId:1,pointerType:'mouse',button:1,clientX:600,clientY:400}));
    canvas.ownerDocument.dispatchEvent(event('pointermove',{pointerId:1,pointerType:'mouse',button:1,clientX:700,clientY:445}));
    canvas.ownerDocument.dispatchEvent(event('pointerup',{pointerId:1,pointerType:'mouse',button:1,clientX:700,clientY:445}));
    assert.ok(camera.position.distanceTo(before)>10);
    assert.ok(camera.position.clone().sub(before).distanceTo(controls.target.clone().sub(target))<1e-7,'panning translates camera and target by the same vector');
    assert.ok(camera.quaternion.angleTo(rotation)<1e-7);
  }finally{controls.dispose();}
});

test('clearing Orbit inertia preserves the pose and prevents drift after a front-view reset',()=>{
  assert.equal(typeof view.clearOrbitInertia,'function');
  const {camera,canvas,controls}=setup();
  try{
    controls.enableDamping=true;view.configureOrbitNavigation(controls,null);
    canvas.dispatchEvent(event('pointerdown',{pointerId:1,pointerType:'mouse',button:0,clientX:600,clientY:400}));
    canvas.ownerDocument.dispatchEvent(event('pointermove',{pointerId:1,pointerType:'mouse',button:0,clientX:690,clientY:430}));
    canvas.ownerDocument.dispatchEvent(event('pointerup',{pointerId:1,pointerType:'mouse',button:0,clientX:690,clientY:430}));
    const position=camera.position.clone(),target=controls.target.clone(),rotation=camera.quaternion.clone();
    view.clearOrbitInertia(controls);
    for(let i=0;i<10;i++)controls.update();
    assert.ok(camera.position.distanceTo(position)<1e-7);assert.ok(controls.target.distanceTo(target)<1e-7);assert.ok(camera.quaternion.angleTo(rotation)<1e-7);
  }finally{controls.dispose();}
});
