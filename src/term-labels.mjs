import SpriteText from 'three-spritetext';
import {Vector3,Line,BufferGeometry,Float32BufferAttribute,LineBasicMaterial} from 'three';
import {placeScreenLabel,createLabelCollisionIndex} from './label-layout.mjs';
import {createResourceCache} from './resource-cache.mjs';

export function createTermLabels(container,data,groups,getPoint,getCamera) {
 const nodes=new Map(data.nodes.filter(n=>n.kind==='term').map(n=>[n.id,n])),adjacency=new Map(),metrics=new Map();
 for(const link of data.links)for(const [a,b] of [[link.from,link.to],[link.to,link.from]]){if(!adjacency.has(a))adjacency.set(a,new Set());adjacency.get(a).add(b);}
 const measure=document.createElement('canvas'),context=measure.getContext('2d');let font='',disposed=false;
 const cache=createResourceCache({
  create(id){
   const node=nodes.get(id),group=groups.get(id),sprite=new SpriteText(node.label,1,node.color);
   sprite.fontFace=font;sprite.fontWeight='500';sprite.fontSize=128;sprite.strokeWidth=.35;sprite.strokeColor='#0A0B19';
   sprite.material.depthWrite=false;sprite.material.depthTest=false;sprite.material.toneMapped=false;sprite.renderOrder=5;
   const raycast=sprite.raycast;sprite.raycast=function(...args){if(this.visible)raycast.apply(this,args);};
   const leader=new Line(new BufferGeometry().setAttribute('position',new Float32BufferAttribute([0,0,0,0,0,0],3)),new LineBasicMaterial({color:'#889abc',transparent:true,opacity:.45,depthTest:false,depthWrite:false}));
   leader.visible=false;leader.frustumCulled=false;leader.renderOrder=4;leader.raycast=()=>{};group.add(leader,sprite);
   const canvas=sprite.material.map.image;
   return {node,group,sprite,base:sprite.scale.clone(),leader,bytes:canvas.width*canvas.height*4};
  },
  dispose({group,sprite,leader}){group.remove(sprite,leader);const canvas=sprite.material.map.image;sprite.material.map.dispose();sprite.material.dispose();leader.geometry.dispose();leader.material.dispose();canvas.width=0;canvas.height=0;}
 });
 function invalidateFonts(){if(disposed)return;metrics.clear();cache.clear();}
 function update(state,occupied){
  if(disposed)return;
  const style=getComputedStyle(container),nextFont=style.getPropertyValue('--graph-font').trim();
  if(font!==nextFont){font=nextFont;invalidateFonts();}
  context.font='500 128px '+font;
  const width=container.clientWidth,height=Math.max(container.clientHeight,1),camera=getCamera(),textPixels=18*parseFloat(style.fontSize)/16;
  const factor=2*Math.tan(camera.fov*Math.PI/360)/height,active=new Set(),candidates=new Set(),collision=createLabelCollisionIndex();
  for(const box of occupied)collision.add(box);
  if(state.showLabels)for(const id of nodes.keys())candidates.add(id);
  else for(const root of [state.focused,state.hovered])if(root){candidates.add(root);for(const id of adjacency.get(root)||[])candidates.add(id);}
  for(const resource of cache.values()){resource.sprite.visible=false;resource.leader.visible=false;}
  const priority=id=>id===state.hovered?0:id===state.focused?1:2;
  for(const id of [...candidates].sort((a,b)=>priority(a)-priority(b))){
   const node=nodes.get(id);if(!node||!groups.has(id))continue;
   const position=new Vector3(node.x||0,node.y||0,node.z||0),projected=position.clone().project(camera),point=getPoint(node);
   if(projected.z<-1||projected.z>1||point.x<0||point.x>width||point.y<0||point.y>height)continue;
   let metric=metrics.get(id);
   if(!metric){const lines=node.label.split('\n');metric={width:Math.max(1,Math.floor(Math.max(...lines.map(t=>context.measureText(t).width))))/128,height:lines.length};metrics.set(id,metric);}
   const box=placeScreenLabel(point,metric.width*textPixels,metric.height*textPixels,occupied,{width,height},{collides:box=>collision.collides(box)});
   if(!box)continue;occupied.push(box);collision.add(box);active.add(id);
   const {sprite,base,leader}=cache.get(id),depth=-position.clone().applyMatrix4(camera.matrixWorldInverse).z;
   sprite.visible=true;sprite.scale.copy(base).multiplyScalar(depth*factor*textPixels);
   const centerX=box.left+box.width/2,centerY=box.top+box.height/2;
   sprite.position.copy(new Vector3(centerX/width*2-1,1-centerY/height*2,projected.z).unproject(camera).sub(position));
   const endX=Math.max(box.left,Math.min(point.x,box.left+box.width)),endY=point.y<box.top?box.top:box.top+box.height;
   const endpoint=new Vector3(endX/width*2-1,1-endY/height*2,projected.z).unproject(camera).sub(position);
   leader.geometry.attributes.position.setXYZ(1,endpoint.x,endpoint.y,endpoint.z);leader.geometry.attributes.position.needsUpdate=true;
   leader.visible=Math.abs(centerX-point.x)>8||Math.abs(box.top-(point.y-box.height-17))>8;
  }
  cache.retain(active);
 }
 return {update,invalidateFonts,dispose(){if(disposed)return;disposed=true;cache.dispose();metrics.clear();measure.width=measure.height=0;}};
}
