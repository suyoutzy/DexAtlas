import test from 'node:test';
import assert from 'node:assert/strict';
const policy=await import('../src/render-policy.mjs').catch(()=>({}));
test('balanced and high rendering respect DPR and total pixel budgets',()=>{
 assert.equal(typeof policy.resolveRenderPolicy,'function');
 const resolve=policy.resolveRenderPolicy;
 assert.deepEqual(resolve({quality:'balanced',width:1920,height:1080,dpr:2}),{pixelRatio:1,width:1920,height:1080,bloomScale:.5});
 assert.equal(resolve({quality:'high',width:1000,height:800,dpr:2}).pixelRatio,1.5);
 for(const quality of ['balanced','high'])for(const [width,height,dpr] of [[3840,2160,2],[390,844,3],[1440,900,1.25],[800,600,1]]){
  const r=resolve({quality,width,height,dpr});assert.ok(r.width*r.height<=(quality==='high'?3686400:2073600));assert.ok(r.pixelRatio<=dpr);
 }
 assert.ok(resolve({quality:'balanced',width:3840,height:2160,dpr:2}).pixelRatio<1);
});
