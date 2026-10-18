import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../src/layout.mjs';
const node=()=>({id:'stage:method',kind:'stage',layoutAnchor:{x:10,y:20,z:30},x:110,y:70,z:0,fx:110,fy:70,fz:0});
const distance=n=>Math.hypot(n.x-10,n.y-20,n.z-30);

test('stage follows dragging, then returns smoothly and exactly to its anchor',()=>{
  assert.equal(typeof layout.createEngineeringMotion,'function');
  const motion=layout.createEngineeringMotion(),stage=node(),initial=distance(stage);
  motion.drag(stage);motion.tick(10);
  assert.equal(stage.x,110,'active dragging must not be clamped to the anchor');
  motion.release(stage,100,false);
  assert.equal(stage.x,110,'releasing does not jump to the anchor');
  motion.tick(200);
  assert.ok(distance(stage)>0&&distance(stage)<initial,'a return moves through intermediate positions');
  assert.deepEqual([stage.x,stage.y,stage.z],[stage.fx,stage.fy,stage.fz],'simulation holds each intermediate return position');
  motion.tick(800);
  assert.deepEqual([stage.x,stage.y,stage.z],[10,20,30]);
  assert.deepEqual([stage.fx,stage.fy,stage.fz],[10,20,30]);
});

test('redrag interrupts a pending return and a later release starts from the new position',()=>{
  assert.equal(typeof layout.createEngineeringMotion,'function');
  const motion=layout.createEngineeringMotion(),stage=node(),other={...node(),id:'stage:other'};
  motion.release(stage,0,false);motion.release(other,80,false);motion.tick(100);motion.drag(stage);
  Object.assign(stage,{x:250,y:-40,z:70,fx:250,fy:-40,fz:70});
  motion.tick(900);assert.equal(stage.x,250,'the old return cannot pull a currently dragged stage');
  assert.equal(other.x,10,'interrupting one stage must not interrupt another return');
  motion.release(stage,1000,false);motion.tick(1000);assert.equal(stage.x,250);
  motion.tick(1700);assert.equal(stage.x,10);
});

test('reduced motion settles immediately, ordinary terms remain free, and returns are independent',()=>{
  assert.equal(typeof layout.createEngineeringMotion,'function');
  const motion=layout.createEngineeringMotion(),stage=node(),other={...node(),id:'stage:other'},term={id:'policy',kind:'term',x:9};
  motion.release(stage,0,true);assert.deepEqual([stage.x,stage.y,stage.z],[10,20,30]);
  motion.release(other,10,false);motion.drag(term);motion.release(term,20,false);motion.tick(710);
  assert.equal(other.x,10);assert.deepEqual(term,{id:'policy',kind:'term',x:9});
});
