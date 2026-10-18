import test from 'node:test';
import assert from 'node:assert/strict';
const gestures=await import('../src/background-gesture.mjs').catch(()=>({}));
const click=(timeStamp,x=50,y=60)=>({timeStamp,clientX:x,clientY:y,button:0,pointerType:'mouse'});
test('background dismissal requires two nearby consecutive primary clicks',()=>{
  assert.equal(typeof gestures.createBackgroundGesture,'function');
  const gesture=gestures.createBackgroundGesture();
  assert.equal(gesture.click(click(100)),false);assert.equal(gesture.click(click(300,52,60)),true);
  assert.equal(gesture.click(click(400)),false,'successful pairs cannot leak into another gesture');
  gesture.reset();assert.equal(gesture.click(click(500)),false,'node, edge and UI interactions reset the pair');
  assert.equal(gesture.click(click(1100)),false,'slow clicks are independent');
  assert.equal(gesture.click(click(1200,100,120)),false,'distant clicks are independent');
  gesture.reset();assert.equal(gesture.click({...click(1300),button:1}),false);assert.equal(gesture.click(click(1400)),false,'middle clicks cannot start a dismiss gesture');
});
