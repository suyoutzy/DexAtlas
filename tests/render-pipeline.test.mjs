import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderPipeline} from '../src/render-pipeline.mjs';
test('switching Bloom off disposes the high-pass material as well as its render targets',()=>{
 const prior=globalThis.devicePixelRatio;globalThis.devicePixelRatio=2;
 try{
  const composer={passes:[],renderTarget1:{samples:4},renderTarget2:{samples:4},addPass(p){this.passes.push(p);},removePass(p){this.passes.splice(this.passes.indexOf(p),1);},insertPass(p,i){this.passes.splice(i,0,p);p.setSize(1920,1080);},setPixelRatio(){},setSize(w,h){for(const p of this.passes)p.setSize(w,h);}};
  const renderer={setPixelRatio(){},setSize(){}};
  const pipeline=createRenderPipeline({renderer:()=>renderer,postProcessingComposer:()=>composer},{clientWidth:1920,clientHeight:1080});
  const pass=composer.passes.find(p=>p.renderTargetBright);let highPassDisposed=0,targetDisposed=0;
  pass.materialHighPassFilter.addEventListener('dispose',()=>highPassDisposed++);pass.renderTargetBright.addEventListener('dispose',()=>targetDisposed++);
  pipeline.setGlow(0);assert.equal(highPassDisposed,1);assert.equal(targetDisposed,1);assert.equal(composer.passes.some(p=>p.renderTargetBright),false);
  pipeline.setQuality('high');assert.equal(composer.passes.some(p=>p.renderTargetBright),false);pipeline.dispose();pipeline.dispose();assert.equal(highPassDisposed,1);
 }finally{if(prior===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=prior;}
});
