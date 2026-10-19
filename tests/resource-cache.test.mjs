import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../src/resource-cache.mjs').catch(()=>({}));
test('hidden label resources are lazy, LRU limited, and disposed once',()=>{
 assert.equal(typeof module.createResourceCache,'function');
 const removed=[];let creates=0;
 const cache=module.createResourceCache({maxHidden:2,maxBytes:5,create:key=>({key,bytes:key==='large'?6:2,created:++creates}),dispose:r=>removed.push(r.key)});
 assert.equal(creates,0);const a=cache.get('a');cache.get('b');cache.retain(new Set(['a','b']));
 assert.equal(cache.get('a'),a);assert.equal(creates,2);
 cache.get('c');cache.retain(new Set(['c']));cache.get('d');cache.retain(new Set(['d']));
 assert.deepEqual(removed,['b']);assert.equal(cache.stats().hidden,2);
 cache.get('large');cache.retain(new Set(['large']));assert.ok(cache.stats().hiddenBytes<=5);
 cache.retain(new Set());assert.ok(removed.includes('large'),'a hidden oversized canvas is evicted');
 cache.dispose();cache.dispose();assert.equal(new Set(removed).size,removed.length,'dispose is idempotent');
});
