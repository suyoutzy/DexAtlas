import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import {Color,Vector3} from 'three';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {nodeTextVisible,linkTextVisible} from './atlas-model.mjs';

export function supportsWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function createGraphScene(container,data,{onSelect,onRelation,onHover,reducedMotion}) {
  let state={focused:null,hovered:null,hoveredLink:null,showLabels:false};
  let animationFrame,flightFrame;
  let pointerInside=false,pendingHoverExit=false,forwardingPointer=false,lastPointer;
  const nodeLabels=new Map(),edgeLabels=new Map(),nodes=new Map(data.nodes.map(n=>[n.id,n]));
  const highlightedNodes=new Set(),highlightedLinks=new Set();
  // Deterministic initial seeds, without fixing positions or imposing a hierarchy.
  data.nodes.forEach((node,index)=>{
    const angle=index*2.3999632297, radius=48+Math.sqrt(index+1)*12;
    node.x=Math.cos(angle)*radius; node.y=Math.sin(angle)*radius*.7; node.z=Math.sin(index*1.7)*70;
  });
  const makeText=(text,color)=>{
    const sprite=new SpriteText(text,1,color);
    sprite.fontFace='"Microsoft YaHei", "PingFang SC", sans-serif';
    sprite.fontWeight='500';
    sprite.material.depthWrite=false;
    return {sprite,base:sprite.scale.clone()};
  };
  const graph=new ForceGraph3D(container,{controlType:'orbit'})
    .width(container.clientWidth).height(container.clientHeight)
    .backgroundColor('#0A0B19').showNavInfo(false)
    .nodeRelSize(3.3).nodeVal(n=>n.kind==='stage'?3.2:1)
    .nodeLabel(()=>null).linkLabel(()=>null)
    .nodeColor(n=>highlightedNodes.has(n.id)?'#'+new Color(n.color).offsetHSL(0,0,.16).getHexString():n.color)
    .nodeOpacity(.93).nodeResolution(16)
    .nodeThreeObjectExtend(true)
    .nodeThreeObject(node=>{
      const text=makeText(node.label,node.kind==='stage'?'#c5e9ef':'#e8e7f8');
      nodeLabels.set(node.id,{...text,node});
      text.sprite.visible=nodeTextVisible(node,state);
      return text.sprite;
    })
    .linkColor(link=>highlightedLinks.has(link.id)?'#7de3e7':link.kind==='flow'?'rgba(111,190,204,.52)':link.kind==='usage'?'rgba(170,143,201,.28)':'rgba(118,132,180,.25)')
    .linkOpacity(.65)
    .linkWidth(link=>highlightedLinks.has(link.id)?1.1:link.kind==='flow'?.52:.12)
    .linkDirectionalArrowLength(0)
    .linkDirectionalParticles(link=>highlightedLinks.has(link.id)?3:0)
    .linkDirectionalParticleWidth(1.4).linkDirectionalParticleSpeed(.004)
    .linkDirectionalParticleColor(()=>'#8bf1ee')
    .linkThreeObjectExtend(true)
    .linkThreeObject(link=>{
      const text=makeText(link.label,'#c5d3e9');
      edgeLabels.set(link.id,{...text,link});
      text.sprite.visible=linkTextVisible(link,state);
      return text.sprite;
    })
    .linkPositionUpdate((sprite,{start,end})=>{
      sprite.position.set((start.x+end.x)/2,(start.y+end.y)/2,(start.z+end.z)/2);
    })
    .onNodeClick(node=>onSelect(node))
    .onLinkClick(link=>onRelation(link))
    .onNodeHover(node=>{
      state.hovered=node?.id||null;
      onHover(node);
      refresh();
      if(!node)finishHoverExit();
    })
    .onLinkHover(link=>{state.hoveredLink=link?.id||null;refresh();if(!link)finishHoverExit();})
    .cooldownTime(8000).d3VelocityDecay(.36)
    .graphData(data);
  graph.d3Force('charge').strength(-90);
  graph.d3Force('link').distance(link=>link.kind==='flow'?95:62);
  graph.cameraPosition({x:0,y:0,z:innerWidth<700?900:610},{x:0,y:0,z:0},0);
  graph.renderer().setPixelRatio(Math.min(devicePixelRatio,2));
  const controls=graph.controls();
  controls.enableDamping=true; controls.dampingFactor=.1;
  const bloom=new UnrealBloomPass();
  bloom.enabled=false; bloom.strength=0; bloom.radius=.35; bloom.threshold=.35;
  graph.postProcessingComposer().addPass(bloom);

  function refresh() {
    highlightedNodes.clear(); highlightedLinks.clear();
    if(state.hovered) {
      highlightedNodes.add(state.hovered);
      for(const link of data.links) if(link.from===state.hovered||link.to===state.hovered) {
        highlightedLinks.add(link.id); highlightedNodes.add(link.from);highlightedNodes.add(link.to);
      }
    }
    if(state.hoveredLink) {
      const link=data.links.find(l=>l.id===state.hoveredLink);
      if(link) {highlightedLinks.add(link.id);highlightedNodes.add(link.from);highlightedNodes.add(link.to);}
    }
    graph.nodeColor(graph.nodeColor()).linkColor(graph.linkColor()).linkWidth(graph.linkWidth()).linkDirectionalParticles(graph.linkDirectionalParticles());
    for(const {sprite,node} of nodeLabels.values()) sprite.visible=nodeTextVisible(node,state);
    for(const {sprite,link} of edgeLabels.values()) sprite.visible=linkTextVisible(link,state);
    container.dataset.focused=state.focused||'';
  }
  // Let the library observe an empty intersection so both of its hover caches
  // reset, including when the pointer immediately returns to the same node.
  function forwardPointer(x,y) {
    forwardingPointer=true;
    graph.renderer().domElement.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x,clientY:y}));
    forwardingPointer=false;
  }
  function finishHoverExit() {
    if(!pendingHoverExit)return;
    pendingHoverExit=false;
    if(pointerInside&&lastPointer)requestAnimationFrame(()=>{if(pointerInside)forwardPointer(lastPointer.x,lastPointer.y);});
  }
  function movePointer(event) {
    if(forwardingPointer)return;
    lastPointer={x:event.clientX,y:event.clientY};
    if(pendingHoverExit)forwardPointer(-10000,-10000);
  }
  function leaveCanvas() {
    pointerInside=false;
    pendingHoverExit=!!(state.hovered||state.hoveredLink);
    state.hovered=null;state.hoveredLink=null;
    onHover(null);refresh();
    forwardPointer(-10000,-10000);
  }
  function enterCanvas() {pointerInside=true;}
  container.addEventListener('pointerleave',leaveCanvas);
  container.addEventListener('pointerenter',enterCanvas);
  container.addEventListener('pointermove',movePointer);
  // C2 text stays readable in screen pixels as the Orbit camera moves.
  function scaleText() {
    const camera=graph.camera(),height=Math.max(container.clientHeight,1);
    const factor=2*Math.tan(camera.fov*Math.PI/360)/height;
    for(const {sprite,base,node} of nodeLabels.values()) if(sprite.visible) {
      const distance=camera.position.distanceTo(new Vector3(node.x||0,node.y||0,node.z||0));
      const size=distance*factor*(node.kind==='stage'?15:17);
      sprite.scale.copy(base).multiplyScalar(size);
      sprite.position.y=(node.kind==='stage'?7:5)+size*.55;
    }
    for(const {sprite,base} of edgeLabels.values()) if(sprite.visible) {
      const distance=camera.position.distanceTo(sprite.position);
      sprite.scale.copy(base).multiplyScalar(distance*factor*14);
    }
    animationFrame=requestAnimationFrame(scaleText);
  }
  animationFrame=requestAnimationFrame(scaleText);
  function stopFlight() {cancelAnimationFrame(flightFrame);}
  function focus(id) {
    stopFlight();
    const node=nodes.get(id);
    if(!node)return;
    const camera=graph.camera(),target=controls.target.clone(),start=camera.position.clone();
    const endTarget=new Vector3(node.x||0,node.y||0,node.z||0);
    const direction=start.clone().sub(endTarget).normalize();
    if(!direction.length())direction.set(0,0,1);
    const started=performance.now(),duration=reducedMotion()?0:600;
    function step(now) {
      const t=duration?Math.min(1,(now-started)/duration):1;
      const ease=1-Math.pow(1-t,3);
      endTarget.set(node.x||0,node.y||0,node.z||0);
      const end=endTarget.clone().addScaledVector(direction,innerWidth<700?210:150);
      graph.cameraPosition(start.clone().lerp(end,ease),target.clone().lerp(endTarget,ease),0);
      if(t<1)flightFrame=requestAnimationFrame(step);
    }
    step(started);
  }
  controls.addEventListener('start',stopFlight);
  const resize=new ResizeObserver(()=>graph.width(container.clientWidth).height(container.clientHeight));
  resize.observe(container);
  return {
    update(next){state={...state,...next};refresh();},
    focus,
    overview(){stopFlight();graph.zoomToFit(reducedMotion()?0:600,55);},
    setGlow(value){bloom.strength=value*.015;bloom.enabled=value>0;},
    dispose(){stopFlight();cancelAnimationFrame(animationFrame);resize.disconnect();controls.removeEventListener('start',stopFlight);container.removeEventListener('pointerleave',leaveCanvas);container.removeEventListener('pointerenter',enterCanvas);container.removeEventListener('pointermove',movePointer);graph._destructor();}
  };
}
