export function createBackgroundGesture() {
  let previous=null;
  return {
    reset(){previous=null;},
    click(event){
      if(event.button!==0){previous=null;return false;}
      const point={time:event.timeStamp,x:event.clientX,y:event.clientY,type:event.pointerType};
      const paired=previous&&point.type===previous.type&&point.time>=previous.time&&point.time-previous.time<=450&&Math.hypot(point.x-previous.x,point.y-previous.y)<=8;
      previous=paired?null:point;
      return !!paired;
    }
  };
}
