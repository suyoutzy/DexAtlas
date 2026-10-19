export function createFrameScheduler({request=requestAnimationFrame,cancel=cancelAnimationFrame,now=()=>performance.now(),isHidden,isBusy,onFrame,pause,resume}) {
 let id=null,state='idle',quiet=0,disposed=false,needsResume=false,lastInvalidation=0;
 function queue(){if(id===null)id=request(frame);}
 function frame(time){
  id=null;if(disposed)return;
  if(isHidden()){visibilityChanged();return;}
  // Resume after the input event has reached the graph's pointer tracker.
  // Resuming in capture phase would raycast the old position and throttle the click.
  if(needsResume){needsResume=false;resume();}
  onFrame(time);
  if(isBusy()){quiet=0;queue();}
  // Upstream picking is throttled to 50ms. Three quiet frames alone can be
  // shorter than that on high-refresh screens and miss the final pointer position.
  else if(++quiet<3||now()-lastInvalidation<75)queue();
  else{state='idle';pause();}
 }
 function invalidate(){
  if(disposed)return;quiet=0;lastInvalidation=now();
  if(isHidden()){visibilityChanged();return;}
  if(state!=='active'){state='active';needsResume=true;}
  queue();
 }
 function visibilityChanged(){
  if(disposed)return;
  if(isHidden()){if(id!==null)cancel(id);id=null;state='hidden';pause();}
  else invalidate();
 }
 return {invalidate,visibilityChanged,get state(){return state;},dispose(){if(disposed)return;disposed=true;if(id!==null)cancel(id);id=null;pause();state='disposed';}};
}
