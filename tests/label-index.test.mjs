import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../src/label-layout.mjs';
test('spatial label queries preserve padded rectangle collisions across cell boundaries',()=>{
 assert.equal(typeof layout.createLabelCollisionIndex,'function');
 const index=layout.createLabelCollisionIndex(),boxes=[];let seed=7;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<150;i++){const box={left:random()*1800,top:random()*1000,width:20+random()*180,height:18+random()*40};boxes.push(box);index.add(box);}
 for(let i=0;i<1000;i++){const a={left:random()*1900,top:random()*1100,width:20+random()*180,height:18};const expected=boxes.some(b=>a.left<b.left+b.width+6&&a.left+a.width+6>b.left&&a.top<b.top+b.height+6&&a.top+a.height+6>b.top);assert.equal(index.collides(a),expected);}
});
