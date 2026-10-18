import {Vector3} from 'three';
const vector=value=>new Vector3(value.x,value.y,value.z);
const point=value=>({x:value.x,y:value.y,z:value.z});

// Frame real node coordinates, excluding screen-scaled labels and their leaders.
export function overviewFrame(nodes,{position,target,up,fov,aspect},coverage=.78) {
  const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
  for(const node of nodes){const p=new Vector3(node.x||0,node.y||0,node.z||0);min.min(p);max.max(p);}
  const center=nodes.length?min.add(max).multiplyScalar(.5):new Vector3();
  const front=vector(position).sub(vector(target)).normalize();if(!front.length())front.set(0,0,1);
  const right=vector(up).cross(front).normalize();if(!right.length())right.set(1,0,0);
  const viewUp=front.clone().cross(right).normalize(),tan=Math.tan(fov*Math.PI/360);
  let distance=150;
  for(const node of nodes){
    const delta=new Vector3(node.x||0,node.y||0,node.z||0).sub(center),margin=24;
    distance=Math.max(distance,delta.dot(front)+margin+Math.max((Math.abs(delta.dot(right))+margin)/(tan*aspect*coverage),(Math.abs(delta.dot(viewUp))+margin)/(tan*coverage)));
  }
  return {center:point(center),distance,position:point(center.clone().addScaledVector(front,distance)),front:point(front),right:point(right),up:point(viewUp)};
}

export function shouldExitFocus({manual,flight,focusedKind,previous,current,overviewDistance}) {
  return manual&&!flight&&focusedKind==='term'&&current>previous+.05&&current>=overviewDistance*.8;
}

export function configureOrbitNavigation(controls,focused) {
  // Keep the target on the view-center ray after cursor zoom, rather than
  // projecting it back to a ground plane or a fixed graph centroid.
  controls.screenSpacePanning=true;
  controls.zoomToCursor=!focused;
}
