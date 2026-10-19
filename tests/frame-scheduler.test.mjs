import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../src/frame-scheduler.mjs').catch(()=>({}));
test('rendering settles to idle, wakes on first input, keeps busy animations and pauses in background',()=>{
 assert.equal(typeof module.createFrameScheduler,'function');
 const queue=new Map();let sequence=0,hidden=false,busy=true,paused=0,resumed=0,frames=0,time=0;
 const scheduler=module.createFrameScheduler({request:cb=>{queue.set(++sequence,cb);return sequence;},cancel:id=>queue.delete(id),now:()=>time,isHidden:()=>hidden,isBusy:()=>busy,onFrame:()=>frames++,pause:()=>paused++,resume:()=>resumed++});
 const step=()=>{const [id,cb]=queue.entries().next().value;queue.delete(id);time+=25;cb(time);};
 scheduler.invalidate();step();assert.equal(scheduler.state,'active');busy=false;step();step();step();
 assert.equal(scheduler.state,'idle');assert.equal(queue.size,0);const count=frames;
 scheduler.invalidate();assert.equal(scheduler.state,'active');step();assert.ok(resumed>0);assert.ok(frames>count);
 busy=true;step();step();assert.equal(scheduler.state,'active');
 hidden=true;scheduler.visibilityChanged();assert.equal(scheduler.state,'hidden');assert.equal(queue.size,0);
 scheduler.invalidate();assert.equal(queue.size,0);hidden=false;scheduler.visibilityChanged();assert.equal(scheduler.state,'active');
 scheduler.dispose();const n=resumed;scheduler.invalidate();assert.equal(queue.size,0);assert.equal(resumed,n);assert.ok(paused>0);
});

test('high-refresh input stays awake past the upstream 50ms raycast throttle',()=>{
 const queue=new Map();let sequence=0,time=0,lastPick=0,pointerOnNode=false,hoverOnNode=false;
 const scheduler=module.createFrameScheduler({request:cb=>{queue.set(++sequence,cb);return sequence;},cancel:id=>queue.delete(id),now:()=>time,isHidden:()=>false,isBusy:()=>false,onFrame:()=>{if(time-lastPick>=50){lastPick=time;hoverOnNode=pointerOnNode;}},pause(){},resume(){}});
 time=1;pointerOnNode=true;scheduler.invalidate();
 for(const next of [8.33,16.67,25]){time=next;const [id,cb]=queue.entries().next().value;queue.delete(id);cb(time);}
 assert.equal(scheduler.state,'active','three frames at 120Hz must not sleep before the final pointer pick');
 for(const next of [33.33,41.67,50,58.33,66.67,75,83.33]){
  if(!queue.size)break;time=next;const [id,cb]=queue.entries().next().value;queue.delete(id);cb(time);
 }
 assert.equal(hoverOnNode,true);assert.equal(scheduler.state,'idle');assert.equal(queue.size,0);scheduler.dispose();
});
