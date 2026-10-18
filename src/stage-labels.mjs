import {Vector3} from 'three';
import {placeScreenLabel} from './label-layout.mjs';

// C3: HTML projected into CSS pixels, with screen-space collision avoidance.
// It shares the graph camera but never changes any graph coordinate.
export function createEngineeringLabels(container,nodes,getPoint,getCamera) {
  const layer=document.createElement('div');
  layer.id='engineering-labels';layer.className='engineering-label-layer';layer.setAttribute('aria-hidden','true');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  layer.append(svg);
  const entries=nodes.filter(n=>n.kind==='stage').sort((a,b)=>Number(a.branch)-Number(b.branch)||a.step.localeCompare(b.step)).map(node=>{
    const element=document.createElement('div');element.className='engineering-label';element.dataset.nodeId=node.id;
    element.style.setProperty('--node-color',node.color);
    const number=document.createElement('span');number.className='engineering-step';number.textContent=node.step;
    const title=document.createElement('strong');title.textContent=node.label;
    element.append(number,title);layer.append(element);
    return {node,element};
  });
  container.append(layer);
  const vector=new Vector3();
  const clamp=(v,min,max)=>Math.max(min,Math.min(v,Math.max(min,max)));
  function update(state) {
    const width=container.clientWidth,height=container.clientHeight,camera=getCamera();
    const placed=[],lines=[];
    const visible=entries.map(entry=>{
      const {node,element}=entry;
      vector.set(node.x,node.y,node.z).project(camera);
      const point=getPoint(node),hidden=vector.z<-1||vector.z>1||point.x<0||point.x>width||point.y<0||point.y>height;
      if(element.hidden!==hidden)element.hidden=hidden;
      return {...entry,point,width:element.offsetWidth,height:element.offsetHeight};
    }).filter(({element})=>!element.hidden);
    for(const entry of visible) {
      const {node,element,point}=entry,w=entry.width,h=entry.height;
      const box=placeScreenLabel(point,w,h,placed,{width,height},{below:node.branch});
      if(!box){element.hidden=true;continue;}
      placed.push(box);
      element.style.transform='translate('+box.left+'px,'+box.top+'px)';
      element.classList.toggle('is-active',node.id===state.focused||node.id===state.hovered);
      const endX=clamp(point.x,box.left+5,box.left+w-5),endY=point.y<box.top?box.top:box.top+h;
      lines.push('<line data-node-id="'+node.id+'" x1="'+point.x+'" y1="'+point.y+'" x2="'+endX+'" y2="'+endY+'"/>');
    }
    svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.innerHTML=lines.join('');
    return placed;
  }
  return {update,dispose(){layer.remove();}};
}
