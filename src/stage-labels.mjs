import {Vector3} from 'three';
import {placeScreenLabel} from './label-layout.mjs';

// C3 labels and leaders persist; only changed attributes are written.
export function createEngineeringLabels(container,nodes,getPoint,getCamera,onResize=()=>{}) {
 const layer=document.createElement('div');layer.id='engineering-labels';layer.className='engineering-label-layer';layer.setAttribute('aria-hidden','true');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.append(svg);
 const entries=nodes.filter(n=>n.kind==='stage').sort((a,b)=>Number(a.branch)-Number(b.branch)||a.step.localeCompare(b.step)).map(node=>{
  const element=document.createElement('div');element.className='engineering-label';element.dataset.nodeId=node.id;element.style.setProperty('--node-color',node.color);
  const number=document.createElement('span');number.className='engineering-step';number.textContent=node.step;
  const title=document.createElement('strong');title.textContent=node.label;element.append(number,title);layer.append(element);
  const line=document.createElementNS(svg.namespaceURI,'line');line.dataset.nodeId=node.id;svg.append(line);
  return {node,element,line,width:0,height:0};
 });
 container.append(layer);
 for(const entry of entries){entry.width=entry.element.offsetWidth;entry.height=entry.element.offsetHeight;}
 const resize=new ResizeObserver(records=>{let changed=false;for(const record of records){const entry=entries.find(e=>e.element===record.target),w=entry.element.offsetWidth,h=entry.element.offsetHeight;if(w&&h&&(w!==entry.width||h!==entry.height)){entry.width=w;entry.height=h;changed=true;}}if(changed)onResize();});
 for(const entry of entries)resize.observe(entry.element);
 const vector=new Vector3(),clamp=(v,min,max)=>Math.max(min,Math.min(v,Math.max(min,max)));
 const attr=(e,key,value)=>{value=String(value);if(e.getAttribute(key)!==value)e.setAttribute(key,value);};
 function update(state){
  const width=container.clientWidth,height=container.clientHeight,camera=getCamera(),placed=[];
  for(const {node,element,line,width:w,height:h} of entries){
   vector.set(node.x,node.y,node.z).project(camera);const point=getPoint(node);
   let box;if(vector.z>=-1&&vector.z<=1&&point.x>=0&&point.x<=width&&point.y>=0&&point.y<=height)box=placeScreenLabel(point,w,h,placed,{width,height},{below:node.branch});
   const hidden=!box;if(element.hidden!==hidden)element.hidden=hidden;
   if(line.hasAttribute('hidden')!==hidden)line.toggleAttribute('hidden',hidden);
   if(hidden)continue;placed.push(box);
   const transform='translate('+box.left+'px,'+box.top+'px)';if(element.style.transform!==transform)element.style.transform=transform;
   element.classList.toggle('is-active',node.id===state.focused||node.id===state.hovered);
   attr(line,'x1',point.x);attr(line,'y1',point.y);attr(line,'x2',clamp(point.x,box.left+5,box.left+w-5));attr(line,'y2',point.y<box.top?box.top:box.top+h);
  }
  attr(svg,'viewBox','0 0 '+width+' '+height);return placed;
 }
 return {update,dispose(){resize.disconnect();layer.remove();}};
}
